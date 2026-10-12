/* AIHXO · Campaign Creative Kit: browser-local image, downloadable social artwork and web CTA */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;
 const E=M.E;
 const KEY='aihxo_campaign_creative_v1';
 const defaults={title:'PACK HALLOWEEN',subtitle:'Camiseta + Tote Bag',price:'23,95 €',description:'Tu Halloween, a tu manera. Para niños y adultos.',cta:'WhatsApp',phone:'634344174',instagram:'aihxo.camisetas',tiktok:'aihxo.camisetas',color:'#dfff00'};
 let state=Object.assign({},defaults);
 let imageFile=null,imageUrl=null;
 const formats={instagram:{w:1080,h:1350,label:'Instagram · publicación 4:5'},story:{w:1080,h:1920,label:'Stories / Reels · 9:16'},tiktok:{w:1080,h:1920,label:'TikTok · portada 9:16'},square:{w:1080,h:1080,label:'Facebook / cuadrado 1:1'},banner:{w:1600,h:600,label:'Banner web · horizontal'}};
 function escapeValue(v){return E(String(v??''))}
 function campaignKey(){return 'aihxo_campaign_'+String(state.title||'').toLowerCase().replace(/[^a-z0-9]/g,'_').slice(0,60)}
 function getLink(){
  if(state.cta==='Instagram')return 'https://www.instagram.com/'+encodeURIComponent(state.instagram.replace(/^@/,''))+'/';
  if(state.cta==='TikTok')return 'https://www.tiktok.com/@'+encodeURIComponent(state.tiktok.replace(/^@/,''));
  return 'https://wa.me/34'+String(state.phone).replace(/\D/g,'').replace(/^34/,'')+'?text='+encodeURIComponent('Hola, quiero realizar un pedido de '+state.title+' ('+state.price+').');
 }
 function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open('aihxo-campaign-creative',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
 async function assetSave(blob){const db=await dbOpen();return new Promise((resolve,reject)=>{const t=db.transaction('assets','readwrite');t.objectStore('assets').put(blob,campaignKey());t.oncomplete=()=>{db.close();resolve()};t.onerror=()=>{db.close();reject(t.error)}})}
 async function assetLoad(){const db=await dbOpen();return new Promise((resolve,reject)=>{const t=db.transaction('assets','readonly');const r=t.objectStore('assets').get(campaignKey());r.onsuccess=()=>{db.close();resolve(r.result)};r.onerror=()=>{db.close();reject(r.error)}})}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
 function load(){try{state=Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){state={...defaults}}}
 function readFields(){document.querySelectorAll('[data-campaign-field]').forEach(n=>{state[n.dataset.campaignField]=n.value});save()}
 function makeCanvas(kind){
  const cfg=formats[kind];const can=document.createElement('canvas');can.width=cfg.w;can.height=cfg.h;
  const ctx=can.getContext('2d');const {w,h}=cfg;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,w,h);
  const landscape=w>h;const large=h>=1350;
  if(imageUrl){const im=new Image();im.onload=()=>{paint(im);};im.src=imageUrl;}
  function paint(img){
   ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,w,h);
   if(img){const scale=Math.max(w/img.width,h/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);}
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
  paint(null);return {can,paint};
 }
 async function render(kind){
  readFields();const {can,paint}=makeCanvas(kind);
  if(imageUrl){await new Promise(resolve=>{const img=new Image();img.onload=()=>{paint(img);resolve()};img.onerror=resolve;img.src=imageUrl})}
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
  '<div class="field"><label>Color destacado</label><input type="color" data-campaign-field="color" value="'+escapeValue(state.color)+'"></div>'+
  '<div class="field"><label>Imagen propia de campaña (PNG / JPG / WebP)</label><input type="file" id="ccImage" accept="image/png,image/jpeg,image/webp"><small>Se conserva en este dispositivo. No se sube al servidor ni se comparte entre móviles.</small></div>'+
  '<div id="ccImageStatus" class="muted">Puedes crear diseños incluso sin foto.</div>'+
  '<button class="primary" type="button" id="ccExportAll">⬇ Descargar kit completo</button></div></div>'+
  '<div class="card"><h3>Vista previa</h3><canvas id="ccPreview" style="width:100%;height:auto;border-radius:12px" width="540" height="675"></canvas><div style="display:grid;gap:8px;margin-top:12px">'+
  Object.entries(formats).map(([k,v])=>'<button class="secondary" type="button" data-cc-download="'+k+'">Descargar '+v.label+'</button>').join('')+
  '<button class="secondary" type="button" id="ccText">Descargar texto para redes</button>'+
  '<a class="secondary" id="ccCTA" target="_blank" rel="noopener noreferrer" style="padding:12px;text-align:center;text-decoration:none">Realizar pedido ↗</a>'+
  '<button class="primary" type="button" id="ccPublishWeb">🌐 Publicar banner en web</button>'+
  '<div class="muted" style="font-size:12px">Instagram y TikTok: los archivos se descargan y los publicáis vosotros. El enlace de TikTok abre el perfil; los mensajes directos dependen de la configuración de privacidad de TikTok.</div></div></div></div></div>';
  root.querySelector('#ccBack').onclick=()=>M.view();
  root.querySelectorAll('[data-campaign-field]').forEach(el=>{el.addEventListener('input',refresh);el.addEventListener('change',refresh)});
  root.querySelector('#ccImage').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>12e6){toast('Utiliza PNG, JPG o WebP de máximo 12 MB');return}imageFile=f;await assetSave(f);if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(f);root.querySelector('#ccImageStatus').textContent='Imagen propia cargada: '+f.name;refresh()};
  root.querySelectorAll('[data-cc-download]').forEach(b=>b.onclick=()=>download(b.dataset.ccDownload));
  root.querySelector('#ccExportAll').onclick=exportAll;
  root.querySelector('#ccText').onclick=textDownload;
  root.querySelector('#ccPublishWeb').onclick=publishWeb;
  assetLoad().then(blob=>{if(blob&&!imageFile){if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=URL.createObjectURL(blob);root.querySelector('#ccImageStatus').textContent='Imagen guardada en este dispositivo';refresh()}}).catch(()=>{});
  refresh();
 }
 async function refresh(){
  readFields();const link=getLink();const a=document.querySelector('#ccCTA');if(a)a.href=link;
  const preview=document.querySelector('#ccPreview');if(!preview)return;
  const c=await render('instagram');const context=preview.getContext('2d');context.clearRect(0,0,preview.width,preview.height);context.drawImage(c,0,0,preview.width,preview.height);
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