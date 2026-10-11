# VALLE DE LAS NOTAS: manual de desarrollo

## Identidad y filosofia
VALLE DE LAS NOTAS es un videojuego educativo 3D centrado exclusivamente en el aprendizaje del piano. No es una demo tecnica ni una coleccion de assets: debe sentirse como una aventura coherente, disenada intencionalmente.
Construir un mundo pequeno pero excelente antes de expandirlo. Calidad visual > cantidad de objetos. Diseno intencional > distribucion procedural. Claridad > complejidad.
El repositorio tambien contiene ukelele y estudio musical; su existencia no amplia el alcance del juego ni autoriza modificarlos.

PRODUCT: VALLE DE LAS NOTAS. PRIMARY INSTRUMENT: PIANO. PRIMARY EXPERIENCE: 3D ADVENTURE. EDUCATIONAL ENGINE: PIANOMAGICO.
Flujo oficial: PROFILE -> ADVENTURE -> EXPLORE -> DISCOVER -> PIANO ACTIVITY -> RESULT -> WORLD PROGRESSION. Nunca asumir que el usuario primero elige un instrumento. Ver `docs/PRODUCT_ARCHITECTURE.md`.

## Principio fundamental
Antes de modificar codigo existente: 1. inspeccionar; 2. comprender; 3. identificar dependencias; 4. proponer el cambio y su alcance; 5. recien entonces modificar.
No reemplazar sistemas funcionales sin una razon tecnica comprobable. Respetar el alcance autorizado; si se pide inspeccion, no corregir durante la auditoria.

