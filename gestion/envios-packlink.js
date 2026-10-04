/* AIHXO · Centro de Envíos + Packlink PRO */
(function(){
  if(window.__aihxoEnviosPacklink) return;
  window.__aihxoEnviosPacklink=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=v=>Number(v||0);
  const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(num(v));

  async function apiStatus(){
    try{
      const {data,error}=await supabaseClient.functions.invoke('packlink-pro',{body:{action:'status'}});
      if(error) throw error;
      return data||{configured:false};
    }catch(e){ return {configured:false,error:e?.message||'No disponible'}; }
  }

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav || nav.querySelector('[data-aihxo-envios]')) return;
    const ordersBtn=nav.querySelector('[data-view="orders"]');
    const b=document.createElement('button');
    b.type='button'; b.setAttribute('data-aihxo-envios','1');
    b.innerHTML='🚚 <span>Envíos</span>';
    b.onclick=()=>{window.renderEnvios(); if(window.closeMobileMenu) closeMobileMenu();};
    if(ordersBtn) ordersBtn.insertAdjacentElement('afterend',b); else nav.prepend(b);
  }

  const navObserver=new MutationObserver(injectNav);
  navObserver.observe(document.documentElement,{subtree:true,childList:true});
  injectNav();

  async function fetchShipments(){
    const {data,error}=await supabaseClient.from('shipments').select('*, shipment_orders(order_id,allocated_cost)').order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  window.renderEnvios=async function(){
    injectNav();
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('[data-aihxo-envios]')?.classList.add('active');
    const title=document.getElementById('title'); if(title) title.textContent='Envíos';
    const root=document.getElementById('view'); if(!root) return;
    root.innerHTML='<div class="page"><div class="card">Cargando envíos…</div></div>';
    const [rows,status]=await Promise.all([fetchShipments().catch(()=>[]),apiStatus()]);
    const pending=rows.filter(x=>!['Entregado','Cancelado'].includes(x.status)).length;
    root.innerHTML=`
      <div class="page">
        <div class="section">
          <div><h2>🚚 Centro de Envíos</h2><div class="muted">Preparación, coste, etiqueta y seguimiento de pedidos</div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="primary" id="plImport">＋ Vincular envío de Packlink</button>
            <button class="secondary" id="plOpen">Abrir Packlink PRO</button>
          </div>
        </div>
        <div class="grid four">
          ${typeof kpi==='function'?kpi('Envíos',rows.length,'registrados'):''}
          ${typeof kpi==='function'?kpi('Pendientes',pending,'por completar'):''}
          ${typeof kpi==='function'?kpi('Packlink PRO',status.configured?'Conectado':'Pendiente',status.configured?'API lista':'falta guardar clave segura'):''}
          ${typeof kpi==='function'?kpi('Coste envíos',eur(rows.reduce((a,x)=>a+num(x.price),0)),'real'):''}
        </div>
        ${!status.configured?'<div class="card" style="margin-bottom:14px"><b>🔐 Packlink PRO preparado</b><div class="muted" style="margin-top:6px">La integración segura está instalada. Falta introducir la API key como secreto del servidor; no se guarda en GitHub ni en el navegador.</div></div>':''}
        <div class="card">
          <div class="table-wrap"><table>
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Transportista</th><th>Coste</th><th>Estado</th><th>Seguimiento</th><th></th></tr></thead>
            <tbody>
              ${rows.length?rows.map(s=>{
                const linked=(s.shipment_orders||[]).map(l=>(orders||[]).find(x=>String(x.id)===String(l.order_id))).filter(Boolean);
                const fallback=s.order_id?(orders||[]).find(x=>String(x.id)===String(s.order_id)):null;
                if(!linked.length && fallback) linked.push(fallback);
                return `<tr>
                  <td><b>${linked.length?linked.map(o=>esc(o.order_number||'—')).join('<br>'):'—'}</b></td>
                  <td>${esc(s.recipient_name||linked[0]?.customer_name||'—')}</td>
                  <td>${esc(s.carrier_name||s.service_name||'—')}</td>
                  <td>${s.price!=null?eur(s.price):'—'}</td>
                  <td>${esc(s.status||'Pendiente')}</td>
                  <td>${esc(s.tracking_number||'—')}</td>
                  <td><button class="secondary small" onclick="prepararEnvio('${s.order_id}')">Abrir</button></td>
                </tr>`;
              }).join(''):'<tr><td colspan="7"><div class="empty">Todavía no hay envíos preparados.</div></td></tr>'}
            </tbody>
          </table></div>
        </div>
      </div>`;
    document.getElementById('plOpen').onclick=()=>window.open('https://pro.packlink.es/','_blank','noopener');
    document.getElementById('plImport').onclick=()=>window.vincularEnvioPacklink();
  };

  function normalizeRemoteShipment(x){
    const address=x?.to || x?.destination || x?.recipient || x?.address_to || {};
    const service=x?.service || x?.service_info || {};
    const carrier=x?.carrier || service?.carrier || {};
    const parcel=(x?.packages||x?.parcels||x?.package||[]); const p=Array.isArray(parcel)?(parcel[0]||{}):parcel;
    return {
      reference:String(x?.reference||x?.shipment_reference||x?.id||x?.order_reference||''),
      recipient_name:String(address?.name||address?.full_name||x?.recipient_name||x?.name||''),
      recipient_email:String(address?.email||x?.recipient_email||''),
      recipient_phone:String(address?.phone||address?.telephone||x?.recipient_phone||''),
      address_line1:String(address?.street1||address?.address||address?.address1||x?.address||''),
      postal_code:String(address?.zip_code||address?.postal_code||address?.zip||x?.postal_code||''),
      city:String(address?.city||x?.city||''),
      province:String(address?.state||address?.province||x?.province||''),
      carrier_name:String(carrier?.name||service?.carrier_name||x?.carrier_name||x?.carrier||''),
      service_name:String(service?.name||service?.label||x?.service_name||x?.service||''),
      price:Number(x?.price?.total_price??x?.price?.total??x?.total_price??x?.price??0)||null,
      tracking_number:String(x?.tracking_number||x?.tracking||x?.tracking_code||''),
      tracking_url:String(x?.tracking_url||x?.tracking_link||''),
      label_url:String(x?.label_url||x?.labels?.[0]?.url||''),
      status:String(x?.status||x?.state||'Contratado'),
      weight_kg:Number(p?.weight??p?.weight_kg??x?.weight??0)||null,
      length_cm:Number(p?.length??p?.length_cm??0)||null,
      width_cm:Number(p?.width??p?.width_cm??0)||null,
      height_cm:Number(p?.height??p?.height_cm??0)||null,
      raw:x
    };
  }

  function candidateOrder(remote){
    const rn=String(remote.recipient_name||'').toLowerCase().replace(/[^a-z0-9áéíóúüñ ]/g,' ').replace(/\s+/g,' ').trim();
    if(!rn) return null;
    let best=null,bestScore=0;
    for(const o of (orders||[])){
      const on=String(o.customer_name||'').toLowerCase().replace(/[^a-z0-9áéíóúüñ ]/g,' ').replace(/\s+/g,' ').trim();
      let score=0;
      if(on===rn) score=100;
      else {
        const a=new Set(on.split(' ').filter(Boolean)), b=new Set(rn.split(' ').filter(Boolean));
        for(const w of a) if(b.has(w)) score+=20;
      }
      if(score>bestScore){best=o;bestScore=score;}
    }
    return bestScore>=40?best:null;
  }

  window.vincularEnvioPacklink=function(prefill={}){
    const drawer=document.getElementById('drawer'),body=document.getElementById('drawerBody'); if(!drawer||!body)return;
    const available=(orders||[]).filter(o=>String(o.status||'').toLowerCase()!=='cancelado');
    body.innerHTML=`
      <div class="section"><div><h2>🔗 Vincular envío de Packlink</h2><div class="muted">Para envíos creados directamente en Packlink PRO</div></div></div>
      <form id="plLinkForm" class="form">
        <div class="field"><label>Pedidos AIHXO incluidos en este envío</label><div id="plOrderChecks" style="display:grid;gap:8px;max-height:260px;overflow:auto;padding:8px;border:1px solid #e4e7ec;border-radius:12px">${available.map(o=>`<label style="display:flex;align-items:center;gap:10px"><input type="checkbox" name="order_ids" value="${o.id}"><span><b>${esc(o.order_number||'Pedido')}</b> · ${esc(o.customer_name||'')}</span></label>`).join('')}</div><div class="muted" style="margin-top:6px">Puedes seleccionar dos o más pedidos si viajan juntos en el mismo paquete.</div></div>
        <div class="formgrid">
          <div class="field"><label>Destinatario</label><input name="recipient_name" value="${esc(prefill.recipient_name||'')}"></div>
          <div class="field"><label>Transportista</label><input name="carrier_name" value="${esc(prefill.carrier_name||'')}"></div>
          <div class="field"><label>Servicio</label><input name="service_name" value="${esc(prefill.service_name||'')}"></div>
          <div class="field"><label>Coste real (€)</label><input name="price" type="number" min="0" step="0.01" value="${prefill.price??''}"></div>
          <div class="field"><label>Referencia Packlink</label><input name="packlink_reference" value="${esc(prefill.reference||'')}"></div>
          <div class="field"><label>Seguimiento</label><input name="tracking_number" value="${esc(prefill.tracking_number||'')}"></div>
        </div>
        <div class="field"><label>URL seguimiento</label><input name="tracking_url" value="${esc(prefill.tracking_url||'')}"></div>
        <div class="field"><label>URL etiqueta</label><input name="label_url" value="${esc(prefill.label_url||'')}"></div>
        <div class="field"><label>Estado</label><select name="status">${['Preparado','Contratado','Listo para enviar','En tránsito','Entregado','Incidencia'].map(x=>`<option>${x}</option>`).join('')}</select></div>
        <button class="primary" type="submit">Guardar y vincular</button>
      </form>`;
    drawer.classList.remove('hidden');
    const form=document.getElementById('plLinkForm');
    form.onsubmit=async e=>{
      e.preventDefault(); const fd=new FormData(form);
      const orderIds=[...form.querySelectorAll('input[name="order_ids"]:checked')].map(x=>String(x.value));
      if(!orderIds.length){toast('Selecciona al menos un pedido');return;}
      const selectedOrders=(orders||[]).filter(o=>orderIds.includes(String(o.id)));
      const primaryOrder=selectedOrders[0];
      const price=fd.get('price')===''?null:num(fd.get('price'));
      const payload={
        order_id:null,provider:'packlink_pro',status:String(fd.get('status')||'Contratado'),
        recipient_name:String(fd.get('recipient_name')||primaryOrder?.customer_name||'').trim(),
        carrier_name:String(fd.get('carrier_name')||'').trim(),
        service_name:String(fd.get('service_name')||'').trim(),
        price,packlink_reference:String(fd.get('packlink_reference')||'').trim(),
        tracking_number:String(fd.get('tracking_number')||'').trim(),
        tracking_url:String(fd.get('tracking_url')||'').trim(),
        label_url:String(fd.get('label_url')||'').trim(),
        metadata:{source:'manual_packlink_link'},updated_at:new Date().toISOString()
      };
      const ins=await supabaseClient.from('shipments').insert(payload).select('id').single();
      if(ins.error){console.error(ins.error);toast('No se pudo vincular el envío');return;}
      const shipmentId=ins.data.id;
      const splitCost=price==null?null:price/orderIds.length;
      const links=orderIds.map(id=>({shipment_id:shipmentId,order_id:id,allocated_cost:splitCost}));
      const linkRes=await supabaseClient.from('shipment_orders').insert(links);
      if(linkRes.error){console.error(linkRes.error);toast('Envío creado, pero no se pudieron vincular todos los pedidos');return;}
      if(splitCost!=null){
        for(const o of selectedOrders){
          await supabaseClient.from('orders').update({outbound_shipping_cost:splitCost}).eq('id',o.id);
          o.outbound_shipping_cost=splitCost;
        }
      }
      toast('Envío vinculado a '+orderIds.length+' pedido'+(orderIds.length===1?'':'s'));
      if(typeof closeDrawer==='function')closeDrawer();
      await window.renderEnvios();
    };
  };

  window.prepararEnvio=async function(orderId){
    const o=(orders||[]).find(x=>String(x.id)===String(orderId));
    if(!o){toast('Pedido no encontrado');return;}
    const customer=(customers||[]).find(x=>String(x.id)===String(o.customer_id))||{};
    const {data:shipment,error}=await supabaseClient.from('shipments').select('*').eq('order_id',orderId).maybeSingle();
    if(error){toast('No se pudo cargar el envío');return;}
    const s=shipment||{};
    const drawer=document.getElementById('drawer'),body=document.getElementById('drawerBody');
    if(!drawer||!body)return;
    body.innerHTML=`
      <div class="section"><div><h2>🚚 Preparar envío</h2><div class="muted">${esc(o.order_number||'')} · ${esc(o.customer_name||'')}</div></div></div>
      <div class="card">
        <h3>Destinatario</h3>
        <div class="formgrid">
          <div class="field"><label>Nombre</label><input id="shName" value="${esc(s.recipient_name||[customer.name,customer.surname].filter(Boolean).join(' ')||o.customer_name||'')}"></div>
          <div class="field"><label>Teléfono</label><input id="shPhone" value="${esc(s.recipient_phone||customer.phone||o.contact||'')}"></div>
          <div class="field"><label>Email</label><input id="shEmail" type="email" value="${esc(s.recipient_email||customer.email||'')}"></div>
          <div class="field"><label>CP</label><input id="shPostal" value="${esc(s.postal_code||customer.postal_code||'')}"></div>
        </div>
        <div class="field"><label>Dirección</label><input id="shAddress" value="${esc(s.address_line1||customer.address||'')}"></div>
        <div class="formgrid">
          <div class="field"><label>Localidad</label><input id="shCity" value="${esc(s.city||customer.city||'')}"></div>
          <div class="field"><label>Provincia</label><input id="shProvince" value="${esc(s.province||'A Coruña')}"></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Paquete</h3>
        <div class="formgrid">
          <div class="field"><label>Tipo</label><select id="shPackage">
            ${['1 camiseta','2–3 camisetas','Sudadera / prenda grande','Pedido grande','Personalizado'].map(x=>`<option ${s.package_name===x?'selected':''}>${x}</option>`).join('')}
          </select></div>
          <div class="field"><label>Peso (kg)</label><input id="shWeight" type="number" step="0.01" value="${s.weight_kg??'0.40'}"></div>
          <div class="field"><label>Largo (cm)</label><input id="shLength" type="number" step="0.1" value="${s.length_cm??'32'}"></div>
          <div class="field"><label>Ancho (cm)</label><input id="shWidth" type="number" step="0.1" value="${s.width_cm??'25'}"></div>
          <div class="field"><label>Alto (cm)</label><input id="shHeight" type="number" step="0.1" value="${s.height_cm??'5'}"></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px">
        <h3>Contratación / seguimiento</h3>
        <div class="formgrid">
          <div class="field"><label>Transportista</label><input id="shCarrier" value="${esc(s.carrier_name||'')}"></div>
          <div class="field"><label>Servicio</label><input id="shService" value="${esc(s.service_name||'')}"></div>
          <div class="field"><label>Coste real (€)</label><input id="shPrice" type="number" step="0.01" value="${s.price??o.outbound_shipping_cost??''}"></div>
          <div class="field"><label>Estado</label><select id="shStatus">${['Pendiente','Preparado','Contratado','En tránsito','Entregado','Incidencia','Cancelado'].map(x=>`<option ${(s.status||'Pendiente')===x?'selected':''}>${x}</option>`).join('')}</select></div>
          <div class="field"><label>Referencia Packlink</label><input id="shRef" value="${esc(s.packlink_reference||'')}"></div>
          <div class="field"><label>Seguimiento</label><input id="shTracking" value="${esc(s.tracking_number||'')}"></div>
        </div>
        <div class="field"><label>URL seguimiento</label><input id="shTrackUrl" value="${esc(s.tracking_url||'')}"></div>
        <div class="field"><label>URL etiqueta</label><input id="shLabelUrl" value="${esc(s.label_url||'')}"></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
        <button class="primary" id="shSave">Guardar envío</button>
        <button class="secondary" id="shPacklink">Abrir Packlink PRO</button>
        ${s.label_url?'<button class="secondary" id="shLabel">Abrir etiqueta</button>':''}
        ${s.tracking_url?'<button class="secondary" id="shTrack">Seguimiento</button>':''}
      </div>`;
    drawer.classList.remove('hidden');

    document.getElementById('shSave').onclick=async()=>{
      const payload={
        order_id:o.id, provider:'packlink_pro',
        recipient_name:document.getElementById('shName').value.trim(),
        recipient_phone:document.getElementById('shPhone').value.trim(),
        recipient_email:document.getElementById('shEmail').value.trim(),
        address_line1:document.getElementById('shAddress').value.trim(),
        postal_code:document.getElementById('shPostal').value.trim(),
        city:document.getElementById('shCity').value.trim(),
        province:document.getElementById('shProvince').value.trim(),
        country_code:'ES',
        package_name:document.getElementById('shPackage').value,
        weight_kg:num(document.getElementById('shWeight').value),
        length_cm:num(document.getElementById('shLength').value),
        width_cm:num(document.getElementById('shWidth').value),
        height_cm:num(document.getElementById('shHeight').value),
        carrier_name:document.getElementById('shCarrier').value.trim(),
        service_name:document.getElementById('shService').value.trim(),
        price:document.getElementById('shPrice').value===''?null:num(document.getElementById('shPrice').value),
        status:document.getElementById('shStatus').value,
        packlink_reference:document.getElementById('shRef').value.trim(),
        tracking_number:document.getElementById('shTracking').value.trim(),
        tracking_url:document.getElementById('shTrackUrl').value.trim(),
        label_url:document.getElementById('shLabelUrl').value.trim(),
        updated_at:new Date().toISOString()
      };
      const res=shipment?.id
        ? await supabaseClient.from('shipments').update(payload).eq('id',shipment.id)
        : await supabaseClient.from('shipments').insert(payload);
      if(res.error){toast(res.error.message);return;}
      const shipCost=payload.price==null?0:payload.price;
      const up=await supabaseClient.from('orders').update({outbound_shipping_cost:shipCost}).eq('id',o.id);
      if(!up.error) o.outbound_shipping_cost=shipCost;
      toast('Envío guardado');
      if(typeof closeDrawer==='function')closeDrawer();
    };
    document.getElementById('shPacklink').onclick=()=>window.open('https://pro.packlink.es/','_blank','noopener');
    document.getElementById('shLabel')?.addEventListener('click',()=>window.open(s.label_url,'_blank','noopener'));
    document.getElementById('shTrack')?.addEventListener('click',()=>window.open(s.tracking_url,'_blank','noopener'));
  };

  const oldOpen=window.abrirFichaPedido;
  if(typeof oldOpen==='function'){
    window.abrirFichaPedido=async function(id){
      await oldOpen(id);
      const body=document.getElementById('drawerBody');
      const o=(orders||[]).find(x=>String(x.id)===String(id));
      if(!body||!o||body.querySelector('#aihxoShippingCard')) return;
      const {data:s}=await supabaseClient.from('shipments').select('*').eq('order_id',id).maybeSingle();
      const card=document.createElement('div');
      card.id='aihxoShippingCard';card.className='card';card.style.marginTop='14px';
      card.innerHTML=`<div class="section"><div><h3 style="margin:0">🚚 Envío al cliente</h3><div class="muted">${s?esc((s.carrier_name||'Sin transportista')+' · '+(s.status||'Pendiente')):'Aún no preparado'}</div></div><button class="primary small" id="pdPrepareShipment">${s?'Abrir envío':'Preparar envío'}</button></div>${s?.tracking_number?`<div>Seguimiento: <b>${esc(s.tracking_number)}</b></div>`:''}${s?.price!=null?`<div style="margin-top:5px">Coste real: <b>${eur(s.price)}</b></div>`:''}`;
      const actions=body.lastElementChild;
      if(actions) body.insertBefore(card,actions); else body.appendChild(card);
      card.querySelector('#pdPrepareShipment').onclick=()=>window.prepararEnvio(id);
    };
  }
})();