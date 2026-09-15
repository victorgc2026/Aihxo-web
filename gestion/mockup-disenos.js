/* AIHXO · Generador de mockups · producto + banco de personas */
(function(){
 const $=s=>document.querySelector(s);
 let designImg=null,baseImg=null,currentGarmentId=null,templates=[];

 function esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
 function mobile(){return window.matchMedia&&window.matchMedia('(max-width:760px)').matches}

 function panel(){
  let p=$('#aihxoMockupPanel');if(p)return p;
  const mob=mobile();
  p=document.createElement('div');p.id='aihxoMockupPanel';
  p.style.cssText=`position:fixed;inset:0;z-index:10000;background:rgba(7,21,47,.55);display:flex;align-items:${mob?'stretch':'flex-end'};justify-content:center;overflow:hidden`;
  p.innerHTML=`<div id="aihxoMockupSheet" style="background:#fff;width:${mob?'100%':'min(760px,100%)'};height:${mob?'100dvh':'auto'};max-height:${mob?'100dvh':'94vh'};overflow:auto;-webkit-overflow-scrolling:touch;border-radius:${mob?'0':'24px 24px 0 0'};padding:${mob?'16px 14px calc(22px + env(safe-area-inset-bottom))':'18px'};box-sizing:border-box">
   <div style="display:flex;justify-content:space-between;align-items:center;position:${mob?'sticky':'static'};top:0;background:#fff;z-index:5;padding-bottom:10px">
    <div><h2 style="margin:0;color:#07152f">👕 Crear mockup</h2><div style="color:#667085;margin-top:4px">Producto o persona · delantero o trasero</div></div>
    <button id="mkClose" type="button" style="border:0;background:#eef3f9;border-radius:12px;padding:10px 13px;font-weight:900">✕</button>
   </div>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">
    <label>Tipo<select id="mkType" class="dp-input"><option value="shirt">Camiseta sola</option><option value="person">👤 Persona / modelo</option></select></label>
    <label>Vista<select id="mkSide" class="dp-input"><option value="front">Delantera</option><option value="back">Trasera</option></select></label>
   </div>
   <div id="mkPersonBox" style="display:none;margin-top:12px;padding:12px;border:1px solid #e1e6ed;border-radius:14px">
    <label style="font-weight:800">Modelo AIHXO<select id="mkTemplate" class="dp-input"><option value="">Sin plantilla guardada</option></select></label>
    <div id="mkNoTemplates" style="font-size:12px;color:#667085;margin:8px 0">También puedes cargar una foto manualmente.</div>
    <input id="mkBaseFile" type="file" accept="image/*" class="dp-input">
   </div>
   <div id="mkColorBox" style="margin-top:12px"><label>Color camiseta<input id="mkColor" type="color" value="#ffffff" class="dp-input" style="height:48px;padding:5px"></label></div>
   <label style="display:block;margin-top:12px;font-weight:800">Diseño PNG/JPG<input id="mkFile" type="file" accept="image/*" class="dp-input"></label>
   <canvas id="mkCanvas" width="1000" height="1100" style="display:block;width:100%;height:auto;max-width:100%;margin-top:14px;border-radius:18px;background:#f2f4f7"></canvas>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
    <label>Ancho<input id="mkW" type="range" min="5" max="90" value="42" style="width:100%"></label>
    <label>Alto<input id="mkH" type="range" min="5" max="90" value="35" style="width:100%"></label>
    <label>Posición vertical<input id="mkY" type="range" min="5" max="95" value="34" style="width:100%"></label>
    <label>Posición horizontal<input id="mkX" type="range" min="5" max="95" value="50" style="width:100%"></label>
    <label>Giro<input id="mkRot" type="range" min="-20" max="20" value="0" style="width:100%"></label>
   </div>
   <div style="font-size:12px;color:#667085;margin-top:10px">Prenda seleccionada: <b id="mkGarment">—</b></div>
   <div id="mkAttachedMsg" style="display:none;margin-top:12px;padding:10px 12px;border-radius:12px;background:#ecfdf3;color:#067647;font-weight:800;font-size:13px">✓ Mockup añadido a las fotos del diseño. Se publicará al guardar el diseño.</div>
   <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-top:14px;position:${mob?'sticky':'static'};bottom:${mob?'calc(8px + env(safe-area-inset-bottom))':'auto'};z-index:6;background:#fff;padding-top:8px">
    <button id="mkAttach" type="button" class="primary" style="width:100%;padding:15px">🌐 Añadir mockup al diseño / web</button>
    <button id="mkDownload" type="button" class="secondary" style="width:100%;padding:13px">${mob?'Guardar / compartir PNG':'Guardar PNG'}</button>
   </div>
  </div>`;
  document.body.appendChild(p);
  $('#mkClose').onclick=()=>p.remove();
  $('#mkFile').onchange=e=>loadFile(e.target.files?.[0],false);
  $('#mkBaseFile').onchange=e=>loadFile(e.target.files?.[0],true);
  $('#mkTemplate').onchange=loadTemplate;
  ['#mkColor','#mkW','#mkH','#mkY','#mkX','#mkRot'].forEach(s=>$(s).oninput=draw);
  $('#mkSide').onchange=()=>{fillTemplates();draw()};
  $('#mkType').onchange=()=>{const person=$('#mkType').value==='person';$('#mkPersonBox').style.display=person?'block':'none';$('#mkColorBox').style.display=person?'none':'block';draw()};
  $('#mkDownload').onclick=download;
  $('#mkAttach').onclick=attachToDesign;
  return p;
 }

 async function fetchTemplates(){
  templates=[];
  if(!currentGarmentId||typeof supabaseClient==='undefined')return;
  const {data,error}=await supabaseClient.from('mockup_templates').select('*').eq('garment_id',currentGarmentId).eq('active',true).order('name');
  if(!error)templates=data||[];
  fillTemplates();
 }

 function fillTemplates(){
  const s=$('#mkTemplate');if(!s)return;
  const side=$('#mkSide')?.value||'front',list=templates.filter(t=>!t.side||t.side===side);
  s.innerHTML='<option value="">Sin plantilla guardada</option>'+list.map(t=>`<option value="${t.id}">${esc(t.name)}${t.gender?' · '+esc(t.gender):''}</option>`).join('');
  $('#mkNoTemplates').textContent=list.length?'Selecciona un modelo guardado o carga otra foto.':'Aún no hay modelos guardados para esta prenda/vista. Puedes cargar una foto manualmente.';
 }

 function setBaseFromTemplate(t){
  if(!t?.image_url)return;
  const im=new Image();im.crossOrigin='anonymous';
  im.onload=()=>{baseImg=im;draw()};
  im.onerror=()=>alert('No se pudo cargar esta plantilla.');
  im.src=t.image_url;
 }
 function loadTemplate(){const t=templates.find(x=>x.id===$('#mkTemplate').value);setBaseFromTemplate(t)}

 function shirt(ctx,color,side){
  ctx.fillStyle='#f2f4f7';ctx.fillRect(0,0,1000,1100);ctx.save();ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=28;ctx.shadowOffsetY=14;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(330,170);ctx.lineTo(215,215);ctx.lineTo(90,385);ctx.lineTo(210,465);ctx.lineTo(280,380);ctx.lineTo(280,940);ctx.quadraticCurveTo(500,990,720,940);ctx.lineTo(720,380);ctx.lineTo(790,465);ctx.lineTo(910,385);ctx.lineTo(785,215);ctx.lineTo(670,170);ctx.quadraticCurveTo(500,255,330,170);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle='rgba(0,0,0,.16)';ctx.lineWidth=4;ctx.stroke();if(side==='front'){ctx.fillStyle='#f2f4f7';ctx.beginPath();ctx.ellipse(500,178,93,53,0,0,Math.PI*2);ctx.fill()}
 }
 function cover(ctx,img){const r=Math.max(1000/img.width,1100/img.height),w=img.width*r,h=img.height*r;ctx.drawImage(img,(1000-w)/2,(1100-h)/2,w,h)}

 function draw(){
  const c=$('#mkCanvas');if(!c)return;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,1000,1100);
  const person=$('#mkType').value==='person';
  if(person&&baseImg)cover(ctx,baseImg);else if(person){ctx.fillStyle='#eef2f6';ctx.fillRect(0,0,1000,1100);ctx.fillStyle='#667085';ctx.font='700 27px sans-serif';ctx.textAlign='center';ctx.fillText('Selecciona un modelo AIHXO o carga una foto',500,520)}else shirt(ctx,$('#mkColor').value,$('#mkSide').value);
  if(!designImg)return;
  const w=Number($('#mkW').value)/100*1000;
  const h=Number($('#mkH').value)/100*1100;
  const x=Number($('#mkX').value)/100*1000,y=Number($('#mkY').value)/100*1100,rot=Number($('#mkRot').value)*Math.PI/180;
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(designImg,-w/2,-h/2,w,h);ctx.restore();
 }

 function setNaturalSize(){
  if(!designImg)return;
  const w=420,h=w*(designImg.height/designImg.width);
  $('#mkW').value=Math.max(5,Math.min(90,Math.round(w/1000*100)));
  $('#mkH').value=Math.max(5,Math.min(90,Math.round(h/1100*100)));
 }

 function loadFile(file,isBase){
  if(!file)return;
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{if(isBase)baseImg=im;else{designImg=im;setNaturalSize()}draw()};im.src=r.result};r.readAsDataURL(file);
 }

 function canvasBlob(){
  const c=$('#mkCanvas');
  return new Promise((resolve,reject)=>{try{c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo generar el PNG')),'image/png',1)}catch(e){reject(e)}});
 }
 function fileName(){const name=($('#dpNombre')?.value||'AIHXO').trim().replace(/[^a-z0-9]+/gi,'-');return `${name}-mockup-${$('#mkType').value}-${$('#mkSide').value}.png`}

 async function attachToDesign(){
  const gallery=$('#dpGaleria');
  if(!gallery){alert('Abre el mockup desde la ficha de Nuevo diseño propio para poder añadirlo directamente a la web.');return}
  const btn=$('#mkAttach');btn.disabled=true;btn.textContent='Añadiendo…';
  try{
   const blob=await canvasBlob();
   const f=new File([blob],fileName(),{type:'image/png'});
   const dt=new DataTransfer();
   Array.from(gallery.files||[]).forEach(x=>dt.items.add(x));
   dt.items.add(f);gallery.files=dt.files;
   const msg=$('#mkAttachedMsg');if(msg)msg.style.display='block';
   if(typeof toast==='function')toast('Mockup añadido al diseño');
  }catch(e){console.error(e);alert('No se pudo añadir el mockup al diseño.');}
  finally{btn.disabled=false;btn.textContent='🌐 Añadir mockup al diseño / web'}
 }

 async function download(){
  const btn=$('#mkDownload');if(btn){btn.disabled=true;btn.textContent='Preparando PNG…'}
  try{
   const blob=await canvasBlob(),filename=fileName(),file=new File([blob],filename,{type:'image/png'});
   if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Mockup AIHXO'});if(typeof toast==='function')toast('Mockup preparado')}
   else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},3000);if(typeof toast==='function')toast('Mockup PNG guardado')}
  }catch(e){console.error('Error guardando mockup',e);try{window.open($('#mkCanvas').toDataURL('image/png',1),'_blank')}catch(_e){}if(typeof toast==='function')toast('No se pudo guardar. Revisa la plantilla cargada.')}
  finally{if(btn){btn.disabled=false;btn.textContent=mobile()?'Guardar / compartir PNG':'Guardar PNG'}}
 }

 window.abrirGeneradorMockup=async function(){
  panel();const garment=$('#dpGarment');currentGarmentId=garment?.value||null;$('#mkGarment').textContent=garment?.selectedOptions?.[0]?.textContent||'Sin asignar';baseImg=null;designImg=null;await fetchTemplates();draw();const f=$('#dpFoto')?.files?.[0];if(f)loadFile(f,false);
  const pending=window._aihxoPendingMockupTemplate;if(pending&&(!currentGarmentId||pending.garment_id===currentGarmentId)){window._aihxoPendingMockupTemplate=null;$('#mkType').value='person';$('#mkPersonBox').style.display='block';$('#mkColorBox').style.display='none';$('#mkSide').value=pending.side||'front';fillTemplates();if(templates.some(t=>t.id===pending.id))$('#mkTemplate').value=pending.id;setBaseFromTemplate(pending)}
 };

 window.abrirGeneradorMockupConPlantilla=async function(t){
  if(!t)return;panel();currentGarmentId=t.garment_id||null;baseImg=null;designImg=null;$('#mkType').value='person';$('#mkPersonBox').style.display='block';$('#mkColorBox').style.display='none';$('#mkSide').value=t.side||'front';$('#mkGarment').textContent=t.name||'Plantilla seleccionada';await fetchTemplates();fillTemplates();if(templates.some(x=>x.id===t.id))$('#mkTemplate').value=t.id;setBaseFromTemplate(t);const f=$('#dpFoto')?.files?.[0];if(f)loadFile(f,false)
 };

 function install(){
  const form=$('#formDisenoPropio');if(!form||$('#dpMockupBtn'))return;const photo=$('#dpFoto');if(!photo)return;
  const b=document.createElement('button');b.id='dpMockupBtn';b.type='button';b.textContent='👕 CREAR MOCKUP';b.style.cssText='width:100%;border:1px solid #087cf4;border-radius:16px;background:#eef6ff;color:#087cf4;padding:15px 18px;font-size:15px;font-weight:900;cursor:pointer;margin:-4px 0 18px';b.onclick=()=>window.abrirGeneradorMockup();photo.closest('label')?.insertAdjacentElement('afterend',b)
 }
 new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});setTimeout(install,500);
})();