/* AIHXO · Marketing de hoy */
(function(){
 const M=window.AIHXOMarketing;if(!M)return;
 const {E,N,EUR,norm,dateLabel,dtLabel}=M;
 function recovery(){
   const last=new Map();
   M.state.orders.filter(o=>norm(o.status)!=='cancelado').forEach(o=>{
     if(!o.customer_id)return;
     const d=new Date(o.order_date||o.created_at||0),cur=last.get(o.customer_id);
     if(!cur||d>cur)last.set(o.customer_id,d);
   });
   const cut=Date.now()-120*86400000;
   return M.state.customers.filter(c=>last.get(c.id)?.getTime()<cut).slice(0,8);
 }
 function upcoming(){
   const now=new Date();now.setHours(0,0,0,0);
   return M.state.calendar.filter(x=>{
     const d=new Date(x.event_date+'T00:00:00');
     const prep=new Date(d.getTime()-N(x.lead_days)*86400000);
     return d>=now&&prep<=new Date(now.getTime()+35*86400000);
   }).slice(0,6);
 }
 M.tabs.today=root=>{
   const week=Date.now()+7*86400000;
   const tasks=M.state.tasks.filter(x=>!['hecha','cancelada'].includes(x.status)&&x.due_at&&new Date(x.due_at).getTime()<=week);
   const leads=M.state.leads.filter(x=>!['ganado','perdido'].includes(x.stage)&&x.next_action_at&&new Date(x.next_action_at).getTime()<=week);
   const unattributed=M.state.orders.filter(x=>norm(x.status)!=='cancelado'&&!x.marketing_source).slice(0,8);
   const pipe=M.state.leads.filter(x=>!['ganado','perdido'].includes(x.stage)).reduce((a,x)=>a+N(x.potential_value)*N(x.probability)/100,0);
   root.innerHTML=`${M.tabbar('today')}
   <div class="grid kpis">${M.kpi('Pipeline',EUR(pipe))}${M.kpi('Leads abiertos',M.state.leads.filter(x=>!['ganado','perdido'].includes(x.stage)).length)}${M.kpi('Campañas activas',M.state.campaigns.filter(x=>x.status==='activa').length)}${M.kpi('Ventas sin origen',M.state.orders.filter(x=>norm(x.status)!=='cancelado'&&!x.marketing_source).length)}</div>
   <div class="grid two" style="margin-top:14px">
    <div class="card"><div class="section"><div><h3 style="margin:0">🎯 Marketing de hoy</h3><div class="muted">Acciones prioritarias</div></div></div>
      ${tasks.length?tasks.slice(0,5).map(x=>`<div class="statline"><span><b>${E(x.title)}</b><br><span class="muted">${dtLabel(x.due_at)}</span></span><button class="secondary small" onclick="AIHXOMarketing.finishTask('${x.id}')">Hecha</button></div>`).join(''):'<div class="empty">Sin tareas urgentes.</div>'}
      ${leads.slice(0,4).map(x=>`<div class="statline"><span><b>📞 ${E(x.name)}</b><br><span class="muted">${E(x.next_action||'Seguimiento')}</span></span><button class="secondary small" onclick="AIHXOMarketing.showTab('leads')">Abrir</button></div>`).join('')}
    </div>
    <div class="card"><h3 style="margin-top:0">📅 Próximas oportunidades</h3>
      ${upcoming().map(x=>`<div class="statline"><span><b>${E(x.title)}</b><br><span class="muted">${E(x.audience||'General')}</span></span><b>${dateLabel(x.event_date)}</b></div>`).join('')||'<div class="empty">Sin fechas próximas.</div>'}
    </div>
   </div>`;
 };
 M.finishTask=async id=>{const r=await supabaseClient.from('marketing_tasks').update({status:'hecha',completed_at:new Date().toISOString()}).eq('id',id);if(r.error)return toast(r.error.message);await M.refresh('today');};
})();