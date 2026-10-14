# Editor: comportamientos

Bloque 4 local, posterior al checkpoint desplegado 95b9c3e. No publicado ni desplegado automaticamente.

## Controles con efecto real

- Habitantes: activar/desactivar, saludo/mirada, radio de proximidad, gesto tras restauracion, actividades observadas, paseo de 2-20 puntos XZ y velocidad. El recorrido cerrado se muestra en amarillo al seleccionar el habitante. Moverlo traslada su recorrido; duplicarlo conserva el recorrido desplazado.
- Gestos usan RESIDENT_CLIPS y las animaciones compatibles existentes, no clips inventados. Una reaccion breve a completar region/actividad sigue prevaleciendo sobre el gesto habitual.
- Criaturas: quieto o explorar/perseguir, deteccion, retorno, velocidad, preparacion y pausa de ataque. Limites deliberadamente arcade, 1-3 impactos; sin stats RPG. El encuentro inicial de entrenamiento no acepta configuracion arcade personalizada.
- Mascotas: personalidad CALM/ENERGETIC/CURIOUS en configuracion, reutilizando follow, curiosidad y celebracion existentes. No nuevas animaciones ni IA duplicada.

Campos opcionales: resident.enabled, resident.behavior y worldAction.encounter. Ausencia conserva comportamiento anterior. PHP valida rangos, claves y gestos. El radio de retorno debe cubrir el radio de deteccion. Recorridos permanecen dentro de los limites actuales del Valle. No se garantiza que una ruta dibujada atraviese todos los obstaculos: comprobarla con Probar borrador; el movimiento real conserva colisiones.

## Verificacion

323 tests (321 src + 2 despliegue), lint admin/comportamientos y sintaxis PHP correctos. Build correcto con avisos conocidos de bundle/imports.

Panel local real: agregado y editado un tercer punto, modificada velocidad, trazado visible; sandbox confirmo LOOK_AT_PLAYER y WALK al alejarse. Cambios de prueba deshechos sin guardar/publicar y sin datos educativos. Navegador limitado a 1 FPS: prueba de estados, no certificacion de fluidez. Parametros arcade y entrenamiento verificados automaticamente; no se certifican todas las combinaciones visuales/movil/microfono fisico en este bloque.

No editor general de guiones, clips arbitrarios ni navegacion automatica de rutas. Siguiente bloque: presentacion (sonido, luces y encuadres), manteniendo proteccion de PianoMagico.
