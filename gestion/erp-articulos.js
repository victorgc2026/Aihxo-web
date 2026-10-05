/* AIHXO · ERP · Maestro de artículos */
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const N=v=>Number(v||0);
  const EUR=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(v));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

  let cache=[];

  async function load(){
    const {data,error}=await supabaseClient
      .from('erp_item_master')
      .select('*')
      .order('manufacturer')
      .order('model')
      .order('color')
      .order('size');
    if(error) throw error;
    cache=data||[];
    return cache;
  }

  function kpi(title,value,sub=''){
    return `<div class="card" style="padding:14px"><div class="muted" style="font-size:12px;font-weight:800">${E(title)}</div><div style="font-size:24px;font-weight:900;margin-top:3px">${E(value)}</div>${sub?`<div class="muted" style="font-size:12px;margin-top:3px">${E(sub)}</div>`:''}</div>`;
  }

  function renderRows(){
    const q=norm(document.querySelector('#erpItemSearch')?.value||'');
    const supplier=document.querySelector('#erpItemSupplier')?.value||'';
    const state=document.querySelector('#erpItemState')?.value||'';
    const stock=document.querySelector('#erpItemStock')?.value||'';

    let rows=cache.filter(x=>{
      const hay=norm([x.internal_sku,x.barcode,x.supplier_name,x.manufacturer,x.model,x.garment_type,x.audience,x.color,x.size,x.location_code].join(' '));
      if(q && !q.split(/\s+/).filter(Boolean).every(t=>hay.includes(t))) return false;
      if(supplier && String(x.supplier_id||'')!==supplier) return false;
      if(state && String(x.lifecycle_status||'active')!==state) return false;
      const available=N(x.available_quantity);
      if(stock==='low' && !(available<=N(x.min_stock))) return false;
      if(stock==='zero' && available!==0) return false;
      if(stock==='ok' && !(available>N(x.min_stock))) return false;
      return true;
    });

    const el=document.querySelector('#erpItemRows');
    if(!el)return;
    if(!rows.length){
      el.innerHTML='<div class="card"><div class="empty">No hay artículos con estos filtros.</div></div>';
      return;
    }

    el.innerHTML=rows.map(x=>{
      const physical=N(x.physical_quantity), reserved=N(x.reserved_quantity), available=N(x.available_quantity), min=N(x.min_stock);
      const low=available<=min;
      const refs=Array.isArray(x.supplier_references)?x.supplier_references:[];
      return `<div class="card" style="padding:15px;border:${low?'1px solid #f59e0b':'1px solid #e5e7eb'}">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
          <div>
            <div class="muted" style="font-size:11px;font-weight:900">${E(x.internal_sku||'SIN SKU')} · ${E(x.location_code||'')}</div>
            <div style="font-size:18px;font-weight:900;margin-top:2px">${E(x.manufacturer||'')} · ${E(x.model||'')}</div>
            <div class="muted" style="margin-top:3px">${E(x.color||'—')} · ${E(x.size||'—')} · ${E(x.audience||'')}</div>
            <div class="muted" style="margin-top:3px">${E(x.supplier_name||'Sin proveedor')}${refs.length?' · '+refs.length+' ref. proveedor':''}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:23px;font-weight:900">${available}</div>
            <div class="muted" style="font-size:11px">disponibles</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px">
          <div><span class="muted" style="font-size:11px">Físico</span><br><b>${physical}</b></div>
          <div><span class="muted" style="font-size:11px">Reservado</span><br><b>${reserved}</b></div>
          <div><span class="muted" style="font-size:11px">Mínimo</span><br><b>${min}</b></div>
          <div><span class="muted" style="font-size:11px">Coste</span><br><b>${EUR(x.unit_cost)}</b></div>
        </div>

        ${low?`<div style="margin-top:10px;padding:8px 10px;border-radius:10px;background:#fff7ed;color:#9a3412;font-weight:800">⚠️ Reponer · disponible ${available}, mínimo ${min}${N(x.reorder_quantity)>0?' · sugerido '+N(x.reorder_quantity)+' ud.':''}</div>`:''}

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          <button type="button" class="secondary" onclick="aihxoEditarArticuloERP('${x.item_id}')">✏️ Editar ficha</button>
          <button type="button" class="secondary" onclick="verHistorialCamiseta?.('${x.item_id}')">📋 Historial</button>
        </div>
      </div>`;
    }).join('');
  }

  window.articulosERPView=async function(c){
    c.innerHTML='<div class="page"><div class="card">Cargando maestro de artículos…</div></div>';
    try{
      await load();
      const suppliers=[...new Map(cache.filter(x=>x.supplier_id).map(x=>[String(x.supplier_id),x.supplier_name])).entries()];
      const totalUnits=cache.reduce((a,x)=>a+N(x.physical_quantity),0);
      const reserved=cache.reduce((a,x)=>a+N(x.reserved_quantity),0);
      const value=cache.reduce((a,x)=>a+N(x.stock_value),0);
      const low=cache.filter(x=>N(x.available_quantity)<=N(x.min_stock)).length;

      c.innerHTML=`<div class="page">
        <div class="section">
          <div><h2 style="margin:0">📦 Maestro de artículos</h2><div class="muted">Ficha única ERP para compras, stock, pedidos y producción</div></div>
          <button type="button" class="primary" onclick="mostrarNuevaCamiseta?.()">＋ Nueva variante</button>
        </div>

        <div class="grid kpis" style="margin-top:12px">
          ${kpi('Referencias',cache.length,'variantes activas e históricas')}
          ${kpi('Stock físico',totalUnits+' ud.')}
          ${kpi('Reservado',reserved+' ud.')}
          ${kpi('Valor stock',EUR(value),low+' referencias a reponer')}
        </div>

        <div class="card" style="padding:14px;margin-top:14px">
          <div style="display:grid;grid-template-columns:minmax(0,2fr) repeat(3,minmax(120px,1fr));gap:8px">
            <input id="erpItemSearch" placeholder="Buscar SKU, modelo, color, talla, proveedor…" autocomplete="off">
            <select id="erpItemSupplier"><option value="">Todos los proveedores</option>${suppliers.map(([id,name])=>`<option value="${E(id)}">${E(name||'Proveedor')}</option>`).join('')}</select>
            <select id="erpItemStock"><option value="">Todo el stock</option><option value="low">A reponer</option><option value="zero">Sin disponible</option><option value="ok">Stock correcto</option></select>
            <select id="erpItemState"><option value="">Todos los estados</option><option value="active">Activo</option><option value="blocked">Bloqueado</option><option value="discontinued">Descatalogado</option></select>
          </div>
        </div>

        <div id="erpItemRows" style="display:grid;gap:10px;margin-top:12px"></div>
      </div>`;

      ['erpItemSearch','erpItemSupplier','erpItemStock','erpItemState'].forEach(id=>{
        document.querySelector('#'+id)?.addEventListener(id==='erpItemSearch'?'input':'change',renderRows);
      });
      renderRows();
    }catch(err){
      console.error(err);
      c.innerHTML='<div class="page"><div class="card">No se pudo cargar el maestro de artículos.<div class="muted" style="margin-top:6px">'+E(err?.message||'')+'</div></div></div>';
    }
  };

  window.aihxoEditarArticuloERP=async function(id){
    const item=cache.find(x=>String(x.item_id)===String(id));
    if(!item){toast?.('Artículo no encontrado');return;}
    const {data:suppliers}=await supabaseClient.from('suppliers').select('id,name').order('name');
    const d=document.querySelector('#drawer'), b=document.querySelector('#drawerBody');
    if(!d||!b)return;
    d.classList.remove('hidden');
    b.innerHTML=`<h2>Ficha ERP · ${E(item.internal_sku)}</h2>
      <div class="muted" style="margin-bottom:14px">${E(item.manufacturer)} · ${E(item.model)} · ${E(item.color)} · ${E(item.size)}</div>
      <form id="erpItemForm" class="form">
        <div class="formgrid">
          <div class="field"><label>SKU interno</label><input value="${E(item.internal_sku||'')}" disabled></div>
          <div class="field"><label>Código de barras</label><input name="barcode" value="${E(item.barcode||'')}"></div>
        </div>
        <div class="field"><label>Proveedor principal</label><select name="supplier_id"><option value="">Sin proveedor vinculado</option>${(suppliers||[]).map(s=>`<option value="${s.id}" ${String(item.supplier_id||'')===String(s.id)?'selected':''}>${E(s.name)}</option>`).join('')}</select></div>
        <div class="formgrid">
          <div class="field"><label>Ubicación</label><input name="location_code" value="${E(item.location_code||'ALM-01')}"></div>
          <div class="field"><label>Coste unitario €</label><input name="unit_cost" type="number" min="0" step=".01" value="${N(item.unit_cost).toFixed(2)}"></div>
        </div>
        <div class="formgrid">
          <div class="field"><label>Stock mínimo</label><input name="min_stock" type="number" min="0" step="1" value="${N(item.min_stock)}"></div>
          <div class="field"><label>Cantidad sugerida de reposición</label><input name="reorder_quantity" type="number" min="0" step="1" value="${N(item.reorder_quantity)}"></div>
        </div>
        <div class="formgrid">
          <div class="field"><label>Reservado</label><input name="reserved_quantity" type="number" min="0" step="1" value="${N(item.reserved_quantity)}"><div class="muted">Temporalmente editable hasta automatizar las reservas desde pedidos.</div></div>
          <div class="field"><label>Estado</label><select name="lifecycle_status">${[['active','Activo'],['blocked','Bloqueado'],['discontinued','Descatalogado']].map(([v,l])=>`<option value="${v}" ${String(item.lifecycle_status)===v?'selected':''}>${l}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label>Notas</label><textarea name="notes" rows="3">${E(item.notes||'')}</textarea></div>
        <button class="primary" type="submit" style="width:100%">Guardar ficha ERP</button>
      </form>`;

    b.querySelector('#erpItemForm').onsubmit=async e=>{
      e.preventDefault();
      const btn=e.submitter; if(btn){btn.disabled=true;btn.textContent='Guardando…';}
      const fd=new FormData(e.target);
      const patch={
        barcode:String(fd.get('barcode')||'').trim()||null,
        supplier_id:fd.get('supplier_id')||null,
        location_code:String(fd.get('location_code')||'ALM-01').trim()||'ALM-01',
        unit_cost:Math.max(0,N(fd.get('unit_cost'))),
        min_stock:Math.max(0,Math.round(N(fd.get('min_stock')))),
        reorder_quantity:Math.max(0,Math.round(N(fd.get('reorder_quantity')))),
        reserved_quantity:Math.max(0,Math.round(N(fd.get('reserved_quantity')))),
        lifecycle_status:String(fd.get('lifecycle_status')||'active'),
        active:String(fd.get('lifecycle_status')||'active')==='active',
        notes:String(fd.get('notes')||'').trim(),
        cost_updated_at:new Date().toISOString(),
        updated_at:new Date().toISOString()
      };
      const {error}=await supabaseClient.from('base_stock_items').update(patch).eq('id',id);
      if(error){console.error(error);toast?.('No se pudo guardar: '+error.message);if(btn){btn.disabled=false;btn.textContent='Guardar ficha ERP';}return;}
      toast?.('Ficha ERP actualizada');
      if(typeof closeDrawer==='function')closeDrawer(); else d.classList.add('hidden');
      await window.articulosERPView?.(document.querySelector('#view'));
    };
  };

  const oldSetView=window.setView;
  window.setView=function(v){
    if(v==='erp-items'){
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      const t=document.querySelector('#title'); if(t)t.textContent='Maestro de artículos';
      window.articulosERPView(document.querySelector('#view'));
      if(typeof window.closeMobileMenu==='function')window.closeMobileMenu();
      return;
    }
    return oldSetView(v);
  };

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav||nav.querySelector('button[data-view="erp-items"]'))return;
    const stockBtn=nav.querySelector('button[data-view="stock"]')||nav.querySelector('button[data-view="purchases"]');
    const b=document.createElement('button');
    b.dataset.view='erp-items';
    b.innerHTML='📦 <span>Maestro artículos</span>';
    b.onclick=()=>setView('erp-items');
    if(stockBtn) stockBtn.insertAdjacentElement('afterend',b); else nav.appendChild(b);
  }
  setTimeout(injectNav,0);
})();
