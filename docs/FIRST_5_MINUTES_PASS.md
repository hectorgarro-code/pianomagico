# First 5 Minutes Pass

Estado: implementacion y recorrido funcional verificados; video continuo real guardado. Pendiente aprobacion humana. Sin commit ni push.

## Recorrido autorado

Spawn de Plaza aprobado -> nota visible lateral delante -> caja de un golpe -> nota liberada -> Skeleton Minion de dos impactos -> cofre de Plaza -> actividad existente ID 1 -> resultado educativo validado -> elefante -> retorno, apertura fisica, celebracion y luces hacia Bosque.

No se cambiaron terreno, vegetacion, evaluacion musical, curriculo ni backend. Los dos encuentros iniciales son una excepcion explicita y localizada al despeje central de Plaza, solicitada para este pase. No se extiende esa excepcion al resto del Valle.

`firstMinutes.js` deriva etapas de hitos y hechos Toy existentes. START_ADVENTURE agrega el marcador solamente si la Adventure es realmente nueva. Continue de aventuras anteriores no activa el recorrido. Las ayudas de WASD se retiran al desplazarse; Q se muestra dentro del alcance de caja/enemigo; E solamente en el cofre. La asistencia de orientacion de Q se limita a estos dos blancos iniciales. Hay flechas tactiles equivalentes.

El Minion se aproxima lentamente y espera el primer golpe del jugador antes de atacar. Su reaccion permite practicar sin el retroceso grande de enemigos normales. No se agregan vidas, estadisticas o combate RPG.

La mascota requiere el resultado real existente, performance validada para ese perfil/actividad y la autoridad educativa ya utilizada. Cancelar o repetir no duplica mascotas ni XP Adventure. En un perfil que ya posee elefante se muestra un reencuentro, no se inventa un nuevo desbloqueo. EQUIPAR cambia el companero; en un primer premio sin mascota equipada CONTINUAR equipa ese primer companero, sin reemplazar una mascota ya elegida.

La restauracion de entrada persiste como hito del Adventure, no como progreso educativo duplicado. Cofre abierto y luces reaparecen al recargar sin repetir premios. La coleccion y armas sobreviven Nueva Aventura; se reutiliza la confirmacion de reinicio del proyecto desde el selector normal.

## QA Realizado

- Adventure QA reiniciada con autorizacion humana, sin tocar perfiles de ninos ni borrar XP/historial/colecciones.
- Desktop Chrome, nueva Adventure sin debug: movimiento, nota, caja de un golpe, nota liberada, Minion de dos impactos, cofre, PianoMagico mediante teclado virtual, resultado real de tres estrellas y 300 XP educativos, primer desbloqueo de Elefante Melodia, EQUIPAR y regreso con companero. Se camino hacia el acceso iluminado a Bosque. La primera toma interrumpida se descarto como evidencia continua; la toma final no tiene cortes interiores ni recargas.
- Viewport movil 390x844: pulsaciones sostenidas en flechas tactiles, recogidas, caja, dos ataques reales al Minion, cofre, teclado virtual real, resultado, EQUIPAR y retorno. Recargas intermedias confirmaron conservacion de hechos; no se uso Debug World para resolver encuentros.
- Retorno conserva posicion, mascota Elephant efectiva en FOLLOW y no duplica recompensas previamente obtenidas. Se observaron muestras de 138-144 FPS en parte de la prueba; no constituyen un benchmark global ni prueba de telefono fisico.
- Video real continuo con audio de pestana: `C:/Users/hecto/Documents/Codex/Valle-First-5-Minutes.mp4`, 7 min 46 s, aproximadamente 14 MB. Incluye esperas de automatizacion y captura; su duracion no mide el tiempo que necesita un nino. Original conservado en `C:/Users/hecto/Downloads/valle-first-five-minutes.webm`. Se revisaron fotogramas del inicio, mundo, piano, recompensa y retorno; no hay contenido simulado.
- Captura de pestana completa desde el auxiliar ignorado `scratch/toy-playtest-recorder.html`, con seleccion humana en Chrome. Rechaza pantalla/ventana completa, no captura microfono y no envia datos a servicios externos.
- Tests: 297 aprobados. Build correcto, con advertencias existentes de bundle grande/imports. Revision de diferencias sin cambios en PianoMagico, hooks de microfono, audio educativo ni backend.

## Riesgos Pendientes

Corregida despues del pase la etiqueta de tempo: el valor legacy 1300 corresponde a milisegundos entre pulsos, no BPM. La actividad ID 1 conserva su ritmo real de aproximadamente 46 BPM (92 BPM a 2x); ahora el control muestra la conversion correcta. No se modificaron datos, evaluacion ni reproduccion. El video anterior conserva la etiqueta incorrecta. La aprobacion visual/auditiva y el aprendizaje efectivo por un nino siguen siendo humanos. El viewport movil no certifica dispositivo tactil fisico.
