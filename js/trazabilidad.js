// js/trazabilidad.js - Sistema de Trazabilidad Mejorado
class TrazabilidadSystem {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.initializeTrazabilidadLogic();
    }

    render() {
        this.container.innerHTML = `
            <button class="back-button" id="backToReports">← Volver a Reportes</button>
            <div class="trazabilidad-container">
                <div class="trazabilidad-header">
                    <h3>Analizador de Trazabilidad de Mercancía</h3>
                    <p>Sube un archivo Excel con las columnas: Material, Texto breve de material, Centro, Almacén, Clase de movimiento, Documento material, Fe.contabilización, Hora de entrada, Ctd.en UM entrada, Un.medida de entrada, Cliente, Nombre del usuario</p>
                </div>

                <div class="search-card">
                    <div class="filter-controls">
                        <div class="filter-input-group">
                            <label for="fileInput">Archivo Excel (.xlsx/.xls):</label>
                            <input type="file" id="fileInput" accept=".xlsx,.xls" />
                        </div>

                        <div class="filter-input-group">
                            <label for="filterCentro">Filtro Centro:</label>
                            <select id="filterCentro" class="custom-select">
                                <option value="">-- Todos --</option>
                            </select>
                        </div>

                        <div class="filter-input-group">
                            <label for="filterMaterial">Filtro Material:</label>
                            <input id="filterMaterial" type="text" placeholder="Buscar material..." />
                        </div>
                    </div>

                    <div class="row" style="margin-top: 20px; justify-content: flex-start; gap: 10px; flex-wrap: wrap;">
                        <button id="listMaterialsBtn" disabled>Listar Materiales</button>
                        <button id="configStockBtn" class="alt" disabled>Configurar stock inicial</button>
                        <button id="generateBtn" class="alt" disabled>Generar reporte</button>
                        <button id="downloadPdfBtn" class="alt" disabled>Descargar PDF</button>
                        <button id="downloadExcelBtn" class="alt" disabled>Descargar Excel</button>
                        <button id="selectAllBtn" class="alt">Seleccionar todos</button>
                        <button id="clearAllBtn" class="alt">Deseleccionar</button>
                    </div>
                </div>

                <div id="materialsSection" class="search-card hidden">
                    <h4>Materiales detectados</h4>
                    <p class="muted">Selecciona los materiales que deseas analizar (puedes seleccionar varios).</p>
                    <div id="materialsContainer" class="materials-list"></div>
                </div>

                <div id="reportSection" class="hidden">
                    <div class="search-card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <div>
                                <h4 style="margin-bottom: 5px;">Reporte</h4>
                                <small id="reportMeta" class="muted"></small>
                            </div>
                            <div style="text-align: right;">
                                <small class="muted">Materiales analizados:</small>
                                <div id="materialsAnalizados" style="font-size: 0.9rem;"></div>
                            </div>
                        </div>

                        <div class="table-container">
                            <table class="inventory-table">
                                <thead>
                                    <tr>
                                        <th>Material</th>
                                        <th>Texto breve</th>
                                        <th>UMB</th>
                                        <th>Centro</th>
                                        <th>Tienda</th>
                                        <th>Rango de fecha</th>
                                        <th>Último ingreso</th>
                                        <th>Ajustes (+ / -)</th>
                                        <th>Fecha de ajuste</th>
                                        <th>Puntos cero</th>
                                        <th>Posible irregularidad</th>
                                        <th>Usuario de irregularidad</th>
                                        <th>Descripción de irregularidad</th>
                                        <th>Tipo de diferencia</th>
                                        <th>Total salidas por tienda</th>
                                        <th>Total salidas a clientes</th>
                                        <th>Salida max. por tienda</th>
                                        <th>Salida min. por tienda</th>
                                        <th>Salida max. a clientes</th>
                                        <th>Salida min. a clientes</th>
                                        <th>Promedio salida por tienda</th>
                                        <th>Promedio salida por cliente</th>
                                        <th>Stock Actual</th>
                                    </tr>
                                </thead>
                                <tbody id="reportBody"></tbody>
                            </table>
                        </div>

                        <div class="charts-container">
                            <div class="chart-card">
                                <h6>Promedio de Movimientos</h6>
                                <div class="chart-wrapper">
                                    <canvas id="chartPromedioMovimientos"></canvas>
                                </div>
                            </div>
                            <div class="chart-card">
                                <h6>Distribución de Salidas</h6>
                                <div class="chart-wrapper">
                                    <canvas id="chartDistribucionSalidas"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal para stock inicial -->
                <div id="stockModal" class="modal-overlay hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5>Configurar stock inicial</h5>
                            <button id="closeStockBtnTop" class="close-btn">×</button>
                        </div>
                        <div id="stockModalBody" class="modal-body"></div>
                        <div class="modal-footer">
                            <button id="saveStockBtn">Guardar</button>
                            <button id="closeStockBtn" class="alt">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.getElementById('backToReports').addEventListener('click', () => {
            this.showReportsMenu();
        });
    }

    showReportsMenu() {
        this.container.innerHTML = `
            <div class="reports-menu">
                <div class="report-option" data-report="trazabilidad">
                    <div class="report-icon">📊</div>
                    <h3>Trazabilidad</h3>
                    <p>Análisis de movimientos de inventario</p>
                </div>
                
                <div class="report-option" data-report="analisis-pedidos">
                    <div class="report-icon">📦</div>
                    <h3>Análisis de Pedidos</h3>
                    <p>Próximamente...</p>
                </div>
            </div>
        `;

        document.querySelectorAll('.report-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const reportType = e.currentTarget.dataset.report;
                this.loadReport(reportType);
            });
        });
    }

    loadReport(reportType) {
        if (reportType === 'trazabilidad') {
            this.render();
            this.initializeTrazabilidadLogic();
        } else {
            showAlert('Esta funcionalidad estará disponible próximamente', 'info');
        }
    }

    initializeTrazabilidadLogic() {
        // Variables globales
        let rawRows = [];
        let materialMap = new Map();
        let uniqueMaterials = [];
        let initialStocks = {};
        let results = [];
        let centroSet = new Set();
        let modalEventsInitialized = false;

        // movement sets
        const storeOutCodes = new Set(['641', '643', '161', '351']);
        const clientOutCodes = new Set(['601', '909', '673']);
        const adjustmentPos = new Set(['701']);
        const adjustmentNeg = new Set(['702']);
        const entry101 = '101';
        const entry501 = '501';
        const annul501 = '502';

        // Helpers
        function parseDate(v) {
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

        function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
        function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
        function parseISODate(s) { if (!s) return null; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; }
        function round2(v) { return Math.round((Number(v) + Number.EPSILON) * 100) / 100; }
        function normalizeUser(u) { return String(u || '').trim().toLowerCase(); }

        function getDateKeyFromRow(r) {
            if (r['Fe.contabilización'] instanceof Date) return r['Fe.contabilización'].toISOString().slice(0,10);
            const raw = (r['Fe.contabilización_raw'] ?? r['Fe.contabilización'] ?? '').toString().trim();
            const m = raw.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
            if (m) {
                const p = parseDate(m[1]); if (p instanceof Date) return p.toISOString().slice(0,10);
            }
            const replaced = raw.replace(/\./g,'/').split(' ')[0];
            const p2 = parseDate(replaced); if (p2 instanceof Date) return p2.toISOString().slice(0,10);
            return raw;
        }

        // SOLUCIÓN: Inicialización de eventos del modal usando event delegation
        function initializeModalEvents() {
            if (modalEventsInitialized) return;
            
            document.addEventListener('click', function(e) {
                if (e.target.id === 'closeStockBtn' || e.target.id === 'closeStockBtnTop') {
                    document.getElementById('stockModal').classList.add('hidden');
                }
                
                if (e.target.id === 'saveStockBtn') {
                    const wrappers = document.getElementById('stockModalBody').querySelectorAll('div');
                    wrappers.forEach(w => {
                        const key = w.dataset.key;
                        const dateInput = w.querySelector('input[type="date"]');
                        const stockInput = w.querySelector('input[type="number"]');
                        if (!key) return;
                        initialStocks[key] = { 
                            date: dateInput.value, 
                            stock: parseFloat(stockInput.value || 0) 
                        };
                    });
                    document.getElementById('stockModal').classList.add('hidden');
                    showAlert('Stocks iniciales guardados localmente.', 'success');
                }
                
                if (e.target.id === 'stockModal') {
                    document.getElementById('stockModal').classList.add('hidden');
                }
            });
            
            modalEventsInitialized = true;
        }

        // File load
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const f = e.target.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const data = new Uint8Array(ev.target.result);
                    const wb = XLSX.read(data, {type:'array'});
                    const firstSheetName = wb.SheetNames[0];
                    const ws = wb.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(ws, {defval:''});
                    rawRows = json.map(transformRow);
                    if (!rawRows.length) { 
                        showAlert('No se detectaron filas en el archivo.', 'warning');
                        return; 
                    }
                    populateMaterialList(rawRows);
                    document.getElementById('listMaterialsBtn').disabled = false;
                    document.getElementById('configStockBtn').disabled = false;
                    document.getElementById('generateBtn').disabled = false;
                    document.getElementById('downloadPdfBtn').disabled = true;
                    document.getElementById('downloadExcelBtn').disabled = true;
                } catch(err) {
                    console.error(err);
                    showAlert('Error leyendo archivo: ' + err.message, 'error');
                }
            };
            reader.readAsArrayBuffer(f);
        });

        function transformRow(r) {
            const row = {};
            const keys = Object.keys(r);
            
            function findKeyMatch(possible) {
                return keys.find(k => { 
                    const ks = String(k).toLowerCase(); 
                    return possible.some(p => ks.includes(p)); 
                });
            }

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
            row['Fe.contabilización'] = parseDate(row['Fe.contabilización']);

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

        function populateMaterialList(rows) {
            materialMap.clear();
            centroSet.clear();
            
            rows.forEach(r => {
                let centro = r['Centro'] || '';
                let centerKey = centro;
                if (centro === '3000' || centro === '1000') centerKey = '1000/3000';
                centroSet.add(centerKey);
                
                const material = r['Material'] || '';
                const texto = r['Texto breve de material'] || '';
                const umb = r['Un.medida de entrada'] || '';
                const key = `${material}||${centerKey}`;
                
                if (!materialMap.has(key)) {
                    materialMap.set(key, { material, texto, umb, centro: centerKey, rows: [] });
                }
                
                const copy = Object.assign({}, r);
                copy._centro_normalizado = centerKey;
                copy._dateKey = getDateKeyFromRow(copy);
                copy._userNorm = normalizeUser(copy['Nombre del usuario']);
                materialMap.get(key).rows.push(copy);
            });

            uniqueMaterials = Array.from(materialMap.values()).map(m => ({
                material: m.material, 
                texto: m.texto, 
                umb: m.umb, 
                centro: m.centro, 
                key: `${m.material}||${m.centro}`
            })).sort((a,b) => String(a.material).localeCompare(String(b.material)));

            // Fill filterCentro
            const filterCentro = document.getElementById('filterCentro');
            filterCentro.innerHTML = '<option value="">-- Todos --</option>';
            Array.from(centroSet).sort().forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                filterCentro.appendChild(opt);
            });
        }

        // Render materials list
        document.getElementById('listMaterialsBtn').addEventListener('click', () => {
            const materialsContainer = document.getElementById('materialsContainer');
            const materialsSection = document.getElementById('materialsSection');
            
            materialsContainer.innerHTML = '';
            materialsSection.classList.remove('hidden');
            
            const centroFilter = document.getElementById('filterCentro').value;
            const matFilter = (document.getElementById('filterMaterial').value || '').toLowerCase();

            uniqueMaterials.forEach(u => {
                if (centroFilter && u.centro !== centroFilter) return;
                if (matFilter && !(String(u.material).toLowerCase().includes(matFilter) || 
                    String(u.texto).toLowerCase().includes(matFilter))) return;

                const item = document.createElement('div');
                item.className = 'material-item';
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 10px;';
                
                const left = document.createElement('div');
                left.style.cssText = 'display: flex; align-items: center; gap: 10px;';
                
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'material-checkbox';
                cb.dataset.key = u.key;
                cb.checked = true;
                cb.style.cssText = 'width: 18px; height: 18px;';
                
                const span = document.createElement('div');
                span.textContent = `${u.material} — ${u.texto} (${u.centro})`;
                span.style.cssText = 'color: var(--text);';
                
                left.appendChild(cb);
                left.appendChild(span);

                const right = document.createElement('div');
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Editar stock inicial';
                editBtn.className = 'alt';
                editBtn.style.cssText = 'padding: 8px 12px; font-size: 0.8rem;';
                editBtn.addEventListener('click', () => openStockModalForKeys([u.key]));
                
                right.appendChild(editBtn);
                item.appendChild(left);
                item.appendChild(right);
                materialsContainer.appendChild(item);
            });

            document.getElementById('generateBtn').disabled = false;
            document.getElementById('configStockBtn').disabled = false;
        });

        // Select all / clear all
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.material-checkbox').forEach(cb => cb.checked = true);
        });
        
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            document.querySelectorAll('.material-checkbox').forEach(cb => cb.checked = false);
        });

        // Config stock initial
        document.getElementById('configStockBtn').addEventListener('click', () => {
            const checked = Array.from(document.querySelectorAll('.material-checkbox:checked')).map(c => c.dataset.key);
            if (checked.length === 0) {
                openStockModalForKeys(uniqueMaterials.map(u => u.key));
            } else {
                openStockModalForKeys(checked);
            }
        });

        function openStockModalForKeys(keys) {
            const stockModalBody = document.getElementById('stockModalBody');
            stockModalBody.innerHTML = '';
            
            const toEdit = keys.map(k => uniqueMaterials.find(u => u.key === k)).filter(Boolean);
            if (toEdit.length === 0) { 
                showAlert('No hay materiales seleccionados.', 'warning');
                return; 
            }

            toEdit.forEach(m => {
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px;';
                
                const h = document.createElement('h6');
                h.textContent = `${m.material} — ${m.texto} (${m.centro})`;
                h.style.cssText = 'color: var(--text); margin-bottom: 10px;';
                
                const dateLabel = document.createElement('label');
                dateLabel.textContent = 'Fecha del stock inicial:';
                dateLabel.style.cssText = 'display: block; color: var(--muted); font-size: 0.85rem; margin-bottom: 5px;';
                
                const dateInput = document.createElement('input');
                dateInput.type = 'date';
                dateInput.style.cssText = 'width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text); margin-bottom: 10px;';
                
                const oldest = getOldestDateForKey(m.key);
                dateInput.value = oldest ? oldest.toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
                
                const stockLabel = document.createElement('label');
                stockLabel.textContent = 'Stock inicial:';
                stockLabel.style.cssText = 'display: block; color: var(--muted); font-size: 0.85rem; margin-bottom: 5px;';
                
                const stockInput = document.createElement('input');
                stockInput.type = 'number';
                stockInput.step = '0.01';
                stockInput.style.cssText = 'width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text);';
                
                if (initialStocks[m.key]) { 
                    stockInput.value = initialStocks[m.key].stock; 
                    dateInput.value = initialStocks[m.key].date; 
                }
                
                wrapper.appendChild(h);
                wrapper.appendChild(dateLabel);
                wrapper.appendChild(dateInput);
                wrapper.appendChild(stockLabel);
                wrapper.appendChild(stockInput);
                wrapper.dataset.key = m.key;
                stockModalBody.appendChild(wrapper);
            });

            initializeModalEvents();
            document.getElementById('stockModal').classList.remove('hidden');
        }

        // Generate report
        document.getElementById('generateBtn').addEventListener('click', () => {
            const checked = Array.from(document.querySelectorAll('.material-checkbox:checked')).map(c => c.dataset.key);
            if (checked.length === 0) { 
                showAlert('Selecciona al menos un material.', 'warning');
                return; 
            }
            
            const missing = checked.filter(k => !initialStocks[k]);
            if (missing.length > 0) {
                if (!confirm('Falta stock inicial para algunos. Continuar con stock 0?')) return;
                missing.forEach(k => initialStocks[k] = { 
                    date: getOldestDateForKey(k) ? getOldestDateForKey(k).toISOString().slice(0,10) : (new Date().toISOString().slice(0,10)), 
                    stock: 0 
                });
            }
            
            results = checked.map(k => analyzeKey(k)).filter(Boolean);
            renderResults(results);
            
            const reportSection = document.getElementById('reportSection');
            reportSection.classList.remove('hidden');
            
            document.getElementById('materialsAnalizados').textContent = results.map(r => `${r.material} (${r.centro})`).join(', ');
            document.getElementById('downloadPdfBtn').disabled = false;
            document.getElementById('downloadExcelBtn').disabled = false;
        });

        // Download PDF
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            const element = document.querySelector('.trazabilidad-container');
            const opt = {
                margin: 0.2,
                filename: 'reporte_trazabilidad.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
            };
            html2pdf().from(element).set(opt).save();
        });

        // Download Excel
        document.getElementById('downloadExcelBtn').addEventListener('click', () => {
            if (!results || results.length === 0) { 
                showAlert('Genera el reporte primero.', 'warning');
                return; 
            }
            
            const out = results.map(r => ({
                Material: r.material,
                Texto: r.texto,
                UMB: r.umb,
                Centro: r.centro,
                Tienda: r.tienda,
                Rango_fecha: r.rangoFecha,
                Ultimo_ingreso: r.ultimoIngreso,
                Ajustes: r.ajustes,
                Fecha_ajuste: r.fechaAjuste,
                Puntos_cero: r.puntosCero,
                Posible_irregularidad: r.posibleIrregularidad,
                Usuario_irregularidad: r.usuarioIrregularidad,
                Descripcion_irregularidad: r.descIrregularidad,
                Tipo_diferencia: r.tipoDiferencia,
                Total_salidas_tienda: r.totalSalidasTienda,
                Total_salidas_clientes: r.totalSalidasClientes,
                Salida_max_tienda: r.salidaMaxTienda,
                Salida_min_tienda: r.salidaMinTienda,
                Salida_max_clientes: r.salidaMaxClientes,
                Salida_min_clientes: r.salidaMinClientes,
                Promedio_salida_tienda: r.promedioSalidaTienda,
                Promedio_salida_cliente: r.promedioSalidaCliente,
                Stock_Actual: r.stockActual
            }));
            
            const ws = XLSX.utils.json_to_sheet(out);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
            XLSX.writeFile(wb, 'reporte_trazabilidad.xlsx');
        });

        // Utility functions
        function getOldestDateForKey(key) {
            const entry = materialMap.get(key);
            if (!entry) return null;
            const dates = entry.rows.map(r => r['Fe.contabilización']).filter(Boolean);
            if (!dates.length) return null;
            return new Date(Math.min(...dates.map(d => d.getTime())));
        }

        // ===== LÓGICA DE ANÁLISIS COMPLETA =====
        function analyzeKey(key) {
            const group = materialMap.get(key);
            if (!group) return null;
            const rows = group.rows.slice();

            // Filtrar filas problemáticas
            const filtered = rows.filter(r => !(String(r['Clase de movimiento']) === '641' && r['Centro'] && !r['Almacén']));
            
            // Preparar datos
            filtered.forEach(r => { 
                if (!r._dateKey) r._dateKey = getDateKeyFromRow(r); 
                if (!r._userNorm) r._userNorm = normalizeUser(r['Nombre del usuario']); 
            });
            
            // Ordenar por fecha
            filtered.sort((a,b) => (a['Fe.contabilización'] ? a['Fe.contabilización'].getTime() : 0) - (b['Fe.contabilización'] ? b['Fe.contabilización'].getTime() : 0));

            // Fechas
            const dates = filtered.map(r => r['Fe.contabilización']).filter(Boolean);
            const minDate = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
            const maxDate = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
            
            // Último ingreso
            const lastIngresoRow = [...filtered].reverse().find(r => Number(r['Ctd.en UM entrada']) > 0);
            const lastIngreso = lastIngresoRow && lastIngresoRow['Fe.contabilización'] ? lastIngresoRow['Fe.contabilización'].toISOString().slice(0,10) : '';

            // Ajustes
            const ajustesPosVal = filtered.filter(r => adjustmentPos.has(String(r['Clase de movimiento']))).reduce((s,r) => s + Math.abs(Number(r['Ctd.en UM entrada']||0)),0);
            const ajustesNegVal = filtered.filter(r => adjustmentNeg.has(String(r['Clase de movimiento']))).reduce((s,r) => s + Math.abs(Number(r['Ctd.en UM entrada']||0)),0);
            const fechaAjuste = filtered.filter(r => adjustmentPos.has(String(r['Clase de movimiento'])) || adjustmentNeg.has(String(r['Clase de movimiento']))).map(r => r['Fe.contabilización']).filter(Boolean).map(d => d.toISOString().slice(0,10)).join(', ');

            // Agrupar por día
            const byDay = {};
            filtered.forEach((r, idx) => {
                const ds = r._dateKey || getDateKeyFromRow(r);
                if (!byDay[ds]) byDay[ds] = [];
                byDay[ds].push({row: r, idx});
            });

            // Función para comparar centros
            function centersMatch(c1,c2) { 
                const a = String(c1||'').trim(); 
                const b = String(c2||'').trim(); 
                if (!a||!b) return false; 
                if (a===b) return true; 
                const pair = new Set([a,b]); 
                if (pair.has('1000') && pair.has('3000')) return true; 
                return false; 
            }

            // Emparejar movimientos para ignorar
            const pairedIgnore = new Set();
            Object.keys(byDay).forEach(ds => {
                const items = byDay[ds];
                const salidas = items.filter(it => { 
                    const c = String(it.row['Clase de movimiento']); 
                    const q = Number(it.row['Ctd.en UM entrada']||0); 
                    return (c==='643' || c==='311') && q < 0; 
                });
                const entradas101 = items.filter(it => String(it.row['Clase de movimiento']) === entry101 && Number(it.row['Ctd.en UM entrada']||0) > 0);
                
                salidas.forEach(s => {
                    const sQty = Math.abs(Number(s.row['Ctd.en UM entrada']||0));
                    const sUser = normalizeUser(s.row['Nombre del usuario']);
                    const sCentro = String(s.row['Centro']||'').trim();
                    const match = entradas101.find(en => {
                        const eQty = Math.abs(Number(en.row['Ctd.en UM entrada']||0));
                        const eUser = normalizeUser(en.row['Nombre del usuario']);
                        const eCentro = String(en.row['Centro']||'').trim();
                        return (eQty === sQty) && (eUser === sUser) && centersMatch(sCentro, eCentro);
                    });
                    if (match) { 
                        pairedIgnore.add(s.idx); 
                        pairedIgnore.add(match.idx); 
                    }
                });
            });

            // Salidas por tienda
            const salidaPorTienda = filtered.reduce((sum,r,idx) => {
                const qty = Number(r['Ctd.en UM entrada']||0); 
                const clase = String(r['Clase de movimiento']);
                if (qty >= 0) return sum;
                if (clase === '311' && !pairedIgnore.has(idx)) return sum;
                if (pairedIgnore.has(idx)) return sum;
                if (storeOutCodes.has(clase)) return sum + Math.abs(qty);
                return sum;
            },0);

            // Salidas a clientes
            const salidaAClientes = filtered.reduce((sum,r,idx) => {
                const qty = Number(r['Ctd.en UM entrada']||0); 
                const clase = String(r['Clase de movimiento']);
                if (qty >= 0) return sum;
                if (clase === '311' && !pairedIgnore.has(idx)) return sum;
                if (pairedIgnore.has(idx)) return sum;
                if (clientOutCodes.has(clase)) return sum + Math.abs(qty);
                return sum;
            },0);

            // Cálculos de estadísticas adicionales (del código original)
            const storeMovsNeg = filtered.filter((r,idx) => {
                const qty = Number(r['Ctd.en UM entrada']||0); 
                const clase = String(r['Clase de movimiento']);
                if (qty >= 0) return false;
                if (clase === '311' && !pairedIgnore.has(idx)) return false;
                if (pairedIgnore.has(idx)) return false;
                return storeOutCodes.has(clase);
            }).map(r => Number(r['Ctd.en UM entrada']||0));

            const clientMovsNeg = filtered.filter((r,idx) => {
                const qty = Number(r['Ctd.en UM entrada']||0); 
                const clase = String(r['Clase de movimiento']);
                if (qty >= 0) return false;
                if (clase === '311' && !pairedIgnore.has(idx)) return false;
                if (pairedIgnore.has(idx)) return false;
                return clientOutCodes.has(clase);
            }).map(r => Number(r['Ctd.en UM entrada']||0));

            const storeMax = storeMovsNeg.length ? Math.min(...storeMovsNeg) : 0;
            const storeMin = storeMovsNeg.length ? Math.max(...storeMovsNeg) : 0;
            const clientMax = clientMovsNeg.length ? Math.min(...clientMovsNeg) : 0;
            const clientMin = clientMovsNeg.length ? Math.max(...clientMovsNeg) : 0;
            const avgStore = storeMovsNeg.length ? (storeMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/storeMovsNeg.length) : 0;
            const avgClient = clientMovsNeg.length ? (clientMovsNeg.reduce((a,b)=>a + Math.abs(b),0)/clientMovsNeg.length) : 0;

            // Stock actual
            const totalSumMov = filtered.reduce((s,r) => s + Number(r['Ctd.en UM entrada']||0), 0);
            const stockActual = (Number(initialStocks[key] ? initialStocks[key].stock : 0) || 0) + totalSumMov;

            // Puntos cero
            const initData = initialStocks[key] || { date: (minDate ? minDate.toISOString().slice(0,10) : new Date().toISOString().slice(0,10)), stock:0 };
            const initDate = parseISODate(initData.date) || (minDate || null);
            let currentBalance = Number(initData.stock) || 0;
            const movementsByDate = {};
            filtered.forEach(r => {
                const ds = r._dateKey || getDateKeyFromRow(r);
                if (!movementsByDate[ds]) movementsByDate[ds] = [];
                movementsByDate[ds].push(r);
            });
            
            const puntosCero = [];
            if (minDate && maxDate && initDate) {
                let day = startOfDay(initDate);
                const lastDay = startOfDay(maxDate);
                while (day <= lastDay) {
                    const ds = day.toISOString().slice(0,10);
                    const startBalance = currentBalance;
                    const movs = movementsByDate[ds] || [];
                    const sumDay = movs.reduce((s,r) => s + Number(r['Ctd.en UM entrada']||0), 0);
                    const endBalance = startBalance + sumDay;
                    if (Number(endBalance) === 0 && Number(startBalance) !== 0) puntosCero.push(ds);
                    currentBalance = endBalance;
                    day = addDays(day,1);
                }
            } else {
                let running = Number(initialStocks[key] ? initialStocks[key].stock : 0);
                const uniqueDates = Array.from(new Set(filtered.map(r => r._dateKey || getDateKeyFromRow(r)))).filter(Boolean).sort();
                uniqueDates.forEach(ds => {
                    const movs = filtered.filter(r => (r._dateKey || getDateKeyFromRow(r)) === ds);
                    const startBalance = running;
                    const sumDay = movs.reduce((s,r)=> s + Number(r['Ctd.en UM entrada']||0), 0);
                    const endBalance = startBalance + sumDay;
                    if (Number(endBalance) === 0 && Number(startBalance) !== 0) puntosCero.push(ds);
                    running = endBalance;
                });
            }

            // Irregularidades
            const irregularidades = [];

            // 501 without 502 - CORRECCIÓN: Ahora marca "Posible Faltante"
            const entries501 = filtered.filter(r => String(r['Clase de movimiento']) === entry501);
            entries501.forEach(en => {
                const qty = Number(en['Ctd.en UM entrada']||0);
                const found502 = filtered.find(r => String(r['Clase de movimiento']) === annul501 && Math.abs(Number(r['Ctd.en UM entrada']||0)) === Math.abs(qty));
                if (!found502) {
                    const fecha = en._dateKey || getDateKeyFromRow(en);
                    irregularidades.push({ 
                        tipo:'501_sin_502', 
                        usuario: en['Nombre del usuario']||'', 
                        fecha, 
                        descripcion:`Entrada 501 de ${qty} sin anulación 502 equivalente (fecha: ${fecha})`
                    });
                }
            });

            // 673 sin 101
            const exits673 = filtered.filter(r => String(r['Clase de movimiento']) === '673' && Number(r['Ctd.en UM entrada']) < 0);
            exits673.forEach(ex => {
                const qty = Math.abs(Number(ex['Ctd.en UM entrada']||0));
                const user = normalizeUser(ex['Nombre del usuario']);
                const fecha = ex._dateKey || getDateKeyFromRow(ex);
                const found101 = filtered.find(r => 
                    String(r['Clase de movimiento']) === entry101 && 
                    Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty && 
                    normalizeUser(r['Nombre del usuario']) === user && 
                    (r._dateKey || getDateKeyFromRow(r)) >= (ex._dateKey || fecha)
                );
                if (!found101) {
                    irregularidades.push({ 
                        tipo:'673_sin_101', 
                        usuario: ex['Nombre del usuario']||'', 
                        fecha, 
                        descripcion:`Salida 673 de ${qty} sin una entrada 101 correspondiente (fecha: ${fecha})`
                    });
                }
            });

            // 101 en centro 1000 check - skip if user YLARA
            const entries101in100 = filtered.filter(r => String(r['Clase de movimiento']) === entry101 && String(r['Centro']).trim() === '1000');
            entries101in100.forEach(en => {
                const enUserNorm = normalizeUser(en['Nombre del usuario']||'');
                if (enUserNorm === 'ylara') return; // skip per request
                const qty = Math.abs(Number(en['Ctd.en UM entrada']||0));
                const user = enUserNorm;
                const fecha = en._dateKey || getDateKeyFromRow(en);
                const foundFrom3000orSame = filtered.find(r => {
                    const clase = String(r['Clase de movimiento']);
                    const rFecha = r._dateKey || getDateKeyFromRow(r);
                    const origenCentro = String(r['Centro']||'').trim();
                    return (clase === '643' || clase === '311') && 
                           rFecha === fecha && 
                           Math.abs(Number(r['Ctd.en UM entrada']||0)) === qty && 
                           normalizeUser(r['Nombre del usuario']||'') === user && 
                           (origenCentro === '3000' || origenCentro === String(en['Centro']).trim());
                });
                if (!foundFrom3000orSame) {
                    irregularidades.push({ 
                        tipo:'101_en_1000', 
                        usuario: en['Nombre del usuario']||'', 
                        fecha, 
                        descripcion:`Entrada 101 registrada en centro 1000 sin 643/311 correspondiente desde 3000 o mismo centro (fecha: ${fecha})`
                    });
                }
            });

            // Determinar tipo de diferencia - CORRECCIÓN: 501_sin_502 => "Posible Faltante"
            let tipoDiferencia = 'Ninguna detectada';
            if (irregularidades.some(i=>i.tipo==='673_sin_101')) tipoDiferencia = 'Posible Faltante';
            if (irregularidades.some(i=>i.tipo==='501_sin_502')) tipoDiferencia = 'Posible Faltante';
            if (irregularidades.some(i=>i.tipo==='673_sin_101') && irregularidades.some(i=>i.tipo==='501_sin_502')) tipoDiferencia = 'Diferencias mixtas';

            const primaryIrreg = irregularidades.length ? irregularidades[0] : null;

            return {
                key,
                material: group.material,
                texto: group.texto,
                umb: group.umb,
                centro: group.centro,
                tienda: group.centro,
                rangoFecha: `${minDate ? minDate.toISOString().slice(0,10) : '-'} / ${maxDate ? maxDate.toISOString().slice(0,10) : '-'}`,
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
                promedioSalidaTienda: round2(avgStore),
                promedioSalidaCliente: round2(avgClient),
                stockActual,
                dateMin: minDate, 
                dateMax: maxDate,
                rawRows: filtered,
                irregularidadesAll: irregularidades
            };
        }

        let chart1 = null, chart2 = null;
        
        function renderResults(resultsArr) {
            const reportBody = document.getElementById('reportBody');
            const dateRangeSpan = document.getElementById('reportMeta');
            
            reportBody.innerHTML = '';
            dateRangeSpan.textContent = `Rango de fechas: ${resultsArr.map(r => r.rangoFecha).join(' | ')}`;
            
            resultsArr.forEach(r => {
                const tr = document.createElement('tr');
                
                function td(txt, cls = '') {
                    const cell = document.createElement('td');
                    cell.textContent = (txt === null || txt === undefined) ? '' : txt;
                    if (cls) cell.classList.add(cls);
                    return cell;
                }
                
                tr.appendChild(td(r.material));
                tr.appendChild(td(r.texto));
                tr.appendChild(td(r.umb));
                tr.appendChild(td(r.centro));
                tr.appendChild(td(r.tienda));
                tr.appendChild(td(r.rangoFecha));
                tr.appendChild(td(r.ultimoIngreso));
                tr.appendChild(td(r.ajustes));
                tr.appendChild(td(r.fechaAjuste));
                tr.appendChild(td(r.puntosCero));
                tr.appendChild(td(r.posibleIrregularidad));
                tr.appendChild(td(r.usuarioIrregularidad));
                tr.appendChild(td(r.descIrregularidad));
                tr.appendChild(td(r.tipoDiferencia));
                tr.appendChild(td(Math.abs(r.totalSalidasTienda), 'negative-diff'));
                tr.appendChild(td(Math.abs(r.totalSalidasClientes), 'negative-diff'));
                tr.appendChild(td(r.salidaMaxTienda));
                tr.appendChild(td(r.salidaMinTienda));
                tr.appendChild(td(r.salidaMaxClientes));
                tr.appendChild(td(r.salidaMinClientes));
                tr.appendChild(td(r.promedioSalidaTienda));
                tr.appendChild(td(r.promedioSalidaCliente));
                
                const stockTd = td(round2(r.stockActual));
                stockTd.classList.add(r.stockActual < 0 ? 'negative-diff' : 'positive-diff');
                tr.appendChild(stockTd);
                
                reportBody.appendChild(tr);
            });

            // CORRECCIÓN: Gráficos 3D mejorados con leyendas y porcentajes
            const totalSalidasTienda = resultsArr.reduce((sum, r) => sum + Math.abs(r.totalSalidasTienda), 0);
            const totalSalidasClientes = resultsArr.reduce((sum, r) => sum + Math.abs(r.totalSalidasClientes), 0);
            const totalGeneral = totalSalidasTienda + totalSalidasClientes;

            // Destruir gráficos anteriores
            if (chart1) chart1.destroy();
            if (chart2) chart2.destroy();

            // Gráfico 1: Promedio de Movimientos (3D Doughnut)
            const ctx1 = document.getElementById('chartPromedioMovimientos');
            if (ctx1) {
                const promediosData = {
                    'Salidas Tienda': resultsArr.reduce((sum, r) => sum + r.promedioSalidaTienda, 0) / resultsArr.length,
                    'Salidas Clientes': resultsArr.reduce((sum, r) => sum + r.promedioSalidaCliente, 0) / resultsArr.length
                };

                chart1 = new Chart(ctx1, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(promediosData),
                        datasets: [{
                            data: Object.values(promediosData),
                            backgroundColor: [
                                'rgba(33, 150, 243, 0.8)',
                                'rgba(76, 175, 80, 0.8)'
                            ],
                            borderColor: [
                                'rgba(33, 150, 243, 1)',
                                'rgba(76, 175, 80, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        cutout: '60%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    font: {
                                        size: 11
                                    },
                                    generateLabels: function(chart) {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label, i) => {
                                                const value = data.datasets[0].data[i];
                                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                
                                                return {
                                                    text: `${label}: ${round2(value)} (${percentage}%)`,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    strokeStyle: data.datasets[0].borderColor[i],
                                                    lineWidth: 1,
                                                    hidden: false,
                                                    index: i
                                                };
                                            });
                                        }
                                        return [];
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${round2(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Gráfico 2: Distribución de Salidas (3D Pie)
            const ctx2 = document.getElementById('chartDistribucionSalidas');
            if (ctx2) {
                const distribucionData = {
                    'Salidas Tienda': totalSalidasTienda,
                    'Salidas Clientes': totalSalidasClientes
                };

                chart2 = new Chart(ctx2, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(distribucionData),
                        datasets: [{
                            data: Object.values(distribucionData),
                            backgroundColor: [
                                'rgba(255, 193, 7, 0.8)',
                                'rgba(156, 39, 176, 0.8)'
                            ],
                            borderColor: [
                                'rgba(255, 193, 7, 1)',
                                'rgba(156, 39, 176, 1)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    boxWidth: 12,
                                    font: {
                                        size: 11
                                    },
                                    generateLabels: function(chart) {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label, i) => {
                                                const value = data.datasets[0].data[i];
                                                const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                                
                                                return {
                                                    text: `${label}: ${round2(value)} (${percentage}%)`,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    strokeStyle: data.datasets[0].borderColor[i],
                                                    lineWidth: 1,
                                                    hidden: false,
                                                    index: i
                                                };
                                            });
                                        }
                                        return [];
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${round2(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // Inicializar eventos del modal al cargar la lógica
        initializeModalEvents();
    }
}

// Inicialización global
window.TrazabilidadSystem = TrazabilidadSystem;
