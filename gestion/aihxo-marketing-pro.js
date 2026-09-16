/* AIHXO · Marketing IA avanzado */
(function(){
  if(window.__aihxoMarketingPro) return;
  window.__aihxoMarketingPro=true;
  const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav||document.querySelector('#aihxoMarketingNav'))return;
    const b=document.createElement('button');b.id='aihxoMarketingNav';b.type='button';b.innerHTML='📣 <span>Marketing IA</span>';
    b.onclick=()=>{view();if(typeof closeMobileMenu==='function')closeMobileMenu();};
    const muted=[...nav.querySelectorAll('.muted')].find(x=>x.textContent.includes('MARKETING'));
    if(muted)nav.insertBefore(b,muted.nextSibling);else nav.appendChild(b);
  }

  async function ask(prompt,context){
    const {data,error}=await supabaseClient.functions.invoke('aihxo-ai',{body:{mode:'marketing',prompt,context}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data?.text||'Sin respuesta';
  }

  function businessContext(){
    return {
      marca:'AIHXO',
      posicionamiento:'diseños propios y personalización de camisetas y prendas',
      ubicacion:'Oleiros, A Coruña',
      envios:'España',
      canales:['Instagram','TikTok','Facebook','Web','WhatsApp'],
      productos:(window.products||products||[]).slice(0,80).map(p=>({modelo:p.model,categoria:p.category,precio:p.sale_price,color:p.color,talla:p.size,visible:p.commercial_visibility})),
      reglas:['No inventar precios, stock, plazos ni descuentos','No usar logos o marcas ajenas sin autorización','Mantener tono AIHXO cercano, moderno y comercial']
    };
  }

  function view(){
    document.querySelectorAll('#nav button').forEach(x=>x.classList.remove('active'));
    document.querySelector('#aihxoMarketingNav')?.classList.add('active');
    const title=document.querySelector('#title');if(title)title.textContent='Marketing IA';
    const root=document.querySelector('#view');if(!root)return;
    root.innerHTML=`<div class="page"><div class="section"><div><h2 style="margin:0">📣 Marketing IA</h2><div class="muted">Genera campañas completas para AIHXO listas para publicar.</div></div></div>
      <div class="card"><div class="grid two"><div><label>Qué quieres promocionar</label><textarea id="mkSubject" rows="5" placeholder="Ej.: nueva camiseta Premium PALM, colección infantil, Memories…"></textarea></div>
      <div><label>Objetivo</label><select id="mkGoal"><option value="ventas">Conseguir ventas</option><option value="lanzamiento">Lanzamiento / novedad</option><option value="trafico">Llevar tráfico a la web</option><option value="engagement">Interacción y comunidad</option><option value="personalizacion">Conseguir encargos personalizados</option></select>
      <label style="margin-top:10px">Público</label><input id="mkAudience" placeholder="Ej.: madres/padres, adultos 25-45, hockey…"></div></div>
      <div style="margin-top:12px"><label>Qué necesitas</label><select id="mkPack"><option value="completo">Campaña completa</option><option value="instagram">Instagram: post + stories</option><option value="tiktok">TikTok/Reel: guion + texto</option><option value="web">Ficha web + SEO</option><option value="ads">Anuncio corto para redes</option></select></div>
      <div style="margin-top:12px"><button id="mkRun" class="primary">Crear contenido</button></div></div>
      <div id="mkResult" style="margin-top:14px"></div></div>`;
    root.querySelector('#mkRun').onclick=async()=>{
      const subject=root.querySelector('#mkSubject').value.trim(),goal=root.querySelector('#mkGoal').value,audience=root.querySelector('#mkAudience').value.trim(),pack=root.querySelector('#mkPack').value,out=root.querySelector('#mkResult'),btn=root.querySelector('#mkRun');
      if(!subject){out.innerHTML='<div class="card">Indica qué quieres promocionar.</div>';return;}
      btn.disabled=true;btn.textContent='Creando…';out.innerHTML='<div class="card">Preparando campaña…</div>';
      const instructions={
        completo:'Entrega: concepto de campaña, titular, texto Instagram/Facebook, 3 stories, guion Reel/TikTok de 15-25 s, CTA, 8-12 hashtags y texto corto para WhatsApp.',
        instagram:'Entrega un post de Instagram/Facebook, 3 stories enlazadas, CTA y hashtags.',
        tiktok:'Entrega un guion vertical de 15-25 segundos por escenas, texto en pantalla, caption y CTA.',
        web:'Entrega nombre comercial, descripción corta, descripción larga, meta title, meta description y palabras clave naturales.',
        ads:'Entrega 5 variantes de anuncio corto con gancho, cuerpo y CTA, sin promesas no verificadas.'
      };
      const prompt=`Crea contenido de marketing para AIHXO. Producto/campaña: ${subject}. Objetivo: ${goal}. Público: ${audience||'general relevante para el producto'}. ${instructions[pack]} Prioriza claridad, personalidad de marca y conversión sin sonar genérico.`;
      try{const text=await ask(prompt,businessContext());out.innerHTML=`<div class="card" style="white-space:pre-wrap;line-height:1.55">${e(text)}</div>`;}catch(err){out.innerHTML=`<div class="card">⚠️ ${e(err?.message||'No se pudo generar el contenido')}</div>`;}finally{btn.disabled=false;btn.textContent='Crear contenido';}
    };
  }

  window.aihxoMarketingProView=view;
  const mo=new MutationObserver(injectNav);mo.observe(document.documentElement,{childList:true,subtree:true});injectNav();
})();