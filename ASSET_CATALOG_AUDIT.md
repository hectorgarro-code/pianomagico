# Asset Catalog Audit

Auditoria local: 2026-10-10. No se descargaron, movieron, renombraron ni eliminaron packs. No hay instancias nuevas en el mundo.

## Alcance y registro

El checkout contiene AssetDiagnosticModal (panel DEV), assetManifest y kaykitCatalog; no una Content Platform administrativa independiente. Esta entrega agrega un registro consultable en ese panel y documenta el alcance en docs/CONTENT_PLATFORM_1.md, sin inventar un World Editor o backend.

Catalogo: src/game/assets/assetCatalog.js. Evidencia estructurada: src/game/assets/localAssetPacks.json. Auditor reproducible: scripts/auditLocalAssetPacks.mjs. Cada asset nuevo registra ruta real, hash SHA-256, bytes, dependencias, texturas, materiales, bounds, pivots, joints y clips exactos/duracion. Los datos no deciden colocacion ni comportamiento.

Categorias: CHARACTER_PLAYER, PET, WORLD_CREATURE, PROP, DESTRUCTIBLE, ARCHITECTURE, VEGETATION, DECORATION. Nuevos registros: 24 PET, 4 WORLD_CREATURE, 13 PROP. Las dos bibliotecas de animacion no son criaturas. DESTRUCTIBLE queda sin entradas: un nombre o un modelo roto no autoriza interactividad. Los cinco jugadores permanecen separados.

## Kenney Cube Pets

Raiz: public/models/characters/kenney_cube-pets_1.0/.
Estructura: Models/GLB format, Models/FBX format, Models/OBJ format, Previews, Overview.html, Preview.png, License.txt y tres accesos .url.

Discrepancia de version: el directorio dice 1.0 pero License.txt declara Cube Pets (2.0), con fecha 26-03-2026. Se conserva el nombre local; no se deduce ni busca otra version.

Encontrados fisicamente: 24 GLB, 24 FBX, 24 OBJ y 24 MTL; 28 PNG (24 previews, imagen general y tres copias del atlas). Se elige el GLB como archivo utilizable en Three.js. Ruta base: public/models/characters/kenney_cube-pets_1.0/Models/GLB format/.

### Inventario completo

Dimensiones XYZ en unidades nativas, bounds estaticos de mesh transformados en la escena; NO envelope animado ni escala jugable aprobada.

| Archivo exacto | Tamano X / Y / Z | Minimo Y |
| --- | --- | --- |
| animal-beaver.glb | 1.250 / 1.501 / 1.837 | 0 |
| animal-bee.glb | 1.335 / 2.024 / 1.293 | 0 |
| animal-bunny.glb | 1.250 / 2.010 / 1.330 | 0 |
| animal-cat.glb | 1.250 / 1.710 / 1.806 | 0 |
| animal-caterpillar.glb | 1.444 / 1.747 / 1.332 | 0 |
| animal-chick.glb | 2.196 / 1.594 / 1.350 | 0 |
| animal-cow.glb | 1.539 / 1.612 / 1.460 | 0 |
| animal-crab.glb | 2.336 / 1.431 / 1.347 | 0 |
| animal-deer.glb | 1.539 / 1.993 / 1.560 | 0 |
| animal-dog.glb | 1.260 / 1.584 / 1.501 | 0 |
| animal-elephant.glb | 1.878 / 1.431 / 1.675 | 0 |
| animal-fish.glb | 1.883 / 1.628 / 1.260 | 0.10425 |
| animal-fox.glb | 1.250 / 1.686 / 2.308 | 0 |
| animal-giraffe.glb | 1.556 / 1.714 / 1.416 | 0 |
| animal-hog.glb | 1.350 / 1.516 / 1.501 | 0 |
| animal-koala.glb | 1.943 / 1.463 / 1.389 | 0 |
| animal-lion.glb | 1.650 / 1.746 / 1.899 | 0 |
| animal-monkey.glb | 1.982 / 1.610 / 1.782 | 0 |
| animal-panda.glb | 1.343 / 1.501 / 1.440 | 0 |
| animal-parrot.glb | 2.196 / 1.681 / 1.902 | 0 |
| animal-penguin.glb | 2.190 / 1.594 / 1.350 | 0 |
| animal-pig.glb | 1.250 / 1.584 / 1.460 | 0 |
| animal-polar.glb | 1.250 / 1.501 / 1.495 | 0 |
| animal-tiger.glb | 1.350 / 1.710 / 1.899 | 0 |

