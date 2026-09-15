/* AIHXO · Integraciones de IA en dashboard y ficha de pedido */
(function(){
  const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=v=>String(v||'').trim().toLowerCase();

  async function ai(mode,prompt,context){
    try{
      const {data,error}=await supabaseClient.functions.invoke('aihxo-ai',{body:{mode,prompt,context}});
      if(error) throw error;
      if(data?.error) throw new Error(data.error);
      return data?.text||'Sin respuesta';
    }catch(err){
      throw new Error(err?.message||'No se pudo consultar AIHXO IA');
    }
  }

  function orderContext(o){
    return {
      pedido:{
        id:o.id,numero:o.order_number,cliente:o.customer_name,contacto:o.contact,
        producto:o.product_name,talla:o.size,color:o.color,cantidad:o.quantity,
        total:o.total,estado:o.status,fecha:o.order_date,produccion:o.production_status,
        aprobacion_diseno:o.design_approval_status,estado_diseno:o.design_status,
        estado_dtf:o.dtf_status,pago:o.payment_status,importe_pagado:o.amount_paid,
        brief:o.design_brief,notas_produccion:o.production_notes,notas_internas:o.internal_notes,
        origen_diseno:o.design_source,archivo_final_cliente:o.customer_file_final,
        ia_diseno_permitida:o.ai_design_allowed,
        archivo_delantero:!!o.design_front_path,archivo_trasero:!!o.design_back_path
      }
    };
  }

  function isProtected(o){return o?.design_source==='customer_final'||o?.customer_file_final===true||o?.ai_design_allowed===false;}

  const oldDashboard=window.dashboard;
  if(typeof oldDashboard==='function'){
    window.dashboard=async function(c){
      await oldDashboard(c);
      const page=c.querySelector('.page'); if(!page||page.querySelector('#aihxoDailyAI'))return;
      const current=(orders||[]).filter(o=>norm(o.status)!=='cancelado'&&norm(o.status)!=='entregado');
      const delayed=current.filter(o=>{
        const raw=o.order_date||o.created_at;if(!raw)return false;
        const d=new Date(raw);return !Number.isNaN(d.getTime())&&((Date.now()-d.getTime())/86400000)>=3&&!['terminado','listo','finalizado'].includes(norm(o.production_status));
      });
      const unpaid=(orders||[]).filter(o=>norm(o.status)!=='cancelado'&&Number(o.total||0)>Number(o.amount_paid||0));
      let low=[];
      try{const r=await supabaseClient.from('base_stock_items').select('supplier,supplier_model,size,color,quantity,min_stock').order('quantity',{ascending:true});low=(r.data||[]).filter(x=>Number(x.quantity||0)<=Number(x.min_stock??3));}catch(_){ }
      const recs=[];
      if(low.length)recs.push(`📦 Reponer ${low.length} variante${low.length===1?'':'s'} con stock bajo${low.some(x=>Number(x.quantity||0)<=0)?' (hay agotadas)':''}.`);
      if(delayed.length)recs.push(`🔴 Revisar ${delayed.length} pedido${delayed.length===1?'':'s'} con 3 días o más sin terminar.`);
      if(unpaid.length)recs.push(`💶 Hay ${unpaid.length} pedido${unpaid.length===1?'':'s'} con importe pendiente de cobro.`);
      if(!recs.length)recs.push('✅ No detecto incidencias operativas prioritarias ahora mismo.');
      const box=document.createElement('div');box.id='aihxoDailyAI';box.className='card';box.style.marginTop='14px';
      box.innerHTML=`<div class="section"><div><h2>🤖 Recomendaciones AIHXO</h2><div class="muted">Lectura rápida automática del negocio</div></div><button class="primary small" id="aihxoDailyAnalyze">Analizar con IA</button></div><div id="aihxoDailyList" style="display:grid;gap:8px">${recs.map(x=>`<div style="padding:10px 12px;background:#f6f8fb;border-radius:10px">${e(x)}</div>`).join('')}</div><div id="aihxoDailyResult" style="margin-top:10px;white-space:pre-wrap;line-height:1.5"></div>`;
      const firstGrid=page.querySelector('.grid.two');
      if(firstGrid) firstGrid.insertAdjacentElement('beforebegin',box); else page.prepend(box);
      box.querySelector('#aihxoDailyAnalyze').onclick=async()=>{
        const b=box.querySelector('#aihxoDailyAnalyze'),r=box.querySelector('#aihxoDailyResult');b.disabled=true;b.textContent='Analizando…';
        try{
          const context={pedidos_activos:current.slice(0,40),stock_bajo:low.slice(0,30),cobros_pendientes:unpaid.slice(0,30)};
          r.textContent=await ai('assistant','Dame las 3 prioridades más importantes de hoy para AIHXO. Sé breve y accionable.',context);
        }catch(err){r.textContent='⚠️ '+err.message;}finally{b.disabled=false;b.textContent='Analizar con IA';}
      };
    };
  }

  const oldOpen=window.abrirFichaPedido;
  if(typeof oldOpen==='function'){
    window.abrirFichaPedido=async function(id){
      await oldOpen(id);
      const o=(orders||[]).find(x=>x.id===id),body=document.getElementById('drawerBody');
      if(!o||!body||body.querySelector('#aihxoOrderAI'))return;
      const protectedDesign=isProtected(o);
      const card=document.createElement('div');card.id='aihxoOrderAI';card.className='card';card.style.marginTop='14px';
      card.innerHTML=`<div class="section"><div><h3 style="margin:0">🤖 IA para este pedido</h3><div class="muted">${protectedDesign?'🔒 Archivo final de cliente protegido · la IA no modifica el diseño':'Asistencia contextual sobre este encargo'}</div></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="primary small" id="pdAiAnalyze">Analizar pedido</button><button class="secondary small" id="pdAiCustomer">Mensaje al cliente</button><button class="secondary small" id="pdAiBrief" ${protectedDesign?'disabled title="Diseño final del cliente protegido"':''}>Brief de diseño</button></div>
      <div id="pdAiResult" style="margin-top:12px;white-space:pre-wrap;line-height:1.5"></div>`;
      const actions=body.lastElementChild; if(actions) body.insertBefore(card,actions); else body.appendChild(card);
      const run=async(type,prompt)=>{const r=card.querySelector('#pdAiResult');const buttons=card.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);r.textContent='Pensando…';try{r.textContent=await ai(type,prompt,orderContext(o));}catch(err){r.textContent='⚠️ '+err.message;}finally{buttons.forEach(b=>{if(!(b.id==='pdAiBrief'&&protectedDesign))b.disabled=false;});}};
      card.querySelector('#pdAiAnalyze').onclick=()=>run('order','Analiza este pedido: dime qué falta, riesgos, siguiente acción y cualquier incoherencia de producción, stock, diseño o cobro.');
      card.querySelector('#pdAiCustomer').onclick=()=>run('support','Redacta un mensaje breve y amable al cliente según el estado actual del pedido. Si no hace falta contactar, indícalo.');
      if(!protectedDesign)card.querySelector('#pdAiBrief').onclick=()=>run('designer','Crea un brief de diseño DTF usando exclusivamente los datos disponibles de este pedido. Si faltan datos esenciales, enuméralos primero.');
    };
  }
})();
