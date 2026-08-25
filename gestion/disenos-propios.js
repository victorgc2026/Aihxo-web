/* =========================================================
   AIHXO · NUEVOS DISEÑOS PROPIOS
   Alta rápida desde AIHXO Gestión
   ========================================================= */

(function () {

  const AIHXO_DESIGN_BUCKET = 'product-images';

  function escDP(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizarSKU(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '-');
  }

  function listaDesdeTexto(value) {
    return String(value || '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
  }

  window.abrirNuevoDisenoPropio = function () {

    const app = document.getElementById('app');

    if (!app) {
      alert('No se ha encontrado AIHXO Gestión.');
      return;
    }

    app.innerHTML = `
      <div style="
        max-width:760px;
        margin:0 auto;
        padding:20px 16px 60px;
      ">

        <button
          type="button"
          onclick="volverDesdeDisenoPropio()"
          style="
            border:0;
            background:#eef3f9;
            color:#07152f;
            padding:10px 14px;
            border-radius:12px;
            font-weight:800;
            margin-bottom:20px;
          ">
          ← Volver
        </button>

        <div style="
          background:white;
          border-radius:22px;
          padding:22px;
          box-shadow:0 10px 30px rgba(0,0,0,.08);
        ">

          <div style="margin-bottom:24px;">
            <div style="
              color:#087cf4;
              font-size:12px;
              font-weight:900;
              letter-spacing:1.5px;
            ">
              COLECCIÓN AIHXO
            </div>

            <h2 style="
              margin:6px 0 6px;
              color:#07152f;
              font-size:28px;
            ">
              Nuevo diseño propio
            </h2>

            <p style="
              margin:0;
              color:#667085;
              line-height:1.5;
            ">
              Añade un nuevo diseño de AIHXO y prepara su publicación en la web.
            </p>
          </div>

          <form id="formDisenoPropio">

            <label class="dp-label">
              SKU *
              <input
                id="dpSku"
                class="dp-input"
                type="text"
                placeholder="Ej. AIHXO-002"
                autocomplete="off"
                required
              >
            </label>

            <div style="
              font-size:12px;
              color:#667085;
              margin:-8px 0 18px;
            ">
              El SKU lo introduces tú. AIHXO comprobará que no esté repetido.
            </div>

            <label class="dp-label">
              Nombre del diseño *
              <input
                id="dpNombre"
                class="dp-input"
                type="text"
                placeholder="Ej. Ainhoa Mera"
                required
              >
            </label>

            <div class="dp-grid">

              <label class="dp-label">
                Tipo de prenda *
                <select id="dpTipo" class="dp-input" required>
                  <option value="camiseta">Camiseta</option>
                  <option value="sudadera">Sudadera</option>
                  <option value="tote">Tote Bag</option>
                  <option value="pantalon">Pantalón</option>
                  <option value="otro">Otro</option>
                </select>
              </label>

              <label class="dp-label">
                Público *
                <select id="dpPublico" class="dp-input" required>
                  <option value="infantil">Infantil</option>
                  <option value="adulto">Adulto</option>
                  <option value="unisex">Unisex</option>
                </select>
              </label>

            </div>

            <div class="dp-grid">

              <label class="dp-label">
                Precio normal (€) *
                <input
                  id="dpPrecio"
                  class="dp-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="16.95"
                  required
                >
              </label>

              <label class="dp-label">
                Precio oferta (€)
                <input
                  id="dpOferta"
                  class="dp-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.95"
                >
              </label>

            </div>

            <label class="dp-label">
              Texto de la oferta
              <input
                id="dpTextoOferta"
                class="dp-input"
                type="text"
                placeholder="Ej. Oferta apertura"
              >
            </label>

            <label class="dp-label">
              Descripción
              <textarea
                id="dpDescripcion"
                class="dp-input"
                rows="4"
                placeholder="Describe brevemente el diseño..."
              ></textarea>
            </label>

            <label class="dp-label">
              Tallas disponibles
              <input
                id="dpTallas"
                class="dp-input"
                type="text"
                placeholder="Ej. 3/4, 5/6, 7/8, 9/11, 12/13"
              >
            </label>

            <div style="
              font-size:12px;
              color:#667085;
              margin:-8px 0 18px;
            ">
              Separa las tallas con comas.
            </div>

            <label class="dp-label">
              Colores disponibles
              <input
                id="dpColores"
                class="dp-input"
                type="text"
                placeholder="Ej. Rosa, Blanco, Negro"
              >
            </label>

            <label class="dp-label">
              Foto principal *
              <input
                id="dpFoto"
                class="dp-input"
                type="file"
                accept="image/*"
                required
              >
            </label>

            <label class="dp-label">
              Fotos adicionales
              <input
                id="dpGaleria"
                class="dp-input"
                type="file"
                accept="image/*"
                multiple
              >
            </label>

            <div style="
              display:flex;
              flex-direction:column;
              gap:14px;
              margin:22px 0;
            ">

              <label class="dp-check">
                <input id="dpPublicar" type="checkbox" checked>
                <span>
                  <b>Publicar en la web</b><br>
                  <small>Mostrar este diseño en Diseños propios.</small>
                </span>
              </label>

              <label class="dp-check">
                <input id="dpNovedad" type="checkbox" checked>
                <span>
                  <b>Marcar como novedad</b><br>
                  <small>Aparecerá también en el filtro Novedades.</small>
                </span>
              </label>

            </div>

            <div
              id="dpMensaje"
              style="
                display:none;
                padding:14px;
                border-radius:12px;
                margin-bottom:16px;
                font-weight:700;
              ">
            </div>

            <button
              id="dpGuardar"
              type="submit"
              style="
                width:100%;
                border:0;
                border-radius:16px;
                background:#087cf4;
                color:white;
                padding:17px 18px;
                font-size:16px;
                font-weight:900;
                cursor:pointer;
              ">
              GUARDAR Y PUBLICAR
            </button>

          </form>

        </div>
      </div>
    `;

    aplicarEstilosDisenoPropio();

    document
      .getElementById('formDisenoPropio')
      .addEventListener('submit', guardarDisenoPropio);
  };


  function aplicarEstilosDisenoPropio() {

    if (document.getElementById('dpStyles')) return;

    const style = document.createElement('style');

    style.id = 'dpStyles';

    style.textContent = `
      .dp-label{
        display:block;
        color:#07152f;
        font-weight:800;
        margin-bottom:18px;
      }

      .dp-input{
        box-sizing:border-box;
        width:100%;
        margin-top:7px;
        padding:13px 14px;
        border:1px solid #d7dee8;
        border-radius:12px;
        background:#fff;
        color:#07152f;
        font-size:16px;
        font-family:inherit;
      }

      .dp-input:focus{
        outline:none;
        border-color:#087cf4;
        box-shadow:0 0 0 3px rgba(8,124,244,.10);
      }

      .dp-grid{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:14px;
      }

      .dp-check{
        display:flex;
        align-items:flex-start;
        gap:12px;
        padding:14px;
        border:1px solid #e1e6ed;
        border-radius:14px;
        color:#07152f;
      }

      .dp-check input{
        width:20px;
        height:20px;
        margin-top:2px;
      }

      .dp-check small{
        color:#667085;
        font-weight:500;
      }

      @media(max-width:600px){
        .dp-grid{
          grid-template-columns:1fr;
          gap:0;
        }
      }
    `;

    document.head.appendChild(style);
  }


  window.volverDesdeDisenoPropio = function () {
    location.reload();
  };


  async function guardarDisenoPropio(event) {

    event.preventDefault();

    const boton = document.getElementById('dpGuardar');
    const mensaje = document.getElementById('dpMensaje');

    const sku = normalizarSKU(
      document.getElementById('dpSku').value
    );

    const nombre =
      document.getElementById('dpNombre').value.trim();

    if (!sku || !nombre) {
      mostrarMensaje(
        mensaje,
        'Completa el SKU y el nombre del diseño.',
        false
      );
      return;
    }

    boton.disabled = true;
    boton.textContent = 'COMPROBANDO SKU...';

    try {

     if (typeof supabaseClient === 'undefined') {
        throw new Error(
          'No se ha encontrado la conexión de AIHXO con Supabase.'
        );
      }

      const { data: existente, error: errorSku } = await supabaseClient
        .from('products')
        .select('id,sku')
        .eq('sku', sku)
        .limit(1);

      if (errorSku) throw errorSku;

      if (existente && existente.length) {
        mostrarMensaje(
          mensaje,
          `El SKU ${escDP(sku)} ya existe. Introduce otro SKU.`,
          false
        );

        boton.disabled = false;
        boton.textContent = 'GUARDAR Y PUBLICAR';
        return;
      }

      mostrarMensaje(
        mensaje,
        'SKU disponible. El formulario está preparado para guardar el nuevo diseño.',
        true
      );

      boton.disabled = false;
      boton.textContent = 'GUARDAR Y PUBLICAR';

    } catch (error) {

      console.error(error);

      mostrarMensaje(
        mensaje,
        'No se ha podido comprobar el SKU: ' +
          escDP(error.message || error),
        false
      );

      boton.disabled = false;
      boton.textContent = 'GUARDAR Y PUBLICAR';
    }
  }


  function mostrarMensaje(elemento, texto, correcto) {

    elemento.style.display = 'block';

    elemento.style.background =
      correcto ? '#eaf8ef' : '#fff0f0';

    elemento.style.color =
      correcto ? '#157347' : '#b42318';

    elemento.innerHTML = texto;
  }

})();
