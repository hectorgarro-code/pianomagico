# Presentation & Playability Pass 1

Checkpoint: `434ceb0 - Gameplay UX map navigation and chest signals`.
Direccion provisional: referencia visual humana de fantasia musical; no copia ilustrada del mundo.
Trabajo pendiente de aprobacion humana, sin commit final ni push. No inicia Game Design Pass.

## Presentacion y contratos

- `presentation/ValleyScene.jsx`: fondo del Valle real, cache de assetManifest y un renderer por pantalla. Un personaje central clonado con SkeletonUtils, Idle, drag/touch, flechas y botones; cambio de personaje sin cuatro escenas. Limpieza de renderer, recursos de terreno propios, mixers y texturas de huesos clonadas, sin liberar assets compartidos.
- `ValleyUI.jsx` y `valleyPresentation.css`: titulo tipografico, panel, botones y colores reutilizables. No nuevo framework ni logo ilustrado falso.
- LoginScreen, AdventureStart (ENTRY/CONFIRM_NEW/CHARACTER/INTRO) y HUD reutilizan esta identidad. Texto provisional de intro, perfiles, backend y confirmacion de reinicio conservados.
- get_users no entrega XP: no se inventa en perfiles. ENTRY/HUD muestran el total real cargado del perfil. Los avatares reales siguen siendo los stickers existentes.
- `ValleyLessonEntry.jsx`: preparacion comun de LESSON/PRACTICE/CHALLENGE/FINAL_CHALLENGE y secreto. Nombre, numero, notas, silencios y velocidad del catalogo real; evita duplicar numeros ya presentes en titulos. Secuencias invalidas no ofrecen preview.
- Preview no evaluado comparte `pianoTone.js`, frecuencia, solfeo y velocidad con PianoMagico. Solo abre audio por click, detiene timers/nodos al cerrar y pausa musica de mundo. No activa microfono ni otorga progreso.
- PianoStageView indica preparationComplete: omite solo el antiguo modal previo de la actividad embebida. Motor, evaluacion, teclado, canciones, microfono y resultado siguen existentes. El modo independiente conserva su preparacion anterior.
- Practice Station entra por el mismo contexto atomico de discovery; no hay otro store ni progreso duplicado. Cancelar o terminar vuelve con posicion/camara conservadas.

## Animaciones reales

Cada GLB contiene 76 clips. Verificados Idle, Walking_A, Running_A, Jump_Full_Short, Cheer y las siguientes acciones:

| Personaje | Q | E | Nodos de equipo encontrados |
| --- | --- | --- | --- |
| Knight | 1H_Melee_Attack_Slice_Horizontal | Block | 1H/2H_Sword, escudos |
| Mage | Spellcast_Raise | Spellcast_Shoot | 2H_Staff |
| Barbarian | Dualwield_Melee_Attack_Chop | 2H_Melee_Attack_Spin | 1H/2H_Axe, escudo |
| Rogue | 1H_Ranged_Shoot | Dodge_Backward | 1H/2H_Crossbow |

Son expresiones de una sola reproduccion, sin dano, objetivos, proyectiles, desplazamiento del jugador ni escritura en Adventure. Bloquean temporalmente movimiento/otra expresion y vuelven a Idle/Walk. E cerca de un cofre mantiene prioridad de interaccion. Fallback: Cheer / Jump_Full_Short, solo si existen. No nuevos modelos, armas ni animaciones artificiales.

## Despeje autorado

Se revisaron bounds nativos GLTF con transformaciones y rutas de todas las regiones. El radio de copa es una alerta conservadora, no una orden automatica de despejar todo. Solo ocho instancias cambiaron posicion XZ:

| Instancia | Antes | Despues |
| --- | --- | --- |
| forest-north-02 | -10,-52 | -10,-48 |
| forest-north-03 | -13,-54 | -13,-48 |
| forest-north-04 | 16,-53 | 24,-50 |
| forest-north-06 | -8,-54 | -9,-49 |
| forest-north-07 | -17,-53 | -21,-50 |
| forest-north-08 | 12.5,-56.5 | 15,-65 |
| junction-west-rock | -13,-57 | -12,-60 |
| river-north-tree | -32,-84 | -35.5,-84 |

Corrigen ramas nuevas de la bifurcacion, acceso secreto y borde del camino del Rio. No cambian terreno, rutas, reservas, escala, landmarks, cofres ni cantidades. Los tests originales de geografia congelada y barrido de camara siguen vigentes. No se movio el Arbol Maestro.

