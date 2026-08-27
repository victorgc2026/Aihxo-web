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

    </div>
  `;

  const tipo = document.getElementById('cuponTipo');
  const valor = document.getElementById('cuponValor');

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

window.cuponesView = cuponesView;
window.generarCodigoColaborador = generarCodigoColaborador;
window.crearCuponColaborador = crearCuponColaborador;
