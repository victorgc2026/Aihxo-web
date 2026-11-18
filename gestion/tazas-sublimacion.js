/* AIHXO · Tazas y sublimación — módulo aislado (no altera los diseños textiles). */
(function(){
'use strict';
const DB=()=>window.supabaseClient;
const bucket='aihxo-mug-designs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v)||0;
const decimal=v=>{const normalized=String(v??'').trim().replace(/\s/g,'').replace(',','.');return normalized===''?null:Number(normalized);};
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
 '<label style="display:grid;gap:5px;font-size:13px">Coste unidad (€)<input name="unit_cost" type="text" inputmode="decimal" value="0" placeholder="Ej.: 1,85" required style="padding:10px;border-radius:9px;border:1px solid #64748b;background:#101f3c;color:white;min-width:0;width:100%" /></label>'+ '<label style="display:grid;gap:5px;font-size:13px">Precio venta (€)<input name="sale_price" type="text" inputmode="decimal" value="12,95" placeholder="Ej.: 12,95" required style="padding:10px;border-radius:9px;border:1px solid #64748b;background:#101f3c;color:white;min-width:0;width:100%" /></label>'+input('stock','Unidades iniciales','0','number')+input('min_stock','Stock mínimo','2','number')+
 '<button style="padding:12px;background:#2563eb;color:white;border:0;border-radius:10px;align-self:end">Guardar modelo</button></form>'+
 '<h2 style="margin-top:28px">Inventario</h2><div id="mug-model-list"></div>';
 el.querySelector('#mug-model-form').onsubmit=saveModel;const list=el.querySelector('#mug-model-list');
 list.innerHTML=state.models.length?state.models.map(m=>'<article style="padding:12px;margin:8px 0;border:1px solid #334155;border-radius:11px"><strong>'+esc(m.name)+'</strong> · '+esc(m.sku)+' · '+esc(m.color)+' · '+esc(m.size_label)+'<div>Stock: <b style="color:'+(m.stock<=m.min_stock?'#fda4af':'#86efac')+'">'+m.stock+'</b> · Coste: '+euro(m.unit_cost)+' · Venta: '+euro(m.sale_price)+'</div><div style="font-size:12px;color:#94a3b8">Proveedor: '+esc(state.suppliers.find(s=>s.id===m.supplier_id)?.name||'—')+' · Imprimible: '+esc(m.print_width_mm||'?')+' × '+esc(m.print_height_mm||'?')+' mm</div><button data-mug-move="'+esc(m.id)+'" style="margin-top:8px;padding:8px">Registrar entrada / salida</button></article>').join(''):'No hay modelos de tazas registrados.';
 list.querySelectorAll('[data-mug-move]').forEach(b=>b.onclick=()=>moveStock(b.dataset.mugMove));
}
async function saveModel(e){
 e.preventDefault();const f=new FormData(e.target),o=Object.fromEntries(f.entries());
 for(const k of ['capacity_ml','print_width_mm','print_height_mm','stock','min_stock'])o[k]=o[k]===''?null:num(o[k]);
 for(const k of ['unit_cost','sale_price']){
  const value=decimal(o[k]);
  if(value===null||!Number.isFinite(value)||value<0||!/^[0-9]+(?:[.,][0-9]{1,2})?$/.test(String(o[k]).trim()))return note('Introduce un importe válido en '+(k==='unit_cost'?'Coste unidad':'Precio venta')+' (ej.: 1,85)',true);
  o[k]=value;
 }
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
 '<label style="display:grid;gap:5px;font-size:13px">Referencia automática<input type="text" value="Se asigna al guardar" readonly aria-label="Referencia automática" style="padding:10px;border-radius:9px;border:1px solid #64748b;background:#172744;color:#cbd5e1;min-width:0;width:100%;cursor:default" /></label>'+input('customer_reference','Cliente / referencia')+input('name','Nombre del diseño')+
 '<label>Posición<select name="placement" style="display:block;width:100%;padding:11px;background:#101f3c;color:white"><option value="envolvente">Envolvente</option><option value="frontal">Frontal</option><option value="trasera">Trasera</option><option value="doble cara">Doble cara</option></select></label>'+
 input('print_width_mm','Ancho diseño (mm)','','number')+input('print_height_mm','Alto diseño (mm)','','number')+
 input('quantity','Unidades','1','number')+
 '<label style="display:flex;align-items:center;gap:8px"><input name="handle_enabled" type="checkbox" style="width:auto" /> Personalizar el asa de la taza</label>'+
 '<label>Nombre o frase del asa<input name="handle_text" maxlength="40" placeholder="Ej.: Carla" style="display:block;width:100%;padding:10px;background:#101f3c;color:white;border:1px solid #64748b;border-radius:9px"></label>'+
 '<label>Orientación del asa<select name="handle_orientation" style="display:block;width:100%;padding:10px;background:#101f3c;color:white"><option value="vertical">A lo largo del asa</option><option value="horizontal">Horizontal</option></select></label>'+
 '<small style="color:#cbd5e1;grid-column:1/-1">Medida de referencia para el asa: 45 × 10 mm. Comprobar antes de imprimir la superficie útil y si el asa admite sublimación.</small>'+
 '<label>Imagen original / dibujo / PDF<input name="art" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required style="display:block;width:100%;margin-top:6px"></label>'+
 '<label>Archivo final (opcional)<input name="printArt" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" style="display:block;width:100%;margin-top:6px"></label>'+
 '<label>Observaciones<textarea name="notes" rows="2" style="display:block;width:100%;background:#101f3c;color:white"></textarea></label>'+
 '<button style="background:#2563eb;color:white;border:0;padding:12px;border-radius:9px;align-self:end">Guardar ficha y archivos</button></form>'+
 '<h2 style="margin-top:26px">Diseños registrados</h2><div id="mug-design-list"></div>';
 const handleCheck=el.querySelector('[name="handle_enabled"]'),handleText=el.querySelector('[name="handle_text"]');
 handleText.addEventListener('input',()=>{if(handleText.value.trim())handleCheck.checked=true});
 el.querySelector('#mug-design-form').onsubmit=saveDesign;
 el.querySelector('#mug-design-list').innerHTML=state.designs.length?state.designs.map(d=>'<article style="padding:12px;margin-bottom:8px;border:1px solid #334155;border-radius:9px"><strong>'+esc(d.name)+'</strong> · '+esc(d.order_reference||'Sin pedido')+'<div>'+esc(d.placement)+' · '+esc(d.print_width_mm)+' × '+esc(d.print_height_mm)+' mm · '+esc(d.quantity)+' uds.</div>'+
 (d.handle_enabled?'<div>Asa: <strong>'+esc(d.handle_text||'Pendiente')+'</strong> · '+esc(d.handle_orientation==='horizontal'?'Horizontal':'A lo largo del asa')+' · 45 × 10 mm</div>':'')+'<small>'+esc(d.approval_status)+' / '+esc(d.production_status)+'</small><div><button data-mug-file="'+esc(d.id)+'" style="padding:8px;margin-top:7px">Ver original</button> <button data-mug-print="'+esc(d.id)+'" style="padding:8px">Preparar impresión</button> '+(d.handle_enabled&&d.handle_text?'<button data-mug-handle="'+esc(d.id)+'" style="padding:8px">Imprimir texto del asa</button> ':'')+'<button data-mug-status="'+esc(d.id)+'" style="padding:8px">Actualizar estado</button></div>'+
 '<label style="display:block;margin-top:9px;font-size:12px">Adjuntar o actualizar imagen<input type="file" data-mug-attach="'+esc(d.id)+'" accept="image/png,image/jpeg,image/webp,application/pdf" style="display:block;max-width:100%;margin-top:5px" /></label>'+
 (d.custom_order_item_id?'<small style="color:#93c5fd">Ficha vinculada a pedido personalizado</small>':'')+'</article>').join(''):'Aún no hay diseños.';
 el.querySelectorAll('[data-mug-file]').forEach(b=>b.onclick=()=>openFile(b.dataset.mugFile));
 el.querySelectorAll('[data-mug-print]').forEach(b=>b.onclick=()=>preparePrint(b.dataset.mugPrint));
 el.querySelectorAll('[data-mug-handle]').forEach(b=>b.onclick=()=>printHandle(b.dataset.mugHandle));
 el.querySelectorAll('[data-mug-status]').forEach(b=>b.onclick=()=>setStatus(b.dataset.mugStatus));
 el.querySelectorAll('[data-mug-attach]').forEach(b=>b.onchange=()=>attachDesignFile(b.dataset.mugAttach,b));
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
 const handleEnabled=f.get('handle_enabled')==='on',handleText=String(f.get('handle_text')||'').trim();
 if(handleEnabled&&!handleText)return note('Introduce un nombre o frase para el asa.',true);
 if(handleText.length>40)return note('Texto del asa: máximo 40 caracteres.',true);
 const id=crypto.randomUUID();let original=null,print=null;
 try{
  note('Subiendo diseño…');original=await upload(art,id,'original');
  print=await upload(final,id,'impresion');
  const payload={id,model_id:f.get('model_id'),name:f.get('name'),customer_reference:f.get('customer_reference')||null,placement:f.get('placement'),print_width_mm:num(f.get('print_width_mm'))||null,print_height_mm:num(f.get('print_height_mm'))||null,quantity:num(f.get('quantity'))||1,notes:f.get('notes'),original_path:original,print_path:print,handle_enabled:handleEnabled,handle_text:handleEnabled?handleText:null,handle_orientation:handleEnabled?f.get('handle_orientation'):'vertical'};
  const r=await DB().from('mug_designs').insert(payload).select('order_reference').single();
  if(r.error)throw new Error(r.error.message);
  await reload('designs');note('Ficha y archivos guardados · Referencia '+r.data.order_reference);
 }catch(err){note('No se guardó la ficha: '+err.message,true);
  for(const p of [original,print].filter(Boolean))await DB().storage.from(bucket).remove([p]);}
}
async function attachDesignFile(id,input){
 const file=input.files?.[0];if(!file)return;
 const design=state.designs.find(x=>x.id===id);if(!design)return note('Ficha no encontrada',true);
 let uploaded=null;
 try{
  note('Subiendo archivo del diseño…');
  uploaded=await upload(file,id,'original-'+Date.now());
  const r=await DB().from('mug_designs').update({original_path:uploaded}).eq('id',id).select('id');
  if(r.error||!r.data?.length)throw new Error(r.error?.message||'No se pudo vincular el archivo');
  await reload('designs');note('Imagen añadida a '+design.order_reference);
 }catch(e){
  if(uploaded)await DB().storage.from(bucket).remove([uploaded]);
  note('No se pudo adjuntar: '+e.message,true);
 }
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
function printHandle(id){
 const d=state.designs.find(x=>x.id===id);
 if(!d?.handle_enabled||!d.handle_text)return note('Esta ficha no tiene texto para el asa.',true);
 if(d.approval_status!=='aprobado')return note('Aprueba el diseño antes de imprimir el asa.',true);
 const win=window.open('','_blank');
 if(!win)return note('Permite ventanas emergentes para imprimir.',true);
 const safeText=esc(d.handle_text);
 const orientation=d.handle_orientation==='horizontal'?'horizontal':'a lo largo del asa';
 win.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>AIHXO · Texto asa</title><style>@page{size:A4;margin:10mm}body{margin:0;font:12px sans-serif;color:#111}.area{width:45mm;height:10mm;display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box;border:.2mm dashed #999}.txt{font:bold 10pt Arial,sans-serif;white-space:nowrap;transform:scaleX(-1)}.instructions{margin-top:15mm;max-width:155mm;line-height:1.55}@media print{button,.instructions{display:none}.area{border:0}}</style></head><body><div class="area"><span class="txt" id="handleText"></span></div><p class="instructions">Texto: '+safeText+' · orientación: '+orientation+' · medida de referencia 45 × 10 mm. Espejo activado. Imprimir al 100 % sin ajustar a página. Confirmar compatibilidad de sublimación y dimensiones reales del asa antes de aplicar calor.</p><button onclick="window.print()">Imprimir</button></body></html>');
 win.document.getElementById('handleText').textContent=d.handle_text;
 win.document.close();
}
function productionView(el){
 const designs=state.designs;
 const select=(field,items,value)=>'<select name="'+field+'" style="padding:10px;border-radius:8px;border:1px solid #64748b;background:#101f3c;color:#fff;width:100%">'+items.map(([v,label])=>'<option value="'+v+'"'+(v===value?' selected':'')+'>'+label+'</option>').join('')+'</select>';
 const prodOptions=[['pendiente','Pendiente'],['preparando','En preparación'],['terminado','Terminada']];
 const deliveryOptions=[['pendiente','Pendiente de entrega'],['entregada','Entregada']];
 const paymentOptions=[['pendiente','Pendiente de cobro'],['parcial','Pago parcial'],['cobrado','Cobrada']];
 el.innerHTML='<h2>Producción y seguimiento de tazas</h2><p style="color:#cbd5e1">Actualiza producción, entrega y cobro por separado. La entrega no implica que esté cobrado. El stock se gestiona desde Inventario.</p>'+
 '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><b>Total: '+designs.length+'</b><span> · Pendientes de entrega: '+designs.filter(d=>d.delivery_status!=='entregada'&&d.production_status!=='entregado').length+'</span><span> · Pendientes de cobro: '+designs.filter(d=>d.payment_status!=='cobrado').length+'</span></div>'+
 (designs.length?designs.map(d=>{
 const model=state.models.find(m=>m.id===d.model_id);
 const legacy=d.production_status==='entregado';
 const prod=legacy?'terminado':d.production_status;
 const delivery=d.delivery_status==='entregada'||legacy?'entregada':'pendiente';
 return '<form data-mug-production-form="'+esc(d.id)+'" style="padding:15px;margin:12px 0;border:1px solid #475569;border-radius:12px;background:#0b1d3d">'+
 '<div style="margin-bottom:12px"><strong>'+esc(d.order_reference||'Sin referencia')+' · '+esc(d.name)+'</strong><div style="font-size:13px;color:#cbd5e1">'+esc(model?.name||'Modelo sin identificar')+' · '+esc(d.quantity)+' uds. · Diseño: '+esc(d.approval_status)+(d.customer_reference?' · Cliente: '+esc(d.customer_reference):'')+'</div></div>'+
 '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:11px">'+
 '<label style="font-size:13px">Producción'+select('production_status',prodOptions,prod)+'</label>'+
 '<label style="font-size:13px">Entrega'+select('delivery_status',deliveryOptions,delivery)+'</label>'+
 '<label style="font-size:13px">Cobro'+select('payment_status',paymentOptions,d.payment_status||'pendiente')+'</label>'+
 '<label style="font-size:13px">Importe cobrado (€)<input name="amount_paid" inputmode="decimal" value="'+esc(String(d.amount_paid??0).replace('.',','))+'" style="padding:10px;border-radius:8px;background:#101f3c;color:white;border:1px solid #64748b;width:100%" /></label>'+
 '<label style="font-size:13px">Método de pago'+select('payment_method',[['','Sin especificar'],['Efectivo','Efectivo'],['Bizum','Bizum'],['Transferencia','Transferencia'],['Tarjeta','Tarjeta'],['Otro','Otro']],d.payment_method||'')+'</label></div>'+
 '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:12px"><button type="submit" style="background:#2563eb;color:white;border:0;padding:11px 16px;border-radius:9px;cursor:pointer">Guardar estados</button>'+
 '<small style="color:#cbd5e1">Entrega: '+esc(d.delivered_at?new Date(d.delivered_at).toLocaleDateString('es-ES'):'—')+' · Cobro: '+esc(d.paid_at?new Date(d.paid_at).toLocaleDateString('es-ES'):'—')+'</small></div></form>';
 }).join(''):'No hay diseños de tazas registrados.');
 el.querySelectorAll('[data-mug-production-form]').forEach(f=>f.onsubmit=e=>saveProductionState(e,f.dataset.mugProductionForm));
}
async function saveProductionState(e,id){
 e.preventDefault();
 const form=e.currentTarget,d=state.designs.find(x=>x.id===id);
 if(!d)return note('No se encontró la ficha de la taza.',true);
 const f=new FormData(form),amount=decimal(f.get('amount_paid'));
 if(amount===null||!Number.isFinite(amount)||amount<0||Math.round(amount*100)!==amount*100)return note('Introduce un importe cobrado válido (ej.: 12,95).',true);
 const production_status=String(f.get('production_status')),delivery_status=String(f.get('delivery_status')),payment_status=String(f.get('payment_status'));
 if(!['pendiente','preparando','terminado'].includes(production_status)||!['pendiente','entregada'].includes(delivery_status)||!['pendiente','parcial','cobrado'].includes(payment_status))return note('Estado no válido.',true);
 if(payment_status==='pendiente'&&amount>0)return note('Con un importe cobrado debes indicar pago parcial o cobrado.',true);
 if(payment_status==='parcial'&&amount<=0)return note('Indica el importe recibido del pago parcial.',true);
 const now=new Date().toISOString(),patch={production_status,delivery_status,payment_status,amount_paid:amount,payment_method:f.get('payment_method')||null};
 if(d.production_status!==production_status)patch.production_updated_at=now;
 if(delivery_status!==d.delivery_status)patch.delivered_at=delivery_status==='entregada'?now:null;
 if(payment_status!==d.payment_status)patch.paid_at=payment_status==='cobrado'?now:null;
 const button=form.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const r=await DB().from('mug_designs').update(patch).eq('id',id).select('id');
  if(r.error||!r.data?.length)throw new Error(r.error?.message||'No se actualizó la ficha. Comprueba permisos de acceso.');
  await reload('production');note('Estados de la taza guardados correctamente.');
 }catch(err){note('Error al guardar: '+err.message,true);button.disabled=false;}
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