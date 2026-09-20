/* AIHXO · Compras v2 · vista ligera y robusta */
(function(){
 const N=v=>Number(v||0);
 const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const EUR=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));

 async function loadBasic(c){
   c.innerHTML='<div class="page"><div class="card">⏳ Cargando compras…</div></div>';
   try{
     const purRes=await supabaseClient.from('purchases')
       .select('id,supplier_id,purchase_number,description,amount,purchase_date,status,notes,created_at')
       .order('purchase_date',{ascending:false})
       .order('created_at',{ascending:false});
     if(purRes.error) throw new Error('Compras: '+purRes.error.message);

     const supRes=await supabaseClient.from('suppliers').select('id,name').order('name');
     if(supRes.error) throw new Error('Proveedores: '+supRes.error.message);

     const ps=purRes.data||[], suppliers=supRes.data||[];
     const sm=Object.fromEntries(suppliers.map(s=>[String(s.id),s.name]));
     const total=ps.reduce((a,p)=>a+N(p.amount),0);
     const pending=ps.filter(p=>!['recibido','recibida','completado','completada'].includes(String(p.status||'').toLowerCase()));

     c.innerHTML=`<div class="page">
       <div class="section">
         <div><h2>🛒 Compras</h2><div class="muted">Pedidos a proveedores y entrada de mercancía</div></div>
         <div style="display:flex;gap:8px;flex-wrap:wrap">
           <button type="button" class="secondary" id="p2Suppliers">🏭 Proveedores</button>
           <button type="button" class="primary" id="p2New">＋ Nueva compra</button>
         </div>
       </div>
       <div class="grid kpis">
         ${kpi('Compras',ps.length,'registradas')}
         ${kpi('Importe',EUR(total),'histórico')}
         ${kpi('Pendientes',pending.length,'por recibir')}
       </div>
       <div style="display:grid;gap:12px;margin-top:14px">
       ${ps.length?ps.map(p=>`<div class="card" style="padding:16px">
          <div class="section">
            <div>
              <div class="muted" style="font-size:12px;font-weight:900">${E(p.purchase_number||'Sin referencia')}</div>
              <h3 style="margin:3px 0 0">${E(p.description||'Compra')}</h3>
              <div class="muted">${E(sm[String(p.supplier_id)]||'Proveedor')} · ${E(p.purchase_date||'')}</div>
            </div>
            <div style="text-align:right"><b>${EUR(p.amount)}</b><div class="muted">${E(p.status||'')}</div></div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            <button type="button" class="secondary p2Lines" data-id="${p.id}">📦 Ver / editar prendas</button>
            ${!['recibido','recibida','completado','completada'].includes(String(p.status||'').toLowerCase())?
              `<button type="button" class="primary p2Receive" data-id="${p.id}">✅ Recibir compra</button>`:''}
          </div>
        </div>`).join(''):'<div class="card"><div class="empty">Aún no hay compras registradas.</div></div>'}
       </div>
     </div>`;

     window._aihxoSuppliers=suppliers;
     c.querySelector('#p2New')?.addEventListener('click',()=>window.nuevaCompra?.());
     c.querySelector('#p2Suppliers')?.addEventListener('click',()=>window.aihxoGestionProveedores?.());
     c.querySelectorAll('.p2Lines').forEach(b=>b.addEventListener('click',()=>window.editarLineasCompra?.(b.dataset.id)));
     c.querySelectorAll('.p2Receive').forEach(b=>b.addEventListener('click',()=>window.recepcionarCompraCompleta?.(b.dataset.id,b)));
   }catch(err){
     console.error('Compras v2:',err);
     c.innerHTML=`<div class="page"><div class="card">
       <h2>🛒 Compras</h2>
       <div style="color:#b42318;font-weight:900;margin-top:10px">No se pudo cargar la sección.</div>
       <div class="muted" style="margin-top:8px">${E(err?.message||'Error desconocido')}</div>
       <button type="button" class="primary" id="p2Retry" style="margin-top:14px">Reintentar</button>
     </div></div>`;
     c.querySelector('#p2Retry')?.addEventListener('click',()=>loadBasic(c));
   }
 }

 window.comprasView=loadBasic;

 const previous=window.setView;
 window.setView=function(v){
   if(v==='purchases'){
     document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
     const t=document.querySelector('#title'); if(t)t.textContent='Compras';
     loadBasic(document.querySelector('#view'));
     if(typeof window.closeMobileMenu==='function')window.closeMobileMenu();
     return;
   }
   return previous(v);
 };
})();