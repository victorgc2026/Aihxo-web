/* AIHXO · Rentabilidad avanzada · filtros y producto */
(function(){
 const N=v=>Number(v||0);
 const norm=v=>String(v||'').trim().toLowerCase();
 const esc2=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const actualCost=o=>N(o.garment_actual_cost)+N(o.dtf_actual_cost)+N(o.packaging_cost)+N(o.supplier_shipping_cost)+N(o.extras_actual_cost);
 const orderDate=o=>String(o.order_date||o.created_at||'').slice(0,10);
 const expenseDate=e=>String(e.expense_date||e.date||e.created_at||'').slice(0,10);
 const label=o=>String(o.product_name||o.design||o.model||o.product||'Sin producto').trim()||'Sin producto';
 const inRange=(d,from,to)=>{if(!d)return false;if(from&&d<from)return false;if(to&&d>to)return false;return true};
 const iso=d=>{const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
 function rangePreset(p){const now=new Date(),y=now.getFullYear(),m=now.getMonth();if(p==='all')return {from:'',to:''};if(p==='month')return {from:iso(new Date(y,m,1)),to:iso(now)};if(p==='lastmonth')return {from:iso(new Date(y,m-1,1)),to:iso(new Date(y,m,0))};if(p==='30')return {from:iso(new Date(y,m,now.getDate()-29)),to:iso(now)};return {from:'',to:''}}
 window._aihxoProfitFilter=window._aihxoProfitFilter||{preset:'month',from:'',to:'',product:''};
 window.rentabilidadView=async function(c){
  const state=window._aihxoProfitFilter;
  if(state.preset&&state.preset!=='custom'){const r=rangePreset(state.preset);state.from=r.from;state.to=r.to}
  const [{data:ex,error:exErr},{data:stock,error:stErr}]=await Promise.all([
    supabaseClient.from('expenses').select('*'),
    supabaseClient.from('base_stock_items').select('quantity,unit_cost')
  ]);
  if(exErr||stErr)console.error(exErr||stErr);
  const base=(window.orders||[]).filter(o=>norm(o.status)!=='cancelado');
  const products=[...new Set(base.map(label))].sort((a,b)=>a.localeCompare(b,'es'));
  const valid=base.filter(o=>inRange(orderDate(o),state.from,state.to)&&(!state.product||label(o)===state.product));
  const expenses=(ex||[]).filter(e=>!state.product&&inRange(expenseDate(e),state.from,state.to));
  const sales=valid.reduce((a,o)=>a+N(o.total),0);
  const rows=valid.map(o=>{const cost=actualCost(o)||N(o.product_cost);return {...o,_cost:cost,_margin:N(o.total)-cost,_label:label(o)}});
  const costs=rows.reduce((a,o)=>a+o._cost,0),gross=sales-costs,known=valid.filter(o=>actualCost(o)>0).length;
  const expensesTotal=expenses.reduce((a,x)=>a+N(x.amount),0),net=gross-expensesTotal;
  const stockValue=(stock||[]).reduce((a,x)=>a+N(x.quantity)*N(x.unit_cost),0);
  const ranked=[...rows].sort((a,b)=>b._margin-a._margin);
  const byProduct={};rows.forEach(o=>{const k=o._label;if(!byProduct[k])byProduct[k]={name:k,orders:0,sales:0,cost:0,margin:0};byProduct[k].orders++;byProduct[k].sales+=N(o.total);byProduct[k].cost+=o._cost;byProduct[k].margin+=o._margin});
  const productRows=Object.values(byProduct).sort((a,b)=>b.margin-a.margin);
  const best=productRows[0];
  c.innerHTML=`<div class="page">
   <div class="section"><div><h2>📈 Rentabilidad real</h2><div class="muted">Filtra por fechas y descubre qué productos dejan más margen</div></div></div>
   <div class="card" style="margin-bottom:14px"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px"><button class="${state.preset==='month'?'primary':'secondary'} pfPreset" data-p="month">Este mes</button><button class="${state.preset==='lastmonth'?'primary':'secondary'} pfPreset" data-p="lastmonth">Mes pasado</button><button class="${state.preset==='30'?'primary':'secondary'} pfPreset" data-p="30">30 días</button><button class="${state.preset==='all'?'primary':'secondary'} pfPreset" data-p="all">Todo</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label>Desde<input id="pfFrom" type="date" value="${esc2(state.from)}"></label><label>Hasta<input id="pfTo" type="date" value="${esc2(state.to)}"></label></div><label style="display:block;margin-top:10px">Producto / diseño<select id="pfProduct"><option value="">Todos</option>${products.map(p=>`<option value="${esc2(p)}" ${state.product===p?'selected':''}>${esc2(p)}</option>`).join('')}</select></label><div class="muted" style="margin-top:8px">${state.product?'Los gastos generales no se descuentan al filtrar un producto concreto.':'Los gastos generales del periodo sí se incluyen en el resultado.'}</div></div>
   <div class="grid kpis">${kpi('Ventas',money(sales),valid.length+' pedidos')}${kpi('Coste producción',money(costs),known+'/'+valid.length+' con coste real')}${kpi('Margen bruto',money(gross),sales?((gross/sales)*100).toFixed(1)+'%':'')}${kpi('Gastos',money(expensesTotal),state.product?'no aplicados por producto':'del periodo')}${kpi('Resultado',money(net),'después de gastos')}${kpi('Dinero en stock',money(stockValue),'valor actual')}</div>
   ${best?`<div class="card" style="margin-bottom:14px">🏆 <b>Mejor margen del periodo:</b> ${esc2(best.name)} · ${money(best.margin)} <span class="muted">(${best.orders} pedido${best.orders===1?'':'s'})</span></div>`:''}
   <div class="card"><div class="section"><div><h2>👕 Rentabilidad por producto</h2><div class="muted">Ordenado por margen total</div></div></div>${productRows.length?`<div class="table-wrap"><table><thead><tr><th>Producto</th><th>Pedidos</th><th>Ventas</th><th>Coste</th><th>Margen</th><th>%</th></tr></thead><tbody>${productRows.map(p=>`<tr><td><b>${esc2(p.name)}</b></td><td>${p.orders}</td><td>${money(p.sales)}</td><td>${money(p.cost)}</td><td><b>${money(p.margin)}</b></td><td>${p.sales?((p.margin/p.sales)*100).toFixed(1):'0.0'}%</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay pedidos para este filtro.</div>'}</div>
   <div class="card"><div class="section"><div><h2>🏆 Rentabilidad por pedido</h2><div class="muted">Ordenados por margen</div></div></div>${ranked.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Producto</th><th>Venta</th><th>Coste</th><th>Margen</th></tr></thead><tbody>${ranked.map(o=>`<tr><td><b>${esc2(o.order_number||'')}</b></td><td>${esc2(o.customer_name||'')}</td><td>${esc2(o._label)}</td><td>${money(o.total)}</td><td>${money(o._cost)}</td><td><b>${money(o._margin)}</b></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay pedidos para este filtro.</div>'}</div>
   ${known<valid.length?`<div class="card" style="margin-top:14px">⚠️ <b>${valid.length-known} pedidos del filtro no tienen desglose de coste real.</b><div class="muted">Mientras tanto se usa el coste histórico cuando existe.</div></div>`:''}
  </div>`;
  c.querySelectorAll('.pfPreset').forEach(b=>b.onclick=()=>{state.preset=b.dataset.p;state.product=c.querySelector('#pfProduct')?.value||'';window.rentabilidadView(c)});
  c.querySelector('#pfFrom').onchange=e=>{state.preset='custom';state.from=e.target.value;state.to=c.querySelector('#pfTo').value;state.product=c.querySelector('#pfProduct').value;window.rentabilidadView(c)};
  c.querySelector('#pfTo').onchange=e=>{state.preset='custom';state.to=e.target.value;state.from=c.querySelector('#pfFrom').value;state.product=c.querySelector('#pfProduct').value;window.rentabilidadView(c)};
  c.querySelector('#pfProduct').onchange=e=>{state.product=e.target.value;window.rentabilidadView(c)};
 };
})();