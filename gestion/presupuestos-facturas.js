// AIHXO · Presupuestos y Facturas
// Cargar después de app.js. Requiere las tablas quotes, quote_lines, invoices e invoice_lines.

let quotes = [], invoices = [];

async function loadBilling(){
  const [q,i] = await Promise.all([
    supabaseClient.from('quotes').select('*').order('created_at',{ascending:false}),
    supabaseClient.from('invoices').select('*').order('created_at',{ascending:false})
  ]);
  if(q.error || i.error){ console.error(q.error||i.error); toast('Error cargando presupuestos/facturas'); return; }
  quotes=q.data||[]; invoices=i.data||[];
}

function billingNav(){
  const nav=document.querySelector('#nav');
  if(!nav || nav.querySelector('[data-view="quotes"]')) return;
  const expenses=nav.querySelector('[data-view="expenses"]');
  const q=document.createElement('button'); q.dataset.view='quotes'; q.innerHTML='▤ <span>Presupuestos</span>';
  const i=document.createElement('button'); i.dataset.view='invoices'; i.innerHTML='▧ <span>Facturas</span>';
  nav.insertBefore(q,expenses); nav.insertBefore(i,expenses);
  [q,i].forEach(b=>b.onclick=()=>{billingSetView(b.dataset.view); if(typeof closeMobileMenu==='function') closeMobileMenu();});
}

function billingSetView(v){
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  if(v==='quotes'){ document.querySelector('#title').textContent='Presupuestos'; quotesView(document.querySelector('#view')); }
  if(v==='invoices'){ document.querySelector('#title').textContent='Facturas'; invoicesView(document.querySelector('#view')); }
}

function nextDocNumber(prefix, docs, field){
  const y=new Date().getFullYear();
  const nums=docs.filter(x=>(x[field]||'').startsWith(prefix+'-'+y+'-'))
    .map(x=>parseInt((x[field]||'').split('-').pop(),10)).filter(Number.isFinite);
  return `${prefix}-${y}-${String((Math.max(0,...nums)+1)).padStart(3,'0')}`;
}

function quotesView(c){
 c.innerHTML=`<div class="page"><div class="section"><div><h2>Presupuestos</h2><div class="muted">${quotes.length} presupuestos</div></div><button class="primary" onclick="quoteForm()">＋ Nuevo presupuesto</button></div>
 <div class="card"><div class="table-wrap"><table><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
 <tbody>${quotes.map(q=>`<tr><td><b>${esc(q.quote_number)}</b></td><td>${q.quote_date||''}</td><td>${esc(q.customer_name)}</td><td>${money(q.total)}</td>
 <td><select onchange="quoteStatus('${q.id}',this.value)">${['Borrador','Enviado','Aceptado','Rechazado','Facturado'].map(s=>`<option ${q.status===s?'selected':''}>${s}</option>`).join('')}</select></td>
 <td><button class="secondary" onclick="viewQuote('${q.id}')">Ver</button> ${q.status==='Aceptado'?`<button class="primary small" onclick="quoteToInvoice('${q.id}')">Facturar</button>`:''}</td></tr>`).join('')}</tbody></table></div>
 ${quotes.length?'':'<div class="empty">Todavía no hay presupuestos.</div>'}</div></div>`;
}

async function quoteStatus(id,status){
 const {error}=await supabaseClient.from('quotes').update({status,updated_at:new Date().toISOString()}).eq('id',id);
 if(error) return toast(error.message); await loadBilling(); quotesView(document.querySelector('#view')); toast('Estado actualizado');
}

