/* AIHXO · Premium en PERSONALIZA (PALM / PALM WOMAN) */
(function(){
  if(window.__aihxoPremiumPersonaliza) return;
  window.__aihxoPremiumPersonaliza=true;

  const COLOR_NAMES={
    'WHITE-100':'Blanco','HEATHER GREY-202':'Gris jaspeado','DARK GREY-201':'Gris oscuro','BLACK-200':'Negro',
    'BLUE FOG-509':'Azul niebla','DENIM BLUE-510':'Azul denim','DEEP NAVY-512':'Azul marino oscuro','NAVY-500':'Azul marino',
    'ROYAL BLUE-502':'Azul royal','ATTOL-505':'Azul atoll','SKY BLUE-501':'Azul cielo','SAGE-613':'Verde sage',
    'RICH TURQUOISE-515':'Turquesa','LIME-604':'Lima','KELLY GREEN-600':'Verde kelly','BOTTLE GREEN-602':'Verde botella',
    'KHAKI GREEN-601':'Verde caqui','MISTY GREEN-621':'Verde mist','BROWN-104':'Marrón','SAND-103':'Arena',
    'YELLOW-300':'Amarillo','GOLD-305':'Dorado','PEACH-313':'Melocotón','ORANGE-301':'Naranja','FRESH CORAL-414':'Coral',
    'RED-400':'Rojo','FUCHSIA-406':'Fucsia','PURPLE-511':'Morado','WINE-403':'Burdeos','PALE ROSE-410':'Rosa claro',
    'CANDY PINK-422':'Rosa candy','LILAC-530':'Lila'
  };

  const SWATCH={
    'WHITE-100':'#fff','HEATHER GREY-202':'#b8b8b8','DARK GREY-201':'#555','BLACK-200':'#111','BLUE FOG-509':'#90a9b8',
    'DENIM BLUE-510':'#4f6f8f','DEEP NAVY-512':'#0f2341','NAVY-500':'#172554','ROYAL BLUE-502':'#2858d9','ATTOL-505':'#1aa7b8',
    'SKY BLUE-501':'#8ecdf2','SAGE-613':'#9caf88','RICH TURQUOISE-515':'#21aeb8','LIME-604':'#b7d62f','KELLY GREEN-600':'#27894b',
    'BOTTLE GREEN-602':'#174f35','KHAKI GREEN-601':'#6f7651','MISTY GREEN-621':'#adc5b3','BROWN-104':'#6d4a3a','SAND-103':'#d8c39a',
    'YELLOW-300':'#f4d435','GOLD-305':'#d9aa24','PEACH-313':'#f4b18d','ORANGE-301':'#ed7a22','FRESH CORAL-414':'#ef806f',
    'RED-400':'#cf2f35','FUCHSIA-406':'#d13d88','PURPLE-511':'#70458d','WINE-403':'#77283e','PALE ROSE-410':'#e8b8c4',
    'CANDY PINK-422':'#e8a3bb','LILAC-530':'#c1a5d8'
  };

  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function style(){
    const s=document.createElement('style');
    s.textContent=`
      .aihxo-premium-badge{display:inline-block;background:#07152f;color:#DFFF00;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:900;letter-spacing:.4px}
      .aihxo-premium-note{font-size:12px;color:#667085;line-height:1.45;margin:8px 0 0}
      .aihxo-premium-options{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
      .aihxo-premium-option{border:1px solid #d7deea;background:#fff;border-radius:999px;padding:7px 11px;cursor:pointer;font-weight:700}
      .aihxo-premium-option.active{background:#07152f;color:#fff;border-color:#07152f}
      .aihxo-premium-color{display:inline-flex;align-items:center;gap:7px;border:1px solid #d7deea;background:#fff;border-radius:999px;padding:6px 10px;cursor:pointer}
      .aihxo-premium-color.active{border:2px solid #087cf4;background:#eef6ff;font-weight:800}
      .aihxo-premium-color i{width:20px;height:20px;border-radius:50%;display:inline-block;border:1px solid #bfc7d3}
      .aihxo-premium-whatsapp{display:inline-flex;align-items:center;justify-content:center;margin-top:14px;background:#087cf4;color:#fff;text-decoration:none;font-weight:900;padding:14px 18px;border-radius:14px;border:0;cursor:pointer}
    `;
    document.head.appendChild(s);
  }

  function card(model,title,subtitle){
    return `
    <article class="product aihxo-premium-card" data-cat="adulto" data-premium-model="${esc(model)}" data-selected-size="" data-selected-color="">
      <div class="ph dark"><b>AIHXO PREMIUM</b><small>${esc(title)}</small></div>
      <div class="info">
        <span class="aihxo-premium-badge">PREMIUM · 190 g/m²</span>
        <h3>${esc(title)}</h3>
        <p>${esc(subtitle)}</p>
        <p class="aihxo-premium-note">Algodón Ringspun · Regular Fit · Bajo pedido</p>
        <details class="aihxo-personaliza-details aihxo-premium-details">
          <summary style="cursor:pointer;margin:12px 0 0;padding:11px 16px;border-radius:12px;background:#07152f;color:#DFFF00;font-weight:900;text-align:center;list-style:none">PERSONALIZAR ↓</summary>
          <div class="aihxo-personaliza-expanded" style="padding-top:6px">
            <div class="aihxo-premium-loading" style="margin:14px 0;color:#667085">Cargando opciones del modelo…</div>
          </div>
        </details>
      </div>
    </article>`;
  }

  async function loadModel(card){
    if(card.dataset.loaded==='1') return;
    card.dataset.loaded='1';
    const model=card.dataset.premiumModel;
    const box=card.querySelector('.aihxo-personaliza-expanded');
    try{
      const {data,error}=await catalogSB.from('garments').select('model,sizes,colors,grammage,audience').eq('model',model).eq('active',true).limit(1);
      if(error) throw error;
      const g=data?.[0];
      if(!g) throw new Error('Modelo no encontrado');
      const sizes=Array.isArray(g.sizes)?g.sizes:[];
      const colors=Array.isArray(g.colors)?g.colors:[];
      box.innerHTML=`
        <div style="margin:14px 0"><b>Selecciona talla:</b><div class="aihxo-premium-options">${sizes.map(x=>`<button type="button" class="aihxo-premium-option" data-size="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
        <div style="margin:14px 0"><b>Color:</b><div class="aihxo-premium-options">${colors.map(c=>`<button type="button" class="aihxo-premium-color" data-color="${esc(c)}"><i style="background:${SWATCH[c]||'#d1d5db'}"></i>${esc(COLOR_NAMES[c]||c)}</button>`).join('')}</div><p class="aihxo-premium-note"><b>Más colores bajo pedido según catálogo del proveedor · sujeto a disponibilidad.</b></p></div>
        <div style="margin:14px 0"><b>Cantidad</b><div class="aihxo-premium-options"><button type="button" class="aihxo-premium-option" data-qty-minus>−</button><span data-qty style="min-width:24px;text-align:center;font-weight:900;padding:8px 0">1</span><button type="button" class="aihxo-premium-option" data-qty-plus>+</button></div></div>
        <button type="button" class="aihxo-premium-whatsapp">Consultar personalización →</button>
        <p class="aihxo-premium-note">El precio final depende de la personalización elegida.</p>`;

      box.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{box.querySelectorAll('[data-size]').forEach(x=>x.classList.remove('active'));b.classList.add('active');card.dataset.selectedSize=b.dataset.size||'';});
      box.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{box.querySelectorAll('[data-color]').forEach(x=>x.classList.remove('active'));b.classList.add('active');card.dataset.selectedColor=b.dataset.color||'';});
      const qty=box.querySelector('[data-qty]');
      box.querySelector('[data-qty-minus]').onclick=()=>qty.textContent=String(Math.max(1,Number(qty.textContent||1)-1));
      box.querySelector('[data-qty-plus]').onclick=()=>qty.textContent=String(Math.min(99,Number(qty.textContent||1)+1));
      box.querySelector('.aihxo-premium-whatsapp').onclick=()=>{
        if(!card.dataset.selectedSize){alert('Selecciona una talla antes de continuar.');return;}
        if(!card.dataset.selectedColor){alert('Selecciona un color antes de continuar.');return;}
        const label=COLOR_NAMES[card.dataset.selectedColor]||card.dataset.selectedColor;
        const text=`Hola AIHXO 👋 Quiero personalizar una camiseta Premium.\n\n👕 Modelo: MUKUA ${model}\n📏 Talla: ${card.dataset.selectedSize}\n🎨 Color: ${label}\n📦 Cantidad: ${qty.textContent||'1'}\n\nQuiero consultar opciones de personalización y precio.`;
        window.open('https://wa.me/34634344174?text='+encodeURIComponent(text),'_blank','noopener');
      };
    }catch(e){
      box.innerHTML='<p class="aihxo-premium-note">No se pudieron cargar ahora las opciones del modelo. Escríbenos por WhatsApp y te confirmamos tallas y colores.</p><a class="aihxo-premium-whatsapp" target="_blank" rel="noopener" href="https://wa.me/34634344174">Consultar por WhatsApp →</a>';
    }
  }

  function inject(){
    const grid=document.getElementById('productsGrid');
    if(!grid||grid.querySelector('.aihxo-premium-card')) return;
    const wrap=document.createElement('div');wrap.style.display='contents';
    wrap.innerHTML=card('Palm','Camiseta Premium · Unisex','MUKUA PALM · camiseta de mayor gramaje y presencia, pensada para una personalización premium.')+card('Palm Woman','Camiseta Premium · Mujer','MUKUA PALM WOMAN · corte femenino, mayor gramaje y acabado premium.');
    grid.prepend(...wrap.children);
    grid.querySelectorAll('.aihxo-premium-details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)loadModel(d.closest('.aihxo-premium-card'));}));
  }

  style();
  const grid=document.getElementById('productsGrid');
  if(grid){
    inject();
    new MutationObserver(()=>inject()).observe(grid,{childList:true});
  }else{
    document.addEventListener('DOMContentLoaded',inject,{once:true});
  }
})();
// deploy premium v2
