import { getCatalogAssets } from '../assets/assetCatalog.js';

const petNames = { 'animal-elephant': 'Elefante Melodia', 'animal-cat': 'Gato Magico', 'animal-dog': 'Perrito Sol', 'animal-bee': 'Abeja Nota', 'animal-bunny': 'Conejo Armonia', 'animal-panda': 'Panda del Eco', 'animal-parrot': 'Pajaro Do', 'animal-deer': 'Ciervo del Valle' };
export const PETS = getCatalogAssets('PET').map(asset => ({ id: asset.id, assetId: asset.id, name: petNames[asset.name] || asset.name.replace('animal-', ''), enabled: true }));
const rewardPets = ['elephant', 'cat', 'dog', 'bee', 'bunny', 'panda', 'parrot', 'deer'];
export const ACTIVITY_PET_REWARDS = { 'forest-chest-01': 'pet-elephant', 'forest-chest-03': 'pet-cat', 'river-chest-03': 'pet-dog', 'mountain-chest-03': 'pet-bee', 'grotto-echo-reward': 'pet-panda' };
const target = (id, regionId, x, z, hitsRequired, creature = null) => ({ id, regionId, type: creature ? 'WORLD_CREATURE' : 'DESTRUCTIBLE',
  assetId: creature ? `kaykit-skeletons:Skeleton_${creature}` : 'existing:/models/props/Assets/gltf/barrel_small.gltf',
  position: [x, 0, z], rotation: [0, Math.PI, 0], scale: creature ? [.8, .8, .8] : [.9, .9, .9],
  hitsRequired, hitReaction: creature ? 'Hit_A' : 'none', defeatEffect: 'musical-particles', behaviorType: creature ? 'wander' : 'stationary', optionalReward: null, enabledInWorld: true });
const regions = [
  ['PLAZA_DE_LAS_NOTAS', [[-10, 3]], []],
  ['BOSQUE_DE_LAS_NOTAS', [[10,-24],[1,-35],[-5,-43]], [[6,-32,'Minion'],[1,-44,'Warrior']]],
  ['RIO_DEL_RITMO', [[-20,-61],[-31,-66],[-36,-73],[-26,-84]], [[-24,-61,'Minion'],[-31,-71,'Rogue'],[-23,-84,'Mage']]],
  ['MONTANA_DE_LAS_MELODIAS', [[25,-59],[33,-64],[26,-72],[15,-80]], [[29,-60,'Warrior'],[30,-68,'Rogue'],[22,-77,'Mage']]],
  ['GRUTA_DEL_ECO', [[-30,-54]], [[-35,-52,'Minion']]],
  ['RUINAS_DEL_GRAN_PENTAGRAMA', [[-8,-91],[8,-97],[-7,-103]], [[-4,-92,'Warrior'],[4,-100,'Mage']]],
];
export function createGameplayContent() {
  return { gameplayVersion: 1, pets: structuredClone(PETS), rewards: rewardPets.map(name => ({ id: `pet-${name}`, type: 'PET', referenceId: `kenney-cube-pets:animal-${name}`, presentation: petNames[`animal-${name}`], enabled: true })),
    worldActions: regions.flatMap(([region, props, creatures]) => [
      ...props.map(([x,z],i) => target(`${region}-break-${i+1}`, region, x,z, i%3+1)),
      ...creatures.map(([x,z,name],i) => target(`${region}-creature-${i+1}`,region,x,z,2+i%2,name)),
    ]),
    minigames: [
      { id:'river-rhythm', name:'El pulso del puente', type:'RHYTHM', enabled:true, configuration:{ bpm:60, pattern:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], toleranceMs:220 }, rewardId:'pet-bunny' },
      { id:'mountain-memory', name:'El eco de la cima', type:'SEQUENCE', enabled:true, configuration:{notePool:['C4','D4','E4','G4'],sequenceLength:3,rounds:3}, rewardId:'pet-parrot' },
      { id:'ruins-notes', name:'Las voces del santuario', type:'NOTE_RECOGNITION', enabled:true, configuration:{notePool:['C4','D4','E4','F4','G4'],questionCount:5,presentationMode:'visual',difficulty:'easy'}, rewardId:'pet-deer' },
      { id:'grotto-memory', name:'El eco escondido', type:'SEQUENCE', enabled:true, configuration:{notePool:['C4','E4','G4'],sequenceLength:3,rounds:2}, rewardId:null },
    ], gates:[
      {id:'river-musical-gate',regionId:'RIO_DEL_RITMO',position:[-23,0,-64],rotation:[0,Math.PI/2,0],scale:[1,1,1],minigameId:'river-rhythm',enabled:true,requirements:[]},
      {id:'mountain-musical-gate',regionId:'MONTANA_DE_LAS_MELODIAS',position:[31,0,-66],rotation:[0,0,0],scale:[1,1,1],minigameId:'mountain-memory',enabled:true,requirements:[]},
      {id:'ruins-musical-gate',regionId:'RUINAS_DEL_GRAN_PENTAGRAMA',position:[0,0,-96],rotation:[0,0,0],scale:[1,1,1],minigameId:'ruins-notes',enabled:true,requirements:[]},
      {id:'grotto-musical-gate',regionId:'GRUTA_DEL_ECO',position:[-31,0,-52],rotation:[0,Math.PI/2,0],scale:[.75,.75,.75],minigameId:'grotto-memory',enabled:true,requirements:[]},
    ] };
}

export function upgradeGameplayContent(content) {
  if (content.gameplayVersion === 1) return structuredClone(content);
  const defaults = createGameplayContent(), result = { ...structuredClone(content), gameplayVersion:1, pets:defaults.pets };
  for (const key of ['rewards','worldActions','minigames','gates']) result[key] = [...(content[key] || []), ...defaults[key].filter(record => !content[key]?.some(existing => existing.id === record.id))];
  result.activities = content.activities.map(activity => ({ ...activity, rewardId: activity.rewardId || ACTIVITY_PET_REWARDS[activity.id] || null }));
  return result;
}
let current = createGameplayContent();
export const getGameplayContent = () => current;
export const setGameplayContent = content => { current = content; };
