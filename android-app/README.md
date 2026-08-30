# AIHXO Gestión Android

Aplicación Android ligera que abre la herramienta online AIHXO Gestión dentro de una WebView segura.

## URL de Gestión
https://victorgc2026.github.io/Aihxo-web/gestion/

## Características
- Nombre de app: AIHXO Gestión
- Package: com.aihxo.gestion
- Android mínimo: 7.0 (API 24)
- JavaScript y almacenamiento web activados para Supabase
- Sesión/cookies persistentes del WebView
- Navegación interna dentro de AIHXO
- Enlaces externos abiertos con las aplicaciones del teléfono
- Botón Atrás navega dentro de Gestión antes de cerrar la app

## Compilar
Con Android Studio, abrir esta carpeta como proyecto y compilar `app`.

Para GitHub Actions, copie el workflow incluido en `.github/workflows/build-android-apk.yml` a la raíz del repositorio y mantenga el proyecto dentro de `android-app/`. El artefacto generado se llamará `AIHXO-Gestion.apk`.
