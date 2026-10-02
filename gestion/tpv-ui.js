/* AIHXO · TPV UI v1 · capa visual */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const M=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
  const low=v=>String(v||'').trim().toLowerCase();
  const today=()=>new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});

  function statusClass(s){
    s=low(s);
    if(/entregado|completado|pagado|cobrado/.test(s)) return 'ok';
    if(/cancelado|agotado|retras/.test(s)) return 'danger';
    if(/producci|terminado|preparado|listo/.test(s)) return 'work';
    if(/pendiente|espera|pedido/.test(s)) return 'warn';
    return 'neutral';
  }

  function quick(icon,title,sub,action,kind=''){
    return '<button class="tpv-quick '+kind+'" onclick="'+action+'">'+
      '<span class="tpv-quick-icon">'+icon+'</span>'+
      '<span><b>'+E(title)+'</b><small>'+E(sub)+'</small></span>'+
      '<span class="tpv-arrow">›</span></button>';
  }

  function metric(icon,label,value,sub,action=''){
    return '<div class="tpv-metric" '+(action?'onclick="'+action+'" role="button" tabindex="0"':'')+'>'+
      '<div class="tpv-metric-icon">'+icon+'</div>'+
      '<div><span>'+E(label)+'</span><strong>'+value+'</strong><small>'+E(sub||'')+'</small></div>'+
    '</div>';
  }

  window.dashboard = async function(c){
    c.innerHTML='<div class="page"><div class="tpv-loading">Cargando centro de mando…</div></div>';

    const active=(orders||[]).filter(o=>low(o.status)!=='cancelado' && low(o.status)!=='entregado');
    const production=active.filter(o=>/producci|terminado|listo/.test(low(o.status)+' '+low(o.production_status)));
    const pending=active.filter(o=>/pendiente/.test(low(o.status)));
    const payments=(orders||[]).filter(o=>low(o.status)!=='cancelado' && N(o.total)>N(o.amount_paid));
    const pendingAmount=payments.reduce((a,o)=>a+Math.max(0,N(o.total)-N(o.amount_paid)),0);

    const [stockR,purchaseR]=await Promise.all([
      supabaseClient.from('base_stock_items').select('id,supplier_model,size,color,quantity,min_stock,unit_cost'),
      supabaseClient.from('purchases').select('id,purchase_number,description,status,purchase_date,amount').order('purchase_date',{ascending:false}).limit(8)
    ]);
    const stock=stockR.data||[];
    const lowStock=stock.filter(x=>N(x.quantity)<=Number(x.min_stock??3));
    const out=lowStock.filter(x=>N(x.quantity)<=0);
    const purchases=purchaseR.data||[];
    const pendingPurchases=purchases.filter(p=>!['recibido','recibida','completado','completada'].includes(low(p.status)));

    c.innerHTML=`
      <div class="page tpv-page">
        <div class="tpv-hero">
          <div>
            <div class="tpv-eyebrow">CENTRO DE MANDO</div>
            <h2>Buenas, AIHXO 👋</h2>
            <p>${E(today())} · Todo lo importante de hoy, de un vistazo.</p>
          </div>
          <button class="primary tpv-main-action" onclick="window.orderForm()">＋ Nuevo pedido</button>
        </div>

        <div class="tpv-quick-grid">
          ${quick('🧾','Nuevo pedido','Crear venta o encargo',"window.orderForm()",'accent')}
          ${quick('📄','Importar factura','Leer factura de proveedor',"setView('purchases');setTimeout(()=>window.importarFacturaCompra?.(),180)")}
          ${quick('📦','Recibir mercancía','Compras pendientes',"setView('purchases')")}
          ${quick('👥','Nuevo cliente','Abrir clientes',"setView('customers')")}
          ${quick('💶','Cobros','Pedidos pendientes',"setView('orders')")}
        </div>

        <div class="tpv-metrics">
          ${metric('🧵','Pedidos activos',String(active.length),pending.length+' pendientes',"setView('orders')")}
          ${metric('🏭','En producción',String(production.length),'trabajos en curso',"setView('production')")}
          ${metric('💶','Por cobrar',M(pendingAmount),payments.length+' pedidos',"setView('orders')")}
          ${metric('📦','Stock bajo',String(lowStock.length),out.length+' agotadas',"setView('stock')")}
          ${metric('🚚','Por recibir',String(pendingPurchases.length),'compras pendientes',"setView('purchases')")}
        </div>

        <div class="tpv-layout">
          <section class="tpv-panel">
            <div class="tpv-panel-head">
              <div><span class="tpv-eyebrow">OPERATIVA</span><h3>Ahora mismo</h3></div>
              <button class="secondary small" onclick="setView('production')">Ver producción</button>
            </div>
            <div class="tpv-order-stack">
              ${active.length ? active.slice(0,6).map(o=>`
                <button class="tpv-order-row" onclick="window.verDetallePedido?.('${o.id}')">
                  <span class="tpv-order-code">${E(o.order_number||'Pedido')}</span>
                  <span class="tpv-order-main"><b>${E(o.customer_name||'Sin cliente')}</b><small>${E(o.product_name||o.design||'Encargo')}</small></span>
                  <span class="tpv-status ${statusClass(o.status)}">${E(o.status||'Pendiente')}</span>
                  <strong>${M(o.total)}</strong>
                  <span class="tpv-arrow">›</span>
                </button>`).join('') : '<div class="tpv-empty">No hay pedidos activos 🎉</div>'}
            </div>
          </section>

          <section class="tpv-panel">
            <div class="tpv-panel-head">
              <div><span class="tpv-eyebrow">PRIORIDADES</span><h3>Necesita atención</h3></div>
            </div>
            <div class="tpv-alert-list">
              <button onclick="setView('orders')" class="tpv-alert"><span>💶</span><div><b>${payments.length} cobros pendientes</b><small>${M(pendingAmount)} por cobrar</small></div><i>›</i></button>
              <button onclick="setView('stock')" class="tpv-alert"><span>📦</span><div><b>${lowStock.length} referencias con stock bajo</b><small>${out.length} están agotadas</small></div><i>›</i></button>
              <button onclick="setView('purchases')" class="tpv-alert"><span>🚚</span><div><b>${pendingPurchases.length} compras por recibir</b><small>Preparadas para recepción</small></div><i>›</i></button>
            </div>
          </section>
        </div>
      </div>`;
  };

  window.drawOrders = function(){
    const q=(document.querySelector('#oq')?.value||'').toLowerCase();
    const cont=document.querySelector('#orderTable');
    if(!cont)return;
    const list=(orders||[]).filter(o=>(String(o.order_number||'')+' '+String(o.customer_name||'')+' '+String(o.product_name||'')).toLowerCase().includes(q));

    cont.innerHTML=list.length ? '<div class="tpv-orders-grid">'+list.map(o=>{
      const due=Math.max(0,N(o.total)-N(o.amount_paid));
      return `
        <article class="tpv-order-card">
          <div class="tpv-order-card-top">
            <div><span class="tpv-eyebrow">${E(o.order_number||'PEDIDO')}</span><h3>${E(o.customer_name||'Sin cliente')}</h3></div>
            <span class="tpv-status ${statusClass(o.status)}">${E(o.status||'Pendiente')}</span>
          </div>
          <div class="tpv-order-product">
            <span>👕</span>
            <div><b>${E(o.product_name||'Pedido personalizado')}</b><small>${E([o.size,o.color].filter(Boolean).join(' · ')||'')}</small></div>
          </div>
          <div class="tpv-order-finance">
            <div><small>Total</small><b>${M(o.total)}</b></div>
            <div><small>Pendiente</small><b class="${due>0?'tpv-danger-text':'tpv-ok-text'}">${M(due)}</b></div>
          </div>
          <div class="tpv-order-actions">
            <select onchange="status('${o.id}',this.value)">
              ${['Pendiente','Diseño preparado','En producción','Terminado','Enviado','Entregado','Cancelado'].map(s=>'<option '+(o.status===s?'selected':'')+'>'+s+'</option>').join('')}
            </select>
            <button class="primary" onclick="window.verDetallePedido?.('${o.id}')">Abrir pedido</button>
          </div>
        </article>`;
    }).join('')+'</div>' : '<div class="tpv-empty">No hay pedidos que coincidan con la búsqueda.</div>';
  };

  async function comprasTPVView(c){
    c.innerHTML='<div class="page"><div class="tpv-loading">Cargando compras…</div></div>';
    const [pr,sr]=await Promise.all([
      supabaseClient.from('purchases').select('id,supplier_id,purchase_number,description,amount,purchase_date,status,notes,created_at').order('purchase_date',{ascending:false}).order('created_at',{ascending:false}),
      supabaseClient.from('suppliers').select('id,name').order('name')
    ]);
    if(pr.error||sr.error){console.error(pr.error||sr.error);c.innerHTML='<div class="page"><div class="tpv-empty">No se pudieron cargar las compras.</div></div>';return}
    const ps=pr.data||[], suppliers=sr.data||[];
    const sm=Object.fromEntries(suppliers.map(s=>[String(s.id),s.name]));
    const pending=ps.filter(p=>!['recibido','recibida','completado','completada'].includes(low(p.status)));
    const total=ps.reduce((a,p)=>a+N(p.amount),0);

    c.innerHTML=`
      <div class="page tpv-page">
        <div class="tpv-hero">
          <div><div class="tpv-eyebrow">ALMACÉN</div><h2>Compras y recepción</h2><p>Recibe mercancía y controla facturas sin perder referencias.</p></div>
          <button class="primary tpv-main-action" onclick="window.importarFacturaCompra?.()">📄 Importar factura</button>
        </div>

        <div class="tpv-quick-grid compact">
          ${quick('＋','Nueva compra','Pedido manual',"window.nuevaCompra?.()",'accent')}
          ${quick('🏭','Proveedores','Directorio',"window.aihxoGestionProveedores?.()")}
          ${quick('📦','Pendientes',pending.length+' compras',"document.querySelector('.tpv-purchase-list')?.scrollIntoView({behavior:'smooth'})")}
        </div>

        <div class="tpv-metrics">
          ${metric('🛒','Compras',String(ps.length),'registradas')}
          ${metric('€','Importe histórico',M(total),'compras registradas')}
          ${metric('🚚','Por recibir',String(pending.length),'pendientes de entrada')}
        </div>

        <section class="tpv-panel">
          <div class="tpv-panel-head"><div><span class="tpv-eyebrow">RECEPCIÓN</span><h3>Compras recientes</h3></div></div>
          <div class="tpv-purchase-list">
            ${ps.length?ps.map(p=>{
              const received=['recibido','recibida','completado','completada'].includes(low(p.status));
              return `<article class="tpv-purchase-card">
                <div class="tpv-purchase-main">
                  <div class="tpv-purchase-icon">${received?'✅':'📦'}</div>
                  <div><span class="tpv-eyebrow">${E(p.purchase_number||'SIN REFERENCIA')}</span><h3>${E(p.description||'Compra')}</h3><small>${E(sm[String(p.supplier_id)]||'Proveedor')} · ${E(p.purchase_date||'')}</small></div>
                </div>
                <div class="tpv-purchase-side">
                  <b>${M(p.amount)}</b>
                  <span class="tpv-status ${received?'ok':'warn'}">${E(p.status||'Pedido')}</span>
                </div>
                <div class="tpv-purchase-actions">
                  <button class="secondary" onclick="window.editarLineasCompra?.('${p.id}')">Ver prendas</button>
                  ${received?'':'<button class="primary" onclick="window.recepcionarCompraCompleta?.(\''+p.id+'\',this)">✅ Recibir compra</button>'}
                </div>
              </article>`;
            }).join(''):'<div class="tpv-empty">Todavía no hay compras.</div>'}
          </div>
        </section>
      </div>`;
  }

  const previousSetView=window.setView;
  window.setView=function(v){
    if(v==='purchases'){
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      const t=document.querySelector('#title');if(t)t.textContent='Compras';
      comprasTPVView(document.querySelector('#view'));
      window.closeMobileMenu?.();
      return;
    }
    return previousSetView(v);
  };
  window.comprasTPVView=comprasTPVView;
})();