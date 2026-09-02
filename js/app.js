// js/app.js

const API_URL = 'https://niusystemabg-wrfi.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    const formLogin = document.getElementById('form-login');
    if(formLogin) formLogin.addEventListener('submit', procesarLogin);
});

// ==========================================
//          AUTENTICACIÓN Y SEGURIDAD
// ==========================================
function verificarSesion() {
    const usuarioLogueado = localStorage.getItem('usuario');
    const fotoPerfil = localStorage.getItem('foto');
    const esAdmin = localStorage.getItem('es_admin');
    
    if (usuarioLogueado) {
        document.getElementById('pantalla-login').classList.add('d-none');
        document.getElementById('sistema-principal').classList.remove('d-none');
        document.getElementById('nombre-abogado-nav').innerText = `Dr/a. ${usuarioLogueado}`;
        
        const imgNav = document.getElementById('img-perfil-nav');
        imgNav.classList.remove('d-none');
        imgNav.src = (fotoPerfil && fotoPerfil !== 'null' && fotoPerfil !== 'undefined') ? fotoPerfil : `https://ui-avatars.com/api/?name=${usuarioLogueado}&background=random&color=fff`;
        
        document.getElementById('nav-abogados').classList.toggle('d-none', esAdmin !== 'true');
        cargarVista('dashboard');
    } else {
        document.getElementById('pantalla-login').classList.remove('d-none');
        document.getElementById('sistema-principal').classList.add('d-none');
    }
}

async function procesarLogin(evento) {
    evento.preventDefault(); 
    const divError = document.getElementById('login-error');
    divError.classList.add('d-none');
    document.querySelector('#form-login button').innerText = "Verificando...";

    try {
        const respuesta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: document.getElementById('login-usuario').value, password: document.getElementById('login-password').value })
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
            localStorage.setItem('usuario', datos.usuario);
            localStorage.setItem('cedula', datos.cedula);
            localStorage.setItem('es_admin', datos.es_admin); 
            if(datos.foto) localStorage.setItem('foto', datos.foto); else localStorage.removeItem('foto');
            verificarSesion();
        } else {
            divError.innerText = datos.error || "Error de credenciales.";
            divError.classList.remove('d-none');
        }
    } catch (e) {
        divError.innerText = "Error de servidor."; divError.classList.remove('d-none');
    } finally {
        document.querySelector('#form-login button').innerText = "INGRESAR";
    }
}

function cerrarSesion() {
    localStorage.clear();
    verificarSesion();
}

