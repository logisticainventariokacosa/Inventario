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
        
        // Salidas a cliente (cantidad NEGATIVA)
        this.clientOutCodes = new Set(['601', '909']);
        
        // Entradas que restan a salidas a cliente (cantidad POSITIVA)
        this.clientInCodes = new Set(['651', '602', '910']);
        
        // Salidas a tienda (cantidad NEGATIVA)
        this.storeOutCodes = new Set(['643', '641', '351', '161', '201', '261']);
        
        // Entradas que restan a salidas a tienda (cantidad POSITIVA)
        this.storeInCodes = new Set(['644', '642', '352', '162', '202', '262']);
        
        // Nuevos movimientos de ingreso
        this.entry992 = '992';
        this.entry561 = '561';
        this.entry673 = '673';
        this.annul992 = '993';
        this.annul561 = '562';
        this.annul673 = '674';
        
        // NUEVOS MOVIMIENTOS - Garantía
        this.entry994 = '994'; // Entrada garantía (positivo)
        this.annul994 = '995'; // Anulación de 994 (negativo)
        
        // Consumos (cantidad NEGATIVA)
        this.consumptionCodes = new Set(['201', '261', '309']);
        
        // Ajustes
        this.adjustmentPos = new Set(['701']); // POSITIVO = entrada
        this.adjustmentNeg = new Set(['702']); // NEGATIVO = salida
        
        // Entradas principales (cantidad POSITIVA)
        this.entry101 = '101';
        this.entry501 = '501';
        this.entry305 = '305'; // Entrada de tienda
        this.entry992 = '992'; // Entrada dproduccion
        this.entry561 = '561'; // Entrada produccion 1010
        
        // Devoluciones de clientes (cantidad POSITIVA)
        this.clientReturns = new Set(['651']);
        
        // Anulaciones
        this.annul501 = '502'; // Anulación de 501
        this.annul201 = '202'; // Anulación de 201
        this.annul261 = '262'; // Anulación de 261  
        this.annul309 = '310'; // Anulación de 309
        
        // Movimientos que NO afectan inventario físico
        this.nonInventoryMovements = new Set(['321', '322', '343', '344']);

        // Usuarios especiales - ACTUALIZADO
        this.usuariosEspeciales643 = new Set(['avitora', 'lgarcia', 'ksoteldo', 'gonzalezm', 'gcontreras', 'cippolito']);
        this.usuariosEspeciales101 = new Set(['ylara','egonzales']);
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
        // Primero intentar con la fecha ya parseada
        if (r['Fe.contabilización'] instanceof Date) {
            return r['Fe.contabilización'].toISOString().slice(0,10);
        }
        
        // Si no, intentar parsear desde el raw
        const raw = (r['Fe.contabilización_raw'] ?? r['Fe.contabilización'] ?? '').toString().trim();
        if (!raw) return '';
        
        const parsed = this.parseDate(raw);
        if (parsed instanceof Date) {
            return parsed.toISOString().slice(0,10);
        }
        
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

    // Función para verificar si un movimiento fue anulado el mismo día
    fueAnuladoMismoDia(filtered, movimiento, cantidad, fecha, usuario) {
        const fechaMov = this.startOfDay(fecha);
        
        // Buscar anulaciones el mismo día
        const anulacionesMismoDia = filtered.filter(r => {
            const fechaR = this.startOfDay(r['Fe.contabilización']);
            if (fechaR.getTime() !== fechaMov.getTime()) return false;
            
            const movimientoR = String(r['Clase de movimiento']);
            const cantidadR = Math.abs(Number(r['Ctd.en UM entrada'] || 0));
            const usuarioR = this.normalizeUser(r['Nombre del usuario']);
            
            // Verificar pares de anulación
            return this.esAnulacionDe(movimientoR, movimiento) && 
                   cantidadR === cantidad && 
                   usuarioR === usuario;
        });

        return anulacionesMismoDia.length > 0;
    }

    // Función para verificar si un movimiento es anulación de otro
    esAnulacionDe(movimientoAnulacion, movimientoOriginal) {
        const paresAnulacion = {
            '101': ['643'], // 643 puede anular 101
            '651': ['601'], // 601 puede anular 651  
            '673': ['643'],  // 643 puede anular 673
            '601': ['602'],  // 602 anula 601
            '909': ['910'],   // 910 anula 909
            '992': ['993'],   // 993 anula 992
            '561': ['562'],   // 562 anula 561
            '994': ['995']    // 995 anula 994 - NUEVO
        };

        return paresAnulacion[movimientoOriginal]?.includes(movimientoAnulacion) || false;
    }

    // Función para verificar si un 101 tiene un 643 correspondiente en el otro centro - CORREGIDA
    tiene643Correspondiente(filtered, cantidad, fecha, usuario, centroOriginal) {
        // Si el 101 está en 3000, buscar 643 en 1000, y viceversa
        const centroBuscado = centroOriginal === '3000' ? '1000' : '3000';
        const fechaMov = this.startOfDay(fecha);
        
        const movimientos643 = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidadR = Number(r['Ctd.en UM entrada'] || 0); // IMPORTANTE: mantener signo
            const usuarioR = this.normalizeUser(r['Nombre del usuario']);
            const centroR = String(r['Centro'] || '').trim();
            const fechaR = r['Fe.contabilización'];
            if (!fechaR) return false;
            
            const fechaRDay = this.startOfDay(fechaR);
            
            // Buscar 643 NEGATIVOS en el centro opuesto - CORREGIDO
            return movimiento === '643' && 
                   cantidadR === -cantidad && // 643 debe ser NEGATIVO y misma cantidad
                   usuarioR === usuario && 
                   centroR === centroBuscado &&
                   fechaRDay.getTime() === fechaMov.getTime();
        });

        return movimientos643.length > 0;
    }

    // Nueva función para centros 1000/3000 - CORREGIDA CON 643 Y REGLA ACTUALIZADA
    getUltimoIngresoComplejo(filtered) {
        // Movimientos considerados como ingresos para 1000/3000
        const movimientosIngreso = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            
            // Solo movimientos positivos (entradas)
            if (cantidad <= 0) return false;
            
            // Tipos de movimiento considerados ingresos
            return movimiento === this.entry101 || 
                   movimiento === '651' || 
                   movimiento === '673' ||
                   movimiento === this.entry992 ||
                   movimiento === this.entry561 ||
                   movimiento === this.entry501 ||
                   movimiento === this.entry994; // NUEVO: incluir 994
        });

        if (movimientosIngreso.length === 0) return '';

        // Ordenar por fecha descendente (más reciente primero)
        movimientosIngreso.sort((a, b) => 
            (b['Fe.contabilización']?.getTime() || 0) - (a['Fe.contabilización']?.getTime() || 0)
        );

        // Buscar el movimiento más reciente que cumpla las condiciones
        for (const mov of movimientosIngreso) {
            const movimiento = String(mov['Clase de movimiento']);
            const cantidad = Math.abs(Number(mov['Ctd.en UM entrada'] || 0));
            const fecha = mov['Fe.contabilización'];
            const usuario = this.normalizeUser(mov['Nombre del usuario']);
            const centroMov = String(mov['Centro'] || '').trim();

            // Verificar si el movimiento fue anulado el mismo día
            if (this.fueAnuladoMismoDia(filtered, movimiento, cantidad, fecha, usuario)) {
                continue; // Saltar este movimiento si fue anulado
            }

            // Validación especial para movimientos 101 - REGLA ACTUALIZADA: Solo para centro 1000
            if (movimiento === this.entry101 && centroMov === '1000') {
                // Verificar que NO tenga un 643 correspondiente en el otro centro
                const tiene643 = this.tiene643Correspondiente(filtered, cantidad, fecha, usuario, centroMov);
                
                if (!tiene643) {
                    return this.formatDate(fecha);
                }
            } else {
                // Para 651, 673, 992, 561, 994 y 101 en centro 3000, tomarlos directamente
                return this.formatDate(fecha);
            }
        }

        return ''; // Si ningún movimiento cumple las condiciones
    }

    // Función simple para otros centros - ACTUALIZADA CON NUEVOS MOVIMIENTOS
    getUltimoIngresoSimple(filtered) {
        // Movimientos considerados como ingresos para otros centros
        const movimientosIngreso = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            
            // Solo movimientos positivos (entradas)
            if (cantidad <= 0) return false;
            
            // Tipos de movimiento considerados ingresos
            return movimiento === this.entry101 || 
                   movimiento === '305' ||
                   movimiento === this.entry992 ||
                   movimiento === this.entry561 ||
                   movimiento === this.entry501 ||
                   movimiento === this.entry994; // NUEVO: incluir 994
        });

        if (movimientosIngreso.length === 0) return '';

        // Ordenar por fecha descendente y tomar el más reciente
        movimientosIngreso.sort((a, b) => 
            (b['Fe.contabilización']?.getTime() || 0) - (a['Fe.contabilización']?.getTime() || 0)
        );

        return this.formatDate(movimientosIngreso[0]['Fe.contabilización']);
    }

    // Función principal para obtener el último ingreso según las nuevas reglas
    getUltimoIngreso(filtered, centro) {
        // Para centros 1000/3000 - NUEVA LÓGICA
        if (centro === '1000/3000') {
            return this.getUltimoIngresoComplejo(filtered);
        }
        
        // Para otros centros - lógica simple (101, 305, 992, 561, 994)
        return this.getUltimoIngresoSimple(filtered);
    }

    // Función para calcular salidas a clientes según nuevas reglas
    calcularSalidasClientes(filtered) {
        // Sumar todos los 601 y 909 negativos
        const salidasCliente = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.clientOutCodes.has(movimiento) && cantidad < 0;
        }).reduce((sum, r) => sum + Math.abs(Number(r['Ctd.en UM entrada'] || 0)), 0);

        // Restar todos los 651, 602, 910 positivos
        const entradasCliente = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.clientInCodes.has(movimiento) && cantidad > 0;
        }).reduce((sum, r) => sum + Number(r['Ctd.en UM entrada'] || 0), 0);

        const totalSalidasClientes = Math.max(0, salidasCliente - entradasCliente);

        return {
            total: totalSalidasClientes,
            salidas: salidasCliente,
            entradas: entradasCliente,
            calculo: `${salidasCliente} - ${entradasCliente} = ${totalSalidasClientes}`
        };
    }

    // Función para calcular salidas a tienda según nuevas reglas
    calcularSalidasTienda(filtered) {
        // Sumar todos los movimientos negativos de tienda
        const salidasTienda = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.storeOutCodes.has(movimiento) && cantidad < 0;
        }).reduce((sum, r) => sum + Math.abs(Number(r['Ctd.en UM entrada'] || 0)), 0);

        // Restar todos los movimientos positivos que anulan salidas de tienda
        const entradasTienda = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.storeInCodes.has(movimiento) && cantidad > 0;
        }).reduce((sum, r) => sum + Number(r['Ctd.en UM entrada'] || 0), 0);

        const totalSalidasTienda = Math.max(0, salidasTienda - entradasTienda);

        return {
            total: totalSalidasTienda,
            salidas: salidasTienda,
            entradas: entradasTienda,
            calculo: `${salidasTienda} - ${entradasTienda} = ${totalSalidasTienda}`
        };
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
        
        // Preparar datos - CORRECCIÓN: Asegurar que las fechas se procesen correctamente
        filtered.forEach(r => { 
            if (!r._dateKey) r._dateKey = this.getDateKeyFromRow(r); 
            if (!r._userNorm) r._userNorm = this.normalizeUser(r['Nombre del usuario']); 
            
            // CORRECCIÓN: Asegurar que la fecha esté correctamente parseada
            if (r['Fe.contabilización'] && !(r['Fe.contabilización'] instanceof Date)) {
                r['Fe.contabilización'] = this.parseDate(r['Fe.contabilización']);
            }
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
                if (movement === this.annul201 || movement === this.annul261 || movement === this.annul309 || 
                    movement === this.annul992 || movement === this.annul561 || movement === this.annul994) { // NUEVO: incluir 995
                    const originalMovement = movement === this.annul201 ? '201' : 
                                           movement === this.annul261 ? '261' : 
                                           movement === this.annul309 ? '309' :
                                           movement === this.annul992 ? '992' : 
                                           movement === this.annul561 ? '561' : '994'; // NUEVO: 995 → 994
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

        // CÁLCULO CORREGIDO DEL STOCK ACTUAL
        const stockInicial = Number(this.initialStocks[key] ? this.initialStocks[key].stock : 0) || 0;
        
        // Sumar solo movimientos positivos (entradas)
        const totalEntradas = filtered.reduce((sum, r) => {
            const qty = Number(r['Ctd.en UM entrada'] || 0);
            return qty > 0 ? sum + qty : sum;
        }, 0);
        
        // Sumar solo movimientos negativos (salidas) - en valor absoluto
        const totalSalidas = filtered.reduce((sum, r) => {
            const qty = Number(r['Ctd.en UM entrada'] || 0);
            return qty < 0 ? sum + Math.abs(qty) : sum;
        }, 0);
        
        // Stock actual = (Stock Inicial + Total Entradas) - Total Salidas
        const stockActual = (stockInicial + totalEntradas) - totalSalidas;

        // CALCULAR SALIDAS A CLIENTES Y TIENDA CON LAS NUEVAS REGLAS
        const salidasClientes = this.calcularSalidasClientes(filtered);
        const salidasTienda = this.calcularSalidasTienda(filtered);

        const totalSalidasClientes = salidasClientes.total;
        const totalSalidasTienda = salidasTienda.total;

        // Cálculos de estadísticas adicionales para salidas a tienda
        const storeMovs = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.storeOutCodes.has(movimiento) && cantidad < 0;
        }).map(r => Number(r['Ctd.en UM entrada']||0));

        // Cálculos de estadísticas adicionales para salidas a clientes
        const clientMovs = filtered.filter(r => {
            const movimiento = String(r['Clase de movimiento']);
            const cantidad = Number(r['Ctd.en UM entrada'] || 0);
            return this.clientOutCodes.has(movimiento) && cantidad < 0;
        }).map(r => Number(r['Ctd.en UM entrada']||0));

        const storeMax = storeMovs.length ? Math.min(...storeMovs) : 0;
        const storeMin = storeMovs.length ? Math.max(...storeMovs) : 0;
        const clientMax = clientMovs.length ? Math.min(...clientMovs) : 0;
        const clientMin = clientMovs.length ? Math.max(...clientMovs) : 0;
        const avgStore = storeMovs.length ? (storeMovs.reduce((a,b)=>a + Math.abs(b),0)/storeMovs.length) : 0;
        const avgClient = clientMovs.length ? (clientMovs.reduce((a,b)=>a + Math.abs(b),0)/clientMovs.length) : 0;

        // PUNTOS CERO - CÁLCULO CORREGIDO
        const initData = this.initialStocks[key] || { date: (minDate ? minDate.toISOString().slice(0,10) : new Date().toISOString().slice(0,10)), stock:0 };
        const initDate = this.parseISODate(initData.date) || (minDate || null);
        let currentBalance = Number(initData.stock) || 0;
        const movementsByDate = {};
        
        // Agrupar movimientos por fecha
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
                
                // Calcular suma del día correctamente
                const sumDay = movs.reduce((s, r) => {
                    const qty = Number(r['Ctd.en UM entrada'] || 0);
                    return s + qty; // Sumar directamente (positivos y negativos)
                }, 0);
                
                const endBalance = startBalance + sumDay;
                
                // Punto cero: cuando el stock llega a 0 después de no ser 0
                if (Number(endBalance) === 0 && Number(startBalance) !== 0) {
                    puntosCero.push(this.formatDate(day));
                }
                
                currentBalance = endBalance;
                day = this.addDays(day, 1);
            }
        } else {
            // Método alternativo si no hay fechas válidas
            let running = Number(initData.stock) || 0;
            const uniqueDates = Array.from(new Set(filtered.map(r => r._dateKey || this.getDateKeyFromRow(r)))).filter(Boolean).sort();
            
            uniqueDates.forEach(ds => {
                const movs = filtered.filter(r => (r._dateKey || this.getDateKeyFromRow(r)) === ds);
                const startBalance = running;
                const sumDay = movs.reduce((s, r) => s + Number(r['Ctd.en UM entrada'] || 0), 0);
                const endBalance = startBalance + sumDay;
                
                if (Number(endBalance) === 0 && Number(startBalance) !== 0) {
                    puntosCero.push(ds);
                }
                running = endBalance;
            });
        }

        // IRREGULARIDADES - CORREGIDAS CON LAS NUEVAS REGLAS CLARAS
        const irregularidades = [];

    
        // REGLA 1: 673 positivo sin 643 o 641 negativo (mismo usuario, misma cantidad, mismo día)
        if (group.centro === '1000/3000') {
            const entries673Positivo = filtered.filter(r => 
                String(r['Clase de movimiento']) === '673' && 
                Number(r['Ctd.en UM entrada']) > 0 &&
                !pairedIgnore.has(filtered.indexOf(r))
            );
            
            entries673Positivo.forEach(en => {
                const enUserNorm = this.normalizeUser(en['Nombre del usuario']||'');
                // EXCEPCIÓN para usuario YLARA
                if (this.usuariosEspeciales101.has(enUserNorm)) return;
                
                const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
                const user = enUserNorm;
                const fecha = en['Fe.contabilización'];
                if (!fecha) return; // CORRECCIÓN: Si no hay fecha, saltar
                
                const fechaFormateada = this.formatDate(fecha);
                
                // BUSCAR 643 o 641 NEGATIVO correspondiente
                const fechaEn = this.startOfDay(fecha);
                const foundSalidaCorrespondiente = filtered.find(r => {
                    if (pairedIgnore.has(filtered.indexOf(r))) return false;
                    
                    const movimiento = String(r['Clase de movimiento']);
                    const cantidad = Number(r['Ctd.en UM entrada'] || 0);
                    const usuario = this.normalizeUser(r['Nombre del usuario']);
                    const fechaR = r['Fe.contabilización'];
                    if (!fechaR) return false;
                    
                    const fechaRDay = this.startOfDay(fechaR);
                    
                    // Buscar 643 o 641 NEGATIVO del mismo usuario, misma cantidad y mismo día
                    return (movimiento === '643' || movimiento === '641') && 
                           cantidad < 0 && // Debe ser negativo
                           Math.abs(cantidad) === qty && // Misma cantidad en valor absoluto
                           usuario === user && // Mismo usuario
                           fechaRDay.getTime() === fechaEn.getTime(); // Mismo día
                });
                
                if (!foundSalidaCorrespondiente) {
                    irregularidades.push({ 
                        tipo:'673_positivo_sin_salida', 
                        usuario: en['Nombre del usuario']||'', 
                        fecha: fechaFormateada,
                        descripcion:`Entrada 673 positiva de ${qty} sin salida 643 o 641 correspondiente (mismo usuario: ${user}, mismo día) - Fecha: ${fechaFormateada}`
                    });
                }
            });
        }

        // REGLA 2: 501 sin 502 (para TODOS los centros)
        const entries501 = filtered.filter(r => 
            String(r['Clase de movimiento']) === this.entry501 && 
            Number(r['Ctd.en UM entrada']) > 0
        );

        entries501.forEach(en => {
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const fecha = en['Fe.contabilización'];
            if (!fecha) return; // CORRECCIÓN: Si no hay fecha, saltar
            
            const fechaFormateada = this.formatDate(fecha);
            
            const found502 = filtered.find(r => 
                String(r['Clase de movimiento']) === this.annul501 && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty &&
                !pairedIgnore.has(filtered.indexOf(r))
            );
            
            if (!found502) {
                irregularidades.push({ 
                    tipo:'501_sin_502', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: fechaFormateada,
                    descripcion:`Entrada 501 de ${qty} sin anulación 502 equivalente - Fecha: ${fechaFormateada}`
                });
            }
        });

        // REGLA 2.1: 994 sin 995 (para TODOS los centros) - NUEVA REGLA
        const entries994 = filtered.filter(r => 
            String(r['Clase de movimiento']) === this.entry994 && 
            Number(r['Ctd.en UM entrada']) > 0
        );

        entries994.forEach(en => {
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const fecha = en['Fe.contabilización'];
            if (!fecha) return;
            
            const fechaFormateada = this.formatDate(fecha);
            
            // Buscar 995 NEGATIVO con misma cantidad (en cualquier fecha)
            const found995 = filtered.find(r => 
                String(r['Clase de movimiento']) === this.annul994 && 
                Number(r['Ctd.en UM entrada']) === -qty && // 995 debe ser NEGATIVO con misma cantidad
                !pairedIgnore.has(filtered.indexOf(r))
            );
            
            if (!found995) {
                irregularidades.push({ 
                    tipo:'994_sin_995', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: fechaFormateada,
                    descripcion:`Entrada garantía 994 de ${qty} sin anulación 995 equivalente - Fecha: ${fechaFormateada}`
                });
            }
        });

        // REGLA 3: 910 sin 909 (para TODOS los centros)
        const entries910 = filtered.filter(r => 
            String(r['Clase de movimiento']) === '910' && 
            Number(r['Ctd.en UM entrada']) > 0
        );

        entries910.forEach(en => {
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const fecha = en['Fe.contabilización'];
            if (!fecha) return; // CORRECCIÓN: Si no hay fecha, saltar
            
            const fechaFormateada = this.formatDate(fecha);
            
            const found909 = filtered.find(r => 
                String(r['Clase de movimiento']) === '909' && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty &&
                !pairedIgnore.has(filtered.indexOf(r))
            );
            
            if (!found909) {
                irregularidades.push({ 
                    tipo:'910_sin_909', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: fechaFormateada,
                    descripcion:`Devolución 910 de ${qty} sin venta 909 correspondiente - Fecha: ${fechaFormateada}`
                });
            }
        });

        // REGLA 4: 651 sin 601 (para TODOS los centros) - MODIFICADA CON VALIDACIÓN DE CLIENTE
        const entries651 = filtered.filter(r => 
            String(r['Clase de movimiento']) === '651' && 
            Number(r['Ctd.en UM entrada']) > 0
        );

        entries651.forEach(en => {
            const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
            const cliente651 = String(en['Cliente']||'').trim();
            const fecha = en['Fe.contabilización'];
            if (!fecha) return;
            
            const fechaFormateada = this.formatDate(fecha);
            
            // Buscar 601 con misma cantidad y MISMO CLIENTE (no importa la fecha)
            const found601 = filtered.find(r => 
                String(r['Clase de movimiento']) === '601' && 
                Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty &&
                String(r['Cliente']||'').trim() === cliente651 &&
                !pairedIgnore.has(filtered.indexOf(r))
            );
            
            if (!found601) {
                irregularidades.push({ 
                    tipo:'651_sin_601', 
                    usuario: en['Nombre del usuario']||'', 
                    fecha: fechaFormateada,
                    descripcion:`Devolución 651 de ${qty} sin venta 601 correspondiente (mismo cliente: ${cliente651}) - Fecha: ${fechaFormateada}`
                });
            }
        });

        // NUEVA REGLA: 643 negativo sin 101 o 673 positivo (mismo usuario, misma cantidad, mismo día)
        const salidas643 = filtered.filter(r => 
            String(r['Clase de movimiento']) === '643' && 
            Number(r['Ctd.en UM entrada']) < 0 &&
            !pairedIgnore.has(filtered.indexOf(r))
        );

        salidas643.forEach(salida => {
            const salidaUserNorm = this.normalizeUser(salida['Nombre del usuario']||'');
            // EXCEPCIÓN para usuarios especiales
            if (this.usuariosEspeciales643.has(salidaUserNorm)) return;
            
            const qty = Math.abs(Number(salida['Ctd.en UM entrada']||0));
            const user = salidaUserNorm;
            const fecha = salida['Fe.contabilización'];
            if (!fecha) return;
            
            const fechaFormateada = this.formatDate(fecha);
            
            // BUSCAR 101 o 673 POSITIVO correspondiente (mismo usuario, misma cantidad, mismo día)
            const fechaSalida = this.startOfDay(fecha);
            const foundEntradaCorrespondiente = filtered.find(r => {
                if (pairedIgnore.has(filtered.indexOf(r))) return false;
                
                const movimiento = String(r['Clase de movimiento']);
                const cantidad = Number(r['Ctd.en UM entrada'] || 0);
                const usuario = this.normalizeUser(r['Nombre del usuario']);
                const fechaR = r['Fe.contabilización'];
                if (!fechaR) return false;
                
                const fechaRDay = this.startOfDay(fechaR);
                
                // Buscar 101 o 673 POSITIVO del mismo usuario, misma cantidad y mismo día
                return (movimiento === '101' || movimiento === '673') && 
                       cantidad > 0 && // Debe ser positivo
                       Math.abs(cantidad) === qty && // Misma cantidad en valor absoluto
                       usuario === user && // Mismo usuario
                       fechaRDay.getTime() === fechaSalida.getTime(); // Mismo día
            });
            
            if (!foundEntradaCorrespondiente) {
                irregularidades.push({ 
                    tipo:'643_sin_101_o_673', 
                    usuario: salida['Nombre del usuario']||'', 
                    fecha: fechaFormateada,
                    descripcion:`Salida 643 negativa de ${qty} sin entrada 101 o 673 correspondiente (mismo usuario: ${user}, mismo día) - Fecha: ${fechaFormateada}`
                });
            }
        });

        // Determinar tipo de diferencia BASADO EN LAS REGLAS CORREGIDAS
        let tipoDiferencia = 'Ninguna detectada';
        const tipos = irregularidades.map(i => i.tipo);

        if (tipos.includes('643_sin_101_o_673')) tipoDiferencia = 'Posible Faltante 643/101-673';
        if (tipos.includes('101_en_1000_sin_643')) tipoDiferencia = 'Posible Error Registro 101/643';
        if (tipos.includes('673_positivo_sin_salida')) tipoDiferencia = 'Posible Error Entrada 673';
        if (tipos.includes('501_sin_502')) tipoDiferencia = 'Posible Faltante 501/502';
        if (tipos.includes('994_sin_995')) tipoDiferencia = 'Posible Error Garantía 994/995'; // NUEVO
        if (tipos.includes('910_sin_909')) tipoDiferencia = 'Posible Error Devolución 910/909';
        if (tipos.includes('651_sin_601')) tipoDiferencia = 'Posible Error Devolución 651/601';

        // Si hay múltiples tipos
        if (tipos.length > 1) {
            tipoDiferencia = 'Múltiples Irregularidades Detectadas';
        }

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
            totalSalidasTienda: totalSalidasTienda,
            totalSalidasClientes: totalSalidasClientes,
            salidaMaxTienda: storeMax,
            salidaMinTienda: storeMin,
            salidaMaxClientes: clientMax,
            salidaMinClientes: clientMin,
            promedioSalidaTienda: this.round2(avgStore),
            promedioSalidaCliente: this.round2(avgClient),
            stockActual: this.round2(stockActual),
            dateMin: minDate, 
            dateMax: maxDate,
            rawRows: filtered,
            irregularidadesAll: irregularidades,
            // Para debugging
            _debug: {
                stockInicial,
                totalEntradas,
                totalSalidas,
                calculoStock: `(${stockInicial} + ${totalEntradas}) - ${totalSalidas} = ${this.round2(stockActual)}`,
                calculoClientes: salidasClientes.calculo,
                calculoTienda: salidasTienda.calculo
            }
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
