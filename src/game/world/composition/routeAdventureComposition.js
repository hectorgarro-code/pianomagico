import { FOREST_LESSON_CHESTS, ADVENTURE_OBJECT_TYPES, REWARD_TYPES } from './forestAdventureComposition.js';
function chests(prefix, regionId, definitions) {
  return definitions.map(([activityId,x,z], index) => {
    const id = `${prefix}-chest-0${index+1}`;
    return { id, label: `${prefix === 'river' ? 'Rio' : 'Montana'} - Cofre 0${index+1}`,
      type: ADVENTURE_OBJECT_TYPES.LESSON_CHEST, regionId, instanceId: id+'-model', activityId,
      interaction: {key:'KeyE',radius:3}, requirements: {completedObjects: index ? [`${prefix}-chest-0${index}`] : FOREST_LESSON_CHESTS.map(c=>c.id)},
      reward: {id:id+'-progress',type:REWARD_TYPES.REGION_PROGRESS,regionId,unlocks:index<2?[`${prefix}-chest-0${index+2}`]:[],segmentCompleted:index===2,label:index===2?'Ruta completada':'Siguiente cofre disponible'},
      instance: {id:id+'-model',role:'importantProp',kind:'props',assetUrl:'/models/props/chest_wood.glb',position:[x,.04,z],rotation:[0,Math.PI,0],scale:[1.2,1.2,1.2],grounding:'terrain',castShadow:true,receiveShadow:true,collision:{type:'solid',shape:'box',source:'bounds'}} };
  });
}
export const RIVER_LESSON_CHESTS = chests('river','RIO_DEL_RITMO',[[4,-21,-60],[5,-36,-69],[6,-34,-77]]);
export const MOUNTAIN_LESSON_CHESTS = chests('mountain','MONTANA_DE_LAS_MELODIAS',[[7,23,-59],[9,35,-67],[10,25,-77]]);
export const ROUTE_LESSON_CHESTS = [...RIVER_LESSON_CHESTS,...MOUNTAIN_LESSON_CHESTS];
export const ALL_LESSON_CHESTS = [...FOREST_LESSON_CHESTS,...ROUTE_LESSON_CHESTS];
