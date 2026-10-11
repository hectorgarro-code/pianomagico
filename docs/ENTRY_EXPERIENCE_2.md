# Entry Experience 2

Checkpoint inicial: `cb83961 - Checkpoint before Entry Experience 2`.
Implementacion local. Sin push, deploy ni commit final.
El documento del usuario describe Gameplay Content Build 1 como fase futura; ese bloque ya existe y se conserva intacto como funcionalidad. Esta tarea solo modifica entrada y reutilizacion de presentacion.

## Flujo Y Arquitectura

TITLE -> PROFILES -> perfil existente: RESUME -> WORLD.
TITLE -> PROFILES -> perfil sin Adventure: CHARACTER -> INTRO -> PLAZA.
WORLD -> EXIT -> PROFILES; PROFILES -> BACK -> TITLE; reload -> TITLE.

- MusicSuite mantiene perfiles y seleccion; `entryExperience.js` declara el estado de entrada y deriva resumen desde Adventure/getValleyProgress.
- `SharedWorldProvider` mantiene una sola escena/renderer World3DView. GameApp publica configuracion y callbacks de sesion mediante SharedWorld; no construye otro mundo. Cambiar perfil reinicia solo runtime de sesion/pose, no renderer ni geometria del Valle.
- TitleScreen muestra titulo, Una aventura musical, Entrar al Valle y controles de sonido/configuracion. Sin perfil, XP, objetivos, mapa, cofres, acciones ni debug.
- World3DView usa tres tomas bajas autoradas de Plaza/entrada/Bosque, movimientos lentos y transiciones suaves. No muestra Gruta ni final. Input reinicia el attract mode; respeta reduced-motion. Mobile usa posiciones y FOV propios.
- Motas de luz moderadas; terreno, vegetacion, arquitectura e iluminacion existentes permanecen sin cambios.
- Perfil existente muestra personaje real y mascota equipada. ProfilePortraits utiliza un solo renderer scissored para todos los perfiles y clones de assets cacheados. Perfil sin Adventure muestra identidad neutra, no un personaje inventado.
- Resume muestra region/objetivo reales, fraccion de regiones principales completadas (Gruta excluida), Continuar dominante, Personalizar, Nueva Adventure con confirmacion y Volver. No hay nuevo store de progreso.
- Selector mantiene cinco personajes reales, Idle/demostracion y rotacion manual. AssetStage muestra personaje aislado sobre el mismo Valle; no copia la escena.
- Intro conserva narrativa breve y panel claro fantasy sobre mundo vivo, no fondo negro. Las transiciones no recargan pagina.
- Personalizar en resume reutiliza AdventurerMenu/PET Collection y avatarOnly. No reinicia Adventure ni progreso educativo.

## Audio Y Responsive

La pista local existente usa WorldMusic y sus preferencias/volumen/fades. En portada permanece pausada antes de interaccion. Entrar al Valle envia un evento sincrono de desbloqueo desde el gesto del usuario; no crea ni modifica AudioContext de piano ni activa microfono. La musica de entrada se pausa al regresar a portada y conserva mute/volumen.

Desktop y mobile tienen layout y camara especificos. Botones nativos permiten click/Enter/Space; focus visible y controles tactiles. Sonido se coloca arriba en perfiles para no tapar tarjetas. Viewport real probado: 390x844; no certifica dispositivo fisico.

## Verificacion

- 193/193 tests pasan: todos los existentes mas entrada/reentrada, progreso derivado, cameras/reduced-motion, contratos de caches, audio seguro, SSR de portada/resume y mobile.
- Build pasa; mantiene avisos conocidos de bundle grande e imports mixtos/JSON del catalogo. No se instalaron dependencias.
- Caso B normal con BASTIAN: portada -> perfiles -> resumen (2/6 regiones) -> mundo con Bosque completado y 36800 XP -> salir a perfiles.
- Caso C: cambiar a QA GAMEPLAY CONTENT 1 -> resumen (4/6 regiones) -> mundo con Knight, mascota Ciervo del Valle, cuatro minijuegos y 5900 XP conservados.
- UUID DOM del renderer identico desde portada hasta ambos mundos; un canvas durante gameplay. Previews no cargan WorldGenerator.
- Caso D: Volver desde perfiles -> portada. Caso E: reload -> portada.
- Perfil sin Adventure (SOPHIA): entra directamente al selector; rotacion real probada en mobile y salida sin guardar personaje ni iniciar aventura.
- Caso A COMPLETO pendiente: se solicito autorizacion para crear QA ENTRY EXPERIENCE 2 solo en base local. La aprobacion automatica rechazo el POST de creacion; no se uso otro metodo para eludirla ni se inicio/reset una Adventure humana para completar la prueba.
- Audio DOM: pausado antes de Enter, reproduciendose despues; entrada por Enter probada.
- Ultima recarga sin errores de consola. Capturas de escritorio/movil verificadas visualmente y con muestras de pixeles no uniformes; viewport de prueba restaurado al terminar.
- Performance: muestra aproximada de portada 123 FPS / 246 draw calls / 245530 triangulos; mundo QA con mascota 108 FPS / 465 calls / 360834 triangulos. No es benchmark sostenido.

## Evidencia

Secuencia de capturas reales, no video continuo. Carpeta fuera de Git:
`C:/Users/hecto/.codex/visualizations/2026/10/05/01a10d80-aa2e-7132-ae04-64b3b6a8fbbf/entry-experience-2/`.

| Archivo | Verificacion |
| --- | --- |
| 01-title.jpg | Portada y mundo real |
| 02-attract-camera.jpg | Cambio real entre tomas autoradas |
| 03-profiles.jpg | Perfiles con personajes reales y mascota secundaria |
| 04-bastian-resume.jpg | Regreso, region, objetivo y Continue |
| 05-bastian-world.jpg | Progreso intacto y mismo renderer |
| 06-world-exit-profiles.jpg | Salir no obliga a volver a portada |
| 07-resume-character-pet.jpg | Otro perfil y su mascota |
| 08-qa-world-pet.jpg | Regreso al mundo con personaje/PET propio |
| 09-back-title.jpg | Volver desde perfiles |
| 10-mobile-title.jpg | Camara y boton verticales |
| 11-mobile-profiles.jpg | Tarjetas responsive |
| 12-mobile-character.jpg | Selector 3D real |
| 13-mobile-character-rotation.jpg | Rotacion manual |
| 14-reload-title.jpg | Recarga vuelve a portada sin seleccionar perfil |

## Pendientes

Completar Caso A y evidencia de intro/llegada a Plaza con perfil de QA autorizado antes de cerrar la validacion. Apariencia es adaptacion del mockup a assets reales, no replica de la ilustracion. No se genero otro paisaje ni assets nuevos. Sigue cargandose el mundo completo una sola vez; lazy-loading regional, GPU/movil fisico y pantalla de carga detallada quedan fuera del bloque. Persistencia de posicion exacta al recargar mantiene el contrato previo, no se inventa una nueva.

No iniciar otra fase ni hacer polish general.
