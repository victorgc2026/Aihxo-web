/* AIHXO · Instagram integrado en Gestión */
(function(){
  const INSTAGRAM_URL='https://www.instagram.com/aihxo.camisetas/';
  const QR_PAGE='https://aihxo.es/instagram/';
  const QR_IMAGE='/instagram/qr.svg?v=3';

  function notify(msg){
    if(typeof window.toast==='function') window.toast(msg);
  }

  async function copyInstagram(){
    try{
      await navigator.clipboard.writeText(INSTAGRAM_URL);
      notify('Enlace de Instagram copiado');
    }catch(e){
      window.prompt('Copia este enlace:',INSTAGRAM_URL);
    }
  }

  async function shareInstagram(){
    const data={
      title:'AIHXO en Instagram',
      text:'Síguenos en Instagram: @aihxo.camisetas',
      url:INSTAGRAM_URL
    };
    if(navigator.share){
      try{
        await navigator.share(data);
        return;
      }catch(e){
        if(e && e.name==='AbortError') return;
      }
    }
    await copyInstagram();
  }

  window.aihxoShareInstagram=shareInstagram;
  window.aihxoCopyInstagram=copyInstagram;

  window.aihxoInstagramView=function(c){
    if(!c) return;
    c.innerHTML=`
      <div class="page">
        <div class="section">
          <div>
            <h2>📲 Instagram AIHXO</h2>
            <div class="muted">Comparte el perfil o enseña el QR directamente desde el teléfono.</div>
          </div>
        </div>

        <div class="grid two">
          <div class="card" style="text-align:center">
            <div style="max-width:330px;margin:0 auto">
              <div style="font-size:30px;font-weight:950;letter-spacing:-1px;margin-bottom:4px">
                AIH<span style="color:#dfff00">X</span>O
              </div>
              <div class="muted" style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:18px">
                Más que camisetas
              </div>
              <div style="background:#fff;border-radius:20px;padding:14px;box-shadow:0 0 0 3px #dfff00;margin:0 auto 18px">
                <img src="${QR_IMAGE}" alt="QR de Instagram de AIHXO" style="display:block;width:100%;height:auto">
              </div>
              <div style="font-size:21px;font-weight:900">Síguenos en Instagram</div>
              <div style="font-size:18px;font-weight:900;color:#94ad00;margin-top:6px">@aihxo.camisetas</div>
            </div>
          </div>

          <div class="card">
            <h2 style="margin-top:0">Acciones rápidas</h2>
            <div class="muted" style="margin-bottom:18px">Pensado para usar desde iPhone, Android o el ordenador.</div>
            <div style="display:grid;gap:12px">
              <button class="primary" type="button" onclick="aihxoShareInstagram()">📤 Compartir Instagram</button>
              <button class="secondary" type="button" onclick="window.open('${INSTAGRAM_URL}','_blank','noopener')">📸 Abrir Instagram</button>
              <button class="secondary" type="button" onclick="aihxoCopyInstagram()">🔗 Copiar enlace</button>
              <button class="secondary" type="button" onclick="window.open('${QR_PAGE}','_blank','noopener')">▦ Ver QR a pantalla completa</button>
            </div>
            <div class="muted" style="font-size:12px;line-height:1.5;margin-top:18px">
              En iPhone y Android, “Compartir Instagram” abre el menú nativo para enviarlo por WhatsApp, Mensajes, correo y otras aplicaciones.
            </div>
          </div>
        </div>
      </div>`;
  };

  function addInstagramNav(){
    const nav=document.querySelector('#nav');
    if(!nav || nav.querySelector('button[data-view="instagram"]')) return;

    const sorteos=nav.querySelector('button[data-view="sorteos"]');
    const b=document.createElement('button');
    b.type='button';
    b.dataset.view='instagram';
    b.innerHTML='📲 <span>Instagram</span>';
    b.onclick=()=>{ window.setView('instagram'); if(typeof window.closeMobileMenu==='function') window.closeMobileMenu(); };

    if(sorteos) sorteos.insertAdjacentElement('afterend',b);
    else nav.appendChild(b);
  }

  const previousSetView=window.setView;
  window.setView=function(v){
    if(v==='instagram'){
      addInstagramNav();
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      const title=document.querySelector('#title');
      if(title) title.textContent='Instagram';
      window.aihxoInstagramView(document.querySelector('#view'));
      if(typeof window.closeMobileMenu==='function') window.closeMobileMenu();
      return;
    }
    return previousSetView(v);
  };

  function addDashboardShortcut(){
    const view=document.querySelector('#view');
    if(!view || !/Hoy en AIHXO/.test(view.textContent||'') || view.querySelector('[data-aihxo-instagram-shortcut]')) return;
    const page=view.querySelector('.page');
    if(!page) return;
    const box=document.createElement('div');
    box.className='card';
    box.setAttribute('data-aihxo-instagram-shortcut','1');
    box.style.marginTop='16px';
    box.innerHTML=`
      <div class="section" style="margin-bottom:0">
        <div>
          <h2 style="margin:0">📲 Instagram</h2>
          <div class="muted">QR y acceso rápido para compartir @aihxo.camisetas.</div>
        </div>
        <button class="primary" type="button" onclick="setView('instagram')">Compartir</button>
      </div>`;
    page.appendChild(box);
  }

  const observer=new MutationObserver(()=>{
    addInstagramNav();
    addDashboardShortcut();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('DOMContentLoaded',()=>{
    addInstagramNav();
    addDashboardShortcut();
  });
  setTimeout(()=>{addInstagramNav();addDashboardShortcut();},500);
})();