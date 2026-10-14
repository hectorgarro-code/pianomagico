# Editor completo: orden de ejecucion

Objetivo: autoria visual del Valle sobre los sistemas existentes, sin reconstruccion ni cambios en evaluacion PianoMagico. No publicar contenido de prueba, hacer commit ni desplegar automaticamente.

1. Herramientas de autoria: seleccion multiple, transformaciones conjuntas, grupos, capas, bloqueo/ocultacion editorial, alineacion y plantillas.
2. Publicacion segura: comprobacion previa, referencias y avisos espaciales; historial educativo separado y restauracion como borrador.
3. Eventos y secretos: contratos acotados para disparadores existentes, recompensas idempotentes y prueba aislada; ninguna recompensa educativa artificial.
4. Comportamientos: recorridos/gestos compatibles de habitantes y configuracion arcade/mascotas, sin RPG.
5. Presentacion: fuentes de sonido, luces y encuadres autorados; aislamiento de microfono y lecciones.
6. Geografia: edicion explicita de terreno/caminos y limites con una unica fuente compartida por renderer, colisiones y mapa.
7. Regiones: entradas/salidas/spawn y conexiones; validacion de topologia, sin invalidar el curriculo aprobado.
8. Importacion: GLB autocontenido inicialmente, limites/verificacion de formato y licencia, ADMIN/CSRF, sin ejecutar archivos ni descargar URLs arbitrarias. GLTF multifichero requiere resolver dependencias antes de admitirse.

Cada bloque requiere tests, build y verificacion visual/funcional pertinente. Las pruebas en viewport no certifican hardware movil ni microfono fisico. No considerar completo este plan hasta validar los ocho bloques; las herramientas no deben presentar opciones sin efecto en runtime.

## Estado de ejecucion

- Bloque 1 implementado: seleccion multiple por casillas/Shift/Ctrl, transformaciones conjuntas, grupos, capas, bloqueo/ocultacion solo editorial, alineacion X/Z, plantillas de arquitectura/decoracion sin interacciones. Deshacer restaura una operacion conjunta. Validacion PHP conserva/revisa metadata y plantillas.
- Bloque 2 completado en su alcance: referencias/revision y archivos GLB/GLTF con dependencias locales comprobados antes y durante publicacion. Avisos espaciales incluyen cofres principales. Confirmacion de prueba y revision de avisos referida al borrador actual; boton bloqueado mientras no exista verificacion vigente. Historial de lecciones globales atomico con su publicacion, comparacion antes de recuperar y recuperacion como borrador. Una carga inicial ya no sobrescribe la copia local anterior. Ediciones de mundo/lecciones desde este panel serializadas mediante el bloqueo del documento global. No es comprobacion automatica de accesibilidad de todo el mapa ni un respaldo de toda la base.
- Bloque 3 implementado con contrato acotado: eventos/secretos de Notas Perdidas, colocacion explicita, disparadores de proximidad/destruccion/mecanismos fisicos existentes, referencias validadas y persistencia/idempotencia Adventure. Ver EDITOR_EVENTS_AND_SECRETS.md. No es un editor general de guiones ni modifica secretos anteriores automaticamente.
- Bloque 4 implementado con alcance acotado: recorridos visibles/editables, gestos y proximidad de habitantes, parametros de persecucion arcade y personalidades de mascotas existentes. Validacion y proteccion del entrenamiento inicial. Ver EDITOR_BEHAVIORS.md.
- Bloques 5-8 implementados con alcance acotado: luces/fuentes musicales/encuadres, relieve local/caminos/limites, accesos/spawn/areas/conexiones sobre topologia aprobada, importer GLB estatico. Ver EDITOR_DESIGN_AND_IMPORT.md. QA final de importacion al catalogo local real pendiente de autorizacion especifica; no declarar cierre total. No es sculptor de pincel, importador GLTF/rigs ni editor libre del curriculo.
- QA: 308 tests JavaScript, lint admin y build; seis pruebas transaccionales de borradores/historial con fixtures revertidas. Revision visual real de seleccion multiple, bloqueo, grupo, plantilla y prepublicacion validada. Pruebas de autoria deshechas sin publicar ni guardar en servidor. Sin commit/push/deploy.

QA bloque 2: suite ampliada a 314 tests, siete pruebas del repositorio con historial/rollback y seis de borradores/historial. Archivos faltantes, recursos externos/escape de public y revisiones obsoletas rechazados. Panel real: 72 modelos y 40 dependencias verificados, consulta de historial vacio sin inventar versiones y publicacion deshabilitada sin confirmar prueba. No se publico ni se recupero sobre lecciones reales; rollback validado con fixture inactiva retirada. Pueden avanzar contadores AUTO_INCREMENT de fixtures, sin datos educativos de jugadores.

Despliegue anterior: 95b9c3e, Actions 38454194437 success. Checkpoint aprobado y desplegado: 6fc2b45, Actions 38493935299 success; incluye bloques 3-4 con 323 tests. Correccion de raiz de modelos para hosting plano: 5402019, Actions 38500724322 success. Sitio/panel/bundle HTTP 200. Bloques 5-8 son cambios locales posteriores, 331 tests/build/lint; no incluidos en esos deploys ni publicados en contenido. Importacion real a catalogo local pendiente de autorizacion especifica.
