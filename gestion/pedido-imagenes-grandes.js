/* AIHXO · Permite sustituir imágenes de pedidos de hasta 20 MB */
(function(){
 const MAX=20*1024*1024;
 const tipos=['image/png','image/jpeg','image/webp'];

 async function manejar(e){
  const input=e.target;
  if(!(input instanceof HTMLInputElement)||input.type!=='file') return;
  const m=(input.id||'').match(/^cambiar(Front|Back)-(.+)$/);
  if(!m) return;
  const file=input.files?.[0];
  if(!file || file.size<=6*1024*1024) return; // deja actuar al manejador original

  e.preventDefault();
  e.stopImmediatePropagation();

  if(!tipos.includes(file.type)){
   toast('Formato no válido');
   input.value='';
   return;
  }
  if(file.size>MAX){
   toast('La imagen supera los 20 MB');
   input.value='';
   return;
  }

  const side=m[1]==='Front'?'front':'back';
  const orderId=m[2];
  const field=side==='front'?'design_front_path':'design_back_path';
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path=`${orderId}/${side}-${Date.now()}.${ext}`;

  try{
   toast('Subiendo imagen…');
   const {data:pedido,error:readError}=await supabaseClient
    .from('orders').select(`id,${field}`).eq('id',orderId).single();
   if(readError) throw readError;

   const {error:uploadError}=await supabaseClient.storage
    .from('order-designs').upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError) throw uploadError;

   const {error:updateError}=await supabaseClient
    .from('orders').update({[field]:path}).eq('id',orderId);
   if(updateError){
    await supabaseClient.storage.from('order-designs').remove([path]);
    throw updateError;
   }

   const anterior=pedido?.[field];
   if(anterior) await supabaseClient.storage.from('order-designs').remove([anterior]);

   if(typeof loadAll==='function') await loadAll();
   toast(side==='front'?'Imagen delantera actualizada':'Imagen trasera actualizada');
   if(typeof window.verDetallePedido==='function') window.verDetallePedido(orderId);
  }catch(err){
   console.error('Error subiendo imagen grande de pedido',err);
   toast('No se pudo subir la imagen');
  }finally{
   input.value='';
  }
 }

 document.addEventListener('change',manejar,true);
})();
