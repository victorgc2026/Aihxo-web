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

    boton.onclick = function(){

      document.querySelector('#title').textContent = 'Finanzas';

      nav.querySelectorAll('button').forEach(b =>
        b.classList.toggle('active', b === boton)
      );

      document.querySelector('.sidebar')?.classList.remove('open');

      document.querySelector('#menuOverlay')?.classList.remove('open');

      window.AIHXO_FINANZAS.render();

      window.scrollTo(0,0);
    };

    return true;
  }

  const intervalo = setInterval(function(){

    if(instalar()){
      clearInterval(intervalo);
    }

  },500);

})();
