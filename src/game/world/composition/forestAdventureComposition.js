import { FOREST_COMPOSITION } from './forestComposition.js';

export const ADVENTURE_OBJECT_TYPES = Object.freeze({
  LESSON_CHEST: 'LESSON_CHEST', PRACTICE_STATION: 'PRACTICE_STATION',
  CHALLENGE: 'CHALLENGE', SECRET_REWARD: 'SECRET_REWARD'
});
export const REWARD_TYPES = Object.freeze({ XP: 'XP', MEDAL: 'MEDAL', SONG_UNLOCK: 'SONG_UNLOCK', REGION_PROGRESS: 'REGION_PROGRESS' });

// Exact IDs from the existing piano catalog, not its mutable display order.
export const FOREST_LESSON_CHESTS = [
  { id: 'forest-chest-01', label: 'Cofre 01', position: [20, 0.04, -22], activityId: 1, requires: [], unlocks: ['forest-chest-02'] },
  { id: 'forest-chest-02', label: 'Cofre 02', position: [17, 0.04, -28], activityId: 2, requires: ['forest-chest-01'], unlocks: ['forest-chest-03'] },
  { id: 'forest-chest-03', label: 'Cofre 03', position: [3, 0.04, -40], activityId: 3, requires: ['forest-chest-02'], unlocks: [] }
].map((chest, index) => ({
  id: chest.id, label: chest.label, type: ADVENTURE_OBJECT_TYPES.LESSON_CHEST,
  regionId: FOREST_COMPOSITION.regionId, instanceId: chest.id + '-model',
  activityId: chest.activityId, interaction: { key: 'KeyE', radius: 3 },
  requirements: { completedObjects: chest.requires },
  reward: { id: chest.id + '-progress', type: REWARD_TYPES.REGION_PROGRESS,
    regionId: FOREST_COMPOSITION.regionId, unlocks: chest.unlocks,
    segmentCompleted: index === 2,
    label: index === 2 ? 'Recorrido del Bosque completado' : `Cofre 0${index + 2} disponible` },
  instance: { id: chest.id + '-model', role: 'importantProp', kind: 'props',
    assetUrl: '/models/props/chest_wood.glb', position: chest.position,
    rotation: [0, Math.PI, 0], scale: [1.2, 1.2, 1.2], grounding: 'terrain',
    castShadow: true, receiveShadow: true, collision: { type: 'solid', shape: 'box', source: 'bounds' } }
}));

// An additive gameplay layer. The approved geography and vegetation stay unchanged.
export const FOREST_ADVENTURE_COMPOSITION = {
  ...FOREST_COMPOSITION,
  instances: [...FOREST_COMPOSITION.instances, ...FOREST_LESSON_CHESTS.map(object => object.instance)],
  adventureObjects: FOREST_LESSON_CHESTS
};
