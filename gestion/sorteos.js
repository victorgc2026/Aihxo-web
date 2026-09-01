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

function iniciarSorteos() {

  const nuevo = document.getElementById('btnNuevoSorteo');
  const formulario = document.getElementById('formNuevoSorteo');
  const cerrar = document.getElementById('cerrarNuevoSorteo');

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

}


// Dejamos disponible el módulo para AIHXO Gestión
window.sorteosView = sorteosView;
window.iniciarSorteos = iniciarSorteos;
