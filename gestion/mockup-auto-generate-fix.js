/* AIHXO · Fix generación mockup automático · Safari/iPhone */
(function(){
  const $=s=>document.querySelector(s);
  let boundButton=null;

  function toastSafe(msg){
    try{ if(typeof toast==='function') toast(msg); else console.log(msg); }catch(_e){}
  }

  function setStatus(text,ok=true){
    let box=$('#maGenerateStatus');
    if(!box){
      const btn=$('#maGenerate');
      if(!btn)return;
      box=document.createElement('div');
      box.id='maGenerateStatus';
      box.style.cssText='display:none;margin-top:10px;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:800;text-align:center';
      btn.insertAdjacentElement('afterend',box);
    }
    box.style.display='block';
    box.style.background=ok?'#ecfdf3':'#fff1f1';
    box.style.color=ok?'#067647':'#b42318';
    box.textContent=text;
  }

  function invalidate(){
    const box=$('#maGenerateStatus');
    if(box){
      box.style.display='block';
      box.style.background='#fff7e6';
      box.style.color='#9a6700';
      box.textContent='Hay cambios pendientes. Pulsa GENERAR MOCKUP AUTOMÁTICO.';
    }
    const attach=$('#maAttach');
    if(attach && attach.textContent.includes('✓')) attach.textContent='🌐 Añadir al diseño/web';
  }

  function dispatchChange(el){
    if(!el)return;
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(_e){}
  }

  async function robustGenerate(ev){
    ev?.preventDefault?.();
    ev?.stopImmediatePropagation?.();

    const btn=$('#maGenerate');
    if(!btn)return;
    const mode=$('#maMode')?.value||'double';
    const garment=$('#maGarment')?.value;
    const model=$('#maModel')?.value;
    const front=$('#maFrontFile');
    const back=$('#maBackFile');

    if(!garment){ setStatus('Selecciona una prenda base.',false); return; }
    if(!model){ setStatus('Selecciona un modelo/persona.',false); return; }
    if(mode!=='back' && !front?.files?.length){ setStatus('Falta el diseño delantero.',false); front?.scrollIntoView?.({behavior:'smooth',block:'center'}); return; }
    if(mode!=='front' && !back?.files?.length){ setStatus('Falta el diseño trasero.',false); back?.scrollIntoView?.({behavior:'smooth',block:'center'}); return; }

    const old=btn.textContent;
    btn.disabled=true;
    btn.textContent='⏳ GENERANDO MOCKUP…';
    setStatus('Preparando modelo, color y diseños…',true);

    try{
      // En Safari re-disparamos los change para que los File inputs vuelvan a cargar
      // las imágenes seleccionadas dentro del generador.
      if(mode!=='back') dispatchChange(front);
      if(mode!=='front') dispatchChange(back);
      await new Promise(r=>setTimeout(r,180));

      // Fuerza recarga de la pareja frontal/trasera del modelo actual.
      dispatchChange($('#maModel'));
      await new Promise(r=>setTimeout(r,500));

      // El color y modo también se vuelven a aplicar al canvas actual.
      dispatchChange($('#maColor'));
      dispatchChange($('#maMode'));
      await new Promise(r=>setTimeout(r,140));

      const outputs=$('#maOutputs');
      setStatus('✓ Mockup regenerado correctamente.',true);
      toastSafe('Mockup regenerado');
      outputs?.scrollIntoView?.({behavior:'smooth',block:'start'});
    }catch(err){
      console.error('Error regenerando mockup',err);
      setStatus('No se pudo regenerar el mockup. Vuelve a seleccionar los archivos.',false);
    }finally{
      btn.disabled=false;
      btn.textContent=old||'⚡ GENERAR MOCKUP AUTOMÁTICO';
    }
  }

  function bind(){
    const btn=$('#maGenerate');
    if(!btn || btn===boundButton)return;
    boundButton=btn;
    btn.addEventListener('click',robustGenerate,true);

    ['#maGarment','#maColor','#maModel','#maMode','#maFrontFile','#maBackFile'].forEach(sel=>{
      const el=$(sel); if(el) el.addEventListener('change',invalidate,{passive:true});
    });
  }

  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(bind,400);
})();
