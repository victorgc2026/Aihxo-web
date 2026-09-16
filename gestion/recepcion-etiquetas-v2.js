/* AIHXO · Recepción / inventario por etiquetas v2
   Prioridad: código conocido > confirmación humana > OCR como ayuda.
   Evita falsos positivos de tallas S/M/L dentro de otras palabras.
*/
(function(){
  const norm = v => String(v || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();

  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));

  const colorAliases = {
    blanco:['blanco','white','blanc'],
    negro:['negro','black','noir'],
    'azul marino':['azul marino','navy','navy blue'],
    gris:['gris','grey','gray'],
    lila:['lila','lilac'],
    arena:['arena','sand'],
    'azul cielo':['azul cielo','sky blue','sky'],
    'verde agua':['verde agua','aqua','mint']
  };

  let stock = [];
  let purchaseId = null;
  let batch = [];
  let lastBarcode = '';
  let lastText = '';

  const close = () => document.getElementById('aihxoRecvOverlay')?.remove();

  function shell(){
    close();
    const o = document.createElement('div');
    o.id = 'aihxoRecvOverlay';
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center';
    o.innerHTML = `
      <div style="background:#fff;width:100%;max-width:760px;max-height:94vh;overflow:auto;border-radius:22px 22px 0 0;padding:18px;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div>
            <h2 style="margin:0">📦 Escaneo de prendas</h2>
            <div style="opacity:.65;font-size:14px">El código manda. El OCR solo propone; tú confirmas si es una etiqueta nueva.</div>
          </div>
          <button id="aihxoRecvClose" type="button" style="font-size:22px;border:0;background:transparent">✕</button>
        </div>
        <div id="aihxoRecvContent" style="margin-top:14px"></div>
      </div>`;
    document.body.appendChild(o);
    o.querySelector('#aihxoRecvClose').onclick = close;
    o.onclick = e => { if(e.target === o) close(); };
  }

  async function loadOCR(){
    if(window.Tesseract) return;
    await new Promise((ok,ko) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      s.onload = ok;
      s.onerror = ko;
      document.head.appendChild(s);
    });
  }

  async function detectBarcode(file){
    lastBarcode = '';
    try{
      if(!('BarcodeDetector' in window) || !window.createImageBitmap) return null;
      const formats = await BarcodeDetector.getSupportedFormats?.() || [];
      const detector = new BarcodeDetector({formats: formats.length ? formats : undefined});
      const bmp = await createImageBitmap(file);
      const codes = await detector.detect(bmp);
      bmp.close?.();
      const code = codes?.[0]?.rawValue?.trim();
      if(code){ lastBarcode = code; return code; }
    }catch(e){ console.warn('BarcodeDetector:', e); }
    return null;
  }

  function phraseMatch(text, value){
    const t = ` ${norm(text)} `;
    const v = norm(value);
    return !!v && t.includes(` ${v} `);
  }

  function sizeMatch(text, size){
    const t = ` ${norm(text)} `;
    const s = norm(size);
    if(!s) return false;
    // Coincidencia de token/frase completa. Evita que "M" coincida dentro de MUKUA, MADE, etc.
    return t.includes(` ${s} `);
  }

  function colorMatch(text, color){
    const key = norm(color);
    const variants = [color, ...(colorAliases[key] || [])].filter(Boolean);
    return variants.some(v => phraseMatch(text, v));
  }

  function scoreItem(item, text){
    let score = 0;
    const supplier = item.supplier || '';
    const model = item.supplier_model || '';
    const size = item.size || '';
    const color = item.color || '';

    if(phraseMatch(text, supplier)) score += 10;
    if(phraseMatch(text, model)) score += 14;
    if(sizeMatch(text, size)) score += 12;
    if(colorMatch(text, color)) score += 7;

    // Bonus por combinaciones que reducen mucho la ambigüedad.
    if(phraseMatch(text, supplier) && phraseMatch(text, model)) score += 8;
    if(phraseMatch(text, model) && sizeMatch(text, size)) score += 6;
    return score;
  }

  function rankedMatches(text){
    return stock
      .map(x => ({...x, _score: scoreItem(x,text)}))
      .filter(x => x._score > 0)
      .sort((a,b) => b._score - a._score);
  }

  function byBarcode(code){
    const c = String(code || '').trim();
    if(!c) return null;
    return stock.find(x => String(x.barcode || '').trim() === c) || null;
  }

  function variantLabel(x){
    return `${x.supplier || 'Sin fabricante'} · ${x.supplier_model || 'Sin modelo'} · ${x.size || 'Sin talla'} · ${x.color || 'Sin color'}`;
  }

  function renderHome(){
    const b = document.getElementById('aihxoRecvContent');
    if(!b) return;
    b.innerHTML = `
      ${purchaseId ? '<div style="padding:10px 12px;background:#f4f6f8;border-radius:10px;margin-bottom:10px">Recepción vinculada a una compra.</div>' : ''}
      <div style="margin-bottom:12px;padding:12px;background:#f7f8fa;border-radius:12px">
        <b>Funcionamiento:</b> si el código ya está aprendido, identifica la prenda directamente. Si es nuevo, revisa la propuesta y confirma la variante correcta una sola vez.
      </div>
      <label for="labelPhoto" style="display:block;text-align:center;padding:15px;border-radius:12px;background:#07152f;color:#fff;font-weight:800;cursor:pointer">📷 Escanear etiqueta</label>
      <input id="labelPhoto" type="file" accept="image/*" capture="environment" style="position:absolute;left:-9999px;width:1px;height:1px">
      <div id="ocrStatus" style="margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px"><b>Preparado.</b></div>
      <div id="ocrResult"></div>
      <div id="batchBox" style="margin-top:14px"></div>`;

    document.getElementById('labelPhoto').onchange = async e => {
      const f = e.target.files?.[0];
      if(f) await process(f);
      e.target.value = '';
    };
    renderBatch();
  }

  function renderBatch(){
    const box = document.getElementById('batchBox');
    if(!box) return;
    const total = batch.reduce((a,x) => a + x.qty, 0);
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0">Lote actual</h3><b>${total} ud.</b></div>
      ${batch.length ? batch.map((x,i) => {
        const s = stock.find(y => String(y.id) === String(x.item_id));
        return `<div style="display:grid;grid-template-columns:1fr auto;gap:10px;padding:10px 0;border-bottom:1px solid #eee">
          <div><b>${esc(s?.supplier || '')} · ${esc(s?.supplier_model || '')}</b>
          <div style="font-size:13px;opacity:.7">${esc(s?.size || '')} · ${esc(s?.color || '')}${x.barcode ? ' · '+esc(x.barcode) : ''}</div></div>
          <div style="display:flex;align-items:center;gap:6px">
            <button type="button" data-minus="${i}" style="padding:5px 9px">−</button><b>${x.qty}</b>
            <button type="button" data-plus="${i}" style="padding:5px 9px">＋</button>
            <button type="button" data-del="${i}" style="padding:5px 9px">✕</button>
          </div></div>`;
      }).join('') : '<div style="padding:14px;border:1px dashed #ccc;border-radius:12px;opacity:.65">Aún no has añadido prendas.</div>'}
      ${batch.length ? `<button id="confirmBatch" type="button" style="width:100%;margin-top:14px;padding:15px;border:0;border-radius:12px;background:#0a7f32;color:white;font-weight:900">✅ Confirmar recepción (${total} ud.)</button>
      <button id="clearBatch" type="button" style="width:100%;margin-top:8px;padding:12px;border:1px solid #ccc;border-radius:12px;background:#fff;font-weight:700">Vaciar lote</button>` : ''}`;

    box.querySelectorAll('[data-minus]').forEach(b => b.onclick = () => { const i=+b.dataset.minus; batch[i].qty=Math.max(1,batch[i].qty-1); renderBatch(); });
    box.querySelectorAll('[data-plus]').forEach(b => b.onclick = () => { batch[+b.dataset.plus].qty++; renderBatch(); });
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { batch.splice(+b.dataset.del,1); renderBatch(); });
    document.getElementById('clearBatch')?.addEventListener('click', () => { if(confirm('¿Vaciar el lote actual?')){ batch=[]; renderBatch(); } });
    document.getElementById('confirmBatch')?.addEventListener('click', confirmBatch);
  }

  async function process(file){
    const st = document.getElementById('ocrStatus');
    const result = document.getElementById('ocrResult');
    lastText = '';
    lastBarcode = '';
    result.innerHTML = '';
    st.innerHTML = '<b>🔎 Buscando código de barras…</b>';

    try{
      const code = await detectBarcode(file);
      if(code){
        const exact = byBarcode(code);
        if(exact){
          st.innerHTML = `<b>✅ Código reconocido</b><div style="opacity:.65">${esc(code)}</div>`;
          showKnown(exact);
          return;
        }
        st.innerHTML = `<b>🆕 Código nuevo: ${esc(code)}</b><div style="opacity:.65">Voy a leer la etiqueta para ordenar las opciones, pero tendrás que confirmar la variante.</div>`;
      } else {
        st.innerHTML = '<b>🔎 Sin código detectable. Leyendo texto de la etiqueta…</b>';
      }

      await loadOCR();
      const r = await Tesseract.recognize(file,'eng+spa',{
        logger:m => {
          if(m.status === 'recognizing text') st.innerHTML = `<b>🔎 Leyendo etiqueta… ${Math.round((m.progress || 0)*100)}%</b>`;
        }
      });
      lastText = r?.data?.text || '';
      const ranked = rankedMatches(lastText);
      showConfirm(ranked);
    }catch(e){
      console.error(e);
      st.innerHTML = '<b>⚠️ No se pudo leer la etiqueta.</b>';
      showConfirm([]);
    }
  }

  function showKnown(x){
    const r = document.getElementById('ocrResult');
    r.innerHTML = `<div style="margin-top:12px;padding:14px;border:2px solid #84c693;border-radius:12px;background:#f5fff7">
      <div style="font-size:13px;font-weight:800;color:#24713a">IDENTIFICACIÓN EXACTA POR CÓDIGO</div>
      <div style="font-size:18px;font-weight:900;margin-top:4px">${esc(x.supplier || '')} · ${esc(x.supplier_model || '')}</div>
      <div style="opacity:.75">Talla ${esc(x.size || '')} · ${esc(x.color || '')}</div>
      <label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label>
      <button id="addBatch" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:800">＋ Añadir al lote</button>
    </div>`;
    document.getElementById('addBatch').onclick = () => addToBatch(x.id);
  }

  function showConfirm(ranked){
    const r = document.getElementById('ocrResult');
    const suggestions = ranked.slice(0,5);
    const suggestedIds = new Set(suggestions.map(x => String(x.id)));
    const rest = stock.filter(x => !suggestedIds.has(String(x.id)))
      .sort((a,b) => variantLabel(a).localeCompare(variantLabel(b),'es',{numeric:true}));

    r.innerHTML = `<div style="margin-top:12px;padding:14px;border:2px solid #efc36d;border-radius:12px;background:#fffaf0">
      <div style="font-size:13px;font-weight:900;color:#8a5a00">CONFIRMACIÓN NECESARIA</div>
      <div style="margin-top:5px">${lastBarcode ? 'Este código todavía no está asociado a ninguna variante.' : 'No se ha podido identificar la prenda de forma inequívoca.'}</div>
      <div style="font-size:13px;opacity:.7;margin-top:4px">Selecciona la variante correcta. ${lastBarcode ? 'Al confirmar la recepción, el código quedará aprendido para próximos escaneos.' : ''}</div>

      <label style="display:block;margin-top:12px;font-weight:800">Variante correcta
        <select id="recvVariant" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:6px;border-radius:10px;border:1px solid #bbb;background:#fff">
          <option value="">— Selecciona —</option>
          ${suggestions.length ? '<optgroup label="Sugerencias por texto">' + suggestions.map(x => `<option value="${esc(x.id)}">${esc(variantLabel(x))}</option>`).join('') + '</optgroup>' : ''}
          <optgroup label="Todas las variantes">${rest.map(x => `<option value="${esc(x.id)}">${esc(variantLabel(x))}</option>`).join('')}</optgroup>
        </select>
      </label>

      <label style="display:block;margin-top:10px">Unidades<input id="recvQty" type="number" min="1" value="1" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin-top:5px"></label>
      <button id="addConfirmed" type="button" style="width:100%;margin-top:12px;padding:14px;border:0;border-radius:12px;background:#07152f;color:#fff;font-weight:800">✓ Confirmar variante y añadir</button>
    </div>`;

    document.getElementById('addConfirmed').onclick = () => {
      const id = document.getElementById('recvVariant')?.value;
      if(!id){ alert('Selecciona la variante correcta antes de añadirla.'); return; }
      addToBatch(id);
    };
  }

  function addToBatch(id){
    const qty = Math.max(1, Number(document.getElementById('recvQty')?.value || 1));
    const existing = batch.find(x => String(x.item_id) === String(id) && String(x.barcode || '') === String(lastBarcode || ''));
    if(existing) existing.qty += qty;
    else batch.push({item_id:id, qty, barcode:lastBarcode || null});

    document.getElementById('ocrResult').innerHTML = '<div style="margin-top:12px;padding:12px;border:1px solid #b7d8bd;border-radius:12px"><b>✅ Añadido al lote</b></div>';
    renderBatch();
    setTimeout(() => document.getElementById('labelPhoto')?.click(), 300);
  }

  async function confirmBatch(){
    if(!batch.length) return;
    const btn = document.getElementById('confirmBatch');
    btn.disabled = true;
    btn.textContent = 'Guardando…';
    try{
      const payload = batch.map(x => ({item_id:x.item_id, qty:x.qty, barcode:x.barcode || null}));
      const {error} = await supabaseClient.rpc('receive_stock_batch',{p_items:payload,p_purchase_id:purchaseId || null});
      if(error) throw error;

      batch.forEach(x => {
        const s = stock.find(y => String(y.id) === String(x.item_id));
        if(s){
          s.quantity = Number(s.quantity || 0) + x.qty;
          if(x.barcode && !s.barcode) s.barcode = x.barcode;
        }
      });

      const total = batch.reduce((a,x) => a+x.qty,0);
      batch = [];
      document.getElementById('ocrResult').innerHTML = '';
      document.getElementById('ocrStatus').innerHTML = `<b>✅ Recepción registrada</b><div style="opacity:.65">${total} unidades añadidas. Los códigos nuevos confirmados ya quedan vinculados.</div>`;
      renderBatch();
      await window.cargarStockCamisetas?.();
    }catch(e){
      console.error(e);
      alert(e.code === '23505' ? 'Ese código de barras ya está asociado a otra variante.' : (e.message || 'No se pudo registrar el lote completo.'));
      btn.disabled = false;
      renderBatch();
    }
  }

  // Sobrescribe la versión anterior. Los botones existentes llaman a esta función global.
  window.abrirRecepcionEtiquetas = async function(pid=null){
    purchaseId = pid || null;
    batch = [];
    shell();
    const box = document.getElementById('aihxoRecvContent');
    box.innerHTML = '<div style="padding:16px;border:1px solid #ddd;border-radius:12px"><b>Cargando variantes de stock…</b></div>';
    try{
      const {data,error} = await supabaseClient.from('base_stock_items').select('*').order('supplier_model').order('color').order('size');
      if(error) throw error;
      stock = data || [];
      renderHome();
    }catch(e){
      console.error(e);
      box.innerHTML = '<div style="padding:16px;border:1px solid #f0b7b7;border-radius:12px"><b>⚠️ No se pudo cargar el stock.</b></div>';
    }
  };
})();
