# Content Platform 1

La auditoria aprobada fue respaldada en `102448a - Approved local asset catalog audit and runtime packs` (121 archivos). La ampliacion actual implementa una plataforma administrativa separada, en `/valle-admin`, sin push ni commit final. DEV Tools no constituye autenticacion. La auditoria original de packs continua en `ASSET_CATALOG_AUDIT.md`.

## Estado de validacion

- 172 tests Node aprobados (163 anteriores + 9 nuevos).
- 32 comprobaciones de contratos PHP aprobadas desde los tests Node.
- 14 pruebas HTTP reales: rechazo de accesos sin ADMIN, rechazo de CSRF ausente, cookies HttpOnly/SameSite=Strict, lectura publica de contenido y 40 lecciones activas.
- 5 pruebas del repositorio MySQL: creacion/lectura/edicion, conflicto de revision, nota invalida y rechazo de desactivar una leccion asignada. Usaron una fila inactiva temporal, retirada al finalizar. Las 40 filas originales y el documento de contenido quedaron exactamente iguales; AUTO_INCREMENT puede haber avanzado.
- Build pasa con advertencias de bundle, import mixto del cache de assets y atributos de import JSON.
- Entrada real de QA: perfiles -> SOPHIA -> Continuar -> Plaza. Mundo no vacio, sin errores de consola, 9600 XP sin cambios, herramientas DEV ausentes en modo normal.
- PENDIENTE: recorridos visuales del Admin, edicion de una leccion real -> PianoMagico -> reversion, asignacion de cofre -> badge -> misma leccion -> reversion, movimiento de prop -> juego -> reversion, movil y video funcional. No declarar cerrada la fase hasta cumplirlos.
- Cuenta local `valle-admin` creada por autorizacion humana; login, lectura ADMIN de lecciones/contenido y logout comprobados. La contrasena no se guarda en archivos. La cuenta local no se transfiere automaticamente a produccion.
- El test del WorldGenerator real comprueba transforms y collider de una instancia editada; no usa un renderer alternativo del Admin.

## Acceso y autenticacion

URL local actual: `http://127.0.0.1:5182/valle-admin`. La ruta admite barra final.
`backend/content.php` verifica cuentas `valle_admin_accounts`, rol ADMIN, enabled y sesion vigente de hasta 8 horas. Password hash server-side, cookie HttpOnly/SameSite=Strict, regeneracion de sesion y CSRF en cada escritura. Limite de 5 intentos fallidos por usuario/IP en 15 minutos. HTTPS debe estar configurado al desplegar; cookie Secure se activa con HTTPS. El antiguo ejercicio matematico de PianoMagico ya no concede ADMIN: dirige a la ruta autenticada.

Preparacion reproducible (CLI local, no endpoint publico):

```powershell
node scripts/exportContentSeed.mjs
& C:\xampp\php\php.exe backend/content/migrate.php
powershell -NoProfile -File scripts/CreateValleAdmin.ps1
```

La ultima orden pregunta usuario y contrasena oculta; no registra la contrasena en codigo ni argumentos. Creacion solo por el propietario autorizado. `migrate.php` crea tablas separadas y conserva filas existentes; resuelve Plaza `first-song` al ID2 actual, sin cambiar la leccion que ya abria. No ejecutar `populate_lessons.sql`.

Seguridad pendiente fuera de CP1: endpoints legacy de perfiles/progreso siguen usando IDs de perfil sin autenticacion del jugador. El nuevo ADMIN no autentica a esos alumnos ni promete resolver toda la seguridad legacy. No desplegar como servicio publico sin revisar HTTPS, secretos del dbconfig existente y permisos de esos endpoints. No se modificaron credenciales de DB ni datos educativos.

### Preflight de publicacion (2026-10-10)

