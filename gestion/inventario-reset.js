/* AIHXO · Reinicio y recuento de inventario */
(function(){
 async function getActiveCycle(){
   const {data,error}=await supabaseClient.from('inventory_cycles').select('*').eq('status','active').order('started_at',{ascending:false}).limit(1);
   if(error){console.error(error);return null}
   return data?.[0]||null;
 }
 async function getProgress(cycleId){
   const {data,error}=await supabaseClient.from('inventory_cycle_lines').select('id,counted_quantity').eq('cycle_id',cycleId);
   if(error){console.error(error);return {total:0,counted:0}}
   const rows=data||[];
   return {total:rows.length,counted:rows.filter(x=>x.counted_quantity!==null).length};
 }
 function injectControls(){
   const view=document.getElementById('view'); if(!view)return;
   const h=[...view.querySelectorAll('h2')].find(x=>x.textContent.includes('Stock de camisetas'));
   if(!h||document.getElementById('aihxoInvResetBtn'))return;
   const parent=h.closest('div')?.parentElement; if(!parent)return;
   const b=document.createElement('button');
   b.id='aihxoInvResetBtn'; b.type='button'; b.textContent='⚙️ Reiniciar inventario';
   b.style.cssText='background:#fff3e8;color:#9a4b00;border:1px solid #f2c89d;border-radius:10px;padding:10px 12px;font-weight:800';
   b.onclick=window.abrirReinicioInventario;
   parent.appendChild(b);
   const status=document.createElement('div'); status.id='aihxoInvStatus'; status.style.cssText='grid-column:1/-1;margin-top:8px';
   parent.insertAdjacentElement('afterend',status);
   refreshStatus();
 }
 async function refreshStatus(){
   const el=document.getElementById('aihxoInvStatus'); if(!el)return;
   const cycle=await getActiveCycle();
   if(!cycle){el.innerHTML='';return}
   const p=await getProgress(cycle.id);
   el.innerHTML=`<div style="padding:12px 14px;border:1px solid #f2c89d;background:#fff8f1;border-radius:12px"><b>📋 Inventario en curso</b><div style="margin-top:3px;opacity:.72">${p.counted}/${p.total} variantes contadas</div><div style="margin-top:8px;height:8px;background:#eee;border-radius:999px;overflow:hidden"><div style="height:100%;width:${p.total?Math.round(p.counted/p.total*100):0}%;background:#07152f"></div></div><div style="display:flex;gap:8px;margin-top:10px"><button type="button" id="aihxoContinueInventory" style="flex:1">📷 Continuar recuento</button><button type="button" id="aihxoFinishInventory" style="flex:1">✓ Finalizar</button></div></div>`;
   document.getElementById('aihxoContinueInventory')?.addEventListener('click',()=>window.abrirRecepcionEtiquetas?.(null));
   document.getElementById('aihxoFinishInventory')?.addEventListener('click',()=>window.finalizarInventario(cycle.id));
 }
 window.abrirReinicioInventario=async function(){
   const active=await getActiveCycle();
   if(active){alert('Ya hay un inventario en curso. Continúa el recuento o finalízalo antes de iniciar otro.');return}
   const ok=confirm('Esto pondrá TODAS las cantidades de prendas base a 0, conservará modelos, tallas, colores, costes, códigos de barras e historial, y abrirá un nuevo recuento. ¿Continuar?');
   if(!ok)return;
   const second=confirm('Última confirmación: el stock actual quedará a 0 hasta que vuelvas a contarlo físicamente.');
   if(!second)return;
   const {data,error}=await supabaseClient.rpc('begin_inventory_reset',{p_notes:'Reinicio manual desde Gestión'});
   if(error){console.error(error);alert(error.message||'No se pudo iniciar el inventario');return}
   toast?.('Inventario reiniciado. Empieza el recuento físico.');
   await window.cargarStockCamisetas?.();
   await refreshStatus();
   if(confirm('Inventario iniciado. ¿Quieres empezar ahora a escanear prendas?')) window.abrirRecepcionEtiquetas?.(null);
 };
 window.finalizarInventario=async function(id){
   const p=await getProgress(id);
   const msg=p.counted<p.total?`Has contado ${p.counted} de ${p.total} variantes. Las no contadas permanecerán a 0. ¿Finalizar igualmente?`:'¿Finalizar el inventario?';
   if(!confirm(msg))return;
   const {error}=await supabaseClient.rpc('finish_inventory_cycle',{p_cycle_id:id});
   if(error){console.error(error);alert('No se pudo finalizar');return}
   toast?.('Inventario finalizado');
   await refreshStatus();
 };
 const old=window.renderStockCamisetas;
 if(typeof old==='function') window.renderStockCamisetas=async function(){await old.apply(this,arguments);setTimeout(injectControls,0)};
 new MutationObserver(()=>{if(document.getElementById('listaStockCamisetas'))injectControls()}).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(injectControls,800);
})();