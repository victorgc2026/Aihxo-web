/* AIHXO · Exportador DTF */
(function(){
  if(window.__aihxoExportadorDTF) return;
  window.__aihxoExportadorDTF=true;

  const state={file:null,img:null,width:0,height:0,hasAlpha:false,name:'diseno',objectUrl:null,source:'upload'};
  const CM_TO_IN=1/2.54;
  const DPI=300;
  const presets=[['Pecho niño','8','6'],['Pecho adulto','10','8'],['Logo sudadera','9','5'],['Espalda niño','28','30'],['Espalda adulto','32','32'],['DTF estándar','25','30'],['Tote','25','36']];
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav||document.querySelector('#aihxoDtfNav')) return;
    const btn=document.createElement('button');
    btn.id='aihxoDtfNav';btn.type='button';btn.innerHTML='🖨️ <span>Exportador DTF</span>';
    btn.onclick=()=>{window.aihxoExportadorDTFView();if(typeof closeMobileMenu==='function')closeMobileMenu();};
    const marketing=[...nav.querySelectorAll('.muted')].find(x=>x.textContent.includes('MARKETING'));
    if(marketing)nav.insertBefore(btn,marketing);else nav.appendChild(btn);
  }

  function pxForCm(cm){return Math.max(1,Math.round(Number(cm||0)*CM_TO_IN*DPI));}
  function fmt(n,d=0){return Number(n||0).toFixed(d);}
  function cleanupUrl(){if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null;}}

  async function designOptions(){
    const rows=(window.products||products||[]).filter(p=>p?.image_url&&String(p.category||'').toLowerCase().includes('diseno propio')).sort((a,b)=>String(a.model||'').localeCompare(String(b.model||''),'es'));
    return rows.map(p=>`<option value="${esc(p.id)}">${esc(p.model||p.sku||'Diseño AIHXO')}</option>`).join('');
  }

  async function render(){
    const view=document.querySelector('#view');if(!view)return;
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('#aihxoDtfNav')?.classList.add('active');
    const title=document.querySelector('#title');if(title)title.textContent='Exportador DTF';
    const options=await designOptions();
    view.innerHTML=`<div class="page">
      <div class="section"><div><h2 style="margin:0">🖨️ Exportador DTF</h2><div class="muted">Prepara un PNG transparente con medidas reales para enviar a impresión.</div></div></div>
      <div class="grid two">
        <div class="card">
          <h3>1. Elegir diseño</h3>
          <label class="field"><span>Diseño AIHXO guardado</span><select id="dtfDesignSelect"><option value="">Seleccionar diseño…</option>${options}</select></label>
          <div class="muted" style="margin:8px 0 14px">O carga un archivo maestro manualmente.</div>
          <input id="dtfFile" type="file" accept="image/png,image/webp,image/jpeg">
          <div id="dtfSourceInfo" class="muted" style="margin-top:10px">Todavía no has cargado ningún diseño.</div>

          <h3 style="margin-top:22px">2. Medida final</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${presets.map(([n,w,h])=>`<button type="button" class="secondary small dtfPreset" data-w="${w}" data-h="${h}">${n} · ${w}×${h}</button>`).join('')}</div>
          <div class="grid two">
            <div class="field"><label>Ancho (cm)</label><input id="dtfW" type="number" min="1" max="100" step="0.1" value="28"></div>
            <div class="field"><label>Alto (cm)</label><input id="dtfH" type="number" min="1" max="100" step="0.1" value="30"></div>
          </div>
          <div class="field" style="margin-top:10px"><label>Ajuste</label><select id="dtfFit"><option value="contain">Encajar sin deformar (recomendado)</option><option value="stretch">Forzar exactamente al ancho y alto</option></select></div>

          <h3 style="margin-top:22px">3. Prenda</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="primary dtfGarment" data-garment="light">☀️ Camiseta clara</button><button type="button" class="secondary dtfGarment" data-garment="dark">🌙 Camiseta oscura</button></div>
          <input id="dtfGarmentValue" type="hidden" value="light">
          <p class="muted" style="margin-top:10px">Esta selección cambia la previsualización y el control de contraste. No altera automáticamente el diseño.</p>
        </div>

        <div class="card">
          <h3>Previsualización y control</h3>
          <div id="dtfPreviewWrap" style="min-height:320px;border:1px solid #d9dee8;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:18px;overflow:hidden"><div class="muted">Elige un diseño o carga una imagen.</div></div>
          <div id="dtfChecks" style="margin-top:14px"></div>
          <button id="dtfExport" class="primary" style="width:100%;margin-top:14px" disabled>Generar PNG DTF</button>
          <button id="dtfSaveFiles" class="secondary" style="width:100%;margin-top:10px" disabled>📁 Guardar en Archivos</button>
          <div class="muted" style="margin-top:9px;font-size:12px">En iPhone, “Guardar en Archivos” abre la hoja de compartir para que elijas tu carpeta de diseños AIHXO. Salida a ${DPI} ppp objetivo.</div>
        </div>
      </div>
    </div>`;
    bind();
  }

  function bind(){
    const file=document.querySelector('#dtfFile');file.onchange=()=>loadFile(file.files?.[0]);
    const design=document.querySelector('#dtfDesignSelect');design.onchange=()=>loadSavedDesign(design.value);
    document.querySelectorAll('.dtfPreset').forEach(b=>b.onclick=()=>{document.querySelector('#dtfW').value=b.dataset.w;document.querySelector('#dtfH').value=b.dataset.h;refresh();});
    ['#dtfW','#dtfH','#dtfFit'].forEach(sel=>document.querySelector(sel)?.addEventListener('input',refresh));
    document.querySelectorAll('.dtfGarment').forEach(b=>b.onclick=()=>{document.querySelectorAll('.dtfGarment').forEach(x=>x.className='secondary dtfGarment');b.className='primary dtfGarment';document.querySelector('#dtfGarmentValue').value=b.dataset.garment;refresh();});
    document.querySelector('#dtfExport').onclick=exportPNG;
    document.querySelector('#dtfSaveFiles').onclick=shareToFiles;
  }

  async function loadSavedDesign(id){
    if(!id)return;
    const p=(window.products||products||[]).find(x=>String(x.id)===String(id));
    if(!p?.image_url){alert('Este diseño no tiene imagen principal disponible.');return;}
    try{
      const r=await fetch(p.image_url,{cache:'no-store'});if(!r.ok)throw new Error('No se pudo descargar la imagen');
      const blob=await r.blob();const ext=(blob.type||'image/png').includes('jpeg')?'jpg':(blob.type||'image/png').split('/')[1]||'png';
      const file=new File([blob],`${p.sku||p.model||'diseno'}.${ext}`,{type:blob.type||'image/png'});state.source='aihxo';await loadFile(file,p.model||p.sku||'Diseño AIHXO');
    }catch(e){alert('No se pudo cargar ese diseño desde AIHXO.');console.error(e);}
  }

  async function loadFile(file,label=''){
    if(!file)return;
    if(!/^image\/(png|webp|jpeg)$/.test(file.type)){alert('Formato no compatible. Usa PNG, WEBP o JPG.');return;}
    cleanupUrl();const url=URL.createObjectURL(file);state.objectUrl=url;const img=new Image();
    img.onload=()=>{state.file=file;state.img=img;state.width=img.naturalWidth;state.height=img.naturalHeight;state.name=((label||file.name).replace(/\.[^.]+$/,'')||'diseno').replace(/[^a-zA-Z0-9_-]+/g,'-');detectAlpha(img).then(v=>{state.hasAlpha=v;refresh();});};
    img.onerror=()=>{cleanupUrl();alert('No se pudo abrir la imagen.');};img.src=url;
  }

  async function detectAlpha(img){
    const max=700,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const x=c.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height).data;
    for(let i=3;i<d.length;i+=4)if(d[i]<250)return true;return false;
  }

  function contrastStats(img){
    const max=400,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,c.width,c.height);const d=x.getImageData(0,0,c.width,c.height).data;let sum=0,n=0,dark=0,light=0;
    for(let i=0;i<d.length;i+=4){if(d[i+3]<40)continue;const lum=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/255;sum+=lum;n++;if(lum<.22)dark++;if(lum>.88)light++;}return n?{avg:sum/n,dark:dark/n,light:light/n}:{avg:.5,dark:0,light:0};
  }

  function refresh(){
    if(!state.img)return;
    const w=Number(document.querySelector('#dtfW')?.value||0),h=Number(document.querySelector('#dtfH')?.value||0),garment=document.querySelector('#dtfGarmentValue')?.value||'light';
    const tW=pxForCm(w),tH=pxForCm(h),ppiW=state.width/(w*CM_TO_IN),ppiH=state.height/(h*CM_TO_IN),effective=Math.min(ppiW,ppiH),stats=contrastStats(state.img);
    document.querySelector('#dtfSourceInfo').innerHTML=`<b>${esc(state.name)}</b><br>${state.width}×${state.height} px · ${(state.file.size/1024/1024).toFixed(2)} MB · ${state.source==='aihxo'?'Diseño AIHXO':'Archivo cargado'}`;
    const wrap=document.querySelector('#dtfPreviewWrap');wrap.style.background=garment==='dark'?'#111':'#fff';wrap.innerHTML='';const im=document.createElement('img');im.src=state.img.src;im.style.maxWidth='100%';im.style.maxHeight='400px';im.style.objectFit='contain';wrap.appendChild(im);
    const okRes=effective>=280,midRes=effective>=180,transparency=state.hasAlpha;let contrastMsg='✅ Contraste general correcto para la prenda elegida.';
    if(garment==='dark'&&stats.dark>.55)contrastMsg='⚠️ El diseño contiene muchos tonos oscuros. Revísalo sobre camiseta oscura; algunos elementos pueden perderse.';
    if(garment==='light'&&stats.light>.65)contrastMsg='⚠️ El diseño contiene muchos tonos muy claros/blancos. Revísalo sobre camiseta clara; algunos elementos pueden perderse.';
    document.querySelector('#dtfChecks').innerHTML=`<div style="display:grid;gap:8px"><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb"><b>Salida:</b> ${fmt(w,1)}×${fmt(h,1)} cm · ${tW}×${tH} px · ${DPI} ppp objetivo</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${okRes?'✅':midRes?'⚠️':'❌'} <b>Resolución efectiva del original:</b> ${Math.round(effective)} ppp ${okRes?'· adecuada':midRes?'· utilizable con precaución':'· insuficiente para esa medida'}</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${transparency?'✅ Fondo transparente detectado':'⚠️ No se detecta transparencia. Si ves un fondo blanco/negro, también aparecerá en el archivo final.'}</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${contrastMsg}</div></div>`;
    const ready=w>0&&h>0;document.querySelector('#dtfExport').disabled=!ready;document.querySelector('#dtfSaveFiles').disabled=!ready;
  }

  async function buildOutput(){
    if(!state.img)return null;
    const w=Number(document.querySelector('#dtfW').value),h=Number(document.querySelector('#dtfH').value),fit=document.querySelector('#dtfFit').value;
    const outW=pxForCm(w),outH=pxForCm(h),c=document.createElement('canvas');c.width=outW;c.height=outH;const x=c.getContext('2d');x.clearRect(0,0,outW,outH);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    if(fit==='stretch')x.drawImage(state.img,0,0,outW,outH);else{const scale=Math.min(outW/state.img.naturalWidth,outH/state.img.naturalHeight),dw=Math.round(state.img.naturalWidth*scale),dh=Math.round(state.img.naturalHeight*scale),dx=Math.round((outW-dw)/2),dy=Math.round((outH-dh)/2);x.drawImage(state.img,dx,dy,dw,dh);}
    const blob=await new Promise(res=>c.toBlob(res,'image/png',1));if(!blob)return null;
    const filename=`AIHXO_${state.name}_DTF_${String(w).replace('.','-')}x${String(h).replace('.','-')}cm_${outW}x${outH}px.png`;
    return {blob,filename};
  }

  async function exportPNG(){
    const out=await buildOutput();if(!out){alert('No se pudo generar el PNG.');return;}
    const dl=URL.createObjectURL(out.blob),a=document.createElement('a');a.href=dl;a.download=out.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(dl),2500);if(typeof toast==='function')toast('PNG DTF generado');
  }

  async function shareToFiles(){
    const out=await buildOutput();if(!out){alert('No se pudo generar el PNG.');return;}
    const file=new File([out.blob],out.filename,{type:'image/png'});
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
        await navigator.share({files:[file],title:'AIHXO · DTF',text:'Archivo DTF listo para guardar'});
        if(typeof toast==='function')toast('Selecciona “Guardar en Archivos”');
      }else{
        await exportPNG();
        alert('Tu navegador no permite abrir directamente “Guardar en Archivos”. Se ha generado el PNG para que puedas guardarlo manualmente.');
      }
    }catch(err){
      if(err?.name!=='AbortError'){console.error(err);await exportPNG();}
    }
  }

  window.aihxoExportadorDTFView=render;
  window.aihxoExportadorDTFDesdeArchivo=async function(file){await render();await loadFile(file);};
  const mo=new MutationObserver(injectNav);mo.observe(document.documentElement,{childList:true,subtree:true});injectNav();
})();