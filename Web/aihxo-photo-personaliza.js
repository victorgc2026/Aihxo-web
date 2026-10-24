/* AIHXO - Vista fotográfica de mockups por prenda/color.
   Requiere archivos Web/mockups/<modelo>/<codigo>.webp publicados antes de activar. */
(()=>{
 if(window.__aihxoPhotoMockups) return; window.__aihxoPhotoMockups=true;
 const files={
   Palm:'palm_unisex','Palm Woman':'palm_woman'
 };
 const aliases={'Blanco':'WHITE-100','Negro':'BLACK-200','Gris jaspeado':'HEATHER GREY-202','Gris oscuro':'DARK GREY-201','Azul Marino':'NAVY-500','Lila':'LILAC-530','Arena':'SAND-103','Verde Sage':'SAGE-613','Sky Blue 501':'SKY BLUE-501'};
 const childColors=new Set(['Blanco','Negro','Lila','Arena','Azul Marino','Sky Blue 501','Verde Sage']);
 function model(card){
   const premium=card.dataset.premiumModel;
   if(premium)return files[premium]||null;
   const n=(card.dataset.productName||card.querySelector('h3')?.textContent||'').toLowerCase();
   if(n.includes('oversize niño'))return null; // no aplicar corte regular a oversize
   if(n.includes('melbourne kids')||n.includes('básica niño'))return 'melbourne_kids';
   if(n.includes('básica adulto')||n.includes('melbourne · unisex'))return 'melbourne_adulto';
   return null;
 }
 function bind(card){
   const m=model(card), area=card.querySelector('.aihxo-personaliza-expanded');
   if(!m||!area||area.querySelector('.aihxo-mockup-photo')||!area.querySelector('[data-color]'))return;
   const wrapper=document.createElement('div');wrapper.className='aihxo-mockup-photo';
   wrapper.style.cssText='margin:12px 0 18px;padding:12px;background:#f3f5f8;border-radius:16px;text-align:center';
   const img=document.createElement('img');
   img.alt='Vista orientativa de la camiseta';
   img.style.cssText='max-width:300px;width:100%;height:auto;aspect-ratio:4/5;object-fit:contain;display:block;margin:auto';
   const note=document.createElement('p');note.textContent='Mockup orientativo. El tono real puede variar.';
   note.style.cssText='font-size:12px;color:#667085;margin:8px 0 0';
   const vector=document.createElement('div');vector.className='aihxo-mockup-fallback';
   vector.innerHTML='<svg viewBox="0 0 300 305" role="img" aria-label="Vista de la camiseta" style="width:100%;max-width:300px"><defs><linearGradient id="aihxo-shirt-light"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs><path class="aihxo-live-shirt-fill" d="M93 40 L115 27 Q150 51 185 27 L207 40 L279 90 L250 147 L215 130 L215 277 Q150 289 85 277 L85 130 L50 147 L21 90 Z" fill="#fff" stroke="#999" stroke-width="1.8"/><path d="M93 40 L115 27 Q150 51 185 27 L207 40 L279 90 L250 147 L215 130 L215 277 Q150 289 85 277 L85 130 L50 147 L21 90 Z" fill="url(#aihxo-shirt-light)"/><path d="M115 27 Q150 77 185 27" fill="none" stroke="#777" stroke-width="2"/></svg>';
   const label=document.createElement('b');label.className='aihxo-live-shirt-color';label.textContent='Blanco';
   wrapper.append(img,vector,label,note);area.prepend(wrapper);
   img.onerror=()=>{img.hidden=true;const vector=wrapper.querySelector('.aihxo-mockup-fallback');if(vector)vector.hidden=false;};
   img.onload=()=>{wrapper.hidden=false;// Solo ocultar la vista anterior después de cargar la foto correctamente.};
   function update(){
     let color=card.dataset.selectedColor||'Blanco';
     
     const code=(aliases[color]||color).trim().replace(/ /g,'_');
     img.hidden=false;
     const baseColors={'WHITE-100':'#ffffff','BLACK-200':'#161616','HEATHER GREY-202':'#b8b8b8','DARK GREY-201':'#555555','NAVY-500':'#172554','ROYAL BLUE-502':'#2858d9','BLUE FOG-509':'#90a9b8','RED-400':'#cf2f35','SAGE-613':'#9caf88','SAND-103':'#d8c39a','LILAC-530':'#c1a5d8','FUCHSIA-406':'#d13d88','WINE-403':'#77283e','ORANGE-301':'#ed7a22','YELLOW-300':'#f4d435','BOTTLE GREEN-602':'#174f35'};
     const paletteEl=area.querySelector('[data-color="'+CSS.escape(color)+'"] i, [data-color="'+CSS.escape(color)+'"] span');
     const swatch=paletteEl?.style?.backgroundColor;
     const shirt=wrapper.querySelector('.aihxo-live-shirt-fill');
     if(shirt)shirt.setAttribute('fill',baseColors[aliases[color]||color]||swatch||'#ffffff');
     const caption=wrapper.querySelector('.aihxo-live-shirt-color');if(caption)caption.textContent=color;
     img.src='mockups/'+m+'/'+encodeURIComponent(code)+'.webp';
   }
   const old=area.querySelector('.aihxo-shirt-preview');if(old)old.hidden=true;
   area.addEventListener('click',e=>{if(e.target.closest('[data-color]'))queueMicrotask(update)});
   update();
 }
 function refresh(){document.querySelectorAll('#productsGrid article.product').forEach(bind)}
 const ready=()=>{const grid=document.getElementById('productsGrid');if(!grid)return;refresh();new MutationObserver(refresh).observe(grid,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();