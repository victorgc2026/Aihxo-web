/* AIHXO · Tazas y sublimación — módulo aislado (no altera los diseños textiles). */
(function(){
'use strict';
const DB=()=>window.supabaseClient;
const bucket='aihxo-mug-designs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v)||0;
const euro=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(num(v));
const state={models:[],designs:[],suppliers:[],selected:null};
const panel=()=>document.getElementById('aihxo-mugs-panel');
const note=(s,err=false)=>{const el=document.getElementById('mug-notice');if(el){el.textContent=s;el.style.color=err?'#fb7185':'#86efac'}};
async function fetchAll(){
 const [m,d,s]=await Promise.all([
  DB().from('mug_models').select('*').order('created_at',{ascending:false}),
  DB().from('mug_designs').select('*').order('created_at',{ascending:false}),
  DB().from('suppliers').select('id,name').order('name')]);
 if(m.error||d.error)throw new Error((m.error||d.error).message);
 state.models=m.data||[];state.designs=d.data||[];state.suppliers=s.data||[];
}
const input=(name,label,value='',type='text')=>'<label style="display:grid;gap:5px;font-size:13px">'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" style="padding:10px;border-radius:9px;border:1px solid #64748b;background:#101f3c;color:white;min-width:0;width:100%" /></label>';
function frame(content){
 const old=panel();if(old)old.remove();
 const root=document.createElement('section');root.id='aihxo-mugs-panel';
 root.style.cssText='position:fixed;inset:0;z-index:2147482000;background:#07152f;color:#f8fafc;overflow:auto;padding:22px max(16px,calc((100vw - 1120px)/2));font-family:system-ui,sans-serif';
 root.innerHTML='<header style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><h1 style="margin:0;font-size:26px">☕ Tazas y sublimación</h1><small>AIHXO Gestión · stock, proveedores, diseños y pedidos</small></div><button id="mug-close" style="padding:10px;border-radius:9px">✕ Cerrar</button></header><div id="mug-notice" role="status" style="min-height:26px;margin-top:9px"></div><div id="mug-content">'+content+'</div>';
 document.body.appendChild(root);root.querySelector('#mug-close').onclick=()=>root.remove();
}
function tab(name){document.querySelectorAll('[data-mug-tab]').forEach(b=>b.style.background=b.dataset.mugTab===name?'#2563eb':'#1e293b');}
function main(){
 const btn=(id,t)=>'<button data-mug-tab="'+id+'" style="background:#1e293b;color:white;border:1px solid #64748b;border-radius:10px;padding:11px;cursor:pointer">'+t+'</button>';
 frame('<nav style="display:flex;gap:8px;flex-wrap:wrap;margin:18px 0">'+btn('models','Modelos y stock')+btn('designs','Fichas de diseños')+btn('production','Producción')+'</nav><div id="mug-tab"></div>');
 document.querySelectorAll('[data-mug-tab]').forEach(b=>b.onclick=()=>render(b.dataset.mugTab));render('models');
}
function render(name){tab(name);const target=document.getElementById('mug-tab');if(!target)return;
 if(name==='models')modelsView(target);else if(name==='designs')designsView(target);else productionView(target);
}
function modelsView(el){
 const suppliers='<option value="">Sin proveedor asignado</option>'+state.suppliers.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
 el.innerHTML='<h2>Alta de taza</h2><form id="mug-model-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">'+
 input('sku','SKU (único)','AIHXO-TAZ-')+input('name','Modelo')+input('color','Color','Blanco')+input('size_label','Tamaño (p. ej. 11 oz)')+input('capacity_ml','Capacidad (ml)','','number')+
 '<label>Proveedor<select name="supplier_id" style="display:block;width:100%;padding:11px;background:#101f3c;color:white">'+suppliers+'</select></label>'+
 input('supplier_reference','Ref. proveedor')+input('print_width_mm','Ancho imprimible (mm)','','number')+input('print_height_mm','Alto imprimible (mm)','','number')+
 input('unit_cost','Coste unidad (€)','0','number')+input('sale_price','Precio venta (€)','0','number')+input('stock','Unidades iniciales','0','number')+input('min_stock','Stock mínimo','2','number')+
 '<button style="padding:12px;background:#2563eb;color:white;border:0;border-radius:10px;align-self:end">Guardar modelo</button></form>'+
 '<h2 style="margin-top:28px">Inventario</h2><div id="mug-model-list"></div>';
 el.querySelector('#mug-model-form').onsubmit=saveModel;const list=el.querySelector('#mug-model-list');
 list.innerHTML=state.models.length?state.models.map(m=>'<article style="padding:12px;margin:8px 0;border:1px solid #334155;border-radius:11px"><strong>'+esc(m.name)+'</strong> · '+esc(m.sku)+' · '+esc(m.color)+' · '+esc(m.size_label)+'<div>Stock: <b style="color:'+(m.stock<=m.min_stock?'#fda4af':'#86efac')+'">'+m.stock+'</b> · Coste: '+euro(m.unit_cost)+' · Venta: '+euro(m.sale_price)+'</div><div style="font-size:12px;color:#94a3b8">Proveedor: '+esc(state.suppliers.find(s=>s.id===m.supplier_id)?.name||'—')+' · Imprimible: '+esc(m.print_width_mm||'?')+' × '+esc(m.print_height_mm||'?')+' mm</div><button data-mug-move="'+esc(m.id)+'" style="margin-top:8px;padding:8px">Registrar entrada / salida</button></article>').join(''):'No hay modelos de tazas registrados.';
 list.querySelectorAll('[data-mug-move]').forEach(b=>b.onclick=()=>moveStock(b.dataset.mugMove));
}
async function saveModel(e){
 e.preventDefault();const f=new FormData(e.target),o=Object.fromEntries(f.entries());
 for(const k of ['capacity_ml','print_width_mm','print_height_mm','unit_cost','sale_price','stock','min_stock'])o[k]=o[k]===''?null:num(o[k]);
 if(!o.supplier_id) o.supplier_id=null;
 if(!o.name.trim()||!o.sku.trim())return note('SKU y modelo son obligatorios',true);
 const r=await DB().from('mug_models').insert(o);if(r.error)return note(r.error.message,true);
 await reload('models');note('Modelo guardado');
}
async function moveStock(id){
 const raw=prompt('Variación de unidades. Ejemplo: 10 (entrada), -2 (salida/merma)');
 if(raw===null)return;const delta=Number(raw);
 if(!Number.isInteger(delta)||!delta)return alert('Introduce un número entero distinto de cero');
 const reason=prompt('Motivo o referencia del movimiento','Ajuste manual');if(reason===null)return;
 const m=state.models.find(x=>x.id===id);if(m.stock+delta<0)return alert('No puede quedar stock negativo');
 const update=await DB().from('mug_models').update({stock:m.stock+delta}).eq('id',id).eq('stock',m.stock).select('id');
 if(update.error||!update.data?.length)return note('No se actualizó stock. Recarga y vuelve a intentarlo.',true);
 const log=await DB().from('mug_stock_movements').insert({model_id:id,quantity:delta,type:delta>0?'entrada':'salida',reference:reason});
 await reload('models');note(log.error?'Stock actualizado; error al registrar historial: '+log.error.message:'Stock e historial actualizados',!!log.error);
}
function designsView(el){
 const opts=state.models.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.name)+' · '+esc(m.color)+' · '+esc(m.size_label)+'</option>').join('');
 el.innerHTML='<h2>Nueva ficha de diseño</h2><form id="mug-design-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:11px">'+
 '<label>Modelo de taza<select name="model_id" required style="display:block;width:100%;padding:11px;background:#101f3c;color:white"><option value="">Seleccionar</option>'+opts+'</select></label>'+
 input('order_reference','Referencia pedido')+input('customer_reference','Cliente / referencia')+input('name','Nombre del diseño')+
 '<label>Posición<select name="placement" style="display:block;width:100%;padding:11px;background:#101f3c;color:white"><option value="envolvente">Envolvente</option><option value="frontal">Frontal</option><option value="trasera">Trasera</option><option value="doble cara">Doble cara</option></select></label>'+
 input('print_width_mm','Ancho diseño (mm)','','number')+input('print_height_mm','Alto diseño (mm)','','number')+
 input('quantity','Unidades','1','number')+
 '<label>Imagen original / dibujo / PDF<input name="art" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required style="display:block;width:100%;margin-top:6px"></label>'+
 '<label>Archivo final (opcional)<input name="printArt" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" style="display:block;width:100%;margin-top:6px"></label>'+
 '<label>Observaciones<textarea name="notes" rows="2" style="display:block;width:100%;background:#101f3c;color:white"></textarea></label>'+
 '<button style="background:#2563eb;color:white;border:0;padding:12px;border-radius:9px;align-self:end">Guardar ficha y archivos</button></form>'+
 '<h2 style="margin-top:26px">Diseños registrados</h2><div id="mug-design-list"></div>';
 el.querySelector('#mug-design-form').onsubmit=saveDesign;
 el.querySelector('#mug-design-list').innerHTML=state.designs.length?state.designs.map(d=>'<article style="padding:12px;margin-bottom:8px;border:1px solid #334155;border-radius:9px"><strong>'+esc(d.name)+'</strong> · '+esc(d.order_reference||'Sin pedido')+'<div>'+esc(d.placement)+' · '+esc(d.print_width_mm)+' × '+esc(d.print_height_mm)+' mm · '+esc(d.quantity)+' uds.</div><small>'+esc(d.approval_status)+' / '+esc(d.production_status)+'</small><div><button data-mug-file="'+esc(d.id)+'" style="padding:8px;margin-top:7px">Ver original</button> <button data-mug-print="'+esc(d.id)+'" style="padding:8px">Preparar impresión</button> <button data-mug-status="'+esc(d.id)+'" style="padding:8px">Actualizar estado</button></div></article>').join(''):'Aún no hay diseños.';
 el.querySelectorAll('[data-mug-file]').forEach(b=>b.onclick=()=>openFile(b.dataset.mugFile));
 el.querySelectorAll('[data-mug-print]').forEach(b=>b.onclick=()=>preparePrint(b.dataset.mugPrint));
 el.querySelectorAll('[data-mug-status]').forEach(b=>b.onclick=()=>setStatus(b.dataset.mugStatus));
}
async function upload(file,uuid,label){
 if(!file||!file.size)return null;if(file.size>15*1024*1024)throw new Error('El archivo supera 15 MB');
 if(!['image/png','image/jpeg','image/webp','application/pdf'].includes(file.type))throw new Error('Formato no admitido');
 const ext=(file.name.split('.').pop()||'png').toLowerCase();
 const path=uuid+'/'+label+'.'+ext;
 const r=await DB().storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
 if(r.error)throw new Error(r.error.message);return path;
}
async function saveDesign(e){
 e.preventDefault();const form=e.target,f=new FormData(form),art=f.get('art'),final=f.get('printArt');
 if(!f.get('model_id')||!String(f.get('name')).trim()||!art?.size)return note('Selecciona taza, nombre e imagen original.',true);
 const id=crypto.randomUUID();let original=null,print=null;
 try{
  note('Subiendo diseño…');original=await upload(art,id,'original');
  print=await upload(final,id,'impresion');
  const payload={id,model_id:f.get('model_id'),name:f.get('name'),order_reference:f.get('order_reference')||null,customer_reference:f.get('customer_reference')||null,placement:f.get('placement'),print_width_mm:num(f.get('print_width_mm'))||null,print_height_mm:num(f.get('print_height_mm'))||null,quantity:num(f.get('quantity'))||1,notes:f.get('notes'),original_path:original,print_path:print};
  const r=await DB().from('mug_designs').insert(payload);
  if(r.error)throw new Error(r.error.message);
  await reload('designs');note('Ficha y archivos guardados');
 }catch(err){note('No se guardó la ficha: '+err.message,true);
  for(const p of [original,print].filter(Boolean))await DB().storage.from(bucket).remove([p]);}
}
async function signed(path){const r=await DB().storage.from(bucket).createSignedUrl(path,180);if(r.error)throw new Error(r.error.message);return r.data.signedUrl}
async function openFile(id){
 try{const d=state.designs.find(x=>x.id===id);if(!d?.original_path)throw Error('Sin imagen');window.open(await signed(d.original_path),'_blank','noopener')}
 catch(err){note(err.message,true)}
}
async function setStatus(id){
 const d=state.designs.find(x=>x.id===id);
 const a=prompt('Aprobación: pendiente / aprobado / rechazado',d.approval_status);if(a===null)return;
 const p=prompt('Producción: pendiente / preparando / terminado / entregado',d.production_status);if(p===null)return;
 if(!['pendiente','aprobado','rechazado'].includes(a)||!['pendiente','preparando','terminado','entregado'].includes(p))return alert('Estado no válido');
 const r=await DB().from('mug_designs').update({approval_status:a,production_status:p}).eq('id',id);
 if(r.error)return note(r.error.message,true);await reload('designs');note('Estado actualizado');
}
async function preparePrint(id){
 try{
  const d=state.designs.find(x=>x.id===id),m=state.models.find(x=>x.id===d.model_id);
  if(d.approval_status!=='aprobado')return note('Aprueba el diseño antes de imprimir',true);
  const w=num(d.print_width_mm),h=num(d.print_height_mm);
  if(!w||!h)return note('Introduce medidas físicas de impresión en la ficha',true);
  if((m.print_width_mm&&w>m.print_width_mm)||(m.print_height_mm&&h>m.print_height_mm))return note('Diseño mayor que el área imprimible del modelo',true);
  const path=d.print_path||d.original_path;if(/\.pdf$/i.test(path))return note('El PDF debe imprimirse en su aplicación con escala 100% y espejo si corresponde',true);
  const url=await signed(path);
  const win=window.open('','_blank');if(!win)return note('Permite ventanas emergentes para imprimir',true);
  win.document.write('<!doctype html><html><head><title>AIHXO impresión taza</title><style>@page{size:A4;margin:8mm}body{font:12px sans-serif;margin:0}img{width:'+w+'mm;height:'+h+'mm;object-fit:fill;transform:scaleX(-1);display:block}small{display:block;margin-top:12mm}@media print{button,small{display:none}}</style></head><body><img src="'+esc(url)+'"><small>AIHXO · '+esc(d.name)+' · '+w+' × '+h+' mm · ESPEJO ACTIVADO. Imprimir al 100%, desactivar ajustar a página, comprobar dimensiones y gestionar perfil ICC en el controlador del Mac.</small><button onclick="window.print()">Imprimir</button></body></html>');
  win.document.close();
 }catch(err){note(err.message,true)}
}
function productionView(el){
 const pending=state.designs.filter(d=>d.production_status!=='entregado');
 el.innerHTML='<h2>Cola de producción</h2><p>La reserva y el consumo de stock se registran desde Inventario. Solo imprimir diseños aprobados.</p>'+
 (pending.length?pending.map(d=>'<div style="border:1px solid #334155;border-radius:8px;padding:12px;margin:8px 0">'+esc(d.order_reference||'Sin referencia')+' · '+esc(d.name)+' · '+esc(d.quantity)+' uds. · '+esc(d.approval_status)+' / '+esc(d.production_status)+'</div>').join(''):'No hay diseños pendientes.');
}
async function reload(view){await fetchAll();render(view)}
async function open(){main();try{await reload('models')}catch(e){note('Error al cargar. Comprueba las tablas y los permisos: '+e.message,true)}}
function inject(){
 const nav=document.getElementById('nav');if(!nav||document.getElementById('aihxoMugsNav'))return;
 const b=document.createElement('button');b.id='aihxoMugsNav';b.type='button';b.innerHTML='☕ <span>Tazas y sublimación</span>';b.onclick=open;
 const products=nav.querySelector('[data-view="products"]');if(products)products.after(b);else nav.appendChild(b);
}
const observer=new MutationObserver(inject);observer.observe(document.documentElement,{childList:true,subtree:true});inject();
window.abrirAIHXOTazas=open;
})();