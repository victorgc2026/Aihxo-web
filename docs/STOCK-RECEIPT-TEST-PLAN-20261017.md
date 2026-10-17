# Plan de pruebas de recepción de prendas (entorno aislado)

**No ejecutar contra la base de producción.** El objetivo es probar la RPC real con datos sintéticos en un proyecto Supabase separado, dentro de transacciones reversibles cuando corresponda.

| Caso | Entrada | Resultado esperado |
| --- | --- | --- |
| Vacía | `[]` | Error de validación |
| Cantidad negativa o cero | `qty=0/-1` | Error; sin movimientos |
| Cantidad decimal | `qty=1.5` | Error; sin movimientos |
| Cantidad fuera de rango | `qty=2147483648` | Error controlado |
| Referencia duplicada | Mismo `item_id` dos veces | Error; sin movimientos |
| Referencia inexistente | UUID válido no presente | Error; sin movimientos |
| Pedido cancelado | Espera histórica y stock entrante | Ninguna asignación al pedido |
| Pedido entregado | Espera histórica y stock entrante | Ninguna asignación al pedido |
| Pedido activo, recepción 5+7 | Necesita 12 | Espera tras 5; asignación tras 7 si la disponibilidad lo permite |
| Multivariante | Dos tallas pendientes | Asignar líneas disponibles; completar solo con todas |
| Petición repetida sin compra | Mismo lote enviado dos veces | **Riesgo actual**: posible doble contabilización; requiere idempotencia |
| Compra ya recibida | Repetición con `p_purchase_id` | No superar pendiente de compra |
| Concurrencia | Dos recepciones simultáneas | Sin cantidades negativas ni asignación doble |

## Propuesta preparada

`database/proposals/20261017-receive-stock-validation-fragment.sql` es **solo un fragmento de revisión**, no una migración ejecutable. Añade rechazo de listas vacías, referencias repetidas y cantidades inválidas. **No soluciona la idempotencia**: antes de implantarla hay que decidir una clave única de recepción y comprobar cómo se generan los identificadores de petición en Gestión.

## Reglas de despliegue

1. Copiar el esquema y datos sintéticos mínimos a un entorno de pruebas.
2. Ejecutar los casos con la función vigente y documentar fallos.
3. Integrar validaciones en una migración completa, sin perder la lógica de asignación actual.
4. Añadir idempotencia de extremo a extremo (cliente, RPC y registro de recepción).
5. Validar todos los casos y pedir autorización antes de aplicar a producción.
