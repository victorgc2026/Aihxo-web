/* AIHXO · Biblioteca privada de plantillas */
(function(){
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const Z=['pecho','espalda','manga','cuello','hombro','lateral','mockup','otro'];
let selected=null;
const ALLOWED=/\.(png|jpe?g|webp|pdf|svg)$/i;
function inferZone(name,defaultZone){const n=name.toLowerCase();return Z.find(z=>z!=='otro' && (n.includes(z)||({pecho:['front','delantera'],espalda:['back','trasera'],manga:['sleeve'],cuello:['neck'],hombro:['shoulder'],lateral:['side']}[z]||[]).some(t=>n.includes(t))))||defaultZone;}
async function zipReader(){if(window.JSZip)return window.JSZip;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';script.onload=resolve;script.onerror=()=>reject(Error('No se pudo cargar el lector ZIP'));document.head.appendChild(script)});return window.JSZip;}
async function unpackZip(file){if(file.size>150*1024*1024)throw Error('ZIP demasiado grande (máx. 150 MB)');const JSZip=await zipReader();const zip=await JSZip.loadAsync(file);const items=[];let total=0;for(const entry of Object.values(zip.files)){if(entry.dir||entry.name.startsWith('__MACOSX/')||/\/\./.test(entry.name))continue;if(!ALLOWED.test(entry.name))continue;const blob=await entry.async('blob');total+=blob.size;if(blob.size>52428800||total>250*1024*1024||items.length>=300)throw Error('El ZIP supera los límites (50 MB por archivo, 250 MB total, 300 archivos)');items.push({file:new File([blob],entry.name.split('/').pop(),{type:blob.type||'application/octet-stream'}),relativePath:entry.name});}return items;}

async function check(x){if(x.error)throw x.error;return x.data;}
window.bibliotecaDisenosView=async function(c){
 c.innerHTML='<div class="page"><div class="card">Cargando biblioteca…</div></div>';
 try{
 const libs=await check(await supabaseClient.from('design_library').select('*').order('created_at',{ascending:false}));
 window._aihxoLibrary=libs;
 c.innerHTML='<div class="page"><div class="section"><div><h2>📁 Biblioteca de diseños</h2><div class="muted">Plantillas completas con medidas DTF y archivos agrupados</div></div></div><div class="card"><h3>Crear expediente</h3><form id="libNew"><div class="formgrid"><div class="field"><label>Nombre del diseño</label><input name="title" required placeholder="Ej. Gimnasia - Vega"></div><div class="field"><label>Cliente</label><input name="customer_name" placeholder="Nombre cliente"></div></div><div class="formgrid"><div class="field"><label>Prenda</label><input name="garment_model" placeholder="Melbourne"></div><div class="field"><label>Talla</label><input name="garment_size" placeholder="7/8"></div></div><div class="field"><label>Color de prenda</label><input name="garment_color"></div><div class="field"><label>Pedido original</label><select name="order_id"><option value="">Sin vincular</option>'+((typeof orders!=='undefined'?orders:[]).map(o=>'<option value="'+E(o.id)+'">'+E((o.order_number||'')+' · '+(o.customer_name||''))+'</option>').join(''))+'</select></div><button class="primary" type="submit">Crear expediente</button></form></div><div class="card" style="margin-top:14px"><input id="libSearch" class="search" placeholder="Buscar cliente, plantilla o prenda…"><div id="libList" style="display:grid;gap:10px;margin-top:12px"></div></div></div>';
 c.querySelector('#libNew').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const row=Object.fromEntries(f.entries());if(!row.order_id)delete row.order_id;try{const {data:{user}}=await supabaseClient.auth.getUser();await check(await supabaseClient.from('design_library').insert({...row,owner_id:user.id}));toast('Expediente creado');bibliotecaDisenosView(c)}catch(err){console.error(err);toast('Error creando expediente')}};
 const paint=()=>{const q=(c.querySelector('#libSearch').value||'').toLowerCase();c.querySelector('#libList').innerHTML=libs.filter(x=>[x.title,x.customer_name,x.garment_model].join(' ').toLowerCase().includes(q)).map(x=>'<button class="secondary" style="padding:14px;text-align:left" data-lib="'+E(x.id)+'"><b>'+E(x.title)+'</b><div class="muted">'+E(x.customer_name||'Sin cliente')+' · '+E(x.garment_model||'')+' '+E(x.garment_size||'')+'</div></button>').join('')||'<div class="muted">No hay diseños coincidentes.</div>';c.querySelectorAll('[data-lib]').forEach(b=>b.onclick=()=>window.abrirBibliotecaDiseno(b.dataset.lib))};c.querySelector('#libSearch').oninput=paint;paint();
 }catch(err){console.error(err);c.innerHTML='<div class="page"><div class="card">No se pudo abrir la biblioteca. Comprueba la conexión y vuelve a intentarlo.</div></div>';}
};
window.abrirBibliotecaDiseno=async function(id){
selected=id;const row=(window._aihxoLibrary||[]).find(x=>x.id===id);if(!row)return;
const body=document.querySelector('#drawerBody'),drawer=document.querySelector('#drawer');drawer.classList.remove('hidden');
body.innerHTML='<h2>📁 '+E(row.title)+'</h2><div class="muted">'+E(row.customer_name||'')+' · '+E(row.garment_model||'')+' '+E(row.garment_size||'')+'</div><div class="card"><h3>Añadir archivos desde iPhone</h3><form id="libUpload"><div class="field"><label>Seleccionar uno o varios archivos</label><input type="file" id="libFiles" multiple accept=".png,.jpg,.jpeg,.webp,.pdf,.svg,image/*,application/pdf"></div><div class="field"><label>O importar una carpeta completa</label><input type="file" id="libFolder" webkitdirectory directory multiple><div class="muted" style="font-size:12px">Si tu iPhone no permite seleccionar carpetas, comprímela en Archivos y usa la siguiente opción.</div></div><div class="field"><label>O seleccionar un ZIP desde Archivos / iCloud Drive</label><input type="file" id="libZip" accept=".zip,application/zip"></div><label style="display:flex;align-items:center;gap:8px;margin:10px 0"><input type="checkbox" id="libAutoZone" checked> Detectar zona por nombre del archivo (pecho, espalda, manga…)</label><div class="field"><label>Zona de impresión</label><select name="zone">'+Z.map(z=>'<option>'+z+'</option>').join('')+'</select></div><div class="formgrid"><div class="field"><label>Ancho DTF (cm)</label><input name="width_cm" type="number" min="0.1" step="0.1"></div><div class="field"><label>Alto DTF (cm)</label><input name="height_cm" type="number" min="0.1" step="0.1"></div></div><div class="muted" style="font-size:12px">Las medidas son las de impresión. Si subes archivos de zonas distintas, hazlo por grupos. Máximo 50 MB por archivo.</div><button type="submit" class="primary" style="margin-top:12px">Importar archivos</button></form><div id="libUploadStatus" class="muted"></div></div><div class="card"><h3>Archivos guardados</h3><div id="libItems">Cargando…</div></div>';
body.querySelector('#libUpload').onsubmit=async e=>{
e.preventDefault();const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;
const f=new FormData(e.currentTarget),status=body.querySelector('#libUploadStatus');
const standard=[...body.querySelector('#libFiles').files].map(file=>({file,relativePath:file.name}));
const folder=[...body.querySelector('#libFolder').files].map(file=>({file,relativePath:file.webkitRelativePath||file.name}));
const zipFile=body.querySelector('#libZip').files[0];
let files=[...standard,...folder];
let done=0;try{if(zipFile){status.textContent='Preparando ZIP…';files.push(...await unpackZip(zipFile));}
if(!files.length)throw Error('Selecciona archivos, una carpeta o un ZIP');
if(files.length>300)throw Error('Máximo 300 archivos por importación');
const {data:{user},error:authError}=await supabaseClient.auth.getUser();if(authError||!user)throw Error('Inicia sesión para importar');for(const item of files){const file=item.file;
if(file.size>52428800)throw Error(file.name+' supera 50 MB');
if(!ALLOWED.test(file.name))throw Error('Formato no admitido: '+file.name);
status.textContent='Importando '+(done+1)+' de '+files.length+'…';
const path=user.id+'/'+id+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
await check(await supabaseClient.storage.from('design-library').upload(path,file,{contentType:file.type||'application/octet-stream'}));
try{await check(await supabaseClient.from('design_library_files').insert({library_id:id,owner_id:user.id,storage_path:path,file_name:item.relativePath.slice(0,240),zone:(body.querySelector('#libAutoZone').checked?inferZone(item.relativePath,f.get('zone')):f.get('zone')),width_cm:f.get('width_cm')||null,height_cm:f.get('height_cm')||null}));}catch(err){await supabaseClient.storage.from('design-library').remove([path]);throw err;}
done++;
}toast(done+' archivos importados');await loadFiles(id);e.currentTarget.reset();
}catch(err){console.error(err);status.textContent='Error: '+err.message;}finally{btn.disabled=false;if(done)status.textContent=done+' archivo(s) importado(s).';}
};
await loadFiles(id);
};
async function loadFiles(id){
const el=document.querySelector('#libItems');if(!el||selected!==id)return;
try{const files=await check(await supabaseClient.from('design_library_files').select('*').eq('library_id',id).order('created_at',{ascending:false}));
el.innerHTML=files.map(x=>'<div style="padding:10px 0;border-bottom:1px solid rgba(128,128,128,.2)"><b>'+E(x.file_name)+'</b><div class="muted">'+E(x.zone)+' · '+(x.width_cm&&x.height_cm?x.width_cm+' × '+x.height_cm+' cm':'Medidas pendientes')+'</div><button class="secondary small" data-path="'+E(x.storage_path)+'">Abrir archivo</button></div>').join('')||'<div class="muted">Todavía no hay archivos. Impórtalos desde Archivos del iPhone.</div>';
el.querySelectorAll('[data-path]').forEach(b=>b.onclick=async()=>{const r=await supabaseClient.storage.from('design-library').createSignedUrl(b.dataset.path,120);if(r.error){toast('No se pudo abrir el archivo');return;}window.open(r.data.signedUrl,'_blank','noopener');});
}catch(err){console.error(err);el.textContent='Error consultando archivos';}
}
const old=window.setView;window.setView=function(v){if(v==='design-library'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));const t=document.querySelector('#title');if(t)t.textContent='Biblioteca de diseños';window.bibliotecaDisenosView(document.querySelector('#view'));if(typeof closeMobileMenu==='function')closeMobileMenu();return;}return old(v)};
function nav(){const o=document.querySelector('#nav button[data-view="custom-designs"]')||document.querySelector('#nav button[data-view="orders"]');if(!o||document.querySelector('#nav button[data-view="design-library"]'))return;const b=document.createElement('button');b.dataset.view='design-library';b.innerHTML='📁 <span>Biblioteca de diseños</span>';b.onclick=()=>setView('design-library');o.insertAdjacentElement('afterend',b);}
setTimeout(nav,0);
})();