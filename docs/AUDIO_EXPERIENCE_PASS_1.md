# Audio Experience Pass 1

Estado: implementado, pendiente de aprobacion auditiva humana. Sin commit/push.

- `valleySoundscape.js`: bus WebAudio propio, desbloqueado por gesto; textura de aire sintetizada y filtrada, no grabaciones de naturaleza. Paletas sutiles para Plaza/Bosque/Rio/Montana/Gruta/Ruinas/Observatorio.
- Capas 0/1/2/3 derivadas de requisitos educativos validados del Adventure existente; no progreso nuevo. Pulsos graves, armonia y quinta se agregan gradualmente. La pista existente conserva su identidad y varia discretamente de nivel; no son stems de una nueva composicion.
- Preparacion de leccion: fade de 200 ms; PianoMagico, captura activa y pestaña oculta: silencio inmediato. Retorno: fade de 650 ms. Foco de mecanismo musical: ambiente detenido para escuchar las notas.
- Todos los efectos del mundo usan el volumen/silencio existente. Sin captura automatica, modificaciones al store del microfono, Soundfont, worklets ni evaluacion.
- Notas Perdidas: notas breves; secretos/recompensas/cofres: motivos diferenciados. Enemigo golpeado/derrotado y madera/piedra rota usan archivos locales distintos. Puertas y restauracion conservan sus eventos reales. Sin repetir recompensas ni alterar XP.
- Posicion: notas del mecanismo y secretos usan panorama limitado a +/-0.6 y atenuacion XZ hasta 18 m. Puertas/golpes conservan atenuacion por distancia. No se cambian sockets, colisiones ni gameplay.
- Contextos propios, limpieza al desmontar, maximo 4 voces sinteticas por bus y cooldown de motivos. Se retiro el antiguo sonido ambiental periodico de restauracion para no superponer dos sistemas.

## QA

Verificado: suite automatizada, compilacion, carga sin errores, cambio Plaza/Bosque, cofre -> teclado virtual -> resultado valido -> retorno a misma posicion, mute, volumen 0/100/restaurado a 20, panel responsive 390x844.

Pendiente: escucha y balance humano en todas las regiones; piano fisico/microfono real; prueba de cambio de pestaña real; dispositivo movil real (viewport responsive no certifica audio iOS/Android). Las pruebas automatizadas de suspension no equivalen a estas verificaciones de hardware.

El perfil QA conserva su Adventure; no se reinicio ningun perfil. Probar con auriculares primero; la captura acustica siempre tiene prioridad sobre ambiente y efectos del Valle.
