// js/trazabilidad-ui.js - Interfaz de usuario del sistema
class TrazabilidadSystem {
    constructor(container) {
        this.container = container;
        this.core = new TrazabilidadCore();
        this.chart1 = null;
        this.chart2 = null;
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
                                <h6>Tipos de Movimiento por Destino</h6>
                                <div class="chart-wrapper">
                                    <canvas id="chartMovimientos"></canvas>
                                </div>
                            </div>
                            <div class="chart-card">
                                <h6>Distribución Total de Salidas</h6>
                                <div class="chart-wrapper">
                                    <canvas id="chartDistribucion"></canvas>
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
        // Event delegation para el botón volver
        this.container.addEventListener('click', (e) => {
            if (e.target.id === 'backToReports') {
                this.showReportsMenu();
            }
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
        let modalEventsInitialized = false;

        const initializeModalEvents = () => {
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
                        this.core.initialStocks[key] = { 
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
            }.bind(this));
            
            modalEventsInitialized = true;
        };

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
                    this.core.rawRows = json.map(r => this.core.transformRow(r));
                    if (!this.core.rawRows.length) { 
                        showAlert('No se detectaron filas en el archivo.', 'warning');
                        return; 
                    }
                    this.core.populateMaterialList(this.core.rawRows);
                    
                    // Fill filterCentro
                    const filterCentro = document.getElementById('filterCentro');
                    filterCentro.innerHTML = '<option value="">-- Todos --</option>';
                    Array.from(this.core.centroSet).sort().forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = c;
                        filterCentro.appendChild(opt);
                    });
                    
