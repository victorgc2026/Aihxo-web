# AIHXO Gestión — listo para Aihxo-web

Estos archivos están preparados para subir **directamente a la raíz** del repositorio `Aihxo-web`.

## Subida
1. GitHub → `Aihxo-web` → **Add file → Upload files**
2. Selecciona **todos los archivos de esta carpeta**, incluido `.nojekyll`.
3. Pulsa **Commit changes**.
4. Ve a **Settings → Pages**.
5. Source: **Deploy from a branch**
6. Branch: **main**
7. Folder: **/(root)**
8. Guarda y espera a que termine el despliegue.

La app usa Supabase para la base de datos. No subas nunca una `service_role` key al repositorio; la aplicación web debe utilizar únicamente la clave publicable/anon.
