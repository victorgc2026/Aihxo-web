// ==========================================
// AIHXO GESTIÓN · MÓDULO DE SORTEOS
// ==========================================

function sorteosView() {
  return `
    <div class="sorteos-aihxo">

      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;">
        <div>
          <h2 style="margin:0;">🎁 Sorteos AIHXO</h2>
          <div class="muted" style="margin-top:5px;">
            Crea, organiza y gestiona los sorteos de AIHXO.
          </div>
        </div>

        <button class="primary" id="btnNuevoSorteo">
          ＋ Nuevo sorteo
        </button>
      </div>

      <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
        gap:12px;
        margin-bottom:22px;
      ">

        <div class="card" style="padding:16px;">
          <div class="muted">🟢 Activos</div>
          <div style="font-size:28px;font-weight:700;margin-top:5px;" id="sorteosActivos">
            0
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <div class="muted">🗓 Programados</div>
          <div style="font-size:28px;font-weight:700;margin-top:5px;" id="sorteosProgramados">
            0
          </div>
        </div>

        <div class="card" style="padding:16px;">
          <div class="muted">🏁 Finalizados</div>
          <div style="font-size:28px;font-weight:700;margin-top:5px;" id="sorteosFinalizados">
            0
          </div>
        </div>

      </div>

      <div class="card" style="padding:18px;">

        <h3 style="margin-top:0;">Todos los sorteos</h3>

        <div id="listaSorteos">
          <div class="muted" style="padding:25px;text-align:center;">
            Todavía no has creado ningún sorteo.
          </div>
        </div>

      </div>

      <div id="formNuevoSorteo" style="display:none;margin-top:20px;">

        <div class="card" style="padding:18px;">

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <h3 style="margin:0;">🎁 Crear nuevo sorteo</h3>

            <button id="cerrarNuevoSorteo">
              ✕
            </button>
          </div>

          <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
            gap:14px;
            margin-top:20px;
          ">

            <label>
              Nombre del sorteo
              <input id="sorteoNombre"
                     type="text"
                     placeholder="Ej: Sorteo camiseta AIHXO">
            </label>

            <label>
              Premio
              <input id="sorteoPremio"
                     type="text"
                     placeholder="Ej: Camiseta personalizada">
            </label>

            <label>
              Fecha de inicio
              <input id="sorteoInicio"
                     type="date">
            </label>

            <label>
              Fecha de finalización
              <input id="sorteoFin"
                     type="date">
            </label>

            <label>
              Número de ganadores
              <input id="sorteoGanadores"
                     type="number"
                     min="1"
                     value="1">
            </label>

            <label>
              Estado
              <select id="sorteoEstado">
                <option value="programado">Programado</option>
                <option value="activo">Activo</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </label>

          </div>

          <label style="display:block;margin-top:14px;">
            Texto promocional
            <textarea id="sorteoTexto"
                      rows="4"
                      placeholder="Escribe aquí el texto del sorteo..."></textarea>
          </label>

          <label style="display:block;margin-top:14px;">
            Condiciones
            <textarea id="sorteoCondiciones"
                      rows="4"
                      placeholder="Ej: Seguir a @aihxo.camisetas, dar me gusta, comentar..."></textarea>
          </label>

          <div style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
            margin-top:20px;
          ">

            <button class="primary" id="guardarSorteo">
              💾 Guardar sorteo
            </button>

            <button id="generarCartelSorteo">
              🎨 Generar cartel
            </button>

          </div>

        </div>

      </div>

    </div>
  `;
}

// ==========================================
// EVENTOS DEL MÓDULO
// ==========================================

async function iniciarSorteos() {

  const nuevo = document.getElementById('btnNuevoSorteo');
  const formulario = document.getElementById('formNuevoSorteo');
  const cerrar = document.getElementById('cerrarNuevoSorteo');
  const guardar = document.getElementById('guardarSorteo');

  if (nuevo) {
    nuevo.onclick = () => {
      formulario.style.display = 'block';
      formulario.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    };
  }

  if (cerrar) {
    cerrar.onclick = () => {
      formulario.style.display = 'none';
    };
  }

  if (guardar) {
    guardar.onclick = guardarSorteo;
  }

  await cargarSorteos();
}


