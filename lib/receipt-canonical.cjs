/* AIHXO · Normalización determinista de solicitudes de recepción.
 * Preparación para la futura RPC idempotente; no realiza llamadas de red.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.AIHXOReceiptCanonical=api;
})(typeof window!=='undefined'?window:null,function(){
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function normalize(items,purchaseId=null){
    if(!Array.isArray(items)||items.length===0)throw new Error('La recepción está vacía');
    if(purchaseId!=null&&!uuid.test(String(purchaseId)))throw new Error('Compra no válida');
    const seen=new Set();
    const lines=items.map(row=>{
      if(!row||typeof row!=='object'||!uuid.test(String(row.item_id||'')))throw new Error('Referencia no válida');
      const item_id=String(row.item_id).toLowerCase();
      if(seen.has(item_id))throw new Error('La recepción contiene referencias duplicadas');
      seen.add(item_id);
      const qty=Number(row.qty);
      if(!Number.isSafeInteger(qty)||qty<=0||qty>2147483647)throw new Error('Cantidad no válida');
      const barcode=row.barcode==null?null:String(row.barcode).trim()||null;
      return {item_id,qty,barcode};
    }).sort((a,b)=>a.item_id.localeCompare(b.item_id));
    return {purchase_id:purchaseId==null?null:String(purchaseId).toLowerCase(),items:lines};
  }
  function serialize(items,purchaseId=null){
    return JSON.stringify(normalize(items,purchaseId));
  }
  return {normalize,serialize};
});
