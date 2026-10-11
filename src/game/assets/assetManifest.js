/**
 * assetManifest.js
 * Biblioteca unificada y catálogo central de assets 3D de KayKit.
 * Gestión de caché, instanciación con SkeletonUtils, y acceso categorizado.
 */
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import catalog from './kaykitCatalog.json' with { type: 'json' };

export const ASSET_MANIFEST = {
  characters: {
    knight: '/models/characters/Knight.glb',
    mage: '/models/characters/Mage.glb',
    barbarian: '/models/characters/Barbarian.glb',
    rogue: '/models/characters/Rogue.glb',
    ranger: '/models/characters/Characters/gltf/Ranger.glb',
    rogue_hooded: '/models/characters/Characters/gltf/Rogue_Hooded.glb',
    skeleton_warrior: '/models/characters/Skeleton_Warrior.glb'
  },
  props: {
    chest_gold: '/models/props/chest_gold.glb',
    chest_wood: '/models/props/chest_wood.glb',
    gate: '/models/props/gate.glb',
    barrel: '/models/props/barrel.glb',
    crates: '/models/props/crates.glb',
    coin: '/models/props/coin.glb',
    pillar: '/models/props/pillar.glb',
    floor_tile: '/models/props/floor_tile.glb'
  }
};

export const KAYKIT_ASSETS = {
  characters: ASSET_MANIFEST.characters,
  animations: {
    movement: '/models/characters/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb',
    general: '/models/characters/Animations/gltf/Rig_Medium/Rig_Medium_General.glb'
  },
  forest: {
    trees: catalog.trees,
    bushes: catalog.bushes,
    rocks: catalog.rocks,
    grass: catalog.grass,
    trunks: catalog.trunks
  },
  dungeon: {
    walls: catalog.walls,
    floors: catalog.floors,
    columns: catalog.columns,
    stairs: catalog.stairs,
    containers: catalog.containers,
    props: catalog.dungeonProps,
    furniture: catalog.furniture,
    banners: catalog.banners
  },
  accessories: catalog.accessories,
  legacyProps: ASSET_MANIFEST.props
};

const loader = new GLTFLoader();
const modelCache = new Map();
const loadingPromises = new Map();

/**
 * Carga un modelo 3D con caché singleton para evitar lecturas de red o disco repetidas.
 * @param {string} url - Ruta relativa al archivo .glb / .gltf
 * @returns {Promise<any>}
 */
export const loadCachedModel = (url) => {
  if (!url) return Promise.resolve(null);
  if (modelCache.has(url)) {
    return Promise.resolve(modelCache.get(url));
  }
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url);
  }

  const p = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        modelCache.set(url, gltf);
        loadingPromises.delete(url);
        resolve(gltf);
      },
      undefined,
      (err) => {
        console.warn(`[AssetManifest] Error al cargar ${url}:`, err);
        loadingPromises.delete(url);
        reject(err);
      }
    );
  });
  loadingPromises.set(url, p);
  return p;
};

/**
 * Instancia un modelo cargado.
 * Usa SkeletonUtils.clone si es un personaje riggeado, o clone(true) estándar para props.
 * Configura sombras castShadow / receiveShadow automáticamente.
 * @param {string} url
 * @param {{ isCharacter?: boolean, castShadow?: boolean, receiveShadow?: boolean }} options
 * @returns {Promise<import('three').Object3D | null>}
 */
export const instantiateModel = async (url, options = {}) => {
  const { isCharacter = false, castShadow = true, receiveShadow = true } = options;
  try {
    const gltf = await loadCachedModel(url);
    if (!gltf || !gltf.scene) return null;

    const instance = isCharacter
      ? SkeletonUtils.clone(gltf.scene)
      : gltf.scene.clone(true);

    instance.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });

    return instance;
  } catch (e) {
    console.warn(`[AssetManifest] Error instanciando ${url}:`, e);
    return null;
  }
};

/**
 * Precarga una lista o categoría de URLs en paralelo.
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export const preloadCategory = async (urls = []) => {
  await Promise.allSettled(urls.map((u) => loadCachedModel(u)));
};

/**
 * Devuelve estadísticas de la biblioteca para diagnóstico.
 */
export const getAssetStats = () => {
  return {
    cachedCount: modelCache.size,
    treesCount: KAYKIT_ASSETS.forest.trees.length,
    bushesCount: KAYKIT_ASSETS.forest.bushes.length,
    rocksCount: KAYKIT_ASSETS.forest.rocks.length,
    grassCount: KAYKIT_ASSETS.forest.grass.length,
    trunksCount: KAYKIT_ASSETS.forest.trunks.length,
    wallsCount: KAYKIT_ASSETS.dungeon.walls.length,
    floorsCount: KAYKIT_ASSETS.dungeon.floors.length,
    columnsCount: KAYKIT_ASSETS.dungeon.columns.length,
    stairsCount: KAYKIT_ASSETS.dungeon.stairs.length,
    containersCount: KAYKIT_ASSETS.dungeon.containers.length,
    dungeonPropsCount: KAYKIT_ASSETS.dungeon.props.length,
    furnitureCount: KAYKIT_ASSETS.dungeon.furniture.length,
    bannersCount: KAYKIT_ASSETS.dungeon.banners.length,
    charactersCount: Object.keys(KAYKIT_ASSETS.characters).length,
    accessoriesCount: KAYKIT_ASSETS.accessories.length
  };
};
