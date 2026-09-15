/* AIHXO · Pedidos con prenda pendiente de llegada */
(function(){
  const escPS=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const nPS=v=>Number(v||0);
  const byId=(list,id)=>(list||[]).find(x=>String(x.id)===String(id));

  async function subirImagenPedido(orderId,file,side){
    if(!(file instanceof File)||!file.size)return null;
    const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${orderId}/${side}-${Date.now()}.${ext}`;
    const {error}=await supabaseClient.storage.from('order-designs').upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    return path;
  }

  function siguienteNumeroPedido(){
    const max=(orders||[]).reduce((m,o)=>{
      const x=Number(String(o.order_number||'').match(/(\d+)$/)?.[1]||0);
      return Math.max(m,x);
    },0);
    return 'AIHXO-'+String(max+1).padStart(4,'0');
  }

  window.orderForm=async function(){
    const {data:baseStockItems,error:baseStockError}=await supabaseClient
      .from('base_stock_items').select('*').order('garment_type').order('supplier_model').order('color').order('size');
    if(baseStockError){console.error(baseStockError);toast('No se pudo cargar el stock de camisetas');return}

    const drawer=document.getElementById('drawer'),body=document.getElementById('drawerBody');
    if(!drawer||!body)return;
    drawer.classList.remove('hidden');
    body.innerHTML=`
      <h2>Nuevo pedido AIHXO</h2>
      <form class="form" id="of">
        <div class="field"><label>Tipo de pedido</label><select name="order_type" id="orderType"><option value="personalizado">✏️ Personalizado</option><option value="diseno_aihxo">🎨 Diseño AIHXO</option><option value="catalogo">📦 Producto catálogo</option></select><div id="tipoPedidoAyuda" class="muted" style="margin-top:6px;margin-bottom:16px">Personalización creada a medida para el cliente.</div></div>
        <div class="formgrid"><div class="field"><label>Cliente</label><input name="customer" required></div><div class="field"><label>Contacto</label><input name="contact" placeholder="Teléfono / WhatsApp"></div></div>
        <div class="field" id="productoPedidoField"><label>Producto</label><select name="sku" id="osku">${(products||[]).map(p=>`<option value="${p.id}">${escPS(p.model)}${p.size?` · ${escPS(p.size)}`:''}${p.color?` · ${escPS(p.color)}`:''}</option>`).join('')}</select><select name="producto_diseno_aihxo" id="oproductoDisenoAihxo" style="display:none"><option value="">— Selecciona diseño AIHXO —</option>${(designs||[]).filter(d=>d.active===true).map(d=>`<option value="${d.id}">${escPS(d.name)}</option>`).join('')}</select></div>
        <div class="field" id="baseStockPedidoField"><label>👕 Camiseta base necesaria</label><select name="base_stock_item_id" id="obaseStock"><option value="">— Sin prenda vinculada —</option>${(baseStockItems||[]).map(item=>{const q=nPS(item.quantity);return `<option value="${item.id}">${q<=0?'🚚 SIN STOCK · ':''}${escPS(item.supplier_model||item.supplier||item.garment_type||'Camiseta')} · ${escPS(item.color||'')} · ${escPS(item.size||'')} · Stock ${q}</option>`}).join('')}</select><div class="muted" style="margin-top:6px">Puedes seleccionar una talla/color aunque esté a 0. El pedido quedará en <b>Pendiente llegada</b> y se asignará automáticamente al recibir stock.</div></div>
        <div id="personalizacionPedido"><div class="field"><label>Personalización</label><select name="personalization" id="opersonalization"><option value="1">1 impresión</option><option value="2">2 impresiones</option></select></div><div class="formgrid"><div class="field"><label>Ubicación impresión 1</label><input name="position1" placeholder="Ej. Pecho, espalda..."></div><div class="field" id="position2Field" style="display:none"><label>Ubicación impresión 2</label><input name="position2" placeholder="Ej. Espalda, manga..."></div></div></div>
        <div class="field" id="designPedidoField"><label>Diseño</label><input name="design" id="designLibre" placeholder="Nombre o descripción del diseño"></div>
        <div class="card" id="imagenesDisenoPedido" style="padding:16px;margin-bottom:16px"><h3 style="margin-top:0">Imágenes del diseño</h3><div class="formgrid"><div class="field"><label>Diseño delantero</label><input type="file" name="design_front" accept="image/png,image/jpeg,image/webp"><div class="muted" style="margin-top:6px">PNG, JPG o WEBP</div></div><div class="field"><label>Diseño trasero</label><input type="file" name="design_back" accept="image/png,image/jpeg,image/webp"><div class="muted" style="margin-top:6px">PNG, JPG o WEBP</div></div></div></div>
        <div class="field"><label>Notas del cliente</label><textarea name="notes" rows="3" placeholder="Colores, texto, instrucciones especiales..."></textarea></div>
        <div class="formgrid"><div class="field"><label>Cantidad</label><input name="qty" id="oqty" type="number" min="1" value="1"></div><div class="field"><label>Precio unitario</label><input name="price" id="oprice" type="number" step=".01"></div></div>
        <div class="field"><label>Envío cobrado</label><input name="shipping" id="oshipping" type="number" step=".01" value="0"></div>
        <div id="orderSummary" class="card" style="margin:16px 0;padding:16px"></div>
        <button class="primary">Guardar pedido</button>
      </form>`;

    const pSel=document.getElementById('osku'),typeSel=document.getElementById('orderType'),baseSel=document.getElementById('obaseStock');
    const updateSummary=()=>{
      const tipo=typeSel.value,p=tipo==='diseno_aihxo'?null:byId(products,pSel.value),qty=nPS(document.getElementById('oqty').value)||1,price=nPS(document.getElementById('oprice').value),shipping=nPS(document.getElementById('oshipping').value),base=byId(baseStockItems,baseSel.value),total=qty*price+shipping;
      const coste=tipo==='diseno_aihxo'?qty*nPS(base?.unit_cost):p?qty*cost(p):0;
      const waiting=base&&nPS(base.quantity)<qty&&tipo!=='catalogo';
      document.getElementById('orderSummary').innerHTML=`<div class="row"><span>Total cliente</span><b>${money(total)}</b></div><div class="row" style="margin-top:8px"><span>Coste estimado</span><b>${money(coste)}</b></div><div class="row" style="margin-top:8px"><span>Beneficio estimado</span><b>${money(total-coste)}</b></div>${waiting?'<div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff4e5;color:#8a4b08;font-weight:800">🚚 Prenda sin stock: el pedido quedará Pendiente llegada.</div>':''}`;
    };
    const updatePrice=()=>{
      const p=byId(products,pSel.value);if(!p)return;
      let precio=nPS(p.sale_price);if(typeSel.value==='personalizado'){precio=document.getElementById('opersonalization').value==='2'?nPS(p.price_two_print||p.sale_price):nPS(p.price_one_print||p.sale_price)}
      document.getElementById('oprice').value=precio||0;document.getElementById('position2Field').style.display=document.getElementById('opersonalization').value==='2'&&typeSel.value==='personalizado'?'block':'none';updateSummary();
    };
    const updateType=()=>{
      const tipo=typeSel.value,personal=document.getElementById('personalizacionPedido'),design=document.getElementById('designPedidoField'),img=document.getElementById('imagenesDisenoPedido'),prod=document.getElementById('osku'),dsg=document.getElementById('oproductoDisenoAihxo'),baseField=document.getElementById('baseStockPedidoField'),help=document.getElementById('tipoPedidoAyuda');
      if(tipo==='personalizado'){help.textContent='Personalización creada a medida para el cliente.';personal.style.display='block';design.style.display='block';img.style.display='block';prod.style.display='block';dsg.style.display='none';baseField.style.display='block'}
      else if(tipo==='diseno_aihxo'){help.textContent='Pedido de un diseño propio de AIHXO.';personal.style.display='none';design.style.display='none';img.style.display='none';prod.style.display='none';dsg.style.display='block';baseField.style.display='block'}
      else{help.textContent='Venta directa de un producto del catálogo.';personal.style.display='none';design.style.display='none';img.style.display='none';prod.style.display='block';dsg.style.display='none';baseField.style.display='none';baseSel.value=''}
      updatePrice();updateSummary();
    };
    pSel.onchange=updatePrice;typeSel.onchange=updateType;baseSel.onchange=updateSummary;document.getElementById('opersonalization').onchange=updatePrice;document.getElementById('oqty').oninput=updateSummary;document.getElementById('oprice').oninput=updateSummary;document.getElementById('oshipping').oninput=updateSummary;

    document.getElementById('of').onsubmit=async function(e){
      e.preventDefault();const f=new FormData(e.target),tipoPedido=String(f.get('order_type')),qty=Math.max(1,nPS(f.get('qty'))),baseStockId=String(f.get('base_stock_item_id')||''),base=byId(baseStockItems,baseStockId),p=tipoPedido==='diseno_aihxo'?null:byId(products,f.get('sku')),disenoSeleccionado=tipoPedido==='diseno_aihxo'?byId(designs,f.get('producto_diseno_aihxo')):null;
      if(tipoPedido!=='diseno_aihxo'&&!p){toast('Producto no válido');return}
      if(tipoPedido==='diseno_aihxo'&&!disenoSeleccionado){toast('Selecciona un diseño AIHXO');return}
      if(tipoPedido==='catalogo'&&nPS(p.stock)<qty){toast('Stock insuficiente del producto');return}
      if((tipoPedido==='personalizado'||tipoPedido==='diseno_aihxo')&&!base){toast('Selecciona la camiseta base necesaria, aunque esté sin stock');return}

      const hasBase=!!base,allocated=hasBase&&nPS(base.quantity)>=qty,waiting=hasBase&&!allocated&&(tipoPedido==='personalizado'||tipoPedido==='diseno_aihxo');
      if(tipoPedido==='catalogo'&&hasBase&&!allocated){toast('Stock insuficiente de camiseta base');return}

      let customer=(customers||[]).find(x=>String(x.name||'').trim().toLowerCase()===String(f.get('customer')||'').trim().toLowerCase());
      if(!customer){const cr=await supabaseClient.from('customers').insert({name:String(f.get('customer')||'').trim(),contact:f.get('contact')}).select().single();if(cr.error){toast(cr.error.message);return}customer=cr.data}

      const personalization=String(f.get('personalization')||''),nombreDiseno=tipoPedido==='diseno_aihxo'?disenoSeleccionado.name:tipoPedido==='personalizado'?String(f.get('design')||'').trim():'',detalle=[nombreDiseno?`Diseño: ${nombreDiseno}`:'',tipoPedido==='personalizado'?`Personalización: ${personalization} impresión${personalization==='2'?'es':''}`:'',tipoPedido==='personalizado'&&f.get('position1')?`Ubicación 1: ${f.get('position1')}`:'',tipoPedido==='personalizado'&&personalization==='2'&&f.get('position2')?`Ubicación 2: ${f.get('position2')}`:'',f.get('notes')?`Notas: ${f.get('notes')}`:''].filter(Boolean).join(' | '),price=nPS(f.get('price')),shipping=nPS(f.get('shipping')),now=new Date().toISOString(),orderNumber=siguienteNumeroPedido();
      const order={order_number:orderNumber,order_type:tipoPedido,customer_id:customer.id,customer_name:customer.name,contact:f.get('contact'),product_id:tipoPedido==='diseno_aihxo'?null:p.id,product_name:tipoPedido==='diseno_aihxo'?disenoSeleccionado.name:p.model,size:base?.size||p?.size||null,color:base?.color||p?.color||null,design:detalle,quantity:qty,unit_price:price,shipping,total:qty*price+shipping,product_cost:tipoPedido==='diseno_aihxo'?qty*nPS(base?.unit_cost):qty*cost(p),status:'Pendiente',production_status:waiting?'Pendiente llegada':'Pendiente',base_stock_item_id:hasBase?base.id:null,base_stock_quantity:hasBase?qty:0,base_stock_allocated:allocated,base_stock_waiting_since:waiting?now:null,base_stock_allocated_at:allocated?now:null};
      if(tipoPedido==='personalizado'){order.design_status='Pendiente';order.design_approval_status='Pendiente cliente'}

      const r=await supabaseClient.from('orders').insert(order).select().single();if(r.error){console.error(r.error);toast(r.error.message);return}const orderId=r.data.id;
      try{const front=await subirImagenPedido(orderId,f.get('design_front'),'front'),back=await subirImagenPedido(orderId,f.get('design_back'),'back');if(front||back){const patch={};if(front)patch.design_front_path=front;if(back)patch.design_back_path=back;const ur=await supabaseClient.from('orders').update(patch).eq('id',orderId);if(ur.error)throw ur.error}}catch(err){console.error(err);toast('El pedido se guardó, pero hubo un problema con las imágenes')}

      if(tipoPedido==='catalogo'&&p){const pr=await supabaseClient.from('products').update({stock:nPS(p.stock)-qty}).eq('id',p.id);if(pr.error)console.error(pr.error)}
      if(allocated&&base){const prev=nPS(base.quantity),next=prev-qty,bu=await supabaseClient.from('base_stock_items').update({quantity:next}).eq('id',base.id);if(bu.error){console.error(bu.error);toast('Pedido creado, pero hubo un error al reservar la camiseta');return}const mv=await supabaseClient.from('base_stock_movements').insert({item_id:base.id,movement_type:'salida',quantity_delta:-qty,previous_quantity:prev,new_quantity:next,reason:`Reserva pedido ${orderNumber}`});if(mv.error)console.error(mv.error)}

      closeDrawer();await loadAll();setView('orders');toast(waiting?`Pedido ${orderNumber} · pendiente llegada de prenda`:`Pedido ${orderNumber} guardado`);
    };
    updateType();
  };

  function bindQuick(){const b=document.getElementById('quickOrder');if(b)b.onclick=()=>window.orderForm()}
  new MutationObserver(bindQuick).observe(document.documentElement,{childList:true,subtree:true});setTimeout(bindQuick,0);
})();