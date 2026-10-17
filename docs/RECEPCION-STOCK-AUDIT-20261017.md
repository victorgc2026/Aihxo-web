# Auditoría de recepción y asignación automática — 17/10/2026

**Método:** lectura de la definición vigente de `public.receive_stock_batch(jsonb,uuid)` en Supabase. No se ejecutó la función ni se modificaron datos.

## Verificaciones positivas
- Requiere sesión autenticada (`auth.uid()`).
- Bloquea filas de stock y de pedidos con `FOR UPDATE`.
- La ruta de pedido con una referencia excluye expresamente `status` cancelado y entregado.
- La ruta multivariante también excluye cancelado y entregado.
- Registra movimientos de entrada y salidas por asignación.

## Riesgos por resolver antes de cambiar producción
1. **Líneas duplicadas en una recepción:** el bucle procesa cada elemento de `p_items` independientemente. Si una misma referencia aparece dos veces con la misma compra, cada elemento compara su cantidad contra el pendiente actualizado. Aunque la transacción es atómica, la API debería rechazar explícitamente referencias duplicadas y devolver un error claro; esto reduce sorpresas y evita recepciones duplicadas accidentales.
2. **Repetición de la misma petición:** no hay clave de idempotencia de recepción. Una petición repetida sin `p_purchase_id` puede contabilizar dos veces una entrega. Con compra, el límite de cantidades pendientes mitiga parte del riesgo, pero no sustituye una clave idempotente.
3. **Validación de unidades:** se valida cantidad positiva y entera, pero conviene validar explícitamente máximo `integer` y el resultado de sumar al stock para emitir errores de dominio, no errores de conversión o desbordamiento.
4. **Asignación multivariante:** revisar escenarios de múltiples líneas de la misma referencia, recepción parcial, simultaneidad con cancelaciones y pedidos con líneas incompletas. No hay prueba transaccional automatizada de estos casos.
5. **Permisos de ejecución:** comprobar que solo los roles autorizados puedan invocar la RPC y que la RLS de las tablas afectadas protege todos los accesos.

## Regla de negocio confirmada
AIHXO-0018 está **Cancelado** y queda excluido por ambas condiciones SQL. Nunca usarlo para una prueba de recepción ni modificarlo.

## Plan seguro
- Crear pruebas con pedidos y referencias **ficticios** en una base de pruebas aislada.
- Probar recepción 5+7, duplicación de solicitud, repetición, cancelación previa y concurrente, y multivariantes.
- Preparar una migración SQL revisable para validaciones e idempotencia; **no aplicarla a producción sin autorización**.
