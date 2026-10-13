import {instance} from './prototypeAuthoring.js';
import {FOREST_MUSIC} from './musicalMechanismComposition.js';

export const RUINS_SECRET_MUSIC={...FOREST_MUSIC,id:'ruins-side-runes',regionId:'RUINAS_DEL_GRAN_PENTAGRAMA',position:[17,0,-104],
  sequence:['E4','C4','G4'],rewards:[]};
export const EXPLORATION_MECHANISMS=[FOREST_MUSIC,RUINS_SECRET_MUSIC];
const secret=(id,regionId,type,position,approach,cue)=>({id,regionId,type,position,approach,cue,reward:'LOST_NOTES'});
export const EXPLORATION_SECRETS=[
  secret('forest-note-nook','BOSQUE_DE_LAS_NOTAS','HIDDEN_TRAIL',[17.5,0,-33.8],[[12,-28],[16,-31],[17.5,-33.8]],'A glimpse of notes behind the clearing vegetation.'),
  secret('forest-runes-cache','BOSQUE_DE_LAS_NOTAS','MUSICAL_MECHANISM',[-6,0,-32],[[-2,-29],[-6,-27],[-6,-32]],'Three musical stones beside the existing side door.'),
  secret('river-resonant-barrel','RIO_DEL_RITMO','DESTRUCTIBLE',[-40.5,0,-69],[[-34,-65.5],[-38,-65.5],[-40.5,-67.5],[-40.5,-69]],'One marked barrel away from the bridge traffic.'),
  secret('river-bridge-pocket','RIO_DEL_RITMO','ARCHITECTURE_NOOK',[-23,0,-67.4],[[-23,-64],[-22,-65.5],[-23,-67.4]],'Two worn planks curve behind the bridge support.'),
  secret('mountain-stone-chord','MONTANA_DE_LAS_MELODIAS','ELEMENT_GROUP',[41.3,0,-58.7],[[27,-60],[31,-59],[37,-59],[41.3,-58.7]],'Three small stones form an incomplete chord around a gap.'),
  secret('mountain-banner-trail','MONTANA_DE_LAS_MELODIAS','DETOUR',[41,0,-77],[[37,-75],[39,-76],[41,-77]],'Two small paving stones continue past the lookout banner.'),
  secret('ruins-wall-whisper','RUINAS_DEL_GRAN_PENTAGRAMA','ARCHITECTURE_NOOK',[-15.4,0,-97.6],[[-6,-94],[-11,-88],[-16,-89],[-16,-97.6]],'Warm torchlight glimpsed beyond the western arch.'),
  secret('ruins-runes-cache','RUINAS_DEL_GRAN_PENTAGRAMA','MUSICAL_MECHANISM',[17,0,-107],[[6,-99],[15,-100],[17,-102],[17,-107]],'Three lit stones at the side of the broken eastern wall.'),
  secret('observatory-last-echo','OBSERVATORIO_MUSICAL','DETOUR',[-7.3,0,-132.3],[[0,-128],[-5,-131],[-7.3,-132.3]],'A short line of pale paving leads behind the outer column.'),
];
const reward=(id,x,z,pitch,secretId,extra={})=>({id,position:[x,0,z],pitch,secretId,revealRadius:5,...extra});
export const EXPLORATION_NOTES=[
  reward('secret-river-barrel-a',-40.5,-69,'C5','river-resonant-barrel',{sourceId:'secret-river-barrel'}),
  reward('secret-river-barrel-b',-41.2,-69.5,'G5','river-resonant-barrel',{sourceId:'secret-river-barrel'}),
  reward('secret-river-pocket-a',-23,-67.4,'D5','river-bridge-pocket'),
  reward('secret-river-pocket-b',-22.6,-68,'A5','river-bridge-pocket'),
  reward('secret-mountain-chord-a',41.3,-58.7,'C5','mountain-stone-chord'),
  reward('secret-mountain-chord-b',41.9,-58.3,'E5','mountain-stone-chord'),
  reward('secret-mountain-trail-a',41,-77,'G5','mountain-banner-trail'),
  reward('secret-mountain-trail-b',41.6,-77.5,'C6','mountain-banner-trail'),
  reward('secret-ruins-wall-a',-15.4,-97.6,'E4','ruins-wall-whisper'),
  reward('secret-ruins-wall-b',-15.7,-98.3,'G4','ruins-wall-whisper'),
  reward('secret-ruins-runes-a',16.5,-107,'E5','ruins-runes-cache',{mechanismId:RUINS_SECRET_MUSIC.id}),
  reward('secret-ruins-runes-b',17.5,-107.4,'G5','ruins-runes-cache',{mechanismId:RUINS_SECRET_MUSIC.id}),
  reward('secret-observatory-a',-7.3,-132.3,'G5','observatory-last-echo'),
  reward('secret-observatory-b',-7.7,-133,'C6','observatory-last-echo'),
];
export const EXPLORATION_TARGETS=[{
  id:'secret-river-barrel',regionId:'RIO_DEL_RITMO',type:'DESTRUCTIBLE',
  assetId:'existing:/models/props/Assets/gltf/barrel_small.gltf',
  position:[-40.5,0,-69],rotation:[0,.25,0],scale:[.85,.85,.85],radius:.55,hitsRequired:2,
  hitReaction:'none',behaviorType:'stationary',enabledInWorld:true,optionalReward:null,toy:true,
  explorationSecretId:'river-resonant-barrel',
}];
const cue=(regionId,id,name,x,z,scale,kind='props')=>({...instance(id,name,x,z,scale,kind),regionId});
const floor=(region,id,x,z,scale)=>({...cue(region,id,'floor_tile_large',x,z,scale),collision:{type:'none'}});
export const EXPLORATION_CUES=[
  {...cue('RIO_DEL_RITMO','secret-river-plank-1','floor_wood_large',-23.5,-65.6,.25),collision:{type:'none'}},
  {...cue('RIO_DEL_RITMO','secret-river-plank-2','floor_wood_large',-23,-66.4,.2),collision:{type:'none'}},
  cue('MONTANA_DE_LAS_MELODIAS','secret-chord-rock-1','Rock_3_A_Color1',37,-58.8,.3,'rocks'),
  cue('MONTANA_DE_LAS_MELODIAS','secret-chord-rock-2','Rock_3_A_Color1',39.2,-58,.23,'rocks'),
  cue('MONTANA_DE_LAS_MELODIAS','secret-chord-rock-3','Rock_3_A_Color1',41.1,-58.4,.35,'rocks'),
  floor('MONTANA_DE_LAS_MELODIAS','secret-banner-step-1',39.1,-76,.22),
  floor('MONTANA_DE_LAS_MELODIAS','secret-banner-step-2',40,-76.6,.18),
  {...cue('RUINAS_DEL_GRAN_PENTAGRAMA','secret-wall-torch','torch_lit',-14,-96.6,.55),collision:{type:'none'}},
  floor('OBSERVATORIO_MUSICAL','secret-summit-step-1',-6.2,-131.3,.2),
  floor('OBSERVATORIO_MUSICAL','secret-summit-step-2',-6.8,-132,.17),
];
// Additive layers reuse the materializer; original terrain/routes/landmarks stay untouched.
export function explorationOverlay(base){
  return {...base,groupName:base.groupName+'_Exploration',paths:[],
    instances:EXPLORATION_CUES.filter(c=>c.regionId===base.regionId),
    stations:[],adventureObjects:[],landmarks:[],entries:[],exits:[],boundaries:[],
    openZones:[],clearZones:[],pointsOfInterest:[],sightlines:[],gates:[],lights:[]};
}
