(function(){
  const sb = window.supabaseClient;
  if (!sb) return;

  let financeData = {
    orders: [],
    expenses: [],
    purchases: []
  };

  const money = n => new Intl.NumberFormat('es-ES',{
    style:'currency',
    currency:'EUR'
  }).format(Number(n)||0);

  const esc = s => String(s ?? '').replace(/[&<>"']/g,m=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[m]));

  const toast = t => window.toast ? window.toast(t) : alert(t);

  async function loadFinance(){

    const [o,e,p] = await Promise.all([
      sb.from('orders')
        .select('*')
        .order('order_date',{ascending:false}),

      sb.from('expenses')
        .select('*')
        .order('expense_date',{ascending:false}),

      sb.from('purchases')
        .select('*')
        .order('purchase_date',{ascending:false})
    ]);

    if(o.error || e.error || p.error){
      console.error(o.error || e.error || p.error);
      toast('Error cargando Finanzas');
      return;
    }

    financeData.orders = o.data || [];
    financeData.expenses = e.data || [];
    financeData.purchases = p.data || [];
  }

  function addFinanceButton(){

    const nav = document.querySelector('#nav');

    if(!nav) return;

    if(nav.querySelector('[data-view="finance"]')) return;

    nav.insertAdjacentHTML('beforeend',`
      <button data-view="finance">
        € <span>Finanzas</span>
      </button>
    `);

    nav.querySelector('[data-view="finance"]').onclick =
      () => window.setView('finance');
  }

  function financeView(c){

    const orders = financeData.orders;
    const expenses = financeData.expenses;
    const purchases = financeData.purchases;

    const sales = orders.reduce(
      (a,o)=>a+Number(o.total||0),0
    );

    const productCosts = orders.reduce(
      (a,o)=>a+Number(o.product_cost||0),0
    );

    const expenseTotal = expenses.reduce(
      (a,e)=>a+Number(e.amount||0),0
    );

    const purchaseTotal = purchases.reduce(
      (a,p)=>a+Number(p.amount||0),0
    );

    const grossProfit = sales - productCosts;

    const result = sales - productCosts - expenseTotal;

    const margin = sales
      ? (grossProfit / sales) * 100
      : 0;

    const pending = orders
      .filter(o => ['Pendiente','En producción','Preparado']
      .includes(o.status))
      .reduce((a,o)=>a+Number(o.total||0),0);

    const months = [];

    for(let i=5;i>=0;i--){

      const d = new Date();

      d.setMonth(d.getMonth()-i);

      const y = d.getFullYear();
      const m = d.getMonth();

      const label = d.toLocaleDateString(
        'es-ES',
        {month:'short'}
      );

      const monthOrders = orders.filter(o=>{
        const od = new Date(o.order_date);
        return od.getFullYear()===y &&
               od.getMonth()===m;
      });

      const monthExpenses = expenses.filter(e=>{
        const ed = new Date(e.expense_date);
        return ed.getFullYear()===y &&
               ed.getMonth()===m;
      });

      const monthPurchases = purchases.filter(p=>{
        const pd = new Date(p.purchase_date);
        return pd.getFullYear()===y &&
               pd.getMonth()===m;
      });

      const s = monthOrders.reduce(
        (a,o)=>a+Number(o.total||0),0
      );

      const c = monthOrders.reduce(
        (a,o)=>a+Number(o.product_cost||0),0
      );

      const ex = monthExpenses.reduce(
        (a,e)=>a+Number(e.amount||0),0
      );

      const pu = monthPurchases.reduce(
        (a,p)=>a+Number(p.amount||0),0
      );

      months.push({
        label,
        sales:s,
        costs:c,
        expenses:ex,
        purchases:pu,
        result:s-c-ex
      });
    }

    c.innerHTML = `
      <div class="page">

        <div class="section">
          <div>
            <h2>Finanzas</h2>
            <div class="muted">
              Resumen económico de AIHXO
            </div>
          </div>

          <button class="secondary" id="refreshFinance">
            ↻ Actualizar
          </button>
        </div>

        <div class="grid kpis">

          <div class="card">
            <div class="label">Ventas</div>
            <div class="kvalue">${money(sales)}</div>
            <div class="sub">
              ${orders.length} pedidos
            </div>
          </div>

          <div class="card">
            <div class="label">Coste productos</div>
            <div class="kvalue">${money(productCosts)}</div>
            <div class="sub">
              Coste de lo vendido
            </div>
          </div>

          <div class="card">
            <div class="label">Gastos</div>
            <div class="kvalue">${money(expenseTotal)}</div>
            <div class="sub">
              Gastos registrados
            </div>
          </div>

          <div class="card">
            <div class="label">Resultado</div>
            <div class="kvalue ${
              result >= 0 ? 'green' : 'red'
            }">
              ${money(result)}
            </div>
            <div class="sub">
              Resultado estimado
            </div>
          </div>

          <div class="card">
            <div class="label">Margen bruto</div>
            <div class="kvalue">
              ${margin.toFixed(1)}%
            </div>
            <div class="sub">
              Antes de gastos
            </div>
          </div>

          <div class="card">
            <div class="label">Compras</div>
            <div class="kvalue">
              ${money(purchaseTotal)}
            </div>
            <div class="sub">
              A proveedores
            </div>
          </div>

        </div>

        <div class="grid two">

          <div class="card">

            <div class="section">
              <h2>Últimos 6 meses</h2>
            </div>

            <div class="table-wrap">

              <table>

                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Ventas</th>
                    <th>Costes</th>
                    <th>Gastos</th>
                    <th>Resultado</th>
                  </tr>
                </thead>

                <tbody>

                  ${months.map(x=>`

                    <tr>

                      <td>
                        <b>${esc(x.label)}</b>
                      </td>

                      <td>
                        ${money(x.sales)}
                      </td>

                      <td>
                        ${money(x.costs)}
                      </td>

                      <td>
                        ${money(x.expenses)}
                      </td>

                      <td class="${
                        x.result >= 0
                          ? 'green'
                          : 'red'
                      }">
                        <b>${money(x.result)}</b>
                      </td>

                    </tr>

                  `).join('')}

                </tbody>

              </table>

            </div>

          </div>

          <div class="card">

            <div class="section">
              <h2>Situación actual</h2>
            </div>

            <div class="statline">
              <span>Ventas</span>
              <b>${money(sales)}</b>
            </div>

            <div class="statline">
              <span>Coste de producto</span>
              <b>${money(productCosts)}</b>
            </div>

            <div class="statline">
              <span>Gastos</span>
              <b>${money(expenseTotal)}</b>
            </div>

            <div class="statline">
              <span>Compras</span>
              <b>${money(purchaseTotal)}</b>
            </div>

            <div class="statline">
              <span>Pendiente / en proceso</span>
              <b>${money(pending)}</b>
            </div>

            <hr style="margin:18px 0">

            <div class="statline">
              <span>
                <b>Resultado estimado</b>
              </span>

              <b class="${
                result >= 0 ? 'green' : 'red'
              }">
                ${money(result)}
              </b>
            </div>

          </div>

        </div>

        <div class="card">

          <div class="section">
            <div>
              <h2>Interpretación</h2>
              <div class="muted">
                Indicadores principales del negocio
              </div>
            </div>
          </div>

          <div class="grid three">

            <div class="statline">
              <span>Margen bruto</span>
              <b>${margin.toFixed(1)}%</b>
            </div>

            <div class="statline">
              <span>Pedidos</span>
              <b>${orders.length}</b>
            </div>

            <div class="statline">
              <span>Ticket medio</span>
              <b>
                ${money(
                  orders.length
                    ? sales/orders.length
                    : 0
                )}
              </b>
            </div>

          </div>

        </div>

      </div>
    `;

    document.querySelector('#refreshFinance').onclick =
      async()=>{
        await loadFinance();
        window.setView('finance');
      };
  }

  const previousSetView = window.setView;

  window.setView = function(v){

    if(v !== 'finance'){
      return previousSetView(v);
    }

    document.querySelector('#title').textContent =
      'Finanzas';

    document.querySelectorAll('#nav button')
      .forEach(b=>{
        b.classList.toggle(
          'active',
          b.dataset.view === 'finance'
        );
      });

    document.querySelector('.sidebar')
      ?.classList.remove('open');

    document.querySelector('#menuOverlay')
      ?.classList.remove('open');

    financeView(document.querySelector('#view'));

    window.scrollTo(0,0);
  };

  const boot = setInterval(()=>{

    if(document.querySelector('#nav')){

      clearInterval(boot);

      addFinanceButton();

      loadFinance();
    }

  },500);

  setInterval(()=>{

    if(document.querySelector('#nav')){
      addFinanceButton();
    }

  },1000);

})();
