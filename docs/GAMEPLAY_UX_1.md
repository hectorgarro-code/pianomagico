# GAMEPLAY UX 1

Checkpoint previo: `9203684 - Full Valley playable prototype`.
Implementacion pendiente de aprobacion humana; sin commit final ni push.

## Contrato

- `navigation/valleyNavigation.js` deriva mapa y objetivo desde Adventure, valleyProgression y las composiciones autoradas. No introduce progreso ni persistencia nueva.
- `worldToMap` transforma X/Z a X/Y con escala uniforme, norte arriba y limites derivados de los caminos reales. El marcador conserva posicion y orientacion.
- `WorldNavigation.jsx` presenta minimapa local de escritorio, mapa ampliado con M/click y cierre con ESC/M/X. El dialogo bloquea movimiento e interaccion sin restaurar ni alterar la posicion.
- En movil se reemplaza el minimapa por un boton; el mapa ocupa pantalla completa. Orientacion activada por defecto y desactivable desde el mapa.
- Solo aparecen regiones descubiertas y sus cofres; Gruta y sus caminos quedan completamente ocultos hasta descubrirla. Nunca es objetivo principal.
- El resolver utiliza currentObjective: siguiente cofre disponible, bifurcacion con ambas rutas validas, ruta restante, entrada de Ruinas/Observatorio y desafio final. No decide una ruta correcta ni implementa pathfinding.
- La flecha usa orientacion de camara; se atenua cerca del objetivo proyectado en pantalla y desaparece a distancia de interaccion.
- `world/chestSignals.js` comparte textura y materiales: Sprite de glow y Points de 12 particulas por objeto, sin PointLight adicional. AVAILABLE activo, LOCKED muy tenue, COMPLETED residual sin particulas; variante secreta reutilizada.
- Efectos ocultos a mas de 40 m, actualizacion reducida a distancia y liberacion de recursos propios sin disponer los modelos compartidos.

## Verificacion realizada

121 tests: 98 existentes y 23 nuevos para transformacion, discovery, marcadores, objetivos, ambas decisiones de ruta, Gruta y estados/recursos de efectos. Build satisfactorio; persiste advertencia previa de bundle grande. Lint de los archivos nuevos satisfactorio; World3DView conserva avisos preexistentes.

Adventure limpia de TIZIANO, sin Debug World: Plaza -> Bosque (3 resultados reales) -> bifurcacion -> Gruta descubierta -> Rio (3) -> Montana (3) -> Ruinas (3) -> Observatorio. Las 12 actividades se resolvieron con teclado virtual y retornaron al mundo conservando contexto. Al llegar, desafio final AVAILABLE y objetivo actualizado. No se repitio el desafio final ni se reclamo la recompensa opcional.

Mapa oculto/descubierto de Gruta, toggle, M/ESC/X y bloqueo de movimiento comprobados. Mapa movil revisado a 390x844 antes y despues de descubrir regiones. Auxiliares de recorrido y evidencia viven fuera del repositorio; no forman parte del producto.

## Coste local

Misma Plaza, Mage, spawn y viewport 1536x695. Cinco muestras distintas por version, fechadas y en primer plano; antes desde codigo del checkpoint, despues desde fuente actual:

| Medida | Antes | Despues |
| --- | ---: | ---: |
| Draw calls | 321 | 324 |
| Triangulos | 287973 | 287977 |
| FPS aproximados | 47-48 | 72 |
| Colliders | 168 | 168 |

Incremento observado: 3 draw calls y 4 triangulos en esa vista. Los FPS no demuestran una mejora garantizada: sesiones, cache y carga local varian. Se descartaron muestras en segundo plano. Telemetria DOM solo en DEV, sin activar Debug World.

## Evidencia y limites

Capturas, datos de recorrido, muestras y `gameplay-ux-1.webm` en la carpeta externa de evidencias de este chat. El video es una secuencia de capturas reales, no grabacion continua ni certificacion de animacion. Los cambios de posicion, resultado, objetivo y discovery corresponden a acciones reales.

El mapa es esquematico, no arte final; la orientacion es aproximada y no evita obstaculos. La proyeccion cercana no verifica oclusion completa contra objetos. No se certifican microfono fisico, controles tactiles ni rendimiento de dispositivos moviles. Adventure conserva persistencia local por perfil/origen; posicion exacta no persiste al recargar. No se modificaron piano, backend, progresion ni composiciones.
