# Companion Pass 1

Implementacion pendiente de aprobacion humana. Sin commit ni push.

- Estados transitorios: FOLLOW, IDLE, RUN, LOOK_AT_PLAYER, CELEBRATE y CURIOUS.
- Temperamentos ENERGETIC, CALM y CURIOUS definidos en companionBehavior.js por ID real del catalogo.
- Solo clips Kenney existentes: idle, walk, run, dance, gesture-positive y fallback static. No hay sleep compatible: no se inventa.
- Seguimiento lateral con umbrales distintos para iniciar/parar, giro amortiguado y terreno existente.
- Recuperacion a distancia extrema o bloqueo prolongado; destinos separados de escenario, jugador, NPC y enemigos.
- Curiosidad acotada e interrumpida al caminar. Nunca dirige hacia Notas Perdidas secretas ni objetos ocultos. Cofres autonomos: practica y lecciones ya completadas.
- Notas, secretos descubiertos, enemigos derrotados y resultados educativos validados disparan reacciones. La celebracion educativa espera el retorno activo al mundo.
- F o icono de huella: saludo con gesto y particulas, sin menu ni audio nuevo. Q/E conservan su funcion.
- Coleccion/equipo siguen usando persistencia existente por perfil. No se desbloquean mascotas para QA.

## Validacion

Pruebas automatizadas: cinco GLB reales, clips exactos, seguimiento/reposo/carrera, curiosidad, exclusion de secretos, recuperacion, cambios asincronos, limpieza, recompensa/persistencia y regresion de encuentros.

Prueba real con perfil QA GAMEPLAY CONTENT 1: Panda, Abeja, Conejo, Gato y Ciervo; seguimiento, terreno, saludo, cambios de mascota, recarga, recogida de Nota Perdida junto al NPC y cofre 01 -> tres notas reales de piano -> resultado guardado -> regreso al mundo. La practica agrego solamente los 300 XP educativos otorgados por PianoMagico. Control de mascota separado del contador de notas; vista revisada en escritorio y a 390x844.

Video real del canvas: C:/Users/hecto/Documents/Codex/Valle-Companion-Pass-1.mp4. No es una grabacion del HUD ni de la pantalla de piano; la escena queda pausada durante menus/actividad.

Recuperacion extrema y reacciones con enemigos se verifican tambien en runtime automatizado; no equivalen a certificacion visual humana de todos los encuentros. No se valido microfono fisico.