## Arquitectura real
- Stack: React 19, Vite 7, Tailwind 4, Three.js y Zustand; backend PHP en `backend/api.php` con persistencia en base de datos.
- `src/main.jsx` monta `MusicSuite` bajo React StrictMode. MusicSuite solo selecciona perfiles y abre `GameApp`; no tiene estado de instrumento/menu ni imports de InstrumentSelection, UkeHero o MusicStudio. Esos modulos se conservan como legacy desconectado. Salir vuelve a perfiles; refresh vuelve a perfiles y luego Nueva Aventura/Continuar, nunca a instrumentos.
- `LoginScreen` es seleccion de perfil educativo, sin personalizacion de personaje ni marca galactica. `AdventureStart` selecciona Knight/Mage/Barbarian/Rogue al crear una aventura; Continuar no repite selector ni intro. El campo avatar existente guarda la identidad visual; el endpoint update_profile con avatarOnly cambia exclusivamente avatar, sin reescribir XP/nombre. Nueva Aventura con progreso requiere confirmacion antes de resetear Adventure; nunca borra datos educativos.
- Las herramientas de inicio y mundo requieren DEV y `?debug=1`; no aparecen en modo normal ni produccion. Los controles de caminar automatico pertenecen a auxiliares de QA fuera del proyecto, no al producto.
- `GameApp` orquesta WORLD, PIANO y transiciones; carga perfil, canciones, interpretaciones y medallas mediante `src/game/services/progressService.js`.
- WORLD SYSTEMS 2 usa `state/worldActivityFlow.js`: captura contexto atomico (posicion, orientacion, camara, region, estacion y actividad), conserva World3DView montado pero pausado y valida retorno con CollisionWorld. `world.stationResults` conserva completion de sesion; no hay nueva persistencia de exploracion. PianoStageView sigue reutilizando PianoMagico y su API, con entrada directa, resultado real y cancelacion independientes. No activar mic automaticamente en modo embebido sin preferencia previa explicita.
- WORLD SYSTEMS 3 agrega `adventure/adventureState.js` y `composition/forestAdventureComposition.js`: tres Lesson Chests autorados, discovery y estados LOCKED/AVAILABLE/IN_PROGRESS/COMPLETED. Plaza sigue siendo PRACTICE_STATION; `world.stationResults` no duplica los cofres. GameState.adventure es la autoridad; requirements y rewards viven en las definiciones. Reward de aventura provisional = REGION_PROGRESS una sola vez, sin XP adicional ni nuevas medallas: PianoMagico sigue otorgando el progreso educativo real. `services/adventurePersistence.js`, expuesto por progressService, guarda por perfil en localStorage y restaura solo completions validadas; actividades interrumpidas vuelven a AVAILABLE. No es persistencia MySQL ni sincronizacion entre dispositivos.
- `src/game/state/GameState.js` define estado inicial y checkpoints. SYSTEMS 5 extiende `game.adventure` a schemaVersion 2: hechos de regiones, milestones, challenges, discoveries, rewards secretos y gates abiertos. `adventure/valleyBlueprint.js` declara topologia y requisitos; `valleyProgression.js` deriva currentRegion, discovered/completed/availableRegions, gates, currentObjective y valleyCompleted. No duplicar estas consultas en stores/componentes ni usar XP/rangos como llave. Ver `docs/VALLEY_PROGRESSION.md`. Persistencia local por perfil conserva la clave v1 y migra payloads v1/v2 sin modificar datos educativos; posicion exacta sigue sin persistirse. world.currentRegion fue retirado como segunda autoridad. journey.objective es compatibilidad legacy, no controla HUD global.
- `src/game/world/World3DView.jsx` administra escena Three.js, renderer, luces, camara, movimiento, personaje, proximidad y cofre de la primera estacion; delega el entorno a `WorldGenerator.js`.
- `WorldGenerator.js` precarga y clona modelos, construye terreno y camino, y coloca Plaza, Arbol Maestro y transicion corta al bosque. `generateFork` existe pero no se ejecuta actualmente.
- `collision/CollisionWorld.js` resuelve movimiento XZ con circulo de jugador (radio 0.34), circulos de base y cajas orientadas, sliding y celdas estaticas de 4 m. `modelColliders.js` cachea bounds nativos por modelo y materializa el contrato opcional `instance.collision` al generar composicion; no recalcular geometria por frame. Copas, suelos y vegetacion pequena no bloquean; rango de interaccion permanece independiente. Debug World muestra ambos tipos de limites.
- `worldGenerationRules.js` calcula alturas y define despejes y margenes. Su presencia no garantiza que todas las colocaciones apliquen esas reglas.
- `worldSeed.js` ofrece PRNG determinista. El generador lo inicializa, pero la composicion actual usa posiciones fijas.
- `worldBlueprint.js` conserva identidad, intencion y restricciones. `composition/plazaComposition.js` contiene las 61 instancias autoradas de Plaza, su spawn, camara, tramo de camino y zonas. `compositionSchema.js` documenta el contrato serializable y `validateComposition.js` reporta errores sin corregir datos. WorldGenerator materializa ese plano y contrasta sus assets con el blueprint; no convierte el blueprint conceptual en coordenadas automaticamente.
- Plaza usa el camino integrado al terreno (terrain-blend) aprobado visualmente. El ribbon y el entorno externo legacy siguen disponibles, pero no se ejecutan en la fase 5F. Landmarks referencian instancias; las colecciones vacias no autorizan agregar contenido.
- `src/game/piano/PianoStageView.jsx` encapsula `src/modules/piano-magico/PianoMagico.jsx`, reutilizando el motor musical existente.
- `PianoMagico` conserva evaluacion, teclado, canciones, reproduccion, compositor, administracion y mapa anterior `components/AdventurePath3D.jsx`; realiza llamadas propias a la API. No asumir que el mapa anterior esta obsoleto o desconectado.
- Audio: Web Audio en `PianoMagico`; `src/hooks/usePianoMic.js` suscribe al singleton Zustand `usePianoMicStore.js`, que gestiona captura, sensibilidad y eventos de ataques con strikeId.
- El microfono carga primero `public/audio/pitch-worklet.js`, con fallback a `src/audio/pitch-worklet.js`. Son copias diferentes; revisar ambas. La deteccion actual usa YIN JavaScript; no asumir aceleracion WASM por tener `wasm-pitch` instalado.
- Personajes: `src/modules/core/utils/characterModels.js`, `Model3DViewer.jsx`, modelos riggeados y AnimationMixer. El mundo clona personajes con SkeletonUtils.
- Assets: `src/game/assets/assetManifest.js` usa GLTFLoader, cache y clonacion; `kaykitCatalog.json` categoriza KayKit. Los recursos estan en `public/models/characters` y `public/models/props`; componentes anteriores mantienen caches propios.
- El servidor Vite redirige `/backend` a XAMPP mediante `vite.config.js`; comprobar tambien las rutas al desplegar bajo un subdirectorio.

