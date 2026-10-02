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
const ADMIN_EMAIL='aihxo.camisetas@gmail.com';
async function auth(){
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session){
   if((session.user.email||'').toLowerCase()===ADMIN_EMAIL) showApp(session);
   else {await supabaseClient.auth.signOut(); showLogin('Esta cuenta no tiene acceso a AIHXO.');}
   return;
 }
 showLogin();
 supabaseClient.auth.onAuthStateChange(async (_e,s)=>{
   if(s){
     if((s.user.email||'').toLowerCase()===ADMIN_EMAIL) showApp(s);
     else {await supabaseClient.auth.signOut(); showLogin('Esta cuenta no tiene acceso a AIHXO.');}
   } else showLogin();
 });
}
function showLogin(message=''){
 document.body.innerHTML=`<div class="login-shell"><div class="card" style="width:min(430px,100%);padding:30px">
 <div style="font-family:Georgia,serif;font-size:38px;font-weight:900;color:#087cf4;margin-bottom:4px">AIHXO</div>
 <div class="muted" style="margin-bottom:24px">Panel privado de gestión · Administrador</div>
 <form id="loginForm" class="form">
 <div class="field"><label>Email del administrador</label><input id="email" type="email" required value="${ADMIN_EMAIL}" autocomplete="username"></div>
 <div class="field"><label>Contraseña</label><input id="password" type="password" required minlength="6" autocomplete="current-password" placeholder="Tu contraseña"></div>
 <button class="primary" type="submit">Entrar</button>
 <button type="button" class="secondary" id="signup">Crear acceso de administrador</button>
 <div id="authMsg" class="muted">${message}</div>
 </form></div></div>`;
 $('#loginForm').onsubmit=async e=>{
   e.preventDefault();
   const email=$('#email').value.trim().toLowerCase();
   if(email!==ADMIN_EMAIL){$('#authMsg').textContent='Solo el administrador de AIHXO puede acceder.';return}
   const {error}=await supabaseClient.auth.signInWithPassword({email,password:$('#password').value});
   if(error)$('#authMsg').textContent=error.message;
 };
 $('#signup').onclick=async()=>{
   const email=$('#email').value.trim().toLowerCase();
   if(email!==ADMIN_EMAIL){$('#authMsg').textContent='El acceso de administrador debe utilizar '+ADMIN_EMAIL;return}
   const password=$('#password').value;
   if(password.length<6){$('#authMsg').textContent='La contraseña debe tener al menos 6 caracteres.';return}
   const {data,error}=await supabaseClient.auth.signUp({email,password});
   $('#authMsg').textContent=error?error.message:(data.session?'Cuenta creada. Ya puedes entrar.':'Cuenta creada. Revisa el correo de confirmación de Supabase si está activado.');
 };
}
function showApp(session){document.body.innerHTML=`<div id="app"><aside class="sidebar"><div class="brand"><div class="brandmark">AIHXO</div><small>GESTIÓN ONLINE</small></div><nav id="nav">

  <button data-view="dashboard">
    🏠 <span>Hoy</span>
  </button>

  <div class="muted"
       style="padding:16px 12px 6px;font-size:11px;font-weight:900;">
    OPERATIVA
  </div>

  <button data-view="orders">
    📦 <span>Pedidos</span>
  </button>

  <button data-view="products">
    👕 <span>Productos</span>
  </button>

  <button data-view="stock">
  📦 <span>Stock</span>
</button>

  <button data-view="customers">
    👥 <span>Clientes</span>
  </button>

  <div class="muted"
       style="padding:16px 12px 6px;font-size:11px;font-weight:900;">
    CATÁLOGO
  </div>

  <button type="button" onclick="abrirNuevoDisenoPropio()">
    🎨 <span>Diseños AIHXO</span>
  </button>

<button data-view="garments">
  👕 <span>Prendas base</span>
</button>

  <div class="muted"
       style="padding:16px 12px 6px;font-size:11px;font-weight:900;">
    FINANZAS
  </div>

  <button data-view="expenses">
    💶 <span>Gastos</span>
  </button>

  <button data-view="reports">
    📊 <span>Informes</span>
  </button>

  <div class="muted"
       style="padding:16px 12px 6px;font-size:11px;font-weight:900;">
    MARKETING
  </div>

  <button data-view="coupons">
    🎟️ <span>Cupones</span>
  </button>

  <button data-view="sorteos">
    🎁 <span>Sorteos</span>
  </button>

</nav><div class="sidebar-foot">${session.user.email}<br><button class="secondary" style="margin-top:8px" id="logout">Cerrar sesión</button></div></aside><div class="menu-overlay" id="menuOverlay"></div><main><header class="topbar"><button class="hamb" id="hamb">☰</button><h1 id="title">Inicio</h1><button class="primary small" id="quickOrder">＋ Pedido</button></header><div id="view"></div></main></div><div id="drawer" class="drawer hidden"><div class="drawer-card"><button class="x" id="closeDrawer">×</button><div id="drawerBody"></div></div></div><div id="toast"></div>`;document.querySelectorAll('#nav button[data-view]').forEach(b=>b.onclick=()=>{setView(b.dataset.view);closeMobileMenu()});$('#hamb').setAttribute('aria-label','Abrir menú');$('#hamb').onclick=()=>toggleMobileMenu();$('#menuOverlay').onclick=()=>closeMobileMenu();$('#logout').onclick=()=>supabaseClient.auth.signOut();$('#quickOrder').onclick=()=>window.orderForm();$('#closeDrawer').onclick=closeDrawer;loadAll().then(()=>setView('dashboard'))}
function toggleMobileMenu(){document.querySelector('.sidebar')?.classList.toggle('open');document.querySelector('#menuOverlay')?.classList.toggle('open')}function closeMobileMenu(){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('#menuOverlay')?.classList.remove('open')}function setView(v){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));const titles={dashboard:'Inicio',orders:'Pedidos',products:'Productos',stock:'Stock',customers:'Clientes',expenses:'Gastos',coupons:'Cupones',sorteos:'Sorteos',garments:'Prendas base',reports:'Informes'};const views={dashboard,orders:ordersView,products:productsView,stock:stockHub,customers:customersView,expenses:expensesView,coupons:cuponesView,sorteos:(c)=>{c.innerHTML=sorteosView();iniciarSorteos()},garments:prendasBaseView,reports};$('#title').textContent=titles[v]||'AIHXO';const render=views[v];if(typeof render==='function'){render($('#view'));closeMobileMenu()}else{console.error('Vista no disponible:',v);toast('No se pudo abrir esta sección')}}
async function dashboard(c){
  const activeOrders=orders.filter(o=>String(o.status||'').toLowerCase()!=='cancelado');
  const sales=activeOrders.reduce((a,o)=>a+(+o.total||0),0);
  const costs=activeOrders.reduce((a,o)=>a+(+o.product_cost||0),0);
  const exp=expenses.reduce((a,e)=>a+(+e.amount||0),0);
  const units=activeOrders.reduce((a,o)=>a+(+o.quantity||0),0);
  const stock=products.reduce((a,p)=>a+(+p.stock||0),0);
  const profit=sales-costs;
  const { data: baseStockData } = await supabaseClient
  .from('base_stock_items')
  .select('*');

const baseStock = baseStockData || [];

const low = baseStock
  .filter(item =>
    (+item.quantity || 0) <= Number(item.min_stock ?? 3)
  )
  .sort((a,b) =>
    (+a.quantity || 0) - (+b.quantity || 0)
  );

c.innerHTML=`
  <div class="page">

    <div class="grid kpis">
      ${kpi(
        'Ventas',
        money(sales),
        activeOrders.length + (activeOrders.length===1 ? ' pedido' : ' pedidos')
      )}

      ${kpi(
        'Pedidos',
        activeOrders.length,
        'online'
      )}

      ${kpi(
        'Unidades',
        units,
        'vendidas'
      )}

      ${kpi(
        'Beneficio',
        money(profit),
        sales ? ((profit/sales)*100).toFixed(1)+'% margen' : ''
      )}

      ${kpi(
        'Gastos',
        money(exp),
        'registrados'
      )}

      ${kpi(
        'Stock',
        stock,
        'unidades'
      )}
    </div>

    <div class="grid two">

      <div class="card">
        <div class="section">
          <h2>Pedidos recientes</h2>
          <button class="secondary" onclick="setView('orders')">
            Ver todos
          </button>
        </div>

        ${
          activeOrders.length
            ? `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${
                      activeOrders
                        .slice(0,7)
                        .map(o=>`
                          <tr>
                            <td><b>${o.order_number}</b></td>
                            <td>${esc(o.customer_name)}</td>
                            <td>${money(o.total)}</td>
                            <td>${o.status}</td>
                          </tr>
                        `)
                        .join('')
                    }
                  </tbody>
                </table>
              </div>
            `
            : '<div class="empty">No hay pedidos.</div>'
        }
      </div>

      <div class="card">
        <div class="section">
          <h2>Alertas de stock</h2>
        </div>

        ${
          low.length
            ? low
                .slice(0,8)
                .map(p=>`
                  <div class="statline">
                   <span>
  ${esc(p.size)} · ${esc(p.color)}
  ${p.supplier_model ? ` · ${esc(p.supplier_model)}` : ''}
</span>

<b class="red">
  ${(+p.quantity||0)===0
  ? 'AGOTADO'
  : `${+p.quantity||0} ud.`
}
</b>
                  </div>
                `)
                .join('')
            : '<div class="empty">Stock correcto.</div>'
        }
      </div>

    </div>
  </div>
`;
}
function ordersView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Pedidos</h2><div class="muted">${orders.length} pedidos</div></div><button class="primary" onclick="window.orderForm()">＋ Nuevo pedido</button></div><div class="card"><input class="search" id="oq" placeholder="Buscar..." oninput="drawOrders()"><div id="orderTable"></div></div></div>`;drawOrders()}
function drawOrders(){
  const q = ($('#oq')?.value || '').toLowerCase();

  const lista = orders.filter(o =>
    `${o.order_number || ''} ${o.customer_name || ''} ${o.product_name || ''} ${o.size || ''} ${o.color || ''}`
      .toLowerCase()
      .includes(q)
  );

  const cont = $('#orderTable');
  if (!cont) return;

  cont.innerHTML = lista.length ? `
    <div style="display:grid;gap:14px;margin-top:14px;">
      ${lista.map(o => `
        <div class="card" style="padding:18px;">

          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px;">
            <div>
              <div class="muted" style="font-size:12px;font-weight:800;">
                PEDIDO
              </div>
              <div style="font-size:20px;font-weight:900;">
                ${esc(o.order_number || '—')}
              </div>
            </div>

            <select
              onchange="status('${o.id}',this.value)"
              style="width:auto;max-width:160px;"
            >
              ${[
                
  'Pendiente',
  'Diseño preparado',
  'En producción',
  'Terminado',
  'Enviado',
  'Entregado',
  'Cancelado'
              ].map(s =>
                `<option value="${s}" ${o.status===s?'selected':''}>${s}</option>`
              ).join('')}
            </select>
          </div>

          <div style="display:grid;gap:10px;margin-bottom:16px;">
            <div>
              <div class="muted">Cliente</div>
              <b>${esc(o.customer_name || '—')}</b>
              ${o.contact ? `<div class="muted">${esc(o.contact)}</div>` : ''}
            </div>

            <div>
              <div class="muted">Producto</div>
              <b>${esc(o.product_name || '—')}</b>
              <div class="muted">
                ${esc(o.size || '')} · ${esc(o.color || '')}
              </div>
            </div>

            <div class="row">
              <span>Total</span>
              <b style="font-size:18px;">
                ${money(o.total || 0)}
              </b>
            </div>
          </div>

          <button
            class="secondary"
            onclick="verDetallePedido('${o.id}')"
            style="width:100%;">
            Ver detalle
          </button>

        </div>
      `).join('')}
    </div>
  ` : `
    <div class="muted" style="padding:20px;text-align:center;">
      No hay pedidos
    </div>
  `;
}
async function status(id,s){const {error}=await supabaseClient.from('orders').update({status:s}).eq('id',id);if(error)toast(error.message);else{toast('Estado actualizado');await loadAll();drawOrders()}}
async function orderForm(){

  const { data: camisetasBase, error } = await supabaseClient
    .from('base_stock_items')
    .select('*')
    .gt('quantity', 0)
    .order('color')
    .order('size');

  if (error) {
    console.error(error);
    toast('No se pudo cargar el stock de camisetas');
    return;
  }

  $('#drawer').classList.remove('hidden');

  $('#drawerBody').innerHTML = `
   <h2>Nuevo pedido AIHXO</h2>

