/* AIHXO · Mockup automático V2 */
(function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let garments=[], templates=[], frontImg=null, backImg=null, frontBase=null, backBase=null;

  const loadImage=src=>new Promise((resolve,reject)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  const fileImage=file=>new Promise((resolve,reject)=>{if(!file)return resolve(null);const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=r.result};r.onerror=reject;r.readAsDataURL(file)});
  const cover=(ctx,img,w,h)=>{const r=Math.max(w/img.width,h/img.height),iw=img.width*r,ih=img.height*r;ctx.drawImage(img,(w-iw)/2,(h-ih)/2,iw,ih)};

  function applyTint(ctx,zone,color,w,h){
    if(!zone||!color)return;
    const x=(Number(zone.x||.5)-Number(zone.w||.45)/2)*w;
    const y=(Number(zone.y||.48)-Number(zone.h||.5)/2)*h;
    const zw=Number(zone.w||.45)*w, zh=Number(zone.h||.5)*h;
    ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.58;ctx.fillStyle=color;
    ctx.beginPath();ctx.roundRect?.(x,y,zw,zh,Math.min(50,zw*.12));
    if(!ctx.roundRect)ctx.rect(x,y,zw,zh);
    ctx.fill();ctx.restore();
  }

  function placeDesign(ctx,img,zone,w,h){
    if(!img||!zone)return;
    const x=Number(zone.x||.5)*w,y=Number(zone.y||.36)*h;
    const maxW=Number(zone.w||.32)*w,maxH=Number(zone.h||.28)*h;
    const scale=Math.min(maxW/img.width,maxH/img.height);
    const dw=img.width*scale,dh=img.height*scale,rot=Number(zone.rotation||0)*Math.PI/180;
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();
  }

  function pairOptions(){
    const g=$('#mavGarment')?.value;
    const grouped={};
    templates.filter(t=>t.garment_id===g).forEach(t=>{const k=(t.gender||t.name||'modelo').toLowerCase(); grouped[k]??={gender:k,front:null,back:null,name:t.name}; if(t.side==='front')grouped[k].front=t;if(t.side==='back')grouped[k].back=t;});
    return Object.values(grouped).filter(x=>x.front||x.back);
  }

  async function refreshModel(){
    const sel=$('#mavModel'); if(!sel)return;
    const pairs=pairOptions();
    sel.innerHTML=pairs.map((p,i)=>`<option value="${i}">${esc((p.front||p.back)?.gender||p.name||'Modelo')} ${p.front&&p.back?'· frontal + trasera':''}</option>`).join('')||'<option value="">Sin modelos guardados</option>';
    await loadSelectedPair();
  }

  async function loadSelectedPair(){
    const pairs=pairOptions(), idx=Number($('#mavModel')?.value||0),p=pairs[idx];
    frontBase=backBase=null;
    if(p?.front?.image_url)try{frontBase=await loadImage(p.front.image_url)}catch(e){console.error(e)}
    if(p?.back?.image_url)try{backBase=await loadImage(p.back.image_url)}catch(e){console.error(e)}
    drawAll();
  }

  function selectedGarment(){return garments.find(g=>g.id===$('#mavGarment')?.value)}
  function selectedPair(){return pairOptions()[Number($('#mavModel')?.value||0)]}

  function fillColors(){
    const g=selectedGarment(),s=$('#mavColor'); if(!s)return;
    s.innerHTML=(g?.colors||[]).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    drawAll();
  }

  function drawOne(canvas,base,design,side){
    if(!canvas)return; const ctx=canvas.getContext('2d'),w=1000,h=1100;ctx.clearRect(0,0,w,h);ctx.fillStyle='#eef2f6';ctx.fillRect(0,0,w,h);
    if(base)cover(ctx,base,w,h); else {ctx.fillStyle='#667085';ctx.font='700 26px sans-serif';ctx.textAlign='center';ctx.fillText(`Sin plantilla ${side==='front'?'delantera':'trasera'}`,w/2,h/2)}
    const g=selectedGarment(),name=$('#mavColor')?.value||'',hex=g?.color_map?.[name]||'#ffffff',p=selectedPair(),t=side==='front'?p?.front:p?.back;
    if(base&&t?.shirt_zone)applyTint(ctx,t.shirt_zone,hex,w,h);
    placeDesign(ctx,design,t?.print_zone||{x:.5,y:side==='front'?.36:.38,w:side==='front'?.30:.42,h:side==='front'?.26:.38},w,h);
  }

  function drawAll(){drawOne($('#mavFront'),frontBase,frontImg,'front');drawOne($('#mavBack'),backBase,backImg,'back');drawDouble()}
  function drawDouble(){const c=$('#mavDouble');if(!c)return;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,2000,1100);if($('#mavFront'))ctx.drawImage($('#mavFront'),0,0);if($('#mavBack'))ctx.drawImage($('#mavBack'),1000,0)}

  const blobOf=c=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('No se pudo generar PNG')),'image/png',1));
  async function saveCanvas(canvas,name){const b=await blobOf(canvas),f=new File([b],name,{type:'image/png'});if(navigator.share&&navigator.canShare?.({files:[f]}))return navigator.share({files:[f],title:'Mockup AIHXO'});const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},2000)}

  async function attachCanvas(canvas,name){
    const gallery=$('#dpGaleria'); if(!gallery){toast?.('Abre el mockup desde un diseño propio');return}
    const b=await blobOf(canvas),f=new File([b],name,{type:'image/png'}),dt=new DataTransfer();Array.from(gallery.files||[]).forEach(x=>dt.items.add(x));dt.items.add(f);gallery.files=dt.files;toast?.('Mockup añadido al diseño');
  }

  window.abrirMockupAutomatico=async function(){
    const old=$('#aihxoMockupAutoV2'); if(old)old.remove();
    const [{data:g},{data:t}]=await Promise.all([supabaseClient.from('garments').select('id,manufacturer,model,colors,color_map').eq('active',true).order('model'),supabaseClient.from('mockup_templates').select('*').eq('active',true).order('name')]);garments=g||[];templates=t||[];
    const wrap=document.createElement('div');wrap.id='aihxoMockupAutoV2';wrap.style.cssText='position:fixed;inset:0;z-index:20000;background:rgba(7,21,47,.58);overflow:auto;padding:0';
    wrap.innerHTML=`<div style="background:#fff;max-width:980px;margin:0 auto;min-height:100dvh;padding:16px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:#fff;z-index:2;padding:8px 0 12px"><div><h2 style="margin:0">⚡ Mockup automático</h2><div class="muted">Prenda + color + modelo + frontal + trasera</div></div><button id="mavClose" class="secondary">✕</button></div>
    <div class="card" style="padding:14px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px"><label>Prenda base<select id="mavGarment" class="dp-input">${garments.map(x=>`<option value="${x.id}">${esc(x.manufacturer)} · ${esc(x.model)}</option>`).join('')}</select></label><label>Color<select id="mavColor" class="dp-input"></select></label><label>Modelo/persona<select id="mavModel" class="dp-input"></select></label></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><label>Diseño delantero<input id="mavFrontFile" type="file" accept="image/*" class="dp-input"></label><label>Diseño trasero<input id="mavBackFile" type="file" accept="image/*" class="dp-input"></label></div></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:12px"><div class="card"><b>DELANTERO</b><canvas id="mavFront" width="1000" height="1100" style="width:100%;margin-top:8px;border-radius:14px"></canvas><div style="display:grid;gap:8px;margin-top:8px"><button id="mavSaveFront" class="secondary">Guardar frontal PNG</button><button id="mavAttachFront" class="primary">Añadir frontal al diseño</button></div></div><div class="card"><b>TRASERO</b><canvas id="mavBack" width="1000" height="1100" style="width:100%;margin-top:8px;border-radius:14px"></canvas><div style="display:grid;gap:8px;margin-top:8px"><button id="mavSaveBack" class="secondary">Guardar trasero PNG</button><button id="mavAttachBack" class="primary">Añadir trasero al diseño</button></div></div></div>
    <div class="card" style="margin-top:12px"><b>COMPOSICIÓN DOBLE</b><canvas id="mavDouble" width="2000" height="1100" style="width:100%;margin-top:8px;border-radius:14px"></canvas><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button id="mavSaveDouble" class="secondary">Guardar doble PNG</button><button id="mavAttachDouble" class="primary">Añadir doble al diseño</button></div><div class="muted" style="margin-top:8px">El color sobre una foto de persona es una simulación. Cuanto más neutra/blanca sea la camiseta de la plantilla, más realista queda.</div></div></div>`;
    document.body.appendChild(wrap);
    $('#mavClose').onclick=()=>wrap.remove();
    $('#mavGarment').onchange=async()=>{fillColors();await refreshModel()}; $('#mavColor').onchange=drawAll; $('#mavModel').onchange=loadSelectedPair;
    $('#mavFrontFile').onchange=async e=>{frontImg=await fileImage(e.target.files?.[0]);drawAll()}; $('#mavBackFile').onchange=async e=>{backImg=await fileImage(e.target.files?.[0]);drawAll()};
    $('#mavSaveFront').onclick=()=>saveCanvas($('#mavFront'),'AIHXO-mockup-delantero.png');$('#mavSaveBack').onclick=()=>saveCanvas($('#mavBack'),'AIHXO-mockup-trasero.png');$('#mavSaveDouble').onclick=()=>saveCanvas($('#mavDouble'),'AIHXO-mockup-doble.png');
    $('#mavAttachFront').onclick=()=>attachCanvas($('#mavFront'),'AIHXO-mockup-delantero.png');$('#mavAttachBack').onclick=()=>attachCanvas($('#mavBack'),'AIHXO-mockup-trasero.png');$('#mavAttachDouble').onclick=()=>attachCanvas($('#mavDouble'),'AIHXO-mockup-doble.png');
    fillColors();await refreshModel();
    const f=$('#dpFoto')?.files?.[0];if(f){frontImg=await fileImage(f);drawAll()}
  };

  const oldOpen=window.abrirGeneradorMockup;
  window.abrirGeneradorMockup=function(){return window.abrirMockupAutomatico()};
  window.abrirGeneradorMockupClasico=oldOpen;
})();