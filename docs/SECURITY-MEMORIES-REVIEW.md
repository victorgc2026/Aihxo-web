# AIHXO Memories — revisión previa a aplicar RLS

Estado: **propuesta sin ejecutar**. No se han modificado datos ni políticas de producción.

## Evidencia de solo lectura (17-10-2026)

- `public.memories` y `public.memory_files`: RLS habilitado, pero las cuatro políticas de cada tabla admiten cualquier sesión `authenticated` con expresiones `true`.
- `storage.objects`: las cuatro políticas `memory_storage_authenticated_*` limitan por `bucket_id = 'memory-files'`, pero no por identidad del usuario.
- El bucket `memory-files` es privado.
- `gestion/memories.js` consulta `memories` directamente desde el cliente Supabase.
- `gestion/memories-detail.js` consulta `memory_files`, sube a `memory-files` y genera URLs firmadas de 300 segundos. Las rutas se organizan por identificador de Memory, no por usuario.
- La migración propuesta en `database/proposals/20261017-harden-memories-rls.sql` restringe acceso a las mismas dos identidades de equipo que utilizan las políticas de pedidos y stock.

## Riesgos de compatibilidad

1. Confirmar que todos los usuarios legítimos que necesitan gestionar Memories están incluidos en la lista de autorizados.
2. Comprobar si existen accesos públicos a Memories por medio de funciones o servicios, en lugar de la interfaz de Gestión.
3. No cambiar el patrón de rutas del bucket: los archivos existentes se mantienen intactos.
4. Antes de aplicar la migración, conservar un registro de las políticas existentes para poder revertir.
5. Probar lectura, subida, generación de URL firmada, modificación y eliminación con una cuenta del equipo; probar denegación con una cuenta autenticada ajena al equipo y con sesión anónima.
6. Si falla alguna prueba, restaurar las políticas anteriores inmediatamente.

## Política de diseños originales

No borrar, sustituir, transformar, redibujar ni recolorear artes aprobadas. El endurecimiento propuesto cambia únicamente autorizaciones de acceso.

## Criterio para aprobar despliegue

- Confirmación de usuarios autorizados.
- Pruebas de permisos y funcionalidad superadas en entorno controlado.
- Copia verificable de políticas anteriores y procedimiento de reversión.
- Autorización expresa para aplicar cambios a Supabase de producción.