                    document.getElementById('listMaterialsBtn').disabled = false;
                    document.getElementById('configStockBtn').disabled = false;
                    document.getElementById('generateBtn').disabled = false;
                    document.getElementById('downloadPdfBtn').disabled = true;
                    document.getElementById('downloadExcelBtn').disabled = true;
                } catch(err) {
                    console.error(err);
                    showAlert('Error leyendo archivo: ' + err.message, 'error');
                }
            }.bind(this);
            reader.readAsArrayBuffer(f);
        });

        // Render materials list
        document.getElementById('listMaterialsBtn').addEventListener('click', () => {
            const materialsContainer = document.getElementById('materialsContainer');
            const materialsSection = document.getElementById('materialsSection');
            
            materialsContainer.innerHTML = '';
            materialsSection.classList.remove('hidden');
            
            const centroFilter = document.getElementById('filterCentro').value;
            const matFilter = (document.getElementById('filterMaterial').value || '').toLowerCase();

            this.core.uniqueMaterials.forEach(u => {
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
                editBtn.addEventListener('click', () => this.openStockModalForKeys([u.key]));
                
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
                this.openStockModalForKeys(this.core.uniqueMaterials.map(u => u.key));
            } else {
                this.openStockModalForKeys(checked);
            }
        });

        // Generate report
        document.getElementById('generateBtn').addEventListener('click', () => {
            const checked = Array.from(document.querySelectorAll('.material-checkbox:checked')).map(c => c.dataset.key);
            if (checked.length === 0) { 
                showAlert('Selecciona al menos un material.', 'warning');
                return; 
            }
            
            const missing = checked.filter(k => !this.core.initialStocks[k]);
            if (missing.length > 0) {
                if (!confirm('Falta stock inicial para algunos. Continuar con stock 0?')) return;
                missing.forEach(k => this.core.initialStocks[k] = { 
                    date: this.core.getOldestDateForKey(k) ? this.core.getOldestDateForKey(k).toISOString().slice(0,10) : (new Date().toISOString().slice(0,10)), 
                    stock: 0 
                });
            }
            
            this.core.results = checked.map(k => this.core.analyzeKey(k)).filter(Boolean);
            this.renderResults(this.core.results);
            
            const reportSection = document.getElementById('reportSection');
            reportSection.classList.remove('hidden');
            
            document.getElementById('materialsAnalizados').textContent = this.core.results.map(r => `${r.material} (${r.centro})`).join(', ');
            document.getElementById('downloadPdfBtn').disabled = false;
            document.getElementById('downloadExcelBtn').disabled = false;
        });

        // Download PDF - CORREGIDO para solo exportar la tabla
        document.getElementById('downloadPdfBtn').addEventListener('click', () => {
            if (!this.core.results || this.core.results.length === 0) { 
                showAlert('Genera el reporte primero.', 'warning');
                return; 
            }
            
            // Crear un contenedor específico para el PDF
            const pdfContainer = document.createElement('div');
            pdfContainer.style.padding = '20px';
            pdfContainer.style.background = 'white';
            pdfContainer.style.color = 'black';
            
            // Título del reporte
            const title = document.createElement('h2');
            title.textContent = 'Reporte de Trazabilidad - ' + new Date().toLocaleDateString();
            title.style.textAlign = 'center';
            title.style.marginBottom = '20px';
            title.style.color = '#2196F3';
            pdfContainer.appendChild(title);
            
            // Clonar solo la tabla
            const table = document.querySelector('.inventory-table').cloneNode(true);
            
            // Aplicar estilos para impresión
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.fontSize = '10px';
            
            // Estilos para celdas
            const cells = table.querySelectorAll('th, td');
            cells.forEach(cell => {
                cell.style.border = '1px solid #ddd';
                cell.style.padding = '6px';
                cell.style.textAlign = 'left';
                cell.style.color = 'black';
                cell.style.background = 'white';
            });
            
            // Estilos para encabezados
            const headers = table.querySelectorAll('th');
            headers.forEach(header => {
                header.style.background = '#2196F3';
                header.style.color = 'white';
                header.style.fontWeight = 'bold';
            });
            
            pdfContainer.appendChild(table);
            
            // Información de metadatos
            const meta = document.createElement('div');
            meta.style.marginTop = '20px';
            meta.style.fontSize = '10px';
            meta.style.color = '#666';
            meta.textContent = `Generado el: ${new Date().toLocaleString()} | Materiales analizados: ${this.core.results.length}`;
            pdfContainer.appendChild(meta);
            
            const opt = {
                margin: 0.5,
                filename: `reporte_trazabilidad_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'landscape' 
                }
            };
            
            // Mostrar mensaje de generación
            showAlert('Generando PDF...', 'info');
            
            html2pdf().from(pdfContainer).set(opt).save().then(() => {
                showAlert('PDF generado correctamente', 'success');
            });
        });

        // Download Excel
        document.getElementById('downloadExcelBtn').addEventListener('click', () => {
            if (!this.core.results || this.core.results.length === 0) { 
                showAlert('Genera el reporte primero.', 'warning');
                return; 
            }
            
            const out = this.core.results.map(r => ({
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

        // Inicializar eventos del modal
        initializeModalEvents();
    }

    openStockModalForKeys(keys) {
        const stockModalBody = document.getElementById('stockModalBody');
        stockModalBody.innerHTML = '';
        
        const toEdit = keys.map(k => this.core.uniqueMaterials.find(u => u.key === k)).filter(Boolean);
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
            
            const oldest = this.core.getOldestDateForKey(m.key);
            dateInput.value = oldest ? oldest.toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
            
            const stockLabel = document.createElement('label');
            stockLabel.textContent = 'Stock inicial:';
            stockLabel.style.cssText = 'display: block; color: var(--muted); font-size: 0.85rem; margin-bottom: 5px;';
            
            const stockInput = document.createElement('input');
            stockInput.type = 'number';
            stockInput.step = '0.01';
            stockInput.style.cssText = 'width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: var(--text);';
            
            if (this.core.initialStocks[m.key]) { 
                stockInput.value = this.core.initialStocks[m.key].stock; 
                dateInput.value = this.core.initialStocks[m.key].date; 
            }
            
            wrapper.appendChild(h);
            wrapper.appendChild(dateLabel);
            wrapper.appendChild(dateInput);
            wrapper.appendChild(stockLabel);
            wrapper.appendChild(stockInput);
            wrapper.dataset.key = m.key;
            stockModalBody.appendChild(wrapper);
        });

        document.getElementById('stockModal').classList.remove('hidden');
    }

    renderResults(resultsArr) {
        const reportBody = document.getElementById('reportBody');
        const dateRangeSpan = document.getElementById('reportMeta');
        
        reportBody.innerHTML = '';
        dateRangeSpan.textContent = `Rango de fechas: ${resultsArr.map(r => r.rangoFecha).join(' | ')}`;
        
        resultsArr.forEach(r => {
            const tr = document.createElement('tr');
            
            const td = (txt, cls = '') => {
                const cell = document.createElement('td');
                cell.textContent = (txt === null || txt === undefined) ? '' : txt;
                if (cls) cell.classList.add(cls);
                return cell;
            };
            
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
            
            const stockTd = td(this.core.round2(r.stockActual));
            stockTd.classList.add(r.stockActual < 0 ? 'negative-diff' : 'positive-diff');
            tr.appendChild(stockTd);
            
            reportBody.appendChild(tr);
        });

        this.renderCharts(resultsArr);
    }

    renderCharts(resultsArr) {
        // Destruir gráficos anteriores
        if (this.chart1) this.chart1.destroy();
        if (this.chart2) this.chart2.destroy();

        // Gráfico 1: Tipos de Movimiento por Destino (Barras 3D) - OCUPA TODO EL ANCHO
        const movementTypesData = this.core.getMovementTypesData(resultsArr);
        const ctx1 = document.getElementById('chartMovimientos');
        if (ctx1 && movementTypesData.length > 0) {
            const topMovements = movementTypesData.slice(0, 10); // Mostrar hasta 10 tipos
            
            this.chart1 = new Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: topMovements.map(m => `Mov. ${m.type}`),
                    datasets: [
                        {
                            label: 'Salidas Tienda',
                            data: topMovements.map(m => m.tienda),
                            backgroundColor: 'rgba(33, 150, 243, 0.8)',
                            borderColor: 'rgba(33, 150, 243, 1)',
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                        },
                        {
                            label: 'Salidas Clientes',
                            data: topMovements.map(m => m.cliente),
                            backgroundColor: 'rgba(76, 175, 80, 0.8)',
                            borderColor: 'rgba(76, 175, 80, 1)',
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                font: { 
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: 'var(--text)',
                                padding: 15
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    return `${label}: ${value.toLocaleString()}`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribución por Tipo de Movimiento',
                            font: { size: 16, weight: 'bold' },
                            color: 'var(--text)',
                            padding: 20
                        }
                    },
                    scales: {
                        x: {
                            grid: { 
                                display: false,
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: { 
                                font: { 
                                    size: 11,
                                    weight: 'bold'
                                },
                                color: 'var(--text)',
                                maxRotation: 45,
                                minRotation: 45
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { 
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: { 
                                font: { size: 11 },
                                color: 'var(--text)',
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            },
                            title: {
                                display: true,
                                text: 'Cantidad',
                                font: { size: 12, weight: 'bold' },
                                color: 'var(--text)'
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }

        // Gráfico 2: Distribución Total de Salidas (Dona 3D) - OCUPA TODO EL ANCHO
        const ctx2 = document.getElementById('chartDistribucion');
        if (ctx2) {
            const totalSalidasTienda = resultsArr.reduce((sum, r) => sum + Math.abs(r.totalSalidasTienda), 0);
            const totalSalidasClientes = resultsArr.reduce((sum, r) => sum + Math.abs(r.totalSalidasClientes), 0);

            this.chart2 = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Salidas Tienda', 'Salidas Clientes'],
                    datasets: [{
                        data: [totalSalidasTienda, totalSalidasClientes],
                        backgroundColor: [
                            'rgba(255, 193, 7, 0.9)',
                            'rgba(156, 39, 176, 0.9)'
                        ],
                        borderColor: [
                            'rgba(255, 193, 7, 1)',
                            'rgba(156, 39, 176, 1)'
                        ],
                        borderWidth: 3,
                        borderRadius: 6,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '55%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 15,
                                font: { 
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: 'var(--text)',
                                padding: 20,
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const value = data.datasets[0].data[i];
                                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                            
                                            return {
                                                text: `${label}: ${value.toLocaleString()} (${percentage}%)`,
                                                fillStyle: data.datasets[0].backgroundColor[i],
                                                strokeStyle: data.datasets[0].borderColor[i],
                                                lineWidth: 2,
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
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { size: 13, weight: 'bold' },
                            bodyFont: { size: 12 },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Distribución General de Salidas',
                            font: { size: 16, weight: 'bold' },
                            color: 'var(--text)',
                            padding: 20
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    }
}

window.TrazabilidadSystem = TrazabilidadSystem;
