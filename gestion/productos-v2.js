/* AIHXO · Productos v2
   La prenda física vive en garments/base_stock_items.
   Products guarda el artículo/diseño comercial y sus variantes permitidas.
*/
(function(){
  function valores(v){
    if(Array.isArray(v)) return v.filter(Boolean).map(String);
    if(!v) return [];
    try { const p=JSON.parse(v); return Array.isArray(p)?p.filter(Boolean).map(String):[]; }
    catch(_){ return []; }
  }

  function unicos(lista){
    return [...new Set((lista||[]).filter(Boolean).map(v=>String(v).trim()).filter(Boolean))];
  }

  function pintarChecks(contenedor,nombre,opciones,seleccionadas){
    if(!contenedor) return;
    const elegidas=new Set(valores(seleccionadas));
    contenedor.innerHTML=opciones.length ? opciones.map(v=>`
      <label style="display:flex;align-items:center;gap:8px;padding:9px 10px;border:1px solid #e4e7ec;border-radius:10px;background:#fff;">
        <input type="checkbox" name="${nombre}" value="${esc(v)}" ${elegidas.has(v)?'checked':''}>
        <span>${esc(v)}</span>
      </label>`).join('') : '<div class="muted">Esta prenda todavía no tiene variantes en Stock.</div>';
  }

  async function cargarPrendas(producto){
    const selector=document.getElementById('pfGarment');
    const tallas=document.getElementById('pfAllowedSizes');
    const colores=document.getElementById('pfAllowedColors');
    if(!selector||!tallas||!colores) return;

    const [{data:garments,error},{data:stock,error:stockError}]=await Promise.all([
      supabaseClient.from('garments').select('id,manufacturer,model,active').order('manufacturer').order('model'),
      supabaseClient.from('base_stock_items').select('garment_id,size,color')
    ]);

    if(error||stockError){
      console.error(error||stockError);
      toast('No se pudieron cargar las prendas base');
      return;
    }

    const prendas=garments||[];
    const variantes=stock||[];
    selector.innerHTML='<option value="">Selecciona una prenda base</option>'+prendas.map(g=>`
      <option value="${g.id}" ${producto.garment_id===g.id?'selected':''} ${g.active===false&&producto.garment_id!==g.id?'disabled':''}>
        ${esc(g.manufacturer)} · ${esc(g.model)}${g.active?'':' · INACTIVA'}
      </option>`).join('');

    const refrescar=(usarGuardado=true)=>{
      const garmentId=selector.value;
      if(!garmentId){
        pintarChecks(tallas,'allowed_sizes',[],[]);
        pintarChecks(colores,'allowed_colors',[],[]);
        return;
      }

      const reales=variantes.filter(v=>String(v.garment_id)===String(garmentId));
      const tallasDisponibles=unicos(reales.map(v=>v.size));
      const coloresDisponibles=unicos(reales.map(v=>v.color));
      const tallasGuardadas=valores(producto.allowed_sizes).filter(v=>tallasDisponibles.includes(v));
      const coloresGuardados=valores(producto.allowed_colors).filter(v=>coloresDisponibles.includes(v));
      const tallasElegidas=usarGuardado&&garmentId===producto.garment_id&&tallasGuardadas.length?tallasGuardadas:tallasDisponibles;
      const coloresElegidos=usarGuardado&&garmentId===producto.garment_id&&coloresGuardados.length?coloresGuardados:coloresDisponibles;

      pintarChecks(tallas,'allowed_sizes',tallasDisponibles,tallasElegidas);
      pintarChecks(colores,'allowed_colors',coloresDisponibles,coloresElegidos);
    };

    selector.addEventListener('change',()=>refrescar(false));
    refrescar(true);
  }

  window.obtenerVariantesPermitidasProducto=function(form){
    return {
      allowed_sizes:[...form.querySelectorAll('input[name="allowed_sizes"]:checked')].map(x=>x.value),
      allowed_colors:[...form.querySelectorAll('input[name="allowed_colors"]:checked')].map(x=>x.value)
    };
  };

  window.productForm=async function(id){
    const p=id ? products.find(x=>String(x.id)===String(id)) : {
      sku:'',category:'Camiseta',model:'',garment_id:null,
      commercial_visibility:'normal',allowed_sizes:[],allowed_colors:[],
      dtf_cost:0,extras_cost:0,sale_price:0,price_one_print:null,price_two_print:null,
      image_url:''
    };
    if(!p){ toast('Producto no encontrado'); return; }

    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML=`
      <h2>${id?'Editar':'Nuevo'} producto</h2>
      <div class="muted" style="margin-bottom:18px;line-height:1.45;">Aquí guardamos el diseño o artículo comercial. La camiseta física, sus tallas, colores y stock se gestionan en <b>Prendas base</b>.</div>
      <form class="form" id="pfV2">
        <div class="formgrid">
          <div class="field"><label>SKU del diseño/artículo</label><input name="sku" value="${esc(p.sku||'')}" required autocomplete="off"></div>
          <div class="field"><label>Categoría</label><select name="category"><option value="Camiseta" ${String(p.category||'').includes('Camiseta')?'selected':''}>Camiseta</option><option value="Bolso" ${String(p.category||'')==='Bolso'?'selected':''}>Bolso</option></select></div>
        </div>
        <div class="field"><label>Nombre del diseño / producto</label><input name="model" value="${esc(p.model||'')}" required placeholder="Ej. Atlantic Culture"></div>
        <div class="field"><label>Prenda base utilizada</label><select name="garment_id" id="pfGarment" required></select><div class="muted" style="margin-top:6px;">Las tallas y colores se obtienen de las variantes reales registradas en Stock.</div></div>
        <div class="field"><label>Tallas permitidas para este diseño</label><div id="pfAllowedSizes" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px;"></div><div class="muted" style="margin-top:6px;">Por defecto se activan todas las tallas existentes de esa prenda. Desmarca las que no quieras vender con este diseño.</div></div>
        <div class="field"><label>Colores permitidos para este diseño</label><div id="pfAllowedColors" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px;"></div></div>
        <div class="field"><label>Visibilidad comercial</label><select name="commercial_visibility"><option value="destacado" ${p.commercial_visibility==='destacado'?'selected':''}>⭐ Destacado</option><option value="prioritario" ${p.commercial_visibility==='prioritario'?'selected':''}>🔥 Prioritario</option><option value="normal" ${!p.commercial_visibility||p.commercial_visibility==='normal'?'selected':''}>Normal</option><option value="baja" ${p.commercial_visibility==='baja'?'selected':''}>Baja visibilidad</option><option value="oculto" ${p.commercial_visibility==='oculto'?'selected':''}>🙈 Oculto</option></select></div>
        <div class="field"><label>Foto principal</label><input id="productImageV2" type="file" accept="image/*"><div style="margin-top:10px;">${p.image_url?`<img src="${esc(p.image_url)}" alt="Foto del producto" style="width:100%;max-width:220px;border-radius:14px;display:block">`:'<div class="muted">Sin foto principal</div>'}</div></div>
        <h3 style="margin-top:22px">Precios y costes del diseño</h3>
        <div class="formgrid"><div class="field"><label>Coste DTF</label><input name="dtf_cost" type="number" step=".01" value="${Number(p.dtf_cost||0)}"></div><div class="field"><label>Extras</label><input name="extras_cost" type="number" step=".01" value="${Number(p.extras_cost||0)}"></div></div>
        <div class="field"><label>Precio de venta</label><input name="sale_price" type="number" step=".01" value="${Number(p.sale_price||0)}"></div>
        <div class="formgrid"><div class="field"><label>Oferta · 1 impresión</label><input name="price_one_print" type="number" step=".01" value="${p.price_one_print??''}"></div><div class="field"><label>Oferta · 2 impresiones</label><input name="price_two_print" type="number" step=".01" value="${p.price_two_print??''}"></div></div>
        <div style="padding:12px 14px;border-radius:12px;background:#f7f9fc;margin:8px 0 16px;line-height:1.45;"><b>Stock:</b> se controla desde la prenda base y sus variantes de talla/color. Ya no se crea stock separado para cada diseño.</div>
        <button class="primary">Guardar producto</button>
      </form>`;

    await cargarPrendas(p);
    $('#pfV2').onsubmit=async e=>{
      e.preventDefault();
      const form=e.target,f=new FormData(form),sku=String(f.get('sku')||'').trim();
      const duplicate=products.find(x=>String(x.sku||'').trim().toLowerCase()===sku.toLowerCase()&&String(x.id)!==String(id||''));
      if(duplicate){toast('Ese SKU ya está asignado a otro producto');return;}
      const garmentId=f.get('garment_id')||null;
      if(!garmentId){toast('Selecciona una prenda base');return;}
      const permitidas=window.obtenerVariantesPermitidasProducto(form);
      if(!permitidas.allowed_sizes.length){toast('Selecciona al menos una talla');return;}
      if(!permitidas.allowed_colors.length){toast('Selecciona al menos un color');return;}

      let imageUrl=p.image_url||'';
      const imageFile=document.getElementById('productImageV2')?.files?.[0];
      if(imageFile){
        const ext=(imageFile.name.split('.').pop()||'png').toLowerCase(),safeSku=sku.replace(/[^a-zA-Z0-9-_]/g,'-')||'producto',fileName=`${safeSku}-${Date.now()}.${ext}`;
        const upload=await supabaseClient.storage.from('product-images').upload(fileName,imageFile,{cacheControl:'3600',upsert:false});
        if(upload.error){toast('Error subiendo la foto: '+upload.error.message);return;}
        const {data:publicData}=supabaseClient.storage.from('product-images').getPublicUrl(fileName);imageUrl=publicData.publicUrl;
      }

      const categoriaOriginal=String(p.category||'');
      const payload={sku,garment_id:garmentId,model:String(f.get('model')||'').trim(),category:/diseno propio|diseño propio/i.test(categoriaOriginal)?categoriaOriginal:f.get('category'),commercial_visibility:f.get('commercial_visibility')||'normal',allowed_sizes:permitidas.allowed_sizes,allowed_colors:permitidas.allowed_colors,image_url:imageUrl,dtf_cost:+f.get('dtf_cost')||0,extras_cost:+f.get('extras_cost')||0,sale_price:+f.get('sale_price')||0,price_one_print:f.get('price_one_print')!==''?+f.get('price_one_print'):null,price_two_print:f.get('price_two_print')!==''?+f.get('price_two_print'):null};
      const r=id?await supabaseClient.from('products').update(payload).eq('id',id):await supabaseClient.from('products').insert({...payload,size:null,color:null,stock:0,garment_cost:0});
      if(r.error){toast(r.error.message);return;}
      closeDrawer();await loadAll();setView('products');toast('Producto guardado');
    };
  };
})();