## Camara

Asistencia al caminar: diferencia angular corta, amortiguacion y limite 0.75 rad/s. Drag y zoom suspenden ayuda por 1.6 s; quieto no realinea. La base de movimiento permanece estable mientras se sostienen las mismas teclas para evitar un giro de realimentacion. Mantiene distancia, terreno y control manual existentes; no introduce colision fisica contra copas.
Una leccion pausada redibuja un frame al redimensionar sin avanzar animaciones/mundo. Telemetria DEV tolera carga en frio sin colliders disponibles.

## Verificacion

- Recorrido real: perfiles -> Nueva Aventura -> cuatro modelos/Idle/rotacion/Q/E -> intro -> Plaza -> Bosque -> cofre -> ejemplo -> piano -> cancelacion/retorno -> leccion completada con teclado virtual -> retorno al mismo cofre. La prueba en SOPHIA otorgo los 300 XP educativos reales de una leccion; no se inyectaron completions en esa partida.
- Recorridos de Rio, Montana y Gruta en fixture de QA aislado, con gates desbloqueados en memoria, sin API ni persistencia. Ruinas/Observatorio se recorrieron desde otro spawn de QA hasta el cofre final, sin solapamiento de colision ni errores de consola; no se presentan como un playthrough completo nuevo. Auxiliares y videos estan fuera del repositorio.
- Selector e intro a 390x844, drag y botones de accion; Lesson Entry movil sin overflow y fondo real incluso tras resize. No certifica telefono fisico ni microfono fisico.
- Misma Plaza, Mage, spawn, gates abiertos y viewport 1280x720: antes 319 draw calls / 285967 triangulos / 89-93 FPS; despues 319 / 285967 / 91-97 FPS. Muestras DEV en primer plano. FPS local variable, no promesa de mejora.
- Cobertura: 127 tests originales y 21 nuevos (148), sin debilitar checks previos. Incluye clips reales, Q/E/Idle, rotacion, camara/manual, despejes, datos y variantes de entrada, synth compartido y cancelacion.
- Validacion final: 148/148 tests, lint de componentes nuevos y pantallas de entrada sin errores, git diff --check correcto. Build exitoso (1805 modulos); conserva advertencia de bundle grande. No se hizo optimizacion general ni instalacion.
- Evidencia `presentation-pass-1.mp4`: 76 s; combina capturas de UI con dos grabaciones de canvas 3D en movimiento, sin audio. No es una grabacion continua de pantalla.

## Ampliacion autorizada del selector

El usuario solicito mostrar movimientos automaticamente, recuperar el quinto aventurero y elegir armas. Ranger usa el GLB existente de Characters/gltf y clips reales del rig Medium (Idle_A como Idle, locomocion, Throw y Jump_Full_Short). No tiene clips propios de disparo de arco; no se simula disparo ni combate. El esqueleto de jefe y Rogue_Hooded no se agregan como otros aventureros.

La demostracion alterna Q/E y ofrece pausa. Combinaciones visuales compatibles para cada personaje ocultan armas alternativas del clon; Ranger reutiliza arco/ballesta del paquete, unidos a sockets nativos. La eleccion se guarda localmente por perfil y personaje y se aplica al mundo; no es inventario ni progreso. La validacion avatarOnly existente amplia unicamente su rango de 1-4 a 1-5, sin modificar esquema, XP ni campos educativos.

Verificacion adicional: 158/158 tests, lint de componentes del selector y PHP sin errores de sintaxis, build exitoso. Permanece el aviso de bundle grande y Vite informa que la carga dinamica del manifest comparte el chunk existente. Probados cambio de armas, guardado real de Ranger, entrada al mundo y locomocion/expresion. SOPHIA vuelve a Mage tras la prueba, sin XP nuevos. La comprobacion de viewport de esta ampliacion permanecio en escritorio; movil fisico sigue pendiente.

## Pendientes

Aprobacion visual humana, pruebas en telefono y microfono fisicos, arte definitivo del logo/frames/HUD y colision completa de camara permanecen pendientes. Las composiciones son prototipos aprobados previamente, no escenas reconstruidas para igualar la ilustracion. No se completo la plantilla humana GAME_DESIGN_PLAYTEST_1.md.
