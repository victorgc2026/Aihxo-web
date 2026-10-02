/* AIHXO · Caja TPV v1 */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const M=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
  const pending=o=>Math.max(0,N(o.total)-N(o.amount_paid));
  const methods=['Efectivo','Bizum','Transferencia','Tarjeta','PayPal','Otro'];
  const iconFor=m=>({Efectivo:'💶',Bizum:'📱',Transferencia:'🏦',Tarjeta:'💳',PayPal:'🅿️',Otro:'＋'}[m]||'💰');
  let list=[],payments=[],selectedMethod={},saving=new Set(),requestIds=new Map();

  async function loadData(){
    const [a,b]=await Promise.all([
      supabaseClient.from('orders').select('*').order('created_at',{ascending:false}),
      supabaseClient.from('order_payments').select('*').order('paid_at',{ascending:false})
    ]);
    if(a.error||b.error)throw(a.error||b.error);
    list=a.data||[];payments=b.data||[];
  }

  window.cajaCobrosView=async function(c){
    c.innerHTML='<div class="page"><div class="tpv-loading">Cargando caja…</div></div>';
    try{await loadData()}catch(e){console.error(e);c.innerHTML='<div class="page"><div class="tpv-empty">No se pudo cargar la caja.</div></div>';return}

    const active=list.filter(o=>String(o.status||'').toLowerCase()!=='cancelado');
    const totalSales=active.reduce((a,o)=>a+N(o.total),0);
    const totalPaid=active.reduce((a,o)=>a+N(o.amount_paid),0);
    const totalPending=active.reduce((a,o)=>a+pending(o),0);

    c.innerHTML=`
      <div class="page tpv-page">
        <div class="tpv-hero">
          <div><div class="tpv-eyebrow">CAJA</div><h2>Cobros</h2><p>Registra pagos y devoluciones como en un TPV.</p></div>
          <button class="primary tpv-main-action" onclick="setView('orders')">📦 Ver pedidos</button>
        </div>

        <div class="tpv-metrics">
          <div class="tpv-metric"><div class="tpv-metric-icon">🧾</div><div><span>Ventas</span><strong>${M(totalSales)}</strong><small>pedidos activos</small></div></div>
          <div class="tpv-metric"><div class="tpv-metric-icon">✅</div><div><span>Cobrado</span><strong>${M(totalPaid)}</strong><small>registrado</small></div></div>
          <div class="tpv-metric"><div class="tpv-metric-icon">⏳</div><div><span>Pendiente</span><strong>${M(totalPending)}</strong><small>por cobrar</small></div></div>
        </div>

        <div class="tpv-cash-toolbar">
          <div class="stock-matrix-search"><span>⌕</span><input id="cashSearch" type="search" placeholder="Buscar cliente o pedido…"></div>
          <select id="cashFilter"><option value="pending">Pendientes</option><option value="paid">Pagados</option><option value="all">Todos</option></select>
        </div>

        <div id="cashList" class="tpv-cash-list"></div>
      </div>`;

    if(window._aihxoCashFocus){
      const focus=list.find(o=>o.id===window._aihxoCashFocus);
      document.getElementById('cashFilter').value='all';
      document.getElementById('cashSearch').value=focus?.order_number||'';
      window._aihxoCashFocus=null;
    }

    document.getElementById('cashFilter').onchange=window.dibujarCajaCobros;
    document.getElementById('cashSearch').oninput=window.dibujarCajaCobros;
    window.dibujarCajaCobros();
  };

  window.dibujarCajaCobros=function(){
    const mode=document.getElementById('cashFilter')?.value||'pending';
    const q=String(document.getElementById('cashSearch')?.value||'').toLowerCase();
    const holder=document.getElementById('cashList');if(!holder)return;
    const rows=list.filter(o=>{
      const hit=(String(o.order_number||'')+' '+String(o.customer_name||'')).toLowerCase().includes(q);
      if(!hit)return false;
      if(mode==='pending')return pending(o)>.009 && String(o.status||'').toLowerCase()!=='cancelado';
      if(mode==='paid')return pending(o)<=.009;
      return true;
    });

    holder.innerHTML=rows.length?rows.map(o=>{
      const due=pending(o), ps=payments.filter(p=>p.order_id===o.id), paid=N(o.amount_paid), pct=N(o.total)?Math.min(100,Math.round(paid/N(o.total)*100)):0;
      const method=selectedMethod[o.id]||'';
      return `
        <article class="tpv-cash-card" data-order-id="${o.id}">
          <div class="tpv-cash-head">
            <div>
              <div class="tpv-eyebrow">${E(o.order_number||'PEDIDO')}</div>
              <h3>${E(o.customer_name||'Sin cliente')}</h3>
              <small>${E(o.status||'')}</small>
            </div>
            <div class="tpv-cash-total"><span>Pendiente</span><strong>${M(due)}</strong></div>
          </div>

          <div class="tpv-pay-bar"><i style="width:${pct}%"></i></div>
          <div class="tpv-cash-summary"><span>Total <b>${M(o.total)}</b></span><span>Cobrado <b>${M(paid)}</b></span></div>

          <div class="tpv-cash-amount">
            <label>Importe a cobrar</label>
            <div class="tpv-cash-amount-row">
              <input id="cashAmount-${o.id}" type="number" min=".01" step=".01" value="${due>0?due.toFixed(2):''}" placeholder="0,00">
              <button type="button" class="secondary" onclick="document.getElementById('cashAmount-${o.id}').value='${due.toFixed(2)}'">Cobrar todo</button>
            </div>
          </div>

          <div class="tpv-methods">
            ${methods.map(m=>`<button type="button" class="tpv-method ${method===m?'selected':''}" onclick="window.selectCashMethod('${o.id}','${m}')"><span>${iconFor(m)}</span><b>${m}</b></button>`).join('')}
          </div>

          <div class="tpv-cash-extra">
            <input id="cashNote-${o.id}" placeholder="Nota opcional">
            <input id="cashDate-${o.id}" type="date" value="${new Date().toLocaleDateString('en-CA')}">
          </div>

          <div class="tpv-cash-actions">
            <button class="primary" onclick="window.registerTPVPayment('${o.id}',false)">Cobrar ${due>0?M(due):''}</button>
            <button class="secondary" onclick="window.registerTPVPayment('${o.id}',true)">↩ Devolución</button>
            <button class="secondary" onclick="window.abrirFichaPedido?.('${o.id}')">Ficha</button>
          </div>

          <details class="tpv-cash-history">
            <summary>Historial (${ps.length})</summary>
            <div>
              ${ps.length?ps.map(p=>`<div class="statline"><span>${E(new Date(p.paid_at).toLocaleString('es-ES'))}<br><small>${E(p.method||'')} ${p.note?'· '+E(p.note):''}</small></span><b>${M(p.amount)}</b></div>`).join(''):(paid?'<div class="muted" style="padding:10px 0">Saldo anterior: '+M(paid)+' · '+E(o.payment_method||'Sin método')+'</div>':'<div class="muted" style="padding:10px 0">Sin movimientos registrados.</div>')}
            </div>
          </details>
        </article>`;
    }).join(''):'<div class="tpv-empty">No hay pedidos para este filtro.</div>';
  };

  window.selectCashMethod=function(orderId,method){
    selectedMethod[orderId]=method;
    window.dibujarCajaCobros();
  };

  window.registerTPVPayment=async function(orderId,isRefund){
    if(saving.has(orderId))return;
    const o=list.find(x=>x.id===orderId);if(!o)return;
    const amountInput=document.getElementById('cashAmount-'+orderId);
    const noteInput=document.getElementById('cashNote-'+orderId);
    const dateInput=document.getElementById('cashDate-'+orderId);
    const amount=N(amountInput?.value);
    const method=selectedMethod[orderId];

    if(!amount||amount<=0){toast('Introduce un importe válido');return}
    if(!method){toast('Selecciona un método de pago');return}
    const note=String(noteInput?.value||'').trim();
    if(isRefund&&!note){toast('Indica el motivo de la devolución');return}

    saving.add(orderId);
    try{
      const req=requestIds.get(orderId)||crypto.randomUUID();requestIds.set(orderId,req);
      const signed=isRefund?-amount:amount;
      const date=String(dateInput?.value||new Date().toLocaleDateString('en-CA'));
      const {data,error}=await supabaseClient.rpc('record_order_payment',{
        p_id:req,p_order_id:orderId,p_amount:signed,p_method:method,p_note:note,p_paid_at:new Date(date+'T12:00:00').toISOString()
      });
      if(error)throw error;
      requestIds.delete(orderId);
      const global=orders.find(x=>x.id===orderId);if(global)Object.assign(global,data||{});
      toast(isRefund?'Devolución registrada':'Cobro registrado');
      await loadData();
      window.dibujarCajaCobros();
    }catch(e){
      console.error(e);toast(e?.message||'No se pudo registrar el movimiento');
    }finally{saving.delete(orderId)}
  };

  const oldSet=window.setView;
  window.setView=function(v){
    if(v==='cash'){
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      const t=document.querySelector('#title');if(t)t.textContent='Caja y cobros';
      window.cajaCobrosView(document.querySelector('#view'));
      window.closeMobileMenu?.();
      return;
    }
    return oldSet(v);
  };

  function nav(){
    const b=document.querySelector('#nav button[data-view="expenses"]');
    if(!b||document.querySelector('#nav button[data-view="cash"]'))return;
    const n=document.createElement('button');
    n.dataset.view='cash';
    n.innerHTML='💳 <span>Caja y cobros</span>';
    n.onclick=()=>window.setView('cash');
    b.insertAdjacentElement('afterend',n);
  }
  setTimeout(nav,0);
})();