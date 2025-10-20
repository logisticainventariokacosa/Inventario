<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Logística & Inventario</title>
    
  <style>
/* === VARIABLES DE DISEÑO Y RESET === */
:root{
    --red:#c62828;--black:#121212;--bg:#0f0f0f;
    --text:#fafafa;--muted:#bdbdbd;--card-bg:#161616;
    --card-news:#1b0f0f;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{
    font-family:Inter,system-ui, Arial;
    background:linear-gradient(180deg,var(--bg),#070707);
    color:var(--text);
    min-height:100vh;
    line-height:1.5; /* Mejora la legibilidad */
}

/* === AUTH SCREEN === */
.auth-screen{display:flex;align-items:center;justify-content:center;height:100vh;padding:16px}
.card.auth-card{background:linear-gradient(180deg,#1a1a1a,#0f0f0f);border-radius:12px;padding:28px;width:100%;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,0.04);text-align:center}
.auth-card h1{margin-bottom:6px;font-size:22px}.muted{color:var(--muted)}
.auth-card input{width:100%;padding:10px 12px;margin:8px 0;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:var(--text)}
.row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
button{background:var(--red);border:0;padding:10px 14px;border-radius:10px;color:white;cursor:pointer;transition:transform .12s, box-shadow .12s}
button.alt{background:transparent;border:1px solid rgba(255,255,255,0.08)}button.google{background:#fff;color:#222}
button:hover{transform:translateY(-3px);box-shadow:0 10px 20px rgba(198,40,40,0.12)}
.hidden{display:none}

/* === TOPBAR / NAV MODIFICADO === */
.topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:linear-gradient(90deg,rgba(0,0,0,0.8),rgba(18,18,18,0.9));border-bottom:1px solid rgba(255,255,255,0.03);position:sticky;top:0;z-index:100}
.brand{font-weight:700;color:var(--red);margin-right:10px;font-size:1.1rem}
.nav{display:flex;align-items:center;gap:16px;flex:1;justify-content:space-between;flex-wrap:wrap}

/* Estilo de los botones de navegación */
.nav.menu{display:flex;gap:4px;flex-wrap:wrap;align-items:center}

/* REGLA CRÍTICA: Asegura color blanco y sin subrayado en todos los estados */
/* ✅ CORRECCIÓN: Se cambió el selector de .nav.menu a .nav .menu para que funcione con la estructura HTML de DIV dentro de NAV */
.nav .menu a, /* SELECTOR CORREGIDO: Espacio entre .nav y .menu */
.nav .menu a:visited,
.nav .menu a:link { /* Añadido :link para máxima compatibilidad con el color blanco */
    color:var(--text) !important; /* Fuerza el color blanco */
    text-decoration:none !important; /* Fuerza la eliminación del subrayado */
    
    padding:8px 12px; 
    border-radius:8px;
    transition:background .2s, color .2s, box-shadow .2s;
    position:relative;
    font-weight:500;
}

/* Estilo para el botón hover (al pasar el ratón) */
/* ✅ CORRECCIÓN: Se cambió el selector de .nav.menu a .nav .menu */
.nav .menu a:hover{ 
    color:var(--red) !important; /* El hover ahora se ve rojo */
    background:rgba(255, 255, 255, 0.05);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
}

/* Estilo para el botón activo (sección actual) */
/* ✅ CORRECCIÓN: Se cambió el selector de .nav.menu a .nav .menu */
.nav .menu a.active{
    color:var(--red) !important; 
    font-weight:700;
    background:rgba(198, 40, 40, 0.1); 
    border: 1px solid rgba(198, 40, 40, 0.3);
    box-shadow: 0 0 10px rgba(198, 40, 40, 0.3); 
}

.nav.user-info{display:flex;align-items:center;gap:10px}
.user-info span{color:var(--muted);font-size:0.95rem;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.06);padding:8px 10px;border-radius:8px;color:var(--muted);transition:background .2s}
.ghost:hover{background:rgba(255,255,255,0.1)}

/* === CONTENIDO PRINCIPAL === */
.container{padding:20px;display:grid;grid-template-columns:1fr;gap:20px}
.section{display:none}.active-section{display:block}

.search-card{background:var(--card-bg);padding:20px;border-radius:12px;border:1px solid rgba(255,255,255,0.03);box-shadow:0 4px 12px rgba(0,0,0,0.2)}
.search-card h2{margin-bottom:12px}
.search-card input{flex:1;padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:var(--text);transition:border-color .2s}
.search-card input:focus{border-color:var(--red);outline:none}
.search-card.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.results{margin-top:16px;background:rgba(255,255,255,0.02);border-radius:8px;min-height:40px;overflow-x:auto}
.results table{width:100%;border-collapse:collapse;min-width: 800px;}
.results th,.results td{padding:10px 8px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:left;vertical-align:middle;font-size:0.9rem}
.results th{color:var(--red);white-space:nowrap;font-weight:600;background:rgba(0,0,0,0.1)}
.results tr:last-child td{border-bottom:none}

/* === GRID GENERAL (Documentos e Imágenes) MODIFICADO === */
.grid{
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); /* Mínimo 280px para más columnas */
    gap:15px;
    margin-top:15px;
}
.card-item{
    background:var(--card-bg);
    padding:15px;
    border-radius:12px;
    text-align:center;
    min-height:180px;
    display:flex;
    flex-direction:column;
    justify-content:flex-start;
    border:1px solid rgba(255,255,255,0.05);
    transition:transform .2s, box-shadow .2s;
}
.card-item:hover{
    transform:translateY(-5px);
    box-shadow:0 10px 20px rgba(0,0,0,0.4);
}
.card-item img{
    max-width:100%;
    border-radius:8px;
    height:160px; /* Un poco más grande */
    object-fit:cover;
    background:#111;
    margin-bottom:10px;
    transition:opacity .2s;
}
.card-item a{text-decoration:none}
.card-item a:hover img{opacity:0.9}

/* === NOTICIAS (Sección Inicio) MODIFICADO === */
.news-card-wrapper{
    display:grid;
    grid-template-columns:1fr; /* Por defecto 1 columna */
    gap:15px;
    padding:15px;
    background:var(--card-news);
    border-radius:12px;
    border:1px solid rgba(198,40,40,0.08);
    box-shadow:0 4px 12px rgba(0,0,0,0.2);
    margin-top:20px;
}
.news-card-wrapper h3{
    color:var(--red);
    margin-bottom:5px;
    font-size:1.4rem;
}
.news-image-area{
    text-align:center;
    display:flex;
    flex-direction:column;
    gap:5px;
    align-items:flex-start;
}
.news-image-area img{
    width:100%;
    max-width:280px;
    height:auto;
    max-height:180px;
    object-fit:cover;
    border-radius:8px;
    margin:0; /* Se elimina el margen inferior */
}
.news-meta-data{
    font-size:12px;
    color:var(--muted);
    text-align:left;
}
.news-content-area{
    /* Estilos de contenido */
}

/* Desktop: Main News a 2 columnas */
@media(min-width:900px){
    .container{grid-template-columns:1fr 420px}
    .search-card{grid-column:1}
    .news-card-wrapper{
        grid-column:1 / span 2; /* Ocupa ambas columnas si es necesario */
        grid-template-columns: auto 1fr; /* Imagen y meta a la izq, Contenido a la derecha */
        align-items: flex-start;
    }
    .news-image-area {
        max-width: 300px;
    }
}
@media(min-width:1200px){
     .news-card-wrapper{
        grid-template-columns: 280px 1fr; /* Más espacio para la imagen */
     }
}

/* === NOTICIAS (Sección Noticias) MODIFICADO === */
.news-list .item{
    padding:15px;
    border-radius:12px;
    margin:12px 0;
    background:var(--card-bg);
    border:1px solid rgba(255,255,255,0.05);
    display:grid;
    grid-template-columns:1fr;
    gap:10px;
    align-items:flex-start;
}
.news-list .item strong{color:var(--red);font-size:1.1rem}
.news-list .item small{color:var(--muted);display:block;margin-bottom:8px}
.news-list .item p{margin-top:0;font-size:0.95rem}
.news-list .item img{
    width:100%;
    max-width:200px;
    height:120px;
    object-fit:cover;
    border-radius:8px;
    float:left; /* Para que el texto envuelva la imagen en móvil */
    margin-right:10px;
    margin-bottom:5px;
}

/* Desktop: Lista de noticias a 2 columnas */
@media(min-width:768px){
    .news-list .item{
        grid-template-columns: auto 1fr; /* Imagen y texto en línea */
    }
    .news-list .item img{
        max-width:180px;
        height:100px;
        float:none; /* Desactivar float */
        margin-right:0;
    }
    .news-list .item div:first-of-type{
        /* Contenedor de meta y contenido */
        display: flex;
        flex-direction: column;
        padding-left: 10px;
    }
}


/* Placeholder/Inputs/Botones */
.placeholder{
    width:100%;
    height:160px;
    display:flex;
    align-items:center;
    justify-content:center;
    background:#0b0b0b;
    color:var(--muted);
    border-radius:8px;
    font-size:14px;
}
input[type=file]{color:var(--muted);margin:8px 0}
.contact-buttons a{display:inline-block;margin:6px 12px 6px 0;padding:10px 14px;background:var(--red);border-radius:10px;color:#fff;text-decoration:none}
.filter-controls{
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-bottom:15px;
}
.filter-controls input{
    flex:1;
    padding:8px 10px;
    border-radius:8px;
    border:1px solid rgba(255,255,255,0.08);
    background:rgba(255,255,255,0.02);
    color:var(--text);
    min-width:150px;
}


/* === MOBILE ADJUSTMENTS === */
@media(max-width:640px){
    .nav{flex-direction:column;align-items:flex-start;gap:8px}
    .nav.menu{flex-wrap:wrap;justify-content:center;width:100%;gap:10px}
    .nav.user-info{width:100%;justify-content:space-between;margin-top:10px}
    .card-item{min-height:160px;padding:14px}
    .results th{font-size:13px}
    .news-card-wrapper{
        grid-template-columns: 1fr; /* Volver a una columna en móvil */
    }
    .news-image-area img{
         max-width:100%;
         height:auto;
    }
    .news-list .item img{
        float:none;
    }
    .filter-controls{flex-direction:column}
    .filter-controls input{width:100%}
}

/* === RESPONSIVE === */
@media(max-width:640px){
    .nav{flex-direction:column;align-items:flex-start;gap:8px}
    .nav.menu{flex-wrap:wrap;justify-content:center;width:100%}
    .nav.user-info{width:100%;justify-content:space-between;margin-top:10px}
    .news-card-wrapper{grid-template-columns:1fr}
}
</style>

    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
</head>
<body>
<div id="app">
    <div class="auth-screen" id="authScreen">
        <div class="card auth-card">
            <h1>Logística & Inventario</h1>
            <p class="muted">Accede para información</p>
            <input id="name" placeholder="Nombre"/>
            <input id="email" placeholder="Correo" type="email"/>
            <input id="password" placeholder="Contraseña" type="password"/>
            <div class="row">
                <button id="btnRegister">Registrarse</button>
                <button id="btnLogin" class="alt">Iniciar sesión</button>
            </div>
            <br>
            <div class="row">
                <button id="btnGoogle" class="google">👤 Iniciar con Google</button>
            </div>
            <br>
            <p class="muted small">Los datos se guardarán en el sistema.</p>
        </div>
    </div>

    <div id="mainApp" class="hidden">
        <header class="topbar">
            <div style="display:flex;align-items:center;gap:10px">
                <div class="brand">Logística & Inventario</div>
            </div>

            <nav class="nav" aria-label="main navigation">
                <div class="menu">
                    <a href="#" data-section="home" class="active">Inicio</a>
                    <a href="#" data-section="documents">Documentos</a>
                    <a href="#" data-section="images">Imágenes</a>
                    <a href="#" data-section="news">Noticias</a>
                    <a href="#" data-section="contact">Contacto</a>
                </div>
                <div class="user-info">
                    <span id="userEmail"></span>
                    <button id="btnLogout" class="ghost">Cerrar sesión</button>
                </div>
            </nav>
        </header>

        <main class="container">
            <section id="home" class="section active-section">
                <div class="search-card">
                    <h2>Buscar código en inventario</h2>
                    <div class="row" style="margin-top:8px">
                        <input id="searchCode" placeholder="Ingrese código..." />
                        <button id="btnSearch">Buscar</button>
                    </div>
                    <div id="searchResults" class="results"></div>
                </div>
                <div class="news-card-wrapper" id="mainNews"></div>
            </section>

            <section id="documents" class="section">
                <h2>Documentos</h2>
                <input type="file" id="docFile"/>
                <input id="docName" placeholder="Nombre del archivo (obligatorio)" />
                <br>
                <br>
                <button id="btnUploadDoc">Subir documento</button>
                <div id="docStatus"></div>
                
                <h3 style="margin-top:30px;margin-bottom:15px">Archivos subidos</h3>
                <div class="filter-controls">
                    <input id="filterNameDoc" placeholder="Filtrar por nombre de usuario" />
                    <input id="filterEmailDoc" placeholder="Filtrar por correo" />
                    <input id="filterDateDoc" placeholder="Filtrar por fecha (dd/mm/yyyy)" />
                    <button id="btnFilterDoc">Filtrar</button>
                </div>
                <div id="docList" class="grid"></div>
            </section>

            <section id="images" class="section">
                <h2>Imágenes</h2>
                <input type="file" id="imgFile" accept="image/*"/>
                <input id="imgName" placeholder="Nombre de la imagen (obligatorio)" />
                <br>
                <br>
                <button id="btnUploadImg">Subir imagen</button>
                <div id="imgStatus"></div>
                
                <h3 style="margin-top:30px;margin-bottom:15px">Imágenes subidas</h3>
                <div class="filter-controls">
                    <input id="filterNameImg" placeholder="Filtrar por nombre de usuario" />
                    <input id="filterEmailImg" placeholder="Filtrar por correo" />
                    <input id="filterDateImg" placeholder="Filtrar por fecha (dd/mm/yyyy)" />
                    <button id="btnFilterImg">Filtrar</button>
                </div>
                <div id="imgList" class="grid"></div>
            </section>

            <section id="news" class="section">
                <h2>Noticias</h2>
                <div id="newsList" class="news-list"></div>
            </section>

            <section id="contact" class="section">
                <h2>Contacto</h2>
                <div class="contact-buttons">
                    <a id="waBtn" target="_blank">WhatsApp</a>
                    <a id="mailBtn" href="#">Correo</a>
                </div>
            </section>
        </main>
    </div>
</div>
<script>
/* ====== CONFIG ====== */
const API_URL = 'https://script.google.com/macros/s/AKfycbw4GOMG_ZKUxDNdp2yS2qSp6YJmGhK4WMr1NvCkqlrL5-qexvGAH-WB68GYzYmM6d7PGA/exec';

const firebaseConfig = {
    apiKey:"AIzaSyDpBoHiKKC7MLQHiWV9psdE3eJ4YuR66GU",
    authDomain:"pagina-dda30.firebaseapp.com",
    projectId:"pagina-dda30",
    appId:"1:14427407275:web:8cba04677fdeef39a088ee"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* ====== Helpers (SIN CAMBIOS EN LA LÓGICA DE URLS) ====== */

function getDriveDirectUrl(url)
{
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
    for (const k of keys)
    {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    const lowerMap = {};
    for (const p in obj) lowerMap[p.toLowerCase().replace(/[\s_]+/g, '')] = obj[p];
    for (const k of keys)
    {
        const low = k.toLowerCase().replace(/[\s_]+/g, ''); 
        if (lowerMap[low] !== undefined) return lowerMap[low];
    }
    return '';
}

/* ====== AUTH (SIN CAMBIOS) ====== */
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('userEmail').textContent = user.email || user.displayName || '';
        loadNews();
        listUploads('documents');
    } else
    {
        document.getElementById('authScreen').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
    }
});

document.getElementById('btnRegister').addEventListener('click', async () =>
{
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if (!name || !email || !pass) return alert('Completa todos los campos.');
    try
    {
        const userCred = await auth.createUserWithEmailAndPassword(email, pass);
        await userCred.user.updateProfile({ displayName: name });
        await callApi('registerUser', { user: { nombreDeUsuario: name, email, uid: userCred.user.uid } }); 
        alert('Registrado correctamente');
    } catch (err) { alert(err.message); }
});
document.getElementById('btnLogin').addEventListener('click', async () =>
{
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    try
    { await auth.signInWithEmailAndPassword(email, pass); } catch (err) { alert(err.message); }
});
document.getElementById('btnGoogle').addEventListener('click', async () =>
{
    const provider = new firebase.auth.GoogleAuthProvider();
    try
    {
        const res = await auth.signInWithPopup(provider);
        const user = res.user;
        await callApi('registerUser', { user: { nombreDeUsuario: user.displayName, email: user.email, uid: user.uid } });
    } catch (err) { alert(err.message); }
});
document.getElementById('btnLogout').addEventListener('click',
    () => auth.signOut());

/* ====== API Helpers (SIN CAMBIOS) ====== */
async function getApi(action, params = {}) {
    const q = new URLSearchParams(Object.assign({ action }, params)).toString();
    const res = await fetch(API_URL + '?' + q);
    return res.json();
}
async function callApi(action, payload = {}) {
    const isUpload = action === 'uploadFile';
    const body = JSON.stringify(Object.assign({ action }, payload));
    if (isUpload) {
        await fetch(API_URL, { method: 'POST', body, mode: 'no-cors' });
        return { ok: true, opaque: true };
    } else
    {
        const res = await fetch(API_URL,
            {
                method:'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });
        return res.json();
    }
}

/* ====== BUSCAR CÓDIGO (SIN CAMBIOS) ====== */
document.getElementById('btnSearch').addEventListener('click', async () =>
{
    const code = document.getElementById('searchCode').value.trim();
    if (!code) return alert('Ingrese un código.');
    const data = await getApi('search', { code });
    const out = document.getElementById('searchResults');

    if (data && data.results && data.results.length)
    {
        const rows = data.results.map(r => {
            const codigo = safeString(getField(r, 'codigo', 'Código', 'code')) || '';
            const nombre = safeString(getField(r, 'nombre', 'Nombre', 'name')) || '';
            const descripcion = safeString(getField(r, 'descripcion', 'Descripción', 'description')) || '';
            const um = safeString(getField(r, 'um', 'UM')) || '';
            const ubic = safeString(getField(r, 'ubicacionFisicaGeneral', 'ubicacion fisica general', 'ubicacion', 'ubicaciongeneral')) || '';
            const cantidad = safeString(getField(r, 'cantidad', 'Cant')) || '';
            const ubicExhib = safeString(getField(r, 'ubicacionExhib', 'ubicacion exhib')) || '';
            const conteo = safeString(getField(r, 'conteoExhb', 'conteo exhb', 'conteo_exhb')) || '';
            const fechaUlt = safeString(getField(r, 'fechaUltimoConteo', 'fecha ultimo conteo', 'fecha')) || '';
            const auditor = safeString(getField(r, 'ultimoAuditor', 'ultimo auditor en contar', 'ultimo auditor')) || '';
            const difG = safeString(getField(r, 'difGeneral', 'dif_general')) || '';
            const difE = safeString(getField(r, 'difExhib', 'dif_exhib')) || '';

            return `<tr>
                <td style="min-width:120px">${codigo}</td>
                <td>${nombre}</td>
                <td>${descripcion}</td>
                <td>${um}</td>
                <td>${ubic}</td>
                <td>${cantidad}</td>
                <td>${ubicExhib}</td>
                <td>${conteo}</td>
                <td>${fechaUlt}</td>
                <td>${auditor}</td>
                <td>${difG}</td>
                <td>${difE}</td>
            </tr>`;
        }).join('');

        out.innerHTML = `<table class="results-table">
            <thead>
                <tr>
                    <th>Código</th><th>Nombre</th><th>Descripción</th><th>UM</th>
                    <th>Ubicación Física</th><th>Cantidad</th><th>Ubicación Exhib</th><th>Conteo Exhib</th>
                    <th>Fecha Último Conteo</th><th>Auditor</th><th>DIF General</th><th>DIF Exhib</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`;
    } else
    {
        out.innerHTML = '<div class="muted">Sin resultados</div>';
    }
});

/* ====== UPLOAD helpers (SIN CAMBIOS) ====== */
async function uploadFile(file, filenameOpt) {
    const base64 = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result.split(',')[1]);
        r.readAsDataURL(file);
    });
    const uploaderName = auth.currentUser?.displayName || ""; 
    const uploaderEmail = auth.currentUser?.email || "";
    return callApi('uploadFile',
        {
            filename: filenameOpt || file.name,
            mimeType: file.type,
            base64,
            nombreDeUsuario: uploaderName, 
            uploaderEmail 
        });
}