Las 24 mascotas tienen exactamente estos 8 clips, sensibles a mayusculas:
`static`, `idle`, `walk`, `run`, `eat`, `dance`, `gesture-positive`, `gesture-negative`.
Total: 192 clips. Las duraciones se registran individualmente; no se presupone que el mismo nombre tenga igual duracion en todos los modelos.

Son animaciones de transformaciones de nodos (root/body/patas/etc.), no skins con huesos. Se reproduciran mediante AnimationMixer propio; no requieren SkeletonUtils ni los clips KayKit. No transferir nombres `Idle`/`Walking_A` de jugadores a mascotas: aqui son `idle`/`walk`.

Textura externa requerida por TODOS los GLB: Models/GLB format/Textures/colormap.png, PNG 512x512. Los GLB NO son autocontenidos. Material colormap: color base texturizado, metallic 0, roughness 1, doble cara, opaco. Las copias FBX/OBJ del atlas son identicas por hash pero no deben borrarse mientras esos formatos se conserven.

Pivots: raiz de escena en [0,0,0], rotacion identidad, escala [1,1,1]. Meshes apoyados en Y=0 salvo animal-fish (Y minimo 0.10425). El eje vertical es Y. El ajuste futuro de suelo debe considerar ese offset; verificar frente y envelope de walk/run en preview antes de companion. Alturas nativas aproximadas 1.431-2.024: no colocar directamente a escala 1 junto al heroe. La metadata propone solo una comparacion de altura 0.5, sin aplicarla.

Licencia incluida: License.txt, CC0, autor Kenney; permite uso educativo/comercial y atribucion opcional. Overview.html documenta localmente los 24 objetos/192 animaciones. Los accesos .url y enlaces no se abrieron.

## KayKit Skeletons

Raiz real anidada: public/models/characters/KayKit_Skeletons_1.1_FREE/KayKit_Skeletons_1.1_FREE/.

Estructura: characters/gltf, characters/fbx, assets/gltf, assets/fbx, assets/fbx(unity), assets/obj, Animations/gltf/Rig_Medium, Animations/fbx, texture, samples, License.txt, contents.png y accesos .url.
Encontrados: 6 GLB (4 personajes y 2 bibliotecas), 13 GLTF, 13 BIN, 32 FBX, 13 OBJ, 13 MTL, 12 PNG, License.txt y 4 .url.
No existen variantes adicionales de personajes utilizables en este pack local: Mage, Minion, Rogue y Warrior. Sus FBX son exportaciones alternativas, no enemigos nuevos.

### Personajes utilizables

Ruta base: characters/gltf/. Medidas conservadoras de pose bind/rest, no colliders definitivos.

| Archivo exacto | Tamano X / Y / Z | Rig | Clips embebidos |
| --- | --- | --- | --- |
| Skeleton_Mage.glb | 1.938 / 2.630 / 1.735 | Rig_Medium / 23 | 0 |
| Skeleton_Minion.glb | 1.938 / 2.166 / 0.912 | Rig_Medium / 23 | 0 |
| Skeleton_Rogue.glb | 1.943 / 2.308 / 1.153 | Rig_Medium / 23 | 0 |
| Skeleton_Warrior.glb | 1.943 / 2.590 / 1.459 | Rig_Medium / 23 | 0 |

Los cuatro tienen pieles de 23 joints, sockets hands y raiz Rig_Medium. Pivots/transformaciones y joints exactos estan en JSON. Suelo aproximado Y=-0.00003, error de exportacion minimo; no aplicar el yOffset negativo usado por algunos viewers antiguos sin medir. Orientacion de meshes/sockets debe revisarse al equipar accesorios.

Textura skeleton_texture PNG 1024x1024 EMBEBIDA en los GLB de personaje; materials skeleton y Glow. Los GLTF de accesorios requieren cada BIN homonimo y assets/gltf/skeleton_texture.png. Los siete PNG sueltos skeleton_texture son identicos por SHA-256; no borrar ninguno ahora porque respaldan formatos/directorios diferentes. Metallic, roughness, emissive y alpha de cada material se registran por archivo en JSON.

### Bibliotecas y nombres EXACTOS

**Rig_Medium_General.glb**
Ruta: /models/characters/KayKit_Skeletons_1.1_FREE/KayKit_Skeletons_1.1_FREE/Animations/gltf/Rig_Medium/Rig_Medium_General.glb

```text
Death_A
Death_A_Pose
Death_B
Death_B_Pose
Hit_A
Hit_B
Idle_A
Idle_B
Interact
PickUp
Spawn_Air
Spawn_Ground
T-Pose
Throw
Use_Item
```

