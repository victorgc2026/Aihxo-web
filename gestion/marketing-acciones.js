/* AIHXO · Marketing acciones */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;const {E,EUR}=M;
 M.attributeOrder=id=>{
   const o=M.state.orders.find(x=>x.id===id);if(!o)return;
   const b=M.openDrawer(`<h2>Origen de ${E(o.order_number)}</h2><div class="muted" style="margin-bottom:12px">${E(o.customer_name)} · ${EUR(o.total)}</div><form id="mkAttrForm" class="form"><div class="field"><label>Origen</label><select name="source"><option value="">Selecciona</option>${['Instagram','TikTok','Facebook','Google','WhatsApp','Web','Recomendación','Evento','Cliente recurrente','Prospección','Otro'].map(v=>`<option ${o.marketing_source===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Campaña</label><select name="campaign"><option value="">Sin campaña</option>${M.state.campaigns.map(c=>`<option value="${c.id}" ${o.marketing_campaign_id===c.id?'selected':''}>${E(c.name)}</option>`).join('')}</select></div><div class="field"><label>Código referido</label><input name="referral" value="${E(o.referral_code||'')}"></div><button class="primary" style="width:100%">Guardar origen</button></form>`);
   b.querySelector('#mkAttrForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const r=await supabaseClient.from('orders').update({marketing_source:f.get('source')||null,marketing_campaign_id:f.get('campaign')||null,referral_code:String(f.get('referral')||'').trim()||null}).eq('id',id);if(r.error)return toast(r.error.message);toast('Origen guardado');await M.refresh('today');};
 };
 M.createRecoveryLead=async customerId=>{
   const c=M.state.customers.find(x=>x.id===customerId);if(!c)return;
   const name=[c.name,c.surname].filter(Boolean).join(' ');
   const r=await supabaseClient.from('marketing_leads').insert({name:'Recuperar · '+name,contact_name:name,phone:c.phone||c.contact||null,email:c.email||null,lead_type:'particular',source:'Cliente recurrente',stage:'nuevo',customer_id:c.id,next_action:'Contactar para recuperar cliente',next_action_at:new Date().toISOString(),notes:'Creado desde Marketing de hoy'});
   if(r.error)return toast(r.error.message);toast('Seguimiento creado');await M.refresh('today');
 };
 M.newTask=()=>{
   const b=M.openDrawer(`<h2>Nueva tarea de marketing</h2><form id="mkTaskForm" class="form"><div class="field"><label>Tarea</label><input name="title" required></div><div class="formgrid"><div class="field"><label>Prioridad</label><select name="priority"><option>baja</option><option selected>media</option><option>alta</option><option>urgente</option></select></div><div class="field"><label>Fecha / hora</label><input name="due_at" type="datetime-local"></div></div><div class="field"><label>Notas</label><textarea name="notes" rows="3"></textarea></div><button class="primary" style="width:100%">Guardar tarea</button></form>`);
   b.querySelector('#mkTaskForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const r=await supabaseClient.from('marketing_tasks').insert({title:String(f.get('title')).trim(),priority:f.get('priority'),due_at:f.get('due_at')?new Date(f.get('due_at')).toISOString():null,notes:String(f.get('notes')||'').trim()});if(r.error)return toast(r.error.message);toast('Tarea guardada');await M.refresh('today');};
 };
})();