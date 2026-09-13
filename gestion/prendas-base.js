(function () {
  const BUCKET_PRENDAS = 'product-images';

  function escPB(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function listaPB(valor) {
    return String(valor || '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
  }

  function slugPB(valor) {
    return String(valor || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  window.prendasBaseView = async function (contenedor) {
    if (!contenedor) return;

    contenedor.innerHTML = `
      <div class="page">
        <div class="section">
          <div>
            <h2>Prendas base</h2>
            <div class="muted">
              Modelos de prendas y sus guías de tallas
            </div>
          </div>

          <button class="primary" id="pbNueva">
            ＋ Nueva prenda
          </button>
        </div>

        <div id="pbListado">
          <div class="card">Cargando prendas...</div>
        </div>
      </div>
    `;

    document.getElementById('pbNueva').onclick = abrirFormularioPrenda;
    await cargarPrendasBase();
  };

  async function cargarPrendasBase() {
    const listado = document.getElementById('pbListado');
    if (!listado) return;

    const { data, error } = await supabaseClient
      .from('garments')
      .select('*')
      .order('manufacturer')
      .order('model');

    if (error) {
      console.error(error);
      listado.innerHTML = `
        <div class="card">
          No se pudieron cargar las prendas base.
        </div>
      `;
      return;
    }

    const prendas = data || [];

    if (!prendas.length) {
      listado.innerHTML = `
        <div class="card">
          <div class="empty">
            Todavía no hay prendas base.
            Pulsa <b>＋ Nueva prenda</b> para añadir la primera.
          </div>
        </div>
      `;
      return;
    }

    listado.innerHTML = `
      <div style="display:grid;gap:14px;">
        ${prendas.map(p => `
          <div class="card" style="padding:18px;">
            <div style="
              display:flex;
              justify-content:space-between;
              gap:14px;
              align-items:flex-start;
            ">
              <div>
                <div class="muted" style="
                  font-size:12px;
                  font-weight:900;
                  text-transform:uppercase;
                ">
                  ${escPB(p.manufacturer)}
                </div>

                <div style="
                  font-size:20px;
                  font-weight:900;
                  margin-top:3px;
                ">
                  ${escPB(p.model)}
                </div>

                <div class="muted" style="margin-top:5px;">
                  ${escPB(p.garment_type || 'Prenda')}
                  ${p.audience ? ` · ${escPB(p.audience)}` : ''}
                  ${p.grammage ? ` · ${escPB(p.grammage)}` : ''}
                </div>
              </div>

              <div style="
                font-size:12px;
                font-weight:900;
                padding:6px 9px;
                border-radius:999px;
                background:${p.active ? '#e8f7ee' : '#f2f4f7'};
              ">
                ${p.active ? 'ACTIVA' : 'INACTIVA'}
              </div>
            </div>

            <div style="margin-top:14px;">
              <div class="muted">Tallas</div>
              <b>
                ${(Array.isArray(p.sizes) && p.sizes.length)
                  ? p.sizes.map(escPB).join(', ')
                  : '—'}
              </b>
            </div>

            <div style="margin-top:10px;">
              <div class="muted">Colores</div>
              <b>
                ${(Array.isArray(p.colors) && p.colors.length)
                  ? p.colors.map(escPB).join(', ')
                  : '—'}
              </b>
            </div>
<div style="margin-top:14px;">
  <button
    class="secondary"
    type="button"
    onclick="editarPrendaBase('${p.id}')"
  >
    ✏️ Editar
  </button>
</div>
            ${p.size_guide_url ? `
              <div style="margin-top:14px;">
                <a
                  class="secondary"
                  href="${escPB(p.size_guide_url)}"
                  target="_blank"
                  rel="noopener"
                  style="
                    display:inline-block;
                    text-decoration:none;
                  "
                >
                  📏 Ver guía de tallas
                </a>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function abrirFormularioPrenda() {
    const drawer = document.getElementById('drawer');
    const body = document.getElementById('drawerBody');

    if (!drawer || !body) return;

    body.innerHTML = `
      <h2>Nueva prenda base</h2>

      <div class="muted" style="margin-bottom:18px;">
        La guía de tallas quedará asociada a este fabricante y modelo.
      </div>

      <form id="pbForm" class="form">

        <div class="field">
          <label>Fabricante *</label>
          <input
            id="pbFabricante"
            required
            placeholder="Ej. Mukua"
          >
        </div>

        <div class="field">
          <label>Modelo *</label>
          <input
            id="pbModelo"
            required
            placeholder="Ej. Camiseta infantil 150 g"
          >
        </div>

        <div class="field">
          <label>Tipo de prenda</label>
          <select id="pbTipo">
            <option value="Camiseta">Camiseta</option>
            <option value="Sudadera">Sudadera</option>
            <option value="Polo">Polo</option>
            <option value="Tote bag">Tote bag</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div class="field">
          <label>Público</label>
          <select id="pbPublico">
            <option value="Infantil">Infantil</option>
            <option value="Adulto / Unisex">Adulto / Unisex</option>
            <option value="Mujer">Mujer</option>
            <option value="Bebé">Bebé</option>
          </select>
        </div>

        <div class="field">
          <label>Tallas</label>
          <input
            id="pbTallas"
            placeholder="5/6, 7/8, 9/11, 12/13"
          >
          <div class="muted">
            Separa las tallas con comas.
          </div>
        </div>

        <div class="field">
          <label>Colores disponibles</label>
          <input
            id="pbColores"
            placeholder="Blanco, Negro, Lila"
          >
          <div class="muted">
            Separa los colores con comas.
          </div>
        </div>

        <div class="field">
          <label>Gramaje</label>
          <input
            id="pbGramaje"
            placeholder="Ej. 150 g/m²"
          >
        </div>

        <div class="field">
          <label>Guía de tallas</label>
          <input
            id="pbGuia"
            type="file"
            accept="image/*"
          >
          <div class="muted">
            Sube la imagen oficial de tallas de este modelo.
          </div>
        </div>

        <button class="primary" id="pbGuardar" type="submit">
          Guardar prenda
        </button>

      </form>
    `;

    drawer.classList.remove('hidden');

    document.getElementById('pbForm').onsubmit = guardarPrendaBase;
  }

  async function guardarPrendaBase(evento) {
    evento.preventDefault();

    const boton = document.getElementById('pbGuardar');

    const fabricante =
      document.getElementById('pbFabricante').value.trim();

    const modelo =
      document.getElementById('pbModelo').value.trim();

    const tipo =
      document.getElementById('pbTipo').value;

    const publico =
      document.getElementById('pbPublico').value;

    const tallas =
      listaPB(document.getElementById('pbTallas').value);

    const colores =
      listaPB(document.getElementById('pbColores').value);

    const gramaje =
      document.getElementById('pbGramaje').value.trim() || null;

    const guia =
      document.getElementById('pbGuia').files[0] || null;

    if (!fabricante || !modelo) {
      toast('Indica fabricante y modelo');
      return;
    }

    boton.disabled = true;
    boton.textContent = 'GUARDANDO...';

    try {
      const { data: prenda, error: errorInsert } =
        await supabaseClient
          .from('garments')
          .insert({
            manufacturer: fabricante,
            model: modelo,
            garment_type: tipo,
            audience: publico,
            sizes: tallas,
            colors: colores,
            grammage: gramaje,
            active: true
          })
          .select()
          .single();

      if (errorInsert) throw errorInsert;

      if (guia) {
        boton.textContent = 'SUBIENDO GUÍA...';

        const extension =
          (guia.name.split('.').pop() || 'jpg').toLowerCase();

        const nombreSeguro =
          `${slugPB(fabricante)}-${slugPB(modelo)}`;

        const ruta =
          `prendas-base/${nombreSeguro}/${prenda.id}/guia-tallas-${Date.now()}.${extension}`;

        const { error: errorUpload } =
          await supabaseClient
            .storage
            .from(BUCKET_PRENDAS)
            .upload(
              ruta,
              guia,
              {
                cacheControl: '3600',
                upsert: false
              }
            );

        if (errorUpload) throw errorUpload;

        const { data: publica } =
          supabaseClient
            .storage
            .from(BUCKET_PRENDAS)
            .getPublicUrl(ruta);

        const { error: errorUpdate } =
          await supabaseClient
            .from('garments')
            .update({
              size_guide_url: publica.publicUrl,
              size_guide_storage_path: ruta,
              updated_at: new Date().toISOString()
            })
            .eq('id', prenda.id);

        if (errorUpdate) throw errorUpdate;
      }

      toast('Prenda base guardada');

      if (typeof closeDrawer === 'function') {
        closeDrawer();
      } else {
        document.getElementById('drawer')?.classList.add('hidden');
      }

      await cargarPrendasBase();

    } catch (error) {
      console.error(error);
      toast('No se pudo guardar la prenda');
      boton.disabled = false;
      boton.textContent = 'Guardar prenda';
    }
  }

})();
window.editarPrendaBase = async function (id) {
  const { data: prenda, error } = await supabaseClient
    .from('garments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !prenda) {
    console.error(error);
    toast('No se pudo cargar la prenda');
    return;
  }

  const drawer = document.getElementById('drawer');
  const body = document.getElementById('drawerBody');

  if (!drawer || !body) return;

  body.innerHTML = `
    <h2>Editar prenda base</h2>

    <div class="muted" style="margin-bottom:18px;">
      Puedes corregir los datos y sustituir la guía de tallas.
    </div>

    <form id="pbEditForm" class="form">

      <div class="field">
        <label>Fabricante *</label>
        <input id="pbEditFabricante" required value="${escPB(prenda.manufacturer)}">
      </div>

      <div class="field">
        <label>Modelo *</label>
        <input id="pbEditModelo" required value="${escPB(prenda.model)}">
      </div>

      <div class="field">
        <label>Tipo de prenda</label>
        <input id="pbEditTipo" value="${escPB(prenda.garment_type || '')}">
      </div>

      <div class="field">
        <label>Público</label>
        <input id="pbEditPublico" value="${escPB(prenda.audience || '')}">
      </div>

      <div class="field">
        <label>Tallas</label>
        <input
          id="pbEditTallas"
          value="${escPB((prenda.sizes || []).join(', '))}"
        >
      </div>

      <div class="field">
        <label>Colores disponibles</label>
        <input
          id="pbEditColores"
          value="${escPB((prenda.colors || []).join(', '))}"
        >
      </div>

      <div class="field">
        <label>Gramaje</label>
        <input id="pbEditGramaje" value="${escPB(prenda.grammage || '')}">
      </div>

      <div class="field">
        <label>Nueva guía de tallas</label>
        <input id="pbEditGuia" type="file" accept="image/*">
        <div class="muted">
          Déjalo vacío si quieres conservar la guía actual.
        </div>
      </div>

      <div class="field">
        <label>
          <input
            id="pbEditActiva"
            type="checkbox"
            ${prenda.active ? 'checked' : ''}
          >
          Prenda activa
        </label>
      </div>

      <button class="primary" id="pbEditGuardar" type="submit">
        Guardar cambios
      </button>

    </form>
  `;

  drawer.classList.remove('hidden');

  document.getElementById('pbEditForm').onsubmit = async function (evento) {
    evento.preventDefault();

    const boton = document.getElementById('pbEditGuardar');
    boton.disabled = true;
    boton.textContent = 'GUARDANDO...';

    try {
      const fabricante =
        document.getElementById('pbEditFabricante').value.trim();

      const modelo =
        document.getElementById('pbEditModelo').value.trim();

      const guia =
        document.getElementById('pbEditGuia').files[0] || null;

      const cambios = {
        manufacturer: fabricante,
        model: modelo,
        garment_type:
          document.getElementById('pbEditTipo').value.trim() || null,
        audience:
          document.getElementById('pbEditPublico').value.trim() || null,
        sizes:
          listaPB(document.getElementById('pbEditTallas').value),
        colors:
          listaPB(document.getElementById('pbEditColores').value),
        grammage:
          document.getElementById('pbEditGramaje').value.trim() || null,
        active:
          document.getElementById('pbEditActiva').checked,
        updated_at: new Date().toISOString()
      };

      if (guia) {
        boton.textContent = 'SUBIENDO GUÍA...';

        const extension =
          (guia.name.split('.').pop() || 'jpg').toLowerCase();

        const nombreSeguro =
          `${slugPB(fabricante)}-${slugPB(modelo)}`;

        const ruta =
          `prendas-base/${nombreSeguro}/${prenda.id}/guia-tallas-${Date.now()}.${extension}`;

        const { error: errorUpload } =
          await supabaseClient
            .storage
            .from(BUCKET_PRENDAS)
            .upload(ruta, guia, {
              cacheControl: '3600',
              upsert: false
            });

        if (errorUpload) throw errorUpload;

        const { data: publica } =
          supabaseClient
            .storage
            .from(BUCKET_PRENDAS)
            .getPublicUrl(ruta);

        cambios.size_guide_url = publica.publicUrl;
        cambios.size_guide_storage_path = ruta;
      }

      const { error: errorUpdate } =
        await supabaseClient
          .from('garments')
          .update(cambios)
          .eq('id', prenda.id);

      if (errorUpdate) throw errorUpdate;

      toast('Prenda actualizada');

      if (typeof closeDrawer === 'function') {
        closeDrawer();
      } else {
        drawer.classList.add('hidden');
      }

      await cargarPrendasBase();

    } catch (error) {
      console.error(error);
      toast('No se pudieron guardar los cambios');
      boton.disabled = false;
      boton.textContent = 'Guardar cambios';
    }
  };
};
