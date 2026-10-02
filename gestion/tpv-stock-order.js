/* AIHXO · Stock matriz + pedido TPV v1 */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const M=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
  const low=v=>String(v||'').trim().toLowerCase();
  const sizeRank=s=>{
    const x=String(s||'').toUpperCase().trim();
    const order=['3/4','5/6','7/8','8','9/11','10','12','12/13','XS','S','M','L','XL','2XL','3XL','4XL'];
    const i=order.indexOf(x); return i<0?999:i;
  };
  const stockTone=(q,min)=>q<=0?'zero':q<=min?'low':'ok';

  window.renderStockCamisetas = async function(){
    const app=document.getElementById('view');
    if(!app)return;
    app.innerHTML=`
      <div class="page tpv-page">
        <div class="tpv-hero stock-hero">
          <div>
            <div class="tpv-eyebrow">ALMACÉN</div>
            <h2>Stock de prendas base</h2>
            <p>Vista rápida por modelo, color y talla.</p>
          </div>
          <button class="primary tpv-main-action" onclick="mostrarNuevaCamiseta()">＋ Nueva prenda</button>
        </div>

        <div id="resumenStockCamisetas" class="tpv-metrics"></div>

        <div class="stock-matrix-toolbar">
          <div class="stock-matrix-search">
            <span>⌕</span>
            <input id="stockMatrixSearch" placeholder="Buscar modelo, proveedor o color…" oninput="cargarStockCamisetas()">
          </div>
          <select id="filtroModeloCamisetas" onchange="cargarStockCamisetas()"><option value="">Todos los modelos</option></select>
          <select id="filtroColorCamisetas" onchange="cargarStockCamisetas()"><option value="">Todos los colores</option></select>
          <select id="filtroTallaCamisetas" onchange="cargarStockCamisetas()"><option value="">Todas las tallas</option></select>
        </div>

        <div id="listaStockCamisetas" class="stock-matrix-list">
          <div class="tpv-loading">Cargando stock…</div>
        </div>
      </div>`;
    await cargarFiltrosCamisetas();
    await cargarStockCamisetas();
  };

  window.cargarStockCamisetas = async function(){
    const holder=document.getElementById('listaStockCamisetas');
    if(!holder)return;
    const modelo=document.getElementById('filtroModeloCamisetas')?.value||'';
    const color=document.getElementById('filtroColorCamisetas')?.value||'';
    const talla=document.getElementById('filtroTallaCamisetas')?.value||'';
    const search=low(document.getElementById('stockMatrixSearch')?.value||'');

    let q=supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');
    if(modelo)q=q.eq('supplier_model',modelo);
    if(color)q=q.eq('color',color);
    if(talla)q=q.eq('size',talla);
    const {data,error}=await q;
    if(error){console.error(error);holder.innerHTML='<div class="tpv-empty">No se pudo cargar el stock.</div>';return}

    let items=data||[];
    if(search){
      items=items.filter(x=>[x.supplier,x.supplier_model,x.garment_type,x.audience,x.color,x.size].join(' ').toLowerCase().includes(search));
    }
    window.pintarResumenCamisetas?.(items);
    if(!items.length){holder.innerHTML='<div class="tpv-empty">No hay prendas que coincidan con los filtros.</div>';return}

    const groups={};
    items.forEach(x=>{
      const k=[x.supplier||'',x.supplier_model||'Sin modelo',x.garment_type||'',x.audience||''].join('¦');
      (groups[k] ||= []).push(x);
    });

    holder.innerHTML=Object.entries(groups).map(([key,list])=>{
      const first=list[0];
      const sizes=[...new Set(list.map(x=>String(x.size||'')))].sort((a,b)=>sizeRank(a)-sizeRank(b)||a.localeCompare(b,'es'));
      const colors=[...new Set(list.map(x=>String(x.color||'')))].sort((a,b)=>a.localeCompare(b,'es'));
      const total=list.reduce((a,x)=>a+N(x.quantity),0);
      const lowCount=list.filter(x=>N(x.quantity)<=Number(x.min_stock??3)).length;
      return `
        <section class="stock-matrix-card">
          <div class="stock-matrix-head">
            <div>
              <div class="tpv-eyebrow">${E(first.supplier||'Proveedor')}</div>
              <h3>${E(first.supplier_model||'Sin modelo')}</h3>
              <small>${E(first.garment_type||'Prenda')} · ${E(first.audience||'Unisex')}</small>
            </div>
            <div class="stock-matrix-total">
              <strong>${total}</strong><span>unidades</span>
              ${lowCount?'<em>⚠ '+lowCount+' bajas</em>':''}
            </div>
          </div>
          <div class="stock-matrix-scroll">
            <table class="stock-matrix-table">
              <thead><tr><th>Color</th>${sizes.map(s=>'<th>'+E(s)+'</th>').join('')}<th>Total</th></tr></thead>
              <tbody>
                ${colors.map(col=>{
                  const row=list.filter(x=>String(x.color||'')===col);
                  const rowTotal=row.reduce((a,x)=>a+N(x.quantity),0);
                  return '<tr><td><b>'+E(col)+'</b></td>'+
                    sizes.map(sz=>{
                      const x=row.find(i=>String(i.size||'')===sz);
                      if(!x)return '<td><span class="stock-cell empty-cell">—</span></td>';
                      const qty=N(x.quantity), tone=stockTone(qty,Number(x.min_stock??3));
                      return '<td><button class="stock-cell '+tone+'" onclick="window.stockCellActions(\''+x.id+'\','+qty+')"><strong>'+qty+'</strong><small>'+toneLabel(tone)+'</small></button></td>';
                    }).join('')+
                    '<td><b>'+rowTotal+'</b></td></tr>';
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>`;
    }).join('');
  };

  function toneLabel(t){return t==='zero'?'Agotado':t==='low'?'Bajo':'OK'}

  window.pintarResumenCamisetas=function(items){
    const el=document.getElementById('resumenStockCamisetas');if(!el)return;
    const total=(items||[]).reduce((a,x)=>a+N(x.quantity),0);
    const lowCount=(items||[]).filter(x=>N(x.quantity)>0&&N(x.quantity)<=Number(x.min_stock??3)).length;
    const zero=(items||[]).filter(x=>N(x.quantity)<=0).length;
    const value=(items||[]).reduce((a,x)=>a+N(x.quantity)*N(x.unit_cost),0);
    el.innerHTML=
      '<div class="tpv-metric"><div class="tpv-metric-icon">👕</div><div><span>Unidades</span><strong>'+total+'</strong><small>stock físico</small></div></div>'+
      '<div class="tpv-metric"><div class="tpv-metric-icon">⚠️</div><div><span>Stock bajo</span><strong>'+lowCount+'</strong><small>variantes</small></div></div>'+
      '<div class="tpv-metric"><div class="tpv-metric-icon">⛔</div><div><span>Agotadas</span><strong>'+zero+'</strong><small>variantes</small></div></div>'+
      '<div class="tpv-metric"><div class="tpv-metric-icon">€</div><div><span>Valor stock</span><strong>'+M(value)+'</strong><small>a coste</small></div></div>';
  };

  window.stockCellActions=async function(id,qty){
    const {data:item,error}=await supabaseClient.from('base_stock_items').select('*').eq('id',id).single();
    if(error||!item){toast('No se pudo abrir la prenda');return}
    const d=document.getElementById('drawer'),b=document.getElementById('drawerBody');if(!d||!b)return;
    d.classList.remove('hidden');
    const min=Number(item.min_stock??3),tone=stockTone(qty,min);
    b.innerHTML=`
      <div class="tpv-detail-head">
        <div><div class="tpv-eyebrow">STOCK</div><h2>${E(item.supplier_model||'Prenda')}</h2><p>${E(item.color||'')} · Talla ${E(item.size||'')}</p></div>
        <div class="tpv-stock-big ${tone}"><strong>${qty}</strong><span>${toneLabel(tone)}</span></div>
      </div>
      <div class="tpv-action-pad">
        <button class="tpv-action positive" onclick="closeDrawer();movimientoCamiseta('${id}','entrada',${qty})"><span>＋</span><b>Entrada</b><small>Añadir unidades</small></button>
        <button class="tpv-action negative" onclick="closeDrawer();movimientoCamiseta('${id}','salida',${qty})"><span>−</span><b>Salida</b><small>Retirar unidades</small></button>
        <button class="tpv-action" onclick="closeDrawer();ajustarCamiseta('${id}',${qty})"><span>↕</span><b>Ajustar</b><small>Fijar cantidad</small></button>
        <button class="tpv-action" onclick="editarCamiseta('${id}')"><span>✎</span><b>Editar</b><small>Ficha de prenda</small></button>
      </div>
      <button class="secondary" style="width:100%;margin-top:14px" onclick="verHistorialCamiseta('${id}')">📋 Ver historial de movimientos</button>`;
  };

  const oldDetail=window.verDetallePedido;
  window.verDetallePedido=async function(id){
    const o=(orders||[]).find(x=>String(x.id)===String(id));
    if(!o){toast('Pedido no encontrado');return}
    const d=document.getElementById('drawer'),b=document.getElementById('drawerBody');if(!d||!b)return;
    d.classList.remove('hidden');
    const total=N(o.total),paid=N(o.amount_paid),due=Math.max(0,total-paid);
    const prod=String(o.production_status||o.status||'Pendiente');
    const status=String(o.status||'Pendiente');
    const payPct=total?Math.min(100,Math.round(paid/total*100)):0;

    let base=null;
    if(o.base_stock_item_id){
      const r=await supabaseClient.from('base_stock_items').select('supplier,supplier_model,size,color,quantity').eq('id',o.base_stock_item_id).maybeSingle();
      base=r.data||null;
    }

    b.innerHTML=`
      <div class="tpv-detail-head order">
        <div>
          <div class="tpv-eyebrow">${E(o.order_number||'PEDIDO')}</div>
          <h2>${E(o.customer_name||'Sin cliente')}</h2>
          <p>${E(o.contact||'Sin contacto')}</p>
        </div>
        <div class="tpv-detail-total"><span>Total</span><strong>${M(total)}</strong></div>
      </div>

      <div class="tpv-order-progress">
        <div><span>Estado</span><b>${E(status)}</b></div>
        <div><span>Producción</span><b>${E(prod)}</b></div>
        <div><span>Pago</span><b>${due>0?M(due)+' pendiente':'Pagado'}</b></div>
      </div>

      <div class="tpv-pay-card">
        <div class="tpv-pay-top"><div><span class="tpv-eyebrow">COBRO</span><h3>${M(paid)} <small>de ${M(total)}</small></h3></div><strong>${payPct}%</strong></div>
        <div class="tpv-pay-bar"><i style="width:${payPct}%"></i></div>
        <div class="tpv-pay-actions">
          <button class="primary" onclick="closeDrawer();window._aihxoCashFocus='${o.id}';setView('cash')">💶 Cobrar</button>
          <button class="secondary" onclick="closeDrawer();window._aihxoCashFocus='${o.id}';setView('cash')">Historial</button>
        </div>
      </div>

      <div class="tpv-detail-section">
        <div class="tpv-panel-head"><div><span class="tpv-eyebrow">PEDIDO</span><h3>Prenda y diseño</h3></div></div>
        <div class="tpv-detail-product">
          <span>👕</span>
          <div><b>${E(o.product_name||o.design||'Pedido personalizado')}</b><small>${E([o.size,o.color].filter(Boolean).join(' · '))} ${o.quantity?'· '+N(o.quantity)+' ud.':''}</small></div>
        </div>
        ${base?'<div class="tpv-base-note">Prenda base: <b>'+E((base.supplier||'')+' '+(base.supplier_model||''))+'</b><br><small>'+E(base.color||'')+' · '+E(base.size||'')+' · Stock actual '+N(base.quantity)+'</small></div>':''}
      </div>

      <div class="tpv-action-pad order-actions">
        <button class="tpv-action" onclick="window.abrirFichaPedido?.('${o.id}')"><span>🏭</span><b>Producción</b><small>Checklist y estados</small></button>
        <button class="tpv-action" onclick="window.abrirFichaPedido?.('${o.id}')"><span>📊</span><b>Costes</b><small>Margen real</small></button>
        <button class="tpv-action" onclick="window.abrirFichaPedido?.('${o.id}')"><span>📝</span><b>Ficha completa</b><small>Todos los datos</small></button>
        <button class="tpv-action" onclick="window.tpvMarkDelivered?.('${o.id}')"><span>✅</span><b>Entregar</b><small>Marcar entregado</small></button>
      </div>

      <div class="tpv-sticky-actions">
        <select id="tpvOrderStatus">
          ${['Pendiente','Diseño preparado','En producción','Terminado','Enviado','Entregado','Cancelado'].map(s=>'<option '+(status===s?'selected':'')+'>'+s+'</option>').join('')}
        </select>
        <button class="primary" onclick="window.tpvSaveOrderStatus?.('${o.id}')">Guardar estado</button>
      </div>`;
  };

  window.tpvSaveOrderStatus=async function(id){
    const s=document.getElementById('tpvOrderStatus')?.value;
    if(!s)return;
    const {error}=await supabaseClient.from('orders').update({status:s}).eq('id',id);
    if(error){toast(error.message);return}
    const o=orders.find(x=>String(x.id)===String(id));if(o)o.status=s;
    toast('Estado actualizado');
    window.drawOrders?.();
    window.verDetallePedido(id);
  };

  window.tpvMarkDelivered=async function(id){
    if(!confirm('¿Marcar este pedido como entregado?'))return;
    const {error}=await supabaseClient.from('orders').update({status:'Entregado'}).eq('id',id);
    if(error){toast(error.message);return}
    const o=orders.find(x=>String(x.id)===String(id));if(o)o.status='Entregado';
    toast('Pedido entregado');
    window.drawOrders?.();
    window.verDetallePedido(id);
  };
})();