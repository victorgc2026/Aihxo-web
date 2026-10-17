# Revisión de integración de recepción — 17/10/2026

## Función de producción inspeccionada (solo lectura)
`public.receive_stock_batch(p_items jsonb,p_purchase_id uuid)` recibe unidades, registra movimientos, actualiza compras y asigna prendas a pedidos pendientes en una sola transacción PostgreSQL. Ya excluye pedidos cancelados y entregados de la asignación automática.

## Riesgos concretos a corregir en la nueva RPC
1. **Doble entrada:** la función actual no tiene `request_id`; un reintento después de perder la respuesta puede sumar dos veces.
2. **Duplicados dentro del lote:** actualmente recorre cada elemento de `p_items` sin rechazo explícito de `item_id` repetido.
3. **Desbordamiento:** la suma `v_prev + v_qty` utiliza enteros; debe validarse rango antes de escribir, incluyendo cantidad previa.
4. **Permisos:** la función actual verifica sesión, pero la nueva función debe exigir pertenencia al equipo de AIHXO explícitamente, además de RLS.
5. **Pedidos:** conservar el orden de asignación, los estados y la exclusión de `Cancelado`/`Entregado`, incluidos pedidos multilínea.
6. **Auditoría:** mantener `base_stock_movements`, `purchase_lines`, `purchases` e `inventory_cycle_lines` en la misma transacción.
7. **Compatibilidad:** no eliminar ni sustituir `receive_stock_batch` hasta migrar y comprobar todos los clientes que la llaman.

## Estrategia segura
- Crear `receive_stock_batch_idempotent` como nueva RPC; **no** modificar directamente la antigua.
- Normalizar y validar la carga en servidor.
- Insertar y bloquear la solicitud única, comparar identidad/carga y devolver el resultado almacenado en caso de repetición.
- Ejecutar el cuerpo íntegro de recepción **en la misma transacción** que el registro único, conservando la semántica actual.
- Probar con datos ficticios, incluyendo compras y pedidos cancelados, antes de autorizar despliegue.
- Mantener `receive_stock_batch` mientras existan versiones de la aplicación que dependan de ella.

**No se ha desplegado ninguna migración.**
