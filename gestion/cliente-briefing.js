/* AIHXO · Portal cliente: briefing + aprobación firmada · v1 */
(function(){
  const FN='https://zoiesxtchnesrilpuqek.supabase.co/functions/v1/client-briefing';

  async function call(action,payload={}){
    const {data:{session}}=await supabaseClient.auth.getSession();
    if(!session) throw new Error('Sesión no disponible');
    const r=await fetch(FN,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({action,...payload})
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error||'No se pudo completar la operación');
    return j;
  }

  async function shareLink(url,title){
    if(navigator.share){
      try{await navigator.share({title,text:'AIHXO · '+title,url});return;}catch(e){if(e?.name==='AbortError')return;}
    }
    await navigator.clipboard.writeText(url);
    toast('Enlace copiado');
  }

  window.crearEnlaceBriefingClienteAIHXO=async function(orderId){
    try{
      const j=await call('create_link',{order_id:orderId,kind:'briefing'});
      await shareLink(j.url,'Briefing del pedido');
    }catch(e){console.error(e);toast(e.message||'No se pudo crear el enlace');}
  };

  window.crearEnlaceAprobacionClienteAIHXO=async function(orderId){
    try{
      const j=await call('create_link',{order_id:orderId,kind:'design_approval'});
      await shareLink(j.url,'Aprobación de diseño');
    }catch(e){console.error(e);toast(e.message||'No se pudo crear el enlace');}
  };

  window.verEstadoClienteAIHXO=async function(orderId){
    try{
      const j=await call('status',{order_id:orderId});
      const rows=j.rows||[];
      const body=document.getElementById('drawerBody');
      const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      body.innerHTML='<h2>✍️ Cliente · Briefing y firmas</h2>'+
        (rows.length?rows.map(x=>'<div class="card" style="margin:10px 0;box-shadow:none"><div class="section"><div><b>'+E(x.kind==='briefing'?'Briefing inicial':'Aprobación de diseño')+' · v'+x.version+'</b><div class="muted">'+E(x.client_name||'Cliente')+'</div></div><b>'+E(x.status)+'</b></div><div class="muted">Creado: '+new Date(x.created_at).toLocaleString('es-ES')+(x.submitted_at?' · Firmado: '+new Date(x.submitted_at).toLocaleString('es-ES'):'')+'</div></div>').join(''):'<div class="empty">Todavía no hay enlaces generados.</div>')+
        '<div style="display:grid;gap:8px;margin-top:14px"><button class="primary" onclick="crearEnlaceBriefingClienteAIHXO(\''+orderId+'\')">📨 Crear / enviar briefing</button><button class="secondary" onclick="crearEnlaceAprobacionClienteAIHXO(\''+orderId+'\')">✍️ Crear aprobación final</button></div>';
    }catch(e){console.error(e);toast(e.message||'No se pudo consultar el estado');}
  };

  function addButtons(orderId){
    const host=document.querySelector('.aihxo-tech-sheet .section');
    if(!host||host.querySelector('[data-client-briefing-actions]'))return;
    const wrap=document.createElement('div');
    wrap.dataset.clientBriefingActions='1';
    wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;width:100%;margin-top:8px';
    wrap.innerHTML='<button class="primary small" type="button">📨 Briefing cliente</button><button class="secondary small" type="button">✍️ Aprobación diseño</button><button class="secondary small" type="button">🧾 Estado firmas</button>';
    const [a,b,c]=wrap.querySelectorAll('button');
    a.onclick=()=>window.crearEnlaceBriefingClienteAIHXO(orderId);
    b.onclick=()=>window.crearEnlaceAprobacionClienteAIHXO(orderId);
    c.onclick=()=>window.verEstadoClienteAIHXO(orderId);
    host.appendChild(wrap);
  }

  const oldTech=window.abrirFichaTecnicaAIHXO;
  if(typeof oldTech==='function'){
    window.abrirFichaTecnicaAIHXO=async function(orderId){
      await oldTech(orderId);
      addButtons(orderId);
    };
  }

  const oldCustom=window.abrirPedidoPersonalizado;
  if(typeof oldCustom==='function'){
    window.abrirPedidoPersonalizado=async function(orderId){
      await oldCustom(orderId);
      const body=document.getElementById('drawerBody');
      if(body&&!body.querySelector('[data-client-portal-card]')){
        const card=document.createElement('div');
        card.dataset.clientPortalCard='1';
        card.className='card';
        card.style.cssText='padding:16px;margin-top:12px;box-shadow:none';
        card.innerHTML='<h3 style="margin-top:0">✍️ Portal del cliente</h3><div class="muted" style="margin-bottom:10px">Briefing, firma y aprobación del diseño vinculados a este pedido.</div><div style="display:grid;gap:8px"><button class="primary">📨 Enviar briefing al cliente</button><button class="secondary">✍️ Enviar diseño para aprobar</button><button class="secondary">🧾 Ver estado de firmas</button></div>';
        const [a,b,c]=card.querySelectorAll('button');
        a.onclick=()=>window.crearEnlaceBriefingClienteAIHXO(orderId);
        b.onclick=()=>window.crearEnlaceAprobacionClienteAIHXO(orderId);
        c.onclick=()=>window.verEstadoClienteAIHXO(orderId);
        body.appendChild(card);
      }
    };
  }
})();