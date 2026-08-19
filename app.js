const SUPABASE_URL='https://zoiesxtchnesrilpuqek.supabase.co';
const SUPABASE_KEY='sb_publishable_-DyRFQxtVvvwiPlvkZyUtA_upKb2W7T';
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
window.supabaseClient=supabaseClient;
const ADMINS=['aihxo.camisetas@gmail.com','gracielaoliveros.go@gmail.com'];
const STATUS=['Pendiente','Pagado','En producción','Preparado','Enviado','Entregado','Cancelado'];
let products=[],orders=[],customers=[],expenses=[],designs=[];
const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const cost=p=>Number(p.garment_cost||0)+Number(p.dtf_cost||0)+Number(p.extras_cost||0);
const today=()=>new Date().toISOString().slice(0,10);
function toast(t){const x=$('#toast');if(!x)return;x.textContent=t;x.classList.add('show');clearTimeout(window.__t);window.__t=setTimeout(()=>x.classList.remove('show'),2200)}
function kpi(a,b,s=''){return `<div class="card"><div class="label">${a}</div><div class="kvalue">${b}</div><div class="sub">${s}</div></div>`}
function isAdmin(e){return ADMINS.includes(String(e||'').toLowerCase())}
async function loadAll(){
 const [p,o,c,e,d]=await Promise.all([
  supabaseClient.from('products').select('*').order('model').order('size'),
  supabaseClient.from('orders').select('*').order('created_at',{ascending:false}),
  supabaseClient.from('customers').select('*').order('name'),
  supabaseClient.from('expenses').select('*').order('expense_date',{ascending:false}),
  supabaseClient.from('designs').select('*').order('name')
 ]);
 const err=[p,o,c,e,d].find(r=>r.error);if(err){toast('Error cargando datos');console.error(err.error);return false}
 products=p.data||[];orders=o.data||[];customers=c.data||[];expenses=e.data||[];designs=d.data||[];return true;
}
function showLogin(msg=''){
 document.body.innerHTML=`<div class="login-shell"><div class="card" style="width:min(430px,100%);padding:30px"><div style="font-family:Georgia,serif;font-size:38px;font-weight:900;color:#087cf4">AIHXO</div><div class="muted" style="margin:6px 0 24px">Panel privado de gestión</div><form id="loginForm" class="form"><div class="field"><label>Correo electrónico</label><input id="email" type="email" required value="${esc(ADMINS[0])}"></div><div class="field"><label>Contraseña</label><input id="password" type="password" required minlength="6"></div><button class="primary">Entrar</button><button type="button" class="secondary" id="signup">Crear acceso</button><div id="authMsg" class="muted">${esc(msg)}</div></form></div></div>`;
 $('#loginForm').onsubmit=async e=>{e.preventDefault();const email=$('#email').value.trim().toLowerCase();if(!isAdmin(email))return $('#authMsg').textContent='Este correo no está autorizado.';const r=await supabaseClient.auth.signInWithPassword({email,password:$('#password').value});if(r.error)$('#authMsg').textContent=r.error.message;};
 $('#signup').onclick=async()=>{const email=$('#email').value.trim().toLowerCase(),pass=$('#password').value;if(!isAdmin(email))return $('#authMsg').textContent='Este correo no está autorizado.';if(pass.length<6)return $('#authMsg').textContent='La contraseña debe tener al menos 6 caracteres.';const r=await supabaseClient.auth.signUp({email,password:pass});$('#authMsg').textContent=r.error?r.error.message:(r.data.session?'Cuenta creada.':'Cuenta creada. Revisa el correo.');};
}
function shell(){document.body.innerHTML=`<div id="app"><aside class="sidebar"><div class="brand"><div class="brandmark">AIHXO</div><small>GESTIÓN ONLINE</small></div><nav id="nav"><button data-view="dashboard">⌂ <span>Inicio</span></button><button data-view="orders">▣ <span>Pedidos</span></button><button data-view="products">◇ <span>Productos</span></button><button data-view="stock">□ <span>Stock</span></button><button data-view="designs">✦ <span>Diseños</span></button><button data-view="customers">♙ <span>Clientes</span></button><button data-view="expenses">€ <span>Gastos</span></button><button data-view="reports">▥ <span>Informes</span></button><button data-view="settings">⚙ <span>Configuración</span></button><button data-view="users">👤 <span>Usuarios</span></button></nav><div class="sidebar-foot">Administrador<br><button class="secondary" style="margin-top:8px" id="logout">Cerrar sesión</button></div></aside><div class="menu-overlay" id="menuOverlay"></div><main><header class="topbar"><button class="hamb" id="hamb">☰</button><h1 id="title">Inicio</h1><button class="primary small" id="quickOrder">＋ Pedido</button></header><div id="view"></div></main></div><div id="drawer" class="drawer hidden"><div class="drawer-card"><button class="x" id="closeDrawer">×</button><div id="drawerBody"></div></div></div><div id="toast"></div>`;$('#logout').onclick=()=>supabaseClient.auth.signOut();$('#closeDrawer').onclick=closeDrawer;$('#hamb').onclick=toggleMenu;$('#menuOverlay').onclick=closeMenu;$('#quickOrder').onclick=orderForm;document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>setView(b.dataset.view))}
function closeDrawer(){$('#drawer')?.classList.add('hidden')}function openDrawer(h){$('#drawer').classList.remove('hidden');$('#drawerBody').innerHTML=h}function toggleMenu(){$('.sidebar')?.classList.toggle('open');$('#menuOverlay')?.classList.toggle('open')}function closeMenu(){$('.sidebar')?.classList.remove('open');$('#menuOverlay')?.classList.remove('open')}
const views={dashboard:['Inicio',dashboard],orders:['Pedidos',ordersView],products:['Productos',productsView],stock:['Stock',stockView],designs:['Diseños',designsView],customers:['Clientes',customersView],expenses:['Gastos',expensesView],reports:['Informes',reportsView],settings:['Configuración',settingsView],users:['Usuarios',usersView]};
function setView(v){const x=views[v]||views.dashboard;$('#title').textContent=x[0];document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));closeMenu();x[1]($('#view'));window.scrollTo(0,0)}window.setView=setView;
function dashboard(c){const sales=orders.reduce((a,o)=>a+Number(o.total||0),0),costs=orders.reduce((a,o)=>a+Number(o.product_cost||0),0),exp=expenses.reduce((a,o)=>a+Number(o.amount||0),0),units=orders.reduce((a,o)=>a+Number(o.quantity||0),0),stock=products.reduce((a,o)=>a+Number(o.stock||0),0),profit=sales-costs-exp,low=products.filter(p=>Number(p.stock)<=3);c.innerHTML=`<div class="page"><div class="grid kpis">${kpi('Ventas',money(sales),orders.length+' pedidos')}${kpi('Pedidos',orders.length,'registrados')}${kpi('Unidades',units,'vendidas')}${kpi('Beneficio',money(profit),sales?((profit/sales)*100).toFixed(1)+'% margen':'')}${kpi('Stock',stock,'unidades')}</div><div class="grid two"><div class="card"><div class="section"><h2>Pedidos recientes</h2><button class="secondary" onclick="setView('orders')">Ver todos</button></div>${orders.length?`<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>${orders.slice(0,7).map(o=>`<tr><td><b>${esc(o.order_number)}</b></td><td>${esc(o.customer_name)}</td><td>${money(o.total)}</td><td>${esc(o.status)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay pedidos todavía.</div>'}</div><div class="card"><div class="section"><h2>Alertas de stock</h2><button class="secondary" onclick="setView('stock')">Ver stock</button></div>${low.length?low.slice(0,8).map(p=>`<div class="statline"><span>${esc(p.model)} · ${esc(p.size||'')} · ${esc(p.color||'')}</span><b class="red">${p.stock}</b></div>`).join(''):'<div class="empty">Todo el stock está correcto.</div>'}</div></div></div>`}
function ordersView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Pedidos</h2><div class="muted">${orders.length} pedidos</div></div><button class="primary" onclick="orderForm()">＋ Nuevo pedido</button></div><div class="card"><input class="search" id="oq" placeholder="Buscar…"><div id="orderTable"></div></div></div>`;$('#oq').oninput=drawOrders;drawOrders()}
 function drawOrders(){
  const q=($('#oq')?.value||'').toLowerCase();

  const a=orders.filter(o=>
    [o.order_number,o.customer_name,o.product_name,o.status]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );

  $('#orderTable').innerHTML=a.length
    ? `<div class="table-wrap" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>Foto</th>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            ${a.map(o=>`
              <tr>
                <td>
                  <img
                    class="order-product-photo"
                    data-product-id="${o.product_id}"
                    src=""
                    style="width:50px;height:50px;object-fit:cover;border-radius:8px;display:none"
                  >
                </td>

                <td>${esc(o.order_number)}</td>
                <td>${esc(o.order_date)}</td>
                <td>${esc(o.customer_name)}</td>

                <td>
                  ${esc(o.product_name)}
                  <div class="muted">
                    ${esc(o.size||'')} · ${esc(o.color||'')}
                  </div>
                </td>

                <td>${o.quantity}</td>
                <td>${money(o.total)}</td>

                <td>
                  <select onchange="updateStatus('${o.id}',this.value)">
                    ${STATUS.map(s=>
                      `<option ${s===o.status?'selected':''}>${s}</option>`
                    ).join('')}
                  </select>
                </td>
                <td>
  <button
    class="secondary"
    onclick="orderDetail('${o.id}')">
    👁️ Ver
  </button>
</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`
    : '<div class="empty">No hay pedidos.</div>';

  a.forEach(async o=>{
    const images=await aihxoGetProductImages(o.product_id);
    const img=images.find(x=>x.is_primary)||images[0];

    if(img){
      const el=document.querySelector(
        `.order-product-photo[data-product-id="${o.product_id}"]`
      );

      if(el){
        el.src=img.public_url;
        el.style.display='block';
      }
    }
  });
}
async function updateStatus(id,status){const r=await supabaseClient.from('orders').update({status}).eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();drawOrders();toast('Estado actualizado')}}window.updateStatus=updateStatus;
function orderDetail(id){
  const o=orders.find(x=>String(x.id)===String(id));

  if(!o){
    return toast('Pedido no encontrado');
  }

  const total=Number(o.total||0);
  const productCost=Number(o.product_cost||0);
  const profit=total-productCost;

  openDrawer(`
    <div class="section">
      <div>
        <h2>Pedido ${esc(o.order_number)}</h2>
        <div class="muted">${esc(o.order_date||'')}</div>
      </div>

      <span class="badge">${esc(o.status||'')}</span>
    </div>

    <div id="order-detail-photo"
         style="text-align:center;margin:20px 0">
      <div class="empty">Cargando fotografía...</div>
    </div>

    <div class="grid two">

      <div class="card">
        <h3>👤 Cliente</h3>
        <p><b>${esc(o.customer_name||'')}</b></p>
        <p class="muted">${esc(o.contact||'Sin contacto')}</p>
      </div>

      <div class="card">
        <h3>👕 Producto</h3>
        <p><b>${esc(o.product_name||'')}</b></p>
        <p class="muted">
          Talla: ${esc(o.size||'—')} ·
          Color: ${esc(o.color||'—')}
        </p>
      </div>

      <div class="card">
        <h3>📦 Pedido</h3>
        <p>Cantidad: <b>${o.quantity}</b></p>
        <p>Precio unidad: <b>${money(o.unit_price)}</b></p>
        <p>Envío: <b>${money(o.shipping)}</b></p>
      </div>

      <div class="card">
        <h3>💰 Resultado</h3>
        <p>Total: <b>${money(total)}</b></p>
        <p>Coste: <b>${money(productCost)}</b></p>
        <p>Beneficio: <b>${money(profit)}</b></p>
      </div>

    </div>

    ${
      o.design
      ? `<div class="card" style="margin-top:14px">
          <h3>🎨 Diseño</h3>
          <p>${esc(o.design)}</p>
        </div>`
      : ''
    }
  `);

  aihxoGetProductImages(o.product_id)
    .then(images=>{
      const img=images.find(x=>x.is_primary)||images[0];
      const box=document.querySelector('#order-detail-photo');

      if(!box)return;

      if(img){
        box.innerHTML=`
          <img
            src="${img.public_url}"
            style="width:220px;height:220px;object-fit:cover;border-radius:16px"
          >
        `;
      }else{
        box.innerHTML='<div class="empty">Sin fotografía</div>';
      }
    })
    .catch(()=>{
      const box=document.querySelector('#order-detail-photo');
      if(box)box.innerHTML='<div class="empty">Sin fotografía</div>';
    });
}

window.orderDetail=orderDetail;

window.orderDetail=orderDetail;
function orderForm(){const a=products.filter(p=>Number(p.stock)>0);if(!a.length)return toast('No hay productos con stock');openDrawer(`<h2>Nuevo pedido</h2><form class="form" id="of"><div class="formgrid"><div class="field"><label>Cliente *</label><input name="customer" required></div><div class="field"><label>Contacto</label><input name="contact"></div></div><div class="field"><label>Producto *</label><select name="product_id" id="op">${a.map(p=>`<option value="${p.id}">${esc(p.model)} · ${esc(p.size||'')} · ${esc(p.color||'')} — ${money(p.sale_price)} · stock ${p.stock}</option>`).join('')}</select></div><div class="formgrid"><div class="field"><label>Diseño</label><input name="design"></div><div class="field"><label>Cantidad *</label><input name="quantity" id="oqty" type="number" min="1" value="1" required></div></div><div class="formgrid"><div class="field"><label>Precio unitario</label><input name="unit_price" id="oprice" type="number" min="0" step="0.01" required></div><div class="field"><label>Envío</label><input name="shipping" type="number" min="0" step="0.01" value="0"></div></div><button class="primary">Guardar pedido</button></form>`);const set=()=>{const p=products.find(x=>x.id===$('#op').value);$('#oprice').value=p?.sale_price||0;$('#oqty').max=p?.stock||1};$('#op').onchange=set;set();$('#of').onsubmit=createOrder}
async function createOrder(e){e.preventDefault();const f=new FormData(e.target),p=products.find(x=>x.id===f.get('product_id')),qty=Math.floor(Number(f.get('quantity'))),price=Number(f.get('unit_price')),shipping=Number(f.get('shipping')||0),name=String(f.get('customer')||'').trim();if(!p||qty<1||qty>Number(p.stock))return toast('Stock insuficiente');let c=customers.find(x=>String(x.name||'').trim().toLowerCase()===name.toLowerCase());if(!c){const r=await supabaseClient.from('customers').insert({name,contact:String(f.get('contact')||'').trim()}).select().single();if(r.error)return toast(r.error.message);c=r.data}const d=new Date(),num=`AIHXO-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getTime()).slice(-5)}`;const o={order_number:num,customer_id:c.id,customer_name:c.name,contact:String(f.get('contact')||c.contact||''),product_id:p.id,product_name:p.model,size:p.size||null,color:p.color||null,design:String(f.get('design')||'').trim()||null,quantity:qty,unit_price:price,shipping,total:qty*price+shipping,product_cost:qty*cost(p),status:'Pendiente',order_date:today()};const r=await supabaseClient.from('orders').insert(o);if(r.error)return toast(r.error.message);const s=await supabaseClient.from('products').update({stock:Number(p.stock)-qty}).eq('id',p.id);if(s.error)toast('Pedido guardado; revisa el stock');else toast('Pedido guardado');closeDrawer();await loadAll();setView('orders')}window.orderForm=orderForm;
async function productsView(c){
  c.innerHTML=`<div class="page">
    <div class="section">
      <div>
        <h2>Productos</h2>
        <div class="muted">${products.length} referencias</div>
      </div>
      <button class="primary" onclick="productForm()">＋ Producto</button>
    </div>

    <div class="grid three">
      ${products.map(p=>`
        <div class="card product-card" data-product-id="${p.id}">
          <div class="product-photo" id="photo-${p.id}">
            <div class="thumb">${p.category==='Bolso'?'👜':'👕'}</div>
          </div>

          <b>${esc(p.model)}</b>

          <div class="muted">
            ${esc(p.size||'')} · ${esc(p.color||'')} · ${esc(p.sku)}
          </div>

          <div class="row" style="margin-top:12px">
            <span>Coste <b>${money(cost(p))}</b></span>
            <span>Venta <b>${money(p.sale_price)}</b></span>
          </div>

          <div class="row" style="margin-top:8px">
            <span>Stock</span>
            <b class="${p.stock<=3?'red':'green'}">${p.stock}</b>
          </div>

          <div class="actions" style="margin-top:10px">
            <button class="primary" onclick="aihxoCameraInput('${p.id}')">
             📷 Cámara
            </button>

            <button class="secondary" onclick="aihxoLibraryInput('${p.id}')">
             🖼️ Biblioteca
            </button>
            <button class="secondary" onclick="productGallery('${p.id}')">
              🖼️ Galería
            </button>  

            <button class="secondary" onclick="productForm('${p.id}')">
              Editar
            </button>

            <button class="secondary" onclick="addStock('${p.id}')">
              ＋ Stock
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  </div>`;

  for(const p of products){
    const images=await aihxoGetProductImages(p.id);
    const box=document.getElementById(`photo-${p.id}`);

    if(box && images.length){
      box.innerHTML=`
        <img
          src="${esc(images[0].public_url)}"
          alt="${esc(p.model)}"
          style="width:100%;height:180px;object-fit:cover;border-radius:12px;display:block"
        >
      `;
    }
  }
}
function productForm(id){const p=id?products.find(x=>x.id===id):{sku:'',category:'Camiseta',model:'',size:'M',color:'Blanco',garment_cost:4,dtf_cost:3,extras_cost:.68,sale_price:16.9,stock:0};openDrawer(`<h2>${id?'Editar':'Nuevo'} producto</h2><form class="form" id="pf"><div class="formgrid"><div class="field"><label>SKU *</label><input name="sku" value="${esc(p.sku)}" required ${id?'readonly':''}></div><div class="field"><label>Categoría</label><select name="category"><option ${p.category==='Camiseta'?'selected':''}>Camiseta</option><option ${p.category==='Bolso'?'selected':''}>Bolso</option></select></div></div><div class="field"><label>Modelo *</label><input name="model" value="${esc(p.model)}" required></div><div class="formgrid"><div class="field"><label>Talla</label><input name="size" value="${esc(p.size||'')}"></div><div class="field"><label>Color</label><input name="color" value="${esc(p.color||'')}"></div></div><div class="formgrid"><div class="field"><label>Coste prenda</label><input name="garment_cost" type="number" min="0" step=".01" value="${p.garment_cost}"></div><div class="field"><label>Coste DTF</label><input name="dtf_cost" type="number" min="0" step=".01" value="${p.dtf_cost}"></div></div><div class="formgrid"><div class="field"><label>Extras</label><input name="extras_cost" type="number" min="0" step=".01" value="${p.extras_cost}"></div><div class="field"><label>Precio venta</label><input name="sale_price" type="number" min="0" step=".01" value="${p.sale_price}"></div></div><div class="field"><label>Stock</label><input name="stock" type="number" min="0" value="${p.stock}"></div><button class="primary">Guardar</button></form>`);$('#pf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o={sku:f.get('sku').trim(),category:f.get('category'),model:f.get('model').trim(),size:f.get('size').trim()||null,color:f.get('color').trim()||null,garment_cost:+f.get('garment_cost'),dtf_cost:+f.get('dtf_cost'),extras_cost:+f.get('extras_cost'),sale_price:+f.get('sale_price'),stock:Math.floor(+f.get('stock'))};const r=id?await supabaseClient.from('products').update(o).eq('id',id):await supabaseClient.from('products').insert(o);if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('products');toast('Producto guardado')}}}window.productForm=productForm;
async function productGallery(id){
  const p=products.find(x=>x.id===id);
  if(!p)return;

  const images=await aihxoGetProductImages(id);

  openDrawer(`
    <h2>Fotos · ${esc(p.model)}</h2>

    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="primary" onclick="aihxoPhotoInput('${id}');setTimeout(()=>productGallery('${id}'),1500)">
        📷 Añadir foto
      </button>
    </div>

    ${
      images.length
      ?
      `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        ${images.map(img=>`
          <div class="card" style="padding:8px">

            <img
              src="${esc(img.public_url)}"
              style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px"
            >

            <div style="margin-top:8px">
              ${
                img.is_primary
                ?
                `<span class="green">⭐ Principal</span>`
                :
                `<button
                  class="secondary"
                  onclick="setPrimaryProductImage('${img.id}','${id}')">
                  ⭐ Hacer principal
                </button>`
              }
            </div>

            <button
              class="secondary"
              style="margin-top:8px;width:100%"
              onclick="deleteProductImage('${img.id}','${id}')">
              🗑️ Eliminar
            </button>

          </div>
        `).join('')}
      </div>`
      :
      `<div class="empty">Este producto todavía no tiene fotografías.</div>`
    }
  `);
}

async function setPrimaryProductImage(imageId,productId){
  const images=await aihxoGetProductImages(productId);

  for(const img of images){
    const r=await supabaseClient
      .from('product_images')
      .update({is_primary:img.id===imageId})
      .eq('id',img.id);

    if(r.error){
      toast(r.error.message);
      return;
    }
  }

  toast('Foto principal actualizada');
  await loadAll();
  await productGallery(productId);
  setView('products');
}

async function deleteProductImage(imageId,productId){
  if(!confirm('¿Eliminar esta fotografía?'))return;

  const {data:img,error}=await supabaseClient
    .from('product_images')
    .select('*')
    .eq('id',imageId)
    .single();

  if(error){
    toast(error.message);
    return;
  }

  const storage=await supabaseClient.storage
    .from('product-images')
    .remove([img.storage_path]);

  if(storage.error){
    toast(storage.error.message);
    return;
  }

  const result=await supabaseClient
    .from('product_images')
    .delete()
    .eq('id',imageId);

  if(result.error){
    toast(result.error.message);
    return;
  }

  toast('Fotografía eliminada');
  await loadAll();
  await productGallery(productId);
  setView('products');
}

window.productGallery=productGallery;
window.setPrimaryProductImage=setPrimaryProductImage;
window.deleteProductImage=deleteProductImage;
async function addStock(id){const p=products.find(x=>x.id===id),n=prompt('Unidades a añadir','5');if(!p||n===null)return;const x=Math.floor(+n);if(!x||x<1)return toast('Cantidad no válida');const r=await supabaseClient.from('products').update({stock:p.stock+x}).eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();setView('stock');toast('Stock actualizado')}}window.addStock=addStock;
function stockView(c){const total=products.reduce((a,p)=>a+p.stock,0),value=products.reduce((a,p)=>a+p.stock*cost(p),0),low=products.filter(p=>p.stock<=3);c.innerHTML=`<div class="page"><div class="section"><div><h2>Stock</h2><div class="muted">Control de inventario</div></div><button class="primary" onclick="setView('products')">Gestionar productos</button></div><div class="grid four stock-summary">${kpi('Productos',products.length)}${kpi('Stock total',total)}${kpi('Valor stock',money(value))}${kpi('Stock bajo',low.length)}</div><div class="card"><input class="search" id="sq" placeholder="Buscar producto…"><div id="st" class="table-wrap" style="margin-top:14px"></div></div></div>`;$('#sq').oninput=drawStock;drawStock()}
function drawStock(){
  const q=($('#sq')?.value||'').toLowerCase();
  const a=products.filter(p=>
    [p.sku,p.model,p.size,p.color]
    .join(' ')
    .toLowerCase()
    .includes(q)
  );

  $('#st').innerHTML=a.length
    ? `<table>
        <thead>
          <tr>
            <th>Foto</th>
            <th>SKU</th>
            <th>Producto</th>
            <th>Talla</th>
            <th>Color</th>
            <th>Coste</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${a.map(p=>`
            <tr>
              <td>
                <img
                  class="stock-product-photo"
                  data-product-id="${p.id}"
                  src=""
                  style="width:45px;height:45px;object-fit:cover;border-radius:8px;display:none"
                >
              </td>
              <td>${esc(p.sku)}</td>
              <td>${esc(p.model)}</td>
              <td>${esc(p.size||'—')}</td>
              <td>${esc(p.color||'—')}</td>
              <td>${money(cost(p))}</td>
              <td>
                <b class="${p.stock<=3?'red':'green'}">
                  ${p.stock}
                </b>
              </td>
              <td>
                <button
                  class="secondary"
                  onclick="addStock('${p.id}')">
                  ＋
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`
    : '<div class="empty">No hay coincidencias.</div>';

  a.forEach(async p=>{
    const images=await aihxoGetProductImages(p.id);
    const img=images.find(x=>x.is_primary)||images[0];

    if(img){
      const el=document.querySelector(
        `.stock-product-photo[data-product-id="${p.id}"]`
      );

      if(el){
        el.src=img.public_url;
        el.style.display='block';
      }
    }
  });
}
function customersView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Clientes</h2><div class="muted">${customers.length} clientes</div></div><button class="primary" onclick="customerForm()">＋ Cliente</button></div><div class="card"><input class="search" id="cq" placeholder="Buscar cliente…"><div id="ct" class="table-wrap" style="margin-top:14px"></div></div></div>`;$('#cq').oninput=drawCustomers;drawCustomers()}
function drawCustomers(){const q=($('#cq')?.value||'').toLowerCase(),a=customers.filter(x=>[x.name,x.surname,x.email,x.phone,x.city].join(' ').toLowerCase().includes(q));$('#ct').innerHTML=a.length?`<table><thead><tr><th>Cliente</th><th>Contacto</th><th>Ciudad</th><th>Pedidos</th><th>Facturación</th><th></th></tr></thead><tbody>${a.map(x=>{const os=orders.filter(o=>o.customer_id===x.id);return `<tr><td><b>${esc(x.name)} ${esc(x.surname||'')}</b><div class="muted">${esc(x.email||'')}</div></td><td>${esc(x.phone||x.contact||'—')}</td><td>${esc(x.city||'—')}</td><td>${os.length}</td><td>${money(os.reduce((s,o)=>s+Number(o.total||0),0))}</td><td><button class="secondary" onclick="customerForm('${x.id}')">Editar</button></td></tr>`}).join('')}</tbody></table>`:'<div class="empty">No hay clientes.</div>'}
function customerForm(id){const c=id?customers.find(x=>x.id===id):{};openDrawer(`<h2>${id?'Editar':'Nuevo'} cliente</h2><form class="form" id="cf"><div class="formgrid"><div class="field"><label>Nombre *</label><input name="name" required value="${esc(c.name||'')}"></div><div class="field"><label>Apellidos</label><input name="surname" value="${esc(c.surname||'')}"></div><div class="field"><label>Email</label><input name="email" type="email" value="${esc(c.email||'')}"></div><div class="field"><label>Teléfono</label><input name="phone" value="${esc(c.phone||'')}"></div><div class="field"><label>Dirección</label><input name="address" value="${esc(c.address||'')}"></div><div class="field"><label>Código postal</label><input name="postal_code" value="${esc(c.postal_code||'')}"></div><div class="field"><label>Ciudad</label><input name="city" value="${esc(c.city||'')}"></div><div class="field" style="grid-column:1/-1"><label>Notas</label><textarea name="notes" rows="4">${esc(c.notes||'')}</textarea></div></div><button class="primary">Guardar cliente</button></form>`);$('#cf').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o={name:f.get('name').trim(),surname:f.get('surname').trim()||null,email:f.get('email').trim()||null,phone:f.get('phone').trim()||null,address:f.get('address').trim()||null,postal_code:f.get('postal_code').trim()||null,city:f.get('city').trim()||null,notes:f.get('notes').trim()||null,contact:f.get('phone').trim()||null};const r=id?await supabaseClient.from('customers').update(o).eq('id',id):await supabaseClient.from('customers').insert(o);if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('customers');toast('Cliente guardado')}}}window.customerForm=customerForm;
function expensesView(c){const total=expenses.reduce((a,e)=>a+Number(e.amount||0),0);c.innerHTML=`<div class="page"><div class="section"><div><h2>Gastos</h2><div class="muted">${expenses.length} gastos · ${money(total)}</div></div><button class="primary" onclick="expenseForm()">＋ Gasto</button></div><div class="card">${expenses.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Importe</th><th></th></tr></thead><tbody>${expenses.map(e=>`<tr><td>${esc(e.expense_date)}</td><td>${esc(e.category)}</td><td>${esc(e.description)}</td><td>${money(e.amount)}</td><td><button class="secondary" onclick="deleteExpense('${e.id}')">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No hay gastos.</div>'}</div></div>`}
function expenseForm(){openDrawer(`<h2>Nuevo gasto</h2><form class="form" id="ef"><div class="formgrid"><div class="field"><label>Fecha *</label><input name="expense_date" type="date" value="${today()}" required></div><div class="field"><label>Categoría *</label><select name="category"><option>DTF</option><option>Camisetas</option><option>Bolsos</option><option>Packaging</option><option>Envíos</option><option>Herramientas</option><option>Publicidad</option><option>Otros</option></select></div></div><div class="field"><label>Importe *</label><input name="amount" type="number" min="0" step=".01" required></div><div class="field"><label>Descripción *</label><input name="description" required></div><button class="primary">Guardar gasto</button></form>`);$('#ef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),r=await supabaseClient.from('expenses').insert({expense_date:f.get('expense_date'),category:f.get('category'),amount:+f.get('amount'),description:f.get('description').trim()});if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('expenses');toast('Gasto guardado')}}}window.expenseForm=expenseForm;window.deleteExpense=async id=>{if(!confirm('¿Eliminar este gasto?'))return;const r=await supabaseClient.from('expenses').delete().eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();setView('expenses');toast('Gasto eliminado')}};
function designsView(c){c.innerHTML=`<div class="page"><div class="section"><div><h2>Diseños</h2><div class="muted">${designs.length} diseños</div></div><button class="primary" onclick="designForm()">＋ Diseño</button></div><div class="grid three">${designs.length?designs.map(d=>`<div class="card"><div class="section"><div><b>${esc(d.name)}</b><div class="muted">${esc(d.category||'')}</div></div><span class="${d.active?'green':'red'}">${d.active?'Activo':'Inactivo'}</span></div><div class="row"><span>Coste</span><b>${money(d.cost)}</b></div><div class="actions" style="margin-top:10px"><button class="secondary" onclick="designForm('${d.id}')">Editar</button><button class="secondary" onclick="toggleDesign('${d.id}',${!d.active})">${d.active?'Desactivar':'Activar'}</button></div></div>`).join(''):'<div class="card empty">No hay diseños.</div>'}</div></div>`}
function designForm(id){const d=id?designs.find(x=>x.id===id):{name:'',category:'Camisetas',cost:0,active:true};openDrawer(`<h2>${id?'Editar':'Nuevo'} diseño</h2><form class="form" id="df"><div class="field"><label>Nombre *</label><input name="name" required value="${esc(d.name||'')}"></div><div class="field"><label>Categoría</label><input name="category" value="${esc(d.category||'')}"></div><div class="field"><label>Coste</label><input name="cost" type="number" min="0" step=".01" value="${d.cost||0}"></div><label><input name="active" type="checkbox" ${d.active!==false?'checked':''} style="width:auto"> Activo</label><button class="primary">Guardar diseño</button></form>`);$('#df').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o={name:f.get('name').trim(),category:f.get('category').trim()||null,cost:+f.get('cost'),active:f.get('active')==='on'},r=id?await supabaseClient.from('designs').update(o).eq('id',id):await supabaseClient.from('designs').insert(o);if(r.error)toast(r.error.message);else{closeDrawer();await loadAll();setView('designs');toast('Diseño guardado')}}}window.designForm=designForm;window.toggleDesign=async(id,active)=>{const r=await supabaseClient.from('designs').update({active}).eq('id',id);if(r.error)toast(r.error.message);else{await loadAll();setView('designs');toast('Diseño actualizado')}};
function reportsView(c){const sales=orders.reduce((a,o)=>a+Number(o.total||0),0),costs=orders.reduce((a,o)=>a+Number(o.product_cost||0),0),exp=expenses.reduce((a,o)=>a+Number(o.amount||0),0),stockValue=products.reduce((a,p)=>a+Number(p.stock||0)*cost(p),0);c.innerHTML=`<div class="page"><div class="grid four">${kpi('Ventas',money(sales))}${kpi('Coste productos',money(costs))}${kpi('Gastos',money(exp))}${kpi('Beneficio',money(sales-costs-exp))}</div><div class="grid two"><div class="card"><h2>Inventario</h2><div class="statline"><span>Referencias</span><b>${products.length}</b></div><div class="statline"><span>Unidades</span><b>${products.reduce((a,p)=>a+p.stock,0)}</b></div><div class="statline"><span>Valor a coste</span><b>${money(stockValue)}</b></div></div><div class="card"><h2>Estados</h2>${STATUS.map(s=>`<div class="statline"><span>${s}</span><b>${orders.filter(o=>o.status===s).length}</b></div>`).join('')}</div></div></div>`}
function settingsView(c){c.innerHTML=`<div class="page"><div class="grid two"><div class="card"><h2>Supabase</h2><div class="statline"><span>Conexión</span><b class="green">Activa</b></div><div class="statline"><span>Productos</span><b>${products.length}</b></div><div class="statline"><span>Pedidos</span><b>${orders.length}</b></div><div class="statline"><span>Clientes</span><b>${customers.length}</b></div><div class="statline"><span>Gastos</span><b>${expenses.length}</b></div><div class="statline"><span>Diseños</span><b>${designs.length}</b></div></div><div class="card"><h2>Seguridad</h2><p class="muted">Solo los correos autorizados pueden acceder.</p><button class="primary" onclick="supabaseClient.auth.signOut()">Cerrar sesión</button></div></div></div>`}
function usersView(c){c.innerHTML=`<div class="page"><div class="card">${ADMINS.map(e=>`<div class="user-card-v7"><div class="avatar-v7">${e[0].toUpperCase()}</div><div style="flex:1;min-width:0"><strong>${esc(e)}</strong><div class="muted">Administrador · Acceso completo</div></div><span class="green">● Autorizado</span></div>`).join('')}<div class="empty">El acceso se controla mediante Supabase Auth.</div></div></div>`}
async function start(){const r=await supabaseClient.auth.getSession(),s=r.data.session;if(s){if(isAdmin(s.user.email)){shell();await loadAll();setView('dashboard')}else{await supabaseClient.auth.signOut();showLogin('Cuenta no autorizada')}}else showLogin();supabaseClient.auth.onAuthStateChange(async(_,s)=>{if(s&&isAdmin(s.user.email)){if(!$('#nav'))shell();await loadAll();setView('dashboard')}else if(!s&&!$('#loginForm'))showLogin()})}
start();