function quoteForm(){
 const customerOptions=customers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
 const productOptions=products.map(p=>`<option value="${p.id}">${esc(p.model)} · ${esc(p.size||'')} · ${esc(p.color||'')} — ${money(p.sale_price)}</option>`).join('');
 document.querySelector('#drawer').classList.remove('hidden');
 document.querySelector('#drawerBody').innerHTML=`<h2>Nuevo presupuesto</h2><form class="form" id="quoteForm">
 <div class="field"><label>Cliente</label><select name="customer_id" required><option value="">Seleccionar cliente</option>${customerOptions}</select></div>
 <div class="field"><label>Producto</label><select id="quoteProduct">${productOptions}</select></div>
 <div class="formgrid"><div class="field"><label>Cantidad</label><input id="quoteQty" type="number" min="1" value="1"></div><div class="field"><label>Precio unitario</label><input id="quotePrice" type="number" step=".01" value="${products[0]?.sale_price||0}"></div></div>
 <div class="field"><label>Descuento %</label><input id="quoteDiscount" type="number" min="0" max="100" step=".01" value="0"></div>
 <button type="button" class="secondary" onclick="addQuoteLine()">＋ Añadir línea</button><div id="quoteLines" style="margin-top:12px"></div>
 <div class="formgrid"><div class="field"><label>IVA %</label><input id="quoteTax" type="number" step=".01" value="21" oninput="drawQuoteLines()"></div><div class="field"><label>Portes</label><input id="quoteShipping" type="number" step=".01" value="0" oninput="drawQuoteLines()"></div></div>
 <div id="quoteTotals" class="card" style="margin:12px 0"></div><div class="field"><label>Notas</label><textarea name="notes" rows="3"></textarea></div>
 <button class="primary">Guardar presupuesto</button></form>`;
 window._quoteLines=[];
 document.querySelector('#quoteProduct').onchange=e=>document.querySelector('#quotePrice').value=products.find(p=>p.id===e.target.value)?.sale_price||0;
 document.querySelector('#quoteForm').onsubmit=saveQuote; drawQuoteLines();
}

