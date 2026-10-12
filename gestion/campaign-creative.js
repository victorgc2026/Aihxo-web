/* AIHXO · Campaign Creative Kit: browser-local image, downloadable social artwork and web CTA */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;
 const E=M.E;
 const KEY='aihxo_campaign_creative_v1';
 const defaults={title:'PACK HALLOWEEN',subtitle:'Camiseta + Tote Bag',price:'23,95 €',description:'Tu Halloween, a tu manera. Para niños y adultos.',cta:'WhatsApp',phone:'634344174',instagram:'aihxo.camisetas',tiktok:'aihxo.camisetas',color:'#dfff00'};
 let state=Object.assign({},defaults);
 let images=[],imageUrls=[]; // Each image is a locally stored Blob
 const formats={instagram:{w:1080,h:1350,label:'Instagram · publicación 4:5'},story:{w:1080,h:1920,label:'Stories / Reels · 9:16'},tiktok:{w:1080,h:1920,label:'TikTok · portada 9:16'},square:{w:1080,h:1080,label:'Facebook / cuadrado 1:1'},banner:{w:1600,h:600,label:'Banner web · horizontal'}};
 function escapeValue(v){return E(String(v??''))}
 function campaignKey(){return 'aihxo_campaign_'+String(state.title||'').toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,60)}
 function getLink(){
  if(state.cta==='Instagram')return 'https://ig.me/m/'+encodeURIComponent(state.instagram.trim().replace(/^@/,''));
  if(state.cta==='TikTok')return 'https://www.tiktok.com/@'+encodeURIComponent(state.tiktok.replace(/^@/,''));
  return 'https://wa.me/34'+String(state.phone).replace(/\D/g,'').replace(/^34/,'')+'?text='+encodeURIComponent('Hola, quiero realizar un pedido de '+state.title+' ('+state.price+').');
 }
 function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open('aihxo-campaign-creative',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function assetSave(){const db=await dbOpen();return new Promise((resolve,reject)=>{const t=db.transaction('assets','readwrite');t.objectStore('assets').put(images,campaignKey());t.oncomplete=()=>{db.close();resolve()};t.onerror=()=>{db.close();reject(t.error)}})}
 async function assetLoad(){const db=await dbOpen();return new Promise((resolve,reject)=>{const t=db.transaction('assets','readonly');const r=t.objectStore('assets').get(campaignKey());r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>{db.close();reject(r.error)}})}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
 function setImages(next){imageUrls.forEach(u=>URL.revokeObjectURL(u));images=next;imageUrls=images.map(f=>URL.createObjectURL(f));updateGallery();refresh()}
 function updateGallery(){
  const gallery=document.querySelector('#ccGallery'),status=document.querySelector('#ccImageStatus');
  if(status)status.textContent=images.length?images.length+' imágenes del pack guardadas en este dispositivo':'Puedes crear diseños incluso sin fotos.';
  if(!gallery)return;
  gallery.innerHTML=images.map((f,i)=>'<div style="min-width:105px;max-width:125px"><img src="'+imageUrls[i]+'" alt="Imagen '+(i+1)+'" style="width:100%;height:95px;object-fit:cover;border:2px solid '+(i===0?'#dfff00':'transparent')+';border-radius:9px"><div style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeValue(f.name||'Imagen '+(i+1))+'</div><div style="display:flex;gap:4px;flex-wrap:wrap"><button type="button" class="secondary small" data-cover="'+i+'">'+(i===0?'Portada':'Portada ↑')+'</button><button type="button" class="secondary small" data-remove="'+i+'">✕</button></div></div>').join('');
  gallery.querySelectorAll('[data-cover]').forEach(b=>b.onclick=async()=>{const i=+b.dataset.cover;if(i>0){const arr=images.slice();arr.unshift(arr.splice(i,1)[0]);setImages(arr);await assetSave()}});
  gallery.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{setImages(images.filter((_,i)=>i!==+b.dataset.remove));await assetSave()});
 }
 function normalizeHandle(s){return String(s||'').trim().replace(/^@+/, '').replace(/^https?:\/\/(?:www\.)?(?:instagram\.com\/|tiktok\.com\/@)/i,'').replace(/\/$/,'')}
 function load(){try{state=Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){state={...defaults}}}
 function readFields(){document.querySelectorAll('[data-campaign-field]').forEach(n=>{state[n.dataset.campaignField]=['instagram','tiktok'].includes(n.dataset.campaignField)?normalizeHandle(n.value):n.value});save()}
 function makeCanvas(kind){
  const cfg=formats[kind];const can=document.createElement('canvas');can.width=cfg.w;can.height=cfg.h;
  const ctx=can.getContext('2d');const {w,h}=cfg;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,w,h);
  const landscape=w>h;const large=h>=1350;
  function paint(imgs){
   ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,w,h);
   if(imgs&&imgs.length){
    const count=Math.min(imgs.length,4);
    const rects=count===1?[[0,0,w,h]]:count===2?[[0,0,w/2,h],[w/2,0,w/2,h]]:count===3?[[0,0,w*.55,h],[w*.55,0,w*.45,h/2],[w*.55,h/2,w*.45,h/2]]:[[0,0,w/2,h/2],[w/2,0,w/2,h/2],[0,h/2,w/2,h/2],[w/2,h/2,w/2,h/2]];
    imgs.slice(0,4).forEach((im,i)=>{const [x,y,rw,rh]=rects[i],scale=Math.max(rw/im.width,rh/im.height),dw=im.width*scale,dh=im.height*scale;ctx.save();ctx.beginPath();ctx.rect(x,y,rw,rh);ctx.clip();ctx.drawImage(im,x+(rw-dw)/2,y+(rh-dh)/2,dw,dh);ctx.restore()});
   }
   const grad=ctx.createLinearGradient(0,h*.2,0,h);grad.addColorStop(0,'rgba(0,0,0,.15)');grad.addColorStop(.65,'rgba(0,0,0,.75)');grad.addColorStop(1,'rgba(0,0,0,.95)');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
   const pad=Math.round(w*.07);const base=landscape?70:(large?90:78);const anchor=landscape?h*.24:h*.52;
   ctx.textAlign='left';ctx.fillStyle=state.color;ctx.font='900 '+Math.round(base*.52)+'px system-ui';ctx.fillText('AIHXO  /  EDICIÓN ESPECIAL',pad,landscape?65:125);
   const words=state.title.trim().split(/\s+/);const rows=[];let line='';
   ctx.font='900 '+base+'px system-ui';
   for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>w-pad*2 && line){rows.push(line);line=word}else line=next}if(line)rows.push(line);
   ctx.fillStyle='#ffffff';rows.slice(0,3).forEach((row,i)=>ctx.fillText(row,pad,anchor+i*(base*1.13)));
   const sy=anchor+Math.min(rows.length,3)*base*1.15+10;
   ctx.fillStyle='#f5f5f5';ctx.font='600 '+Math.round(base*.52)+'px system-ui';ctx.fillText(state.subtitle.slice(0,42),pad,sy);
   ctx.fillStyle=state.color;ctx.font='900 '+Math.round(base*1.25)+'px system-ui';ctx.fillText(state.price,pad,sy+base*1.35);
   ctx.fillStyle='#fff';ctx.font='600 '+Math.round(base*.38)+'px system-ui';ctx.fillText('REALIZAR PEDIDO · '+(state.cta==='WhatsApp'?'WHATSAPP':state.cta.toUpperCase()),pad,sy+base*2.05);
   ctx.fillStyle='#ddd';ctx.font='400 '+Math.round(base*.31)+'px system-ui';ctx.fillText('aihxo.es  ·  Oleiros, A Coruña',pad,h-pad*.55);
  }
  paint([]);return {can,paint};
 }
 async function render(kind){
  readFields();const {can,paint}=makeCanvas(kind);
  if(imageUrls.length){const loaded=await Promise.all(imageUrls.slice(0,4).map(url=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url})));paint(loaded.filter(Boolean))}
  return can;
 }
 function dl(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000)}
 async function download(kind){const canvas=await render(kind);canvas.toBlob(blob=>{if(blob)dl(blob,'AIHXO_'+kind+'_'+Date.now()+'.png');else toast('No se pudo generar el PNG')},'image/png')}
 async function textDownload(){readFields();const msg='🎃 '+state.title+'\n'+state.subtitle+' · '+state.price+'\n'+state.description+'\n\nRealizar pedido: '+getLink()+'\n\n#AIHXO #Halloween #Oleiros #ACoruña';dl(new Blob([msg],{type:'text/plain;charset=utf-8'}),'AIHXO_publicacion.txt')}
 async function exportAll(){
  readFields();
  for(const kind of Object.keys(formats)){await download(kind);await new Promise(r=>setTimeout(r,250))}
  await textDownload();toast('Descargas iniciadas. El navegador puede pedir permiso para varias descargas.');
 }
 function renderUI(){
  const root=document.querySelector('#view');if(!root)return;
  root.innerHTML='<div class="page"><div class="section"><div><h2>🎨 Creador de campañas</h2><div class="muted">Prepara diseños descargables para Instagram, TikTok, Facebook y la web; nada se publica automáticamente.</div></div><button class="secondary" type="button" id="ccBack">Volver a Marketing</button></div>'+
  '<div class="grid two"><div class="card"><div class="form">'+
  [['title','Nombre de la oferta'],['subtitle','Productos del pack'],['price','Precio'],['description','Descripción'],['phone','WhatsApp pedidos'],['instagram','Usuario Instagram'],['tiktok','Usuario TikTok']].map(([k,l])=>'<div class="field"><label>'+l+'</label><input data-campaign-field="'+k+'" value="'+escapeValue(state[k])+'"></div>').join('')+
  '<div class="field"><label>Botón de pedido</label><select data-campaign-field="cta">'+['WhatsApp','Instagram','TikTok'].map(v=>'<option '+(state.cta===v?'selected':'')+'>'+v+'</option>').join('')+'</select></div>'+
  '<div class="field"><label>Color destacado</label><div style="display:flex;align-items:center;gap:12px"><input type="color" aria-label="Elegir color" data-campaign-field="color" value="'+escapeValue(state.color)+'" style="width:76px;height:52px;padding:4px;cursor:pointer"><span class="muted">Toca el recuadro para cambiar el color.</span></div></div>'+
  '<div class="field"><label>Imágenes del pack (PNG / JPG / WebP)</label><input type="file" id="ccImage" multiple accept="image/png,image/jpeg,image/webp"><small>Selecciona varias imágenes o añádelas en distintas veces. Máximo 8 imágenes de 12 MB cada una. La primera es la portada. La composición exportada muestra hasta cuatro.</small></div><div id="ccGallery" style="display:flex;gap:9px;overflow-x:auto;padding:8px 0"></div>'+
  '<div id="ccImageStatus" class="muted">Puedes crear diseños incluso sin foto.</div><div class="muted" style="font-size:12px">Para obtener mejores resultados, sube una fotografía vertical del producto en buena resolución. Las fotos no se sincronizan entre dispositivos.</div>'+
  '<button class="primary" type="button" id="ccExportAll">⬇ Descargar kit completo</button><div class="muted" style="font-size:12px">En iPhone, Safari puede pedir permiso para guardar varios archivos. Si falla, usa los botones de descarga individuales.</div></div></div>'+
  '<div class="card"><h3>Vista previa</h3><canvas id="ccPreview" style="width:100%;height:auto;border-radius:12px" width="540" height="675"></canvas><div style="display:grid;gap:8px;margin-top:12px">'+
  Object.entries(formats).map(([k,v])=>'<button class="secondary" type="button" data-cc-download="'+k+'">Descargar '+v.label+'</button>').join('')+
  '<button class="secondary" type="button" id="ccText">Descargar texto para redes</button>'+
  '<a class="secondary" id="ccCTA" target="_blank" rel="noopener noreferrer" style="padding:12px;text-align:center;text-decoration:none">Realizar pedido ↗</a>'+
  '<button class="primary" type="button" id="ccPublishWeb">🌐 Publicar banner en web</button>'+
  '<div class="muted" style="font-size:12px">Instagram y TikTok: los archivos se descargan y los publicáis vosotros. El enlace de TikTok abre el perfil; los mensajes directos dependen de la configuración de privacidad de TikTok.</div></div></div></div></div>';
  root.querySelector('#ccBack').onclick=()=>M.view();
  root.querySelectorAll('[data-campaign-field]').forEach(el=>{el.addEventListener('input',refresh);el.addEventListener('change',refresh)});
  root.querySelector('#ccImage').onchange=async e=>{
   const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
   if(files.some(f=>!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>12e6)){toast('Solo PNG, JPG o WebP de máximo 12 MB por imagen');return}
   if(images.length+files.length>8){toast('Puedes añadir un máximo de 8 imágenes por campaña');return}
   const previous=images.slice();setImages([...images,...files]);
   try{await assetSave();toast('Imágenes añadidas al pack')}catch(err){setImages(previous);toast('No se pudieron guardar las fotos: revisa espacio libre')}
  };
  root.querySelectorAll('[data-cc-download]').forEach(b=>b.onclick=()=>download(b.dataset.ccDownload));
  root.querySelector('#ccExportAll').onclick=exportAll;
  root.querySelector('#ccText').onclick=textDownload;
  root.querySelector('#ccPublishWeb').onclick=publishWeb;
  assetLoad().then(saved=>{if(images.length)return;if(Array.isArray(saved))setImages(saved);else if(saved instanceof Blob)setImages([saved])}).catch(()=>{});
  updateGallery();refresh();
 }
 async function refresh(){
  readFields();const link=getLink();const a=document.querySelector('#ccCTA');if(a){a.href=link;a.textContent=state.cta==='WhatsApp'?'Realizar pedido por WhatsApp ↗':state.cta==='Instagram'?'Enviar mensaje por Instagram ↗':'Abrir TikTok (mensajes según privacidad) ↗';}
  const preview=document.querySelector('#ccPreview');if(!preview)return;
  const c=await render('instagram');if(!preview.isConnected)return;const context=preview.getContext('2d');context.clearRect(0,0,preview.width,preview.height);context.drawImage(c,0,0,preview.width,preview.height);
 }
 async function publishWeb(){
  readFields();
  if(!confirm('¿Publicar este banner en la web? Esto actualiza web_campaigns. Las imágenes locales solo se exportan; NO se suben a la web.'))return;
  const payload={name:'AIHXO creativo: '+state.title,title:state.title+' · '+state.price,body:state.subtitle+' — '+state.description,button_label:'Realizar pedido',button_href:getLink(),start_at:new Date().toISOString(),end_at:null,audience:'all',priority:20,enabled:true,updated_at:new Date().toISOString()};
  try{const existing=await supabaseClient.from('web_campaigns').select('id').eq('name',payload.name).limit(1);if(existing.error)throw existing.error;const id=existing.data?.[0]?.id;const result=id?await supabaseClient.from('web_campaigns').update(payload).eq('id',id):await supabaseClient.from('web_campaigns').insert(payload);if(result.error)throw result.error;toast('Banner enviado a campañas web. Revisa la portada.');}catch(e){toast('Error de publicación: '+(e.message||e));console.error(e)}
 }
 load();
 window.aihxoCampaignCreativeView=renderUI;
 const old=M.tabs.campaigns;M.tabs.campaigns=function(root){old(root);const header=root.querySelector('.section');if(header){const b=document.createElement('button');b.className='primary';b.textContent='🎨 Crear piezas descargables';b.onclick=renderUI;header.appendChild(b)}};
})();