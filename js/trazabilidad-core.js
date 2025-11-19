// js/trazabilidad-core.js - Lógica principal del sistema (COMPLETO CON GLOSARIO)
class TrazabilidadCore {
    constructor() {
        this.rawRows = [];
        this.materialMap = new Map();
        this.uniqueMaterials = [];
        this.initialStocks = {};
        this.results = [];
        this.centroSet = new Set();
        
        // MOVIMIENTOS COMPLETOS SEGÚN GLOSARIO
        // Salidas a tienda
        this.storeOutCodes = new Set(['641', '643', '161', '351']);
        this.storeOutCancellations = new Set(['642', '644', '162']);
        
        // Salidas a clientes
        this.clientOutCodes = new Set(['601', '909', '673']);
        this.clientOutCancellations = new Set(['602', '674', '910']);
        this.clientReturns = new Set(['651', '653', '910']); // Devoluciones de clientes
        this.clientReturnCancellations = new Set(['652', '654']); // Anulaciones de devoluciones
        
        // Entradas principales
        this.entry101 = '101';
        this.entry101Cancellation = '102';
        this.entry501 = '501';
        this.entry501Cancellation = '502';
        
        // Ajustes
        this.adjustmentPos = new Set(['701']);
        this.adjustmentNeg = new Set(['702']);
        
        // Consumos
        this.consumptionCodes = new Set(['201', '261']);
        this.consumptionCancellations = new Set(['202', '262']);
        
        // Traslados internos
        this.internalTransfers = new Set(['311', '303', '305', '453']);
        this.internalTransferCancellations = new Set(['312', '304', '454']);
        
        // Movimientos que NO afectan inventario físico (excluir de cálculos)
        this.nonInventoryMovements = new Set(['321', '322', '343', '344']);
        
        // Todos los movimientos de entrada (para cálculos)
        this.allEntryMovements = new Set([
            '101', '501', '651', '653', '305', '701', // Entradas positivas
            '102', '502', '652', '654', '304', '702', '910' // Anulaciones de salidas (son entradas)
        ]);
        
        // Todos los movimientos de salida (para cálculos)
        this.allExitMovements = new Set([
            '601', '641', '643', '161', '351', '673', '909', '201', '261', '303', '453', // Salidas
            '702' // Ajuste negativo
        ]);
    }

    // Helpers
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

    // Determina si un movimiento es de entrada (positivo para inventario)
    isEntryMovement(movement, quantity) {
        const mov = String(movement);
        const qty = Number(quantity);
        
        // Movimientos que siempre son entradas
        if (this.allEntryMovements.has(mov)) return true;
        
        // Anulaciones de salidas son entradas
        if (this.storeOutCancellations.has(mov) || 
            this.clientOutCancellations.has(mov) ||
            this.consumptionCancellations.has(mov) ||
            this.internalTransferCancellations.has(mov)) {
            return true;
        }
        
        return false;
    }

    // Determina si un movimiento es de salida (negativo para inventario)
    isExitMovement(movement, quantity) {
        const mov = String(movement);
        const qty = Number(quantity);
        
        // Movimientos que siempre son salidas
        if (this.allExitMovements.has(mov)) return true;
        
        // Anulaciones de entradas son salidas
        if (mov === this.entry101Cancellation || mov === this.entry501Cancellation) {
            return true;
        }
        
        return false;
    }

    // Calcula la cantidad neta considerando el tipo de movimiento
    getNetQuantity(movement, quantity) {
        const mov = String(movement);
        const qty = Math.abs(Number(quantity));
        
        if (this.isEntryMovement(mov, quantity)) {
            return qty;
        } else if (this.isExitMovement(mov, quantity)) {
            return -qty;
        }
        
        return 0; // Para movimientos que no afectan inventario
    }