function addQuoteLine(){
 const p=products.find(x=>x.id===document.querySelector('#quoteProduct').value); if(!p) return toast('Selecciona un producto');
 const qty=Math.max(1,+document.querySelector('#quoteQty').value||1), price=+document.querySelector('#quotePrice').value||0, discount=Math.min(100,Math.max(0,+document.querySelector('#quoteDiscount').value||0));
 window._quoteLines.push({product_id:p.id,sku:p.sku||'',description:[p.model,p.size,p.color].filter(Boolean).join(' · '),quantity:qty,unit_price:price,discount_pct:discount});
 drawQuoteLines();
}
function removeQuoteLine(n){window._quoteLines.splice(n,1);drawQuoteLines()}
function quoteCalc(){
 const tax=+document.querySelector('#quoteTax')?.value||21,
       shipping=+document.querySelector('#quoteShipping')?.value||0;
 let gross=0, finalProducts=0;

 (window._quoteLines||[]).forEach(l=>{
   const g=l.quantity*l.unit_price;
   gross+=g;
   finalProducts+=g*(1-l.discount_pct/100);
 });

 const discount=gross-finalProducts;
 const subtotal=finalProducts/(1+tax/100);
 const taxTotal=finalProducts-subtotal;
 const total=finalProducts+shipping;

 return {gross,subtotal,discount,tax,taxTotal,shipping,total};
}
function drawQuoteLines(){
 const box=document.querySelector('#quoteLines'); if(!box)return;
 box.innerHTML=(window._quoteLines||[]).map((l,n)=>`<div class="statline"><span>${esc(l.description)} · ${l.quantity} × ${money(l.unit_price)}${l.discount_pct?' · -'+l.discount_pct+'%':''}</span><button type="button" class="secondary" onclick="removeQuoteLine(${n})">×</button></div>`).join('')||'<div class="muted">Añade al menos un producto.</div>';
 const x=quoteCalc(); document.querySelector('#quoteTotals').innerHTML=`<div class="statline"><span>Base imponible</span><b>${money(x.subtotal)}</b></div><div class="statline"><span>Descuento</span><b>${money(x.discount)}</b></div><div class="statline"><span>IVA ${x.tax}%</span><b>${money(x.taxTotal)}</b></div><div class="statline"><span>Portes</span><b>${money(x.shipping)}</b></div><div class="statline"><span>TOTAL</span><b>${money(x.total)}</b></div>`;
}
async function saveQuote(e){
 e.preventDefault(); if(!window._quoteLines.length)return toast('Añade al menos un producto');
 const f=new FormData(e.target), customer=customers.find(c=>c.id===f.get('customer_id')); if(!customer)return toast('Selecciona un cliente');
 const x=quoteCalc(), quote={quote_number:nextDocNumber('PRE',quotes,'quote_number'),customer_id:customer.id,customer_name:customer.name,quote_date:new Date().toISOString().slice(0,10),status:'Borrador',subtotal:x.subtotal,discount_total:x.discount,tax_rate:x.tax,tax_total:x.taxTotal,shipping:x.shipping,total:x.total,notes:f.get('notes')||''};
 const r=await supabaseClient.from('quotes').insert(quote).select().single(); if(r.error)return toast(r.error.message);
 const lines=window._quoteLines.map((l,n)=>{
 const lineTotal=l.quantity*l.unit_price*(1-l.discount_pct/100);
 const lineSubtotal=lineTotal/(1+x.tax/100);
 return {...l,quote_id:r.data.id,tax_rate:x.tax,line_subtotal:lineSubtotal,line_total:lineTotal,sort_order:n};
});
 const lr=await supabaseClient.from('quote_lines').insert(lines); if(lr.error){await supabaseClient.from('quotes').delete().eq('id',r.data.id);return toast(lr.error.message)}
 closeDrawer(); await loadBilling(); billingSetView('quotes'); toast('Presupuesto guardado');
}
async function viewQuote(id){
 const q=quotes.find(x=>x.id===id);
 const r=await supabaseClient.from('quote_lines')
   .select('*')
   .eq('quote_id',id)
   .order('sort_order');

 if(r.error)return toast(r.error.message);

 document.querySelector('#drawer').classList.remove('hidden');

 document.querySelector('#drawerBody').innerHTML=`
   <h2>${esc(q.quote_number)}</h2>

   <p>
     <b>${esc(q.customer_name)}</b><br>
     ${q.quote_date}
   </p>

   ${r.data.map(l=>`
     <div class="statline">
       <span>${esc(l.description)} · ${l.quantity} × ${money(l.unit_price)}</span>
       <b>${money(l.line_subtotal)}</b>
     </div>
   `).join('')}

   <hr>

   <div class="statline">
     <span>Base</span>
     <b>${money(q.subtotal)}</b>
   </div>

   <div class="statline">
     <span>IVA ${q.tax_rate}%</span>
     <b>${money(q.tax_total)}</b>
   </div>

   <div class="statline">
     <span>Portes</span>
     <b>${money(q.shipping)}</b>
   </div>

   <div class="statline">
     <span>Total</span>
     <b>${money(q.total)}</b>
   </div>

   ${q.notes?`<p>${esc(q.notes)}</p>`:''}

   <button
     class="primary"
     style="width:100%;margin-top:20px"
     onclick="generateQuotePDF('${q.id}')">
     📄 Generar PDF
   </button>
 `;
}

