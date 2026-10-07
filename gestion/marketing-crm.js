/* AIHXO · Marketing CRM */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;const {E,N,EUR,norm,dtLabel}=M;
 M.tabs.leads=root=>{
   root.innerHTML=`${M.tabbar('leads')}<div class="section"><div><h3>Oportunidades comerciales</h3><div class="muted">Particulares, clubes, colegios y empresas</div></div><button class="primary" onclick="AIHXOMarketing.editLead()">＋ Nueva oportunidad</button></div><div class="card"><input id="mkLeadSearch" placeholder="Buscar contacto, empresa, origen…" oninput="AIHXOMarketing.filterLeads()"><div id="mkLeadList" style="margin-top:10px"></div></div>`;
   M.filterLeads();
 };
 M.filterLeads=()=>{
   const q=norm(document.querySelector('#mkLeadSearch')?.value||'');
   const rows=M.state.leads.filter(x=>!q||norm([x.name,x.organization,x.contact_name,x.phone,x.email,x.source,x.stage].join(' ')).includes(q));
   const box=document.querySelector('#mkLeadList');if(!box)return;
   box.innerHTML=rows.length?rows.map(x=>`<div class="card" style="margin-top:9px;box-shadow:none"><div class="section"><div><b>${E(x.name)}</b><div class="muted">${E(x.organization||x.contact_name||x.lead_type)} · ${E(x.source)}</div></div><div style="text-align:right"><b>${EUR(x.potential_value)}</b><div class="muted">${E(x.stage)} · ${N(x.probability)}%</div></div></div>${x.next_action?`<div class="muted">Siguiente: ${E(x.next_action)} · ${dtLabel(x.next_action_at)}</div>`:''}<button class="secondary" style="width:100%;margin-top:8px" onclick="AIHXOMarketing.editLead('${x.id}')">Abrir</button></div>`).join(''):'<div class="empty">Sin oportunidades.</div>';
 };
 M.editLead=id=>{
   const x=M.state.leads.find(y=>y.id===id)||{};
   const b=M.openDrawer(`<h2>${id?'Editar':'Nueva'} oportunidad</h2><form id="mkLeadForm" class="form">
   <div class="field"><label>Nombre</label><input name="name" required value="${E(x.name||'')}"></div>
   <div class="formgrid"><div class="field"><label>Organización</label><input name="organization" value="${E(x.organization||'')}"></div><div class="field"><label>Contacto</label><input name="contact_name" value="${E(x.contact_name||'')}"></div></div>
   <div class="formgrid"><div class="field"><label>Teléfono</label><input name="phone" value="${E(x.phone||'')}"></div><div class="field"><label>Email</label><input name="email" value="${E(x.email||'')}"></div></div>
   <div class="formgrid"><div class="field"><label>Tipo</label><select name="lead_type">${['particular','club','colegio','empresa','evento','colaborador'].map(v=>`<option ${x.lead_type===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Origen</label><select name="source">${['Instagram','TikTok','Facebook','Google','WhatsApp','Recomendación','Evento','Web','Prospección','Otro'].map(v=>`<option ${x.source===v?'selected':''}>${v}</option>`).join('')}</select></div></div>
   <div class="formgrid"><div class="field"><label>Estado</label><select name="stage">${['nuevo','contactado','interesado','presupuesto','negociacion','ganado','perdido'].map(v=>`<option ${x.stage===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Valor potencial €</label><input name="potential_value" type="number" step=".01" min="0" value="${N(x.potential_value)}"></div></div>
   <div class="field"><label>Probabilidad %</label><input name="probability" type="number" min="0" max="100" value="${N(x.probability||25)}"></div>
   <div class="field"><label>Campaña</label><select name="campaign_id"><option value="">Sin campaña</option>${M.state.campaigns.map(c=>`<option value="${c.id}" ${x.campaign_id===c.id?'selected':''}>${E(c.name)}</option>`).join('')}</select></div>
   <div class="formgrid"><div class="field"><label>Siguiente acción</label><input name="next_action" value="${E(x.next_action||'')}"></div><div class="field"><label>Cuándo</label><input name="next_action_at" type="datetime-local" value="${x.next_action_at?new Date(x.next_action_at).toISOString().slice(0,16):''}"></div></div>
   <div class="field"><label>Notas</label><textarea name="notes" rows="4">${E(x.notes||'')}</textarea></div>
   <button class="primary" style="width:100%">Guardar oportunidad</button></form>`);
   b.querySelector('#mkLeadForm').onsubmit=async e=>{
     e.preventDefault();const f=new FormData(e.currentTarget);
     const p={name:String(f.get('name')).trim(),organization:String(f.get('organization')||'').trim()||null,contact_name:String(f.get('contact_name')||'').trim()||null,phone:String(f.get('phone')||'').trim()||null,email:String(f.get('email')||'').trim()||null,lead_type:f.get('lead_type'),source:f.get('source'),stage:f.get('stage'),potential_value:N(f.get('potential_value')),probability:Math.max(0,Math.min(100,Math.round(N(f.get('probability'))))),campaign_id:f.get('campaign_id')||null,next_action:String(f.get('next_action')||'').trim()||null,next_action_at:f.get('next_action_at')?new Date(f.get('next_action_at')).toISOString():null,notes:String(f.get('notes')||'').trim(),updated_at:new Date().toISOString()};
     const r=await(id?supabaseClient.from('marketing_leads').update(p).eq('id',id):supabaseClient.from('marketing_leads').insert(p));if(r.error)return toast(r.error.message);toast('Oportunidad guardada');await M.refresh('leads');
   };
 };
})();