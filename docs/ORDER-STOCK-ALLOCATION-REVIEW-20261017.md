# Revisión de asignación automática — 17/10/2026

## Comprobación en producción (solo lectura)

Pedido AIHXO-0018: una única referencia base, 12 unidades requeridas, `base_stock_allocated=false`, `production_status='Pendiente llegada'`, `order_lines=[]`. Referencia interna AIH-001004, color negro, talla 2XL; stock actual 0 y reservado 0. **No se ha ejecutado recepción ni modificado el pedido.**

## Código SQL inspeccionado

La función `public.receive_stock_batch(jsonb,uuid)` valida cantidades enteras positivas, bloquea las filas de `base_stock_items` mediante `FOR UPDATE`, suma la recepción, registra un movimiento de entrada y procesa los pedidos a la espera. Para un pedido de una referencia, calcula las unidades necesarias, resta del stock recibido si alcanza y registra un movimiento de salida. Actualiza `base_stock_allocated`, la fecha de asignación y el estado de producción.

**Punto de atención:** en el recorrido de pedidos de una sola referencia, el SQL utiliza `jsonb_array_length(order_lines)=1` para actualizar el marcador de la línea. Para este pedido `order_lines=[]`; el indicador principal `base_stock_allocated` sí se actualiza, pero la lista vacía permanece vacía. Conviene confirmar que la interfaz utiliza el indicador principal y no exige una línea marcada.

**Concurrencia:** el bloqueo de la fila de stock reduce carreras entre recepciones que usen esta RPC, pero todavía no demuestra seguridad frente a escrituras directas desde otros flujos. Revisar todos los lugares de alta, asignación, cancelación y devolución antes de prometer atomicidad global.

**Siguiente prueba recomendada:** prueba transaccional aislada o entorno de desarrollo con pedido ficticio y recepciones parciales 5+7, repetición y concurrencia. No ejecutar contra pedidos reales.