    // Obtiene el movimiento original para una anulación
    getOriginalMovement(cancellationMovement) {
        const mov = String(cancellationMovement);
        if (mov === '642') return '641';
        if (mov === '644') return '643';
        if (mov === '162') return '161';
        if (mov === '602') return '601';
        if (mov === '674') return '673';
        if (mov === '910') return '909';
        if (mov === '102') return '101';
        if (mov === '502') return '501';
        if (mov === '652') return '651';
        if (mov === '654') return '653';
        if (mov === '202') return '201';
        if (mov === '262') return '261';
        if (mov === '312') return '311';
        if (mov === '304') return '303';
        if (mov === '454') return '453';
        return '';
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

        // Calcular cantidad neta
        row['Ctd.neta'] = this.getNetQuantity(row['Clase de movimiento'], row['Ctd.en UM entrada']);

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
            r['Ctd.neta'] > 0
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

        // Emparejar movimientos para ignorar (mejorado)
        const pairedIgnore = new Set();
        Object.keys(byDay).forEach(ds => {
            const items = byDay[ds];
            
            // Emparejar 643/311 con 101
            const salidas = items.filter(it => { 
                const c = String(it.row['Clase de movimiento']); 
                return (c==='643' || c==='311') && it.row['Ctd.neta'] < 0; 
            });
            const entradas101 = items.filter(it => String(it.row['Clase de movimiento']) === this.entry101 && it.row['Ctd.neta'] > 0);
            
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
                if (this.storeOutCancellations.has(movement) || 
                    this.clientOutCancellations.has(movement) ||
                    movement === this.entry101Cancellation ||
                    movement === this.entry501Cancellation) {
                    
                    const originalMovement = this.getOriginalMovement(movement);
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

        // Cálculos mejorados considerando todos los movimientos
        const salidaPorTienda = filtered.reduce((sum,r,idx) => {
            if (pairedIgnore.has(idx)) return sum;
            
            const movement = String(r['Clase de movimiento']);
            const netQty = r['Ctd.neta'];
            
            if (netQty >= 0) return sum;
            if (this.storeOutCodes.has(movement)) return sum + Math.abs(netQty);
            return sum;
        },0);

        const salidaAClientes = filtered.reduce((sum,r,idx) => {
            if (pairedIgnore.has(idx)) return sum;
            
            const movement = String(r['Clase de movimiento']);
            const netQty = r['Ctd.neta'];
            
            if (netQty >= 0) return sum;
            if (this.clientOutCodes.has(movement)) return sum + Math.abs(netQty);
            return sum;
        },0);

        // Cálculos de estadísticas adicionales
        const storeMovsNeg = filtered.filter((r,idx) => {
            if (pairedIgnore.has(idx)) return false;
            const movement = String(r['Clase de movimiento']);
            const netQty = r['Ctd.neta'];
            return netQty < 0 && this.storeOutCodes.has(movement);
        }).map(r => r['Ctd.neta']);

        const clientMovsNeg = filtered.filter((r,idx) => {
            if (pairedIgnore.has(idx)) return false;
            const movement = String(r['Clase de movimiento']);
            const netQty = r['Ctd.neta'];
            return netQty < 0 && this.clientOutCodes.has(movement);
        }).map(r => r['Ctd.neta']);

        const storeMax = storeMovsNeg.length ? Math.min(...storeMovsNeg) : 0;
        const storeMin = storeMovsNeg.length ? Math.max(...storeMovsNeg) : 0;
        const clientMax = clientMovsNeg.length ? Math.min(...clientMovsNeg) : 0;
        const clientMin = clientMovsNeg.length ? Math.max(...clientMovsNeg) : 0;
        const avgStore = storeMovsNeg.length ? (storeMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/storeMovsNeg.length) : 0;
        const avgClient = clientMovsNeg.length ? (clientMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/clientMovsNeg.length) : 0;

        // Stock actual usando cantidades netas
        const totalSumMov = filtered.reduce((s,r) => s + r['Ctd.neta'], 0);
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
                const sumDay = movs.reduce((s,r) => s + r['Ctd.neta'], 0);
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
                const sumDay = movs.reduce((s,r)=> s + r['Ctd.neta'], 0);
                const endBalance = startBalance + sumDay;
                if (Number(endBalance) === 0 && Number(startBalance) !== 0) puntosCero.push(ds);
                running = endBalance;
            });
        }

        // Irregularidades (mejorado)
        const irregularidades = [];

        // 501 without 502
        const entries501 = filtered.filter(r => String(r['Clase de movimiento']) === this.entry501 && r['Ctd.neta'] > 0);
        entries501.forEach(en => {
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const found502 = filtered.find(r => 
                String(r['Clase de movimiento']) === this.entry501Cancellation && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty &&
                !pairedIgnore.has(filtered.indexOf(r))
            );
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
        const exits673 = filtered.filter(r => 
            String(r['Clase de movimiento']) === '673' && 
            r['Ctd.neta'] < 0 &&
            !pairedIgnore.has(filtered.indexOf(r))
        );
        exits673.forEach(ex => {
            const qty = Math.abs(Number(ex['Ctd.en UM entrada']||0));
            const user = this.normalizeUser(ex['Nombre del usuario']);
            const fecha = ex._dateKey || this.getDateKeyFromRow(ex);
            const found101 = filtered.find(r => 
                String(r['Clase de movimiento']) === this.entry101 && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty && 
                this.normalizeUser(r['Nombre del usuario']) === user && 
                !pairedIgnore.has(filtered.indexOf(r)) &&
                (r._dateKey || this.getDateKeyFromRow(r)) >= fecha
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

        // 101 en centro 1000 check - skip if user YLARA
        const entries101in100 = filtered.filter(r => 
            String(r['Clase de movimiento']) === this.entry101 && 
            String(r['Centro']).trim() === '1000' &&
            r['Ctd.neta'] > 0
        );
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
                    
                    const netQty = row['Ctd.neta'];
                    const data = movementTypes.get(movementType);
                    
                    if (this.storeOutCodes.has(movementType) && netQty < 0) {
                        data.tienda += Math.abs(netQty);
                    } else if (this.clientOutCodes.has(movementType) && netQty < 0) {
                        data.cliente += Math.abs(netQty);
                    }
                    
                    data.total += Math.abs(netQty);
                }
            });
        });

        return Array.from(movementTypes.entries())
            .map(([type, data]) => ({ type, ...data }))
            .sort((a, b) => b.total - a.total);
    }
}

window.TrazabilidadCore = TrazabilidadCore;
