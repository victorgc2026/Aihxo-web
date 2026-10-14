/* AIHXO mockups gratuitos: composición local, sin IA ni cambios en BBDD */
(function(){
'use strict';if(window.abrirAIHXOMockupGratis)return;
window.abrirAIHXOMockupGratis=function(){
document.querySelector('#aihxoFreeMockup')?.remove();
const wrap=document.createElement('div');wrap.id='aihxoFreeMockup';wrap.style.cssText='position:fixed;inset:0;z-index:16000;background:#07152fe6;overflow:auto;padding:8px;box-sizing:border-box';
wrap.innerHTML='<div style="max-width:650px;margin:auto;background:white;color:#16223c;border-radius:16px;padding:14px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-size:20px;margin:0">🆓 Mockup AIHXO</h2><button id="mfClose" class="secondary" type="button">✕</button></div><p style="color:#667085">Usa una fotografía de tu banco o súbela desde Archivos. La prenda debe aparecer ya en la fotografía; este editor coloca el diseño, no modifica prendas ni escenas.</p><button id="mfLoad" class="secondary" type="button">Cargar banco AIHXO</button><select id="mfBank" style="width:100%;margin:8px 0;padding:12px"><option value="">Seleccionar fotografía</option></select><label>O subir foto con permiso comercial<input id="mfPhoto" type="file" accept="image/png,image/jpeg,image/webp"></label><label style="display:block;margin:12px 0">Diseño desde Archivos (PNG, JPG o WebP)<input id="mfDesign" type="file" accept="image/png,image/jpeg,image/webp" style="display:block;width:100%;max-width:100%;box-sizing:border-box"></label><button id="mfLibrary" class="secondary" type="button">📁 Elegir diseño de la Biblioteca AIHXO</button><select id="mfLib" style="display:block;width:100%;padding:10px;margin:8px 0"><option value="">Seleccionar diseño guardado</option></select><div style="display:grid;grid-template-columns:1fr;gap:4px"><label>Escala<input id="mfSize" type="range" min="5" max="70" value="25"></label><label>Horizontal<input id="mfX" type="range" min="5" max="95" value="50"></label><label>Vertical<input id="mfY" type="range" min="5" max="95" value="43"></label></div><canvas id="mfCanvas" width="900" height="1100" style="display:block;width:min(100%,340px);height:auto;margin:10px auto;border-radius:12px;background:#e6edf5"></canvas><p id="mfStatus" style="color:#526077" role="status"></p><button id="mfDownload" class="primary" type="button">Descargar PNG</button><p style="font-size:12px;color:#667085">Composición visual aproximada. No genera un diseño listo para DTF ni adapta pliegues. Usa solo fotografías con licencia y permisos adecuados.</p></div>';
document.body.appendChild(wrap);
const $=q=>wrap.querySelector(q);let photo=null,design=null,templates=[],libraryFiles=[];
$('#mfClose').onclick=()=>wrap.remove();const status=t=>$('#mfStatus').textContent=t;
const canvas=$('#mfCanvas'),ctx=canvas.getContext('2d');
function paint(){ctx.clearRect(0,0,900,1100);ctx.fillStyle='#e7edf4';ctx.fillRect(0,0,900,1100);if(!photo){ctx.fillStyle='#54657b';ctx.font='23px system-ui';ctx.textAlign='center';ctx.fillText('Selecciona una fotografía',450,550);return;}const s=Math.max(900/photo.width,1100/photo.height),w=photo.width*s,h=photo.height*s;ctx.drawImage(photo,(900-w)/2,(1100-h)/2,w,h);if(design){const dw=900*(+$('#mfSize').value)/100,dh=dw*design.height/design.width,x=9*(+$('#mfX').value),y=11*(+$('#mfY').value);ctx.drawImage(design,x-dw/2,y-dh/2,dw,dh)}}
function openFile(file,cb){if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024){status('Selecciona PNG/JPG/WebP de hasta 15 MB.');return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{cb(img);paint();URL.revokeObjectURL(url)};img.onerror=()=>{URL.revokeObjectURL(url);status('No se pudo abrir la imagen.')};img.src=url}
$('#mfPhoto').onchange=e=>openFile(e.target.files[0],img=>{photo=img;status('Fotografía cargada.')});
$('#mfDesign').onchange=e=>{const f=e.target.files[0];if(!f||!['image/png','image/jpeg','image/webp'].includes(f.type)){status('Elige PNG, JPG o WebP desde Archivos.');return;}openFile(f,img=>{design=img;status('Diseño cargado. Ajusta la posición.')})};
['#mfSize','#mfX','#mfY'].forEach(k=>$(k).oninput=paint);
$('#mfLibrary').onclick=async()=>{status('Cargando diseños guardados…');try{
 const api=window.supabaseClient;
 const {data:libs,error:lerr}=await api.from('design_library').select('id,title').order('created_at',{ascending:false}).limit(150);
 if(lerr)throw lerr;
 const ids=(libs||[]).map(x=>x.id);
 if(!ids.length){status('La biblioteca está vacía. Usa Archivos para subir el diseño.');return;}
 const {data:files,error:ferr}=await api.from('design_library_files').select('library_id,file_name,storage_path').in('library_id',ids).limit(500);
 if(ferr)throw ferr;
 const names=new Map(libs.map(x=>[String(x.id),x.title||'Diseño']));
 libraryFiles=(files||[]).filter(f=>/\.(png|jpe?g|webp)$/i.test(f.file_name||''));
 const sel=$('#mfLib');sel.replaceChildren(new Option('Seleccionar diseño guardado',''));
 libraryFiles.forEach((f,i)=>sel.add(new Option((names.get(String(f.library_id))||'Diseño')+' · '+f.file_name,String(i))));
 status(libraryFiles.length+' archivos de imagen disponibles en Biblioteca AIHXO.');
}catch(e){status('No se pudo cargar Biblioteca: '+e.message)}};
$('#mfLib').onchange=async()=>{const f=libraryFiles[Number($('#mfLib').value)];if(!f)return;
 status('Abriendo diseño…');try{const {data,error}=await window.supabaseClient.storage.from('design-library').createSignedUrl(f.storage_path,120);
 if(error)throw error;const response=await fetch(data.signedUrl);if(!response.ok)throw Error('No se pudo descargar el archivo.');
 const blob=await response.blob(),file=new File([blob],f.file_name,{type:blob.type||'image/png'});
 openFile(file,img=>{design=img;status('Diseño '+f.file_name+' cargado. Ajusta escala y posición.')});
}catch(e){status('Error al abrir diseño: '+e.message)}};
$('#mfLoad').onclick=async()=>{status('Cargando banco…');try{const {data,error}=await window.supabaseClient.from('mockup_templates').select('id,name,image_url').eq('active',true).order('name');if(error)throw error;templates=(data||[]).filter(x=>x.image_url);const sel=$('#mfBank');sel.replaceChildren(new Option('Selecciona fotografía',''));templates.forEach((t,i)=>sel.add(new Option(t.name,String(i))));status(templates.length+' fotografías disponibles.')}catch(e){status('Error al cargar banco: '+e.message)}};
$('#mfBank').onchange=()=>{const t=templates[Number($('#mfBank').value)];if(!t)return;const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{photo=img;paint();status('Plantilla cargada.')};img.onerror=()=>status('No se pudo cargar esa fotografía. Descárgala y vuelve a subirla desde Archivos.');img.src=t.image_url};
$('#mfDownload').onclick=()=>{if(!photo){status('Selecciona primero una fotografía.');return;}try{canvas.toBlob(b=>{if(!b){status('No se pudo generar el PNG.');return;}const url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='AIHXO-mockup.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000)},'image/png')}catch(e){status('No se puede exportar esa fotografía. Súbela desde Archivos.')}};
paint();
};
})();