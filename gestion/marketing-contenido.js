/* AIHXO · Marketing contenido */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;const {E}=M;
 M.tabs.content=root=>{
   root.innerHTML=`${M.tabbar('content')}<div class="section"><div><h3>Banco y planificador de contenidos</h3><div class="muted">Idea → preparar → listo → programado → publicado</div></div><div style="display:flex;gap:8px"><button class="secondary" onclick="aihxoMarketingProView?.()">✨ Generador IA</button><button class="primary" onclick="AIHXOMarketing.editContent()">＋ Contenido</button></div></div>
   <div style="display:grid;gap:9px">${M.state.content.length?M.state.content.map(x=>`<div class="card"><div class="section"><div><b>${E(x.title)}</b><div class="muted">${E(x.channel)} · ${E(x.content_type)} · ${E(x.status)}${x.scheduled_at?' · '+M.dtLabel(x.scheduled_at):''}</div></div><button class="secondary small" onclick="AIHXOMarketing.editContent('${x.id}')">Editar</button></div>${x.hook?`<div style="margin-top:7px"><b>Gancho:</b> ${E(x.hook)}</div>`:''}</div>`).join(''):'<div class="card"><div class="empty">No hay contenido guardado.</div></div>'}</div>`;
 };
 M.editContent=id=>{
   const x=M.state.content.find(y=>y.id===id)||{};
   const b=M.openDrawer(`<h2>${id?'Editar':'Nuevo'} contenido</h2><form id="mkContentForm" class="form">
   <div class="field"><label>Título interno</label><input name="title" required value="${E(x.title||'')}"></div>
   <div class="formgrid"><div class="field"><label>Canal</label><select name="channel">${['Instagram','TikTok','Facebook','WhatsApp','Web','Email'].map(v=>`<option ${x.channel===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Tipo</label><select name="content_type">${['post','reel','story','video','anuncio','email','web'].map(v=>`<option ${x.content_type===v?'selected':''}>${v}</option>`).join('')}</select></div></div>
   <div class="formgrid"><div class="field"><label>Estado</label><select name="status">${['idea','preparar','listo','programado','publicado','descartado'].map(v=>`<option ${x.status===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Programado</label><input name="scheduled_at" type="datetime-local" value="${x.scheduled_at?new Date(x.scheduled_at).toISOString().slice(0,16):''}"></div></div>
   <div class="field"><label>Campaña</label><select name="campaign_id"><option value="">Sin campaña</option>${M.state.campaigns.map(c=>`<option value="${c.id}" ${x.campaign_id===c.id?'selected':''}>${E(c.name)}</option>`).join('')}</select></div>
   <div class="field"><label>Gancho</label><input name="hook" value="${E(x.hook||'')}"></div>
   <div class="field"><label>Texto / caption</label><textarea name="caption" rows="5">${E(x.caption||'')}</textarea></div>
   <div class="field"><label>CTA</label><input name="cta" value="${E(x.cta||'')}"></div>
   <div class="field"><label>Hashtags</label><textarea name="hashtags" rows="2">${E(x.hashtags||'')}</textarea></div>
   <button class="primary" style="width:100%">Guardar contenido</button></form>`);
   b.querySelector('#mkContentForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const p={title:String(f.get('title')).trim(),channel:f.get('channel'),content_type:f.get('content_type'),status:f.get('status'),scheduled_at:f.get('scheduled_at')?new Date(f.get('scheduled_at')).toISOString():null,campaign_id:f.get('campaign_id')||null,hook:String(f.get('hook')||'').trim()||null,caption:String(f.get('caption')||'').trim()||null,cta:String(f.get('cta')||'').trim()||null,hashtags:String(f.get('hashtags')||'').trim()||null,updated_at:new Date().toISOString()};const r=await(id?supabaseClient.from('marketing_content').update(p).eq('id',id):supabaseClient.from('marketing_content').insert(p));if(r.error)return toast(r.error.message);toast('Contenido guardado');await M.refresh('content');};
 };
})();