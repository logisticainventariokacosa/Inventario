/* ====== CONFIG ====== */
const API_URL = 'https://script.google.com/macros/s/AKfycbzGoWmn4doU1_vDqQvWYbqg4WzW8WD6y64lI96xKYn_bGd-L1THgt3HVJJl_BprqpysTA/exec';

const firebaseConfig = {
    apiKey:"AIzaSyDpBoHiKKC7MLQHiWV9psdE3eJ4YuR66GU",
    authDomain:"pagina-dda30.firebaseapp.com",
    projectId:"pagina-dda30",
    appId:"1:14427407275:web:8cba04677fdeef39a088ee"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Variables globales
let currentInventoryResults = [];
let allNewsData = [];

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
 /* ====== FUNCIÓN PARA ALERTAS PERSONALIZADAS - MODAL STYLE ====== */
function showAlert(message, type = 'info', duration = 0) {
    // NO mostrar alertas personalizadas en la sección de login/auth
    const authScreen = document.getElementById('authScreen');
    if (authScreen && !authScreen.classList.contains('hidden')) {
        // Usar alert normal para el login
        alert(message);
        return;
    }
    
    // Crear overlay y modal
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    const modal = document.createElement('div');
    modal.className = `alert-modal alert-${type}`;
    
    // Iconos para cada tipo
    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };
    
    modal.innerHTML = `
        <div class="alert-icon">${icons[type] || icons.info}</div>
        <div class="alert-content">
            <div class="alert-title">${getAlertTitle(type)}</div>
            <div class="alert-message">${message}</div>
        </div>
        <div class="alert-actions">
            <button class="alert-btn alert-btn-primary" id="alertAcceptBtn">Aceptar</button>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Configurar botón de aceptar
    const acceptBtn = document.getElementById('alertAcceptBtn');
    const closeAlert = () => {
        modal.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.remove();
            }
        }, 300);
    };
    
    acceptBtn.addEventListener('click', closeAlert);
    
    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeAlert();
        }
    });
    
    // Cerrar con tecla Escape
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeAlert();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Auto-cierre si se especifica duración
    if (duration > 0) {
        setTimeout(closeAlert, duration);
    }
    
    // Limpiar event listener cuando se cierra
  //  overlay.addEventListener('click', closeAlert);


// Función helper para títulos
function getAlertTitle(type) {
    const titles = {
        'success': 'Éxito',
        'error': 'Error',
        'warning': 'Advertencia',
        'info': 'Información'
    };
    return titles[type] || 'Información';
}

    /* ====== Helpers ====== */
    function getDriveDirectUrl(url) {
        if (!url) return '';
        try {
            if (url.includes('uc?export=view') || url.includes('=export')) return url;
            
            let fileId = '';
            const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/); 
            const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/); 

            if (m1 && m1[1]) {
                fileId = m1[1];
            } else if (m2 && m2[1]) {
                fileId = m2[1];
            }
            
            if (fileId) {
                 return `https://drive.google.com/uc?export=view&id=${fileId}`; 
            }
            return url;
        } catch (e) { return url; }
    }

    function getDriveThumbnailUrl(url, size = 300) {
        if (!url) return '';
        
        let fileId = '';
        const m1 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (m1 && m1[1]) {
            fileId = m1[1];
        } else if (m2 && m2[1]) {
            fileId = m2[1];
        }
        
        if (!fileId && url.includes('uc?export=view')) {
               const m3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
               if (m3 && m3[1]) fileId = m3[1];
        }

        if (fileId) {
               return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`; 
        }

        return url;
    }

    function safeString(v){return v === undefined || v === null ? '' : String(v); }

    function getField(obj, ...keys) {
        for (const k of keys) {
            if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        const lowerMap = {};
        for (const p in obj) lowerMap[p.toLowerCase().replace(/[\s_]+/g, '')] = obj[p];
        for (const k of keys) {
            const low = k.toLowerCase().replace(/[\s_]+/g, ''); 
            if (lowerMap[low] !== undefined) return lowerMap[low];
        }
        return '';
    }

    /* ====== AUTH ====== */
    document.getElementById('togglePasswordBtn').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🔒'; 
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('authScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            document.getElementById('userEmail').textContent = user.email || user.displayName || '';
            loadNews();
            listUploads('documents');
        } else {
            document.getElementById('authScreen').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
        }
    });

    document.getElementById('btnRegister').addEventListener('click', async () => {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const pass = document.getElementById('password').value;
        if (!name || !email || !pass) {
            showAlert('Completa todos los campos.', 'warning', 4000);
            return;
        }
        try {
            const userCred = await auth.createUserWithEmailAndPassword(email, pass);
            await userCred.user.updateProfile({ displayName: name });
            await callApi('registerUser', { user: { nombreDeUsuario: name, email, uid: userCred.user.uid } }); 
            showAlert('Registrado correctamente', 'success', 3000);
        } catch (err) { 
            showAlert(err.message, 'error', 5000);
        }
    });

    document.getElementById('btnLogin').addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim();
        const pass = document.getElementById('password').value;
        try { 
            await auth.signInWithEmailAndPassword(email, pass); 
        } catch (err) { 
            showAlert(err.message, 'error', 5000);
        }
    });

    document.getElementById('btnGoogle').addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            const res = await auth.signInWithPopup(provider);
            const user = res.user;
            await callApi('registerUser', { user: { nombreDeUsuario: user.displayName, email: user.email, uid: user.uid } });
        } catch (err) { 
            showAlert(err.message, 'error', 5000);
        }
    });

    document.getElementById('btnLogout').addEventListener('click', () => auth.signOut());

    /* ====== API Helpers ====== */
    async function getApi(action, params = {}) {
        const q = new URLSearchParams(Object.assign({ action }, params)).toString();
        const res = await fetch(API_URL + '?' + q);
        return res.json();
    }

    async function callApi(action, payload = {}) {
        const isNoCors = (action === 'uploadFile' || action === 'addNews' || action === 'registerUser'); 
        const body = JSON.stringify(Object.assign({ action }, payload));
        if (isNoCors) {
            await fetch(API_URL, { method: 'POST', body, mode: 'no-cors' }); 
            return { ok: true, opaque: true };
        } else {
            const res = await fetch(API_URL, {
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
            return res.json();
        }
    }

    /* ====== INVENTARIO ====== */
    function renderInventoryResults() {
        const out = document.getElementById('searchResults');
        const centroFilter = (document.getElementById('filterCenter')?.value || '').trim().toLowerCase(); 
        
        const filtered = centroFilter 
            ? currentInventoryResults.filter(r =>
                safeString(getField(r, 'Centro_Inventario', 'centroinventario')).toLowerCase().includes(centroFilter))
            : currentInventoryResults;

        if (!filtered.length) {
            out.innerHTML = '<div class="no-results">🔍 Sin resultados para este filtro</div>';
            return;
        }

        const rows = filtered.map(r => {
            const codigo = safeString(getField(r, 'codigo', 'Código', 'code')) || '';
            const nombre = safeString(getField(r, 'nombre', 'Nombre', 'name')) || '';
            const descripcion = safeString(getField(r, 'descripcion', 'Descripción', 'description')) || '';
            const um = safeString(getField(r, 'um', 'UM')) || '';
            const ubic = safeString(getField(r, 'ubicacionFisicaGeneral', 'ubicacion')) || '';
            const cantidad = safeString(getField(r, 'cantidad', 'Cant')) || '';
            const ubicExhib = safeString(getField(r, 'ubicacionExhib', 'ubicacion exhib')) || '';
            const conteo = safeString(getField(r, 'conteoExhb', 'conteo exhb')) || '';
            const fechaUlt = safeString(getField(r, 'fechaUltimoConteo', 'fecha')) || '';
            const auditor = safeString(getField(r, 'ultimoAuditor', 'auditor')) || '';
            const difG = safeString(getField(r, 'difGeneral', 'dif_general')) || '';
            const difE = safeString(getField(r, 'difExhib', 'dif_exhib')) || '';
            const centro = safeString(getField(r, 'Centro_Inventario', 'centroinventario')) || '';
            const nombreDoc = safeString(getField(r, 'Nombre_Documento', 'nombredocumento')) || '';

            const claseDifG = difG.startsWith('-') ? 'class="negative-diff"' : '';
            const claseDifE = difE.startsWith('-') ? 'class="negative-diff"' : '';

            return `<tr>
                <td>${codigo}</td>
                <td>${nombre}</td>
                <td>${descripcion}</td>
                <td>${um}</td>
                <td>${ubic}</td>
                <td>${cantidad}</td>
                <td>${ubicExhib}</td>
                <td>${conteo}</td>
                <td>${fechaUlt}</td>
                <td>${auditor}</td>
                <td ${claseDifG}>${difG}</td>
                <td ${claseDifE}>${difE}</td>
                <td>${centro}</td>
                <td>${nombreDoc}</td>
            </tr>`;
        }).join('');

        out.innerHTML = `<div class="table-container">
        <div class="results-table-container">
            <table class="inventory-table">
                <thead>
                    <tr>
                        <th>Código</th><th>Nombre</th><th>Descripción</th><th>UM</th>
                        <th>Ubicación Física</th><th>Cantidad</th><th>Ubicación Exhib</th><th>Conteo Exhib</th>
                        <th>Fecha Último Conteo</th><th>Auditor</th><th>DIF General</th><th>DIF Exhib</th>
                        <th>Centro Inventario</th><th>Nombre Documento</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
    }

    document.getElementById('btnSearch').addEventListener('click', async () => {
        const code = document.getElementById('searchCode').value.trim();
        if (!code) {
            showAlert('Ingrese un código.', 'warning', 3000);
            return;
        }

        document.getElementById('searchResults').innerHTML = '<div class="loading-results">🔍 Buscando en el inventario...</div>';
        
        const data = await getApi('search', { code });

        if (data && data.results && data.results.length) {
            currentInventoryResults = data.results;
            renderInventoryResults();
        } else {
            currentInventoryResults = [];
            document.getElementById('searchResults').innerHTML = '<div class="no-results">🔍 Sin resultados</div>';
        }
    });

    document.getElementById('searchCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('btnSearch').click();
        }
    });

    document.getElementById('btnFilterCenter').addEventListener('click', renderInventoryResults);
    document.getElementById('filterCenter').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            renderInventoryResults();
        }
    });

    /* ====== UPLOAD ====== */
    async function uploadFile(file, filenameOpt) {
        const base64 = await new Promise(res => {
            const r = new FileReader();
            r.onload = e => res(e.target.result.split(',')[1]);
            r.readAsDataURL(file);
        });
        const uploaderName = auth.currentUser?.displayName || ""; 
        const uploaderEmail = auth.currentUser?.email || "";
        return callApi('uploadFile', {
            filename: filenameOpt || file.name,
            mimeType: file.type,
            base64,
            nombreDeUsuario: uploaderName, 
            uploaderEmail 
        });
    }

    document.getElementById('btnUploadDoc').addEventListener('click', async () => {
        const f = document.getElementById('docFile');
        const name = document.getElementById('docName').value.trim();
        if (!f.files.length) {
            showAlert('Selecciona un archivo', 'warning', 3000);
            return;
        }
        if (!name) {
            showAlert('El nombre del documento es obligatorio', 'warning', 3000);
            return;
        }
        document.getElementById('docStatus').textContent = 'Subiendo...';
        try {
            await uploadFile(f.files[0], name);
            document.getElementById('docStatus').textContent = 'Documento subido. Recargando lista...';
            await listUploads('documents');
            document.getElementById('docStatus').textContent = 'Subido: ' + name;
            document.getElementById('docFile').value = '';
            document.getElementById('docName').value = '';
        } catch (e) {
            document.getElementById('docStatus').textContent = 'Error al subir';
            console.error(e);
        }
    });

    document.getElementById('btnUploadImg').addEventListener('click', async () => {
        const f = document.getElementById('imgFile');
        const name = document.getElementById('imgName').value.trim();
        if (!f.files.length) {
            showAlert('Selecciona una imagen', 'warning', 3000);
            return;
        }
        if (!name) {
            showAlert('El nombre de la imagen es obligatorio', 'warning', 3000);
            return;
        }
        document.getElementById('imgStatus').textContent = 'Subiendo...';
        try {
            await uploadFile(f.files[0], name);
            document.getElementById('imgStatus').textContent = 'Imagen subida. Recargando lista...';
            await listUploads('images');
            document.getElementById('imgStatus').textContent = 'Subido: ' + name;
            document.getElementById('imgFile').value = '';
            document.getElementById('imgName').value = '';
        } catch (e) {
            document.getElementById('imgStatus').textContent = 'Error al subir';
            console.error(e);
        }
    });

    /* ====== FILTROS ====== */
    function resetAllFilters(section) {
        if (section === 'documents') {
            document.getElementById('filterNameDoc').value = '';
            document.getElementById('filterEmailDoc').value = '';
            document.getElementById('filterDateDoc').value = '';
            document.getElementById('filterFileNameDoc').value = '';
            listUploads('documents', false, '', true);
        } else if (section === 'images') {
            document.getElementById('filterNameImg').value = '';
            document.getElementById('filterEmailImg').value = '';
            document.getElementById('filterDateImg').value = '';
            document.getElementById('filterFileNameImg').value = '';
            listUploads('images', false, '', true);
        } else if (section === 'news') {
            document.getElementById('filterNewsTitle').value = '';
            document.getElementById('filterNewsDate').value = '';
            renderNews(allNewsData);
        }
    }

    function resetFilter(targetId, section) {
        document.getElementById(targetId).value = '';
        listUploads(section, false, '', true);
    }

    // Listeners para filtros de documentos
    document.getElementById('btnResetFilterNameDoc').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'documents'));
    document.getElementById('btnResetFilterEmailDoc').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'documents'));
    document.getElementById('btnResetFilterDateDoc').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'documents'));
    document.getElementById('btnResetFilterFileNameDoc').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'documents'));

    // Listeners para filtros de imágenes
    document.getElementById('btnResetFilterNameImg').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'images'));
    document.getElementById('btnResetFilterEmailImg').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'images'));
    document.getElementById('btnResetFilterDateImg').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'images'));
    document.getElementById('btnResetFilterFileNameImg').addEventListener('click', (e) => resetFilter(e.target.dataset.target, 'images'));

    document.getElementById('btnResetAllDoc').addEventListener('click', () => resetAllFilters('documents'));
    document.getElementById('btnResetAllImg').addEventListener('click', () => resetAllFilters('images'));

    document.getElementById('btnFilterDoc').addEventListener('click', () => listUploads('documents', false, '', true));
    document.getElementById('btnFilterImg').addEventListener('click', () => listUploads('images', false, '', true));

    // Enter en filtros de documentos
    document.getElementById('filterNameDoc').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('documents', false, '', true);
    });
    document.getElementById('filterEmailDoc').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('documents', false, '', true);
    });
    document.getElementById('filterDateDoc').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('documents', false, '', true);
    });
    document.getElementById('filterFileNameDoc').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('documents', false, '', true);
    });

    // Enter en filtros de imágenes
    document.getElementById('filterNameImg').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('images', false, '', true);
    });
    document.getElementById('filterEmailImg').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('images', false, '', true);
    });
    document.getElementById('filterDateImg').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('images', false, '', true);
    });
    document.getElementById('filterFileNameImg').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') listUploads('images', false, '', true);
    });

    async function listUploads(section = 'documents', findAndShowName = false, findName = '', showLoading = false) {
        const docList = document.getElementById('docList');
        const imgList = document.getElementById('imgList');

        if (showLoading) {
            if (section === 'documents') {
                docList.innerHTML = '<div class="loading-results">🔍 Filtrando documentos...</div>';
            } else if (section === 'images') {
                imgList.innerHTML = '<div class="loading-results">🔍 Filtrando imágenes...</div>';
            }
        }

        const res = await getApi('listUploads');
        const docs = res.docs || [];
        const imgs = res.imgs || [];

        let nameFilter, emailFilter, dateFilter, fileNameFilter;

        if (section === 'documents') {
            nameFilter = (document.getElementById('filterNameDoc')?.value || '').trim().toLowerCase();
            emailFilter = (document.getElementById('filterEmailDoc')?.value || '').trim().toLowerCase();
            dateFilter = (document.getElementById('filterDateDoc')?.value || '').trim();
            fileNameFilter = (document.getElementById('filterFileNameDoc')?.value || '').trim().toLowerCase();
        } else if (section === 'images') {
            nameFilter = (document.getElementById('filterNameImg')?.value || '').trim().toLowerCase();
            emailFilter = (document.getElementById('filterEmailImg')?.value || '').trim().toLowerCase();
            dateFilter = (document.getElementById('filterDateImg')?.value || '').trim();
            fileNameFilter = (document.getElementById('filterFileNameImg')?.value || '').trim().toLowerCase();
        } else {
            nameFilter = ''; emailFilter = ''; dateFilter = ''; fileNameFilter = '';
        }
        
        const filterFn = x => {
            const n = (x.uploaderName || '').toString().toLowerCase();
            const e = (x.uploaderEmail || '').toString().toLowerCase();
            const f = (x.name || '').toString().toLowerCase();
            return (
                (!nameFilter || n.includes(nameFilter)) && 
                (!emailFilter || e.includes(emailFilter)) && 
                (!dateFilter || x.date === dateFilter) &&
                (!fileNameFilter || f.includes(fileNameFilter))
            );
        };

        const filteredDocs = docs.filter(filterFn);
        const filteredImgs = imgs.filter(x => {
            if (x.name && x.name.startsWith('NEWS_')) return false;
            return filterFn(x);
        });

        // Render documentos
        if (filteredDocs.length) {
            docList.innerHTML = filteredDocs.map(d => {
                const direct = getDriveDirectUrl(d.url); 
                return `<div class="card-item">
                    <div style="flex:0 0 auto">
                        <a href="${direct}" target="_blank" style="font-weight:bold;color:#cce;font-size:1.1rem">${d.name}</a>
                    </div>
                    <div style="font-size:0.8rem;color:var(--muted);margin-top:10px">
                        📅 ${safeString(d.date)}<br>👤 ${safeString(d.uploaderName) || 'Sin nombre'}<br>✉️ ${safeString(d.uploaderEmail) || 'Sin correo'}
                    </div>
                </div>`;
            }).join('');
        } else {
            docList.innerHTML = '<div class="no-results">Sin documentos</div>';
        }

        // Render imágenes
        if (filteredImgs.length) {
            imgList.innerHTML = filteredImgs.map(i => {
                const thumbnail = getDriveThumbnailUrl(i.url, 400); 
                const directUrl = getDriveDirectUrl(i.url); 
                
                return `<div class="card-item">
                    <a href="${directUrl}" target="_blank" style="display:block">
                        <img loading="lazy" src="${thumbnail}" alt="${i.name}" class="card-item-img"
                            onerror="this.onerror=null;this.style.display='none';this.insertAdjacentHTML('afterend','<div class=&quot;placeholder&quot;>Sin miniatura</div>');"
                        />
                    </a>
                    <div style="margin-top:5px;font-weight:bold;color:#ccc;font-size:1.1rem">${i.name}</div>
                    <div style="font-size:0.8rem;color:var(--muted);margin-top:6px">
                        📅 ${safeString(i.date)}<br>👤 ${safeString(i.uploaderName) || 'Sin nombre'}<br>✉️ ${safeString(i.uploaderEmail) || 'Sin correo'}
                    </div>
                </div>`;
            }).join('');
        } else {
            imgList.innerHTML = '<div class="no-results">Sin imágenes</div>';
        }

        if (findAndShowName && findName) {
            const allFiles = [...docs, ...imgs];
            const found = allFiles.find(x => x.name === findName);
            if (found) {
                const directUrl = getDriveDirectUrl(found.url);
                const isImg = (found.mime && found.mime.toLowerCase().startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(found.name);
                if (isImg) document.getElementById('imgStatus').innerHTML = `Subida: <a href="${directUrl}" target="_blank">Abrir</a>`;
                else document.getElementById('docStatus').innerHTML = `Subido: <a href="${directUrl}" target="_blank">Abrir</a>`;
            } else {
                document.getElementById('imgStatus').textContent = '';
                document.getElementById('docStatus').textContent = '';
            }
        }
    }

    /* ====== NOTICIAS ====== */
    document.getElementById('btnToggleNewsForm').addEventListener('click', () => {
        document.getElementById('createNewsForm').classList.toggle('hidden');
        if (!document.getElementById('createNewsForm').classList.contains('hidden')) {
            document.getElementById('newsTitle').value = '';
            document.getElementById('newsContent').value = '';
            document.getElementById('newsImgFile').value = '';
            document.getElementById('newsStatus').textContent = '';
        }
    });

    document.getElementById('btnCancelNews').addEventListener('click', () => {
        document.getElementById('createNewsForm').classList.add('hidden');
    });

    document.getElementById('btnUploadNews').addEventListener('click', async () => {
        const title = document.getElementById('newsTitle').value.trim();
        const content = document.getElementById('newsContent').value.trim();
        const imgFile = document.getElementById('newsImgFile').files[0];
        const status = document.getElementById('newsStatus');

        if (!title || !content) {
            showAlert('El Título y el Contenido son obligatorios.', 'warning', 4000);
            return;
        }

        status.textContent = 'Subiendo noticia...';
        let imageUrl = '';

        try {
            if (imgFile) {
                status.textContent = 'Subiendo imagen...';
                const imgName = `NEWS_${Date.now()}_${imgFile.name}`; 
                await uploadFile(imgFile, imgName);
                const listRes = await getApi('listUploads');
                const uploadedImg = (listRes.imgs || []).find(x => x.name === imgName);
                if (uploadedImg && uploadedImg.url) imageUrl = uploadedImg.url;
            }
            
            status.textContent = 'Publicando noticia..';
            const newsData = { titulo: title, contenido: content, imagenUrl: imageUrl };
            await callApi('addNews', { news: newsData });
            status.textContent = '✅ Noticia publicada exitosamente. Recargando lista...';
            document.getElementById('createNewsForm').classList.add('hidden');
            await loadNews();
        } catch (e) {
            status.textContent = '❌ Error al publicar la noticia.';
            console.error(e);
        }
    });

    function renderNews(newsArray) {
        const main = document.getElementById('mainNews');
        const list = document.getElementById('newsList');

        if (newsArray.length === 0) {
            main.innerHTML = '<div class="no-results">No se han publicado noticias.</div>';
            list.innerHTML = '';
            return;
        }

        const n = newsArray[0];
        const imgUrl = getDriveThumbnailUrl(safeString(n.imagenUrl), 300); 
        const directLink = getDriveDirectUrl(safeString(n.imagenUrl));

        main.innerHTML = `
            <div class="news-image-area">
                ${imgUrl 
                    ? `<a href="${directLink}" target="_blank"><img loading="lazy" src="${imgUrl}" alt="noticia" class="news-card-img" 
                        onerror="this.style.display='none'; this.alt='No image'"></a>` 
                    : ''}
                <div class="news-meta-data">
                    📅 ${safeString(n.fecha)}
                </div>
            </div>
            <div class='news-content-area'>
                <h3>${safeString(n.titulo)}</h3>
                <p style="margin-top:10px">${safeString(n.contenido)}</p>
            </div>
            `; 

        list.innerHTML = newsArray.map(x => {
            const thumb = getDriveThumbnailUrl(safeString(x.imagenUrl), 200); 
            const directLinkItem = getDriveDirectUrl(safeString(x.imagenUrl));
            
            return `<div class="item">
                <a href="${directLinkItem}" target="_blank">
                ${thumb
                    ? `<img loading="lazy" src="${thumb}" alt="${safeString(x.titulo)}" class="news-list-thumb"
                        onerror="this.style.display='none'; this.alt='No image'">`
                    : ''}
                </a>
                <div>
                    <strong>${safeString(x.titulo)}</strong>
                    <small>${safeString(x.fecha)}</small>
                    <p>${safeString(x.contenido)}</p> 
                </div>
            </div>`;
        }).join('');
    }

    async function loadNews(){
        const res = await getApi('listNews');
        allNewsData = (res && res.news && res.news.length) ? res.news : [];
        renderNews(allNewsData);
    }

    function filterNews() {
        const titleFilter = (document.getElementById('filterNewsTitle')?.value || '').trim().toLowerCase();
        const dateFilter = (document.getElementById('filterNewsDate')?.value || '').trim();

        const filteredNews = allNewsData.filter(n => {
            const title = (n.titulo || '').toString().toLowerCase();
            const date = (n.fecha || '').toString().trim();
            return ((!titleFilter || title.includes(titleFilter)) && (!dateFilter || date.startsWith(dateFilter)));
        });

        renderNews(filteredNews);
    }

    document.getElementById('btnFilterNews').addEventListener('click', filterNews);
    document.getElementById('filterNewsTitle').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filterNews();
    });
    document.getElementById('filterNewsDate').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') filterNews();
    });

    document.getElementById('btnResetFilterNewsTitle').addEventListener('click', (e) => {
        document.getElementById(e.target.dataset.target).value = '';
        filterNews(); 
    });

    document.getElementById('btnResetFilterNewsDate').addEventListener('click', (e) => {
        document.getElementById(e.target.dataset.target).value = '';
        filterNews(); 
    });

    document.getElementById('btnResetNewsAll').addEventListener('click', () => {
        document.getElementById('filterNewsTitle').value = '';
        document.getElementById('filterNewsDate').value = '';
        renderNews(allNewsData);
    });

    /* ====== NAVEGACIÓN ====== */
    document.querySelectorAll('.nav a').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            
            document.querySelectorAll('.nav a').forEach(n => n.classList.remove('active'));
            a.classList.add('active');
            
            const target = a.dataset.section;
            document.querySelectorAll('.section').forEach(s => {
                s.classList.remove('active-section');
            });
            document.getElementById(target).classList.add('active-section');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            const container = document.querySelector('.container');
            if (container) container.scrollTop = 0;
            
            if (target === 'documents') listUploads('documents'); 
            if (target === 'images') listUploads('images');
            if (target === 'home') loadNews();
            
            if (target === 'home') {
                setTimeout(function() {
                    const searchCodeInput = document.getElementById('searchCode');
                    if (searchCodeInput) searchCodeInput.focus();
                }, 100);
            }
        });
    });

    /* ====== CONTACTO ====== */
    document.getElementById('waBtn').href = "https://wa.me/4129915255?text=Hola%20";
    document.getElementById('mailBtn').href = "mailto:derwins.rojas@kacosa.com";

    /* ====== INICIALIZACIÓN ====== */
    setTimeout(() => {
        if (auth.currentUser) { 
            listUploads('documents'); 
            listUploads('images'); 
            loadNews(); 
        }
    }, 800);

    /* ====== AUTO-FOCUS ====== */
    function focusSearchField() {
        const searchCodeInput = document.getElementById('searchCode');
        if (searchCodeInput && document.getElementById('home').classList.contains('active-section')) {
            searchCodeInput.focus();
            setTimeout(() => { searchCodeInput.focus(); }, 500);
        }
    }

    setTimeout(focusSearchField, 300);

    /* ====== LIMPIAR RESULTADOS ====== */
    document.getElementById('searchCode').addEventListener('input', function() {
        const code = this.value.trim();
        if (!code) {
            currentInventoryResults = [];
            document.getElementById('searchResults').innerHTML = '';
        }
    });

    document.getElementById('filterCenter').addEventListener('input', function() {
        const filterValue = this.value.trim();
        if (!filterValue && currentInventoryResults.length > 0) {
            renderInventoryResults();
        }
    });

    document.getElementById('filterFileNameDoc').addEventListener('input', function() {
        const filterValue = this.value.trim();
        if (!filterValue) listUploads('documents', false, '', true);
    });

    document.getElementById('filterFileNameImg').addEventListener('input', function() {
        const filterValue = this.value.trim();
        if (!filterValue) listUploads('images', false, '', true);
    });
}
