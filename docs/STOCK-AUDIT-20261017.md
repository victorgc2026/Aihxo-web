# AIHXO — auditoría de stock base (17/10/2026)

Comprobaciones de solo lectura contra el proyecto Supabase de producción. No se alteraron existencias, reservas ni movimientos.

| Indicador | Resultado |
| --- | ---: |
| Referencias de `base_stock_items` | 74 |
| Cantidades negativas | 0 |
| Reservas negativas | 0 |
| Reservas superiores a existencias | 0 |
| SKU internos vacíos | 0 |
| Grupos duplicados por proveedor/modelo/color/talla normalizados | 0 |
| Códigos de barras duplicados (no vacíos) | 0 |
| SKU internos duplicados (no vacíos) | 0 |

**Alcance:** estos controles identifican anomalías en los datos actuales, pero no prueban que las futuras operaciones sean atómicas ni que las reservas se descuenten correctamente bajo concurrencia. La siguiente etapa debe revisar funciones SQL, restricciones e integración con pedidos antes de modificar movimientos de inventario.

**Seguridad:** las consultas fueron agregadas y no extrajeron datos identificativos de clientes ni contenidos de pedidos.
