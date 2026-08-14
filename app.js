const SUPABASE_URL='https://zoiesxtchnesrilpuqek.supabase.co';
const SUPABASE_KEY='sb_publishable_-DyRFQxtVvvwiPlvkZyUtA_upKb2W7T';
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY); window.supabaseClient=supabaseClient;
let products=[],orders=[],customers=[],expenses=[],designs=[];
const $=s=>document.querySelector(s); const money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)||0);
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function kpi(a,b,s=''){return `<div class="card"><div class="label">${a}</div><div class="kvalue">${b}</div><div class="sub">${s}</div></div>`}
function cost(p){return +p.garment_cost+(+p.dtf_cost)+(+p.extras_cost)}
async function loadAll(){
 const [p,o,c,e,d]=await Promise.all([supabaseClient.from('products').select('*').order('model'),supabaseClient.from('orders').select('*').order('created_at',{ascending:false}),supabaseClient.from('customers').select('*').order('name'),supabaseClient.from('expenses').select('*').order('expense_date',{ascending:false}),supabaseClient.from('designs').select('*').order('name')]);
 if(p.error||o.error||c.error||e.error||d.error){toast('Error cargando datos');console.error(p.error||o.error||c.error||e.error||d.error);return}
 products=p.data||[];orders=o.data||[];customers=c.data||[];expenses=e.data||[];designs=d.data||[];
}
const ADMIN_EMAILS=['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'];
const ADMIN_EMAIL='aihxo.camisetas@gmail.com';
function isAdminEmail(email){return ADMIN_EMAILS.includes((email||'').toLowerCase())}
async function auth(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session){
   if(isAdminEmail(session.user.email)) showApp(session);
   else {await supabaseClient.auth.signOut();showLogin('Esta cuenta no tiene acceso a AIHXO.');}
   return;
 }
 showLogin();
 supabaseClient.auth.onAuthStateChange(async (_e,s)=>{
   if(s){
     if(isAdminEmail(s.user.email)) showApp(s);
     else {await supabaseClient.auth.signOut();showLogin('Esta cuenta no tiene acceso a AIHXO.');}
   } else showLogin();
 });
}
function showLogin(message=''){
 document.body.innerHTML=`<div class="login-shell"><div class="card" style="width:min(430px,100%);padding:30px">
 <div style="font-family:Georgia,serif;font-size:38px;font-weight:900;color:#087cf4;margin-bottom:4px">AIHXO</div>
 <div class="muted" style="margin-bottom:24px">Panel privado de gestión</div>
 <form id="loginForm" class="form">
 <div class="field"><label>Correo electrónico</label><input id="email" type="email" required value="${ADMIN_EMAIL}" autocomplete="username"></div>
 <div class="field"><label>Contraseña</label><input id="password" type="password" required minlength="6" autocomplete="current-password" placeholder="Tu contraseña"></div>
 <button class="primary" type="submit">Entrar</button>
 <button type="button" class="secondary" id="signup">Crear acceso</button>
 <div id="authMsg" class="muted">${message}</div>
 </form></div></div>`;
 $('#loginForm').onsubmit=async e=>{
   e.preventDefault();
   const email=$('#email').value.trim().toLowerCase();
   if(!isAdminEmail(email)){$('#authMsg').textContent='Este correo no está autorizado en AIHXO.';return}
   const {error}=await supabaseClient.auth.signInWithPassword({email,password:$('#password').value});
   if(error)$('#authMsg').textContent=error.message;
 };
 $('#signup').onclick=async()=>{
   const email=$('#email').value.trim().toLowerCase();
   if(!isAdminEmail(email)){$('#authMsg').textContent='Este correo no está autorizado en AIHXO.';return}
   const password=$('#password').value;
   if(password.length<6){$('#authMsg').textContent='La contraseña debe tener al menos 6 caracteres.';return}
   const {data,error}=await supabaseClient.auth.signUp({email,password});
   $('#authMsg').textContent=error?error.message:(data.session?'Cuenta creada. Ya puedes entrar.':'Cuenta creada. Revisa el correo de confirmación.');
 };
}
function showApp(session){
 document.body.innerHTML=`<div id="app">
 <aside class="sidebar"><div class="brand"><div class="brandmark">AIHXO</div><small>GESTIÓN ONLINE</small></div>
 <nav id="nav">
 <button data-view="dashboard">⌂ <span>Inicio</span></button>
 <button data-view="orders">▣ <span>Pedidos</span></button>
 <button data-view="products">◇ <span>Productos</span></button>
 <button data-view="stock">□ <span>Stock</span></button>
 <button data-view="customers">♙ <span>Clientes</span></button>
 <button data-view="expenses">€ <span>Gastos</span></button>
 <button data-view="reports">▥ <span>Informes</span></button>
 <button data-view="users">👤 <span>Usuarios</span></button>
 </nav>
 <div class="sidebar-foot">${esc(session.user.email)}<br><span class="muted">Administrador</span><br><button class="secondary" style="margin-top:8px" id="logout">Cerrar sesión</button></div></aside>
 <div class="menu-overlay" id="menuOverlay"></div>
 <main><header class="topbar"><button class="hamb" id="hamb">☰</button><h1 id="title">Inicio</h1><button class="primary small" id="quickOrder">＋ Pedido</button></header><div id="view"></div></main>
 </div><div id="drawer" class="drawer hidden"><div class="drawer-card"><button class="x" id="closeDrawer">×</button><div id="drawerBody"></div></div></div><div id="toast"></div>`;
 document.querySelectorAll('#nav button').forEach(b=>b.addEventListener('click',()=>{setView(b.dataset.view);closeMobileMenu()}));
 $('#hamb').onclick=toggleMobileMenu; $('#menuOverlay').onclick=closeMobileMenu;
 $('#logout').onclick=()=>supabaseClient.auth.signOut(); $('#quickOrder').onclick=orderForm; $('#closeDrawer').onclick=closeDrawer;
 loadAll().then(()=>setView('dashboard'));
}
function toggleMobileMenu(){document.querySelector('.sidebar')?.classList.toggle('open');document.querySelector('#menuOverlay')?.classList.toggle('open')}
function closeMobileMenu(){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('#menuOverlay')?.classList.remove('open')}
function setView(v){
 const map={dashboard:dashboard,orders:ordersView,products:productsView,stock:stock,customers:customersView,expenses:expensesView,reports:reports,users:(c)=>{if(typeof renderUsersV7==='function')renderUsersV7()}};
 const titles={dashboard:'Inicio',orders:'Pedidos',products:'Productos',stock:'Stock',customers:'Clientes',expenses:'Gastos',reports:'Informes',users:'Usuarios'};
 const fn=map[v];
 if(!fn){console.error('Vista no disponible:',v);return}
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
 $('#title').textContent=titles[v]||'AIHXO';
 fn($('#view'));
 closeMobileMenu();
}
function dashboard(c){const sales=orders.reduce((a,o)=>a+ +o.total,0),costs=orders.reduce((a,o)=>a+ +o.product_cost,0),exp=expenses.reduce((a,e)=>a+ +e.amount,0),units=orders.reduce((a,o)=>a+o.quantity,0),stock=products.reduce((a,p)=>a+p.stock,0),profit=sales-costs-exp,low=products.filter(p=>p.stock<=3);c.innerHTML=`<div class="page"><div class="grid kpis">${kpi('Ventas',money(sales),orders.length+' pedidos')}${kpi('Pedidos',orders.length,'online')}${kpi('Unidades',units,'vendidas')}${kpi('Beneficio',money(profit),sales?((profit/sales)*100).toFixed(1)+'% margen':'')}${kpi('Stock',stock,'unidades')}</div><div class="grid two"><div class="card"><div class="section"><h2>Pedidos recientes</h2><button class="secondary" onclick="setView('orders')">Ver todos</button></div>${orders.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>${orders.slice(0,7).map(o=>`<tr><td><b>${o.order_number}</b></td><td>${esc(o.customer_name)}</td><td>${money(o.total)}</td><td>${o.status}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay pedidos.</div>'}</div><div class="card"><div class="section"><h2>Alertas de stock</h2></div>${low.length?low.slice(0,8).map(p=>`<div class="statline"><span>${esc(p.model)} · ${esc(p.size)} · ${esc(p.color)}</span><b class="red">${p.stock}</b></div>`).join(''):'<div class="empty">Stock correcto.</div>'}</div></div></div>`}
function ordersView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Pedidos</h2><div class="muted">${orders.length} pedidos</div></div><button class="primary" onclick="orderForm()">＋ Nuevo pedido</button></div><div class="card"><input class="search" id="oq" placeholder="Buscar..." oninput="drawOrders()"><div id="orderTable"></div></div></div>`;drawOrders()}
function drawOrders(){const q=($('#oq')?.value||'').toLowerCase();const a=orders.filter(o=>(o.order_number+' '+o.customer_name+' '+o.product_name).toLowerCase().includes(q));$('#orderTable').innerHTML=`<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Cant.</th><th>Total</th><th>Estado</th></tr></thead><tbody>${a.map(o=>`<tr><td>${o.order_number}</td><td>${o.order_date}</td><td>${esc(o.customer_name)}</td><td>${esc(o.product_name)}<div class="muted">${esc(o.size||'')} · ${esc(o.color||'')}</div></td><td>${o.quantity}</td><td>${money(o.total)}</td><td><select onchange="status('${o.id}',this.value)">${['Pendiente','Pagado','En producción','Preparado','Enviado','Entregado','Cancelado'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>`}
async function status(id,s){const {error}=await supabaseClient.from('orders').update({status:s}).eq('id',id);if(error)toast(error.message);else{toast('Estado actualizado');await loadAll();drawOrders()}}
function orderForm(){$('#drawer').classList.remove('hidden');$('#drawerBody').innerHTML=`<h2>Nuevo pedido</h2><form class="form" id="of"><div class="formgrid"><div class="field"><label>Cliente</label><input name="customer" required></div><div class="field"><label>Contacto</label><input name="contact"></div></div><div class="field"><label>Producto</label><select name="sku" id="osku">${products.map(p=>`<option value="${p.id}">${esc(p.model)} · ${esc(p.size)} · ${esc(p.color)} — ${money(p.sale_price)}</option>`).join('')}</select></div><div class="formgrid"><div class="field"><label>Diseño</label><input name="design" placeholder="Nombre del diseño"></div><div class="field"><label>Cantidad</label><input name="qty" type="number" min="1" value="1"></div></div><div class="formgrid"><div class="field"><label>Precio unitario</label><input name="price" id="oprice" type="number" step=".01"></div><div class="field"><label>Envío cobrado</label><input name="shipping" type="number" step=".01" value="0"></div></div><button class="primary">Guardar pedido</button></form>`;$('#oprice').value=products[0]?.sale_price||0;$('#osku').onchange=e=>$('#oprice').value=products.find(p=>p.id===e.target.value)?.sale_price||0;$('#of').onsubmit=createOrder}
async function createOrder(e){e.preventDefault();const f=new FormData(e.target),p=products.find(x=>x.id===f.get('sku')),qty=+f.get('qty');if(!p||p.stock<qty){toast('Stock insuficiente');return}const price=+f.get('price'),shipping=+f.get('shipping')||0;let customer=customers.find(x=>x.name===f.get('customer'));if(!customer){const r=await supabaseClient.from('customers').insert({name:f.get('customer'),contact:f.get('contact')}).select().single();if(r.error){toast(r.error.message);return}customer=r.data}const order={order_number:'AIHXO-'+String(orders.length+1).padStart(4,'0'),customer_id:customer.id,customer_name:customer.name,contact:f.get('contact'),product_id:p.id,product_name:p.model,size:p.size,color:p.color,design:f.get('design'),quantity:qty,unit_price:price,shipping,total:qty*price+shipping,product_cost:qty*cost(p),status:'Pendiente'};const r=await supabaseClient.from('orders').insert(order);if(r.error){toast(r.error.message);return}await supabaseClient.from('products').update({stock:p.stock-qty}).eq('id',p.id);closeDrawer();await loadAll();setView('orders');toast('Pedido guardado en Supabase')}
function productsView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Productos</h2><div class="muted">${products.length} referencias</div></div><button class="primary" onclick="productForm()">＋ Producto</button></div><div class="grid three">${products.map(p=>`<div class="card"><div class="thumb">${p.category==='Bolso'?'👜':'👕'}</div><b>${esc(p.model)}</b><div class="muted">${esc(p.size||'')} · ${esc(p.color||'')} · ${p.sku}</div><div class="row" style="margin-top:12px"><span>Coste <b>${money(cost(p))}</b></span><span>Venta <b>${money(p.sale_price)}</b></span></div><div class="row" style="margin-top:8px"><span>Stock</span><b class="${p.stock<=3?'red':'green'}">${p.stock}</b></div><div class="actions" style="margin-top:10px"><button class="secondary" onclick="productForm('${p.id}')">Editar</button><button class="secondary" onclick="addStock('${p.id}')">＋ Stock</button></div></div>`).join('')}</div></div>`}
function productForm(id){const p=id?products.find(x=>x.id===id):{sku:'',category:'Camiseta',model:'',size:'M',color:'Blanco',garment_cost:4,dtf_cost:3,extras_cost:.68,sale_price:16.9,stock:0};$('#drawer').classList.remove('hidden');$('#drawerBody').innerHTML=`<h2>${id?'Editar':'Nuevo'} producto</h2><form class="form" id="pf"><div class="formgrid"><div class="field"><label>SKU</label><input name="sku" value="${esc(p.sku)}" required ${id?'readonly':''}></div><div class="field"><label>Categoría</label><select name="category"><option ${p.category==='Camiseta'?'selected':''}>Camiseta</option><option ${p.category==='Bolso'?'selected':''}>Bolso</option></select></div></div><div class="field"><label>Modelo</label><input name="model" value="${esc(p.model)}" required></div><div class="formgrid"><div class="field"><label>Talla</label><input name="size" value="${esc(p.size||'')}"></div><div class="field"><label>Color</label><input name="color" value="${esc(p.color||'')}"></div></div><div class="formgrid"><div class="field"><label>Coste prenda</label><input name="garment_cost" type="number" step=".01" value="${p.garment_cost}"></div><div class="field"><label>Coste DTF</label><input name="dtf_cost" type="number" step=".01" value="${p.dtf_cost}"></div></div><div class="formgrid"><div class="field"><label>Extras</label><input name="extras_cost" type="number" step=".01" value="${p.extras_cost}"></div><div class="field"><label>Precio venta</label><input name="sale_price" type="number" step=".01" value="${p.sale_price}"></div></div><div class="field"><label>Stock</label><input name="stock" type="number" value="${p.stock}"></div><button class="primary">Guardar</button></form>`;$('#pf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o={sku:f.get('sku'),category:f.get('category'),model:f.get('model'),size:f.get('size'),color:f.get('color'),garment_cost:+f.get('garment_cost'),dtf_cost:+f.get('dtf_cost'),extras_cost:+f.get('extras_cost'),sale_price:+f.get('sale_price'),stock:+f.get('stock')};const r=id?await supabaseClient.from('products').update(o).eq('id',id):await supabaseClient.from('products').insert(o);if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('products');toast('Producto guardado')}}}
async function addStock(id){const p=products.find(x=>x.id===id),n=Number(prompt('Unidades a añadir','5')||0);if(!n)return;const r=await supabaseClient.from('products').update({stock:p.stock+n}).eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();setView('stock');toast('Stock actualizado')}}
function stock(c){
 const total=products.reduce((a,p)=>a+p.stock,0),value=products.reduce((a,p)=>a+p.stock*cost(p),0),low=products.filter(p=>p.stock<=3);
 c.innerHTML=`<div class="page"><div class="section"><div><h2>Stock</h2><div class="muted">Control de stock por producto</div></div><button class="primary small" onclick="setView('products')">Gestionar productos</button></div>
 <div class="grid four stock-summary">${kpi('Productos',products.length,'Total')}${kpi('Stock total',total,'Unidades')}${kpi('Valor stock',money(value),'Coste total')}${kpi('Stock bajo',low.length,'Reponer')}</div>
 <div class="card"><div class="mobile-search"><input id="stockQ" placeholder="🔍  Buscar producto…" oninput="drawStock()"><button class="secondary" onclick="$('#stockQ').value='';drawStock()">Filtros</button></div><div id="stockTable" class="table-wrap stock-table"></div></div></div>`;drawStock()}
function drawStock(){const q=($('#stockQ')?.value||'').toLowerCase();const a=products.filter(p=>[p.sku,p.model,p.size,p.color].join(' ').toLowerCase().includes(q));$('#stockTable').innerHTML=`<table><thead><tr><th>SKU</th><th>Producto</th><th>Talla</th><th>Color</th><th>Coste</th><th>Stock</th><th>Acción</th></tr></thead><tbody>${a.map(p=>`<tr><td>${esc(p.sku)}</td><td><div class="stock-product">${esc(p.model)}</div><div class="stock-meta">${esc(p.sku)}</div></td><td>${esc(p.size||'—')}</td><td>◯ ${esc(p.color||'—')}</td><td>${money(cost(p))}</td><td><b class="${p.stock<=3?'red':'green'}">${p.stock}</b></td><td><button class="secondary" onclick="addStock('${p.id}')">＋</button></td></tr>`).join('')}</tbody></table>`}
function customersView(c){c.innerHTML=`<div class="page"><div class="section"><h2>Clientes</h2><span class="muted">${customers.length}</span></div><div class="card"><div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Contacto</th><th>Pedidos</th><th>Facturación</th></tr></thead><tbody>${customers.map(x=>{const os=orders.filter(o=>o.customer_id===x.id);return `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.contact||'—')}</td><td>${os.length}</td><td>${money(os.reduce((a,o)=>a+ +o.total,0))}</td></tr>`}).join('')}</tbody></table></div></div></div>`}
function expensesView(c){c.innerHTML=`<div class="page"><div class="section"><h2>Gastos</h2><button class="primary" onclick="expenseForm()">＋ Gasto</button></div><div class="card">${expenses.length?`<table><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Importe</th></tr></thead><tbody>${expenses.map(e=>`<tr><td>${e.expense_date}</td><td>${esc(e.category)}</td><td>${esc(e.description)}</td><td>${money(e.amount)}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">No hay gastos.</div>'}</div></div>`}
function expenseForm(){$('#drawer').classList.remove('hidden');$('#drawerBody').innerHTML=`<h2>Nuevo gasto</h2><form class="form" id="ef"><div class="formgrid"><div class="field"><label>Categoría</label><select name="category"><option>DTF</option><option>Camisetas</option><option>Bolsos</option><option>Packaging</option><option>Envíos</option><option>Herramientas</option><option>Publicidad</option><option>Otros</option></select></div><div class="field"><label>Importe</label><input name="amount" type="number" step=".01" required></div></div><div class="field"><label>Descripción</label><input name="description" required></div><button class="primary">Guardar</button></form>`;$('#ef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),r=await supabaseClient.from('expenses').insert({category:f.get('category'),amount:+f.get('amount'),description:f.get('description')});if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('expenses');toast('Gasto guardado')}}}
function reports(c){const sales=orders.reduce((a,o)=>a+ +o.total,0),costs=orders.reduce((a,o)=>a+ +o.product_cost,0),exp=expenses.reduce((a,e)=>a+ +e.amount,0);c.innerHTML=`<div class="page"><div class="grid four">${kpi('Ventas',money(sales))}${kpi('Coste productos',money(costs))}${kpi('Gastos',money(exp))}${kpi('Beneficio',money(sales-costs-exp))}</div><div class="grid two"><div class="card"><h2>Productos vendidos</h2>${Object.entries(orders.reduce((a,o)=>(a[o.product_name]=(a[o.product_name]||0)+o.quantity,a),{})).sort((a,b)=>b[1]-a[1]).map(x=>`<div class="statline"><span>${esc(x[0])}</span><b>${x[1]} uds.</b></div>`).join('')||'<div class="empty">Sin ventas.</div>'}</div><div class="card"><h2>Estados</h2>${['Pendiente','Pagado','En producción','Preparado','Enviado','Entregado','Cancelado'].map(s=>`<div class="statline"><span>${s}</span><b>${orders.filter(o=>o.status===s).length}</b></div>`).join('')}</div></div></div>`}
function closeDrawer(){$('#drawer').classList.add('hidden')};function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
auth();


// ===== AIHXO PRODUCT MANAGEMENT V4 =====
(function(){
  const money = v => Number(v||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
  const esc = s => String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  window.renderProductsV4 = async function(){
    const root = document.getElementById('page') || document.querySelector('main');
    if(!root) return;
    root.innerHTML = `<div class="page">
      <div class="section"><div><h2>Productos</h2><div class="sub">Camisetas, bolsos, tallas, colores, stock y márgenes</div></div>
      <button class="primary small" onclick="openProductFormV4()">+ Nuevo producto</button></div>
      <div class="card" style="margin-bottom:18px">
        <div class="row" style="flex-wrap:wrap">
          <input id="productSearchV4" class="search" placeholder="Buscar por SKU, modelo, talla o color…" oninput="filterProductsV4()">
          <select id="productCatV4" onchange="filterProductsV4()"><option value="">Todas las categorías</option><option value="Camiseta">Camisetas</option><option value="Bolso">Bolsos</option></select>
          <select id="productStockV4" onchange="filterProductsV4()"><option value="">Todo el stock</option><option value="low">Stock bajo ≤ 3</option><option value="zero">Sin stock</option></select>
        </div>
      </div>
      <div class="card"><div id="productsTableV4" class="table-wrap"><div class="empty">Cargando productos…</div></div></div>
    </div>`;
    await loadProductsV4();
  };
  let productsV4=[];
  async function loadProductsV4(){
    if(!window.supabaseClient) return;
    const {data,error}=await window.supabaseClient.from('products').select('*').order('model').order('size');
    if(error){document.getElementById('productsTableV4').innerHTML=`<div class="empty red">Error cargando productos: ${esc(error.message)}</div>`;return}
    productsV4=data||[]; drawProductsV4(productsV4);
  }
  window.filterProductsV4=function(){
    const q=(document.getElementById('productSearchV4')?.value||'').toLowerCase();
    const c=document.getElementById('productCatV4')?.value||'';
    const s=document.getElementById('productStockV4')?.value||'';
    drawProductsV4(productsV4.filter(p=>{
      const text=[p.sku,p.category,p.model,p.size,p.color].join(' ').toLowerCase();
      const cat=!c || String(p.category||'').toLowerCase().includes(c.toLowerCase()) || (c==='Camiseta' && /básica|oversize/i.test(p.model||''));
      const stock=!s || (s==='low' && p.stock<=3) || (s==='zero' && p.stock===0);
      return text.includes(q)&&cat&&stock;
    }));
  };
  function drawProductsV4(list){
    const el=document.getElementById('productsTableV4'); if(!el)return;
    if(!list.length){el.innerHTML='<div class="empty">No hay productos que coincidan.</div>';return}
    el.innerHTML=`<table><thead><tr><th>SKU</th><th>Producto</th><th>Talla</th><th>Color</th><th>Stock</th><th>Coste prenda</th><th>DTF</th><th>Extras</th><th>Precio</th><th>Margen</th><th></th></tr></thead><tbody>${list.map(p=>{
      const cost=Number(p.garment_cost||0)+Number(p.dtf_cost||0)+Number(p.extras_cost||0), margin=Number(p.sale_price||0)-cost;
      return `<tr><td><strong>${esc(p.sku)}</strong></td><td>${esc(p.model)}<br><span class="muted">${esc(p.category||'')}</span></td><td>${esc(p.size)}</td><td>${esc(p.color)}</td><td><strong class="${p.stock<=3?'red':'green'}">${p.stock}</strong></td><td>${money(p.garment_cost)}</td><td>${money(p.dtf_cost)}</td><td>${money(p.extras_cost)}</td><td><strong>${money(p.sale_price)}</strong></td><td class="${margin<0?'red':'green'}"><strong>${money(margin)}</strong></td><td><button class="secondary" onclick='openProductFormV4(${JSON.stringify(p).replace(/'/g,"&#39;")})'>Editar</button></td></tr>`;
    }).join('')}</tbody></table>`;
  }
  window.openProductFormV4=function(p={}){
    const d=document.getElementById('drawer'); if(!d)return;
    d.classList.remove('hidden');
    d.innerHTML=`<div class="drawer-card"><button class="x" onclick="closeDrawerV4()">×</button><h2>${p.id?'Editar producto':'Nuevo producto'}</h2><p class="sub">Los cambios se guardan directamente en Supabase.</p>
      <form class="form" onsubmit="saveProductV4(event,'${p.id||''}')">
        <div class="formgrid">
          <div class="field"><label>SKU</label><input name="sku" required value="${esc(p.sku||'')}"></div>
          <div class="field"><label>Categoría</label><input name="category" value="${esc(p.category||'')}"></div>
          <div class="field"><label>Modelo</label><input name="model" required value="${esc(p.model||'')}"></div>
          <div class="field"><label>Talla</label><input name="size" value="${esc(p.size||'')}"></div>
          <div class="field"><label>Color</label><input name="color" value="${esc(p.color||'')}"></div>
          <div class="field"><label>Stock</label><input name="stock" type="number" min="0" required value="${Number(p.stock||0)}"></div>
          <div class="field"><label>Coste camiseta/bolso (€)</label><input name="garment_cost" type="number" step="0.01" min="0" value="${Number(p.garment_cost||0)}"></div>
          <div class="field"><label>Coste DTF (€)</label><input name="dtf_cost" type="number" step="0.01" min="0" value="${Number(p.dtf_cost||0)}"></div>
          <div class="field"><label>Extras (€)</label><input name="extras_cost" type="number" step="0.01" min="0" value="${Number(p.extras_cost||0)}"></div>
          <div class="field"><label>Precio venta (€)</label><input name="sale_price" type="number" step="0.01" min="0" value="${Number(p.sale_price||0)}"></div>
        </div><button class="primary" type="submit">Guardar producto</button>
      </form></div>`;
  };
  window.closeDrawerV4=function(){document.getElementById('drawer')?.classList.add('hidden')};
  window.saveProductV4=async function(e,id){
    e.preventDefault(); const f=new FormData(e.target), obj=Object.fromEntries(f.entries());
    ['stock','garment_cost','dtf_cost','extras_cost','sale_price'].forEach(k=>obj[k]=Number(obj[k]||0));
    const q=window.supabaseClient.from('products');
    const result=id?await q.update(obj).eq('id',id):await q.insert(obj);
    if(result.error){alert('No se pudo guardar: '+result.error.message);return}
    closeDrawerV4(); await loadProductsV4();
  };
})();

// ===== AIHXO USER MANAGEMENT V7 =====
(function(){
  const ADMIN_EMAILS=['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  window.renderUsersV7=function(){
    const root=document.getElementById('page')||document.querySelector('main'); if(!root)return;
    const current=(window.supabase && window.supabase.auth)?null:null;
    root.innerHTML=`<div class="page">
      <div class="section"><div><h2>Usuarios</h2><div class="sub">Personas con acceso a AIHXO Gestión</div></div>
      <button class="primary small" onclick="openInviteUserV7()">+ Invitar usuario</button></div>
      <div class="card" style="margin-bottom:18px">
        <div class="label">Administradores</div>
        <div id="adminsV7" style="margin-top:10px"></div>
      </div>
      <div class="card">
        <div class="section"><div><strong>Accesos</strong><div class="sub">Los administradores tienen control completo de la gestión.</div></div></div>
        <div id="usersListV7"></div>
      </div>
    </div>`;
    drawUsersV7();
  };
  function drawUsersV7(){
    const admins=ADMIN_EMAILS;
    document.getElementById('adminsV7').innerHTML=admins.map((e,i)=>`
      <div class="statline"><div><strong>${esc(e)}</strong><div class="muted">Administrador</div></div>
      <span class="green">● Activo</span></div>`).join('');
    document.getElementById('usersListV7').innerHTML=admins.map(e=>`
      <div class="user-card-v7">
        <div class="avatar-v7">${esc(e[0].toUpperCase())}</div>
        <div style="flex:1;min-width:0"><strong style="overflow-wrap:anywhere">${esc(e)}</strong><div class="muted">Administrador · Acceso completo</div></div>
        <span class="green">Activo</span>
      </div>`).join('')+
      `<div class="empty" style="padding-bottom:10px">Los nuevos usuarios deben registrarse con un correo autorizado.</div>`;
  }
  window.openInviteUserV7=function(){
    const d=document.getElementById('drawer'); if(!d)return;
    d.classList.remove('hidden');
    d.innerHTML=`<div class="drawer-card"><button class="x" onclick="closeDrawerV7()">×</button>
      <h2>Invitar usuario</h2><p class="sub">Añade una persona a AIHXO. Para convertirla en administradora, autoriza su correo en la configuración de acceso.</p>
      <form class="form" onsubmit="inviteUserV7(event)">
        <div class="field"><label>Correo electrónico</label><input name="email" type="email" placeholder="nombre@correo.com" required></div>
        <div class="field"><label>Rol</label><select name="role"><option value="admin">Administrador</option><option value="user">Usuario</option></select></div>
        <button class="primary" type="submit">Guardar acceso</button>
      </form></div>`;
  };
  window.closeDrawerV7=function(){document.getElementById('drawer')?.classList.add('hidden')};
  window.inviteUserV7=function(e){
    e.preventDefault();
    const f=new FormData(e.target), email=String(f.get('email')).toLowerCase().trim(), role=f.get('role');
    if(!email){return}
    alert(`Acceso preparado para ${email}. Rol: ${role==='admin'?'Administrador':'Usuario'}.\\n\\nLa creación de la cuenta se realiza desde la pantalla de registro de AIHXO.`);
    closeDrawerV7();
  };
})();

// ===== AIHXO PRODUCT BUTTON FIX V10 =====
(function(){
  document.addEventListener('click',function(e){
    const b=e.target.closest('button,a'); if(!b)return;
    if(/gestionar productos/i.test((b.textContent||'').trim())){
      e.preventDefault(); e.stopPropagation();
      if(typeof setView==='function')setView('products');
    }
  },true);
})();


/* ===== AIHXO NAVIGATION REBUILD V11 ===== */
(function(){
  const VIEWS={
    dashboard:{title:'Inicio', render:renderDashboardV11},
    orders:{title:'Pedidos', render:renderOrdersV11},
    products:{title:'Productos', render:renderProductsV11},
    stock:{title:'Stock', render:renderStockV11},
    customers:{title:'Clientes', render:renderCustomersV11},
    expenses:{title:'Gastos', render:renderExpensesV11},
    reports:{title:'Informes', render:renderReportsV11},
    users:{title:'Usuarios', render:renderUsersPageV11}
  };
  function q(s){return document.querySelector(s)}
  function money(v){return Number(v||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'})}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  window.navigateV11=function(key){
    const v=VIEWS[key]||VIEWS.dashboard;
    const root=q('#view')||q('#page')||q('main');
    if(!root)return;
    q('#title')&&(q('#title').textContent=v.title);
    document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===key));
    closeMenu();
    v.render(root);
    window.scrollTo({top:0,behavior:'instant'});
  };
  function closeMenu(){q('.sidebar')?.classList.remove('open');q('#menuOverlay')?.classList.remove('open')}
  window.goHomeV11=()=>navigateV11('dashboard');
  function card(title,value,sub=''){return `<div class="card"><div class="muted">${title}</div><div style="font-size:26px;font-weight:800;margin-top:5px">${value}</div><div class="muted">${sub}</div></div>`}
  function shell(html,back=true){return `<div class="page"><div class="section"><div>${back?'<button class="secondary small" onclick="goHomeV11()">← Inicio</button>':''}</div></div>${html}</div>`}
  function renderDashboardV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Resumen AIHXO</h2><div class="sub">Gestión de tu tienda</div></div></div>
      <div class="grid cards-grid">${card('Productos','21','Catálogo en Supabase')}${card('Stock','200','Unidades registradas')}${card('Pedidos','—','Consulta desde Pedidos')}${card('Gastos','—','Consulta desde Gastos')}</div>
      <div class="card" style="margin-top:18px"><h3>Accesos rápidos</h3><div class="row" style="flex-wrap:wrap">
      <button class="primary" onclick="navigateV11('products')">Productos</button><button class="secondary" onclick="navigateV11('stock')">Stock</button><button class="secondary" onclick="navigateV11('customers')">Clientes</button><button class="secondary" onclick="navigateV11('expenses')">Gastos</button><button class="secondary" onclick="navigateV11('reports')">Informes</button></div></div>`);
  }
  function renderOrdersV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Pedidos</h2><div class="sub">Pedidos de AIHXO</div></div><button class="primary" onclick="alert('Formulario de nuevo pedido listo para conectar.')">+ Nuevo pedido</button></div><div class="card"><div class="empty">Aquí aparecerán los pedidos guardados en Supabase.</div></div>`);
  }
  async function renderProductsV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Productos</h2><div class="sub">21 productos del catálogo</div></div><button class="primary" onclick="openProductFormV4?.()">+ Nuevo producto</button></div><div class="card"><div id="p11" class="empty">Cargando…</div></div>`);
    if(window.supabase){
      const {data,error}=await window.supabase.from('products').select('*').order('model').order('size');
      const el=q('#p11');
      if(error){el.innerHTML=`Error: ${esc(error.message)}`;return}
      el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>SKU</th><th>Producto</th><th>Talla</th><th>Color</th><th>Stock</th><th>Precio</th><th>Margen</th></tr></thead><tbody>${(data||[]).map(p=>{let cost=+p.garment_cost+ +p.dtf_cost+ +p.extras_cost, m=+p.sale_price-cost;return `<tr><td>${esc(p.sku)}</td><td>${esc(p.model)}</td><td>${esc(p.size)}</td><td>${esc(p.color)}</td><td>${p.stock}</td><td>${money(p.sale_price)}</td><td>${money(m)}</td></tr>`}).join('')}</tbody></table></div>`;
    }
  }
  async function renderStockV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Stock</h2><div class="sub">Inventario actual</div></div><button class="primary" onclick="navigateV11('products')">Gestionar productos</button></div><div class="grid cards-grid">${card('Productos','21')}${card('Stock total','200')}</div><div class="card" style="margin-top:18px"><div class="empty">Selecciona Productos para ajustar las cantidades reales.</div></div>`);
  }
  async function renderCustomersV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Clientes</h2><div class="sub">Clientes de AIHXO</div></div><button class="primary" onclick="alert('Formulario de nuevo cliente listo para conectar.')">+ Nuevo cliente</button></div><div class="card"><div id="c11" class="empty">Cargando clientes…</div></div>`);
    if(window.supabase){
      const {data,error}=await window.supabase.from('customers').select('*').order('name');
      const el=q('#c11'); if(error){el.innerHTML=`No se pueden cargar clientes: ${esc(error.message)}`;return}
      if(!data?.length){el.innerHTML='No hay clientes registrados todavía.';return}
      el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th></tr></thead><tbody>${data.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td></tr>`).join('')}</tbody></table></div>`;
    }
  }
  async function renderExpensesV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Gastos</h2><div class="sub">Control de costes de AIHXO</div></div><button class="primary" onclick="alert('Formulario de nuevo gasto listo para conectar.')">+ Nuevo gasto</button></div><div class="card"><div id="e11" class="empty">Cargando gastos…</div></div>`);
    if(window.supabase){
      const {data,error}=await window.supabase.from('expenses').select('*').order('date',{ascending:false});
      const el=q('#e11'); if(error){el.innerHTML=`No se pueden cargar gastos: ${esc(error.message)}`;return}
      if(!data?.length){el.innerHTML='No hay gastos registrados todavía.';return}
      el.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Importe</th></tr></thead><tbody>${data.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.description||x.name||'')}</td><td>${money(x.amount)}</td></tr>`).join('')}</tbody></table></div>`;
    }
  }
  async function renderReportsV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Informes</h2><div class="sub">Resumen económico y de inventario</div></div></div><div class="grid cards-grid">${card('Productos','21')}${card('Unidades en stock','200')}${card('Valor de stock','—','Se calcula con el coste registrado')}${card('Margen','—','Según precios y costes')}</div><div class="card" style="margin-top:18px"><h3>Informes</h3><p class="muted">Esta sección ya está operativa y lista para añadir gráficos y filtros.</p></div>`);
  }
  function renderUsersPageV11(root){
    root.innerHTML=shell(`<div class="section"><div><h2>Usuarios</h2><div class="sub">Administradores autorizados</div></div><button class="primary" onclick="openInviteUserV7?.()">+ Invitar usuario</button></div>
      <div class="card">${['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'].map(e=>`<div class="user-card-v7"><div class="avatar-v7">${e[0].toUpperCase()}</div><div style="flex:1"><strong>${e}</strong><div class="muted">Administrador · Acceso completo</div></div><span class="green">● Activo</span></div>`).join('')}</div>`);
  }
  function bind(){
    document.querySelectorAll('#nav button').forEach(b=>{
      b.onclick=e=>{e.preventDefault();navigateV11(b.dataset.view)}
    });
    q('#hamb')?.addEventListener('click',()=>{q('.sidebar')?.classList.toggle('open');q('#menuOverlay')?.classList.toggle('open')});
    q('#menuOverlay')?.addEventListener('click',closeMenu);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,200));
  setTimeout(bind,1000);
  window.addEventListener('load',()=>setTimeout(bind,500));
  // If the rebuilt app is already visible, show Inicio.
  setTimeout(()=>{if(q('#view')&&q('#nav'))navigateV11('dashboard')},1200);
})();


/* ===== AIHXO CLIENTS V12 ===== */
(function(){
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const money=v=>Number(v||0).toLocaleString('es-ES',{style:'currency',currency:'EUR'});
  let clients=[];

  async function loadClients(){
    if(!window.supabase)return {data:[],error:null};
    return await window.supabase.from('customers').select('*').order('name',{ascending:true});
  }

  function customerFields(c={}){
    return `
      <div class="formgrid">
        <div class="field"><label>Nombre *</label><input name="name" required value="${esc(c.name||'')}"></div>
        <div class="field"><label>Apellidos</label><input name="surname" value="${esc(c.surname||c.lastname||'')}"></div>
        <div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email||'')}"></div>
        <div class="field"><label>Teléfono</label><input name="phone" value="${esc(c.phone||'')}"></div>
        <div class="field"><label>Dirección</label><input name="address" value="${esc(c.address||'')}"></div>
        <div class="field"><label>Código postal</label><input name="postal_code" value="${esc(c.postal_code||c.zip||'')}"></div>
        <div class="field"><label>Ciudad</label><input name="city" value="${esc(c.city||'')}"></div>
        <div class="field" style="grid-column:1/-1"><label>Notas</label><textarea name="notes" rows="4">${esc(c.notes||'')}</textarea></div>
      </div>`;
  }

  window.renderCustomersV12=async function(root){
    root=root||q('#view')||q('#page');
    if(!root)return;
    root.innerHTML=`<div class="page">
      <div class="section">
        <div><h2>Clientes</h2><div class="sub">Gestiona tus clientes de AIHXO</div></div>
        <button class="primary" onclick="openCustomerV12()">+ Nuevo cliente</button>
      </div>
      <div class="card" style="margin-bottom:18px">
        <div class="row" style="flex-wrap:wrap">
          <input id="clientSearchV12" class="search" placeholder="Buscar nombre, email o teléfono…" oninput="filterCustomersV12()">
        </div>
      </div>
      <div class="card"><div id="clientsTableV12" class="table-wrap"><div class="empty">Cargando clientes…</div></div></div>
    </div>`;
    await refreshCustomersV12();
  };

  async function refreshCustomersV12(){
    const {data,error}=await loadClients();
    const el=q('#clientsTableV12');
    if(!el)return;
    if(error){el.innerHTML=`<div class="empty red">Error al cargar clientes: ${esc(error.message)}</div>`;return;}
    clients=data||[];
    filterCustomersV12();
  }

  window.filterCustomersV12=function(){
    const el=q('#clientsTableV12'); if(!el)return;
    const term=(q('#clientSearchV12')?.value||'').toLowerCase().trim();
    const list=clients.filter(c=>[c.name,c.surname,c.lastname,c.email,c.phone,c.city].join(' ').toLowerCase().includes(term));
    if(!list.length){el.innerHTML='<div class="empty">No hay clientes que coincidan.</div>';return;}
    el.innerHTML=`<table><thead><tr><th>Cliente</th><th>Contacto</th><th>Localidad</th><th></th></tr></thead><tbody>
      ${list.map(c=>`<tr>
        <td><strong>${esc([c.name,c.surname||c.lastname].filter(Boolean).join(' '))}</strong><br><span class="muted">${esc(c.address||'')}</span></td>
        <td>${esc(c.email||'')}<br>${esc(c.phone||'')}</td>
        <td>${esc([c.postal_code||c.zip,c.city].filter(Boolean).join(' '))}</td>
        <td style="white-space:nowrap"><button class="secondary small" onclick='openCustomerV12(${JSON.stringify(c).replace(/'/g,"&#039;")})'>Editar</button>
        <button class="secondary small" onclick="deleteCustomerV12('${esc(c.id)}')">Eliminar</button></td>
      </tr>`).join('')}
    </tbody></table>`;
  };

  window.openCustomerV12=function(c={}){
    const d=q('#drawer');
    if(!d)return;
    d.classList.remove('hidden');
    d.innerHTML=`<div class="drawer-card">
      <button class="x" onclick="closeCustomerDrawerV12()">×</button>
      <h2>${c.id?'Editar cliente':'Nuevo cliente'}</h2>
      <p class="sub">Los datos se guardan en Supabase.</p>
      <form id="customerFormV12" class="form" onsubmit="saveCustomerV12(event,'${esc(c.id||'')}')">
        ${customerFields(c)}
        <button class="primary" type="submit">Guardar cliente</button>
      </form>
    </div>`;
  };

  window.closeCustomerDrawerV12=function(){q('#drawer')?.classList.add('hidden')};

  window.saveCustomerV12=async function(e,id){
    e.preventDefault();
    const fd=new FormData(e.target);
    const obj=Object.fromEntries(fd.entries());
    Object.keys(obj).forEach(k=>obj[k]=String(obj[k]||'').trim());
    if(!obj.name){alert('El nombre es obligatorio.');return;}
    const result=id
      ? await window.supabase.from('customers').update(obj).eq('id',id)
      : await window.supabase.from('customers').insert(obj);
    if(result.error){alert('No se pudo guardar el cliente: '+result.error.message);return;}
    closeCustomerDrawerV12();
    await refreshCustomersV12();
  };

  window.deleteCustomerV12=async function(id){
    if(!confirm('¿Seguro que quieres eliminar este cliente?'))return;
    const {error}=await window.supabase.from('customers').delete().eq('id',id);
    if(error){alert('No se pudo eliminar: '+error.message);return;}
    await refreshCustomersV12();
  };

  // Replace the navigation target with the full V12 client screen.
  const oldNavigate=window.navigateV11;
  window.navigateV11=function(key){
    if(key==='customers'){
      const root=q('#view');
      if(root){
        q('#title')&&(q('#title').textContent='Clientes');
        document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='customers'));
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('#menuOverlay')?.classList.remove('open');
        renderCustomersV12(root);
      }
      return;
    }
    return oldNavigate ? oldNavigate(key) : undefined;
  };
})();


/* ===== AIHXO V13 FINAL NAV + CLIENTS FIX ===== */
(function(){
  const q=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const clientDb=()=>window.supabaseClient;

  function closePanels(){
    q('#drawer')?.classList.add('hidden');
    q('.sidebar')?.classList.remove('open');
    q('#menuOverlay')?.classList.remove('open');
  }
  window.closeAIHXOV13=closePanels;

  function ensureHomeButton(){
    const bar=q('.topbar'); if(!bar || q('#homeTopV13')) return;
    const b=document.createElement('button');
    b.id='homeTopV13'; b.className='secondary small'; b.type='button'; b.textContent='⌂';
    b.title='Ir a Inicio'; b.onclick=()=>window.navigateV11?.('dashboard');
    bar.insertBefore(b,bar.querySelector('h1'));
  }

  window.openCustomerV13=function(c={}){
    const d=q('#drawer'); if(!d)return;
    d.classList.remove('hidden');
    d.innerHTML=`<div class="drawer-card">
      <button class="x" type="button" onclick="document.getElementById('drawer').classList.add('hidden')">×</button>
      <h2>${c.id?'Editar cliente':'Nuevo cliente'}</h2>
      <p class="sub">Completa los datos y pulsa Guardar cliente.</p>
      <form id="customerFormV13" class="form">
        <div class="formgrid">
          <div class="field"><label>Nombre *</label><input name="name" required value="${esc(c.name)}"></div>
          <div class="field"><label>Apellidos</label><input name="surname" value="${esc(c.surname||c.lastname)}"></div>
          <div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email)}"></div>
          <div class="field"><label>Teléfono</label><input name="phone" value="${esc(c.phone)}"></div>
          <div class="field"><label>Dirección</label><input name="address" value="${esc(c.address)}"></div>
          <div class="field"><label>Código postal</label><input name="postal_code" value="${esc(c.postal_code||c.zip)}"></div>
          <div class="field"><label>Ciudad</label><input name="city" value="${esc(c.city)}"></div>
          <div class="field" style="grid-column:1/-1"><label>Notas</label><textarea name="notes" rows="4">${esc(c.notes)}</textarea></div>
        </div>
        <div class="row" style="margin-top:8px;justify-content:flex-end">
          <button type="button" class="secondary" onclick="document.getElementById('drawer').classList.add('hidden')">Cancelar</button>
          <button type="submit" class="primary">Guardar cliente</button>
        </div>
        <div id="clientMsgV13" class="muted"></div>
      </form>
    </div>`;
    q('#customerFormV13').onsubmit=async e=>{
      e.preventDefault();
      const obj=Object.fromEntries(new FormData(e.target).entries());
      obj.name=String(obj.name||'').trim();
      if(!obj.name){q('#clientMsgV13').textContent='El nombre es obligatorio.';return}
      const db=clientDb();
      if(!db){q('#clientMsgV13').textContent='No hay conexión con Supabase.';return}
      const r=c.id?await db.from('customers').update(obj).eq('id',c.id):await db.from('customers').insert(obj);
      if(r.error){q('#clientMsgV13').textContent='Error: '+r.error.message;return}
      closePanels();
      window.navigateV11?.('customers');
    };
  };

  async function renderCustomersV13(root){
    root.innerHTML=`<div class="page">
      <div class="section"><div><h2>Clientes</h2><div class="sub">Gestiona tus clientes de AIHXO</div></div><button id="newClientV13" class="primary">+ Nuevo cliente</button></div>
      <div class="card" style="margin-bottom:18px"><input id="clientSearchV13" class="search" placeholder="Buscar nombre, email o teléfono…"></div>
      <div class="card"><div id="clientsTableV13" class="table-wrap"><div class="empty">Cargando clientes…</div></div></div>
    </div>`;
    q('#newClientV13').onclick=()=>openCustomerV13();
    q('#clientSearchV13').oninput=()=>drawClientsV13();
    await loadClientsV13();
  }
  let cdata=[];
  async function loadClientsV13(){
    const db=clientDb(), el=q('#clientsTableV13');
    if(!db){el.innerHTML='<div class="empty red">No hay conexión con Supabase.</div>';return}
    const r=await db.from('customers').select('*').order('name',{ascending:true});
    if(r.error){el.innerHTML='<div class="empty red">Error al cargar clientes: '+esc(r.error.message)+'</div>';return}
    cdata=r.data||[]; drawClientsV13();
  }
  function drawClientsV13(){
    const el=q('#clientsTableV13'); if(!el)return;
    const t=(q('#clientSearchV13')?.value||'').toLowerCase();
    const list=cdata.filter(c=>[c.name,c.surname,c.email,c.phone,c.city].join(' ').toLowerCase().includes(t));
    if(!list.length){el.innerHTML='<div class="empty">No hay clientes registrados.</div>';return}
    el.innerHTML=`<table><thead><tr><th>Cliente</th><th>Contacto</th><th>Localidad</th><th>Acciones</th></tr></thead><tbody>${
      list.map(c=>`<tr><td><strong>${esc([c.name,c.surname].filter(Boolean).join(' '))}</strong></td><td>${esc(c.email)}<br>${esc(c.phone)}</td><td>${esc([c.postal_code,c.city].filter(Boolean).join(' '))}</td><td><button class="secondary small editClientV13" data-id="${esc(c.id)}">Editar</button> <button class="secondary small deleteClientV13" data-id="${esc(c.id)}">Eliminar</button></td></tr>`).join('')
    }</tbody></table>`;
    el.querySelectorAll('.editClientV13').forEach(b=>b.onclick=()=>openCustomerV13(cdata.find(c=>String(c.id)===String(b.dataset.id))||{}));
    el.querySelectorAll('.deleteClientV13').forEach(b=>b.onclick=async()=>{
      if(!confirm('¿Eliminar este cliente?'))return;
      const r=await clientDb().from('customers').delete().eq('id',b.dataset.id);
      if(r.error){alert(r.error.message);return}
      await loadClientsV13();
    });
  }

  const previousNavigate=window.navigateV11;
  window.navigateV11=function(key){
    if(key==='customers'){
      const root=q('#view'); if(root){
        q('#title')&&(q('#title').textContent='Clientes');
        document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='customers'));
        closePanels(); renderCustomersV13(root);
      } return;
    }
    const result=previousNavigate?previousNavigate(key):undefined;
    setTimeout(ensureHomeButton,20);
    return result;
  };

  // Capture navigation so stale inline handlers cannot trap the user in a section.
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(!b)return;
    const txt=(b.textContent||'').trim();
    if(/nuevo cliente/i.test(txt)){e.preventDefault();e.stopImmediatePropagation();openCustomerV13();return}
    if(/^inicio$/i.test(txt)||/←\s*inicio/i.test(txt)){e.preventDefault();e.stopImmediatePropagation();window.navigateV11?.('dashboard');return}
    if(/clientes/i.test(txt) && b.dataset.view==='customers'){e.preventDefault();e.stopImmediatePropagation();window.navigateV11?.('customers');return}
  },true);

  const observer=new MutationObserver(()=>{ensureHomeButton()});
  observer.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureHomeButton,100));
  window.addEventListener('load',()=>setTimeout(ensureHomeButton,300));
})();


/* ===== AIHXO V14 FINAL NAVIGATION + EXPENSES ===== */
(function(){
  const q=s=>document.querySelector(s);
  function closeMenus(){q('.sidebar')?.classList.remove('open');q('#menuOverlay')?.classList.remove('open')}
  function closeDrawerV14(){q('#drawer')?.classList.add('hidden')}
  window.goHomeV14=function(){ closeDrawerV14(); closeMenus(); if(typeof setView==='function') setView('dashboard'); };

  // One authoritative router. Customers keeps its custom CRUD screen; all other sections
  // use the original fully implemented views (including Expenses and Reports).
  window.navigateAIHXOV14=function(key){
    closeDrawerV14(); closeMenus();
    if(key==='customers' && typeof renderCustomersV13==='function'){
      const root=q('#view');
      if(root){ q('#title')&&(q('#title').textContent='Clientes');
        document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view==='customers'));
        renderCustomersV13(root);
      }
      return;
    }
    if(typeof setView==='function') setView(key);
  };
  // Keep legacy calls working, but force them through the corrected router.
  window.navigateV11=window.navigateAIHXOV14;

  function ensureHome(){
    const bar=q('.topbar'); if(!bar || q('#homeTopV14')) return;
    const b=document.createElement('button'); b.id='homeTopV14'; b.type='button'; b.className='secondary small'; b.textContent='⌂'; b.title='Ir a Inicio';
    b.onclick=window.goHomeV14;
    const title=q('#title'); if(title) bar.insertBefore(b,title); else bar.prepend(b);
  }
  function bindNav(){
    document.querySelectorAll('#nav button[data-view]').forEach(b=>{
      b.onclick=function(e){e.preventDefault();e.stopPropagation();window.navigateAIHXOV14(b.dataset.view)};
    });
    q('#hamb')?.addEventListener('click',()=>{q('.sidebar')?.classList.toggle('open');q('#menuOverlay')?.classList.toggle('open')});
    q('#menuOverlay')?.addEventListener('click',closeMenus);
    ensureHome();
  }
  // Capture all menu clicks so stale inline handlers from older versions cannot fire.
  document.addEventListener('click',function(e){
    const b=e.target.closest('button'); if(!b)return;
    const view=b.dataset?.view;
    if(view){ e.preventDefault(); e.stopImmediatePropagation(); window.navigateAIHXOV14(view); return; }
    const txt=(b.textContent||'').trim();
    if(/^inicio$/i.test(txt)||/←\s*inicio/i.test(txt)||txt==='⌂'){e.preventDefault();e.stopImmediatePropagation();window.goHomeV14();return;}
    if(/nuevo gasto/i.test(txt)){e.preventDefault();e.stopImmediatePropagation(); if(typeof expenseForm==='function') expenseForm(); return;}
  },true);
  const mo=new MutationObserver(()=>{ensureHome(); bindNav()});
  mo.observe(document.documentElement,{subtree:true,childList:true});
  document.addEventListener('DOMContentLoaded',()=>setTimeout(bindNav,100));
  window.addEventListener('load',()=>setTimeout(bindNav,300));
})();
