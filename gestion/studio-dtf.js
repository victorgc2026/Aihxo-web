/* AIHXO Studio DTF · v2
   Editor de producción para PNG/SVG con medidas reales, capas, transparencia
   y referencias Pantone. El Pantone se guarda como dato de producción; PNG sigue siendo RGB.
*/
(function(){
  if(window.__aihxoStudioDTF) return;
  window.__aihxoStudioDTF = true;

  const DPI = 300;
  const CM_TO_PX = DPI / 2.54;
  const DEFAULT_PALETTE = [
    {name:'PANTONE 533 C', hex:'#031751', source:'Kamuk'},
    {name:'PANTONE 534 C', hex:'#002279', source:'Kamuk'},
    {name:'PANTONE 563 C', hex:'#2066CA', source:'Kamuk'},
    {name:'PANTONE 430 C', hex:'#628A90', source:'Kamuk'},
    {name:'PANTONE 7506 C', hex:'#EBDAA6', source:'Kamuk'}
  ];

  const state = {
    widthCm: 30, heightCm: 35, objects: [], selectedId: null,
    tool: 'select', drag: null, pickedColor: null, colorSelection: null,
    palette: loadPalette(), history: [], future: [], historyBusy:false,
    brushSizeCm: 0.5, lockAspect:true, printQueue: [], projectName:'', matrix: [
      {size:'7/8',w:24,h:27,qty:1,enabled:true},
      {size:'9/11',w:26,h:29,qty:1,enabled:true},
      {size:'12/13',w:28,h:31,qty:1,enabled:true},
      {size:'S',w:29,h:32,qty:1,enabled:true},
      {size:'M',w:30,h:33,qty:1,enabled:true},
      {size:'L',w:31,h:34,qty:1,enabled:true},
      {size:'XL',w:32,h:35,qty:1,enabled:true},
      {size:'2XL',w:33,h:36,qty:1,enabled:true}
    ]
  };

  function loadPalette(){
    try{
      const saved=JSON.parse(localStorage.getItem('aihxoStudioPantonePalette')||'null');
      if(Array.isArray(saved)&&saved.length) return saved;
    }catch(e){}
    try{localStorage.setItem('aihxoStudioPantonePalette',JSON.stringify(DEFAULT_PALETTE));}catch(e){}
    return DEFAULT_PALETTE.map(x=>({...x}));
  }
  function savePalette(){
    try{localStorage.setItem('aihxoStudioPantonePalette',JSON.stringify(state.palette));}catch(e){}
  }
  const uid=()=> 'o'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cm2px=cm=>Number(cm||0)*CM_TO_PX;
  const px2cm=px=>Number(px||0)/CM_TO_PX;
  const imgW=o=>o?Number(o.naturalWidth||o.width||0):0;
  const imgH=o=>o?Number(o.naturalHeight||o.height||0):0;

  function objectSnapshot(o){const copy={...o};delete copy.img;delete copy._brushCanvas;return copy;}
  function snapshot(){return {widthCm:state.widthCm,heightCm:state.heightCm,selectedId:state.selectedId,colorSelection:state.colorSelection?{...state.colorSelection}:null,objects:state.objects.map(objectSnapshot)};}
  function imageFromSrc(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});}
  async function restoreSnapshot(snap){
    if(!snap)return;state.historyBusy=true;state.widthCm=snap.widthCm;state.heightCm=snap.heightCm;state.selectedId=snap.selectedId;state.colorSelection=snap.colorSelection?{...snap.colorSelection}:null;
    const objs=[];for(const raw of snap.objects||[]){const o={...raw};if(o.type==='image'&&o.src){try{o.img=await imageFromSrc(o.src);}catch(e){o.img=null;}}objs.push(o);}state.objects=objs;state.historyBusy=false;
    const w=document.querySelector('#stDocW'),h=document.querySelector('#stDocH');if(w)w.value=state.widthCm;if(h)h.value=state.heightCm;redraw();
  }
  function pushHistory(){if(state.historyBusy)return;state.history.push(snapshot());if(state.history.length>35)state.history.shift();state.future=[];updateHistoryButtons();}
  async function undo(){if(!state.history.length)return;state.future.push(snapshot());const s=state.history.pop();await restoreSnapshot(s);updateHistoryButtons();}
  async function redo(){if(!state.future.length)return;state.history.push(snapshot());const s=state.future.pop();await restoreSnapshot(s);updateHistoryButtons();}
  function updateHistoryButtons(){const u=document.querySelector('#stUndo'),r=document.querySelector('#stRedo');if(u)u.disabled=!state.history.length;if(r)r.disabled=!state.future.length;}

  function openProjectDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('AIHXOStudioDB',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('projects'))db.createObjectStore('projects',{keyPath:'name'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function idbPutProject(project){const db=await openProjectDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').put(project);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
  async function idbGetProject(name){const db=await openProjectDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readonly'),req=tx.objectStore('projects').get(name);req.onsuccess=()=>{db.close();resolve(req.result||null);};req.onerror=()=>{db.close();reject(req.error);};});}
  async function idbListProjects(){const db=await openProjectDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readonly'),req=tx.objectStore('projects').getAll();req.onsuccess=()=>{db.close();resolve((req.result||[]).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)));};req.onerror=()=>{db.close();reject(req.error);};});}
  async function idbDeleteProject(name){const db=await openProjectDB();return new Promise((resolve,reject)=>{const tx=db.transaction('projects','readwrite');tx.objectStore('projects').delete(name);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}

  function imageToDataUrl(o){
    if(o.type!=='image'||!o.img)return o.src||'';
    if(String(o.src||'').startsWith('data:'))return o.src;
    const c=document.createElement('canvas');c.width=imgW(o.img);c.height=imgH(o.img);const g=c.getContext('2d');g.drawImage(o.img,0,0,c.width,c.height);return c.toDataURL('image/png');
  }
  async function serializeProjectObjects(){
    const out=[];for(const o of state.objects){const copy=objectSnapshot(o);if(o.type==='image')copy.src=imageToDataUrl(o);out.push(copy);}return out;
  }
  function newProject(){
    const hasWork=state.objects.length>0;
    if(hasWork && !confirm('Se limpiará el lienzo actual. Los proyectos guardados y la cola DTF se conservarán. ¿Continuar?'))return;
    pushHistory();
    state.objects=[];
    state.selectedId=null;
    state.colorSelection=null;
    state.pickedColor=null;
    state.projectName='';
    state.widthCm=30;
    state.heightCm=35;
    const name=document.querySelector('#stProjectName');if(name)name.value='';
    const w=document.querySelector('#stDocW'),h=document.querySelector('#stDocH');if(w)w.value=30;if(h)h.value=35;
    setTool('select');
    redraw();
    toast?.('Nuevo proyecto listo · cola DTF conservada');
  }

  async function saveProject(){
    const input=document.querySelector('#stProjectName');const name=(input?.value||state.projectName||'').trim();if(!name){alert('Pon un nombre al proyecto.');return;}
    const btn=document.querySelector('#stSaveProject');if(btn){btn.disabled=true;btn.textContent='Guardando…';}
    try{const objects=await serializeProjectObjects();await idbPutProject({name,updatedAt:Date.now(),widthCm:state.widthCm,heightCm:state.heightCm,objects,matrix:state.matrix,palette:state.palette});state.projectName=name;await refreshProjectList();toast?.('Proyecto guardado');}
    catch(e){console.error(e);alert('No se pudo guardar el proyecto en este dispositivo.');}
    finally{if(btn){btn.disabled=false;btn.textContent='💾 Guardar';}}
  }
  async function loadProject(){
    const sel=document.querySelector('#stProjectList');const name=sel?.value;if(!name){alert('Selecciona un proyecto guardado.');return;}
    try{const p=await idbGetProject(name);if(!p)return;pushHistory();state.projectName=p.name;state.widthCm=p.widthCm;state.heightCm=p.heightCm;if(Array.isArray(p.matrix))state.matrix=p.matrix;const objs=[];for(const raw of p.objects||[]){const o={...raw};if(o.type==='image'&&o.src)o.img=await imageFromSrc(o.src);objs.push(o);}state.objects=objs;state.selectedId=null;document.querySelector('#stProjectName').value=p.name;document.querySelector('#stDocW').value=p.widthCm;document.querySelector('#stDocH').value=p.heightCm;renderMatrix();redraw();toast?.('Proyecto abierto');}
    catch(e){console.error(e);alert('No se pudo abrir el proyecto.');}
  }
  async function refreshProjectList(){const sel=document.querySelector('#stProjectList');if(!sel)return;try{const rows=await idbListProjects();sel.innerHTML='<option value="">Proyectos guardados…</option>'+rows.map(p=>'<option value="'+esc(p.name)+'">'+esc(p.name)+'</option>').join('');}catch(e){}}
  async function deleteProject(){const sel=document.querySelector('#stProjectList');const name=sel?.value;if(!name)return;if(!confirm('¿Eliminar el proyecto '+name+'?'))return;await idbDeleteProject(name);await refreshProjectList();toast?.('Proyecto eliminado');}

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav || document.querySelector('#aihxoStudioNav')) return;
    const btn=document.createElement('button');
    btn.id='aihxoStudioNav'; btn.type='button';
    btn.innerHTML='🎛️ <span>AIHXO Studio</span>';
    btn.onclick=()=>{ renderStudio(); if(typeof closeMobileMenu==='function') closeMobileMenu(); };
    const ref=document.querySelector('#aihxoDtfNav');
    if(ref) nav.insertBefore(btn,ref); else nav.appendChild(btn);
  }

  function ensureStyles(){
    if(document.querySelector('#aihxoStudioStyles')) return;
    const s=document.createElement('style');
    s.id='aihxoStudioStyles';
    s.textContent=`
    .studio-shell{display:grid;grid-template-columns:250px minmax(0,1fr) 290px;gap:12px;min-height:680px}
    .studio-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:var(--shadow);min-width:0}
    .studio-toolbar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
    .studio-toolbar button{padding:8px 10px}
    .studio-canvas-wrap{min-height:620px;display:flex;align-items:center;justify-content:center;overflow:auto;border-radius:14px;border:1px solid #dfe5ee;background-color:#fff;background-image:linear-gradient(45deg,#e9edf2 25%,transparent 25%),linear-gradient(-45deg,#e9edf2 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e9edf2 75%),linear-gradient(-45deg,transparent 75%,#e9edf2 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}
    #studioCanvas{max-width:100%;height:auto;background:transparent;box-shadow:0 8px 26px rgba(7,21,47,.12);touch-action:none}
    .studio-layer{display:flex;gap:8px;align-items:center;padding:9px;border:1px solid #e5eaf2;border-radius:10px;margin-bottom:7px;background:#fff}
    .studio-layer.active{border-color:#087cf4;box-shadow:0 0 0 2px rgba(8,124,244,.08)}
    .studio-layer button{padding:5px 8px}
    .studio-field{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .studio-field label{font-size:11px;color:var(--muted);font-weight:800}
    .studio-field input,.studio-field select{margin-top:4px}
    .studio-badge{display:inline-flex;padding:5px 8px;border-radius:999px;background:#eef5ff;color:#0868c7;font-size:11px;font-weight:800}
    .studio-note{padding:10px 12px;border-radius:11px;background:#f7f9fc;border:1px solid #e7ebf1;font-size:12px;color:#536078;line-height:1.45}
    @media(max-width:1050px){.studio-shell{grid-template-columns:1fr}.studio-canvas-wrap{min-height:440px}.studio-panel.order2{order:2}.studio-panel.order3{order:3}}
    `;
    document.head.appendChild(s);
  }

  function renderStudio(){
    ensureStyles();
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('#aihxoStudioNav')?.classList.add('active');
    const title=document.querySelector('#title'); if(title) title.textContent='AIHXO Studio';
    const v=document.querySelector('#view'); if(!v) return;
    v.innerHTML=`
      <div class="page">
        <div class="section">
          <div><h2 style="margin:0">🎛️ AIHXO Studio · Editor DTF</h2><div class="muted">PNG/SVG · medidas reales · capas · transparencia · referencia Pantone</div></div>
          <span class="studio-badge">v2 producción</span>
        </div>
        <div class="studio-shell">
          <section class="studio-panel order2">
            <h3 style="margin-top:0">Documento</h3>
            <div class="studio-field">
              <label>Ancho cm<input id="stDocW" type="number" min="1" max="100" step=".1" value="${state.widthCm}"></label>
              <label>Alto cm<input id="stDocH" type="number" min="1" max="100" step=".1" value="${state.heightCm}"></label>
            </div>
            <div class="studio-toolbar" style="margin-top:10px">
              <button class="secondary stPreset" data-w="3" data-h="2">Pecho 3×2</button>
              <button class="secondary stPreset" data-w="25" data-h="40">Marca 25×40</button>
              <button class="secondary stPreset" data-w="30" data-h="35">Espalda 30×35</button>
              <button class="secondary stPreset" data-w="32" data-h="35">Espalda 32×35</button>
            </div>
            <h3>Herramientas</h3>
            <div class="studio-toolbar">
              <button id="stSelect" class="primary">↖ Seleccionar</button>
              <button id="stErase" class="secondary">⌫ Borrar zona</button>
              <button id="stBrushErase" class="secondary">🖌️ Borrador</button>
              <button id="stPick" class="secondary">🎯 Tomar color</button><button id="stSelectColorArea" class="secondary">▭ Seleccionar zona</button>
            </div>
            <div class="studio-field" style="margin-bottom:10px"><label>Tamaño pincel (cm)<input id="stBrushSize" type="number" min=".1" max="5" step=".1" value=".5"></label><label style="display:flex;align-items:end;gap:8px;padding-bottom:10px"><input id="stLockAspect" type="checkbox" ${state.lockAspect?'checked':''} style="width:auto"> Mantener proporción</label></div>
            <div class="field"><label>Importar PNG / JPG / WEBP / SVG</label><input id="stFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>
            <button id="stAddText" class="secondary" style="width:100%;margin-top:8px">T＋ Añadir texto</button>
            <div class="studio-note" style="margin-top:12px"><b>Borrar zona</b>: arrastra un rectángulo sobre una imagen seleccionada. <br><b>Seleccionar zona</b>: arrastra un rectángulo para limitar los cambios de color solo a esa parte de la imagen.</div>

            <h3 style="margin-top:18px">Proyecto</h3>
            <div class="field"><label>Nombre del proyecto</label><input id="stProjectName" placeholder="Ej. Pedido Sara - espalda"></div>
            <div class="studio-toolbar" style="margin-top:8px">
              <button id="stNewProject" class="secondary">＋ Nuevo proyecto</button>
              <button id="stSaveProject" class="secondary">💾 Guardar</button>
              <button id="stLoadProject" class="secondary">📂 Abrir</button>
            </div>
            <select id="stProjectList"><option value="">Proyectos guardados…</option></select>
            <button id="stDeleteProject" class="secondary" style="width:100%;margin-top:8px">Eliminar proyecto guardado</button>
            <h3 style="margin-top:18px">Capas</h3>
            <div id="stLayers"></div>
          </section>

          <section class="studio-panel">
            <div class="studio-toolbar">
              <button id="stFit" class="secondary">Encajar</button>
              <button id="stCenter" class="secondary">Centrar</button>
              <button id="stDuplicate" class="secondary">Duplicar</button>
              <button id="stLayerUp" class="secondary">↑ Subir</button>
              <button id="stLayerDown" class="secondary">↓ Bajar</button>
              <button id="stLayerFront" class="secondary">⇈ Frente</button>
              <button id="stLayerBack" class="secondary">⇊ Fondo</button>
              <button id="stOverlayLayer" class="secondary">◎ Superponer</button>
              <button id="stToggleLock" class="secondary">🔒 Bloquear</button>
              <button id="stHalfOpacity" class="secondary">50% opacidad</button>
              <button id="stDelete" class="secondary">Eliminar</button>
              <button id="stUndo" class="secondary" title="Deshacer">↶</button>
              <button id="stRedo" class="secondary" title="Rehacer">↷</button>
            </div>
            <div class="studio-canvas-wrap" id="stCanvasWrap"><canvas id="studioCanvas" width="720" height="840"></canvas></div>
            <div id="stStatus" class="muted" style="margin-top:9px"></div>
          </section>

          <section class="studio-panel order3">
            <h3 style="margin-top:0">Elemento seleccionado</h3>
            <div id="stInspector"><div class="muted">Selecciona una capa.</div></div>

            <h3 style="margin-top:18px">Pantone / color de producción</h3>
            <div class="field"><label>Nombre Pantone o tinta plana</label><input id="stPantoneName" placeholder="Ej. PANTONE 534 C"></div>
            <div class="studio-field" style="margin-top:8px">
              <label>Equivalencia HEX<input id="stPantoneHex" type="color" value="#1b365d"></label>
              <label>Tolerancia<input id="stTolerance" type="number" min="0" max="255" value="35"></label>
            </div>
            <select id="stPalette" style="margin-top:8px"><option value="">Paleta Kamuk / AIHXO…</option>${state.palette.map((p,i)=>`<option value="${i}">${esc(p.name)} · ${esc(p.hex)}${p.source?' · '+esc(p.source):''}</option>`).join('')}</select>
            <div class="studio-toolbar" style="margin-top:8px">
              <button id="stAssignPantone" class="secondary">Asignar referencia</button>
              <button id="stReplaceColor" class="secondary">Reemplazar color tomado</button>
              <button id="stApplyWholeLayerColor" class="secondary">🎨 Aplicar color a toda la capa</button>
              <button id="stCopyColorFromLayer" class="secondary">🧪 Copiar color de otra capa</button>
            </div>
            <details style="margin-top:12px">
              <summary style="cursor:pointer;font-weight:800">＋ Gestionar paleta</summary>
              <div class="studio-note" style="margin-top:8px">Añade aquí nuevos Pantone o referencias de proveedor. Se guardan en este dispositivo.</div>
              <div class="field" style="margin-top:8px"><label>Código / nombre</label><input id="stNewPantoneName" placeholder="Ej. PANTONE 186 C"></div>
              <div class="studio-field" style="margin-top:8px">
                <label>Color visual<input id="stNewPantoneHex" type="color" value="#000000"></label>
                <label>Proveedor<input id="stNewPantoneSource" placeholder="Kamuk"></label>
              </div>
              <div class="studio-toolbar" style="margin-top:8px">
                <button id="stAddPantone" class="secondary">Añadir a paleta</button>
                <button id="stDeletePantone" class="secondary">Eliminar seleccionado</button>
              </div>
              <div id="stPaletteList" class="muted" style="font-size:11px"></div>
            </details>
            <div id="stColorInfo" class="studio-note">Usa <b>Tomar color</b> y toca un píxel del diseño. Después puedes sustituir ese color por la equivalencia RGB del Pantone elegido.</div>

            <h3 style="margin-top:18px">Matriz por tallas</h3>
            <div class="studio-note">Las medidas son editables. El diseño mantiene la proporción y se genera una salida por talla.</div>
            <div id="stMatrix" style="margin-top:8px"></div>
            <button id="stExportMatrix" class="secondary" style="width:100%;margin-top:8px">Generar matriz por tallas</button>
            <h3 style="margin-top:18px">Montaje DTF multi-diseño</h3>
            <div class="studio-note">Añade el diseño actual a la cola, cambia de diseño y añade el siguiente. Después se colocan juntos en una sola hoja.</div>
            <div class="studio-field" style="margin-top:8px"><label>Cantidad<input id="stQueueQty" type="number" min="1" max="200" value="1"></label><label>Nombre<input id="stQueueName" value="Diseño"></label></div>
            <button id="stAddQueue" class="secondary" style="width:100%;margin-top:8px">＋ Añadir diseño actual a cola</button>
            <div id="stQueueList" style="margin-top:8px"></div>
            <button id="stExportMultiSheet" class="primary" style="width:100%;margin-top:8px">Optimizar cola en hoja DTF</button>
            <h3 style="margin-top:18px">Salida</h3>
            <div class="studio-field">
              <label>Copias para impresión<input id="stCopies" type="number" min="1" max="200" value="1"></label>
              <label>Separación cm<input id="stGap" type="number" min="0" max="5" step=".1" value=".5"></label>
            </div>
            <div class="field" style="margin-top:8px"><label>Ancho máximo hoja DTF (cm)</label><input id="stSheetWidth" type="number" min="5" max="100" step=".1" value="56"></div>
            <button id="stExportSheet" class="primary" style="width:100%;margin-top:8px">Montar copias en hoja DTF</button>
            <button id="stExportPng" class="secondary" style="width:100%;margin-top:8px">Exportar 1 PNG · 300 ppp</button>
            <button id="stExportSvg" class="secondary" style="width:100%;margin-top:8px">Guardar maestro SVG</button>
            <div class="studio-note" style="margin-top:10px"><b>Importante:</b> PNG es RGB. El nombre Pantone se conserva como referencia de producción y en el SVG maestro. Un PDF con tinta plana real requiere una exportación PDF spot específica.</div>
          </section>
        </div>
      </div>`;
    bind();
    redraw();
  }

  function canvas(){return document.querySelector('#studioCanvas');}
  function ctx(){return canvas()?.getContext('2d');}
  function viewScale(){
    const c=canvas(), wrap=document.querySelector('#stCanvasWrap'); if(!c||!wrap) return 1;
    const maxW=Math.max(320,wrap.clientWidth-30), maxH=580;
    return Math.min(maxW/cm2px(state.widthCm), maxH/cm2px(state.heightCm), 1);
  }
  function setupCanvas(){
    const c=canvas(); if(!c) return;
    const s=viewScale();
    c.width=Math.max(1,Math.round(cm2px(state.widthCm)*s));
    c.height=Math.max(1,Math.round(cm2px(state.heightCm)*s));
    c.dataset.scale=String(s);
  }

  function selected(){return state.objects.find(o=>o.id===state.selectedId)||null;}

  function drawObject(g,o,s){
    g.save();
    g.translate(o.x*s,o.y*s);
    g.rotate((o.rotation||0)*Math.PI/180);
    g.globalAlpha=o.opacity??1;
    if(o.type==='image' && o.img){
      g.drawImage(o._brushCanvas||o.img,0,0,o.w*s,o.h*s);
    }else if(o.type==='text'){
      g.fillStyle=o.color||'#111111';
      g.font=`${Math.max(1,o.fontSize*s)}px ${o.fontFamily||'Arial'}`;
      g.textBaseline='top';
      g.fillText(o.text||'',0,0);
    }
    g.restore();
  }

  function redraw(){
    const c=canvas(); if(!c) return;
    setupCanvas(); const g=ctx(), s=Number(c.dataset.scale||1);
    g.clearRect(0,0,c.width,c.height);
    state.objects.filter(o=>o.visible!==false).forEach(o=>drawObject(g,o,s));
    const o=selected();
    if(o){
      g.save();g.strokeStyle='#087cf4';g.lineWidth=2;g.setLineDash([7,5]);
      g.strokeRect(o.x*s,o.y*s,o.w*s,o.h*s);g.restore();
    }
    if(state.colorSelection && state.colorSelection.objectId===state.selectedId){
      const q=state.colorSelection;
      g.save();g.strokeStyle='#8b5cf6';g.fillStyle='rgba(139,92,246,.08)';g.lineWidth=2;g.setLineDash([6,4]);
      const rx=Math.min(q.x1,q.x2)*s, ry=Math.min(q.y1,q.y2)*s, rw=Math.abs(q.x2-q.x1)*s, rh=Math.abs(q.y2-q.y1)*s;
      g.fillRect(rx,ry,rw,rh);g.strokeRect(rx,ry,rw,rh);g.restore();
    }
    const st=document.querySelector('#stStatus');
    if(st) st.textContent=`${state.widthCm} × ${state.heightCm} cm · salida ${Math.round(cm2px(state.widthCm))} × ${Math.round(cm2px(state.heightCm))} px a 300 ppp · ${state.objects.length} capas`;
    renderLayers(); renderInspector();
  }

  function addImageFromFile(file){
    if(!file) return;
    const url=URL.createObjectURL(file), im=new Image();
    im.onload=()=>{
      const docW=cm2px(state.widthCm), docH=cm2px(state.heightCm);
      const ratio=Math.min(.78*docW/im.naturalWidth,.78*docH/im.naturalHeight,1);
      pushHistory();
      const o={id:uid(),type:'image',name:file.name||'Imagen',img:im,src:url,
        originalType:file.type, x:docW*.11,y:docH*.11,w:im.naturalWidth*ratio,h:im.naturalHeight*ratio,
        rotation:0,opacity:1,visible:true,pantone:null,locked:false};
      state.objects.push(o);state.selectedId=o.id;redraw();
    };
    im.onerror=()=>{URL.revokeObjectURL(url); alert('No se pudo abrir el archivo.');};
    im.src=url;
  }

  function addText(){
    pushHistory();
    const o={id:uid(),type:'text',name:'Texto',text:'AIHXO',x:cm2px(2),y:cm2px(2),w:cm2px(10),h:cm2px(2),
      fontSize:120,fontFamily:'Arial',color:'#111111',rotation:0,opacity:1,visible:true,pantone:null,locked:false};
    state.objects.push(o);state.selectedId=o.id;redraw();
  }

  function renderLayers(){
    const box=document.querySelector('#stLayers'); if(!box)return;
    box.innerHTML=state.objects.slice().reverse().map(o=>`
      <div class="studio-layer ${o.id===state.selectedId?'active':''}" data-id="${o.id}">
        <button class="secondary stVis" data-id="${o.id}">${o.visible===false?'🙈':'👁️'}</button>
        <div style="min-width:0;flex:1"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.name)} ${o.locked?'🔒':''}</b><span class="muted">${o.type==='image'?'Imagen':'Texto'}${o.pantone?' · '+esc(o.pantone.name):''}</span></div>
      </div>`).join('')||'<div class="muted">Sin capas.</div>';
    box.querySelectorAll('.studio-layer').forEach(x=>x.onclick=e=>{if(e.target.closest('.stVis'))return;state.selectedId=x.dataset.id;redraw();});
    box.querySelectorAll('.stVis').forEach(b=>b.onclick=e=>{e.stopPropagation();const o=state.objects.find(x=>x.id===b.dataset.id);if(o){o.visible=!o.visible;redraw();}});
  }

  function renderInspector(){
    const box=document.querySelector('#stInspector'),o=selected();if(!box)return;
    if(!o){box.innerHTML='<div class="muted">Selecciona una capa.</div>';return;}
    box.innerHTML=`
      <div class="studio-field">
        <label>X cm<input id="stiX" type="number" step=".1" value="${(o.x/CM_TO_PX).toFixed(1)}"></label>
        <label>Y cm<input id="stiY" type="number" step=".1" value="${(o.y/CM_TO_PX).toFixed(1)}"></label>
        <label>Ancho cm<input id="stiW" type="number" min=".1" step=".1" value="${(o.w/CM_TO_PX).toFixed(1)}"></label>
        <label>Alto cm<input id="stiH" type="number" min=".1" step=".1" value="${(o.h/CM_TO_PX).toFixed(1)}"></label>
        <label>Rotación<input id="stiR" type="number" step="1" value="${o.rotation||0}"></label>
        <label>Opacidad %<input id="stiO" type="number" min="0" max="100" value="${Math.round((o.opacity??1)*100)}"></label>
      </div>
      ${o.type==='text'? `
      <div class="field" style="margin-top:8px"><label>Texto</label><input id="stiText" value="${esc(o.text)}"></div>
      <div class="studio-field" style="margin-top:8px"><label>Tamaño px<input id="stiFont" type="number" value="${o.fontSize}"></label><label>Color<input id="stiColor" type="color" value="${o.color}"></label></div>` : ''}
      <div class="studio-note" style="margin-top:8px">${o.pantone?'<b>'+esc(o.pantone.name)+'</b> · '+esc(o.pantone.hex):'Sin referencia Pantone asignada.'}</div>`;
    const bindNum=(id,fn)=>document.querySelector(id)?.addEventListener('change',e=>{if(o.locked){alert('Esta capa está bloqueada.');renderInspector();return;}pushHistory();fn(Number(e.target.value));redraw();});
    bindNum('#stiX',v=>o.x=cm2px(v));bindNum('#stiY',v=>o.y=cm2px(v));
    bindNum('#stiW',v=>{const oldW=o.w,oldH=o.h;o.w=cm2px(v);if(state.lockAspect&&oldW>0)o.h=o.w*(oldH/oldW);});
    bindNum('#stiH',v=>{const oldW=o.w,oldH=o.h;o.h=cm2px(v);if(state.lockAspect&&oldH>0)o.w=o.h*(oldW/oldH);});
    bindNum('#stiR',v=>o.rotation=v);bindNum('#stiO',v=>o.opacity=clamp(v/100,0,1));
    document.querySelector('#stiText')?.addEventListener('change',e=>{if(o.locked){alert('Esta capa está bloqueada.');renderInspector();return;}pushHistory();o.text=e.target.value;measureText(o);redraw();});
    document.querySelector('#stiFont')?.addEventListener('change',e=>{if(o.locked){alert('Esta capa está bloqueada.');renderInspector();return;}pushHistory();o.fontSize=Number(e.target.value)||1;measureText(o);redraw();});
    document.querySelector('#stiColor')?.addEventListener('change',e=>{if(o.locked){alert('Esta capa está bloqueada.');renderInspector();return;}pushHistory();o.color=e.target.value;redraw();});
  }

  function measureText(o){
    const c=document.createElement('canvas'),g=c.getContext('2d');g.font=`${o.fontSize}px ${o.fontFamily||'Arial'}`;
    o.w=Math.max(20,g.measureText(o.text||'').width);o.h=o.fontSize*1.2;
  }

  function pointToDoc(ev){
    const c=canvas(),r=c.getBoundingClientRect(),s=Number(c.dataset.scale||1);
    return {x:(ev.clientX-r.left)*(c.width/r.width)/s,y:(ev.clientY-r.top)*(c.height/r.height)/s};
  }
  function hit(p){
    return state.objects.slice().reverse().find(o=>o.visible!==false && p.x>=o.x&&p.x<=o.x+o.w&&p.y>=o.y&&p.y<=o.y+o.h)||null;
  }

  function canvasDown(ev){
    const p=pointToDoc(ev),o=hit(p);
    if(state.tool==='pick'){ pickColorAt(p); return; }
    if(state.tool==='brush-erase'){
      const so=selected();if(!so||so.type!=='image'||!so.img){alert('Selecciona primero una capa de imagen.');return;}
      pushHistory();
      const off=document.createElement('canvas');off.width=imgW(so.img);off.height=imgH(so.img);const og=off.getContext('2d');og.drawImage(so.img,0,0,off.width,off.height);so._brushCanvas=off;
      state.drag={kind:'brush-erase',last:p};brushEraseAt(p);return;
    }
    if(state.tool==='erase'){
      if(!selected() || selected().type!=='image'){alert('Selecciona primero una capa de imagen.');return;}
      state.drag={kind:'erase',x:p.x,y:p.y,x2:p.x,y2:p.y}; return;
    }
    if(state.tool==='color-area'){
      if(!selected() || selected().type!=='image'){alert('Selecciona primero una capa de imagen.');return;}
      state.drag={kind:'color-area',x:p.x,y:p.y,x2:p.x,y2:p.y}; return;
    }
    if(o){state.selectedId=o.id;if(o.locked){redraw();return;}pushHistory();state.drag={kind:'move',dx:p.x-o.x,dy:p.y-o.y};}else{state.selectedId=null;state.drag=null;}
    redraw();
  }
  function canvasMove(ev){
    if(!state.drag)return;const p=pointToDoc(ev);
    if(state.drag.kind==='move'){const o=selected();if(o){o.x=p.x-state.drag.dx;o.y=p.y-state.drag.dy;redraw();}}
    else if(state.drag.kind==='erase'){state.drag.x2=p.x;state.drag.y2=p.y;redraw();drawEraseRect();}
    else if(state.drag.kind==='color-area'){state.drag.x2=p.x;state.drag.y2=p.y;redraw();drawColorAreaRect();}
    else if(state.drag.kind==='brush-erase'){brushEraseAt(p);state.drag.last=p;redraw();}
  }
  async function canvasUp(){
    if(state.drag?.kind==='erase') eraseRect(state.drag);
    if(state.drag?.kind==='color-area') setColorArea(state.drag);
    if(state.drag?.kind==='brush-erase'){
      const o=selected();if(o?._brushCanvas){const src=o._brushCanvas.toDataURL('image/png');delete o._brushCanvas;o.src=src;o.img=await imageFromSrc(src);redraw();}
    }
    state.drag=null;
  }

  function brushEraseAt(p){
    const o=selected();if(!o?._brushCanvas)return;
    const c=o._brushCanvas,g=c.getContext('2d');const lx=(p.x-o.x)/o.w*c.width,ly=(p.y-o.y)/o.h*c.height;
    const radius=Math.max(1,cm2px(state.brushSizeCm)/o.w*c.width/2);
    g.save();g.globalCompositeOperation='destination-out';g.beginPath();g.arc(lx,ly,radius,0,Math.PI*2);g.fill();g.restore();
  }

  function drawEraseRect(){
    const d=state.drag;if(!d)return;const c=canvas(),g=ctx(),s=Number(c.dataset.scale||1);
    g.save();g.strokeStyle='#d13b4b';g.lineWidth=2;g.setLineDash([5,4]);
    g.strokeRect(Math.min(d.x,d.x2)*s,Math.min(d.y,d.y2)*s,Math.abs(d.x2-d.x)*s,Math.abs(d.y2-d.y)*s);g.restore();
  }

  function drawColorAreaRect(){
    const d=state.drag;if(!d)return;const c=canvas(),g=ctx(),s=Number(c.dataset.scale||1);
    g.save();g.strokeStyle='#8b5cf6';g.fillStyle='rgba(139,92,246,.08)';g.lineWidth=2;g.setLineDash([6,4]);
    g.fillRect(Math.min(d.x,d.x2)*s,Math.min(d.y,d.y2)*s,Math.abs(d.x2-d.x)*s,Math.abs(d.y2-d.y)*s);
    g.strokeRect(Math.min(d.x,d.x2)*s,Math.min(d.y,d.y2)*s,Math.abs(d.x2-d.x)*s,Math.abs(d.y2-d.y)*s);g.restore();
  }

  function setColorArea(d){
    const o=selected(); if(!o||o.type!=='image') return;
    state.colorSelection={objectId:o.id,x1:d.x,y1:d.y,x2:d.x2,y2:d.y2};
    const info=document.querySelector('#stColorInfo');
    if(info) info.innerHTML='<b>Zona de color seleccionada.</b> Ahora usa “Tomar color” dentro de esa zona y después “Reemplazar color tomado”.';
    redraw();
  }

  function eraseRect(d){
    const o=selected();if(o)pushHistory();if(!o||o.type!=='image'||!o.img)return;
    const x1=Math.min(d.x,d.x2),y1=Math.min(d.y,d.y2),x2=Math.max(d.x,d.x2),y2=Math.max(d.y,d.y2);
    const ix=clamp((x1-o.x)/o.w,0,1)*o.img.naturalWidth, iy=clamp((y1-o.y)/o.h,0,1)*o.img.naturalHeight;
    const iw=(clamp((x2-o.x)/o.w,0,1)-clamp((x1-o.x)/o.w,0,1))*o.img.naturalWidth;
    const ih=(clamp((y2-o.y)/o.h,0,1)-clamp((y1-o.y)/o.h,0,1))*o.img.naturalHeight;
    if(iw<=0||ih<=0){redraw();return;}
    const off=document.createElement('canvas');off.width=o.img.naturalWidth;off.height=o.img.naturalHeight;
    const g=off.getContext('2d');g.drawImage(o.img,0,0);g.clearRect(ix,iy,iw,ih);
    const im=new Image();im.onload=()=>{o.img=im;o.src=im.src;redraw();};im.src=off.toDataURL('image/png');
  }

  function pickColorAt(p){
    const o=hit(p); if(!o||o.type!=='image'){alert('Toca sobre una capa de imagen.');return;}
    const lx=(p.x-o.x)/o.w,ly=(p.y-o.y)/o.h;
    const off=document.createElement('canvas');off.width=o.img.naturalWidth;off.height=o.img.naturalHeight;
    const g=off.getContext('2d');g.drawImage(o.img,0,0);
    const px=g.getImageData(clamp(Math.floor(lx*off.width),0,off.width-1),clamp(Math.floor(ly*off.height),0,off.height-1),1,1).data;
    state.selectedId=o.id;state.pickedColor=[px[0],px[1],px[2]];
    const info=document.querySelector('#stColorInfo');if(info) info.innerHTML=`Color tomado: <b>RGB(${px[0]}, ${px[1]}, ${px[2]})</b>. Selecciona Pantone/equivalencia y pulsa “Reemplazar color tomado”.`;
    redraw();
  }

  function hexRgb(hex){
    const h=String(hex||'#000000').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function replacePicked(){
    const o=selected();if(o)pushHistory();if(!o||o.type!=='image'||!state.pickedColor){alert('Selecciona una imagen y toma primero un color.');return;}
    const target=hexRgb(document.querySelector('#stPantoneHex').value),tol=Number(document.querySelector('#stTolerance').value||35),src=state.pickedColor;
    const off=document.createElement('canvas');off.width=o.img.naturalWidth;off.height=o.img.naturalHeight;const g=off.getContext('2d',{willReadFrequently:true});
    g.drawImage(o.img,0,0);const id=g.getImageData(0,0,off.width,off.height),d=id.data;let n=0;
    let sx1=0,sy1=0,sx2=off.width,sy2=off.height;
    if(state.colorSelection && state.colorSelection.objectId===o.id){
      const q=state.colorSelection;
      sx1=clamp(Math.floor((Math.min(q.x1,q.x2)-o.x)/o.w*off.width),0,off.width);
      sy1=clamp(Math.floor((Math.min(q.y1,q.y2)-o.y)/o.h*off.height),0,off.height);
      sx2=clamp(Math.ceil((Math.max(q.x1,q.x2)-o.x)/o.w*off.width),0,off.width);
      sy2=clamp(Math.ceil((Math.max(q.y1,q.y2)-o.y)/o.h*off.height),0,off.height);
    }
    for(let y=sy1;y<sy2;y++){
      for(let x=sx1;x<sx2;x++){
        const i=(y*off.width+x)*4;
        if(d[i+3]===0)continue;
        const dist=Math.hypot(d[i]-src[0],d[i+1]-src[1],d[i+2]-src[2]);
        if(dist<=tol){d[i]=target[0];d[i+1]=target[1];d[i+2]=target[2];n++;}
      }
    }
    g.putImageData(id,0,0);const im=new Image();im.onload=()=>{o.img=im;o.src=im.src;redraw();toast?.('Color reemplazado en '+n+' píxeles');};im.src=off.toDataURL('image/png');
  }

  function dominantLayerColor(o){
    if(!o)return null;
    if(o.type==='text') return hexRgb(o.color||'#111111');
    if(o.type!=='image'||!o.img)return null;
    const max=220,iw=imgW(o.img),ih=imgH(o.img),scale=Math.min(1,max/Math.max(iw,ih));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(iw*scale));c.height=Math.max(1,Math.round(ih*scale));
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(o.img,0,0,c.width,c.height);
    const d=g.getImageData(0,0,c.width,c.height).data,bins=new Map();
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]<40)continue;
      const r=Math.round(d[i]/24)*24,gc=Math.round(d[i+1]/24)*24,b=Math.round(d[i+2]/24)*24;
      const k=r+','+gc+','+b;bins.set(k,(bins.get(k)||0)+1);
    }
    let best=null,count=-1;for(const [k,n] of bins){if(n>count){best=k;count=n;}}
    return best?best.split(',').map(Number):null;
  }

  function rgbHex(rgb){
    return '#'+rgb.map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
  }

  function applyWholeLayerColor(){
    const o=selected();if(!o){alert('Selecciona primero la capa que quieres recolorear.');return;}
    const hex=document.querySelector('#stPantoneHex')?.value||'#000000';
    const name=(document.querySelector('#stPantoneName')?.value||'').trim()||'Color de producción';
    pushHistory();
    if(o.type==='text'){o.color=hex;o.pantone={name,hex};redraw();toast?.('Color aplicado a toda la capa');return;}
    if(o.type!=='image'||!o.img)return;
    const c=document.createElement('canvas');c.width=imgW(o.img);c.height=imgH(o.img);
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(o.img,0,0,c.width,c.height);
    const id=g.getImageData(0,0,c.width,c.height),d=id.data,target=hexRgb(hex);
    for(let i=0;i<d.length;i+=4){if(d[i+3]===0)continue;d[i]=target[0];d[i+1]=target[1];d[i+2]=target[2];}
    g.putImageData(id,0,0);
    const src=c.toDataURL('image/png');imageFromSrc(src).then(im=>{o.img=im;o.src=src;o.pantone={name,hex};redraw();toast?.('Color aplicado a toda la capa');});
  }

  function copyColorFromLayer(){
    const target=selected();if(!target){alert('Selecciona primero la capa que quieres recolorear.');return;}
    const others=state.objects.filter(o=>o.id!==target.id&&o.visible!==false);
    if(!others.length){alert('No hay otra capa de la que copiar el color.');return;}
    const names=others.map((o,i)=>(i+1)+'. '+o.name).join('\n');
    const answer=prompt('¿De qué capa quieres copiar el color?\n\n'+names+'\n\nEscribe el número:','1');
    if(answer===null)return;const idx=Number(answer)-1;if(!Number.isInteger(idx)||!others[idx]){alert('Número de capa no válido.');return;}
    const source=others[idx],rgb=dominantLayerColor(source);if(!rgb){alert('No se pudo detectar un color en esa capa.');return;}
    const hex=rgbHex(rgb),name=source.pantone?.name||('Color copiado de '+source.name);
    const pi=document.querySelector('#stPantoneName'),ph=document.querySelector('#stPantoneHex');if(pi)pi.value=name;if(ph)ph.value=hex;
    applyWholeLayerColor();
  }

  function refreshPaletteUI(){
    const sel=document.querySelector('#stPalette');
    if(sel){
      const current=sel.value;
      sel.innerHTML='<option value="">Paleta Kamuk / AIHXO…</option>'+state.palette.map((p,i)=>'<option value="'+i+'">'+esc(p.name)+' · '+esc(p.hex)+(p.source?' · '+esc(p.source):'')+'</option>').join('');
      if(current!=='' && state.palette[Number(current)]) sel.value=current;
    }
    const list=document.querySelector('#stPaletteList');
    if(list) list.innerHTML=state.palette.map((p,i)=>'<div style="display:flex;align-items:center;gap:7px;padding:4px 0"><span style="width:18px;height:18px;border-radius:4px;border:1px solid #ccd3dd;background:'+esc(p.hex)+'"></span><b>'+esc(p.name)+'</b><span>'+esc(p.hex)+'</span><span>'+(p.source?esc(p.source):'')+'</span></div>').join('');
  }

  function addPantone(){
    const name=(document.querySelector('#stNewPantoneName')?.value||'').trim();
    const hex=document.querySelector('#stNewPantoneHex')?.value||'#000000';
    const source=(document.querySelector('#stNewPantoneSource')?.value||'').trim();
    if(!name){alert('Escribe el código o nombre del color.');return;}
    const existing=state.palette.findIndex(p=>String(p.name).toLowerCase()===name.toLowerCase());
    const item={name,hex:hex.toUpperCase(),source};
    if(existing>=0) state.palette[existing]=item; else state.palette.push(item);
    savePalette();refreshPaletteUI();
    const sel=document.querySelector('#stPalette');if(sel)sel.value=String(existing>=0?existing:state.palette.length-1);
    document.querySelector('#stPantoneName').value=item.name;document.querySelector('#stPantoneHex').value=item.hex;
    toast?.('Color guardado en la paleta');
  }

  function deletePantone(){
    const sel=document.querySelector('#stPalette');const idx=Number(sel?.value);
    if(!sel||sel.value===''||!state.palette[idx]){alert('Selecciona primero un color de la paleta.');return;}
    const name=state.palette[idx].name;
    if(!confirm('¿Eliminar '+name+' de la paleta?'))return;
    state.palette.splice(idx,1);savePalette();refreshPaletteUI();toast?.('Color eliminado');
  }

  function assignPantone(){
    const o=selected();if(o)pushHistory();if(!o){alert('Selecciona una capa.');return;}
    const name=document.querySelector('#stPantoneName').value.trim()||'Color de producción';
    const hex=document.querySelector('#stPantoneHex').value;o.pantone={name,hex};
    if(o.type==='text')o.color=hex;redraw();
  }

  function fitSelected(){
    const o=selected();if(o)pushHistory();if(!o)return;const dw=cm2px(state.widthCm),dh=cm2px(state.heightCm),r=Math.min(dw*.9/o.w,dh*.9/o.h);o.w*=r;o.h*=r;o.x=(dw-o.w)/2;o.y=(dh-o.h)/2;redraw();
  }
  function centerSelected(){const o=selected();if(!o)return;pushHistory();o.x=(cm2px(state.widthCm)-o.w)/2;o.y=(cm2px(state.heightCm)-o.h)/2;redraw();}
  function duplicate(){const o=selected();if(!o)return;pushHistory();const n={...o,id:uid(),name:o.name+' copia',x:o.x+cm2px(.5),y:o.y+cm2px(.5),pantone:o.pantone?{...o.pantone}:null};state.objects.push(n);state.selectedId=n.id;redraw();}
  function del(){const so=selected();if(so?.locked){alert('Desbloquea la capa antes de eliminarla.');return;}pushHistory();const i=state.objects.findIndex(o=>o.id===state.selectedId);if(i<0)return;state.objects.splice(i,1);state.selectedId=null;redraw();}

  function layerIndex(){return state.objects.findIndex(o=>o.id===state.selectedId);}
  function layerUp(){
    const i=layerIndex();if(i<0||i>=state.objects.length-1)return;pushHistory();[state.objects[i],state.objects[i+1]]=[state.objects[i+1],state.objects[i]];redraw();
  }
  function layerDown(){
    const i=layerIndex();if(i<=0)return;pushHistory();[state.objects[i],state.objects[i-1]]=[state.objects[i-1],state.objects[i]];redraw();
  }
  function layerFront(){
    const i=layerIndex();if(i<0||i===state.objects.length-1)return;pushHistory();const [o]=state.objects.splice(i,1);state.objects.push(o);redraw();
  }
  function layerBack(){
    const i=layerIndex();if(i<=0)return;pushHistory();const [o]=state.objects.splice(i,1);state.objects.unshift(o);redraw();
  }
  function toggleLock(){
    const o=selected();if(!o)return;pushHistory();o.locked=!o.locked;redraw();toast?.(o.locked?'Capa bloqueada':'Capa desbloqueada');
  }
  function halfOpacity(){
    const o=selected();if(!o)return;if(o.locked){alert('Esta capa está bloqueada.');return;}pushHistory();o.opacity=(Math.abs((o.opacity??1)-.5)<.01)?1:.5;redraw();
  }
  function overlayLayer(){
    const target=selected();if(!target){alert('Selecciona primero la capa que quieres mover.');return;}
    if(target.locked){alert('La capa seleccionada está bloqueada.');return;}
    const others=state.objects.filter(o=>o.id!==target.id&&o.visible!==false);
    if(!others.length){alert('No hay otra capa para usar como referencia.');return;}
    const names=others.map((o,i)=>(i+1)+'. '+o.name).join('\n');
    const ans=prompt('¿Sobre qué capa quieres superponerla?\n\n'+names+'\n\nEscribe el número:','1');
    if(ans===null)return;const idx=Number(ans)-1;if(!Number.isInteger(idx)||!others[idx]){alert('Número de capa no válido.');return;}
    const ref=others[idx];
    const exact=confirm('Aceptar = copiar posición Y tamaño exactos.\nCancelar = copiar solo la posición y mantener el tamaño actual.');
    pushHistory();target.x=ref.x;target.y=ref.y;
    if(exact){target.w=ref.w;target.h=ref.h;target.rotation=ref.rotation||0;}
    redraw();toast?.('Capa superpuesta');
  }

  function renderMatrix(){
    const box=document.querySelector('#stMatrix');if(!box)return;
    box.innerHTML=state.matrix.map((m,i)=>'<div style="display:grid;grid-template-columns:auto 58px 1fr 1fr 58px;gap:5px;align-items:center;margin-bottom:5px"><input class="stmEn" data-i="'+i+'" type="checkbox" '+(m.enabled!==false?'checked':'')+' style="width:auto"><b>'+esc(m.size)+'</b><input class="stmW" data-i="'+i+'" type="number" step=".1" value="'+m.w+'" title="Ancho cm"><input class="stmH" data-i="'+i+'" type="number" step=".1" value="'+m.h+'" title="Alto cm"><input class="stmQ" data-i="'+i+'" type="number" min="1" value="'+(m.qty||1)+'" title="Cantidad"></div>').join('');
    box.querySelectorAll('.stmEn').forEach(x=>x.onchange=()=>state.matrix[+x.dataset.i].enabled=x.checked);
    box.querySelectorAll('.stmW').forEach(x=>x.onchange=()=>state.matrix[+x.dataset.i].w=Number(x.value)||1);
    box.querySelectorAll('.stmH').forEach(x=>x.onchange=()=>state.matrix[+x.dataset.i].h=Number(x.value)||1);
    box.querySelectorAll('.stmQ').forEach(x=>x.onchange=()=>state.matrix[+x.dataset.i].qty=Math.max(1,Number(x.value)||1));
  }
  function fittedCanvas(src,wCm,hCm){
    const out=document.createElement('canvas');out.width=Math.round(cm2px(wCm));out.height=Math.round(cm2px(hCm));const g=out.getContext('2d');const r=Math.min(out.width/src.width,out.height/src.height);const w=src.width*r,h=src.height*r;g.drawImage(src,(out.width-w)/2,(out.height-h)/2,w,h);return out;
  }
  function copiesCanvas(src,copies,gapCm,sheetWidthCm){
    const gap=Math.round(cm2px(gapCm)),sheetW=Math.max(src.width,Math.round(cm2px(sheetWidthCm)));const cols=Math.max(1,Math.floor((sheetW+gap)/(src.width+gap)));const rows=Math.ceil(copies/cols);const usedCols=Math.min(cols,copies);
    const out=document.createElement('canvas');out.width=Math.min(sheetW,usedCols*src.width+Math.max(0,usedCols-1)*gap);out.height=rows*src.height+Math.max(0,rows-1)*gap;const g=out.getContext('2d');
    for(let i=0;i<copies;i++){const col=i%cols,row=Math.floor(i/cols);g.drawImage(src,col*(src.width+gap),row*(src.height+gap));}return out;
  }
  function exportMatrix(){
    const base=outputCanvas(),gap=Number(document.querySelector('#stGap')?.value||.5),sheetW=Number(document.querySelector('#stSheetWidth')?.value||56);let delay=0;
    state.matrix.filter(m=>m.enabled!==false).forEach(m=>{const fitted=fittedCanvas(base,m.w,m.h),sheet=copiesCanvas(fitted,Math.max(1,m.qty||1),gap,Math.max(sheetW,m.w));setTimeout(()=>sheet.toBlob(b=>b&&dl(b,'AIHXO_'+m.size+'_'+m.w+'x'+m.h+'cm_'+(m.qty||1)+'uds.png'),'image/png'),delay);delay+=250;});
    toast?.('Matriz preparada por tallas');
  }
  function renderQueue(){
    const box=document.querySelector('#stQueueList');if(!box)return;
    box.innerHTML=state.printQueue.length?state.printQueue.map((q,i)=>'<div class="studio-layer"><div style="flex:1"><b>'+esc(q.name)+'</b><div class="muted">'+q.wCm+'×'+q.hCm+' cm · '+q.qty+' uds</div></div><button class="secondary stQDel" data-i="'+i+'">×</button></div>').join(''):'<div class="muted">Cola vacía.</div>';
    box.querySelectorAll('.stQDel').forEach(b=>b.onclick=()=>{state.printQueue.splice(+b.dataset.i,1);renderQueue();});
  }
  function addCurrentToQueue(){
    const src=outputCanvas(),qty=Math.max(1,Number(document.querySelector('#stQueueQty')?.value||1)),name=(document.querySelector('#stQueueName')?.value||'Diseño').trim()||'Diseño';
    state.printQueue.push({id:uid(),name,qty,wCm:state.widthCm,hCm:state.heightCm,src:src.toDataURL('image/png')});renderQueue();toast?.('Diseño añadido a la cola');
  }
  async function exportMultiSheet(){
    if(!state.printQueue.length){alert('Añade al menos un diseño a la cola.');return;}
    const gapCm=Math.max(0,Number(document.querySelector('#stGap')?.value||.5)),gap=Math.round(cm2px(gapCm)),sheetWidthCm=Math.max(5,Number(document.querySelector('#stSheetWidth')?.value||56)),sheetW=Math.round(cm2px(sheetWidthCm));
    const items=[];
    for(const q of state.printQueue){const im=await imageFromSrc(q.src);for(let n=0;n<q.qty;n++)items.push({name:q.name,img:im,w:im.naturalWidth,h:im.naturalHeight});}
    items.sort((a,b)=>Math.max(b.h,b.w)-Math.max(a.h,a.w));
    let x=0,y=0,rowH=0,placements=[];
    for(const it of items){
      let rot=false,w=it.w,h=it.h;
      if(x+w>sheetW && x+it.h<=sheetW){rot=true;w=it.h;h=it.w;}
      if(x+w>sheetW){x=0;y+=rowH+(placements.length?gap:0);rowH=0;rot=false;w=it.w;h=it.h;if(w>sheetW&&it.h<=sheetW){rot=true;w=it.h;h=it.w;}}
      placements.push({it,x,y,w,h,rot});x+=w+gap;rowH=Math.max(rowH,h);
    }
    const outH=y+rowH,out=document.createElement('canvas');out.width=sheetW;out.height=outH;const g=out.getContext('2d');
    for(const p of placements){if(p.rot){g.save();g.translate(p.x+p.w,p.y);g.rotate(Math.PI/2);g.drawImage(p.it.img,0,0,p.h,p.w);g.restore();}else g.drawImage(p.it.img,p.x,p.y,p.w,p.h);}
    out.toBlob(b=>{if(!b)return;const hcm=(out.height/CM_TO_PX).toFixed(1);dl(b,'AIHXO_multi_'+items.length+'uds_'+sheetWidthCm+'x'+hcm+'cm_DTF.png');toast?.('Hoja optimizada: '+items.length+' diseños · '+hcm+' cm de largo');},'image/png');
  }

  function outputCanvas(){
    const out=document.createElement('canvas');out.width=Math.round(cm2px(state.widthCm));out.height=Math.round(cm2px(state.heightCm));
    const g=out.getContext('2d');state.objects.filter(o=>o.visible!==false).forEach(o=>drawObject(g,o,1));return out;
  }
  function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
  function exportPng(){outputCanvas().toBlob(b=>b&&dl(b,`AIHXO_${state.widthCm}x${state.heightCm}cm_300ppp.png`),'image/png');}

  function exportSheet(){
    const copies=Math.max(1,Math.floor(Number(document.querySelector('#stCopies')?.value||1)));
    const gapCm=Math.max(0,Number(document.querySelector('#stGap')?.value||0));
    const sheetWidthCm=Math.max(state.widthCm,Number(document.querySelector('#stSheetWidth')?.value||56));
    const src=outputCanvas();
    const itemW=src.width,itemH=src.height,gapPx=Math.round(cm2px(gapCm)),sheetW=Math.round(cm2px(sheetWidthCm));
    const cols=Math.max(1,Math.floor((sheetW+gapPx)/(itemW+gapPx)));
    const rows=Math.ceil(copies/cols);
    const usedCols=Math.min(cols,copies);
    const outW=Math.min(sheetW, usedCols*itemW + Math.max(0,usedCols-1)*gapPx);
    const outH=rows*itemH + Math.max(0,rows-1)*gapPx;
    const out=document.createElement('canvas');out.width=outW;out.height=outH;
    const g=out.getContext('2d');
    for(let i=0;i<copies;i++){
      const col=i%cols,row=Math.floor(i/cols);
      g.drawImage(src,col*(itemW+gapPx),row*(itemH+gapPx));
    }
    out.toBlob(b=>{
      if(!b)return;
      const usedW=(outW/CM_TO_PX).toFixed(1), usedH=(outH/CM_TO_PX).toFixed(1);
      dl(b,`AIHXO_${copies}copias_${usedW}x${usedH}cm_DTF.png`);
      toast?.(`${copies} copias montadas · ${usedW} × ${usedH} cm`);
    },'image/png');
  }

  function exportSvg(){
    const wmm=state.widthCm*10,hmm=state.heightCm*10;
    const meta=state.objects.filter(o=>o.pantone).map(o=>({layer:o.name,pantone:o.pantone.name,hex:o.pantone.hex}));
    let body='';
    for(const o of state.objects.filter(x=>x.visible!==false)){
      const x=o.x/CM_TO_PX*10,y=o.y/CM_TO_PX*10,w=o.w/CM_TO_PX*10,h=o.h/CM_TO_PX*10;
      const tr=o.rotation?` transform="rotate(${o.rotation} ${x} ${y})"`:'';
      const dataAttr=o.pantone?` data-spot-name="${esc(o.pantone.name)}" data-spot-hex="${esc(o.pantone.hex)}"`:'';
      if(o.type==='image') body+=`<image x="${x}" y="${y}" width="${w}" height="${h}" href="${esc(o.src)}" opacity="${o.opacity??1}"${tr}${dataAttr}/>`;
      else body+=`<text x="${x}" y="${y+h*.8}" font-family="${esc(o.fontFamily||'Arial')}" font-size="${h*.75}" fill="${esc(o.color||'#111')}" opacity="${o.opacity??1}"${tr}${dataAttr}>${esc(o.text||'')}</text>`;
    }
    const svg=`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${wmm}mm" height="${hmm}mm" viewBox="0 0 ${wmm} ${hmm}"><metadata>${esc(JSON.stringify({producer:'AIHXO Studio',dpi:300,spotReferences:meta}))}</metadata>${body}</svg>`;
    dl(new Blob([svg],{type:'image/svg+xml'}),`AIHXO_master_${state.widthCm}x${state.heightCm}cm.svg`);
  }

  function setTool(t){
    state.tool=t;
    [['stSelect','select'],['stErase','erase'],['stBrushErase','brush-erase'],['stPick','pick'],['stSelectColorArea','color-area']].forEach(([id,val])=>{const b=document.querySelector('#'+id);if(b)b.className=val===t?'primary':'secondary';});
  }

  function bind(){
    injectNav();
    document.querySelector('#stDocW').onchange=e=>{pushHistory();state.widthCm=Number(e.target.value)||1;redraw();};
    document.querySelector('#stDocH').onchange=e=>{pushHistory();state.heightCm=Number(e.target.value)||1;redraw();};
    document.querySelectorAll('.stPreset').forEach(b=>b.onclick=()=>{pushHistory();state.widthCm=Number(b.dataset.w);state.heightCm=Number(b.dataset.h);document.querySelector('#stDocW').value=state.widthCm;document.querySelector('#stDocH').value=state.heightCm;redraw();});
    document.querySelector('#stFile').onchange=e=>addImageFromFile(e.target.files?.[0]);
    document.querySelector('#stAddText').onclick=addText;
    document.querySelector('#stSelect').onclick=()=>setTool('select');
    document.querySelector('#stErase').onclick=()=>setTool('erase');
    document.querySelector('#stBrushErase').onclick=()=>setTool('brush-erase');
    document.querySelector('#stBrushSize').onchange=e=>state.brushSizeCm=Math.max(.1,Number(e.target.value)||.5);
    document.querySelector('#stLockAspect').onchange=e=>{state.lockAspect=e.target.checked;toast?.(state.lockAspect?'Proporción bloqueada':'Proporción libre');};
    document.querySelector('#stPick').onclick=()=>setTool('pick');
    document.querySelector('#stSelectColorArea').onclick=()=>setTool('color-area');
    document.querySelector('#stFit').onclick=fitSelected;document.querySelector('#stCenter').onclick=centerSelected;
    document.querySelector('#stDuplicate').onclick=duplicate;
    document.querySelector('#stLayerUp').onclick=layerUp;
    document.querySelector('#stLayerDown').onclick=layerDown;
    document.querySelector('#stLayerFront').onclick=layerFront;
    document.querySelector('#stLayerBack').onclick=layerBack;
    document.querySelector('#stOverlayLayer').onclick=overlayLayer;
    document.querySelector('#stToggleLock').onclick=toggleLock;
    document.querySelector('#stHalfOpacity').onclick=halfOpacity;
    document.querySelector('#stDelete').onclick=del;
    document.querySelector('#stUndo').onclick=undo;
    document.querySelector('#stRedo').onclick=redo;
    document.querySelector('#stNewProject').onclick=newProject;
    document.querySelector('#stSaveProject').onclick=saveProject;
    document.querySelector('#stLoadProject').onclick=loadProject;
    document.querySelector('#stDeleteProject').onclick=deleteProject;
    refreshProjectList();
    renderMatrix();
    renderQueue();
    updateHistoryButtons();
    document.querySelector('#stPalette').onchange=e=>{const p=state.palette[Number(e.target.value)];if(!p)return;document.querySelector('#stPantoneName').value=p.name;document.querySelector('#stPantoneHex').value=p.hex;};
    document.querySelector('#stAddPantone').onclick=addPantone;
    document.querySelector('#stDeletePantone').onclick=deletePantone;
    refreshPaletteUI();
    document.querySelector('#stAssignPantone').onclick=assignPantone;document.querySelector('#stReplaceColor').onclick=replacePicked;
    document.querySelector('#stApplyWholeLayerColor').onclick=applyWholeLayerColor;
    document.querySelector('#stCopyColorFromLayer').onclick=copyColorFromLayer;
    document.querySelector('#stExportMatrix').onclick=exportMatrix;
    document.querySelector('#stAddQueue').onclick=addCurrentToQueue;
    document.querySelector('#stExportMultiSheet').onclick=exportMultiSheet;
    document.querySelector('#stExportSheet').onclick=exportSheet;
    document.querySelector('#stExportPng').onclick=exportPng;document.querySelector('#stExportSvg').onclick=exportSvg;
    const c=canvas();c.onpointerdown=canvasDown;c.onpointermove=canvasMove;c.onpointerup=canvasUp;c.onpointercancel=canvasUp;
    window.addEventListener('resize',()=>{if(document.querySelector('#studioCanvas'))redraw();},{passive:true});
  }

  window.aihxoStudioDTFView=renderStudio;

  const observer=new MutationObserver(()=>injectNav());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectNav);else injectNav();
})();