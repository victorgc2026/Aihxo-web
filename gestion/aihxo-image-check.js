/* AIHXO · Control técnico de imágenes DTF */
(function(){
  if(window.__aihxoImageCheck) return;
  window.__aihxoImageCheck=true;
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function injectNav(){
    const nav=document.querySelector('#nav');
    if(!nav||document.querySelector('#aihxoImageCheckNav')) return;
    const btn=document.createElement('button');
    btn.id='aihxoImageCheckNav';btn.type='button';btn.innerHTML='🖼 <span>Control DTF</span>';
    btn.onclick=()=>{view();if(typeof closeMobileMenu==='function')closeMobileMenu();};
    const ai=document.querySelector('#aihxoIaNav');
    if(ai) nav.insertBefore(btn,ai); else nav.appendChild(btn);
  }

  function quality(dpi){
    if(dpi>=300)return {label:'ÓPTIMA',icon:'✅',text:'Resolución adecuada para impresión DTF al tamaño indicado.'};
    if(dpi>=220)return {label:'ACEPTABLE',icon:'🟡',text:'Puede servir, aunque no llega a 300 ppp efectivos.'};
    if(dpi>=150)return {label:'JUSTA',icon:'🟠',text:'Riesgo visible de pérdida de definición al imprimir.'};
    return {label:'BAJA',icon:'🔴',text:'No recomendable para imprimir a ese tamaño. Pide un archivo de mayor resolución.'};
  }

  async function analyse(file,wcm,hcm){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;});
      const w=img.naturalWidth,h=img.naturalHeight;
      const dpiW=w/(wcm/2.54),dpiH=h/(hcm/2.54),dpi=Math.floor(Math.min(dpiW,dpiH));
      let transparent=false,alphaPct=0;
      if(file.type==='image/png'||file.type==='image/webp'){
        const max=700,scale=Math.min(1,max/Math.max(w,h));
        const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));
        const x=c.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
        const d=x.getImageData(0,0,c.width,c.height).data;let a=0,total=d.length/4;
        for(let i=3;i<d.length;i+=4)if(d[i]<250)a++;
        alphaPct=total?Math.round((a/total)*1000)/10:0;transparent=a>0;
      }
      return {w,h,dpi,transparent,alphaPct,type:file.type||'desconocido',sizeMB:(file.size/1048576).toFixed(2)};
    }finally{URL.revokeObjectURL(url);}
  }

  function view(){
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    document.querySelector('#aihxoImageCheckNav')?.classList.add('active');
    const title=document.querySelector('#title');if(title)title.textContent='Control DTF';
    const root=document.querySelector('#view');if(!root)return;
    root.innerHTML=`<div class="page"><div class="section"><div><h2 style="margin:0">🖼 Control técnico DTF</h2><div class="muted">Comprueba resolución, tamaño de impresión y transparencia sin modificar el archivo.</div></div></div>
      <div class="card"><label>Archivo</label><input id="dtfFile" type="file" accept="image/png,image/jpeg,image/webp">
      <div class="grid two" style="margin-top:12px"><div><label>Ancho de impresión (cm)</label><input id="dtfW" type="number" min="1" step="0.5" value="28"></div><div><label>Alto de impresión (cm)</label><input id="dtfH" type="number" min="1" step="0.5" value="30"></div></div>
      <div style="margin-top:12px"><button id="dtfCheck" class="primary">Analizar archivo</button></div></div>
      <div id="dtfResult" style="margin-top:14px"></div></div>`;

    root.querySelector('#dtfCheck').onclick=async()=>{
      const file=root.querySelector('#dtfFile').files?.[0],wcm=Number(root.querySelector('#dtfW').value),hcm=Number(root.querySelector('#dtfH').value),out=root.querySelector('#dtfResult');
      if(!file){out.innerHTML='<div class="card">Selecciona una imagen.</div>';return;}
      if(!wcm||!hcm){out.innerHTML='<div class="card">Indica el tamaño final de impresión.</div>';return;}
      out.innerHTML='<div class="card">Analizando…</div>';
      try{
        const r=await analyse(file,wcm,hcm),q=quality(r.dpi),isJpeg=r.type==='image/jpeg';
        const transp=isJpeg?'❌ JPEG no admite transparencia real':(r.transparent?`✅ Tiene transparencia (${r.alphaPct}% de píxeles con alfa)`:'⚠️ No se ha detectado transparencia');
        const needsW=Math.ceil((wcm/2.54)*300),needsH=Math.ceil((hcm/2.54)*300);
        out.innerHTML=`<div class="card"><h3>${q.icon} ${q.label}</h3><p>${esc(q.text)}</p><div style="display:grid;gap:8px">
          <div><b>Archivo:</b> ${esc(file.name)} · ${esc(r.type)} · ${r.sizeMB} MB</div>
          <div><b>Píxeles:</b> ${r.w} × ${r.h}</div><div><b>Tamaño solicitado:</b> ${wcm} × ${hcm} cm</div>
          <div><b>Resolución efectiva:</b> ~${r.dpi} ppp</div><div><b>Transparencia:</b> ${transp}</div>
          <div><b>Referencia para 300 ppp:</b> mínimo aprox. ${needsW} × ${needsH} px</div></div>
          <hr style="margin:16px 0;border:0;border-top:1px solid #e4e7ec"><p class="muted"><b>Importante:</b> este control no modifica ni regenera archivos finales del cliente. Solo comprueba si técnicamente parecen adecuados para DTF.</p></div>`;
      }catch(e){out.innerHTML='<div class="card">⚠️ No se pudo analizar esta imagen.</div>';}
    };
  }

  window.aihxoImageCheckView=view;
  const mo=new MutationObserver(injectNav);mo.observe(document.documentElement,{childList:true,subtree:true});injectNav();
})();