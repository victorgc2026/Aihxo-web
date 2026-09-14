/* AIHXO · Producción */
(function(){
 const n=v=>String(v||'').trim().toLowerCase();
 const cancelled=o=>n(o.status)==='cancelado';
 const delivered=o=>n(o.status)==='entregado';
 const badge=(txt)=>`<span style="display:inline-block;padding:5px 9px;border-radius:999px;background:#eef3f8;font-size:12px;font-weight:800">${esc(txt||'—')}</span>`;
 async function update(id,patch,msg){patch.production_updated_at=new Date().toISOString();const {error}=await supabaseClient.from('orders').update(patch).eq('id',id);if(error){console.error(error);toast('No se pudo actualizar');return}const o=orders.find(x=>x.id===id);if(o)Object.assign(o,patch);toast(msg||'Actualizado');window.produccionView($('#view'))}
 window.produccionView=async function(c){
   const work=orders.filter(o=>!cancelled(o)&&!delivered(o));
   const ids=work.map(o=>o.base_stock_item_id).filter(Boolean);
   let stock=[]; if(ids.length){const r=await supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,quantity').in('id',ids);stock=r.data||[]}
   const stockMap=Object.fromEntries(stock.map(x=>[x.id,x]));
   const ready=work.filter(o=>n(o.production_status)==='lista para planchar'||n(o.production_status)==='listo para planchar').length;
   const doing=work.filter(o=>n(o.production_status)==='en producción'||n(o.production_status)==='en produccion').length;
   c.innerHTML=`<div class="page"><div class="section"><div><h2>🏭 Producción</h2><div class="muted">Cola real de trabajo del taller</div></div><button class="primary" onclick="orderForm()">＋ Pedido</button></div>
   <div class="grid kpis">${kpi('Por producir',work.length,'pedidos activos')}${kpi('Listos para planchar',ready,'DTF y prenda preparados')}${kpi('En producción',doing,'trabajo iniciado')}</div>
   ${work.length?`<div style="display:grid;gap:14px">${work.map(o=>{const s=stockMap[o.base_stock_item_id];const qty=s?Number(s.quantity||0):null;const enough=s?qty>=Number(o.base_stock_quantity||o.quantity||1):false;return `<div class="card"><div class="section"><div><h2 style="margin-bottom:3px">${esc(o.order_number||'Pedido')} · ${esc(o.customer_name||'')}</h2><div class="muted">${esc(o.product_name||o.design||'')} · ${esc(o.size||'')} · ${esc(o.color||'')}</div></div>${badge(o.production_status||'Pendiente')}</div>
   <div class="grid two" style="margin-top:12px"><div><div class="label">PRENDA</div><div style="margin-top:5px"><b>${s?esc(s.supplier_model||s.supplier||'Prenda vinculada'):'Sin prenda de stock vinculada'}</b></div><div class="muted">${s?`${esc(s.size||'')} · ${esc(s.color||'')} · ${qty} ud. disponibles`:''}</div><div style="margin-top:6px">${s?(enough?'✅ Prenda disponible':'❌ Sin stock suficiente'):'⚠️ Revisar prenda'}</div></div><div><div class="label">DISEÑO / DTF</div><div style="margin-top:5px">Aprobación: <b>${esc(o.design_approval_status||'No aplica')}</b></div><div>DTF: <b>${esc(o.dtf_status||'Pendiente')}</b></div><div class="muted">${o.design_front_path?'✅ Delantera ':'— Delantera '}${o.design_back_path?' · ✅ Trasera':' · — Trasera'}</div></div></div>
   ${o.production_notes?`<div style="margin-top:10px;padding:10px;background:#f6f8fb;border-radius:10px">📝 ${esc(o.production_notes)}</div>`:''}
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="secondary small" onclick="aihxoProdStatus('${o.id}','Pendiente')">Pendiente</button><button class="secondary small" onclick="aihxoProdStatus('${o.id}','Lista para planchar')">Lista para planchar</button><button class="primary small" onclick="aihxoProdStart('${o.id}')">▶ En producción</button><button class="secondary small" onclick="aihxoProdFinish('${o.id}')">✓ Terminado</button><button class="secondary small" onclick="aihxoProdDTF('${o.id}')">DTF: ${esc(o.dtf_status||'Pendiente')}</button><button class="secondary small" onclick="aihxoProdApproval('${o.id}')">Aprobación: ${esc(o.design_approval_status||'No aplica')}</button></div></div>`}).join('')}</div>`:'<div class="card empty">No hay pedidos pendientes de producción.</div>'}</div>`;
 };
 window.aihxoProdStatus=(id,status)=>update(id,{production_status:status},'Producción actualizada');
 window.aihxoProdStart=(id)=>update(id,{production_status:'En producción',status:'En producción'},'Producción iniciada');
 window.aihxoProdFinish=(id)=>update(id,{production_status:'Terminado'},'Pedido terminado');
 window.aihxoProdDTF=id=>{const o=orders.find(x=>x.id===id);const vals=['Pendiente','Pedido','Recibido','Listo'];const i=vals.indexOf(o?.dtf_status||'Pendiente');update(id,{dtf_status:vals[(i+1)%vals.length]},'Estado DTF actualizado')};
 window.aihxoProdApproval=id=>{const o=orders.find(x=>x.id===id);const vals=['No aplica','Pendiente cliente','Aprobado'];const i=vals.indexOf(o?.design_approval_status||'No aplica');update(id,{design_approval_status:vals[(i+1)%vals.length]},'Aprobación actualizada')};
})();