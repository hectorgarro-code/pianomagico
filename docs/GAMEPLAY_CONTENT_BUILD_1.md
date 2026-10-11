# Gameplay Content Build 1

Estado: prototipo funcional implementado localmente, pendiente de playtest humano.
Checkpoint inicial: `78ba3ac - Checkpoint before Gameplay Content Build 1`.
Sin commit final, push ni despliegue de este bloque.

## Arquitectura

- `src/game/gameplay/gameplayContent.js`: contenido inicial autorado, mascotas, recompensas, targets, minijuegos y puertas. No decide posiciones aleatorias.
- `gameplayState.js`: impactos, ventanas activas, recompensas unicas, equipamiento de mascota, seguimiento y persistencia separada por perfil.
- `WorldGameplay.js`: materializa modelos reales, colliders, criaturas, reacciones, particulas, puertas y mascota. Reutiliza GLTF cache, SkeletonUtils y AnimationMixer; suspende IA lejana.
- `AssetStage.jsx`: preview 3D compartido por panel/coleccion, no un renderer por mascota.
- `AdventurerMenu.jsx`: continuar, personaje/mascota, armas, coleccion, mapa, configuracion y salida. ESC/TAB y boton del mundo.
- `ValleyActivityResult.jsx`: resultado exclusivo de actividades iniciadas desde Valle, XP educativo real y celebracion PET con Equipar ahora. PianoMagico independiente conserva su resultado anterior.
- `minigameEngine.js` / `MinigameView.jsx`: tres motores reutilizables y una vista; sin nueva infraestructura educativa.
- GameApp coordina estas vistas y mantiene el mundo pausado durante actividades/paneles. Cambiar avatar/equipamiento recarga solo el personaje, no reconstruye Adventure ni vuelve a su spawn.

## World Actions Y Contenido

Q/E usan la animacion equipada, ventana activa y volumen frontal con altura, alcance y orientacion. Cada accion puede impactar una sola vez a cada target. Bloqueo, esquiva y otras acciones defensivas no causan impactos.

Destructibles: barriles reales, 1-3 golpes, shake, particulas musicales, desaparicion y retiro de collider. Criaturas: los cuatro Skeleton auditados (Minion, Warrior, Rogue, Mage), 2-3 golpes, estados idle/wander/notice/approach/action/hit/defeated; accion cercana visual y pequeno empujon. Usan clips externos reales, incluidos Idle_A, Walking_A, Hit_A y Death_A; no se presuponen clips embebidos en sus GLB.

| Region | Destructibles | Criaturas | Desafio / puerta |
| --- | ---: | ---: | --- |
| Plaza | 1 | 0 | Ninguno |
| Bosque | 3 | 2 | Cofres educativos existentes |
| Rio | 4 | 3 | Rhythm |
| Montana | 4 | 3 | Sequence |
| Gruta | 1 | 1 | Sequence opcional |
| Ruinas | 3 | 2 | Note Recognition |
| Observatorio | 0 | 0 | Final existente, sin saturacion |

Total: 16 destructibles, 11 criaturas, 4 minijuegos y 4 puertas. Geografia y composiciones aprobadas conservadas.

## Mascotas Y Personalizacion

24 mascotas reales del catalogo, ocho recompensas iniciales; las otras 16 permanecen bloqueadas. Contrato: actividad -> rewardId -> definicion PET -> petId. No entrega XP adicional.

| Mascota | Recompensa |
| --- | --- |
| Elefante Melodia | Bosque, cofre 01 |
| Gato Magico | Bosque, cofre 03 |
| Perrito Sol | Rio, cofre 03 |
| Abeja Nota | Montana, cofre 03 |
| Conejo Armonia | Rhythm del Rio |
| Pajaro Do | Sequence de Montana |
| Panda del Eco | Recompensa secreta de Gruta |
| Ciervo del Valle | Note Recognition de Ruinas |

Coleccion con modelos reales desbloqueados, nombres, estado equipado y bloqueados. Mascota acompanante sin collider, dano ni autoridad sobre cofres/progreso; idle/walk segun clips del pack y reposicionamiento si queda lejos o trabada.

Cambio de personaje durante Adventure conserva posicion, orientacion, camara, cofres, regiones, minijuegos y datos educativos. Mantiene tambien Ranger, el quinto personaje real existente. Armas/habilidades reutilizan equipamiento, attachments y acciones existentes, sin inventario RPG ni modelos inventados.

## Admin Y Persistencia