/* Subir documento (SIN CAMBIOS) */
document.getElementById('btnUploadDoc').addEventListener('click', async () =>
{
    const f = document.getElementById('docFile');
    const name = document.getElementById('docName').value.trim();
    if (!f.files.length) return alert('Selecciona un archivo');
    if (!name) return alert('El nombre del documento es obligatorio');
    document.getElementById('docStatus').textContent = 'Subiendo...';
    try
    {
        await uploadFile(f.files[0], name);
        document.getElementById('docStatus').textContent = 'Documento subido. Recargando lista...';
        await listUploads('documents');
        document.getElementById('docStatus').textContent = 'Subido: ' + name;
    } catch (e) {
        document.getElementById('docStatus').textContent = 'Error al subir';
        console.error(e);
    }
});

/* Subir imagen (SIN CAMBIOS) */
document.getElementById('btnUploadImg').addEventListener('click', async () =>
{
    const f = document.getElementById('imgFile');
    const name = document.getElementById('imgName').value.trim();
    if (!f.files.length) return alert('Selecciona una imagen');
    if (!name) return alert('El nombre de la imagen es obligatorio');
    document.getElementById('imgStatus').textContent = 'Subiendo...';
    try
    {
        await uploadFile(f.files[0], name);
        document.getElementById('imgStatus').textContent = 'Imagen subida. Recargando lista...';
        await listUploads('images');
        document.getElementById('imgStatus').textContent = 'Subido: ' + name;
    } catch (e) {
        document.getElementById('imgStatus').textContent = 'Error al subir';
        console.error(e);
    }
});

