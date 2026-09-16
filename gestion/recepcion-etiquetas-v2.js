/* AIHXO · Inventario por código de barras · escáner continuo */
(function(){
  let stock=[], purchaseId=null, batch=[], lastBarcode='';
  let reader=null, controls=null, scanning=false, locked=false;
  const sessionCodes=new Map();

  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const label=x=>`${x.supplier||'Sin fabricante'} · ${x.supplier_model||'Sin modelo'} · ${x.size||'Sin talla'} · ${x.color||'Sin color'}`;

  function stopScanner(){
    try{controls?.stop?.()}catch(e){}
    controls=null; scanning=false;
    const v=document.getElementById('aihxoVideo');
    try{v?.srcObject?.getTracks?.().forEach(t=>t.stop())}catch(e){}
  }

  function close(){ stopScanner(); document.getElementById('aihxoRecvOverlay')?.remove(); }

  function shell(){
    close();
    const o=document.createElement('div');
    o.id='aihxoRecvOverlay';
    o.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.65);display:flex;align-items:flex-end;justify-content:center';
    o.innerHTML=`<div style="background:#fff;width:100%;max-width:760px;max-height:96vh;overflow:auto;border-radius:22px 22px 0 0;padding:16px;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div><h2 style="margin:0">📦 Inventario por código</h2><div style="opacity:.65;font-size:14px">Cámara continua · sin OCR · sin adivinar datos</div></div>
        <button id="aihxoRecvClose" type="button" style="font-size:22px;border:0;background:transparent">✕</button>
      </div>
      <div id="aihxoRecvContent" style="margin-top:12px"></div>
    </div>`;
    document.body.appendChild(o);
    o.querySelector('#aihxoRecvClose').onclick=close;
    o.onclick=e=>{if(e.target===o)close()};
  }

  async function loadZXing(){
    if(window.ZXingBrowser)return;
    await new Promise((resolve,reject)=>{
      const old=document.querySelector('script[data-aihxo-zxing]');
      if(old){old.addEventListener('load',resolve,{once:true});old.addEventListener('error',reject,{once:true});return}
      const s=document.createElement('script');
      s.dataset.aihxoZxing='1';
      s.src='https://unpkg.com/@zxing/browser@0.1.5';
      s.onload=resolve; s.onerror=reject; document.head.appendChild(s);
    });
  }

  function findByCode(code){
    const c=String(code||'').trim(); if(!c)return null;
    const saved=stock.find(x=>String(x.barcode||'').trim()===c); if(saved)return saved;
    const id=sessionCodes.get(c); return id?stock.find(x=>String(x.id)===String(id))||null:null;
  }

  function renderHome(){
    const b=document.getElementById('aihxoRecvContent'); if(!b)return;
    b.innerHTML=`
      ${purchaseId?'<div style="padding:9px 11px;background:#f4f6f8;border-radius:10px;margin-bottom:10px">Recepción vinculada a una compra.</div>':''}
      <div style="position:relative;background:#111;border-radius:14px;overflow:hidden;aspect-ratio:4/3">
        <video id="aihxoVideo" muted playsinline autoplay style="width:100%;height:100%;object-fit:cover;display:block"></video>
        <div style="position:absolute;left:8%;right:8%;top:34%;height:30%;border:3px solid #fff;border-radius:12px;box-shadow:0 0 0 999px rgba(0,0,0,.18);pointer-events:none"></div>
        <div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;color:#fff;font-size:13px;font-weight:800;text-shadow:0 1px 3px #000">Centra SOLO el código dentro del recuadro</div>
      </div>
      <div id="scanStatus" style="margin-top:10px;padding:12px;border:1px solid #ddd;border-radius:12px"><b>Iniciando cámara…</b></div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button id="restartScanner" type="button" style="flex:1;padding:11px;border:1px solid #ccc;border-radius:10px;background:#fff;font-weight:800">↻ Reiniciar cámara</button>
        <button id="manualCodeBtn" type="button" style="flex:1;padding:11px;border:1px solid #ccc;border-radius:10px;background:#fff;font-weight:800">⌨️ Introducir código</button>
      </div>
      <div id="scanResult"></div>
      <div id="batchBox" style="margin-top:14px"></div>`;

    document.getElementById('restartScanner').onclick=()=>startScanner(true);
    document.getElementById('manualCodeBtn').onclick=manualCode;
    renderBatch();
    startScanner(false);
  }

  async function startScanner(force=false){
    if(scanning&&!force)return;
    stopScanner(); locked=false;
    const st=document.getElementById('scanStatus');
    const v=document.getElementById('aihxoVideo');
    if(!st||!v)return;
    st.innerHTML='<b>📷 Activando cámara…</b>';

    try{
      await loadZXing();
      reader=new ZXingBrowser.BrowserMultiFormatReader();
      scanning=true;
      controls=await reader.decodeFromConstraints(
        {audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}},
        v,
        (result,error)=>{
          if(!result||locked)return;
          const code=(result.getText?.()||result.text||'').trim();
          if(!code)return;
          locked=true; lastBarcode=code;
          try{controls?.stop?.()}catch(e){}
          controls=null; scanning=false;
          if(navigator.vibrate)navigator.vibrate(100);
          st.innerHTML=`<b>✅ Código leído</b><div style="font-size:20px;font-family:monospace;margin-top:4px;word-break:break-all">${esc(code)}</div>`;
          const item=findByCode(code);
          if(item)showKnown(item,code); else showNew(code);
        }
      );
      st.innerHTML='<b>🟢 Cámara lista</b><div style="margin-top:3px;opacity:.7">Acerca el código hasta llenar el recuadro.</div>';
    }catch(e){
      console.error(e); scanning=false;
      st.innerHTML='<b>⚠️ No pude abrir el lector de cámara.</b><div style="margin-top:4px;opacity:.72">Comprueba el permiso de cámara. Mientras tanto puedes introducir el número del código manualmente.</div>';
    }
  }

  function manualCode(){
    const code=prompt('Escribe los números que aparecen debajo del código de barras:');
    if(!code)return;
    const clean=String(code).replace(/\s+/g,'').trim();
    if(!clean)return;
    stopScanner(); locked=true; lastBarcode=clean;
    const st=document.getElementById('scanStatus');
    st.innerHTML=`<b>⌨️ Código introducido</b><div style="font-size:20px;font-family:monospace;margin-top:4px">${esc(clean)}</div>`;
    const item=findByCode(clean); if(item)showKnown(item,clean); else showNew(clean);
  }

  function showKnown(x,code){
    const r=document.getElementById('scanResult');
    r.innerHTML=`<div style="margin-top:10px;padding:14px;border:2px solid #84c693;border-radius:12px;background:#f5fff7">
      <div style="font-size:12px;font-weight:900;color:#24713a">IDENTIFICADA POR CÓDIGO</div>
      <div style="font-size:19px;font-weight:900;margin-top:5px">${esc(x.supplier||'')} · ${esc(x.supplier_model||'')}</div>
      <div style="font-size:17px">Talla <b>${esc(x.size||'')}</b> · ${esc(x.color||'')}</div>
      <label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label>
      <button id="addBatch" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:900">＋ Añadir y seguir escaneando</button>
      <button id="wrongMatch" type="button" style="width:100%;margin-top:7px;padding:11px;border:1px solid #ccc;border-radius:10px;background:#fff;font-weight:700">Esta asociación es incorrecta</button>
    </div>`;
    document.getElementById('addBatch').onclick=()=>add(x.id,code);
    document.getElementById('wrongMatch').onclick=()=>showNew(code,true);
  }

  function showNew(code,force=false){
    const sorted=[...stock].sort((a,b)=>label(a).localeCompare(label(b),'es',{numeric:true}));
    const r=document.getElementById('scanResult');
    r.innerHTML=`<div style="margin-top:10px;padding:14px;border:2px solid #efc36d;border-radius:12px;background:#fffaf0">
      <div style="font-size:12px;font-weight:900;color:#8a5a00">${force?'CORREGIR ASOCIACIÓN':'CÓDIGO NUEVO'}</div>
      <div style="margin-top:5px">Código: <b style="font-family:monospace">${esc(code)}</b></div>
      <div style="font-size:13px;opacity:.72;margin-top:4px">Selecciona la prenda correcta. No usamos OCR para adivinarla.</div>
      <label style="display:block;margin-top:12px;font-weight:800">Variante
        <select id="recvVariant" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:6px;border-radius:10px;border:1px solid #bbb;background:#fff">
          <option value="">— Selecciona —</option>${sorted.map(x=>`<option value="${esc(x.id)}">${esc(label(x))}</option>`).join('')}
        </select>
      </label>
      <label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label>
      <button id="learnCode" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:900">✓ Asociar, añadir y seguir</button>
      <button id="cancelCurrent" type="button" style="width:100%;margin-top:7px;padding:11px;border:1px solid #ccc;border-radius:10px;background:#fff;font-weight:700">Cancelar este código</button>
    </div>`;
    document.getElementById('learnCode').onclick=()=>{const id=document.getElementById('recvVariant')?.value;if(!id){alert('Selecciona la variante correcta.');return}sessionCodes.set(code,id);add(id,code)};
    document.getElementById('cancelCurrent').onclick=resume;
  }

  function add(id,code){
    const qty=Math.max(1,Number(document.getElementById('recvQty')?.value||1));
    const e=batch.find(x=>String(x.item_id)===String(id)&&String(x.barcode||'')===String(code||''));
    if(e)e.qty+=qty; else batch.push({item_id:id,qty,barcode:code||null});
    renderBatch();
    const r=document.getElementById('scanResult'); if(r)r.innerHTML='';
    resume();
  }

  function resume(){
    locked=false; lastBarcode='';
    const r=document.getElementById('scanResult'); if(r)r.innerHTML='';
    setTimeout(()=>startScanner(true),250);
  }

  function renderBatch(){
    const box=document.getElementById('batchBox'); if(!box)return;
    const total=batch.reduce((a,x)=>a+x.qty,0);
    box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0">Recuento actual</h3><b>${total} ud.</b></div>
      ${batch.length?batch.map((x,i)=>{const s=stock.find(y=>String(y.id)===String(x.item_id));return `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><div><b>${esc(s?.supplier||'')} · ${esc(s?.supplier_model||'')}</b><div style="font-size:13px;opacity:.7">${esc(s?.size||'')} · ${esc(s?.color||'')} · ${esc(x.barcode||'')}</div></div><div><button type="button" data-minus="${i}">−</button> <b>${x.qty}</b> <button type="button" data-plus="${i}">＋</button> <button type="button" data-del="${i}">✕</button></div></div>`}).join(''):'<div style="padding:14px;border:1px dashed #ccc;border-radius:12px;opacity:.65">Aún no has contado prendas.</div>'}
      ${batch.length?`<button id="confirmBatch" type="button" style="width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#0a7f32;color:white;font-weight:900">✅ Guardar recuento (${total} ud.)</button><button id="clearBatch" type="button" style="width:100%;margin-top:8px;padding:12px;border:1px solid #ccc;border-radius:12px;background:#fff;font-weight:700">Vaciar recuento</button>`:''}`;

    box.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.minus;batch[i].qty=Math.max(1,batch[i].qty-1);renderBatch()});
    box.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{batch[+b.dataset.plus].qty++;renderBatch()});
    box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{batch.splice(+b.dataset.del,1);renderBatch()});
    document.getElementById('clearBatch')?.addEventListener('click',()=>{if(confirm('¿Vaciar el recuento?')){batch=[];sessionCodes.clear();renderBatch()}});
    document.getElementById('confirmBatch')?.addEventListener('click',confirmBatch);
  }

  async function confirmBatch(){
    if(!batch.length)return;
    stopScanner();
    const btn=document.getElementById('confirmBatch'); btn.disabled=true; btn.textContent='Guardando…';
    try{
      const payload=batch.map(x=>({item_id:x.item_id,qty:x.qty,barcode:x.barcode||null}));
      const {error}=await supabaseClient.rpc('receive_stock_batch',{p_items:payload,p_purchase_id:purchaseId||null});
      if(error)throw error;
      batch.forEach(x=>{const s=stock.find(y=>String(y.id)===String(x.item_id));if(s){s.quantity=Number(s.quantity||0)+x.qty;if(x.barcode)s.barcode=x.barcode}});
      const total=batch.reduce((a,x)=>a+x.qty,0); batch=[]; sessionCodes.clear();
      document.getElementById('scanResult').innerHTML='';
      document.getElementById('scanStatus').innerHTML=`<b>✅ Recuento guardado</b><div style="opacity:.7">${total} unidades registradas.</div>`;
      renderBatch(); await window.cargarStockCamisetas?.();
    }catch(e){
      console.error(e);
      alert(e.code==='23505'?'Ese código ya está asociado a otra variante.':(e.message||'No se pudo guardar el recuento.'));
      btn.disabled=false; renderBatch(); startScanner(true);
    }
  }

  window.abrirRecepcionEtiquetas=async function(pid=null){
    purchaseId=pid||null; batch=[]; sessionCodes.clear(); shell();
    const box=document.getElementById('aihxoRecvContent');
    box.innerHTML='<div style="padding:16px;border:1px solid #ddd;border-radius:12px"><b>Cargando variantes…</b></div>';
    try{
      const {data,error}=await supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');
      if(error)throw error; stock=data||[]; renderHome();
    }catch(e){
      console.error(e); box.innerHTML='<div style="padding:16px;border:1px solid #f0b7b7;border-radius:12px"><b>⚠️ No se pudo cargar el stock.</b></div>';
    }
  };
})();
