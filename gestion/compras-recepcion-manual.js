/* AIHXO · Recepción manual de compras pendientes */
(function(){
  const N=v=>Number(v||0);
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9/]+/g,' ').replace(/\s+/g,' ').trim();
  const itemLabel=i=>`${i._virtual?'🆕 ':''}${i.supplier_model||i.supplier||'Prenda'} · ${i.size||''} · ${i.color||''}`;

  function bindRecoverySearch(root,items){
    root.querySelectorAll('.irrSearch').forEach(input=>{
      const row=input.closest('.invoiceRecoveredRow');
      const hidden=row.querySelector('.irrItem');
      const results=row.querySelector('.irrResults');
      const cost=row.querySelector('.irrCost');

      const render=()=>{
        const terms=norm(input.value).split(/\s+/).filter(Boolean);
        const matches=(items||[]).filter(i=>{
          const hay=norm(itemLabel(i)+' '+(i.supplier||'')+' '+(i.garment_type||''));
          return !terms.length || terms.every(t=>hay.includes(t));
        }).slice(0,12);

        results.innerHTML=matches.length
          ? matches.map(i=>`<button type="button" class="irrResult" data-id="${E(i.id)}" style="display:block;width:100%;text-align:left;padding:10px 12px;border:0;border-bottom:1px solid #eef1f4;background:#fff;color:#111">${E(itemLabel(i))}</button>`).join('')
          : '<div style="padding:10px;color:#667085">Sin resultados</div>';
        results.style.display='block';

        results.querySelectorAll('.irrResult').forEach(btn=>btn.onclick=()=>{
          const item=(items||[]).find(i=>String(i.id)===String(btn.dataset.id));
          if(!item)return;
          hidden.value=item.id;
          input.value=itemLabel(item);
          results.style.display='none';
          if(!N(cost.value)) cost.value=N(item.unit_cost).toFixed(2);
          row.querySelector('.irrWarn')?.remove();
        });
      };

      input.addEventListener('focus',render);
      input.addEventListener('input',()=>{hidden.value='';render()});
      input.addEventListener('blur',()=>setTimeout(()=>{results.style.display='none'},180));
    });
  }

  function invoiceLineIsStock(line){
    const d=norm(line?.description);
    if(!d) return false;
    return !/(^| )(envio|portes?|transporte|descuento|gastos? de envio|shipping)( |$)/.test(d);
  }

  function sizeAliases(size){
    const s=norm(size);
    const out=new Set([s]);
    if(s==='12/13') out.add('12/14');
    if(s==='12/14') out.add('12/13');
    if(s==='3/4') out.add('03/04');
    if(s==='5/6') out.add('05/06');
    if(s==='7/8') out.add('07/08');
    if(s==='9/11') out.add('09/11');
    return [...out].filter(Boolean);
  }

  function colorAliases(color){
    const c=norm(color);
    const out=new Set([c]);
    if(/negro|black/.test(c)){out.add('negro');out.add('black');out.add('black 200');}
    if(/blanco|blanca|white/.test(c)){out.add('blanco');out.add('blanca');out.add('white');out.add('white 100');}
    if(/gris|grey|gray/.test(c)){out.add('gris');out.add('grey');out.add('gray');out.add('heather grey');}
    if(/azul marino|navy/.test(c)){out.add('azul marino');out.add('navy');}
    return [...out].filter(Boolean);
  }

  function guessInvoiceItem(line,items){
    const d=norm(line?.description);
    if(!d) return '';

    let best=null,bestScore=0,tie=false;

    for(const item of (items||[])){
      let score=0;
      const model=norm(item.supplier_model||item.supplier||'');
      const modelWords=model.split(' ').filter(w=>w.length>=4 && !['unisex','mujer','woman','kids','negra','negro','blanca','blanco','camiseta'].includes(w));
      if(model && d.includes(model)) score+=8;
      for(const w of modelWords) if(d.includes(w)) score+=3;

      const supplier=norm(item.supplier||'');
      if(supplier && d.includes(supplier)) score+=1;

      const sizes=sizeAliases(item.size);
      if(sizes.some(s=>s && (d.includes(' '+s+' ')||d.endsWith(' '+s)||d.includes('talla '+s)))) score+=6;

      const colors=colorAliases(item.color);
      if(colors.some(col=>col && d.includes(col))) score+=4;

      if(score>bestScore){bestScore=score;best=item;tie=false;}
      else if(score===bestScore && score>0){tie=true;}
    }

    return best && bestScore>=7 && !tie ? String(best.id) : '';
  }

  async function recuperarLineasFactura(purchase){
    const raw=Array.isArray(purchase?.extracted_data?.lines)
      ? purchase.extracted_data.lines.filter(invoiceLineIsStock)
      : [];

    if(!raw.length) return false;

    const items=typeof window.aihxoPurchaseStockOptions==='function'
      ? await window.aihxoPurchaseStockOptions()
      : (await supabaseClient.from('base_stock_items')
          .select('id,supplier,supplier_model,size,color,unit_cost')
          .order('supplier_model').order('size').order('color')).data||[];

    return await new Promise(resolve=>{
      document.getElementById('invoiceLinesRecoveryModal')?.remove();

      const modal=document.createElement('div');
      modal.id='invoiceLinesRecoveryModal';
      modal.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.48);display:flex;align-items:flex-end;justify-content:center';

      modal.innerHTML=`<div style="background:#fff;color:#111;width:100%;max-width:760px;max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;padding:20px;box-sizing:border-box">
        <h2 style="margin-top:0">📄 Líneas recuperadas de la factura</h2>
        <div style="color:#667085;margin-bottom:14px">
          He encontrado ${raw.length} líneas de prendas en la factura. Revisa la asociación antes de añadirlas al stock.
        </div>
        <div id="invoiceRecoveredRows" style="display:grid;gap:12px">
          ${raw.map((line,idx)=>{
            const guessed=guessInvoiceItem(line,items);
            const qty=Math.max(1,Math.round(N(line.quantity)||1));
            const unit=N(line.unit_price??line.price??(qty?N(line.subtotal??line.total)/qty:0));
            return `<div class="invoiceRecoveredRow" style="border:1px solid #e4e7ec;border-radius:14px;padding:12px">
              <div style="font-weight:800;margin-bottom:8px">${E(line.description||('Línea '+(idx+1)))}</div>
              <div style="display:grid;grid-template-columns:minmax(0,1fr) 82px 95px;gap:7px;align-items:start">
                <div style="position:relative">
                  <input class="irrSearch" autocomplete="off" placeholder="Escribe modelo, talla o color…" value="${E((items||[]).find(i=>String(i.id)===String(guessed)) ? itemLabel((items||[]).find(i=>String(i.id)===String(guessed))) : '')}">
                  <input class="irrItem" type="hidden" value="${E(guessed)}">
                  <div class="irrResults" style="display:none;position:absolute;left:0;right:0;top:100%;z-index:60;max-height:260px;overflow:auto;border:1px solid #d0d5dd;border-radius:10px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.14)"></div>
                </div>
                <input class="irrQty" type="number" min="1" step="1" value="${qty}" title="Cantidad">
                <input class="irrCost" type="number" min="0" step=".01" value="${unit.toFixed(2)}" title="Coste €/ud">
              </div>
              ${guessed?'':'<div class="irrWarn" style="margin-top:7px;color:#b54708;font-size:12px">⚠️ Revisa esta línea: no he encontrado una coincidencia segura.</div>'}
            </div>`;
          }).join('')}
        </div>
        <button id="irrSave" type="button" class="primary" style="width:100%;margin-top:16px">Crear líneas y continuar con la recepción</button>
        <button id="irrCancel" type="button" class="secondary" style="width:100%;margin-top:8px">Cancelar</button>
      </div>`;

      document.body.appendChild(modal);
      bindRecoverySearch(modal,items);

      const close=v=>{modal.remove();resolve(v);};
      modal.querySelector('#irrCancel').onclick=()=>close(false);
      modal.addEventListener('click',e=>{if(e.target===modal)close(false)});

      modal.querySelector('#irrSave').onclick=async()=>{
        const btn=modal.querySelector('#irrSave');
        const drafts=[...modal.querySelectorAll('.invoiceRecoveredRow')].map(row=>({
          item_id:row.querySelector('.irrItem').value,
          ordered_quantity:Math.max(1,Math.round(N(row.querySelector('.irrQty').value)||1)),
          received_quantity:0,
          unit_cost:Math.max(0,N(row.querySelector('.irrCost').value))
        }));

        if(drafts.some(x=>!x.item_id)){
          toast?.('Revisa las líneas sin prenda asociada');
          return;
        }

        btn.disabled=true;btn.textContent='Creando líneas…';

        try{
          const supplierName=String(purchase?.extracted_data?.supplier_name||'').trim();
          const resolved=[];

          for(const row of drafts){
            const itemId=typeof window.aihxoResolvePurchaseItemId==='function'
              ? await window.aihxoResolvePurchaseItemId(row.item_id,row.unit_cost,supplierName)
              : row.item_id;
            resolved.push({...row,item_id:itemId,purchase_id:purchase.id});
          }

          const {error}=await supabaseClient.from('purchase_lines').insert(resolved);
          if(error) throw error;

          toast?.(`${resolved.length} líneas recuperadas de la factura`);
          close(true);
        }catch(err){
          console.error('Recuperar líneas de factura:',err);
          alert(err?.message||'No se pudieron crear las líneas de la factura.');
          btn.disabled=false;btn.textContent='Crear líneas y continuar con la recepción';
        }
      };
    });
  }

  async function recepcionarCompraCompleta(purchaseId, btn){
    if(!purchaseId) return;

    const oldText=btn?.textContent;
    if(btn){btn.disabled=true;btn.textContent='Comprobando…';}

    try{
      const [{data:purchase,error:pe},{data:lines,error:le}]=await Promise.all([
        supabaseClient.from('purchases').select('id,purchase_number,description,status,supplier_id,extracted_data,receipt_path').eq('id',purchaseId).single(),
        supabaseClient.from('purchase_lines').select('id,item_id,ordered_quantity,received_quantity').eq('purchase_id',purchaseId)
      ]);
      if(pe) throw pe;
      if(le) throw le;

      const status=String(purchase?.status||'').trim().toLowerCase();
      if(['recibido','recibida','completado','completada'].includes(status)){
        toast?.('Esta compra ya figura como recibida');
        await window.comprasView?.(document.getElementById('view'));
        return;
      }

      let rows=lines||[];
      if(!rows.length){
        const invoiceLines=Array.isArray(purchase?.extracted_data?.lines)
          ? purchase.extracted_data.lines.filter(invoiceLineIsStock)
          : [];

        if(!invoiceLines.length){
          alert('Esta compra no tiene líneas y tampoco hay un desglose recuperable en la factura. Añade primero las prendas desde “Ver / editar prendas”.');
          return;
        }

        if(btn) btn.textContent='Recuperando factura…';
        const recovered=await recuperarLineasFactura(purchase);
        if(!recovered) return;

        const {data:newLines,error:newLinesError}=await supabaseClient
          .from('purchase_lines')
          .select('id,item_id,ordered_quantity,received_quantity')
          .eq('purchase_id',purchaseId);

        if(newLinesError) throw newLinesError;
        rows=newLines||[];
        if(!rows.length) throw new Error('No se crearon las líneas de la compra.');
      }

      const pending=rows
        .map(l=>({
          item_id:l.item_id,
          qty:Math.max(0,N(l.ordered_quantity)-N(l.received_quantity)),
          barcode:null
        }))
        .filter(x=>x.item_id&&x.qty>0);

      if(!pending.length){
        await supabaseClient.from('purchases').update({status:'Recibido'}).eq('id',purchaseId);
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

      const cardText=(card.textContent||'').toLowerCase();

      // Solo mostrar en compras con un número real de unidades pendientes > 0.
      // Esto excluye automáticamente compras antiguas sin desglose.
      const match=cardText.match(/(\d+)\s+pendientes?/);
      const pendingCount=match?Number(match[1]):0;
      if(pendingCount<=0) return;

      // Nunca mostrar si la compra ya consta como recibida/completada.
      if(/\b(recibido|recibida|completado|completada)\b/.test(cardText)) return;

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
  window.aihxoGuessInvoiceItem=guessInvoiceItem;
})();
