/* AIHXO · Clientes 360 */
(function(){
 const N=v=>Number(v||0), norm=v=>String(v||'').trim().toLowerCase();
 const uniq=a=>[...new Set(a.filter(Boolean))];
 const active=o=>norm(o.status)!=='cancelado';
 window.clientes360View=async function(c){
   const [{data:cs,error},{data:os}]=await Promise.all([
     supabaseClient.from('customers').select('*').order('name'),
     supabaseClient.from('orders').select('*').order('created_at',{ascending:false})
   ]);
   if(error){console.error(error);c.innerHTML='<div class="page"><div class="card">No se pudieron cargar los clientes.</div></div>';return}
   const customers360=(cs||[]).map(x=>{
     const co=(os||[]).filter(o=>o.customer_id===x.id || (!o.customer_id && norm(o.customer_name)===norm([x.name,x.surname].filter(Boolean).join(' '))));
     const valid=co.filter(active), spent=valid.reduce((a,o)=>a+N(o.total),0), paid=valid.reduce((a,o)=>a+N(o.amount_paid),0), pending=Math.max(0,spent-paid);
     return {...x,_orders:co,_valid:valid,_spent:spent,_paid:paid,_pending:pending};
   }).sort((a,b)=>b._spent-a._spent);
   window._aihxoCustomers360=customers360;
   const totalCustomers=customers360.length, repeat=customers360.filter(x=>x._valid.length>1).length, totalSales=customers360.reduce((a,x)=>a+x._spent,0), pendingTotal=customers360.reduce((a,x)=>a+x._pending,0);
   c.innerHTML=`<div class="page"><div class="section"><div><h2>👥 Clientes 360</h2><div class="muted">Historial, compras, tallas, diseños y pagos en un solo sitio</div></div></div><div class="grid kpis">${kpi('Clientes',totalCustomers,'registrados')}${kpi('Recurrentes',repeat,'más de un pedido')}${kpi('Ventas clientes',money(totalSales),'no canceladas')}${kpi('Pendiente cobro',money(pendingTotal),'según pagos registrados')}</div><div class="card"><div class="field"><label>Buscar cliente</label><input id="c360q" placeholder="Nombre, teléfono, email..." oninput="filtrarClientes360()"></div><div id="c360list"></div></div></div>`;
   filtrarClientes360();
 };
 window.filtrarClientes360=function(){
   const q=norm($('#c360q')?.value);
   const list=(window._aihxoCustomers360||[]).filter(x=>norm(`${x.name} ${x.surname} ${x.email} ${x.phone} ${x.contact}`).includes(q));
   const box=$('#c360list'); if(!box) return;
   box.innerHTML=list.length?list.map(x=>`<div class="card" style="margin-top:10px"><div class="section"><div><h3 style="margin:0">${esc([x.name,x.surname].filter(Boolean).join(' ')||'Sin nombre')}</h3><div class="muted">${esc(x.phone||x.contact||x.email||'Sin contacto')}</div></div><div style="text-align:right"><b>${money(x._spent)}</b><div class="muted">${x._valid.length} pedido${x._valid.length===1?'':'s'}</div></div></div><div class="grid two"><div><span class="muted">Pendiente</span><br><b>${money(x._pending)}</b></div><div><span class="muted">Último pedido</span><br><b>${esc(x._orders[0]?.order_date||'—')}</b></div></div><button type="button" class="primary c360-open" data-customer-id="${x.id}" style="width:100%;margin-top:10px">Ver ficha 360</button></div>`).join(''):'<div class="empty">No hay clientes que coincidan.</div>';
   box.querySelectorAll('.c360-open').forEach(btn=>btn.addEventListener('click',()=>window.abrirCliente360(btn.dataset.customerId)));
 };
 window.abrirCliente360=function(id){
   try{
     const x=(window._aihxoCustomers360||[]).find(c=>String(c.id)===String(id));
     if(!x){toast('Cliente no encontrado');return}
     const sizes=uniq(x._valid.map(o=>o.size)),colors=uniq(x._valid.map(o=>o.color)),designs=uniq(x._valid.map(o=>o.product_name||o.design));const last=x._orders[0];
     const body=document.getElementById('drawerBody'); const drawer=document.getElementById('drawer');
     if(!body||!drawer){toast('No se pudo abrir la ficha');return}
     body.innerHTML=`<h2>👤 ${esc([x.name,x.surname].filter(Boolean).join(' ')||'Cliente')}</h2><div class="grid two"><div class="card"><div class="label">COMPRAS</div><div class="kvalue">${money(x._spent)}</div><div class="sub">${x._valid.length} pedidos</div></div><div class="card"><div class="label">PENDIENTE</div><div class="kvalue">${money(x._pending)}</div><div class="sub">cobro registrado</div></div></div><div class="card" style="margin-top:14px"><h3>📇 Datos</h3><div><b>Teléfono:</b> ${esc(x.phone||x.contact||'—')}</div><div><b>Email:</b> ${esc(x.email||'—')}</div><div><b>Dirección:</b> ${esc([x.address,x.postal_code,x.city].filter(Boolean).join(', ')||'—')}</div></div><div class="card" style="margin-top:14px"><h3>👕 Preferencias detectadas</h3><div><b>Tallas:</b> ${esc(sizes.join(', ')||'—')}</div><div><b>Colores:</b> ${esc(colors.join(', ')||'—')}</div><div><b>Diseños/productos:</b> ${esc(designs.join(', ')||'—')}</div></div><div class="card" style="margin-top:14px"><h3>🧾 Historial de pedidos</h3>${x._orders.length?x._orders.map(o=>`<div class="statline"><span><b>${esc(o.order_number||'Pedido')}</b><br><span class="muted">${esc(o.order_date||'')} · ${esc(o.product_name||o.design||'')} · ${esc(o.size||'')} ${esc(o.color||'')}</span></span><span style="text-align:right"><b>${money(o.total)}</b><br><span class="muted">${esc(o.status||'')}</span></span></div>`).join(''):'<div class="empty">Sin pedidos.</div>'}</div><div class="card" style="margin-top:14px"><h3>📝 Notas del cliente</h3><textarea id="c360notes" rows="5" placeholder="Preferencias, detalles de entrega, observaciones...">${esc(x.notes||'')}</textarea><button type="button" class="primary" style="width:100%;margin-top:10px" onclick="guardarNotasCliente360('${x.id}')">Guardar notas</button></div>${last?`<button type="button" class="secondary" style="width:100%;margin-top:10px" onclick="closeDrawer();setView('orders')">Ir a Pedidos</button>`:''}`;
     drawer.classList.remove('hidden');
   }catch(err){console.error('Clientes 360:',err);toast('No se pudo abrir la ficha 360')}
 };
 window.guardarNotasCliente360=async function(id){const notes=$('#c360notes')?.value.trim()||'';const {error}=await supabaseClient.from('customers').update({notes}).eq('id',id);if(error){console.error(error);toast('No se pudieron guardar las notas');return}const x=(window._aihxoCustomers360||[]).find(c=>c.id===id);if(x)x.notes=notes;toast('Notas guardadas')};
 const old=window.setView;window.setView=function(v){if(v==='customers360'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#title').textContent='Clientes 360';clientes360View($('#view'));closeMobileMenu();return}return old(v)};
 function nav(){const customersBtn=document.querySelector('#nav button[data-view="customers"]');if(!customersBtn||document.querySelector('#nav button[data-view="customers360"]'))return;const b=document.createElement('button');b.dataset.view='customers360';b.innerHTML='👥 <span>Clientes 360</span>';b.onclick=()=>setView('customers360');customersBtn.insertAdjacentElement('afterend',b)}setTimeout(nav,0);
})();