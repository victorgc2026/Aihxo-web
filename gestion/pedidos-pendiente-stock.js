/* AIHXO · Alta de pedidos: varias prendas y reserva atómica */
(function(){
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const N=v=>Number(v||0),norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const zones=['Pecho izquierdo','Pecho derecho','Delantera','Espalda','Manga izquierda','Manga derecha','Cuello','Hombro izquierdo','Hombro derecho','Lateral','Bajo'];
 const label=i=>`${i.supplier_model||i.model||'Prenda'} · ${i.color||''} · ${i.size||''}${i.model?'':` · Disponible ${N(i.quantity)}`}`;
 window.orderForm=async function(){
  let items;
  try{items=await window.aihxoPurchaseStockOptions();}catch(e){toast('No se pudieron cargar las prendas: '+e.message);return}
  const body=$('#drawerBody');$('#drawer').classList.remove('hidden');
  body.innerHTML=`<h2>Nuevo pedido AIHXO</h2><form id="of" class="form">
   <fieldset id="orderFields" style="border:0;padding:0;margin:0;min-width:0">
   <div class="field"><label>Tipo de pedido</label><select id="orderType"><option value="personalizado">✏️ Personalizado</option><option value="diseno_aihxo">🎨 Diseño AIHXO</option><option value="catalogo">📦 Producto catálogo</option></select></div>
   <div class="field"><label>Buscar cliente existente</label><input id="customerSearch" type="search" placeholder="Nombre, teléfono o correo"><select id="customerSelect"><option value="">＋ Cliente nuevo</option></select></div>
   <div class="formgrid"><div class="field"><label>Cliente</label><input id="orderCustomer" required></div><div class="field"><label>Contacto</label><input id="orderContact" placeholder="Teléfono / WhatsApp"></div></div>
   <div id="customProduct" class="card">✏️ Producto personalizado</div>
   <div id="orderLines" style="display:grid;gap:12px"></div><button type="button" id="addOrderLine" class="secondary">＋ Añadir otra talla o prenda</button>
   <details id="quickGarment" class="card" style="margin-top:12px"><summary>＋ Nueva prenda base / variante</summary><div class="muted">Se crea con stock 0. Registra la entrada en Compras o Stock cuando tengas la prenda.</div>
    <div class="formgrid">${[['Brand','Marca'],['Model','Modelo'],['Size','Talla'],['Color','Color']].map(([k,t])=>`<div class="field"><label>${t}</label><input id="quick${k}"></div>`).join('')}<div class="field"><label>Coste unitario €</label><input id="quickCost" type="number" min="0" step=".01" value="0"></div></div><button id="saveQuickGarment" type="button" class="secondary">Crear y seleccionar</button><div id="quickGarmentStatus" role="status"></div></details>
   <div class="field"><label>Diseño e instrucciones</label><textarea id="orderDesign" rows="3" placeholder="Nombre, texto, colores e instrucciones del cliente"></textarea></div>
   <div class="card"><h3>Zonas y archivos de impresión</h3><div id="printZones" style="display:grid;gap:12px"></div><button id="addPrintZone" type="button" class="secondary">＋ Añadir zona</button><div class="muted">Medidas en cm. Archivos PNG, JPG o WEBP, máximo 20 MB por zona.</div></div>
   <div class="card"><h3>Costes estimados del pedido completo</h3><div class="muted">Introduce los importes totales, no por camiseta. Si falta un coste, el margen será provisional.</div><div class="formgrid">${[['dtf','DTF'],['packaging','Embalaje'],['transport','Transporte proveedor'],['extras','Otros costes']].map(([k,t])=>`<div class="field"><label>${t} €</label><input id="estimate_${k}" type="number" min="0" step=".01" placeholder="Sin completar"></div>`).join('')}</div></div>
   <div class="field"><label>Envío cobrado al cliente €</label><input id="oshipping" type="number" min="0" step=".01" value="0" required></div>
   </fieldset><div id="orderSummary" class="card"></div><div id="orderSaveStatus" role="status" style="margin:12px 0"></div><button id="saveOrder" class="primary" type="submit">Guardar pedido</button></form>`;
  const form=$('#of'),type=$('#orderType');let busy=false,saved=null,requestId=crypto.randomUUID();
  function customerOptions(){const q=norm($('#customerSearch').value),selected=$('#customerSelect').value;$('#customerSelect').innerHTML='<option value="">＋ Cliente nuevo</option>'+customers.filter(c=>c.id===selected||norm(`${c.name} ${c.surname||''} ${c.contact||''} ${c.phone||''} ${c.email||''}`).includes(q)).map(c=>`<option value="${c.id}" ${c.id===selected?'selected':''}>${E(c.name)} ${E(c.surname||'')} · ${E(c.contact||c.phone||c.email||'')}</option>`).join('')}
  customerOptions();$('#customerSearch').oninput=customerOptions;
  $('#customerSelect').onchange=()=>{const c=customers.find(x=>x.id===$('#customerSelect').value);$('#orderCustomer').value=c?`${c.name}`:'';$('#orderCustomer').readOnly=!!c;$('#orderContact').value=c?.contact||c?.phone||c?.email||''};
  const eligibleProducts=()=>products.filter(p=>type.value==='diseno_aihxo'?norm(p.category).includes('diseno propio'):!norm(p.category).includes('diseno propio'));
  function fillLine(row){
   const q=norm(row.querySelector('.lineSearch').value),sel=row.querySelector('.lineItem'),current=sel.value,list=type.value==='catalogo'?eligibleProducts():items;
   sel.innerHTML='<option value="">Selecciona prenda / variante</option>'+list.filter(i=>i.id===current||q.split(/\s+/).every(w=>norm(label(i)).includes(w))).map(i=>`<option value="${E(i.id)}" ${i.id===current?'selected':''}>${E(label(i))}</option>`).join('');
   row.querySelector('.lineProductField').hidden=type.value!=='diseno_aihxo';
   row.querySelector('.lineProduct').required=type.value==='diseno_aihxo';
   row.querySelector('.lineProduct').innerHTML='<option value="">Selecciona diseño AIHXO</option>'+eligibleProducts().map(p=>`<option value="${p.id}">${E(p.model)}</option>`).join('');
  }
  function addLine(){const row=document.createElement('div');row.className='card order-line';row.innerHTML=`<div class="field"><label>Buscar prenda, talla o color</label><input class="lineSearch" type="search"><select class="lineItem" required></select></div><div class="field lineProductField"><label>Diseño AIHXO</label><select class="lineProduct"></select></div><div class="formgrid"><div class="field"><label>Unidades</label><input class="lineQty" type="number" min="1" step="1" value="1" required></div><div class="field"><label>Precio por unidad €</label><input class="linePrice" type="number" min="0" step=".01" required></div></div><button type="button" class="secondary removeLine">Quitar línea</button>`;$('#orderLines').appendChild(row);fillLine(row);
   row.querySelector('.lineSearch').oninput=()=>{const product=row.querySelector('.lineProduct').value;fillLine(row);row.querySelector('.lineProduct').value=product};
   const price=()=>{if(type.value!=='personalizado'){const id=type.value==='catalogo'?row.querySelector('.lineItem').value:row.querySelector('.lineProduct').value;row.querySelector('.linePrice').value=N(products.find(p=>p.id===id)?.sale_price)}summary()};
   row.querySelector('.lineItem').onchange=price;row.querySelector('.lineProduct').onchange=price;
   row.querySelector('.removeLine').onclick=()=>{if($('#orderLines').children.length===1)return toast('Debe quedar al menos una prenda');row.remove();summary()};summary();
  }
  const readLines=()=>[...form.querySelectorAll('.order-line')].map(row=>({item_id:type.value==='catalogo'?null:row.querySelector('.lineItem').value,product_id:type.value==='catalogo'?row.querySelector('.lineItem').value:type.value==='diseno_aihxo'?row.querySelector('.lineProduct').value:null,quantity:N(row.querySelector('.lineQty').value),unit_price:N(row.querySelector('.linePrice').value)}));
  function summary(){const lines=readLines(),sale=lines.reduce((a,l)=>a+l.quantity*l.unit_price,0)+N($('#oshipping').value);let base=0;for(const l of lines){const p=products.find(p=>p.id===l.product_id),i=items.find(i=>i.id===l.item_id);base+=l.quantity*(type.value==='catalogo'?(p?cost(p):0):N(i?.unit_cost))}const extras=['dtf','packaging','transport','extras'].reduce((a,k)=>a+N($('#estimate_'+k).value),0);$('#orderSummary').innerHTML=`<div>Total cliente: <b>${money(sale)}</b></div><div>Costes estimados: <b>${money(base+extras)}</b></div><div>Margen provisional: <b>${money(sale-base-extras)}</b></div><div class="muted">${lines.reduce((a,l)=>a+l.quantity,0)} prendas · Comprueba los costes antes de considerar este margen definitivo.</div>`}
  function addZone(){const row=document.createElement('div');row.className='print-zone';row.innerHTML=`<div class="field"><label>Zona</label><select class="zoneName">${zones.map(z=>`<option>${z}</option>`).join('')}</select></div><div class="formgrid"><div class="field"><label>Ancho cm</label><input class="zoneWidth" type="number" min="0.1" step=".1"></div><div class="field"><label>Alto cm</label><input class="zoneHeight" type="number" min="0.1" step=".1"></div></div><input class="zoneFile" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" class="secondary removeZone">Quitar zona</button>`;$('#printZones').appendChild(row);row.querySelector('.removeZone').onclick=()=>row.remove()}
  $('#addOrderLine').onclick=addLine;$('#addPrintZone').onclick=addZone;form.addEventListener('input',summary);
  type.onchange=()=>{$('#customProduct').hidden=type.value!=='personalizado';$('#quickGarment').hidden=type.value==='catalogo';$('#orderLines').innerHTML='';addLine()};
  $('#saveQuickGarment').onclick=async()=>{const btn=$('#saveQuickGarment');btn.disabled=true;try{const {data,error}=await supabaseClient.rpc('quick_order_garment',{p_manufacturer:$('#quickBrand').value,p_model:$('#quickModel').value,p_size:$('#quickSize').value,p_color:$('#quickColor').value,p_cost:N($('#quickCost').value)});if(error)throw error;items=await window.aihxoPurchaseStockOptions();const row=$('#orderLines').lastElementChild;row.querySelector('.lineSearch').value='';const product=row.querySelector('.lineProduct').value;fillLine(row);row.querySelector('.lineProduct').value=product;row.querySelector('.lineItem').value=data.id;$('#quickGarmentStatus').textContent='Prenda seleccionada. Registra sus existencias cuando corresponda.';summary()}catch(e){$('#quickGarmentStatus').textContent=e.message}finally{btn.disabled=false}};
  addLine();addZone();
  form.onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const btn=$('#saveOrder'),status=$('#orderSaveStatus');btn.disabled=true;btn.textContent='Guardando…';status.textContent='';
   try{
    const zoneRows=[...form.querySelectorAll('.print-zone')];
    for(const row of zoneRows){const file=row.querySelector('.zoneFile').files[0];if(file&&(file.size>20*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type)))throw new Error('Cada archivo debe ser PNG, JPG o WEBP de hasta 20 MB')}
    if(!saved){
     const lines=readLines();
     for(const l of lines){if(l.item_id?.startsWith('new|')){const item=items.find(i=>i.id===l.item_id);const {data,error}=await supabaseClient.rpc('quick_order_garment',{p_manufacturer:item.supplier,p_model:item.supplier_model,p_size:item.size,p_color:item.color,p_cost:N(item.unit_cost)});if(error)throw error;l.item_id=data.id}}
     const source=$('#aihxoNewOrderAISource')?.value||'aihxo';
     const estimates=Object.fromEntries(['dtf','packaging','transport','extras'].filter(k=>$('#estimate_'+k).value!=='').map(k=>[k,N($('#estimate_'+k).value)]));
     const printZones=zoneRows.map(row=>({zone:row.querySelector('.zoneName').value,width_cm:N(row.querySelector('.zoneWidth').value)||null,height_cm:N(row.querySelector('.zoneHeight').value)||null}));
     const {data,error}=await supabaseClient.rpc('create_order_atomic',{p_request_id:requestId,p_order:{order_type:type.value,customer_id:$('#customerSelect').value||null,customer_name:$('#orderCustomer').value,contact:$('#orderContact').value,design:$('#orderDesign').value,shipping:N($('#oshipping').value),estimated_costs:estimates,print_zones:printZones,design_source:source},p_lines:lines});if(error)throw error;saved=data;$('#orderFields').disabled=true;
    }
    const printZones=saved.print_zones||[],patch={};
    for(let i=0;i<zoneRows.length;i++){
     const file=zoneRows[i].querySelector('.zoneFile').files[0];if(!file||printZones[i]?.path)continue;
     const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg',path=`${saved.id}/zone-${i}-${requestId}.${ext}`;
     const up=await supabaseClient.storage.from('order-designs').upload(path,file,{contentType:file.type,upsert:true});if(up.error)throw up.error;
     printZones[i]={...printZones[i],path,file_name:file.name};
     if(printZones[i].zone==='Delantera'||printZones[i].zone==='Pecho izquierdo')patch.design_front_path=path;
     if(printZones[i].zone==='Espalda')patch.design_back_path=path;
    }
    for(const z of printZones){if(z.path&&['Delantera','Pecho izquierdo'].includes(z.zone))patch.design_front_path=z.path;if(z.path&&z.zone==='Espalda')patch.design_back_path=z.path;}
    const up=await supabaseClient.from('orders').update({...patch,print_zones:printZones}).eq('id',saved.id);if(up.error)throw up.error;
    closeDrawer();await loadAll();setView('orders');toast(`Pedido ${saved.order_number} guardado${saved.base_stock_allocated?'':' · pendiente de prendas'}`);
   }catch(err){status.textContent=saved?`Pedido ${saved.order_number} guardado. Falta completar los archivos: ${err.message}. Puedes reintentarlo sin crear otro pedido.`:err.message;btn.textContent=saved?'Reintentar archivos':'Reintentar guardado';}
   finally{busy=false;btn.disabled=false;}
  };
 };
})();
