/* AIHXO · Calculadora de costes de producción · v1 */
(function(){
  const N = v => Number(v || 0);
  const M = n => new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(N(n));
  const E = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  let stockCache = [];
  let orderCache = [];

  function val(id){ return N(document.getElementById(id)?.value); }
  function setVal(id,v){ const el=document.getElementById(id); if(el) el.value = Number.isFinite(Number(v)) ? Number(v) : 0; }
  function selectedOrder(){ return orderCache.find(o=>String(o.id)===String(document.getElementById('pcOrder')?.value)); }

  async function loadData(){
    const [sr,or] = await Promise.all([
      supabaseClient.from('base_stock_items').select('id,garment_type,supplier,supplier_model,size,color,quantity,unit_cost').order('supplier_model'),
      supabaseClient.from('orders').select('id,order_number,customer_name,product_name,quantity,total,shipping,base_stock_item_id,garment_actual_cost,dtf_actual_cost,packaging_cost,supplier_shipping_cost,extras_actual_cost,estimated_costs,status,order_type').order('created_at',{ascending:false})
    ]);
    if(sr.error) throw sr.error;
    if(or.error) throw or.error;
    stockCache = sr.data || [];
    orderCache = or.data || [];
  }

  function stockLabel(s){
    return [s.supplier,s.supplier_model,s.size,s.color].filter(Boolean).join(' · ');
  }

  function calculate(){
    const qty = Math.max(1,Math.round(val('pcQty')));
    const garmentUnit = val('pcGarment');
    const dtfUnit = val('pcDtfUnit');
    const dtfOrder = val('pcDtfOrder');
    const packagingUnit = val('pcPackaging');
    const supplierShipping = val('pcSupplierShip');
    const materials = val('pcMaterials');
    const labor = (val('pcMinutes')/60) * val('pcHourly');
    const energy = val('pcEnergy');
    const wastePct = val('pcWaste')/100;
    const feePct = Math.min(.95,val('pcFee')/100);
    const marginPct = Math.min(.95,val('pcMargin')/100);
    const vatPct = val('pcVat')/100;

    const garment = garmentUnit * qty;
    const dtf = dtfUnit * qty + dtfOrder;
    const packaging = packagingUnit * qty;
    const direct = garment + dtf + packaging + supplierShipping + materials + labor + energy;
    const waste = direct * wastePct;
    const productionCost = direct + waste;

    const denom = Math.max(.01,1-feePct-marginPct);
    const recommendedNet = productionCost / denom;
    const fee = recommendedNet * feePct;
    const recommendedGross = recommendedNet * (1+vatPct);

    const breakEvenNet = productionCost / Math.max(.01,1-feePct);
    const breakEvenGross = breakEvenNet * (1+vatPct);
    const targetProfit = recommendedNet - productionCost - fee;
    const order = selectedOrder();
    const currentSale = order ? N(order.total) : val('pcSaleTotal');
    const currentSaleNet = currentSale / (1+vatPct);
    const currentFee = currentSaleNet * feePct;
    const currentProfit = currentSale ? currentSaleNet-productionCost-currentFee : 0;
    const currentMargin = currentSaleNet ? currentProfit/currentSaleNet*100 : 0;

    const out = {
      qty, garmentUnit, garment, dtfUnit, dtfOrder, dtf, packagingUnit, packaging,
      supplierShipping, materials, labor, energy, wastePct: wastePct*100, waste,
      productionCost, feePct: feePct*100, fee, marginPct: marginPct*100,
      vatPct: vatPct*100, recommendedNet, recommendedGross, breakEvenGross,
      targetProfit, currentSale, currentProfit, currentMargin,
      calculatedAt:new Date().toISOString()
    };

    const put=(id,x)=>{const el=document.getElementById(id); if(el) el.textContent=M(x);};
    put('pcTotalCost',productionCost);
    put('pcUnitCost',productionCost/qty);
    put('pcRecommended',recommendedGross/qty);
    put('pcBreakEven',breakEvenGross/qty);
    put('pcTargetProfit',targetProfit);
    put('pcCurrentProfit',currentProfit);

    const marginEl=document.getElementById('pcCurrentMargin');
    if(marginEl) marginEl.textContent = currentSale ? currentMargin.toFixed(1)+'%' : '—';

    const compare=document.getElementById('pcCompare');
    if(compare){
      if(order){
        const diff=currentSale-recommendedGross;
        compare.innerHTML = `
          <div class="statline"><span>Venta actual del pedido</span><b>${M(currentSale)}</b></div>
          <div class="statline"><span>PVP objetivo total</span><b>${M(recommendedGross)}</b></div>
          <div class="statline"><span>Diferencia venta vs objetivo</span><b style="color:${diff>=0?'#067647':'#b42318'}">${diff>=0?'+':''}${M(diff)}</b></div>
        `;
      }else compare.innerHTML='';
    }

    window._aihxoProductionCostCalc = out;
    return out;
  }

  function bindInputs(){
    document.querySelectorAll('#pcCalc input,#pcCalc select').forEach(el=>{
      el.addEventListener('input',calculate);
      el.addEventListener('change',calculate);
    });
  }

  function restoreDefaults(){
    setVal('pcDtfUnit',.60);
    setVal('pcDtfOrder',0);
    setVal('pcPackaging',.30);
    setVal('pcSupplierShip',7);
    setVal('pcMaterials',0);
    setVal('pcMinutes',15);
    setVal('pcHourly',12);
    setVal('pcEnergy',.30);
    setVal('pcWaste',3);
    setVal('pcFee',0);
    setVal('pcMargin',40);
    setVal('pcVat',21);
  }

  window.aihxoCostSelectOrder = function(){
    const o=selectedOrder();
    const stockSel=document.getElementById('pcStock');
    if(!o){
      setVal('pcQty',1); setVal('pcSaleTotal',0);
      if(stockSel) stockSel.value='';
      calculate(); return;
    }
    setVal('pcQty',Math.max(1,N(o.quantity)||1));
    setVal('pcSaleTotal',N(o.total));
    if(stockSel && o.base_stock_item_id){
      stockSel.value=o.base_stock_item_id;
      window.aihxoCostSelectStock();
    }
    const ec=o.estimated_costs && typeof o.estimated_costs==='object' ? o.estimated_costs : {};
    if(N(o.garment_actual_cost)>0) setVal('pcGarment',N(o.garment_actual_cost)/Math.max(1,N(o.quantity)||1));
    if(N(o.dtf_actual_cost)>0) setVal('pcDtfUnit',N(o.dtf_actual_cost)/Math.max(1,N(o.quantity)||1));
    if(N(o.packaging_cost)>0) setVal('pcPackaging',N(o.packaging_cost)/Math.max(1,N(o.quantity)||1));
    if(N(o.supplier_shipping_cost)>0) setVal('pcSupplierShip',o.supplier_shipping_cost);
    if(ec.labor_minutes!=null) setVal('pcMinutes',ec.labor_minutes);
    if(ec.hourly_rate!=null) setVal('pcHourly',ec.hourly_rate);
    if(ec.energy!=null) setVal('pcEnergy',ec.energy);
    if(ec.materials!=null) setVal('pcMaterials',ec.materials);
    if(ec.waste_pct!=null) setVal('pcWaste',ec.waste_pct);
    if(ec.fee_pct!=null) setVal('pcFee',ec.fee_pct);
    if(ec.margin_pct!=null) setVal('pcMargin',ec.margin_pct);
    calculate();
  };

  window.aihxoCostSelectStock = function(){
    const id=document.getElementById('pcStock')?.value;
    const s=stockCache.find(x=>String(x.id)===String(id));
    if(s) setVal('pcGarment',N(s.unit_cost));
    calculate();
  };

  window.aihxoCostReset = function(){
    document.getElementById('pcOrder').value='';
    document.getElementById('pcStock').value='';
    setVal('pcQty',1); setVal('pcGarment',0); setVal('pcSaleTotal',0);
    restoreDefaults();
    calculate();
  };

  window.aihxoCostSave = async function(){
    const o=selectedOrder();
    if(!o){ toast('Selecciona un pedido para guardar el cálculo'); return; }
    const c=calculate();
    const extras = c.materials + c.labor + c.energy + c.waste;
    const payload = {
      garment_actual_cost: Number(c.garment.toFixed(2)),
      dtf_actual_cost: Number(c.dtf.toFixed(2)),
      packaging_cost: Number(c.packaging.toFixed(2)),
      supplier_shipping_cost: Number(c.supplierShipping.toFixed(2)),
      extras_actual_cost: Number(extras.toFixed(2)),
      product_cost: Number(c.productionCost.toFixed(2)),
      estimated_costs: {
        version:1,
        quantity:c.qty,
        garment_unit:c.garmentUnit,
        garment_total:c.garment,
        dtf_unit:c.dtfUnit,
        dtf_order:c.dtfOrder,
        dtf_total:c.dtf,
        packaging_unit:c.packagingUnit,
        packaging_total:c.packaging,
        supplier_shipping:c.supplierShipping,
        materials:c.materials,
        labor_minutes:val('pcMinutes'),
        hourly_rate:val('pcHourly'),
        labor:c.labor,
        energy:c.energy,
        waste_pct:c.wastePct,
        waste:c.waste,
        fee_pct:c.feePct,
        margin_pct:c.marginPct,
        vat_pct:c.vatPct,
        production_cost:c.productionCost,
        recommended_total_gross:c.recommendedGross,
        recommended_unit_gross:c.recommendedGross/c.qty,
        break_even_unit_gross:c.breakEvenGross/c.qty,
        calculated_at:c.calculatedAt
      }
    };
    const btn=document.getElementById('pcSave');
    if(btn){btn.disabled=true;btn.textContent='Guardando…';}
    const {error}=await supabaseClient.from('orders').update(payload).eq('id',o.id);
    if(btn){btn.disabled=false;btn.textContent='Guardar coste en pedido';}
    if(error){ console.error(error); toast('No se pudo guardar: '+error.message); return; }
    const local=orders.find(x=>String(x.id)===String(o.id));
    if(local) Object.assign(local,payload);
    Object.assign(o,payload);
    toast('Coste guardado en el pedido');
    calculate();
  };

  window.costesProduccionView = async function(c){
    c.innerHTML='<div class="page"><div class="card">⏳ Cargando costes y prendas…</div></div>';
    try{ await loadData(); }
    catch(e){ console.error(e); c.innerHTML='<div class="page"><div class="card">No se pudieron cargar los datos de costes.</div></div>'; return; }

    c.innerHTML=`
      <div class="page" id="pcCalc">
        <div class="section">
          <div>
            <h2>🧮 Costes de producción</h2>
            <div class="muted">Calcula el coste real, PVP objetivo y rentabilidad. Puedes guardar el resultado directamente en un pedido.</div>
          </div>
          <button class="secondary" type="button" onclick="aihxoCostReset()">Nuevo cálculo</button>
        </div>

        <div class="card" style="margin-bottom:14px;">
          <h3 style="margin-top:0;">Pedido y prenda</h3>
          <div class="formgrid">
            <div class="field">
              <label>Pedido</label>
              <select id="pcOrder" onchange="aihxoCostSelectOrder()">
                <option value="">— Cálculo libre —</option>
                ${orderCache.filter(o=>String(o.status||'').toLowerCase()!=='cancelado').map(o=>`<option value="${o.id}">${E(o.order_number||'Pedido')} · ${E(o.customer_name||'')} · ${M(o.total)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Prenda base / stock</label>
              <select id="pcStock" onchange="aihxoCostSelectStock()">
                <option value="">— Seleccionar manualmente —</option>
                ${stockCache.map(s=>`<option value="${s.id}">${E(stockLabel(s))} · ${M(s.unit_cost)} · stock ${N(s.quantity)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="formgrid">
            <div class="field"><label>Unidades</label><input id="pcQty" type="number" min="1" step="1" value="1"></div>
            <div class="field"><label>Venta total actual (€)</label><input id="pcSaleTotal" type="number" min="0" step=".01" value="0"></div>
          </div>
        </div>

        <div class="grid two">
          <div>
            <div class="card">
              <h3 style="margin-top:0;">Costes directos</h3>
              <div class="formgrid">
                <div class="field"><label>Prenda (€ / ud)</label><input id="pcGarment" type="number" min="0" step=".01" value="0"></div>
                <div class="field"><label>DTF (€ / ud)</label><input id="pcDtfUnit" type="number" min="0" step=".01" value=".60"></div>
              </div>
              <div class="formgrid">
                <div class="field"><label>DTF extra del pedido (€)</label><input id="pcDtfOrder" type="number" min="0" step=".01" value="0"></div>
                <div class="field"><label>Embalaje (€ / ud)</label><input id="pcPackaging" type="number" min="0" step=".01" value=".30"></div>
              </div>
              <div class="formgrid">
                <div class="field"><label>Transporte proveedor (€)</label><input id="pcSupplierShip" type="number" min="0" step=".01" value="7"></div>
                <div class="field"><label>Otros materiales (€)</label><input id="pcMaterials" type="number" min="0" step=".01" value="0"></div>
              </div>
            </div>

            <div class="card" style="margin-top:14px;">
              <h3 style="margin-top:0;">Trabajo y riesgo</h3>
              <div class="formgrid">
                <div class="field"><label>Tiempo total (min)</label><input id="pcMinutes" type="number" min="0" step="1" value="15"></div>
                <div class="field"><label>Coste hora (€)</label><input id="pcHourly" type="number" min="0" step=".01" value="12"></div>
              </div>
              <div class="formgrid">
                <div class="field"><label>Energía / desgaste (€)</label><input id="pcEnergy" type="number" min="0" step=".01" value=".30"></div>
                <div class="field"><label>Merma / errores (%)</label><input id="pcWaste" type="number" min="0" step=".1" value="3"></div>
              </div>
              <div class="formgrid">
                <div class="field"><label>Comisión cobro / canal (%)</label><input id="pcFee" type="number" min="0" step=".1" value="0"></div>
                <div class="field"><label>Margen objetivo (%)</label><input id="pcMargin" type="number" min="0" max="95" step=".1" value="40"></div>
              </div>
              <div class="field"><label>IVA de venta (%)</label><input id="pcVat" type="number" min="0" step=".01" value="21"></div>
            </div>
          </div>

          <div>
            <div class="grid kpis" style="grid-template-columns:1fr 1fr;">
              ${kpi('Coste total','<span id="pcTotalCost">0,00 €</span>','producción')}
              ${kpi('Coste / ud','<span id="pcUnitCost">0,00 €</span>','coste real')}
              ${kpi('PVP objetivo / ud','<span id="pcRecommended">0,00 €</span>','con IVA')}
              ${kpi('Mínimo / ud','<span id="pcBreakEven">0,00 €</span>','sin perder')}
              ${kpi('Beneficio objetivo','<span id="pcTargetProfit">0,00 €</span>','pedido completo')}
              ${kpi('Beneficio venta actual','<span id="pcCurrentProfit">0,00 €</span>','margen <span id="pcCurrentMargin">—</span>')}
            </div>

            <div class="card" style="margin-top:14px;">
              <h3 style="margin-top:0;">Comparación del pedido</h3>
              <div id="pcCompare" class="muted">Selecciona un pedido para comparar su venta actual con el objetivo.</div>
            </div>

            <div class="card" style="margin-top:14px;">
              <h3 style="margin-top:0;">Guardar en Gestión</h3>
              <div class="muted" style="margin-bottom:12px;">Al guardar, el desglose pasa al pedido y alimenta automáticamente la vista de Rentabilidad.</div>
              <button id="pcSave" class="primary" type="button" style="width:100%;" onclick="aihxoCostSave()">Guardar coste en pedido</button>
            </div>
          </div>
        </div>
      </div>
    `;
    bindInputs();
    calculate();
  };
})();