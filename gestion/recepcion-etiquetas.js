/* AIHXO · Recepción de compras por lectura de etiqueta */
(function(){
 const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
 const aliases={
  blanco:['blanco','white','blanc'],negro:['negro','black','noir'],
  'azul marino':['azul marino','navy','navy blue'],gris:['gris','grey','gray'],
  lila:['lila','lilac'],arena:['arena','sand'],
  'azul cielo':['azul cielo','sky blue','sky'], 'verde agua':['verde agua','aqua','mint']
 };
 let stock=[],purchaseId=null,lastText='';
 async function loadOCR(){
  if(window.Tesseract)return;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 }
 function scoreItem(item,text){
  const t=norm(text), supplier=norm(item.supplier), model=norm(item.supplier_model), size=norm(item.size), color=norm(item.color);
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
  purchaseId=pid;
  const {data,error}=await supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');
  if(error){console.error(error);toast('No se pudo cargar el stock');return}stock=data||[];
  $('#drawerBody').innerHTML=`<h2>📷 Recibir prendas con cámara</h2><div class="muted" style="margin-bottom:12px">Fotografía la etiqueta del proveedor. Leeremos fabricante, modelo, talla y color y te propondremos la variante.</div><label class="primary" style="display:block;text-align:center;padding:14px;cursor:pointer">📷 Fotografiar etiqueta<input id="labelPhoto" type="file" accept="image/*" capture="environment" style="display:none"></label><div id="ocrStatus" class="card" style="margin-top:12px"><b>Preparado para escanear.</b><div class="muted">La foto se procesa en el dispositivo.</div></div><div id="ocrResult"></div>`;
  openDrawer();
  $('#labelPhoto').onchange=async e=>{const file=e.target.files?.[0];if(file)await procesarEtiqueta(file);e.target.value=''};
 };
 window.procesarEtiqueta=async function(file){
  const status=$('#ocrStatus');status.innerHTML='<b>🔎 Leyendo etiqueta…</b><div class="muted">Puede tardar unos segundos.</div>';
  try{
   await loadOCR();
   const r=await Tesseract.recognize(file,'eng+spa',{logger:m=>{if(m.status==='recognizing text')status.innerHTML=`<b>🔎 Leyendo etiqueta… ${Math.round((m.progress||0)*100)}%</b>`}});
   lastText=r?.data?.text||'';
   renderMatches(lastText);
  }catch(err){console.error(err);status.innerHTML='<b>⚠️ No se pudo leer la etiqueta.</b><div class="muted">Prueba con más luz y acercando la cámara.</div>'}
 };
 function renderMatches(text){
  const ms=matches(text), best=ms[0];
  $('#ocrStatus').innerHTML=`<b>✅ Etiqueta leída</b><div class="muted">${esc(text.replace(/\s+/g,' ').slice(0,180)||'Sin texto reconocible')}</div>`;
  $('#ocrResult').innerHTML=best?`<div class="card" style="margin-top:12px"><h3>Coincidencia propuesta</h3><div style="font-size:18px;font-weight:900">${esc(best.supplier||'')} · ${esc(best.supplier_model||'')}</div><div class="muted">${esc(best.size||'')} · ${esc(best.color||'')} · stock actual ${Number(best.quantity||0)}</div><div class="field" style="margin-top:10px"><label>Unidades recibidas</label><input id="recvQty" type="number" min="1" value="1"></div><button class="primary" style="width:100%" onclick="confirmarEntradaEtiqueta('${best.id}')">＋ Añadir al stock</button>${ms.length>1?`<details style="margin-top:10px"><summary>Elegir otra coincidencia</summary>${ms.slice(1).map(x=>`<button class="secondary" style="width:100%;margin-top:7px" onclick="seleccionarCoincidencia('${x.id}')">${esc(x.supplier||'')} · ${esc(x.supplier_model||'')} · ${esc(x.size||'')} · ${esc(x.color||'')}</button>`).join('')}</details>`:''}</div>`:`<div class="card" style="margin-top:12px">⚠️ No encontré una variante suficientemente clara.<div class="muted">Puedes hacer otra foto más cerca o con mejor luz.</div></div>`;
 }
 window.seleccionarCoincidencia=function(id){const x=stock.find(s=>s.id===id);if(!x)return;$('#ocrResult').innerHTML=`<div class="card" style="margin-top:12px"><h3>Variante seleccionada</h3><div style="font-size:18px;font-weight:900">${esc(x.supplier||'')} · ${esc(x.supplier_model||'')}</div><div class="muted">${esc(x.size||'')} · ${esc(x.color||'')} · stock actual ${Number(x.quantity||0)}</div><div class="field" style="margin-top:10px"><label>Unidades recibidas</label><input id="recvQty" type="number" min="1" value="1"></div><button class="primary" style="width:100%" onclick="confirmarEntradaEtiqueta('${x.id}')">＋ Añadir al stock</button></div>`};
 window.confirmarEntradaEtiqueta=async function(id){
  const x=stock.find(s=>s.id===id);if(!x)return;const qty=Math.max(1,Number($('#recvQty')?.value||1)),prev=Number(x.quantity||0),next=prev+qty;
  const {error}=await supabaseClient.from('base_stock_items').update({quantity:next}).eq('id',id);if(error){console.error(error);toast('No se pudo actualizar el stock');return}
  const reason=`Recepción proveedor${purchaseId?` · compra ${purchaseId}`:''} · etiqueta OCR`;
  await supabaseClient.from('base_stock_movements').insert({item_id:id,movement_type:'entrada',quantity_delta:qty,previous_quantity:prev,new_quantity:next,reason});
  x.quantity=next;toast(`Stock +${qty}`);
  $('#ocrResult').innerHTML=`<div class="card" style="margin-top:12px"><b>✅ Entrada registrada</b><div class="muted">${esc(x.supplier||'')} · ${esc(x.supplier_model||'')} · ${esc(x.size||'')} · ${esc(x.color||'')} → ${next} ud.</div><button class="primary" style="width:100%;margin-top:10px" onclick="document.getElementById('labelPhoto').click()">📷 Escanear siguiente</button></div>`;
 };
})();