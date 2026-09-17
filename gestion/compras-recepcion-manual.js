/* AIHXO · Recepción manual de compras pendientes */
(function(){
  const N=v=>Number(v||0);

  async function recepcionarCompraCompleta(purchaseId, btn){
    if(!purchaseId) return;

    const oldText=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent='Comprobando…';}

    try{
      const [{data:purchase,error:pe},{data:lines,error:le}]=await Promise.all([
        supabaseClient.from('purchases').select('id,purchase_number,description,status').eq('id',purchaseId).single(),
        supabaseClient.from('purchase_lines').select('id,item_id,ordered_quantity,received_quantity').eq('purchase_id',purchaseId)
      ]);
      if(pe) throw pe;
      if(le) throw le;

      const rows=lines||[];
      if(!rows.length){
        alert('Esta compra no tiene líneas de prendas. Añade primero el desglose desde “Líneas”.');
        return;
      }

      const pending=rows
        .map(l=>({
          item_id:l.item_id,
          qty:Math.max(0,N(l.ordered_quantity)-N(l.received_quantity)),
          barcode:null
        }))
        .filter(x=>x.item_id&&x.qty>0);

      if(!pending.length){
        if(!['recibido','completado'].includes(String(purchase?.status||'').toLowerCase())){
          await supabaseClient.from('purchases').update({status:'Recibido'}).eq('id',purchaseId);
        }
        toast?.('La compra ya estaba completamente recibida');
        await window.comprasView?.(document.getElementById('view'));
        return;
      }

      const total=pending.reduce((a,x)=>a+x.qty,0);
      const ref=purchase?.purchase_number||purchase?.description||'esta compra';
      const ok=confirm(`Vas a confirmar que ${ref} ha llegado COMPLETO.\n\nSe añadirán ${total} unidades pendientes al stock.\n\n¿Confirmar recepción manual?`);
      if(!ok) return;

      if(btn) btn.textContent='Recepcionando…';

      const {error}=await supabaseClient.rpc('receive_stock_batch',{
        p_items:pending,
        p_purchase_id:purchaseId
      });
      if(error) throw error;

      // Al recepcionar todo lo pendiente, la compra queda cerrada como recibida.
      const {error:statusError}=await supabaseClient
        .from('purchases')
        .update({status:'Recibido'})
        .eq('id',purchaseId);
      if(statusError) console.warn('Stock recibido, pero no se pudo actualizar el estado:',statusError);

      toast?.(`Compra recibida: +${total} ud. al stock`);
      await window.cargarStockCamisetas?.();
      await window.comprasView?.(document.getElementById('view'));
    }catch(e){
      console.error('Recepción manual compra:',e);
      alert(e?.message||'No se pudo recepcionar la compra. No se ha confirmado manualmente.');
    }finally{
      if(btn && document.body.contains(btn)){
        btn.disabled=false;
        btn.textContent=oldText||'✅ Recibir completo';
      }
    }
  }

  function injectButtons(){
    document.querySelectorAll('.recvPurchase[data-purchase-id]').forEach(cameraBtn=>{
      const pid=cameraBtn.dataset.purchaseId;
      const card=cameraBtn.closest('.card');
      if(!card||card.querySelector(`.manualReceivePurchase[data-purchase-id="${pid}"]`)) return;

      // No mostrar el botón si visualmente ya consta como recibido/completado.
      const cardText=(card.textContent||'').toLowerCase();
      if(cardText.includes('0 pendientes') || /\brecibido\b/.test(cardText) || /\bcompletado\b/.test(cardText)) return;

      const b=document.createElement('button');
      b.type='button';
      b.className='primary manualReceivePurchase';
      b.dataset.purchaseId=pid;
      b.textContent='✅ Recibir completo';
      b.title='Confirmar manualmente que ha llegado todo lo pendiente y añadirlo al stock';
      b.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        recepcionarCompraCompleta(pid,b);
      });
      cameraBtn.insertAdjacentElement('afterend',b);
    });
  }

  const observer=new MutationObserver(()=>injectButtons());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(injectButtons,500);

  window.recepcionarCompraCompleta=recepcionarCompraCompleta;
})();
