/* AIHXO · Gastos con lectura automática de facturas */
(function(){
  const BUCKET='expense-receipts';
  const CATEGORIES=['DTF','Camisetas','Herramientas','Packaging','Envíos','Publicidad','Software','Oficina','Otros'];
  let pendingFile=null;
  let pendingInvoice=null;

  const E=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const N=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
  const today=()=>new Date().toISOString().slice(0,10);

  function normalizeCategory(v){
    const x=String(v||'').toLowerCase();
    if(x.includes('dtf')||x.includes('impresi')) return 'DTF';
    if(x.includes('camis')||x.includes('prenda')||x.includes('textil')) return 'Camisetas';
    if(x.includes('herram')||x.includes('maquin')||x.includes('plancha')) return 'Herramientas';
    if(x.includes('embal')||x.includes('pack')) return 'Packaging';
    if(x.includes('transport')||x.includes('env')) return 'Envíos';
    if(x.includes('market')||x.includes('public')) return 'Publicidad';
    if(x.includes('software')||x.includes('suscrip')) return 'Software';
    if(x.includes('oficina')) return 'Oficina';
    return 'Otros';
  }

  function categories(selected='Otros'){
    return CATEGORIES.map(x=>`<option value="${x}" ${x===selected?'selected':''}>${x}</option>`).join('');
  }

  function openDrawer(){
    document.querySelector('#drawer')?.classList.remove('hidden');
    return document.querySelector('#drawerBody');
  }

  async function refreshExpenses(){
    const {data,error}=await supabaseClient.from('expenses').select('*').order('expense_date',{ascending:false});
    if(error){console.error(error);toast('No se pudieron actualizar los gastos');return;}
    expenses=data||[];
  }

  async function viewReceipt(path){
    const {data,error}=await supabaseClient.storage.from(BUCKET).createSignedUrl(path,120);
    if(error||!data?.signedUrl){console.error(error);toast('No se pudo abrir la factura');return;}
    window.open(data.signedUrl,'_blank','noopener');
  }
  window.verFacturaGasto=viewReceipt;

  window.expensesView=function(c){
    const total=(expenses||[]).reduce((a,e)=>a+N(e.amount),0);
    c.innerHTML=`<div class="page">
      <div class="section">
        <div><h2 style="margin:0">Gastos</h2><div class="muted">${expenses.length} registros · ${money(total)}</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
          <button class="secondary" type="button" onclick="expenseForm()">＋ Manual</button>
          <button class="primary" type="button" onclick="abrirFacturaIA()">📷 Subir factura</button>
        </div>
      </div>
      <div style="display:grid;gap:12px">
        ${expenses.length?expenses.map(e=>`<div class="card" style="padding:16px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
            <div>
              <div class="muted" style="font-size:12px">${E(e.expense_date||'')}</div>
              <div style="font-weight:900;font-size:18px">${E(e.description||'Gasto')}</div>
              <div class="muted">${E(e.category||'Otros')}${e.supplier_name?' · '+E(e.supplier_name):''}${e.invoice_number?' · Factura '+E(e.invoice_number):''}</div>
            </div>
            <b style="font-size:20px;white-space:nowrap">${money(e.amount)}</b>
          </div>
          ${(e.taxable_base||e.vat_amount)?`<div class="muted" style="margin-top:8px">Base ${money(e.taxable_base)} · IVA ${money(e.vat_amount)}${e.vat_rate?` (${N(e.vat_rate)}%)`:''}</div>`:''}
          ${e.receipt_path?`<button class="secondary" type="button" style="margin-top:12px" onclick="verFacturaGasto('${String(e.receipt_path).replace(/'/g,"\\'")}')">📄 Ver factura</button>`:''}
        </div>`).join(''):'<div class="card"><div class="empty">No hay gastos.</div></div>'}
      </div>
    </div>`;
  };

  window.expenseForm=function(){
    pendingFile=null;pendingInvoice=null;
    const b=openDrawer(); if(!b)return;
    b.innerHTML=`<h2>Nuevo gasto</h2><form class="form" id="efManual">
      <div class="formgrid"><div class="field"><label>Categoría</label><select name="category">${categories('Otros')}</select></div><div class="field"><label>Importe</label><input name="amount" type="number" step=".01" min="0" required></div></div>
      <div class="field"><label>Fecha</label><input name="expense_date" type="date" value="${today()}" required></div>
      <div class="field"><label>Descripción</label><input name="description" required></div>
      <button class="primary">Guardar</button>
    </form>`;
    b.querySelector('#efManual').onsubmit=async e=>{
      e.preventDefault(); const f=new FormData(e.target);
      const {error}=await supabaseClient.from('expenses').insert({category:f.get('category'),amount:N(f.get('amount')),description:f.get('description'),expense_date:f.get('expense_date'),source:'manual'});
      if(error)return toast(error.message);
      closeDrawer(); await refreshExpenses(); setView('expenses'); toast('Gasto guardado');
    };
  };

  window.abrirFacturaIA=function(){
    pendingFile=null;pendingInvoice=null;
    const b=openDrawer(); if(!b)return;
    b.innerHTML=`<h2>📷 Subir factura</h2>
      <p class="muted">Haz una foto o elige una imagen/PDF. La IA extraerá los datos y podrás revisarlos antes de guardar.</p>
      <div style="display:grid;gap:10px;margin-top:16px">
        <button class="primary" type="button" id="invoiceCameraBtn">📷 Hacer foto</button>
        <button class="secondary" type="button" id="invoiceFileBtn">📁 Elegir imagen o PDF</button>
      </div>
      <input id="invoiceCamera" type="file" accept="image/*" capture="environment" style="display:none">
      <input id="invoiceFile" type="file" accept="image/*,application/pdf,.pdf" style="display:none">
      <div id="invoiceAiStatus" style="margin-top:16px"></div>`;
    b.querySelector('#invoiceCameraBtn').onclick=()=>b.querySelector('#invoiceCamera').click();
    b.querySelector('#invoiceFileBtn').onclick=()=>b.querySelector('#invoiceFile').click();
    b.querySelector('#invoiceCamera').onchange=e=>analyzeSelected(e.target.files?.[0]);
    b.querySelector('#invoiceFile').onchange=e=>analyzeSelected(e.target.files?.[0]);
  };

  async function imageForAI(file){
    if(!file.type.startsWith('image/')) return file;
    if(file.size<1800000) return file;
    const bitmap=await createImageBitmap(file);
    const max=1800, scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84));
    return new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'});
  }

  function fileToBase64(file){
    return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(file)});
  }

  async function analyzeSelected(file){
    if(!file)return;
    if(file.size>20*1024*1024){toast('El archivo supera 20 MB');return;}
    pendingFile=file;
    const status=document.querySelector('#invoiceAiStatus');
    if(status)status.innerHTML='<div class="card">🤖 Leyendo factura…</div>';
    try{
      const aiFile=await imageForAI(file);
      const base64=await fileToBase64(aiFile);
      const {data,error}=await supabaseClient.functions.invoke('aihxo-invoice-ai',{body:{file_base64:base64,mime_type:aiFile.type||file.type,file_name:file.name}});
      if(error)throw error;
      if(data?.error)throw new Error(data.error);
      pendingInvoice=data?.invoice||{};
      showReview();
    }catch(e){
      console.error(e);
      if(status)status.innerHTML=`<div class="card">⚠️ ${E(e?.message||'No se pudo leer la factura.')}</div>`;
    }
  }

  function showReview(){
    const x=pendingInvoice||{}, cat=normalizeCategory(x.category), lines=Array.isArray(x.lines)?x.lines:[];
    const b=document.querySelector('#drawerBody'); if(!b)return;
    b.innerHTML=`<h2>✅ Revisar factura</h2><div class="muted" style="margin-bottom:14px">Comprueba los datos antes de guardar el gasto.</div>
      <form class="form" id="invoiceReviewForm">
        <div class="field"><label>Proveedor</label><input name="supplier_name" value="${E(x.supplier_name||'')}" required></div>
        <div class="formgrid"><div class="field"><label>Nº factura</label><input name="invoice_number" value="${E(x.invoice_number||'')}"></div><div class="field"><label>Fecha</label><input name="expense_date" type="date" value="${E(x.invoice_date||today())}" required></div></div>
        <div class="field"><label>Categoría</label><select name="category">${categories(cat)}</select></div>
        <div class="field"><label>Descripción</label><input name="description" value="${E(x.description||'Factura '+(x.supplier_name||''))}" required></div>
        <div class="formgrid"><div class="field"><label>Base imponible</label><input name="taxable_base" type="number" step=".01" min="0" value="${N(x.taxable_base)}"></div><div class="field"><label>IVA %</label><input name="vat_rate" type="number" step=".01" min="0" value="${N(x.vat_rate)||21}"></div></div>
        <div class="formgrid"><div class="field"><label>IVA €</label><input name="vat_amount" type="number" step=".01" min="0" value="${N(x.vat_amount)}"></div><div class="field"><label>Total €</label><input name="amount" type="number" step=".01" min="0" value="${N(x.total)}" required></div></div>
        ${lines.length?`<div class="card" style="margin:8px 0"><b>Conceptos detectados</b>${lines.map(l=>`<div class="statline"><span>${E(l.description||'Concepto')}${l.quantity?' · '+N(l.quantity)+' ud.':''}</span><b>${money(l.total??l.subtotal??0)}</b></div>`).join('')}</div>`:''}
        <div class="card" style="margin:8px 0">📎 <b>${E(pendingFile?.name||'Factura')}</b><div class="muted">Se guardará el original vinculado al gasto.</div></div>
        <button class="primary" id="saveInvoiceExpense" type="submit" style="width:100%">Guardar gasto y factura</button>
        <button class="secondary" type="button" style="width:100%;margin-top:8px" onclick="abrirFacturaIA()">Volver a elegir archivo</button>
      </form>`;
    b.querySelector('#invoiceReviewForm').onsubmit=saveInvoiceExpense;
  }

  async function saveInvoiceExpense(e){
    e.preventDefault(); if(!pendingFile)return toast('Falta el archivo de la factura');
    const btn=e.submitter; if(btn){btn.disabled=true;btn.textContent='Guardando…'}
    const f=new FormData(e.target);
    const supplier=String(f.get('supplier_name')||'').trim(), invoice=String(f.get('invoice_number')||'').trim();
    try{
      if(invoice){
        const {data:dupes,error:de}=await supabaseClient.from('expenses').select('id').ilike('supplier_name',supplier).eq('invoice_number',invoice).limit(1);
        if(de)console.warn(de);
        if(dupes?.length && !confirm('Ya existe un gasto con este proveedor y número de factura. ¿Guardar igualmente?')){if(btn){btn.disabled=false;btn.textContent='Guardar gasto y factura'}return;}
      }
      const safe=(pendingFile.name||'factura').replace(/[^a-zA-Z0-9._-]+/g,'_');
      const path=`${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
      const up=await supabaseClient.storage.from(BUCKET).upload(path,pendingFile,{contentType:pendingFile.type||'application/octet-stream',upsert:false});
      if(up.error)throw up.error;
      const payload={
        category:f.get('category'), description:String(f.get('description')||'').trim(), amount:N(f.get('amount')), expense_date:f.get('expense_date'),
        supplier_name:supplier, invoice_number:invoice||null, taxable_base:N(f.get('taxable_base')), vat_rate:N(f.get('vat_rate')), vat_amount:N(f.get('vat_amount')),
        receipt_path:path, receipt_name:pendingFile.name, receipt_mime:pendingFile.type, source:'invoice_ai', extracted_data:pendingInvoice||{}
      };
      const ins=await supabaseClient.from('expenses').insert(payload);
      if(ins.error){await supabaseClient.storage.from(BUCKET).remove([path]);throw ins.error;}
      pendingFile=null;pendingInvoice=null;closeDrawer();await refreshExpenses();setView('expenses');toast('Factura y gasto guardados');
    }catch(err){console.error(err);toast(err?.message||'No se pudo guardar la factura');if(btn){btn.disabled=false;btn.textContent='Guardar gasto y factura'}}
  }
})();