- Destino confirmado por el propietario: `https://darkseagreen-alligator-732127.hostingersite.com/`; repositorio `https://github.com/hectorgarro-code/pianomagico`.
- Conexion FTPS al destino existente comprobada con certificado Hostinger verificado, sin subir archivos. El deploy legacy usa FTP sin cifrar y publica todo backend; no ejecutarlo sin restringir sus archivos.
- Produccion devuelve 46 lecciones; su respuesta publica no incluye IDs 7, 12 y 13, necesarias para las asignaciones actuales de Montana y Ruinas. No sobrescribir la DB ni reasignar actividades silenciosamente. Comprobar IDs libres y obtener autorizacion para importar exclusivamente las faltantes antes de publicar.
- Nuevas tablas y cuenta ADMIN requieren provisionamiento en produccion; no se transfieren por subir archivos. No publicar el frontend nuevo antes de preparar y verificar su backend.
- 172 tests Node, 14 comprobaciones HTTP locales y 5 pruebas del repositorio local pasan; build correcto con las advertencias conocidas. No equivalen a validacion de produccion ni cierran las pruebas visuales pendientes.

### Despliegue seguro

Usar `powershell -NoProfile -File scripts/DeployValleProduction.ps1` despues de tests y build. Pregunta la contrasena ADMIN oculta y la envia por stdin; no se escribe en archivos. El destino sigue siendo el hosting confirmado, usando los datos FTP existentes de Antigravity. `deploy.js` legacy no es la ruta recomendada: usa FTP sin cifrar y sube archivos auxiliares del backend.

`deployProduction.mjs` verifica FTPS con el certificado Hostinger y TLS 1.2 (el servidor corta sus conexiones de datos con TLS 1.3). Guarda respaldo de archivos activos y DB en `scratch/production-backup-*`, ignorado por Git y nunca publicado. Los respaldos contienen datos privados y deben permanecer locales. No hace push ni copia `dbconfig.php`; conserva la configuracion del hosting.

Ese script corresponde al aprovisionamiento inicial autorizado, no al despliegue habitual. El workflow actualizado de GitHub usa `scripts/deployGitHub.mjs` para publicar frontend/backend sin migraciones ni credenciales ADMIN. Ver `GITHUB_DEPLOYMENT.md`; requiere publicar el workflow y verificar su primera ejecucion.

La preparacion reutiliza `schema.php`, agrega solamente IDs autorizadas 7/12/13 que esten libres y no sobrescribe otras lecciones. Verifica fingerprints de los datos educativos existentes. Un endpoint temporal con token aleatorio, solo HTTPS/POST y caducidad de 30 minutos permite la preparacion; se elimina al finalizar, no constituye una ruta administrativa permanente. Solo se publica el backend runtime, no tests, provisionadores CLI ni SQL. Las reglas web bloquean dbconfig y archivos auxiliares JSON/SQL.

Los modelos publicados son exclusivamente los archivos rastreados de `public/models`; se excluyen FBX/OBJ/MTL/URL. Subidas atomicas evitan activar archivos parciales. Se sube `index.html` al final, despues de comprobar login ADMIN, lecciones requeridas, cookies seguras y rechazo sin autenticacion. Se conservan assets anteriores para rollback; no se borra contenido del hosting ni datos de alumnos. Si fallan comprobaciones posteriores, se restaura el frontend/API anterior desde el respaldo.

### Resultado de publicacion (2026-10-10)

- Commit de Content Platform 1: `c82d927`; publicado directamente por FTPS, sin push a GitHub.
- Juego: `https://darkseagreen-alligator-732127.hostingersite.com/`; ADMIN: `/valle-admin`.
- 890 archivos runtime publicados. Frontend y rutas verificados por HTTP; login ADMIN, cookies Secure/HttpOnly/SameSite, referencias de actividades y restricciones de archivos auxiliares comprobados. Endpoint temporal eliminado.
- Produccion conserva sus 46 lecciones anteriores y agrega exclusivamente 7/12/13 autorizadas: 49 activas. Fingerprints confirman que las filas educativas preexistentes no cambiaron. No sincronizar esta DB con la local ni sustituir las asignaciones por nombre.
- Respaldo previo: `scratch/production-backup-1791682336724` (ignorado y bloqueado por HTTP local con 403); conserva DB y archivos activos anteriores. Para esta primera publicacion, el `.htaccess` original esta en la raiz del respaldo; futuras copias lo guardan como `root-htaccess-original`, separado de las reglas de proteccion del respaldo.
- 15 pruebas de seguridad HTTP en produccion aprobadas. Navegador real: perfiles y escena 3D visibles; login ADMIN y lista de 49 lecciones; modelo 3D del catalogo visible; consola sin errores en esas pantallas. Sesion de comprobacion cerrada. Sin editar contenido ni jugar actividades con perfiles reales.
- La copia antigua observada por FTP en `/public_html` no devolvio un endpoint PHP en su ruta web consultada, sino el fallback HTML; no se modifico ni elimino.
- Siguen pendientes los recorridos completos de edicion/juego/reversion, movil, microfono fisico y video. La publicacion para pruebas no equivale al cierre funcional de CP1 ni a aprobacion del playtest.
- Antes de una apertura publica definitiva: rotar los secretos historicos de hosting presentes en el repositorio y auditar la autenticacion legacy de perfiles/progreso. El nuevo ADMIN no resuelve esos riesgos por si solo.

