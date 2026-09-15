(function(){
  const escAI = s => String(s ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const aiState = { tab:'assistant', busy:false };

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav || document.querySelector('#aihxoIaNav')) return;
    const btn=document.createElement('button');
    btn.id='aihxoIaNav'; btn.type='button';
    btn.innerHTML='🤖 <span>AIHXO IA</span>';
    btn.onclick=()=>{ window.aihxoIAView(); if(typeof closeMobileMenu==='function') closeMobileMenu(); };
    const marketing=[...nav.querySelectorAll('.muted')].find(x=>x.textContent.includes('MARKETING'));
    if(marketing) nav.insertBefore(btn,marketing); else nav.appendChild(btn);
  }

  function ctx(){
    const safeOrders=(window.orders||orders||[]).slice(0,100).map(o=>({
      id:o.id,order_number:o.order_number,customer_name:o.customer_name,product_name:o.product_name,size:o.size,color:o.color,quantity:o.quantity,total:o.total,status:o.status,order_date:o.order_date,production_status:o.production_status,payment_status:o.payment_status,design_status:o.design_status,design_source:o.design_source,customer_file_final:o.customer_file_final,ai_design_allowed:o.ai_design_allowed
    }));
    const safeProducts=(window.products||products||[]).slice(0,100).map(p=>({id:p.id,sku:p.sku,model:p.model,category:p.category,size:p.size,color:p.color,sale_price:p.sale_price,stock:p.stock,garment_cost:p.garment_cost,dtf_cost:p.dtf_cost,extras_cost:p.extras_cost}));
    const safeExpenses=(window.expenses||expenses||[]).slice(0,100).map(e=>({category:e.category,description:e.description,amount:e.amount,expense_date:e.expense_date}));
    return {orders:safeOrders,products:safeProducts,expenses:safeExpenses,customers_count:(window.customers||customers||[]).length};
  }

  async function callAI(mode,prompt,extra={}){
    if(aiState.busy) return;
    aiState.busy=true; setBusy(true);
    try{
      const {data,error}=await supabaseClient.functions.invoke('aihxo-ai',{body:{mode,prompt,context:extra.context||ctx(),...extra}});
      if(error) throw error;
      if(data?.error==='OPENAI_API_KEY_NOT_CONFIGURED') throw new Error('Falta configurar la clave de OpenAI en Supabase.');
      if(data?.error) throw new Error(data.error);
      return data;
    }catch(e){
      showResult('⚠️ '+escAI(e?.message||'No se pudo ejecutar la IA'));
      return null;
    }finally{ aiState.busy=false; setBusy(false); }
  }

  function setBusy(v){ document.querySelectorAll('.aihxo-ai-run').forEach(b=>{b.disabled=v;b.textContent=v?'Pensando…':(b.dataset.label||'Generar');}); }
  function showResult(html){ const x=document.querySelector('#aihxoAiResult'); if(x) x.innerHTML=html; }
  function textResult(t){ return `<div class="card" style="white-space:pre-wrap;line-height:1.55">${escAI(t||'Sin respuesta')}</div>`; }

  function shell(){
    return `<div class="page">
      <div class="section"><div><h2 style="margin:0">AIHXO IA</h2><div class="muted">Asistente de negocio, pedidos, diseño, marketing y atención</div></div></div>
      <div class="card" style="margin-bottom:14px;padding:10px;display:flex;gap:8px;flex-wrap:wrap">
        ${[['assistant','🧠 Negocio'],['order','📦 Pedido personalizado'],['designer','🎨 AIHXO Designer'],['marketing','📣 Marketing'],['support','💬 Atención']].map(([k,l])=>`<button class="${aiState.tab===k?'primary':'secondary'} aihxo-ai-tab" data-tab="${k}">${l}</button>`).join('')}
      </div>
      <div id="aihxoAiBody"></div><div id="aihxoAiResult" style="margin-top:14px"></div>
    </div>`;
  }

  function assistantUI(){return `<div class="card"><h3>Asistente de negocio</h3><p class="muted">Pregunta sobre pedidos, stock, ventas, gastos o clientes.</p><textarea id="aiPrompt" rows="5" placeholder="Ej.: ¿Qué tengo que reponer y qué pedidos requieren atención?"></textarea><div style="margin-top:10px"><button class="primary aihxo-ai-run" data-label="Analizar" id="aiRunAssistant">Analizar</button></div></div>`;}

  function orderUI(){
    const opts=(window.orders||orders||[]).slice(0,100).map(o=>`<option value="${o.id}">${escAI(o.order_number)} · ${escAI(o.customer_name)}</option>`).join('');
    return `<div class="grid two"><div class="card"><h3>Pedido personalizado</h3><label>Pedido</label><select id="aiOrderId"><option value="">Seleccionar…</option>${opts}</select><label style="margin-top:10px">Origen del diseño</label><select id="aiDesignSource"><option value="customer_final">Archivo final del cliente</option><option value="customer_reference">Boceto o referencia del cliente</option><option value="aihxo">Diseño creado por AIHXO</option><option value="ai_assisted">Diseño asistido por IA</option></select><div style="margin-top:10px"><button id="aiSaveOrderRule" class="primary">Guardar regla</button></div><div id="aiOrderRuleInfo" class="muted" style="margin-top:10px"></div></div><div class="card"><h3>Convertir petición en ficha</h3><textarea id="aiOrderPrompt" rows="8" placeholder="Pega aquí lo que pide el cliente…"></textarea><div style="margin-top:10px"><button class="primary aihxo-ai-run" data-label="Preparar ficha" id="aiRunOrder">Preparar ficha</button></div></div></div>`;
  }

  function designerUI(){return `<div class="card"><h3>AIHXO Designer</h3><p class="muted">Para ideas nuevas o bocetos. No modifica archivos finales de cliente protegidos.</p><textarea id="aiDesignerPrompt" rows="7" placeholder="Ej.: camiseta infantil 9/11, hockey, negra, estilo moderno, nombre Xoel…"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="primary aihxo-ai-run" data-label="Crear brief" id="aiRunDesigner">Crear brief</button><button class="secondary aihxo-ai-run" data-label="Generar imagen" id="aiRunDesignerImage">Generar imagen</button></div></div>`;}

  function marketingUI(){return `<div class="card"><h3>Marketing con IA</h3><textarea id="aiMarketingPrompt" rows="7" placeholder="Producto, colección u oferta que quieres promocionar…"></textarea><div style="margin-top:10px"><button class="primary aihxo-ai-run" data-label="Crear contenido" id="aiRunMarketing">Crear contenido</button></div></div>`;}

  function supportUI(){return `<div class="card"><h3>Atención al cliente</h3><textarea id="aiSupportPrompt" rows="7" placeholder="Pega la consulta del cliente…"></textarea><div style="margin-top:10px"><button class="primary aihxo-ai-run" data-label="Redactar respuesta" id="aiRunSupport">Redactar respuesta</button></div></div>`;}

  function renderTab(){
    const b=document.querySelector('#aihxoAiBody'); if(!b) return;
    b.innerHTML={assistant:assistantUI,order:orderUI,designer:designerUI,marketing:marketingUI,support:supportUI}[aiState.tab]();
    bindTabActions();
  }

  function bindTabActions(){
    document.querySelector('#aiRunAssistant')?.addEventListener('click',async()=>{const p=document.querySelector('#aiPrompt').value.trim();if(!p)return;const d=await callAI('assistant',p);if(d)showResult(textResult(d.text));});
    document.querySelector('#aiRunOrder')?.addEventListener('click',async()=>{const p=document.querySelector('#aiOrderPrompt').value.trim();if(!p)return;const d=await callAI('order',p);if(d)showResult(textResult(d.text));});
    document.querySelector('#aiRunDesigner')?.addEventListener('click',async()=>{const p=document.querySelector('#aiDesignerPrompt').value.trim();if(!p)return;const d=await callAI('designer',p);if(d)showResult(textResult(d.text));});
    document.querySelector('#aiRunDesignerImage')?.addEventListener('click',async()=>{const p=document.querySelector('#aiDesignerPrompt').value.trim();if(!p)return;const d=await callAI('designer',p,{generate_image:true,context:{production_rules:'Arte para camiseta/DTF. Fondo transparente si es viable. No incluir mockup salvo que se pida.'}});if(!d)return;let h=d.text?textResult(d.text):'';if(d.images?.length){h+=d.images.map((x,i)=>`<div class="card" style="margin-top:10px"><img alt="Diseño IA ${i+1}" src="data:image/png;base64,${x}" style="max-width:100%;height:auto;border-radius:12px"><div style="margin-top:8px"><a class="primary" download="aihxo-diseno-ia-${Date.now()}-${i+1}.png" href="data:image/png;base64,${x}">Guardar PNG</a></div></div>`).join('');}showResult(h||'<div class="card">No se generó imagen.</div>');});
    document.querySelector('#aiRunMarketing')?.addEventListener('click',async()=>{const p=document.querySelector('#aiMarketingPrompt').value.trim();if(!p)return;const d=await callAI('marketing',p);if(d)showResult(textResult(d.text));});
    document.querySelector('#aiRunSupport')?.addEventListener('click',async()=>{const p=document.querySelector('#aiSupportPrompt').value.trim();if(!p)return;const d=await callAI('support',p);if(d)showResult(textResult(d.text));});

    const orderSelect=document.querySelector('#aiOrderId');
    orderSelect?.addEventListener('change',()=>{
      const o=(window.orders||orders||[]).find(x=>x.id===orderSelect.value); if(!o)return;
      document.querySelector('#aiDesignSource').value=o.design_source||((o.design_front_path||o.design_back_path)?'customer_final':'aihxo');
      document.querySelector('#aiOrderRuleInfo').innerHTML=(o.customer_file_final||o.ai_design_allowed===false)?'<b>🔒 Diseño protegido:</b> la IA no puede modificarlo.':'IA disponible para este pedido.';
    });
    document.querySelector('#aiSaveOrderRule')?.addEventListener('click',async()=>{
      const id=document.querySelector('#aiOrderId').value, source=document.querySelector('#aiDesignSource').value; if(!id)return;
      const final=source==='customer_final';
      const {error}=await supabaseClient.from('orders').update({design_source:source,customer_file_final:final,ai_design_allowed:!final,ai_last_action:'design_source_updated',ai_last_action_at:new Date().toISOString()}).eq('id',id);
      if(error){toast('No se pudo guardar');return;}
      const o=(window.orders||orders||[]).find(x=>x.id===id);if(o){o.design_source=source;o.customer_file_final=final;o.ai_design_allowed=!final;}
      document.querySelector('#aiOrderRuleInfo').innerHTML=final?'<b>🔒 Archivo final protegido.</b> La IA solo podrá hacer controles técnicos/administrativos.':'Regla guardada. La IA puede asistir en el diseño.';
      toast('Regla de IA guardada');
    });
  }

  window.aihxoIAView=function(){
    const view=document.querySelector('#view'); if(!view)return;
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('#aihxoIaNav')?.classList.add('active');
    const title=document.querySelector('#title'); if(title)title.textContent='AIHXO IA';
    view.innerHTML=shell();
    document.querySelectorAll('.aihxo-ai-tab').forEach(b=>b.onclick=()=>{aiState.tab=b.dataset.tab;window.aihxoIAView();});
    renderTab();
  };

  const mo=new MutationObserver(()=>injectNav()); mo.observe(document.documentElement,{childList:true,subtree:true}); injectNav();
})();