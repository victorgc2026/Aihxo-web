/* AIHXO · Producción · prenda pendiente de llegada */
(function(){
 const n=v=>String(v||'').trim().toLowerCase();
 const esc2=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const badge=(txt,bg='#eef3f8',fg='#07152f')=>`<span style="display:inline-block;padding:5px 9px;border-radius:999px;background:${bg};color:${fg};font-size:12px;font-weight:800">${esc2(txt||'—')}</span>`;
 const daysOld=o=>{const d=new Date(o.order_date||o.created_at||0);return isNaN(d)?0:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))};
 const done=o=>['terminado','enviado','entregado'].includes(n(o.production_status))||['terminado','enviado','entregado'].includes(n(o.status));
 const stageFor=o=>{
   if(n(o.production_status)==='pendiente llegada')return 'Pendiente llegada';
   if(n(o.production_status)==='terminado')return 'Terminado';
   if(['en producción','en produccion'].includes(n(o.production_status)))return 'En producción';
   if(['lista para planchar','listo para planchar'].includes(n(o.production_status)))return 'Lista para planchar';
   if(['pendiente cliente','boceto preparado','enviado al cliente','cambios solicitados'].includes(n(o.design_approval_status)))return 'Diseño';
   if(['pedido','recibido','listo'].includes(n(o.dtf_status)))return 'DTF';
   return 'Pendiente';
 };
 const stages=[['Pendiente llegada','🚚'],['Pendiente','🕒'],['Diseño','🎨'],['DTF','🖨️'],['Lista para planchar','🔥'],['En producción','🏭'],['Terminado','✅']];

 window.produccionView=async function(c){
   const work=(orders||[]).filter(o=>n(o.status)!=='cancelado'&&n(o.status)!=='entregado');
   const ids=[...new Set(work.map(o=>o.base_stock_item_id).filter(Boolean))];
   let stock=[];if(ids.length){const r=await supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,quantity').in('id',ids);stock=r.data||[]}
   const sm=Object.fromEntries(stock.map(x=>[x.id,x]));
   const waiting=work.filter(o=>stageFor(o)==='Pendiente llegada').length,delayed=work.filter(o=>!done(o)&&stageFor(o)!=='Pendiente llegada'&&daysOld(o)>=3).length,doing=work.filter(o=>stageFor(o)==='En producción').length,ready=work.filter(o=>stageFor(o)==='Lista para planchar').length;
   const card=o=>{const s=sm[o.base_stock_item_id],st=stageFor(o),need=Number(o.base_stock_quantity||o.quantity||1),allocated=o.base_stock_allocated===true||(o.base_stock_allocated==null&&!!o.base_stock_item_id&&st!=='Pendiente llegada'),old=daysOld(o);return `<div class="card" style="padding:14px;border:${old>=3&&st!=='Pendiente llegada'&&!done(o)?'2px solid #d92d20':'1px solid #e4e7ec'};box-shadow:none"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><b>${esc2(o.order_number||'Pedido')}</b><div class="muted">${esc2(o.customer_name||'')}</div></div>${st==='Pendiente llegada'?badge('🚚 Pendiente llegada','#fff4e5','#8a4b08'):badge(st)}</div><div style="margin-top:10px"><b>${esc2(o.product_name||o.design||'')}</b></div><div class="muted">${esc2(o.size||'')} · ${esc2(o.color||'')}</div><div style="margin-top:9px;font-size:13px">${s?(allocated?`✅ Prenda asignada · ${esc2(s.supplier_model||s.supplier||'Prenda')} · ${esc2(s.size||'')} · ${esc2(s.color||'')}`:`🚚 Esperando ${need} ud. · ${esc2(s.supplier_model||s.supplier||'Prenda')} · ${esc2(s.size||'')} · ${esc2(s.color||'')} · stock actual ${Number(s.quantity||0)}`):'⚠️ Sin prenda vinculada'}</div><div style="margin-top:5px;font-size:13px">DTF: <b>${esc2(o.dtf_status||'Pendiente')}</b> · Diseño: <b>${esc2(o.design_approval_status||'No aplica')}</b></div>${o.production_notes?`<div style="margin-top:8px;padding:8px;background:#f6f8fb;border-radius:8px;font-size:12px">📝 ${esc2(o.production_notes)}</div>`:''}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px"><button class="secondary small" onclick="aihxoProdOpen('${o.id}')">Ficha</button>${st!=='Terminado'&&st!=='Pendiente llegada'?`<button class="primary small" onclick="aihxoProdNext('${o.id}','${st.replace(/'/g,"\\'")}')">Siguiente →</button>`:''}</div></div>`};
   c.innerHTML=`<div class="page"><div class="section"><div><h2>🏭 Producción</h2><div class="muted">Kanban del taller · de diseño a entrega</div></div><button class="primary" onclick="orderForm()">＋ Pedido</button></div><div class="grid kpis">${kpi('Activos',work.length,'pedidos en curso')}${kpi('Pendiente llegada',waiting,waiting?'esperando prendas':'sin esperas')}${kpi('Listos para planchar',ready,'preparados')}${kpi('En producción',doing,'trabajo iniciado')}</div>${delayed?`<div class="card" style="border:2px solid #f04438;background:#fff8f7;margin-bottom:14px"><b>⚠️ ${delayed} pedido${delayed===1?'':'s'} con retraso</b></div>`:''}<div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory">${stages.map(([key,icon])=>{const list=work.filter(o=>stageFor(o)===key);return `<div style="min-width:285px;max-width:285px;scroll-snap-align:start;background:#f7f9fc;border-radius:16px;padding:10px"><div style="display:flex;justify-content:space-between;align-items:center;padding:4px 2px 10px"><b>${icon} ${key}</b>${badge(list.length)}</div><div style="display:grid;gap:10px">${list.length?list.map(card).join(''):'<div class="muted" style="padding:16px;text-align:center">Sin pedidos</div>'}</div></div>`}).join('')}</div></div>`;
 };
})();