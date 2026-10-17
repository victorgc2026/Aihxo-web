# AIHXO: auditoría técnica y control de calidad

Esta rama no publica en GitHub Pages. El flujo de producción actual se activa únicamente mediante cambios en main.

## Comprobación inicial
- `.github/workflows/aihxo-quality.yml`: verifica sintaxis JavaScript de `gestion/`, `Web/` y la prueba existente `tests/ui-smoke.cjs`.
- Verifica la presencia de archivos fundamentales.
- Se ejecuta en ramas `audit/**`, `feature/**` y en solicitudes de incorporación a `main`.

## Limitaciones
- Una comprobación de sintaxis no demuestra que la aplicación funcione correctamente.
- La prueba de interfaz con Playwright requiere configurar un entorno de navegador y se incorporará tras revisar sus dependencias.
- No se ha ejecutado ninguna migración SQL ni verificado todavía las políticas RLS del proyecto Supabase.
- No modificar ni transformar artes originales aprobadas sin autorización expresa.

## Siguientes controles
1. Validación de referencias a módulos en `gestion/index.html`.
2. Pruebas de navegación y pedidos en móvil.
3. Pruebas de exportación DTF: dimensiones, transparencia y preservación del arte original.
4. Revisión de seguridad y RLS, solo lectura inicialmente.
5. Revisión de resultados de CI antes de considerar la integración.
