# Revisión de recepción y referencias — 10/10/2026

## Fallo comprobado
La función activa `public.receive_stock_batch(jsonb,uuid)` permite asignar stock a pedidos individuales con `status='Entregado'` porque excluye únicamente `Cancelado`.

## Corrección propuesta
En el bucle de pedidos individuales de la función, sustituir el filtro
`and lower(coalesce(status,'')) <> 'cancelado'`
por
`and lower(btrim(coalesce(status,''))) not in ('cancelado','entregado')`.

La rama de pedidos con varias variantes ya excluye `cancelado` y `entregado`.

## Antes de desplegar
1. Exportar definición SQL activa y realizar backup.
2. Comparar con `database/gestion-improvements.sql` y descartar versiones SQL antiguas.
3. Aplicar una migración que modifique solo el filtro.
4. Probar recepción de pedidos nuevos, cancelados, entregados y con varias líneas.
5. Verificar que los movimientos de entrada/salida cuadren y que no aparezcan reservas dobles.
6. Revisar el pedido AIHXO-0024 sin generar entradas ficticias.

## Referencias
No se hallaron duplicados exactos por modelo, color y talla tras normalización simple. Investigar equivalencias como `BLACK-200`/Negro y `WHITE-100`/Blanco antes de fusionar; preservar fabricante, talla, público y modelo exacto.
