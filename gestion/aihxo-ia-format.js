/* AIHXO IA · Formato visual seguro para respuestas */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function inline(s){
    let x=esc(s);
    x=x.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    x=x.replace(/`([^`]+)`/g,'<code style="background:#eef2f7;padding:2px 5px;border-radius:6px;font-size:.92em">$1</code>');
    return x;
  }

  function formatMarkdown(text){
    const lines=String(text||'').replace(/\r/g,'').split('\n');
    let html='', inList=false;
    const closeList=()=>{ if(inList){html+='</ul>';inList=false;} };

    for(const raw of lines){
      const line=raw.trim();
      if(!line){ closeList(); html+='<div style="height:8px"></div>'; continue; }
      const bullet=line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
      if(bullet){
        if(!inList){ html+='<ul style="margin:8px 0 12px;padding-left:22px;display:grid;gap:7px">'; inList=true; }
        html+='<li>'+inline(bullet[1])+'</li>';
        continue;
      }
      closeList();
      const heading=line.match(/^#{1,3}\s+(.+)$/);
      if(heading){ html+='<div style="font-weight:900;font-size:1.08em;margin:12px 0 6px">'+inline(heading[1])+'</div>'; continue; }
      html+='<div style="margin:4px 0">'+inline(line)+'</div>';
    }
    closeList();
    return html;
  }

  function enhance(){
    const result=document.querySelector('#aihxoAiResult');
    if(!result) return;
    result.querySelectorAll('.card:not([data-ai-formatted])').forEach(card=>{
      if(card.querySelector('img,form,input,textarea,button,a')) return;
      const text=card.textContent||'';
      if(!text.trim()) return;
      card.dataset.aiFormatted='1';
      card.style.whiteSpace='normal';
      card.style.lineHeight='1.6';
      card.style.fontSize='16px';
      card.style.overflowWrap='anywhere';
      card.innerHTML=formatMarkdown(text);
    });
  }

  const observer=new MutationObserver(()=>requestAnimationFrame(enhance));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhance();
})();