**Rig_Medium_MovementBasic.glb**
Ruta: /models/characters/KayKit_Skeletons_1.1_FREE/KayKit_Skeletons_1.1_FREE/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb

```text
Jump_Full_Long
Jump_Full_Short
Jump_Idle
Jump_Land
Jump_Start
Running_A
Running_B
T-Pose
Walking_A
Walking_B
Walking_C
```

Hay 26 entradas de clips entre ambas bibliotecas, 25 nombres unicos: T-Pose esta en ambas. Ningun target de canal de estas bibliotecas falta en los cuatro personajes, comprobado por nombre. Eso demuestra compatibilidad estructural inicial, NO validacion completa de retargeting/pose/equipo. No hay acciones de ataque especificas en estas bibliotecas FREE; no inventarlas. Hit_A/Hit_B y Death_A/Death_B son candidatos reales para futuras interacciones.

### Accesorios utilizables

13 GLTF estaticos, categoria PROP:
- Skeleton_Arrow.gltf
- Skeleton_Arrow_Broken.gltf
- Skeleton_Arrow_Broken_Half.gltf
- Skeleton_Arrow_Half.gltf
- Skeleton_Axe.gltf
- Skeleton_Blade.gltf
- Skeleton_Crossbow.gltf
- Skeleton_Quiver.gltf
- Skeleton_Shield_Large_A.gltf
- Skeleton_Shield_Large_B.gltf
- Skeleton_Shield_Small_A.gltf
- Skeleton_Shield_Small_B.gltf
- Skeleton_Staff.gltf

Cada uno conserva su BIN y textura externa. No se convierten automaticamente en armas de jugador, proyectiles o destructibles.

Licencia incluida: License.txt, KayKit Character Pack Skeletons (1.1), fecha 22/10/2025, CC0, autor Kay Lousberg, atribucion opcional. samples y contents son documentacion visual, no personajes instanciables.

## Relacion del Skeleton_Warrior anterior

public/models/characters/Skeleton_Warrior.glb se mantiene intacto en su ruta actual.
- SHA-256 anterior: 178b6fda810b814c250d8a2010c24dfd9b458b9006dd323353e620b7ff118bbe.
- SHA-256 del pack: 992d5cfd6beb5565c50f742587d492f2a2cfcdfb3ffe4435aa16461c6d0e54be.
- NO son archivos identicos: anterior Rig / 41 joints / 95 clips embebidos; nuevo Rig_Medium / 23 joints / 0 clips embebidos.
- Comparten los 10 nombres de meshes del Warrior y exactamente la misma imagen embebida por hash. Son exportaciones de la misma familia visual, no sustitutos equivalentes. La procedencia precisa de los 95 clips anteriores no se establece con los originales nuevos.
- El catalogo registra el anterior como variante existente del concepto Warrior, no como quinta criatura ni otra colocacion. No se modifica el boss legacy ni sus consumidores.

Nombres EXACTOS de los 95 clips del anterior:

```text
1H_Melee_Attack_Chop
1H_Melee_Attack_Jump_Chop
1H_Melee_Attack_Slice_Diagonal
1H_Melee_Attack_Slice_Horizontal
1H_Melee_Attack_Stab
1H_Ranged_Aiming
1H_Ranged_Reload
1H_Ranged_Shoot
1H_Ranged_Shooting
2H_Melee_Attack_Chop
2H_Melee_Attack_Slice
2H_Melee_Attack_Spin
2H_Melee_Attack_Spinning
2H_Melee_Attack_Stab
2H_Melee_Idle
2H_Ranged_Aiming
2H_Ranged_Reload
2H_Ranged_Shoot
2H_Ranged_Shooting
Block
Block_Attack
Block_Hit
Blocking
Cheer
Death_A
Death_A_Pose
Death_B
Death_B_Pose
Death_C_Pose
Death_C_Skeletons
Death_C_Skeletons_Resurrect
Dodge_Backward
Dodge_Forward
Dodge_Left
Dodge_Right
Dualwield_Melee_Attack_Chop
Dualwield_Melee_Attack_Slice
Dualwield_Melee_Attack_Stab
Hit_A
Hit_B
Idle
Idle_B
Idle_Combat
Interact
Jump_Full_Long
Jump_Full_Short
Jump_Idle
Jump_Land
Jump_Start
Lie_Down
Lie_Idle
Lie_Pose
Lie_StandUp
PickUp
Running_A
Running_B
Running_C
Running_Strafe_Left
Running_Strafe_Right
Sit_Chair_Down
Sit_Chair_Idle
Sit_Chair_Pose
Sit_Chair_StandUp
Sit_Floor_Down
Sit_Floor_Idle
Sit_Floor_Pose
Sit_Floor_StandUp
Skeleton_Inactive_Standing_Pose
Skeletons_Awaken_Floor
Skeletons_Awaken_Floor_Long
Skeletons_Awaken_Standing
Skeletons_Inactive_Floor_Pose
Spawn_Air
Spawn_Ground
Spawn_Ground_Skeletons
Spellcast_Long
Spellcast_Raise
Spellcast_Shoot
Spellcast_Summon
Spellcasting
T-Pose
Taunt
Taunt_Longer
Throw
Unarmed_Idle
Unarmed_Melee_Attack_Kick
Unarmed_Melee_Attack_Punch_A
Unarmed_Melee_Attack_Punch_B
Unarmed_Pose
Use_Item
Walking_A
Walking_B
Walking_Backwards
Walking_C
Walking_D_Skeletons
```