// ==========================================
// GUARDAR SORTEO
// ==========================================

async function guardarSorteo() {

  const nombre = document.getElementById('sorteoNombre').value.trim();
  const premio = document.getElementById('sorteoPremio').value.trim();
  const fecha_inicio = document.getElementById('sorteoInicio').value || null;
  const fecha_fin = document.getElementById('sorteoFin').value || null;
  const numero_ganadores = Number(
    document.getElementById('sorteoGanadores').value || 1
  );
  const estado = document.getElementById('sorteoEstado').value;
  const texto_promocional =
    document.getElementById('sorteoTexto').value.trim();
  const condiciones =
    document.getElementById('sorteoCondiciones').value.trim();

  if (!nombre || !premio) {
    toast('Completa nombre y premio');
    return;
  }

  const { error } = await supabaseClient
    .from('sorteos')
    .insert({
      nombre,
      premio,
      fecha_inicio,
      fecha_fin,
      numero_ganadores,
      estado,
      texto_promocional,
      condiciones
    });

  if (error) {
    console.error(error);
    toast('Error al guardar el sorteo');
    return;
  }

  toast('Sorteo guardado');

  document.getElementById('sorteoNombre').value = '';
  document.getElementById('sorteoPremio').value = '';
  document.getElementById('sorteoInicio').value = '';
  document.getElementById('sorteoFin').value = '';
  document.getElementById('sorteoGanadores').value = '1';
  document.getElementById('sorteoEstado').value = 'programado';
  document.getElementById('sorteoTexto').value = '';
  document.getElementById('sorteoCondiciones').value = '';

  document.getElementById('formNuevoSorteo').style.display = 'none';

  await cargarSorteos();
}


// ==========================================
// CARGAR SORTEOS
// ==========================================

async function cargarSorteos() {

  const { data, error } = await supabaseClient
    .from('sorteos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    toast('Error cargando sorteos');
    return;
  }

  const sorteos = data || [];

  const activos =
    sorteos.filter(s => s.estado === 'activo').length;

  const programados =
    sorteos.filter(s => s.estado === 'programado').length;

  const finalizados =
    sorteos.filter(s => s.estado === 'finalizado').length;

  document.getElementById('sorteosActivos').textContent = activos;
  document.getElementById('sorteosProgramados').textContent = programados;
  document.getElementById('sorteosFinalizados').textContent = finalizados;

  const lista = document.getElementById('listaSorteos');

  if (!lista) return;

  if (!sorteos.length) {
    lista.innerHTML = `
      <div class="muted" style="padding:25px;text-align:center;">
        Todavía no has creado ningún sorteo.
      </div>
    `;
    return;
  }

  lista.innerHTML = sorteos.map(s => {

    let icono = '🗓';

    if (s.estado === 'activo') icono = '🟢';
    if (s.estado === 'finalizado') icono = '🏁';

    return `
      <div class="card" style="padding:16px;margin-bottom:12px;">

        <div style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        ">

          <div>
            <div style="font-size:18px;font-weight:800;">
              ${icono} ${s.nombre}
            </div>

            <div class="muted" style="margin-top:5px;">
              Premio: ${s.premio}
            </div>

            <div class="muted" style="margin-top:5px;">
              ${s.fecha_inicio || '—'} → ${s.fecha_fin || '—'}
            </div>
          </div>

          <div style="
            font-size:12px;
            font-weight:800;
            text-transform:uppercase;
          ">
            ${s.estado}
          </div>

        </div>

      </div>
    `;

  }).join('');
}


// ==========================================
// EXPONER FUNCIONES
// ==========================================

window.sorteosView = sorteosView;
window.iniciarSorteos = iniciarSorteos;
window.cargarSorteos = cargarSorteos;
