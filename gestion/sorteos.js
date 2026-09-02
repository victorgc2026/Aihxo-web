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
  Número de suplentes
  <input id="sorteoSuplentes"
         type="number"
         min="0"
         value="2">
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
const generarCartel = document.getElementById('generarCartelSorteo');
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
if (generarCartel) {
  generarCartel.onclick = generarCartelSorteo;
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
  const numero_suplentes = Number(
  document.getElementById('sorteoSuplentes').value
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
      numero_suplentes,
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
  .select(`
    *,
    participantes_sorteo (
      id
    ),
    ganadores_sorteo (
      posicion,
      es_suplente,
      participantes_sorteo (
        nombre,
        usuario_red
      )
    )
  `)
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
const participantesTotal =
  s.participantes_sorteo?.length || 0;

const ganadores =
  (s.ganadores_sorteo || [])
    .filter(g => !g.es_suplente)
    .sort((a, b) => a.posicion - b.posicion);

const textoGanador = ganadores.length
  ? ganadores.map(g => {
      const p = g.participantes_sorteo;
      return `${p?.nombre || 'Ganador'}${p?.usuario_red ? ' · ' + p.usuario_red : ''}`;
    }).join('<br>')
  : 'Todavía sin ganador';
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
              
              <div style="
  display:flex;
  gap:18px;
  flex-wrap:wrap;
  margin-top:12px;
  padding-top:12px;
  border-top:1px solid #e8edf3;
">

  <div>
    <div class="muted" style="font-size:12px;">
      👥 Participantes
    </div>
    <b>${participantesTotal}</b>
  </div>

  <div>
    <div class="muted" style="font-size:12px;">
      🏆 Ganador
    </div>
    <b>${textoGanador}</b>
  </div>

</div>
            
          </div>

          <div style="
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
  padding:6px 10px;
  border-radius:20px;
  background:#e8f8ee;
  color:#16803c;
  margin-left:auto;
">
  ${s.estado}
</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">

  <button
    class="secondary"
    onclick="abrirParticipantesSorteo('${s.id}','${(s.nombre || '').replace(/'/g, "\\'")}')"
  >
    👥 Participantes
  </button>

  <button
    class="secondary"
    onclick="elegirGanadorSorteo('${s.id}')"
  >
    ${ganadores.length ? '🏆 Ver resultado' : '🏆 Elegir ganador'}
  </button>
<button
  class="secondary"
  onclick="generarCartelDesdeSorteo('${s.id}')"
>
  🎨 Cartel
</button>
</div>
        </div>

      </div>
    `;

  }).join('');
}
// ==========================================
// PARTICIPANTES DEL SORTEO
// ==========================================

async function abrirParticipantesSorteo(sorteoId, sorteoNombre) {

  const { data, error } = await supabaseClient
    .from('participantes_sorteo')
    .select('*')
    .eq('sorteo_id', sorteoId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    toast('Error cargando participantes');
    return;
  }

  const participantes = data || [];

  const contenedor = document.getElementById('listaSorteos');

  contenedor.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="secondary" onclick="cargarSorteos()">
        ← Volver a sorteos
      </button>
    </div>

    <div class="card" style="padding:18px;">

      <h3 style="margin-top:0;">
        👥 Participantes
      </h3>

      <div class="muted" style="margin-bottom:18px;">
        ${sorteoNombre}
      </div>

      <div style="
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
        gap:10px;
        margin-bottom:14px;
      ">

        <input
          id="participanteNombre"
          placeholder="Nombre"
        >

        <input
          id="participanteUsuario"
          placeholder="@usuario Instagram/TikTok"
        >

        <input
          id="participanteContacto"
          placeholder="Contacto (opcional)"
        >

      </div>

      <button
        class="primary"
        onclick="guardarParticipanteSorteo('${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')"
      >
        ＋ Añadir participante
      </button>

      <div style="margin-top:22px;">

        <b>
          ${participantes.length} participante${participantes.length === 1 ? '' : 's'}
        </b>

        <div style="margin-top:12px;">

          ${
            participantes.length
            ? participantes.map(p => `
                <div
                  class="card"
                  style="
                    padding:12px;
                    margin-bottom:8px;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                  "
                >

                  <div>
                    <b>${p.nombre}</b>

                    ${
                      p.usuario_red
                      ? `<div class="muted">${p.usuario_red}</div>`
                      : ''
                    }
                  </div>

                  <button
                    class="secondary"
                    onclick="eliminarParticipanteSorteo(
                      '${p.id}',
                      '${sorteoId}',
                      '${sorteoNombre.replace(/'/g, "\\'")}'
                    )"
                  >
                    🗑
                  </button>

                </div>
              `).join('')
            : `
              <div class="muted">
                Todavía no hay participantes.
              </div>
            `
          }

        </div>

      </div>

    </div>
  `;
}


