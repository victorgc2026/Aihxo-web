# Revisión de asignación automática — 17/10/2026

## Comprobación en producción (solo lectura)

**Pedido AIHXO-0018 CANCELADO** (estado general `Cancelado`, confirmado en la base de datos). Conserva un estado de producción antiguo `Pendiente llegada`, 12 unidades históricamente asociadas, `base_stock_allocated=false` y `order_lines=[]`. Referencia AIH-001004, negro 2XL; stock 0 y reservado 0 en el momento de la consulta. **No está pendiente de asignación y NO debe recibir prendas, reactivarse ni modificarse automáticamente.** No se ha ejecutado recepción ni modificado el pedido.

## Código SQL inspeccionado

La función `public.receive_stock_batch(jsonb,uuid)` valida cantidades enteras positivas, bloquea las filas de `base_stock_items` mediante `FOR UPDATE`, suma la recepción, registra un movimiento de entrada y procesa los pedidos a la espera. Para un pedido de una referencia, calcula las unidades necesarias, resta del stock recibido si alcanza y registra un movimiento de salida. Actualiza `base_stock_allocated`, la fecha de asignación y el estado de producción.

**Punto de atención:** en el recorrido de pedidos de una sola referencia, el SQL utiliza `jsonb_array_length(order_lines)=1` para actualizar el marcador de la línea. En registros históricos con `order_lines=[]`, la interfaz debe usar el indicador principal cuando corresponda. **AIHXO-0018 no es un caso válido para probar la asignación porque está cancelado.** Esta observación sobre el SQL requiere una prueba con pedidos ficticios activos.

**Concurrencia:** el bloqueo de la fila de stock reduce carreras entre recepciones que usen esta RPC, pero todavía no demuestra seguridad frente a escrituras directas desde otros flujos. Revisar todos los lugares de alta, asignación, cancelación y devolución antes de prometer atomicidad global.

**Condición obligatoria antes de asignar:** comprobar `orders.status` y excluir expresamente `Cancelado` y `Entregado` en todas las rutas de recepción y asignación. No deducir actividad de `production_status`.

**Siguiente prueba recomendada:** prueba transaccional aislada o entorno de desarrollo con pedido ficticio y recepciones parciales 5+7, repetición y concurrencia. No ejecutar contra pedidos reales.
