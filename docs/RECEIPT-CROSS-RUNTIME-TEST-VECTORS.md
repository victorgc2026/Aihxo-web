# Vectores de compatibilidad — recepción AIHXO

Estos casos sirven para comparar el módulo JavaScript con la función PostgreSQL en **un proyecto de pruebas**. No ejecutan recepciones ni modifican inventario.

| Caso | JavaScript | PostgreSQL propuesto |
| --- | --- | --- |
| Dos líneas en orden inverso | Normaliza y ordena | Normaliza y ordena |
| UUID en mayúsculas | Pasa a minúsculas | UUID canónico |
| Código con espacios | Recorta espacios | `btrim` |
| Código numérico `123` | Rechaza | Rechaza |
| Cantidad texto `"2"` | Rechaza | Rechaza |
| Cantidad decimal `1.5` | Rechaza | Rechaza |
| Referencia repetida | Rechaza | Rechaza |
| Array vacío | Rechaza | Rechaza |
| Compra distinta | Cambia contenido | Cambia contenido |

**Pendiente de comprobar ejecutando SQL:** igualdad del JSON normalizado y del hash resultante, tratamiento de Unicode en códigos, límites numéricos y comportamiento con claves inesperadas. La coincidencia descrita aquí es **por inspección**, no un resultado de integración.

La huella final debe calcularse en el servidor a partir de datos canonizados; no se debe aceptar una huella suministrada por el cliente como prueba suficiente de identidad.