/* ====== Listado / Render archivos e imágenes (SIN CAMBIOS EN LÓGICA, SOLO UI) ====== */

document.getElementById('btnFilterDoc').addEventListener('click', () => listUploads('documents'));
document.getElementById('btnFilterImg').addEventListener('click', () => listUploads('images'));


async function listUploads(section = 'documents', findAndShowName = false, findName = '')
{
    const res = await getApi('listUploads');
    const docs = res.docs || [];
    const imgs = res.imgs || [];

    let nameFilter, emailFilter, dateFilter;

    if (section === 'documents') {
        nameFilter = (document.getElementById('filterNameDoc')?.value || '').trim().toLowerCase();
        emailFilter = (document.getElementById('filterEmailDoc')?.value || '').trim().toLowerCase();
        dateFilter = (document.getElementById('filterDateDoc')?.value || '').trim();
    } else if (section === 'images') {
        nameFilter = (document.getElementById('filterNameImg')?.value || '').trim().toLowerCase();
        emailFilter = (document.getElementById('filterEmailImg')?.value || '').trim().toLowerCase();
        dateFilter = (document.getElementById('filterDateImg')?.value || '').trim();
    } else {
        nameFilter = ''; emailFilter = ''; dateFilter = '';
    }
    
    const filterFn = x => {
        const n = (x.uploaderName || '').toString().toLowerCase();
        const e = (x.uploaderEmail || '').toString().toLowerCase();
        return (
            (!nameFilter || n.includes(nameFilter)) && 
            (!emailFilter || e.includes(emailFilter)) && 
            (!dateFilter || x.date === dateFilter)
        );
    };

    const docList = document.getElementById('docList');
    const imgList = document.getElementById('imgList');

    const filteredDocs = docs.filter(filterFn);
    const filteredImgs = imgs.filter(filterFn);

    // Render documentos
    if (filteredDocs.length)
    {
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
    } else
    {
        docList.innerHTML = '<p class="muted">Sin documentos</p>';
    }

    // Render imágenes (lógica de URL de miniatura se mantiene)
    if (filteredImgs.length)
    {
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
    } else
    {
        imgList.innerHTML = '<p class="muted">Sin imágenes</p>';
    }

    if (findAndShowName && findName)
    {
        const allFiles = [...docs, ...imgs];
        const found = allFiles.find(x => x.name === findName);
        if (found) {
            const directUrl = getDriveDirectUrl(found.url);
            const isImg = (found.mime && found.mime.toLowerCase().startsWith('image/')) || /\.(jpg|jpeg|png|gif|webp)$/i.test(found.name);
            if (isImg) document.getElementById('imgStatus').innerHTML = `Subida: <a href="${directUrl}" target="_blank">Abrir</a>`;
            else document.getElementById('docStatus').innerHTML = `Subido: <a href="${directUrl}" target="_blank">Abrir</a>`;
        } else
        {
            document.getElementById('imgStatus').textContent = '';
            document.getElementById('docStatus').textContent = '';
        }
    }
}

