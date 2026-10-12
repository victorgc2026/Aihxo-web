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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'\"]/g, '-')
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

  function listaDesdeTexto(value) {
    return String(value || '')
      .split(',')
      .map(x => x.trim())
      .filter(Boolean);
  }

  window.abrirNuevoDisenoPropio = async function () {

    window._aihxoPendingMockupFiles = [];

    const app = document.getElementById('app');

    if (!app) {
      alert('No se ha encontrado AIHXO Gestión.');
      return;
    }

    app.innerHTML = `
      <div style="max-width:760px;margin:0 auto;padding:20px 16px 60px;">
        <button type="button" onclick="volverDesdeDisenoPropio()" style="border:0;background:#eef3f9;color:#07152f;padding:10px 14px;border-radius:12px;font-weight:800;margin-bottom:20px">← Volver</button>
        <div style="background:white;border-radius:22px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
          <div style="margin-bottom:24px;">
            <div style="color:#087cf4;font-size:12px;font-weight:900;letter-spacing:1.5px;">COLECCIÓN AIHXO</div>
            <h2 style="margin:6px 0 6px;color:#07152f;font-size:28px;">Nuevo diseño propio</h2>
            <p style="margin:0;color:#667085;line-height:1.5;">Añade un nuevo diseño de AIHXO y prepara su publicación en la web.</p>
          </div>
          <form id="formDisenoPropio">
            <label class="dp-label">SKU automático<input id="dpSku" class="dp-input" type="text" value="Se asignará al guardar" readonly></label>
            <div style="font-size:12px;color:#667085;margin:-8px 0 18px;">Numeración independiente: AIHXO-DIS-00001, AIHXO-DIS-00002…</div>
            <label class="dp-label">Nombre del diseño *<input id="dpNombre" class="dp-input" type="text" placeholder="Ej. Ainhoa Mera" required></label>
            <label class="dp-label">Prenda base<select id="dpGarment" class="dp-input"><option value="">Sin asignar</option></select></label>
            <div style="font-size:12px;color:#667085;margin:-8px 0 18px;">Selecciona el fabricante y modelo. Las tallas y colores se podrán ajustar después.</div>
            <div class="dp-grid">
              <label class="dp-label">Tipo de prenda *<select id="dpTipo" class="dp-input" required><option value="camiseta">Camiseta</option><option value="sudadera">Sudadera</option><option value="tote">Tote Bag</option><option value="pantalon">Pantalón</option><option value="otro">Otro</option></select></label>
              <label class="dp-label">Público *<select id="dpPublico" class="dp-input" required><option value="infantil">Infantil</option><option value="adulto">Adulto</option><option value="unisex">Unisex</option></select></label>
            </div>
            <div class="dp-grid">
              <label class="dp-label">Precio normal (€) *<input id="dpPrecio" class="dp-input" type="number" min="0" step="0.01" placeholder="16.95" required></label>
              <label class="dp-label">Precio oferta (€)<input id="dpOferta" class="dp-input" type="number" min="0" step="0.01" placeholder="12.95"></label>
            </div>
            <label class="dp-label">Texto de la oferta<input id="dpTextoOferta" class="dp-input" type="text" placeholder="Ej. Oferta apertura"></label>
            <label class="dp-label">Descripción<textarea id="dpDescripcion" class="dp-input" rows="4" placeholder="Describe brevemente el diseño..."></textarea></label>
            <label class="dp-label">Tallas disponibles<input id="dpTallas" class="dp-input" type="text" placeholder="Ej. 3/4, 5/6, 7/8, 9/11, 12/13"></label>
            <div style="font-size:12px;color:#667085;margin:-8px 0 18px;">Separa las tallas con comas.</div>
            <div class="dp-label"><div>Colores disponibles para este diseño *</div><div style="font-size:12px;color:#667085;font-weight:500;margin:5px 0 9px">Marca únicamente los colores que quieres vender, no toda la gama de la prenda base.</div><div id="dpColorOptions" style="display:flex;flex-wrap:wrap;gap:8px"><span style="font-weight:400">Selecciona primero una prenda base.</span></div><input id="dpColores" type="hidden"></div>
            <label class="dp-label">Foto principal *<input id="dpFoto" class="dp-input" type="file" accept="image/*" required></label>
            <label class="dp-label">Fotos adicionales<input id="dpGaleria" class="dp-input" type="file" accept="image/*" multiple></label>
            <div id="dpMockupPending" style="display:none;margin:-8px 0 18px;padding:10px 12px;border-radius:12px;background:#ecfdf3;color:#067647;font-weight:800;font-size:13px"></div>
            <div style="display:flex;flex-direction:column;gap:14px;margin:22px 0;">
              <label class="dp-check"><input id="dpPublicar" type="checkbox"><span><b>Publicar en la web</b><br><small>Mostrar este diseño en Diseños propios.</small></span></label>
              <label class="dp-check"><input id="dpNovedad" type="checkbox" checked><span><b>Marcar como novedad</b><br><small>Aparecerá también en el filtro Novedades.</small></span></label>
            </div>
            <div id="dpMensaje" style="display:none;padding:14px;border-radius:12px;margin-bottom:16px;font-weight:700;"></div>
            <button id="dpGuardar" type="submit" style="width:100%;border:0;border-radius:16px;background:#087cf4;color:white;padding:17px 18px;font-size:16px;font-weight:900;cursor:pointer;">GUARDAR DISEÑO</button>
          </form>
        </div>
      </div>
    `;

    aplicarEstilosDisenoPropio();
    const [{ data: prendasBase, error: errorPrendas }, {data: variantesStock, error: errorStock}] = await Promise.all([supabaseClient.from('garments').select('*').eq('active', true).order('manufacturer').order('model'),supabaseClient.from('base_stock_items').select('garment_id,color')]);
    if(errorStock)console.warn('No se pudieron consultar colores del stock',errorStock);
    const stockColors=variantesStock||[];
    function renderColors(garmentId, fallbackColors=[]){
      const container=document.getElementById('dpColorOptions'),hidden=document.getElementById('dpColores');
      const list=[...new Set(stockColors.filter(v=>String(v.garment_id)===String(garmentId)).map(v=>String(v.color||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
      const options=list.length?list:fallbackColors;
      hidden.value='';
      if(!garmentId){container.textContent='Selecciona primero una prenda base.';return}
      if(!options.length){container.textContent='No hay colores registrados para esta prenda base. Revísala en Stock.';return}
      container.innerHTML=options.map((color,i)=>'<label style="display:inline-flex;align-items:center;gap:6px;border:1px solid #dfe4ec;border-radius:12px;padding:9px 11px;font-size:13px;font-weight:650"><input type="checkbox" data-design-color value="'+escDP(color)+'" style="width:18px;height:18px;accent-color:#087cf4">'+escDP(color)+'</label>').join('');
      container.querySelectorAll('[data-design-color]').forEach(input=>input.addEventListener('change',()=>{hidden.value=[...container.querySelectorAll('[data-design-color]:checked')].map(el=>el.value).join(', ')}));
    }
    if (errorPrendas) console.error(errorPrendas);
    else {
      const selectorPrenda = document.getElementById('dpGarment');
      (prendasBase || []).forEach(prenda => {
        const opcion = document.createElement('option');
        opcion.value = prenda.id;
        opcion.textContent = `${prenda.manufacturer} · ${prenda.model}`;
        opcion.dataset.tipo = prenda.garment_type || '';
        opcion.dataset.publico = prenda.audience || '';
        opcion.dataset.tallas = Array.isArray(prenda.sizes) ? prenda.sizes.join(', ') : '';
        opcion.dataset.colores = Array.isArray(prenda.colors) ? prenda.colors.join(', ') : '';
        selectorPrenda.appendChild(opcion);
      });
      selectorPrenda.addEventListener('change', function () {
        const opcion = this.options[this.selectedIndex]; if (!this.value) return;
        const tipo = String(opcion.dataset.tipo || '').toLowerCase();
        const publico = String(opcion.dataset.publico || '').toLowerCase();
        if (tipo.includes('camiseta')) document.getElementById('dpTipo').value = 'camiseta';
        else if (tipo.includes('sudadera')) document.getElementById('dpTipo').value = 'sudadera';
        else if (tipo.includes('tote')) document.getElementById('dpTipo').value = 'tote';
        if (publico.includes('infantil')) document.getElementById('dpPublico').value = 'infantil';
        else if (publico.includes('unisex')) document.getElementById('dpPublico').value = 'unisex';
        else if (publico.includes('adulto')) document.getElementById('dpPublico').value = 'adulto';
        document.getElementById('dpTallas').value = opcion.dataset.tallas || '';
        renderColors(this.value,listaDesdeTexto(opcion.dataset.colores||''));
      });
    }
    document.getElementById('formDisenoPropio').addEventListener('submit', guardarDisenoPropio);
  };

  function aplicarEstilosDisenoPropio() {
    if (document.getElementById('dpStyles')) return;
    const style = document.createElement('style'); style.id = 'dpStyles';
    style.textContent = `.dp-label{display:block;color:#07152f;font-weight:800;margin-bottom:18px}.dp-input{box-sizing:border-box;width:100%;margin-top:7px;padding:13px 14px;border:1px solid #d7dee8;border-radius:12px;background:#fff;color:#07152f;font-size:16px;font-family:inherit}.dp-input:focus{outline:none;border-color:#087cf4;box-shadow:0 0 0 3px rgba(8,124,244,.10)}.dp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.dp-check{display:flex;align-items:flex-start;gap:12px;padding:14px;border:1px solid #e1e6ed;border-radius:14px;color:#07152f}.dp-check input{width:20px;height:20px;margin-top:2px}.dp-check small{color:#667085;font-weight:500}@media(max-width:600px){.dp-grid{grid-template-columns:1fr;gap:0}}`;
    document.head.appendChild(style);
  }

  window.volverDesdeDisenoPropio = function () { location.reload(); };

  async function guardarDisenoPropio(event) {
    event.preventDefault();
    const boton = document.getElementById('dpGuardar');
    const mensaje = document.getElementById('dpMensaje');
    let sku = '';
    const nombre = document.getElementById('dpNombre').value.trim();
    const tipo = document.getElementById('dpTipo').value;
    const publico = document.getElementById('dpPublico').value;
    const garmentId = document.getElementById('dpGarment').value || null;
    const precio = Number(document.getElementById('dpPrecio').value || 0);
    const ofertaTexto = document.getElementById('dpOferta').value;
    const precioOferta = ofertaTexto !== '' ? Number(ofertaTexto) : null;
    const textoOferta = document.getElementById('dpTextoOferta').value.trim();
    const descripcion = document.getElementById('dpDescripcion').value.trim();
    const tallas = listaDesdeTexto(document.getElementById('dpTallas').value);
    const colores = listaDesdeTexto(document.getElementById('dpColores').value);
    const publicar = document.getElementById('dpPublicar').checked;
    const novedad = document.getElementById('dpNovedad').checked;
    const fotoPrincipal = document.getElementById('dpFoto').files[0];
    const fotosGaleria = [
      ...Array.from(document.getElementById('dpGaleria').files || []),
      ...Array.from(window._aihxoPendingMockupFiles || [])
    ];

    if (!nombre || !fotoPrincipal) { mostrarMensaje(mensaje,'Completa el nombre y la foto principal.',false); return; }
    if (precio <= 0) { mostrarMensaje(mensaje,'Introduce un precio normal válido.',false); return; }
    if(!garmentId || !colores.length){mostrarMensaje(mensaje,'Selecciona una prenda base y marca al menos un color permitido para este diseño.',false);return;}
    boton.disabled = true; boton.textContent = 'GUARDANDO DISEÑO...';

    try {
      if (typeof supabaseClient === 'undefined') throw new Error('No se ha encontrado la conexión con Supabase.');
      mostrarMensaje(mensaje,'Asignando SKU automático...',true);
      const {data:codigo,error:errorSku}=await supabaseClient.rpc('aihxo_next_sku',{p_kind:'DIS'});
      if(errorSku) throw new Error('Activa primero la migración SQL de SKU: '+errorSku.message);
      sku = codigo;
      document.getElementById('dpSku').value = sku;

      boton.textContent='SUBIENDO FOTO PRINCIPAL...';
      const extPrincipal=(fotoPrincipal.name.split('.').pop()||'jpg').toLowerCase();
      const rutaPrincipal=`disenos-propios/${sku}/principal-${Date.now()}.${extPrincipal}`;
      const {error:errorUploadPrincipal}=await supabaseClient.storage.from(AIHXO_DESIGN_BUCKET).upload(rutaPrincipal,fotoPrincipal,{cacheControl:'3600',upsert:false});
      if(errorUploadPrincipal) throw errorUploadPrincipal;
      const {data:publicPrincipal}=supabaseClient.storage.from(AIHXO_DESIGN_BUCKET).getPublicUrl(rutaPrincipal);
      const urlPrincipal=publicPrincipal.publicUrl;

      const galleryUrls=[],galleryData=[];
      for(let i=0;i<fotosGaleria.length;i++){
        boton.textContent=`SUBIENDO FOTO ${i+1} DE ${fotosGaleria.length}...`;
        const archivo=fotosGaleria[i],ext=(archivo.name.split('.').pop()||'jpg').toLowerCase();
        const ruta=`disenos-propios/${sku}/galeria-${Date.now()}-${i}.${ext}`;
        const {error:errorGaleria}=await supabaseClient.storage.from(AIHXO_DESIGN_BUCKET).upload(ruta,archivo,{cacheControl:'3600',upsert:false});
        if(errorGaleria) throw errorGaleria;
        const {data:publicGaleria}=supabaseClient.storage.from(AIHXO_DESIGN_BUCKET).getPublicUrl(ruta);
        galleryUrls.push(publicGaleria.publicUrl); galleryData.push({storage_path:ruta,public_url:publicGaleria.publicUrl});
      }

      boton.textContent='CREANDO PRODUCTO...';
      const categoria=['Diseno propio',tipo,publico,publicar?'publicado':'oculto',novedad?'novedad':''].filter(Boolean).join('|');
      let features=descripcion;if(textoOferta)features+=`${features?'\n':''}Oferta: ${textoOferta}`;
      const producto={sku,category:categoria,model:nombre,garment_id:garmentId,allowed_sizes:tallas,allowed_colors:colores,size:tallas.join(', '),color:colores.join(', '),garment_cost:0,dtf_cost:0,extras_cost:0,sale_price:precio,price_one_print:precioOferta,price_two_print:null,stock:0,features,image_url:urlPrincipal,gallery:galleryUrls};
      const {data:nuevoProducto,error:errorProducto}=await supabaseClient.from('products').insert(producto).select('id').single();
      if(errorProducto) throw errorProducto;

      const {error:errorVinculo}=await supabaseClient.from('product_garments').insert({product_id:nuevoProducto.id,garment_id:garmentId,allowed_sizes:tallas,allowed_colors:colores});
      if(errorVinculo)throw new Error('Diseño creado, pero no se pudieron guardar sus colores. Revisa el producto: '+errorVinculo.message);

      const imagenesBD=[{product_id:nuevoProducto.id,storage_path:rutaPrincipal,public_url:urlPrincipal,is_primary:true,sort_order:0}];
      galleryData.forEach((img,index)=>imagenesBD.push({product_id:nuevoProducto.id,storage_path:img.storage_path,public_url:img.public_url,is_primary:false,sort_order:index+1}));
      const {error:errorImagenes}=await supabaseClient.from('product_images').insert(imagenesBD);if(errorImagenes)throw errorImagenes;
      window._aihxoPendingMockupFiles=[];
      mostrarMensaje(mensaje,`Diseño ${escDP(nombre)} guardado correctamente.`,true);boton.textContent='DISEÑO GUARDADO ✓';
      setTimeout(()=>{if(typeof loadAll==='function'&&typeof setView==='function'){loadAll().then(()=>location.reload())}else location.reload()},1400);
    }catch(error){console.error('Error guardando diseño propio:',error);mostrarMensaje(mensaje,'No se pudo guardar el diseño: '+escDP(error.message||error),false);boton.disabled=false;boton.textContent='GUARDAR DISEÑO'}
  }

  function mostrarMensaje(elemento,texto,correcto){elemento.style.display='block';elemento.style.background=correcto?'#eaf8ef':'#fff0f0';elemento.style.color=correcto?'#157347':'#b42318';elemento.innerHTML=texto}
})();
