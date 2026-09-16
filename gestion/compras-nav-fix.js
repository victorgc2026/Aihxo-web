/* AIHXO · Fijar accesos de Compras y Rentabilidad en el menú */
(function(){
  function makeButton(view, html){
    const b=document.createElement('button');
    b.type='button';
    b.dataset.view=view;
    b.innerHTML=html;
    b.onclick=()=>{
      if(typeof window.setView==='function') window.setView(view);
      if(typeof window.closeMobileMenu==='function') window.closeMobileMenu();
    };
    return b;
  }

  function ensureFinanceNav(){
    const nav=document.querySelector('#nav');
    if(!nav) return;

    const expenses=nav.querySelector('[data-view="expenses"]');
    const reports=nav.querySelector('[data-view="reports"]');
    if(!expenses || !reports) return;

    if(!nav.querySelector('[data-view="purchases"]')){
      const purchases=makeButton('purchases','🛒 <span>Compras</span>');
      const invoices=nav.querySelector('[data-view="invoices"]');
      if(invoices) invoices.insertAdjacentElement('afterend',purchases);
      else nav.insertBefore(purchases,expenses);
    }

    if(!nav.querySelector('[data-view="profitability"]')){
      const profitability=makeButton('profitability','📈 <span>Rentabilidad</span>');
      expenses.insertAdjacentElement('afterend',profitability);
    }
  }

  const observer=new MutationObserver(ensureFinanceNav);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ensureFinanceNav();
})();
