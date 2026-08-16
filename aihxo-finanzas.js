(function () {
  'use strict';

  const state = {
    orders: [],
    expenses: [],
    purchases: [],
    section: 'resumen'
  };

  const money = value =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) || 0);

  const esc = value =>
    String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));

  function getSupabase() {
    return window.supabase ||
           window.supabaseClient ||
           window.sb ||
           null;
  }

  async function loadData() {
    const sb = getSupabase();

    if (!sb) {
      console.warn('AIHXO Finanzas: Supabase todavía no está disponible.');
      return;
    }

    const [orders, expenses, purchases] = await Promise.all([
      sb.from('orders').select('*'),
      sb.from('expenses').select('*'),
      sb.from('purchases').select('*')
    ]);

    state.orders = orders.data || [];
    state.expenses = expenses.data || [];
    state.purchases = purchases.data || [];
  }

  function totals() {
    const sales = state.orders.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const costs = state.orders.reduce(
      (sum, item) => sum + Number(item.product_cost || 0),
      0
    );

    const expenses = state.expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const purchases = state.purchases.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return {
      sales,
      costs,
      expenses,
      purchases,
      gross: sales - costs,
      result: sales - costs - expenses
    };
  }

  function render() {
    const container =
      document.querySelector('#view') ||
      document.querySelector('main');

    if (!container) return;

    const t = totals();

    container.innerHTML = `
      <div class="page">

        <div class="section">
          <div>
            <h2>💶 Finanzas</h2>
            <div class="muted">
              Gestión económica de AIHXO
            </div>
          </div>

          <button id="financeRefresh" class="secondary">
            ↻ Actualizar
          </button>
        </div>

        <div class="grid three finance-menu">

          <button class="card finance-nav" data-section="resumen">
            📊<br>
            <b>Resumen</b>
            <small>Visión general</small>
          </button>

          <button class="card finance-nav" data-section="ventas">
            💰<br>
            <b>Ventas</b>
            <small>Facturación</small>
          </button>

          <button class="card finance-nav" data-section="gastos">
            💸<br>
            <b>Gastos</b>
            <small>Costes</small>
          </button>

          <button class="card finance-nav" data-section="compras">
            🛒<br>
            <b>Compras</b>
            <small>Proveedores</small>
          </button>

          <button class="card finance-nav" data-section="beneficio">
            💵<br>
            <b>Beneficio</b>
            <small>Rentabilidad</small>
          </button>

          <button class="card finance-nav" data-section="informes">
            📈<br>
            <b>Informes</b>
            <small>Evolución</small>
          </button>

        </div>

        <div id="financeContent"></div>

      </div>
    `;

    document
      .querySelectorAll('.finance-nav')
      .forEach(button => {
        button.addEventListener('click', () => {
          state.section = button.dataset.section;
          renderSection();
        });
      });

    document
      .querySelector('#financeRefresh')
      ?.addEventListener('click', async () => {
        await loadData();
        render();
      });

    renderSection();
  }

  function renderSection() {
    const content = document.querySelector('#financeContent');

    if (!content) return;

    const t = totals();

    if (state.section === 'ventas') {
      content.innerHTML = `
        <div class="card">
          <h2>💰 Ventas</h2>
          <div class="kvalue">${money(t.sales)}</div>
          <p>${state.orders.length} pedidos registrados.</p>
        </div>
      `;
      return;
    }

    if (state.section === 'gastos') {
      content.innerHTML = `
        <div class="card">
          <h2>💸 Gastos</h2>
          <div class="kvalue">${money(t.expenses)}</div>
          <p>Gastos registrados en AIHXO.</p>
        </div>
      `;
      return;
    }

    if (state.section === 'compras') {
      content.innerHTML = `
        <div class="card">
          <h2>🛒 Compras</h2>
          <div class="kvalue">${money(t.purchases)}</div>
          <p>Compras registradas a proveedores.</p>
        </div>
      `;
      return;
    }

    if (state.section === 'beneficio') {
      content.innerHTML = `
        <div class="card">
          <h2>💵 Beneficio</h2>

          <div class="statline">
            <span>Ventas</span>
            <b>${money(t.sales)}</b>
          </div>

          <div class="statline">
            <span>Coste productos</span>
            <b>${money(t.costs)}</b>
          </div>

          <div class="statline">
            <span>Gastos</span>
            <b>${money(t.expenses)}</b>
          </div>

          <hr>

          <div class="statline">
            <b>Resultado</b>
            <b>${money(t.result)}</b>
          </div>
        </div>
      `;
      return;
    }

    if (state.section === 'informes') {
      content.innerHTML = `
        <div class="card">
          <h2>📈 Informes</h2>
          <p>
            Próximamente podremos consultar la evolución
            mensual y anual de AIHXO.
          </p>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div class="grid three">

        <div class="card">
          <div class="label">Ventas</div>
          <div class="kvalue">${money(t.sales)}</div>
        </div>

        <div class="card">
          <div class="label">Gastos</div>
          <div class="kvalue">${money(t.expenses)}</div>
        </div>

        <div class="card">
          <div class="label">Resultado</div>
          <div class="kvalue">${money(t.result)}</div>
        </div>

      </div>
    `;
  }

  async function start() {
    await loadData();
    render();
  }

  window.AIHXO_FINANZAS = {
    start,
    render,
    loadData
  };

  window.AIHXO_FINANZAS.start();

})();
