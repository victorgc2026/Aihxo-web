/* AIHXO · Reglas IA en alta de pedidos */
(function(){
  if(window.__aihxoIAAltaPedidosCargada) return;
  window.__aihxoIAAltaPedidosCargada=true;

  let pendingRule=null;
  const sourceInfo={
    customer_final:{label:'Archivo final del cliente',help:'La IA no modifica el diseño. Solo organización y control técnico.',final:true,allowed:false},
    customer_reference:{label:'Boceto o referencia del cliente',help:'La IA puede ayudar a desarrollar una propuesta a partir de la referencia.',final:false,allowed:true},
    aihxo:{label:'Diseño creado por AIHXO',help:'Diseño creado internamente sin intervención automática obligatoria.',final:false,allowed:true},
    ai_assisted:{label:'Diseño asistido por IA',help:'La IA puede ayudar con brief, propuesta y preparación del encargo.',final:false,allowed:true}
  };

  function activateRule(source){
    const cfg=sourceInfo[source]||sourceInfo.aihxo;
    pendingRule={
      design_source:source,
      customer_file_final:cfg.final,
      ai_design_allowed:cfg.allowed,
      ai_last_action:'new_order_design_source',
      ai_last_action_at:new Date().toISOString()
    };
    const help=document.getElementById('aihxoNewOrderAIHelp');
    if(help) help.innerHTML=cfg.final?'<b>🔒 Diseño protegido.</b> La IA no podrá modificarlo.':cfg.help;
  }

  function injectIntoDrawer(){
    const body=document.getElementById('drawerBody');
    if(!body||body.querySelector('#aihxoNewOrderAI')) return;
    const text=(body.textContent||'').toLowerCase();
    if(!text.includes('pedido')) return;
    const isNew=text.includes('nuevo pedido')||text.includes('crear pedido')||text.includes('añadir pedido');
    if(!isNew) return;

    const card=document.createElement('div');
    card.id='aihxoNewOrderAI';
    card.className='card';
    card.style.margin='0 0 14px';
    card.innerHTML=`<div class="section"><div><h3 style="margin:0">🤖 IA del pedido</h3><div class="muted">Define desde el principio qué puede hacer la IA con el diseño</div></div></div>
      <div class="field"><label>Origen del diseño</label><select id="aihxoNewOrderAISource">
        <option value="customer_final">Archivo final del cliente</option>
        <option value="customer_reference">Boceto o referencia del cliente</option>
        <option value="aihxo" selected>Diseño creado por AIHXO</option>
        <option value="ai_assisted">Diseño asistido por IA</option>
      </select></div>
      <div id="aihxoNewOrderAIHelp" class="muted" style="margin-top:8px">${sourceInfo.aihxo.help}</div>`;

    const first=body.firstElementChild;
    if(first) first.insertAdjacentElement('afterend',card); else body.prepend(card);
    const select=card.querySelector('#aihxoNewOrderAISource');
    select.addEventListener('change',()=>activateRule(select.value));
    activateRule(select.value);
  }

  const observer=new MutationObserver(()=>injectIntoDrawer());
  observer.observe(document.documentElement,{childList:true,subtree:true});

  const originalFrom=supabaseClient.from.bind(supabaseClient);
  supabaseClient.from=function(table){
    const builder=originalFrom(table);
    if(table==='orders'&&builder&&typeof builder.insert==='function'&&!builder.__aihxoAIWrapped){
      const originalInsert=builder.insert.bind(builder);
      builder.insert=function(values,options){
        if(pendingRule){
          const add=v=>({...v,...pendingRule});
          values=Array.isArray(values)?values.map(add):add(values||{});
          pendingRule=null;
        }
        return originalInsert(values,options);
      };
      builder.__aihxoAIWrapped=true;
    }
    return builder;
  };
})();
