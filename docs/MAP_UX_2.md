# MAP UX 2 - Cartography

Checkpoint previo: `8ae8c6b - Checkpoint before Map UX 2`.
Sin push, despliegue ni commit final. Pendiente aprobacion visual humana.

## Pack local auditado

Ruta real: `public/models/kenney_cartography-pack/` (no `_pack`).
Originales intactos; no descargas, movimientos ni modificaciones del pack.
Licencia incluida: Kenney, Cartography Pack, 16-06-2020, CC0.

- 83 PNG Default y 83 Retina: edificios, arboles, rocas, montanas,
  puentes, agua, caminos, flechas, simbolos, cofres y brujula.
- Default: normalmente 64px; Retina: 128px; algunos elementos altos
  duplican altura (treeTall: 64x128 / 128x256).
- Cinco pergaminos 1024x1024: parchmentAncient, parchmentBasic,
  parchmentCrinkled, parchmentFolded, parchmentFoldedCrinkled.
- Dos atlas PNG + XML, un SVG vectorial, un SWF auxiliar,
  Preview/Sample PNG y dos enlaces URL.
- No tiles de terreno 3D ni modelos: recursos exclusivamente 2D.
- Default contiene `runis.png`; Retina contiene `ruins.png`.
  El registro usa el nombre real correcto de Retina, sin renombrar.

Elementos utiles encontrados (nombres reales):

- Arquitectura: castle, castleTall, castleWide, castleWideLow, church,
  churchLarge, gate, houses, house, houseSmall, houseTall, houseChimney,
  houseViking, lighthouse, tower, towerLow, towerTall, towerWatch,
  watchtower, ruins, wall, well, mill, stable, mine.
- Vegetacion: treeTall, treePine, treePineLarge, treePineTall,
  treePineTallLarge, treePineTallLow, treePines, treePinesSmall,
  bush, cactus, cactusLarge, palm, palmLarge.
- Relieve/agua: rocks, rocksA, rocksB, rocksTall, rocksMountain,
  vulcano, lake, lakeRound, textureWater, bridge, bridgeRope, dock.
- Recorrido: pathStraight, pathCorner, pathCrossing, pathSplit,
  pathEnd y variantes arrow; no se ensamblan para inventar caminos.
- Marcadores: chest, compass, banner, flag, elementCircle,
  elementCross, elementDiamond, elementShield, elementSquare.
- Complementos: campfire, fence, graveyard, pyramid, tent, tipi,
  ship, skull, waterWheel, textureStone y textureBricks.

## Recursos utilizados

Registro unico `mapCartography.js`: parchmentBasic + Retina treeTall,
treePines, rocksMountain, rocks, bridge, ruins, gate, castleWideLow,
chest y compass. `textureWater` queda catalogado como opcion, sin uso
actual; el rio se dibuja siguiendo RIVER_CHANNEL real.

Para un futuro commit/despliegue incluir estos once PNG y License.txt.
No agregar indiscriminadamente el pack completo: SWF, URL, previews,
atlas y formatos alternativos no son dependencias de esta implementacion.
El pack permanece sin seguimiento hasta aprobar el commit final.

## Arquitectura y comportamiento

`valleyNavigation.js` intacto: transformacion, posicion, orientacion,
topologia, discovery, cofres y objetivo mantienen su autoridad original.

`mapLandmarks.js` selecciona 19 instancias reales por ID y conserva
sus coordenadas: 2-4 iconos semanticos por region. No placement aleatorio.
`CartographyLayer.jsx` renderiza tinta SVG y assets 2D; capa estatica
memoizada, marcador independiente, imagenes reutilizadas por URL.
`WorldNavigation.jsx` conserva contrato M/Escape/click/X y asistencia.
Ninguna logica cartografica agregada a World3DView.

Minimapa local en escritorio; mapa ampliado encuadra lo descubierto.
Sin iconos/nombres de regiones desconocidas. Gruta y sendero secreto
solo aparecen con discovery existente. Camino principal continuo,
desvios finos, secreto discontinuo; agua y puente en posiciones reales.
Cofres conocidos conservan AVAILABLE/LOCKED/COMPLETED; UNKNOWN oculto.
Jugador azul/blanco orientado; objetivo dorado discreto; norte = -Z.
Titulo musical sutil, papel texturado, bordes irregulares y brujula.

Movil: boton compacto, pergamino fullscreen, controles de 44px,
contenido desplazable para conservar legibilidad. Reduce-motion
elimina el pulso. Fallback de imagen: glifo simple; papel conserva
color base; brujula conserva N si falla la imagen.

## Validacion

- 203 tests pasan, incluidos diez nuevos; build pasa.
- Revisadas nueve etapas en fixture aislada, sin persistencia:
  Plaza; Plaza/Bosque; bifurcacion; Rio; Montana sin Gruta;
  Gruta descubierta; Ruinas; Observatorio; Valle completo.
- Prueba jugable con perfil QA existente, sin reset ni nuevas cuentas:
  caminar, mapa por click/M, cierre por M/Escape/X, asistencia ON/OFF.
  Intentar caminar con mapa abierto no cambia la posicion.
- Escritorio 1159x668 y viewport movil 390x844; minimapa oculto en movil,
  mapa desplazable y cierre accesible. Assets sin errores de carga.
- Capturas y video fuera de Git en carpeta `map-ux-2` de visualizaciones.
  Video de 17 segundos: montaje de 34 capturas reales de la interfaz,
  no grabacion continua ni benchmark FPS.
- Sin nuevo renderer 3D, backend, dependencias ni cambios de progreso.
  Persisten warnings anteriores de bundle e imports assetManifest.
- `scratch/map-review.*` es QA local ignorada y no entra al build;
  no escribe perfiles, Adventure ni progreso educativo.
