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

  function pintarChecks(contenedor, nombre, opciones, seleccionadas){
    if(!contenedor) return;
    const elegidas=new Set(valores(seleccionadas));
    contenedor.innerHTML=opciones.length ? opciones.map(v=>`
      <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #e4e7ec;border-radius:10px;">
        <input type="checkbox" name="${nombre}" value="${esc(v)}" ${elegidas.has(v)?'checked':''}>
        <span>${esc(v)}</span>
      </label>`).join('') : '<div class="muted">Esta prenda todavía no tiene opciones configuradas.</div>';
  }

  window.inicializarVariantesProducto=async function(producto={}){
    const selector=document.getElementById('pfGarment');
    const tallas=document.getElementById('pfAllowedSizes');
    const colores=document.getElementById('pfAllowedColors');
    if(!selector || !tallas || !colores) return;

    const {data,error}=await supabaseClient.from('garments').select('id,manufacturer,model,sizes,colors,active').order('manufacturer').order('model');
    if(error){ console.error(error); return; }
    const prendas=data||[];

    selector.innerHTML='<option value="">Sin asignar</option>'+prendas.map(g=>`
      <option value="${g.id}" ${producto.garment_id===g.id?'selected':''} ${g.active===false && producto.garment_id!==g.id?'disabled':''}>
        ${esc(g.manufacturer)} · ${esc(g.model)}${g.active?'':' · INACTIVA'}
      </option>`).join('');

    const refrescar=()=>{
      const g=prendas.find(x=>x.id===selector.value);
      if(!g){
        pintarChecks(tallas,'allowed_sizes',[],[]);
        pintarChecks(colores,'allowed_colors',[],[]);
        return;
      }
      const selTallas=selector.value===producto.garment_id ? producto.allowed_sizes : valores(g.sizes);
      const selColores=selector.value===producto.garment_id ? producto.allowed_colors : valores(g.colors);
      pintarChecks(tallas,'allowed_sizes',valores(g.sizes),selTallas);
      pintarChecks(colores,'allowed_colors',valores(g.colors),selColores);
    };
    selector.addEventListener('change',refrescar);
    refrescar();
  };

  window.obtenerVariantesPermitidasProducto=function(form){
    return {
      allowed_sizes:[...form.querySelectorAll('input[name="allowed_sizes"]:checked')].map(x=>x.value),
      allowed_colors:[...form.querySelectorAll('input[name="allowed_colors"]:checked')].map(x=>x.value)
    };
  };
})();
