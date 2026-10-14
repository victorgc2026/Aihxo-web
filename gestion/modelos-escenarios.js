/* AIHXO · Selector seguro de modelos y escenarios · no modifica los flujos existentes */
(function(){
 'use strict';
 if(window.__aihxoModelosEscenarios)return;
 window.__aihxoModelosEscenarios=true;
 const $=(s,r=document)=>r.querySelector(s);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sceneTags={
  estudio:['estudio','studio','blanco','gris','fondo neutro'],
  urbano:['urbano','urban','calle','city'],
  costa:['playa','costa','mar','beach'],
  lifestyle:['lifestyle','interior','cafe','casual'],
  deporte:['deporte','sport','fitness','gym']
 };
 let garmentList=[],photos=[],used=new Set(),chosen=null;
 const state={garment:'',gender:'todos',scene:'todos',side:'front'};
 function scenario(p){
  const raw=(p.name+' '+(p.scenario||'')).toLowerCase();
  return Object.keys(sceneTags).find(k=>sceneTags[k].some(term=>raw.includes(term)))||'sin-etiqueta';
 }
 function sameGarment(p){return String(p.garment_id)===String(state.garment)}
 function genderFits(p){return state.gender==='todos'||p.gender===state.gender||p.gender==='unisex'}
 function sceneFits(p){return state.scene==='todos'||scenario(p)===state.scene}
 function candidates(){return photos.filter(p=>p.active!==false&&sameGarment(p)&&genderFits(p)&&sceneFits(p)&&p.side===state.side&&p.image_url)}
 async function load(){
  const api=window.supabaseClient;if(!api)throw Error('Inicia sesión en AIHXO Gestión');
  const [gr,pr]=await Promise.all([
   api.from('garments').select('id,manufacturer,model,audience,active').eq('active',true).order('manufacturer').order('model'),
   api.from('mockup_templates').select('id,name,garment_id,gender,side,image_url,active').eq('active',true).order('name')
  ]);
  if(gr.error||pr.error)throw(gr.error||pr.error);
  garmentList=gr.data||[];photos=pr.data||[];
  if(!garmentList.some(g=>String(g.id)===String(state.garment)))state.garment=String(garmentList[0]?.id||'');
 }
 function modal(){
  $('#aihxoModelScenePanel')?.remove();
  const el=document.createElement('div');el.id='aihxoModelScenePanel';
  el.style.cssText='position:fixed;inset:0;z-index:15000;background:#07152fd9;overflow:auto;padding:12px;box-sizing:border-box';
  el.innerHTML=`<div style="max-width:940px;margin:auto;background:#fff;color:#17233b;border-radius:18px;padding:16px">
  <header style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><h2 style="margin:0">👤 Modelos y escenarios</h2><p style="color:#5b6472;margin:4px 0">Fotografías reales del banco AIHXO, compatibles con la prenda seleccionada.</p></div><button type="button" id="msClose" class="secondary">✕</button></header>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px;margin:14px 0">
  <label>Prenda base<select id="msGarment" style="width:100%"></select></label>
  <label>Modelo<select id="msGender" style="width:100%"><option value="todos">Todos</option><option value="hombre">Hombre</option><option value="mujer">Mujer</option><option value="unisex">Unisex</option></select></label>
  <label>Escenario<select id="msScene" style="width:100%"><option value="todos">Todos</option><option value="estudio">Estudio</option><option value="urbano">Urbano</option><option value="costa">Costa / playa</option><option value="lifestyle">Lifestyle</option><option value="deporte">Deporte</option><option value="sin-etiqueta">Sin clasificar</option></select></label>
  <label>Vista<select id="msSide" style="width:100%"><option value="front">Delantera</option><option value="back">Trasera</option></select></label></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary" type="button" id="msRandom">🎲 Modelo aleatorio</button><button class="secondary" type="button" id="msRandomScene">🎲 Escenario aleatorio</button><button class="secondary" type="button" id="msRefresh">↻ Actualizar biblioteca</button><button class="secondary" type="button" id="msUpload">＋ Añadir fotografía</button></div>
  <p id="msStatus" role="status" style="color:#526079;margin:12px 0"></p>
  <div id="msList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px"></div>
  <div id="msChoice" style="margin-top:14px"></div>
  <p style="font-size:12px;color:#667085;margin-top:14px">Las fotografías del banco mantienen su prenda y fondo originales. Cambiar un escenario o la prenda de una fotografía requiere generar o editar una imagen nueva; esta herramienta no simula esa sustitución.</p></div>`;
  document.body.appendChild(el);
  $('#msClose',el).onclick=()=>el.remove();
  $('#msGarment',el).innerHTML=garmentList.map(g=>`<option value="${esc(g.id)}">${esc(g.manufacturer)} · ${esc(g.model)}</option>`).join('');
  for(const [id,key] of [['msGarment','garment'],['msGender','gender'],['msScene','scene'],['msSide','side']]){
   $( '#'+id,el).value=state[key];
   $('#'+id,el).onchange=e=>{state[key]=e.target.value;chosen=null;used.clear();renderResults();};
  }
  $('#msRandom',el).onclick=()=>randomChoose();
  $('#msRandomScene',el).onclick=()=>{
   const values=['estudio','urbano','costa','lifestyle','deporte','sin-etiqueta'].filter(s=>photos.some(p=>sameGarment(p)&&genderFits(p)&&p.side===state.side&&scenario(p)===s));
   if(!values.length){setStatus('No hay escenarios distintos disponibles para esta prenda y vista.');return}
   const next=values[Math.floor(Math.random()*values.length)];state.scene=next;$('#msScene',el).value=next;used.clear();chosen=null;renderResults();randomChoose();
  };
  $('#msRefresh',el).onclick=async()=>{try{await load();$('#msGarment',el).innerHTML=garmentList.map(g=>`<option value="${esc(g.id)}">${esc(g.manufacturer)} · ${esc(g.model)}</option>`).join('');$('#msGarment',el).value=state.garment;renderResults()}catch(e){setStatus('Error de actualización: '+e.message)}};
  $('#msUpload',el).onclick=()=>{if(typeof window.aihxoNuevoMockup==='function'){el.remove();window.aihxoNuevoMockup()}else setStatus('Abre Banco mockups para añadir fotografías.')};
  renderResults();
 }
 function setStatus(message){const el=$('#msStatus');if(el)el.textContent=message;}
 function renderResults(){
  const list=$('#msList');if(!list)return;
  const options=candidates();
  setStatus(options.length?`${options.length} fotografía(s) disponibles. No se repite una persona hasta agotar las opciones de este filtro.`:'No hay fotografías de esa prenda, vista y filtros. Añade una foto desde Banco mockups.');
  list.innerHTML=options.map(p=>`<button type="button" data-id="${esc(p.id)}" style="background:#f5f7fa;border:2px solid ${chosen?.id===p.id?'#087cf4':'#e4e8ee'};padding:7px;border-radius:13px;text-align:left;color:#18263a"><img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" style="width:100%;height:175px;object-fit:cover;border-radius:9px"><b style="display:block;font-size:13px">${esc(p.name)}</b><small>${esc(p.gender||'Sin tipo')} · ${esc(scenario(p))}</small></button>`).join('');
  list.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>select(options.find(p=>String(p.id)===b.dataset.id)));
  if(chosen)showChoice();
  else $('#msChoice').innerHTML='';
 }
 function personKey(p){return String(p.name).replace(/\s*[·-]\s*(delantera|trasera|front|back)\s*$/i,'').trim().toLowerCase();}
 function randomChoose(){
  const pool=candidates();if(!pool.length){setStatus('No hay fotos para elegir con los filtros actuales.');return}
  let fresh=pool.filter(p=>!used.has(personKey(p)));
  if(!fresh.length){used.clear();fresh=pool;}
  select(fresh[Math.floor(Math.random()*fresh.length)]);
 }
 function select(p){if(!p)return;chosen=p;used.add(personKey(p));renderResults();}
 function showChoice(){
  const dest=$('#msChoice');if(!dest||!chosen)return;
  dest.innerHTML=`<div style="padding:12px;border:1px solid #dbe5f0;border-radius:12px"><b>Seleccionado:</b> ${esc(chosen.name)}<div style="margin-top:8px"><button id="msUse" type="button" class="primary">Usar fotografía en generador</button> <button id="msAgain" type="button" class="secondary">Otro modelo</button></div></div>`;
  $('#msAgain',dest).onclick=randomChoose;
  $('#msUse',dest).onclick=()=>{
   const current=chosen;$('#aihxoModelScenePanel')?.remove();
   if(typeof window.abrirGeneradorMockupConPlantilla==='function')window.abrirGeneradorMockupConPlantilla(current);
   else {window._aihxoPendingMockupTemplate=current;window.alert('Fotografía seleccionada. Abre un diseño AIHXO y el generador de mockups para utilizarla.');}
  };
 }
 window.abrirAIHXOModelosEscenarios=async function(){
  try{await load();modal()}catch(e){window.alert('No se pudo abrir Modelos y escenarios: '+e.message)}
 };
 function attach(){
  const nav=$('#nav');if(!nav||$('#aihxoModelSceneNav',nav))return;
  const btn=document.createElement('button');btn.id='aihxoModelSceneNav';btn.type='button';btn.innerHTML='🎲 <span>Modelos y escenarios</span>';btn.onclick=()=>window.abrirAIHXOModelosEscenarios();
  const target=$('#aihxoCreativeNav',nav)||$('#aihxoStudioNav',nav);
  if(target)target.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);
 }
 const observer=new MutationObserver(()=>{if($('#nav')&&!$('#aihxoModelSceneNav'))attach()});
 observer.observe(document.documentElement,{childList:true,subtree:true});attach();
})();