## Sistemas protegidos
No modificar innecesariamente sistema educativo, piano virtual, Web Audio, deteccion de microfono, pitch-worklet, comparacion de notas, canciones, progreso, perfiles, backend, persistencia, personajes ni animaciones funcionales.
Un problema visual del mundo NO justifica modificar estos sistemas. Una correccion autorizada debe ser puntual, basada en evidencia y validada en el recorrido afectado.

## Master Plan
Leer y respetar `VALLE_DE_LAS_NOTAS_MASTER_PLAN.md` y `src/game/world/worldBlueprint.js` antes de trabajar en el mundo.
Progresion: Plaza de las Notas -> Bosque de las Notas -> bifurcacion -> Rio del Ritmo / Ruta de la Montana -> Ruinas del Gran Pentagrama -> Observatorio Musical.
La Gruta del Eco es una zona secreta opcional.
Si documentos y codigo divergen, explicitar la discrepancia antes de implementar; no actualizar documentos ni arquitectura silenciosamente para justificar la escena.

## Composicion visual
REGLA CRITICA: la composicion principal debe ser AUTORADA, nunca decidida proceduralmente.
No randomizar landmarks, caminos principales, plazas, edificios, estaciones, bifurcaciones, arboles principales, puntos de interes, composicion de camara ni estructura espacial de una region.
La generacion procedural solo puede utilizarse para detalles secundarios despues de aprobar la composicion principal. Una semilla fija no convierte una distribucion aleatoria en composicion autorada.

## Jerarquia de construccion
Trabajar en este orden: 1. terreno y topografia; 2. recorrido del jugador; 3. composicion; 4. landmarks; 5. arquitectura; 6. estaciones/interaccion; 7. vegetacion principal; 8. decoracion secundaria; 9. iluminacion; 10. optimizacion.
Nunca intentar mejorar una escena simplemente agregando mas objetos.
Toda region debe resolver MACRO (silueta, terreno, horizonte, masas principales), MEDIUM (caminos, arquitectura, landmarks, vegetacion principal) y MICRO (flores, piedras, barriles, cofres, decoracion).
No utilizar microdetalle para compensar una mala composicion macro.

## Espacio negativo, escala y caminos
Mantener zonas de circulacion y lectura visual; evitar arboles tapando landmarks, vegetacion bloqueando camara, objetos invadiendo caminos, decoracion excesiva y ruido visual.
Verificar despejes en la escena, no solo en las constantes: Plaza 9 m, claro del Arbol Maestro 5.5 m y bifurcacion 6 m segun las reglas actuales; consultar el blueprint para otras regiones.
Mantener escala coherente respecto al personaje. Evitar estructuras gigantescas sin intencion; el entorno debe sentirse construido para su escala.
Los caminos deben integrarse visualmente al terreno y la topografia. Evitar una cinta clara colocada encima de una superficie verde.

## Assets
Priorizar assets reales disponibles. Consultar `kaykitCatalog.json` y `assetManifest.js`; comprobar archivo y dependencias externas antes de usarlo. No inventar nombres.
No utilizar geometria procedural generica como arte final cuando exista un asset apropiado. El soporte tecnico del terreno no constituye aprobacion artistica.
No borrar formatos alternativos, modelos, caches o componentes aparentemente redundantes sin comprobar usos y obtener autorizacion para eliminarlos.

