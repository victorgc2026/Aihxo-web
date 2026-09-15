/* AIHXO · protección UI de compras */
(function(){
  function proteger(){
    document.querySelectorAll('.editPurchaseLines').forEach(btn=>{
      const card=btn.closest('.card');
      const txt=card?.textContent||'';
      const m=txt.match(/(\d+)\s*\/\s*(\d+)\s*unidades recibidas/i);
      if(m&&Number(m[1])>0){
        btn.disabled=true;
        btn.textContent='🔒 Líneas';
        btn.title='Esta compra ya tiene unidades recibidas y sus líneas quedan protegidas';
      }
    });
  }
  document.addEventListener('submit',e=>{
    if(e.target?.id!=='buyForm')return;
    const ids=[...e.target.querySelectorAll('.pli')].map(x=>x.value).filter(Boolean);
    if(new Set(ids).size!==ids.length){
      e.preventDefault();
      e.stopImmediatePropagation();
      if(typeof toast==='function')toast('Hay una prenda repetida. Usa una sola línea por variante.');
    }
  },true);
  new MutationObserver(proteger).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(proteger,300);
})();