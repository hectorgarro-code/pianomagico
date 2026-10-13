# Equipment Pass 1 - Visual Arsenal

Estado: implementado; pendiente de aprobacion humana. Sin commit ni push.

## Auditoria y catalogo real

La fuente ejecutable sigue siendo `presentation/characterEquipment.js`.
Knight, Mage, Barbarian y Rogue locales incluyen rig de 41 joints,
`handslot.l` y `handslot.r`, armas montadas como hijos de esos sockets
y clips 1H/2H/dualwield/ranged/spellcast. No se hicieron montajes cruzados
ni retargeting arbitrario. Las escalas y pivotes nativos permanecen intactos.

| Personaje | Equipo / nodos reales | Q | E |
| --- | --- | --- | --- |
| Knight | sword-shield: 1H_Sword, Badge_Shield | 1H_Melee_Attack_Slice_Horizontal | Block |
| Knight | greatsword: 2H_Sword | 2H_Melee_Attack_Chop | 2H_Melee_Attack_Spin |
| Knight | dual-swords: 1H_Sword, 1H_Sword_Offhand | Dualwield_Melee_Attack_Chop | Dualwield_Melee_Attack_Slice |
| Mage | staff-book: 2H_Staff, Spellbook | Spellcast_Raise | Spellcast_Shoot |
| Mage | wand-book: 1H_Wand, Spellbook_open | Spellcast_Raise | Spellcast_Long |
| Barbarian | dual-axes: 1H_Axe, 1H_Axe_Offhand | Dualwield_Melee_Attack_Chop | Dualwield_Melee_Attack_Slice |
| Barbarian | great-axe: 2H_Axe | 2H_Melee_Attack_Chop | 2H_Melee_Attack_Spin |
| Barbarian | axe-shield: 1H_Axe, Barbarian_Round_Shield | 1H_Melee_Attack_Chop | Block |
| Rogue | crossbow: 1H_Crossbow | 1H_Ranged_Shoot | 1H_Ranged_Reload |
| Rogue | heavy-crossbow: 2H_Crossbow | 2H_Ranged_Shoot | 2H_Ranged_Reload |
| Rogue | daggers: Knife, Knife_Offhand | Dualwield_Melee_Attack_Stab | Dodge_Backward |

Modelos: `public/models/characters/{Knight,Mage,Barbarian,Rogue}.glb`.
Props alternativos reales en `characters/Assets/gltf`: sword_1handed,
sword_2handed, axe_1handed, axe_2handed, staff, wand, crossbow_1handed,
crossbow_2handed y escudos badge/round/square/spikes. No se agregaron:
los modelos nativos ya ofrecen montaje probado sin duplicarlos.

Skeleton_Mage/Minion/Rogue/Warrior del pack original tienen 23 joints,
ambos sockets, sin armas ni clips embebidos. El runtime actual usa las
bibliotecas externas existentes. `characters/Skeleton_Warrior.glb` es
la version existente con 41 joints y clips embebidos; no representa
todo el pack ni autoriza intercambiar rigs. No se modificaron enemigos.
License.txt del pack Skeletons indica CC0.

Ranger conserva sus dos accesorios existentes (bow_withString izquierdo,
crossbow_1handed derecho), con Throw/Jump_Full_Short. No se lo presenta
como compatibilidad nueva 1H/2H ni se ampliaron sus animaciones.

## Coleccion y desbloqueo

Cada personaje principal tiene su primer equipo disponible. Se conservan
las selecciones anteriores validas; Ranger mantiene sus accesorios actuales.
`equipmentCollection.js` declara siete desbloqueos cosmeticos:

- dual-swords: mecanismo forest-three-runes.
- greatsword: secreto mountain-stone-chord.
- wand-book: mecanismo ruins-side-runes.
- great-axe: secreto mountain-banner-trail.
- axe-shield: secreto river-resonant-barrel.
- heavy-crossbow: secreto river-bridge-pocket.
- daggers: secreto forest-note-nook.

Solo se toman hechos Adventure validados; una discovery serializada sin
notas/requisitos validos no basta. Coleccion monotona local por perfil:
`valle-arsenal-v1-user-ID`. Seleccion por personaje conserva las claves
`valley_equipment_ID_CHARACTER`. Nueva Adventure no borra cosmeticos.
No hay backend nuevo, sincronizacion entre dispositivos, stats, dano
variable, XP adicional ni cambios de recompensa educativa de mascotas.

## Presentacion y QA

Arsenal reutiliza el escenario 3D grande, fondo fantastico, armas renderizadas,
rotacion por arrastre/flechas y preview Q/E. Bloqueadas: render apagado,
candado y seleccion deshabilitada. Seleccion cambia equipo inmediatamente.
Desbloqueo en mundo produce aviso breve. Fallo de guardado muestra aviso.

- 282 pruebas correctas; build correcto. Warnings previos de JSON/imports/bundle.
- Tests inspeccionan GLB reales: armas en sus sockets y Q/E exactos para las
  once combinaciones. Verifican aislamiento, migracion, persistencia,
  bloqueo de combinaciones ajenas y desbloqueo idempotente.
- QA real con perfil QA GAMEPLAY CONTENT 1: once combinaciones, Q/E y giro.
- Mundo real: Rogue/daggers, Knight/greatsword, Mage/wand-book,
  Barbarian/axe-shield. No se alteraron stats ni progresion.
- Entrada real a PianoMagico y retorno por cancelacion conserva equipo/mascota.
- Recarga real restaura daggers y las tres armas Rogue desbloqueadas.
- Arsenal revisado a 390x844: sin desbordamiento horizontal.
- No se repitio resultado educativo exitoso ni un nuevo desbloqueo con toast
  en recorrido ciego; reglas cubiertas por pruebas y los logros previos del
  perfil QA desbloquearon correctamente los equipos al entrar.

## Evidencia

`C:/Users/hecto/Documents/Codex/Valle-Equipment-Pass-1-Arsenal.mp4`:
once segmentos REALES del canvas 3D; orden de la tabla. Captura de preview,
no de los controles HTML; transparencia aparece negra en el video.

`C:/Users/hecto/Documents/Codex/Valle-Equipment-Pass-1-Mundo.mp4`:
cuatro segmentos REALES: Rogue, Knight, Mage, Barbarian.

`C:/Users/hecto/Documents/Codex/Valle-Equipment-Pass-1-arsenal.png`:
pantalla completa con controles y thumbnails despues de recargar.

Grabador auxiliar existente en scratch, ignorado por Git; no pertenece
al producto ni a produccion. Sistemas educativos y composiciones intactos.
