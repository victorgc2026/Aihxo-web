/* AIHXO Studio DTF · v1
   Editor de producción para PNG/SVG con medidas reales, capas, transparencia
   y referencias Pantone. El Pantone se guarda como dato de producción; PNG sigue siendo RGB.
*/
(function(){
  if(window.__aihxoStudioDTF) return;
  window.__aihxoStudioDTF = true;

  const DPI = 300;
  const CM_TO_PX = DPI / 2.54;
  const state = {
    widthCm: 30, heightCm: 35, objects: [], selectedId: null,
    tool: 'select', drag: null, pickedColor: null,
    palette: [
      {name:'PANTONE 534 C', hex:'#1B365D'},
      {name:'PANTONE Black C', hex:'#2D2926'},
      {name:'PANTONE White', hex:'#FFFFFF'}
    ]
  };

  const uid=()=> 'o'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cm2px=cm=>Number(cm||0)*CM_TO_PX;

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
          <span class="studio-badge">v1 producción</span>
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
              <button id="stPick" class="secondary">🎯 Tomar color</button>
            </div>
            <div class="field"><label>Importar PNG / JPG / WEBP / SVG</label><input id="stFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"></div>
            <button id="stAddText" class="secondary" style="width:100%;margin-top:8px">T＋ Añadir texto</button>
            <div class="studio-note" style="margin-top:12px"><b>Borrar zona</b>: arrastra un rectángulo sobre una imagen seleccionada. Solo borra píxeles de esa capa, no el resto del diseño.</div>

            <h3 style="margin-top:18px">Capas</h3>
            <div id="stLayers"></div>
          </section>

          <section class="studio-panel">
            <div class="studio-toolbar">
              <button id="stFit" class="secondary">Encajar</button>
              <button id="stCenter" class="secondary">Centrar</button>
              <button id="stDuplicate" class="secondary">Duplicar</button>
              <button id="stDelete" class="secondary">Eliminar</button>
              <button id="stUndo" class="secondary" title="v1: deshacer borrado no disponible">↶</button>
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
            <select id="stPalette" style="margin-top:8px"><option value="">Paleta AIHXO…</option>${state.palette.map((p,i)=>`<option value="${i}">${esc(p.name)} · ${esc(p.hex)}</option>`).join('')}</select>
            <div class="studio-toolbar" style="margin-top:8px">
              <button id="stAssignPantone" class="secondary">Asignar referencia</button>
              <button id="stReplaceColor" class="secondary">Reemplazar color tomado</button>
            </div>
            <div id="stColorInfo" class="studio-note">Usa <b>Tomar color</b> y toca un píxel del diseño. Después puedes sustituir ese color por la equivalencia RGB del Pantone elegido.</div>

            <h3 style="margin-top:18px">Salida</h3>
            <button id="stExportPng" class="primary" style="width:100%">Exportar PNG · 300 ppp</button>
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
      g.drawImage(o.img,0,0,o.w*s,o.h*s);
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
      const o={id:uid(),type:'image',name:file.name||'Imagen',img:im,src:url,
        originalType:file.type, x:docW*.11,y:docH*.11,w:im.naturalWidth*ratio,h:im.naturalHeight*ratio,
        rotation:0,opacity:1,visible:true,pantone:null};
      state.objects.push(o);state.selectedId=o.id;redraw();
    };
    im.onerror=()=>{URL.revokeObjectURL(url); alert('No se pudo abrir el archivo.');};
    im.src=url;
  }

  function addText(){
    const o={id:uid(),type:'text',name:'Texto',text:'AIHXO',x:cm2px(2),y:cm2px(2),w:cm2px(10),h:cm2px(2),
      fontSize:120,fontFamily:'Arial',color:'#111111',rotation:0,opacity:1,visible:true,pantone:null};
    state.objects.push(o);state.selectedId=o.id;redraw();
  }

  function renderLayers(){
    const box=document.querySelector('#stLayers'); if(!box)return;
    box.innerHTML=state.objects.slice().reverse().map(o=>`
      <div class="studio-layer ${o.id===state.selectedId?'active':''}" data-id="${o.id}">
        <button class="secondary stVis" data-id="${o.id}">${o.visible===false?'🙈':'👁️'}</button>
        <div style="min-width:0;flex:1"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.name)}</b><span class="muted">${o.type==='image'?'Imagen':'Texto'}${o.pantone?' · '+esc(o.pantone.name):''}</span></div>
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
    const bindNum=(id,fn)=>document.querySelector(id)?.addEventListener('input',e=>{fn(Number(e.target.value));redraw();});
    bindNum('#stiX',v=>o.x=cm2px(v));bindNum('#stiY',v=>o.y=cm2px(v));
    bindNum('#stiW',v=>{const r=o.h/o.w;o.w=cm2px(v);o.h=o.w*r;});
    bindNum('#stiH',v=>{const r=o.w/o.h;o.h=cm2px(v);o.w=o.h*r;});
    bindNum('#stiR',v=>o.rotation=v);bindNum('#stiO',v=>o.opacity=clamp(v/100,0,1));
    document.querySelector('#stiText')?.addEventListener('input',e=>{o.text=e.target.value;measureText(o);redraw();});
    document.querySelector('#stiFont')?.addEventListener('input',e=>{o.fontSize=Number(e.target.value)||1;measureText(o);redraw();});
    document.querySelector('#stiColor')?.addEventListener('input',e=>{o.color=e.target.value;redraw();});
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
    if(state.tool==='erase'){
      if(!selected() || selected().type!=='image'){alert('Selecciona primero una capa de imagen.');return;}
      state.drag={kind:'erase',x:p.x,y:p.y,x2:p.x,y2:p.y}; return;
    }
    if(o){state.selectedId=o.id;state.drag={kind:'move',dx:p.x-o.x,dy:p.y-o.y};}else{state.selectedId=null;state.drag=null;}
    redraw();
  }
  function canvasMove(ev){
    if(!state.drag)return;const p=pointToDoc(ev);
    if(state.drag.kind==='move'){const o=selected();if(o){o.x=p.x-state.drag.dx;o.y=p.y-state.drag.dy;redraw();}}
    else if(state.drag.kind==='erase'){state.drag.x2=p.x;state.drag.y2=p.y;redraw();drawEraseRect();}
  }
  function canvasUp(){if(state.drag?.kind==='erase')eraseRect(state.drag);state.drag=null;}

  function drawEraseRect(){
    const d=state.drag;if(!d)return;const c=canvas(),g=ctx(),s=Number(c.dataset.scale||1);
    g.save();g.strokeStyle='#d13b4b';g.lineWidth=2;g.setLineDash([5,4]);
    g.strokeRect(Math.min(d.x,d.x2)*s,Math.min(d.y,d.y2)*s,Math.abs(d.x2-d.x)*s,Math.abs(d.y2-d.y)*s);g.restore();
  }

  function eraseRect(d){
    const o=selected();if(!o||o.type!=='image'||!o.img)return;
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
    const o=selected();if(!o||o.type!=='image'||!state.pickedColor){alert('Selecciona una imagen y toma primero un color.');return;}
    const target=hexRgb(document.querySelector('#stPantoneHex').value),tol=Number(document.querySelector('#stTolerance').value||35),src=state.pickedColor;
    const off=document.createElement('canvas');off.width=o.img.naturalWidth;off.height=o.img.naturalHeight;const g=off.getContext('2d',{willReadFrequently:true});
    g.drawImage(o.img,0,0);const id=g.getImageData(0,0,off.width,off.height),d=id.data;let n=0;
    for(let i=0;i<d.length;i+=4){if(d[i+3]===0)continue;const dist=Math.hypot(d[i]-src[0],d[i+1]-src[1],d[i+2]-src[2]);if(dist<=tol){d[i]=target[0];d[i+1]=target[1];d[i+2]=target[2];n++;}}
    g.putImageData(id,0,0);const im=new Image();im.onload=()=>{o.img=im;o.src=im.src;redraw();toast?.('Color reemplazado en '+n+' píxeles');};im.src=off.toDataURL('image/png');
  }

  function assignPantone(){
    const o=selected();if(!o){alert('Selecciona una capa.');return;}
    const name=document.querySelector('#stPantoneName').value.trim()||'Color de producción';
    const hex=document.querySelector('#stPantoneHex').value;o.pantone={name,hex};
    if(o.type==='text')o.color=hex;redraw();
  }

  function fitSelected(){
    const o=selected();if(!o)return;const dw=cm2px(state.widthCm),dh=cm2px(state.heightCm),r=Math.min(dw*.9/o.w,dh*.9/o.h);o.w*=r;o.h*=r;o.x=(dw-o.w)/2;o.y=(dh-o.h)/2;redraw();
  }
  function centerSelected(){const o=selected();if(!o)return;o.x=(cm2px(state.widthCm)-o.w)/2;o.y=(cm2px(state.heightCm)-o.h)/2;redraw();}
  function duplicate(){const o=selected();if(!o)return;const n={...o,id:uid(),name:o.name+' copia',x:o.x+cm2px(.5),y:o.y+cm2px(.5),pantone:o.pantone?{...o.pantone}:null};state.objects.push(n);state.selectedId=n.id;redraw();}
  function del(){const i=state.objects.findIndex(o=>o.id===state.selectedId);if(i<0)return;state.objects.splice(i,1);state.selectedId=null;redraw();}

  function outputCanvas(){
    const out=document.createElement('canvas');out.width=Math.round(cm2px(state.widthCm));out.height=Math.round(cm2px(state.heightCm));
    const g=out.getContext('2d');state.objects.filter(o=>o.visible!==false).forEach(o=>drawObject(g,o,1));return out;
  }
  function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}
  function exportPng(){outputCanvas().toBlob(b=>b&&dl(b,`AIHXO_${state.widthCm}x${state.heightCm}cm_300ppp.png`),'image/png');}

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
    [['stSelect','select'],['stErase','erase'],['stPick','pick']].forEach(([id,val])=>{const b=document.querySelector('#'+id);if(b)b.className=val===t?'primary':'secondary';});
  }

  function bind(){
    injectNav();
    document.querySelector('#stDocW').oninput=e=>{state.widthCm=Number(e.target.value)||1;redraw();};
    document.querySelector('#stDocH').oninput=e=>{state.heightCm=Number(e.target.value)||1;redraw();};
    document.querySelectorAll('.stPreset').forEach(b=>b.onclick=()=>{state.widthCm=Number(b.dataset.w);state.heightCm=Number(b.dataset.h);document.querySelector('#stDocW').value=state.widthCm;document.querySelector('#stDocH').value=state.heightCm;redraw();});
    document.querySelector('#stFile').onchange=e=>addImageFromFile(e.target.files?.[0]);
    document.querySelector('#stAddText').onclick=addText;
    document.querySelector('#stSelect').onclick=()=>setTool('select');
    document.querySelector('#stErase').onclick=()=>setTool('erase');
    document.querySelector('#stPick').onclick=()=>setTool('pick');
    document.querySelector('#stFit').onclick=fitSelected;document.querySelector('#stCenter').onclick=centerSelected;
    document.querySelector('#stDuplicate').onclick=duplicate;document.querySelector('#stDelete').onclick=del;
    document.querySelector('#stUndo').onclick=()=>alert('Historial de deshacer llegará en la siguiente versión. El original importado no se modifica.');
    document.querySelector('#stPalette').onchange=e=>{const p=state.palette[Number(e.target.value)];if(!p)return;document.querySelector('#stPantoneName').value=p.name;document.querySelector('#stPantoneHex').value=p.hex;};
    document.querySelector('#stAssignPantone').onclick=assignPantone;document.querySelector('#stReplaceColor').onclick=replacePicked;
    document.querySelector('#stExportPng').onclick=exportPng;document.querySelector('#stExportSvg').onclick=exportSvg;
    const c=canvas();c.onpointerdown=canvasDown;c.onpointermove=canvasMove;c.onpointerup=canvasUp;c.onpointercancel=canvasUp;
    window.addEventListener('resize',()=>{if(document.querySelector('#studioCanvas'))redraw();},{passive:true});
  }

  window.aihxoStudioDTFView=renderStudio;

  const observer=new MutationObserver(()=>injectNav());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectNav);else injectNav();
})();