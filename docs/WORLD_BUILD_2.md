# WORLD BUILD 2: prototipo completo

Autorizacion humana: construir Gruta, Ruinas, Observatorio y final en un bloque.
Checkpoint previo: `4331d68 - Valle river mountain and grotto access prototype`.
La aprobacion de BUILD 1 es jugable, no visual definitiva. No polish.

## Decisiones de composicion
- Gruta: pequeno recinto rocoso abierto arriba para la camara actual; altar y cofre dorado. Entrada existente conservada; acceso sur esquiva los peñascos.
- Ruinas: dos caminos confluyen desde las salidas existentes. Cinco pares de columnas y cinco lineas de pavimento evocan el pentagrama. Pasillo central y dos desvíos laterales.
- Observatorio: columnata circular ABIERTA de seis pilares, hueco de llegada sur, sin muro trasero ni techo. Resuelve explicitamente la discrepancia circular/semicircular del Master Plan a favor de lectura y camara.
- Coordenadas preliminares del World Blueprint no coinciden con BUILD 1. Se mantienen sus identidades, no sus centros aproximados: Ruinas [0,-98], Observatorio [0,-128], Gruta [-33,-54]. El soporte norte llega a -145, necesario para alojar el final; Plaza/Bosque y rutas aprobadas permanecen intactos. No es expansion arbitraria para ocultar horizontes.
- Ruinas a 1.8m; ascenso de 16m termina en cumbre de 8.5m. Composiciones separadas, sin posiciones aleatorias.
- Dos luces locales sin sombras. El sol existente sigue controlando sombras.

## Gameplay y autoridad
- Ruinas: dos Lesson Chests (11: Pin Pon El Lavado; 12: Pin Pon Final) y Challenge (13: Pin Pon Completo).
- Observatorio: Challenge 35, Himno a la Alegria. Todos los IDs verificados contra el catalogo local real; sin curriculo nuevo.
- Challenge reutiliza el mismo PianoStageView/PianoMagico y sus resultados reales; no añade evaluacion musical nueva.
- Gruta: Secret Reward `echo-grotto-keepsake`, requiere descubrimiento fisico y se reclama una sola vez. Sin XP, monedas, motor musical ni requisito para terminar el Valle.
- Adventure sigue siendo autoridad. Completions validadas restauran hechos de Challenges/Secret Reward en schema 2, conservando la clave de persistencia y los datos educativos.
- Gates `routes_to_ruins` y `ruins_to_observatory`: assets de puertas visibles cuando LOCKED, con colliders del mismo estado derivado. Se retiran al quedar AVAILABLE/OPEN. Los requisitos de actividades siguen vigentes aunque el jugador rodee una barrera por terreno abierto.
- Final aparece tras resultado real y retorno al mundo. Continuar explorando cierra la pantalla sin borrar progreso ni contexto. Continuar una partida terminada no vuelve a mostrarla; Nueva Aventura reinicia solo Adventure.

## Alcance y deuda
No backend Adventure definitivo, inventario, NPC, economia, optimizacion de bundle ni rediseño de camara. Agua y paisajismo siguen provisionales. La Gruta usa techo abierto por limitacion de camara; las barreras controlan accesos principales, no crean un muro invisible perimetral. Posicion exacta sigue sin persistirse. Microfono fisico y movil final fuera de QA.

## Validacion real: 2026-10-09
- Chrome, perfil BASTIAN, Adventure local limpio: personaje Barbarian, intro, Plaza, tres actividades de Bosque, tres de Rio, secreto de Gruta, tres de Montana, dos voces y Challenge de Ruinas, ascenso y Challenge final 35.
- Todas las completions provienen del teclado virtual y resultados reales de PianoMagico. El auxiliar externo mueve mediante WASD; solo reanudo en puente y primer cofre de Montana ya recorridos tras recargas de QA. Nunca escribio resultados ni claims artificiales.
- Cancelar una actividad incompleta no la completa. Continuar explorando conserva posicion y progreso; entrar y cancelar una practica posterior tampoco reinicia el final.
- Secreto reclamado una sola vez: XP antes/despues 29200. El resultado final llevo el XP educativo a 34100; cerrar el final no agrego XP Adventure.
- Recarga y Continuar con el codigo definitivo restauraron las 14 entries completadas, incluido el secreto, sin repetir la pantalla final. Adventure es local por perfil Y navegador; Chrome no sincroniza este estado con el navegador integrado.
- Un bloqueo detectado en el puente se corrigio moviendo exclusivamente la pared sur nueva de Gruta a z=-59.5. Prueba de regresion protege los caminos de Rio/Montana. Suelos y adornos pequenos no bloquean; outlines y contador DEV reflejan gates activos.
- 98/98 tests, build exitoso y lint focalizado sin errores. Warning de bundle principal: aproximadamente 1.14 MB antes de gzip, pendiente de optimizacion futura.
- Escena final cargada sin errores de consola: 166 colliders activos tras abrir ambas puertas. Muestras: Observatorio 199 draw calls / 252718 triangulos; Montana 251 / 269436. FPS en segundo plano limitado por el navegador a 1: no constituye benchmark de rendimiento del producto. Luces nuevas sin sombras.
- Evidencia externa al repositorio: `full-valley-proof.json`, 22 capturas PNG y `full-valley-playthrough.webm` (47.19s). El video es un RESUMEN de capturas reales, no una grabacion continua. Ambos ordenes de rutas y final sin recompensa de Gruta estan cubiertos por tests, no por un segundo playthrough manual.
