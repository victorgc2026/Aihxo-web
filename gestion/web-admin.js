/* AIHXO · Gestión de la web · CMS portada v1 */
(function(){
  const DEFAULT_CONFIG = {
    hero:{
      enabled:true,
      mini:'COLECCIÓN · PERSONALIZA · X MEMORIES',
      title:'Viste tu historia.',
      accent:'Diseños con identidad propia.',
      description:'Diseños AIHXO y prendas personalizadas creadas en Galicia.',
      primary_label:'VER COLECCIÓN',
      primary_href:'#coleccion',
      secondary_label:'PERSONALIZAR',
      secondary_href:'#personaliza'
    },
    paths:[
      {enabled:true,title:'COLECCIÓN',text:'Diseños propios AIHXO',href:'#coleccion',style:'light'},
      {enabled:true,title:'PERSONALIZA',text:'Tu idea. Nuestra camiseta.',href:'#personaliza',style:'dark'},
      {enabled:true,title:'X MEMORIES',text:'Convierte recuerdos en algo que puedas llevar',href:'x/',style:'black'}
    ],
    collection:{
      enabled:true,
      kicker:'AIHXO COLLECTION',
      title:'Selección AIHXO',
      description:'Una selección de diseños con identidad propia. Entra en cada pieza para ver tallas, colores y detalles.',
      home_limit:6,
      featured_product_ids:[]
    },
    personaliza:{
      enabled:true,
      kicker:'PERSONALIZA',
      title:'Tu idea. Nuestra camiseta.',
      description:'Elige la prenda, envíanos tu diseño o cuéntanos qué quieres crear. Nosotros nos encargamos del resto.',
      button_label:'CREAR MI CAMISETA'
    },
    memories:{
      enabled:true,
      kicker:'X BY AIHXO · MEMORIES',
      title:'Hay recuerdos que merecen salir de la galería.',
      description:'Fotos, firmas, fechas y momentos convertidos en una prenda con historia.',
      button_label:'DESCUBRIR X →',
      href:'x/'
    },
    contact:{
      enabled:true,
      kicker:'AIHXO',
      title:'Estamos aquí',
      show_whatsapp:true,
      show_instagram:true,
      show_tiktok:true,
      show_email:true,
      whatsapp_url:'https://wa.me/34634344174',
      instagram_url:'https://www.instagram.com/aihxo.camisetas/',
      tiktok_url:'https://www.tiktok.com/@aihxo.camisetas',
      email:'hola@aihxo.es'
    },
    footer:{
      enabled:true,
      line1:'AIHXO · Colección propia · Personalizaciones',
      legal_label:'Envíos, cambios y devoluciones',
      legal_href:'envios-devoluciones/'
    },
    seo:{
      title:'Camisetas personalizadas y diseños propios | AIHXO Galicia',
      description:'Camisetas personalizadas para niños y adultos y diseños exclusivos AIHXO. Personalización de camisetas en Oleiros, A Coruña, con envíos a toda España.',
      image:'https://aihxo.es/AIHXO_logo_web_recortadooscuro_recortado.png'
    },
    layout_order:['coleccion','personaliza','x-memories','contacto']
  };

  const E = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const clone = x => JSON.parse(JSON.stringify(x));
  const merge = (base, incoming) => {
    const out = clone(base);
    if (!incoming || typeof incoming !== 'object') return out;
    Object.keys(incoming).forEach(k => {
      if (Array.isArray(incoming[k])) out[k] = incoming[k];
      else if (incoming[k] && typeof incoming[k] === 'object' && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = {...out[k], ...incoming[k]};
      else out[k] = incoming[k];
    });
    return out;
  };

  let currentConfig = clone(DEFAULT_CONFIG);
  let webProducts = [];

  async function loadWebConfig(){
    const {data,error} = await supabaseClient.from('web_home_settings').select('config,draft_config,updated_at,published_at').eq('id','home').maybeSingle();
    if(error) throw error;
    currentConfig = merge(DEFAULT_CONFIG, data?.draft_config || data?.config || {});
    return {config:currentConfig,updated_at:data?.updated_at||null,published_at:data?.published_at||null};
  }

  async function loadWebProducts(){
    const {data,error}=await supabaseClient
      .from('products')
      .select('id,sku,model,category,commercial_visibility,image_url,homepage_image_url')
      .ilike('category','%Diseno propio%')
      .ilike('category','%publicado%')
      .neq('commercial_visibility','oculto')
      .order('model');
    if(error) throw error;
    webProducts=data||[];
    return webProducts;
  }

  function boolField(id,label,checked,help=''){
    return `<label class="dp-check" style="margin:0;">
      <input id="${id}" type="checkbox" ${checked?'checked':''}>
      <span><b>${E(label)}</b>${help?`<br><small>${E(help)}</small>`:''}</span>
    </label>`;
  }

  function textField(id,label,value,placeholder=''){
    return `<div class="field"><label>${E(label)}</label><input id="${id}" value="${E(value||'')}" placeholder="${E(placeholder)}"></div>`;
  }

  function textareaField(id,label,value,rows=3){
    return `<div class="field"><label>${E(label)}</label><textarea id="${id}" rows="${rows}">${E(value||'')}</textarea></div>`;
  }

  window.webAdminView = async function(c){
    c.innerHTML=`<div class="page"><div class="card"><div class="empty">Cargando configuración web…</div></div></div>`;
    try{
      const [{updated_at,published_at}] = await Promise.all([loadWebConfig(),loadWebProducts()]);
      renderWebAdmin(c,updated_at,published_at);
    }catch(err){
      console.error(err);
      c.innerHTML=`<div class="page"><div class="card"><b>No se pudo cargar la gestión de la web.</b><div class="muted" style="margin-top:6px;">${E(err.message||err)}</div></div></div>`;
    }
  };

  function renderWebAdmin(c,updatedAt,publishedAt){
    const cfg=currentConfig;
    const featured=Array.isArray(cfg.collection?.featured_product_ids)?cfg.collection.featured_product_ids:[];
    c.innerHTML=`
      <div class="page">
        <div class="section">
          <div>
            <h2>🌐 Gestión de la web</h2>
            <div class="muted">Edita la portada de AIHXO sin tocar código.</div>
          </div>
          <a class="secondary" href="https://aihxo.es/" target="_blank" rel="noopener">Abrir web ↗</a>
        </div>

        <div class="card" style="padding:16px;margin-bottom:14px;background:#07152f;color:#fff;">
          <div style="font-weight:900;">BORRADOR + PUBLICACIÓN</div>
          <div style="opacity:.76;margin-top:4px;">Guarda cambios, previsualízalos y publícalos cuando estén listos.</div>
          ${updatedAt?`<div style="opacity:.6;font-size:12px;margin-top:6px;">Último borrador: ${new Date(updatedAt).toLocaleString('es-ES')}</div>`:''}
          ${publishedAt?`<div style="opacity:.6;font-size:12px;margin-top:2px;">Última publicación: ${new Date(publishedAt).toLocaleString('es-ES')}</div>`:''}
        </div>

        <div class="card" style="padding:18px;margin-bottom:14px;">
          <h3 style="margin-top:0;">Centro de contenido</h3>
          <div class="muted" style="margin-bottom:12px;">Desde aquí puedes saltar a las partes de Gestión que alimentan la web.</div>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">
            <button type="button" class="secondary" onclick="setView('products')">👕 Productos</button>
            <button type="button" class="secondary" onclick="abrirNuevoDisenoPropio()">🎨 Diseños AIHXO</button>
            <button type="button" class="secondary" onclick="setView('garments')">🧵 Prendas base</button>
            <button type="button" class="secondary" onclick="setView('coupons')">🎟️ Cupones</button>
            <button type="button" class="secondary" onclick="gestionarCampanasWeb()">📣 Campañas y promociones</button>
          </div>
        </div>

        <form id="webAdminForm" style="display:grid;gap:14px;">
          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">1 · Cabecera / Hero</h3><div class="muted">Lo primero que ve el cliente.</div></div>${boolField('waHeroEnabled','Mostrar cabecera',cfg.hero.enabled)}</div>
            ${textField('waHeroMini','Línea superior',cfg.hero.mini)}
            <div class="formgrid">
              ${textField('waHeroTitle','Título principal',cfg.hero.title)}
              ${textField('waHeroAccent','Segunda línea',cfg.hero.accent)}
            </div>
            ${textareaField('waHeroDescription','Texto',cfg.hero.description,2)}
            <div class="formgrid">
              ${textField('waHeroPrimary','Botón principal',cfg.hero.primary_label)}
              ${textField('waHeroSecondary','Botón secundario',cfg.hero.secondary_label)}
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <h3 style="margin-top:0;">2 · Accesos principales</h3>
            <div class="muted" style="margin-bottom:12px;">Las tres tarjetas bajo la cabecera.</div>
            <div style="display:grid;gap:12px;">
              ${(cfg.paths||[]).slice(0,3).map((p,i)=>`
                <div style="border:1px solid #e5e9f0;border-radius:14px;padding:12px;">
                  ${boolField('waPathEnabled'+i,'Mostrar '+(p.title||('Acceso '+(i+1))),p.enabled)}
                  <div class="formgrid" style="margin-top:10px;">
                    ${textField('waPathTitle'+i,'Título',p.title)}
                    ${textField('waPathText'+i,'Texto',p.text)}
                  </div>
                  ${textField('waPathHref'+i,'Destino',p.href,'#coleccion, #personaliza, x/...')}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">3 · Colección AIHXO</h3><div class="muted">Textos, cantidad inicial y diseños que salen primero.</div></div>${boolField('waCollectionEnabled','Mostrar colección',cfg.collection.enabled)}</div>
            <div class="formgrid">
              ${textField('waCollectionKicker','Etiqueta',cfg.collection.kicker)}
              ${textField('waCollectionTitle','Título',cfg.collection.title)}
            </div>
            ${textareaField('waCollectionDescription','Descripción',cfg.collection.description,2)}
            <div class="field">
              <label>Diseños visibles antes de “Ver toda la colección”</label>
              <input id="waCollectionLimit" type="number" min="1" max="12" value="${Number(cfg.collection.home_limit||6)}">
            </div>
            <div style="margin-top:14px;">
              <b>Diseños destacados en portada</b>
              <div class="muted" style="margin:4px 0 10px;">Márcalos en el orden en que quieras priorizarlos. Los destacados aparecerán antes que el resto.</div>
              <div id="waFeaturedProducts" style="display:grid;gap:8px;">
                ${webProducts.map(p=>{
                  const checked=featured.includes(p.id);
                  const cat=String(p.category||'').toLowerCase().includes('infantil')?'KIDS':String(p.category||'').toLowerCase().includes('adulto')?'ADULTO':'AIHXO';
                  return `<label style="display:flex;align-items:center;gap:10px;border:1px solid #e5e9f0;border-radius:12px;padding:10px;">
                    <input type="checkbox" data-feature-product="${p.id}" ${checked?'checked':''} style="width:20px;height:20px;min-width:20px;">
                    ${p.homepage_image_url||p.image_url?`<img src="${E(p.homepage_image_url||p.image_url)}" style="width:46px;height:46px;object-fit:cover;border-radius:9px;">`:''}
                    <span style="min-width:0;flex:1;"><b>${E(p.model)}</b><br><small class="muted">${E(cat)} · ${E(p.sku||'')}</small></span>
                  </label>`;
                }).join('')}
              </div>
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">4 · Personaliza</h3></div>${boolField('waPersonalEnabled','Mostrar sección',cfg.personaliza.enabled)}</div>
            <div class="formgrid">
              ${textField('waPersonalKicker','Etiqueta',cfg.personaliza.kicker)}
              ${textField('waPersonalTitle','Título',cfg.personaliza.title)}
            </div>
            ${textareaField('waPersonalDescription','Descripción',cfg.personaliza.description,2)}
            ${textField('waPersonalButton','Texto del botón',cfg.personaliza.button_label)}
          </div>

          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">5 · X Memories</h3></div>${boolField('waMemoriesEnabled','Mostrar sección',cfg.memories.enabled)}</div>
            <div class="formgrid">
              ${textField('waMemoriesKicker','Etiqueta',cfg.memories.kicker)}
              ${textField('waMemoriesTitle','Título',cfg.memories.title)}
            </div>
            ${textareaField('waMemoriesDescription','Descripción',cfg.memories.description,2)}
            <div class="formgrid">
              ${textField('waMemoriesButton','Botón',cfg.memories.button_label)}
              ${textField('waMemoriesHref','Destino',cfg.memories.href)}
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">6 · Contacto</h3></div>${boolField('waContactEnabled','Mostrar sección',cfg.contact.enabled)}</div>
            <div class="formgrid">
              ${textField('waContactKicker','Etiqueta',cfg.contact.kicker)}
              ${textField('waContactTitle','Título',cfg.contact.title)}
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px;">
              ${boolField('waContactWhatsApp','WhatsApp',cfg.contact.show_whatsapp)}
              ${boolField('waContactInstagram','Instagram',cfg.contact.show_instagram)}
              ${boolField('waContactTikTok','TikTok',cfg.contact.show_tiktok)}
              ${boolField('waContactEmail','Email',cfg.contact.show_email)}
            </div>
            <div class="formgrid">
              ${textField('waContactWhatsAppUrl','URL WhatsApp',cfg.contact.whatsapp_url)}
              ${textField('waContactInstagramUrl','URL Instagram',cfg.contact.instagram_url)}
              ${textField('waContactTikTokUrl','URL TikTok',cfg.contact.tiktok_url)}
              ${textField('waContactEmailValue','Email',cfg.contact.email)}
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <h3 style="margin-top:0;">7 · Orden de la portada</h3>
            <div class="muted" style="margin-bottom:12px;">Define el orden de los bloques principales.</div>
            <div style="display:grid;gap:8px;">
              ${['coleccion','personaliza','x-memories','contacto'].map((id,idx)=>{
                const names={coleccion:'Colección AIHXO',personaliza:'Personaliza','x-memories':'X Memories',contacto:'Contacto'};
                const current=Array.isArray(cfg.layout_order)?cfg.layout_order.indexOf(id):idx;
                return `<div style="display:grid;grid-template-columns:1fr 110px;gap:10px;align-items:center;border:1px solid #e5e9f0;border-radius:12px;padding:10px;">
                  <b>${names[id]}</b>
                  <select data-layout-id="${id}">
                    ${[1,2,3,4].map(n=>`<option value="${n}" ${current===n-1?'selected':''}>${n}º</option>`).join('')}
                  </select>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="card" style="padding:18px;">
            <h3 style="margin-top:0;">8 · SEO general</h3>
            <div class="muted" style="margin-bottom:12px;">Cómo se presenta AIHXO en Google y al compartir la web.</div>
            ${textField('waSeoTitle','Título SEO',cfg.seo?.title||'')}
            ${textareaField('waSeoDescription','Descripción SEO',cfg.seo?.description||'',3)}
            ${textField('waSeoImage','Imagen para compartir',cfg.seo?.image||'')}
          </div>

          <div class="card" style="padding:18px;">
            <div class="section"><div><h3 style="margin:0;">9 · Pie de página</h3></div>${boolField('waFooterEnabled','Mostrar pie',cfg.footer?.enabled!==false)}</div>
            ${textField('waFooterLine1','Texto principal',cfg.footer?.line1||'')}
            <div class="formgrid">
              ${textField('waFooterLegalLabel','Texto enlace legal',cfg.footer?.legal_label||'')}
              ${textField('waFooterLegalHref','Destino enlace legal',cfg.footer?.legal_href||'')}
            </div>
          </div>

          <div style="display:grid;gap:10px;">
            <button class="primary" id="webAdminSave" type="submit" style="width:100%;padding:17px;font-size:16px;">GUARDAR BORRADOR</button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <button class="secondary" type="button" onclick="previsualizarWebAIHXO()">👁 PREVISUALIZAR</button>
              <button class="primary" type="button" onclick="publicarWebAIHXO()">🚀 PUBLICAR</button>
            </div>
          </div>
        </form>
      </div>
    `;

    const featuredContainer=$('#waFeaturedProducts');
    if(featuredContainer){
      const ordered=[...featured].filter(id=>webProducts.some(p=>p.id===id));
      [...featuredContainer.querySelectorAll('[data-feature-product]')].forEach(cb=>{
        cb.addEventListener('change',()=>{
          const id=cb.dataset.featureProduct;
          if(cb.checked && !ordered.includes(id)) ordered.push(id);
          if(!cb.checked){const ix=ordered.indexOf(id);if(ix>=0)ordered.splice(ix,1);}
          featuredContainer.dataset.order=JSON.stringify(ordered);
        });
      });
      featuredContainer.dataset.order=JSON.stringify(ordered);
    }
    $('#webAdminForm').addEventListener('submit',saveWebConfig);
  }

  function val(id){return document.getElementById(id)?.value?.trim()||'';}
  function chk(id){return !!document.getElementById(id)?.checked;}

  async function saveWebConfig(e){
    e.preventDefault();
    const btn=$('#webAdminSave');
    btn.disabled=true;btn.textContent='PUBLICANDO...';
    try{
      const orderRaw=$('#waFeaturedProducts')?.dataset.order||'[]';
      let ordered=[];try{ordered=JSON.parse(orderRaw)}catch(_){}
      const checked=[...document.querySelectorAll('[data-feature-product]:checked')].map(x=>x.dataset.featureProduct);
      ordered=[...ordered.filter(id=>checked.includes(id)),...checked.filter(id=>!ordered.includes(id))];

      const paths=(currentConfig.paths||DEFAULT_CONFIG.paths).slice(0,3).map((p,i)=>({
        ...p,
        enabled:chk('waPathEnabled'+i),
        title:val('waPathTitle'+i),
        text:val('waPathText'+i),
        href:val('waPathHref'+i)
      }));

      const cfg={
        hero:{
          ...currentConfig.hero,
          enabled:chk('waHeroEnabled'),
          mini:val('waHeroMini'),
          title:val('waHeroTitle'),
          accent:val('waHeroAccent'),
          description:val('waHeroDescription'),
          primary_label:val('waHeroPrimary'),
          secondary_label:val('waHeroSecondary')
        },
        paths,
        collection:{
          ...currentConfig.collection,
          enabled:chk('waCollectionEnabled'),
          kicker:val('waCollectionKicker'),
          title:val('waCollectionTitle'),
          description:val('waCollectionDescription'),
          home_limit:Math.max(1,Math.min(12,Number(val('waCollectionLimit')||6))),
          featured_product_ids:ordered
        },
        personaliza:{
          ...currentConfig.personaliza,
          enabled:chk('waPersonalEnabled'),
          kicker:val('waPersonalKicker'),
          title:val('waPersonalTitle'),
          description:val('waPersonalDescription'),
          button_label:val('waPersonalButton')
        },
        memories:{
          ...currentConfig.memories,
          enabled:chk('waMemoriesEnabled'),
          kicker:val('waMemoriesKicker'),
          title:val('waMemoriesTitle'),
          description:val('waMemoriesDescription'),
          button_label:val('waMemoriesButton'),
          href:val('waMemoriesHref')
        },
        contact:{
          ...currentConfig.contact,
          enabled:chk('waContactEnabled'),
          kicker:val('waContactKicker'),
          title:val('waContactTitle'),
          show_whatsapp:chk('waContactWhatsApp'),
          show_instagram:chk('waContactInstagram'),
          show_tiktok:chk('waContactTikTok'),
          show_email:chk('waContactEmail'),
          whatsapp_url:val('waContactWhatsAppUrl'),
          instagram_url:val('waContactInstagramUrl'),
          tiktok_url:val('waContactTikTokUrl'),
          email:val('waContactEmailValue')
        },
        footer:{
          ...currentConfig.footer,
          enabled:chk('waFooterEnabled'),
          line1:val('waFooterLine1'),
          legal_label:val('waFooterLegalLabel'),
          legal_href:val('waFooterLegalHref')
        },
        seo:{
          title:val('waSeoTitle'),
          description:val('waSeoDescription'),
          image:val('waSeoImage')
        },
        layout_order:[...document.querySelectorAll('[data-layout-id]')]
          .map(el=>({id:el.dataset.layoutId,pos:Number(el.value||99)}))
          .sort((a,b)=>a.pos-b.pos)
          .map(x=>x.id)
      };

      const {error}=await supabaseClient.from('web_home_settings').upsert({id:'home',draft_config:cfg,updated_at:new Date().toISOString()});
      if(error)throw error;
      currentConfig=cfg;
      toast('Borrador guardado');
      webAdminView($('#view'));
    }catch(err){
      console.error(err);
      toast('No se pudo publicar: '+(err.message||err));
      btn.disabled=false;btn.textContent='GUARDAR BORRADOR';
    }
  }


  window.previsualizarWebAIHXO=function(){
    try{
      localStorage.setItem('aihxo_web_preview_config',JSON.stringify(currentConfig));
      window.open('/?aihxo-preview=1','_blank');
    }catch(err){
      console.error(err);toast('No se pudo abrir la previsualización');
    }
  };

  window.publicarWebAIHXO=async function(){
    try{
      const {data,error}=await supabaseClient.from('web_home_settings').select('draft_config,config').eq('id','home').single();
      if(error)throw error;
      const cfg=data?.draft_config||data?.config||currentConfig;
      const {error:upError}=await supabaseClient.from('web_home_settings').update({
        config:cfg,
        draft_config:cfg,
        updated_at:new Date().toISOString(),
        published_at:new Date().toISOString()
      }).eq('id','home');
      if(upError)throw upError;
      currentConfig=cfg;
      toast('Web publicada');
      webAdminView($('#view'));
    }catch(err){
      console.error(err);toast('No se pudo publicar: '+(err.message||err));
    }
  };

  window.gestionarCampanasWeb=async function(){
    const [{data:campaigns,error:ce},{data:promos,error:pe}]=await Promise.all([
      supabaseClient.from('web_campaigns').select('*').order('priority').order('created_at',{ascending:false}),
      supabaseClient.from('web_promotions').select('*').order('priority').order('created_at',{ascending:false})
    ]);
    if(ce||pe){console.error(ce||pe);toast('No se pudieron cargar campañas');return;}
    window._aihxoWebCampaigns=campaigns||[];
    window._aihxoWebPromos=promos||[];
    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML=`
      <div class="section"><div><h2>📣 Campañas y promociones</h2><div class="muted">Banners temporales y descuentos sin cambiar el precio base.</div></div></div>
      <div class="card" style="padding:16px;">
        <div class="section"><h3 style="margin:0;">Banners</h3><button class="primary small" onclick="editarCampanaWeb()">＋ Banner</button></div>
        <div style="display:grid;gap:8px;">
          ${(campaigns||[]).map(x=>`<div style="border:1px solid #e5e9f0;border-radius:12px;padding:10px;"><div style="display:flex;justify-content:space-between;gap:8px;"><div><b>${E(x.name)}</b><div class="muted">${E(x.title)} · prioridad ${x.priority}</div></div><button class="secondary small" onclick="editarCampanaWebPorId('${x.id}')">Editar</button></div></div>`).join('')||'<div class="empty">Sin banners.</div>'}
        </div>
      </div>
      <div class="card" style="padding:16px;margin-top:12px;">
        <div class="section"><h3 style="margin:0;">Promociones</h3><button class="primary small" onclick="editarPromocionWeb()">＋ Promoción</button></div>
        <div style="display:grid;gap:8px;">
          ${(promos||[]).map(x=>`<div style="border:1px solid #e5e9f0;border-radius:12px;padding:10px;"><div style="display:flex;justify-content:space-between;gap:8px;"><div><b>${E(x.name)}</b><div class="muted">${E(x.label||'')} · ${E(x.discount_type)} ${x.discount_value}</div></div><button class="secondary small" onclick="editarPromocionWebPorId('${x.id}')">Editar</button></div></div>`).join('')||'<div class="empty">Sin promociones.</div>'}
        </div>
      </div>`;
  };

  window.editarCampanaWebPorId=function(id){
    const x=(window._aihxoWebCampaigns||[]).find(v=>String(v.id)===String(id));
    editarCampanaWeb(x||{});
  };
  window.editarPromocionWebPorId=function(id){
    const x=(window._aihxoWebPromos||[]).find(v=>String(v.id)===String(id));
    editarPromocionWeb(x||{});
  };

  window.editarCampanaWeb=function(x={}){
    $('#drawer').classList.remove('hidden');
    $('#drawerBody').innerHTML=`
      <h2>${x.id?'Editar':'Nuevo'} banner</h2>
      <form id="webCampaignForm" class="form">
        ${textField('wcName','Nombre interno',x.name||'')}
        ${textField('wcTitle','Título',x.title||'')}
        ${textareaField('wcBody','Texto',x.body||'',2)}
        <div class="formgrid">${textField('wcButton','Botón',x.button_label||'')}${textField('wcHref','Destino',x.button_href||'')}</div>
        <div class="formgrid"><div class="field"><label>Inicio</label><input id="wcStart" type="datetime-local" value="${x.start_at?new Date(x.start_at).toISOString().slice(0,16):''}"></div><div class="field"><label>Fin</label><input id="wcEnd" type="datetime-local" value="${x.end_at?new Date(x.end_at).toISOString().slice(0,16):''}"></div></div>
        <div class="formgrid"><div class="field"><label>Público</label><select id="wcAudience"><option value="all">Todos</option><option value="infantil" ${x.audience==='infantil'?'selected':''}>Kids</option><option value="adulto" ${x.audience==='adulto'?'selected':''}>Adulto</option></select></div><div class="field"><label>Prioridad</label><input id="wcPriority" type="number" value="${Number(x.priority||100)}"></div></div>
        ${boolField('wcEnabled','Activo',x.enabled!==false)}
        <button class="primary">Guardar banner</button>
      </form>`;
    $('#webCampaignForm').onsubmit=async e=>{
      e.preventDefault();
      const payload={name:val('wcName'),title:val('wcTitle'),body:val('wcBody')||null,button_label:val('wcButton')||null,button_href:val('wcHref')||null,start_at:val('wcStart')?new Date(val('wcStart')).toISOString():null,end_at:val('wcEnd')?new Date(val('wcEnd')).toISOString():null,audience:val('wcAudience')||'all',priority:Number(val('wcPriority')||100),enabled:chk('wcEnabled'),updated_at:new Date().toISOString()};
      const q=x.id?supabaseClient.from('web_campaigns').update(payload).eq('id',x.id):supabaseClient.from('web_campaigns').insert(payload);
      const {error}=await q;if(error){toast(error.message);return;}toast('Banner guardado');gestionarCampanasWeb();
    };
  };

  window.editarPromocionWeb=function(x={}){
    $('#drawer').classList.remove('hidden');
    const selected=Array.isArray(x.product_ids)?x.product_ids:[];
    $('#drawerBody').innerHTML=`
      <h2>${x.id?'Editar':'Nueva'} promoción</h2>
      <form id="webPromoForm" class="form">
        ${textField('wpName','Nombre interno',x.name||'')}
        ${textField('wpLabel','Etiqueta visible',x.label||'OFERTA')}
        <div class="formgrid"><div class="field"><label>Ámbito</label><select id="wpScope"><option value="all">Toda la colección</option><option value="audience" ${x.scope_type==='audience'?'selected':''}>Por público</option><option value="products" ${x.scope_type==='products'?'selected':''}>Productos concretos</option></select></div><div class="field"><label>Público</label><select id="wpAudience"><option value="">—</option><option value="infantil" ${x.audience==='infantil'?'selected':''}>Kids</option><option value="adulto" ${x.audience==='adulto'?'selected':''}>Adulto</option></select></div></div>
        <div class="formgrid"><div class="field"><label>Tipo descuento</label><select id="wpType"><option value="percent">Porcentaje %</option><option value="fixed" ${x.discount_type==='fixed'?'selected':''}>Importe €</option></select></div><div class="field"><label>Valor</label><input id="wpValue" type="number" min="0" step=".01" value="${Number(x.discount_value||0)}"></div></div>
        <div class="field"><label>Productos</label><div style="display:grid;gap:6px;max-height:280px;overflow:auto;">${webProducts.map(p=>`<label style="display:flex;gap:8px;align-items:center;"><input type="checkbox" data-promo-product="${p.id}" ${selected.includes(p.id)?'checked':''}> ${E(p.model)}</label>`).join('')}</div></div>
        <div class="formgrid"><div class="field"><label>Inicio</label><input id="wpStart" type="datetime-local" value="${x.start_at?new Date(x.start_at).toISOString().slice(0,16):''}"></div><div class="field"><label>Fin</label><input id="wpEnd" type="datetime-local" value="${x.end_at?new Date(x.end_at).toISOString().slice(0,16):''}"></div></div>
        ${boolField('wpEnabled','Activa',x.enabled!==false)}
        <button class="primary">Guardar promoción</button>
      </form>`;
    $('#webPromoForm').onsubmit=async e=>{
      e.preventDefault();
      const payload={name:val('wpName'),label:val('wpLabel')||null,scope_type:val('wpScope')||'all',audience:val('wpAudience')||null,product_ids:[...document.querySelectorAll('[data-promo-product]:checked')].map(x=>x.dataset.promoProduct),discount_type:val('wpType')||'percent',discount_value:Number(val('wpValue')||0),start_at:val('wpStart')?new Date(val('wpStart')).toISOString():null,end_at:val('wpEnd')?new Date(val('wpEnd')).toISOString():null,enabled:chk('wpEnabled'),updated_at:new Date().toISOString()};
      const q=x.id?supabaseClient.from('web_promotions').update(payload).eq('id',x.id):supabaseClient.from('web_promotions').insert(payload);
      const {error}=await q;if(error){toast(error.message);return;}toast('Promoción guardada');gestionarCampanasWeb();
    };
  };

  const oldSetView=window.setView;
  window.setView=function(v){
    if(v==='web-admin'){
      document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
      $('#title').textContent='Gestión de la web';
      webAdminView($('#view'));
      if(typeof closeMobileMenu==='function')closeMobileMenu();
      return;
    }
    return oldSetView(v);
  };

  function injectNav(){
    const nav=document.getElementById('nav');
    if(!nav||nav.querySelector('[data-view="web-admin"]'))return;
    const marketingLabel=[...nav.querySelectorAll('div.muted')].find(x=>x.textContent.trim()==='MARKETING');
    const btn=document.createElement('button');
    btn.dataset.view='web-admin';
    btn.innerHTML='🌐 <span>Web</span>';
    btn.onclick=()=>setView('web-admin');
    if(marketingLabel)marketingLabel.insertAdjacentElement('beforebegin',btn);
    else nav.appendChild(btn);
  }
  setTimeout(injectNav,0);
})();