## Fuente educativa unica

`songs` en MySQL sigue siendo la fuente de verdad. `lessonRepository.loadPianoLessons` sirve tanto PianoMagico como progressService; el endpoint `get_songs` conserva aliases y filtra contenido inactivo. `valle_lesson_meta` agrega enabled/revision/updated_at sin reemplazar ni duplicar secuencias educativas.

Auditoria completa: `LESSON_CATALOG_AUDIT.md`; snapshot verificable de lectura: `docs/audits/lesson-catalog-snapshot.json`. Snapshot NO es fuente runtime. 40 lecciones reales: IDs1-39 y82; ID40 del seed legacy no existe en la DB actual. Dificultad, descripcion, tipo educativo y audio URL no son campos soportados; no se exponen como inventados. sequence es la melodia; preview es sintesis del motor. speed >300 conserva milisegundos legacy; <=300 conserva BPM.

Editor: busqueda, orden, crear, editar, duplicar como borrador inactivo, activar/desactivar y probar. Solo se editan lecciones globales de piano; creaciones de alumnos se muestran con origen pero no se sobrescriben. No borrado de lecciones/historial. Desactivar una leccion asignada requiere reasignar primero. Validacion PHP de campos/nombre/notas/duraciones/tempo/ritmo/orden; revision por leccion evita perder cambios concurrentes. Rutas legacy globales update/delete/reorder se cierran (410 tras ADMIN); add global debe usar el nuevo servicio. El compositor personal mantiene su ruta existente.

Preview reutiliza PianoMagico en modo `adminPreview`, sin perfil real ni escrituras de XP/stickers/medallas/interpretaciones y sin inicio automatico de microfono. No hay un segundo motor musical. Probar abre los datos que el Admin acaba de leer de MySQL.

## Actividades y badges

15 actividades: 9 Lesson Chests de rutas/Bosque, 2 cofres de Ruinas, desafio Ruinas, desafio final, secreto Gruta y Practice Station Plaza. Activity referencia lessonId; no guarda nombre/notas/secuencia. Admin muestra ID, region, tipo, leccion real, requisitos, recompensa y estado. VERIFICADA confirma existencia de ID; no representa aprobacion pedagogica. River/Mountain/final conservan asignaciones PROVISIONAL. No se corrigen silenciosamente.

Los requisitos/topologia y REGION_PROGRESS existentes permanecen protegidos en CP1. rewardId adicional solo prepara futuras recompensas; no desbloquea mascotas ahora. Badges Three Sprite orientados a camara leen nombre y notas de la MISMA fila de leccion que abre el cofre; estados LOCKED/AVAILABLE/COMPLETED, subtitulo y E cerca; no duplican la leccion en Composition Blueprint. No hay texto educativo inventado cuando falta referencia.

## Mundo y persistencia

`ContentBootstrap` carga `valle_game_content` antes de montar perfiles/juego; aplica las instancias y asignaciones a los objetos de composicion exportados, preservando sus identidades y referencias del Adventure. WorldGenerator materializa esas mismas instancias. Topografia, caminos y narrativa originales NO se reescriben. No hay mundo independiente del Admin.

