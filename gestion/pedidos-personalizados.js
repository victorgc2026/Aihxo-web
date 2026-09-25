/* AIHXO · Pedidos personalizados multiartículo · v1 */
(function () {
  const BUCKET = 'order-designs';
  const E = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const N = v => Number(v || 0);
  const uniq = a => [...new Set((a || []).map(x => String(x || '').trim()).filter(Boolean))];
  const list = v => {
    if (Array.isArray(v)) return uniq(v);
    if (!v) return [];
    try {
      const x = JSON.parse(v);
      if (Array.isArray(x)) return uniq(x);
    } catch (_) {}
    return uniq(String(v).split(','));
  };
  const csv = v => uniq(String(v || '').split(','));
  const slug = v => String(v || 'archivo')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-');

  let modelCache = [];
  let customOrderCache = [];
  let lineSeq = 0;

  async function loadModels(activeOnly = true) {
    let q = supabaseClient.from('custom_garment_models').select('*').order('garment_type').order('brand').order('name');
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw error;
    modelCache = data || [];
    window._aihxoCustomGarmentModels = modelCache;
    return modelCache;
  }

  function modelLabel(m) {
    return [m.garment_type, m.brand, m.name, m.reference].filter(Boolean).join(' · ');
  }

  function variantList(m) {
    return Array.isArray(m?.variants) ? m.variants.filter(v => v && (v.name || v.label)) : [];
  }

  function totalLinesFromItems(items) {
    return (items || []).reduce((a, x) => a + N(x.quantity), 0);
  }

  function subtotalFromItems(items) {
    return (items || []).reduce((a, x) => a + (N(x.quantity) * N(x.unit_price)), 0);
  }

  function costFromItems(items) {
    return (items || []).reduce((a, x) => a + (N(x.quantity) * N(x.unit_cost)), 0);
  }

  window.pedidosPersonalizadosView = async function(c) {
    c.innerHTML = `
      <div class="page">
        <div class="section">
          <div>
            <h2>🧵 Pedidos personalizados</h2>
            <div class="muted">Pedidos a medida con varios artículos, modelos, tallas, colores y archivos.</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="secondary" onclick="gestionarModelosPersonalizados()">👕 Modelos</button>
            <button class="primary" onclick="nuevoPedidoPersonalizado()">＋ Nuevo pedido</button>
          </div>
        </div>
        <div class="grid kpis" id="customOrderKpis"></div>
        <div class="card">
          <input class="search" id="customOrderSearch" placeholder="Buscar cliente, pedido, modelo..." oninput="dibujarPedidosPersonalizados()">
          <div id="customOrdersList" style="display:grid;gap:12px;margin-top:14px;">
            <div class="empty">Cargando…</div>
          </div>
        </div>
      </div>
    `;

    const { data: orderData, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('order_type', 'personalizado')
      .order('created_at', { ascending:false });

    if (orderError) {
      console.error(orderError);
      $('#customOrdersList').innerHTML = '<div class="empty">No se pudieron cargar los pedidos personalizados.</div>';
      return;
    }

    customOrderCache = orderData || [];
    const ids = customOrderCache.map(o => o.id);
    let itemData = [];
    if (ids.length) {
      const { data, error } = await supabaseClient
        .from('custom_order_items')
        .select('*')
        .in('order_id', ids)
        .order('line_no');
      if (error) console.error(error);
      else itemData = data || [];
    }

    const byOrder = {};
    itemData.forEach(i => (byOrder[i.order_id] ||= []).push(i));
    customOrderCache.forEach(o => o._items = byOrder[o.id] || []);
    window._aihxoCustomOrdersV2 = customOrderCache;

    const active = customOrderCache.filter(o => String(o.status || '').toLowerCase() !== 'cancelado');
    const pending = active.filter(o => ['Pendiente','Diseño preparado'].includes(o.status)).length;
    const prod = active.filter(o => ['En producción','Pendiente llegada'].includes(o.status)).length;
    const units = active.reduce((a,o) => a + totalLinesFromItems(o._items), 0);
    const value = active.reduce((a,o) => a + N(o.total), 0);

    $('#customOrderKpis').innerHTML =
      kpi('Activos', active.length, 'pedidos') +
      kpi('Pendientes', pending, 'por preparar') +
      kpi('Producción', prod, 'en curso') +
      kpi('Unidades', units, 'artículos') +
      kpi('Valor', money(value), 'pedidos activos');

    dibujarPedidosPersonalizados();
  };

  window.dibujarPedidosPersonalizados = function() {
    const q = ($('#customOrderSearch')?.value || '').toLowerCase().trim();
    const cont = $('#customOrdersList');
    if (!cont) return;

    const filtered = (customOrderCache || []).filter(o => {
      const items = o._items || [];
      const hay = items.map(i => `${i.garment_type || ''} ${i.brand || ''} ${i.garment_model || ''} ${i.garment_variant || ''} ${i.size || ''} ${i.color || ''} ${i.personalization_name || ''}`).join(' ');
      return `${o.order_number || ''} ${o.customer_name || ''} ${o.contact || ''} ${o.design_brief || ''} ${hay}`.toLowerCase().includes(q);
    });

    cont.innerHTML = filtered.length ? filtered.map(o => {
      const items = o._items || [];
      const pieces = totalLinesFromItems(items) || N(o.quantity);
      const models = uniq(items.map(i => [i.brand, i.garment_model].filter(Boolean).join(' '))).slice(0,3);
      return `
        <div class="card" style="padding:16px;box-shadow:none;border:1px solid #e5e9f0;">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
            <div>
              <div class="muted" style="font-size:11px;font-weight:900;letter-spacing:.8px;">${E(o.order_number || '')}</div>
              <div style="font-size:19px;font-weight:900;margin-top:2px;">${E(o.customer_name || 'Sin cliente')}</div>
              <div class="muted" style="margin-top:3px;">${items.length} línea${items.length===1?'':'s'} · ${pieces} unidad${pieces===1?'':'es'}</div>
            </div>
            <div style="text-align:right;">
              <b>${money(o.total || 0)}</b>
              <div class="muted" style="font-size:12px;margin-top:4px;">${E(o.status || 'Pendiente')}</div>
            </div>
          </div>
          ${models.length ? `<div style="margin-top:11px;font-size:13px;">${models.map(x => `<span style="display:inline-block;margin:0 5px 5px 0;padding:5px 8px;border-radius:999px;background:#f2f4f7;">${E(x)}</span>`).join('')}</div>` : ''}
          <button class="secondary" style="width:100%;margin-top:10px;" onclick="abrirPedidoPersonalizado('${o.id}')">Abrir ficha</button>
        </div>
      `;
    }).join('') : '<div class="empty">No hay pedidos personalizados.</div>';
  };

  window.nuevoPedidoPersonalizado = async function() {
    try {
      await loadModels(true);
    } catch (e) {
      console.error(e);
      toast('No se pudieron cargar los modelos');
      return;
    }

    lineSeq = 0;
    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML = `
      <div class="section" style="align-items:flex-start;">
        <div>
          <h2 style="margin-bottom:4px;">Nuevo pedido personalizado</h2>
          <div class="muted">Una ficha, todos los artículos del cliente.</div>
        </div>
      </div>

      <form id="customOrderForm" class="form">
        <div class="card" style="padding:16px;box-shadow:none;">
          <h3 style="margin-top:0;">Cliente</h3>
          <div class="formgrid">
            <div class="field">
              <label>Nombre del cliente *</label>
              <input id="coCustomer" name="customer" list="coCustomers" required autocomplete="off">
              <datalist id="coCustomers">
                ${(customers || []).map(c => `<option value="${E(c.name)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="field">
              <label>Contacto</label>
              <input id="coContact" name="contact" placeholder="Teléfono / WhatsApp / email">
            </div>
          </div>
          <div class="field">
            <label>Nombre o referencia del encargo</label>
            <input id="coDesign" name="design" placeholder="Ej. Equipo hockey, cumpleaños Paula, empresa X...">
          </div>
          <div class="field">
            <label>Notas / briefing</label>
            <textarea id="coBrief" name="brief" rows="3" placeholder="Qué quiere el cliente, textos, colores, colocación, fechas..."></textarea>
          </div>
          <div class="field">
            <label>Archivos generales del cliente</label>
            <input id="coFiles" type="file" multiple accept="image/*,application/pdf">
            <div class="muted" style="margin-top:5px;">Puedes adjuntar PNG, JPG, WEBP, HEIC o PDF.</div>
          </div>
        </div>

        <div id="coModelQuick" class="card" style="display:none;padding:16px;margin-top:14px;box-shadow:none;border:1px solid #dce2eb;"></div>

        <div class="section" style="margin-top:16px;">
          <div>
            <h3 style="margin:0;">Artículos del pedido</h3>
            <div class="muted">Cada línea puede tener un modelo, talla, color y personalización distintos.</div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="secondary" onclick="mostrarAltaModeloPersonalizadoRapida()">＋ Modelo</button>
            <button type="button" class="primary" onclick="anadirLineaPedidoPersonalizado()">＋ Artículo</button>
          </div>
        </div>

        <div id="coLines" style="display:grid;gap:12px;"></div>

        <div class="card" style="padding:16px;margin-top:14px;box-shadow:none;">
          <div class="formgrid">
            <div class="field">
              <label>Envío cobrado</label>
              <input id="coShipping" name="shipping" type="number" min="0" step=".01" value="0">
            </div>
            <div class="field">
              <label>Fecha objetivo</label>
              <input id="coDue" name="due" type="date">
            </div>
          </div>
          <div id="coSummary"></div>
        </div>

        <button class="primary" id="coSave" type="submit" style="width:100%;margin-top:14px;padding:16px;">GUARDAR PEDIDO PERSONALIZADO</button>
      </form>
    `;

    const customerInput = $('#coCustomer');
    customerInput.addEventListener('change', () => {
      const found = (customers || []).find(c => String(c.name || '').toLowerCase() === customerInput.value.trim().toLowerCase());
      if (found && !$('#coContact').value) $('#coContact').value = found.phone || found.contact || found.email || '';
    });

    $('#coShipping').addEventListener('input', actualizarResumenPedidoPersonalizado);
    $('#customOrderForm').addEventListener('submit', guardarPedidoPersonalizado);
    anadirLineaPedidoPersonalizado();
  };

  window.anadirLineaPedidoPersonalizado = function(prefill = {}) {
    const holder = $('#coLines');
    if (!holder) return;
    const id = ++lineSeq;
    const wrap = document.createElement('div');
    wrap.className = 'card custom-order-line';
    wrap.dataset.lineId = id;
    wrap.style.cssText = 'padding:16px;box-shadow:none;border:1px solid #dfe4ec;';
    wrap.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px;">
        <b>Artículo <span class="co-line-number"></span></b>
        <button type="button" class="secondary small" onclick="eliminarLineaPedidoPersonalizado(this)">Eliminar</button>
      </div>

      <div class="field">
        <label>Modelo de prenda *</label>
        <select class="co-model" required onchange="actualizarModeloLineaPersonalizada(this)">
          <option value="">— Selecciona modelo —</option>
          ${modelCache.map(m => `<option value="${m.id}" ${prefill.custom_model_id===m.id?'selected':''}>${E(modelLabel(m))}</option>`).join('')}
        </select>
      </div>

      <div class="formgrid">
        <div class="field">
          <label>Variante</label>
          <select class="co-variant" onchange="actualizarVarianteLineaPersonalizada(this)">
            <option value="">— Sin variante —</option>
          </select>
        </div>
        <div class="field">
          <label>Personalización / diseño</label>
          <input class="co-personalization" value="${E(prefill.personalization_name || '')}" placeholder="Ej. Logo + dorsal / Diseño Paula">
        </div>
      </div>

      <div class="formgrid">
        <div class="field">
          <label>Talla</label>
          <input class="co-size" list="co-size-list-${id}" value="${E(prefill.size || '')}" placeholder="Ej. M, 12, 7/8">
          <datalist id="co-size-list-${id}"></datalist>
        </div>
        <div class="field">
          <label>Color</label>
          <input class="co-color" list="co-color-list-${id}" value="${E(prefill.color || '')}" placeholder="Ej. Negro">
          <datalist id="co-color-list-${id}"></datalist>
        </div>
      </div>

      <div class="field">
        <label>Zona(s) de personalización</label>
        <input class="co-area" value="${E(prefill.personalization_area || '')}" placeholder="Ej. pecho derecho + espalda + manga">
      </div>

      <div class="formgrid">
        <div class="field">
          <label>Cantidad *</label>
          <input class="co-qty" type="number" min="1" step="1" value="${Math.max(1,N(prefill.quantity || 1))}" required>
        </div>
        <div class="field">
          <label>Precio unitario (€)</label>
          <input class="co-price" type="number" min="0" step=".01" value="${N(prefill.unit_price || 0)}">
        </div>
      </div>

      <div class="formgrid">
        <div class="field">
          <label>Coste unitario estimado (€)</label>
          <input class="co-cost" type="number" min="0" step=".01" value="${N(prefill.unit_cost || 0)}">
        </div>
        <div class="field">
          <label>Archivo(s) de este artículo</label>
          <input class="co-item-files" type="file" multiple accept="image/*,application/pdf">
        </div>
      </div>

      <div class="field">
        <label>Notas de esta línea</label>
        <textarea class="co-notes" rows="2" placeholder="Nombre dorsal, medidas DTF, instrucciones especiales...">${E(prefill.notes || '')}</textarea>
      </div>
    `;
    holder.appendChild(wrap);

    wrap.querySelectorAll('input,textarea,select').forEach(el => {
      if (!el.classList.contains('co-model') && !el.classList.contains('co-variant')) {
        el.addEventListener('input', actualizarResumenPedidoPersonalizado);
        el.addEventListener('change', actualizarResumenPedidoPersonalizado);
      }
    });

    if (prefill.custom_model_id) {
      actualizarModeloLineaPersonalizada(wrap.querySelector('.co-model'), prefill.garment_variant || '');
    }
    renumerarLineasPersonalizadas();
    actualizarResumenPedidoPersonalizado();
  };

  window.eliminarLineaPedidoPersonalizado = function(btn) {
    const lines = document.querySelectorAll('.custom-order-line');
    if (lines.length <= 1) {
      toast('El pedido debe tener al menos un artículo');
      return;
    }
    btn.closest('.custom-order-line')?.remove();
    renumerarLineasPersonalizadas();
    actualizarResumenPedidoPersonalizado();
  };

  function renumerarLineasPersonalizadas() {
    document.querySelectorAll('.custom-order-line').forEach((line, i) => {
      const n = line.querySelector('.co-line-number');
      if (n) n.textContent = String(i + 1);
    });
  }

  window.actualizarModeloLineaPersonalizada = function(sel, wantedVariant = '') {
    const line = sel.closest('.custom-order-line');
    const m = modelCache.find(x => x.id === sel.value);
    if (!line) return;
    const variant = line.querySelector('.co-variant');
    const variants = variantList(m);

    variant.innerHTML = '<option value="">— Sin variante —</option>' +
      variants.map(v => {
        const name = String(v.name || v.label || '');
        return `<option value="${E(name)}" ${wantedVariant===name?'selected':''}>${E(name)}</option>`;
      }).join('');

    if (wantedVariant && !variants.some(v => String(v.name || v.label || '') === wantedVariant)) {
      variant.insertAdjacentHTML('beforeend', `<option selected value="${E(wantedVariant)}">${E(wantedVariant)}</option>`);
    }

    fillLineLists(line, m, wantedVariant || variant.value);
    actualizarResumenPedidoPersonalizado();
  };

  window.actualizarVarianteLineaPersonalizada = function(sel) {
    const line = sel.closest('.custom-order-line');
    const m = modelCache.find(x => x.id === line?.querySelector('.co-model')?.value);
    if (!line) return;
    fillLineLists(line, m, sel.value);
    actualizarResumenPedidoPersonalizado();
  };

  function fillLineLists(line, m, variantName) {
    const id = line.dataset.lineId;
    let sizes = list(m?.sizes);
    let colors = list(m?.colors);
    const v = variantList(m).find(x => String(x.name || x.label || '') === String(variantName || ''));
    if (v) {
      if (list(v.sizes).length) sizes = list(v.sizes);
      if (list(v.colors).length) colors = list(v.colors);
    }
    const sizeList = document.getElementById('co-size-list-' + id);
    const colorList = document.getElementById('co-color-list-' + id);
    if (sizeList) sizeList.innerHTML = sizes.map(x => `<option value="${E(x)}"></option>`).join('');
    if (colorList) colorList.innerHTML = colors.map(x => `<option value="${E(x)}"></option>`).join('');
  }

  window.actualizarResumenPedidoPersonalizado = function() {
    const lines = [...document.querySelectorAll('.custom-order-line')];
    const qty = lines.reduce((a,l) => a + N(l.querySelector('.co-qty')?.value), 0);
    const sub = lines.reduce((a,l) => a + N(l.querySelector('.co-qty')?.value) * N(l.querySelector('.co-price')?.value), 0);
    const cost = lines.reduce((a,l) => a + N(l.querySelector('.co-qty')?.value) * N(l.querySelector('.co-cost')?.value), 0);
    const shipping = N($('#coShipping')?.value);
    const total = sub + shipping;
    const margin = total - cost;
    const el = $('#coSummary');
    if (!el) return;
    el.innerHTML = `
      <div class="statline"><span>Unidades</span><b>${qty}</b></div>
      <div class="statline"><span>Artículos</span><b>${lines.length}</b></div>
      <div class="statline"><span>Subtotal</span><b>${money(sub)}</b></div>
      <div class="statline"><span>Envío</span><b>${money(shipping)}</b></div>
      <div class="statline" style="font-size:18px;"><span>Total cliente</span><b>${money(total)}</b></div>
      <div class="statline"><span>Coste estimado</span><b>${money(cost)}</b></div>
      <div class="statline"><span>Margen estimado</span><b>${money(margin)}</b></div>
    `;
  };

  window.mostrarAltaModeloPersonalizadoRapida = function(modelId = '') {
    const host = $('#coModelQuick');
    if (!host) {
      gestionarModelosPersonalizados(modelId);
      return;
    }
    const m = modelId ? modelCache.find(x => x.id === modelId) : null;
    host.style.display = 'block';
    host.innerHTML = modelFormHtml(m, true);
    renderVariantRows(m?.variants || []);
    host.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  function modelFormHtml(m, quick) {
    return `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
        <div>
          <h3 style="margin:0;">${m ? 'Editar' : 'Nuevo'} modelo de personalización</h3>
          <div class="muted">Este catálogo es independiente de Prendas base.</div>
        </div>
        ${quick ? '<button type="button" class="secondary small" onclick="cerrarAltaModeloRapida()">Cerrar</button>' : ''}
      </div>
      <div class="formgrid" style="margin-top:14px;">
        <div class="field"><label>Tipo *</label><input id="cmType" value="${E(m?.garment_type || 'Camiseta')}" placeholder="Camiseta, técnica, sudadera, tote bag..." required></div>
        <div class="field"><label>Marca / fabricante</label><input id="cmBrand" value="${E(m?.brand || '')}" placeholder="Roly, Mukua..."></div>
      </div>
      <div class="formgrid">
        <div class="field"><label>Modelo *</label><input id="cmName" value="${E(m?.name || '')}" placeholder="Shanghai, Melbourne..." required></div>
        <div class="field"><label>Referencia</label><input id="cmReference" value="${E(m?.reference || '')}" placeholder="Código proveedor"></div>
      </div>
      <div class="formgrid">
        <div class="field"><label>Tallas base</label><input id="cmSizes" value="${E(list(m?.sizes).join(', '))}" placeholder="S, M, L, XL"></div>
        <div class="field"><label>Colores base</label><input id="cmColors" value="${E(list(m?.colors).join(', '))}" placeholder="Negro, Blanco, Navy"></div>
      </div>
      <div class="field"><label>Notas</label><textarea id="cmNotes" rows="2">${E(m?.notes || '')}</textarea></div>
      <div class="section" style="margin-top:8px;">
        <div><b>Variantes del modelo</b><div class="muted">Cada variante puede tener sus propias tallas y colores.</div></div>
        <button type="button" class="secondary small" onclick="anadirVarianteModeloPersonalizado()">＋ Variante</button>
      </div>
      <div id="cmVariants" style="display:grid;gap:8px;"></div>
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button type="button" class="primary" style="flex:1;" onclick="guardarModeloPersonalizado('${m?.id || ''}', ${quick ? 'true' : 'false'})">Guardar modelo</button>
      </div>
    `;
  }

  window.cerrarAltaModeloRapida = function() {
    const host = $('#coModelQuick');
    if (host) { host.style.display = 'none'; host.innerHTML = ''; }
  };

  function renderVariantRows(variants) {
    const host = $('#cmVariants');
    if (!host) return;
    host.innerHTML = '';
    (Array.isArray(variants) ? variants : []).forEach(v => anadirVarianteModeloPersonalizado(v));
  }

  window.anadirVarianteModeloPersonalizado = function(v = {}) {
    const host = $('#cmVariants');
    if (!host) return;
    const row = document.createElement('div');
    row.className = 'cm-variant-row';
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;';
    row.innerHTML = `
      <div class="field" style="margin:0;"><label>Variante</label><input class="cm-v-name" value="${E(v.name || v.label || '')}" placeholder="Manga larga, Premium..."></div>
      <div class="field" style="margin:0;"><label>Tallas</label><input class="cm-v-sizes" value="${E(list(v.sizes).join(', '))}" placeholder="S, M, L"></div>
      <div class="field" style="margin:0;"><label>Colores</label><input class="cm-v-colors" value="${E(list(v.colors).join(', '))}" placeholder="Negro, Blanco"></div>
      <button type="button" class="secondary small" onclick="this.closest('.cm-variant-row').remove()">✕</button>
    `;
    host.appendChild(row);
  };

  window.guardarModeloPersonalizado = async function(id = '', quick = false) {
    const name = $('#cmName')?.value.trim();
    const garmentType = $('#cmType')?.value.trim();
    if (!name || !garmentType) {
      toast('Indica tipo y modelo');
      return;
    }
    const variants = [...document.querySelectorAll('.cm-variant-row')].map(r => ({
      name: r.querySelector('.cm-v-name').value.trim(),
      sizes: csv(r.querySelector('.cm-v-sizes').value),
      colors: csv(r.querySelector('.cm-v-colors').value)
    })).filter(v => v.name);

    const payload = {
      name,
      garment_type: garmentType,
      brand: $('#cmBrand')?.value.trim() || null,
      reference: $('#cmReference')?.value.trim() || null,
      sizes: csv($('#cmSizes')?.value),
      colors: csv($('#cmColors')?.value),
      variants,
      notes: $('#cmNotes')?.value.trim() || null,
      active: true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (id) result = await supabaseClient.from('custom_garment_models').update(payload).eq('id', id).select().single();
    else result = await supabaseClient.from('custom_garment_models').insert(payload).select().single();

    if (result.error) {
      console.error(result.error);
      toast('No se pudo guardar el modelo: ' + result.error.message);
      return;
    }

    toast('Modelo guardado');
    await loadModels(true);

    if (quick) {
      const selectedId = result.data.id;
      document.querySelectorAll('.co-model').forEach(sel => {
        const current = sel.value;
        sel.innerHTML = '<option value="">— Selecciona modelo —</option>' +
          modelCache.map(m => `<option value="${m.id}" ${current===m.id?'selected':''}>${E(modelLabel(m))}</option>`).join('');
      });
      cerrarAltaModeloRapida();
      const last = [...document.querySelectorAll('.custom-order-line')].at(-1);
      if (last && !last.querySelector('.co-model').value) {
        last.querySelector('.co-model').value = selectedId;
        actualizarModeloLineaPersonalizada(last.querySelector('.co-model'));
      }
    } else {
      gestionarModelosPersonalizados();
    }
  };

  window.gestionarModelosPersonalizados = async function(editId = '') {
    try {
      await loadModels(false);
    } catch (e) {
      console.error(e);
      toast('No se pudieron cargar los modelos');
      return;
    }
    const m = editId ? modelCache.find(x => x.id === editId) : null;
    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML = `
      <div class="section">
        <div><h2>👕 Modelos de personalización</h2><div class="muted">Catálogo independiente para encargos a medida.</div></div>
        <button class="primary" onclick="gestionarModelosPersonalizados('__new__')">＋ Nuevo</button>
      </div>
      <div id="cmEditor" class="card" style="display:${m || editId==='__new__' ? 'block' : 'none'};padding:16px;margin-bottom:14px;box-shadow:none;">
        ${m || editId==='__new__' ? modelFormHtml(m || null, false) : ''}
      </div>
      <div style="display:grid;gap:10px;">
        ${modelCache.length ? modelCache.map(x => `
          <div class="card" style="padding:14px;box-shadow:none;border:1px solid #e5e9f0;opacity:${x.active===false?'.55':'1'}">
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <div>
                <b>${E(modelLabel(x))}</b>
                <div class="muted" style="margin-top:4px;">Tallas: ${E(list(x.sizes).join(', ') || '—')} · Colores: ${E(list(x.colors).join(', ') || '—')}</div>
                ${variantList(x).length ? `<div class="muted" style="margin-top:4px;">Variantes: ${variantList(x).map(v=>E(v.name||v.label)).join(' · ')}</div>` : ''}
              </div>
              <button class="secondary small" onclick="gestionarModelosPersonalizados('${x.id}')">Editar</button>
            </div>
          </div>
        `).join('') : '<div class="empty">Todavía no hay modelos. Crea el primero.</div>'}
      </div>
    `;
    if (m || editId === '__new__') renderVariantRows(m?.variants || []);
  };

  function collectCustomOrderLines() {
    return [...document.querySelectorAll('.custom-order-line')].map((line, index) => {
      const modelId = line.querySelector('.co-model').value;
      const model = modelCache.find(m => m.id === modelId);
      return {
        _line: line,
        line_no: index + 1,
        personalization_name: line.querySelector('.co-personalization').value.trim() || 'Personalización',
        custom_model_id: modelId || null,
        garment_type: model?.garment_type || 'Prenda',
        garment_model: model?.name || '',
        brand: model?.brand || null,
        garment_variant: line.querySelector('.co-variant').value || null,
        size: line.querySelector('.co-size').value.trim() || null,
        color: line.querySelector('.co-color').value.trim() || null,
        personalization_area: line.querySelector('.co-area').value.trim() || null,
        quantity: Math.max(1, N(line.querySelector('.co-qty').value)),
        unit_price: N(line.querySelector('.co-price').value),
        unit_cost: N(line.querySelector('.co-cost').value),
        notes: line.querySelector('.co-notes').value.trim() || null
      };
    });
  }

  async function getOrCreateCustomer(name, contact) {
    const existing = (customers || []).find(c => String(c.name || '').trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      if (contact && !existing.contact && !existing.phone && !existing.email) {
        await supabaseClient.from('customers').update({ contact }).eq('id', existing.id);
      }
      return existing;
    }
    const { data, error } = await supabaseClient
      .from('customers')
      .insert({ name: name.trim(), contact: contact || null })
      .select()
      .single();
    if (error) throw error;
    customers.push(data);
    return data;
  }

  async function nextOrderNumber() {
    const { data, error } = await supabaseClient.rpc('next_aihxo_order_number');
    if (error) throw error;
    return data;
  }

  async function uploadCustomOrderFile(orderId, itemId, file, kind = 'cliente') {
    const path = `pedidos-personalizados/${orderId}/${itemId || 'general'}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${slug(file.name)}`;
    const { error: upError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type || undefined });
    if (upError) throw upError;

    const { error: dbError } = await supabaseClient
      .from('custom_order_files')
      .insert({
        order_id: orderId,
        item_id: itemId || null,
        file_kind: kind,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || null
      });
    if (dbError) throw dbError;
  }

  async function guardarPedidoPersonalizado(e) {
    e.preventDefault();
    const btn = $('#coSave');
    const customerName = $('#coCustomer').value.trim();
    const contact = $('#coContact').value.trim();
    const lines = collectCustomOrderLines();

    if (!customerName) { toast('Indica el cliente'); return; }
    if (!lines.length) { toast('Añade al menos un artículo'); return; }
    if (lines.some(x => !x.custom_model_id || !x.garment_model)) {
      toast('Selecciona un modelo en todos los artículos');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'GUARDANDO...';

    try {
      const customer = await getOrCreateCustomer(customerName, contact);
      const orderNumber = await nextOrderNumber();
      const qty = totalLinesFromItems(lines);
      const subtotal = subtotalFromItems(lines);
      const estimatedCost = costFromItems(lines);
      const shipping = N($('#coShipping').value);
      const total = subtotal + shipping;
      const avgPrice = qty ? subtotal / qty : 0;
      const design = $('#coDesign').value.trim() || 'Pedido personalizado';
      const brief = $('#coBrief').value.trim();
      const due = $('#coDue').value || null;
      const generalFiles = Array.from($('#coFiles').files || []);

      const orderPayload = {
        order_number: orderNumber,
        order_type: 'personalizado',
        customer_id: customer.id,
        customer_name: customer.name,
        contact: contact || customer.contact || customer.phone || customer.email || null,
        product_id: null,
        product_name: lines.length === 1 ? lines[0].garment_model : `Pedido personalizado · ${lines.length} artículos`,
        size: lines.length === 1 ? lines[0].size : null,
        color: lines.length === 1 ? lines[0].color : null,
        design,
        quantity: qty,
        unit_price: avgPrice,
        shipping,
        total,
        product_cost: estimatedCost,
        status: 'Pendiente',
        base_stock_item_id: null,
        base_stock_quantity: 0,
        design_brief: brief || null,
        design_due_date: due,
        design_status: 'Pendiente',
        design_approval_status: 'Pendiente',
        dtf_status: 'Pendiente',
        production_status: 'Pendiente',
        internal_notes: 'Pedido personalizado multiartículo',
        design_source: generalFiles.length ? 'customer_reference' : 'aihxo'
      };

      const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();
      if (orderError) throw orderError;

      const rows = lines.map(({_line, ...x}) => ({ ...x, order_id: order.id }));
      const { data: savedItems, error: itemError } = await supabaseClient
        .from('custom_order_items')
        .insert(rows)
        .select();
      if (itemError) throw itemError;

      const savedByLine = {};
      (savedItems || []).forEach(x => savedByLine[x.line_no] = x);

      btn.textContent = 'SUBIENDO ARCHIVOS...';
      for (const file of generalFiles) {
        await uploadCustomOrderFile(order.id, null, file, 'cliente');
      }

      for (const line of lines) {
        const saved = savedByLine[line.line_no];
        const files = Array.from(line._line.querySelector('.co-item-files').files || []);
        for (const file of files) {
          await uploadCustomOrderFile(order.id, saved?.id || null, file, 'cliente_articulo');
        }
      }

      await loadAll();
      closeDrawer();
      toast(`Pedido ${orderNumber} guardado`);
      setView('custom-orders');
    } catch (err) {
      console.error(err);
      toast('No se pudo guardar: ' + (err.message || err));
      btn.disabled = false;
      btn.textContent = 'GUARDAR PEDIDO PERSONALIZADO';
    }
  }

  window.abrirPedidoPersonalizado = async function(id) {
    const order = customOrderCache.find(o => o.id === id) || orders.find(o => o.id === id);
    if (!order) { toast('Pedido no encontrado'); return; }

    const [{ data: items, error: ie }, { data: files, error: fe }] = await Promise.all([
      supabaseClient.from('custom_order_items').select('*').eq('order_id', id).order('line_no'),
      supabaseClient.from('custom_order_files').select('*').eq('order_id', id).order('created_at')
    ]);
    if (ie || fe) {
      console.error(ie || fe);
      toast('No se pudo abrir la ficha');
      return;
    }

    const fileRows = [];
    for (const f of files || []) {
      const { data } = await supabaseClient.storage.from(BUCKET).createSignedUrl(f.storage_path, 3600);
      fileRows.push({ ...f, signed_url: data?.signedUrl || '' });
    }

    const byItem = {};
    fileRows.forEach(f => (byItem[f.item_id || 'general'] ||= []).push(f));
    const allItems = items || [];

    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML = `
      <div class="section">
        <div>
          <h2 style="margin-bottom:3px;">${E(order.order_number)}</h2>
          <div class="muted">${E(order.customer_name)}${order.contact ? ' · ' + E(order.contact) : ''}</div>
        </div>
        <b style="font-size:20px;">${money(order.total)}</b>
      </div>

      <div class="card" style="padding:16px;box-shadow:none;">
        <div class="formgrid">
          <div class="field">
            <label>Estado pedido</label>
            <select id="codStatus">
              ${['Pendiente','Diseño preparado','Pendiente llegada','En producción','Terminado','Enviado','Entregado','Cancelado'].map(s => `<option ${order.status===s?'selected':''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Fecha objetivo</label>
            <input id="codDue" type="date" value="${E(order.design_due_date || '')}">
          </div>
        </div>
        <div class="field">
          <label>Briefing / notas generales</label>
          <textarea id="codBrief" rows="4">${E(order.design_brief || '')}</textarea>
        </div>
        <button class="primary" type="button" onclick="guardarCabeceraPedidoPersonalizado('${id}')">Guardar cambios</button>
      </div>

      ${byItem.general?.length ? `
        <div class="card" style="padding:16px;margin-top:12px;box-shadow:none;">
          <h3 style="margin-top:0;">Archivos generales del cliente</h3>
          <div style="display:grid;gap:8px;">
            ${byItem.general.map(f => `<a class="secondary" href="${E(f.signed_url)}" target="_blank" rel="noopener">📎 ${E(f.file_name)}</a>`).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:grid;gap:12px;margin-top:12px;">
        ${allItems.map(i => `
          <div class="card" style="padding:16px;box-shadow:none;border:1px solid #e5e9f0;">
            <div style="display:flex;justify-content:space-between;gap:10px;">
              <div>
                <div class="muted" style="font-size:11px;font-weight:900;">ARTÍCULO ${i.line_no}</div>
                <h3 style="margin:4px 0 2px;">${E([i.brand,i.garment_model].filter(Boolean).join(' · '))}</h3>
                ${i.garment_variant ? `<div class="muted">Variante: ${E(i.garment_variant)}</div>` : ''}
              </div>
              <div style="text-align:right;"><b>${i.quantity} ud.</b><div class="muted">${money(i.unit_price)} / ud.</div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin-top:12px;font-size:13px;">
              <div><span class="muted">Tipo</span><br><b>${E(i.garment_type || '—')}</b></div>
              <div><span class="muted">Talla</span><br><b>${E(i.size || '—')}</b></div>
              <div><span class="muted">Color</span><br><b>${E(i.color || '—')}</b></div>
              <div><span class="muted">Zona</span><br><b>${E(i.personalization_area || '—')}</b></div>
            </div>
            <div style="margin-top:10px;"><span class="muted">Personalización</span><br><b>${E(i.personalization_name || '—')}</b></div>
            ${i.notes ? `<div class="muted" style="margin-top:8px;">${E(i.notes)}</div>` : ''}
            ${byItem[i.id]?.length ? `<div style="display:grid;gap:6px;margin-top:10px;">${byItem[i.id].map(f=>`<a class="secondary" href="${E(f.signed_url)}" target="_blank" rel="noopener">📎 ${E(f.file_name)}</a>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="card" style="padding:16px;margin-top:12px;box-shadow:none;">
        <div class="statline"><span>Unidades</span><b>${totalLinesFromItems(allItems)}</b></div>
        <div class="statline"><span>Subtotal</span><b>${money(subtotalFromItems(allItems))}</b></div>
        <div class="statline"><span>Envío</span><b>${money(order.shipping)}</b></div>
        <div class="statline" style="font-size:18px;"><span>Total</span><b>${money(order.total)}</b></div>
      </div>
    `;
  };

  window.guardarCabeceraPedidoPersonalizado = async function(id) {
    const patch = {
      status: $('#codStatus').value,
      design_due_date: $('#codDue').value || null,
      design_brief: $('#codBrief').value.trim() || null,
      production_updated_at: new Date().toISOString()
    };
    const { error } = await supabaseClient.from('orders').update(patch).eq('id', id);
    if (error) { console.error(error); toast('No se pudo guardar'); return; }
    const local = customOrderCache.find(o => o.id === id); if (local) Object.assign(local, patch);
    const global = orders.find(o => o.id === id); if (global) Object.assign(global, patch);
    toast('Ficha actualizada');
  };

  const oldSetView = window.setView;
  window.setView = function(v) {
    if (v === 'custom-orders') {
      document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
      const title = $('#title'); if (title) title.textContent = 'Pedidos personalizados';
      pedidosPersonalizadosView($('#view'));
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
      return;
    }
    return oldSetView(v);
  };

  function injectNav() {
    const ordersBtn = document.querySelector('#nav button[data-view="orders"]');
    if (!ordersBtn || document.querySelector('#nav button[data-view="custom-orders"]')) return;
    const b = document.createElement('button');
    b.dataset.view = 'custom-orders';
    b.innerHTML = '🧵 <span>Pedidos personalizados</span>';
    b.onclick = () => setView('custom-orders');
    ordersBtn.insertAdjacentElement('afterend', b);
  }
  setTimeout(injectNav, 0);
})();