async function guardarParticipanteSorteo(sorteoId, sorteoNombre) {

  const nombre =
    document.getElementById('participanteNombre').value.trim();

  const usuario_red =
    document.getElementById('participanteUsuario').value.trim();

  const contacto =
    document.getElementById('participanteContacto').value.trim();

  if (!nombre) {
    toast('Introduce el nombre del participante');
    return;
  }

  const { error } = await supabaseClient
    .from('participantes_sorteo')
    .insert({
      sorteo_id: sorteoId,
      nombre,
      usuario_red,
      contacto
    });

  if (error) {
    console.error(error);
    toast('Error al añadir participante');
    return;
  }

  toast('Participante añadido');

  await abrirParticipantesSorteo(
    sorteoId,
    sorteoNombre
  );
}


async function eliminarParticipanteSorteo(
  participanteId,
  sorteoId,
  sorteoNombre
) {

  const { error } = await supabaseClient
    .from('participantes_sorteo')
    .delete()
    .eq('id', participanteId);

  if (error) {
    console.error(error);
    toast('Error eliminando participante');
    return;
  }

  toast('Participante eliminado');

  await abrirParticipantesSorteo(
    sorteoId,
    sorteoNombre
  );
}
// ==========================================
// ELEGIR GANADOR
// ==========================================

async function elegirGanadorSorteo(sorteoId) {

  const { data: existentes, error: errorExistentes } = await supabaseClient
    .from('ganadores_sorteo')
    .select(`
      *,
      participantes_sorteo (
        nombre,
        usuario_red
      )
    `)
    .eq('sorteo_id', sorteoId)
    .order('posicion', { ascending: true });

  if (errorExistentes) {
    console.error(errorExistentes);
    toast('Error comprobando ganador');
    return;
  }

 if (existentes && existentes.length > 0) {

  const ganadoresExistentes = existentes.filter(g => !g.es_suplente);
  const suplentesExistentes = existentes.filter(g => g.es_suplente);

  const textoGanadoresExistentes = ganadoresExistentes.map(g => {
    const p = g.participantes_sorteo;
    return `${g.posicion}. ${p?.nombre || 'Ganador'}${p?.usuario_red ? ' - ' + p.usuario_red : ''}`;
  }).join('\n');

  const textoSuplentesExistentes = suplentesExistentes.map(g => {
    const p = g.participantes_sorteo;
    return `${g.posicion}. ${p?.nombre || 'Suplente'}${p?.usuario_red ? ' - ' + p.usuario_red : ''}`;
  }).join('\n');

  alert(
    '🏆 ESTE SORTEO YA ESTÁ REALIZADO\n\n' +
    'GANADOR' +
    (ganadoresExistentes.length > 1 ? 'ES' : '') +
    '\n\n' +
    textoGanadoresExistentes +
    (suplentesExistentes.length
      ? '\n\n🔄 SUPLENTE' +
        (suplentesExistentes.length > 1 ? 'S' : '') +
        '\n\n' +
        textoSuplentesExistentes
      : '')
  );

  return;
} 


  const { data: sorteo, error: errorSorteo } = await supabaseClient
    .from('sorteos')
    .select('numero_ganadores, numero_suplentes')
    .eq('id', sorteoId)
    .single();

  if (errorSorteo) {
    console.error(errorSorteo);
    toast('Error cargando el sorteo');
    return;
  }


  const { data: participantes, error } = await supabaseClient
    .from('participantes_sorteo')
    .select('*')
    .eq('sorteo_id', sorteoId);

  if (error) {
    console.error(error);
    toast('Error cargando participantes');
    return;
  }

  if (!participantes || participantes.length === 0) {
    toast('No hay participantes');
    return;
  }


  const numeroGanadores = Math.min(
    Number(sorteo.numero_ganadores || 1),
    participantes.length
  );
const numeroSuplentes = Math.min(
  Number(sorteo.numero_suplentes || 0),
  Math.max(0, participantes.length - numeroGanadores)
);

  const mezclados = [...participantes];

  for (let i = mezclados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mezclados[i], mezclados[j]] = [mezclados[j], mezclados[i]];
  }

  const ganadores = mezclados.slice(0, numeroGanadores);

