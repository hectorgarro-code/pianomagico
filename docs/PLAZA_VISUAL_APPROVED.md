# Plaza de las Notas: referencia visual aprobada

Aprobacion humana recibida el 2026-10-06. Hito:
`Plaza de las Notas - Visual vertical slice approved`.
Baseline a preservar: `f761a8d`.

## Decisiones congeladas
- Composicion autorada de 61 instancias KayKit, sin posiciones aleatorias.
- Centro enlosado plano, despeje de 9 m y pabellon abierto de cuatro columnas
  como foco principal. Las losas forman un marco conectado y un pavimento continuo.
- Cofre educativo lateral, separado del recorrido principal; arquitectura y
  vegetacion mantienen jerarquia respecto al personaje.
- Lomas y agrupaciones vegetales enmarcan el espacio; las masas principales
  prevalecen sobre el microdetalle. El claro central permanece abierto.
- Sendero coloreado sobre el mismo terreno, bordes suaves y extremo fundido
  con cesped. Salida noreste [9,-17], final de trazado [10,-19.5].
- Camara orbital con distancia base 18 m, pitch 0.26 y lookAhead 4 m.
- Atmosfera lineal entre 32 y 55 m para integrar el soporte distante al cielo,
  manteniendo legibles los elementos cercanos. No sustituye el diseno futuro
  de la continuidad hacia Bosque.

## Evidencia conservada
Capturas JPEG de la revision real del componente World3DView, salvo la vista
elevada que pertenece a la herramienta de comprobacion del generador.
La barra superior es del laboratorio local, no del juego final.

- [Inicio](references/plaza-approved/plaza-5f-final-inicio.jpg)
- [Aproximacion](references/plaza-approved/plaza-5f-final-aproximacion.jpg)
- [Centro](references/plaza-approved/plaza-5f-final-centro.jpg)
- [Estacion](references/plaza-approved/plaza-5f-final-estacion.jpg)
- [Salida recorrida](references/plaza-approved/plaza-5f-final-salida-recorrido.jpg)
- [Vista de regreso](references/plaza-approved/plaza-5f-final-regreso.jpg)
- [Composicion elevada](references/plaza-approved/plaza-5f-final-elevada.jpg)

## Verificacion y deuda no bloqueante
Seis pruebas locales de composicion pasan: contrato, dependencias GLTF,
despejes, continuidad del soporte, pendiente final y estructura del pabellon.
Build Vite correcto; persiste el aviso conocido de bundle mayor de 500 kB.
Recorrido de escritorio e interaccion del cofre verificados en laboratorio;
esto NO verifica la integracion educativa real ni la persistencia.

Pendientes, sin resolver en este hito:
- Mundo -> piano -> regreso con perfil real, incluida conservacion de posicion.
- Integracion GameApp/PianoMagico y problemas previamente detectados.
- Colisiones con props, limites y obstrucciones de camara.
- Controles tactiles y validacion visual movil; el navegador de revision no
  aplico el cambio de viewport solicitado, conservando 1280x720.
- Persistencia de progreso del mundo (cofres, misiones, zonas y posicion).
- Gestion de recursos compartidos Three.js y presupuesto de renderizado.

No se considera aprobado el antiguo mundo procedural. No modificar la
estetica principal de Plaza sin autorizacion; se permiten correcciones de
bugs, integracion educativa, rendimiento, continuidad vecina y camara/colisiones.
Bosque-A requiere aprobacion de su diseno antes de implementar. Piano,
audio, microfono, perfiles y backend no se modifican para esta fase.
