# AIHXO · Puerta de integración de recepciones seguras

**Estado:** revisión técnica; no desplegado. Rama `audit/quality-foundation-20261017`.

## Situación real

- La función actual `public.receive_stock_batch(p_items jsonb,p_purchase_id uuid)` recibe existencias, registra movimientos y asigna automáticamente unidades a pedidos pendientes.
- Las pruebas `receipt_test` usan tablas temporales de ensayo, no reproducen todavía toda la función real.
- El cliente de Gestión puede sufrir respuestas ambiguas por cortes de red: la operación podría haber terminado en el servidor sin que el teléfono reciba confirmación.
- El contrato propuesto añade `request_id` estable, registro de resultados y repetición segura. **No está instalado en producción**.

## Condiciones obligatorias antes de desplegar

1. **Conservar comportamiento actual.** Copiar y revisar el cuerpo completo de `receive_stock_batch`; no reemplazar la asignación real de pedidos por la simulación de una sola referencia.
2. **Un solo commit transaccional.** Registrar la clave de solicitud, entradas, movimientos, líneas de compra, reservas/asignaciones, estados de pedidos y resultado dentro de la misma transacción PostgreSQL.
3. **Bloqueos y orden.** Serializar recepciones de una misma compra y bloquear existencias en orden estable para evitar carreras y reducir deadlocks. Rechazar cantidades superiores a las pendientes.
4. **Reintentos.** Misma `request_id` + mismo contenido canónico => devolver el resultado original sin modificar nada; misma clave + contenido diferente => conflicto explícito.
5. **Seguridad.** Auditar permisos EXECUTE, `auth.uid()`, RLS y contexto de ejecución de cada tabla. No usar `SECURITY DEFINER` sin revisión de privilegios y `search_path`.
6. **Pedidos.** No asignar a cancelados/entregados; completar pedidos con varias líneas solo cuando todas estén satisfechas; evitar doble movimiento o reserva.
7. **Compras.** Validar pertenencia de cada prenda a la compra, cantidad pendiente y transición `Pendiente` → `Parcial` → `Recibido`; conservar la lógica real de compras existentes.
8. **Cliente.** Generar `request_id` una vez al confirmar, persistirlo mientras el resultado sea incierto y reutilizarlo en el reintento; nunca generar un nuevo ID automáticamente tras un timeout.
9. **Compatibilidad.** Introducir una función versionada o un adaptador probado; mantener los consumidores existentes hasta migrar todos los puntos de recepción (escáner, manual y compras).
10. **Pruebas y reversión.** Ensayar en clon de esquema/datos anonimizados, ejecutar pruebas de concurrencia, rollback, RLS y pedidos reales de varias líneas; documentar copia de seguridad y plan de reversión antes de producción.

## Criterios de aceptación

- Una recepción repetida no suma dos veces stock, movimientos ni asignaciones.
- Dos recepciones diferentes no superan el pendiente de compra.
- Un fallo en la última línea revierte todo el lote.
- Una compra con varias referencias solo queda `Recibido` cuando todas se completan.
- Los pedidos cancelados/entregados quedan intactos.
- Un pedido multilínea espera a que estén todas sus prendas.
- El resultado incierto en móvil puede consultarse/reintentarse con la misma clave.
- El acceso sin sesión o fuera del equipo no puede registrar ni consultar recepciones ajenas.

## Pendientes que impiden declarar lista la integración

- Implementar la RPC real y contrastarla línea por línea con la existente.
- Integrar la clave estable en los formularios reales de Gestión.
- Ejecutar pruebas contra un esquema fiel de producción y revisar permisos/RLS.
- Obtener autorización explícita para cualquier migración de base de datos productiva.

**Decisión actual:** mantener las pruebas y los documentos en la rama aislada. No fusionar ni desplegar automáticamente.
