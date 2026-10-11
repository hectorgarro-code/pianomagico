# Content Platform 1 - registro local de assets

Alcance de esta entrega: catalogo administrativo y auditoria local de los dos packs autorizados. No existia una Content Platform independiente en el checkout; se integra en el panel de inventario/diagnostico DEV existente. No se implementa un World Editor ni una plataforma CRUD/backend por referencia a una fase sin especificacion disponible.

## Autoridades

- `src/game/assets/assetCatalog.js`: categorias e IDs estables del catalogo.
- `src/game/assets/localAssetPacks.json`: metadata obtenida directamente de GLB/GLTF y archivos locales, no de publicidad.
- `scripts/auditLocalAssetPacks.mjs`: auditor reproducible. `node scripts/auditLocalAssetPacks.mjs --write` regenera solamente la metadata; no toca los packs.
- `AssetDiagnosticModal.jsx`: consulta y comprobacion de carga, solo en DEV + `?debug=1` desde Assets KayKit. El catalogo completo se importa al abrir, no se precargan sus modelos en el juego.
- `kaykitCatalog.json` y `assetManifest.js` mantienen los contratos existentes de generacion/cache. No se modifican las composiciones.

## Categorias

CHARACTER_PLAYER, PET, WORLD_CREATURE, PROP, DESTRUCTIBLE, ARCHITECTURE, VEGETATION, DECORATION.

PET contiene 24 registros. WORLD_CREATURE contiene 4; el Warrior anterior es una variante documentada del mismo concepto, no una quinta criatura. Los 13 accesorios del pack son PROP, no enemigos ni objetos destructibles por nombre. DESTRUCTIBLE queda vacia hasta una definicion humana explicita.

Los assets anteriores reciben una categoria administrativa sin atribuirles bounds, licencias o capacidades no re-auditadas. Los personajes jugadores siguen siendo los cinco aventureros actuales, nunca los esqueletos.

## Contratos futuros, no implementados

PET referencia assetId/collectionKey y clips candidatos para companion; no guarda una coleccion, otorga recompensas ni ejecuta follower AI. Escala a 0.5 unidades de altura es una sugerencia de comparacion, no colocacion aprobada.

WORLD_CREATURE declara bibliotecas y candidatos de reaccion/derrota disponibles. behavior, hitsRequired, attackable, defeatEffect y optionalReward permanecen null. El rango permitido de una futura accion es 1-3 impactos; no hay stats RPG, dano, barras, targeting, combos ni inventario. NPC amistoso es un concepto distinto: la categoria no convierte automaticamente ningun personaje en atacable.

Content Platform decide que existe. El futuro World Editor decidira donde aparece y sus opciones concretas. `enabledInWorld: false` y `placement: null` no autorizan instancias.

Auditoria completa: `ASSET_CATALOG_AUDIT.md`. No descarga, renombrado, movimiento, borrado, push ni commit en esta fase.
