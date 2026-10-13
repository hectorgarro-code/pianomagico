import {FIRST_MINUTES as F} from '../../gameplay/firstMinutes.js';

// A short clockwise loop inside the existing Plaza. No terrain or vegetation changes.
export const FIRST_MINUTES_TARGETS = [
  {id:F.box,regionId:'PLAZA_DE_LAS_NOTAS',type:'DESTRUCTIBLE',assetId:'existing:/models/props/Assets/gltf/box_small.gltf',position:[1,0,-1],rotation:[0,.3,0],scale:[.8,.8,.8],radius:.55,hitsRequired:1,behaviorType:'stationary',hitReaction:'none',toy:true,enabledInWorld:true,optionalReward:null,firstMinutesOnly:true,requiresNote:F.note},
  {id:F.enemy,regionId:'PLAZA_DE_LAS_NOTAS',type:'WORLD_CREATURE',assetId:'kaykit-skeletons:Skeleton_Minion',position:[5,0,-2],rotation:[0,Math.PI,0],scale:[.7,.7,.7],radius:.4,hitsRequired:2,behaviorType:'wander',hitReaction:'Hit_A',toy:true,enabledInWorld:true,optionalReward:null,firstMinutesOnly:true,requiresNote:F.drop,training:true},
];
export const FIRST_MINUTES_NOTES = [
  {id:F.note,position:[1.6,0,2],pitch:'C4',firstMinutesOnly:true},
  {id:F.drop,position:[1,0,-1],pitch:'E4',sourceId:F.box,firstMinutesOnly:true},
];
export const FIRST_MINUTES_PATH = [[8,0,-4],[9,0,-8],[9,0,-12],[10,0,-16],[13,0,-19]];
