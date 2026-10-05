/* AIHXO · Reels Studio v1
   Grabación, montaje rápido vertical 9:16 y exportación para Instagram/TikTok.
*/
(function(){
  if(window.__aihxoReelsStudio) return;
  window.__aihxoReelsStudio=true;

  const state={clips:[],selected:null,stream:null,recorder:null,chunks:[],projectName:'',orderId:'',title:'',watermark:true,autoBrand:true,transition:'fade'};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const uid=()=> 'rv'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const fmt=n=>{n=Math.max(0,Number(n)||0);const m=Math.floor(n/60),s=Math.floor(n%60);return m+':'+String(s).padStart(2,'0');};
  const toastMsg=m=>{if(typeof window.toast==='function') window.toast(m); else alert(m);};

  function db(){
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open('AIHXOReelsDB',1);
      r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('projects'))d.createObjectStore('projects',{keyPath:'name'});};
      r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
    });
  }
  async function saveProject(){
    const name=(document.querySelector('#reelProject')?.value||'').trim();
    if(!name){toastMsg('Pon un nombre al montaje');return;}
    const d=await db();
    const clips=state.clips.map(c=>({id:c.id,name:c.name,blob:c.blob,start:c.start,end:c.end,duration:c.duration,speed:c.speed||1,text:c.text||'',transition:c.transition||'fade'}));
    await new Promise((resolve,reject)=>{const tx=d.transaction('projects','readwrite');tx.objectStore('projects').put({name,updatedAt:Date.now(),orderId:state.orderId,title:state.title,watermark:state.watermark,autoBrand:state.autoBrand,transition:state.transition,clips});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    d.close(); state.projectName=name; await refreshProjects(); toastMsg('Montaje guardado');
  }
  async function listProjects(){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('projects','readonly'),r=tx.objectStore('projects').getAll();r.onsuccess=()=>{d.close();resolve((r.result||[]).sort((a,b)=>b.updatedAt-a.updatedAt));};r.onerror=()=>reject(r.error);});}
  async function refreshProjects(){
    const s=document.querySelector('#reelSaved'); if(!s)return;
    const rows=await listProjects().catch(()=>[]);
    s.innerHTML='<option value="">Montajes guardados…</option>'+rows.map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');
  }
  async function openProject(){
    const name=document.querySelector('#reelSaved')?.value;if(!name)return;
    const d=await db();
    const p=await new Promise((resolve,reject)=>{const tx=d.transaction('projects','readonly'),r=tx.objectStore('projects').get(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});d.close();
    if(!p)return;
    clearClipUrls();
    state.clips=(p.clips||[]).map(c=>({...c,url:URL.createObjectURL(c.blob)}));
    state.projectName=p.name;state.orderId=p.orderId||'';state.title=p.title||'';state.watermark=p.watermark!==false;state.autoBrand=p.autoBrand!==false;state.transition=p.transition||'fade';state.clips.forEach(x=>{x.speed=x.speed||1;x.text=x.text||'';x.transition=x.transition||state.transition;});state.selected=state.clips[0]?.id||null;
    document.querySelector('#reelProject').value=p.name;
    document.querySelector('#reelOrder').value=state.orderId;
    document.querySelector('#reelTitleText').value=state.title;
    document.querySelector('#reelWatermark').checked=state.watermark;document.querySelector('#reelAutoBrand').checked=state.autoBrand;document.querySelector('#reelTransition').value=state.transition;
    renderClips();updatePreview();toastMsg('Montaje abierto');
  }
  async function deleteProject(){
    const name=document.querySelector('#reelSaved')?.value;if(!name)return;
    if(!confirm('¿Eliminar el montaje '+name+'?'))return;
    const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('projects','readwrite');tx.objectStore('projects').delete(name);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});d.close();await refreshProjects();toastMsg('Montaje eliminado');
  }

  function ensureStyles(){
    if(document.querySelector('#aihxoReelsStyles'))return;
    const s=document.createElement('style');s.id='aihxoReelsStyles';s.textContent=`
      .reels-shell{display:grid;grid-template-columns:300px minmax(280px,430px) 1fr;gap:14px;align-items:start}
      .reels-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:var(--shadow)}
      .reels-phone{aspect-ratio:9/16;background:#05070b;border-radius:28px;overflow:hidden;position:relative;max-height:72vh;margin:auto;box-shadow:0 16px 40px rgba(0,0,0,.22)}
      .reels-phone video{width:100%;height:100%;object-fit:cover;background:#000}
      .reels-overlay{position:absolute;left:18px;right:18px;bottom:38px;color:#fff;font-size:24px;font-weight:900;text-shadow:0 2px 12px rgba(0,0,0,.75);pointer-events:none}
      .reels-logo{position:absolute;right:14px;top:14px;width:58px;height:58px;border-radius:14px;object-fit:contain;background:rgba(255,255,255,.88);padding:5px;pointer-events:none}
      .reels-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .reels-clip{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px;border:1px solid #e4e9f1;border-radius:12px;margin-bottom:8px;cursor:pointer}
      .reels-clip.active{border-color:#087cf4;box-shadow:0 0 0 2px rgba(8,124,244,.1)}
      .reels-thumb{width:58px;height:78px;border-radius:9px;background:#111;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;overflow:hidden}.reels-thumb img{width:100%;height:100%;object-fit:cover}
      .reels-actions{display:flex;gap:5px;flex-wrap:wrap}
      .reels-actions button{padding:5px 7px;font-size:11px}.reels-clip[draggable="true"]{touch-action:manipulation}.reels-clip.dragging{opacity:.45}.reels-trimbar{padding:12px;border:1px solid #e5eaf1;border-radius:12px;background:#f7f9fc}.reels-trimbar input[type=range]{width:100%}.reels-chip{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;background:#eef5ff;color:#0868c7;font-weight:800;font-size:11px}
      .reels-note{background:#f6f8fb;border:1px solid #e5eaf1;padding:10px;border-radius:11px;font-size:12px;line-height:1.45;color:#526078}
      .reels-export{padding:12px;border-radius:12px;background:#07152f;color:#fff}
      @media(max-width:1050px){.reels-shell{grid-template-columns:1fr}.reels-phone{max-height:68vh}.reels-panel.preview{order:-1}}
    `;document.head.appendChild(s);
  }

  function injectNav(){
    const nav=document.querySelector('#nav');if(!nav||document.querySelector('[data-aihxo-reels]'))return;
    const b=document.createElement('button');b.type='button';b.setAttribute('data-aihxo-reels','1');b.innerHTML='🎬 <span>Reels</span>';
    b.onclick=()=>{renderReels();if(typeof closeMobileMenu==='function')closeMobileMenu();};
    const ref=document.querySelector('#aihxoStudioNav');if(ref)ref.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  }
  new MutationObserver(injectNav).observe(document.documentElement,{subtree:true,childList:true});injectNav();

  function orderOptions(){
    const rows=Array.isArray(window.orders)?window.orders:[];
    return '<option value="">Sin vincular a pedido</option>'+rows.map(o=>'<option value="'+esc(o.id)+'">'+esc((o.order_number||'Pedido')+' · '+(o.customer_name||''))+'</option>').join('');
  }

  function renderReels(){
    ensureStyles();injectNav();
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-aihxo-reels]')?.classList.add('active');
    const title=document.querySelector('#title');if(title)title.textContent='Reels';
    const v=document.querySelector('#view');if(!v)return;
    v.innerHTML=`
      <div class="page">
        <div class="section">
          <div><h2 style="margin:0">🎬 AIHXO Reels Studio</h2><div class="muted">Graba · monta · exporta vertical 9:16</div></div>
          <span class="badge">v2</span>
        </div>
        <div class="reels-shell">
          <section class="reels-panel">
            <h3 style="margin-top:0">Montaje</h3>
            <div class="field"><label>Pedido</label><select id="reelOrder">${orderOptions()}</select></div>
            <div class="field"><label>Nombre del montaje</label><input id="reelProject" placeholder="Ej. Pedido Sara - Reel final"></div>
            <div class="field"><label>Texto sobre el vídeo</label><input id="reelTitleText" maxlength="80" placeholder="Hecho por AIHXO ✨"></div>
            <label style="display:flex;gap:8px;align-items:center;margin:8px 0 8px"><input id="reelWatermark" type="checkbox" checked style="width:auto"> Logo AIHXO</label><label style="display:flex;gap:8px;align-items:center;margin:0 0 12px"><input id="reelAutoBrand" type="checkbox" checked style="width:auto"> Entrada y cierre AIHXO automáticos</label><div class="field"><label>Transición entre clips</label><select id="reelTransition"><option value="fade">Suave</option><option value="none">Sin transición</option></select></div>
            <div class="reels-row">
              <button class="primary" id="reelCamera">📹 Grabar</button>
              <button class="secondary" id="reelStop" disabled>⏹ Parar</button>
              <label class="secondary" style="cursor:pointer;padding:9px 12px">＋ Añadir clips<input id="reelFiles" type="file" accept="video/*" multiple hidden></label>
            </div>
            <div class="reels-note" style="margin-top:12px"><b>Guía rápida:</b> prenda → diseño → plancha → peel → detalle → resultado. Graba tomas cortas de 2–5 segundos.</div>
            <h3>Proyecto</h3>
            <div class="reels-row"><button class="secondary" id="reelSave">💾 Guardar</button><button class="secondary" id="reelOpen">📂 Abrir</button><button class="secondary" id="reelDelete">Eliminar</button></div>
            <select id="reelSaved" style="margin-top:8px"><option>Montajes guardados…</option></select>
          </section>
          <section class="reels-panel preview">
            <div class="reels-phone">
              <video id="reelPreview" playsinline controls></video>
              <img class="reels-logo" id="reelLogoPreview" src="icon-512.png" alt="AIHXO">
              <div class="reels-overlay" id="reelTextPreview"></div>
            </div>
            <div id="reelTrim" style="margin-top:12px"></div>
          </section>
          <section class="reels-panel">
            <div class="section"><div><h3 style="margin:0">Clips</h3><div class="muted" id="reelDuration">0 clips · 0:00</div></div></div>
            <div id="reelClips"><div class="empty">Graba o añade vídeos para empezar.</div></div>
            <div class="reels-export" style="margin-top:14px">
              <b>Salida Instagram / TikTok</b><div style="opacity:.75;font-size:12px;margin:5px 0 10px">1080×1920 · 9:16 · vídeo vertical</div>
              <button class="primary" id="reelExport" style="width:100%">⬇️ Crear vídeo final</button>
              <div id="reelExportStatus" style="font-size:12px;margin-top:8px"></div>
            </div>
          </section>
        </div>
      </div>`;
    bind();refreshProjects();renderClips();updatePreview();
  }

  function bind(){
    const order=document.querySelector('#reelOrder');order.value=state.orderId;order.onchange=()=>state.orderId=order.value;
    const tx=document.querySelector('#reelTitleText');tx.value=state.title;tx.oninput=()=>{state.title=tx.value;syncOverlays();};
    const wm=document.querySelector('#reelWatermark');wm.checked=state.watermark;wm.onchange=()=>{state.watermark=wm.checked;syncOverlays();};const ab=document.querySelector('#reelAutoBrand');ab.checked=state.autoBrand;ab.onchange=()=>state.autoBrand=ab.checked;const tr=document.querySelector('#reelTransition');tr.value=state.transition;tr.onchange=()=>{state.transition=tr.value;state.clips.forEach(x=>x.transition=tr.value);};
    const pn=document.querySelector('#reelProject');pn.value=state.projectName;
    document.querySelector('#reelFiles').onchange=e=>addFiles([...e.target.files]);
    document.querySelector('#reelCamera').onclick=startCamera;
    document.querySelector('#reelStop').onclick=stopRecording;
    document.querySelector('#reelSave').onclick=saveProject;
    document.querySelector('#reelOpen').onclick=openProject;
    document.querySelector('#reelDelete').onclick=deleteProject;
    document.querySelector('#reelExport').onclick=exportVideo;
  }

  async function durationFor(url){
    return new Promise(resolve=>{const v=document.createElement('video');v.preload='metadata';v.src=url;v.onloadedmetadata=()=>resolve(Number.isFinite(v.duration)?v.duration:0);v.onerror=()=>resolve(0);});
  }
  async function addBlob(blob,name){
    const url=URL.createObjectURL(blob),duration=await durationFor(url);
    const c={id:uid(),name:name||'Clip',blob,url,duration,start:0,end:duration||0,speed:1,text:'',transition:state.transition,thumb:''};state.clips.push(c);state.selected=c.id;renderClips();updatePreview();generateThumb(c).then(()=>renderClips());
  }
  async function addFiles(files){for(const f of files){if(f.type.startsWith('video/'))await addBlob(f,f.name);}document.querySelector('#reelFiles').value='';}
  async function generateThumb(c){
    try{
      const v=document.createElement('video');v.src=c.url;v.muted=true;v.playsInline=true;v.preload='metadata';
      await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej;});
      await seek(v,Math.min(Math.max(c.start||0,.05),Math.max(.05,(c.duration||1)-.05)));
      const cv=document.createElement('canvas');cv.width=180;cv.height=240;const g=cv.getContext('2d');
      const vw=v.videoWidth||180,vh=v.videoHeight||240,sc=Math.max(cv.width/vw,cv.height/vh),dw=vw*sc,dh=vh*sc;
      g.drawImage(v,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);c.thumb=cv.toDataURL('image/jpeg',.72);
    }catch(e){}
  }

  async function startCamera(){
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){toastMsg('La grabación directa no está disponible en este navegador. Puedes añadir el vídeo desde Fotos.');return;}
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1080},height:{ideal:1920}},audio:true});
      const p=document.querySelector('#reelPreview');p.srcObject=state.stream;p.controls=false;p.muted=true;await p.play();
      const preferred=['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported?.(x));
      state.chunks=[];state.recorder=new MediaRecorder(state.stream,preferred?{mimeType:preferred}:undefined);
      state.recorder.ondataavailable=e=>{if(e.data?.size)state.chunks.push(e.data);};
      state.recorder.onstop=async()=>{const type=state.recorder.mimeType||state.chunks[0]?.type||'video/webm';const blob=new Blob(state.chunks,{type});state.stream.getTracks().forEach(t=>t.stop());state.stream=null;p.srcObject=null;p.controls=true;await addBlob(blob,'Grabación '+new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}));};
      state.recorder.start(500);document.querySelector('#reelCamera').disabled=true;document.querySelector('#reelStop').disabled=false;toastMsg('Grabando…');
    }catch(e){console.error(e);toastMsg('No se pudo abrir la cámara o el micrófono');}
  }
  function stopRecording(){if(state.recorder&&state.recorder.state!=='inactive')state.recorder.stop();document.querySelector('#reelCamera').disabled=false;document.querySelector('#reelStop').disabled=true;}

  function renderClips(){
    const root=document.querySelector('#reelClips');if(!root)return;
    if(!state.clips.length){root.innerHTML='<div class="empty">Graba o añade vídeos para empezar.</div>';document.querySelector('#reelDuration').textContent='0 clips · 0:00';return;}
    root.innerHTML=state.clips.map((c,i)=>`<div class="reels-clip ${c.id===state.selected?'active':''}" data-id="${c.id}" draggable="true">
      <div class="reels-thumb">${c.thumb?'<img src="'+c.thumb+'" alt="">':'▶'}</div><div><b>${esc(c.name)}</b><div class="muted">${fmt(((c.end||c.duration)-(c.start||0))/(c.speed||1))} · ${c.speed||1}×</div>${c.text?'<span class="reels-chip">Texto</span>':''}</div>
      <div class="reels-actions"><button data-act="up">↑</button><button data-act="down">↓</button><button data-act="del">✕</button></div></div>`).join('');
    const total=state.clips.reduce((a,c)=>a+Math.max(0,((c.end||c.duration)-(c.start||0))/(c.speed||1)),0)+(state.autoBrand?2.4:0);document.querySelector('#reelDuration').textContent=state.clips.length+' clips · '+fmt(total);
    let dragged=null;root.querySelectorAll('.reels-clip').forEach(el=>{
      el.onclick=e=>{const id=el.dataset.id,act=e.target?.dataset?.act;if(act){e.stopPropagation();clipAction(id,act);return;}state.selected=id;renderClips();updatePreview();};
      el.ondragstart=()=>{dragged=el.dataset.id;el.classList.add('dragging');};
      el.ondragend=()=>{el.classList.remove('dragging');dragged=null;};
      el.ondragover=e=>e.preventDefault();
      el.ondrop=e=>{e.preventDefault();const target=el.dataset.id;if(!dragged||dragged===target)return;const a=state.clips.findIndex(x=>x.id===dragged),b=state.clips.findIndex(x=>x.id===target);const [m]=state.clips.splice(a,1);state.clips.splice(b,0,m);renderClips();};
    });
  }
  function clipAction(id,act){
    const i=state.clips.findIndex(c=>c.id===id);if(i<0)return;
    if(act==='del'){URL.revokeObjectURL(state.clips[i].url);state.clips.splice(i,1);if(state.selected===id)state.selected=state.clips[Math.min(i,state.clips.length-1)]?.id||null;}
    if(act==='up'&&i>0)[state.clips[i-1],state.clips[i]]=[state.clips[i],state.clips[i-1]];
    if(act==='down'&&i<state.clips.length-1)[state.clips[i+1],state.clips[i]]=[state.clips[i],state.clips[i+1]];
    renderClips();updatePreview();
  }

  function selected(){return state.clips.find(c=>c.id===state.selected);}
  function updatePreview(){
    const p=document.querySelector('#reelPreview');const c=selected();if(!p)return;
    if(!c){p.removeAttribute('src');p.load();document.querySelector('#reelTrim').innerHTML='<div class="muted">Selecciona un clip para previsualizarlo.</div>';syncOverlays();return;}
    p.srcObject=null;p.src=c.url;p.controls=true;p.muted=false;p.currentTime=c.start||0;
    document.querySelector('#reelTrim').innerHTML=`<div class="reels-trimbar">
      <div class="section" style="margin-bottom:6px"><b>Recorte del clip</b><span class="reels-chip">${fmt(((c.end||c.duration)-(c.start||0))/(c.speed||1))}</span></div>
      <label>Inicio · <b id="reelStartLabel">${Number(c.start||0).toFixed(1)} s</b></label><input id="reelStart" type="range" min="0" max="${c.duration}" step=".1" value="${Number(c.start||0).toFixed(1)}">
      <label>Fin · <b id="reelEndLabel">${Number(c.end||c.duration).toFixed(1)} s</b></label><input id="reelEnd" type="range" min="0" max="${c.duration}" step=".1" value="${Number(c.end||c.duration).toFixed(1)}">
      <div class="formgrid" style="margin-top:10px"><div class="field"><label>Velocidad</label><select id="reelSpeed"><option value=".5">0,5×</option><option value="1">1×</option><option value="1.5">1,5×</option><option value="2">2×</option><option value="4">4×</option></select></div><div class="field"><label>Texto de este clip</label><input id="reelClipText" maxlength="60" placeholder="Ej. Peel perfecto ✨" value="${esc(c.text||'')}"></div></div>
      <div class="muted">Arrastra los controles para marcar exactamente lo que entra en el Reel.</div>
    </div>`;
    const rs=document.querySelector('#reelStart'),re=document.querySelector('#reelEnd');rs.oninput=e=>{c.start=Math.max(0,Math.min(Number(e.target.value)||0,c.end-.1));document.querySelector('#reelStartLabel').textContent=c.start.toFixed(1)+' s';p.currentTime=c.start;renderClips();};re.oninput=e=>{c.end=Math.max(c.start+.1,Math.min(Number(e.target.value)||c.duration,c.duration));document.querySelector('#reelEndLabel').textContent=c.end.toFixed(1)+' s';renderClips();};const sp=document.querySelector('#reelSpeed');sp.value=String(c.speed||1);sp.onchange=()=>{c.speed=Number(sp.value)||1;p.playbackRate=c.speed;renderClips();};const ct=document.querySelector('#reelClipText');ct.oninput=()=>{c.text=ct.value;syncOverlays();renderClips();};p.playbackRate=c.speed||1;
    syncOverlays();
  }
  function syncOverlays(){const t=document.querySelector('#reelTextPreview'),l=document.querySelector('#reelLogoPreview'),c=selected();if(t)t.textContent=c?.text||state.title||'';if(l)l.style.display=state.watermark?'block':'none';}

  async function seek(v,t){return new Promise(resolve=>{const done=()=>{v.removeEventListener('seeked',done);resolve();};v.addEventListener('seeked',done);v.currentTime=Math.max(0,t);setTimeout(done,900);});}
  function drawFrame(ctx,v,w,h,clip,alpha=1){
    ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
    const vw=v.videoWidth||w,vh=v.videoHeight||h,scale=Math.max(w/vw,h/vh),dw=vw*scale,dh=vh*scale;
    ctx.drawImage(v,(w-dw)/2,(h-dh)/2,dw,dh);ctx.restore();
    const activeText=clip?.text||state.title;if(activeText){ctx.save();ctx.font='900 72px -apple-system,BlinkMacSystemFont,Arial';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=18;wrapText(ctx,activeText,70,h-110,w-140,82);ctx.restore();}
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=String(text).split(/\s+/);let lines=[],line='';for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines=lines.slice(-3);lines.forEach((ln,i)=>ctx.fillText(ln,x,y-(lines.length-1-i)*lineHeight));}
  function drawBrandCard(ctx,w,h,kind,progress=1){
    ctx.fillStyle='#07152f';ctx.fillRect(0,0,w,h);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#fff';ctx.font='900 150px Georgia,serif';ctx.fillText('AIHXO',w/2,h/2-70);
    ctx.font='700 42px -apple-system,BlinkMacSystemFont,Arial';ctx.fillStyle='rgba(255,255,255,.86)';
    ctx.fillText(kind==='outro'?'HECHO EN AIHXO':'PERSONALIZAMOS TUS IDEAS',w/2,h/2+80);
    ctx.font='600 30px -apple-system,BlinkMacSystemFont,Arial';ctx.fillStyle='rgba(255,255,255,.62)';
    ctx.fillText('@aihxo.camisetas',w/2,h/2+145);
  }
  async function holdFrames(ms,draw){const start=performance.now();return new Promise(resolve=>{const tick=()=>{const now=performance.now();draw(Math.min(1,(now-start)/ms));if(now-start>=ms){resolve();return;}requestAnimationFrame(tick);};tick();});}

  async function exportVideo(){
    if(!state.clips.length){toastMsg('Añade al menos un clip');return;}
    const status=document.querySelector('#reelExportStatus'),btn=document.querySelector('#reelExport');btn.disabled=true;status.textContent='Preparando vídeo…';
    let audioCtx=null,dest=null;
    try{
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');
      if(!canvas.captureStream||!window.MediaRecorder)throw new Error('export-not-supported');
      const stream=canvas.captureStream(30);
      try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();dest=audioCtx.createMediaStreamDestination();dest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));}catch(e){}
      const mime=['video/mp4;codecs=h264,aac','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported?.(x))||'';
      const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:8000000}:undefined),chunks=[];
      rec.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data);};rec.start(500);
      const logo=state.watermark?await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='icon-512.png';}):null;if(state.autoBrand){status.textContent='Creando entrada AIHXO…';await holdFrames(1200,()=>drawBrandCard(ctx,1080,1920,'intro'));}
      for(let idx=0;idx<state.clips.length;idx++){
        const c=state.clips[idx];status.textContent='Procesando clip '+(idx+1)+' de '+state.clips.length+'…';
        const v=document.createElement('video');v.src=c.url;v.playsInline=true;v.muted=!dest;v.preload='auto';
        await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej;});
        let src=null;if(dest){try{src=audioCtx.createMediaElementSource(v);src.connect(dest);}catch(e){}}
        const start=c.start||0,end=Math.max(start+.1,c.end||c.duration);v.playbackRate=c.speed||1;await seek(v,start);await v.play();
        await new Promise(resolve=>{
          const tick=()=>{const left=Math.max(0,end-v.currentTime),elapsed=Math.max(0,v.currentTime-start),fade=(c.transition||state.transition)==='fade'?Math.min(1,elapsed/.18,left/.18):1;drawFrame(ctx,v,1080,1920,c,fade);if(logo){ctx.save();ctx.globalAlpha=.92;const s=120,x=1080-s-38,y=38;ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.roundRect?.(x-8,y-8,s+16,s+16,20);ctx.fill();ctx.drawImage(logo,x,y,s,s);ctx.restore();}
            if(v.currentTime>=end||v.ended){v.pause();resolve();return;}requestAnimationFrame(tick);};tick();
        });
        try{src?.disconnect();}catch(e){}
      }
      if(state.autoBrand){status.textContent='Creando cierre AIHXO…';await holdFrames(1200,()=>drawBrandCard(ctx,1080,1920,'outro'));}rec.stop();await new Promise(r=>rec.onstop=r);
      const type=rec.mimeType||chunks[0]?.type||'video/webm',blob=new Blob(chunks,{type}),ext=type.includes('mp4')?'mp4':'webm';
      const file=new File([blob],(state.projectName||'AIHXO-Reel').replace(/[^a-z0-9-_]+/gi,'-')+'.'+ext,{type});
      status.textContent='Vídeo listo · '+Math.round(blob.size/1024/1024*10)/10+' MB';
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        try{await navigator.share({files:[file],title:'AIHXO Reel'});return;}catch(e){if(e?.name==='AbortError')return;}
      }
      const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
    }catch(e){
      console.error(e);
      status.textContent='Este navegador no permite montar el vídeo final aquí. Los clips y recortes siguen guardados.';
      toastMsg('No se pudo exportar el montaje en este navegador');
    }finally{btn.disabled=false;try{audioCtx?.close();}catch(e){}}
  }

  function clearClipUrls(){state.clips.forEach(c=>{try{URL.revokeObjectURL(c.url);}catch(e){}});}
  window.renderReels=renderReels;
})();