// ==========================================
//          ENRUTADOR (VISTAS DINÁMICAS)
// ==========================================
function cargarVista(vista, param_extra = null) {
    const contenedor = document.getElementById('app-content');
    
    if (vista === 'dashboard') {
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fa-solid fa-chart-line"></i> Panel de Resumen</h2>
                <span class="text-muted fw-bold" id="dash-fecha"></span>
            </div>
            
            <!-- TARJETAS DE MÉTRICAS (KPIs) -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 bg-primary text-white">
                        <div class="card-body d-flex justify-content-between align-items-center p-4">
                            <div>
                                <h6 class="text-uppercase mb-1 fw-bold opacity-75">Clientes Registrados</h6>
                                <h2 class="mb-0 display-6 fw-bold" id="kpi-clientes"><div class="spinner-border spinner-border-sm"></div></h2>
                            </div>
                            <i class="fa-solid fa-users fa-3x opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 bg-success text-white">
                        <div class="card-body d-flex justify-content-between align-items-center p-4">
                            <div>
                                <h6 class="text-uppercase mb-1 fw-bold opacity-75">Casos Activos</h6>
                                <h2 class="mb-0 display-6 fw-bold" id="kpi-casos"><div class="spinner-border spinner-border-sm"></div></h2>
                            </div>
                            <i class="fa-solid fa-briefcase fa-3x opacity-50"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card shadow-sm border-0 bg-warning text-dark">
                        <div class="card-body d-flex justify-content-between align-items-center p-4">
                            <div>
                                <h6 class="text-uppercase mb-1 fw-bold opacity-75">Total Facturado</h6>
                                <h2 class="mb-0 display-6 fw-bold" id="kpi-facturado"><div class="spinner-border spinner-border-sm"></div></h2>
                            </div>
                            <i class="fa-solid fa-file-invoice-dollar fa-3x opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TABLA DE PRÓXIMAS AUDIENCIAS -->
            <div class="row">
                <div class="col-md-12">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-dark text-white fw-bold py-3">
                            <i class="fa-regular fa-calendar-check text-warning me-2"></i> Próximas Citas y Audiencias
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="table-light">
                                        <tr>
                                            <th class="ps-3">Fecha y Hora</th>
                                            <th>N° Judicial y Caso</th>
                                            <th>Descripción del Evento</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tabla-dash-eventos">
                                        <tr><td colspan="3" class="text-center text-muted py-4">Cargando eventos...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        cargarDatosDashboard();
    } 
    else if (vista === 'clientes') {
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-solid fa-users"></i> Clientes</h2>
                <button class="btn btn-primary" onclick="mostrarModalCliente()"><i class="fa-solid fa-plus"></i> Nuevo Cliente</button>
            </div>
            <table class="table table-hover bg-white shadow-sm rounded">
                <thead><tr><th>Perfil</th><th>Cédula</th><th>Nombre</th><th>Teléfono</th><th>Email</th><th></th></tr></thead>
                <tbody id="tabla-clientes-body"></tbody>
            </table>
            <!-- Modal Clientes -->
            <div class="modal fade" id="modalCliente" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-dark text-white"><h5 class="modal-title" id="modalClienteTitulo">Cliente</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="form-cliente" onsubmit="guardarCliente(event)">
                        <input type="hidden" id="cli-modo"><input type="text" id="cli-cedula" class="form-control mb-2" placeholder="Cédula" required>
                        <input type="text" id="cli-nombre" class="form-control mb-2" placeholder="Nombre Completo" required>
                        <input type="text" id="cli-direccion" class="form-control mb-2" placeholder="Dirección">
                        <input type="text" id="cli-telefono" class="form-control mb-2" placeholder="Teléfono">
                        <input type="email" id="cli-email" class="form-control mb-3" placeholder="Email">
                        <label class="small fw-bold">Foto (Opcional)</label><input type="file" id="cli-imagen" class="form-control mb-3">
                        <button type="submit" class="btn btn-primary w-100" id="btn-guardar-cliente">Guardar</button>
                    </form>
                </div>
            </div></div></div>
        `;
        listarClientes();
    } 
    else if (vista === 'casos') {
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-solid fa-briefcase"></i> Casos y Expedientes</h2>
                <button class="btn btn-primary" onclick="mostrarModalCaso()"><i class="fa-solid fa-plus"></i> Nuevo Caso</button>
            </div>
            <table class="table table-hover bg-white shadow-sm rounded">
                <thead><tr><th>N° Judicial</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th>Fecha</th><th class="text-end">Acciones</th></tr></thead>
                <tbody id="tabla-casos-body"></tbody>
            </table>
            <!-- Modal Casos -->
            <div class="modal fade" id="modalCaso" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-dark text-white"><h5 class="modal-title" id="modalCasoTitulo">Caso</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="form-caso" onsubmit="guardarCaso(event)">
                        <input type="hidden" id="caso-modo"><input type="hidden" id="caso-id-edit">
                        <label class="small fw-bold">Cliente</label><select id="caso-cliente" class="form-select mb-2" required></select>
                        <label class="small fw-bold">N° de Caso Judicial</label><input type="text" id="caso-numero" class="form-control mb-2" placeholder="Ej: 17230-2026-01234">
                        <label class="small fw-bold">Tipo de Caso</label><input type="text" id="caso-tipo" class="form-control mb-2" required>
                        <label class="small fw-bold">Estado</label><select id="caso-estado" class="form-select mb-2"><option>Activo</option><option>En Trámite</option><option>Suspendido</option><option>Cerrado</option></select>
                        <label class="small fw-bold">Fecha Inicio</label><input type="date" id="caso-fecha" class="form-control mb-2" required>
                        <label class="small fw-bold">Descripción</label><textarea id="caso-descripcion" class="form-control mb-3"></textarea>
                        <button type="submit" class="btn btn-primary w-100" id="btn-guardar-caso">Guardar</button>
                    </form>
                </div>
            </div></div></div>
        `;
        listarCasos();
    }
    else if (vista === 'expediente') {
        const id_caso = param_extra;
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-regular fa-folder-open"></i> Expediente (Caso #${id_caso})</h2>
                <div>
                    <button class="btn btn-secondary me-2" onclick="cargarVista('casos')">Volver</button>
                    <button class="btn btn-primary" onclick="mostrarModalDocumento(${id_caso})"><i class="fa-solid fa-cloud-arrow-up"></i> Subir Doc</button>
                </div>
            </div>
            <table class="table table-hover bg-white shadow-sm rounded">
                <thead><tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th class="text-end">Acciones</th></tr></thead>
                <tbody id="tabla-docs-body"></tbody>
            </table>
            <!-- Modal Documentos -->
            <div class="modal fade" id="modalDoc" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-dark text-white"><h5 class="modal-title" id="modalDocTitulo">Documento</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="form-doc" onsubmit="guardarDocumento(event)">
                        <input type="hidden" id="doc-modo"><input type="hidden" id="doc-id-edit"><input type="hidden" id="doc-id-caso" value="${id_caso}">
                        <label class="small fw-bold">Nombre Documento</label><input type="text" id="doc-nombre" class="form-control mb-2" required>
                        <label class="small fw-bold">Tipo</label><input type="text" id="doc-tipo" class="form-control mb-2" required>
                        <label class="small fw-bold">Archivo (PDF, Word, JPG)</label><input type="file" id="doc-archivo" class="form-control mb-3">
                        <button type="submit" class="btn btn-primary w-100" id="btn-guardar-doc">Guardar / Subir a R2</button>
                    </form>
                </div>
            </div></div></div>
        `;
        listarDocumentos(id_caso);
    }
    else if (vista === 'eventos') {
        const id_caso = param_extra;
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-regular fa-calendar"></i> Audiencias y Citas (Caso #${id_caso})</h2>
                <div>
                    <button class="btn btn-secondary me-2" onclick="cargarVista('casos')">Volver</button>
                    <button class="btn btn-warning fw-bold" onclick="mostrarModalEvento(${id_caso})"><i class="fa-solid fa-plus"></i> Nuevo Evento</button>
                </div>
            </div>
            <table class="table table-hover bg-white shadow-sm rounded">
                <thead><tr><th>Fecha y Hora</th><th>Descripción</th><th>Recordatorio</th><th class="text-end">Acciones</th></tr></thead>
                <tbody id="tabla-eventos-body"></tbody>
            </table>
            <!-- Modal Eventos -->
            <div class="modal fade" id="modalEvento" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-dark text-white"><h5 class="modal-title" id="modalEventoTitulo">Evento</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="form-evento" onsubmit="guardarEvento(event)">
                        <input type="hidden" id="ev-modo"><input type="hidden" id="ev-id-edit"><input type="hidden" id="ev-id-caso" value="${id_caso}">
                        <label class="small fw-bold">Fecha y Hora</label><input type="datetime-local" id="ev-fecha" class="form-control mb-2" required>
                        <label class="small fw-bold">Descripción / Lugar</label><textarea id="ev-descripcion" class="form-control mb-3" rows="3" required></textarea>
                        <div class="form-check form-switch mb-3 border p-2 rounded bg-light">
                            <input class="form-check-input" type="checkbox" id="ev-recordatorio">
                            <label class="form-check-label small fw-bold" for="ev-recordatorio">Alerta por Correo</label>
                        </div>
                        <button type="submit" class="btn btn-warning w-100 fw-bold" id="btn-guardar-ev">Guardar Evento</button>
                    </form>
                </div>
            </div></div></div>
        `;
        listarEventos(id_caso);
    }
    else if (vista === 'facturas') {
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-solid fa-file-invoice-dollar"></i> Facturación</h2>
                <button class="btn btn-success" onclick="mostrarModalFactura()"><i class="fa-solid fa-plus"></i> Generar Factura</button>
            </div>
            <table class="table table-hover bg-white shadow-sm rounded">
                <thead><tr><th># Factura</th><th>Fecha</th><th>Cliente</th><th>Caso</th><th>Concepto</th><th>Importe</th><th class="text-end">Opciones</th></tr></thead>
                <tbody id="tabla-facturas-body"></tbody>
            </table>
            <!-- Modal Facturas -->
            <div class="modal fade" id="modalFactura" tabindex="-1"><div class="modal-dialog"><div class="modal-content">
                <div class="modal-header bg-dark text-white"><h5 class="modal-title" id="modalFacturaTitulo">Factura</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button></div>
                <div class="modal-body">
                    <form id="form-factura" onsubmit="guardarFactura(event)">
                        <input type="hidden" id="fac-modo"><input type="hidden" id="fac-id-edit">
                        <label class="small fw-bold">Caso Activo</label><select id="fac-caso" class="form-select mb-2" required></select>
                        <label class="small fw-bold">Fecha</label><input type="date" id="fac-fecha" class="form-control mb-2" required>
                        <label class="small fw-bold">Concepto</label><input type="text" id="fac-concepto" class="form-control mb-2" required>
                        <label class="small fw-bold">Importe ($ USD)</label><input type="number" step="0.01" id="fac-importe" class="form-control mb-3" required>
                        <button type="submit" class="btn btn-success w-100" id="btn-guardar-fac">Guardar Factura</button>
                    </form>
                </div>
            </div></div></div>
        `;
        listarFacturas();
    }
    else if (vista === 'chatbot') {
        contenedor.innerHTML = `
            <div class="d-flex flex-column h-100" style="max-height: 80vh;">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h2><i class="fa-solid fa-robot text-primary"></i> Sofi Asistente Legal</h2>
                    <span class="badge bg-primary">Inteligencia Artificial</span>
                </div>
                
                <!-- Área de mensajes (Pantalla principal) -->
                <div id="chat-historial" class="flex-grow-1 bg-white rounded shadow-sm p-4 mb-3 overflow-auto" style="border: 1px solid #e0e0e0; min-height: 50vh;">
                    
                    <!-- Mensaje de bienvenida del Bot -->
                    <div class="d-flex mb-4">
                        <div class="me-3">
                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="fa-solid fa-scale-balanced"></i>
                            </div>
                        </div>
                        <div class="bg-light p-3 rounded-3 shadow-sm" style="max-width: 75%; border-top-left-radius: 0 !important;">
                            <p class="mb-1 fw-bold text-dark">Sofi Bot</p>
                            <p class="mb-0 text-secondary">Hola, mi nombre es Sofi. Mi base de datos ha sido actualizada. <b>Hazme tu consulta legal</b> y buscaré los artículos exactos en la normativa ecuatoriana para responderte.</p>
                        </div>
                    </div>
                </div>

                <!-- Barra inferior estilo Gemini -->
                <div class="card shadow-sm border-0 px-2 py-2" style="border-radius: 20px;">
                    <form id="form-chat" class="d-flex align-items-center gap-2" onsubmit="enviarMensajeBot(event)">
                        
                        <!-- INPUT DE TEXTO (Expandido) -->
                        <input type="text" id="chat-input" class="form-control border-0 shadow-none px-4" placeholder="Pregúntale a la ley (Ej: ¿Cuáles son los deberes primordiales del Estado?)..." autocomplete="off" required style="border-radius: 15px;">
                        
                        <!-- BOTÓN DE ENVIAR -->
                        <button type="submit" class="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 45px; height: 45px; flex-shrink: 0;" id="btn-enviar-chat">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
        
        // Hacemos scroll automático al abrir la vista
        setTimeout(() => {
            const historial = document.getElementById('chat-historial');
            if(historial) historial.scrollTop = historial.scrollHeight;
        }, 100);
    }
    
    else if (vista === 'abogados') {
        contenedor.innerHTML = `
            <div class="d-flex justify-content-between mb-3">
                <h2><i class="fa-solid fa-user-shield"></i> Gestión de Abogados</h2>
            </div>
            <div class="row">
                <div class="col-md-5">
                    <div class="card shadow-sm border-0">
                        <div class="card-header bg-dark text-white fw-bold">Registrar Abogado</div>
                        <div class="card-body">
                            <div id="registro-mensaje" class="alert d-none small"></div>
                            <form id="form-registro-interno" onsubmit="procesarRegistroInterno(event)">
                                <div class="row">
                                    <div class="col-6 mb-2"><label class="small fw-bold">Cédula</label><input type="text" id="reg-cedula" class="form-control form-control-sm" required maxlength="10"></div>
                                    <div class="col-6 mb-2"><label class="small fw-bold">Nombre</label><input type="text" id="reg-nombre" class="form-control form-control-sm" required></div>
                                    <div class="col-6 mb-2"><label class="small fw-bold">Especialidad</label><input type="text" id="reg-especializacion" class="form-control form-control-sm"></div>
                                    <div class="col-6 mb-2"><label class="small fw-bold">Teléfono</label><input type="text" id="reg-telefono" class="form-control form-control-sm"></div>
                                    <div class="col-12 mb-2"><label class="small fw-bold">Email</label><input type="email" id="reg-email" class="form-control form-control-sm"></div>
                                    <div class="col-6 mb-2 border-top pt-2"><label class="small fw-bold">Usuario</label><input type="text" id="reg-usuario" class="form-control form-control-sm" required></div>
                                    <div class="col-6 mb-2 border-top pt-2"><label class="small fw-bold">Contraseña</label><input type="password" id="reg-password" class="form-control form-control-sm" required></div>
                                    <div class="col-12 mb-3"><label class="small fw-bold">Foto Perfil (Opcional)</label><input type="file" id="reg-imagen" class="form-control form-control-sm" accept="image/*"></div>
                                </div>
                                <button type="submit" class="btn btn-primary w-100 fw-bold">Registrar</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="col-md-7">
                    <table class="table table-hover bg-white shadow-sm rounded">
                        <thead class="table-light"><tr><th>Cédula</th><th>Nombre</th><th>Especialización</th></tr></thead>
                        <tbody id="tabla-abogados-body"></tbody>
                    </table>
                </div>
            </div>
        `;
        listarAbogados();
    }
}

