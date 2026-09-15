/* AIHXO · Producción Kanban */
(function(){
 const n=v=>String(v||'').trim().toLowerCase();
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const cancelled=o=>n(o.status)==='cancelado';
 const delivered=o=>n(o.status)==='entregado';
 const finished=o=>['terminado','enviado','entregado'].includes(n(o.production_status))||['terminado','enviado','entregado'].includes(n(o.status));
 const daysOld=o=>{const d=new Date(o.order_date||o.created_at||0);if(!d||isNaN(d))return 0;return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))};
 const overdue=o=>!finished(o)&&daysOld(o)>=3;
 const badge=(txt,bg='#eef3f8',fg='#07152f')=>`<span style="display:inline-block;padding:5px 9px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:800">${esc(txt||'—')}</span>`;
 const stages=[
  {key:'Pendiente',icon:'🕒',test:o=>['','pendiente'].includes(n(o.production_status))},
  {key:'Diseño',icon:'🎨',test:o=>['pendiente cliente','boceto preparado','enviado al cliente','cambios solicitados'].includes(n(o.design_approval_status))},
  {key:'DTF',icon:'🖨️',test:o=>['pedido','recibido','listo'].includes(n(o.dtf_status))&&n(o.production_status)!=='en producción'&&n(o.production_status)!=='en produccion'&&n(o.production_status)!=='terminado'},
  {key:'Lista para planchar',icon:'🔥',test:o=>['lista para planchar','listo para planchar'].includes(n(o.production_status))},
  {key:'En producción',icon:'🏭',test:o=>['en producción','en produccion'].includes(n(o.production_status))},
  {key:'Terminado',icon:'✅',test:o=>n(o.production_status)==='terminado'}
 ];
 async function update(id,patch,msg){patch.production_updated_at=new Date().toISOString();const {error}=await supabaseClient.from('orders').update(patch).eq('id',id);if(error){console.error(error);toast('No se pudo actualizar');return}const o=orders.find(x=>x.id===id);if(o)Object.assign(o,patch);toast(msg||'Actualizado');window.produccionView($('#view'))}
 function stageFor(o){if(n(o.production_status)==='terminado')return 'Terminado';if(['en producción','en produccion'].includes(n(o.production_status)))return 'En producción';if(['lista para planchar','listo para planchar'].includes(n(o.production_status)))return 'Lista para planchar';if(['pendiente cliente','boceto preparado','enviado al cliente','cambios solicitados'].includes(n(o.design_approval_status)))return 'Diseño';if(['pedido','recibido','listo'].includes(n(o.dtf_status)))return 'DTF';return 'Pendiente'}
 function nextStage(id,current){const map={'Pendiente':'Lista para planchar','Diseño':'Pendiente','DTF':'Lista para planchar','Lista para planchar':'En producción','En producción':'Terminado'};const next=map[current];if(!next)return;if(next==='En producción')return window.aihxoProdStart(id);if(next==='Terminado')return window.aihxoProdFinish(id);return window.aihxoProdStatus(id,next)}
 function card(o,s){const qty=s?Number(s.quantity||0):null;const needed=Number(o.base_stock_quantity||o.quantity||1);const enough=s?qty>=needed:false;const stage=stageFor(o);const old=daysOld(o);return `<div class="card" style="padding:14px;border:${overdue(o)?'2px solid #d92d20':'1px solid #e4e7ec'};box-shadow:none">
   <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b>${esc(o.order_number||'Pedido')}</b><div class="muted" style="margin-top:2px">${esc(o.customer_name||'')}</div></div>${overdue(o)?badge(`⚠️ ${old} días`,'#fee4e2','#b42318'):badge(stage)}</div>
   <div style="margin-top:10px;font-size:14px"><b>${esc(o.product_name||o.design||'')}</b></div><div class="muted">${esc(o.size||'')} · ${esc(o.color||'')}</div>
   <div style="margin-top:9px;font-size:13px">${s?(enough?'✅':'❌')+' '+esc(s.supplier_model||s.supplier||'Prenda')+' · '+esc(s.size||'')+' · '+esc(s.color||''):'⚠️ Sin prenda vinculada'}</div>
   <div style="margin-top:5px;font-size:13px">DTF: <b>${esc(o.dtf_status||'Pendiente')}</b> · Diseño: <b>${esc(o.design_approval_status||'No aplica')}</b></div>
   ${o.production_notes?`<div style="margin-top:8px;padding:8px;background:#f6f8fb;border-radius:8px;font-size:12px">📝 ${esc(o.production_notes)}</div>`:''}
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button class="secondary small" onclick="aihxoProdOpen('${o.id}')">Ficha</button>${stage!=='Terminado'?`<button class="primary small" onclick="aihxoProdNext('${o.id}','${stage.replace(/'/g,"\\'")}')">Siguiente →</button>`:''}</div>
  </div>`}
 window.produccionView=async function(c){
   const work=orders.filter(o=>!cancelled(o)&&!delivered(o));
   const ids=work.map(o=>o.base_stock_item_id).filter(Boolean);
   let stock=[];if(ids.length){const r=await supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,quantity').in('id',ids);stock=r.data||[]}
   const stockMap=Object.fromEntries(stock.map(x=>[x.id,x]));
   const delayed=work.filter(overdue);const doing=work.filter(o=>['en producción','en produccion'].includes(n(o.production_status))).length;const ready=work.filter(o=>['lista para planchar','listo para planchar'].includes(n(o.production_status))).length;
   c.innerHTML=`<div class="page"><div class="section"><div><h2>🏭 Producción</h2><div class="muted">Kanban del taller · de diseño a entrega</div></div><button class="primary" onclick="orderForm()">＋ Pedido</button></div>
   <div class="grid kpis">${kpi('Activos',work.length,'pedidos en curso')}${kpi('Con retraso',delayed.length,delayed.length?'revisar hoy':'sin incidencias')}${kpi('Listos para planchar',ready,'preparados')}${kpi('En producción',doing,'trabajo iniciado')}</div>
   ${delayed.length?`<div class="card" style="border:2px solid #f04438;background:#fff8f7;margin-bottom:14px"><b>⚠️ Pedidos atrasados</b><div class="muted" style="margin-top:4px">${delayed.map(o=>`${esc(o.order_number||'Pedido')} · ${esc(o.customer_name||'')} · ${daysOld(o)} días`).join('<br>')}</div></div>`:''}
   <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory">${stages.map(st=>{const list=work.filter(o=>stageFor(o)===st.key);return `<div style="min-width:285px;max-width:285px;scroll-snap-align:start;background:#f7f9fc;border-radius:16px;padding:10px"><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 2px 10px"><b>${st.icon} ${st.key}</b>${badge(list.length)}</div><div style="display:grid;gap:10px">${list.length?list.map(o=>card(o,stockMap[o.base_stock_item_id])).join(''):'<div class="muted" style="padding:16px;text-align:center">Sin pedidos</div>'}</div></div>`}).join('')}</div></div>`;
 };
 window.aihxoProdNext=nextStage;
 window.aihxoProdOpen=id=>{if(typeof window.abrirFichaPedido==='function')return window.abrirFichaPedido(id);if(typeof window.verDetallePedido==='function')return window.verDetallePedido(id)};
 window.aihxoProdStatus=(id,status)=>update(id,{production_status:status},'Producción actualizada');
 window.aihxoProdStart=(id)=>update(id,{production_status:'En producción',status:'En producción'},'Producción iniciada');
 window.aihxoProdFinish=(id)=>update(id,{production_status:'Terminado',status:'Terminado'},'Pedido terminado');
 window.aihxoProdDTF=id=>{const o=orders.find(x=>x.id===id);const vals=['Pendiente','Pedido','Recibido','Listo'];const i=vals.indexOf(o?.dtf_status||'Pendiente');update(id,{dtf_status:vals[(i+1)%vals.length]},'Estado DTF actualizado')};
 window.aihxoProdApproval=id=>{const o=orders.find(x=>x.id===id);const vals=['No aplica','Pendiente cliente','Aprobado'];const i=vals.indexOf(o?.design_approval_status||'No aplica');update(id,{design_approval_status:vals[(i+1)%vals.length]},'Aprobación actualizada')};
})();