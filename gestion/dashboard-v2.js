/* AIHXO · Dashboard operativo v2 */
(function(){
 const norm=v=>String(v||'').trim().toLowerCase();
 const isCancelled=o=>norm(o.status)==='cancelado';
 const isDelivered=o=>norm(o.status)==='entregado';
 const oldSetView=window.setView;
 window.setView=function(v){
   if(v==='production'){
     document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
     const t=$('#title'); if(t)t.textContent='Producción';
     if(typeof window.produccionView==='function') window.produccionView($('#view')); else toast('Producción no disponible');
     closeMobileMenu(); return;
   }
   return oldSetView(v);
 };
 function addProductionNav(){
   const ordersBtn=document.querySelector('#nav button[data-view="orders"]');
   if(!ordersBtn||document.querySelector('#nav button[data-view="production"]'))return;
   const b=document.createElement('button');b.dataset.view='production';b.innerHTML='🏭 <span>Producción</span>';b.onclick=()=>window.setView('production');ordersBtn.insertAdjacentElement('afterend',b);
 }
 setTimeout(addProductionNav,0);
 window.dashboard=async function(c){
   addProductionNav();
   const current=orders.filter(o=>!isCancelled(o));
   const active=current.filter(o=>!isDelivered(o));
   const pending=active.filter(o=>norm(o.status)==='pendiente');
   const production=active.filter(o=>norm(o.status).includes('producción')||norm(o.status).includes('produccion'));
   const delivered=current.filter(isDelivered);
   const sales=current.reduce((a,o)=>a+(+o.total||0),0);
   const productCosts=current.reduce((a,o)=>a+(+o.product_cost||0),0);
   const margin=sales-productCosts;
   const [{data:stock,error:stockErr},{data:unlinked,error:prodErr}]=await Promise.all([
     supabaseClient.from('base_stock_items').select('id,garment_id,supplier,supplier_model,size,color,quantity,min_stock,unit_cost'),
     supabaseClient.from('products').select('id,model,sku,legacy_variant,garment_id').eq('legacy_variant',false).is('garment_id',null)
   ]);
   if(stockErr||prodErr) console.error(stockErr||prodErr);
   const bs=stock||[];
   const low=bs.filter(x=>(+x.quantity||0)<=Number(x.min_stock??3)).sort((a,b)=>(+a.quantity||0)-(+b.quantity||0));
   const out=low.filter(x=>(+x.quantity||0)<=0);
   const units=bs.reduce((a,x)=>a+(+x.quantity||0),0);
   const stockValue=bs.reduce((a,x)=>a+(+x.quantity||0)*(+x.unit_cost||0),0);
   const needs=(unlinked||[]).length;
   const alertGroups=[pending.length>0,production.length>0,low.length>0,needs>0].filter(Boolean).length;
   const attentionItems=pending.length+production.length+low.length+needs;
   const card=(label,value,sub,onclick='')=>`<div class="card" ${onclick?`onclick="${onclick}" style="cursor:pointer"`:''}><div class="label">${label}</div><div class="kvalue">${value}</div><div class="sub">${sub||''}</div></div>`;
   const alert=(icon,title,text,action,view)=>`<div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid #edf0f4"><div style="font-size:23px">${icon}</div><div style="flex:1;min-width:0"><b>${title}</b><div class="muted" style="font-size:13px;margin-top:2px">${text}</div></div><button class="secondary small" onclick="setView('${view}')">${action}</button></div>`;
   c.innerHTML=`<div class="page"><div class="section"><div><h2>Hoy en AIHXO</h2><div class="muted">Centro de mando · lo que requiere atención y el estado real del negocio</div></div><button class="primary" onclick="orderForm()">＋ Nuevo pedido</button></div>
   <div class="grid kpis">${card('Pedidos activos',active.length,`${pending.length} pendientes · ${production.length} en producción`,`setView('orders')`)}${card('Ventas registradas',money(sales),`${delivered.length} entregados`)}${card('Margen estimado',money(margin),sales?`${((margin/sales)*100).toFixed(1)}% antes de gastos`:'Sin ventas')}${card('Stock físico',units,`${money(stockValue)} de coste`,`setView('stock')`)}${card('Stock bajo',low.length,`${out.length} agotadas`,`setView('stock')`)}${card('Alertas',alertGroups,`${attentionItems} elementos a revisar`)}</div>
   <div class="grid two"><div class="card"><div class="section"><div><h2>⚡ Requiere atención</h2><div class="muted">Prioridades operativas</div></div></div>${pending.length?alert('🟠',`${pending.length} pedido${pending.length===1?'':'s'} pendiente${pending.length===1?'':'s'}`,'Revisar y preparar el siguiente paso','Pedidos','orders'):''}${production.length?alert('🟣',`${production.length} pedido${production.length===1?'':'s'} en producción`,'Comprobar qué se puede terminar','Producción','production'):''}${low.length?alert('📦',`${low.length} variante${low.length===1?'':'s'} con stock bajo`,`${out.length} están agotadas`,'Stock','stock'):''}${needs?alert('👕',`${needs} producto${needs===1?'':'s'} sin prenda principal`,'Completar la vinculación del catálogo','Productos','products'):''}${!alertGroups?'<div class="empty">Todo al día. No hay alertas operativas.</div>':''}</div>
   <div class="card"><div class="section"><div><h2>📋 Trabajo en curso</h2><div class="muted">Pedidos que todavía no están entregados</div></div><button class="secondary" onclick="setView('production')">Producción</button></div>${active.length?active.slice(0,8).map(o=>`<div class="statline"><span><b>${esc(o.order_number||'Pedido')}</b><br><span class="muted">${esc(o.customer_name||'Sin cliente')} · ${esc(o.product_name||o.design||'')}</span></span><span style="text-align:right"><b>${money(o.total)}</b><br><span class="muted">${esc(o.status||'')}</span></span></div>`).join(''):'<div class="empty">No hay trabajo pendiente.</div>'}</div></div>
   <div class="card"><div class="section"><div><h2>📦 Stock que necesita reposición</h2><div class="muted">Primero agotados y después las cantidades más bajas</div></div><button class="secondary" onclick="setView('stock')">Gestionar stock</button></div>${low.length?`<div class="table-wrap"><table><thead><tr><th>Prenda</th><th>Talla</th><th>Color</th><th>Actual</th><th>Mínimo</th></tr></thead><tbody>${low.slice(0,10).map(x=>`<tr><td>${esc(x.supplier_model||x.supplier||'Prenda')}</td><td>${esc(x.size||'')}</td><td>${esc(x.color||'')}</td><td><b class="${(+x.quantity||0)<=0?'red':''}">${(+x.quantity||0)<=0?'AGOTADO':(+x.quantity||0)}</b></td><td>${Number(x.min_stock??3)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Stock correcto.</div>'}</div></div>`;
 };
})();