(function(){
const sb=window.supabaseClient;
if(!sb)return;

let suppliers=[],purchases=[],movements=[];

const esc2=s=>String(s??'').replace(/[&<>"']/g,m=>({
'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[m]));

const money2=n=>new Intl.NumberFormat('es-ES',{
style:'currency',currency:'EUR'
}).format(Number(n)||0);

const toast2=t=>window.toast?window.toast(t):alert(t);

async function loadV2(){
 const [s,p,m]=await Promise.all([
  sb.from('suppliers').select('*').order('name'),
  sb.from('purchases').select('*').order('purchase_date',{ascending:false}),
  sb.from('stock_movements').select('*').order('created_at',{ascending:false}).limit(100)
 ]);
 if(s.error||p.error||m.error){
  console.error(s.error||p.error||m.error);
  return;
 }
 suppliers=s.data||[];
 purchases=p.data||[];
 movements=m.data||[];
}

function addNav(){
 const nav=document.querySelector('#nav');
 if(!nav||nav.querySelector('[data-view="suppliers"]'))return;

 nav.insertAdjacentHTML('beforeend',`
 <button data-view="suppliers">🏭 <span>Proveedores</span></button>
 <button data-view="purchases">🛒 <span>Compras</span></button>
 <button data-view="movements">↕ <span>Movimientos</span></button>
 `);

 nav.querySelector('[data-view="suppliers"]').onclick=()=>window.setView('suppliers');
 nav.querySelector('[data-view="purchases"]').onclick=()=>window.setView('purchases');
 nav.querySelector('[data-view="movements"]').onclick=()=>window.setView('movements');
}

const baseSetView=window.setView;

window.setView=function(v){
 if(!['suppliers','purchases','movements'].includes(v))
  return baseSetView(v);

 document.querySelector('#title').textContent={
  suppliers:'Proveedores',
  purchases:'Compras',
  movements:'Movimientos de stock'
 }[v];

 document.querySelectorAll('#nav button')
 .forEach(b=>b.classList.toggle('active',b.dataset.view===v));

 document.querySelector('.sidebar')?.classList.remove('open');
 document.querySelector('#menuOverlay')?.classList.remove('open');

 const c=document.querySelector('#view');

 if(v==='suppliers')suppliersView(c);
 if(v==='purchases')purchasesView(c);
 if(v==='movements')movementsView(c);

 window.scrollTo(0,0);
};

function suppliersView(c){
 c.innerHTML=`
 <div class="page">
  <div class="section">
   <div>
    <h2>Proveedores</h2>
    <div class="muted">${suppliers.length} proveedores</div>
   </div>
   <button class="primary" id="newSupplier">＋ Proveedor</button>
  </div>

  <div class="card">
   <input class="search" id="supQ" placeholder="Buscar proveedor…">
   <div id="supTable" class="table-wrap" style="margin-top:14px"></div>
  </div>
 </div>`;

 document.querySelector('#newSupplier').onclick=()=>supplierForm();
 document.querySelector('#supQ').oninput=drawSuppliers;
 drawSuppliers();
}

function drawSuppliers(){
 const q=(document.querySelector('#supQ')?.value||'').toLowerCase();

 const a=suppliers.filter(x=>
  [x.name,x.email,x.phone,x.city].join(' ').toLowerCase().includes(q)
 );

 document.querySelector('#supTable').innerHTML=a.length?`
 <table>
 <thead>
 <tr><th>Proveedor</th><th>Contacto</th><th>Ciudad</th><th></th></tr>
 </thead>
 <tbody>
 ${a.map(x=>`
 <tr>
  <td>
   <b>${esc2(x.name)}</b>
   <div class="muted">${esc2(x.email||'')}</div>
  </td>
  <td>${esc2(x.phone||x.contact||'—')}</td>
  <td>${esc2(x.city||'—')}</td>
  <td>
   <button class="secondary"
   onclick="aihxoSupplierForm('${x.id}')">Editar</button>
  </td>
 </tr>`).join('')}
 </tbody>
 </table>`:'<div class="empty">No hay proveedores.</div>';
}

function supplierForm(id){
 const x=id?suppliers.find(s=>s.id===id):{};

 window.openDrawer(`
 <h2>${id?'Editar':'Nuevo'} proveedor</h2>

 <form class="form" id="sv2">

 <div class="field">
 <label>Nombre *</label>
 <input name="name" required value="${esc2(x.name||'')}">
 </div>

 <div class="formgrid">
 <div class="field">
 <label>Email</label>
 <input name="email" type="email" value="${esc2(x.email||'')}">
 </div>

 <div class="field">
 <label>Teléfono</label>
 <input name="phone" value="${esc2(x.phone||'')}">
 </div>
 </div>

 <div class="formgrid">
 <div class="field">
 <label>Dirección</label>
 <input name="address" value="${esc2(x.address||'')}">
 </div>

 <div class="field">
 <label>Ciudad</label>
 <input name="city" value="${esc2(x.city||'')}">
 </div>
 </div>

 <div class="field">
 <label>Código postal</label>
 <input name="postal_code" value="${esc2(x.postal_code||'')}">
 </div>

 <div class="field">
 <label>Notas</label>
 <textarea name="notes" rows="3">${esc2(x.notes||'')}</textarea>
 </div>

 <button class="primary">Guardar proveedor</button>
 </form>
 `);

 document.querySelector('#sv2').onsubmit=async e=>{
  e.preventDefault();

  const f=new FormData(e.target);

  const o={
   name:f.get('name').trim(),
   email:f.get('email').trim()||null,
   phone:f.get('phone').trim()||null,
   address:f.get('address').trim()||null,
   city:f.get('city').trim()||null,
   postal_code:f.get('postal_code').trim()||null,
   notes:f.get('notes').trim()||null
  };

  const r=id
   ?await sb.from('suppliers').update(o).eq('id',id)
   :await sb.from('suppliers').insert(o);

  if(r.error){
   toast2(r.error.message);
  }else{
   window.closeDrawer();
   await loadV2();
   window.setView('suppliers');
   toast2('Proveedor guardado');
  }
 };
}

function purchasesView(c){

 c.innerHTML=`
 <div class="page">

 <div class="section">
  <div>
   <h2>Compras</h2>
   <div class="muted">
    ${purchases.length} compras ·
    ${money2(purchases.reduce((a,x)=>a+Number(x.amount||0),0))}
   </div>
  </div>

  <button class="primary" id="newPurchase">＋ Compra</button>
 </div>

 <div class="card">
 <div class="table-wrap">

 ${purchases.length?`
 <table>
 <thead>
 <tr>
 <th>Nº</th>
 <th>Fecha</th>
 <th>Proveedor</th>
 <th>Descripción</th>
 <th>Importe</th>
 <th>Estado</th>
 </tr>
 </thead>

 <tbody>

 ${purchases.map(x=>{
  const s=suppliers.find(z=>z.id===x.supplier_id);

  return `
  <tr>
   <td>${esc2(x.purchase_number)}</td>
   <td>${esc2(x.purchase_date)}</td>
   <td>${esc2(s?.name||'—')}</td>
   <td>${esc2(x.description)}</td>
   <td>${money2(x.amount)}</td>
   <td>${esc2(x.status)}</td>
  </tr>`;
 }).join('')}

 </tbody>
 </table>`
 :'<div class="empty">No hay compras.</div>'}

 </div>
 </div>
 </div>`;

 document.querySelector('#newPurchase').onclick=()=>purchaseForm();
}

function purchaseForm(){

 window.openDrawer(`
 <h2>Nueva compra</h2>

 <form class="form" id="pv2">

 <div class="field">
 <label>Proveedor</label>
 <select name="supplier_id">
 <option value="">Sin proveedor</option>
 ${suppliers.map(s=>`
 <option value="${s.id}">${esc2(s.name)}</option>
 `).join('')}
 </select>
 </div>

 <div class="field">
 <label>Descripción *</label>
 <input name="description"
 placeholder="Camisetas, DTF, packaging…"
 required>
 </div>

 <div class="formgrid">

 <div class="field">
 <label>Importe *</label>
 <input name="amount" type="number"
 min="0" step=".01" required>
 </div>

 <div class="field">
 <label>Fecha</label>
 <input name="purchase_date" type="date"
 value="${new Date().toISOString().slice(0,10)}">
 </div>

 </div>

 <div class="field">
 <label>Estado</label>
 <select name="status">
  <option>Recibida</option>
  <option>Pendiente</option>
  <option>Cancelada</option>
 </select>
 </div>

 <div class="field">
 <label>Notas</label>
 <textarea name="notes" rows="3"></textarea>
 </div>

 <button class="primary">Guardar compra</button>

 </form>
 `);

 document.querySelector('#pv2').onsubmit=async e=>{
  e.preventDefault();

  const f=new FormData(e.target);

  const r=await sb.from('purchases').insert({
   supplier_id:f.get('supplier_id')||null,
   purchase_number:'COMP-'+Date.now().toString().slice(-7),
   description:f.get('description').trim(),
   amount:+f.get('amount'),
   purchase_date:f.get('purchase_date'),
   status:f.get('status'),
   notes:f.get('notes').trim()||null
  });

  if(r.error){
   toast2(r.error.message);
  }else{
   window.closeDrawer();
   await loadV2();
   window.setView('purchases');
   toast2('Compra guardada');
  }
 };
}

function movementsView(c){

 c.innerHTML=`
 <div class="page">

 <div class="section">
  <div>
   <h2>Movimientos de stock</h2>
   <div class="muted">Últimos 100 movimientos</div>
  </div>

  <button class="secondary" id="refreshMov">
   Actualizar
  </button>
 </div>

 <div class="card">
 <div class="table-wrap">

 ${movements.length?`
 <table>
 <thead>
 <tr>
 <th>Fecha</th>
 <th>Producto</th>
 <th>Tipo</th>
 <th>Cantidad</th>
 <th>Stock</th>
 <th>Motivo</th>
 </tr>
 </thead>

 <tbody>

 ${movements.map(x=>`
 <tr>
  <td>${new Date(x.created_at).toLocaleString('es-ES')}</td>
  <td>${esc2(x.product_id)}</td>
  <td>${esc2(x.movement_type)}</td>
  <td>${x.quantity>0?'+':''}${x.quantity}</td>
  <td>${x.new_stock}</td>
  <td>${esc2(x.reason||'')}</td>
 </tr>
 `).join('')}

 </tbody>
 </table>
 `
 :'<div class="empty">Todavía no hay movimientos.</div>'}

 </div>
 </div>
 </div>`;

 document.querySelector('#refreshMov').onclick=async()=>{
  await loadV2();
  window.setView('movements');
 };
}

window.aihxoSupplierForm=supplierForm;
window.aihxoV2Reload=loadV2;

const boot=setInterval(()=>{
 if(document.querySelector('#nav')&&window.setView){
  clearInterval(boot);
  addNav();
  loadV2();
 }
},500);

setInterval(()=>{
 if(document.querySelector('#nav')&&!document.querySelector('[data-view="suppliers"]')){
  addNav();
 }
},1000);

})();
