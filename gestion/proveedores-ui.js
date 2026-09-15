/* AIHXO · Proveedores */
(function(){
 const $=s=>document.querySelector(s);
 const esc=v=>String(v||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

 async function fetchSuppliers(){
   const {data,error}=await supabaseClient.from('suppliers').select('*').order('name');
   if(error){console.error(error);toast('No se pudieron cargar los proveedores');return []}
   return data||[];
 }

 function modalShell(title,subtitle){
   document.getElementById('supplierModal')?.remove();
   const m=document.createElement('div');m.id='supplierModal';
   m.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.48);display:flex;align-items:flex-end;justify-content:center';
   m.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-width:720px;max-height:94vh;overflow:auto;border-radius:22px 22px 0 0;padding:20px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0">${title}</h2><div style="color:#667085;font-size:14px;margin-top:3px">${subtitle||''}</div></div><button id="spClose" type="button" style="border:0;background:#eef1f5;border-radius:12px;padding:10px 13px">✕</button></div><div id="spBody" style="margin-top:16px"></div></div>`;
   document.body.appendChild(m);m.querySelector('#spClose').onclick=()=>m.remove();m.addEventListener('click',e=>{if(e.target===m)m.remove()});return m;
 }

 function supplierForm(v={}){
   return `<form id="spForm" class="form"><div class="field"><label>Nombre *</label><input name="name" required value="${esc(v.name||'')}" placeholder="Ej. Roly, Wordans, Proveedor DTF"></div><div class="field"><label>Persona de contacto</label><input name="contact" value="${esc(v.contact||'')}"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="field"><label>Teléfono</label><input name="phone" inputmode="tel" value="${esc(v.phone||'')}"></div><div class="field"><label>Email</label><input name="email" type="email" value="${esc(v.email||'')}"></div></div><div class="field"><label>Web</label><input name="website" type="url" value="${esc(v.website||'')}" placeholder="https://..."></div><div class="field"><label>Dirección</label><input name="address" value="${esc(v.address||'')}"></div><div style="display:grid;grid-template-columns:1fr 120px;gap:10px"><div class="field"><label>Ciudad</label><input name="city" value="${esc(v.city||'')}"></div><div class="field"><label>C.P.</label><input name="postal_code" value="${esc(v.postal_code||'')}"></div></div><div class="field"><label>Notas</label><textarea name="notes">${esc(v.notes||'')}</textarea></div><button class="primary" type="submit" style="width:100%">Guardar proveedor</button></form>`;
 }

 window.aihxoNuevoProveedor=async function(existing=null){
   const m=modalShell(existing?'✏️ Editar proveedor':'🏭 Nuevo proveedor',existing?'Actualiza sus datos':'Guárdalo para usarlo en Compras');
   m.querySelector('#spBody').innerHTML=supplierForm(existing||{});
   m.querySelector('#spForm').onsubmit=async e=>{e.preventDefault();const btn=e.submitter;btn.disabled=true;btn.textContent='Guardando…';const fd=new FormData(e.target),payload=Object.fromEntries(fd.entries());Object.keys(payload).forEach(k=>{if(payload[k]==='')payload[k]=null});let q;if(existing?.id)q=supabaseClient.from('suppliers').update(payload).eq('id',existing.id);else q=supabaseClient.from('suppliers').insert(payload);const {error}=await q;if(error){console.error(error);toast('No se pudo guardar el proveedor');btn.disabled=false;btn.textContent='Guardar proveedor';return}toast(existing?'Proveedor actualizado':'Proveedor añadido');m.remove();if(document.querySelector('#newPurchaseBtn'))comprasView($('#view'));};
 };

 window.aihxoGestionProveedores=async function(){
   const list=await fetchSuppliers();const m=modalShell('🏭 Proveedores','Alta, edición y consulta');
   const b=m.querySelector('#spBody');
   b.innerHTML=`<button id="spNew" class="primary" type="button" style="width:100%;margin-bottom:14px">＋ Nuevo proveedor</button><div style="display:grid;gap:10px">${list.length?list.map(s=>`<div style="border:1px solid #e5e9ef;border-radius:14px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center"><div><b>${esc(s.name)}</b><div style="font-size:13px;color:#667085;margin-top:3px">${esc([s.contact,s.phone,s.email].filter(Boolean).join(' · '))}</div>${s.website?`<div style="font-size:12px;color:#667085;margin-top:3px">${esc(s.website)}</div>`:''}</div><button class="secondary spEdit" type="button" data-id="${s.id}">Editar</button></div>`).join(''):'<div class="empty">Aún no hay proveedores.</div>'}</div>`;
   b.querySelector('#spNew').onclick=()=>{m.remove();window.aihxoNuevoProveedor()};b.querySelectorAll('.spEdit').forEach(btn=>btn.onclick=()=>{const s=list.find(x=>x.id===btn.dataset.id);m.remove();window.aihxoNuevoProveedor(s)});
 };

 function install(){
   const newBtn=document.querySelector('#newPurchaseBtn');if(!newBtn||document.querySelector('#supplierManageBtn'))return;
   const b=document.createElement('button');b.id='supplierManageBtn';b.type='button';b.className='secondary';b.textContent='🏭 Proveedores';b.onclick=()=>window.aihxoGestionProveedores();newBtn.insertAdjacentElement('beforebegin',b);
 }
 new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});setTimeout(install,300);
})();