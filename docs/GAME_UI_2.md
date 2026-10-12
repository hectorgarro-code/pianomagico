# GAME UI 2: interfaz visual infantil

Estado: funcional, pendiente de aprobacion visual humana.
Flujo actualizado por solicitud humana: perfil -> aventurero/armas/mascota ->
JUGAR -> mundo. Sin pantalla resumen intermedia ni intro intercalada; texto
narrativo conservado. JUGAR guarda cosmeticos y continua sin resetear Adventure.
Revision de portada: ilustracion fantastica horizontal/vertical solicitada por el usuario; reemplaza el decorado 3D solo en TITLE. Ver `TITLE_ARTWORK.md`.
Revision del selector: fondo ilustrado de santuario, retratos de cinco personajes
a la izquierda, modelo 3D central sobre plataforma real, demostracion automatica
y giro. Panel derecho con personaje, piano, arma, mascota y Q/E; sin estadisticas
RPG inventadas. Responsive: informacion debajo del modelo en pantallas estrechas.
Revision de perfiles: fondo fantastico, pedestales ilustrados, estandartes segun
el personaje real, placas con nombres dinamicos y entrada circular. Un solo
renderer para todos los modelos. No cambia perfiles, equipamiento ni progreso.
Checkpoint previo: `4fae3ed - Checkpoint before Game UI 2`. Sin push ni commit final.

## Alcance

- Portada autorada independiente con assets locales, Knight, mascota, Idle,
  luz de cofre y movimiento musical suave. No modifica composiciones jugables.
- Perfiles: modelo real, mascota, nombre y simbolo de continuar/nueva aventura.
- Continuar: modelo, mascota, progreso visual y acciones breves.
- Personalizacion fullscreen: cinco personajes existentes (Ranger conservado),
  armas compatibles reales, Q/E, rotacion mouse/touch y flechas.
- Seleccion inmediata con los contratos existentes; error de guardado visible.
- Galeria de 24 mascotas, bloqueadas como siluetas. Nueve por pagina en escritorio,
  seis en movil; paginas, flechas y swipe. Solo preview central animado;
  miniaturas reales cacheadas, generadas de forma serializada.
- Navegacion de teclado confinada al selector; Escape vuelve, sin accionar mundo.

No cambia backend, piano, audio educativo, Adventure, recompensas, contenidos,
mapa, colisiones, NPC, minijuegos ni sistemas de combate.

## Validacion

- 210 tests y build. Warnings conocidos de bundle y assetManifest permanecen.
- Recorrido normal sin Debug World con el perfil existente QA GAMEPLAY CONTENT 1.
  Personaje, arma y mascota guardados; recarga conserva las elecciones.
- Seleccion dentro del mundo: retorno mantiene exactamente posicion, orientacion
  y cameraYaw; cuatro regiones completadas y 5900 XP permanecen.
- Q/E reales: espada larga (Chop/Spin) y Mage (Raise/Long); botones tactiles.
- Escenas y miniaturas visibles en escritorio, 390x844 y 844x390.
- Sin errores de consola en el recorrido de prueba.
- No se reinicio Adventure para probar una aventura nueva; el flujo de inicio
  y confirmacion se valida con las pruebas existentes y el contrato del selector.
- Prueba responsive en navegador, no certificacion de dispositivo fisico.

Evidencias fuera del repositorio: carpeta `game-ui-2` de visualizaciones de esta
conversacion. `game-ui-2-review.mp4` es un montaje de capturas reales muestreadas
del recorrido, sin audio; no representa una medicion de FPS.

La semejanza visual con la referencia requiere aprobacion humana. No desplegar
ni crear checkpoint final hasta recibirla.
