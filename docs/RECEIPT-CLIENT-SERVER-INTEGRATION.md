# Integración pendiente: contrato de cliente y servidor

## Decisión de arquitectura
La normalización en `lib/receipt-canonical.cjs` es un componente preparatorio, **no una garantía de idempotencia**. El servidor no debe confiar en una huella enviada por el cliente: debe calcularla de nuevo a partir de `p_items` y `p_purchase_id` usando reglas equivalentes.

### Reglas a verificar
- Ordenar líneas por UUID de referencia en orden binario/código, no por una comparación regional dependiente del dispositivo.
- Aceptar únicamente cantidades enteras en rango `1..2147483647`; rechazar cadenas, decimales, ceros y valores nulos.
- Normalizar UUID a minúsculas y códigos de barras recortando espacios laterales; conservar los ceros iniciales de los códigos.
- Rechazar referencias repetidas, incluso con códigos de barras distintos.
- Incorporar el identificador de compra al contenido firmado.
- Para el mismo `request_id`, comparar el contenido canonizado en servidor y devolver resultado anterior solo si coincide.

## Secuencia de despliegue
1. Implementar y probar normalización equivalente en PostgreSQL, con vectores compartidos de prueba.
2. Integrar registro de solicitudes y recepción real en una **sola** función/transacción. El prototipo `claim_stock_receipt_request` no es suficiente.
3. Validar RLS y permisos administrativos, además de los casos de simultaneidad y repetición.
4. Cambiar formularios de recepción a la nueva RPC únicamente tras aprobar las pruebas de integración.
5. Deshabilitar progresivamente la ruta antigua cuando no queden clientes utilizándola.

**Producción:** sin cambios; esta documentación no autoriza una migración.
