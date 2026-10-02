/* Shared order details for multi-size orders, print files and linked Drive assets. */
(function(){
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 window.aihxoOrderExtras=async function(o,body){
  const box=document.createElement('div');box.className='card';box.style.marginTop='14px';
  box.innerHTML=`<h3>Prendas del pedido</h3>${(o.order_lines||[]).map(l=>`<div class="statline"><span>${E(l.model)} · ${E(l.size)} · ${E(l.color)}<br><small>${l.allocated?'✅ Asignada':'🚚 Pendiente de llegada'}</small></span><b>${Number(l.quantity)} ud. · ${money(l.unit_price)}/ud.</b></div>`).join('')||'<div class="muted">Pedido anterior: consulta la prenda vinculada.</div>'}<h3>Zonas de impresión</h3>${(o.print_zones||[]).map((z,i)=>`<div class="statline"><span>${E(z.zone)} ${z.width_cm&&z.height_cm?E(z.width_cm+' × '+z.height_cm+' cm'):''}</span>${z.path?`<button class="secondary zoneOpen" data-index="${i}">Abrir archivo</button>`:'<span class="muted">Sin archivo</span>'}</div>`).join('')||'<div class="muted">Consulta los archivos delantero / trasero.</div>'}<h3>Archivos de Drive del pedido</h3><div class="orderDriveFiles">Cargando…</div>`;
  body.querySelector('#pdSaveBtn')?.parentElement.before(box);
  box.querySelectorAll('.zoneOpen').forEach(b=>b.onclick=async()=>{b.disabled=true;try{const {data,error}=await supabaseClient.storage.from('order-designs').createSignedUrl(o.print_zones[Number(b.dataset.index)].path,300);if(error)throw error;const link=document.createElement('a');link.href=data.signedUrl;link.target='_blank';link.rel='noopener';link.textContent='Abrir archivo';link.className='secondary';b.replaceWith(link);link.click()}catch(e){toast(e.message);b.disabled=false}});
  const r=await supabaseClient.from('drive_assets').select('file_name,web_view_link,shirt_size,placement').eq('order_id',o.id).order('created_at',{ascending:false});
  box.querySelector('.orderDriveFiles').innerHTML=r.error?'No se pudieron cargar los archivos de Drive.':(r.data||[]).map(a=>`<div><a href="${/^https:\/\/drive\.google\.com\//.test(a.web_view_link)?E(a.web_view_link):'#'}" target="_blank" rel="noopener">${E(a.file_name)}</a> · ${E(a.shirt_size||'')}</div>`).join('')||'Sin archivos vinculados.';
 };
})();
