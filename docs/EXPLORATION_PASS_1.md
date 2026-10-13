# Exploration Pass 1 - Secrets of the Valley

Estado: implementado, pendiente de aprobacion humana.

## Alcance

Nueve secretos autorados en espacios existentes: Bosque 2, Rio 2,
Montana 2, Ruinas 2 y Observatorio 1. Los dos de Bosque reutilizan
el rincon y mecanismo musical existentes. Gruta del Eco permanece intacta.

Fuente de posiciones y pistas: `src/game/world/composition/explorationSecrets.js`.
Capas aditivas reutilizan el materializador de composiciones, sin ampliar
terreno ni cambiar rutas principales. Las recompensas son Notas Perdidas;
no otorgan XP educativo, mascotas ni nuevos desbloqueos.

Las notas de secretos se revelan solo de cerca y despues de cumplir su
requisito (destructible o mecanismo cuando corresponde). La primera recogida
produce celebracion breve y reaccion de mascota. No entran en los intereses
automaticos de la mascota ni en el objetivo principal. El mapa muestra solo
descubrimientos realizados. La persistencia Adventure existente guarda notas
y deriva descubrimientos validados por perfil, sin duplicar recompensas.

## Verificacion realizada

- Suite completa `node --test`: 279 pruebas correctas, cero fallos.
- `npm run build`: correcto. Persisten warnings previos de imports JSON,
  import mixto de assetManifest y tamano del bundle.
- `git diff --check`: correcto; avisos de conversion LF/CRLF solamente.
- Recorrido real con perfil QA GAMEPLAY CONTENT 1: ambos secretos de Rio,
  ambos de Ruinas y ambos de Montana. Bosque ya estaba descubierto.
- Ruinas: error, reintento MI/DO/SOL, puerta elevada y recompensa recogida.
- Recarga real: 32 notas, ocho secretos encontrados y XP 7100 conservados.
  Observatorio no aparece en el mapa al no haber sido descubierto.
- Mascota presente durante recorrido y reacciones; enemigos existentes siguen
  operando. Se alejo el primer secreto de Montana del area de persecucion.
- Muestra local de Montana en primer plano: 144 FPS, 413 draw calls,
  359481 triangulos. Es una muestra puntual, no un promedio garantizado.

## Evidencia real

Videos sin escenas sintetizadas, separados por region:

- `C:/Users/hecto/Documents/Codex/Valle-Exploration-Pass-1-Rio.mp4`
- `C:/Users/hecto/Documents/Codex/Valle-Exploration-Pass-1-Montana.mp4`
- Captura tras recarga: `C:/Users/hecto/Documents/Codex/Valle-Exploration-Pass-1-mapa.png`

La grabacion de Ruinas se perdio por una recarga; no se presenta como video
entregado. Sus interacciones se comprobaron en ejecucion.

## Pendientes y limites

El secreto de Observatorio tiene validacion de datos/assets/ubicacion, pero
no recorrido real: el perfil QA aun no completa Ruinas. No se altero su
progresion para saltar el requisito. No se repitio PianoMagico ni QA movil
en esta pasada. La facilidad de encontrar secretos sin conocerlos requiere
playtest humano; el recorrido autorado no demuestra descubribilidad ciega.

Sin commit, staging, push ni deploy. Detencion para revision humana.
