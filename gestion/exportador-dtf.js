/* AIHXO · Exportador DTF */
(function(){
  if(window.__aihxoExportadorDTF) return;
  window.__aihxoExportadorDTF=true;

  const state={file:null,img:null,width:0,height:0,hasAlpha:false,name:'diseno',objectUrl:null,source:'upload',repairedImg:null,repairedBlob:null,repairedUrl:null,selected:'original',repairWarning:'',repairSettings:{removeBackground:true,cleanHalo:true,sharpen:true,clarity:6,threshold:42,feather:24,bgMode:'auto'}};
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
          <div style="margin-top:10px;padding:11px 12px;border-radius:10px;background:#f6f8fb;border:1px solid #edf0f5"><b>🔒 Protección anti-deformación:</b> el diseño mantiene siempre sus proporciones. El espacio sobrante queda transparente.</div>

          <h3 style="margin-top:22px">3. Prenda</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="primary dtfGarment" data-garment="light">☀️ Camiseta clara</button><button type="button" class="secondary dtfGarment" data-garment="dark">🌙 Camiseta oscura</button></div>
          <input id="dtfGarmentValue" type="hidden" value="light">
          <p class="muted" style="margin-top:10px">Esta selección cambia la previsualización y el control de contraste. No altera automáticamente el diseño.</p>
        </div>

        <div class="card">
          <h3>Previsualización y control</h3>
          <div id="dtfPreviewWrap" style="min-height:320px;border:1px solid #d9dee8;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:18px;overflow:hidden"><div class="muted">Elige un diseño o carga una imagen.</div></div>
          <div id="dtfChecks" style="margin-top:14px"></div>

          <div id="dtfRepairPanel" style="margin-top:14px;display:none">
            <div id="dtfRepairStatus" style="padding:12px 14px;border-radius:12px;background:#fff6df;color:#8a5b00;font-weight:800"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
              <button id="dtfRepairNow" class="primary" type="button">✨ Reparar y preparar para DTF</button>
              <button id="dtfUseOriginalTop" class="secondary" type="button">Usar original</button>
            </div>

            <div id="dtfRepairSettings" style="display:none;margin-top:12px;padding:14px;border:1px solid #e5eaf2;border-radius:12px;background:#fff">
              <h4 style="margin:0 0 10px">🎛️ Retoque técnico</h4>
              <label style="display:flex;gap:9px;align-items:center;padding:8px 0"><input id="dtfOptRemoveBg" type="checkbox" checked style="width:auto"><span><b>Quitar fondo</b> si es uniforme o casi uniforme</span></label>
              <label style="display:flex;gap:9px;align-items:center;padding:8px 0"><input id="dtfOptHalo" type="checkbox" checked style="width:auto"><span><b>Limpiar halo</b> alrededor del recorte</span></label>
              <label style="display:flex;gap:9px;align-items:center;padding:8px 0"><input id="dtfOptSharp" type="checkbox" checked style="width:auto"><span><b>Mejorar definición</b> con enfoque suave</span></label>
              <div class="field" style="margin-top:8px"><label>Tipo de fondo</label><select id="dtfBgMode"><option value="auto">Detectar automáticamente</option><option value="white">Blanco</option><option value="black">Negro</option></select></div>
              <div style="display:grid;grid-template-columns:1fr 64px;gap:8px;align-items:center;margin-top:10px"><label>Tolerancia de fondo</label><b id="dtfThresholdVal">42</b><input id="dtfThreshold" type="range" min="10" max="95" value="42" style="grid-column:1/-1;padding:0"></div>
              <div style="display:grid;grid-template-columns:1fr 64px;gap:8px;align-items:center;margin-top:10px"><label>Suavizado de borde</label><b id="dtfFeatherVal">24</b><input id="dtfFeather" type="range" min="0" max="70" value="24" style="grid-column:1/-1;padding:0"></div>
              <div style="display:grid;grid-template-columns:1fr 64px;gap:8px;align-items:center;margin-top:10px"><label>Claridad</label><b id="dtfClarityVal">6</b><input id="dtfClarity" type="range" min="0" max="20" value="6" style="grid-column:1/-1;padding:0"></div>
              <button id="dtfReprocess" class="primary" type="button" style="width:100%;margin-top:12px">Aplicar retoque</button>
            </div>

            <div id="dtfCompare" style="display:none;margin-top:12px">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
                <div id="dtfOriginalCard" style="border:1px solid #e2e7ef;border-radius:12px;padding:10px"><b>Original</b><div style="height:260px;margin-top:8px;background:#eef1f5;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img id="dtfOriginalPreview" alt="Original" style="max-width:100%;max-height:100%;object-fit:contain"></div></div>
                <div id="dtfRepairedCard" style="border:1px solid #e2e7ef;border-radius:12px;padding:10px"><b>Reparado</b><div style="height:260px;margin-top:8px;background:#eef1f5;border-radius:10px;display:flex;align-items:center;justify-content:center;overflow:hidden"><img id="dtfRepairedPreview" alt="Reparado" style="max-width:100%;max-height:100%;object-fit:contain"></div></div>
              </div>
              <div id="dtfRepairInfo" class="muted" style="margin-top:10px"></div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <button id="dtfUseRepaired" class="primary" type="button">✅ Usar reparado</button>
                <button id="dtfUseOriginal" class="secondary" type="button">↩️ Mantener original</button>
                <button id="dtfRetouch" class="secondary" type="button">🎛️ Retocar</button>
                <button id="dtfDownloadRepaired" class="secondary" type="button">Guardar PNG reparado</button>
              </div>
            </div>
          </div>

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
    ['#dtfW','#dtfH'].forEach(sel=>document.querySelector(sel)?.addEventListener('input',refresh));
    document.querySelectorAll('.dtfGarment').forEach(b=>b.onclick=()=>{document.querySelectorAll('.dtfGarment').forEach(x=>x.className='secondary dtfGarment');b.className='primary dtfGarment';document.querySelector('#dtfGarmentValue').value=b.dataset.garment;refresh();});
    document.querySelector('#dtfRepairNow').onclick=processRepair;
    document.querySelector('#dtfUseOriginalTop').onclick=()=>{state.selected='original';markSelected();refresh();};
    document.querySelector('#dtfUseRepaired').onclick=()=>{if(state.repairedImg){state.selected='repaired';markSelected();refresh();}};
    document.querySelector('#dtfUseOriginal').onclick=()=>{state.selected='original';markSelected();refresh();};
    document.querySelector('#dtfRetouch').onclick=()=>{document.querySelector('#dtfRepairSettings').style.display='block';};
    document.querySelector('#dtfReprocess').onclick=processRepair;
    document.querySelector('#dtfDownloadRepaired').onclick=downloadRepairedMaster;
    ['dtfThreshold','dtfFeather','dtfClarity'].forEach(id=>document.querySelector('#'+id)?.addEventListener('input',syncRepairControls));
    ['dtfOptRemoveBg','dtfOptHalo','dtfOptSharp','dtfBgMode'].forEach(id=>document.querySelector('#'+id)?.addEventListener('change',syncRepairControls));
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
    resetRepair();cleanupUrl();const url=URL.createObjectURL(file);state.objectUrl=url;const img=new Image();
    img.onload=()=>{state.file=file;state.img=img;state.selected='original';state.width=img.naturalWidth;state.height=img.naturalHeight;state.name=((label||file.name).replace(/\.[^.]+$/,'')||'diseno').replace(/[^a-zA-Z0-9_-]+/g,'-');detectAlpha(img).then(v=>{state.hasAlpha=v;refresh();});};
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
    const displayImg=currentImage();
    const w=Number(document.querySelector('#dtfW')?.value||0),h=Number(document.querySelector('#dtfH')?.value||0),garment=document.querySelector('#dtfGarmentValue')?.value||'light';
    const tW=pxForCm(w),tH=pxForCm(h),ppiW=state.width/(w*CM_TO_IN),ppiH=state.height/(h*CM_TO_IN),effective=Math.min(ppiW,ppiH),stats=contrastStats(state.img);
    document.querySelector('#dtfSourceInfo').innerHTML=`<b>${esc(state.name)}</b><br>${state.width}×${state.height} px · ${(state.file.size/1024/1024).toFixed(2)} MB · ${state.source==='aihxo'?'Diseño AIHXO':'Archivo cargado'}`;
    const wrap=document.querySelector('#dtfPreviewWrap');wrap.style.background=garment==='dark'?'#111':'#fff';wrap.innerHTML='';const im=document.createElement('img');im.src=displayImg.src;im.style.maxWidth='100%';im.style.maxHeight='400px';im.style.objectFit='contain';wrap.appendChild(im);
    const okRes=effective>=280,midRes=effective>=180,transparency=(state.selected==='repaired'&&state.repairedImg)?true:state.hasAlpha;let contrastMsg='✅ Contraste general correcto para la prenda elegida.';
    if(garment==='dark'&&stats.dark>.55)contrastMsg='⚠️ El diseño contiene muchos tonos oscuros. Revísalo sobre camiseta oscura; algunos elementos pueden perderse.';
    if(garment==='light'&&stats.light>.65)contrastMsg='⚠️ El diseño contiene muchos tonos muy claros/blancos. Revísalo sobre camiseta clara; algunos elementos pueden perderse.';
    document.querySelector('#dtfChecks').innerHTML=`<div style="display:grid;gap:8px"><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb"><b>Salida:</b> ${fmt(w,1)}×${fmt(h,1)} cm · ${tW}×${tH} px · ${DPI} ppp objetivo</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${okRes?'✅':midRes?'⚠️':'❌'} <b>Resolución efectiva del original:</b> ${Math.round(effective)} ppp ${okRes?'· adecuada':midRes?'· utilizable con precaución':'· insuficiente para esa medida'}</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${transparency?'✅ Fondo transparente detectado':'⚠️ No se detecta transparencia. Si ves un fondo blanco/negro, también aparecerá en el archivo final.'}</div><div style="padding:10px 12px;border-radius:10px;background:#f6f8fb">${contrastMsg}</div></div>`;
    updateRepairPanel(effective);const ready=w>0&&h>0;document.querySelector('#dtfExport').disabled=!ready;document.querySelector('#dtfSaveFiles').disabled=!ready;
  }

  function resetRepair(){
    if(state.repairedUrl){URL.revokeObjectURL(state.repairedUrl);state.repairedUrl=null;}
    state.repairedImg=null;state.repairedBlob=null;state.selected='original';state.repairWarning='';
    const cmp=document.querySelector('#dtfCompare');if(cmp)cmp.style.display='none';
  }

  function currentImage(){return state.selected==='repaired'&&state.repairedImg?state.repairedImg:state.img;}

  function syncRepairControls(){
    const s=state.repairSettings;
    const a=document.querySelector('#dtfOptRemoveBg'),b=document.querySelector('#dtfOptHalo'),d=document.querySelector('#dtfOptSharp'),m=document.querySelector('#dtfBgMode');
    if(a)s.removeBackground=a.checked;if(b)s.cleanHalo=b.checked;if(d)s.sharpen=d.checked;if(m)s.bgMode=m.value;
    const t=document.querySelector('#dtfThreshold'),f=document.querySelector('#dtfFeather'),cl=document.querySelector('#dtfClarity');
    if(t)s.threshold=Number(t.value);if(f)s.feather=Number(f.value);if(cl)s.clarity=Number(cl.value);
    const tv=document.querySelector('#dtfThresholdVal'),fv=document.querySelector('#dtfFeatherVal'),cv=document.querySelector('#dtfClarityVal');
    if(tv)tv.textContent=s.threshold;if(fv)fv.textContent=s.feather;if(cv)cv.textContent=s.clarity;
  }

  function updateRepairPanel(effective){
    const panel=document.querySelector('#dtfRepairPanel');if(!panel)return;panel.style.display='block';
    const st=document.querySelector('#dtfRepairStatus');
    let label='🟢 LISTO PARA DTF',bg='#eaf8f0',color='#166b43';
    if(!state.hasAlpha||effective<280){label='🟠 RECOMENDAMOS REPARAR';bg='#fff6df';color='#8a5b00';}
    if(effective<150){label='🔴 NO RECOMENDADO SIN REVISIÓN';bg='#fff0f1';color='#a02333';}
    if(state.selected==='repaired'&&state.repairedImg){label='✅ VERSIÓN REPARADA SELECCIONADA';bg='#eaf8f0';color='#166b43';}
    st.textContent=label;st.style.background=bg;st.style.color=color;
  }

  function markSelected(){
    const o=document.querySelector('#dtfOriginalCard'),r=document.querySelector('#dtfRepairedCard');
    if(o)o.style.outline=state.selected==='original'?'3px solid rgba(8,124,244,.22)':'none';
    if(r)r.style.outline=state.selected==='repaired'?'3px solid rgba(8,124,244,.22)':'none';
  }

  function imageFromUrl(url){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});}

  function sampleBackground(data,w,h,mode){
    if(mode==='white')return {rgb:[255,255,255],spread:0};if(mode==='black')return {rgb:[0,0,0],spread:0};
    const pts=[[2,2],[w-3,2],[2,h-3],[w-3,h-3],[Math.floor(w/2),2],[Math.floor(w/2),h-3]];
    const vals=pts.map(([x,y])=>{const p=(Math.max(0,y)*w+Math.max(0,x))*4;return [data[p],data[p+1],data[p+2]];});
    const rgb=[0,1,2].map(k=>Math.round(vals.reduce((s,v)=>s+v[k],0)/vals.length));
    const spread=vals.reduce((s,v)=>s+Math.hypot(v[0]-rgb[0],v[1]-rgb[1],v[2]-rgb[2]),0)/vals.length;
    return {rgb,spread};
  }

  function removeEdgeBackground(imageData,w,h,bg,threshold,feather,cleanHalo){
    const d=imageData.data,total=w*h,seen=new Uint8Array(total),stack=new Int32Array(total);let sp=0;
    const maxDist=threshold+feather,dist=p=>{const i=p*4;return Math.hypot(d[i]-bg[0],d[i+1]-bg[1],d[i+2]-bg[2]);};
    const push=p=>{if(p<0||p>=total||seen[p])return;seen[p]=1;if(dist(p)<=maxDist)stack[sp++]=p;};
    for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
    while(sp){
      const p=stack[--sp],i=p*4,ds=dist(p);let a=0;if(ds>threshold&&feather>0)a=clamp(Math.round(255*(ds-threshold)/feather),0,255);
      if(a<255){
        if(cleanHalo&&a>8){const af=a/255;d[i]=clamp(Math.round((d[i]-bg[0]*(1-af))/af),0,255);d[i+1]=clamp(Math.round((d[i+1]-bg[1]*(1-af))/af),0,255);d[i+2]=clamp(Math.round((d[i+2]-bg[2]*(1-af))/af),0,255);}
        d[i+3]=Math.min(d[i+3],a);
      }
      const x=p%w,y=(p/w)|0;if(x>0)push(p-1);if(x<w-1)push(p+1);if(y>0)push(p-w);if(y<h-1)push(p+w);
    }
  }

  function sharpenImage(imageData,w,h,amount=.16){
    if(w<3||h<3)return;const d=imageData.data,src=new Uint8ClampedArray(d);
    for(let y=1;y<h-1;y++){let p=(y*w+1)*4;for(let x=1;x<w-1;x++,p+=4){if(src[p+3]===0)continue;for(let k=0;k<3;k++){const v=src[p+k]*(1+4*amount)-amount*(src[p-4+k]+src[p+4+k]+src[p-w*4+k]+src[p+w*4+k]);d[p+k]=clamp(Math.round(v),0,255);}}}
  }

  function applyClarity(imageData,clarity){
    const d=imageData.data,f=1+Number(clarity||0)/100;for(let i=0;i<d.length;i+=4){if(d[i+3]===0)continue;d[i]=clamp(Math.round((d[i]-128)*f+128),0,255);d[i+1]=clamp(Math.round((d[i+1]-128)*f+128),0,255);d[i+2]=clamp(Math.round((d[i+2]-128)*f+128),0,255);}
  }

  async function processRepair(){
    if(!state.img)return;syncRepairControls();
    const btn=document.querySelector('#dtfRepairNow'),btn2=document.querySelector('#dtfReprocess');if(btn)btn.disabled=true;if(btn2)btn2.disabled=true;
    if(btn)btn.textContent='Procesando…';
    try{
      const src=state.img,maxProcess=1600,scale=Math.min(1,maxProcess/Math.max(src.naturalWidth,src.naturalHeight));
      const w=Math.max(1,Math.round(src.naturalWidth*scale)),h=Math.max(1,Math.round(src.naturalHeight*scale));
      const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0,w,h);
      const id=x.getImageData(0,0,w,h),s=state.repairSettings,bg=sampleBackground(id.data,w,h,s.bgMode);state.repairWarning='';
      if(s.removeBackground&&!state.hasAlpha){if(bg.spread>58&&s.bgMode==='auto')state.repairWarning='⚠️ El fondo parece complejo: revisa bien los bordes. Puedes ajustar la tolerancia o mantener el original.';removeEdgeBackground(id,w,h,bg.rgb,s.threshold,s.feather,s.cleanHalo);}
      if(s.sharpen)sharpenImage(id,w,h,.14);if(s.clarity)applyClarity(id,s.clarity);x.putImageData(id,0,0);
      const tw=pxForCm(Number(document.querySelector('#dtfW').value)),th=pxForCm(Number(document.querySelector('#dtfH').value));
      const desired=Math.min(3,Math.max(1,Math.min(tw/w,th/h))),cap=Math.min(1,4200/Math.max(w*desired,h*desired)),upScale=desired*cap;
      let out=c;if(upScale>1.03){const u=document.createElement('canvas');u.width=Math.round(w*upScale);u.height=Math.round(h*upScale);const ux=u.getContext('2d');ux.imageSmoothingEnabled=true;ux.imageSmoothingQuality='high';ux.drawImage(c,0,0,u.width,u.height);out=u;}
      const blob=await new Promise(res=>out.toBlob(res,'image/png',1));if(!blob)throw new Error('No se pudo crear el PNG reparado');
      if(state.repairedUrl)URL.revokeObjectURL(state.repairedUrl);state.repairedBlob=blob;state.repairedUrl=URL.createObjectURL(blob);state.repairedImg=await imageFromUrl(state.repairedUrl);state.selected='repaired';
      const cmp=document.querySelector('#dtfCompare');if(cmp)cmp.style.display='block';document.querySelector('#dtfOriginalPreview').src=state.img.src;document.querySelector('#dtfRepairedPreview').src=state.repairedImg.src;
      const info=document.querySelector('#dtfRepairInfo');if(info)info.innerHTML='Reparado: <b>'+state.repairedImg.naturalWidth+'×'+state.repairedImg.naturalHeight+' px</b>. '+(s.removeBackground&&!state.hasAlpha?'Fondo tratado · ':'')+(s.sharpen?'definición mejorada · ':'')+'original conservado. '+state.repairWarning;
      markSelected();refresh();if(typeof toast==='function')toast('Diseño reparado. Revisa la comparación.');
    }catch(e){console.error(e);alert('No se pudo completar la reparación. El original sigue intacto.');}
    finally{if(btn){btn.disabled=false;btn.textContent='✨ Reparar y preparar para DTF';}if(btn2)btn2.disabled=false;}
  }

  function downloadRepairedMaster(){if(!state.repairedBlob){alert('Primero genera una versión reparada.');return;}downloadBlob(state.repairedBlob,'AIHXO_'+state.name+'_reparado.png');}

  function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++){c^=bytes[i];for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
  function u32be(n){return new Uint8Array([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
  function concatBytes(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
  async function withPngDpi(blob){
    const src=new Uint8Array(await blob.arrayBuffer());if(src.length<33)return blob;const type=new TextEncoder().encode('pHYs'),ppm=Math.round(DPI/0.0254),data=concatBytes([u32be(ppm),u32be(ppm),new Uint8Array([1])]),crc=u32be(crc32(concatBytes([type,data]))),chunk=concatBytes([u32be(data.length),type,data,crc]);
    const ihdrLen=((src[8]<<24)|(src[9]<<16)|(src[10]<<8)|src[11])>>>0,at=8+12+ihdrLen,out=concatBytes([src.slice(0,at),chunk,src.slice(at)]);return new Blob([out],{type:'image/png'});
  }
  async function buildOutput(){
    const img=currentImage();if(!img)return null;
    const w=Number(document.querySelector('#dtfW').value),h=Number(document.querySelector('#dtfH').value);
    const outW=pxForCm(w),outH=pxForCm(h),c=document.createElement('canvas');c.width=outW;c.height=outH;const x=c.getContext('2d');x.clearRect(0,0,outW,outH);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    const scale=Math.min(outW/img.naturalWidth,outH/img.naturalHeight),dw=Math.round(img.naturalWidth*scale),dh=Math.round(img.naturalHeight*scale),dx=Math.round((outW-dw)/2),dy=Math.round((outH-dh)/2);x.drawImage(img,dx,dy,dw,dh);
    const raw=await new Promise(res=>c.toBlob(res,'image/png',1));if(!raw)return null;const blob=await withPngDpi(raw);
    const version=state.selected==='repaired'&&state.repairedImg?'reparado':'original';
    const filename=`AIHXO_${state.name}_${version}_DTF_${String(w).replace('.','-')}x${String(h).replace('.','-')}cm_300ppp.png`;
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