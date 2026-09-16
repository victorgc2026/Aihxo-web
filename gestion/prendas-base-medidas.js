/* AIHXO · Guía de tallas estructurada en Prendas base */
(function(){
  const oldView=window.prendasBaseView;
  if(typeof oldView!=='function') return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

  async function renderMedidas(){
    const root=document.getElementById('pbListado');
    if(!root||typeof supabaseClient==='undefined') return;
    const {data,error}=await supabaseClient
      .from('garments')
      .select('id,model,size_measurements')
      .in('model',['Melbourne','Melbourne Woman']);
    if(error){console.error('Error cargando medidas de prendas base',error);return}

    (data||[]).forEach(g=>{
      const medidas=g.size_measurements||{};
      const entries=Object.entries(medidas);
      if(!entries.length) return;

      const card=[...root.querySelectorAll('.card')].find(c=>c.textContent.includes(g.model));
      if(!card||card.querySelector('.aihxo-size-guide')) return;

      const box=document.createElement('div');
      box.className='aihxo-size-guide';
      box.style.cssText='margin-top:14px;padding:12px;border:1px solid #e1e6ed;border-radius:14px;background:#fafbfc';
      box.innerHTML=`
        <div style="font-weight:900;margin-bottom:8px">📏 Guía de tallas</div>
        <div class="muted" style="font-size:12px;margin-bottom:8px">Medidas de la prenda en plano · ancho × largo</div>
        <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">
          <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:420px">
            <thead><tr><th style="text-align:left;padding:7px">Talla</th><th style="text-align:left;padding:7px">Ancho</th><th style="text-align:left;padding:7px">Largo</th></tr></thead>
            <tbody>${entries.map(([t,m])=>`<tr><td style="padding:7px;border-top:1px solid #eaecf0"><b>${esc(t)}</b></td><td style="padding:7px;border-top:1px solid #eaecf0">${esc(m.width_cm)} cm</td><td style="padding:7px;border-top:1px solid #eaecf0">${esc(m.length_cm)} cm</td></tr>`).join('')}</tbody>
          </table>
        </div>`;
      card.appendChild(box);
    });
  }

  window.prendasBaseView=async function(contenedor){
    await oldView(contenedor);
    await renderMedidas();
  };
})();