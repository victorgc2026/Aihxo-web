/* AIHXO · Ajustes móviles catálogo + clasificación infantil */
(function(){
  if(window.__aihxoMobileFix) return;
  window.__aihxoMobileFix=true;

  const style=document.createElement('style');
  style.textContent=`
  @media (max-width: 700px){
    #productsGrid{display:grid!important;grid-template-columns:1fr!important;gap:16px!important}
    #productsGrid .product{border-radius:18px!important;overflow:hidden!important;margin:0!important}
    #productsGrid .product .ph{height:220px!important;min-height:0!important;max-height:220px!important;padding:0!important;background:#f7f7f7!important}
    #productsGrid .product .ph img{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center!important;display:block!important}
    #productsGrid .product .info{padding:16px!important}
    #productsGrid .product .info h3{font-size:22px!important;line-height:1.1!important;margin:8px 0!important}
    #productsGrid .product .info p{margin:8px 0!important;line-height:1.35!important}
    #productsGrid .product .info em{font-size:11px!important;line-height:1.2!important;display:inline-block!important}
    #productsGrid .aihxo-personaliza-details>summary{padding:12px 14px!important;margin-top:12px!important;font-size:14px!important}
    .personal-category-access{gap:10px!important;margin-bottom:18px!important}
    .personal-category-card{padding:14px!important;min-height:0!important}
    .personal-category-card strong{font-size:15px!important}
    .personal-category-card span{font-size:12px!important}
  }
  `;
  document.head.appendChild(style);

  const infantSizes=new Set(['2/3','3/4','4/5','5/6','6/7','7/8','8/9','9/10','9/11','10/11','11/12','12/13','13/14','2-3','3-4','4-5','5-6','6-7','7-8','8-9','9-10','9-11','10-11','11-12','12-13','13-14']);

  function fixCards(){
    document.querySelectorAll('#productsGrid .product').forEach(card=>{
      const sizes=[...card.querySelectorAll('.size-option')].map(b=>(b.dataset.size||b.textContent||'').trim());
      if(!sizes.some(s=>infantSizes.has(s))) return;
      card.dataset.cat='nino';
      const em=card.querySelector('.info em');
      if(em && /PARA PERSONALIZAR/i.test(em.textContent||'')) em.textContent='PARA PERSONALIZAR · NIÑOS';
    });
  }

  fixCards();
  const obs=new MutationObserver(()=>fixCards());
  const root=document.getElementById('productsGrid')||document.body;
  obs.observe(root,{childList:true,subtree:true});
})();
