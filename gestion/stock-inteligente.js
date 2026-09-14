/* AIHXO · Stock inteligente */
(function(){
 const N=v=>Number(v||0);
 const target=i=>Math.max(N(i.min_stock)+2,N(i.min_stock)*2,3);
 const need=i=>Math.max(0,target(i)-N(i.quantity));
 window.stockInteligenteView=async function(c){
   const [{data:items,error},{data:activeOrders}]=await Promise.all([
     supabaseClient.from('base_stock_items').select('*').order('supplier').order('supplier_model').order('size'),
     supabaseClient.from('orders').select('id,order_number,customer_name,base_stock_item_id,base_stock_quantity,quantity,status').not('status','in','("Entregado","Cancelado")')
   ]);
   if(error){console.error(error);c.innerHTML='<div class="page"><div class="card">Error cargando stock.</div></div>';return}
   const all=items||[], ordersNow=activeOrders||[];
   const reserved={};ordersNow.forEach(o=>{if(o.base_stock_item_id)reserved[o.base_stock_item_id]=(reserved[o.base_stock_item_id]||0)+N(o.base_stock_quantity||o.quantity||1)});
   const rows=all.map(i=>({...i,reserved:N(reserved[i.id]),available:N(i.quantity)-N(reserved[i.id])}));
   const critical=rows.filter(i=>i.available<=0), low=rows.filter(i=>i.available>0&&i.available<=N(i.min_stock)), buy=rows.filter(i=>i.available<=N(i.min_stock));
   const unitsToBuy=buy.reduce((a,i)=>a+Math.max(0,target(i)-i.available),0);
   const buyValue=buy.reduce((a,i)=>a+Math.max(0,target(i)-i.available)*N(i.unit_cost),0);
   const groups={};buy.forEach(i=>{const k=`${i.supplier||'Sin proveedor'} · ${i.supplier_model||'Sin modelo'}`;(groups[k]??=[]).push(i)});
   c.innerHTML=`<div class="page"><div class="section"><div><h2>🧠 Stock inteligente</h2><div class="muted">Reposición calculada con stock real, mínimos y pedidos activos</div></div><button class="secondary" onclick="renderStockCamisetas()">Ver inventario</button></div>
   <div class="grid kpis">${kpi('Críticas',critical.length,'sin unidades libres')}${kpi('Stock bajo',low.length,'por debajo del mínimo')}${kpi('Comprar',unitsToBuy,'unidades sugeridas')}${kpi('Coste reposición',money(buyValue),'estimado')}</div>
   <div class="card"><div class="section"><div><h2>🛒 Lista de compra sugerida</h2><div class="muted">Objetivo automático: mínimo + colchón de seguridad</div></div></div>${buy.length?Object.entries(groups).map(([g,list])=>`<div style="margin-top:14px"><h3>${esc(g)}</h3><div class="table-wrap"><table><thead><tr><th>Talla</th><th>Color</th><th>Stock</th><th>Reservado</th><th>Libre</th><th>Comprar</th><th>Coste</th></tr></thead><tbody>${list.map(i=>{const q=Math.max(0,target(i)-i.available);return `<tr><td><b>${esc(i.size||'')}</b></td><td>${esc(i.color||'')}</td><td>${N(i.quantity)}</td><td>${i.reserved}</td><td><b class="${i.available<=0?'red':''}">${i.available}</b></td><td><b>${q}</b></td><td>${money(q*N(i.unit_cost))}</td></tr>`}).join('')}</tbody></table></div></div>`).join(''):'<div class="empty">No hace falta reponer stock.</div>'}</div>
   <div class="card"><div class="section"><div><h2>🚧 Pedidos bloqueados por prenda</h2><div class="muted">Pedidos activos cuya variante no deja stock suficiente</div></div><button class="secondary" onclick="setView('production')">Producción</button></div>${ordersNow.filter(o=>{const i=rows.find(x=>x.id===o.base_stock_item_id);return i&&i.available<0}).map(o=>`<div class="statline"><span><b>${esc(o.order_number||'Pedido')}</b><br><span class="muted">${esc(o.customer_name||'')}</span></span><b class="red">FALTA PRENDA</b></div>`).join('')||'<div class="empty">Ningún pedido bloqueado por falta de prenda.</div>'}</div></div>`;
 };
 const old=window.setView;
 window.setView=function(v){if(v==='smart-stock'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#title').textContent='Stock inteligente';stockInteligenteView($('#view'));closeMobileMenu();return}return old(v)};
 function nav(){const b=document.querySelector('#nav button[data-view="stock"]');if(!b||document.querySelector('#nav button[data-view="smart-stock"]'))return;const n=document.createElement('button');n.dataset.view='smart-stock';n.innerHTML='🧠 <span>Stock inteligente</span>';n.onclick=()=>setView('smart-stock');b.insertAdjacentElement('afterend',n)}setTimeout(nav,0);
})();