## Validacion
Despues de cambios importantes ejecutar build, revisar errores y warnings relevantes, y comprobar que no se rompieron sistemas existentes.
Usar dependencias locales; no instalar dependencias sin consultar al usuario. El comando normal es `npm run build`; si npm global falla, usar `node node_modules/vite/bin/vite.js build`.
En auditorias sin modificaciones, dirigir la salida del build fuera del proyecto. No ejecutar despliegues como parte de una verificacion.
Para cambios visuales revisar capturas y escena en ejecucion, carga de assets, camara, escala, despejes y navegacion en escritorio y movil. Un build exitoso no implica aprobacion visual ni funcional.
Para cambios en integracion validar mundo -> leccion -> retorno y conservar posicion; probar audio, microfono y persistencia cuando sean afectados. Distinguir pruebas realizadas de supuestos.

## Desarrollo por regiones y detencion
GAMEPLAY UX 1 aprobado como base funcional, no estetica definitiva: checkpoint `56814d3 - Gameplay navigation map and chest signals`. Fase actual: GAME DESIGN PASS 1, playtest humano y diagnostico. Solo preparacion, plantilla vacia y telemetria local DEV; no features de juego, regiones, NPC, enemigos, inventario, monedas, polish, cambios de curriculo/historia ni conclusiones automaticas. Exportacion en DEV + `?debug=1`, panel Progresion del Valle. Detenerse al preparar; esperar resultados humanos.
WORLD BUILD 2 aprobado como Full Valley Prototype y respaldado en `9203684 - Full Valley playable prototype`. GAMEPLAY UX 1 autorizado: mapa, orientacion contextual y senales de cofres derivados del Adventure existente. Ver `docs/GAMEPLAY_UX_1.md`. No cambiar terreno/composiciones, crear regiones/lecciones ni comenzar Game Design Pass. UX 1 queda sin commit final ni push hasta aprobacion humana.
WORLD BUILD 2 autorizado tras checkpoint `4331d68`: construir en una ejecucion Gruta completa, Ruinas, Observatorio y final provisional, sin polish, push ni commit final. Reemplaza restricciones historicas de alcance anteriores. Requisitos reales: Ruinas 11/12/13, final 35; Gruta opcional con Secret Reward. Ver `docs/WORLD_BUILD_2.md`. No declarar terminado sin playthrough real de Nueva Aventura a final y evidencia.
WORLD BUILD 1 autorizado tras checkpoint fba5ee4 (Global Valley Progression): excepcion explicita al trabajo de una sola region. Construir en un bloque bifurcacion, Rio, Montana y entrada secreta de Gruta; conservar Plaza y Bosque salvo conexion norte. No construir Ruinas ni Observatorio, no hacer commit final ni push. Esta autorizacion reemplaza la prioridad historica SYSTEMS 5 descrita abajo. Composicion principal siempre autorada. Prototipo jugable, sin rondas de microperfeccion.
NO construir multiples regiones simultaneamente. Cada region debe aprobarse visual y funcionalmente antes de continuar con la siguiente.
Plaza fue aprobada visualmente por el usuario el 2026-10-06 y queda congelada; consultar `docs/PLAZA_VISUAL_APPROVED.md`. Solo modificarla para bugs, integracion educativa, rendimiento, continuidad vecina, camara/colisiones o cambios explicitamente aprobados. La Fase 1 procedural sigue desaprobada. Bosque-A fue aprobado conceptualmente y Bosque-B macro fue aprobado visualmente por el usuario. Bosque-C queda aceptado como PROVISIONAL y congelado: NO agregar arboles, pulir estetica, avanzar a Micro ni otras regiones. WORLD SYSTEMS 1: `4c590c9 - Bosque foundation and world collisions`. WORLD SYSTEMS 2 aprobado: `89690b8 - World piano gameplay loop integrated`. WORLD SYSTEMS 3 aprobado: `bd086e7 - Adventure lesson chests and progression loop`. WORLD SYSTEMS 4 + ENTRY FLOW 4.5 aprobados: `734efe3 - Valle de las Notas new adventure and unified entry flow`. Prioridad autorizada: WORLD SYSTEMS 5, Global Valley Progression, solo contratos/topologia, migracion, objetivos derivados y validacion con Bosque. No construir Rio, Montana, Gruta, Ruinas ni Observatorio. Gates logicos no autorizan paredes invisibles ni puertas generadas. Al completarla detenerse, sin commit final ni push hasta aprobacion humana. QA posterior: mic fisico, movil, persistencia definitiva y bundle.
Si la tarea pide una sola region, DETENERSE al terminarla. No anticipar la siguiente ni interpretar el build como permiso para expandir.

