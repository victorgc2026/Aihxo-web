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

      <div class="card" style="padding:18px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
          <div>
            <h3 style="margin:0 0 6px;">📸 Instagram profesional</h3>
            <div class="muted" id="instagramSorteosEstado">Comprobando conexión…</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="secondary" id="configurarInstagramSorteos">⚙️ Configurar</button>
            <button class="primary" id="conectarInstagramSorteos">Conectar Instagram</button>
          </div>
        </div>
        <div id="instagramSorteosConfig" style="display:none;margin-top:14px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
            <label>Meta App ID<input id="instagramAppId" type="text" autocomplete="off" placeholder="App ID"></label>
            <label>Meta App Secret<input id="instagramAppSecret" type="password" autocomplete="off" placeholder="App Secret"></label>
            <label>Token de acceso de Instagram<input id="instagramAccessToken" type="password" autocomplete="off" placeholder="Pega aquí el token generado en Meta"></label>
          </div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="primary" id="guardarInstagramConfig">Guardar configuración</button>
            <button class="secondary" id="guardarInstagramToken">Guardar token de acceso</button>
          </div>
          <div class="muted" style="margin-top:8px;">Las credenciales se guardan en el backend y no se incluyen en el JavaScript público.</div>
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
              Enlace de la publicación de Instagram
              <input id="sorteoInstagramUrl"
                     type="url"
                     placeholder="https://www.instagram.com/p/...">
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
const configurarInstagram = document.getElementById('configurarInstagramSorteos');
const conectarInstagram = document.getElementById('conectarInstagramSorteos');
const guardarInstagramConfig = document.getElementById('guardarInstagramConfig');
const guardarInstagramToken = document.getElementById('guardarInstagramToken');
  if (nuevo) {
    nuevo.onclick = () => {
      formulario.style.display = 'block';

      const condicionesEl = document.getElementById('sorteoCondiciones');
      if (condicionesEl && !condicionesEl.value.trim()) {
        condicionesEl.value =
          '1. Dar Me gusta a la publicación del sorteo.\n' +
          '2. Seguir a @aihxo.camisetas en Instagram.\n' +
          '3. Comentar en la publicación mencionando al menos a un amigo.\n' +
          '4. Compartir la publicación en historias y mencionar a @aihxo.camisetas.\n' +
          'Cada comentario válido mencionando a una persona diferente cuenta como una participación.';
      }

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
if (configurarInstagram) {
  configurarInstagram.onclick = () => {
    const box = document.getElementById('instagramSorteosConfig');
    if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
  };
}
if (guardarInstagramConfig) guardarInstagramConfig.onclick = guardarConfiguracionInstagramSorteos;
if (guardarInstagramToken) guardarInstagramToken.onclick = guardarTokenInstagramSorteos;
if (conectarInstagram) conectarInstagram.onclick = conectarInstagramSorteos;

  await cargarEstadoInstagramSorteos();
  await cargarSorteos();
}


const INSTAGRAM_SORTEOS_ENDPOINT =
  'https://zoiesxtchnesrilpuqek.supabase.co/functions/v1/instagram-sorteos';

async function llamarInstagramSorteos(payload) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.access_token) throw new Error('Sesión no disponible');

  const respuesta = await fetch(INSTAGRAM_SORTEOS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + session.access_token
    },
    body: JSON.stringify(payload || {})
  });

  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data?.error) {
    throw new Error(data?.error || 'Error conectando con Instagram');
  }

  return data;
}

async function cargarEstadoInstagramSorteos() {
  const estado = document.getElementById('instagramSorteosEstado');
  if (!estado) return;

  try {
    const data = await llamarInstagramSorteos({ action:'status' });

    if (data.connected) {
      estado.innerHTML =
        '✅ Conectado con <b>@' + (data.username || 'Instagram') + '</b>' +
        (data.expires_at ? ' · Token hasta ' + new Date(data.expires_at).toLocaleDateString('es-ES') : '');
    } else if (data.configured) {
      estado.textContent = '⚠️ Configuración guardada, falta autorizar la cuenta de Instagram.';
    } else {
      estado.textContent = 'Sin configurar. Añade App ID y App Secret de Meta.';
    }
  } catch (error) {
    console.error(error);
    estado.textContent = 'No se pudo comprobar el estado de Instagram.';
  }
}