<div class="field">
  <label>Tipo de pedido</label>
  <select name="order_type" id="orderType">
    <option value="personalizado">✏️ Personalizado</option>
    <option value="diseno_aihxo">🎨 Diseño AIHXO</option>
    <option value="catalogo">📦 Producto catálogo</option>
  </select>
</div> 

    <form class="form" id="of">

      <div class="formgrid">
        <div class="field">
          <label>Cliente</label>
          <input name="customer" required>
        </div>

        <div class="field">
          <label>Contacto</label>
          <input name="contact">
        </div>
      </div>

      <div class="field">
        <label>Producto</label>

        <select name="sku" id="osku">
          ${products.map(p => `
            <option value="${p.id}">
              ${esc(p.model)} ·
              ${esc(p.size)} ·
              ${esc(p.color)}
              — ${money(p.sale_price)}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="field">
        <label>👕 Camiseta base utilizada</label>

        <select name="base_stock_id" id="obase">
          <option value="">
            No descontar camiseta base
          </option>

          ${(camisetasBase || []).map(x => `
            <option value="${x.id}">
              ${esc(x.supplier || '')}
              ${esc(x.supplier_model || '')}
              · ${esc(x.color)}
              · ${esc(x.size)}
              · Stock ${Number(x.quantity || 0)}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="formgrid">

        <div class="field">
          <label>Diseño</label>
          <input
            name="design"
            placeholder="Nombre del diseño"
          >
        </div>

        <div class="field">
          <label>Cantidad</label>
          <input
            name="qty"
            type="number"
            min="1"
            value="1"
          >
        </div>

      </div>

      <div class="formgrid">

        <div class="field">
          <label>Precio unitario</label>
          <input
            name="price"
            id="oprice"
            type="number"
            step=".01"
          >
        </div>

        <div class="field">
          <label>Envío cobrado</label>
          <input
            name="shipping"
            type="number"
            step=".01"
            value="0"
          >
        </div>

      </div>

      <button class="primary">
        Guardar pedido
      </button>

    </form>
  `;

  $('#oprice').value =
    products[0]?.sale_price || 0;

  $('#osku').onchange = e => {
    $('#oprice').value =
      products.find(
        p => p.id === e.target.value
      )?.sale_price || 0;
  };

  $('#of').onsubmit = createOrder;
}
async function createOrder(e){

  e.preventDefault();

  const f = new FormData(e.target);

  const p = products.find(
    x => x.id === f.get('sku')
  );

  const qty = Number(f.get('qty') || 0);

  if (!p || qty < 1) {
    toast('Pedido no válido');
    return;
  }

  if (p.stock < qty) {
    toast('Stock de producto insuficiente');
    return;
  }

  const baseStockId =
    String(f.get('base_stock_id') || '').trim();

  let camisetaBase = null;

  if (baseStockId) {

    const { data, error } = await supabaseClient
      .from('base_stock_items')
      .select('*')
      .eq('id', baseStockId)
      .single();

    if (error || !data) {
      console.error(error);
      toast('No se pudo comprobar la camiseta base');
      return;
    }

    camisetaBase = data;

    if (Number(camisetaBase.quantity || 0) < qty) {
      toast(
        `Stock insuficiente de camiseta base. Disponible: ${
          Number(camisetaBase.quantity || 0)
        }`
      );
      return;
    }
  }

  const price =
    Number(f.get('price') || 0);

  const shipping =
    Number(f.get('shipping') || 0);

  let customer = customers.find(
    x => x.name === f.get('customer')
  );

  if (!customer) {

    const r = await supabaseClient
      .from('customers')
      .insert({
        name: f.get('customer'),
        contact: f.get('contact')
      })
      .select()
      .single();

    if (r.error) {
      toast(r.error.message);
      return;
    }

    customer = r.data;
  }

  const orderNumber =
    'AIHXO-' +
    String(orders.length + 1).padStart(4, '0');

  const order = {
   order_type: f.get('order_type'),

    order_number: orderNumber,

    customer_id: customer.id,
    customer_name: customer.name,
    contact: f.get('contact'),

    product_id: p.id,
    product_name: p.model,
    size: p.size,
    color: p.color,

    design: f.get('design'),

    quantity: qty,

    unit_price: price,
    shipping: shipping,

    total:
      qty * price + shipping,

    product_cost:
      qty * cost(p),

    status: 'Pendiente',

    base_stock_item_id:
      camisetaBase ? camisetaBase.id : null,

    base_stock_quantity:
      camisetaBase ? qty : 0
  };

  const r = await supabaseClient
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (r.error) {
    console.error(r.error);
    toast(r.error.message);
    return;
  }

  /* DESCONTAR STOCK DEL PRODUCTO */

  const nuevoStockProducto =
    Number(p.stock || 0) - qty;

  const { error: errorProducto } =
    await supabaseClient
      .from('products')
      .update({
        stock: nuevoStockProducto
      })
      .eq('id', p.id);

  if (errorProducto) {
    console.error(errorProducto);
    toast('Pedido creado, pero hubo un error en stock producto');
    return;
  }

  /* DESCONTAR CAMISETA BASE */

  if (camisetaBase) {

    const stockAnterior =
      Number(camisetaBase.quantity || 0);

    const nuevoStockBase =
      stockAnterior - qty;

    const { error: errorStockBase } =
      await supabaseClient
        .from('base_stock_items')
        .update({
          quantity: nuevoStockBase
        })
        .eq('id', camisetaBase.id);

    if (errorStockBase) {
      console.error(errorStockBase);
      toast(
        'Pedido creado, pero no se pudo descontar la camiseta base'
      );
      return;
    }

    /* REGISTRAR MOVIMIENTO */

    const { error: errorMovimiento } =
      await supabaseClient
        .from('base_stock_movements')
        .insert({
          item_id: camisetaBase.id,
          movement_type: 'salida',
          quantity_delta: -qty,
          previous_quantity: stockAnterior,
          new_quantity: nuevoStockBase,
          reason: `Pedido ${orderNumber}`
        });

    if (errorMovimiento) {
      console.error(errorMovimiento);
      toast(
        'Stock descontado, pero no se pudo guardar el historial'
      );
    }
  }

  closeDrawer();

  await loadAllr();

  setView('orders');

  toast(`Pedido ${orderNumber} guardado`);
}
async function productsView(c){
 const { data: prendasBaseProductos, error: errorPrendasBaseProductos } =
  await supabaseClient
    .from('garments')
    .select('id,manufacturer,model,active')
    .order('manufacturer')
    .order('model');

if (errorPrendasBaseProductos) {
  console.error('Error cargando prendas base:', errorPrendasBaseProductos);
}

window.prendasBaseLista = prendasBaseProductos || [];
  c.innerHTML=`
    <div class="page">

      <div class="section">
        <div>
          <h2>Gestionar productos</h2>
          <div class="muted">${products.length} referencias</div>
        </div>

        <button class="primary" onclick="productForm()">
          ＋ Nuevo producto
        </button>
      </div>

      <div class="card">

        <div style="
          display:grid;
         grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:16px;
        ">

          <input
            class="search" style="grid-column:1 / -1;max-width:none;"
            id="pq"
            placeholder="🔎 Buscar producto, SKU, talla..."
            oninput="drawProducts()"
          >

          <select id="pcategory" onchange="drawProducts()">
            <option value="">Todas las categorías</option>
            <option value="Camiseta">Camisetas</option>
            <option value="Bolso">Bolsos</option>
          </select>

          <select id="pstock" onchange="drawProducts()">
            <option value="">Todo el stock</option>
            <option value="available">Con stock</option>
            <option value="low">Stock bajo (≤3)</option>
            <option value="zero">Sin stock</option>
          </select>

        </div>
<div style="display:flex;gap:8px;overflow-x:auto;margin:14px 0;padding-bottom:4px;">
  <button class="primary" data-product-filter="all" onclick="setProductQuickFilter('all')">Todos</button>
  <button class="secondary" data-product-filter="published" onclick="setProductQuickFilter('published')">👁 Publicados</button>
  <button class="secondary" data-product-filter="hidden" onclick="setProductQuickFilter('hidden')">🙈 Ocultos</button>
  <button class="secondary" data-product-filter="low" onclick="setProductQuickFilter('low')">⚠️ Stock bajo</button>
</div>
        <div id="productTable"></div>

      </div>

    </div>
  `;

  drawProducts();
}
function formatCategory(category){
  let texto = String(category || '')
    .replace(/\|/g, ' ')
    .replace(/\bpublicado\b/gi, '')
    .replace(/\bnovedad\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  texto = texto.replace(/diseno propio/gi, 'Diseño propio');

  const partes = [];

  if(/diseño propio/i.test(texto)) partes.push('Diseño propio');
  if(/camiseta/i.test(texto)) partes.push('Camiseta');
  if(/infantil/i.test(texto)) partes.push('Infantil');
  if(/adulto/i.test(texto)) partes.push('Adulto');
  if(/bolso/i.test(texto)) partes.push('Bolso');

  return partes.length ? [...new Set(partes)].join(' · ') : texto;
}
let productQuickFilter = 'all';

function setProductQuickFilter(filter){
  productQuickFilter = filter;

  document.querySelectorAll('[data-product-filter]').forEach(btn => {
    btn.classList.toggle('primary', btn.dataset.productFilter === filter);
    btn.classList.toggle('secondary', btn.dataset.productFilter !== filter);
  });

  drawProducts();
}
function drawProducts(){

  const q = ($('#pq')?.value || '').toLowerCase().trim();
  const category = $('#pcategory')?.value || '';
  const stockFilter = $('#pstock')?.value || '';
const quickFilter = productQuickFilter;
  let lista = products.filter(p => {

    const texto = `
      ${p.model || ''}
      ${p.sku || ''}
      ${p.size || ''}
      ${p.color || ''}
      ${p.category || ''}
    `.toLowerCase();

    if(q && !texto.includes(q)) return false;

    if(category && p.category !== category) return false;

    const stock = Number(p.stock || 0);

    if(stockFilter === 'available' && stock <= 0) return false;
    if(stockFilter === 'low' && (stock <= 0 || stock > 3)) return false;
    if(stockFilter === 'zero' && stock !== 0) return false;
if(quickFilter === 'low' && !(stock > 0 && stock <= 3)) return false;
if(quickFilter === 'hidden' && !/oculto/i.test(String(p.category || ''))) return false;
if(quickFilter === 'published' && !/publicado/i.test(String(p.category || ''))) return false;
    return true;
  });


  const cont = $('#productTable');

  if(!cont) return;
const esMovil = window.innerWidth <= 700;

if(esMovil){

  cont.innerHTML = lista.length ? lista.map(p => {

    const stock = Number(p.stock || 0);

    const visibilidad = {
      destacado:'⭐ Destacado',
      prioritario:'🔥 Prioritario',
      normal:'Normal',
      baja:'Baja',
      oculto:'🙈 Oculto'
    }[p.commercial_visibility || 'normal'];

    return `
      <div class="card" style="margin-bottom:12px;">

        <div style="font-size:17px;font-weight:800;margin-bottom:4px;">
          ${esc(p.model || 'Sin nombre')}
        </div>

        <div class="muted" style="margin-bottom:10px;">
${esc(formatCategory(p.category))}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;font-size:13px;">

          <div><b>SKU:</b> ${esc(p.sku || '—')}</div>
          <div><b>Talla:</b> ${esc(p.size || '—')}</div>

          <div><b>Color:</b> ${esc(p.color || '—')}</div>
          <div>
            <b>Stock:</b>
            <span class="${stock <= 3 ? 'red' : 'green'}">${stock}</span>
          </div>

          <div><b>Venta:</b> ${money(p.sale_price)}</div>
          <div><b>${visibilidad}</b></div>
<div style="grid-column:1 / -1;">
  <b>Prenda base:</b>

  <select
    onchange="cambiarPrendaBaseRapida('${p.id}', this.value)"
    style="
      width:100%;
      margin-top:6px;
      padding:8px 10px;
      border:1px solid #d0d5dd;
      border-radius:10px;
      background:#fff;
    "
  >
    <option value="">Sin asignar</option>

    ${(window.prendasBaseLista || []).map(g => `
      <option
        value="${g.id}"
        ${p.garment_id === g.id ? 'selected' : ''}
        ${g.active === false && p.garment_id !== g.id ? 'disabled' : ''}
      >
        ${esc(g.manufacturer)} · ${esc(g.model)}${g.active ? '' : ' · INACTIVA'}
      </option>
    `).join('')}
  </select>
</div>
        </div>

        <div class="actions" style="margin-top:14px;display:grid;grid-template-columns:1fr 1fr;">

          <button
            class="primary small"
            onclick="productForm('${p.id}')"
          >
            ✏️ Editar
          </button>

          <button
            class="secondary small"
            onclick="addStock('${p.id}')"
          >
            ＋ Stock
          </button>

        </div>

      </div>
    `;

  }).join('') : `
    <div class="empty">
      No se encontraron productos.
    </div>
  `;

  return;
}

  cont.innerHTML = lista.length ? `

    <div class="table-wrap">

      <table>

        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Talla</th>
            <th>Color</th>
            <th>Stock</th>
            <th>Venta</th>
            <th>Visibilidad</th>
            <th></th>
          </tr>
        </thead>

        <tbody>

          ${lista.map(p => {

            const stock = Number(p.stock || 0);

            const visibilidad = {
              destacado:'⭐ Destacado',
              prioritario:'🔥 Prioritario',
              normal:'Normal',
              baja:'Baja',
              oculto:'🙈 Oculto'
            }[p.commercial_visibility || 'normal'];

            return `

              <tr>

                <td>
                  <b>${esc(p.model || 'Sin nombre')}</b>
                  <div class="muted">
                    ${esc(p.category || '')}
                  </div>
                </td>

                <td>
                  ${esc(p.sku || '—')}
                </td>

                <td>
                  ${esc(p.size || '—')}
                </td>

                <td>
                  ${esc(p.color || '—')}
                </td>

                <td>
                  <b class="${stock <= 3 ? 'red' : 'green'}">
                    ${stock}
                  </b>
                </td>

                <td>
                  <b>${money(p.sale_price)}</b>
                </td>

                <td>
                  ${visibilidad}
                </td>

                <td>

                  <div class="actions">

                    <button
                      class="primary small"
                      onclick="productForm('${p.id}')"
                    >
                      ✏️ Editar
                    </button>

                    <button
                      class="secondary small"
                      onclick="addStock('${p.id}')"
                    >
                      ＋ Stock
                    </button>

                  </div>

                </td>

              </tr>

            `;

          }).join('')}

        </tbody>

      </table>

    </div>

  ` : `

    <div class="empty">
      No se encontraron productos.
    </div>

  `;

}
window.cambiarPrendaBaseRapida = async function(productId, garmentId) {
  try {
    const { error } = await supabaseClient
      .from('products')
      .update({
        garment_id: garmentId || null
      })
      .eq('id', productId);

    if (error) throw error;

    const producto = products.find(p => p.id === productId);

    if (producto) {
      producto.garment_id = garmentId || null;
    }

    toast('Prenda base actualizada');

  } catch (error) {
    console.error(error);
    toast('No se pudo actualizar la prenda base');
  }
};
async function productForm(id){
 const p=id?products.find(x=>x.id===id):{
  sku:'',category:'Camiseta',model:'',size:'M',color:'Blanco',
  garment_cost:4,dtf_cost:3,extras_cost:.68,sale_price:16.9,stock:0,
  material:'',grammage:'',fabric:'',fit:'',care:'',features:'',
  measurements:{}
 };

 const measurements=p.measurements||{};
 const medidasTexto=Object.entries(measurements).map(([talla,m])=>{
  return `${talla}|${m.width||''}|${m.length||''}`;
 }).join('\n');

 $('#drawer').classList.remove('hidden');

 $('#drawerBody').innerHTML=`
 <h2>${id?'Editar':'Nuevo'} producto</h2>

 <form class="form" id="pf">

  <div class="formgrid">
   <div class="field">
    <label>SKU</label>
    <input name="sku" value="${esc(p.sku||'')}" required autocomplete="off">
   </div>

   <div class="field">
    <label>Categoría</label>
    <select name="category">
     <option ${p.category==='Camiseta'?'selected':''}>Camiseta</option>
     <option ${p.category==='Bolso'?'selected':''}>Bolso</option>
    </select>
   </div>
  </div>

  <div class="field">
   <label>Modelo</label>
   <input name="model" value="${esc(p.model||'')}" required>
  </div>

<div class="field">
  <label>Prenda base</label>

  <select name="garment_id" id="pfGarment">
    <option value="">Sin asignar</option>
  </select>

  <div class="muted" style="margin-top:6px;">
    Asocia este producto a su fabricante y modelo base.
  </div>
</div>
  
<div class="field">
  <label>Visibilidad comercial</label>
  <select name="commercial_visibility">
    <option value="destacado" ${p.commercial_visibility==='destacado'?'selected':''}>⭐ Destacado</option>
    <option value="prioritario" ${p.commercial_visibility==='prioritario'?'selected':''}>🔥 Prioritario</option>
    <option value="normal" ${!p.commercial_visibility || p.commercial_visibility==='normal'?'selected':''}>Normal</option>
    <option value="baja" ${p.commercial_visibility==='baja'?'selected':''}>Baja visibilidad</option>
    <option value="oculto" ${p.commercial_visibility==='oculto'?'selected':''}>Oculto</option>
  </select>
</div>
  <div class="formgrid">
   <div class="field">
    <label>Talla</label>
    <input name="size" value="${esc(p.size||'')}">
   </div>

   <div class="field">
    <label>Color</label>
    <input name="color" value="${esc(p.color||'')}">
   </div>
  
  <div class="field">
  <label>Foto principal</label>
  <input id="productImage" type="file" accept="image/*">
  <div id="productImagePreview" style="margin-top:10px">
  ${p.image_url ? `
    <img
      src="${esc(p.image_url)}"
      alt="Foto del producto"
      style="width:100%;max-width:220px;border-radius:14px;display:block"
    >
  ` : `
    <div class="muted">Sin foto principal</div>
  `}
</div>
</div>

  <h3 style="margin-top:22px">Características principales</h3>

  <div class="formgrid">
   <div class="field">
    <label>Material / composición</label>
    <input name="material"
     placeholder="Ej. 100% algodón"
     value="${esc(p.material||'')}">
   </div>

   <div class="field">
    <label>Gramaje</label>
    <input name="grammage"
     placeholder="Ej. 200 g/m²"
     value="${esc(p.grammage||'')}">
   </div>
  </div>

  <div class="formgrid">
   <div class="field">
    <label>Tipo de tejido</label>
    <input name="fabric"
     placeholder="Ej. algodón premium"
     value="${esc(p.fabric||'')}">
   </div>

   <div class="field">
    <label>Corte / ajuste</label>
    <input name="fit"
     placeholder="Ej. corte regular"
     value="${esc(p.fit||'')}">
   </div>
  </div>

  <div class="field">
   <label>Características destacadas</label>
   <textarea name="features" rows="3"
    placeholder="Ej. tejido suave, resistente y apto para DTF">${esc(p.features||'')}</textarea>
  </div>

  <div class="field">
   <label>Cuidados</label>
   <textarea name="care" rows="3"
    placeholder="Ej. lavar a 30 °C, no usar secadora">${esc(p.care||'')}</textarea>
  </div>
<h3 style="margin-top:22px">Datos de compra / proveedor</h3>

<div class="formgrid">
  <div class="field">
    <label>Proveedor</label>
    <input
      name="supplier"
      placeholder="Ej. Makito"
      value="${esc(p.supplier||'')}"
    >
  </div>

  <div class="field">
    <label>Modelo / referencia proveedor</label>
    <input
      name="supplier_model"
      placeholder="Ej. GN649"
      value="${esc(p.supplier_model||'')}"
    >
  </div>
</div>

<div class="field">
  <label>Coste unitario sin IVA</label>
  <input
    name="purchase_cost"
    type="number"
    step=".01"
    placeholder="Ej. 3.45"
    value="${p.purchase_cost ?? ''}"
  >
</div>

  <h3 style="margin-top:22px">Guía de medidas</h3>

  <div class="muted" style="margin-bottom:8px">
   Una talla por línea: Talla | Ancho | Largo
  </div>

  <div class="field">
   <label>Medidas en centímetros</label>
   <textarea name="measurements" rows="6"
    placeholder="7/8|38|52
9/11|41|58
12/13|44|62">${esc(medidasTexto)}</textarea>
  </div>

  <div class="formgrid">
   <div class="field">
    <label>Coste prenda</label>
    <input name="garment_cost" type="number" step=".01"
     value="${p.garment_cost||0}">
   </div>

   <div class="field">
    <label>Coste DTF</label>
    <input name="dtf_cost" type="number" step=".01"
     value="${p.dtf_cost||0}">
   </div>
  </div>

  <div class="formgrid">
   <div class="field">
    <label>Extras</label>
    <input name="extras_cost" type="number" step=".01"
     value="${p.extras_cost||0}">
   </div>

   <div class="field">
    <label>Precio venta</label>
    <input name="sale_price" type="number" step=".01"
     value="${p.sale_price||0}">
   </div>
  </div>
<div class="formgrid">
  <div class="field">
    <label>Oferta apertura · 1 impresión</label>
    <input name="price_one_print" type="number" step=".01"
      value="${p.price_one_print ?? ''}"
      placeholder="Ej. 9.95">
  </div>

  <div class="field">
    <label>Oferta apertura · 2 impresiones</label>
    <input name="price_two_print" type="number" step=".01"
      value="${p.price_two_print ?? ''}"
      placeholder="Ej. 12.95">
  </div>
</div>
  <div class="field">
   <label>Stock</label>
   <input name="stock" type="number" value="${p.stock||0}">
  </div>

  <button class="primary">Guardar producto</button>
${id ? `
  <button
    type="button"
    onclick="deleteProduct('${id}')"
    style="
      margin-top:12px;
      width:100%;
      background:#fff;
      color:#c62828;
      border:1px solid #ef9a9a;
      border-radius:12px;
      padding:13px 16px;
      font-weight:800;
      cursor:pointer;
    "
  >
    🗑 Eliminar producto
  </button>
` : ''}
 </form>`;
const selectorGarment = document.getElementById('pfGarment');

const { data: garmentsForm, error: garmentsFormError } =
  await supabaseClient
    .from('garments')
    .select('*')
    
    .order('manufacturer')
    .order('model');

if (garmentsFormError) {
  console.error(garmentsFormError);
} else if (selectorGarment) {

  (garmentsForm || []).forEach(g => {
    const option = document.createElement('option');

    option.value = g.id;
    option.textContent =
  `${g.manufacturer} · ${g.model}${g.active ? '' : ' · INACTIVA'}`;

    if (p.garment_id === g.id) {
      option.selected = true;
    }
if (g.active === false && p.garment_id !== g.id) {
  option.disabled = true;
}
    selectorGarment.appendChild(option);
  });
}
 $('#pf').onsubmit=async e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  
  let imageUrl = p.image_url || '';

const imageFile = document.querySelector('#productImage')?.files?.[0];

if(imageFile){
  const ext = imageFile.name.split('.').pop().toLowerCase();
  const safeSku = String(f.get('sku') || 'producto')
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g,'-');

  const fileName = `${safeSku}-${Date.now()}.${ext}`;

  const upload = await supabaseClient
    .storage
    .from('product-images')
    .upload(fileName, imageFile, {
      cacheControl:'3600',
      upsert:false
    });

  if(upload.error){
    toast('Error subiendo la foto: ' + upload.error.message);
    return;
  }

  const {data:publicData} = supabaseClient
    .storage
    .from('product-images')
    .getPublicUrl(fileName);

  imageUrl = publicData.publicUrl;
}

  const measurements={};

  String(f.get('measurements')||'')
   .split('\n')
   .map(x=>x.trim())
   .filter(Boolean)
   .forEach(line=>{
    const [talla,width,length]=line.split('|').map(x=>x.trim());

    if(talla){
     measurements[talla]={
      width:width||'',
      length:length||''
     };
    }
   });

  const o={
   sku:String(f.get('sku')||'').trim(),
   garment_id: f.get('garment_id') || null,
   category:
  String(p.category || '').toLowerCase().includes('diseno propio')
    ? p.category
    : f.get('category'),
   commercial_visibility:f.get('commercial_visibility') || 'normal',
   size:f.get('size'),
   color:f.get('color'),

   supplier:f.get('supplier'),
supplier_model:f.get('supplier_model'),
purchase_cost:
  f.get('purchase_cost') !== ''
    ? +f.get('purchase_cost')
    : null,
   material:f.get('material'),
   image_url:imageUrl,
   grammage:f.get('grammage'),
   fabric:f.get('fabric'),
   fit:f.get('fit'),
   features:f.get('features'),
   care:f.get('care'),
   measurements:measurements,

   garment_cost:+f.get('garment_cost'),
dtf_cost:+f.get('dtf_cost'),
extras_cost:+f.get('extras_cost'),
sale_price:+f.get('sale_price'),

price_one_print:
  f.get('price_one_print') !== ''
    ? +f.get('price_one_print')
    : null,

price_two_print:
  f.get('price_two_print') !== ''
    ? +f.get('price_two_print')
    : null,

stock:+f.get('stock')
  };

  const duplicate=products.find(x=>
   String(x.sku||'').trim().toLowerCase()===o.sku.toLowerCase()
   && String(x.id)!==String(id||'')
  );

  if(duplicate){
   toast('Ese SKU ya está asignado a otro producto');
   return;
  }

  const r=id
   ?await supabaseClient.from('products').update(o).eq('id',id)
   :await supabaseClient.from('products').insert(o);

  if(r.error){
   toast(r.error.message);
  }else{
   closeDrawer();
   await loadAll();
   setView('products');
   toast('Producto guardado');
  }
 };
}
async function deleteProduct(id) {
  const p = products.find(x => String(x.id) === String(id));

  if (!p) {
    toast('Producto no encontrado');
    return;
  }

  const ok = confirm(
    `¿Seguro que quieres eliminar este producto?\n\n` +
    `${p.model || ''} · ${p.size || ''} · ${p.color || ''}\n\n` +
    `Esta acción no se puede deshacer.`
  );

  if (!ok) return;

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    toast('No se pudo eliminar: ' + error.message);
    return;
  }

  closeDrawer();
  await loadAll();
  setView('products');
  toast('Producto eliminado');
}
async function addStock(id){const p=products.find(x=>x.id===id),n=Number(prompt('Unidades a añadir','5')||0);if(!n)return;const r=await supabaseClient.from('products').update({stock:p.stock+n}).eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();setView('stock');toast('Stock actualizado')}}
function stockHub(c){
  c.innerHTML = `
    <div class="page">

      <div class="section">
        <div>
          <h2>Stock</h2>
          <div class="muted">
            Control de existencias de AIHXO
          </div>
        </div>
      </div>

      <div class="grid two">

        <button
          class="card"
          onclick="renderStockCamisetas()"
          style="
            text-align:left;
            padding:22px;
            cursor:pointer;
          "
        >
          <div style="font-size:34px;margin-bottom:10px;">👕</div>
          <div style="font-size:19px;font-weight:900;">
            Camisetas base
          </div>
          <div class="muted" style="margin-top:6px;">
            Camisetas compradas a proveedores por talla y color
          </div>
        </button>

        <button
          class="card"
          onclick="stockProductos()"
          style="
            text-align:left;
            padding:22px;
            cursor:pointer;
          "
        >
          <div style="font-size:34px;margin-bottom:10px;">📦</div>
          <div style="font-size:19px;font-weight:900;">
            Productos terminados
          </div>
          <div class="muted" style="margin-top:6px;">
            Stock de productos y diseños preparados para vender
          </div>
        </button>

      </div>

    </div>
  `;
}
function stockProductos(c = $('#view')){
 const total=products.reduce((a,p)=>a+p.stock,0),value=products.reduce((a,p)=>a+p.stock*cost(p),0),low=products.filter(p=>p.stock<=3);
 c.innerHTML=`<div class="page">
<div style="margin-bottom:14px">
  <button class="secondary" onclick="setView('stock')">← Stock</button>
</div>
<div class="section"><div><h2>Stock</h2><div class="muted">Control de stock por producto</div></div><button class="primary small" onclick="setView('products')">Gestionar productos</button></div>
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
         <div class="field">
  <label>Visibilidad comercial</label>
  <select name="commercial_visibility">
    <option value="destacado" ${p.commercial_visibility==='destacado'?'selected':''}>⭐ Destacado</option>
    <option value="prioritario" ${p.commercial_visibility==='prioritario'?'selected':''}>🔥 Prioritario</option>
    <option value="normal" ${!p.commercial_visibility || p.commercial_visibility==='normal'?'selected':''}>Normal</option>
    <option value="baja" ${p.commercial_visibility==='baja'?'selected':''}>Baja visibilidad</option>
    <option value="oculto" ${p.commercial_visibility==='oculto'?'selected':''}>Oculto</option>
  </select>
</div> 
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
window.aplicarPreciosModelo = async function(modelo) {
  const uno = Number(prompt('Precio oferta · 1 impresión'));
  if (!uno) return;

  const dos = Number(prompt('Precio oferta · 2 impresiones'));
  if (!dos) return;

  const confirmar = confirm(
    `Aplicar a todas las variantes de "${modelo}":\n\n` +
    `1 impresión: ${uno.toFixed(2)} €\n` +
    `2 impresiones: ${dos.toFixed(2)} €`
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from('products')
    .update({
      price_one_print: uno,
      price_two_print: dos
    })
    .eq('model', modelo);

  if (error) {
    alert('Error al aplicar los precios: ' + error.message);
    return;
  }

  await loadAll();
  setView('products');
  toast('Precios aplicados a todo el modelo');
};
const productsViewOriginal = productsView;

productsView = function(c) {
  productsViewOriginal(c);

  const cards = c.querySelectorAll('.grid.three .card');

  cards.forEach((card, i) => {
    const p = products[i];
    if (!p) return;

    const actions = card.querySelector('.actions');
    if (!actions) return;

    const btn = document.createElement('button');
    btn.className = 'secondary';
    btn.type = 'button';
    btn.textContent = '€ Aplicar precios al modelo';
    btn.onclick = () => aplicarPreciosModelo(p.model);

    actions.appendChild(btn);
  });
};
window.orderForm = async function() {
   const ownDesignProducts = (products || []).filter(p =>
     String(p.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('diseno propio')
   );
   const catalogProducts = (products || []).filter(p =>
     !String(p.category || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes('diseno propio')
   );

   const { data: baseStockData, error: baseStockError } =
    await supabaseClient
      .from('base_stock_items')
      .select('*')
      .gt('quantity', 0)
      .order('garment_type')
      .order('color')
      .order('size');

  if (baseStockError) {
    toast('No se pudo cargar el stock de camisetas');
    return;
  }

  let baseStockItems = baseStockData || [];
  $('#drawer').classList.remove('hidden');

  $('#drawerBody').innerHTML = `
    <h2>Nuevo pedido AIHXO</h2>

<form class="form" id="of">

  <div class="field">
    <label>Tipo de pedido</label>
    <select name="order_type" id="orderType">
  <option value="personalizado">✏️ Personalizado</option>
  <option value="diseno_aihxo">🎨 Diseño AIHXO</option>
  <option value="catalogo">📦 Producto catálogo</option>
</select>

<div id="tipoPedidoAyuda" class="muted" style="margin-top:6px;margin-bottom:16px;">
  Personalización creada a medida para el cliente.
</div>
  </div>

      <div class="formgrid">
        <div class="field">
          <label>Cliente</label>
          <input name="customer" required>
        </div>

        <div class="field">
          <label>Contacto</label>
          <input name="contact" placeholder="Teléfono / WhatsApp">
        </div>
      </div>

      <div class="field" id="productoPedidoField">
  <label>Producto</label>

  <div id="productoPersonalizado"
       style="padding:12px 14px;border:1px solid #d0d5dd;border-radius:12px;background:#f8fafc;font-weight:800;">
    ✏️ Producto personalizado
  </div>

  <select name="sku" id="osku" style="display:none;">
    <option value="">— Selecciona producto —</option>
    ${catalogProducts.map(p => `
      <option value="${p.id}">
        ${esc(p.model)} · ${esc(p.size || '')} · ${esc(p.color || '')}
      </option>
    `).join('')}
  </select>

  <select name="producto_diseno_aihxo" id="oproductoDisenoAihxo" style="display:none;">
    <option value="">— Selecciona diseño AIHXO —</option>

    ${ownDesignProducts.map(p => `
      <option value="${p.id}">
        ${esc(p.model)}
      </option>
    `).join('')}
  </select>
</div>

<div class="field" id="baseStockPedidoField">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px;">
    <label style="margin:0">Prenda base utilizada</label>
    <button type="button" class="secondary small" id="nuevaPrendaPedidoBtn">＋ Nueva prenda base</button>
  </div>

  <select name="base_stock_item_id" id="obaseStock">
    <option value="">— Selecciona prenda base —</option>
  </select>

  <div id="nuevaPrendaPedidoBox" class="card"
       style="display:none;margin-top:12px;padding:14px;">
    <h3 style="margin:0 0 12px;">Nueva prenda base</h3>

    <div class="formgrid">
      <div class="field">
        <label>Proveedor / fabricante</label>
        <input id="npProveedor" placeholder="Ej. Roly, Mukua..." />
      </div>
      <div class="field">
        <label>Modelo</label>
        <input id="npModelo" placeholder="Ej. Técnica manga larga" />
      </div>
    </div>

    <div class="formgrid">
      <div class="field">
        <label>Tipo de prenda</label>
        <select id="npTipo">
          <option value="Camiseta">Camiseta</option>
          <option value="Camiseta técnica">Camiseta técnica</option>
          <option value="Sudadera">Sudadera</option>
          <option value="Polo">Polo</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div class="field">
        <label>Público</label>
        <select id="npPublico">
          <option value="Unisex">Unisex</option>
          <option value="Adulto">Adulto</option>
          <option value="Niño">Niño</option>
          <option value="Mujer">Mujer</option>
        </select>
      </div>
    </div>

    <div class="formgrid">
      <div class="field">
        <label>Color</label>
        <input id="npColor" placeholder="Ej. Negro" />
      </div>
      <div class="field">
        <label>Talla</label>
        <input id="npTalla" placeholder="Ej. L / 12" />
      </div>
    </div>

    <div class="formgrid">
      <div class="field">
        <label>Unidades disponibles</label>
        <input id="npCantidad" type="number" min="1" step="1" value="1" />
      </div>
      <div class="field">
        <label>Coste unitario €</label>
        <input id="npCoste" type="number" min="0" step=".01" value="0" />
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <button type="button" class="primary" id="guardarNuevaPrendaPedido">Guardar y seleccionar</button>
      <button type="button" class="secondary" id="cancelarNuevaPrendaPedido">Cancelar</button>
    </div>
  </div>
</div>
  <div id="personalizacionPedido">
  <div class="field">
    <label>Personalización</label>
    <select name="personalization" id="opersonalization">
      <option value="1">1 impresión</option>
      <option value="2">2 impresiones</option>
    </select>
  </div>

  <div class="formgrid">
    <div class="field">
      <label>Ubicación impresión 1</label>
      <input
        name="position1"
        placeholder="Ej. Pecho, espalda..."
      >
    </div>

    <div class="field" id="position2Field" style="display:none;">
      <label>Ubicación impresión 2</label>
      <input
        name="position2"
        placeholder="Ej. Espalda, manga..."
      >
    </div>
  </div>
</div> 

     <div class="field" id="designPedidoField">
  <label>Diseño</label>

  <input
    name="design"
    id="designLibre"
    placeholder="Nombre o descripción del diseño"
  >

  <select
    name="design_aihxo"
    id="designAihxo"
    style="display:none;"
  >
    <option value="">— Selecciona diseño AIHXO —</option>

    ${designs
  .filter(d => d.active === true)
  .map(d => ` 
      <option value="${esc(d.name)}">
        ${esc(d.name)}
      </option>
    `).join('')}
  </select>
</div>
<div class="card" id="imagenesDisenoPedido" style="padding:16px;margin-bottom:16px;">
  <h3 style="margin-top:0;">Imágenes del diseño</h3>

  <div class="formgrid">

    <div class="field">
      <label>Diseño delantero</label>
      <input
        type="file"
        name="design_front"
        id="designFront"
        accept="image/png,image/jpeg,image/webp"
      >
      <div class="muted" style="margin-top:6px;">
        PNG, JPG o WEBP
      </div>
    </div>

    <div class="field">
      <label>Diseño trasero</label>
      <input
        type="file"
        name="design_back"
        id="designBack"
        accept="image/png,image/jpeg,image/webp"
      >
      <div class="muted" style="margin-top:6px;">
        PNG, JPG o WEBP
      </div>
    </div>

  </div>
</div>
      <div class="field">
        <label>Notas del cliente</label>
        <textarea
          name="notes"
          rows="3"
          placeholder="Colores, texto, instrucciones especiales..."
        ></textarea>
      </div>

      <div class="formgrid">
        <div class="field">
          <label>Cantidad</label>
          <input
            name="qty"
            id="oqty"
            type="number"
            min="1"
            value="1"
          >
        </div>

        <div class="field">
          <label>Precio unitario</label>
          <input
            name="price"
            id="oprice"
            type="number"
            step=".01"
          >
        </div>
      </div>

      <div class="field">
        <label>Envío cobrado</label>
        <input
          name="shipping"
          id="oshipping"
          type="number"
          step=".01"
          value="0"
        >
      </div>

      <div
        id="orderSummary"
        class="card"
        style="margin:16px 0;padding:16px;"
      ></div>

      <button class="primary">
        Guardar pedido
      </button>

    </form>
  `;

 const renderBaseStockOptions = (selectedId = '') => {
  const select = document.getElementById('obaseStock');
  if (!select) return;

  const sorted = [...baseStockItems].sort((a,b) => {
    const ma = String(a.supplier_model || a.supplier || '');
    const mb = String(b.supplier_model || b.supplier || '');
    return ma.localeCompare(mb, 'es', {sensitivity:'base'})
      || String(a.color || '').localeCompare(String(b.color || ''), 'es', {sensitivity:'base'})
      || String(a.size || '').localeCompare(String(b.size || ''), 'es', {numeric:true});
  });

  select.innerHTML =
    '<option value="">— Selecciona prenda base —</option>' +
    sorted.map(item => `
      <option value="${item.id}">
        ${esc(item.garment_type || 'Camiseta')}
        · ${esc(item.supplier_model || item.supplier || '')}
        · ${esc(item.color || '')}
        · ${esc(item.size || '')}
        · Stock ${Number(item.quantity || 0)}
      </option>
    `).join('');

  if (selectedId) select.value = selectedId;
};

renderBaseStockOptions();

const actualizarPedido = () => {
  const tipoPedido = $('#orderType').value;

  if (tipoPedido !== 'catalogo') {
    actualizarResumenPedido();
    return;
  }

  const p = catalogProducts.find(x => x.id === $('#osku').value);
  if (!p) {
    $('#oprice').value = 0;
    actualizarResumenPedido();
    return;
  }

  $('#oprice').value = Number(p.sale_price || 0);
  actualizarResumenPedido();
};

  window.actualizarResumenPedido = function() {
    const tipoPedido = $('#orderType').value;
    const qty = Number($('#oqty').value || 1);
    const price = Number($('#oprice').value || 0);
    const shipping = Number($('#oshipping').value || 0);
    const total = (qty * price) + shipping;

    const baseStockId = $('#obaseStock')?.value || '';
    const baseStockItem = baseStockItems.find(
      x => String(x.id) === String(baseStockId)
    );

    const p = tipoPedido === 'catalogo'
      ? catalogProducts.find(x => x.id === $('#osku').value)
      : null;

    const coste =
      tipoPedido === 'catalogo'
        ? (p ? qty * cost(p) : 0)
        : qty * Number(baseStockItem?.unit_cost || 0);

    const beneficio = total - coste;

    $('#orderSummary').innerHTML = `
      <div class="row">
        <span>Total cliente</span>
        <b>${money(total)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Coste estimado</span>
        <b>${money(coste)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Beneficio estimado</span>
        <b>${money(beneficio)}</b>
      </div>
    `;
  };
$('#orderType').onchange = () => {
  const tipo = $('#orderType').value;
  const ayuda = $('#tipoPedidoAyuda');
  const personalizacion = $('#personalizacionPedido');
  const diseno = $('#designPedidoField');
  const designLibre = $('#designLibre');
  const baseStockField = $('#baseStockPedidoField');
  const baseStockSelect = $('#obaseStock');
  const productoNormal = $('#osku');
  const productoDisenoAihxo = $('#oproductoDisenoAihxo');
  const productoPersonalizado = $('#productoPersonalizado');

  if (tipo === 'personalizado') {
    ayuda.textContent = 'Encargo personalizado del cliente. El producto se registra como Producto personalizado y trabajamos sobre la prenda base elegida.';
    personalizacion.style.display = 'block';
    diseno.style.display = 'block';
    designLibre.style.display = 'block';
    baseStockField.style.display = 'block';

    productoPersonalizado.style.display = 'block';
    productoNormal.style.display = 'none';
    productoDisenoAihxo.style.display = 'none';
    productoNormal.value = '';
    productoDisenoAihxo.value = '';
    $('#oprice').value = 0;
  }

  if (tipo === 'diseno_aihxo') {
    ayuda.textContent = 'Pedido de un diseño propio de AIHXO.';
    personalizacion.style.display = 'none';
    diseno.style.display = 'none';
    baseStockField.style.display = 'block';

    productoPersonalizado.style.display = 'none';
    productoNormal.style.display = 'none';
    productoDisenoAihxo.style.display = 'block';
    productoNormal.value = '';

    if (!productoDisenoAihxo.value && ownDesignProducts[0]) {
      productoDisenoAihxo.value = ownDesignProducts[0].id;
    }
    const selected = ownDesignProducts.find(
      x => String(x.id) === String(productoDisenoAihxo.value)
    );
    if (selected) $('#oprice').value = Number(selected.sale_price || 0);
  }

  if (tipo === 'catalogo') {
    ayuda.textContent = 'Venta directa de un producto del catálogo.';
    personalizacion.style.display = 'none';
    diseno.style.display = 'none';
    baseStockField.style.display = 'none';
    baseStockSelect.value = '';

    productoPersonalizado.style.display = 'none';
    productoNormal.style.display = 'block';
    productoDisenoAihxo.style.display = 'none';
    productoDisenoAihxo.value = '';

    if (!productoNormal.value && catalogProducts[0]) productoNormal.value = catalogProducts[0].id;
    actualizarPedido();
  }

  actualizarResumenPedido();
};

  $('#nuevaPrendaPedidoBtn').onclick = () => {
    const box = $('#nuevaPrendaPedidoBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  };

  $('#cancelarNuevaPrendaPedido').onclick = () => {
    $('#nuevaPrendaPedidoBox').style.display = 'none';
  };

  $('#guardarNuevaPrendaPedido').onclick = async () => {
    const proveedor = String($('#npProveedor').value || '').trim();
    const modelo = String($('#npModelo').value || '').trim();
    const tipo = String($('#npTipo').value || 'Camiseta').trim();
    const publico = String($('#npPublico').value || 'Unisex').trim();
    const color = String($('#npColor').value || '').trim();
    const talla = String($('#npTalla').value || '').trim();
    const cantidad = Number($('#npCantidad').value || 0);
    const coste = Number($('#npCoste').value || 0);
    const btn = $('#guardarNuevaPrendaPedido');

    if (!proveedor || !modelo || !color || !talla) {
      toast('Completa proveedor, modelo, color y talla');
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      toast('Introduce al menos 1 unidad');
      return;
    }
    if (coste < 0) {
      toast('El coste no es válido');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      let garmentId = null;

      const { data: existentes, error: garmentSearchError } = await supabaseClient
        .from('garments')
        .select('id,sizes,colors')
        .ilike('manufacturer', proveedor)
        .ilike('model', modelo)
        .limit(1);

      if (garmentSearchError) throw garmentSearchError;

      if (existentes?.length) {
        garmentId = existentes[0].id;

        const sizes = [...new Set([...(Array.isArray(existentes[0].sizes) ? existentes[0].sizes : []), talla])];
        const colors = [...new Set([...(Array.isArray(existentes[0].colors) ? existentes[0].colors : []), color])];

        await supabaseClient
          .from('garments')
          .update({sizes, colors, active:true, updated_at:new Date().toISOString()})
          .eq('id', garmentId);
      } else {
        const { data: nuevaGarment, error: garmentInsertError } = await supabaseClient
          .from('garments')
          .insert({
            manufacturer: proveedor,
            model: modelo,
            garment_type: tipo,
            audience: publico,
            sizes: [talla],
            colors: [color],
            active: true
          })
          .select('id')
          .single();

        if (garmentInsertError) throw garmentInsertError;
        garmentId = nuevaGarment.id;
      }

      const { data: nueva, error: stockInsertError } = await supabaseClient
        .from('base_stock_items')
        .insert({
          garment_id: garmentId,
          garment_type: tipo,
          supplier: proveedor,
          supplier_model: modelo,
          audience: publico,
          color,
          size: talla,
          quantity: cantidad,
          min_stock: 3,
          unit_cost: coste,
          notes: 'Alta rápida desde nuevo pedido'
        })
        .select()
        .single();

      if (stockInsertError) throw stockInsertError;

      if (cantidad > 0) {
        await supabaseClient
          .from('base_stock_movements')
          .insert({
            item_id: nueva.id,
            movement_type: 'entrada',
            quantity_delta: cantidad,
            previous_quantity: 0,
            new_quantity: cantidad,
            reason: 'Alta rápida desde nuevo pedido'
          });
      }

      baseStockItems.push(nueva);
      renderBaseStockOptions(nueva.id);
      $('#nuevaPrendaPedidoBox').style.display = 'none';
      actualizarResumenPedido();
      toast('Prenda base creada y seleccionada');
    } catch (err) {
      console.error(err);
      toast(err?.code === '23505' ? 'Esa prenda, color y talla ya existen en stock' : 'No se pudo crear la prenda base');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar y seleccionar';
    }
  };
  $('#osku').onchange = () => {
  actualizarPedido();
  $('#orderType').onchange();
};

  $('#oproductoDisenoAihxo').onchange = () => {
    const selected = ownDesignProducts.find(
      x => String(x.id) === String($('#oproductoDisenoAihxo').value)
    );
    if (selected) $('#oprice').value = Number(selected.sale_price || 0);
    actualizarResumenPedido();
  };

  $('#opersonalization').onchange = actualizarPedido;
  $('#oqty').oninput = actualizarResumenPedido;
  $('#oprice').oninput = actualizarResumenPedido;
  $('#oshipping').oninput = actualizarResumenPedido;
  $('#obaseStock').onchange = actualizarResumenPedido;

  $('#of').onsubmit = async function(e) {
    e.preventDefault();

    if (e.target.dataset.saving === '1') return;

    const submitBtn = e.submitter || e.target.querySelector('button.primary');
    e.target.dataset.saving = '1';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando…';
    }

    const f = new FormData(e.target);
    const tipoPedido = String(f.get('order_type') || '');
    const qty = Number(f.get('qty') || 1);
    const price = Number(f.get('price') || 0);
    const shipping = Number(f.get('shipping') || 0);
    const baseStockId = String(f.get('base_stock_item_id') || '');

    try {
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error('La cantidad no es válida');
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error('El precio no es válido');
      }
      if (!Number.isFinite(shipping) || shipping < 0) {
        throw new Error('El envío no es válido');
      }

      const p = tipoPedido === 'catalogo'
        ? catalogProducts.find(x => String(x.id) === String(f.get('sku')))
        : null;

      const disenoSeleccionado = tipoPedido === 'diseno_aihxo'
        ? ownDesignProducts.find(
            d => String(d.id) === String(f.get('producto_diseno_aihxo'))
          )
        : null;

      if (tipoPedido === 'catalogo' && !p) {
        throw new Error('Selecciona un producto de catálogo');
      }

      if (tipoPedido === 'diseno_aihxo' && !disenoSeleccionado) {
        throw new Error('Selecciona un diseño AIHXO');
      }

      if ((tipoPedido === 'personalizado' || tipoPedido === 'diseno_aihxo') && !baseStockId) {
        throw new Error('Selecciona la prenda base que vas a utilizar');
      }

      const tipoPersonalizacion =
        tipoPedido === 'personalizado'
          ? String(f.get('personalization') || '1')
          : '';

      const nombreDiseno =
        tipoPedido === 'diseno_aihxo'
          ? String(disenoSeleccionado?.model || '')
          : tipoPedido === 'personalizado'
            ? String(f.get('design') || '')
            : '';

      const detalleDiseno = [
        nombreDiseno ? 'Diseño: ' + nombreDiseno : '',
        tipoPedido === 'personalizado'
          ? 'Personalización: ' + tipoPersonalizacion + ' impresión' + (tipoPersonalizacion === '2' ? 'es' : '')
          : '',
        tipoPedido === 'personalizado' && f.get('position1')
          ? 'Ubicación 1: ' + String(f.get('position1'))
          : '',
        tipoPedido === 'personalizado' && tipoPersonalizacion === '2' && f.get('position2')
          ? 'Ubicación 2: ' + String(f.get('position2'))
          : '',
        f.get('notes') ? 'Notas: ' + String(f.get('notes')) : ''
      ].filter(Boolean).join(' | ');

      const customerName = String(f.get('customer') || '').trim();
      if (!customerName) throw new Error('Indica el cliente');

      const customer = customers.find(
        x => String(x.name || '').trim().toLowerCase() === customerName.toLowerCase()
      );

      const requestId =
        e.target.dataset.requestId ||
        (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(16).slice(2));

      e.target.dataset.requestId = requestId;

      const printZones = [];
      if (tipoPedido === 'personalizado' && f.get('position1')) {
        printZones.push(String(f.get('position1')).trim());
      }
      if (tipoPedido === 'personalizado' && tipoPersonalizacion === '2' && f.get('position2')) {
        printZones.push(String(f.get('position2')).trim());
      }

      const orderPayload = {
        order_type: tipoPedido,
        customer_id: customer?.id || null,
        customer_name: customerName,
        contact: String(f.get('contact') || '').trim(),
        shipping,
        design: detalleDiseno,
        print_zones: printZones,
        estimated_costs: {}
      };

      const lines = [{
        item_id:
          tipoPedido === 'catalogo'
            ? null
            : baseStockId,
        product_id:
          tipoPedido === 'catalogo'
            ? p.id
            : tipoPedido === 'diseno_aihxo'
              ? disenoSeleccionado.id
              : null,
        quantity: qty,
        unit_price: price
      }];

      const { data: createdOrder, error: createError } = await supabaseClient.rpc(
        'create_order_atomic',
        {
          p_request_id: requestId,
          p_order: orderPayload,
          p_lines: lines
        }
      );

      if (createError) throw createError;
      if (!createdOrder?.id) throw new Error('No se recibió el pedido creado');

      const orderId = createdOrder.id;
      const frontFile = f.get('design_front');
      const backFile = f.get('design_back');

      async function subirImagenPedido(file, side) {
        if (!(file instanceof File) || !file.size) return null;

        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          throw new Error('Formato de imagen no válido');
        }
        if (file.size > 6 * 1024 * 1024) {
          throw new Error('La imagen supera los 6 MB');
        }

        const extension =
          file.type === 'image/png' ? 'png' :
          file.type === 'image/webp' ? 'webp' : 'jpg';

        const path = orderId + '/' + side + '-' + Date.now() + '.' + extension;

        const { error } = await supabaseClient.storage
          .from('order-designs')
          .upload(path, file, {
            contentType: file.type,
            upsert: false
          });

        if (error) throw error;
        return path;
      }

      try {
        const frontPath = await subirImagenPedido(frontFile, 'front');
        const backPath = await subirImagenPedido(backFile, 'back');

        if (frontPath || backPath) {
          const imagenes = {};
          if (frontPath) imagenes.design_front_path = frontPath;
          if (backPath) imagenes.design_back_path = backPath;

          const { error: imageUpdateError } = await supabaseClient
            .from('orders')
            .update(imagenes)
            .eq('id', orderId);

          if (imageUpdateError) throw imageUpdateError;
        }
      } catch (imageError) {
        console.error(imageError);
        toast('Pedido guardado. Revisa las imágenes del diseño');
      }

      delete e.target.dataset.requestId;
      closeDrawer();
      await loadAll();
      setView('orders');
      toast('Pedido guardado correctamente');
    } catch (err) {
      console.error(err);
      toast(err?.message || 'No se pudo guardar el pedido');
    } finally {
      e.target.dataset.saving = '0';
      if (submitBtn && document.body.contains(submitBtn)) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar pedido';
      }
    }
  };

  $('#orderType').onchange();
  actualizarResumenPedido();
};

// Asegura que cualquier llamada antigua a orderForm use este formulario nuevo.
try { orderForm = window.orderForm; } catch (_) {}

window.drawOrders = function() {
  const q = ($('#oq')?.value || '').toLowerCase();

  const lista = orders.filter(o =>
    (
      (o.order_number || '') + ' ' +
      (o.customer_name || '') + ' ' +
      (o.product_name || '')
    ).toLowerCase().includes(q)
  );

  $('#orderTable').innerHTML = `
    <div style="display:grid;gap:14px;margin-top:14px;">
      ${lista.map(o => `
        <div class="card" style="padding:16px;">
          
          <div class="row">
            <div>
              <div class="muted" style="font-size:12px;">PEDIDO</div>
              <b style="font-size:18px;">
                ${esc(o.order_number || '')}
              </b>
            </div>

            <select
              onchange="status('${o.id}',this.value)"
              style="max-width:150px;"
            >
              ${[
               'Pendiente',
'En producción',
'Enviado',
'Entregado',
'Cancelado'
              ].map(s => `
                <option ${o.status === s ? 'selected' : ''}>
                  ${s}
                </option>
              `).join('')}
            </select>
          </div>

          <div style="margin-top:14px;">
            <div class="muted">Cliente</div>
            <b>${esc(o.customer_name || '')}</b>
            ${o.contact ? `
              <div class="muted">
                ${esc(o.contact)}
              </div>
            ` : ''}
          </div>

          <div style="margin-top:14px;">
            <div class="muted">Producto</div>
            <b>${esc(o.product_name || '')}</b>
            <div class="muted">
              ${esc(o.size || '')} · ${esc(o.color || '')}
            </div>
          </div>

          <div class="row" style="margin-top:14px;">
            <span>Total</span>
            <b style="font-size:18px;">
              ${money(o.total || 0)}
            </b>
          </div>

          <button
            class="secondary"
            style="width:100%;margin-top:14px;"
            onclick="verDetallePedido('${o.id}')"
          >
            Ver detalle
          </button>

        </div>
      `).join('')}
    </div>
  `;
};

window.verDetallePedido = function(id) {
  const o = orders.find(x => x.id === id);

  if (!o) {
    toast('Pedido no encontrado');
    return;
  }

  const beneficio =
    Number(o.total || 0) -
    Number(o.product_cost || 0);

  $('#drawer').classList.remove('hidden');

  $('#drawerBody').innerHTML = `
    <h2>Pedido ${esc(o.order_number || '')}</h2>

    <div class="card" style="padding:16px;margin-bottom:16px;">
      <div class="row">
        <span>Cliente</span>
        <b>${esc(o.customer_name || '')}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Contacto</span>
        <b>${esc(o.contact || '-')}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Producto</span>
        <b>${esc(o.product_name || '')}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Talla / Color</span>
        <b>${esc(o.size || '')} · ${esc(o.color || '')}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Cantidad</span>
        <b>${o.quantity || 0}</b>
      </div>
    </div>

    <div class="card" style="padding:16px;margin-bottom:16px;">
      <h3 style="margin-top:0;">Ficha de producción</h3>

      <div style="white-space:pre-wrap;line-height:1.6;">
        ${esc(o.design || 'Sin instrucciones de diseño')}
      </div>
    </div>
<div class="card" style="padding:16px;margin-bottom:16px;">
  <h3 style="margin-top:0;">Imágenes del diseño</h3>

  <div id="pedidoImagenesDiseno">
    <div class="muted">Cargando imágenes...</div>
  </div>
</div>
    <div class="card" style="padding:16px;">
      <div class="row">
        <span>Precio unitario</span>
        <b>${money(o.unit_price || 0)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Envío</span>
        <b>${money(o.shipping || 0)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Total cliente</span>
        <b>${money(o.total || 0)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Coste estimado</span>
        <b>${money(o.product_cost || 0)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Beneficio estimado</span>
        <b>${money(beneficio)}</b>
      </div>
    </div>

    <div class="card" style="padding:16px;margin-top:16px;">
      <h3 style="margin-top:0;">Cobros</h3>

      <div class="row">
        <span>Cobrado</span>
        <b>${money(o.amount_paid || 0)} / ${money(o.total || 0)}</b>
      </div>

      <div class="row" style="margin-top:8px;">
        <span>Estado</span>
        <b>${esc(o.payment_status || 'Pendiente')}</b>
      </div>

      <div class="formgrid" style="margin-top:14px;">
        <div class="field">
          <label>Importe</label>
          <input id="paymentAmount-${o.id}" type="number" step=".01" placeholder="Ej. 20.00">
        </div>
        <div class="field">
          <label>Método</label>
          <select id="paymentMethod-${o.id}">
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
            <option value="PayPal">PayPal</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Bizum">Bizum</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>Nota / motivo de devolución</label>
        <input id="paymentNote-${o.id}" placeholder="Opcional en cobros; obligatorio si es devolución">
      </div>

      <button type="button" class="primary" id="paymentBtn-${o.id}" style="width:100%;margin-top:8px;">
        Registrar cobro
      </button>

      <div id="paymentHistory-${o.id}" style="margin-top:14px;">
        <div class="muted">Cargando historial…</div>
      </div>
    </div>
  `;

(async () => {
  const history = document.getElementById('paymentHistory-' + o.id);
  const btn = document.getElementById('paymentBtn-' + o.id);

  const cargarCobros = async () => {
    if (!history) return;
    const { data, error } = await supabaseClient
      .from('order_payments')
      .select('*')
      .eq('order_id', o.id)
      .order('paid_at', { ascending: false });

    if (error) {
      console.error(error);
      history.innerHTML = '<div class="muted">No se pudo cargar el historial.</div>';
      return;
    }

    const pagos = data || [];
    history.innerHTML = pagos.length
      ? pagos.map(p => {
          const signo = Number(p.amount || 0) < 0 ? 'Devolución' : 'Cobro';
          const fecha = p.paid_at ? new Date(p.paid_at).toLocaleString('es-ES') : '';
          return '<div class="statline">' +
            '<span><b>' + signo + '</b><br><span class="muted">' +
            esc(p.method || '') + (fecha ? ' · ' + esc(fecha) : '') +
            (p.note ? '<br>' + esc(p.note) : '') +
            '</span></span><b>' + money(p.amount || 0) + '</b></div>';
        }).join('')
      : '<div class="muted">Todavía no hay movimientos de cobro.</div>';
  };

  if (btn) {
    btn.onclick = async () => {
      const amount = Number(document.getElementById('paymentAmount-' + o.id)?.value || 0);
      const method = String(document.getElementById('paymentMethod-' + o.id)?.value || '').trim();
      const note = String(document.getElementById('paymentNote-' + o.id)?.value || '').trim();

      if (!Number.isFinite(amount) || amount === 0) {
        toast('Introduce un importe distinto de 0');
        return;
      }
      if (amount < 0 && !note) {
        toast('Indica el motivo de la devolución');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Guardando…';

      try {
        const paymentId = crypto?.randomUUID
          ? crypto.randomUUID()
          : String(Date.now()) + '-' + Math.random().toString(16).slice(2);

        const { data, error } = await supabaseClient.rpc('record_order_payment', {
          p_id: paymentId,
          p_order_id: o.id,
          p_amount: amount,
          p_method: method,
          p_note: note,
          p_paid_at: new Date().toISOString()
        });

        if (error) throw error;

        Object.assign(o, data || {});
        toast(amount < 0 ? 'Devolución registrada' : 'Cobro registrado');
        window.verDetallePedido(o.id);
      } catch (err) {
        console.error(err);
        toast(err?.message || 'No se pudo registrar el cobro');
      } finally {
        if (document.body.contains(btn)) {
          btn.disabled = false;
          btn.textContent = 'Registrar cobro';
        }
      }
    };
  }

  await cargarCobros();
})();

(async () => {
  const contenedor = document.getElementById('pedidoImagenesDiseno');
  if (!contenedor) return;

  const crearUrl = async (path) => {
    if (!path) return null;

    const { data, error } = await supabaseClient.storage
      .from('order-designs')
      .createSignedUrl(path, 3600);

    if (error) {
      console.error(error);
      return null;
    }

    return data?.signedUrl || null;
  };

  const [frontUrl, backUrl] = await Promise.all([
    crearUrl(o.design_front_path),
    crearUrl(o.design_back_path)
  ]);

  contenedor.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">

      <div class="card" style="padding:12px;">
        <b>DELANTERO</b>
        ${
          frontUrl
            ? `<img src="${frontUrl}" style="width:100%;margin-top:10px;border-radius:8px;object-fit:contain;max-height:220px;">`
            : `<div class="muted" style="margin-top:10px;">Sin imagen</div>`
        }
        <input
  type="file"
  id="cambiarFront-${o.id}"
  accept="image/png,image/jpeg,image/webp"
  style="display:none;"
>

<button
  type="button"
  class="secondary"
  style="margin-top:10px;"
  onclick="document.getElementById('cambiarFront-${o.id}').click()"
>
  Cambiar imagen
</button>
      </div>

      <div class="card" style="padding:12px;">
        <b>TRASERO</b>
        ${
          backUrl
            ? `<img src="${backUrl}" style="width:100%;margin-top:10px;border-radius:8px;object-fit:contain;max-height:220px;">`
            : `<div class="muted" style="margin-top:10px;">Sin imagen</div>`
        }
        <input
  type="file"
  id="cambiarBack-${o.id}"
  accept="image/png,image/jpeg,image/webp"
  style="display:none;"
>

<button
  type="button"
  class="secondary"
  style="margin-top:10px;"
  onclick="document.getElementById('cambiarBack-${o.id}').click()"
>
  Cambiar imagen
</button>
      </div>

    </div>
  `;
 const inputFront = document.getElementById(`cambiarFront-${o.id}`);

if (inputFront) {
  inputFront.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast('Formato no válido');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast('La imagen supera los 6 MB');
      return;
    }

    const ext =
      file.type === 'image/png' ? 'png' :
      file.type === 'image/webp' ? 'webp' : 'jpg';

    const nuevoPath = `${o.id}/front-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('order-designs')
      .upload(nuevoPath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      toast('No se pudo subir la nueva imagen');
      return;
    }

    const anteriorPath = o.design_front_path;

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ design_front_path: nuevoPath })
      .eq('id', o.id);

    if (updateError) {
      console.error(updateError);

      await supabaseClient.storage
        .from('order-designs')
        .remove([nuevoPath]);

      toast('No se pudo actualizar el pedido');
      return;
    }

    if (anteriorPath) {
      await supabaseClient.storage
        .from('order-designs')
        .remove([anteriorPath]);
    }

    o.design_front_path = nuevoPath;

    toast('Imagen delantera actualizada');
    window.verDetallePedido(o.id);
  });
}
const inputBack = document.getElementById(`cambiarBack-${o.id}`);

if (inputBack) {
  inputBack.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast('Formato no válido');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      toast('La imagen supera los 6 MB');
      return;
    }

    const ext =
      file.type === 'image/png' ? 'png' :
      file.type === 'image/webp' ? 'webp' : 'jpg';

    const nuevoPath = `${o.id}/back-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('order-designs')
      .upload(nuevoPath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error(uploadError);
      toast('No se pudo subir la nueva imagen');
      return;
    }

    const anteriorPath = o.design_back_path;

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ design_back_path: nuevoPath })
      .eq('id', o.id);

    if (updateError) {
      console.error(updateError);

      await supabaseClient.storage
        .from('order-designs')
        .remove([nuevoPath]);

      toast('No se pudo actualizar el pedido');
      return;
    }

    if (anteriorPath) {
      await supabaseClient.storage
        .from('order-designs')
        .remove([anteriorPath]);
    }

    o.design_back_path = nuevoPath;

    toast('Imagen trasera actualizada');
    window.verDetallePedido(o.id);
  });
}
})(); 
 };
auth();
