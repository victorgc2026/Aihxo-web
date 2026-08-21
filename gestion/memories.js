// ===== X BY AIHXO MEMORIES · GESTIÓN V1 =====
(function(){
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const money = n => new Intl.NumberFormat('es-ES',{
    style:'currency',currency:'EUR'
  }).format(Number(n)||0);

  let memories = [];

  const designStates = ['Nuevo','Diseñando','Esperando aprobación','Aprobado'];
  const paymentStates = ['Pendiente','Pagado'];
  const productionStates = ['Pendiente','En producción','Terminado','Entregado'];
  const memoryTypes = ['Foto','Firma','Fecha','Mensaje','Dibujo','Momento','Mixto'];

  async function loadMemories(){
    if(!window.supabaseClient) return false;
    const {data,error} = await window.supabaseClient
      .from('memories')
      .select('*')
      .order('created_at',{ascending:false});
    if(error){
      console.error('Memories:', error);
      alert('No se pudieron cargar Memories: '+error.message);
      return false;
    }
    memories = data || [];
    return true;
  }

  function nextNumber(){
    const max = memories.reduce((m,x)=>{
      const n = Number(String(x.memory_number||'').replace(/\D/g,''));
      return Math.max(m,n||0);
    },0);
    return 'MEM-'+String(max+1).padStart(4,'0');
  }

  function injectNav(){
    const nav = $('#nav');
    if(!nav || nav.querySelector('[data-view="memories"]')) return;

    const btn = document.createElement('button');
    btn.dataset.view = 'memories';
    btn.innerHTML = '✕ <span>Memories</span>';
    btn.onclick = () => {
      document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const title = $('#title');
      if(title) title.textContent = 'Memories';
      renderMemories();
      document.querySelector('.sidebar')?.classList.remove('open');
      $('#menuOverlay')?.classList.remove('open');
    };

    const orders = nav.querySelector('[data-view="orders"]');
    if(orders?.nextSibling) nav.insertBefore(btn, orders.nextSibling);
    else nav.appendChild(btn);
  }

  function stateBadge(text){
    const good = ['Aprobado','Pagado','Terminado','Entregado'].includes(text);
    const warn = ['Diseñando','Esperando aprobación','En producción'].includes(text);
    const color = good ? '#16803b' : warn ? '#b36b00' : '#667085';
    const bg = good ? '#eaf7ee' : warn ? '#fff4df' : '#f2f4f7';
    return `<span style="display:inline-block;padding:5px 8px;border-radius:999px;background:${bg};color:${color};font-size:11px;font-weight:800;white-space:nowrap">${esc(text)}</span>`;
  }

  async function renderMemories(){
    const root = $('#view');
    if(!root) return;
    root.innerHTML = '<div class="page"><div class="card"><div class="empty">Cargando Memories…</div></div></div>';
    const ok = await loadMemories();
    if(!ok) return;

    root.innerHTML = `
      <div class="page">
        <div class="section">
          <div>
            <h2>X by AIHXO Memories</h2>
            <div class="muted">${memories.length} proyectos</div>
          </div>
          <button class="primary" id="newMemoryBtn">＋ Nuevo Memory</button>
        </div>

        <div class="grid four" style="margin-bottom:18px">
          ${window.kpi ? window.kpi('Proyectos',memories.length,'total') : summaryCard('Proyectos',memories.length)}
          ${summaryCard('Diseñando',memories.filter(x=>x.design_status==='Diseñando').length)}
          ${summaryCard('Por aprobar',memories.filter(x=>x.design_status==='Esperando aprobación').length)}
          ${summaryCard('Producción',memories.filter(x=>x.production_status==='En producción').length)}
        </div>

        <div class="card">
          <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:14px">
            <input class="search" id="memorySearch" placeholder="Buscar MEM, cliente, tipo…" style="flex:1;min-width:220px">
            <select id="memoryFilter">
              <option value="">Todos los estados</option>
              ${designStates.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}
            </select>
          </div>
          <div id="memoriesList"></div>
        </div>
      </div>`;

    $('#newMemoryBtn').onclick = ()=>openMemoryForm();
    $('#memorySearch').oninput = drawMemories;
    $('#memoryFilter').onchange = drawMemories;
    drawMemories();
  }

  function summaryCard(label,value){
    return `<div class="card"><div class="label">${label}</div><div class="kvalue">${value}</div><div class="sub">Memories</div></div>`;
  }

  function drawMemories(){
    const target = $('#memoriesList');
    if(!target) return;
    const q = ($('#memorySearch')?.value||'').toLowerCase();
    const f = $('#memoryFilter')?.value||'';

    const list = memories.filter(m=>{
      const text = [
        m.memory_number,m.customer_name,m.memory_type,m.title,m.product,m.size,m.color
      ].join(' ').toLowerCase();
      return text.includes(q) && (!f || m.design_status===f);
    });

    if(!list.length){
      target.innerHTML = '<div class="empty">No hay proyectos Memories.</div>';
      return;
    }

target.innerHTML = `
  <div class="memories-mobile-list">
    ${list.map(m=>`
      <article class="memory-mobile-card">

        <div class="memory-mobile-head">
          <div>
            <b class="memory-code">${esc(m.memory_number)}</b>
            <div class="muted">${formatDate(m.created_at)}</div>
          </div>

          <div class="memory-price">
            ${money(m.price)}
          </div>
        </div>

        <div class="memory-main">
          <div class="memory-client">
            ${esc(m.customer_name)}
          </div>

          ${m.contact ? `<div class="muted">${esc(m.contact)}</div>` : ''}

          <div class="memory-title">
            ${esc(m.title || m.memory_type || 'Memory')}
          </div>

          <div class="muted">
            ${esc(m.memory_type)} · ${esc(m.product || 'Sin producto')}
            ${m.size ? ' · '+esc(m.size) : ''}
            ${m.color ? ' · '+esc(m.color) : ''}
          </div>
        </div>

        <div class="memory-status-grid">

          <div>
            <span class="memory-status-label">Diseño</span>
            ${stateBadge(m.design_status || 'Nuevo')}
          </div>

          <div>
            <span class="memory-status-label">Pago</span>
            ${stateBadge(m.payment_status || 'Pendiente')}
          </div>

          <div>
            <span class="memory-status-label">Producción</span>
            ${stateBadge(m.production_status || 'Pendiente')}
          </div>

        </div>

        <button
          class="primary memory-open-btn"
          onclick="window.editMemoryAIHXO('${m.id}')">
          Abrir Memory
        </button>

      </article>
    `).join('')}
  </div>`;
  }

  function formatDate(v){
    if(!v) return '';
    try { return new Date(v).toLocaleDateString('es-ES'); } catch(e){ return ''; }
  }

  function openMemoryForm(id){
    const m = id ? memories.find(x=>x.id===id) : null;
    const drawer = $('#drawer');
    const body = $('#drawerBody');
    if(!drawer || !body) return;

    drawer.classList.remove('hidden');
    body.innerHTML = `
      <h2>${m ? esc(m.memory_number) : 'Nuevo Memory'}</h2>
      <div class="muted" style="margin-bottom:18px">X by AIHXO Memories</div>

      <form class="form" id="memoryForm">
        <div class="formgrid">
          <div class="field">
            <label>Número</label>
            <input name="memory_number" readonly value="${esc(m?.memory_number || nextNumber())}">
          </div>
          <div class="field">
            <label>Tipo de recuerdo</label>
            <select name="memory_type">
              ${memoryTypes.map(x=>`<option ${m?.memory_type===x?'selected':''}>${x}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="formgrid">
          <div class="field"><label>Cliente</label><input name="customer_name" required value="${esc(m?.customer_name||'')}"></div>
          <div class="field"><label>Contacto</label><input name="contact" value="${esc(m?.contact||'')}"></div>
        </div>

        <div class="field"><label>Título / nombre del proyecto</label><input name="title" placeholder="Ej. Cumpleaños de Xoel" value="${esc(m?.title||'')}"></div>
        <div class="field"><label>Descripción del recuerdo</label><textarea name="description" rows="4" placeholder="Qué quiere conservar el cliente, materiales recibidos, idea del diseño…">${esc(m?.description||'')}</textarea></div>

        <div class="formgrid">
          <div class="field"><label>Producto</label><input name="product" placeholder="Camiseta, sudadera, tote…" value="${esc(m?.product||'')}"></div>
          <div class="field"><label>Precio</label><input name="price" type="number" step=".01" min="0" value="${Number(m?.price||0)}"></div>
        </div>

        <div class="formgrid">
          <div class="field"><label>Talla</label><input name="size" value="${esc(m?.size||'')}"></div>
          <div class="field"><label>Color</label><input name="color" value="${esc(m?.color||'')}"></div>
        </div>

        <div class="formgrid">
          <div class="field">
            <label>Estado diseño</label>
            <select name="design_status">${designStates.map(x=>`<option ${m?.design_status===x?'selected':''}>${x}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label>Aprobación cliente</label>
            <select name="approval_status">
              ${['Pendiente','Aprobado','Cambios solicitados'].map(x=>`<option ${m?.approval_status===x?'selected':''}>${x}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="formgrid">
          <div class="field">
            <label>Pago</label>
            <select name="payment_status">${paymentStates.map(x=>`<option ${m?.payment_status===x?'selected':''}>${x}</option>`).join('')}</select>
          </div>
          <div class="field">
            <label>Producción</label>
            <select name="production_status">${productionStates.map(x=>`<option ${m?.production_status===x?'selected':''}>${x}</option>`).join('')}</select>
          </div>
        </div>

        <div class="field"><label>Notas internas</label><textarea name="notes" rows="4">${esc(m?.notes||'')}</textarea></div>

        <button class="primary" type="submit">${m?'Guardar cambios':'Crear Memory'}</button>
      </form>`;

    $('#memoryForm').onsubmit = e=>saveMemory(e,m?.id);
  }

  async function saveMemory(e,id){
    e.preventDefault();
    const f = new FormData(e.target);
    const obj = {
      memory_number: f.get('memory_number'),
      customer_name: f.get('customer_name'),
      contact: f.get('contact'),
      memory_type: f.get('memory_type'),
      title: f.get('title'),
      description: f.get('description'),
      product: f.get('product'),
      size: f.get('size'),
      color: f.get('color'),
      design_status: f.get('design_status'),
      approval_status: f.get('approval_status'),
      payment_status: f.get('payment_status'),
      production_status: f.get('production_status'),
      price: Number(f.get('price')||0),
      notes: f.get('notes'),
      updated_at: new Date().toISOString()
    };

    let result;
    if(id){
      result = await window.supabaseClient.from('memories').update(obj).eq('id',id);
    }else{
      result = await window.supabaseClient.from('memories').insert(obj);
    }

    if(result.error){
      alert('No se pudo guardar: '+result.error.message);
      return;
    }

    $('#drawer')?.classList.add('hidden');
    await renderMemories();
  }

  window.editMemoryAIHXO = id => openMemoryForm(id);
  window.renderMemoriesAIHXO = renderMemories;

  // La app genera el menú después del login; esperamos a que exista.
  const timer = setInterval(()=>{
    injectNav();
    if($('#nav')) clearInterval(timer);
  },300);

  // Por si la sesión cambia o la interfaz se vuelve a dibujar.
  setInterval(injectNav,1500);
  function injectMemoryStyles(){
  if(document.getElementById('aihxoMemoriesResponsiveStyles')) return;

  const style = document.createElement('style');
  style.id = 'aihxoMemoriesResponsiveStyles';

  style.textContent = `
    .memories-mobile-list{
      display:block;
    }

    .memory-mobile-card{
      background:#fff;
      border:1px solid #dfe5ef;
      border-radius:22px;
      padding:18px;
      margin-bottom:14px;
      box-shadow:0 8px 24px rgba(15,30,60,.06);
    }

    .memory-mobile-head{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:flex-start;
    }

    .memory-code{
      font-size:20px;
      letter-spacing:.3px;
    }

    .memory-price{
      font-size:18px;
      font-weight:900;
      white-space:nowrap;
    }

    .memory-main{
      padding:16px 0;
      border-bottom:1px solid #edf0f5;
    }

    .memory-client{
      font-size:18px;
      font-weight:850;
    }

    .memory-title{
      font-size:15px;
      font-weight:750;
      margin-top:10px;
      margin-bottom:4px;
    }

    .memory-status-grid{
      display:grid;
      grid-template-columns:1fr;
      gap:10px;
      padding:16px 0;
    }

    .memory-status-grid > div{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      padding:4px 0;
    }

    .memory-status-label{
      display:block;
      font-size:10px;
      letter-spacing:.7px;
      text-transform:uppercase;
      color:#7b879f;
      font-weight:850;
      margin:0;
    }

    .memory-open-btn{
      width:100%;
    }
  `;

  document.head.appendChild(style);
}

injectMemoryStyles();
})();
