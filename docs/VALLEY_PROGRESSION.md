# Global Valley Progression - SYSTEMS 5

## WORLD BUILD 1

Checkpoint SYSTEMS 5 aprobado: fba5ee4. Rio y Montana ya no usan hitos prototype-complete: requieren sus tres Lesson Chests reales. Primer cofre de cada ruta requiere los tres del Bosque; posteriores requieren el anterior de su propia ruta. No hay dependencia cruzada ni XP adicional. Registro ALL_LESSON_CHESTS conserva IDs/claims anteriores y restaura los seis nuevos con el mismo contrato v2.

Las composiciones separadas Junction, River, Mountain y Grotto Entrance se materializan realmente en WorldGenerator. Las regiones se detectan al caminar. La entrada secreta registra echo-grotto-found y descubre Gruta; su interior y completion siguen pendientes. Ruinas y Observatorio no se construyen; routes_to_ruins solo queda AVAILABLE al completar ambas rutas. Las salidas son reservas, no puertas finales. Los centros aproximados del blueprint no son coordenadas obligatorias: las rutas nuevas continúan al norte del Bosque aprobado, sin superponer biomas sobre sus claros.

El cauce tiene agua sencilla y colliders de banco; el puente usa grounding del controlador existente. La topografia nueva se mezcla solamente al norte de z=-46; Plaza y las instancias/cofres de Bosque permanecen intactos. Challenge no implementado: los tres cofres reutilizan directamente PianoMagico sin introducir otro sistema educativo.

Las secciones siguientes describen el checkpoint previo; sus referencias a Rio/Montana futuras quedan reemplazadas por este bloque construido.

## Autoridad y contratos

`game.adventure` es la unica autoridad de Adventure. `valleyBlueprint.js` declara regiones, requisitos y gates con los IDs del World Blueprint. `valleyProgression.js` resuelve el estado sin componentes, renderer, backend ni XP.

`getValleyProgress(adventure)` responde currentRegion, discoveredRegions, completedRegions, availableRegions, regions, gates, currentObjective y valleyCompleted. Son consultas derivadas, no otras copias persistidas.

La partida version 2 conserva entries (cofres y claims), journey y valley. valley contiene hechos serializables: currentRegion, discoveredRegions, milestones, completedChallenges, discoveries, collectedRewards y openedGates. No contiene XP, interpretaciones, rangos o medallas.

journey.started controla inicio/Continuar. journey.objective y advanceObjective se conservan exclusivamente para compatibilidad v1 y tests antiguos; ya no controlan el HUD ni la progresion global. Los campos legacy de GameState.world y quest no desbloquean regiones. world.currentRegion se retiro para evitar una segunda autoridad; el contexto de una actividad sigue capturando su region de origen para retornar.

## Estados

- LOCKED: faltan requisitos de acceso.
- DISCOVERED: el jugador conoce la region y no esta activo en ella.
- ACTIVE: region actual de una aventura iniciada.
- COMPLETED: descubierta, accesible y con todos sus requisitos completos. Prevalece sobre ACTIVE; currentRegion sigue indicando donde esta el jugador.
- Disponible pero no descubierta: available=true, state=null. Desbloquear una ruta nunca simula haberla visitado.

Plaza empieza DISCOVERED; al iniciar se activa. La deteccion fisica actual solo cubre Plaza y el envelope autorado del Bosque. Los tramos de transicion conservan la ultima region; los futuros centros del World Blueprint NO se usan para descubrir regiones inexistentes. Entrar o regresar actualiza currentRegion sin perder descubrimientos anteriores ni dar XP.

## Topologia provisional

Plaza -> Bosque -> Rio / Montana -> Ruinas -> Observatorio.
Bosque -> Gruta del Eco es secreto y opcional; no bloquea el final.

Plaza se completa con el hito plaza-explored (movimiento real). Bosque requiere exactamente los tres Lesson Chests existentes. Al completarlo ambas rutas quedan disponibles, sin orden obligatorio. Ruinas requiere Rio COMPLETED + Montana COMPLETED. Observatorio requiere Ruinas COMPLETED. Observatorio COMPLETED representa Valley COMPLETED.

Las regiones futuras requieren hitos identificados explicitamente como prototype-complete. Son placeholders para simulacion, no un curriculo ni actividades construidas; se reemplazaran por requisitos reales al autorizar cada region. No hay completion por arrays vacios.

