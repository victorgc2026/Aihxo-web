/* AIHXO · Banco de mockups */
(function(){
 const $=s=>document.querySelector(s);
 const esc=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 async function load(){
   const c=$('#view'); if(!c)return;
   const [{data:garments,error:gErr},{data:templates,error:tErr}]=await Promise.all([
     supabaseClient.from('garments').select('id,manufacturer,model,audience,active').eq('active',true).order('manufacturer').order('model'),
     supabaseClient.from('mockup_templates').select('*').order('created_at',{ascending:false})
   ]);
   if(gErr||tErr){console.error(gErr||tErr);c.innerHTML='<div class="page"><div class="card">No se pudo cargar el banco de mockups.</div></div>';return}
   window._aihxoMockupGarments=garments||[]; window._aihxoMockupTemplates=templates||[];
   c.innerHTML=`<div class="page"><div class="section"><div><h2>👤 Banco de mockups</h2><div class="muted">Modelos AIHXO por prenda y vista · toca una imagen para verla grande</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="secondary" href="/gestion/candidatos-modelos.html" target="_blank" rel="noopener" style="padding:10px;border-radius:10px;text-decoration:none">🔎 Buscar mockups editables</a><button class="primary" onclick="aihxoNuevoMockup()">＋ Añadir modelo</button><button class="secondary" onclick="aihxoImportarLoteMockups()">📦 Importar lote</button></div></div>
   <div class="grid kpis">${kpi('Plantillas',(templates||[]).length,'guardadas')}${kpi('Prendas',(garments||[]).length,'activas')}${kpi('Frontales',(templates||[]).filter(x=>x.side==='front').length,'disponibles')}${kpi('Traseras',(templates||[]).filter(x=>x.side==='back').length,'disponibles')}</div>
   <div class="card"><div style="display:grid;gap:12px">${(templates||[]).length?(templates||[]).map(t=>{const g=(garments||[]).find(x=>x.id===t.garment_id);return `<div style="display:grid;grid-template-columns:92px 1fr auto;gap:12px;align-items:center;border-bottom:1px solid #edf0f4;padding-bottom:12px"><button type="button" onclick="aihxoPreviewMockup('${t.id}')" aria-label="Ver ${esc(t.name)}" style="border:0;background:transparent;padding:0;cursor:pointer"><img src="${esc(t.image_url)}" alt="${esc(t.name)}" style="width:92px;height:110px;object-fit:cover;border-radius:12px;background:#eef2f6;display:block"></button><div onclick="aihxoPreviewMockup('${t.id}')" style="cursor:pointer"><b>${esc(t.name)}</b><div class="muted">${esc(g?`${g.manufacturer} · ${g.model}`:'Sin prenda')} · ${t.side==='back'?'Trasera':'Delantera'}${t.gender?' · '+esc(t.gender):''}</div><div class="muted" style="font-size:12px;margin-top:4px">Toca para ampliar</div></div><button class="secondary small" onclick="aihxoDeleteMockup('${t.id}','${esc(t.storage_path||'')}')">Eliminar</button></div>`}).join(''):'<div class="empty">Todavía no hay plantillas guardadas.</div>'}</div></div></div>`;
 }
 window.mockupBancoView=load;
 function templateById(id){return (window._aihxoMockupTemplates||[]).find(x=>x.id===id)}
 function garmentFor(t){return (window._aihxoMockupGarments||[]).find(g=>g.id===t?.garment_id)}
 window.aihxoPreviewMockup=function(id){
   const list=window._aihxoMockupTemplates||[];const i=list.findIndex(x=>x.id===id);if(i<0)return;openPreview(i);
 };
 function openPreview(index){
   document.getElementById('mockupPreviewModal')?.remove();
   const list=window._aihxoMockupTemplates||[];if(!list.length)return;
   const i=(index+list.length)%list.length,t=list[i],g=garmentFor(t);
   const m=document.createElement('div');m.id='mockupPreviewModal';m.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
   m.innerHTML=`<div style="background:#fff;color:#111;width:min(760px,100%);max-height:94vh;overflow:auto;border-radius:22px;padding:16px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h2 style="margin:0">${esc(t.name)}</h2><div style="color:#667085;font-size:14px;margin-top:4px">${esc(g?`${g.manufacturer} · ${g.model}`:'Sin prenda')} · ${t.side==='back'?'Trasera':'Delantera'}${t.gender?' · '+esc(t.gender):''}</div></div><button id="mpClose" type="button" style="border:0;background:#eee;border-radius:12px;padding:10px 13px;font-size:18px">✕</button></div><div style="margin-top:14px;background:#f2f4f7;border-radius:18px;overflow:hidden;display:flex;align-items:center;justify-content:center"><img src="${esc(t.image_url)}" alt="${esc(t.name)}" style="max-width:100%;max-height:68vh;object-fit:contain;display:block"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px"><button id="mpPrev" type="button" class="secondary">← Anterior</button><button id="mpNext" type="button" class="secondary">Siguiente →</button></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px"><button id="mpUse" type="button" class="primary">👕 Usar en mockup</button><button id="mpDelete" type="button" class="secondary">🗑️ Eliminar</button></div></div>`;
   document.body.appendChild(m);
   const close=()=>m.remove();m.querySelector('#mpClose').onclick=close;m.addEventListener('click',e=>{if(e.target===m)close()});
   m.querySelector('#mpPrev').onclick=()=>{close();openPreview(i-1)};m.querySelector('#mpNext').onclick=()=>{close();openPreview(i+1)};
   m.querySelector('#mpDelete').onclick=async()=>{close();await window.aihxoDeleteMockup(t.id,t.storage_path||'')};
   m.querySelector('#mpUse').onclick=()=>{close();if(typeof window.abrirGeneradorMockupConPlantilla==='function')window.abrirGeneradorMockupConPlantilla(t);else {window._aihxoPendingMockupTemplate=t;toast('Plantilla seleccionada. Abre un diseño propio y pulsa CREAR MOCKUP.')}};
 }

 window.aihxoImportarLoteMockups=function(){
   document.getElementById('aihxoBatchMockup')?.remove();
   const gs=window._aihxoMockupGarments||[];
   const modal=document.createElement('div');modal.id='aihxoBatchMockup';
   modal.style.cssText='position:fixed;inset:0;z-index:100200;background:#07152fca;overflow:auto;padding:14px;box-sizing:border-box';
   modal.innerHTML='<div style="max-width:800px;margin:auto;background:#fff;color:#1b2738;border-radius:16px;padding:18px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h2 style="margin:0">📦 Importar mockups por lote</h2><button type="button" id="batchClose">✕</button></div><p>Selecciona los ocho PNG de AIHXO o un ZIP. Revisa cada clasificación antes de guardar; las plantillas existentes no se modifican.</p><label style="display:block">Archivos PNG/JPG/WebP o ZIP<input id="batchFiles" type="file" multiple accept=".png,.jpg,.jpeg,.webp,.zip,image/png,image/jpeg,image/webp,application/zip" style="display:block;width:100%;margin:10px 0"></label><div id="batchInfo" role="status" style="margin:12px 0"></div><div id="batchRows" style="display:grid;gap:12px"></div><button class="primary" type="button" id="batchSave" style="width:100%;margin-top:14px" disabled>Guardar lote</button></div>';
   document.body.appendChild(modal);
   const q=x=>modal.querySelector(x);
   q('#batchClose').onclick=()=>modal.remove();
   let entries=[];
   const max=15*1048576;
   function classify(name){
     const stem=name.replace(/\.(png|jpe?g|webp)$/i,'');
     const low=stem.toLowerCase();
     const gender=/ni[ñn]a/.test(low)?'niña':/ni[ñn]o/.test(low)?'niño':/mujer/.test(low)?'mujer':/hombre/.test(low)?'hombre':'unisex';
     const side=/trasera|back/.test(low)?'back':'front';
     const label={hombre:'Hombre',mujer:'Mujer','niño':'Niño','niña':'Niña',unisex:'Unisex'}[gender];
     const view=side==='back'?'Trasera':'Delantera';
     return {gender,side,name:label+' · Negra · '+view+' · Studio 01'};
   }
   function options(gender){
     const hint=(gender==='niña'||gender==='niño')?'kid':'adult';
     const sorted=[...gs].sort((a,b)=>{
       const score=g=>{const t=(g.audience+' '+g.model).toLowerCase();return hint==='kid'?(/niñ|kid|infant|child/.test(t)?0:1):(/adult|woman|unisex|hombre|mujer/.test(t)?0:1)};
       return score(a)-score(b);
     });
     return '<option value="">Seleccionar prenda real</option>'+sorted.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.manufacturer)+' · '+esc(g.model)+' · '+esc(g.audience||'')+'</option>').join('');
   }
   function render(){
     q('#batchRows').innerHTML='';
     entries.forEach((e,i)=>{
       const wrap=document.createElement('div');wrap.style.cssText='padding:12px;border:1px solid #dce4ee;border-radius:12px;display:grid;gap:7px';
       const p=classify(e.file.name);
       wrap.innerHTML='<div style="display:flex;gap:12px;align-items:center"><img alt="Vista previa" style="width:70px;height:90px;object-fit:cover;border-radius:8px"><div style="min-width:0"><b>'+esc(e.file.name)+'</b><p style="margin:4px 0;font-size:12px">'+(e.file.size/1048576).toFixed(1)+' MB</p></div></div><label>Nombre<input data-field="name" style="width:100%;box-sizing:border-box" value="'+esc(p.name)+'"></label><label>Prenda<select data-field="garment" style="width:100%">'+options(p.gender)+'</select></label><label>Tipo<select data-field="gender"><option value="hombre">Hombre</option><option value="mujer">Mujer</option><option value="niño">Niño</option><option value="niña">Niña</option><option value="unisex">Unisex</option></select></label><label>Vista<select data-field="side"><option value="front">Delantera</option><option value="back">Trasera</option></select></label><button type="button" data-remove>Quitar</button><span data-progress style="font-size:12px"></span>';
       wrap.querySelector('[data-field="gender"]').value=p.gender;wrap.querySelector('[data-field="side"]').value=p.side;
       wrap.querySelector('img').src=e.preview;
       wrap.querySelector('[data-remove]').onclick=()=>{URL.revokeObjectURL(e.preview);entries.splice(i,1);render()};
       q('#batchRows').appendChild(wrap);
     });
     q('#batchInfo').textContent=entries.length+' archivo(s) preparado(s). Selecciona la prenda correcta para cada uno.';
     q('#batchSave').disabled=!entries.length;
   }
   q('#batchFiles').onchange=async event=>{
     q('#batchSave').disabled=true;
     q('#batchInfo').textContent='Leyendo archivos…';
     for(const e of entries)URL.revokeObjectURL(e.preview);
     entries=[];
     try{
       const files=Array.from(event.target.files||[]);
       const expanded=[];
       for(const file of files){
         if(/\.zip$/i.test(file.name)){
           if(!window.JSZip){
             await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('No se pudo cargar el lector ZIP'));document.head.appendChild(script)});
           }
           const zip=await window.JSZip.loadAsync(file);
           const members=Object.values(zip.files).filter(x=>!x.dir&&/\.(png|jpe?g|webp)$/i.test(x.name)&&!x.name.includes('__MACOSX')).slice(0,40);
           for(const m of members){const blob=await m.async('blob');expanded.push(new File([blob],m.name.split('/').pop(),{type: /\.png$/i.test(m.name)?'image/png':/\.webp$/i.test(m.name)?'image/webp':'image/jpeg'}))}
         }else expanded.push(file);
       }
       const existing=new Set();
       for(const file of expanded){
         if(!/\.(png|jpe?g|webp)$/i.test(file.name)||!file.size||file.size>max)continue;
         const key=file.name.toLowerCase();if(existing.has(key))continue;existing.add(key);
         const preview=URL.createObjectURL(file);
         try{await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=preview})}catch{URL.revokeObjectURL(preview);continue}
         entries.push({file,preview});
       }
       if(!entries.length){q('#batchInfo').textContent='No hay imágenes válidas. Elige PNG/JPG/WebP de hasta 15 MB o un ZIP con esas imágenes.';return}
       render();
     }catch(err){q('#batchInfo').textContent='No se pudo leer el lote: '+err.message}
   };
   q('#batchSave').onclick=async()=>{
     const cards=[...q('#batchRows').children];
     if(cards.some(c=>!c.querySelector('[data-field="garment"]').value||!c.querySelector('[data-field="name"]').value.trim())){alert('Indica una prenda real y un nombre para cada fotografía.');return}
     q('#batchSave').disabled=true;q('#batchClose').disabled=true;
     let ok=0;
     for(let i=0;i<entries.length;i++){
       const e=entries[i],c=cards[i],progress=c.querySelector('[data-progress]');
       try{
         const id=c.querySelector('[data-field="garment"]').value;
         const ext=e.file.name.split('.').pop().toLowerCase();
         const mime=ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg';
         const path=id+'/'+Date.now()+'-'+i+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
         progress.textContent='Subiendo…';
         const {error:up}=await supabaseClient.storage.from('mockup-templates').upload(path,e.file,{upsert:false,contentType:mime});
         if(up)throw up;
         const {data:url}=supabaseClient.storage.from('mockup-templates').getPublicUrl(path);
         const payload={name:c.querySelector('[data-field="name"]').value.trim(),garment_id:id,model_type:'persona',gender:c.querySelector('[data-field="gender"]').value,side:c.querySelector('[data-field="side"]').value,image_url:url.publicUrl,storage_path:path,active:true};
         const {error:db}=await supabaseClient.from('mockup_templates').insert(payload);
         if(db){await supabaseClient.storage.from('mockup-templates').remove([path]);throw db}
         ok++;progress.textContent='✅ Guardado';
       }catch(err){progress.textContent='❌ '+(err.message||'Error de subida')}
     }
     q('#batchInfo').textContent='Guardados '+ok+' de '+entries.length+'. Si hubo fallos, revisa el mensaje junto a cada archivo. No repitas la subida de los que ya aparecen guardados.';
     q('#batchClose').disabled=false;
     if(ok)await load();
   };
 };

 window.aihxoNuevoMockup=function(){
   document.getElementById('mockupBankModal')?.remove();
   const gs=window._aihxoMockupGarments||[]; const m=document.createElement('div');m.id='mockupBankModal';m.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.48);display:flex;align-items:flex-end;justify-content:center';
   m.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-width:680px;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:20px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center"><div><h2 style="margin:0">👤 Añadir modelo</h2><div style="color:#667085;font-size:14px">Banco actualizado v9 · PNG/JPG/WebP hasta 15 MB (no PSD)</div></div><button id="mbClose" type="button" style="border:0;background:#eee;border-radius:12px;padding:10px 13px">✕</button></div><form id="mbForm" class="form" style="margin-top:16px"><div class="field"><label>Nombre</label><input name="name" required placeholder="Ej. Melbourne Woman · Mujer · Delantera"></div><div class="field"><label>Prenda</label><select name="garment_id" required><option value="">Selecciona</option>${gs.map(g=>`<option value="${g.id}">${esc(g.manufacturer)} · ${esc(g.model)} · ${esc(g.audience||'')}</option>`).join('')}</select></div><div class="field"><label>Tipo de modelo</label><select name="gender"><option value="mujer">Mujer</option><option value="hombre">Hombre</option><option value="niña">Niña</option><option value="niño">Niño</option><option value="infantil">Infantil</option><option value="unisex">Unisex</option></select></div><div class="field"><label>Vista</label><select name="side"><option value="front">Delantera</option><option value="back">Trasera</option></select></div><div class="field"><label>Foto</label><input name="file" type="file" accept="image/png,image/jpeg,image/webp" required><p class="muted" style="font-size:12px">Comprueba la licencia comercial y los derechos de imagen. Añade color y escenario al nombre para distinguir cada modelo.</p></div><button class="primary" type="submit" style="width:100%">Guardar plantilla</button></form></div>`;document.body.appendChild(m);m.querySelector('#mbClose').onclick=()=>m.remove();m.addEventListener('click',e=>{if(e.target===m)m.remove()});
   m.querySelector('#mbForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Subiendo…';const fd=new FormData(e.target),file=fd.get('file');if(!file||file.size>15*1024*1024||!(/\.(png|jpe?g|webp)$/i.test(file.name)||['image/png','image/jpeg','image/webp'].includes(file.type))){alert('AIHXO v9 · Archivo: '+(file?.name||'ninguno')+' · Tipo: '+(file?.type||'sin tipo')+' · Tamaño: '+(file?(file.size/1048576).toFixed(2)+' MB':'desconocido')+'. Máximo 15 MB, formatos PNG/JPG/WebP.');btn.disabled=false;btn.textContent='Guardar plantilla';return;}const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const mime=ext==='png'?'image/png':(ext==='jpg'||ext==='jpeg')?'image/jpeg':ext==='webp'?'image/webp':file.type;const path=`${fd.get('garment_id')}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;const {error:upErr}=await supabaseClient.storage.from('mockup-templates').upload(path,file,{upsert:false,contentType:mime||undefined});if(upErr){console.error(upErr);alert('No se pudo subir la foto.');btn.disabled=false;btn.textContent='Guardar plantilla';return}const {data:urlData}=supabaseClient.storage.from('mockup-templates').getPublicUrl(path);const payload={name:String(fd.get('name')||'').trim(),garment_id:fd.get('garment_id'),model_type:'persona',gender:fd.get('gender'),side:fd.get('side'),image_url:urlData.publicUrl,storage_path:path,active:true};const {error:dbErr}=await supabaseClient.from('mockup_templates').insert(payload);if(dbErr){console.error(dbErr);await supabaseClient.storage.from('mockup-templates').remove([path]);alert('No se pudo guardar la plantilla.');btn.disabled=false;btn.textContent='Guardar plantilla';return}m.remove();toast('Plantilla guardada');load()};
 };
 window.aihxoDeleteMockup=async function(id,path){if(!confirm('¿Eliminar esta plantilla del banco?'))return;const {error}=await supabaseClient.from('mockup_templates').delete().eq('id',id);if(error){console.error(error);toast('No se pudo eliminar');return}if(path)await supabaseClient.storage.from('mockup-templates').remove([path]);toast('Plantilla eliminada');load()};
 const old=window.setView;window.setView=function(v){if(v==='mockup-bank'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));const t=$('#title');if(t)t.textContent='Banco de mockups';load();if(typeof closeMobileMenu==='function')closeMobileMenu();return}return old(v)};
 function nav(){const b=document.querySelector('#nav button[data-view="products"]')||document.querySelector('#nav button[data-view="stock"]');if(!b||document.querySelector('#nav button[data-view="mockup-bank"]'))return;const n=document.createElement('button');n.dataset.view='mockup-bank';n.innerHTML='👤 <span>Banco mockups</span>';n.onclick=()=>setView('mockup-bank');b.insertAdjacentElement('afterend',n)}setTimeout(nav,0);
})();