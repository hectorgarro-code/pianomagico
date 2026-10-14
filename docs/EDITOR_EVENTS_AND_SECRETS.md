# Etapa 3: eventos y secretos autorados

Checkpoint publicado: 95b9c3e (editor seguro y gameplay aprobado). GitHub Actions 38454194437 finalizo con success; rutas / y /valle-admin y bundle verificados HTTP 200. No se publico un borrador ni se modificaron lecciones/perfiles durante el deploy. Esta etapa posterior es local, sin segundo commit/push/deploy.

## Contrato acotado

worldEvents es una coleccion opcional en el documento global existente. IDs editor-event- estables. Cada evento declara nombre, region, posicion explicita, activo, secreto, pitch, 1-3 Notas Perdidas, radio y disparador. Sin scripts ejecutables, evaluacion arbitraria, quests, economia, XP ni mascotas por exploracion.

Disparadores implementados: acercarse, destruir/derrotar un worldAction existente y completar uno de los mecanismos fisicos de runas existentes (forest-three-runes / ruins-side-runes). Los minijuegos de menu/gates no se confunden con estos mecanismos fisicos. Eventos tras leccion/region, modificaciones de luces/escenario y guiones generales no forman parte de este contrato; restauracion de regiones conserva su sistema existente.

## Editor

Pagina EVENTOS: crear/configurar y probar. MUNDO: colocar sobre terreno, mover con gizmo/numeros, agrupar, bloquear, ocultar editorialmente, duplicar y eliminar. Marcador coin.glb SOLO editorial; en juego se reutilizan las notas luminosas existentes, no monedas. Los eventos no se rotan ni se escalan. Eliminar un objeto observado por un evento activo exige desactivar/reasignar el evento primero. Backend verifica IDs, fuentes, notas y limites del Valle, y rechaza campos de recompensa/XP.

Los nueve secretos anteriores y sus pistas permanecen intactos. No se migra ni reposiciona automaticamente su composicion; esta capa permite agregar eventos propios. Nuevos eventos parten de un borrador y no se instancian en produccion hasta publicacion explicita.

## Runtime y persistencia

Compilacion determinista a los registros existentes de TOY_NOTES, TOY_TARGETS y EXPLORATION_SECRETS, conservando identidades compartidas. Los nuevos drops permanecen en coordenadas autoradas, no se trasladan al enemigo. Fuentes observadas usan derrota Toy persistente. La misma autoridad Adventure registra derrota, recogida y descubrimiento; no hay otro progreso ni nuevas tablas. ID de cada nota estable: evento:note-indice.

Mapa: secretos solamente tras recogida. Sin flecha del objetivo principal ni curiosidad de mascota que revele secretos. Particulas, sonido y celebracion reutilizados. Desactivar conserva notas ya recogidas; reactivar no repite recompensa. Eliminar un evento retira sus definiciones opcionales: no implica reset educativo. Cambiar cantidad puede agregar nuevas notas, conservando IDs anteriores. El juego carga contenido antes de normalizar Adventure. La prueba admin conserva progreso exclusivamente en memoria y restaura el contenido anterior al cerrar.

## QA

Pruebas automaticas: secreto/reload/idempotencia, fuente de destruccion obligatoria, mecanismo obligatorio, desactivar/reactivar, mapa oculto, progresion educativa intacta, referencias invalidas, rechazo de XP, movimiento del marcador sin campos ficticios. Prueba real local: crear secreto -> probar borrador -> caminar -> recoger -> feedback SECRETO -> marcador de mapa, lostNotes=1. Evento QA deshecho y copia local anterior recuperada; no guardado/publicado en servidor.

Suite completa: 319 tests aprobados. Lint de administracion/compilador y build correctos. Se conservo compatibilidad exacta de los documentos antiguos: worldEvents es opcional y el seed existente no cambia. Se mantienen los avisos anteriores de bundle/imports. Captura real: C:/Users/hecto/Documents/Codex/Valle-Authored-Secret-Playtest.png.

Limites: validacion espacial no certifica accesibilidad; no se hizo playthrough humano de todas las fuentes ni prueba en hardware movil. No cambia PianoMagico, microfono, curriculo ni regiones.