async function guardarConfiguracionInstagramSorteos() {
  const app_id = document.getElementById('instagramAppId')?.value.trim();
  const app_secret = document.getElementById('instagramAppSecret')?.value.trim();

  if (!app_id || !app_secret) {
    toast('Introduce App ID y App Secret');
    return;
  }

  try {
    const data = await llamarInstagramSorteos({
      action:'save_config',
      app_id,
      app_secret
    });

    toast('Configuración de Meta guardada');

    const secret = document.getElementById('instagramAppSecret');
    if (secret) secret.value = '';

    const estado = document.getElementById('instagramSorteosEstado');
    if (estado) {
      estado.textContent = 'Configuración guardada. Pulsa Conectar Instagram.';
    }

    const box = document.getElementById('instagramSorteosConfig');
    if (box) box.style.display = 'none';

    if (data.redirect_uri) {
      console.info('Instagram Redirect URI:', data.redirect_uri);
    }
  } catch (error) {
    console.error(error);
    toast(error.message || 'Error guardando configuración');
  }
}

async function guardarTokenInstagramSorteos() {
  const access_token =
    document.getElementById('instagramAccessToken')?.value.trim();

  if (!access_token) {
    toast('Introduce el token de acceso de Instagram');
    return;
  }

  try {
    const data = await llamarInstagramSorteos({
      action:'save_token',
      access_token
    });

    const tokenEl = document.getElementById('instagramAccessToken');
    if (tokenEl) tokenEl.value = '';

    toast(
      data?.username
        ? 'Instagram conectado: @' + data.username
        : 'Token de Instagram guardado'
    );

    await cargarEstadoInstagramSorteos();
  } catch (error) {
    console.error(error);
    toast(error.message || 'No se pudo guardar el token');
  }
}

async function conectarInstagramSorteos() {
  try {
    const data = await llamarInstagramSorteos({ action:'connect_url' });
    if (!data?.url) throw new Error('No se pudo crear el enlace de autorización');
    window.location.href = data.url;
  } catch (error) {
    console.error(error);
    toast(error.message || 'No se pudo conectar Instagram');
  }
}

async function sincronizarInstagramSorteo(sorteoId) {
  try {
    toast('Sincronizando Instagram…');

    const data = await llamarInstagramSorteos({
      action:'sync',
      sorteo_id:sorteoId
    });

    if ((data.comentarios || 0) === 0) {
      toast(
        'Instagram API: Reel indica ' +
        (data.comments_count_media ?? '—') +
        ' comentarios · lista recibida 0'
      );
    } else {
      toast(
        'Instagram: ' +
        (data.comentarios || 0) + ' comentarios · ' +
        (data.nuevos || 0) + ' nuevos · ' +
        (data.actualizados || 0) + ' actualizados' +
        ((data.sin_usuario || 0) ? ' · ' + data.sin_usuario + ' sin usuario' : '')
      );
    }

    await cargarSorteos();
  } catch (error) {
    console.error(error);
    toast(error.message || 'Error sincronizando Instagram');
  }
}

// ==========================================
// GUARDAR SORTEO
// ==========================================

