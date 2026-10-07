/* AIHXO · Marketing ERP core */
(function(){
  if(window.AIHXOMarketing)return;
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const EUR=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const dateLabel=v=>v?new Date(v).toLocaleDateString('es-ES'):'—';
  const dtLabel=v=>v?new Date(v).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}):'—';
  const today=()=>new Date().toISOString().slice(0,10);
  const M={state:{campaigns:[],performance:[],leads:[],content:[],calendar:[],tasks:[],referrals:[],metrics:[],orders:[],customers:[],products:[]},tabs:{},E,N,EUR,norm,dateLabel,dtLabel,today};

  M.openDrawer=html=>{const d=document.querySelector('#drawer'),b=document.querySelector('#drawerBody');if(!d||!b)return null;b.innerHTML=html;d.classList.remove('hidden');return b;};
  M.kpi=(t,v,s='')=>`<div class="card" style="padding:14px"><div class="muted" style="font-size:11px;font-weight:900">${E(t)}</div><div style="font-size:24px;font-weight:900;margin-top:3px">${E(v)}</div>${s?`<div class="muted" style="font-size:12px;margin-top:2px">${E(s)}</div>`:''}</div>`;

  M.load=async()=>{
    const cfg=[
      ['campaigns','marketing_campaigns','*','created_at',false],
      ['performance','marketing_campaign_performance','*','start_date',false],
      ['leads','marketing_leads','*','updated_at',false],
      ['content','marketing_content','*','scheduled_at',true],
      ['calendar','marketing_calendar','*','event_date',true],
      ['tasks','marketing_tasks','*','due_at',true],
      ['referrals','marketing_referrals','*','created_at',false],
      ['metrics','marketing_channel_metrics','*','metric_date',false]
    ];
    for(const [key,table,sel,ord,asc] of cfg){const r=await supabaseClient.from(table).select(sel).order(ord,{ascending:asc});if(r.error)throw new Error(key+': '+r.error.message);M.state[key]=r.data||[];}
    const [o,c,p]=await Promise.all([
      supabaseClient.from('orders').select('id,order_number,customer_id,customer_name,total,status,order_date,created_at,product_name,marketing_source,marketing_campaign_id,marketing_lead_id,referral_code,garment_actual_cost,dtf_actual_cost,packaging_cost,supplier_shipping_cost,extras_actual_cost,outbound_shipping_cost').order('created_at',{ascending:false}).limit(500),
      supabaseClient.from('customers').select('id,name,surname,email,phone,contact,customer_segment,acquisition_source,marketing_consent,birthday,last_marketing_contact_at,created_at').order('name'),
      supabaseClient.from('products').select('id,sku,model,category,sale_price,commercial_visibility').order('model')
    ]);
    if(o.error||c.error||p.error)throw new Error((o.error||c.error||p.error).message);
    M.state.orders=o.data||[];M.state.customers=c.data||[];M.state.products=p.data||[];
    await M.ensureCalendar();
  };

  M.ensureCalendar=async()=>{
    if(M.state.calendar.length)return;
    const rows=[
      ['Halloween','2026-10-31','comercial',21,'Infantil y adulto',true,'Campaña temática y personalización'],
      ['Black Friday','2026-11-27','promocion',21,'General',false,'Promoción con margen controlado'],
      ['Navidad','2026-12-25','comercial',45,'Regalos y personalización',true,'Catálogo regalo y fecha límite'],
      ['Reyes','2027-01-06','comercial',35,'Regalos',true,'Regalos personalizados'],
      ['San Valentín','2027-02-14','comercial',30,'Parejas y regalos',true,'Memories y personalización'],
      ['Día del Padre','2027-03-19','comercial',30,'Familias',true,'Regalo personalizado'],
      ['Día de la Madre','2027-05-02','comercial',30,'Familias',false,'Regalo personalizado'],
      ['Día de Galicia','2027-07-25','local',30,'Galicia',true,'Identidad gallega estilo AIHXO'],
      ['Vuelta al cole','2027-09-01','comercial',30,'Familias, colegios y clubes',true,'Prospección colegios y equipos']
    ].map(x=>({title:x[0],event_date:x[1],event_type:x[2],lead_days:x[3],audience:x[4],recurring_yearly:x[5],source:'AIHXO inicial',notes:x[6]}));
    const r=await supabaseClient.from('marketing_calendar').insert(rows).select('*');
    if(!r.error)M.state.calendar=r.data||[];
  };

  M.tabbar=active=>{const a=[['today','Hoy'],['leads','Oportunidades'],['campaigns','Campañas'],['content','Contenido'],['calendar','Calendario'],['channels','Canales / ROI'],['referrals','Referidos']];return `<div style="display:flex;gap:7px;overflow:auto;padding-bottom:4px;margin:12px 0">${a.map(([id,l])=>`<button type="button" class="${active===id?'primary':'secondary'}" onclick="AIHXOMarketing.showTab('${id}')">${l}</button>`).join('')}</div>`;};
  M.showTab=tab=>{const root=document.querySelector('#mkCenterBody');if(!root)return;(M.tabs[tab]||M.tabs.today||(()=>{}))(root);};
  M.refresh=async(tab='today')=>{await M.load();M.showTab(tab);if(typeof closeDrawer==='function')closeDrawer();};

  M.view=async()=>{
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('#aihxoMarketingNav')?.classList.add('active');
    const title=document.querySelector('#title');if(title)title.textContent='Marketing';
    const v=document.querySelector('#view');if(!v)return;v.innerHTML='<div class="page"><div class="card">Cargando centro de marketing…</div></div>';
    try{await M.load();v.innerHTML=`<div class="page"><div class="section"><div><h2 style="margin:0">📣 Centro de Marketing</h2><div class="muted">CRM, campañas, contenido y rentabilidad</div></div><button class="secondary" onclick="aihxoMarketingProView?.()">✨ Marketing IA</button></div><div id="mkCenterBody"></div></div>`;M.showTab('today');}catch(e){console.error(e);v.innerHTML=`<div class="page"><div class="card">No se pudo cargar Marketing.<div class="muted">${E(e.message||e)}</div></div></div>`;}
    if(typeof closeMobileMenu==='function')closeMobileMenu();
  };

  window.AIHXOMarketing=M;
  const oldSet=window.setView;
  window.setView=function(v){
    if(v==='marketing-center'){M.view();return;}
    return typeof oldSet==='function' ? oldSet(v) : undefined;
  };
  const wire=()=>{
    const b=document.querySelector('#aihxoMarketingNav');
    if(!b || b.dataset.marketingCenterWired==='1') return;
    b.dataset.marketingCenterWired='1';
    b.innerHTML='📣 <span>Marketing</span>';
    b.onclick=()=>window.setView('marketing-center');
  };
  const observer=new MutationObserver(wire);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(wire,0);
})();