World Editor V1 permite elegir region/composicion (9 composiciones; Gruta entrada/interior separadas), listar/seleccionar objetos, agregar asset existente, duplicar, eliminar props no referenciados, editar posicion, rotacion XYZ en radianes, escala, collision, interaction y tags. Preview reutiliza WorldGenerator, marca seleccion con BoxHelper y permite inspeccion orbital. No gizmos ni nuevas regiones. Terrain preview se cachea durante la edicion, y la camara conserva su pose al editar transforms.

Server valida IDs unicos, assets en whitelist auditada, transforms finitos, escalas positivas, referencias, parametros de colision vertical y objetos protegidos de landmarks/vegetacion/estaciones/gates. Rechaza paths arbitrarios. Errores no corrigen datos automaticamente. Cambios quedan disponibles en la siguiente entrada/recarga del juego; no se cambia una leccion que ya esta en curso.

Contenido global version1/revision/updated_at y export JSON basico. Control optimista de revision (409 ante cambios concurrentes). El export incluye lecciones reales y contenido; no incluye cuentas, hashes, passwords ni player state. No uploads/import de archivos implementados: no hay superficie de subida ni escritura arbitraria de archivos.

PLAYER/ADVENTURE STATE sigue en persistencia existente por perfil y motor educativo. Nunca se guarda completion, region descubierta, XP o mascota obtenida en contenido. Reasignar una actividad a otra leccion hace que la restauracion existente rechace completions con activityId anterior; NO cambia el historial educativo. No activar reasignaciones masivas durante un playthrough.

## Preparacion futura (sin gameplay)

- Rewards: id/type/referenceId/presentation/enabled; PET/SECRET/COSMETIC_FUTURE. Selector de las 24 mascotas, referencias validadas, sin otorgar/follower/coleccion.
- World Action Target: WORLD_CREATURE o DESTRUCTIBLE, assetId, hitsRequired 1-3, hitReaction, defeatEffect, optionalReward, behaviorType, enabledInWorld=false. Criaturas solo las 4 reales; hitReaction debe existir en bibliotecas auditadas o none. Props sin rig usan none. No ataques, enemigos, destruccion, stats RPG o NPC atacables automaticos.
- Minigame: id/type/lessonId/enabled=false. NOTE_RECOGNITION, MELODY_RECOGNITION, RHYTHM, SEQUENCE, MEMORY, PIANO_CHALLENGE. Gate: id/minigameId/instanceId/enabled=false. Configuraciones guardables, no ejecucion ni apertura de nuevas puertas.

## Reproducibilidad

## Entrega solicitada

| Item | Estado real |
|---|---|
| 1. Checkpoint | 102448a; sin push |
| 2. URL Admin | http://127.0.0.1:5182/valle-admin |
| 3. Autenticacion | ADMIN/sesion/CSRF implementados; cuenta local valle-admin con acceso verificado |
| 4. Lecciones reales | 40 filas de piano en MySQL |
| 5. Inconsistencias | ID2 primero, ID82 insertado, ID40 ausente, final35 y rutas provisionales |
| 6. Fuente de verdad | songs + metadata, sin segundo catalogo educativo |
| 7. Editor lecciones | Implementado; repositorio probado; UI autenticada pendiente |
| 8. Preview PianoMagico | Implementado con adminPreview sin escrituras; prueba visual pendiente |
| 9. Activity Admin | 15 referencias editables; prueba UI pendiente |
| 10. Badges | Sprites a camara y datos de leccion real; tests pasan; recorrido cofre pendiente |
| 11. Asset Admin | Catalogo integrado, preview 3D y clips reales locales; UI autenticada pendiente |
| 12. World Editor | CRUD de instancias + preview del generador; tests materializacion pasan; guardar/juego/revertir pendiente |
| 13. Persistencia | Tablas MySQL separadas y revisiones; migracion local aplicada |
| 14. Rewards | Preparacion administrable, no otorgamiento |
| 15. PET schema | 24 referencias candidatas; sin follower/coleccion |
| 16. WORLD_CREATURE schema | 4 referencias; clips auditados; gameplay disabled |
| 17. DESTRUCTIBLE schema | Targets de props; gameplay disabled |
| 18. MINIGAME/GATE schema | Configuracion y referencias; gameplay disabled |
| 19. Seguridad | Rol/estado/expiracion, CSRF, whitelist, validacion server-side; sin uploads; legacy de jugador requiere auditoria de despliegue aparte |
| 20. Tests | 172 Node; 32 contratos PHP; 14 HTTP; 5 repositorio MySQL |
| 21. Build | Pasa; advertencias documentadas arriba |
| 22. Video funcional | Pendiente, no sustituido por capturas ni por tests |

