/* AIHXO · Compras v2 · vista ligera y robusta */
(function(){
 const N=v=>Number(v||0);
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const EUR=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
 const normSearch=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const itemLabel=i=>`${i._virtual?'🆕 ':''}${i.supplier_model||i.supplier||'Prenda'} · ${i.size||''} · ${i.color||''}`;

 const clean=v=>String(v??'').trim();
 const lower=v=>clean(v).toLowerCase();
 const lineSource=l=>({
   description:clean(l?.description),
   sku:clean(l?.sku),
   reference:clean(l?.reference),
   model_code:clean(l?.model_code),
   model:clean(l?.model),
   brand:clean(l?.brand),
   color:clean(l?.color),
   size:clean(l?.size)
 });

 function matchSupplierReference(line,refs){
   const s=lineSource(line);
   if(s.sku){
     const hit=(refs||[]).find(r=>lower(r.provider_sku)===lower(s.sku));
     if(hit)return hit;
   }
   if(s.reference){
     const hit=(refs||[]).find(r=>lower(r.provider_reference)===lower(s.reference));
     if(hit)return hit;
   }
   if(s.model_code && s.color && s.size){
     const hits=(refs||[]).filter(r=>
       lower(r.provider_model_code)===lower(s.model_code) &&
       lower(r.provider_color)===lower(s.color) &&
       lower(r.provider_size)===lower(s.size)
     );
     if(hits.length===1)return hits[0];
   }
   return null;
 }

 async function loadSupplierReferences(supplierId){
   if(!supplierId)return [];
   const {data,error}=await supabaseClient
     .from('supplier_references')
     .select('id,supplier_id,vendor_name,brand,commercial_model,provider_model_code,provider_sku,provider_reference,provider_description,provider_color,provider_size,base_stock_item_id,match_status')
     .eq('supplier_id',supplierId)
     .eq('active',true);
   if(error)throw error;
   return data||[];
 }

 async function ensureSupplierReference({supplierId,supplierName,line,itemId,invoiceNumber,invoiceDate}){
   if(!supplierId||!itemId)return null;
   const s=lineSource(line);
   let q=supabaseClient.from('supplier_references').select('*').eq('supplier_id',supplierId);
   if(s.sku) q=q.eq('provider_sku',s.sku);
   else if(s.reference) q=q.eq('provider_reference',s.reference);
   else if(s.model_code&&s.color&&s.size) q=q.eq('provider_model_code',s.model_code).eq('provider_color',s.color).eq('provider_size',s.size);
   else return null;

   const {data:existing,error:findError}=await q.maybeSingle();
   if(findError)throw findError;

   if(existing){
     if(existing.base_stock_item_id && String(existing.base_stock_item_id)!==String(itemId)){
       throw new Error('La referencia '+(s.sku||s.reference||s.model_code)+' ya está vinculada a otra prenda. Revísala antes de continuar.');
     }
     if(!existing.base_stock_item_id || existing.match_status!=='linked'){
       const {data,error}=await supabaseClient.from('supplier_references')
         .update({base_stock_item_id:itemId,match_status:'linked',updated_at:new Date().toISOString()})
         .eq('id',existing.id).select('id').single();
       if(error)throw error;
       return data.id;
     }
     return existing.id;
   }

   const {data:item,error:itemError}=await supabaseClient
     .from('base_stock_items')
     .select('garment_id,supplier_model')
     .eq('id',itemId).single();
   if(itemError)throw itemError;

   const payload={
     supplier_id:supplierId,
     vendor_name:supplierName||'Proveedor',
     brand:s.brand||supplierName||'Proveedor',
     commercial_model:s.model||item?.supplier_model||s.model_code||'Referencia proveedor',
     provider_model_code:s.model_code||null,
     provider_sku:s.sku||null,
     provider_reference:s.reference||null,
     provider_description:s.description||s.model||'Referencia proveedor',
     provider_color:s.color||null,
     provider_size:s.size||null,
     garment_id:item?.garment_id||null,
     base_stock_item_id:itemId,
     source_invoice_number:invoiceNumber||null,
     source_invoice_date:invoiceDate||null,
     match_status:'linked',
     notes:'Vinculada desde recepción de factura',
     active:true
   };
   const {data,error}=await supabaseClient.from('supplier_references').insert(payload).select('id').single();
   if(error)throw error;
   return data.id;
 }

 function bindItemSearch(root,items,{inputClass,hiddenClass,resultsClass,costClass}){
   root.querySelectorAll('.'+inputClass).forEach(input=>{
     const row=input.closest('[data-item-search-row]')||input.parentElement;
     const hidden=row.querySelector('.'+hiddenClass);
     const results=row.querySelector('.'+resultsClass);
     const cost=costClass?row.querySelector('.'+costClass):null;

     const render=()=>{
       const q=normSearch(input.value);
       const terms=q.split(/\s+/).filter(Boolean);
       const matches=(items||[])
         .filter(i=>{
           const hay=normSearch(itemLabel(i)+' '+(i.supplier||'')+' '+(i.garment_type||''));
           return !terms.length || terms.every(t=>hay.includes(t));
         })
         .slice(0,12);

       results.innerHTML=matches.length
         ? matches.map(i=>`<button type="button" class="itemSearchResult" data-id="${E(i.id)}" style="display:block;width:100%;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid #eef1f4;background:#fff;color:#111">${E(itemLabel(i))}</button>`).join('')
         : '<div style="padding:10px;color:#667085">Sin resultados</div>';

       results.style.display='block';

       results.querySelectorAll('.itemSearchResult').forEach(btn=>{
         btn.onclick=()=>{
           const item=(items||[]).find(i=>String(i.id)===String(btn.dataset.id));
           if(!item)return;
           hidden.value=item.id;
           input.value=itemLabel(item);
           results.style.display='none';
           if(cost && !N(cost.value)) cost.value=N(item.unit_cost).toFixed(2);
         };
       });
     };

     input.addEventListener('focus',render);
     input.addEventListener('input',()=>{hidden.value='';render()});
     input.addEventListener('blur',()=>setTimeout(()=>{results.style.display='none'},180));
   });
 }

 async function loadBasic(c){
   c.innerHTML='<div class="page"><div class="card">⏳ Cargando compras…</div></div>';
   try{
     const purRes=await supabaseClient.from('purchases')
       .select('id,supplier_id,purchase_number,description,amount,purchase_date,status,notes,created_at')
       .order('purchase_date',{ascending:false})
       .order('created_at',{ascending:false});
     if(purRes.error) throw new Error('Compras: '+purRes.error.message);

     const supRes=await supabaseClient.from('suppliers').select('id,name').order('name');
     if(supRes.error) throw new Error('Proveedores: '+supRes.error.message);

     const ps=purRes.data||[], suppliers=supRes.data||[];
     const sm=Object.fromEntries(suppliers.map(s=>[String(s.id),s.name]));
     const total=ps.reduce((a,p)=>a+N(p.amount),0);
     const pending=ps.filter(p=>!['recibido','recibida','completado','completada'].includes(String(p.status||'').toLowerCase()));

     c.innerHTML=`<div class="page">
       <div class="section">
         <div><h2>🛒 Compras</h2><div class="muted">Pedidos a proveedores y entrada de mercancía</div></div>
         <div style="display:flex;gap:8px;flex-wrap:wrap">
           <button type="button" class="secondary" id="p2Suppliers">🏭 Proveedores</button>
           <button type="button" class="secondary" id="p2Import">📄 Importar factura</button>
           <button type="button" class="primary" id="p2New">＋ Nueva compra</button>
         </div>
       </div>
       <div class="grid kpis">
         ${kpi('Compras',ps.length,'registradas')}
         ${kpi('Importe',EUR(total),'histórico')}
         ${kpi('Pendientes',pending.length,'por recibir')}
       </div>
       <div style="display:grid;gap:12px;margin-top:14px">
       ${ps.length?ps.map(p=>`<div class="card" style="padding:16px">
          <div class="section">
            <div>
              <div class="muted" style="font-size:12px;font-weight:900">${E(p.purchase_number||'Sin referencia')}</div>
              <h3 style="margin:3px 0 0">${E(p.description||'Compra')}</h3>
              <div class="muted">${E(sm[String(p.supplier_id)]||'Proveedor')} · ${E(p.purchase_date||'')}</div>
            </div>
            <div style="text-align:right"><b>${EUR(p.amount)}</b><div class="muted">${E(p.status||'')}</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button type="button" class="secondary p2Lines" data-id="${p.id}">📦 Ver / editar prendas</button>
            ${!['recibido','recibida','completado','completada'].includes(String(p.status||'').toLowerCase())?
              `<button type="button" class="primary p2Receive" data-id="${p.id}">✅ Recibir compra</button>`:''}
          </div>
        </div>`).join(''):'<div class="card"><div class="empty">Aún no hay compras registradas.</div></div>'}
       </div>
     </div>`;

     window._aihxoSuppliers=suppliers;
     c.querySelector('#p2New')?.addEventListener('click',()=>window.nuevaCompra?.());
     c.querySelector('#p2Suppliers')?.addEventListener('click',()=>window.aihxoGestionProveedores?.());
     c.querySelector('#p2Import')?.addEventListener('click',()=>window.importarFacturaCompra?.());
     c.querySelectorAll('.p2Lines').forEach(b=>b.addEventListener('click',()=>window.editarLineasCompra?.(b.dataset.id)));
     c.querySelectorAll('.p2Receive').forEach(b=>b.addEventListener('click',()=>window.recepcionarCompraCompleta?.(b.dataset.id,b)));
   }catch(err){
     console.error('Compras v2:',err);
     c.innerHTML=`<div class="page"><div class="card">
       <h2>🛒 Compras</h2>
       <div style="color:#b42318;font-weight:900;margin-top:10px">No se pudo cargar la sección.</div>
       <div class="muted" style="margin-top:8px">${E(err?.message||'Error desconocido')}</div>
       <button type="button" class="primary" id="p2Retry" style="margin-top:14px">Reintentar</button>
     </div></div>`;
     c.querySelector('#p2Retry')?.addEventListener('click',()=>loadBasic(c));
   }
 }


 let purchaseInvoiceFile=null;
 let purchaseInvoiceData=null;
 const BUCKET='purchase-invoices';
 const today=()=>new Date().toISOString().slice(0,10);
 const fileToBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]||'');r.onerror=reject;r.readAsDataURL(file)});

 async function compressImage(file){
   if(!file?.type?.startsWith('image/')||file.size<1800000) return file;
   const bitmap=await createImageBitmap(file), max=1800, scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84));
   return new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'});
 }

 function purchaseDrawer(){
   const d=document.querySelector('#drawer'),b=document.querySelector('#drawerBody');
   if(!d||!b)return null;d.classList.remove('hidden');return b;
 }

 window.importarFacturaCompra=function(){
   purchaseInvoiceFile=null;purchaseInvoiceData=null;
   const b=purchaseDrawer();if(!b)return;
   b.innerHTML=`<h2>📄 Importar factura de proveedor</h2>
     <p class="muted">Sube una foto o PDF. AIHXO leerá proveedor, número, fecha, total y conceptos. Después podrás asociar cada línea a una prenda concreta antes de guardar.</p>
     <div style="display:grid;gap:10px;margin-top:16px">
       <button class="primary" type="button" id="pciCameraBtn">📷 Hacer foto</button>
       <button class="secondary" type="button" id="pciFileBtn">📁 Elegir imagen o PDF</button>
     </div>
     <input id="pciCamera" type="file" accept="image/*" capture="environment" style="display:none">
     <input id="pciFile" type="file" accept="image/*,application/pdf,.pdf" style="display:none">
     <div id="pciStatus" style="margin-top:16px"></div>`;
   b.querySelector('#pciCameraBtn').onclick=()=>b.querySelector('#pciCamera').click();
   b.querySelector('#pciFileBtn').onclick=()=>b.querySelector('#pciFile').click();
   b.querySelector('#pciCamera').onchange=e=>analyzePurchaseInvoice(e.target.files?.[0]);
   b.querySelector('#pciFile').onchange=e=>analyzePurchaseInvoice(e.target.files?.[0]);
 };

 async function analyzePurchaseInvoice(file){
   if(!file)return;
   if(file.size>20*1024*1024){toast('El archivo supera 20 MB');return}
   purchaseInvoiceFile=file;
   const status=document.querySelector('#pciStatus');
   if(status)status.innerHTML='<div class="card">🤖 Leyendo factura…</div>';
   try{
     const aiFile=await compressImage(file), base64=await fileToBase64(aiFile);
     const {data,error}=await supabaseClient.functions.invoke('aihxo-invoice-ai',{body:{file_base64:base64,mime_type:aiFile.type||file.type,file_name:file.name}});
     if(error)throw error;if(data?.error)throw new Error(data.error);
     purchaseInvoiceData=data?.invoice||{};
     await showPurchaseInvoiceReview();
   }catch(err){
     console.error('Factura compra:',err);
     if(status)status.innerHTML='<div class="card">⚠️ '+E(err?.message||'No se pudo leer la factura')+'</div>';
   }
 }

 async function showPurchaseInvoiceReview(){
   const b=document.querySelector('#drawerBody');if(!b)return;
   let items=[];
   try{
     if(typeof window.aihxoPurchaseStockOptions==='function'){
       items=await window.aihxoPurchaseStockOptions();
     }else{
       const stockRes=await supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,unit_cost').order('supplier_model').order('size').order('color');
       if(stockRes.error) throw stockRes.error;
       items=stockRes.data||[];
     }
   }catch(error){
     console.error(error);
     toast('No se pudieron cargar las prendas');
     return;
   }
   const {data:suppliers,error:se}=await supabaseClient.from('suppliers').select('id,name').order('name');
   if(se){toast('No se pudo preparar la factura');return}
   const x=purchaseInvoiceData||{}, rawLines=Array.isArray(x.lines)?x.lines:[];
   const guessSupplier=(suppliers||[]).find(s=>String(x.supplier_name||'').toLowerCase().includes(String(s.name||'').toLowerCase())||String(s.name||'').toLowerCase().includes(String(x.supplier_name||'').toLowerCase()));
   const lines=rawLines.length?rawLines:[{description:'Prenda',quantity:1,unit_price:0,total:0}];
   const supplierRefs=guessSupplier?.id ? await loadSupplierReferences(guessSupplier.id) : [];
   const refMatches=lines.map(l=>matchSupplierReference(l,supplierRefs));

   b.innerHTML=`<h2>✅ Revisar factura de compra</h2>
     <div class="muted" style="margin-bottom:14px">La factura no modificará el stock todavía. Primero crea la compra y luego pulsa “Recibir compra” cuando llegue la mercancía.</div>
     <form id="pciReview" class="form">
       <div class="field"><label>Proveedor</label><select name="supplier_id" required><option value="">Selecciona</option>${(suppliers||[]).map(s=>`<option value="${s.id}" ${guessSupplier?.id===s.id?'selected':''}>${E(s.name)}</option>`).join('')}</select></div>
       <div class="formgrid"><div class="field"><label>Nº factura / referencia</label><input name="purchase_number" value="${E(x.invoice_number||'')}"></div><div class="field"><label>Fecha</label><input name="purchase_date" type="date" value="${E(x.invoice_date||today())}" required></div></div>
       <div class="field"><label>Descripción</label><input name="description" value="${E(x.description||('Factura '+(x.supplier_name||'')))}" required></div>
       <div class="field"><label>Total factura €</label><input name="amount" type="number" step=".01" min="0" value="${N(x.total)}" required></div>
       <div class="card" style="margin:8px 0"><b>Conceptos detectados</b><div class="muted" style="margin-top:4px">Asocia solo las líneas que correspondan a prendas de stock.</div>
         <div id="pciLines" style="display:grid;gap:10px;margin-top:10px">
           ${lines.map((l,i)=>{const mr=refMatches[i]; const src=lineSource(l); return `<div class="pciLine" data-line-index="${i}" style="border-top:1px solid #e6eaf0;padding-top:10px">
             <div style="font-weight:800">${E(l.description||('Concepto '+(i+1)))}</div>
             <div style="margin-top:5px;font-size:12px;${mr?'color:#027a48':'color:#b54708'}">${mr?'✅ Referencia reconocida · '+E(mr.provider_sku||mr.provider_reference||mr.provider_model_code||''):'⚠️ Referencia nueva'+(src.sku?' · '+E(src.sku):src.reference?' · '+E(src.reference):'')}</div>
             <div class="formgrid" style="margin-top:8px">
               <div class="field" data-item-search-row style="position:relative">
                 <label>Prenda / variante</label>
                 <input class="pciItemSearch" autocomplete="off" placeholder="Escribe modelo, talla o color…">
                 <input class="pciItem" type="hidden" value="">
                 <div class="pciItemResults" style="display:none;position:absolute;left:0;right:0;top:100%;z-index:50;max-height:260px;overflow:auto;border:1px solid #d0d5dd;border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.14)"></div>
                 <button type="button" class="pciClear secondary" style="margin-top:6px;padding:7px 10px">No añadir a stock</button>
               </div>
               <div class="field"><label>Cantidad</label><input class="pciQty" type="number" min="0" step="1" value="${Math.max(0,N(l.quantity)||1)}"></div>
             </div>
             <div class="field"><label>Coste unitario €</label><input class="pciCost" type="number" min="0" step=".01" value="${N(l.unit_price??l.price??(N(l.quantity)?N(l.total)/N(l.quantity):0)).toFixed(2)}"></div>
           </div>`;}).join('')}
         </div>
       </div>
       <div class="card">📎 <b>${E(purchaseInvoiceFile?.name||'Factura')}</b><div class="muted">Se guardará vinculada a la compra.</div></div>
       <button class="primary" type="submit" style="width:100%">Guardar compra desde factura</button>
       <button class="secondary" type="button" id="pciChooseAgain" style="width:100%;margin-top:8px">Elegir otro archivo</button>
     </form>`;
   bindItemSearch(b,items,{
     inputClass:'pciItemSearch',
     hiddenClass:'pciItem',
     resultsClass:'pciItemResults',
     costClass:'pciCost'
   });
   b.querySelectorAll('.pciLine').forEach((row,i)=>{
     const refMatch=refMatches[i];
     const refItem=refMatch?.base_stock_item_id ? items.find(x=>String(x.id)===String(refMatch.base_stock_item_id)) : null;
     const guessedId=refItem?.id || window.aihxoGuessInvoiceItem?.(lines[i],items);
     const match=items.find(x=>String(x.id)===String(guessedId));
     if(match){
       row.querySelector('.pciItem').value=match.id;
       row.querySelector('.pciItemSearch').value=itemLabel(match);
     }
     row.dataset.supplierReferenceId=refMatch?.id||'';
   });
   b.querySelectorAll('.pciClear').forEach(btn=>btn.onclick=()=>{
     const row=btn.closest('[data-item-search-row]');
     row.querySelector('.pciItem').value='';
     row.querySelector('.pciItemSearch').value='';
     row.querySelector('.pciItemResults').style.display='none';
   });
   b.querySelector('#pciChooseAgain').onclick=()=>window.importarFacturaCompra();
   b.querySelector('#pciReview').onsubmit=savePurchaseInvoice;
 }

 async function savePurchaseInvoice(e){
   e.preventDefault();
   if(!purchaseInvoiceFile)return toast('Falta la factura');
   const btn=e.submitter;if(btn){btn.disabled=true;btn.textContent='Guardando…'}
   const form=e.target,fd=new FormData(form);
   try{
     let ref=String(fd.get('purchase_number')||'').trim();
     if(!ref)ref='AIHXO-COMP-'+Date.now();
     const supplierId=fd.get('supplier_id');
     const duplicate=await supabaseClient.from('purchases').select('id,purchase_number').eq('supplier_id',supplierId);
     if(duplicate.error)throw duplicate.error;
     if((duplicate.data||[]).some(p=>String(p.purchase_number||'').trim().toLowerCase()===ref.toLowerCase()))throw new Error('Ya existe una compra con este proveedor y referencia');
     const invoiceLines=Array.isArray(purchaseInvoiceData?.lines)?purchaseInvoiceData.lines:[];
     const rows=[...form.querySelectorAll('.pciLine')].map((r,i)=>{
       const source=invoiceLines[i]||{};
       return {
         _line:source,
         supplier_reference_id:r.dataset.supplierReferenceId||null,
         item_id:r.querySelector('.pciItem').value,
         ordered_quantity:Math.max(0,Math.round(N(r.querySelector('.pciQty').value))),
         received_quantity:0,
         unit_cost:N(r.querySelector('.pciCost').value),
         source_description:clean(source.description)||null,
         source_sku:clean(source.sku)||null,
         source_reference:clean(source.reference)||null,
         source_color:clean(source.color)||null,
         source_size:clean(source.size)||null
       };
     }).filter(x=>x.item_id&&x.ordered_quantity>0);
     if(!rows.length&&!confirm('No has asociado ninguna línea a prendas de stock. ¿Guardar la compra igualmente?'))return;

     const safe=(purchaseInvoiceFile.name||'factura').replace(/[^a-zA-Z0-9._-]+/g,'_');
     const path=`${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID()}-${safe}`;
     const up=await supabaseClient.storage.from(BUCKET).upload(path,purchaseInvoiceFile,{contentType:purchaseInvoiceFile.type||'application/octet-stream',upsert:false});
     if(up.error)throw up.error;

     const supplierName=form.querySelector('select[name="supplier_id"]')?.selectedOptions?.[0]?.textContent?.trim()||'';
     const resolvedRows=[];
     for(const row of rows){
       const itemId=typeof window.aihxoResolvePurchaseItemId==='function'
         ? await window.aihxoResolvePurchaseItemId(row.item_id,row.unit_cost,supplierName)
         : row.item_id;
       const supplierReferenceId=row.supplier_reference_id || await ensureSupplierReference({
         supplierId,
         supplierName,
         line:row._line,
         itemId,
         invoiceNumber:clean(purchaseInvoiceData?.invoice_number)||ref,
         invoiceDate:fd.get('purchase_date')||today()
       });
       const {_line,...cleanRow}=row;
       resolvedRows.push({...cleanRow,item_id:itemId,supplier_reference_id:supplierReferenceId||null});
     }

     const payload={
       supplier_id:supplierId||null,purchase_number:ref,description:String(fd.get('description')||'Compra').trim(),
       amount:N(fd.get('amount')),purchase_date:fd.get('purchase_date')||today(),status:'Pedido',
       external_invoice_number:clean(purchaseInvoiceData?.invoice_number)||ref,
       external_order_number:clean(purchaseInvoiceData?.order_number)||null,
       supplier_invoice_date:fd.get('purchase_date')||today(),
       notes:'Creada desde factura con AIHXO IA',receipt_path:path,receipt_name:purchaseInvoiceFile.name,
       receipt_mime:purchaseInvoiceFile.type,extracted_data:purchaseInvoiceData||{}
     };
     const {data:purchase,error}=await supabaseClient.from('purchases').insert(payload).select('id').single();
     if(error){await supabaseClient.storage.from(BUCKET).remove([path]);throw error}
     if(rows.length){
       const {error:le}=await supabaseClient.from('purchase_lines').insert(resolvedRows.map(r=>({...r,purchase_id:purchase.id})));
       if(le){
         await supabaseClient.from('purchases').delete().eq('id',purchase.id);
         await supabaseClient.storage.from(BUCKET).remove([path]);
         throw le;
       }
     }
     purchaseInvoiceFile=null;purchaseInvoiceData=null;
     closeDrawer();toast('Compra creada desde factura');
     await loadBasic(document.querySelector('#view'));
   }catch(err){
     console.error('Guardar factura compra:',err);
     alert('No se pudo crear la compra. '+(err?.message||''));
   }finally{
     if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='Guardar compra desde factura'}
   }
 }

 window.comprasView=loadBasic;

 const previous=window.setView;
 window.setView=function(v){
   if(v==='purchases'){
     document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
     const t=document.querySelector('#title'); if(t)t.textContent='Compras';
     loadBasic(document.querySelector('#view'));
     if(typeof window.closeMobileMenu==='function')window.closeMobileMenu();
     return;
   }
   return previous(v);
 };
})();