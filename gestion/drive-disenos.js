/* AIHXO · Drive / Diseños */
(function(){
  const DRIVE_ROOT = 'https://drive.google.com/drive/folders/1vX1hv63uUSNt74xF_xlkY5ZMFyNy45_X';
  const FOLDERS = [
    {key:'pedidos', icon:'📦', title:'Pedidos clientes', id:'1BP3WiZdUKm9hZtdbvBMur9cmsMN2ra2h'},
    {key:'propios', icon:'🎨', title:'Diseños propios', id:'1h_J2qnw43DkUoRWHdu-b9y0G96cSIhNh'},
    {key:'dtf', icon:'🖨️', title:'PNG DTF listos', id:'1HpIKPMBKNUCrQUivdSL4CvIQMnT1Uxi4'},
    {key:'bocetos', icon:'✏️', title:'Bocetos', id:'1Pouuna_qFBjpowIgMugf3Sw9jgDsHMEz'},
    {key:'logos', icon:'✳️', title:'Logos AIHXO', id:'1KVDaN7hczaa66zryqmX-_mmyxk2f6mBD'},
    {key:'mockups', icon:'👕', title:'Mockups', id:'1j3rMIyc3R9_hJ2OVy6M-oWS6gkd2wgU1'}
  ];

  const esc = v => String(v ?? '').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function driveUrl(id){ return 'https://drive.google.com/drive/folders/' + encodeURIComponent(id); }

  function extractDriveId(value){
    const s=String(value||'').trim();
    const patterns=[
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/folders\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /^([a-zA-Z0-9_-]{15,})$/
    ];
    for(const p of patterns){ const m=s.match(p); if(m) return m[1]; }
    return '';
  }

  async function loadAssets(){
    const {data,error}=await supabaseClient
      .from('drive_assets')
      .select('*')
      .order('created_at',{ascending:false});
    if(error) throw error;
    return data||[];
  }

  window.driveDisenosView = async function(c){
    c.innerHTML='<div class="page"><div class="card">Cargando Drive…</div></div>';
    let assets=[];
    try{ assets=await loadAssets(); }
    catch(e){ console.error(e); }

    c.innerHTML=`
      <div class="page">
        <div class="section">
          <div>
            <h2>☁️ Drive / Diseños</h2>
            <div class="muted">Repositorio central de archivos de AIHXO</div>
          </div>
          <a class="primary" href="${DRIVE_ROOT}" target="_blank" rel="noopener" style="text-decoration:none">Abrir Drive</a>
        </div>

        <div class="grid two" style="margin-bottom:18px">
          ${FOLDERS.map(f=>`
            <a class="card" href="${driveUrl(f.id)}" target="_blank" rel="noopener"
               style="text-decoration:none;color:inherit;padding:18px;display:block">
              <div style="font-size:28px;margin-bottom:8px">${f.icon}</div>
              <b>${esc(f.title)}</b>
              <div class="muted" style="margin-top:5px">Abrir carpeta</div>
            </a>
          `).join('')}
        </div>

        <div class="card" style="margin-bottom:18px">
          <div class="section">
            <div>
              <h3 style="margin:0">Añadir archivo de Drive</h3>
              <div class="muted">Registra un diseño que ya esté subido a la cuenta de AIHXO.</div>
            </div>
          </div>
          <form id="driveAssetForm" class="form">
            <div class="field"><label>Nombre del archivo</label><input name="file_name" required placeholder="Ej. Lía · Trasera DTF.png"></div>
            <div class="field"><label>Enlace de Google Drive</label><input name="drive_url" required placeholder="Pega aquí el enlace del archivo"></div>
            <div class="formgrid">
              <div class="field"><label>Carpeta / tipo</label>
                <select name="folder_kind">
                  ${FOLDERS.map(f=>`<option value="${f.key}">${f.title}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>Zona</label>
                <select name="placement">
                  <option value="">Sin especificar</option>
                  <option value="front">Delantera</option>
                  <option value="back">Trasera</option>
                  <option value="left_chest">Pecho izquierdo</option>
                  <option value="right_chest">Pecho derecho</option>
                </select>
              </div>
            </div>
            <div class="formgrid">
              <div class="field"><label>Talla</label><input name="shirt_size" placeholder="Ej. M / 7-8"></div>
              <div class="field"><label>Pedido</label>
                <select name="order_id"><option value="">Sin pedido</option>
                  ${(window.orders||[]).map(o=>`<option value="${o.id}">${esc(o.order_number)} · ${esc(o.customer_name)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="formgrid">
              <div class="field"><label>Ancho cm</label><input name="width_cm" type="number" step=".1" min="0"></div>
              <div class="field"><label>Alto cm</label><input name="height_cm" type="number" step=".1" min="0"></div>
            </div>
            <button class="primary" type="submit">Guardar en Gestión</button>
          </form>
          <div class="muted" style="margin-top:12px">La subida directa desde Gestión se activará al conectar Google OAuth. Hasta entonces puedes subir desde Drive y registrar aquí el enlace.</div>
        </div>

        <div class="card">
          <div class="section"><div><h3 style="margin:0">Archivos registrados</h3><div class="muted">${assets.length} archivo${assets.length===1?'':'s'}</div></div></div>
          <div id="driveAssetsList">
            ${assets.length ? assets.map(a=>`
              <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #edf0f4">
                <div>
                  <b>${esc(a.file_name)}</b>
                  <div class="muted">${esc(a.folder_kind||'')} ${a.shirt_size?'· '+esc(a.shirt_size):''} ${a.width_cm&&a.height_cm?'· '+a.width_cm+'×'+a.height_cm+' cm':''}</div>
                  <div class="muted" style="font-size:12px">${esc(a.uploaded_by||'')}</div>
                </div>
                <a class="secondary small" href="${esc(a.web_view_link||'')}" target="_blank" rel="noopener" style="text-decoration:none">Abrir</a>
              </div>
            `).join('') : '<div class="empty">Todavía no hay archivos indexados.</div>'}
          </div>
        </div>
      </div>`;

    const form=document.getElementById('driveAssetForm');
    if(form) form.onsubmit=async e=>{
      e.preventDefault();
      const fd=new FormData(form);
      const link=String(fd.get('drive_url')||'').trim();
      const fileId=extractDriveId(link);
      if(!fileId){ toast('No reconozco ese enlace de Google Drive'); return; }
      const folder=FOLDERS.find(x=>x.key===fd.get('folder_kind'));
      const {data:{session}}=await supabaseClient.auth.getSession();
      const payload={
        google_file_id:fileId,
        file_name:String(fd.get('file_name')||'').trim(),
        mime_type:null,
        google_folder_id:folder?.id||null,
        folder_kind:String(fd.get('folder_kind')||''),
        order_id:fd.get('order_id')||null,
        placement:fd.get('placement')||null,
        shirt_size:String(fd.get('shirt_size')||'').trim()||null,
        width_cm:fd.get('width_cm')?Number(fd.get('width_cm')):null,
        height_cm:fd.get('height_cm')?Number(fd.get('height_cm')):null,
        web_view_link:link,
        uploaded_by:session?.user?.email||null,
        source:'gestion'
      };
      const {error}=await supabaseClient.from('drive_assets').insert(payload);
      if(error){
        console.error(error);
        toast(error.code==='23505'?'Ese archivo ya está registrado':'No se pudo registrar el archivo');
        return;
      }
      toast('Archivo registrado en Gestión');
      window.driveDisenosView(c);
    };
  };

  function injectNav(){
    const nav=document.getElementById('nav');
    if(!nav || nav.querySelector('[data-view="drive-designs"]')) return;
    const anchor=nav.querySelector('button[data-view="garments"]');
    const b=document.createElement('button');
    b.dataset.view='drive-designs';
    b.innerHTML='☁️ <span>Drive / Diseños</span>';
    b.onclick=()=>setView('drive-designs');
    if(anchor) anchor.insertAdjacentElement('afterend',b); else nav.appendChild(b);
  }

  const oldSetView=window.setView;
  window.setView=function(v){
    if(v==='drive-designs'){
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      const t=document.getElementById('title'); if(t)t.textContent='Drive / Diseños';
      window.driveDisenosView(document.getElementById('view'));
      if(typeof closeMobileMenu==='function')closeMobileMenu();
      return;
    }
    return oldSetView(v);
  };

  setTimeout(injectNav,0);
})();