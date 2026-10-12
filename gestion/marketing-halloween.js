/* AIHXO Halloween 2026 — asistente de campaña en borrador; nunca autopublica */
(function(){
  const M=window.AIHXOMarketing;
  if(!M)return;
  const E=M.E;
  const CAPTION='🎃 HALLOWEEN BY AIHXO\nCamiseta + tote bag personalizada por 23,95 € el pack. Para peques y adultos. Elige diseño, talla y color y escríbenos para reservar. Edición limitada hasta el 31 de octubre.\n#AIHXO #Halloween2026 #TrucoOTrato #Oleiros #ACoruña';
  function openWizard(){
    const html=`<h2>🎃 Pack Halloween · 23,95 €</h2>
      <p class="muted">Se guarda como borrador en Marketing, junto con tres contenidos listos para revisar. No publica en la web ni en redes.</p>
      <form id="aihxoHalloweenForm" class="form">
      <div class="field"><label>Nombre</label><input value="Pack Halloween · Camiseta + Tote Bag" readonly></div>
      <div class="formgrid"><div class="field"><label>Precio único</label><input value="23,95 €" readonly></div><div class="field"><label>Fin</label><input value="2026-10-31" readonly></div></div>
      <div class="field"><label>WhatsApp de pedidos</label><input name="phone" type="tel" inputmode="tel" pattern="[+0-9 ]{9,17}" value="34634344174" required><small>Número oficial de AIHXO, confirmado a partir de la web.</small></div>
      <div class="field"><label>Texto para redes</label><textarea name="caption" rows="6">${E(CAPTION)}</textarea></div>
      <button class="primary" type="submit" style="width:100%">Crear borrador y 3 publicaciones</button></form>`;
    const box=M.openDrawer(html);if(!box)return;
    box.querySelector('#aihxoHalloweenForm').addEventListener('submit',async ev=>{
      ev.preventDefault();
      const b=ev.submitter; if(b)b.disabled=true;
      const form=new FormData(ev.currentTarget);
      const phone=String(form.get('phone')||'').replace(/[^0-9]/g,'');
      if(!/^(34)?[6789][0-9]{8}$/.test(phone)){toast('Comprueba el número de WhatsApp español');if(b)b.disabled=false;return}
      const number=phone.startsWith('34')?phone:'34'+phone;
      const msg='Hola, quiero pedir el Pack Halloween de AIHXO por 23,95 €. Mi talla es: __. Color de camiseta: __. Tote bag: __. Diseño: __.';
      const link='https://wa.me/'+number+'?text='+encodeURIComponent(msg);
      const caption=String(form.get('caption')||'').trim();
      try{
        const existing=M.state.campaigns.find(x=>x.name==='Pack Halloween · Camiseta + Tote Bag' && x.start_date==='2026-10-12');
        let id=existing?.id;
        const campaign={name:'Pack Halloween · Camiseta + Tote Bag',objective:'ventas',status:'borrador',audience:'Infantil y adulto',channels:['Web','Instagram','Facebook','TikTok','WhatsApp'],start_date:'2026-10-12',end_date:'2026-10-31',budget:0,actual_spend:0,revenue_target:0,notes:'Pack camiseta + tote bag: 23,95 € precio único. CTA WhatsApp: '+link+' | Instagram: https://www.instagram.com/aihxo.camisetas/ | NO PUBLICADO. Confirmar disponibilidad, fotos y coste/margen antes de activar.',updated_at:new Date().toISOString()};
        const result=existing?await supabaseClient.from('marketing_campaigns').update(campaign).eq('id',id).select('id').single():await supabaseClient.from('marketing_campaigns').insert(campaign).select('id').single();
        if(result.error)throw result.error;
        id=result.data.id;
        const posts=['Instagram','Facebook','TikTok'].map(channel=>({
          campaign_id:id,title:'Halloween 2026 · Pack camiseta + tote · '+channel,
          channel,content_type:channel==='TikTok'?'video':'post',status:'preparar',
          hook:'Camiseta + tote bag por 23,95 €',
          caption:caption+'\n\nPide tu pack: '+link,
          cta:link,hashtags:'#AIHXO #Halloween2026 #TrucoOTrato',
          scheduled_at:null,updated_at:new Date().toISOString()
        }));
        const existingContent=M.state.content.filter(x=>x.campaign_id===id&&x.title?.startsWith('Halloween 2026 · Pack camiseta + tote'));
        const missing=posts.filter(x=>!existingContent.some(y=>y.channel===x.channel));
        if(missing.length){const saved=await supabaseClient.from('marketing_content').insert(missing);if(saved.error)throw saved.error}
        toast('Campaña y publicaciones guardadas como borrador');
        await M.refresh('campaigns');
      }catch(err){console.error(err);toast('Error guardando: '+(err.message||err));if(b)b.disabled=false}
    });
  }
  window.aihxoHalloweenCampaign=openWizard;
  const old=M.tabs.campaigns;
  M.tabs.campaigns=function(root){
    old(root);
    const heading=root.querySelector('.section');
    if(heading&&!root.querySelector('#halloweenCampaignBtn')){
      const b=document.createElement('button');b.type='button';b.className='secondary';b.id='halloweenCampaignBtn';b.textContent='🎃 Preparar pack Halloween 23,95 €';
      b.onclick=openWizard;heading.appendChild(b);
    }
  };
})();