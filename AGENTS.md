# VALLE DE LAS NOTAS: manual de desarrollo

## Identidad y filosofia
VALLE DE LAS NOTAS es un videojuego educativo 3D centrado exclusivamente en el aprendizaje del piano. No es una demo tecnica ni una coleccion de assets: debe sentirse como una aventura coherente, disenada intencionalmente.
Construir un mundo pequeno pero excelente antes de expandirlo. Calidad visual > cantidad de objetos. Diseno intencional > distribucion procedural. Claridad > complejidad.
El repositorio tambien contiene ukelele y estudio musical; su existencia no amplia el alcance del juego ni autoriza modificarlos.

## Principio fundamental
Antes de modificar codigo existente: 1. inspeccionar; 2. comprender; 3. identificar dependencias; 4. proponer el cambio y su alcance; 5. recien entonces modificar.
No reemplazar sistemas funcionales sin una razon tecnica comprobable. Respetar el alcance autorizado; si se pide inspeccion, no corregir durante la auditoria.

## Arquitectura real
- Stack: React 19, Vite 7, Tailwind 4, Three.js y Zustand; backend PHP en `backend/api.php` con persistencia en base de datos.
- `src/main.jsx` monta `MusicSuite` bajo React StrictMode. `src/modules/core/MusicSuite.jsx` gestiona acceso, perfil y seleccion de instrumento; piano abre `src/game/GameApp.jsx`.
- `GameApp` orquesta WORLD, PIANO y transiciones; carga perfil, canciones, interpretaciones y medallas mediante `src/game/services/progressService.js`.
- `src/game/state/GameState.js` define estado inicial y checkpoints. La exploracion vive en memoria React; no asumir persistencia de cofres, zonas, misiones o posicion.
- `src/game/world/World3DView.jsx` administra escena Three.js, renderer, luces, camara, movimiento, personaje, proximidad y cofre de la primera estacion; delega el entorno a `WorldGenerator.js`.
- `WorldGenerator.js` precarga y clona modelos, construye terreno y camino, y coloca Plaza, Arbol Maestro y transicion corta al bosque. `generateFork` existe pero no se ejecuta actualmente.
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
NO construir multiples regiones simultaneamente. Cada region debe aprobarse visual y funcionalmente antes de continuar con la siguiente.
Plaza fue aprobada visualmente por el usuario el 2026-10-06 y queda congelada; consultar `docs/PLAZA_VISUAL_APPROVED.md`. Solo modificarla para bugs, integracion educativa, rendimiento, continuidad vecina, camara/colisiones o cambios explicitamente aprobados. La Fase 1 procedural sigue desaprobada. Bosque-A esta autorizado solo como propuesta de diseno macro; NO implementarlo hasta recibir aprobacion humana. La aprobacion visual no implica validacion funcional completa ni movil.
Si la tarea pide una sola region, DETENERSE al terminarla. No anticipar la siguiente ni interpretar el build como permiso para expandir.

## Git y alcance
Antes de cambios estructurales importantes revisar `git status` e identificar archivos afectados. Respetar cambios existentes, incluidos archivos sin rastrear.
No hacer resets destructivos ni eliminar trabajo existente sin autorizacion explicita. No realizar commits, staging masivo ni limpieza como efecto secundario de otra tarea.
La auditoria encontro `src/game/`, `public/models/` y el Master Plan sin rastrear; verificar su estado actual antes de asumir que estan respaldados en Git.
Comunicar avances y resultados en espanol, con concision; priorizar cambios y verificacion sobre informes innecesarios.

## Hallazgos conocidos de la auditoria (verificar antes de actuar)
Estos hallazgos no autorizan correcciones fuera del alcance solicitado y pueden cambiar con el desarrollo:
- `PianoMagico` fuerza `setView('menu')` al montar y al cargar datos, pese a `initialView='game'` de PianoStageView.
- `usePianoMicStore.stopMic` referencia `activeNote`, no declarada; el estado acustico usa `activePitchClass`.
- El backend entrega `avatar_id`, mientras World3DView consulta `profile.avatarId`; revisar normalizacion del perfil.
- GameState y World3DView leen el spawn de Plaza (z=3.5); una posicion recibida sigue prevaleciendo. El antiguo fallback aislado z=6.6 fue consolidado durante la migracion.
- El blueprint menciona `bench.gltf`, ausente en disco. Los 378 GLTF revisados tenian sus dependencias externas presentes.
- El Master Plan describe el Observatorio como circular y tambien semicircular; resolver esa discrepancia antes de construirlo.
- La escena carece de colisiones con props y limites de exploracion; la camara evita terreno, no todos los obstaculos.
- La limpieza Three.js no libera explicitamente todas las geometries y materiales; revisar propiedad y caches antes de disponer recursos compartidos.
- El build pasa, pero advierte un bundle principal grande. No convertir esto en autorizacion para refactorizar.
