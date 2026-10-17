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
            const qty=line.quantity==null?'':String(line.quantity);
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
          ordered_quantity:Number(row.querySelector('.irrQty').value),
          received_quantity:0,
          unit_cost:Number(row.querySelector('.irrCost').value)
        }));

        if(drafts.some(x=>!x.item_id)){
          toast?.('Revisa las líneas sin prenda asociada');
          return;
        }
        if(drafts.some(x=>!Number.isSafeInteger(x.ordered_quantity)||
          x.ordered_quantity<1||x.ordered_quantity>2147483647)){
          alert('Las cantidades de la factura deben ser números enteros positivos. Revisa las líneas.');
          return;
        }
        if(drafts.some(x=>!Number.isFinite(x.unit_cost)||x.unit_cost<0)){
          alert('Los costes unitarios de la factura deben ser números válidos y no negativos.');
          return;
        }
        const invoiceItems=new Set();
        if(drafts.some(x=>{
          const id=String(x.item_id);
          if(invoiceItems.has(id))return true;
          invoiceItems.add(id);return false;
        })){
          alert('La factura contiene varias líneas de la misma prenda. Revisa y agrupa las cantidades antes de crear las líneas de compra.');
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

          const resolvedIds=resolved.map(row=>String(row.item_id||''));
          if(resolvedIds.some(id=>!id)||new Set(resolvedIds).size!==resolvedIds.length){
            throw new Error('Las prendas resueltas contienen asociaciones vacías o duplicadas. Revisa las líneas antes de guardar.');
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

  const receivingPurchases=new Set();
  async function recepcionarCompraCompleta(purchaseId, btn){
    if(!purchaseId||receivingPurchases.has(String(purchaseId))) return;
    receivingPurchases.add(String(purchaseId));

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

      // Validar los valores originales antes de convertirlos a cantidades para el RPC.
      for(const line of rows){
        const ordered=Number(line.ordered_quantity);
        const received=Number(line.received_quantity??0);
        if(!Number.isSafeInteger(ordered)||ordered<1||ordered>2147483647||
           !Number.isSafeInteger(received)||received<0||received>ordered){
          alert('La compra contiene cantidades inválidas. Revisa sus líneas antes de registrar la recepción.');
          return;
        }
      }
      const unassigned=rows.filter(l=>
        !l.item_id && Number(l.ordered_quantity)>Number(l.received_quantity??0));
      if(unassigned.length){
        alert('Hay líneas pendientes sin una prenda base asociada. Asócialas desde “Ver / editar prendas” antes de confirmar la recepción.');
        return;
      }
      const pending=rows
        .map(l=>({
          item_id:l.item_id,
          qty:Number(l.ordered_quantity)-Number(l.received_quantity??0),
          barcode:null
        }))
        .filter(x=>x.qty>0);

      if(!pending.length){
        // Sin unidades pendientes no corresponde registrar movimientos ni forzar el estado.
        // Si el estado está desactualizado, debe corregirse en el servidor.
        toast?.('No hay unidades pendientes. Revisa el estado de la compra si aún figura abierta.');
        await window.comprasView?.(document.getElementById('view'));
        return;
      }

      // El RPC actual identifica prendas por item_id, no por línea de compra.
      // No sumar automáticamente líneas duplicadas sin verificar su trazabilidad.
      const seenItems=new Set();
      const repeatedItems=pending.filter(x=>{
        const key=String(x.item_id);
        if(seenItems.has(key))return true;
        seenItems.add(key);return false;
      });
      if(repeatedItems.length){
        alert('Esta compra contiene varias líneas pendientes de la misma referencia. Para evitar una recepción incorrecta, revisa y unifica las líneas desde “Ver / editar prendas” antes de recibirla completa.');
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

      // receive_stock_batch actualiza compra y existencias dentro de una sola transacción.
      // Evitar una segunda escritura de estado desde el navegador, fuera de esa transacción.

      toast?.(`Compra recibida: +${total} ud. al stock`);
      await window.cargarStockCamisetas?.();
      await window.comprasView?.(document.getElementById('view'));
    }catch(e){
      console.error('Recepción manual compra:',e);
      alert('No se pudo confirmar la recepción. Si hubo un corte de conexión, la compra PODRÍA haberse registrado. Revisa las cantidades recibidas y los movimientos antes de volver a intentarlo.\n\nDetalle: '+(e?.message||'Error desconocido'));
    }finally{
      receivingPurchases.delete(String(purchaseId));
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
