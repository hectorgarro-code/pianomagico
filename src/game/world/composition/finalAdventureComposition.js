import { ADVENTURE_OBJECT_TYPES as TYPES, REWARD_TYPES } from './forestAdventureComposition.js';
import { ROUTE_LESSON_CHESTS } from './routeAdventureComposition.js';

function activity(id, label, regionId, activityId, position, completedObjects, type = TYPES.LESSON_CHEST) {
  return { id, label, regionId, activityId, type, instanceId: `${id}-model`,
    interaction: { key: 'KeyE', radius: 3 }, requirements: { completedObjects },
    reward: { id: `${id}-progress`, type: REWARD_TYPES.REGION_PROGRESS, regionId, label: `${label} completado` },
    instance: { id: `${id}-model`, role: 'importantProp', kind: 'props',
      assetUrl: type === TYPES.CHALLENGE ? '/models/props/chest_gold.glb' : '/models/props/chest_wood.glb',
      position, rotation: [0, Math.PI, 0], scale: [1, 1, 1], grounding: 'terrain',
      castShadow: true, receiveShadow: true, collision: { type: 'solid', shape: 'box', source: 'bounds' } } };
}
export const RUINS_ACTIVITIES = [
  activity('ruins-chest-01', 'Ruinas - Primera voz', 'RUINAS_DEL_GRAN_PENTAGRAMA', 11, [-6, .04, -94], ROUTE_LESSON_CHESTS.map(c => c.id)),
  activity('ruins-chest-02', 'Ruinas - Segunda voz', 'RUINAS_DEL_GRAN_PENTAGRAMA', 12, [6, .04, -99], ['ruins-chest-01']),
  activity('ruins-challenge', 'Desafio del Gran Pentagrama', 'RUINAS_DEL_GRAN_PENTAGRAMA', 13, [0, .04, -104], ['ruins-chest-02'], TYPES.CHALLENGE),
];
export const FINAL_CHALLENGE = activity('observatory-final-challenge', 'Desafio final del Valle',
  'OBSERVATORIO_MUSICAL', 35, [0, .04, -126], ['ruins-challenge'], TYPES.CHALLENGE);
export const GROTTO_REWARD = {
  ...activity('grotto-echo-reward', 'El eco del Valle', 'GRUTA_DEL_ECO', null, [-33, .04, -54], [], TYPES.SECRET_REWARD),
  reward: { id: 'echo-grotto-keepsake', type: REWARD_TYPES.REGION_PROGRESS, regionId: 'GRUTA_DEL_ECO', label: 'El eco del Valle descubierto' },
};
GROTTO_REWARD.instance.assetUrl = '/models/props/chest_gold.glb';
export const FINAL_ADVENTURE_OBJECTS = [...RUINS_ACTIVITIES, FINAL_CHALLENGE, GROTTO_REWARD];
