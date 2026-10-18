// AIHXO · Identificador de operación estable ante reintentos.
// Módulo de propuesta: no está conectado a Gestión en producción.
'use strict';
function createReceiptRequest({requestId, items, purchaseId = null}) {
  if (typeof requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    throw new Error('Se necesita un identificador UUID estable para esta recepción');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('La recepción debe contener al menos una línea');
  }
  return Object.freeze({
    p_request_id: requestId.toLowerCase(),
    p_items: items.map(item => ({...item})),
    p_purchase_id: purchaseId
  });
}
module.exports = {createReceiptRequest};