/* ====== Noticias (LÓGICA MEJORADA PARA MOSTRAR CONTENIDO) ====== */
async function loadNews(){
    const res = await getApi('listNews');
    const main = document.getElementById('mainNews');
    const list = document.getElementById('newsList');
    if (res && res.news && res.news.length)
    {
        const n = res.news[0];
        const imgUrl = getDriveThumbnailUrl(safeString(n.imagenUrl), 300); 
        const directLink = getDriveDirectUrl(safeString(n.imagenUrl));

        // Renderizado de la NOTICIA PRINCIPAL (AJUSTE DE DISEÑO)
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
            <div class="news-content-area">
                <h3>${safeString(n.titulo)}</h3>
                <p style="margin-top:10px">${safeString(n.contenido)}</p>
            </div>
            `; 

        // Renderizado de la LISTA DE NOTICIAS (AJUSTE DE DISEÑO Y CONTENIDO)
        list.innerHTML = res.news.map(x => {
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
    } else
    {
        main.innerHTML = '<p class="muted">No hay noticias.</p>';
        list.innerHTML = '';
    }
}

/* ====== Navegación (SIN CAMBIOS EN LÓGICA) ====== */
document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('click', e =>
    {
        e.preventDefault();
        document.querySelectorAll('.nav a').forEach(n => n.classList.remove('active'));
        a.classList.add('active');
        const target = a.dataset.section;
        document.querySelectorAll('.section').forEach(s => s.id === target ? s.classList.add('active-section') : s.classList.remove('active-section'));
        if (target === 'documents') listUploads('documents'); 
        if (target === 'images') listUploads('images'); 
    });
});

/* ====== Contacto (SIN CAMBIOS) */
document.getElementById('waBtn').href = "https://wa.me/4129915255?text=Hola%20quiero%20información";
document.getElementById('mailBtn').href = "mailto:derwinrojas351@gmail.com";

/* ====== Inicial (SIN CAMBIOS) ====== */
setTimeout(() => {if (auth.currentUser) { listUploads('documents'); listUploads('images'); loadNews(); } }, 800);
</script>
</body>
</html>
