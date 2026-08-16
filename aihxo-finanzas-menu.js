(function(){

  function instalar(){

    const nav = document.querySelector('#nav');

    if(!nav || !window.setView || !window.AIHXO_FINANZAS){
      return false;
    }

    let boton = nav.querySelector('[data-view="finanzas"]');

    if(!boton){

      nav.insertAdjacentHTML(
        'beforeend',
        '<button data-view="finanzas">💶 <span>Finanzas</span></button>'
      );

      boton = nav.querySelector('[data-view="finanzas"]');
    }

    const baseSetView = window.setView;

    window.setView = function(view){

      if(view !== 'finanzas'){
        return baseSetView(view);
      }

      document.querySelector('#title').textContent = 'Finanzas';

      document
        .querySelectorAll('#nav button')
        .forEach(b =>
          b.classList.toggle(
            'active',
            b.dataset.view === 'finanzas'
          )
        );

      document.querySelector('.sidebar')?.classList.remove('open');

      document.querySelector('#menuOverlay')?.classList.remove('open');

      window.AIHXO_FINANZAS.render();

      window.scrollTo(0,0);
    };

    boton.onclick = function(e){

      e.preventDefault();
      e.stopPropagation();

      window.setView('finanzas');
    };

    return true;
  }

  const intervalo = setInterval(function(){

    if(instalar()){
      clearInterval(intervalo);
    }

  },500);

})();
