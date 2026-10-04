/* AIHXO · Ficha completa de pedido + checklist */
(function(){
 const val=(o,k,d='')=>o?.[k]??d, num=v=>Number(v||0), norm=v=>String(v||'').trim().toLowerCase();
 const field=(label,id,value,type='text',step='')=>`<div class="field"><label>${label}</label><input id="${id}" type="${type}" ${step?`step="${step}"`:''} value="${esc(String(value??''))}"></div>`;
 const checklist=o=>{
  const total=num(o.total), paid=num(o.amount_paid);
  return [
   {key:'design',icon:'🎨',label:'Diseño aprobado',done:['aprobado','no aplica'].includes(norm(o.design_approval_status))},
   {key:'garment',icon:'👕',label:'Prenda asignada',done:o.base_stock_allocated===true},
   {key:'dtf',icon:'🖨️',label:'DTF recibido',done:['recibido','listo'].includes(norm(o.dtf_status))},
   {key:'ironed',icon:'🔥',label:'Planchado',done:!!o.ironed_at,manual:true},
   {key:'packed',icon:'📦',label:'Empaquetado',done:!!o.packed_at,manual:true},
   {key:'paid',icon:'💳',label:'Pagado',done:norm(o.payment_status)==='pagado'||(total>0&&paid>=total)},
   {key:'delivered',icon:'✅',label:'Entregado',done:norm(o.status)==='entregado'}
  ];
 };
 const checklistSummary=o=>{const c=checklist(o),done=c.filter(x=>x.done).length;return {items:c,done,total:c.length,pct:Math.round(done/c.length*100)}};
 const checklistHtml=o=>checklist(o).map(x=>`<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${x.done?'#b7e4c7':'#e4e7ec'};background:${x.done?'#f0fff4':'#fff'};border-radius:12px;min-height:58px;box-sizing:border-box;overflow:hidden"><input style="width:20px!important;min-width:20px;max-width:20px;height:20px;flex:0 0 20px;margin:0" ${x.manual?`id="pdChecklist_${x.key}" type="checkbox" ${x.done?'checked':''}`:`type="checkbox" ${x.done?'checked':''} disabled`}><span style="font-size:18px;flex:0 0 auto">${x.icon}</span><span style="flex:1;min-width:0;line-height:1.2"><b style="display:block;overflow-wrap:anywhere">${x.label}</b>${!x.manual?`<div class="muted" style="font-size:12px;margin-top:2px;white-space:normal">Se actualiza automáticamente</div>`:''}</span><span style="flex:0 0 auto">${x.done?'✅':'○'}</span></label>`).join('');

 window.abrirFichaPedido=async function(id){
  try{
   const o=orders.find(x=>x.id===id);if(!o){toast('Pedido no encontrado');return}
   const drawerBody=document.getElementById('drawerBody'),drawer=document.getElementById('drawer');
   if(!drawerBody||!drawer){toast('No se pudo abrir la ficha');return}
   let base=null;
   if(o.base_stock_item_id){const r=await supabaseClient.from('base_stock_items').select('*').eq('id',o.base_stock_item_id).maybeSingle();base=r.data||null}
   const garmentCost=num(o.garment_actual_cost)||num(o.estimated_costs?.garment)||(base?num(base.unit_cost)*Math.max(1,num(o.base_stock_quantity||o.quantity||1)):0);
   const costs=garmentCost+num(o.dtf_actual_cost)+num(o.packaging_cost)+num(o.supplier_shipping_cost)+num(o.outbound_shipping_cost)+num(o.extras_actual_cost),total=num(o.total),margin=total-costs,marginPct=total?margin/total*100:0;
   const cs=checklistSummary(o);
   drawerBody.innerHTML=`<div class="section"><div><h2>${esc(o.order_number||'Pedido')}</h2><div class="muted">Expediente completo · ${esc(o.customer_name||'')}</div></div></div><div class="grid two"><div class="card"><div class="label">CLIENTE</div><h3>${esc(o.customer_name||'—')}</h3><div class="muted">${esc(o.contact||'Sin contacto')}</div></div><div class="card"><div class="label">PEDIDO</div><h3>${money(total)}</h3><div class="muted">${esc(o.status||'')} · ${esc(o.order_date||'')}</div></div></div>
   <div class="card" style="margin-top:14px"><div class="section"><div><h3 style="margin:0">✅ Checklist del pedido</h3><div class="muted">${cs.done}/${cs.total} pasos completados</div></div><b>${cs.pct}%</b></div><div style="height:9px;background:#edf0f4;border-radius:999px;overflow:hidden;margin:10px 0 14px"><div style="height:100%;width:${cs.pct}%;background:#07152f"></div></div><div style="display:grid;gap:8px">${checklistHtml(o)}</div><div class="muted" style="font-size:12px;margin-top:10px">Planchado y empaquetado se marcan aquí. Diseño, prenda, DTF, cobro y entrega se sincronizan con sus estados.</div></div>
   <div class="card" style="margin-top:14px"><h3>👕 Prenda y diseño</h3><div class="grid two"><div><b>${esc(o.product_name||o.design||'—')}</b><div class="muted">${esc(o.size||'')} · ${esc(o.color||'')} · ${num(o.quantity)||1} ud.</div><div style="margin-top:8px">${base?`Prenda: <b>${esc(base.supplier||'')} ${esc(base.supplier_model||'')}</b><br><span class="muted">Stock actual: ${num(base.quantity)} ud.</span>`:'<span class="muted">⚠️ Sin variante de stock vinculada</span>'}</div></div><div><div>Delantera: ${o.design_front_path?'✅ Archivo guardado':'—'}</div><div>Trasera: ${o.design_back_path?'✅ Archivo guardado':'—'}</div><div style="margin-top:7px">Aprobación: <b>${esc(o.design_approval_status||'No aplica')}</b></div><div>DTF: <b>${esc(o.dtf_status||'Pendiente')}</b></div></div></div></div>
   <div class="card" style="margin-top:14px"><h3>🏭 Producción</h3><div class="grid two"><div class="field"><label>Estado de producción</label><select id="pdProduction">${['Pendiente llegada','Pendiente','Lista para planchar','En producción','Terminado'].map(x=>`<option ${val(o,'production_status','Pendiente')===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Estado general</label><select id="pdStatus">${['Pendiente','Diseño preparado','En producción','Terminado','Enviado','Entregado','Cancelado'].map(x=>`<option ${val(o,'status')===x?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="field"><label>Notas de producción</label><textarea id="pdProdNotes" rows="3">${esc(val(o,'production_notes'))}</textarea></div></div>
   <div class="card" style="margin-top:14px"><h3>💳 Cobros</h3><div>Cobrado: <b>${money(o.amount_paid)}</b> · Pendiente: <b>${money(Math.max(0,total-num(o.amount_paid)))}</b></div><button type="button" class="secondary" id="pdOpenCash">Registrar cobro / ver historial</button></div>
   <div class="card" style="margin-top:14px"><h3>📊 Coste y margen real</h3><div class="grid two">${field('Prenda','pdGarmentCost',garmentCost,'number','0.01')}${field('DTF','pdDtfCost',(num(o.dtf_actual_cost)||num(o.estimated_costs?.dtf)),'number','0.01')}${field('Embalaje','pdPackCost',(num(o.packaging_cost)||num(o.estimated_costs?.packaging)),'number','0.01')}${field('Transporte proveedor','pdShipCost',(num(o.supplier_shipping_cost)||num(o.estimated_costs?.transport)),'number','0.01')}${field('Envío cliente','pdOutboundShipCost',num(o.outbound_shipping_cost),'number','0.01')}${field('Extras','pdExtraCost',(num(o.extras_actual_cost)||num(o.estimated_costs?.extras)),'number','0.01')}</div><div class="grid two" style="margin-top:10px"><div class="card"><div class="label">COSTE REAL</div><div class="kvalue">${money(costs)}</div></div><div class="card"><div class="label">MARGEN</div><div class="kvalue">${money(margin)}</div><div class="sub">${marginPct.toFixed(1)}%</div></div></div></div>
   <div class="card" style="margin-top:14px"><h3>📝 Notas internas</h3><textarea id="pdInternal" rows="4">${esc(val(o,'internal_notes'))}</textarea></div><div style="display:flex;gap:10px;margin-top:16px"><button class="primary" style="flex:1" id="pdSaveBtn">Guardar cambios</button><button class="secondary" id="pdCloseBtn">Cerrar</button></div>`;
   drawer.classList.remove('hidden');
   document.getElementById('pdSaveBtn').onclick=()=>window.guardarFichaPedido(o.id);
   document.getElementById('pdOpenCash').onclick=()=>{closeDrawer();window._aihxoCashFocus=o.id;setView('cash')};
   await window.aihxoOrderExtras?.(o,drawerBody);
   document.getElementById('pdCloseBtn').onclick=()=>typeof window.closeDrawer==='function'?window.closeDrawer():drawer.classList.add('hidden');
  }catch(e){console.error('Error abriendo ficha completa',e);toast('No se pudo abrir la ficha completa')}
 };

 window.guardarFichaPedido=async function(id){
  const old=orders.find(x=>x.id===id),now=new Date().toISOString();
  const ironed=$('#pdChecklist_ironed')?.checked,packed=$('#pdChecklist_packed')?.checked;
  const patch={status:$('#pdStatus').value,production_status:$('#pdProduction').value,production_notes:$('#pdProdNotes').value.trim(),garment_actual_cost:num($('#pdGarmentCost').value),dtf_actual_cost:num($('#pdDtfCost').value),packaging_cost:num($('#pdPackCost').value),supplier_shipping_cost:num($('#pdShipCost').value),outbound_shipping_cost:num($('#pdOutboundShipCost').value),extras_actual_cost:num($('#pdExtraCost').value),internal_notes:$('#pdInternal').value.trim(),production_updated_at:now,ironed_at:ironed?(old?.ironed_at||now):null,packed_at:packed?(old?.packed_at||now):null};
  if(!old.base_stock_allocated && (old.base_stock_item_id||(old.order_lines||[]).some(l=>l.item_id)) && patch.production_status!=='Pendiente llegada'){toast('Primero deben asignarse todas las prendas');return;}
  if(['garment_actual_cost','dtf_actual_cost','packaging_cost','supplier_shipping_cost','outbound_shipping_cost','extras_actual_cost'].some(k=>!Number.isFinite(patch[k])||patch[k]<0)){toast('Revisa los costes');return;}
  const {error}=await supabaseClient.from('orders').update(patch).eq('id',id);if(error){console.error(error);toast('No se pudo guardar');return}
  if(old)Object.assign(old,patch);toast('Ficha del pedido guardada');if(typeof window.closeDrawer==='function')window.closeDrawer();else document.getElementById('drawer')?.classList.add('hidden');drawOrders();
 };

 const oldDraw=window.drawOrders;window.drawOrders=function(){
  if(typeof oldDraw==='function')oldDraw();
  const q=($('#oq')?.value||'').toLowerCase();
  const list=orders.filter(o=>`${o.order_number||''} ${o.customer_name||''} ${o.product_name||''} ${o.size||''} ${o.color||''}`.toLowerCase().includes(q));
  document.querySelectorAll('#orderTable .card > div > .card, #orderTable > div > .card').forEach((card,i)=>{
   const o=list[i];if(!o)return;
   if(!card.querySelector('.aihxo-check-progress')){const cs=checklistSummary(o),d=document.createElement('div');d.className='aihxo-check-progress';d.style.cssText='margin-top:9px;padding:9px 10px;background:#f6f8fb;border-radius:10px;font-size:12px';d.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px"><b>✅ Checklist ${cs.done}/${cs.total}</b><span>${cs.pct}%</span></div><div style="height:6px;background:#e4e7ec;border-radius:999px;overflow:hidden;margin-top:6px"><div style="height:100%;width:${cs.pct}%;background:#07152f"></div></div>`;card.appendChild(d)}
   if(!card.querySelector('.aihxo-full-order')){const b=document.createElement('button');b.className='primary aihxo-full-order';b.style.cssText='margin-top:8px;width:100%';b.textContent='📋 Ficha completa';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.abrirFichaPedido(o.id)});card.appendChild(b)}
  });
 };
})();
