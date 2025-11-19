// js/trazabilidad-core.js - Lógica principal del sistema (COMPLETO)
class TrazabilidadCore {
    constructor() {
        this.rawRows = [];
        this.materialMap = new Map();
        this.uniqueMaterials = [];
        this.initialStocks = {};
        this.results = [];
        this.centroSet = new Set();
        
        // MOVIMIENTOS COMPLETOS - REGLA: negativo = salida, positivo = entrada
        
        // Salidas a tienda (cantidad NEGATIVA)
        this.storeOutCodes = new Set(['641', '643', '161', '351', '303', '311', '673']);
        
        // Salidas a clientes (cantidad NEGATIVA)  
        this.clientOutCodes = new Set(['601', '909']);
        
        // Consumos (cantidad NEGATIVA)
        this.consumptionCodes = new Set(['201', '261', '309']);
        
        // Ajustes
        this.adjustmentPos = new Set(['701']); // POSITIVO = entrada
        this.adjustmentNeg = new Set(['702']); // NEGATIVO = salida
        
        // Entradas principales (cantidad POSITIVA)
        this.entry101 = '101';
        this.entry501 = '501';
        this.entry305 = '305'; // Entrada de tienda
        
        // Devoluciones de clientes (cantidad POSITIVA)
        this.clientReturns = new Set(['651', '910']);
        
        // Anulaciones
        this.annul501 = '502'; // Anulación de 501
        this.annul201 = '202'; // Anulación de 201
        this.annul261 = '262'; // Anulación de 261  
        this.annul309 = '310'; // Anulación de 309
        this.annul909 = '910'; // Anulación de 909 (la misma 910 es devolución)
        
        // Movimientos que NO afectan inventario físico
        this.nonInventoryMovements = new Set(['321', '322', '343', '344']);
    }

    // Helpers (se mantienen igual)
    parseDate(v) {
        if (!v && v !== 0) return null;
        if (v instanceof Date) return v;
        if (typeof v === 'number') {
            const d = XLSX.SSF.parse_date_code(v);
            if (d) return new Date(d.y, d.m - 1, d.d, d.H, d.M, d.S);
        }
        const s = String(v).trim();
        const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
        if (dmy) {
            const day = parseInt(dmy[1], 10);
            const month = parseInt(dmy[2], 10) - 1;
            const year = parseInt(dmy[3], 10);
            const fullYear = year < 100 ? (year >= 50 ? 1900 + year : 2000 + year) : year;
            return new Date(fullYear, month, day);
        }
        const iso = Date.parse(s);
        if (!isNaN(iso)) return new Date(iso);
        return null;
    }

    startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
    addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    parseISODate(s) { if (!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
    round2(v) { return Math.round((Number(v) + Number.EPSILON) * 100) / 100; }
    normalizeUser(u) { return String(u || '').trim().toLowerCase(); }

    // Función para formatear fecha en formato Dia/Mes/Año
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    getDateKeyFromRow(r) {
        if (r['Fe.contabilización'] instanceof Date) return r['Fe.contabilización'].toISOString().slice(0,10);
        const raw = (r['Fe.contabilización_raw'] ?? r['Fe.contabilización'] ?? '').toString().trim();
        const m = raw.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
        if (m) {
            const p = this.parseDate(m[1]); if (p instanceof Date) return p.toISOString().slice(0,10);
        }
        const replaced = raw.replace(/\./g,'/').split(' ')[0];
        const p2 = this.parseDate(replaced); if (p2 instanceof Date) return p2.toISOString().slice(0,10);
        return raw;
    }

    transformRow(r) {
        const row = {};
        const keys = Object.keys(r);
        
        const findKeyMatch = (possible) => {
            return keys.find(k => { 
                const ks = String(k).toLowerCase(); 
                return possible.some(p => ks.includes(p)); 
            });
        };

        row['Material'] = r['Material'] ?? r['material'] ?? r[findKeyMatch(['material','mat'])] ?? '';
        row['Texto breve de material'] = r['Texto breve de material'] ?? r['texto breve de material'] ?? r[findKeyMatch(['texto','descripcion','descr'])] ?? '';
        row['Centro'] = r['Centro'] ?? r['centro'] ?? r[findKeyMatch(['centro','center'])] ?? '';
        row['Almacén'] = r['Almacén'] ?? r['almacén'] ?? r['almacen'] ?? r[findKeyMatch(['almacen','almacén','alm'])] ?? '';
        row['Clase de movimiento'] = r['Clase de movimiento'] ?? r['clase de movimiento'] ?? r[findKeyMatch(['clase','movimiento','mov'])] ?? '';
        row['Documento material'] = r['Documento material'] ?? r['documento material'] ?? r[findKeyMatch(['documento','doc'])] ?? '';
        row['Fe.contabilización'] = r['Fe.contabilización'] ?? r['Fecha'] ?? r[findKeyMatch(['fe.contabilizacion','fecha','fe'])] ?? '';
        row['Hora de entrada'] = r['Hora de entrada'] ?? r['Hora'] ?? r[findKeyMatch(['hora','time'])] ?? '';
        row['Ctd.en UM entrada'] = r['Ctd.en UM entrada'] ?? r[findKeyMatch(['ctd','cantidad','qty'])] ?? 0;
        row['Un.medida de entrada'] = r['Un.medida de entrada'] ?? r['Un.medida'] ?? r[findKeyMatch(['un.medida','unidad','um'])] ?? '';
        row['Cliente'] = r['Cliente'] ?? r['cliente'] ?? r[findKeyMatch(['cliente','customer'])] ?? '';
        row['Nombre del usuario'] = r['Nombre del usuario'] ?? r['Usuario'] ?? r[findKeyMatch(['usuario','user','nombre'])] ?? '';

        row['Fe.contabilización_raw'] = row['Fe.contabilización'];
        row['Fe.contabilización'] = this.parseDate(row['Fe.contabilización']);

        // qty parse robust
        let qtyRaw = row['Ctd.en UM entrada'];
        let qty = 0;
        if (typeof qtyRaw === 'number') qty = qtyRaw;
        else {
            let s = String(qtyRaw || '').trim(); 
            s = s.replace(/\s/g,'');
            if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) 
                s = s.replace(/\./g,'').replace(',','.');
            else {
                const dotCount = (s.match(/\./g)||[]).length;
                if (dotCount > 0 && dotCount > (s.match(/,/g)||[]).length) 
                    s = s.replace(/\./g,'');
                s = s.replace(',','.');
            }
            qty = parseFloat(s) || 0;
        }
        row['Ctd.en UM entrada'] = qty;

        row['Clase de movimiento'] = row['Clase de movimiento'] ? String(row['Clase de movimiento']).trim() : '';
        row['Centro'] = row['Centro'] ? String(row['Centro']).trim() : '';
        row['Almacén'] = row['Almacén'] ? String(row['Almacén']).trim() : '';

        return row;
    }

    populateMaterialList(rows) {
        this.materialMap.clear();
        this.centroSet.clear();
        
        rows.forEach(r => {
            let centro = r['Centro'] || '';
            let centerKey = centro;
            if (centro === '3000' || centro === '1000') centerKey = '1000/3000';
            this.centroSet.add(centerKey);
            
            const material = r['Material'] || '';
            const texto = r['Texto breve de material'] || '';
            const umb = r['Un.medida de entrada'] || '';
            const key = `${material}||${centerKey}`;
            
            if (!this.materialMap.has(key)) {
                this.materialMap.set(key, { material, texto, umb, centro: centerKey, rows: [] });
            }
            
            const copy = Object.assign({}, r);
            copy._centro_normalizado = centerKey;
            copy._dateKey = this.getDateKeyFromRow(copy);
            copy._userNorm = this.normalizeUser(copy['Nombre del usuario']);
            this.materialMap.get(key).rows.push(copy);
        });

        this.uniqueMaterials = Array.from(this.materialMap.values()).map(m => ({
            material: m.material, 
            texto: m.texto, 
            umb: m.umb, 
            centro: m.centro, 
            key: `${m.material}||${m.centro}`
        })).sort((a,b) => String(a.material).localeCompare(String(b.material)));
    }

    getOldestDateForKey(key) {
        const entry = this.materialMap.get(key);
        if (!entry) return null;
        const dates = entry.rows.map(r => r['Fe.contabilización']).filter(Boolean);
        if (!dates.length) return null;
        return new Date(Math.min(...dates.map(d => d.getTime())));
    }

    // Función para obtener el último ingreso según las reglas específicas
    getUltimoIngreso(filtered, centro) {
        // Filtrar solo movimientos 101 con cantidad positiva
        const movimientos101 = filtered.filter(r => 
            String(r['Clase de movimiento']) === this.entry101 && 
            Number(r['Ctd.en UM entrada']) > 0
        );

        if (movimientos101.length === 0) return '';

        // Para centro 1000/3000, priorizar movimientos del centro 3000
        if (centro === '1000/3000') {
            const movimientos3000 = movimientos101.filter(r => 
                String(r['Centro']).trim() === '3000'
            );
            
            if (movimientos3000.length > 0) {
                // Ordenar por fecha descendente y tomar el más reciente
                movimientos3000.sort((a, b) => 
                    (b['Fe.contabilización']?.getTime() || 0) - (a['Fe.contabilización']?.getTime() || 0)
                );
                return this.formatDate(movimientos3000[0]['Fe.contabilización']);
            }
            
            // Si no hay movimientos en 3000, tomar del 1000
            const movimientos1000 = movimientos101.filter(r => 
                String(r['Centro']).trim() === '1000'
            );
            
            if (movimientos1000.length > 0) {
                movimientos1000.sort((a, b) => 
                    (b['Fe.contabilización']?.getTime() || 0) - (a['Fe.contabilización']?.getTime() || 0)
                );
                return this.formatDate(movimientos1000[0]['Fe.contabilización']);
            }
        }
        
        // Para otros centros, tomar simplemente el último 101
        movimientos101.sort((a, b) => 
            (b['Fe.contabilización']?.getTime() || 0) - (a['Fe.contabilización']?.getTime() || 0)
        );
        
        return this.formatDate(movimientos101[0]['Fe.contabilización']);
    }

    analyzeKey(key) {
        const group = this.materialMap.get(key);
        if (!group) return null;
        const rows = group.rows.slice();

        // Filtrar filas problemáticas y movimientos que no afectan inventario
        const filtered = rows.filter(r => {
            const movement = String(r['Clase de movimiento']);
            
            // Excluir movimientos que no afectan inventario físico
            if (this.nonInventoryMovements.has(movement)) return false;
            
            // Filtrar casos específicos problemáticos
            if (movement === '641' && r['Centro'] && !r['Almacén']) return false;
            
            return true;
        });
        
        // Preparar datos
        filtered.forEach(r => { 
            if (!r._dateKey) r._dateKey = this.getDateKeyFromRow(r); 
            if (!r._userNorm) r._userNorm = this.normalizeUser(r['Nombre del usuario']); 
        });
        
        // Ordenar por fecha
        filtered.sort((a,b) => (a['Fe.contabilización'] ? a['Fe.contabilización'].getTime() : 0) - (b['Fe.contabilización'] ? b['Fe.contabilización'].getTime() : 0));

        // Fechas
        const dates = filtered.map(r => r['Fe.contabilización']).filter(Boolean);
        const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
        const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
        
        // Último ingreso según reglas específicas
        const lastIngreso = this.getUltimoIngreso(filtered, group.centro);

        // Ajustes
        const ajustesPosVal = filtered.filter(r => this.adjustmentPos.has(String(r['Clase de movimiento']))).reduce((s,r) => s + Math.abs(Number(r['Ctd.en UM entrada']||0)),0);
        const ajustesNegVal = filtered.filter(r => this.adjustmentNeg.has(String(r['Clase de movimiento']))).reduce((s,r) => s + Math.abs(Number(r['Ctd.en UM entrada']||0)),0);
        const fechaAjuste = filtered.filter(r => this.adjustmentPos.has(String(r['Clase de movimiento'])) || this.adjustmentNeg.has(String(r['Clase de movimiento']))).map(r => r['Fe.contabilización']).filter(Boolean).map(d => this.formatDate(d)).join(', ');

        // Agrupar por día
        const byDay = {};
        filtered.forEach((r, idx) => {
            const ds = r._dateKey || this.getDateKeyFromRow(r);
            if (!byDay[ds]) byDay[ds] = [];
            byDay[ds].push({row: r, idx});
        });

        // Función para comparar centros
        const centersMatch = (c1,c2) => { 
            const a = String(c1||'').trim(); 
            const b = String(c2||'').trim(); 
            if (!a||!b) return false; 
            if (a===b) return true; 
            const pair = new Set([a,b]); 
            if (pair.has('1000') && pair.has('3000')) return true; 
            return false; 
        };

        // Emparejar movimientos para ignorar
        const pairedIgnore = new Set();
        Object.keys(byDay).forEach(ds => {
            const items = byDay[ds];
            
            // Emparejar 643/311 con 101
            const salidas = items.filter(it => { 
                const c = String(it.row['Clase de movimiento']); 
                const q = Number(it.row['Ctd.en UM entrada']||0); 
                return (c==='643' || c==='311') && q < 0; 
            });
            const entradas101 = items.filter(it => String(it.row['Clase de movimiento']) === this.entry101 && Number(it.row['Ctd.en UM entrada']||0) > 0);
            
            salidas.forEach(s => {
                const sQty = Math.abs(Number(s.row['Ctd.en UM entrada']||0));
                const sUser = this.normalizeUser(s.row['Nombre del usuario']);
                const sCentro = String(s.row['Centro']||'').trim();
                const match = entradas101.find(en => {
                    const eQty = Math.abs(Number(en.row['Ctd.en UM entrada']||0));
                    const eUser = this.normalizeUser(en.row['Nombre del usuario']);
                    const eCentro = String(en.row['Centro']||'').trim();
                    return (eQty === sQty) && (eUser === sUser) && centersMatch(sCentro, eCentro);
                });
                if (match) { 
                    pairedIgnore.add(s.idx); 
                    pairedIgnore.add(match.idx); 
                }
            });
            
            // Emparejar anulaciones con sus movimientos originales
            items.forEach(it => {
                const movement = String(it.row['Clase de movimiento']);
                const qty = Math.abs(Number(it.row['Ctd.en UM entrada']||0));
                
                // Buscar anulaciones y emparejarlas
                if (movement === this.annul201 || movement === this.annul261 || movement === this.annul309) {
                    const originalMovement = movement === this.annul201 ? '201' : 
                                           movement === this.annul261 ? '261' : '309';
                    const matchingOriginal = items.find(item => 
                        String(item.row['Clase de movimiento']) === originalMovement &&
                        Math.abs(Number(item.row['Ctd.en UM entrada']||0)) === qty
                    );
                    
                    if (matchingOriginal) {
                        pairedIgnore.add(it.idx);
                        pairedIgnore.add(matchingOriginal.idx);
                    }
                }
            });
        });

        // Salidas por tienda (INCLUYENDO TODOS LOS MOVIMIENTOS)
        const salidaPorTienda = filtered.reduce((sum,r,idx) => {
            const qty = Number(r['Ctd.en UM entrada']||0); 
            const clase = String(r['Clase de movimiento']);
            if (qty >= 0) return sum;
            if (clase === '311' && !pairedIgnore.has(idx)) return sum;
            if (pairedIgnore.has(idx)) return sum;
            if (this.storeOutCodes.has(clase)) return sum + Math.abs(qty);
            return sum;
        },0);

        // Salidas a clientes (INCLUYENDO TODOS LOS MOVIMIENTOS)
        const salidaAClientes = filtered.reduce((sum,r,idx) => {
            const qty = Number(r['Ctd.en UM entrada']||0); 
            const clase = String(r['Clase de movimiento']);
            if (qty >= 0) return sum;
            if (clase === '311' && !pairedIgnore.has(idx)) return sum;
            if (pairedIgnore.has(idx)) return sum;
            if (this.clientOutCodes.has(clase)) return sum + Math.abs(qty);
            return sum;
        },0);

        // Cálculos de estadísticas adicionales
        const storeMovsNeg = filtered.filter((r,idx) => {
            const qty = Number(r['Ctd.en UM entrada']||0); 
            const clase = String(r['Clase de movimiento']);
            if (qty >= 0) return false;
            if (clase === '311' && !pairedIgnore.has(idx)) return false;
            if (pairedIgnore.has(idx)) return false;
            return this.storeOutCodes.has(clase);
        }).map(r => Number(r['Ctd.en UM entrada']||0));

        const clientMovsNeg = filtered.filter((r,idx) => {
            const qty = Number(r['Ctd.en UM entrada']||0); 
            const clase = String(r['Clase de movimiento']);
            if (qty >= 0) return false;
            if (clase === '311' && !pairedIgnore.has(idx)) return false;
            if (pairedIgnore.has(idx)) return false;
            return this.clientOutCodes.has(clase);
        }).map(r => Number(r['Ctd.en UM entrada']||0));

        const storeMax = storeMovsNeg.length ? Math.min(...storeMovsNeg) : 0;
        const storeMin = storeMovsNeg.length ? Math.max(...storeMovsNeg) : 0;
        const clientMax = clientMovsNeg.length ? Math.min(...clientMovsNeg) : 0;
        const clientMin = clientMovsNeg.length ? Math.max(...clientMovsNeg) : 0;
        const avgStore = storeMovsNeg.length ? (storeMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/storeMovsNeg.length) : 0;
        const avgClient = clientMovsNeg.length ? (clientMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/clientMovsNeg.length) : 0;

        // Stock actual
        const totalSumMov = filtered.reduce((s,r) => s + Number(r['Ctd.en UM entrada']||0), 0);
        const stockActual = (Number(this.initialStocks[key] ? this.initialStocks[key].stock : 0) || 0) + totalSumMov;

        // Puntos cero
        const initData = this.initialStocks[key] || { date: (minDate ? minDate.toISOString().slice(0,10) : new Date().toISOString().slice(0,10)), stock:0 };
        const initDate = this.parseISODate(initData.date) || (minDate || null);
        let currentBalance = Number(initData.stock) || 0;
        const movementsByDate = {};
        filtered.forEach(r => {
            const ds = r._dateKey || this.getDateKeyFromRow(r);
            if (!movementsByDate[ds]) movementsByDate[ds] = [];
            movementsByDate[ds].push(r);
        });
        
        const puntosCero = [];
        if (minDate && maxDate && initDate) {
            let day = this.startOfDay(initDate);
            const lastDay = this.startOfDay(maxDate);
            while (day <= lastDay) {
                const ds = day.toISOString().slice(0,10);
                const startBalance = currentBalance;
                const movs = movementsByDate[ds] || [];
                const sumDay = movs.reduce((s,r) => s + Number(r['Ctd.en UM entrada']||0), 0);
                const endBalance = startBalance + sumDay;
                if (Number(endBalance) === 0 && Number(startBalance) !== 0) puntosCero.push(this.formatDate(day));
                currentBalance = endBalance;
                day = this.addDays(day,1);
            }
        } else {
            let running = Number(this.initialStocks[key] ? this.initialStocks[key].stock : 0);
            const uniqueDates = Array.from(new Set(filtered.map(r => r._dateKey || this.getDateKeyFromRow(r)))).filter(Boolean).sort();
            uniqueDates.forEach(ds => {
                const movs = filtered.filter(r => (r._dateKey || this.getDateKeyFromRow(r)) === ds);
                const startBalance = running;
                const sumDay = movs.reduce((s,r)=> s + Number(r['Ctd.en UM entrada']||0), 0);
                const endBalance = startBalance + sumDay;
                if (Number(endBalance) === 0 && Number(startBalance) !== 0) puntosCero.push(ds);
                running = endBalance;
            });
        }

        // Irregularidades (MEJORADO CON NUEVOS MOVIMIENTOS)
        const irregularidades = [];

        // 501 without 502
        const entries501 = filtered.filter(r => String(r['Clase de movimiento']) === this.entry501);
        entries501.forEach(en => {
            const qty = Number(en['Ctd.en UM entrada']||0);
            const found502 = filtered.find(r => String(r['Clase de movimiento']) === this.annul501 && Math.abs(Number(r['Ctd.en UM entrada']||0)) === Math.abs(qty));
            if (!found502) {
                const fecha = en._dateKey || this.getDateKeyFromRow(en);
                irregularidades.push({ 
                    tipo:'501_sin_502', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: this.formatDate(fecha),
                    descripcion:`Entrada 501 de ${qty} sin anulación 502 equivalente (fecha: ${this.formatDate(fecha)})`
                });
            }
        });

        // 673 sin 101
        const exits673 = filtered.filter(r => String(r['Clase de movimiento']) === '673' && Number(r['Ctd.en UM entrada']) < 0);
        exits673.forEach(ex => {
            const qty = Math.abs(Number(ex['Ctd.en UM entrada']||0));
            const user = this.normalizeUser(ex['Nombre del usuario']);
            const fecha = ex._dateKey || this.getDateKeyFromRow(ex);
            const found101 = filtered.find(r => 
                String(r['Clase de movimiento']) === this.entry101 && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty && 
                this.normalizeUser(r['Nombre del usuario']) === user && 
                (r._dateKey || this.getDateKeyFromRow(r)) >= (ex._dateKey || fecha)
            );
            if (!found101) {
                irregularidades.push({ 
                    tipo:'673_sin_101', 
                    usuario: ex['Nombre del usuario']||'', 
                    fecha: this.formatDate(fecha),
                    descripcion:`Salida 673 de ${qty} sin una entrada 101 correspondiente (fecha: ${this.formatDate(fecha)})`
                });
            }
        });

        // 909 sin 910 correspondiente (misma cantidad)
        const exits909 = filtered.filter(r => String(r['Clase de movimiento']) === '909' && Number(r['Ctd.en UM entrada']) < 0);
        exits909.forEach(ex => {
            const qty = Math.abs(Number(ex['Ctd.en UM entrada']||0));
            const found910 = filtered.find(r => 
                String(r['Clase de movimiento']) === '910' && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty
            );
            if (!found910) {
                const fecha = ex._dateKey || this.getDateKeyFromRow(ex);
                irregularidades.push({ 
                    tipo:'909_sin_910', 
                    usuario: ex['Nombre del usuario']||'', 
                    fecha: this.formatDate(fecha),
                    descripcion:`Salida 909 de ${qty} sin devolución 910 correspondiente (fecha: ${this.formatDate(fecha)})`
                });
            }
        });

        // 101 en centro 1000 check - skip if user YLARA
        const entries101in100 = filtered.filter(r => String(r['Clase de movimiento']) === this.entry101 && String(r['Centro']).trim() === '1000');
        entries101in100.forEach(en => {
            const enUserNorm = this.normalizeUser(en['Nombre del usuario']||'');
            if (enUserNorm === 'ylara') return; // skip per request
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const user = enUserNorm;
            const fecha = en._dateKey || this.getDateKeyFromRow(en);
            const foundFrom3000orSame = filtered.find(r => {
                const clase = String(r['Clase de movimiento']);
                const rFecha = r._dateKey || this.getDateKeyFromRow(r);
                const origenCentro = String(r['Centro']||'').trim();
                return (clase === '643' || clase === '311') && 
                       rFecha === fecha && 
                       Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty && 
                       this.normalizeUser(r['Nombre del usuario']||'') === user && 
                       (origenCentro === '3000' || origenCentro === String(en['Centro']).trim());
            });
            if (!foundFrom3000orSame) {
                irregularidades.push({ 
                    tipo:'101_en_1000', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: this.formatDate(fecha),
                    descripcion:`Entrada 101 registrada en centro 1000 sin 643/311 correspondiente desde 3000 o mismo centro (fecha: ${this.formatDate(fecha)})`
                });
            }
        });

        // Determinar tipo de diferencia
        let tipoDiferencia = 'Ninguna detectada';
        if (irregularidades.some(i=>i.tipo==='673_sin_101')) tipoDiferencia = 'Posible Faltante';
        if (irregularidades.some(i=>i.tipo==='501_sin_502')) tipoDiferencia = 'Posible Faltante';
        if (irregularidades.some(i=>i.tipo==='909_sin_910')) tipoDiferencia = 'Posible Faltante';
        if (irregularidades.some(i=>i.tipo==='673_sin_101') && irregularidades.some(i=>i.tipo==='501_sin_502')) tipoDiferencia = 'Diferencias mixtas';
        if (irregularidades.some(i=>i.tipo==='101_en_1000')) tipoDiferencia = 'Posible Error de Registro';

        const primaryIrreg = irregularidades.length ? irregularidades[0] : null;

        return {
            key,
            material: group.material,
            texto: group.texto,
            umb: group.umb,
            centro: group.centro,
            tienda: group.centro,
            rangoFecha: `${minDate ? this.formatDate(minDate) : '-'} / ${maxDate ? this.formatDate(maxDate) : '-'}`,
            ultimoIngreso: lastIngreso,
            ajustes: `${ajustesPosVal} / ${ajustesNegVal}`,
            fechaAjuste,
            puntosCero: puntosCero.length ? puntosCero.join(', ') : '-',
            posibleIrregularidad: primaryIrreg ? primaryIrreg.tipo : '-',
            usuarioIrregularidad: primaryIrreg ? primaryIrreg.usuario : '-',
            descIrregularidad: primaryIrreg ? primaryIrreg.descripcion : '-',
            tipoDiferencia,
            totalSalidasTienda: salidaPorTienda,
            totalSalidasClientes: salidaAClientes,
            salidaMaxTienda: storeMax,
            salidaMinTienda: storeMin,
            salidaMaxClientes: clientMax,
            salidaMinClientes: clientMin,
            promedioSalidaTienda: this.round2(avgStore),
            promedioSalidaCliente: this.round2(avgClient),
            stockActual,
            dateMin: minDate, 
            dateMax: maxDate,
            rawRows: filtered,
            irregularidadesAll: irregularidades
        };
    }

    getMovementTypesData(resultsArr) {
        const movementTypes = new Map();
        
        resultsArr.forEach(result => {
            result.rawRows.forEach(row => {
                const movementType = String(row['Clase de movimiento'] || '').trim();
                if (movementType && !this.nonInventoryMovements.has(movementType)) {
                    if (!movementTypes.has(movementType)) {
                        movementTypes.set(movementType, {
                            tienda: 0,
                            cliente: 0,
                            total: 0
                        });
                    }
                    
                    const qty = Number(row['Ctd.en UM entrada'] || 0);
                    const data = movementTypes.get(movementType);
                    
                    if (this.storeOutCodes.has(movementType) && qty < 0) {
                        data.tienda += Math.abs(qty);
                    } else if (this.clientOutCodes.has(movementType) && qty < 0) {
                        data.cliente += Math.abs(qty);
                    }
                    
                    data.total += Math.abs(qty);
                }
            });
        });

        return Array.from(movementTypes.entries())
            .map(([type, data]) => ({ type, ...data }))
            .sort((a, b) => b.total - a.total);
    }
}

window.TrazabilidadCore = TrazabilidadCore;