const suplentes = mezclados.slice(
  numeroGanadores,
  numeroGanadores + numeroSuplentes
);


 const registrosGanadores = ganadores.map((ganador, index) => ({
  sorteo_id: sorteoId,
  participante_id: ganador.id,
  posicion: index + 1,
  es_suplente: false
}));

const registrosSuplentes = suplentes.map((suplente, index) => ({
  sorteo_id: sorteoId,
  participante_id: suplente.id,
  posicion: index + 1,
  es_suplente: true
}));

const registros = [
  ...registrosGanadores,
  ...registrosSuplentes
]; 


  const { error: errorGuardar } = await supabaseClient
    .from('ganadores_sorteo')
    .insert(registros);

  if (errorGuardar) {
    console.error(errorGuardar);
    toast('Error guardando ganadores');
    return;
  }


  const textoGanadores = ganadores.map((g, index) =>
    `${index + 1}. ${g.nombre}${g.usuario_red ? ' - ' + g.usuario_red : ''}`
  ).join('\n');
const textoSuplentes = suplentes.map((s, index) =>
  `${index + 1}. ${s.nombre}${s.usuario_red ? ' - ' + s.usuario_red : ''}`
).join('\n');

  alert(
  '🏆 GANADOR' +
  (ganadores.length > 1 ? 'ES' : '') +
  ' DEL SORTEO\n\n' +
  textoGanadores +
  (suplentes.length
    ? '\n\n🔄 SUPLENTE' +
      (suplentes.length > 1 ? 'S' : '') +
      '\n\n' +
      textoSuplentes
    : '')
);

  toast('Resultado guardado');
}
function generarCartelSorteo() {

  const nombre = document.getElementById('sorteoNombre').value.trim();
  const premio = document.getElementById('sorteoPremio').value.trim();
  const fecha_inicio = document.getElementById('sorteoInicio').value || '';
  const fecha_fin = document.getElementById('sorteoFin').value || '';
  const texto = document.getElementById('sorteoTexto').value.trim();
  const condiciones = document.getElementById('sorteoCondiciones').value.trim();

  if (!nombre || !premio) {
    toast('Completa nombre y premio');
    return;
  }

  const ventana = window.open('', '_blank');

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${nombre}</title>
      <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    </head>

    <body style="
  margin:0;
  background:#eef4fb;
  font-family:Arial,Helvetica,sans-serif;
  padding:20px;
  box-sizing:border-box;
">

      <div id="cartelAIHXO" style="
  width:1080px;
        transform-origin:top left;
        min-height:1350px;
        background:white;
        border-radius:35px;
        padding:80px;
        box-sizing:border-box;
        text-align:center;
        box-shadow:0 10px 40px rgba(0,0,0,.12);
      ">

        <div style="
          font-size:78px;
          font-weight:900;
          color:#1683ff;
          letter-spacing:2px;
        ">
          AIHXO
        </div>

        <div style="
          font-size:26px;
          letter-spacing:8px;
          color:#64748b;
          margin-bottom:70px;
        ">
          GESTIÓN ONLINE
        </div>

        <div style="
          font-size:34px;
          font-weight:800;
          color:#1683ff;
          margin-bottom:20px;
        ">
          🎁 SORTEO
        </div>

        <div style="
          font-size:64px;
          font-weight:900;
          color:#14233c;
          line-height:1.1;
        ">
          ${nombre}
        </div>

        <div style="
          margin-top:55px;
          font-size:28px;
          color:#64748b;
        ">
          PREMIO
        </div>

        <div style="
          margin-top:10px;
          font-size:50px;
          font-weight:900;
          color:#14233c;
        ">
          ${premio}
        </div>

        ${
          fecha_inicio || fecha_fin
            ? `
              <div style="
                margin-top:55px;
                font-size:28px;
                color:#64748b;
              ">
                📅 ${fecha_inicio || '—'} → ${fecha_fin || '—'}
              </div>
            `
            : ''
        }

        ${
          texto
            ? `
              <div style="
                margin-top:60px;
                font-size:32px;
                line-height:1.5;
                color:#334155;
              ">
                ${texto}
              </div>
            `
            : ''
        }

        ${
          condiciones
            ? `
              <div style="
                margin-top:60px;
                padding:35px;
                border-radius:25px;
                background:#f1f5f9;
                text-align:left;
              ">
                <div style="
                  font-size:26px;
                  font-weight:800;
                  margin-bottom:15px;
                  color:#14233c;
                ">
                  Cómo participar
                </div>

                <div style="
                  font-size:28px;
                  line-height:1.5;
                  color:#475569;
                ">
                  ${condiciones}
                </div>
              </div>
            `
            : ''
        }

        <div style="
          margin-top:80px;
          font-size:28px;
          font-weight:700;
          color:#1683ff;
        ">
          @aihxo.camisetas
        </div>
         </div>
        <script>
  function ajustarCartel() {
    const cartel = document.getElementById('cartelAIHXO');
    const anchoDisponible = window.innerWidth - 40;
    const escala = Math.min(1, anchoDisponible / 1080);

    cartel.style.transform = 'scale(' + escala + ')';
    cartel.style.marginBottom =
      ((cartel.offsetHeight * escala) - cartel.offsetHeight) + 'px';
  }

  window.addEventListener('load', ajustarCartel);
  window.addEventListener('resize', ajustarCartel);
</script> 
<button
  id="guardarPNG"
  style="
    display:block;
margin:30px auto 0;
    padding:16px 24px;
    border:none;
    border-radius:14px;
    background:#1683ff;
    color:white;
    font-size:24px;
    font-weight:800;
    cursor:pointer;
  "
>
  📥 Guardar PNG
</button>

<script>
  document.getElementById('guardarPNG').onclick = async () => {
    const cartel = document.getElementById('cartelAIHXO');
const transformOriginal = cartel.style.transform;
cartel.style.transform = 'none';
    const canvas = await html2canvas(cartel, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
cartel.style.transform = transformOriginal;
   const imagen = canvas.toDataURL('image/png');

nuevaVentana.document.write(
  '<html>' +
  '<head>' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  '<title>Cartel AIHXO</title>' +
  '</head>' +
  '<body style="margin:0;background:#111;text-align:center;font-family:Arial,Helvetica,sans-serif;">' +

  '<div style="position:sticky;top:0;z-index:10;background:#111;padding:14px;text-align:left;">' +
  '<button onclick="history.back()" style="padding:12px 18px;border:none;border-radius:12px;background:#1683ff;color:white;font-size:18px;font-weight:800;">' +
  '← Volver a Sorteos' +
  '</button>' +
  '</div>' +

  '<img src="' + imagen + '" style="max-width:100%;height:auto;display:block;margin:0 auto;">' +

  '</body>' +
  '</html>'
);

nuevaVentana.document.close();
  };
</script>
     

    </body>
    </html>
  `);

  ventana.document.close();
}
async function generarCartelDesdeSorteo(sorteoId) {

  const { data: sorteo, error } = await supabaseClient
    .from('sorteos')
    .select('*')
    .eq('id', sorteoId)
    .single();

  if (error || !sorteo) {
    console.error(error);
    toast('Error cargando el sorteo');
    return;
  }
const formulario = document.getElementById('formNuevoSorteo');

if (!formulario) {
  toast('No se pudo preparar el cartel');
  return;
}
  document.getElementById('sorteoNombre').value = sorteo.nombre || '';
  document.getElementById('sorteoPremio').value = sorteo.premio || '';
  document.getElementById('sorteoInicio').value = sorteo.fecha_inicio || '';
  document.getElementById('sorteoFin').value = sorteo.fecha_fin || '';
  document.getElementById('sorteoTexto').value = sorteo.texto_promocional || '';
  document.getElementById('sorteoCondiciones').value = sorteo.condiciones || '';

  generarCartelSorteo();
}
// ==========================================
// EXPONER FUNCIONES
// ==========================================

window.sorteosView = sorteosView;
window.iniciarSorteos = iniciarSorteos;
window.cargarSorteos = cargarSorteos;
window.abrirParticipantesSorteo = abrirParticipantesSorteo;
window.guardarParticipanteSorteo = guardarParticipanteSorteo;
window.eliminarParticipanteSorteo = eliminarParticipanteSorteo;
window.elegirGanadorSorteo = elegirGanadorSorteo;
window.generarCartelSorteo = generarCartelSorteo;
window.generarCartelDesdeSorteo = generarCartelDesdeSorteo;