async function guardarSorteo() {

  const nombre = document.getElementById('sorteoNombre').value.trim();
  const premio = document.getElementById('sorteoPremio').value.trim();
  const fecha_inicio = document.getElementById('sorteoInicio').value || null;
  const fecha_fin = document.getElementById('sorteoFin').value || null;
  const instagram_post_url =
    document.getElementById('sorteoInstagramUrl')?.value.trim() || null;

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
      instagram_post_url,
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
  const instagramUrlEl = document.getElementById('sorteoInstagramUrl');
  if (instagramUrlEl) instagramUrlEl.value = '';
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
      id,
      cumple_bases,
      requisito_comentario,
      requisito_mencion,
      requisito_historia,
      participacion_valida
    ),
    ganadores_sorteo (
      id,
      posicion,
      es_suplente,
      estado_validacion,
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

const participantesAptos =
  (s.participantes_sorteo || []).filter(p => p.cumple_bases).length;

const participantesCandidatos =
  (s.participantes_sorteo || []).filter(
    p => p.participacion_valida
  ).length;

const ganadores =
  (s.ganadores_sorteo || [])
    .filter(g => !g.es_suplente)
    .sort((a, b) => a.posicion - b.posicion);

const textoGanador = ganadores.length
  ? ganadores.map(g => {
      const p = g.participantes_sorteo;
      const estado = g.estado_validacion === 'confirmado'
        ? '✅ Confirmado'
        : g.estado_validacion === 'descartado'
          ? '❌ Descartado'
          : '⏳ Provisional';
      return `${p?.nombre || 'Ganador'}${p?.usuario_red ? ' · ' + p.usuario_red : ''}<br><span class="muted" style="font-size:12px;">${estado}</span>`;
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
    <div class="muted" style="font-size:12px;margin-top:3px;">
      🎲 ${participantesCandidatos} candidatos · ✅ ${participantesAptos} verificados
    </div>
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
    ${ganadores.length ? '🏆 Validar resultado' : '🎲 Elegir ganador provisional'}
  </button>
<button
  class="secondary"
  onclick="generarCartelDesdeSorteo('${s.id}')"
>
  🎨 Cartel
</button>
<button
  class="secondary"
  onclick="sincronizarInstagramSorteo('${s.id}')"
>
  🔄 Sincronizar Instagram
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

      <div style="padding:12px 14px;border-radius:12px;background:#fff8e8;color:#7a5200;font-weight:700;margin-bottom:16px;">
        Bases publicadas:
        <div style="margin-top:8px;line-height:1.6;">
          1. ❤️ Dar Me gusta a la publicación<br>
          2. 👤 Seguir a @aihxo.camisetas<br>
          3. 💬 Comentar mencionando a un amigo/a<br>
          4. 📲 Compartir la publicación en historias y mencionar a @aihxo.camisetas
        </div>
        <div style="margin-top:8px;">Cada comentario válido mencionando a una persona diferente cuenta como <b>1 participación</b>.</div>
        <div style="margin-top:8px;">Comentario + mención se comprueban automáticamente. Me gusta, seguimiento e historia se verifican al validar al ganador.</div>
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

                    <div style="margin-top:7px;font-size:12px;line-height:1.7;">
                      <button class="secondary" style="padding:4px 8px;margin:2px 4px 2px 0;"
                        onclick="toggleRequisitoParticipanteSorteo('${p.id}','requisito_like',${!p.requisito_like},'${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')">
                        ${p.requisito_like ? '✅' : '⬜'} Me gusta
                      </button>
                      <button class="secondary" style="padding:4px 8px;margin:2px 4px 2px 0;"
                        onclick="toggleRequisitoParticipanteSorteo('${p.id}','requisito_seguidor',${!p.requisito_seguidor},'${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')">
                        ${p.requisito_seguidor ? '✅' : '⬜'} Sigue a @aihxo.camisetas
                      </button>
                      <button class="secondary" style="padding:4px 8px;margin:2px 4px 2px 0;"
                        onclick="toggleRequisitoParticipanteSorteo('${p.id}','requisito_comentario',${!p.requisito_comentario},'${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')">
                        ${p.requisito_comentario ? '✅' : '⬜'} Comentó
                      </button>
                      <button class="secondary" style="padding:4px 8px;margin:2px 4px 2px 0;"
                        onclick="toggleRequisitoParticipanteSorteo('${p.id}','requisito_mencion',${!p.requisito_mencion},'${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')">
                        ${p.requisito_mencion ? '✅' : '⬜'} Mencionó a un amigo
                      </button>
                      <button class="secondary" style="padding:4px 8px;margin:2px 4px 2px 0;"
                        onclick="toggleRequisitoParticipanteSorteo('${p.id}','requisito_historia',${!p.requisito_historia},'${sorteoId}','${sorteoNombre.replace(/'/g, "\\'")}')">
                        ${p.requisito_historia ? '✅' : '⬜'} Compartió en historias
                      </button>
                    </div>
                    ${p.mencionado_usuario ? `<div class="muted" style="font-size:12px;margin-top:4px;">Participación por mención a ${p.mencionado_usuario}</div>` : ''}
                    <div style="margin-top:6px;font-size:12px;font-weight:800;color:${p.cumple_bases ? '#16803c' : '#a16207'};">
                      ${p.cumple_bases ? '✅ Cumple bases' : '⏳ Pendiente de verificar'}
                    </div>
                  </div>

                  <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">

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
      contacto,
      origen: 'manual',
      cumple_bases: false,
      requisito_like: false,
      requisito_seguidor: false,
      requisito_comentario: false,
      requisito_mencion: false,
      requisito_historia: false,
      participacion_valida: false
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
async function toggleRequisitoParticipanteSorteo(participanteId, campo, valor, sorteoId, sorteoNombre) {
  const camposPermitidos = ['requisito_like','requisito_seguidor','requisito_comentario','requisito_mencion','requisito_historia'];
  if (!camposPermitidos.includes(campo)) return;

  const { data: actual, error: errorLectura } = await supabaseClient
    .from('participantes_sorteo')
    .select('requisito_like,requisito_seguidor,requisito_comentario,requisito_mencion,requisito_historia')
    .eq('id', participanteId)
    .single();

  if (errorLectura || !actual) {
    console.error(errorLectura);
    toast('Error leyendo participante');
    return;
  }

  const siguiente = { ...actual, [campo]: !!valor };
  const cumple = !!(siguiente.requisito_like && siguiente.requisito_seguidor && siguiente.requisito_comentario && siguiente.requisito_mencion && siguiente.requisito_historia);

  const { error } = await supabaseClient
    .from('participantes_sorteo')
    .update({ [campo]: !!valor, cumple_bases: cumple, verificado_at: cumple ? new Date().toISOString() : null })
    .eq('id', participanteId);

  if (error) {
    console.error(error);
    toast('Error actualizando requisito');
    return;
  }

  toast(cumple ? '✅ Participante apto' : 'Requisito actualizado');
  await abrirParticipantesSorteo(sorteoId, sorteoNombre);
}

async function abrirValidacionGanadorSorteo(sorteoId) {
  const { data: sorteoInfo, error: errorSorteoInfo } = await supabaseClient
    .from('sorteos')
    .select('instagram_post_url')
    .eq('id', sorteoId)
    .single();

  if (errorSorteoInfo) {
    console.error(errorSorteoInfo);
  }

  const { data, error } = await supabaseClient
    .from('ganadores_sorteo')
    .select(`
      id,
      posicion,
      es_suplente,
      estado_validacion,
      participantes_sorteo (
        id,
        nombre,
        usuario_red,
        requisito_like,
        requisito_seguidor,
        requisito_comentario,
        requisito_mencion,
        requisito_historia,
        cumple_bases
      )
    `)
    .eq('sorteo_id', sorteoId)
    .order('es_suplente', { ascending: true })
    .order('posicion', { ascending: true });

  if (error) { console.error(error); toast('Error cargando resultado'); return; }

  const registros = data || [];
  const ganador = registros.find(r => !r.es_suplente && r.estado_validacion !== 'descartado');
  const suplentes = registros.filter(r => r.es_suplente && r.estado_validacion !== 'descartado');
  const contenedor = document.getElementById('listaSorteos');
  if (!contenedor) return;

  if (!ganador) {
    contenedor.innerHTML = `<div style="margin-bottom:16px;"><button class="secondary" onclick="cargarSorteos()">← Volver a sorteos</button></div><div class="card" style="padding:18px;"><h3 style="margin-top:0;">🏆 Validación del sorteo</h3><div class="muted">No hay ganador provisional activo.</div></div>`;
    return;
  }

  const p = ganador.participantes_sorteo || {};
  const confirmado = ganador.estado_validacion === 'confirmado';

  contenedor.innerHTML = `
    <div style="margin-bottom:16px;">
      <button class="secondary" onclick="cargarSorteos()">← Volver a sorteos</button>
    </div>
    <div class="card" style="padding:18px;">
      <h3 style="margin-top:0;">🏆 ${confirmado ? 'Ganador confirmado' : 'Ganador provisional'}</h3>
      <div style="font-size:20px;font-weight:900;margin-bottom:4px;">${p.nombre || 'Ganador'}</div>
      <div class="muted" style="margin-bottom:12px;">${p.usuario_red || ''}</div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${p.usuario_red ? `
          <a
            class="secondary"
            href="https://www.instagram.com/${encodeURIComponent(String(p.usuario_red).replace(/^@/,''))}/"
            target="_blank"
            rel="noopener noreferrer"
            style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;"
          >
            👤 Abrir perfil en Instagram
          </a>
        ` : ''}
        ${sorteoInfo?.instagram_post_url ? `
          <a
            class="secondary"
            href="${sorteoInfo.instagram_post_url}"
            target="_blank"
            rel="noopener noreferrer"
            style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;"
          >
            📲 Abrir publicación del sorteo
          </a>
        ` : ''}
      </div>

      <div style="padding:14px;border-radius:14px;background:#f5f8fc;margin-bottom:16px;line-height:1.8;">
        <div>✅ Comentó en la publicación</div>
        <div>✅ Mencionó a un amigo</div>
        <div>${p.requisito_like ? '✅' : '⬜'} Me gusta en la publicación</div>
        <div>${p.requisito_seguidor ? '✅' : '⬜'} Sigue a @aihxo.camisetas</div>
        <div>${p.requisito_historia ? '✅' : '⬜'} Compartió en historias y mencionó a @aihxo.camisetas</div>
      </div>
      ${!confirmado ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
          <button class="secondary" onclick="marcarRequisitoGanadorSorteo('${p.id}','requisito_like',${!p.requisito_like},'${sorteoId}')">${p.requisito_like ? '↩ Quitar Me gusta' : '❤️ Confirmar Me gusta'}</button>
          <button class="secondary" onclick="marcarRequisitoGanadorSorteo('${p.id}','requisito_seguidor',${!p.requisito_seguidor},'${sorteoId}')">${p.requisito_seguidor ? '↩ Quitar seguimiento' : '👤 Confirmar que sigue'}</button>
          <button class="secondary" onclick="marcarRequisitoGanadorSorteo('${p.id}','requisito_historia',${!p.requisito_historia},'${sorteoId}')">${p.requisito_historia ? '↩ Quitar historia' : '📲 Confirmar historia'}</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="primary" onclick="confirmarGanadorSorteo('${ganador.id}','${p.id}','${sorteoId}')" ${p.requisito_like && p.requisito_seguidor && p.requisito_historia ? '' : 'disabled'}>✅ Confirmar ganador</button>
          <button class="secondary" onclick="descartarGanadorYUsarSuplente('${ganador.id}','${sorteoId}')">❌ No cumple · usar suplente</button>
        </div>
      ` : `<div style="padding:12px 14px;border-radius:12px;background:#e8f8ee;color:#16803c;font-weight:900;">✅ Todos los requisitos verificados</div>`}
      <div style="margin-top:22px;padding-top:16px;border-top:1px solid #e8edf3;">
        <b>Suplentes</b>
        <div style="margin-top:10px;">
          ${suplentes.length ? suplentes.map(s => { const sp=s.participantes_sorteo||{}; return `<div class="muted" style="margin:6px 0;">${s.posicion}. ${sp.nombre || 'Suplente'}${sp.usuario_red ? ' · ' + sp.usuario_red : ''}</div>`; }).join('') : '<div class="muted">Sin suplentes disponibles.</div>'}
        </div>
      </div>
    </div>`;
}

async function marcarRequisitoGanadorSorteo(participanteId, campo, valor, sorteoId) {
  if (!['requisito_like','requisito_seguidor','requisito_historia'].includes(campo)) return;
  const { data: actual, error: e1 } = await supabaseClient.from('participantes_sorteo').select('requisito_like,requisito_seguidor,requisito_comentario,requisito_mencion,requisito_historia').eq('id', participanteId).single();
  if (e1 || !actual) { console.error(e1); toast('Error cargando participante'); return; }
  const siguiente = { ...actual, [campo]: !!valor };
  const cumple = !!(siguiente.requisito_like && siguiente.requisito_seguidor && siguiente.requisito_comentario && siguiente.requisito_mencion && siguiente.requisito_historia);
  const { error } = await supabaseClient.from('participantes_sorteo').update({ [campo]: !!valor, cumple_bases: cumple, verificado_at: cumple ? new Date().toISOString() : null }).eq('id', participanteId);
  if (error) { console.error(error); toast('Error actualizando requisito'); return; }
  await abrirValidacionGanadorSorteo(sorteoId);
}

async function confirmarGanadorSorteo(registroGanadorId, participanteId, sorteoId) {
  const { data: p, error: ep } = await supabaseClient.from('participantes_sorteo').select('requisito_like,requisito_seguidor,requisito_comentario,requisito_mencion,requisito_historia').eq('id', participanteId).single();
  if (ep || !p) { toast('No se pudo comprobar al ganador'); return; }
  if (!(p.requisito_like && p.requisito_seguidor && p.requisito_comentario && p.requisito_mencion && p.requisito_historia)) { toast('Falta verificar Me gusta, seguimiento o historia'); return; }
  const { error } = await supabaseClient.from('ganadores_sorteo').update({ estado_validacion:'confirmado', validado_at:new Date().toISOString(), motivo_invalidacion:null }).eq('id', registroGanadorId);
  if (error) { console.error(error); toast('Error confirmando ganador'); return; }
  await supabaseClient.from('sorteos').update({ estado:'finalizado' }).eq('id', sorteoId);
  toast('🏆 Ganador confirmado');
  await abrirValidacionGanadorSorteo(sorteoId);
}

async function descartarGanadorYUsarSuplente(registroGanadorId, sorteoId) {
  const { error: ed } = await supabaseClient.from('ganadores_sorteo').update({ estado_validacion:'descartado', motivo_invalidacion:'No cumple requisitos finales' }).eq('id', registroGanadorId);
  if (ed) { console.error(ed); toast('Error descartando ganador'); return; }
  const { data: suplente, error: es } = await supabaseClient.from('ganadores_sorteo').select('id,posicion').eq('sorteo_id', sorteoId).eq('es_suplente', true).eq('estado_validacion', 'provisional').order('posicion', { ascending:true }).limit(1).maybeSingle();
  if (es) { console.error(es); toast('Error buscando suplente'); return; }
  if (!suplente) { toast('No quedan suplentes disponibles'); await abrirValidacionGanadorSorteo(sorteoId); return; }
  const { error: ep } = await supabaseClient.from('ganadores_sorteo').update({ es_suplente:false, posicion:1, estado_validacion:'provisional' }).eq('id', suplente.id);
  if (ep) { console.error(ep); toast('Error promoviendo suplente'); return; }
  toast('Suplente promovido a ganador provisional');
  await abrirValidacionGanadorSorteo(sorteoId);
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
  await abrirValidacionGanadorSorteo(sorteoId);
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
    .eq('sorteo_id', sorteoId)
    .eq('participacion_valida', true);

  if (error) {
    console.error(error);
    toast('Error cargando participantes');
    return;
  }

  if (!participantes || participantes.length === 0) {
    toast('No hay candidatos con comentario y mención válidos');
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
  es_suplente: false,
  estado_validacion: 'provisional'
}));

const registrosSuplentes = suplentes.map((suplente, index) => ({
  sorteo_id: sorteoId,
  participante_id: suplente.id,
  posicion: index + 1,
  es_suplente: true,
  estado_validacion: 'provisional'
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


  toast('Ganador provisional elegido');
  await abrirValidacionGanadorSorteo(sorteoId);
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
        height:1350px;
display:flex;
flex-direction:column;
justify-content:center;
        background:
  radial-gradient(circle at 8% 8%, rgba(22,131,255,.12) 0, transparent 22%),
  radial-gradient(circle at 92% 92%, rgba(22,131,255,.10) 0, transparent 24%),
  white;
        border-radius:35px;
        padding:80px;
        box-sizing:border-box;
        text-align:center;
        box-shadow:0 10px 40px rgba(0,0,0,.12);
      ">

        <div style="
  font-size:72px;
  font-weight:900;
  color:#1683ff;
  letter-spacing:3px;
">
  AIHXO
</div>

<div style="
  font-size:24px;
  letter-spacing:8px;
  color:#64748b;
  margin-bottom:45px;
">
  CAMISETAS PERSONALIZADAS
</div>

<div style="
  display:inline-block;
  align-self:center;
  padding:12px 28px;
  border-radius:999px;
  background:#e8f3ff;
  color:#1683ff;
  font-size:30px;
  font-weight:900;
  margin-bottom:28px;
">
  🎁 SORTEO AIHXO
</div>

<div style="
  font-size:62px;
  font-weight:900;
  color:#14233c;
  line-height:1.1;
">
  ${nombre}
</div>

<div style="
  margin:40px auto 0;
  padding:30px;
  max-width:780px;
  border-radius:28px;
  background:#1683ff;
  color:white;
">
  <div style="
    font-size:24px;
    font-weight:700;
    letter-spacing:3px;
    opacity:.9;
  ">
    PUEDES GANAR
  </div>

  <div style="
    margin-top:10px;
    font-size:48px;
    font-weight:900;
  ">
    ${premio}
  </div>
</div>

${
  texto
    ? `
      <div style="
        margin:35px auto 0;
        max-width:800px;
        font-size:30px;
        line-height:1.4;
        color:#334155;
        font-weight:600;
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
        margin:35px auto 0;
        max-width:800px;
        padding:28px 34px;
        border-radius:25px;
        background:#f1f5f9;
        text-align:left;
      ">
        <div style="
          font-size:25px;
          font-weight:900;
          color:#1683ff;
          margin-bottom:12px;
        ">
          ¿CÓMO PARTICIPAR?
        </div>

        <div style="
          font-size:26px;
          line-height:1.4;
          color:#334155;
        ">
          ${condiciones}
        </div>
      </div>
    `
    : ''
}

${
  fecha_inicio || fecha_fin
    ? `
      <div style="
        margin-top:35px;
        font-size:26px;
        color:#64748b;
        font-weight:700;
      ">
        📅 ${fecha_inicio || '—'} → ${fecha_fin || '—'}
      </div>
    `
    : ''
}

<div style="
  margin-top:35px;
  display:inline-block;
  align-self:center;
  padding:18px 45px;
  border-radius:999px;
  background:#14233c;
  color:white;
  font-size:30px;
  font-weight:900;
">
  🎁 ¡PARTICIPA!
</div>

<div style="
  margin-top:30px;
  font-size:27px;
  font-weight:900;
  color:#1683ff;
">
  @aihxo.camisetas
</div>

<div style="
  margin-top:12px;
  font-size:20px;
  color:#94a3b8;
">
  Hecho en Oleiros · AIHXO
</div>
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
  onclick="window.close()"
  style="
    display:block;
    margin:0 auto 18px;
    padding:14px 22px;
    border:none;
    border-radius:14px;
    background:#0f1f3a;
    color:white;
    font-size:20px;
    font-weight:800;
    cursor:pointer;
  "
>
  ← Volver a Sorteos
</button>
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
const nuevaVentana = window.open('', '_blank');
nuevaVentana.document.write(
  '<html>' +
  '<head>' +
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
  '<title>Cartel AIHXO</title>' +
  '</head>' +
  '<body style="margin:0;background:#111;text-align:center;font-family:Arial,Helvetica,sans-serif;">' +

  '<div style="position:sticky;top:0;z-index:10;background:#111;padding:14px;text-align:left;">' +
  '<button onclick="window.close()" style="padding:12px 18px;border:none;border-radius:12px;background:#1683ff;color:white;font-size:18px;font-weight:800;">' +
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
window.toggleRequisitoParticipanteSorteo = toggleRequisitoParticipanteSorteo;
window.calcularCumpleBasesSorteo = function(p) {
  return !!(
    p?.requisito_like &&
    p?.requisito_seguidor &&
    p?.requisito_comentario &&
    p?.requisito_mencion &&
    p?.requisito_historia
  );
};
window.elegirGanadorSorteo = elegirGanadorSorteo;
window.abrirValidacionGanadorSorteo = abrirValidacionGanadorSorteo;
window.marcarRequisitoGanadorSorteo = marcarRequisitoGanadorSorteo;
window.confirmarGanadorSorteo = confirmarGanadorSorteo;
window.descartarGanadorYUsarSuplente = descartarGanadorYUsarSuplente;
window.generarCartelSorteo = generarCartelSorteo;
window.generarCartelDesdeSorteo = generarCartelDesdeSorteo;
window.sincronizarInstagramSorteo = sincronizarInstagramSorteo;
