/* AIHXO · Asistente IA público */
(function(){
  if(window.__aihxoWebAICargado) return;
  window.__aihxoWebAICargado=true;

  const ENDPOINT='https://zoiesxtchnesrilpuqek.supabase.co/functions/v1/aihxo-web-ai';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const state={open:false,busy:false,history:[]};

  function pageContext(){
    const text=(document.body?.innerText||'').replace(/\s+/g,' ').trim().slice(0,18000);
    const products=[...document.querySelectorAll('.product')].slice(0,30).map(card=>({
      nombre:card.querySelector('h3')?.textContent?.trim()||'',
      texto:(card.innerText||'').replace(/\s+/g,' ').trim().slice(0,500)
    }));
    return {
      pagina:location.pathname,
      titulo:document.title,
      contenido_visible:text,
      productos_visibles:products,
      contacto:{whatsapp:'634 344 174',email:'hola@aihxo.es',pedidos:'pedidos@aihxo.es'},
      negocio:{marca:'AIHXO',ubicacion:'Oleiros, A Coruña',envios:'España'}
    };
  }

  function css(){
    const s=document.createElement('style');
    s.textContent=`
      #aihxoWebAIButton{position:fixed;right:18px;bottom:18px;z-index:9998;border:0;border-radius:999px;background:#07152f;color:#fff;padding:14px 18px;font-weight:900;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.22);cursor:pointer;display:flex;align-items:center;gap:8px}
      #aihxoWebAIPanel{position:fixed;right:16px;bottom:78px;z-index:9999;width:min(390px,calc(100vw - 24px));max-height:min(640px,78vh);background:#fff;border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden;border:1px solid #e8ebef;display:none;font-family:inherit}
      #aihxoWebAIPanel.open{display:flex;flex-direction:column}
      .aihxo-ai-head{background:#07152f;color:#fff;padding:16px;display:flex;justify-content:space-between;gap:12px;align-items:center}
      .aihxo-ai-head b{font-size:16px}.aihxo-ai-head small{display:block;opacity:.75;margin-top:3px}.aihxo-ai-close{background:transparent;color:#fff;border:0;font-size:24px;cursor:pointer}
      .aihxo-ai-messages{padding:14px;overflow:auto;flex:1;background:#f7f8fa;min-height:220px}
      .aihxo-ai-msg{max-width:88%;padding:11px 13px;border-radius:14px;margin:8px 0;line-height:1.45;font-size:14px;white-space:pre-wrap}
      .aihxo-ai-msg.bot{background:#fff;border:1px solid #e6e9ee;color:#111}.aihxo-ai-msg.user{background:#07152f;color:#fff;margin-left:auto}
      .aihxo-ai-chips{padding:0 14px 10px;background:#f7f8fa;display:flex;gap:7px;overflow:auto}.aihxo-ai-chip{white-space:nowrap;border:1px solid #dfe3e8;background:#fff;border-radius:999px;padding:8px 10px;font-size:12px;font-weight:800;cursor:pointer}
      .aihxo-ai-form{padding:12px;background:#fff;border-top:1px solid #e7eaee;display:flex;gap:8px}.aihxo-ai-form input{flex:1;min-width:0;border:1px solid #ccd2da;border-radius:12px;padding:12px;font:inherit}.aihxo-ai-send{border:0;border-radius:12px;background:#07152f;color:#fff;padding:0 14px;font-weight:900;cursor:pointer}.aihxo-ai-send:disabled{opacity:.55}
      @media(max-width:600px){#aihxoWebAIButton{right:12px;bottom:12px}#aihxoWebAIPanel{right:12px;bottom:70px;width:calc(100vw - 24px);max-height:76vh}}
    `;
    document.head.appendChild(s);
  }

  function markup(){
    const button=document.createElement('button');button.id='aihxoWebAIButton';button.type='button';button.innerHTML='✨ <span>¿Te ayudo?</span>';
    const panel=document.createElement('div');panel.id='aihxoWebAIPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Asistente AIHXO');
    panel.innerHTML=`
      <div class="aihxo-ai-head"><div><b>AIHXO Assistant</b><small>Te ayudo con tallas, personalización y pedidos</small></div><button class="aihxo-ai-close" aria-label="Cerrar">×</button></div>
      <div class="aihxo-ai-messages"><div class="aihxo-ai-msg bot">¡Hola! 👋 Soy el asistente de AIHXO. Puedo ayudarte con personalización, tallas, productos y cómo hacer un pedido.</div></div>
      <div class="aihxo-ai-chips">
        <button class="aihxo-ai-chip">¿Cómo personalizo una camiseta?</button>
        <button class="aihxo-ai-chip">¿Qué tallas tenéis?</button>
        <button class="aihxo-ai-chip">¿Cómo hago un pedido?</button>
      </div>
      <form class="aihxo-ai-form"><input maxlength="700" autocomplete="off" placeholder="Escribe tu pregunta…"><button class="aihxo-ai-send" type="submit">Enviar</button></form>`;
    document.body.append(button,panel);
    return {button,panel};
  }

  function addMessage(panel,who,text){
    const box=panel.querySelector('.aihxo-ai-messages');
    const div=document.createElement('div');div.className='aihxo-ai-msg '+who;div.textContent=text;box.appendChild(div);box.scrollTop=box.scrollHeight;return div;
  }

  async function ask(panel,prompt){
    if(state.busy||!prompt) return;
    state.busy=true;
    const send=panel.querySelector('.aihxo-ai-send'),input=panel.querySelector('input');send.disabled=true;input.disabled=true;
    addMessage(panel,'user',prompt);state.history.push({role:'user',text:prompt});
    const thinking=addMessage(panel,'bot','Pensando…');
    try{
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,context:{...pageContext(),historial:state.history.slice(-6)}})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data?.error) throw new Error(data?.error||'No se pudo responder');
      const text=data?.text||'No tengo suficiente información. Puedes escribirnos por WhatsApp al 634 344 174.';
      thinking.textContent=text;state.history.push({role:'assistant',text});
    }catch(_){
      thinking.textContent='Ahora mismo no puedo responder. Puedes escribirnos por WhatsApp al 634 344 174 o por correo a hola@aihxo.es.';
    }finally{state.busy=false;send.disabled=false;input.disabled=false;input.focus();}
  }

  function init(){
    css();const {button,panel}=markup();
    button.onclick=()=>{state.open=!state.open;panel.classList.toggle('open',state.open);button.setAttribute('aria-expanded',String(state.open));if(state.open)setTimeout(()=>panel.querySelector('input')?.focus(),50);};
    panel.querySelector('.aihxo-ai-close').onclick=()=>{state.open=false;panel.classList.remove('open');button.setAttribute('aria-expanded','false');};
    panel.querySelector('.aihxo-ai-form').onsubmit=e=>{e.preventDefault();const input=panel.querySelector('input'),p=input.value.trim();if(!p)return;input.value='';ask(panel,p);};
    panel.querySelectorAll('.aihxo-ai-chip').forEach(chip=>chip.onclick=()=>ask(panel,chip.textContent.trim()));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
