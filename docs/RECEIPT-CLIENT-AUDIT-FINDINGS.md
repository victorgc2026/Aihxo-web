# Revisión de los dos puntos de entrada reales de recepción

**Rama aislada; sin cambios en producción.** Archivos inspeccionados: `gestion/recepcion-etiquetas-v2.js` y `gestion/compras-recepcion-manual.js`.

## Riesgos concretos encontrados

1. **Escáner:** `confirmBatch()` invoca `receive_stock_batch` sin un identificador persistente de operación. Si el servidor registra la entrada y la red falla antes de la respuesta, el usuario no puede reintentar automáticamente con garantía de idempotencia. El aviso actual de incertidumbre es apropiado y debe mantenerse hasta integrar una RPC versionada.
2. **Recepción manual:** `recepcionarCompraCompleta()` también invoca `receive_stock_batch` sin identificador estable. El bloqueo `receivingPurchases` solo protege la pestaña actual, no dos teléfonos o sesiones.
3. **Estado de compra fuera de la transacción:** tras la RPC, el cliente ejecuta por separado `purchases.update({status:'Recibido'})`. Si esta petición falla, el stock puede haberse registrado pero la interfaz queda inconsistente. El estado final debe calcularse y guardarse dentro de la transacción de recepción del servidor; el cliente solo debe consultar el resultado.
4. **Otro cambio de estado directo:** si no quedan líneas pendientes, el cliente escribe `status:'Recibido'` sin una operación transaccional de recepción. Revisar esta ruta antes de eliminarla; podría estar reparando datos heredados.
5. **Datos del escáner:** `add()` convierte a número y fuerza mínimo 1, pero no exige entero finito. Un valor fraccionario puede incorporarse al lote y fallar más tarde. La validación definitiva debe hacerse en servidor; conviene anticiparla en interfaz.
6. **Compra con varias líneas del mismo artículo:** `pending` se construye desde líneas de compra y podría incluir el mismo `item_id` más de una vez; el contrato canónico de ensayo rechaza duplicados. Definir agrupación segura o identificación explícita por `purchase_line_id`, conservando cantidades y trazabilidad.

## Orden propuesto de implementación

1. Crear una RPC **versionada** que incorpore `p_request_id`, sin sustituir de golpe la RPC actual.
2. Implementar en ella, de forma atómica, recepción, compras, movimientos y asignaciones a pedidos con la semántica de producción.
3. Probar RLS, concurrencia, cancelaciones, líneas duplicadas, errores y reintentos en un entorno clonado.
4. Actualizar ambos clientes para generar una sola clave por confirmación, conservarla ante respuesta incierta y consultar/reintentar la misma operación.
5. Eliminar las escrituras separadas del estado de compra **solo cuando** la nueva RPC gestione esos estados y esté probada.
6. Preparar migración reversible, despliegue gradual y verificación de existencias.

**Importante:** este documento identifica riesgos, no los corrige todavía en el código productivo. No desplegar los prototipos `receipt_test`.