async function generateQuotePDF(id){
 const q=quotes.find(x=>x.id===id);
 if(!q)return toast('Presupuesto no encontrado');

 const linesResult=await supabaseClient
   .from('quote_lines')
   .select('*')
   .eq('quote_id',id)
   .order('sort_order');

 if(linesResult.error)return toast(linesResult.error.message);

 const customer=customers.find(c=>c.id===q.customer_id)||{};

 const lines=linesResult.data.map(l=>`
   <tr>
     <td>${esc(l.description)}</td>
     <td style="text-align:center">${l.quantity}</td>
     <td style="text-align:right">${money(l.unit_price)}</td>
     <td style="text-align:right">${l.discount_pct||0}%</td>
     <td style="text-align:right">${money(l.line_total)}</td>
   </tr>
 `).join('');

 const w=window.open('','_blank');

 if(!w){
   toast('Permite las ventanas emergentes para generar el PDF');
   return;
 }

 w.document.write(`
 <!doctype html>
 <html lang="es">
 <head>
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width,initial-scale=1">
   <title>${esc(q.quote_number)}</title>

   <style>
     *{box-sizing:border-box}
     body{
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;
       color:#172033;
       margin:0;
       padding:32px;
       background:white;
     }

     .header{
       display:flex;
       justify-content:space-between;
       align-items:flex-start;
       border-bottom:3px solid #087cf4;
       padding-bottom:20px;
       margin-bottom:28px;
     }

     .logo{
       width:150px;
       max-height:80px;
       object-fit:contain;
     }

     h1{
       margin:0;
       font-size:28px;
       color:#087cf4;
     }

     .number{
       font-size:16px;
       margin-top:6px;
       font-weight:700;
     }

     .grid{
       display:grid;
       grid-template-columns:1fr 1fr;
       gap:30px;
       margin-bottom:28px;
     }

     .box{
       border:1px solid #d8dee9;
       border-radius:10px;
       padding:16px;
     }

     .box h3{
       margin:0 0 10px;
       font-size:13px;
       text-transform:uppercase;
       color:#64748b;
     }

     table{
       width:100%;
       border-collapse:collapse;
       margin-top:20px;
     }

     th{
       background:#f1f5f9;
       text-align:left;
       padding:10px;
       font-size:12px;
     }

     td{
       padding:10px;
       border-bottom:1px solid #e2e8f0;
       font-size:13px;
     }

     .totals{
       width:330px;
       margin-left:auto;
       margin-top:25px;
     }

     .total-row{
       display:flex;
       justify-content:space-between;
       padding:7px 0;
     }

     .grand{
       font-size:20px;
       font-weight:800;
       border-top:2px solid #087cf4;
       margin-top:8px;
       padding-top:12px;
     }

     .notes{
       margin-top:30px;
       padding:15px;
       background:#f8fafc;
       border-radius:8px;
     }

     .footer{
       margin-top:45px;
       padding-top:15px;
       border-top:1px solid #e2e8f0;
       font-size:11px;
       color:#64748b;
       text-align:center;
     }

     @media print{
       body{padding:10mm}
       @page{size:A4;margin:10mm}
     }
   </style>
 </head>

 <body>

   <div class="header">
     <div>
       <img class="logo" src="../logo-aihxo.png">
     </div>

     <div style="text-align:right">
       <h1>PRESUPUESTO</h1>
       <div class="number">${esc(q.quote_number)}</div>
       <div>${esc(q.quote_date||'')}</div>
     </div>
   </div>

   <div class="grid">

     <div class="box">
       <h3>AIHXO</h3>
       <b>AIHXO KIDS WEAR</b><br>
       Pezoca 31 · 15173 Oleiros<br>
       A Coruña<br>
       692 943 013<br>
       AIHXO.camisetas@gmail.com
     </div>

     <div class="box">
       <h3>Cliente</h3>
       <b>${esc(q.customer_name)}</b><br>
       ${customer.address?esc(customer.address)+'<br>':''}
       ${customer.postal_code?esc(customer.postal_code)+' ':''}
       ${customer.city?esc(customer.city)+'<br>':''}
       ${customer.phone?esc(customer.phone)+'<br>':''}
       ${customer.email?esc(customer.email):''}
     </div>

   </div>

   <table>
     <thead>
       <tr>
         <th>Descripción</th>
         <th style="text-align:center">Cant.</th>
         <th style="text-align:right">Precio</th>
         <th style="text-align:right">Dto.</th>
         <th style="text-align:right">Total</th>
       </tr>
     </thead>

     <tbody>
       ${lines}
     </tbody>
   </table>

   <div class="totals">

     <div class="total-row">
       <span>Base imponible</span>
       <b>${money(q.subtotal)}</b>
     </div>

     <div class="total-row">
       <span>IVA ${q.tax_rate}%</span>
       <b>${money(q.tax_total)}</b>
     </div>

     <div class="total-row">
       <span>Portes</span>
       <b>${money(q.shipping)}</b>
     </div>

     <div class="total-row grand">
       <span>TOTAL</span>
       <span>${money(q.total)}</span>
     </div>

   </div>

   ${q.notes?`
     <div class="notes">
       <b>Notas</b><br>
       ${esc(q.notes)}
     </div>
   `:''}

   <div class="footer">
     AIHXO · Camisetas personalizadas · DTF · Oleiros (A Coruña)
   </div>

   <script>
     window.onload=function(){
       setTimeout(function(){
         window.print();
       },500);
     }
   <\/script>

 </body>
 </html>
 `);

 w.document.close();
}