// ==========================================
//          LÓGICA DEL DASHBOARD
// ==========================================
async function cargarDatosDashboard() {
    const usuario = localStorage.getItem('usuario');
    
    const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dash-fecha').innerText = new Date().toLocaleDateString('es-ES', opcionesFecha).toUpperCase();
    
    try {
        const res = await fetch(`${API_URL}/dashboard/${usuario}`);
        const data = await res.json();
        
        if(res.ok) {
            document.getElementById('kpi-clientes').innerText = data.total_clientes;
            document.getElementById('kpi-casos').innerText = data.casos_activos;
            document.getElementById('kpi-facturado').innerText = `$${parseFloat(data.total_facturado).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            
            const tb = document.getElementById('tabla-dash-eventos');
            tb.innerHTML = '';
            
            if(data.proximos_eventos.length === 0) {
                tb.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Excelente. No tienes audiencias ni citas pendientes a corto plazo.</td></tr>';
            } else {
                data.proximos_eventos.forEach(e => {
                    const fechaHora = new Date(e.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
                    const numero = e.numerocaso ? `<span class="badge bg-secondary me-1">${e.numerocaso}</span>` : '';
                    
                    tb.innerHTML += `
                        <tr>
                            <td class="ps-3 fw-bold text-primary"><i class="fa-regular fa-clock me-1"></i> ${fechaHora}</td>
                            <td class="fw-bold">${numero} ${e.tipocaso}</td>
                            <td>${e.descripcion}</td>
                        </tr>
                    `;
                });
            }
        }
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        document.getElementById('tabla-dash-eventos').innerHTML = '<tr><td colspan="3" class="text-center text-danger py-4">Error al conectar con la base de datos.</td></tr>';
    }
}

// ==========================================
//          CRUD DE ABOGADOS
// ==========================================
async function procesarRegistroInterno(e) {
    e.preventDefault();
    const divMensaje = document.getElementById('registro-mensaje'); divMensaje.classList.add('d-none'); divMensaje.classList.remove('alert-success', 'alert-danger');
    const fd = new FormData();
    fd.append('cedula', document.getElementById('reg-cedula').value); fd.append('nombre', document.getElementById('reg-nombre').value);
    fd.append('especializacion', document.getElementById('reg-especializacion').value); fd.append('telefono', document.getElementById('reg-telefono').value);
    fd.append('email', document.getElementById('reg-email').value); fd.append('usuario', document.getElementById('reg-usuario').value);
    fd.append('password', document.getElementById('reg-password').value);
    if(document.getElementById('reg-imagen').files[0]) fd.append('imagen', document.getElementById('reg-imagen').files[0]);

    try {
        const res = await fetch(`${API_URL}/registro`, { method: 'POST', body: fd });
        if(res.ok) { divMensaje.innerText = "¡Abogado registrado!"; divMensaje.classList.add('alert-success'); document.getElementById('form-registro-interno').reset(); listarAbogados(); } 
        else { const d = await res.json(); divMensaje.innerText = d.error; divMensaje.classList.add('alert-danger'); }
    } catch(err) { divMensaje.innerText = "Error de conexión."; divMensaje.classList.add('alert-danger'); }
    divMensaje.classList.remove('d-none');
}

async function listarAbogados() {
    try {
        const res = await fetch(`${API_URL}/abogados`); const data = await res.json();
        const tb = document.getElementById('tabla-abogados-body'); tb.innerHTML = ''; 
        data.forEach(a => tb.innerHTML += `<tr><td>${a.cedula}</td><td class="fw-bold">${a.nombre}</td><td>${a.especializacion||'-'}</td></tr>`);
    } catch(e) {}
}

// ==========================================
//          CRUD DE CLIENTES
// ==========================================
async function listarClientes() {
    try {
        const res = await fetch(`${API_URL}/clientes/abogado/${localStorage.getItem('usuario')}`);
        const data = await res.json();
        const tb = document.getElementById('tabla-clientes-body'); tb.innerHTML = '';
        data.datos.forEach(c => {
            let img = c.url_imagen ? `<img src="${c.url_imagen}" class="rounded-circle" width="35" height="35" style="object-fit:cover;">` : `<i class="fa-solid fa-user-circle fa-2x text-muted"></i>`;
            tb.innerHTML += `<tr><td>${img}</td><td>${c.cedula}</td><td>${c.nombre}</td><td>${c.telefono||'-'}</td><td>${c.email||'-'}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick="mostrarModalCliente('${c.cedula}')"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarCliente('${c.cedula}')"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    } catch(e) {}
}

async function mostrarModalCliente(ced = null) {
    document.getElementById('form-cliente').reset();
    document.getElementById('cli-modo').value = ced ? "editar" : "crear";
    document.getElementById('cli-cedula').disabled = ced ? true : false;
    if(ced) {
        try {
            const res = await fetch(`${API_URL}/clientes/${ced}`);
            const d = await res.json();
            if(res.ok) {
                document.getElementById('cli-cedula').value = d.datos.cedula; document.getElementById('cli-nombre').value = d.datos.nombre;
                document.getElementById('cli-direccion').value = d.datos.direccion||''; document.getElementById('cli-telefono').value = d.datos.telefono||'';
                document.getElementById('cli-email').value = d.datos.email||'';
            }
        } catch(e) {}
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCliente')).show();
}

async function guardarCliente(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('cedula', document.getElementById('cli-cedula').value); fd.append('nombre', document.getElementById('cli-nombre').value);
    fd.append('direccion', document.getElementById('cli-direccion').value); fd.append('telefono', document.getElementById('cli-telefono').value);
    fd.append('email', document.getElementById('cli-email').value); fd.append('id_abogado', localStorage.getItem('cedula'));
    if(document.getElementById('cli-imagen').files[0]) fd.append('imagen', document.getElementById('cli-imagen').files[0]);
    
    let url = `${API_URL}/clientes`; let met = 'POST';
    if(document.getElementById('cli-modo').value === 'editar') { url += `/${document.getElementById('cli-cedula').value}`; met = 'PUT'; }
    await fetch(url, {method: met, body: fd});
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCliente')).hide(); listarClientes();
}

async function eliminarCliente(ced) {
    if(confirm('¿Eliminar cliente?')) { await fetch(`${API_URL}/clientes/${ced}`, {method:'DELETE'}); listarClientes(); }
}

// ==========================================
//          CRUD DE CASOS
// ==========================================
async function listarCasos() {
    try {
        const res = await fetch(`${API_URL}/casos/abogado/${localStorage.getItem('usuario')}`);
        const data = await res.json();
        const tb = document.getElementById('tabla-casos-body'); tb.innerHTML = '';
        data.datos.forEach(c => {
            tb.innerHTML += `<tr><td class="fw-bold">${c.numerocaso || 'Sin asignar'}</td><td>${c.tipocaso}</td><td>${c.cliente_nombre}</td><td><span class="badge bg-secondary">${c.estado}</span></td><td>${c.fechainicio?c.fechainicio.split('T')[0]:'-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-warning me-1" onclick="cargarVista('eventos', ${c.id_caso})" title="Citas"><i class="fa-regular fa-calendar"></i></button>
                <button class="btn btn-sm btn-outline-success me-1" onclick="cargarVista('expediente', ${c.id_caso})" title="Expediente"><i class="fa-regular fa-folder-open"></i></button>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="mostrarModalCaso(${c.id_caso})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarCaso(${c.id_caso})"><i class="fa-solid fa-trash"></i></button>
            </td></tr>`;
        });
    } catch(e) {}
}

async function mostrarModalCaso(id = null) {
    document.getElementById('form-caso').reset();
    document.getElementById('caso-modo').value = id ? "editar" : "crear";
    document.getElementById('caso-id-edit').value = id || "";
    document.getElementById('caso-fecha').value = new Date().toISOString().split('T')[0];
    
    let idCliGuardado = null;
    if(id) {
        try {
            const r = await fetch(`${API_URL}/casos/${id}`); const d = await r.json();
            if(r.ok) {
                document.getElementById('caso-numero').value = d.datos.numerocaso || '';
                document.getElementById('caso-tipo').value = d.datos.tipocaso||''; document.getElementById('caso-estado').value = d.datos.estado||'Activo';
                document.getElementById('caso-fecha').value = d.datos.fechainicio?d.datos.fechainicio.split('T')[0]:''; document.getElementById('caso-descripcion').value = d.datos.descripcion||'';
                idCliGuardado = d.datos.id_cliente;
            }
        } catch(e) {}
    }
    
    const sel = document.getElementById('caso-cliente'); sel.innerHTML = '';
    const res = await fetch(`${API_URL}/clientes/abogado/${localStorage.getItem('usuario')}`);
    const data = await res.json();
    data.datos.forEach(c => sel.innerHTML += `<option value="${c.cedula}" ${idCliGuardado===c.cedula?'selected':''}>${c.nombre}</option>`);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCaso')).show();
}

async function guardarCaso(e) {
    e.preventDefault();
    const d = { 
        numerocaso: document.getElementById('caso-numero').value,
        id_cliente: document.getElementById('caso-cliente').value, 
        id_abogado: localStorage.getItem('cedula'), 
        tipocaso: document.getElementById('caso-tipo').value, 
        estado: document.getElementById('caso-estado').value, 
        fechainicio: document.getElementById('caso-fecha').value, 
        descripcion: document.getElementById('caso-descripcion').value 
    };
    let url = `${API_URL}/casos`; let met = 'POST';
    if(document.getElementById('caso-modo').value === 'editar') { url += `/${document.getElementById('caso-id-edit').value}`; met = 'PUT'; }
    await fetch(url, {method: met, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d)});
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalCaso')).hide(); listarCasos();
}

async function eliminarCaso(id) {
    if(confirm('¿Eliminar caso y su expediente?')) { await fetch(`${API_URL}/casos/${id}`, {method:'DELETE'}); listarCasos(); }
}

// ==========================================
//          CRUD DE EXPEDIENTES (DOCS)
// ==========================================
async function listarDocumentos(id_caso) {
    try {
        const res = await fetch(`${API_URL}/documentos/caso/${id_caso}`);
        const data = await res.json();
        const tb = document.getElementById('tabla-docs-body'); tb.innerHTML = '';
        if(data.datos.length===0) tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Carpeta vacía.</td></tr>';
        data.datos.forEach(d => {
            let btnDescarga = d.url_descarga ? `<a href="${d.url_descarga}" target="_blank" class="btn btn-sm btn-outline-info" title="Descargar"><i class="fa-solid fa-download"></i></a>` : '';
            tb.innerHTML += `<tr><td>${d.fecha?d.fecha.split('T')[0]:'-'}</td><td class="fw-bold">${d.nombredocumento}</td><td>${d.tipodocumento}</td>
            <td class="text-end">${btnDescarga} <button class="btn btn-sm btn-outline-primary" onclick="mostrarModalDocumento(${id_caso}, ${d.id_documento})"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarDocumento(${d.id_documento}, ${id_caso})"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    } catch(e) {}
}

function mostrarModalDocumento(id_caso, id_doc = null) {
    document.getElementById('form-doc').reset();
    document.getElementById('doc-modo').value = id_doc ? "editar" : "crear";
    document.getElementById('doc-id-edit').value = id_doc || "";
    document.getElementById('doc-archivo').required = id_doc ? false : true; 
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDoc')).show();
}

async function guardarDocumento(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append('nombre_documento', document.getElementById('doc-nombre').value); fd.append('tipodocumento', document.getElementById('doc-tipo').value); fd.append('id_caso', document.getElementById('doc-id-caso').value);
    if(document.getElementById('doc-archivo').files[0]) fd.append('archivo', document.getElementById('doc-archivo').files[0]);
    
    let url = `${API_URL}/documentos/subir`; let met = 'POST';
    if(document.getElementById('doc-modo').value === 'editar') { url = `${API_URL}/documentos/${document.getElementById('doc-id-edit').value}`; met = 'PUT'; }
    document.getElementById('btn-guardar-doc').innerText = "Subiendo...";
    
    await fetch(url, {method: met, body: fd});
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDoc')).hide(); 
    listarDocumentos(document.getElementById('doc-id-caso').value);
}

async function eliminarDocumento(id_doc, id_caso) {
    if(confirm('¿Borrar documento?')) { await fetch(`${API_URL}/documentos/${id_doc}`, {method:'DELETE'}); listarDocumentos(id_caso); }
}

// ==========================================
//          CRUD DE EVENTOS
// ==========================================
async function listarEventos(id_caso) {
    try {
        const res = await fetch(`${API_URL}/eventos/caso/${id_caso}`);
        const data = await res.json();
        const tb = document.getElementById('tabla-eventos-body'); tb.innerHTML = '';
        if(data.datos.length === 0) tb.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay eventos programados.</td></tr>';
        
        data.datos.forEach(e => {
            const fechaHora = new Date(e.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
            const rec = e.recordatorio ? '<span class="badge bg-success">Activado</span>' : '<span class="badge bg-secondary">Inactivo</span>';
            tb.innerHTML += `<tr><td class="fw-bold text-primary">${fechaHora}</td><td>${e.descripcion}</td><td>${rec}</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-primary" onclick="mostrarModalEvento(${id_caso}, ${e.id_evento})"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarEvento(${e.id_evento}, ${id_caso})"><i class="fa-solid fa-trash"></i></button></td></tr>`;
        });
    } catch(e) {}
}

async function mostrarModalEvento(id_caso, id_evento = null) {
    document.getElementById('form-evento').reset();
    document.getElementById('ev-modo').value = id_evento ? "editar" : "crear";
    document.getElementById('ev-id-edit').value = id_evento || "";
    
    if (id_evento) {
        try {
            const res = await fetch(`${API_URL}/eventos/${id_evento}`); const d = await res.json();
            if (res.ok) {
                document.getElementById('ev-fecha').value = d.datos.fecha ? new Date(d.datos.fecha).toISOString().slice(0, 16) : '';
                document.getElementById('ev-descripcion').value = d.datos.descripcion; document.getElementById('ev-recordatorio').checked = d.datos.recordatorio;
            }
        } catch (e) {}
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEvento')).show();
}

async function guardarEvento(e) {
    e.preventDefault();
    const d = { fecha: document.getElementById('ev-fecha').value, descripcion: document.getElementById('ev-descripcion').value, recordatorio: document.getElementById('ev-recordatorio').checked };
    const id_caso = document.getElementById('ev-id-caso').value;
    let url = `${API_URL}/eventos/crear/${id_caso}`; let met = 'POST';
    if(document.getElementById('ev-modo').value === 'editar') { url = `${API_URL}/eventos/${document.getElementById('ev-id-edit').value}`; met = 'PUT'; }
    await fetch(url, {method: met, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d)});
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEvento')).hide(); listarEventos(id_caso);
}

async function eliminarEvento(id_evento, id_caso) {
    if(confirm('¿Cancelar audiencia?')) { await fetch(`${API_URL}/eventos/${id_evento}`, {method:'DELETE'}); listarEventos(id_caso); }
}

// ==========================================
//          CRUD DE FACTURAS
// ==========================================
async function listarFacturas() {
    try {
        const res = await fetch(`${API_URL}/facturas/abogado/${localStorage.getItem('usuario')}`);
        const data = await res.json();
        const tb = document.getElementById('tabla-facturas-body'); tb.innerHTML = '';
        data.datos.forEach(f => {
            tb.innerHTML += `<tr><td class="fw-bold">FAC-${f.id_factura}</td><td>${f.fecha?f.fecha.split('T')[0]:'-'}</td><td>${f.nombre_cliente}</td><td>${f.nombre_caso}</td><td>${f.concepto}</td><td class="text-success fw-bold">$${f.importe}</td>
            <td class="text-end">
                <a href="${API_URL}/facturas/${f.id_factura}/imprimir" target="_blank" class="btn btn-sm btn-danger" title="Generar PDF"><i class="fa-solid fa-file-pdf"></i> PDF</a>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarFactura(${f.id_factura})"><i class="fa-solid fa-trash"></i></button>
            </td></tr>`;
        });
    } catch(e) {}
}

async function mostrarModalFactura() {
    document.getElementById('form-factura').reset();
    document.getElementById('fac-modo').value = "crear";
    document.getElementById('fac-fecha').value = new Date().toISOString().split('T')[0];
    
    const sel = document.getElementById('fac-caso'); sel.innerHTML = '';
    const res = await fetch(`${API_URL}/casos/abogado/${localStorage.getItem('usuario')}`);
    const data = await res.json();
    data.datos.forEach(c => sel.innerHTML += `<option value="${c.id_caso}">#${c.numerocaso || c.id_caso} - ${c.tipocaso} (${c.cliente_nombre})</option>`);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFactura')).show();
}

async function guardarFactura(e) {
    e.preventDefault();
    const d = { id_caso: document.getElementById('fac-caso').value, id_abogado: localStorage.getItem('cedula'), fecha: document.getElementById('fac-fecha').value, concepto: document.getElementById('fac-concepto').value, importe: document.getElementById('fac-importe').value };
    await fetch(`${API_URL}/facturas`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(d)});
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFactura')).hide(); listarFacturas();
}

async function eliminarFactura(id) {
    if(confirm('¿Anular Factura?')) { await fetch(`${API_URL}/facturas/${id}`, {method:'DELETE'}); listarFacturas(); }
}

// ==========================================
//          LÓGICA DEL CHATBOT LEGAL
// ==========================================
async function enviarMensajeBot(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const mensajeUsuario = input.value.trim();
    const historial = document.getElementById('chat-historial');
    const btnEnviar = document.getElementById('btn-enviar-chat');

    if (!mensajeUsuario) return;

    // Dibujar burbuja usuario
    historial.insertAdjacentHTML('beforeend', `
        <div class="d-flex justify-content-end mb-4">
            <div class="bg-primary text-white p-3 rounded-3 shadow-sm" style="max-width: 75%; border-top-right-radius: 0 !important;">
                <p class="mb-0">${mensajeUsuario}</p>
            </div>
        </div>
    `);
    
    input.value = '';
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    historial.scrollTop = historial.scrollHeight;

    // Indicador "Pensando"
    const idEscribiendo = 'escribiendo-' + Date.now();
    historial.insertAdjacentHTML('beforeend', `
        <div id="${idEscribiendo}" class="d-flex mb-4">
            <div class="me-3">
                <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="fa-solid fa-scale-balanced"></i>
                </div>
            </div>
            <div class="bg-light p-3 rounded-3" style="max-width: 75%; border-top-left-radius: 0 !important;">
                <p class="mb-0 text-muted fst-italic">Buscando en la base de datos legal...</p>
            </div>
        </div>
    `);
    historial.scrollTop = historial.scrollHeight;

    try {
        // Enviar a la nueva ruta RAG en routes.py
        const res = await fetch(`${API_URL}/chatbot/preguntar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pregunta: mensajeUsuario })
        });
        
        const data = await res.json();
        const indicador = document.getElementById(idEscribiendo);
        if (indicador) indicador.remove();

        if (res.ok && data.respuesta) {
            // Transformar el array de fuentes en etiquetas HTML (badges)
            let fuentesHTML = '';
            if (data.fuentes && data.fuentes.length > 0) {
                // Filtramos duplicados por si la IA cita la misma fuente dos veces
                const fuentesUnicas = [...new Set(data.fuentes)];
                fuentesHTML = fuentesUnicas.map(f => 
                    `<span class="badge bg-warning text-dark mb-2 me-1 border border-dark shadow-sm" style="font-size: 0.85em;">
                        <i class="fa-solid fa-book-bookmark"></i> ${f}
                    </span>`
                ).join('');
            }

            historial.insertAdjacentHTML('beforeend', `
                <div class="d-flex mb-4">
                    <div class="me-3">
                        <div class="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                            <i class="fa-solid fa-scale-balanced"></i>
                        </div>
                    </div>
                    <div class="bg-light p-3 rounded-3 shadow-sm" style="max-width: 85%; border-top-left-radius: 0 !important;">
                        <p class="mb-1 fw-bold text-dark">Sofi Bot</p>
                        ${fuentesHTML}
                        <div class="text-secondary text-wrap mt-1" style="white-space: pre-line; line-height: 1.6;">${data.respuesta}</div>
                    </div>
                </div>
            `);
        } else {
            throw new Error(data.error || "Error al procesar la respuesta.");
        }

    } catch (error) {
        const indicador = document.getElementById(idEscribiendo);
        if (indicador) indicador.remove();
        historial.insertAdjacentHTML('beforeend', `
            <div class="d-flex mb-4">
                <div class="bg-danger text-white p-3 rounded-3 shadow-sm" style="max-width: 75%; border-top-left-radius: 0 !important;">
                    <p class="mb-0"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${error.message}</p>
                </div>
            </div>
        `);
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
        input.focus();
        historial.scrollTop = historial.scrollHeight;
    }
}
