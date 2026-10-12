/* AIHXO · Colecciones: gestor de borradores y publicaciones */
(function(){
'use strict';
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=[],published=[],catalog=[];
const key='aihxo_collections';
function uid(){return 'col-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function slug(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)}
function clone(x){return JSON.parse(JSON.stringify(x))}
async function load(){
 const [settings,products]=await Promise.all([
  supabaseClient.from('web_home_settings').select('config,draft_config').eq('id','home').maybeSingle(),
  supabaseClient.from('products').select('id,sku,model,category,image_url,homepage_image_url,sale_price,gallery').order('model')
 ]);
 if(settings.error)throw settings.error;if(products.error)throw products.error;
 const d=settings.data||{};
 published=Array.isArray(d.config?.[key])?clone(d.config[key]):[];
 state=Array.isArray(d.draft_config?.[key])?clone(d.draft_config[key]):clone(published);
 catalog=(products.data||[]).filter(p=>/diseno propio/i.test(p.category||''));
}
async function save(publish=false){
 const {data,error}=await supabaseClient.from('web_home_settings').select('config,draft_config').eq('id','home').single();
 if(error)throw error;
 const current=data||{}, baseDraft=current.draft_config||current.config||{};
 const nextDraft={...baseDraft,[key]:clone(state)};
 const patch={draft_config:nextDraft,updated_at:new Date().toISOString()};
 if(publish){
  // No sustituir ni publicar cambios pendientes de la portada.
  patch.config={...(current.config||{}),[key]:clone(state)};
  patch.published_at=new Date().toISOString();
 }
 const res=await supabaseClient.from('web_home_settings').update(patch).eq('id','home');
 if(res.error)throw res.error;
 if(publish)published=clone(state);
}
function photos(p){let g=Array.isArray(p.gallery)?p.gallery:[];if(typeof p.gallery==='string'){try{g=JSON.parse(p.gallery)}catch(_){g=[]}}
 return [p.homepage_image_url||p.image_url,...g].filter(Boolean);
}
function card(p){const pic=photos(p)[0];return '<label style="display:flex;gap:10px;align-items:center;padding:10px;border:1px solid #ddd;border-radius:12px">'+(pic?'<img src="'+E(pic)+'" style="width:54px;height:60px;object-fit:cover;border-radius:8px">':'')+'<input type="checkbox" data-cproduct="'+E(p.id)+'"><span><b>'+E(p.model)+'</b><small style="display:block">'+E(p.sku||'')+'</small></span></label>'}
function draw(){
 const c=document.querySelector('#view');if(!c)return;
 c.innerHTML='<div class="page"><div class="section"><div><h2>🎨 Colecciones AIHXO</h2><div class="muted">Agrupa diseños con sus fotos de modelos. Guardado en borrador y publicación controlada.</div></div><button class="primary" id="colNew">＋ Nueva colección</button></div>'+
 '<div class="card" style="margin-bottom:14px"><b>Publicación segura</b><p class="muted">Las colecciones se guardan por separado de los cambios de portada. Solo la acción Publicar hace visible su configuración; la web debe disponer del lector de colecciones.</p></div>'+
 '<div style="display:grid;gap:12px">'+(state.length?state.map(x=>'<div class="card"><h3>'+E(x.name)+'</h3><div class="muted">'+E(x.description||'Sin descripción')+'</div><p>'+((x.product_ids||[]).length)+' diseños · '+(published.some(p=>p.id===x.id)?'Publicada':'Borrador')+'</p><button class="secondary" data-edit="'+E(x.id)+'">Editar colección</button> <button class="secondary" data-remove="'+E(x.id)+'">Eliminar borrador</button></div>').join(''):'<div class="card">Aún no hay colecciones. Pulsa «Nueva colección».</div>')+'</div>'+
 '<div class="card" style="margin-top:14px"><button class="primary" id="colSave">Guardar borradores</button> <button class="secondary" id="colPublish">Publicar colecciones</button></div>';
 c.querySelector('#colNew').onclick=()=>edit(null);
 c.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 c.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(!confirm('¿Quitar esta colección del borrador? La web publicada no cambiará hasta publicar.'))return;state=state.filter(x=>x.id!==b.dataset.remove);draw()});
 c.querySelector('#colSave').onclick=()=>act(false);
 c.querySelector('#colPublish').onclick=()=>act(true);
}
async function act(publish){
 if(publish&&!confirm('¿Publicar los cambios de colecciones?'))return;
 try{await save(publish);toast(publish?'Colecciones publicadas en la configuración':'Borradores guardados');draw()}
 catch(e){console.error(e);alert('No se pudo guardar: '+(e.message||e))}
}
function edit(id){
 const x=state.find(t=>t.id===id)||{id:uid(),name:'',description:'',cover_url:'',product_ids:[]};
 const selected=new Set((x.product_ids||[]).map(String));
 const c=document.querySelector('#view');if(!c)return;
 c.innerHTML='<div class="page" style="max-width:850px"><button class="secondary" id="colBack">← Colecciones</button><div class="card" style="margin-top:12px"><h2>'+(id?'Editar':'Nueva')+' colección</h2><form id="colForm"><label class="field">Nombre de la colección<input id="colName" required value="'+E(x.name)+'" placeholder="AIHXO Icons · Galicia"></label><label class="field">Descripción<textarea id="colDescription" rows="3">'+E(x.description)+'</textarea></label><label class="field">Imagen de portada (URL pública)<input id="colCover" type="url" value="'+E(x.cover_url)+'" placeholder="https://..."></label><p class="muted">Las fotografías principales y galerías de cada diseño se reutilizan automáticamente. Puedes subirlas desde la ficha del producto.</p><h3>Diseños de la colección</h3><input id="colFilter" class="search" placeholder="Buscar diseño o SKU"><div id="colProducts" style="display:grid;gap:8px;max-height:55vh;overflow:auto;margin:12px 0">'+catalog.map(card).join('')+'</div><button type="submit" class="primary">Guardar en borrador</button></form></div></div>';
 c.querySelector('#colBack').onclick=draw;
 c.querySelectorAll('[data-cproduct]').forEach(b=>b.checked=selected.has(String(b.dataset.cproduct)));
 c.querySelector('#colFilter').oninput=e=>{const q=e.target.value.toLowerCase();c.querySelectorAll('#colProducts label').forEach(n=>n.style.display=n.textContent.toLowerCase().includes(q)?'flex':'none')};
 c.querySelector('#colForm').onsubmit=e=>{
  e.preventDefault();const name=c.querySelector('#colName').value.trim();if(!name)return;
  const ids=[...c.querySelectorAll('[data-cproduct]:checked')].map(b=>b.dataset.cproduct);
  const result={...x,name,slug:slug(name),description:c.querySelector('#colDescription').value.trim(),cover_url:c.querySelector('#colCover').value.trim(),product_ids:ids,updated_at:new Date().toISOString()};
  state=id?state.map(o=>o.id===id?result:o):[...state,result];
  draw();toast('Colección preparada: pulsa Guardar borradores');
 };
}
window.aihxoCollectionsView=async function(){
 const c=document.querySelector('#view');if(c)c.innerHTML='<div class="page"><div class="card">Cargando colecciones…</div></div>';
 try{await load();draw()}catch(e){console.error(e);if(c)c.innerHTML='<div class="page"><div class="card">Error al cargar colecciones: '+E(e.message||e)+'</div></div>'}
};
const oldSetView=window.setView;
window.setView=function(v){if(v==='aihxo-collections'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));window.aihxoCollectionsView();if(typeof closeMobileMenu==='function')closeMobileMenu();return}return oldSetView(v)};
function nav(){const parent=document.querySelector('#nav');if(!parent||parent.querySelector('[data-view="aihxo-collections"]'))return;const b=document.createElement('button');b.dataset.view='aihxo-collections';b.innerHTML='🎨 <span>Colecciones AIHXO</span>';b.onclick=()=>setView('aihxo-collections');(parent.querySelector('[data-view="products"]')||parent.lastElementChild)?.insertAdjacentElement('afterend',b)}
new MutationObserver(nav).observe(document.documentElement,{childList:true,subtree:true});nav();
})();