**CONTENT PLATFORM 1 REQUIERE CORRECCION**: no se declara funcional/cerrado sin la validacion humana/autenticada y las reversiones visuales solicitadas. No iniciar fases siguientes.

### Comandos de verificacion

`exportContentSeed.mjs` deriva seed/registry y lista ligera de URLs desde las composiciones y Asset Catalog actuales; no inventa contenido. Los JSON del backend son bootstrap/whitelist, no un segundo mundo runtime editable. La DB cargada es la fuente materializada; no regenerar/eliminar su fila para restaurar cambios. Admin guarda cambios y puede revertirlos con otra revision.

Pruebas:

```powershell
node --test src/game/**/*.test.js src/modules/core/*.test.js
node scripts/checkContentAccess.mjs
& C:\xampp\php\php.exe backend/content/repository-test.php
npm run build
```

Las dos pruebas de integracion requieren acceso a XAMPP local. repository-test crea y retira SOLO su fixture inactiva; no es un test de interfaz ni sustituye las reversiones visuales obligatorias. Detenerse despues de CP1; no iniciar PETS & REWARDS, World Actions ni Minigame Gates.

## Autoridades

- `src/game/assets/assetCatalog.js`: categorias e IDs estables del catalogo.
- `src/game/assets/localAssetPacks.json`: metadata obtenida directamente de GLB/GLTF y archivos locales, no de publicidad.
- `scripts/auditLocalAssetPacks.mjs`: auditor reproducible. `node scripts/auditLocalAssetPacks.mjs --write` regenera solamente la metadata; no toca los packs.
- `AssetDiagnosticModal.jsx`: consulta y comprobacion de carga, solo en DEV + `?debug=1` desde Assets KayKit. El catalogo completo se importa al abrir, no se precargan sus modelos en el juego.
- `kaykitCatalog.json` y `assetManifest.js` mantienen los contratos existentes de generacion/cache. No se modifican las composiciones.

## Categorias

CHARACTER_PLAYER, PET, WORLD_CREATURE, PROP, DESTRUCTIBLE, ARCHITECTURE, VEGETATION, DECORATION.

PET contiene 24 registros. WORLD_CREATURE contiene 4; el Warrior anterior es una variante documentada del mismo concepto, no una quinta criatura. Los 13 accesorios del pack son PROP, no enemigos ni objetos destructibles por nombre. DESTRUCTIBLE queda vacia hasta una definicion humana explicita.

Los assets anteriores reciben una categoria administrativa sin atribuirles bounds, licencias o capacidades no re-auditadas. Los personajes jugadores siguen siendo los cinco aventureros actuales, nunca los esqueletos.

## Contratos futuros, no implementados

PET referencia assetId/collectionKey y clips candidatos para companion; no guarda una coleccion, otorga recompensas ni ejecuta follower AI. Escala a 0.5 unidades de altura es una sugerencia de comparacion, no colocacion aprobada.

WORLD_CREATURE declara bibliotecas y candidatos de reaccion/derrota disponibles. behavior, hitsRequired, attackable, defeatEffect y optionalReward permanecen null. El rango permitido de una futura accion es 1-3 impactos; no hay stats RPG, dano, barras, targeting, combos ni inventario. NPC amistoso es un concepto distinto: la categoria no convierte automaticamente ningun personaje en atacable.

Content Platform decide que existe. El futuro World Editor decidira donde aparece y sus opciones concretas. `enabledInWorld: false` y `placement: null` no autorizan instancias.

Auditoria completa: `ASSET_CATALOG_AUDIT.md`. Packs runtime respaldados en checkpoint aprobado; fuentes auxiliares originales siguen en disco, ignoradas. No descarga, renombrado, movimiento, push ni commit final en esta fase.
