/* AIHXO · Stock inteligente */
(function(){
 const N=v=>Number(v||0);
 const target=i=>Math.max(N(i.min_stock)+2,N(i.min_stock)*2,3);
 const statusNorm=v=>String(v||'').trim().toLowerCase();
 window.stockInteligenteView=async function(c){
   const [{data:items,error},{data:activeOrders},{data:cycles}]=await Promise.all([
     supabaseClient.from('base_stock_items').select('*').order('supplier').order('supplier_model').order('size'),
     supabaseClient.from('orders').select('id,order_number,customer_name,base_stock_item_id,base_stock_quantity,quantity,status,production_status'),
     supabaseClient.from('inventory_cycles').select('id,status,started_at').eq('status','active').order('started_at',{ascending:false}).limit(1)
   ]);
   if(error){console.error(error);c.innerHTML='<div class="page"><div class="card">Error cargando stock.</div></div>';return}
   const all=items||[];
   const ordersNow=(activeOrders||[]).filter(o=>!['entregado','cancelado'].includes(statusNorm(o.status)));
   const activeCycle=cycles?.[0]||null;

   /* IMPORTANTE: el stock físico ya se descuenta cuando se crea el pedido.
      Por tanto NO volvemos a restar los pedidos activos aquí. */
   const rows=all.map(i=>({...i,available:N(i.quantity)}));
   const critical=rows.filter(i=>i.available<=0);
   const low=rows.filter(i=>i.available>0&&i.available<=N(i.min_stock));
   const buy=rows.filter(i=>i.available<=N(i.min_stock));
   const unitsToBuy=buy.reduce((a,i)=>a+Math.max(0,target(i)-i.available),0);
   const buyValue=buy.reduce((a,i)=>a+Math.max(0,target(i)-i.available)*N(i.unit_cost),0);
   const groups={};
   buy.forEach(i=>{const k=`${i.supplier||'Sin proveedor'} · ${i.supplier_model||'Sin modelo'}`;(groups[k]??=[]).push(i)});

   const blocked=ordersNow.filter(o=>{
     if(!o.base_stock_item_id)return false;
     const i=rows.find(x=>x.id===o.base_stock_item_id);
     return !i || i.available<=0;
   });

   c.innerHTML=`<div class="page"><div class="section"><div><h2>🧠 Stock inteligente</h2><div class="muted">Reposición calculada con stock físico real y mínimos</div></div><button class="secondary" onclick="renderStockCamisetas()">Ver inventario</button></div>
   ${activeCycle?`<div class="card" style="border:1px solid #f0c36d;background:#fff8e8"><b>🧮 Inventario en curso</b><div class="muted" style="margin-top:4px">Las sugerencias de compra son provisionales hasta terminar el recuento físico.</div></div>`:''}
   <div class="grid kpis">${kpi('Críticas',critical.length,'sin stock físico')}${kpi('Stock bajo',low.length,'por debajo del mínimo')}${kpi('Comprar',unitsToBuy,'unidades sugeridas')}${kpi('Coste reposición',money(buyValue),'estimado')}</div>
   <div class="card"><div class="section"><div><h2>🛒 Lista de compra sugerida</h2><div class="muted">Objetivo automático: mínimo + colchón de seguridad</div></div></div>${buy.length?Object.entries(groups).map(([g,list])=>`<div style="margin-top:14px"><h3>${esc(g)}</h3><div class="table-wrap"><table><thead><tr><th>Talla</th><th>Color</th><th>Stock físico</th><th>Mínimo</th><th>Objetivo</th><th>Comprar</th><th>Coste</th></tr></thead><tbody>${list.map(i=>{const q=Math.max(0,target(i)-i.available);return `<tr><td><b>${esc(i.size||'')}</b></td><td>${esc(i.color||'')}</td><td><b class="${i.available<=0?'red':''}">${i.available}</b></td><td>${N(i.min_stock)}</td><td>${target(i)}</td><td><b>${q}</b></td><td>${money(q*N(i.unit_cost))}</td></tr>`}).join('')}</tbody></table></div></div>`).join(''):'<div class="empty">No hace falta reponer stock.</div>'}</div>
   <div class="card"><div class="section"><div><h2>🚧 Pedidos a revisar por prenda</h2><div class="muted">Pedidos activos vinculados a variantes que ahora mismo están a cero</div></div><button class="secondary" onclick="setView('production')">Producción</button></div>${blocked.map(o=>`<div class="statline"><span><b>${esc(o.order_number||'Pedido')}</b><br><span class="muted">${esc(o.customer_name||'')}</span></span><b class="red">REVISAR PRENDA</b></div>`).join('')||'<div class="empty">Ningún pedido necesita revisión por falta de prenda.</div>'}</div></div>`;
 };
 const old=window.setView;
 window.setView=function(v){if(v==='smart-stock'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#title').textContent='Stock inteligente';stockInteligenteView($('#view'));closeMobileMenu();return}return old(v)};
 function nav(){const b=document.querySelector('#nav button[data-view="stock"]');if(!b||document.querySelector('#nav button[data-view="smart-stock"]'))return;const n=document.createElement('button');n.dataset.view='smart-stock';n.innerHTML='🧠 <span>Stock inteligente</span>';n.onclick=()=>setView('smart-stock');b.insertAdjacentElement('afterend',n)}setTimeout(nav,0);
})();