## Git y alcance
CONTENT PLATFORM 1 autorizado tras auditoria local de packs aprobada y checkpoint `102448a`. Admin `/valle-admin` requiere sesion ADMIN real en PHP, nunca debug ni verificacion matematica. MySQL `songs` permanece fuente educativa; `valle_lesson_meta` agrega estado/revision. Contenido global separado en `valle_game_content`; ContentBootstrap aplica instancias/asignaciones antes de GameApp. Preview PianoMagico adminPreview no debe escribir datos educativos ni activar mic automaticamente. CP1 no agrega gameplay de PET/World Actions/destructibles/minijuegos ni regiones. Ver `LESSON_CATALOG_AUDIT.md` y `docs/CONTENT_PLATFORM_1.md`. Falta validar los recorridos visuales con cuenta ADMIN autorizada; no declarar fase cerrada con solo tests/build. No commit final ni push.

PRESENTATION & PLAYABILITY PASS 1 autorizado despues de `434ceb0 - Gameplay UX map navigation and chest signals`: referencia humana provisional para perfiles, menus, selector, intro, preparacion de piano y HUD. Autoriza solo despejes puntuales de vegetacion/props, asistencia suave de camara, showcase unico con clips reales Q/E y capa visual reusable. Ver `docs/PRESENTATION_PLAYABILITY_PASS_1.md`. No autoriza nuevas regiones, progresion, combate, backend ni polish general. E conserva interaccion junto a cofres. Preview comparte sintesis existente; preparacion embebida no se duplica dentro de PianoMagico. No commit final ni push; detenerse tras validacion y esperar aprobacion humana, sin iniciar Game Design Pass.

Antes de cambios estructurales importantes revisar `git status` e identificar archivos afectados. Respetar cambios existentes, incluidos archivos sin rastrear.
No hacer resets destructivos ni eliminar trabajo existente sin autorizacion explicita. No realizar commits, staging masivo ni limpieza como efecto secundario de otra tarea.
La auditoria encontro `src/game/`, `public/models/` y el Master Plan sin rastrear; verificar su estado actual antes de asumir que estan respaldados en Git.
Comunicar avances y resultados en espanol, con concision; priorizar cambios y verificacion sobre informes innecesarios.

## Hallazgos conocidos de la auditoria (verificar antes de actuar)
Estos hallazgos no autorizan correcciones fuera del alcance solicitado y pueden cambiar con el desarrollo:
- PianoMagico embebido carga la actividad con `startLevel` sin forzar menu; salir del resultado no dispara simultaneamente completion y cancelacion. El modo independiente conserva su menu.
- `stopMic` limpia `activePitchClass`; pruebas cubren parada idempotente sin hardware. La validacion del loop usa teclado virtual, no certifica microfono fisico.
- `profileAdapter.js` normaliza `avatar_id`/`avatarId` y respeta la eleccion local del personaje; no cambia esquema de backend.
- GameState y World3DView leen el spawn aprobado actual de Plaza (z=5); una posicion recibida sigue prevaleciendo. El retorno de actividad usa contexto seguro, no spawn.
- El blueprint menciona `bench.gltf`, ausente en disco. Los 378 GLTF revisados tenian sus dependencias externas presentes.
- El Master Plan describe el Observatorio como circular y tambien semicircular; resolver esa discrepancia antes de construirlo.
- Las composiciones actuales declaran 18 colliders solidos en Plaza y 36 en Bosque (33 arboles y 3 cofres). Son estaticos y horizontales; no hay limites generales de exploracion ni colision de camara contra props/copas. La camara evita terreno, no todos los obstaculos. Cofres completados abren la tapa `chest_lid`; collider del cuerpo permanece independiente del rango de interaccion.
- La limpieza Three.js no libera explicitamente todas las geometries y materiales; revisar propiedad y caches antes de disponer recursos compartidos.
- El build pasa, pero advierte un bundle principal grande. No convertir esto en autorizacion para refactorizar.