function invoicesView(c){
 c.innerHTML=`<div class="page"><div class="section"><div><h2>Facturas</h2><div class="muted">${invoices.length} facturas</div></div></div><div class="card"><div class="table-wrap"><table><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>${invoices.map(i=>`<tr><td><b>${esc(i.invoice_number)}</b></td><td>${i.invoice_date||''}</td><td>${esc(i.customer_name)}</td><td>${money(i.total)}</td><td><select onchange="invoiceStatus('${i.id}',this.value)">${['Pendiente','Pagada','Anulada'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>${invoices.length?'':'<div class="empty">Todavía no hay facturas.</div>'}</div></div>`;
}
async function invoiceStatus(id,status){
 const patch={status,updated_at:new Date().toISOString()}; if(status==='Pagada')patch.paid_at=new Date().toISOString();
 const {error}=await supabaseClient.from('invoices').update(patch).eq('id',id); if(error)return toast(error.message); await loadBilling(); invoicesView(document.querySelector('#view')); toast('Factura actualizada');
}
async function quoteToInvoice(id){
 const q=quotes.find(x=>x.id===id); if(!q)return; if(q.status!=='Aceptado')return toast('El presupuesto debe estar aceptado');
 if(invoices.some(i=>i.source_quote_id===id))return toast('Este presupuesto ya tiene factura');
 const lr=await supabaseClient.from('quote_lines').select('*').eq('quote_id',id).order('sort_order'); if(lr.error)return toast(lr.error.message);
 const inv={invoice_number:nextDocNumber('FAC',invoices,'invoice_number'),source_quote_id:q.id,customer_id:q.customer_id,customer_name:q.customer_name,invoice_date:new Date().toISOString().slice(0,10),status:'Pendiente',subtotal:q.subtotal,discount_total:q.discount_total,tax_rate:q.tax_rate,tax_total:q.tax_total,shipping:q.shipping,total:q.total,notes:q.notes};
 const r=await supabaseClient.from('invoices').insert(inv).select().single(); if(r.error)return toast(r.error.message);
 const lines=lr.data.map(l=>({invoice_id:r.data.id,product_id:l.product_id,sku:l.sku,description:l.description,quantity:l.quantity,unit_price:l.unit_price,discount_pct:l.discount_pct,tax_rate:l.tax_rate,line_subtotal:l.line_subtotal,line_total:l.line_total,sort_order:l.sort_order}));
 const il=await supabaseClient.from('invoice_lines').insert(lines); if(il.error){await supabaseClient.from('invoices').delete().eq('id',r.data.id);return toast(il.error.message)}
 await supabaseClient.from('quotes').update({status:'Facturado',updated_at:new Date().toISOString()}).eq('id',id);
 await loadBilling(); billingSetView('invoices'); toast('Factura creada');
}

async function initBilling(){
  let tries=0;
  while(!document.querySelector('#nav') && tries++<50) await new Promise(r=>setTimeout(r,100));
  if(!document.querySelector('#nav')) return;
  billingNav();
  await loadBilling();
}

// Asegura que Presupuestos y Facturas se inicialicen también
// cuando el usuario inicia sesión después de abrir la aplicación.
if (typeof showApp === 'function') {
  const _aihxoOriginalShowApp = showApp;
  showApp = function(session){
    _aihxoOriginalShowApp(session);
    setTimeout(() => initBilling(), 0);
  };
}

// Si ya había una sesión activa al cargar la página, también inicializa.
initBilling();
