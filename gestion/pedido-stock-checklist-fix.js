/* AIHXO · Ajustes de ficha para prenda pendiente */
(function(){
 const oldOpen=window.abrirFichaPedido;
 if(typeof oldOpen!=='function')return;
 window.abrirFichaPedido=async function(id){
   await oldOpen(id);
   const o=(orders||[]).find(x=>String(x.id)===String(id));
   if(!o)return;
   const waiting=String(o.production_status||'').trim().toLowerCase()==='pendiente llegada'&&o.base_stock_allocated!==true;
   const sel=document.getElementById('pdProduction');
   if(sel&&waiting){
     if(!Array.from(sel.options).some(x=>x.value==='Pendiente llegada')){const op=document.createElement('option');op.value='Pendiente llegada';op.textContent='🚚 Pendiente llegada';sel.insertBefore(op,sel.firstChild)}
     sel.value='Pendiente llegada';
   }
   if(!waiting)return;
   const labels=Array.from(document.querySelectorAll('#drawerBody label'));
   const garment=labels.find(x=>x.textContent.includes('Prenda asignada'));
   if(garment){
     const check=garment.querySelector('input[type="checkbox"]');if(check)check.checked=false;
     garment.style.border='1px solid #f5c26b';garment.style.background='#fff9ef';
     const spans=garment.querySelectorAll(':scope > span');if(spans.length)spans[spans.length-1].textContent='○';
     const sub=garment.querySelector('.muted');if(sub)sub.textContent='Esperando llegada de la prenda seleccionada';
   }
   const cards=Array.from(document.querySelectorAll('#drawerBody .card'));
   const checklistCard=cards.find(x=>x.textContent.includes('Checklist del pedido'));
   if(checklistCard){
     const heading=Array.from(checklistCard.querySelectorAll('.muted')).find(x=>/\d+\/\d+ pasos completados/.test(x.textContent));
     const boxes=Array.from(checklistCard.querySelectorAll('input[type="checkbox"]'));
     const done=boxes.filter(x=>x.checked).length,total=boxes.length,pct=total?Math.round(done/total*100):0;
     if(heading)heading.textContent=`${done}/${total} pasos completados`;
     const pctEl=Array.from(checklistCard.querySelectorAll('b')).find(x=>/%$/.test(x.textContent.trim()));if(pctEl)pctEl.textContent=`${pct}%`;
     const bars=checklistCard.querySelectorAll('div[style*="height:100%"]');if(bars.length)bars[0].style.width=`${pct}%`;
   }
 };
})();