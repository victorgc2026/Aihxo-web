/* AIHXO · Recepción de compras por lectura de etiqueta */
(function(){
 const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const aliases={
  blanco:['blanco','white','blanc'],negro:['negro','black','noir'],
  'azul marino':['azul marino','navy','navy blue'],gris:['gris','grey','gray'],
  lila:['lila','lilac'],arena:['arena','sand'],
  'azul cielo':['azul cielo','sky blue','sky'],'verde agua':['verde agua','aqua','mint']
 };
 let stock=[],purchaseId=null,lastText='';

 function escLocal(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
 function closeReception(){document.getElementById('aihxoRecvOverlay')?.remove()}
 function showReceptionShell(){
  closeReception();
  const o=document.createElement('div');
  o.id='aihxoRecvOverlay';
  o.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:0';
  o.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-width:720px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:18px;box-sizing:border-box">
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0">📷 Recibir prendas</h2><div style="opacity:.65;font-size:14px">Lectura de etiqueta del proveedor</div></div><button id="aihxoRecvClose" type="button" style="font-size:22px;border:0;background:transparent;padding:8px">✕</button></div>
    <div id="aihxoRecvContent" style="margin-top:14px"><div style="padding:16px;border:1px solid #ddd;border-radius:12px"><b>Cargando stock…</b></div></div>
  </div>`;
  document.body.appendChild(o);
  o.querySelector('#aihxoRecvClose').addEventListener('click',closeReception);
  o.addEventListener('click',e=>{if(e.target===o)closeReception()});
 }
 async function loadOCR(){
  if(window.Tesseract)return;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 }
 function scoreItem(item,text){
  const t=norm(text),supplier=norm(item.supplier),model=norm(item.supplier_model),size=norm(item.size),color=norm(item.color);
  let score=0;
  if(supplier&&t.includes(supplier))score+=4;
  if(model&&t.includes(model))score+=6;
  if(size&&t.includes(size))score+=5;
  const colorTerms=[color,...(aliases[color]||[])].map(norm).filter(Boolean);
  if(colorTerms.some(x=>t.includes(x)))score+=5;
  return score;
 }
 function matches(text){return stock.map(x=>({...x,_score:scoreItem(x,text)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score).slice(0,5)}

 window.abrirRecepcionEtiquetas=async function(pid=null){
  purchaseId=pid||null;
  showReceptionShell();
  const box=document.getElementById('aihxoRecvContent');
  try{
   const {data,error}=await supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');
   if(error)throw error;
   stock=data||[];
   box.innerHTML=`${purchaseId?`<div style="padding:10px 12px;background:#f4f6f8;border-radius:10px;margin-bottom:10px">Recepción vinculada a una compra registrada.</div>`:''}
    <div style="margin-bottom:12px">Fotografía la etiqueta. Detectaremos proveedor, modelo, talla y color antes de modificar el stock.</div>
    <label for="labelPhoto" style="display:block;text-align:center;padding:15px;border-radius:12px;background:#07152f;color:white;font-weight:700;cursor:pointer">📷 Fotografiar etiqueta</label>
    <input id="labelPhoto" type="file" accept="image/*" capture="environment" style="position:absolute;left:-9999px;width:1px;height:1px">
    <div id="ocrStatus" style="margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px"><b>Preparado.</b><div style="opacity:.65">Pulsa “Fotografiar etiqueta”.</div></div>
    <div id="ocrResult"></div>`;
   const input=document.getElementById('labelPhoto');
   input.addEventListener('change',async e=>{const file=e.target.files?.[0];if(file)await window.procesarEtiqueta(file);e.target.value=''});
  }catch(err){
   console.error(err);
   box.innerHTML='<div style="padding:16px;border:1px solid #f0b7b7;border-radius:12px"><b>⚠️ No se pudo cargar el stock.</b><div style="opacity:.65">Cierra y vuelve a intentarlo.</div></div>';
  }
 };

 window.procesarEtiqueta=async function(file){
  const status=document.getElementById('ocrStatus');
  if(!status)return;
  status.innerHTML='<b>🔎 Leyendo etiqueta…</b><div style="opacity:.65">Puede tardar unos segundos.</div>';
  try{
   await loadOCR();
   const r=await Tesseract.recognize(file,'eng+spa',{logger:m=>{if(m.status==='recognizing text'&&status)status.innerHTML=`<b>🔎 Leyendo etiqueta… ${Math.round((m.progress||0)*100)}%</b>`}});
   lastText=r?.data?.text||'';
   renderMatches(lastText);
  }catch(err){
   console.error(err);
   status.innerHTML='<b>⚠️ No se pudo leer la etiqueta.</b><div style="opacity:.65">Prueba con más luz y acercando la cámara.</div>';
  }
 };

 function renderMatches(text){
  const status=document.getElementById('ocrStatus'),result=document.getElementById('ocrResult');if(!status||!result)return;
  const ms=matches(text),best=ms[0];
  status.innerHTML=`<b>✅ Etiqueta leída</b><div style="opacity:.65">${escLocal(text.replace(/\s+/g,' ').slice(0,180)||'Sin texto reconocible')}</div>`;
  result.innerHTML=best?`<div style="margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px"><h3 style="margin-top:0">Coincidencia propuesta</h3><div style="font-size:18px;font-weight:800">${escLocal(best.supplier||'')} · ${escLocal(best.supplier_model||'')}</div><div style="opacity:.65">${escLocal(best.size||'')} · ${escLocal(best.color||'')} · stock actual ${Number(best.quantity||0)}</div><label style="display:block;margin-top:12px">Unidades recibidas<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label><button id="confirmRecv" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:700">＋ Añadir al stock</button>${ms.length>1?`<details style="margin-top:12px"><summary>Elegir otra coincidencia</summary><div id="altMatches"></div></details>`:''}</div>`:`<div style="margin-top:12px;padding:14px;border:1px solid #f0b7b7;border-radius:12px">⚠️ No encontré una variante clara.<div style="opacity:.65">Haz otra foto más cerca o con mejor luz.</div></div>`;
  if(best){
   document.getElementById('confirmRecv')?.addEventListener('click',()=>window.confirmarEntradaEtiqueta(best.id));
   const alt=document.getElementById('altMatches');
   if(alt)ms.slice(1).forEach(x=>{const b=document.createElement('button');b.type='button';b.textContent=`${x.supplier||''} · ${x.supplier_model||''} · ${x.size||''} · ${x.color||''}`;b.style.cssText='width:100%;margin-top:7px;padding:10px';b.addEventListener('click',()=>window.seleccionarCoincidencia(x.id));alt.appendChild(b)});
  }
 }

 window.seleccionarCoincidencia=function(id){
  const x=stock.find(s=>String(s.id)===String(id)),result=document.getElementById('ocrResult');if(!x||!result)return;
  result.innerHTML=`<div style="margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px"><h3 style="margin-top:0">Variante seleccionada</h3><div style="font-size:18px;font-weight:800">${escLocal(x.supplier||'')} · ${escLocal(x.supplier_model||'')}</div><div style="opacity:.65">${escLocal(x.size||'')} · ${escLocal(x.color||'')} · stock actual ${Number(x.quantity||0)}</div><label style="display:block;margin-top:12px">Unidades recibidas<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label><button id="confirmRecv" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:700">＋ Añadir al stock</button></div>`;
  document.getElementById('confirmRecv')?.addEventListener('click',()=>window.confirmarEntradaEtiqueta(x.id));
 };

 window.confirmarEntradaEtiqueta=async function(id){
  const x=stock.find(s=>String(s.id)===String(id));if(!x)return;
  const qty=Math.max(1,Number(document.getElementById('recvQty')?.value||1)),prev=Number(x.quantity||0),next=prev+qty;
  const {error}=await supabaseClient.from('base_stock_items').update({quantity:next}).eq('id',id);
  if(error){console.error(error);alert('No se pudo actualizar el stock');return}
  const reason=`Recepción proveedor${purchaseId?` · compra ${purchaseId}`:''} · etiqueta OCR`;
  const {error:movErr}=await supabaseClient.from('base_stock_movements').insert({item_id:id,movement_type:'entrada',quantity_delta:qty,previous_quantity:prev,new_quantity:next,reason});
  if(movErr)console.error(movErr);
  x.quantity=next;
  const result=document.getElementById('ocrResult');
  if(result)result.innerHTML=`<div style="margin-top:12px;padding:14px;border:1px solid #b7d8bd;border-radius:12px"><b>✅ Entrada registrada</b><div style="opacity:.65">${escLocal(x.supplier||'')} · ${escLocal(x.supplier_model||'')} · ${escLocal(x.size||'')} · ${escLocal(x.color||'')} → ${next} ud.</div><button id="scanNext" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:700">📷 Escanear siguiente</button></div>`;
  document.getElementById('scanNext')?.addEventListener('click',()=>document.getElementById('labelPhoto')?.click());
 };

 /* Eventos delegados: funcionan aunque Compras vuelva a pintar la pantalla */
 document.addEventListener('click',e=>{
  const main=e.target.closest?.('#recvCamera');
  if(main){e.preventDefault();e.stopPropagation();window.abrirRecepcionEtiquetas(null);return}
  const row=e.target.closest?.('.recvPurchase');
  if(row){e.preventDefault();e.stopPropagation();window.abrirRecepcionEtiquetas(row.dataset.purchaseId||null)}
 },true);
})();