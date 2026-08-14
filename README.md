# AIHXO Gestión — Supabase v2 corregida

Aplicación web responsive de gestión AIHXO conectada a Supabase.

## Corrección incluida
La versión anterior referenciaba `styles.css` y `manifest.json`, pero esos archivos no estaban incluidos en el ZIP. Por eso GitHub Pages mostraba la aplicación con los estilos por defecto del navegador.

Esta versión incluye:
- `styles.css` responsive completo.
- `manifest.json`.
- Cache-busting `styles.css?v=2`.
- `app.js` y `index.html` originales.
- Conexión Supabase configurada en `app.js`.

## Publicar en GitHub Pages
Sube el contenido de `AIHXO_App_v1` al repositorio y activa GitHub Pages desde la rama principal.

Si GitHub ya tenía una versión anterior, haz un refresco forzado del navegador después de publicar:
- iPhone/Safari: cerrar y volver a abrir la página o borrar los datos del sitio si persiste la versión antigua.


## Acceso de administrador
El único correo autorizado por la aplicación y por las políticas RLS de Supabase es:

`aihxo.camisetas@gmail.com`

La primera vez, usa **Crear acceso de administrador** con ese correo y la contraseña que elijas. Si Supabase solicita confirmación por email, confirma el mensaje recibido y después entra con la misma contraseña.

Las cuentas con otros correos pueden autenticarse en Supabase, pero no tendrán acceso a los datos de AIHXO y la aplicación las expulsará automáticamente.


## v4 — Gestión de productos
- Lista los productos directamente desde `public.products`.
- Búsqueda por SKU, modelo, talla y color.
- Filtros de categoría y stock.
- Cálculo de coste total y margen.
- Alta y edición de productos desde la interfaz.
- Cambios guardados en Supabase.