## Dependencias, duplicados y riesgos

- Cero dependencias externas faltantes en los 24 GLB de mascotas, 4 personajes, 2 bibliotecas, 13 GLTF accesorios y Warrior antiguo auditados.
- Cuatro grupos de duplicados exactos: tres atlas Kenney; 24 MTL Kenney; siete PNG skeleton; 13 MTL skeleton. No duplicados exactos de personajes detectados entre los nuevos GLB. FBX/OBJ frente a GLB son formatos alternativos, no igualdad byte a byte.
- Pets animan nodos y KayKit usa skins: no compartir mixer/clips entre familias.
- Diferencias de escala, estilo cubico y envelope de animacion requieren aprobacion visual antes de companion/placement.
- Pivots, bounds y flags del catalogo NO son colisiones ni radio de hit. No se generaron colliders.
- Clips de rig Medium no sustituyen automaticamente el rig viejo de 41 joints; hits y derrota deben ensayarse en la variante elegida.
- Los paths con espacios de Kenney son validos pero deben conservarse/escaparse por URL; nunca separar el GLB de Textures.
- Las reglas actuales de .gitignore excluyen formatos auxiliares y samples; NO excluyen Textures/colormap.png requerido por mascotas ni BIN/PNG de accesorios. No se cambiaron reglas ni se hizo staging.

## Preparacion de fases siguientes

PET: IDs estables, collectionKey/rewardAssetId, licencia, preview, clips idle/walk/run y sugerencia de escala. No se define aun que actividad recompensa cada mascota, no se guarda coleccion y no se implementa follower.

WORLD_CREATURE: animationSources, candidatos hitReaction/defeat, rango futuro [1,3]. behavior, hitsRequired, attackable, defeatEffect y optionalReward quedan null. La futura interaccion simple no sera combate RPG. NPC amistoso no es sinonimo de criatura atacable; no se agrega sistema NPC.

Primera implementacion recomendada, pendiente de autorizacion:
- animal-cat y animal-dog para companion terrestre (clips simples y escala comparable).
- animal-fox o animal-bunny como siguiente recompensa coleccionable, solo despues de validar los primeros.
- Skeleton_Minion para validar carga Rig_Medium + Hit_A + Death_A; menor silueta y sin accesorio obligatorio.
- Warrior anterior para una prueba futura que necesite sus clips embebidos, manteniendo su contrato original. No sustituir silenciosamente por el del pack.

## Propuesta no ejecutada para produccion

Mantener ahora los packs intactos. Si despues se normalizan rutas, copiar (no mover destructivamente) GLB de pets con su Textures/colormap.png, previews/licencia seleccionados; para Skeletons, GLB elegidos, bibliotecas necesarias y accesorios con BIN/textura y licencia. Actualizar URLs/metadata y comprobar hashes/carga antes de retirar cualquier original con aprobacion humana. Reutilizar el Warrior anterior si se elige esa variante, sin copiarlo nuevamente.

No es necesaria una descarga, reinstalacion, nuevo backend, cambio del mundo ni motor RPG para catalogar estos recursos.

## Validacion realizada

163/163 tests de src, incluidos cinco tests del catalogo: IDs/categorias, hashes/dependencias, metadata no ejecutable y Warrior legacy. Lint focalizado sin errores. Desde el panel DEV se comprobo carga real GLTFLoader de los 24 pets, cuatro esqueletos y 13 accesorios (GLB/GLTF/BIN/texturas), sin errores de consola. Se guardaron capturas del catalogo fuera del repositorio. Esto certifica carga/parsing, no un futuro follower, combate, retargeting completo ni aprobacion visual dentro del mundo. Los packs nuevos permanecen sin seguimiento en Git; no se hizo staging ni commit.
