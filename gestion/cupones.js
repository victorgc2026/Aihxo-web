function generarCodigoColaborador(nombre = 'COLAB') {
  const base = String(nombre || 'COLAB')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'COLAB';

  const aleatorio = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `${base}${aleatorio}`;
}

async function crearCuponColaborador({
  collaborator_name,
  discount_type,
  discount_value,
  minimum_order,
  max_uses,
  expires_at
}) {
  const code = generarCodigoColaborador(collaborator_name);

  const payload = {
    code,
    description: `Cupón colaborador ${collaborator_name || ''}`.trim(),
    discount_type,
    discount_value: Number(discount_value || 0),
    minimum_order: Number(minimum_order || 0),
    active: true,
    collaborator_name: collaborator_name || null,
    max_uses: max_uses ? Number(max_uses) : null,
    expires_at: expires_at || null
  };

  const { data, error } = await supabaseClient
    .from('coupons')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    toast(error.message || 'No se pudo crear el cupón');
    return null;
  }

  toast(`Cupón creado: ${data.code}`);
  return data;
}

function cuponesView(c) {
  c.innerHTML = `
    <div class="page">

      <div class="section">
        <div>
          <h2>Cupones y colaboradores</h2>
          <div class="muted">
            Genera códigos promocionales y controla sus condiciones.
          </div>
        </div>
      </div>

      <div class="card">
        <form id="formCuponColaborador" class="form">

          <div class="field">
            <label>Nombre del colaborador</label>
            <input
              id="cuponColaboradorNombre"
              placeholder="Ej. Laura"
              required
            >
          </div>

          <div class="formgrid">

            <div class="field">
              <label>Tipo de descuento</label>
              <select id="cuponTipo">
                <option value="percent">Porcentaje</option>
                <option value="fixed">Importe fijo</option>
                <option value="free_shipping">Envío gratis</option>
              </select>
            </div>

            <div class="field">
              <label>Valor</label>
              <input
                id="cuponValor"
                type="number"
                min="0"
                step="0.01"
                value="10"
              >
            </div>

          </div>

          <div class="formgrid">

            <div class="field">
              <label>Compra mínima</label>
              <input
                id="cuponMinimo"
                type="number"
                min="0"
                step="0.01"
                value="0"
              >
            </div>

            <div class="field">
              <label>Máximo de usos</label>
              <input
                id="cuponUsos"
                type="number"
                min="1"
                step="1"
                placeholder="Sin límite"
              >
            </div>

          </div>

          <div class="field">
            <label>Fecha de caducidad</label>
            <input
              id="cuponCaduca"
              type="date"
            >
          </div>

          <button class="primary" type="submit">
            Generar cupón
          </button>

        </form>
      </div>

      <div class="card" style="margin-top:18px;">
        <div class="section">
          <h3>Último cupón generado</h3>
        </div>

        <div id="ultimoCuponGenerado" class="muted">
          Aún no has generado ningún cupón.
        </div>
      </div>
      <div class="card" style="margin-top:18px;">
  <div class="section">
    <div>
      <h3>Todos los cupones</h3>
      <div class="muted">
        Activa, desactiva y controla el uso de cada código.
      </div>
    </div>

    <button
      type="button"
      class="secondary"
      onclick="cargarListaCupones()"
    >
      Actualizar
    </button>
  </div>

  <div id="listaCupones">
    <div class="muted">Cargando cupones...</div>
  </div>
</div>

    </div>
  `;

  const tipo = document.getElementById('cuponTipo');
  const valor = document.getElementById('cuponValor');
  cargarListaCupones();

  tipo.onchange = () => {
    if (tipo.value === 'free_shipping') {
      valor.value = 0;
      valor.disabled = true;
    } else {
      valor.disabled = false;
      if (Number(valor.value || 0) === 0) {
        valor.value = tipo.value === 'percent' ? 10 : 5;
      }
    }
  };

  document.getElementById('formCuponColaborador').onsubmit = async e => {
    e.preventDefault();

    const collaborator_name =
      document.getElementById('cuponColaboradorNombre').value.trim();

    const discount_type =
      document.getElementById('cuponTipo').value;

    const discount_value =
      document.getElementById('cuponValor').value;

    const minimum_order =
      document.getElementById('cuponMinimo').value;

    const max_uses =
      document.getElementById('cuponUsos').value;

    const fecha =
      document.getElementById('cuponCaduca').value;

    const expires_at =
      fecha ? `${fecha}T23:59:59` : null;

    const creado = await crearCuponColaborador({
      collaborator_name,
      discount_type,
      discount_value,
      minimum_order,
      max_uses,
      expires_at
    });

    if (!creado) return;

    document.getElementById('ultimoCuponGenerado').innerHTML = `
      <div style="
        font-size:28px;
        font-weight:900;
        color:#087cf4;
        letter-spacing:1px;
        margin-bottom:8px;
      ">
        ${creado.code}
      </div>

      <div>
        Colaborador:
        <b>${creado.collaborator_name || '—'}</b>
      </div>

      <div>
        Tipo:
        <b>${creado.discount_type}</b>
      </div>

      <div>
        Compra mínima:
        <b>${money(creado.minimum_order || 0)}</b>
      </div>

      <div>
        Usos máximos:
        <b>${creado.max_uses || 'Sin límite'}</b>
      </div>
    `;
  };
}
async function cargarListaCupones() {
  const contenedor = document.getElementById('listaCupones');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="muted">Cargando cupones...</div>';

  const { data, error } = await supabaseClient
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    contenedor.innerHTML =
      '<div class="muted">No se pudieron cargar los cupones.</div>';
    return;
  }

  const cupones = data || [];

  if (!cupones.length) {
    contenedor.innerHTML =
      '<div class="muted">Todavía no hay cupones creados.</div>';
    return;
  }

  contenedor.innerHTML = cupones.map(c => {
    const tipoTexto =
      c.discount_type === 'percent'
        ? `${Number(c.discount_value || 0)} %`
        : c.discount_type === 'fixed'
          ? money(c.discount_value || 0)
          : 'Envío gratis';

    const caducidad = c.expires_at
      ? new Date(c.expires_at).toLocaleDateString('es-ES')
      : 'Sin caducidad';

    const usosMaximos =
      c.max_uses == null ? 'Sin límite' : c.max_uses;

    const estado = c.active ? 'Activo' : 'Inactivo';

    return `
      <div class="card" style="margin-top:12px;padding:16px;">
        <div style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
        ">
          <div>
            <div style="
              font-size:20px;
              font-weight:900;
              color:#07152f;
              margin-bottom:4px;
            ">
              ${c.code}
            </div>

            <div class="muted">
              ${c.collaborator_name || c.description || 'Cupón AIHXO'}
            </div>
          </div>

          <div style="
            font-weight:900;
            color:${c.active ? '#15803d' : '#b91c1c'};
          ">
            ${estado}
          </div>
        </div>

        <div style="margin-top:14px;display:grid;gap:6px;">
          <div>
            Descuento:
            <b>${tipoTexto}</b>
          </div>

          <div>
            Compra mínima:
            <b>${money(c.minimum_order || 0)}</b>
          </div>

          <div>
            Usos:
            <b>${c.uses_count || 0} / ${usosMaximos}</b>
          </div>

          <div>
            Caducidad:
            <b>${caducidad}</b>
          </div>
        </div>

        <button
          type="button"
          class="${c.active ? 'secondary' : 'primary'}"
          style="margin-top:14px;width:100%;"
          onclick="cambiarEstadoCupon('${c.id}', ${!c.active})"
        >
          ${c.active ? 'Desactivar cupón' : 'Reactivar cupón'}
        </button>
      </div>
    `;
  }).join('');
}

async function cambiarEstadoCupon(id, nuevoEstado) {
  const { error } = await supabaseClient
    .from('coupons')
    .update({ active: nuevoEstado })
    .eq('id', id);

  if (error) {
    console.error(error);
    toast(error.message || 'No se pudo actualizar el cupón');
    return;
  }

  toast(nuevoEstado ? 'Cupón reactivado' : 'Cupón desactivado');
  await cargarListaCupones();
}

window.cargarListaCupones = cargarListaCupones;
window.cambiarEstadoCupon = cambiarEstadoCupon;
window.cuponesView = cuponesView;
window.generarCodigoColaborador = generarCodigoColaborador;
window.crearCuponColaborador = crearCuponColaborador;
