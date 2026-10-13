import {FOREST_MUSIC} from './musicalMechanismComposition.js';
import {FRIENDLY_NOTE} from './friendlyComposition.js';
import {EXPLORATION_NOTES,EXPLORATION_TARGETS} from './explorationSecrets.js';
import {FIRST_MINUTES_NOTES,FIRST_MINUTES_TARGETS} from './firstMinutesComposition.js';
const prop=(id,regionId,asset,x,z,hitsRequired,dropId)=>({id,regionId,type:'DESTRUCTIBLE',
  assetId:`existing:/models/props/Assets/gltf/${asset}.gltf`,assetUrl:`/models/props/Assets/gltf/${asset}.gltf`,
  position:[x,0,z],rotation:[0,.25,0],scale:[.8,.8,.8],radius:.55,hitsRequired,hitReaction:'none',
  behaviorType:'stationary',enabledInWorld:true,optionalReward:null,dropId,toy:true});
const enemy=(id,x,z,name,hitsRequired,dropId)=>({id,regionId:'BOSQUE_DE_LAS_NOTAS',type:'WORLD_CREATURE',
  assetId:`kaykit-skeletons:Skeleton_${name}`,position:[x,0,z],rotation:[0,Math.PI,0],scale:[.8,.8,.8],
  radius:.45,hitsRequired,hitReaction:'Hit_A',behaviorType:'wander',enabledInWorld:true,optionalReward:null,dropId,toy:true});
const note=(id,x,z,pitch,sourceId=null,secretId=null)=>({id,position:[x,0,z],pitch,sourceId,secretId});
export const TOY_SECRET='forest-note-nook';
export const PLAZA_TOY={worldActions:[
  prop('toy-plaza-box','PLAZA_DE_LAS_NOTAS','box_small',8.5,-7.5,1,'note-box'),
  prop('toy-plaza-barrel','PLAZA_DE_LAS_NOTAS','barrel_large',15,-14,2,'note-barrel'),
],notes:[note('note-arrival',1.5,2,'C4'),note('note-plaza',3,-4,'D4'),note('note-exit',5,-12,'E4'),note('note-corner',10,-18,'G4'),
  note('note-box',8.5,-7.5,'E4','toy-plaza-box'),note('note-barrel',15,-14,'G4','toy-plaza-barrel')]};
export const FOREST_TOY={worldActions:[
  prop('toy-forest-box','BOSQUE_DE_LAS_NOTAS','box_small_decorated',19.4,-30,2,'note-forest-box'),
  prop('toy-forest-barrel','BOSQUE_DE_LAS_NOTAS','barrel_small',5.5,-41,1,null),
  prop('toy-forest-keg','BOSQUE_DE_LAS_NOTAS','keg',-10,-45,3,'note-keg'),
  enemy('toy-minion',8,-33,'Minion',2,'note-minion'),enemy('toy-warrior',-4,-44,'Warrior',3,'note-warrior'),
],notes:[note('note-arriving-forest',14,-22,'C5'),note('note-clearing',12,-30,'D5'),note('note-bend',3,-34,'E5'),note('note-north',-2,-43,'G5'),
  note('note-forest-box',19.4,-30,'C5','toy-forest-box'),note('note-keg',-10,-45,'G4','toy-forest-keg'),
  note('note-minion',8,-33,'E5','toy-minion'),note('note-warrior',-4,-44,'G5','toy-warrior'),
  note('note-secret-a',16.7,-33,'C5',null,TOY_SECRET),note('note-secret-b',17.5,-33.8,'E5',null,TOY_SECRET),note('note-secret-c',18.2,-33,'G5',null,TOY_SECRET)]};
export const TOY_NOTES=[...PLAZA_TOY.notes,...FOREST_TOY.notes,...FOREST_MUSIC.rewards.map(n=>({...n,secretId:'forest-runes-cache'})),FRIENDLY_NOTE,...EXPLORATION_NOTES,...FIRST_MINUTES_NOTES];
export const TOY_TARGETS=[...PLAZA_TOY.worldActions,...FOREST_TOY.worldActions,...EXPLORATION_TARGETS,...FIRST_MINUTES_TARGETS];

export function toyWorldActions(content,compositions) {
  if(content.editorVersion===1)return content.worldActions;
  const authored=compositions.filter(c=>c.gameplay);
  const regions=new Set(authored.map(c=>c.regionId));
  return [...content.worldActions.filter(t=>!regions.has(t.regionId)),...authored.flatMap(c=>c.gameplay.worldActions),...EXPLORATION_TARGETS,...FIRST_MINUTES_TARGETS];
}