Admin permite PET/name/asset/enabled, rewards, targets con placement y 1-3 golpes, comportamiento, minijuegos/configuracion/reward y puertas/requirements. PHP valida categorias reales, referencias, placement y limites. Contenido antiguo se actualiza en memoria sin sobrescribir configuraciones existentes; guardar es una accion explicita. Se probo guardado LOCAL, revision 2; produccion no fue modificada.

Avatar actual conserva el endpoint avatarOnly existente. Mascotas, mascota equipada, recompensas unicas y minijuegos usan localStorage separado por perfil (`valle-gameplay-v1-user-*`). Adventure y progreso educativo mantienen sus autoridades existentes. No hay sincronizacion PET/minijuegos entre dispositivos. Nueva Adventure reinicia minijuegos, no coleccion ni XP. Barriles y criaturas comunes reaparecen al cargar otra sesion. Posicion exacta al reabrir sigue sin persistirse, conforme al contrato previo.

## Validacion Realizada

- 186/186 tests pasan, incluidos impactos/miss/unico, targets, recompensas, equipamiento, persistencia, follower, compatibilidad, minijuegos y validacion PHP (42 comprobaciones).
- Build Vite pasa. Se mantienen avisos conocidos de bundle grande/imports mixtos; no se instalaron dependencias.
- Perfil local exclusivo `QA GAMEPLAY CONTENT 1`: entrada normal, cambio Knight/Mage sin reset, armas reales, destructible, derrota Skeleton, nueve lecciones reales con teclado virtual, resultados Valle y ocho mascotas obtenidas.
- Cuatro minijuegos completados desde el mundo; fracaso/reintento de Sequence, puertas cerradas/abiertas, secreto de Gruta, Equipar ahora y Continuar sin equipar.
- Recarga normal conserva personaje, ocho mascotas, equipada, Adventure y cuatro minijuegos. Dos cambios de personaje conservan pose/camara y XP real; total educativo observado 5900 XP.
- Menu -> mapa -> cerrar funciona. Se verificaron vistas de escritorio y viewport 390x844, previews no vacios y botones de accion. No certifica dispositivo movil fisico ni microfono.
- Ultima comprobacion sin overlay de errores. La consola conserva un aviso historico de HMR durante una edicion intermedia, corregida antes del build final.

## Performance

Muestras aproximadas de un segundo, navegador en primer plano, equipo actual; no benchmark sostenido ni garantia movil.

| Escena | FPS | Draw calls | Triangulos | Criaturas activas |
| --- | ---: | ---: | ---: | ---: |
| Rio con mascota | 125 | 324 | 308264 | 3 |
| Ruinas con mascota | 119-127 | 391-400 | 337946-340682 | 3 |

Runtime de gameplay: 12 mixers con las 11 criaturas y una mascota, mas un mixer del personaje (13 en total). Preview usa un renderer compartido y el mundo queda pausado mientras se abre. IA lejana no se actualiza innecesariamente.

## Evidencia Y Deudas

Evidencia fuera del repositorio:
`C:/Users/hecto/.codex/visualizations/2026/10/05/01a10d80-aa2e-7132-ae04-64b3b6a8fbbf/gameplay-content-1/`

`Gameplay-Content-Build-1.mp4`: H.264, 1280x720, 166.58 segundos, aproximadamente 16.7 MiB. Montaje de 833 capturas del recorrido real; no grabacion continua ni prueba de sincronizacion de audio. Incluye navegacion, acciones, criatura, lecciones/resultados, mascotas, minijuegos y puertas. Capturas adicionales: collection.png, mobile-collection.png, customization.png y mobile-actions.png.

- Distribucion, dificultad, duracion y estetica son iniciales. Sequence/Recognition pueden terminar en menos de 15 segundos para un jugador rapido; objetivo 15-45 segundos pendiente de playtest, sin demoras artificiales.
- Puertas son obstaculos locales, no paredes globales; puede ser posible rodear algunas. No se redisenaron terrenos para impedirlo.
- Persistencia local no equivale a seguridad/sincronizacion de servidor. No hay combate RPG, HP, muerte ni economia.
- Requisitos de puertas tienen validacion de referencias y autorreferencia, no deteccion general de ciclos entre multiples puertas.
- Camara contra props y rendimiento sostenido/movil requieren playtest; no se certifica microfono fisico ni final completo del Observatorio en este bloque.
- Carpeta preexistente sin seguimiento `public/models/kenney_cartography-pack/` permanece intacta, sin incorporarla al bloque.

Detener aqui. No iniciar Gameplay Content Build 2 ni polish sin autorizacion humana.
