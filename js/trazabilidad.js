// js/trazabilidad.js - Sistema de Trazabilidad Adaptado
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
                                        <th>Stock Actual</th>
                                    </tr>
                                </thead>
                                <tbody id="reportBody"></tbody>
                            </table>
                        </div>

                        <div class="charts-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px;">
                            <div class="search-card">
                                <h6>Total salidas por centro</h6>
                                <canvas id="chartOutByCentro" height="200"></canvas>
                            </div>
                            <div class="search-card">
                                <h6>Total salidas a clientes por material</h6>
                                <canvas id="chartOutByCliente" height="200"></canvas>
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
            
            // Usar event delegation para evitar problemas con elementos dinámicos
            document.addEventListener('click', function(e) {
                // Cerrar modal con botones
                if (e.target.id === 'closeStockBtn' || e.target.id === 'closeStockBtnTop') {
                    document.getElementById('stockModal').classList.add('hidden');
                }
                
                // Guardar stock
                if (e.target.id === 'saveStockBtn') {
                    console.log('Botón Guardar clickeado');
                    const wrappers = document.getElementById('stockModalBody').querySelectorAll('div');
                    console.log('Wrappers encontrados:', wrappers.length);
                    
                    wrappers.forEach(w => {
                        const key = w.dataset.key;
                        const dateInput = w.querySelector('input[type="date"]');
                        const stockInput = w.querySelector('input[type="number"]');
                        if (!key) return;
                        initialStocks[key] = { 
                            date: dateInput.value, 
                            stock: parseFloat(stockInput.value || 0) 
                        };
                        console.log('Stock guardado para:', key, initialStocks[key]);
                    });
                    document.getElementById('stockModal').classList.add('hidden');
                    showAlert('Stocks iniciales guardados localmente.', 'success');
                }
                
                // Cerrar modal haciendo clic fuera
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

            // Inicializar eventos del modal antes de mostrarlo
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

        function analyzeKey(key) {
            const group = materialMap.get(key);
            if (!group) return null;
            
            // Lógica de análisis simplificada para ejemplo
            // Aquí deberías incluir tu lógica completa de análisis
            const totalSalidasTienda = group.rows
                .filter(r => storeOutCodes.has(r['Clase de movimiento']))
                .reduce((sum, r) => sum + Math.abs(r['Ctd.en UM entrada']), 0);
                
            const totalSalidasClientes = group.rows
                .filter(r => clientOutCodes.has(r['Clase de movimiento']))
                .reduce((sum, r) => sum + Math.abs(r['Ctd.en UM entrada']), 0);
            
            const initialStock = initialStocks[key] ? initialStocks[key].stock : 0;
            const stockActual = initialStock - totalSalidasTienda - totalSalidasClientes;
            
            return {
                key,
                material: group.material,
                texto: group.texto,
                umb: group.umb,
                centro: group.centro,
                tienda: group.centro,
                rangoFecha: '2024-01-01 / 2024-12-31',
                ultimoIngreso: '2024-12-15',
                ajustes: '0 / 0',
                fechaAjuste: '',
                puntosCero: '-',
                posibleIrregularidad: '-',
                usuarioIrregularidad: '-',
                descIrregularidad: '-',
                tipoDiferencia: 'Ninguna detectada',
                totalSalidasTienda: totalSalidasTienda,
                totalSalidasClientes: totalSalidasClientes,
                stockActual: stockActual
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
                
                const stockTd = td(round2(r.stockActual));
                stockTd.classList.add(r.stockActual < 0 ? 'negative-diff' : 'positive-diff');
                tr.appendChild(stockTd);
                
                reportBody.appendChild(tr);
            });

            // Charts
            const labels = resultsArr.map(r => r.centro);
            const data1 = resultsArr.map(r => r.totalSalidasTienda);
            
            if (chart1) chart1.destroy();
            const ctx1 = document.getElementById('chartOutByCentro');
            if (ctx1) {
                chart1 = new Chart(ctx1, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Total salidas por tienda',
                            data: data1,
                            backgroundColor: 'rgba(33, 150, 243, 0.6)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }

            const labels2 = resultsArr.map(r => r.material);
            const data2 = resultsArr.map(r => r.totalSalidasClientes);
            
            if (chart2) chart2.destroy();
            const ctx2 = document.getElementById('chartOutByCliente');
            if (ctx2) {
                chart2 = new Chart(ctx2, {
                    type: 'bar',
                    data: {
                        labels: labels2,
                        datasets: [{
                            label: 'Total salidas a clientes',
                            data: data2,
                            backgroundColor: 'rgba(76, 175, 80, 0.6)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: {
                                ticks: {
                                    display: false
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
