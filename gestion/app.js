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
function showApp(session){document.body.innerHTML=`<div id="app"><aside class="sidebar"><div class="brand"><div class="brandmark">AIHXO</div><small>GESTIÓN ONLINE</small></div><nav id="nav"><button data-view="dashboard">⌂ <span>Inicio</span></button><button data-view="orders">▣ <span>Pedidos</span></button><button type="button" onclick="abrirNuevoDisenoPropio()">✦ <span>Nuevo diseño propio</span></button><button data-view="products">◇ <span>Productos</span></button><button data-view="stock">□ <span>Stock</span></button><button data-view="customers">♙ <span>Clientes</span></button><button data-view="expenses">€ <span>Gastos</span></button><button data-view="reports">▥ <span>Informes</span></button></nav><div class="sidebar-foot">${session.user.email}<br><button class="secondary" style="margin-top:8px" id="logout">Cerrar sesión</button></div></aside><div class="menu-overlay" id="menuOverlay"></div><main><header class="topbar"><button class="hamb" id="hamb">☰</button><h1 id="title">Inicio</h1><button class="primary small" id="quickOrder">＋ Pedido</button></header><div id="view"></div></main></div><div id="drawer" class="drawer hidden"><div class="drawer-card"><button class="x" id="closeDrawer">×</button><div id="drawerBody"></div></div></div><div id="toast"></div>`;document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{setView(b.dataset.view);closeMobileMenu()});$('#hamb').setAttribute('aria-label','Abrir menú');$('#hamb').onclick=()=>toggleMobileMenu();$('#menuOverlay').onclick=()=>closeMobileMenu();$('#logout').onclick=()=>supabaseClient.auth.signOut();$('#quickOrder').onclick=orderForm;$('#closeDrawer').onclick=closeDrawer;loadAll().then(()=>setView('dashboard'))}
function toggleMobileMenu(){document.querySelector('.sidebar')?.classList.toggle('open');document.querySelector('#menuOverlay')?.classList.toggle('open')}function closeMobileMenu(){document.querySelector('.sidebar')?.classList.remove('open');document.querySelector('#menuOverlay')?.classList.remove('open')}function setView(v){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));const titles={dashboard:'Inicio',orders:'Pedidos',products:'Productos',stock:'Stock',customers:'Clientes',expenses:'Gastos',reports:'Informes'};const views={dashboard,orders:ordersView,products:productsView,stock,customers:customersView,expenses:expensesView,reports};$('#title').textContent=titles[v]||'AIHXO';const render=views[v];if(typeof render==='function'){render($('#view'));closeMobileMenu()}else{console.error('Vista no disponible:',v);toast('No se pudo abrir esta sección')}}
function dashboard(c){const sales=orders.reduce((a,o)=>a+ +o.total,0),costs=orders.reduce((a,o)=>a+ +o.product_cost,0),exp=expenses.reduce((a,e)=>a+ +e.amount,0),units=orders.reduce((a,o)=>a+o.quantity,0),stock=products.reduce((a,p)=>a+p.stock,0),profit=sales-costs-exp,low=products.filter(p=>p.stock<=3);c.innerHTML=`<div class="page"><div class="grid kpis">${kpi('Ventas',money(sales),orders.length+' pedidos')}${kpi('Pedidos',orders.length,'online')}${kpi('Unidades',units,'vendidas')}${kpi('Beneficio',money(profit),sales?((profit/sales)*100).toFixed(1)+'% margen':'')}${kpi('Stock',stock,'unidades')}</div><div class="grid two"><div class="card"><div class="section"><h2>Pedidos recientes</h2><button class="secondary" onclick="setView('orders')">Ver todos</button></div>${orders.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>${orders.slice(0,7).map(o=>`<tr><td><b>${o.order_number}</b></td><td>${esc(o.customer_name)}</td><td>${money(o.total)}</td><td>${o.status}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay pedidos.</div>'}</div><div class="card"><div class="section"><h2>Alertas de stock</h2></div>${low.length?low.slice(0,8).map(p=>`<div class="statline"><span>${esc(p.model)} · ${esc(p.size)} · ${esc(p.color)}</span><b class="red">${p.stock}</b></div>`).join(''):'<div class="empty">Stock correcto.</div>'}</div></div></div>`}
function ordersView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Pedidos</h2><div class="muted">${orders.length} pedidos</div></div><button class="primary" onclick="orderForm()">＋ Nuevo pedido</button></div><div class="card"><input class="search" id="oq" placeholder="Buscar..." oninput="drawOrders()"><div id="orderTable"></div></div></div>`;drawOrders()}
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
function orderForm(){$('#drawer').classList.remove('hidden');$('#drawerBody').innerHTML=`<h2>Nuevo pedido</h2><form class="form" id="of"><div class="formgrid"><div class="field"><label>Cliente</label><input name="customer" required></div><div class="field"><label>Contacto</label><input name="contact"></div></div><div class="field"><label>Producto</label><select name="sku" id="osku">${products.map(p=>`<option value="${p.id}">${esc(p.model)} · ${esc(p.size)} · ${esc(p.color)} — ${money(p.sale_price)}</option>`).join('')}</select></div><div class="formgrid"><div class="field"><label>Diseño</label><input name="design" placeholder="Nombre del diseño"></div><div class="field"><label>Cantidad</label><input name="qty" type="number" min="1" value="1"></div></div><div class="formgrid"><div class="field"><label>Precio unitario</label><input name="price" id="oprice" type="number" step=".01"></div><div class="field"><label>Envío cobrado</label><input name="shipping" type="number" step=".01" value="0"></div></div><button class="primary">Guardar pedido</button></form>`;$('#oprice').value=products[0]?.sale_price||0;$('#osku').onchange=e=>$('#oprice').value=products.find(p=>p.id===e.target.value)?.sale_price||0;$('#of').onsubmit=createOrder}
async function createOrder(e){e.preventDefault();const f=new FormData(e.target),p=products.find(x=>x.id===f.get('sku')),qty=+f.get('qty');if(!p||p.stock<qty){toast('Stock insuficiente');return}const price=+f.get('price'),shipping=+f.get('shipping')||0;let customer=customers.find(x=>x.name===f.get('customer'));if(!customer){const r=await supabaseClient.from('customers').insert({name:f.get('customer'),contact:f.get('contact')}).select().single();if(r.error){toast(r.error.message);return}customer=r.data}const order={order_number:'AIHXO-'+String(orders.length+1).padStart(4,'0'),customer_id:customer.id,customer_name:customer.name,contact:f.get('contact'),product_id:p.id,product_name:p.model,size:p.size,color:p.color,design:f.get('design'),quantity:qty,unit_price:price,shipping,total:qty*price+shipping,product_cost:qty*cost(p),status:'Pendiente'};const r=await supabaseClient.from('orders').insert(order);if(r.error){toast(r.error.message);return}await supabaseClient.from('products').update({stock:p.stock-qty}).eq('id',p.id);closeDrawer();await loadAll();setView('orders');toast('Pedido guardado en Supabase')}
function productsView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Productos</h2><div class="muted">${products.length} referencias</div></div><button class="primary" onclick="productForm()">＋ Producto</button></div><div class="grid three">${products.map(p=>`<div class="card"><div class="thumb">${p.category==='Bolso'?'👜':'👕'}</div><b>${esc(p.model)}</b><div class="muted">${esc(p.size||'')} · ${esc(p.color||'')} · ${p.sku}</div><div class="row" style="margin-top:12px"><span>Coste <b>${money(cost(p))}</b></span><span>Venta <b>${money(p.sale_price)}</b></span></div><div class="row" style="margin-top:8px"><span>Stock</span><b class="${p.stock<=3?'red':'green'}">${p.stock}</b></div><div class="actions" style="margin-top:10px"><button class="secondary" onclick="productForm('${p.id}')">Editar</button><button class="secondary" onclick="addStock('${p.id}')">＋ Stock</button></div></div>`).join('')}</div></div>`}
function productForm(id){
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
   category:f.get('category'),
   model:f.get('model'),
   size:f.get('size'),
   color:f.get('color'),

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
window.orderForm = function() {
  $('#drawer').classList.remove('hidden');

  $('#drawerBody').innerHTML = `
    <h2 id="tituloPedido">Nuevo pedido</h2>
<div id="tipoPedido" class="muted" style="margin-bottom:18px;font-weight:700;"></div>

    <form class="form" id="of">

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

      <div class="field">
        <label>Producto</label>
        <select name="sku" id="osku">
          ${products.map(p => `
            <option value="${p.id}">
              ${esc(p.model)} · ${esc(p.size)} · ${esc(p.color)}
            </option>
          `).join('')}
        </select>
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
          placeholder="Nombre o descripción del diseño"
        >
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

 const actualizarPedido = () => {
  const p = products.find(
    x => x.id === $('#osku').value
  );

  if (!p) return;

  const bloquePersonalizacion =
    document.getElementById('personalizacionPedido');

  const tienePrecioUno =
    Number(p.price_one_print || 0) > 0;

  const tienePrecioDos =
    Number(p.price_two_print || 0) > 0;

  const esPersonalizable =
    tienePrecioUno || tienePrecioDos;
  const tituloPedido = document.getElementById('tituloPedido');
const tipoPedido = document.getElementById('tipoPedido');

if (tituloPedido) {
  tituloPedido.textContent = esPersonalizable
    ? 'Nuevo pedido personalizado'
    : 'Pedido diseño propio';
}

if (tipoPedido) {
  tipoPedido.textContent = esPersonalizable
    ? 'PERSONALIZACIÓN AIHXO'
    : 'DISEÑO PROPIO AIHXO';
}

  if (bloquePersonalizacion) {
    bloquePersonalizacion.style.display =
      esPersonalizable ? 'block' : 'none';
  }
const campoDiseno =
  document.getElementById('designPedidoField');

if (campoDiseno) {
  campoDiseno.style.display =
    esPersonalizable ? 'block' : 'none';
}
  const inputDiseno = document.querySelector('input[name="design"]');

if (inputDiseno) {
  if (esPersonalizable) {
    if (inputDiseno.dataset.auto === '1') {
      inputDiseno.value = '';
      inputDiseno.dataset.auto = '0';
    }
  } else {
    inputDiseno.value = p.model || '';
    inputDiseno.dataset.auto = '1';
  }
}
  let precio = Number(p.sale_price || 0);

  if (esPersonalizable) {
    const tipo = $('#opersonalization').value;

    precio =
      tipo === '1'
        ? Number(p.price_one_print || p.sale_price || 0)
        : Number(p.price_two_print || p.sale_price || 0);

    $('#position2Field').style.display =
      tipo === '2' ? 'block' : 'none';
  }

  $('#oprice').value = precio || 0;

  actualizarResumenPedido();
};

  window.actualizarResumenPedido = function() {
    const p = products.find(
      x => x.id === $('#osku').value
    );

    if (!p) return;

    const qty = Number($('#oqty').value || 1);
    const price = Number($('#oprice').value || 0);
    const shipping = Number($('#oshipping').value || 0);

    const total = (qty * price) + shipping;
    const coste = qty * cost(p);
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

  $('#osku').onchange = actualizarPedido;
  $('#opersonalization').onchange = actualizarPedido;
  $('#oqty').oninput = actualizarResumenPedido;
  $('#oprice').oninput = actualizarResumenPedido;
  $('#oshipping').oninput = actualizarResumenPedido;

  $('#of').onsubmit = async function(e) {
    e.preventDefault();

    const f = new FormData(e.target);

    const p = products.find(
      x => x.id === f.get('sku')
    );

    const qty = Number(f.get('qty') || 1);

    if (!p) {
      toast('Producto no válido');
      return;
    }

    if (p.stock < qty) {
      toast('Stock insuficiente');
      return;
    }

    const tienePrecioUno =
  Number(p.price_one_print || 0) > 0;

const tienePrecioDos =
  Number(p.price_two_print || 0) > 0;

const esPersonalizable =
  tienePrecioUno || tienePrecioDos;

const tipo =
  esPersonalizable
    ? f.get('personalization')
    : '';

    const detalleDiseno = [
      f.get('design')
        ? `Diseño: ${f.get('design')}`
        : '',

      esPersonalizable
  ? `Personalización: ${tipo} impresión${tipo === '2' ? 'es' : ''}`
  : '',

      f.get('position1')
        ? `Ubicación 1: ${f.get('position1')}`
        : '',

      tipo === '2' && f.get('position2')
        ? `Ubicación 2: ${f.get('position2')}`
        : '',

      f.get('notes')
        ? `Notas: ${f.get('notes')}`
        : ''
    ]
    .filter(Boolean)
    .join(' | ');

    const price = Number(f.get('price') || 0);
    const shipping = Number(f.get('shipping') || 0);

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

    const order = {
      order_number:
        'AIHXO-' +
        String(orders.length + 1).padStart(4, '0'),

      customer_id: customer.id,
      customer_name: customer.name,
      contact: f.get('contact'),

      product_id: p.id,
      product_name: p.model,
      size: p.size,
      color: p.color,

      design: detalleDiseno,

      quantity: qty,
      unit_price: price,
      shipping: shipping,
      total: qty * price + shipping,

      product_cost: qty * cost(p),

      status: 'Pendiente'
    };

    const r = await supabaseClient
      .from('orders')
      .insert(order);

    if (r.error) {
      toast(r.error.message);
      return;
    }

    await supabaseClient
      .from('products')
      .update({
        stock: p.stock - qty
      })
      .eq('id', p.id);

    closeDrawer();

    await loadAll();

    setView('orders');

    toast('Pedido personalizado guardado');
  };

  actualizarPedido();
};
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
  `;
};
