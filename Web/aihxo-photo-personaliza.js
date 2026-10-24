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
   wrapper.append(img,note);area.prepend(wrapper);
   img.onerror=()=>{wrapper.hidden=true;const old=area.querySelector('.aihxo-shirt-preview');if(old)old.hidden=false;};
   img.onload=()=>{wrapper.hidden=false;// Solo ocultar la vista anterior después de cargar la foto correctamente.};
   function update(){
     let color=card.dataset.selectedColor||'Blanco';
     if(m==='melbourne_kids'&&!childColors.has(color))color='Blanco';
     const code=(aliases[color]||color).trim().replace(/ /g,'_');
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