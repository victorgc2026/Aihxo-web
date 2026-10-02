/* AIHXO · Producción TPV Kanban v1 */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const low=v=>String(v||'').trim().toLowerCase();
  const daysOld=o=>{const d=new Date(o.order_date||o.created_at||0);return Number.isNaN(d.getTime())?0:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000))};
  const stages=[
    {key:'pending',title:'Pendiente',icon:'🕒'},
    {key:'design',title:'Diseño',icon:'🎨'},
    {key:'garment',title:'Esperando prenda',icon:'👕'},
    {key:'dtf',title:'DTF',icon:'🖨️'},
    {key:'iron',title:'Plancha',icon:'🔥'},
    {key:'pack',title:'Empaquetado',icon:'📦'},
    {key:'delivered',title:'Entregado',icon:'✅'}
  ];

  function stageFor(o){
    if(low(o.status)==='entregado') return 'delivered';
    if(o.packed_at) return 'pack';
    if(o.ironed_at) return 'pack';

    const approval=low(o.design_approval_status);
    const needsDesign=['pendiente cliente','pendiente','boceto preparado','enviado al cliente','cambios solicitados'].includes(approval);
    if(needsDesign) return 'design';

    const hasBase=(o.base_stock_item_id || (Array.isArray(o.order_lines)&&o.order_lines.some(l=>l.item_id)));
    if(hasBase && o.base_stock_allocated!==true) return 'garment';
    if(low(o.production_status)==='pendiente llegada') return 'garment';

    const dtf=low(o.dtf_status);
    if(!['recibido','listo'].includes(dtf)) return 'dtf';

    if(!o.ironed_at) return 'iron';
    return 'pack';
  }

  function progressFor(o){
    const checks=[
      !['pendiente cliente','pendiente','cambios solicitados','boceto preparado','enviado al cliente'].includes(low(o.design_approval_status)),
      o.base_stock_allocated===true || !o.base_stock_item_id,
      ['recibido','listo'].includes(low(o.dtf_status)),
      !!o.ironed_at,
      !!o.packed_at,
      low(o.status)==='entregado'
    ];
    return Math.round(checks.filter(Boolean).length/checks.length*100);
  }

  function nextFor(stage){
    return ({pending:'design',design:'garment',garment:'dtf',dtf:'iron',iron:'pack',pack:'delivered'})[stage]||null;
  }

  function labelFor(key){return stages.find(s=>s.key===key)?.title||key}

  async function patchOrder(id,patch,msg){
    patch.production_updated_at=new Date().toISOString();
    const {error}=await supabaseClient.from('orders').update(patch).eq('id',id);
    if(error){console.error(error);toast(error.message||'No se pudo actualizar');return false}
    const o=orders.find(x=>String(x.id)===String(id));if(o)Object.assign(o,patch);
    toast(msg||'Producción actualizada');
    await window.produccionView?.(document.getElementById('view'));
    return true;
  }

  window.aihxoKanbanMove=async function(id,target){
    const o=orders.find(x=>String(x.id)===String(id));if(!o)return;
    const now=new Date().toISOString();

    if(target==='pending') return patchOrder(id,{status:'Pendiente',production_status:'Pendiente'},'Pedido movido a Pendiente');

    if(target==='design'){
      return patchOrder(id,{status:'Pendiente',design_approval_status:'Pendiente cliente',production_status:'Pendiente'},'Pedido movido a Diseño');
    }

    if(target==='garment'){
      if(o.base_stock_allocated===true){
        toast('La prenda ya está asignada; no se desasigna desde Producción');
        return false;
      }
      return patchOrder(id,{production_status:'Pendiente llegada'},'Pedido esperando prenda');
    }

    if(target==='dtf'){
      if(o.base_stock_item_id && o.base_stock_allocated!==true){
        toast('Primero debe estar asignada la prenda');
        return false;
      }
      return patchOrder(id,{design_approval_status:'Aprobado',dtf_status:'Pedido',production_status:'Pendiente'},'Pedido pasado a DTF');
    }

    if(target==='iron'){
      if(o.base_stock_item_id && o.base_stock_allocated!==true){
        toast('No puedes pasar a plancha sin prenda asignada');
        return false;
      }
      return patchOrder(id,{design_approval_status:'Aprobado',dtf_status:'Listo',production_status:'Lista para planchar'},'Pedido listo para planchar');
    }

    if(target==='pack'){
      return patchOrder(id,{ironed_at:o.ironed_at||now,production_status:'Terminado',status:'Terminado'},'Planchado terminado · listo para empaquetar');
    }

    if(target==='delivered'){
      return patchOrder(id,{ironed_at:o.ironed_at||now,packed_at:o.packed_at||now,production_status:'Terminado',status:'Entregado'},'Pedido entregado');
    }
  };

  window.aihxoKanbanNext=async function(id){
    const o=orders.find(x=>String(x.id)===String(id));if(!o)return;
    const current=stageFor(o),next=nextFor(current);
    if(!next)return;
    if(next==='garment' && o.base_stock_allocated===true) return window.aihxoKanbanMove(id,'dtf');
    return window.aihxoKanbanMove(id,next);
  };

  function card(o){
    const stage=stageFor(o),age=daysOld(o),pct=progressFor(o),due=Math.max(0,N(o.total)-N(o.amount_paid));
    return `
      <article class="kanban-card" draggable="true" data-order-id="${o.id}" data-stage="${stage}">
        <div class="kanban-card-top">
          <div><span class="tpv-eyebrow">${E(o.order_number||'PEDIDO')}</span><h4>${E(o.customer_name||'Sin cliente')}</h4></div>
          ${age>=3&&stage!=='delivered'?'<span class="kanban-age danger">⚠ '+age+' d</span>':'<span class="kanban-age">'+age+' d</span>'}
        </div>
        <div class="kanban-product">${E(o.product_name||o.design||'Pedido personalizado')}</div>
        <div class="kanban-meta">${E([o.size,o.color].filter(Boolean).join(' · '))}${o.quantity?' · '+N(o.quantity)+' ud.':''}</div>

        <div class="kanban-progress"><i style="width:${pct}%"></i></div>
        <div class="kanban-flags">
          <span class="${o.base_stock_allocated===true?'done':'wait'}">👕 ${o.base_stock_allocated===true?'Prenda OK':'Prenda'}</span>
          <span class="${['recibido','listo'].includes(low(o.dtf_status))?'done':'wait'}">🖨️ ${E(o.dtf_status||'Pendiente')}</span>
          <span class="${due<=.009?'done':'wait'}">💶 ${due<=.009?'Pagado':MONEY(due)}</span>
        </div>

        <div class="kanban-actions">
          <button class="secondary" onclick="window.abrirFichaPedido?.('${o.id}')">Ficha</button>
          ${stage!=='delivered'?'<button class="primary" onclick="window.aihxoKanbanNext(\''+o.id+'\')">Siguiente →</button>':''}
        </div>
      </article>`;
  }

  function MONEY(v){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v))}

  function bindDnD(root){
    root.querySelectorAll('.kanban-card').forEach(card=>{
      card.addEventListener('dragstart',e=>{
        e.dataTransfer.setData('text/plain',card.dataset.orderId);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend',()=>card.classList.remove('dragging'));
    });
    root.querySelectorAll('.kanban-column').forEach(col=>{
      col.addEventListener('dragover',e=>{e.preventDefault();col.classList.add('drag-over')});
      col.addEventListener('dragleave',()=>col.classList.remove('drag-over'));
      col.addEventListener('drop',async e=>{
        e.preventDefault();col.classList.remove('drag-over');
        const id=e.dataTransfer.getData('text/plain');
        if(id) await window.aihxoKanbanMove(id,col.dataset.stage);
      });
    });
  }

  window.produccionView=async function(c){
    const work=(orders||[]).filter(o=>low(o.status)!=='cancelado');
    const active=work.filter(o=>low(o.status)!=='entregado');
    const delivered=work.filter(o=>low(o.status)==='entregado').slice(0,12);
    const delayed=active.filter(o=>daysOld(o)>=3);
    const readyToIron=active.filter(o=>stageFor(o)==='iron').length;
    const waitingGarment=active.filter(o=>stageFor(o)==='garment').length;

    c.innerHTML=`
      <div class="page tpv-page production-tpv-page">
        <div class="tpv-hero">
          <div><div class="tpv-eyebrow">TALLER</div><h2>Producción</h2><p>Arrastra pedidos entre fases o usa “Siguiente”.</p></div>
          <button class="primary tpv-main-action" onclick="window.orderForm()">＋ Nuevo pedido</button>
        </div>

        <div class="tpv-metrics">
          <div class="tpv-metric"><div class="tpv-metric-icon">🧵</div><div><span>Activos</span><strong>${active.length}</strong><small>en curso</small></div></div>
          <div class="tpv-metric"><div class="tpv-metric-icon">⚠️</div><div><span>Con retraso</span><strong>${delayed.length}</strong><small>3 días o más</small></div></div>
          <div class="tpv-metric"><div class="tpv-metric-icon">👕</div><div><span>Esperando prenda</span><strong>${waitingGarment}</strong><small>sin asignar</small></div></div>
          <div class="tpv-metric"><div class="tpv-metric-icon">🔥</div><div><span>Para planchar</span><strong>${readyToIron}</strong><small>listos</small></div></div>
        </div>

        <div class="kanban-wrap">
          ${stages.map(st=>{
            const list=st.key==='delivered'?delivered:active.filter(o=>stageFor(o)===st.key);
            return `
              <section class="kanban-column" data-stage="${st.key}">
                <header><div><span>${st.icon}</span><b>${E(st.title)}</b></div><em>${list.length}</em></header>
                <div class="kanban-dropzone">
                  ${list.length?list.map(card).join(''):'<div class="kanban-empty">Sin pedidos</div>'}
                </div>
              </section>`;
          }).join('')}
        </div>
      </div>`;

    bindDnD(c);
  };
})();