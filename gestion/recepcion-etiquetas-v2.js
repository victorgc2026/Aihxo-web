/* AIHXO · Inventario por código de barras · iPhone compatible */
(function(){
  let stock=[],purchaseId=null,batch=[],lastBarcode='';
  const sessionCodes=new Map();
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const label=x=>`${x.supplier||'Sin fabricante'} · ${x.supplier_model||'Sin modelo'} · ${x.size||'Sin talla'} · ${x.color||'Sin color'}`;
  const close=()=>document.getElementById('aihxoRecvOverlay')?.remove();

  function shell(){
    close();
    const o=document.createElement('div');
    o.id='aihxoRecvOverlay';
    o.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
    o.innerHTML=`<div style="background:#fff;width:100%;max-width:760px;max-height:94vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h2 style="margin:0">📦 Inventario por código</h2><div style="opacity:.65;font-size:14px">El código de barras manda. No se adivina talla ni modelo.</div></div><button id="aihxoRecvClose" type="button" style="font-size:22px;border:0;background:transparent">✕</button></div><div id="aihxoRecvContent" style="margin-top:14px"></div></div>`;
    document.body.appendChild(o);
    o.querySelector('#aihxoRecvClose').onclick=close;
    o.onclick=e=>{if(e.target===o)close()};
  }

  async function loadZXing(){
    if(window.ZXingBrowser)return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://unpkg.com/@zxing/browser@0.1.5';
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  async function nativeBarcode(file){
    try{
      if(!('BarcodeDetector'in window)||!window.createImageBitmap)return null;
      const formats=await BarcodeDetector.getSupportedFormats?.()||[];
      const d=new BarcodeDetector({formats:formats.length?formats:undefined});
      const bmp=await createImageBitmap(file);const codes=await d.detect(bmp);bmp.close?.();
      return codes?.[0]?.rawValue?.trim()||null;
    }catch(e){console.warn(e);return null}
  }

  async function zxingBarcode(file){
    let url='';
    try{
      await loadZXing();
      url=URL.createObjectURL(file);
      const reader=new ZXingBrowser.BrowserMultiFormatReader();
      const result=await reader.decodeFromImageUrl(url);
      return (result?.getText?.()||result?.text||'').trim()||null;
    }catch(e){console.warn(e);return null}
    finally{if(url)URL.revokeObjectURL(url)}
  }

  async function detectBarcode(file){
    lastBarcode='';
    let code=await nativeBarcode(file);
    if(!code)code=await zxingBarcode(file);
    if(code){lastBarcode=code;return code}
    return null;
  }

  function findByCode(code){
    const c=String(code||'').trim();if(!c)return null;
    const saved=stock.find(x=>String(x.barcode||'').trim()===c);if(saved)return saved;
    const id=sessionCodes.get(c);return id?stock.find(x=>String(x.id)===String(id))||null:null;
  }

  function renderHome(){
    const b=document.getElementById('aihxoRecvContent');if(!b)return;
    b.innerHTML=`${purchaseId?'<div style="padding:10px 12px;background:#f4f6f8;border-radius:10px;margin-bottom:10px">Recepción vinculada a una compra.</div>':''}<div style="padding:12px;background:#f7f8fa;border-radius:12px;margin-bottom:12px"><b>Haz la foto centrando el código de barras.</b> Intenta que las barras ocupen buena parte de la imagen y estén completas.</div><label for="labelPhoto" style="display:block;text-align:center;padding:16px;border-radius:12px;background:#07152f;color:#fff;font-weight:900;cursor:pointer">▥ Escanear código de barras</label><input id="labelPhoto" type="file" accept="image/*" capture="environment" style="position:absolute;left:-9999px;width:1px;height:1px"><div id="scanStatus" style="margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px"><b>Preparado.</b></div><div id="scanResult"></div><div id="batchBox" style="margin-top:14px"></div>`;
    document.getElementById('labelPhoto').onchange=async e=>{const f=e.target.files?.[0];if(f)await process(f);e.target.value=''};
    renderBatch();
  }

  async function process(file){
    const st=document.getElementById('scanStatus'),r=document.getElementById('scanResult');r.innerHTML='';
    st.innerHTML='<b>🔎 Leyendo código de barras…</b>';
    const code=await detectBarcode(file);
    if(!code){
      st.innerHTML='<b>❌ Código no leído</b><div style="margin-top:5px;opacity:.72">No voy a intentar adivinar la talla o el modelo. Acerca más la cámara y vuelve a fotografiar solo la zona del código.</div>';
      r.innerHTML='<button id="retryScan" type="button" style="width:100%;margin-top:10px;padding:13px;border:1px solid #ccc;border-radius:12px;background:#fff;font-weight:800">📷 Repetir escaneo</button>';
      document.getElementById('retryScan').onclick=()=>document.getElementById('labelPhoto')?.click();return;
    }
    st.innerHTML=`<b>✅ Código leído</b><div style="font-size:20px;font-family:monospace;margin-top:5px">${esc(code)}</div>`;
    const item=findByCode(code);if(item)showKnown(item,code);else showNew(code);
  }

  function showKnown(x,code){
    const r=document.getElementById('scanResult');
    r.innerHTML=`<div style="margin-top:12px;padding:14px;border:2px solid #84c693;border-radius:12px;background:#f5fff7"><div style="font-size:12px;font-weight:900;color:#24713a">IDENTIFICADA POR CÓDIGO</div><div style="font-size:19px;font-weight:900;margin-top:5px">${esc(x.supplier||'')} · ${esc(x.supplier_model||'')}</div><div style="font-size:17px">Talla <b>${esc(x.size||'')}</b> · ${esc(x.color||'')}</div><label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label><button id="addBatch" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:900">＋ Añadir al recuento</button></div>`;
    document.getElementById('addBatch').onclick=()=>add(idOf(x),code);
  }

  function idOf(x){return x.id}

  function showNew(code){
    const sorted=[...stock].sort((a,b)=>label(a).localeCompare(label(b),'es',{numeric:true}));
    const r=document.getElementById('scanResult');
    r.innerHTML=`<div style="margin-top:12px;padding:14px;border:2px solid #efc36d;border-radius:12px;background:#fffaf0"><div style="font-size:12px;font-weight:900;color:#8a5a00">CÓDIGO NUEVO</div><div style="margin-top:5px">El código se ha leído correctamente, pero todavía no está asociado a una variante.</div><div style="font-size:13px;opacity:.72;margin-top:4px">Elige una sola vez la prenda correcta. Los siguientes escaneos de este código ya la reconocerán.</div><label style="display:block;margin-top:12px;font-weight:800">Variante<select id="recvVariant" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:6px;border-radius:10px;border:1px solid #bbb;background:#fff"><option value="">— Selecciona —</option>${sorted.map(x=>`<option value="${esc(x.id)}">${esc(label(x))}</option>`).join('')}</select></label><label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label><button id="learnCode" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:900">✓ Asociar código y añadir</button></div>`;
    document.getElementById('learnCode').onclick=()=>{const id=document.getElementById('recvVariant')?.value;if(!id){alert('Selecciona la variante correcta.');return}sessionCodes.set(code,id);add(id,code)};
  }

  function add(id,code){
    const qty=Math.max(1,Number(document.getElementById('recvQty')?.value||1));
    const e=batch.find(x=>String(x.item_id)===String(id)&&String(x.barcode||'')===String(code||''));if(e)e.qty+=qty;else batch.push({item_id:id,qty,barcode:code||null});
    document.getElementById('scanResult').innerHTML='<div style="margin-top:12px;padding:12px;border:1px solid #b7d8bd;border-radius:12px"><b>✅ Añadido al recuento</b></div>';renderBatch();setTimeout(()=>document.getElementById('labelPhoto')?.click(),350);
  }

  function renderBatch(){
    const box=document.getElementById('batchBox');if(!box)return;const total=batch.reduce((a,x)=>a+x.qty,0);
    box.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0">Recuento actual</h3><b>${total} ud.</b></div>${batch.length?batch.map((x,i)=>{const s=stock.find(y=>String(y.id)===String(x.item_id));return `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><div><b>${esc(s?.supplier||'')} · ${esc(s?.supplier_model||'')}</b><div style="font-size:13px;opacity:.7">${esc(s?.size||'')} · ${esc(s?.color||'')} · ${esc(x.barcode||'')}</div></div><div><button type="button" data-minus="${i}">−</button> <b>${x.qty}</b> <button type="button" data-plus="${i}">＋</button> <button type="button" data-del="${i}">✕</button></div></div>`}).join(''):'<div style="padding:14px;border:1px dashed #ccc;border-radius:12px;opacity:.65">Aún no has contado prendas.</div>'}${batch.length?`<button id="confirmBatch" type="button" style="width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#0a7f32;color:white;font-weight:900">✅ Guardar recuento (${total} ud.)</button><button id="clearBatch" type="button" style="width:100%;margin-top:8px;padding:12px;border:1px solid #ccc;border-radius:12px;background:#fff;font-weight:700">Vaciar recuento</button>`:''}`;
    box.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.minus;batch[i].qty=Math.max(1,batch[i].qty-1);renderBatch()});box.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{batch[+b.dataset.plus].qty++;renderBatch()});box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{batch.splice(+b.dataset.del,1);renderBatch()});document.getElementById('clearBatch')?.addEventListener('click',()=>{if(confirm('¿Vaciar el recuento?')){batch=[];sessionCodes.clear();renderBatch()}});document.getElementById('confirmBatch')?.addEventListener('click',confirmBatch);
  }

  async function confirmBatch(){
    if(!batch.length)return;const btn=document.getElementById('confirmBatch');btn.disabled=true;btn.textContent='Guardando…';
    try{const payload=batch.map(x=>({item_id:x.item_id,qty:x.qty,barcode:x.barcode||null}));const {error}=await supabaseClient.rpc('receive_stock_batch',{p_items:payload,p_purchase_id:purchaseId||null});if(error)throw error;batch.forEach(x=>{const s=stock.find(y=>String(y.id)===String(x.item_id));if(s){s.quantity=Number(s.quantity||0)+x.qty;if(x.barcode)s.barcode=x.barcode}});const total=batch.reduce((a,x)=>a+x.qty,0);batch=[];sessionCodes.clear();document.getElementById('scanResult').innerHTML='';document.getElementById('scanStatus').innerHTML=`<b>✅ Recuento guardado</b><div style="opacity:.7">${total} unidades. Los códigos nuevos ya quedan asociados.</div>`;renderBatch();await window.cargarStockCamisetas?.()}catch(e){console.error(e);alert(e.code==='23505'?'Ese código ya está asociado a otra variante.':(e.message||'No se pudo guardar el recuento.'));btn.disabled=false;renderBatch()}
  }

  window.abrirRecepcionEtiquetas=async function(pid=null){purchaseId=pid||null;batch=[];sessionCodes.clear();shell();const box=document.getElementById('aihxoRecvContent');box.innerHTML='<div style="padding:16px;border:1px solid #ddd;border-radius:12px"><b>Cargando variantes…</b></div>';try{const {data,error}=await supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');if(error)throw error;stock=data||[];renderHome()}catch(e){console.error(e);box.innerHTML='<div style="padding:16px;border:1px solid #f0b7b7;border-radius:12px"><b>⚠️ No se pudo cargar el stock.</b></div>'}};
})();
