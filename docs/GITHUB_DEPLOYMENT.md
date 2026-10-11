# Despliegue desde GitHub

El workflow `Deploy Valle to Hostinger` publica frontend y backend al enviar
commits a `main`. Permite ejecucion manual desde Actions, solo para `main`.
No publica otras ramas ni cancela un despliegue en curso.

## Configuracion

Secrets: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
Variable opcional: `FTP_TLS_SERVERNAME` (por defecto `hstgr.io`, nombre del
certificado verificado en el despliegue inicial). No usar contrasenas de
administrador ni credenciales MySQL en el workflow.

Destino: https://darkseagreen-alligator-732127.hostingersite.com/

## Procedimiento

1. Ejecutar tests y build; revisar cambios y crear el commit autorizado.
2. Enviar `main` al repositorio cuando el usuario autorice el push.
3. Revisar Actions y comprobar el recorrido publicado.

El workflow ejecuta tests, lint PHP y build antes de abrir FTPS cifrado.
Comprueba esquema, administrador y lecciones necesarias en produccion.
Si falta preparacion, se detiene: no crea tablas, cuentas ni lecciones.
Las migraciones requieren aprobacion y respaldo separados; el procedimiento
manual de aprovisionamiento inicial no es el despliegue habitual.

Solo publica modelos rastreados en Git, assets del build y el allowlist de
backend en `scripts/deploymentPlan.mjs`. Conserva `dbconfig.php` y reglas de
seguridad del backend. No publica formatos auxiliares, SQL, logs ni scripts CLI.
No sincroniza bases de datos, perfiles, XP ni historial.

Descarga las versiones anteriores de los archivos activos, publica `index.html`
al final y comprueba frontend, contenido y restricciones de acceso. Ante fallo
intenta restaurar los archivos activos. Conserva assets anteriores y respaldo
de runtime en Actions durante siete dias, sin DB ni `dbconfig.php`.
Si la conexion impide restaurar, usar ese respaldo. Un corte forzado del runner
puede requerir restauracion manual. El reemplazo de varios archivos no es una
transaccion atomica ni garantiza cero interrupciones.
El rollback restaura codigo y configuracion de runtime, no versiones anteriores
de modelos/audio con la misma ruta. Para esos recursos, usar nuevos nombres al
reemplazarlos o preparar respaldo separado antes de publicar un cambio.

Este cambio no ejecuta un push ni un despliegue. La primera ejecucion real de
Actions debe verificarse luego de publicar el workflow y confirmar los Secrets.
No usar `npm run deploy`: sigue apuntando al script FTP legacy.
