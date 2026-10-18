# Contrato de recepción idempotente — propuesta de implementación

**Estado:** diseño, no desplegado. La RPC vigente `receive_stock_batch` sigue operativa sin cambios.

## Interfaz de la futura RPC
`receive_stock_batch_idempotent(p_request_id uuid, p_items jsonb, p_purchase_id uuid DEFAULT NULL)` devuelve `{ok, lines, orders_allocated, inventory_cycle_id, receipt_id, replayed}`.

### Reglas transaccionales
1. Exigir usuario autenticado **y** pertenencia a los dos correos administradores autorizados. No conceder EXECUTE a `anon` ni `PUBLIC`.
2. Validar array no vacío, UUID válidos, unidades enteras positivas y límite de `int4`; agrupar o rechazar `item_id` duplicados.
3. Canonizar `p_items` (orden estable, normalizar códigos) y calcular una huella; incluir `p_purchase_id`.
4. Insertar fila de petición con `request_id` único y bloquearla `FOR UPDATE`. Una segunda petición con la misma clave debe esperar el primer commit y devolver el resultado guardado, nunca repetir movimientos.
5. Si la misma clave trae contenido diferente, devolver error de conflicto.
6. Ejecutar **en la misma transacción** la lógica actual de compra, stock, movimientos, pedidos y ciclo de inventario. Registrar resultado en la fila de petición antes de finalizar.
7. Cualquier error revierte registro de petición y movimientos conjuntamente. No usar transacciones separadas, ni una Edge Function que registre el resultado después de ejecutar la RPC antigua.
8. Conservar exclusión de `Cancelado` y `Entregado`, orden de espera, bloqueo de stock y reglas de compra de la función original.

## Contrato del navegador
- Generar `crypto.randomUUID()` **una sola vez por recepción** antes del primer envío.
- Conservar clave y contenido de la operación mientras su resultado sea incierto. En reintentos, reutilizar exactamente la misma clave y contenido.
- Si el usuario cambia unidades, compra o referencias, debe iniciar **una operación nueva**, nunca reutilizar la clave anterior con otro contenido.
- Tras respuesta confirmada, limpiar operación pendiente y actualizar existencias desde servidor; no sumar al stock local como sustituto de la recarga.
- Mostrar “comprobación pendiente” si se pierde la respuesta. Un reintento con la misma clave será seguro **solo después** de activar la nueva RPC.
- El guardado persistente en el dispositivo exige valorar privacidad, caducidad y aislamiento por usuario; no implementarlo hasta definir esas reglas.

## Pruebas de aceptación
- 2 envíos simultáneos misma clave → un único movimiento de entrada.
- Reenvío después de respuesta perdida → mismo resultado, `replayed=true`, cero movimientos adicionales.
- Misma clave, contenido distinto → conflicto sin cambios.
- Distintas claves, misma compra ya completada → segunda operación rechazada por cantidades pendientes.
- Dos claves sin compra con igual contenido → son dos recepciones diferentes; la idempotencia **no deduce** duplicados semánticos.
- Error durante asignación → rollback completo.
- Pedido cancelado o entregado → nunca asignado.
- Acceso anónimo o usuario no administrador → denegado.

## Dependencia de despliegue
No cambiar el formulario a la nueva RPC hasta haber desplegado y probado la migración completa. Planificar transición con compatibilidad de la RPC antigua y cierre controlado del acceso antiguo cuando todos los clientes estén actualizados.