Los requisitos soportan REGION_COMPLETED, REGION_DISCOVERED, OBJECT_COMPLETED, CHALLENGE_COMPLETED, DISCOVERY, MILESTONE y SECRET_REWARD. Se combinan con AND y se resuelven hasta un punto fijo independiente del orden de las definiciones. Tipos desconocidos no satisfacen requisitos. Gruta requiere el discovery echo-grotto-found; su condicion jugable definitiva NO esta implementada.

## Eventos y gates

REGION_DISCOVERED registra la entrada solo si la region esta disponible. MILESTONE_REACHED, CHALLENGE_COMPLETED (completed=true), DISCOVERY_RECORDED y SECRET_REWARD_COLLECTED registran hechos idempotentes. El emisor de un Challenge futuro debera validar su resultado educativo antes de emitir completion; no existe gameplay nuevo aqui.

Gates: plaza_to_forest, forest_to_river, forest_to_mountain, forest_to_grotto, routes_to_ruins, ruins_to_observatory. LOCKED deriva de requisitos de destino; AVAILABLE permite abrir; OPEN registra la apertura/travesia. GATE_OPENED rechaza gate desconocido, bloqueado o con origen incorrecto. REGION_DISCOVERED abre automaticamente la conexion desde su origen cuando corresponde. No se generan paredes invisibles ni assets.

Composition Blueprint puede declarar `gates: [{id:'river-link', gateId:'forest_to_river', exitId:'authored-exit', instanceId:'optional-existing-prop'}]`. `validateWorldGateBindings` valida IDs, region y referencias; las futuras integraciones deberan llamarlo antes de materializar bindings. Las composiciones actuales permanecen intactas.

Los objetivos son sencillos y derivados: explorar Plaza, encontrar Bosque, completar cofres, explorar ambas rutas, alcanzar Ruinas/Observatorio y Valle completado. Textos provisionales, sin quest system nuevo.

## Persistencia y compatibilidad

Se conserva la clave localStorage valle-adventure-v1-user-ID para encontrar estados existentes; schemaVersion dentro del payload pasa a 2. La carga acepta v1/v2, valida cofres/claims, recupera journey y normaliza hechos. v1 infiere descubrimiento del Bosque de su objetivo o cofres validados, sin inventar completions educativas. IN_PROGRESS interrumpido vuelve a AVAILABLE. Formatos desconocidos o corruptos vuelven a estado seguro.

La restauracion no modifica avatar, XP, medallas ni interpretaciones. Nueva Aventura reinicia exclusivamente Adventure y contexto de exploracion; mantiene la confirmacion aprobada. Recargar inicia fisicamente en Plaza, actualiza currentRegion y conserva regiones conocidas, completions y objetivos derivados. No pretende restaurar posicion exacta.

PianoMagico sigue siendo propietario de evaluacion, puntuacion, performances, medallas y rangos; Adventure reutiliza sus resultados reales. No hay XP extra por entrar a regiones ni por desbloquearlas. Practice Station no cuenta como Lesson Chest.

## Validacion y alcance

DEV + ?debug=1 permite inspeccionar todo el progreso y simular los hitos de regiones futuras disponibles. No permite completar cofres artificialmente ni saltar requisitos. Reset DEV pide confirmacion y afecta el Adventure real del perfil elegido. Las simulaciones de tests usan memoria independiente.

El checkpoint aprobado SYSTEMS 4/4.5 es 734efe3. SYSTEMS 5 queda sin commit final hasta aprobacion humana. No se construyeron regiones, vegetacion, puertas, desafios ni final.

Deuda: persistencia cross-device/backend, reemplazar hitos de prototipo por contenido real, disenar triggers y bloqueos fisicos/narrativos al construir cada region, mic fisico/movil, camara frente a props y bundle. MySQL y el motor educativo no se modifican en SYSTEMS 5.

El World Blueprint aun describe BOSQUE-C como draft y el Master Plan conserva la discrepancia circular/semicircular del Observatorio. Estas discrepancias historicas no alteran la topologia; resolver las visuales solo al autorizar esa construccion.

Validacion realizada: 69/69 tests y build exitoso. Playthrough real con TIZIANO: tres lecciones mediante teclado virtual -> tres cofres COMPLETED -> Bosque COMPLETED -> Rio/Montana AVAILABLE; refresh y Continuar conservaron claims/desbloqueos y Mage, con spawn en Plaza. PianoMagico otorgo los 900 XP normales (700 -> 1600) y registro tres nuevas interpretaciones; Adventure no agrego XP. BASTIAN y SOPHIA pudieron continuar sus estados actuales sin reset. La convergencia y el final se simularon en memoria, sin completar regiones futuras en perfiles reales. Objetivo y escena comprobados a 390x844 y escritorio; no es certificacion de controles tactiles ni microfono fisico.
