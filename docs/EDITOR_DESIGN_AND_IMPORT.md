# Editor: bloques 5-8

Checkpoint previo: 6fc2b45, Visual editor authored events and character behaviors. GitHub Actions 38493935299 termino success. Produccion /, /valle-admin y bundle verificados HTTP 200; sin publicar borradores ni modificar datos educativos.

Correccion puntual posterior: 5402019, Fix asset preflight for flat production hosting. Deteccion de raiz public local frente a raiz plana Hostinger, con fixture de ambos layouts; Actions 38500724322 success, sitio/panel/bundle HTTP 200 tras despliegue.

Los bloques siguientes son cambios LOCALES posteriores al checkpoint; no se desplegaron automaticamente.

## 5. Presentacion

PRESENTACION agrega luces puntuales (hasta 8, sin sombras nuevas), fuentes musicales posicionales sutiles y encuadres de proximidad de 1-3 segundos. Campos explicitos, sin posiciones aleatorias. Fuentes usan la sintesis Adventure existente; no cambian Soundfont, pitch detection ni evaluacion. Respetan mute, volumen, visibilidad, pausa de leccion y microfono; se suspenden durante mecanismos musicales. No son un importador/editor de audio arbitrario. Encuadres se interrumpen ante camara manual, combate o interaccion musical y ocurren una vez por sesion, sin secuestrar movimiento.

## 6. Geografia

GEOGRAFIA edita puntos/ancho de caminos existentes, agrega relieve local suave y limites XZ. worldDesign es fuente unica: renderer, altura de jugador/mascotas/props, colliders y mapa consumen sus datos. Cada relieve tiene posicion, radio de 2-12 m y elevacion de -1.5 a 1.5 m; no ruido aleatorio ni ampliacion del terreno. MUNDO muestra el relieve/trazado y contornos rojos de limites. Limites son barreras tecnicas de circulacion, no arte final ni puertas de progreso; probar pasos y cubrirlas artisticamente cuando corresponda. Restaurar elimina la sobreescritura y devuelve la composicion original.

No es un sculptor de pincel ni editor de cauces/puentes: esos soportes especificos permanecen originales. Cambios que alteren significativamente pendientes o arquitectura requieren prueba manual antes de publicar; prepublicacion avisa cambios de terreno/limites/recorridos.

## 7. Regiones

REGIONES edita spawn inicial de Plaza, puntos de entrada/salida y areas rectangulares de descubrimiento existentes. El nombre entryPoints evita mezclar accesos del nivel con entries de progreso del jugador. No elimina accesos originales referenciados. Conexiones agregan trazados entre composiciones compatibles con las conexiones logicas aprobadas; no teletransportan ni cambian requisitos, lecciones o historial. Areas nuevas no pueden solaparse entre si. No crea regiones educativas ni cambia el orden Plaza/Bosque/Rio-Montana/Ruinas/Observatorio; Gruta sigue opcional.

## 8. Importacion

ASSETS admite archivos GLB locales autocontenidos, estaticos, hasta 4 MB; categorias PROP, DESTRUCTIBLE, ARCHITECTURE, VEGETATION, DECORATION. Nombre, autor, licencia CC0/CC-BY-4.0/propia y confirmacion de permiso obligatorios. No descarga URLs ni ejecuta archivos. No importa rigs, animaciones, skins, extensiones/compression ni GLTF multifichero.

PHP exige ADMIN y CSRF antes de guardar. Verifica cabecera y chunks, buffers, rangos de accessors, texturas embebidas PNG/JPEG hasta 2048 px, presupuesto de memoria, grafo sin ciclos/nodos compartidos, nodos/vertices/draw calls. Cuota: 100 modelos y 100 MB. SHA256 define identidad/nombre; repetir el binario reutiliza registro sin duplicacion. Metadata se registra atomicamente bajo bloqueo y se protege por .htaccess.

Registro solo incorpora disponibilidad al catalogo: no coloca instancias ni publica el mundo. Catalogo publico se carga antes del contenido; validacion de mundo incluye assets importados registrados. Usar MUNDO/Biblioteca para colocar, probar, guardar borrador y publicar.

Assets importados viven en public/models/imported y backend/content/imported del servidor donde se importan, ignorados por Git. Deploy no borra ni copia esos almacenes. Respaldar AMBOS directorios junto a la base de contenido al migrar hosting; exportar JSON del mundo no exporta los binarios. Hostinger/PHP debe permitir subida JSON de al menos 6 MB y escritura en esos directorios. No se cambiaron limites del hosting automaticamente.

## QA y limites pendientes

- Pruebas automatizadas: restauracion exacta, alturas/colisiones compartidas, caminos/spawn/conexiones, interrupcion de reveal, areas regionales, topologia protegida, importador/deduplicacion en directorio temporal aislado.
- Suite local ampliada a 331 tests; build/lint y sintaxis PHP. Advertencias conocidas del bundle/imports siguen presentes.
- Panel real: controles de presentacion, sandbox cargado sin errores, relieve/trazado/limite visualizados, accesos/conexion preparados; cambios de prueba deshechos sin publicar ni guardar en servidor.
- Conexion de Plaza a Bosque verificada en sandbox real sin errores tras correccion del punto inicial por salida autorada. Formulario de importacion revisado a 390x844 sin desbordamiento horizontal; no certifica hardware movil.
- Prueba de importacion al catalogo LOCAL real bloqueada por revision de seguridad del entorno. Se solicito aprobacion especifica para una losa CC0 existente. No se completo ni se escribio ese fixture en el catalogo.
- No certifica fluidez (navegador limitado previamente a 1 FPS), microfono fisico, audio escuchado, hardware movil ni accesibilidad de todos los recorridos editados. El build no sustituye aprobacion humana.

Estos bloques implementan el alcance acotado del plan, no un editor comercial completo ni autorizacion para publicar contenido de prueba.
