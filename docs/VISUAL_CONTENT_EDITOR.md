# Visual Content Editor

Ruta: /valle-admin. Acceso ADMIN real, independiente de DEV/debug. Sin instalaciones, commit, push ni despliegue en este pase.

## Edicion

Mundo: lista por composicion, biblioteca de assets locales auditados, colocacion sobre terreno, seleccion con click, gizmos Three.js de movimiento/rotacion/escala, inspector numerico en grados, duplicacion, eliminacion de objetos no protegidos, limites, ajuste y encuadre. Deshacer/rehacer conserva hasta 60 cambios; Ctrl/Cmd Z, Shift Z o Y fuera de campos. El editor no modifica topografia ni genera distribuciones aleatorias.

Cofres adicionales son LESSON_CHEST opcionales con IDs estables editor-, placement explicito, leccion global activa, requisitos aciclicos y recompensa existente. Se materializan mediante WorldGenerator, Adventure y mapa actuales. No cambian requisitos de regiones ni otorgan XP Adventure. Reasignar una actividad educativa puede invalidar su completion Adventure anterior, conservando el historial educativo.

Puerta musical crea un gate y minijuego SEQUENCE propios. Se pueden elegir motores implementados SEQUENCE, RHYTHM y NOTE_RECOGNITION; configurar notas, longitud/rondas/pulsos/BPM y recompensa. El comportamiento es el motor existente, no un nuevo sistema educativo.

NPC: modelos locales, escala uniforme, orientacion y posicion; se reutilizan sus gestos y reacciones existentes. Criaturas/destructibles: assets compatibles, placement, 1-3 impactos y comportamiento existente. Editor version 1 hace explicitas las definiciones Toy de Plaza/Bosque que antes reemplazaban worldActions del panel. Campos especiales de onboarding conservados y protegidos; no se elimina ni desactiva su caja/Minion. Las ayudas siguen las posiciones editadas.

Las mascotas se entregan por resultados educativos validos. El editor no ofrece nuevas recompensas PET en enemigos/destructibles/minijuegos, porque el runtime Adventure las omite. Asignaciones legacy permanecen visibles como opciones deshabilitadas, sin prometer premios que no se entregan.

Lecciones: editor de notas/octavas/duraciones/silencios con secuencia seleccionable, reordenar/eliminar, notacion avanzada, acompanamiento, orden, sticker y preview PianoMagico adminPreview. Borrador musical local recuperable por ID. Publicar leccion es una accion independiente de publicar mundo. Una edicion sin cambiar BPM conserva exactamente los milisegundos legacy originales. La leccion inicial tiene limite de 100 BPM y se configura separada de la practica normal de Plaza.

## Borradores y Publicacion

Mundo se edita en memoria con copia local automatica por administrador. Guardar borrador guarda copia privada del administrador en MySQL; no cambia public_content. Recuperar version/importar JSON actualiza solo borrador. Publicar requiere confirmacion, validacion de referencias, assets, requisitos y revision optimista del servidor. Se aplica al recargar el juego, no a sesiones ya abiertas.

Historial guarda contenido del mundo antes/despues de publicar. Recuperar una version no reescribe lecciones, perfiles, XP o partidas; restaura un borrador que se debe validar/publicar. No es rollback de base educativa. Exportacion contiene contenido y lecciones; importacion recupera solamente contenido, no importa lecciones ni jugadores.

Tablas auxiliares valle_content_drafts / valle_content_history se crean bajo acceso ADMIN al usar el editor. El primer historial se crea al publicar; no se inventan versiones anteriores. No son tracking de jugadores.

## Prueba Aislada

Probar borrador valida en PHP sin publicar, monta el renderer real con un personaje de prueba y permite recorrer/interactuar. PianoMagico se abre con adminPreview, sin ID de perfil real y sin escrituras educativas. Adventure, cofres y minijuegos de prueba permanecen en memoria; cerrar descarta su progreso y restaura definiciones compartidas. No presenta el premio como un desbloqueo real. Los requisitos principales siguen vigentes: iniciar cerca de una region avanzada no simula haber completado su curriculo.

## Alcance

Ampliacion de autoria: seleccion multiple, grupos/capas, bloqueo y ocultacion SOLO del editor; los objetos ocultos siguen en el juego. El gizmo/numeros actua sobre seleccion conjunta y cada cambio constituye un paso de deshacer. Alineacion X/Z y plantillas de decoracion/arquitectura sin interacciones. Las plantillas reciben IDs nuevos al colocarse. Historias de lecciones globales disponibles desde su primera publicacion con historial, restauradas siempre como borrador y sujetas a revision actual/limite de BPM al publicar.

Revision de publicacion valida referencias en servidor; avisos de proximidad a spawn/cofres son aproximados, no certifican navegacion. El plan de ampliacion y sus pendientes estan en EDITOR_COMPLETE_PLAN.md; aun no esta completo.

Bloque 2: preflight verifica revision actual, archivos de modelos referenciados y buffers/texturas externos GLTF/GLB dentro de public. No descarga recursos externos ni certifica decodificacion visual de todos los recursos/animaciones. Al publicar se vuelve a validar dentro de la transaccion. La confirmacion de prueba pertenece a la identidad del borrador actual; cambiarlo invalida validacion/confirmaciones anteriores. Los avisos espaciales no bloquean por geometria inferida, pero exigen revision humana.

Historial musical: compara nombre, tempo exacto (incluidos ms legacy), acompanamiento, orden, sticker, estado y notas frente a leccion publicada. Probar version usa adminPreview. Recuperar solamente actualiza borrador/localStorage; publicar usa revision vigente y protecciones existentes. Edicion musical e historial se guardan atomicamente; falla de historial revierte edicion. No se restaura XP, perfiles ni interpretaciones. Al abrir otra pestaña/cargar publicado se conserva la copia local anterior hasta que el administrador edite/recupere un borrador.

La biblioteca usa el catalogo local. Importar packs nuevos, subir modelos arbitrarios, esculpir terreno y reescribir topologia principal no forman parte de este editor. Secretos y restauraciones de los pases anteriores conservan sus composiciones; no son un editor libre de guiones narrativos. No se migra ni se reconstruye el juego aprobado.

## Verificacion

303 tests JavaScript pasaron, lint de administracion correcto y build exitoso. Pruebas MySQL: 5 del repositorio educativo y 5 de borradores/historial; fixtures temporales eliminadas o revertidas por transaccion, sin escrituras de jugadores. Se conservan avisos previos de bundle grande e imports JSON/mixtos.

Revision visual de escritorio, movimientos y notas, borrador recuperado, cofre nuevo -> PianoMagico real -> resultado -> retorno con cofre abierto. Puerta nueva -> secuencia escuchada y repetida -> desafio completado -> regreso. Confirmacion de publicacion revisada sin ejecutar publicacion. Ninguna prueba publica contenido en produccion.

Validacion movil cerrada en viewport 390x844: inspector dentro del ancho disponible, sin desbordamiento horizontal de pagina. Se corrigio el ancho del formulario musical y de la revision de publicacion; el formulario mide 350px y sus controles permanecen accesibles por scroll. No certifica rendimiento ni gestos en hardware movil real. Se restauro el viewport habitual.

Se retiraron exclusivamente los IDs del cofre, puerta y minijuego creados por QA del borrador privado en MySQL. Se descarto mediante el editor el borrador musical QA de la leccion 1. Revision publicada sigue en 2, sin cambios en perfiles/lecciones. No recuperar la copia local anterior de la otra pestana QA: puede contener objetos temporales; el borrador del servidor esta limpio.
