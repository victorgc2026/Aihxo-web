/* AIHXO · Ficha técnica / briefing de producción · v3 */
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

  const DRIVE_FN='https://zoiesxtchnesrilpuqek.supabase.co/functions/v1/google-drive-oauth';
  async function authFetch(url,options={}){
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session)throw new Error('Sesión no disponible');
    const headers=new Headers(options.headers||{});
    headers.set('Authorization','Bearer '+session.access_token);
    return fetch(url,{...options,headers});
  }
  async function ensureDriveFolder(order){
    const fd=new FormData();
    fd.append('action','ensure_order_folder');
    fd.append('order_number',order.order_number||'Pedido');
    fd.append('customer_name',order.customer_name||'Cliente');
    const r=await authFetch(DRIVE_FN,{method:'POST',body:fd});
    const j=await r.json();
    if(!r.ok)throw new Error(j.error||'No se pudo crear la carpeta de Drive');
    await supabaseClient.from('order_technical_sheets').upsert({
      order_id:order.id,drive_folder_id:j.id,drive_folder_url:j.webViewLink,updated_at:new Date().toISOString()
    },{onConflict:'order_id'});
    return j;
  }

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

  function shirt(side,designs,orderId){
    const pos={left_chest:[120,120],right_chest:[230,120],front_center:[175,165],left_sleeve:[72,130],right_sleeve:[278,130],left_shoulder:[118,70],right_shoulder:[232,70],neck_inner:[175,76],back:[175,145],back_neck:[175,80]};
    let marks='';
    designs.filter(x=>x.side===side||x.side==='both').forEach((x,i)=>{const p=pos[x.zone]||[175,185];marks+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="13" fill="#087cf4"></circle><text x="'+p[0]+'" y="'+(p[1]+4)+'" text-anchor="middle" font-size="11" fill="white" font-weight="700" pointer-events="none">'+(i+1)+'</text>';});
    const z=side==='front' ? [
      ['left_chest',102,92,52,54,'Pecho izq.'],['right_chest',196,92,52,54,'Pecho der.'],['front_center',128,145,94,92,'Frontal'],
      ['left_sleeve',45,100,55,64,'Manga izq.'],['right_sleeve',250,100,55,64,'Manga der.'],
      ['left_shoulder',92,55,60,35,'Hombro izq.'],['right_shoulder',198,55,60,35,'Hombro der.'],['neck_inner',150,55,50,38,'Cuello']
    ] : [
      ['back',108,92,134,145,'Espalda'],['back_neck',145,54,60,42,'Cuello trasero'],
      ['left_sleeve',45,100,55,64,'Manga izq.'],['right_sleeve',250,100,55,64,'Manga der.'],
      ['left_shoulder',92,55,60,35,'Hombro izq.'],['right_shoulder',198,55,60,35,'Hombro der.']
    ];
    const hits=z.map(a=>'<g class="tech-hit" onclick="nuevoDisenoTecnicoZonaAIHXO(\''+orderId+'\',\''+a[0]+'\',\''+side+'\')"><rect x="'+a[1]+'" y="'+a[2]+'" width="'+a[3]+'" height="'+a[4]+'" rx="8"></rect><title>'+a[5]+'</title></g>').join('');
    return '<svg viewBox="0 0 350 320" class="tech-shirt-svg"><path d="M120 55 L75 78 L45 125 L78 150 L98 125 L98 270 Q175 286 252 270 L252 125 L272 150 L305 125 L275 78 L230 55 Q205 78 175 78 Q145 78 120 55 Z" fill="none" stroke="#1b2430" stroke-width="3"></path><path d="M145 58 Q175 88 205 58" fill="none" stroke="#1b2430" stroke-width="3"></path>'+hits+marks+'</svg>';
  }

  window.abrirFichaTecnicaAIHXO=async function(orderId){
    let d; try{d=await data(orderId);}catch(e){console.error(e);toast('No se pudo abrir la ficha técnica');return;}
    const r=ready(d), s=d.sheet||{}, c=d.checks||{};
    const body=document.getElementById('drawerBody'); document.getElementById('drawer').classList.remove('hidden');
    let items=d.items.map(i=>'<div class="tech-item-chip"><b>'+E([i.brand,i.garment_model,i.garment_variant].filter(Boolean).join(' · '))+'</b><br><span>'+E(i.size||'—')+' · '+E(i.color||'—')+' · '+i.quantity+' ud.</span></div>').join('');
    let ds=d.designs.map((x,i)=>'<div class="tech-design-row"><div class="tech-num">'+(i+1)+'</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+E(x.zone_label||x.zone)+'</b><span class="muted">'+E(x.status)+'</span></div><div class="muted">'+E(x.design_name||'Sin nombre')+' · '+(x.width_cm||'—')+' × '+(x.height_cm||'—')+' cm '+(x.size?'· '+E(x.size):'')+'</div><div class="muted">'+E(x.color_pantone||x.color_hex||'Color sin indicar')+(x.file_name?' · '+E(x.file_name):'')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="secondary small" onclick="editarDisenoTecnicoAIHXO(\''+x.id+'\',\''+orderId+'\')">Editar</button><button class="secondary small" onclick="crearVariantesTallaAIHXO(\''+x.id+'\',\''+orderId+'\')">Por tallas</button><button class="secondary small" onclick="borrarDisenoTecnicoAIHXO(\''+x.id+'\',\''+orderId+'\')">Eliminar</button></div></div></div>').join('');
    if(!ds)ds='<div class="empty">Añade las zonas de impresión antes de producir.</div>';
    let probs=r.problems.map(x=>'<li>'+E(x)+'</li>').join('');
    const chk=(k,l)=>'<label class="tech-check"><input data-check="'+k+'" type="checkbox" '+(c[k]?'checked':'')+'> '+l+'</label>';
    body.innerHTML=
      '<div class="aihxo-tech-sheet">'+
      '<div class="section"><div><div class="muted">FICHA TÉCNICA / BRIEFING</div><h2 style="margin:2px 0">'+E(d.order.order_number)+' · '+E(d.order.customer_name)+'</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="secondary" onclick="window.print()">🖨️ Imprimir / PDF</button><button class="secondary" onclick="prepararDrivePedidoAIHXO(\''+orderId+'\')">☁️ Drive</button><button class="secondary" onclick="generarPedidoDTFAIHXO(\''+orderId+'\')">🖨️ Pedido DTF</button><button class="secondary" onclick="generarGangSheetAIHXO(\''+orderId+'\')">🧩 Gang sheet</button><button class="secondary" onclick="repetirPedidoAIHXO(\''+orderId+'\')">⧉ Repetir</button><button class="primary" onclick="guardarFichaTecnicaAIHXO(\''+orderId+'\')">Guardar ficha</button></div></div>'+
      '<div class="card tech-print-card"><div class="tech-grid2"><div><h3>Datos del cliente</h3><div class="field"><label>Cliente</label><input value="'+E(d.order.customer_name||'')+'" disabled></div><div class="field"><label>Contacto</label><input value="'+E(d.order.contact||'')+'" disabled></div><div class="field"><label>Fecha límite</label><input value="'+E(d.order.design_due_date||'')+'" disabled></div><div class="field"><label>Uso de la prenda</label><input id="tsClientUse" value="'+E(s.client_use||'')+'"></div></div><div><h3>Prenda base</h3>'+(items||'<div class="muted">Sin líneas.</div>')+'<div class="field"><label>Observaciones de prenda</label><textarea id="tsGarmentNotes" rows="3">'+E(s.garment_notes||'')+'</textarea></div>'+(s.drive_folder_url?'<a class="secondary" href="'+E(s.drive_folder_url)+'" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">☁️ Abrir carpeta del pedido</a>':'<div class="muted">Drive: carpeta pendiente</div>')+'</div></div></div>'+
      '<div class="card tech-print-card"><div class="section"><div><h3 style="margin:0">Mapa de estampación</h3><div class="muted">Toca directamente una zona de la camiseta para añadir un diseño.</div></div><button class="primary small" onclick="nuevoDisenoTecnicoAIHXO(\''+orderId+'\')">＋ Añadir zona</button></div><div class="tech-garment-grid"><div><b>FRONTAL</b>'+shirt('front',d.designs,orderId)+'</div><div><b>TRASERA</b>'+shirt('back',d.designs,orderId)+'</div></div></div>'+
      '<div class="card tech-print-card"><h3>Zonas / diseños</h3>'+ds+'</div>'+
      '<div class="card tech-print-card"><h3>Producción DTF</h3><div class="tech-grid2"><div class="field"><label>Proveedor DTF</label><input id="tsProvider" value="'+E(s.dtf_provider||'')+'"></div><div class="field"><label>Temperatura ºC</label><input id="tsTemp" type="number" value="'+(s.temperature_c??'')+'"></div><div class="field"><label>Tiempo (s)</label><input id="tsSeconds" type="number" value="'+(s.press_seconds??'')+'"></div><div class="field"><label>Presión</label><input id="tsPressure" value="'+E(s.pressure||'')+'"></div><div class="field"><label>Peel</label><select id="tsPeel">'+['','Frío','Templado','Caliente'].map(x=>'<option '+(s.peel===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div><div class="field"><label>2º planchado (s)</label><input id="tsSecond" type="number" value="'+(s.second_press_seconds??'')+'"></div></div><div class="field"><label>Observaciones</label><textarea id="tsProdNotes" rows="3">'+E(s.production_notes||'')+'</textarea></div></div>'+
      '<div class="card tech-print-card"><h3>Aprobación del cliente y control final</h3><label class="tech-check"><input id="tsClientApproved" type="checkbox" '+(s.client_approved?'checked':'')+'> Aprobado por cliente</label><div class="tech-grid2"><div class="field"><label>Aprobado por</label><input id="tsApprovedBy" value="'+E(s.client_approved_by||'')+'" placeholder="Nombre del cliente / responsable"></div><div class="field"><label>Método</label><select id="tsApprovalMethod">'+['','WhatsApp','Email','Presencial','Teléfono','Otro'].map(x=>'<option '+(s.client_approval_method===x?'selected':'')+'>'+x+'</option>').join('')+'</select></div></div><div class="field"><label>Notas de aprobación</label><textarea id="tsApprovalNotes" rows="2">'+E(s.client_approval_notes||'')+'</textarea></div><div class="tech-check-grid">'+
      chk('garment_correct','Prenda correcta')+chk('size_correct','Talla correcta')+chk('transfer_correct','Transfer correcto')+chk('measured_correct','Medida comprobada')+chk('pilot_done','Unidad piloto realizada')+chk('position_correct','Posición correcta')+chk('color_correct','Color correcto')+chk('adhesion_correct','Adhesión correcta')+chk('finish_correct','Acabado correcto')+chk('garment_reviewed','Prenda revisada')+chk('photos_done','Fotos finales')+
      '</div><div class="field"><label>Revisado por</label><input id="tsReviewedBy" value="'+E(s.reviewed_by||'')+'"></div></div>'+
      '<div class="card tech-print-card"><div class="section"><div><h3 style="margin:0">Fotos de prueba / producción</h3><div class="muted">Unidad piloto, colocación y resultado final.</div></div></div><div class="field"><label>Añadir fotos</label><input id="tsProductionPhotos" type="file" multiple accept="image/*"></div><button class="secondary" onclick="subirFotosProduccionAIHXO(\''+orderId+'\')">📷 Subir fotos</button><div style="margin-top:10px">'+(d.files.filter(f=>f.file_kind==='produccion_foto').length?d.files.filter(f=>f.file_kind==='produccion_foto').map(f=>'<div>📷 '+E(f.file_name)+'</div>').join(''):'<div class="muted">Sin fotos de producción.</div>')+'</div></div>'+'<div class="card '+(r.ok?'tech-ready':'tech-blocked')+' tech-print-card"><h3>'+(r.ok?'✅ Pedido listo para producción':'🔒 Producción bloqueada')+'</h3>'+(r.ok?'<div>Todos los datos obligatorios están validados.</div>':'<div class="muted">Corrige antes de producir:</div><ul>'+probs+'</ul>')+'</div></div>';
  };

  window.guardarFichaTecnicaAIHXO=async function(orderId){
    try{
      const v=id=>document.getElementById(id);
      const p={order_id:orderId,client_use:v('tsClientUse')?.value.trim()||null,garment_notes:v('tsGarmentNotes')?.value.trim()||null,dtf_provider:v('tsProvider')?.value.trim()||null,temperature_c:N(v('tsTemp')?.value)||null,press_seconds:N(v('tsSeconds')?.value)||null,pressure:v('tsPressure')?.value.trim()||null,peel:v('tsPeel')?.value||null,second_press_seconds:N(v('tsSecond')?.value)||null,production_notes:v('tsProdNotes')?.value.trim()||null,client_approved:!!v('tsClientApproved')?.checked,client_approved_at:v('tsClientApproved')?.checked?new Date().toISOString():null,client_approved_by:v('tsApprovedBy')?.value.trim()||null,client_approval_method:v('tsApprovalMethod')?.value||null,client_approval_notes:v('tsApprovalNotes')?.value.trim()||null,reviewed_by:v('tsReviewedBy')?.value.trim()||null,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()};
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

  window.nuevoDisenoTecnicoZonaAIHXO=function(orderId,zone,side){
    const label=Z.find(z=>z[0]===zone)?.[1]||zone;
    designForm(orderId,{zone:zone,side:side,zone_label:label,design_name:label,status:'Borrador',keep_ratio:true});
  };

  window.crearVariantesTallaAIHXO=async function(designId,orderId){
    try{
      const d=await data(orderId),base=d.designs.find(x=>x.id===designId);
      if(!base){toast('Diseño no encontrado');return;}
      const sizes=[...new Set(d.items.map(i=>String(i.size||'').trim()).filter(Boolean))];
      if(sizes.length<2){toast('Este pedido solo tiene una talla');return;}
      const existing=new Set(d.designs.filter(x=>x.zone===base.zone&&x.design_name===base.design_name).map(x=>String(x.size||'').trim()));
      const todo=sizes.filter(s=>!existing.has(s));
      if(!todo.length){toast('Ya existen fichas para todas las tallas');return;}
      if(!confirm('Crear variantes para: '+todo.join(', ')+'? Podrás indicar una medida diferente para cada talla.'))return;
      const rows=todo.map(size=>({order_id:orderId,item_id:d.items.find(i=>String(i.size||'').trim()===size)?.id||base.item_id||null,side:base.side,zone:base.zone,zone_label:base.zone_label,design_name:base.design_name,file_name:base.file_name,storage_path:base.storage_path,file_source:base.file_source,file_status:base.file_status,size:size,width_cm:null,height_cm:null,keep_ratio:base.keep_ratio,color_pantone:base.color_pantone,color_hex:base.color_hex,opacity_percent:base.opacity_percent,gradient:base.gradient,orientation_deg:base.orientation_deg,position_notes:base.position_notes,original_validated:base.original_validated,recreated_by_aihxo:base.recreated_by_aihxo,approved_by_client:false,transparent_bg:base.transparent_bg,spelling_checked:base.spelling_checked,dimensions_confirmed:false,colors_confirmed:base.colors_confirmed,status:'Borrador',sort_order:base.sort_order}));
      const rr=await supabaseClient.from('order_technical_designs').insert(rows);if(rr.error)throw rr.error;
      toast('Variantes por talla creadas');abrirFichaTecnicaAIHXO(orderId);
    }catch(e){console.error(e);toast('No se pudieron crear las variantes');}
  };

  window.generarPedidoDTFAIHXO=async function(orderId){
    let d;try{d=await data(orderId);}catch(e){console.error(e);toast('No se pudo generar el pedido DTF');return;}
    if(!d.designs.length){toast('No hay diseños en la ficha técnica');return;}
    const qtyFor=x=>{const item=d.items.find(i=>i.id===x.item_id);if(item)return Number(item.quantity||1);if(x.size){const same=d.items.filter(i=>String(i.size||'')===String(x.size));return same.reduce((a,i)=>a+Number(i.quantity||0),0)||1;}return d.items.reduce((a,i)=>a+Number(i.quantity||0),0)||Number(d.order.quantity||1);};
    const rows=d.designs.map(x=>({zona:x.zone_label||x.zone,diseno:x.design_name||'',talla:x.size||'TODAS',ancho:x.width_cm||'',alto:x.height_cm||'',cantidad:qtyFor(x),color:x.color_pantone||x.color_hex||'',archivo:x.file_name||'',estado:x.status||''}));
    const body=document.getElementById('drawerBody');
    body.innerHTML='<div class="section"><div><div class="muted">PEDIDO DTF</div><h2>'+E(d.order.order_number)+' · '+E(d.order.customer_name)+'</h2></div><div style="display:flex;gap:8px"><button class="secondary" onclick="window.print()">🖨️ PDF</button><button class="primary" onclick="descargarPedidoDTFAIHXO()">⬇️ CSV</button></div></div><div class="card"><div class="table-wrap"><table><thead><tr><th>Zona</th><th>Diseño</th><th>Talla</th><th>Ancho</th><th>Alto</th><th>Uds</th><th>Color</th><th>Archivo</th><th>Estado</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+E(r.zona)+'</td><td>'+E(r.diseno)+'</td><td>'+E(r.talla)+'</td><td>'+E(r.ancho)+'</td><td>'+E(r.alto)+'</td><td>'+E(r.cantidad)+'</td><td>'+E(r.color)+'</td><td>'+E(r.archivo)+'</td><td>'+E(r.estado)+'</td></tr>').join('')+'</tbody></table></div></div><div class="card"><b>Control previo</b><div class="muted" style="margin-top:6px">Comprueba medidas, talla, cantidad, color y archivo antes de enviarlo al proveedor.</div><button class="secondary" style="margin-top:12px;width:100%" onclick="abrirFichaTecnicaAIHXO(\''+orderId+'\')">← Volver a ficha técnica</button></div>';
    window._aihxoDtfCsvRows={order:d.order,rows:rows};
  };

  window.descargarPedidoDTFAIHXO=function(){
    const x=window._aihxoDtfCsvRows;if(!x)return;
    const cols=['Zona','Diseño','Talla','Ancho cm','Alto cm','Cantidad','Color/Pantone','Archivo','Estado'];
    const val=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const csv=[cols.map(val).join(';')].concat(x.rows.map(r=>[r.zona,r.diseno,r.talla,r.ancho,r.alto,r.cantidad,r.color,r.archivo,r.estado].map(val).join(';'))).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=u;a.download='AIHXO_'+(x.order.order_number||'pedido')+'_DTF.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
  };

  window.aihxoValidarProduccion=async function(orderId,abrir=true){
    try{const d=await data(orderId);if(String(d.order.order_type||'')!=='personalizado')return {ok:true,problems:[]};const r=ready(d);if(!r.ok&&abrir)abrirFichaTecnicaAIHXO(orderId);return r;}
    catch(e){console.error(e);return {ok:false,problems:['No se pudo validar la ficha técnica']};}
  };

  window.nuevoDisenoTecnicoAIHXO=id=>designForm(id,null);
  window.editarDisenoTecnicoAIHXO=async function(id,orderId){const r=await supabaseClient.from('order_technical_designs').select('*').eq('id',id).single();if(r.error){toast('No se pudo cargar');return;}designForm(orderId,r.data);};
  window.borrarDisenoTecnicoAIHXO=async function(id,orderId){if(!confirm('¿Eliminar esta zona/diseño?'))return;const r=await supabaseClient.from('order_technical_designs').delete().eq('id',id);if(r.error){toast('No se pudo eliminar');return;}toast('Zona eliminada');abrirFichaTecnicaAIHXO(orderId);};


  window.prepararDrivePedidoAIHXO=async function(orderId){
    try{
      const d=await data(orderId);
      toast('Preparando carpetas de Drive…');
      const j=await ensureDriveFolder(d.order);
      toast('Carpetas del pedido preparadas');
      abrirFichaTecnicaAIHXO(orderId);
      if(j.webViewLink&&confirm('Carpeta creada. ¿Abrirla ahora?'))window.open(j.webViewLink,'_blank');
    }catch(e){console.error(e);toast(e.message||'No se pudo preparar Drive');}
  };

  window.subirFotosProduccionAIHXO=async function(orderId){
    const input=document.getElementById('tsProductionPhotos');
    const files=Array.from(input?.files||[]);
    if(!files.length){toast('Selecciona una o más fotos');return;}
    try{
      for(const file of files){
        const path='pedidos-personalizados/'+orderId+'/produccion/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'-'+file.name.replace(/[^a-zA-Z0-9._-]+/g,'-');
        const up=await supabaseClient.storage.from('order-designs').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
        if(up.error)throw up.error;
        const ins=await supabaseClient.from('custom_order_files').insert({order_id:orderId,item_id:null,file_kind:'produccion_foto',file_name:file.name,storage_path:path,mime_type:file.type||null});
        if(ins.error)throw ins.error;
      }
      await supabaseClient.from('order_production_checks').upsert({order_id:orderId,photos_done:true,updated_at:new Date().toISOString()},{onConflict:'order_id'});
      toast('Fotos guardadas');
      abrirFichaTecnicaAIHXO(orderId);
    }catch(e){console.error(e);toast('No se pudieron subir las fotos');}
  };

  window.repetirPedidoAIHXO=async function(orderId){
    try{
      const d=await data(orderId);
      if(!confirm('Crear un nuevo pedido copiando prendas, briefing, medidas, colores y zonas de '+d.order.order_number+'?'))return;
      const {data:nums,error:ne}=await supabaseClient.from('orders').select('order_number');
      if(ne)throw ne;
      let mx=0;
      (nums||[]).forEach(o=>{const m=String(o.order_number||'').match(/AIHXO-(\d+)/);if(m)mx=Math.max(mx,Number(m[1]));});
      const newNumber='AIHXO-'+String(mx+1).padStart(4,'0');
      const op={...d.order};
      delete op.id;delete op.created_at;delete op.updated_at;
      op.order_number=newNumber;
      op.status='Pendiente';
      op.production_status='Pendiente';
      op.dtf_status='Pendiente';
      op.design_status='Pendiente';
      op.design_approval_status='Pendiente';
      op.production_updated_at=new Date().toISOString();
      const or=await supabaseClient.from('orders').insert(op).select().single();
      if(or.error)throw or.error;
      const id=or.data.id;
      const itemMap={};
      for(const old of d.items){
        const row={...old,order_id:id};
        delete row.id;delete row.created_at;delete row.updated_at;
        const rr=await supabaseClient.from('custom_order_items').insert(row).select().single();
        if(rr.error)throw rr.error;
        itemMap[old.id]=rr.data.id;
      }
      if(d.sheet){
        const sh={...d.sheet,order_id:id,client_approved:false,client_approved_at:null,client_approved_by:null,client_approval_method:null,client_approval_notes:null,drive_folder_id:null,drive_folder_url:null,reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString()};
        delete sh.id;delete sh.created_at;
        const sr=await supabaseClient.from('order_technical_sheets').insert(sh);
        if(sr.error)throw sr.error;
      }
      if(d.designs.length){
        const rows=d.designs.map(x=>{
          const q={...x,order_id:id,item_id:x.item_id?itemMap[x.item_id]||null:null,approved_by_client:false,status:'Borrador',updated_at:new Date().toISOString()};
          delete q.id;delete q.created_at;
          return q;
        });
        const dr=await supabaseClient.from('order_technical_designs').insert(rows);
        if(dr.error)throw dr.error;
      }
      await supabaseClient.from('order_production_checks').insert({order_id:id});
      await loadAll();
      toast('Pedido repetido: '+newNumber);
      if(typeof setView==='function')setView('custom-orders');
      setTimeout(()=>abrirPedidoPersonalizado(id),300);
    }catch(e){console.error(e);toast('No se pudo repetir el pedido');}
  };

  window.generarGangSheetAIHXO=async function(orderId){
    let d;
    try{d=await data(orderId);}catch(e){console.error(e);toast('No se pudo preparar el gang sheet');return;}
    const valid=d.designs.filter(x=>x.storage_path&&x.width_cm&&x.height_cm&&String(x.storage_path).startsWith('pedidos-personalizados/'));
    if(!valid.length){toast('No hay diseños con archivo local y medidas');return;}
    const widthCm=Number(prompt('Ancho del gang sheet en cm','56')||56);
    const gapCm=Number(prompt('Separación entre diseños en cm','0.5')||0.5);
    if(widthCm<=0)return;
    toast('Generando gang sheet…');
    try{
      const dpi=300,pxcm=dpi/2.54,W=Math.round(widthCm*pxcm),gap=Math.round(gapCm*pxcm);
      const pieces=[];
      for(const x of valid){
        let qty=1;
        const item=d.items.find(i=>i.id===x.item_id);
        if(item)qty=Number(item.quantity||1);
        const signed=await supabaseClient.storage.from('order-designs').createSignedUrl(x.storage_path,600);
        if(signed.error||!signed.data?.signedUrl)continue;
        const blob=await fetch(signed.data.signedUrl).then(r=>r.blob());
        const url=URL.createObjectURL(blob),img=new Image();
        await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=url;});
        for(let n=0;n<qty;n++)pieces.push({img,url,w:Math.round(Number(x.width_cm)*pxcm),h:Math.round(Number(x.height_cm)*pxcm)});
      }
      if(!pieces.length)throw new Error('No se pudieron cargar imágenes');
      let cx=gap,cy=gap,rowH=0,maxY=0;
      pieces.forEach(p=>{if(cx+p.w+gap>W){cx=gap;cy+=rowH+gap;rowH=0;}p.left=cx;p.top=cy;cx+=p.w+gap;rowH=Math.max(rowH,p.h);maxY=Math.max(maxY,cy+p.h+gap);});
      const canvas=document.createElement('canvas');
      canvas.width=W;canvas.height=maxY;
      const ctx=canvas.getContext('2d');
      ctx.clearRect(0,0,W,maxY);
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      pieces.forEach(p=>ctx.drawImage(p.img,p.left,p.top,p.w,p.h));
      const blob=await new Promise(res=>canvas.toBlob(res,'image/png',1));
      pieces.forEach(p=>URL.revokeObjectURL(p.url));
      if(!blob)throw new Error('No se pudo crear el PNG');
      const u=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=u;
      a.download='AIHXO_'+d.order.order_number+'_GANG_'+widthCm+'cm.png';
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(u),2000);
      toast('Gang sheet generado');
    }catch(e){console.error(e);toast(e.message||'No se pudo generar el gang sheet');}
  };

  const oldOpen=window.abrirPedidoPersonalizado;
  if(typeof oldOpen==='function')window.abrirPedidoPersonalizado=async function(id){await oldOpen(id);const bdy=document.getElementById('drawerBody');if(bdy&&!bdy.querySelector('.aihxo-tech-open')){const b=document.createElement('button');b.className='primary aihxo-tech-open';b.style.cssText='width:100%;margin:12px 0;padding:15px';b.textContent='📋 Abrir ficha técnica / briefing de producción';b.onclick=()=>abrirFichaTecnicaAIHXO(id);bdy.insertBefore(b,bdy.children[1]||null);}};
  const oldSave=window.guardarCabeceraPedidoPersonalizado;
  if(typeof oldSave==='function')window.guardarCabeceraPedidoPersonalizado=async function(id){if(document.getElementById('codStatus')?.value==='En producción'){try{const d=await data(id),r=ready(d);if(!r.ok){toast('Producción bloqueada: completa la ficha técnica');abrirFichaTecnicaAIHXO(id);return;}}catch(e){console.error(e);toast('No se pudo validar la ficha técnica');return;}}return oldSave(id);};

  const oldProdStart=window.aihxoProdStart;
  if(typeof oldProdStart==='function')window.aihxoProdStart=async function(id){
    const r=await window.aihxoValidarProduccion(id,true);
    if(!r.ok){toast('Producción bloqueada: completa el briefing');return;}
    return oldProdStart(id);
  };

  const oldProdStatus=window.aihxoProdStatus;
  if(typeof oldProdStatus==='function')window.aihxoProdStatus=async function(id,status){
    const s=String(status||'').toLowerCase();
    if(s.includes('en producción')||s.includes('en produccion')){
      const r=await window.aihxoValidarProduccion(id,true);
      if(!r.ok){toast('Producción bloqueada: completa el briefing');return;}
    }
    return oldProdStatus(id,status);
  };

})();