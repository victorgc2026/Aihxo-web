/* AIHXO · Rentabilidad + Compras */
(function(){
 const N=v=>Number(v||0), ok=o=>String(o.status||'').toLowerCase()!=='cancelado';
 const actualCost=o=>N(o.garment_actual_cost)+N(o.dtf_actual_cost)+N(o.packaging_cost)+N(o.supplier_shipping_cost)+N(o.extras_actual_cost);

 window.rentabilidadView=async function(c){
  const [{data:ex},{data:stock}]=await Promise.all([
   supabaseClient.from('expenses').select('*'),
   supabaseClient.from('base_stock_items').select('quantity,unit_cost')
  ]);
  const valid=orders.filter(ok), sales=valid.reduce((a,o)=>a+N(o.total),0), real=valid.reduce((a,o)=>a+actualCost(o),0), legacy=valid.reduce((a,o)=>a+N(o.product_cost),0);
  const known=valid.filter(o=>actualCost(o)>0).length, costs=real||legacy, gross=sales-costs, expensesTotal=(ex||[]).reduce((a,x)=>a+N(x.amount),0), net=gross-expensesTotal, stockValue=(stock||[]).reduce((a,x)=>a+N(x.quantity)*N(x.unit_cost),0);
  const ranked=valid.map(o=>{const cost=actualCost(o)||N(o.product_cost);return {...o,_cost:cost,_margin:N(o.total)-cost}}).sort((a,b)=>b._margin-a._margin);
  c.innerHTML=`<div class="page"><div class="section"><div><h2>📈 Rentabilidad real</h2><div class="muted">Ventas, costes, gastos y margen de AIHXO</div></div></div><div class="grid kpis">${kpi('Ventas',money(sales),valid.length+' pedidos no cancelados')}${kpi('Coste producción',money(costs),known+'/'+valid.length+' con coste real')}${kpi('Margen bruto',money(gross),sales?((gross/sales)*100).toFixed(1)+'%':'')}${kpi('Gastos',money(expensesTotal),'gastos generales')}${kpi('Resultado',money(net),'después de gastos')}${kpi('Dinero en stock',money(stockValue),'coste del inventario')}</div><div class="card"><div class="section"><div><h2>🏆 Rentabilidad por pedido</h2><div class="muted">Ordenados por margen</div></div></div><div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Venta</th><th>Coste</th><th>Margen</th></tr></thead><tbody>${ranked.map(o=>`<tr><td><b>${esc(o.order_number||'')}</b></td><td>${esc(o.customer_name||'')}</td><td>${money(o.total)}</td><td>${money(o._cost)}</td><td><b>${money(o._margin)}</b></td></tr>`).join('')}</tbody></table></div></div>${known<valid.length?`<div class="card" style="margin-top:14px">⚠️ <b>${valid.length-known} pedidos todavía no tienen desglose de coste real.</b><div class="muted">Puedes completarlo desde Pedidos → Ficha completa.</div></div>`:''}</div>`;
 };

 window.comprasView=async function(c){
  const [{data:suppliers},{data:purchases,error},{data:lines}]=await Promise.all([
   supabaseClient.from('suppliers').select('*').order('name'),
   supabaseClient.from('purchases').select('*,suppliers(name)').order('purchase_date',{ascending:false}),
   supabaseClient.from('purchase_lines').select('*,base_stock_items(supplier,supplier_model,size,color)')
  ]);
  if(error){console.error(error);return}
  const ps=purchases||[], ls=lines||[];
  const total=ps.reduce((a,p)=>a+N(p.amount),0);
  const pending=ps.filter(p=>!['recibido','completado'].includes(String(p.status||'').toLowerCase()));
  const byPurchase={};ls.forEach(l=>(byPurchase[l.purchase_id]??=[]).push(l));
  const orderedTotal=ls.reduce((a,l)=>a+N(l.ordered_quantity),0), receivedTotal=ls.reduce((a,l)=>a+N(l.received_quantity),0), missing=Math.max(0,orderedTotal-receivedTotal);
  c.innerHTML=`<div class="page"><div class="section"><div><h2>🛒 Compras y proveedores</h2><div class="muted">Previsto, recibido y faltantes por proveedor</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button id="recvCamera" type="button" class="secondary">📷 Recibir con cámara</button><button id="newPurchaseBtn" type="button" class="primary">＋ Nueva compra</button></div></div><div class="grid kpis">${kpi('Compras',ps.length,'registradas')}${kpi('Importe',money(total),'total histórico')}${kpi('Pendientes',pending.length,'por recibir/cerrar')}${kpi('Faltan',missing,'unidades pendientes')}</div><div style="display:grid;gap:12px">${ps.map(p=>{const pl=byPurchase[p.id]||[];const ord=pl.reduce((a,l)=>a+N(l.ordered_quantity),0);const rec=pl.reduce((a,l)=>a+N(l.received_quantity),0);const falt=Math.max(0,ord-rec);const pct=ord?Math.min(100,Math.round(rec/ord*100)):0;return `<div class="card"><div class="section"><div><h3 style="margin:0">${esc(p.purchase_number||p.description||'Compra')}</h3><div class="muted">${esc(p.suppliers?.name||'—')} · ${esc(p.purchase_date||'')}</div></div><div style="text-align:right"><b>${money(p.amount)}</b><div class="muted">${esc(p.status||'')}</div></div></div>${pl.length?`<div style="margin:12px 0"><div style="height:8px;background:#edf0f4;border-radius:999px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#07152f"></div></div><div class="muted" style="margin-top:5px">${rec}/${ord} unidades recibidas · ${falt} pendientes</div></div><div class="table-wrap"><table><thead><tr><th>Prenda</th><th>Pedidas</th><th>Recibidas</th><th>Faltan</th></tr></thead><tbody>${pl.map(l=>`<tr><td>${esc(l.base_stock_items?.supplier_model||l.base_stock_items?.supplier||'Prenda')} · ${esc(l.base_stock_items?.size||'')} · ${esc(l.base_stock_items?.color||'')}</td><td>${N(l.ordered_quantity)}</td><td>${N(l.received_quantity)}</td><td><b>${Math.max(0,N(l.ordered_quantity)-N(l.received_quantity))}</b></td></tr>`).join('')}</tbody></table></div>`:'<div class="muted" style="margin-top:10px">Compra antigua sin desglose por prendas.</div>'}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="secondary recvPurchase" data-purchase-id="${p.id}">📷 Recibir</button><button type="button" class="secondary editPurchaseLines" data-purchase-id="${p.id}">✏️ Líneas</button></div></div>`}).join('')}</div></div>`;
  window._aihxoSuppliers=suppliers||[];
  const abrir=pid=>typeof window.abrirRecepcionEtiquetas==='function'?window.abrirRecepcionEtiquetas(pid||null):toast('No se pudo abrir la cámara.');
  c.querySelector('#recvCamera')?.addEventListener('click',()=>abrir(null));
  c.querySelectorAll('.recvPurchase').forEach(btn=>btn.addEventListener('click',()=>abrir(btn.dataset.purchaseId)));
  c.querySelectorAll('.editPurchaseLines').forEach(btn=>btn.addEventListener('click',()=>window.editarLineasCompra(btn.dataset.purchaseId)));
  c.querySelector('#newPurchaseBtn')?.addEventListener('click',()=>window.nuevaCompra());
 };

 async function stockOptions(){const {data}=await supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,unit_cost').order('supplier_model').order('color').order('size');return data||[]}

 window.nuevaCompra=async function(){
  const ss=window._aihxoSuppliers||[], items=await stockOptions();
  document.getElementById('purchaseModal')?.remove();
  const modal=document.createElement('div');modal.id='purchaseModal';modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-width:720px;max-height:94vh;overflow:auto;border-radius:20px 20px 0 0;padding:20px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center"><div><h2 style="margin:0">🛒 Nueva compra</h2><div style="color:#667085;font-size:14px">Añade también las prendas previstas</div></div><button id="purchaseClose" type="button">✕</button></div><form id="buyForm" class="form" style="margin-top:16px"><div class="field"><label>Proveedor</label><select name="supplier_id" required><option value="">Selecciona</option>${ss.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select></div><div class="field"><label>Número / referencia</label><input name="purchase_number" placeholder="Opcional · AIHXO la genera si lo dejas vacío"><div class="muted" style="margin-top:5px">Puedes poner el nº de factura/albarán del proveedor.</div></div><div class="field"><label>Descripción</label><input name="description" required></div><div class="field"><label>Importe €</label><input name="amount" type="number" min="0" step="0.01" required></div><div class="field"><label>Fecha</label><input name="purchase_date" type="date" value="${new Date().toISOString().slice(0,10)}" required></div><input type="hidden" name="status" value="Pedido"><div class="field"><label>Prendas previstas</label><div id="purchaseLines"></div><button type="button" id="addPurchaseLine" class="secondary" style="margin-top:8px">＋ Añadir prenda</button></div><div class="field"><label>Notas</label><textarea name="notes"></textarea></div><button type="submit" class="primary" style="width:100%">Guardar compra</button></form></div>`;
  document.body.appendChild(modal);
  const linesBox=modal.querySelector('#purchaseLines');
  const addLine=()=>{const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:1fr 85px 85px 40px;gap:6px;margin-bottom:7px';row.innerHTML=`<select class="pli"><option value="">Prenda</option>${items.map(i=>`<option value="${i.id}" data-cost="${N(i.unit_cost)}">${esc(i.supplier_model||i.supplier||'Prenda')} · ${esc(i.size||'')} · ${esc(i.color||'')}</option>`).join('')}</select><input class="plq" type="number" min="1" value="1" title="Cantidad"><input class="plc" type="number" min="0" step="0.01" placeholder="€/ud"><button type="button" class="pldel">✕</button>`;row.querySelector('.pli').addEventListener('change',e=>{const op=e.target.selectedOptions[0];row.querySelector('.plc').value=op?.dataset.cost||''});row.querySelector('.pldel').onclick=()=>row.remove();linesBox.appendChild(row)};
  addLine();modal.querySelector('#addPurchaseLine').onclick=addLine;
  const cerrar=()=>modal.remove();modal.querySelector('#purchaseClose').onclick=cerrar;modal.addEventListener('click',e=>{if(e.target===modal)cerrar()});
  modal.querySelector('#buyForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const btn=e.submitter;
    if(btn){btn.disabled=true;btn.textContent='Guardando…'}
    try{
      const f=new FormData(e.target),payload=Object.fromEntries(f.entries());
      payload.amount=N(payload.amount);
      payload.purchase_number=String(payload.purchase_number||'').trim();
      if(!payload.purchase_number){
        const d=new Date();
        const stamp=d.getFullYear().toString()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+String(Date.now()).slice(-5);
        payload.purchase_number='AIHXO-COMP-'+stamp;
      }
      delete payload.item_id;

      const rowsDraft=[...linesBox.children].map(r=>({
        item_id:r.querySelector('.pli').value,
        ordered_quantity:N(r.querySelector('.plq').value),
        received_quantity:0,
        unit_cost:N(r.querySelector('.plc').value)
      })).filter(x=>x.item_id&&x.ordered_quantity>0);

      if(!rowsDraft.length){
        toast('Añade al menos una prenda a la compra');
        return;
      }

      const {data:purchase,error}=await supabaseClient.from('purchases').insert(payload).select('id').single();
      if(error) throw error;

      const {error:le}=await supabaseClient.from('purchase_lines').insert(rowsDraft.map(x=>({...x,purchase_id:purchase.id})));
      if(le){
        await supabaseClient.from('purchases').delete().eq('id',purchase.id);
        throw le;
      }

      toast('Compra registrada');
      cerrar();
      await comprasView($('#view'));
    }catch(err){
      console.error('Nueva compra:',err);
      alert('No se pudo guardar la compra. '+(err?.message||'Revisa los datos e inténtalo de nuevo.'));
    }finally{
      if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent='Guardar compra'}
    }
  });
 };

 window.editarLineasCompra=async function(purchaseId){
  const [itemsRes,linesRes]=await Promise.all([supabaseClient.from('base_stock_items').select('id,supplier,supplier_model,size,color,unit_cost').order('supplier_model'),supabaseClient.from('purchase_lines').select('*').eq('purchase_id',purchaseId)]);const items=itemsRes.data||[], current=linesRes.data||[];
  document.getElementById('purchaseLinesModal')?.remove();const modal=document.createElement('div');modal.id='purchaseLinesModal';modal.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end';modal.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-height:92vh;overflow:auto;border-radius:20px 20px 0 0;padding:20px"><h2>📦 Líneas de compra</h2><div id="plEdit"></div><button id="plAdd" class="secondary" type="button">＋ Añadir</button><button id="plSave" class="primary" type="button" style="width:100%;margin-top:12px">Guardar líneas</button><button id="plCancel" class="secondary" type="button" style="width:100%;margin-top:8px">Cancelar</button></div>`;document.body.appendChild(modal);const box=modal.querySelector('#plEdit');const add=(v={})=>{const r=document.createElement('div');r.style.cssText='display:grid;grid-template-columns:1fr 80px 80px 38px;gap:6px;margin-bottom:7px';r.innerHTML=`<select class="i"><option value="">Prenda</option>${items.map(i=>`<option value="${i.id}" ${i.id===v.item_id?'selected':''}>${esc(i.supplier_model||i.supplier||'Prenda')} · ${esc(i.size||'')} · ${esc(i.color||'')}</option>`).join('')}</select><input class="q" type="number" min="0" value="${N(v.ordered_quantity)}"><input class="r" type="number" min="0" value="${N(v.received_quantity)}" disabled><button type="button" class="x">✕</button>`;r.querySelector('.x').onclick=()=>r.remove();box.appendChild(r)};current.forEach(add);if(!current.length)add();modal.querySelector('#plAdd').onclick=()=>add();modal.querySelector('#plCancel').onclick=()=>modal.remove();modal.querySelector('#plSave').onclick=async()=>{const rows=[...box.children].map(r=>({purchase_id:purchaseId,item_id:r.querySelector('.i').value,ordered_quantity:N(r.querySelector('.q').value),received_quantity:N(r.querySelector('.r').value)})).filter(x=>x.item_id);await supabaseClient.from('purchase_lines').delete().eq('purchase_id',purchaseId);if(rows.length){const {error}=await supabaseClient.from('purchase_lines').insert(rows);if(error){console.error(error);toast('No se pudieron guardar las líneas');return}}toast('Líneas actualizadas');modal.remove();comprasView($('#view'))};
 };

 const old=window.setView;window.setView=function(v){if(v==='profitability'||v==='purchases'){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#title').textContent=v==='profitability'?'Rentabilidad':'Compras';(v==='profitability'?rentabilidadView:comprasView)($('#view'));closeMobileMenu();return}return old(v)};
 function nav(){const reports=document.querySelector('#nav button[data-view="reports"]');if(!reports||document.querySelector('#nav button[data-view="profitability"]'))return;const a=document.createElement('button');a.dataset.view='profitability';a.innerHTML='📈 <span>Rentabilidad</span>';a.onclick=()=>setView('profitability');reports.insertAdjacentElement('beforebegin',a);const b=document.createElement('button');b.dataset.view='purchases';b.innerHTML='🛒 <span>Compras</span>';b.onclick=()=>setView('purchases');reports.insertAdjacentElement('beforebegin',b)}setTimeout(nav,0);
})();