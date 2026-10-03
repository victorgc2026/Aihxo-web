/* AIHXO · Ficha técnica / briefing de producción · v1 */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const Z=[
    ['left_chest','Pecho izquierdo','front'],['right_chest','Pecho derecho','front'],['front_center','Frontal centro','front'],
    ['left_sleeve','Manga izquierda','front'],['right_sleeve','Manga derecha','front'],['left_shoulder','Hombro izquierdo','front'],
    ['right_shoulder','Hombro derecho','front'],['neck_inner','Cuello interior','front'],['back','Espalda','back'],
    ['back_neck','Cuello trasero','back'],['side_left','Lateral izquierdo','custom'],['side_right','Lateral derecho','custom'],
    ['hem','Bajo','custom'],['custom','Zona personalizada','custom']
  ];

  async function data(orderId){
    const rs=await Promise.all([
      supabaseClient.from('order_technical_sheets').select('*').eq('order_id',orderId).maybeSingle(),
      supabaseClient.from('order_technical_designs').select('*').eq('order_id',orderId).order('sort_order').order('created_at'),
      supabaseClient.from('order_production_checks').select('*').eq('order_id',orderId).maybeSingle(),
      supabaseClient.from('custom_order_items').select('*').eq('order_id',orderId).order('line_no'),
      supabaseClient.from('custom_order_files').select('*').eq('order_id',orderId).order('created_at'),
      supabaseClient.from('drive_assets').select('*').eq('order_id',orderId).order('created_at',{ascending:false}),
      supabaseClient.from('orders').select('*').eq('id',orderId).single()
    ]);
    const bad=rs.find(x=>x.error); if(bad) throw bad.error;
    return {sheet:rs[0].data||null,designs:rs[1].data||[],checks:rs[2].data||null,items:rs[3].data||[],files:rs[4].data||[],assets:rs[5].data||[],order:rs[6].data};
  }

  function ready(d){
    const p=[];
    if(!d.designs.length)p.push('No hay diseños / zonas añadidos');
    d.designs.forEach(x=>{
      const n=x.design_name||x.zone_label||x.zone;
      if(!x.width_cm||!x.height_cm)p.push(n+': faltan medidas');
      if(!x.dimensions_confirmed)p.push(n+': medidas sin confirmar');
      if(!x.colors_confirmed)p.push(n+': color sin confirmar');
      if(!x.original_validated&&!x.recreated_by_aihxo)p.push(n+': archivo/origen sin validar');
      if(!x.approved_by_client)p.push(n+': no aprobado por cliente');
      if(!['Aprobado','Listo DTF'].includes(x.status))p.push(n+': estado no listo');
    });
    if(!d.sheet?.client_approved)p.push('Falta aprobación general del cliente');
    return {ok:!p.length,problems:p};
  }

  function shirt(side,designs){
    const pos={left_chest:[120,120],right_chest:[230,120],front_center:[175,165],left_sleeve:[72,130],right_sleeve:[278,130],left_shoulder:[118,70],right_shoulder:[232,70],neck_inner:[175,76],back:[175,145],back_neck:[175,80]};
    let marks='';
    designs.filter(x=>x.side===side||x.side==='both').forEach((x,i)=>{
      const p=pos[x.zone]||[175,185];
      marks+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="13" fill="#087cf4"></circle><text x="'+p[0]+'" y="'+(p[1]+4)+'" text-anchor="middle" font-size="11" fill="white" font-weight="700">'+(i+1)+'</text>';
    });
    return '<svg viewBox="0 0 350 320" style="width:100%;max-width:360px"><path d="M120 55 L75 78 L45 125 L78 150 L98 125 L98 270 Q175 286 252 270 L252 125 L272 150 L305 125 L275 78 L230 55 Q205 78 175 78 Q145 78 120 55 Z" fill="none" stroke="#1b2430" stroke-width="3"></path><path d="M145 58 Q175 88 205 58" fill="none" stroke="#1b2430" stroke-width="3"></path>'+marks+'</svg>';
  }

  window.abrirFichaTecnicaAIHXO=async function(orderId){
    let d; try{d=await data(orderId);}catch(e){console.error(e);toast('No se pudo abrir la ficha técnica');return;}
    const r=ready(d), s=d.sheet||{}, c=d.checks||{};
    const body=document.getElementById('drawerBody'); document.getElementById('drawer').classList.remove('hidden');
    let items=d.items.map(i=>'<div class="tech-item-chip"><b>'+E([i.brand,i.garment_model,i.garment_variant].filter(Boolean).join(' · '))+'</b><br><span>'+E(i.size||'—')+' · '+E(i.color||'—')+' · '+i.quantity+' ud.</span></div>').join('');
    let ds=d.designs.map((x,i)=>'<div class="tech-design-row"><div class="tech-num">'+(i+1)+'</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+E(x.zone_label||x.zone)+'</b><span class="muted">'+E(x.status)+'</span></div><div class="muted">'+E(x.design_name||'Sin nombre')+' · '+(x.width_cm||'—')+' × '+(x.height_cm||'—')+' cm '+(x.size?'· '+E(x.size):'')+'</div><div class="muted">'+E(x.color_pantone||x.color_hex||'Color sin indicar')+(x.file_name?' · '+E(x.file_name):'')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="secondary small" onclick="editarDisenoTecnicoAIHXO(\''+x.id+'\',\''+orderId+'\')">Editar</button><button class="secondary small" onclick="borrarDisenoTecnicoAIHXO(\''+x.id+'\',\''+orderId+'\')">Eliminar</button></div></div></div>').join('');
    if(!ds)ds='<div class="empty">Añade las zonas de impresión antes de producir.</div>';
    let probs=r.problems.map(x=>'<li>'+E(x)+'</li>').join('');
    const chk=(k,l)=>'<label class="tech-check"><input data-check="'+k+'" type="checkbox" '+(c[k]?'checked':'')+'> '+l+'</label>';
    body.innerHTML=
      '<div class="aihxo-tech-sheet">'+
      '<div class="section"><div><div class="muted">FICHA TÉCNICA / BRIEFING</div><h2 style="margin:2px 0">'+E(d.order.order_number)+' · '+E(d.order.customer_name)+'</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="secondary" onclick="window.print()">🖨️ Imprimir / PDF</button><button class="primary" onclick="guardarFichaTecnicaAIHXO(\''+orderId+'\')">Guardar ficha</button></div></div>'+
      '<div class="card tech-print-card"><div class="tech-grid2"><div><h3>Datos del cliente</h3><div class="field"><label>Cliente</label><input value="'+E(d.order.customer_name||'')+'" disabled></div><div class="field"><label>Contacto</label><input value="'+E(d.order.contact||'')+'" disabled></div><div class="field"><label>Fecha límite</label><input value="'+E(d.order.design_due_date||'')+'" disabled></div><div class="field"><label>Uso de la prenda</label><input id="tsClientUse" value="'+E(s.client_use||'')+'"></div></div><div><h3>Prenda base</h3>'+(items||'<div class="muted">Sin líneas.</div>')+'<div class="field"><label>Observaciones de prenda</label><textarea id="tsGarmentNotes" rows="3">'+E(s.garment_notes||'')+'</textarea></div></div></div></div>'+
      '<div class="card tech-print-card"><div class="section"><div><h3 style="margin:0">Mapa de estampación</h3><div class="muted">Cada número corresponde a una zona/diseño.</div></div><button class="primary small" onclick="nuevoDisenoTecnicoAIHXO(\''+orderId+'\')">＋ Añadir zona</button></div><div class="tech-garment-grid"><div><b>FRONTAL</b>'+shirt('front',d.designs)+'</div><div><b>TRASERA</b>'+shirt('back',d.designs)+'</div></div></div>'+
      '<div class="card tech-print-card"><h3>Zonas / diseños</h3>'+ds+'</div>'+
      '<div class="card tech-print-card"><h3>Producción DTF</h3><div class="tech-grid2"><div class="field"><label>Proveedor DTF</label><input id="tsProvider" value="'+E(s.dtf_provider||'')+'"></div><div class="field"><label>Temperatura ºC</label><input id="tsTemp" type="number" value="'+(s.temperature_c??'')+'"></div><div class="field"><label>Tiempo (s)</label><input id="tsSeconds" type="number" value="'+(s.press_seconds??'')+'"></div><div class="field"><label>Presión</label><input id="tsPressure" value="'+E(s.pressure||'')+'"></div><div class="field"><label>Peel</label><select id="tsPeel">'+['','Frío','Templado','Caliente'].map(x=>'<option '+(s.peel===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="field"><label>2º planchado (s)</label><input id="tsSecond" type="number" value="'+(s.second_press_seconds??'')+'"></div></div><div class="field"><label>Observaciones</label><textarea id="tsProdNotes" rows="3">'+E(s.production_notes||'')+'</textarea></div></div>'+
      '<div class="card tech-print-card"><h3>Aprobación y control final</h3><label class="tech-check"><input id="tsClientApproved" type="checkbox" '+(s.client_approved?'checked':'')+'> Aprobado por cliente</label><div class="tech-check-grid">'+
      chk('garment_correct','Prenda correcta')+chk('size_correct','Talla correcta')+chk('transfer_correct','Transfer correcto')+chk('measured_correct','Medida comprobada')+chk('pilot_done','Unidad piloto realizada')+chk('position_correct','Posición correcta')+chk('color_correct','Color correcto')+chk('adhesion_correct','Adhesión correcta')+chk('finish_correct','Acabado correcto')+chk('garment_reviewed','Prenda revisada')+chk('photos_done','Fotos finales')+
      '</div><div class="field"><label>Revisado por</label><input id="tsReviewedBy" value="'+E(s.reviewed_by||'')+'"></div></div>'+
      '<div class="card '+(r.ok?'tech-ready':'tech-blocked')+' tech-print-card"><h3>'+(r.ok?'✅ Pedido listo para producción':'🔒 Producción bloqueada')+'</h3>'+(r.ok?'<div>Todos los datos obligatorios están validados.</div>':'<div class="muted">Corrige antes de producir:</div><ul>'+probs+'</ul>')+'</div></div>';
  };

  window.guardarFichaTecnicaAIHXO=async function(orderId){
    try{
      const v=id=>document.getElementById(id);
      const p={order_id:orderId,client_use:v('tsClientUse')?.value.trim()||null,garment_notes:v('tsGarmentNotes')?.value.trim()||null,dtf_provider:v('tsProvider')?.value.trim()||null,temperature_c:N(v('tsTemp')?.value)||null,press_seconds:N(v('tsSeconds')?.value)||null,pressure:v('tsPressure')?.value.trim()||null,peel:v('tsPeel')?.value||null,second_press_seconds:N(v('tsSecond')?.value)||null,production_notes:v('tsProdNotes')?.value.trim()||null,client_approved:!!v('tsClientApproved')?.checked,client_approved_at:v('tsClientApproved')?.checked?new Date().toISOString():null,reviewed_by:v('tsReviewedBy')?.value.trim()||null,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
      let r=await supabaseClient.from('order_technical_sheets').upsert(p,{onConflict:'order_id'}); if(r.error)throw r.error;
      const cp={order_id:orderId,updated_at:new Date().toISOString()}; document.querySelectorAll('[data-check]').forEach(x=>cp[x.dataset.check]=x.checked);
      r=await supabaseClient.from('order_production_checks').upsert(cp,{onConflict:'order_id'}); if(r.error)throw r.error;
      toast('Ficha técnica guardada'); abrirFichaTecnicaAIHXO(orderId);
    }catch(e){console.error(e);toast('No se pudo guardar la ficha');}
  };

  async function designForm(orderId,x){
    const d=await data(orderId);
    const itemOptions=d.items.map(i=>'<option value="'+i.id+'" '+(x?.item_id===i.id?'selected':'')+'>Art. '+i.line_no+' · '+E([i.brand,i.garment_model,i.size,i.color].filter(Boolean).join(' · '))+'</option>').join('');
    const fs=d.files.map(f=>({name:f.file_name,path:f.storage_path,source:'cliente'})).concat(d.assets.map(a=>({name:a.file_name,path:a.web_view_link,source:'aihxo'})));
    const fileOptions=fs.map(f=>'<option value="'+E(f.path)+'" data-name="'+E(f.name)+'" data-source="'+E(f.source)+'" '+(x?.storage_path===f.path?'selected':'')+'>'+E(f.name)+'</option>').join('');
    const body=document.getElementById('drawerBody'); document.getElementById('drawer').classList.remove('hidden');
    body.innerHTML='<h2>'+(x?'Editar':'Nueva')+' zona / diseño</h2><form id="techDesignForm" class="form">'+
      '<div class="field"><label>Artículo</label><select id="tdItem"><option value="">General / varias tallas</option>'+itemOptions+'</select></div>'+
      '<div class="formgrid"><div class="field"><label>Zona</label><select id="tdZone">'+Z.map(z=>'<option value="'+z[0]+'" '+(x?.zone===z[0]?'selected':'')+'>'+z[1]+'</option>').join('')+'</select></div><div class="field"><label>Lado</label><select id="tdSide">'+['front','back','both','custom'].map(q=>'<option '+(x?.side===q?'selected':'')+'>'+q+'</option>').join('')+'</select></div></div>'+
      '<div class="field"><label>Nombre del diseño</label><input id="tdName" required value="'+E(x?.design_name||'')+'"></div>'+
      '<div class="field"><label>Archivo vinculado</label><select id="tdFile"><option value="">Sin archivo</option>'+fileOptions+'</select></div>'+
      '<div class="formgrid"><div class="field"><label>Talla</label><input id="tdSize" value="'+E(x?.size||'')+'" placeholder="Ej. XL o TODAS"></div><div class="field"><label>Estado</label><select id="tdStatus">'+['Borrador','Recreado','Validado','Aprobado','Listo DTF'].map(q=>'<option '+(x?.status===q?'selected':'')+'>'+q+'</option>').join('')+'</select></div></div>'+
      '<div class="formgrid"><div class="field"><label>Ancho cm</label><input id="tdW" type="number" step=".1" value="'+(x?.width_cm??'')+'"></div><div class="field"><label>Alto cm</label><input id="tdH" type="number" step=".1" value="'+(x?.height_cm??'')+'"></div></div>'+
      '<div class="formgrid"><div class="field"><label>Pantone</label><input id="tdPantone" value="'+E(x?.color_pantone||'')+'"></div><div class="field"><label>HEX</label><input id="tdHex" value="'+E(x?.color_hex||'')+'"></div></div>'+
      '<div class="field"><label>Posición / referencias</label><textarea id="tdPos" rows="3">'+E(x?.position_notes||'')+'</textarea></div>'+
      '<div class="tech-check-grid">'+
      [['tdOriginal','Original validado','original_validated'],['tdRecreated','Recreado por AIHXO','recreated_by_aihxo'],['tdApproved','Aprobado por cliente','approved_by_client'],['tdTransparent','Fondo transparente','transparent_bg'],['tdSpell','Ortografía revisada','spelling_checked'],['tdDims','Medidas confirmadas','dimensions_confirmed'],['tdColors','Colores confirmados','colors_confirmed'],['tdRatio','Mantener proporción','keep_ratio'],['tdGradient','Degradado','gradient']].map(a=>'<label class="tech-check"><input id="'+a[0]+'" type="checkbox" '+(x?.[a[2]]?'checked':'')+'> '+a[1]+'</label>').join('')+
      '</div><button class="primary" type="submit">'+(x?'Guardar cambios':'Añadir diseño')+'</button></form>';
    document.getElementById('techDesignForm').onsubmit=async ev=>{
      ev.preventDefault(); const g=id=>document.getElementById(id), sel=g('tdFile'), op=sel.options[sel.selectedIndex], zone=g('tdZone').value;
      const p={order_id:orderId,item_id:g('tdItem').value||null,zone:zone,zone_label:Z.find(z=>z[0]===zone)?.[1]||zone,side:g('tdSide').value,design_name:g('tdName').value.trim(),storage_path:sel.value||null,file_name:op?.dataset?.name||null,file_source:op?.dataset?.source||'cliente',size:g('tdSize').value.trim()||null,status:g('tdStatus').value,width_cm:N(g('tdW').value)||null,height_cm:N(g('tdH').value)||null,color_pantone:g('tdPantone').value.trim()||null,color_hex:g('tdHex').value.trim()||null,position_notes:g('tdPos').value.trim()||null,original_validated:g('tdOriginal').checked,recreated_by_aihxo:g('tdRecreated').checked,approved_by_client:g('tdApproved').checked,transparent_bg:g('tdTransparent').checked,spelling_checked:g('tdSpell').checked,dimensions_confirmed:g('tdDims').checked,colors_confirmed:g('tdColors').checked,keep_ratio:g('tdRatio').checked,gradient:g('tdGradient').checked,updated_at:new Date().toISOString()};
      const rr=x?.id?await supabaseClient.from('order_technical_designs').update(p).eq('id',x.id):await supabaseClient.from('order_technical_designs').insert(p);
      if(rr.error){console.error(rr.error);toast('No se pudo guardar');return;} toast('Diseño guardado'); abrirFichaTecnicaAIHXO(orderId);
    };
  }

  window.nuevoDisenoTecnicoAIHXO=id=>designForm(id,null);
  window.editarDisenoTecnicoAIHXO=async function(id,orderId){const r=await supabaseClient.from('order_technical_designs').select('*').eq('id',id).single();if(r.error){toast('No se pudo cargar');return;}designForm(orderId,r.data);};
  window.borrarDisenoTecnicoAIHXO=async function(id,orderId){if(!confirm('¿Eliminar esta zona/diseño?'))return;const r=await supabaseClient.from('order_technical_designs').delete().eq('id',id);if(r.error){toast('No se pudo eliminar');return;}toast('Zona eliminada');abrirFichaTecnicaAIHXO(orderId);};

  const oldOpen=window.abrirPedidoPersonalizado;
  if(typeof oldOpen==='function')window.abrirPedidoPersonalizado=async function(id){await oldOpen(id);const bdy=document.getElementById('drawerBody');if(bdy&&!bdy.querySelector('.aihxo-tech-open')){const b=document.createElement('button');b.className='primary aihxo-tech-open';b.style.cssText='width:100%;margin:12px 0;padding:15px';b.textContent='📋 Abrir ficha técnica / briefing de producción';b.onclick=()=>abrirFichaTecnicaAIHXO(id);bdy.insertBefore(b,bdy.children[1]||null);}};
  const oldSave=window.guardarCabeceraPedidoPersonalizado;
  if(typeof oldSave==='function')window.guardarCabeceraPedidoPersonalizado=async function(id){if(document.getElementById('codStatus')?.value==='En producción'){try{const d=await data(id),r=ready(d);if(!r.ok){toast('Producción bloqueada: completa la ficha técnica');abrirFichaTecnicaAIHXO(id);return;}}catch(e){console.error(e);toast('No se pudo validar la ficha técnica');return;}}return oldSave(id);};
})();