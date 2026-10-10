import { composition, instance, path } from './prototypeAuthoring.js';
import { FINAL_CHALLENGE } from './finalAdventureComposition.js';

// Explicit open circular colonnade, with a southern arrival gap and no ceiling.
const columns = [[-7,-123],[-8,-129],[-5,-134],[5,-134],[8,-129],[7,-123]].map(([x,z], index) => ({
  ...instance(`observatory-column-${index}`,'pillar_decorated',x,z,1,'props',index<3 ? .5 : -.5),scale:[.7,1.4,.7],
}));
const paving = [[-4,-124],[0,-124],[4,-124],[-4,-128],[0,-128],[4,-128],[-4,-132],[0,-132],[4,-132]].map(([x,z],index) => ({
  ...instance(`observatory-paving-${index}`,'floor_tile_large',x,z,1,'props'),collision:{type:'none'},
}));
const gate = {...instance('observatory-ascent-gate','wall',0,-110,1,'props'),assetUrl:'/models/props/gate.glb',scale:[1.5,1,1]};
export const OBSERVATORY_COMPOSITION = composition('OBSERVATORIO_MUSICAL','Observatory',[
  path('final-ascent',[[0,-108],[0,-113],[0,-119],[0,-124]],4),
  path('observatory-arrival',[[0,-124],[0,-128],[0,-131]],4),
], [...columns,...paving,gate,
  instance('ascent-rock-west','Rock_3_A_Color1',-5,-111,3),
  instance('ascent-rock-east','Rock_3_A_Color1',5,-111,3),
  {...instance('observatory-banner-west','banner_patternA_white',-7,-123,.9,'props'),collision:{type:'none'}},
  {...instance('observatory-banner-east','banner_patternA_white',7,-123,.9,'props'),collision:{type:'none'}},
  {...instance('observatory-torch-west','torch_lit',-4,-121,1,'props'),collision:{type:'none'}},
  {...instance('observatory-torch-east','torch_lit',4,-121,1,'props'),collision:{type:'none'}},
  FINAL_CHALLENGE.instance,
]);
OBSERVATORY_COMPOSITION.adventureObjects = [FINAL_CHALLENGE];
OBSERVATORY_COMPOSITION.gates = [{id:'observatory-entry-binding',gateId:'ruins_to_observatory',instanceId:gate.id}];
OBSERVATORY_COMPOSITION.landmarks = [{id:'open-sky-colonnade',memberIds:columns.map(item => item.id)}];
OBSERVATORY_COMPOSITION.openZones = [{id:'final-arrival-clear',shape:'circle',center:[0,-128],radius:5,excludes:['rocks','trees']}];
OBSERVATORY_COMPOSITION.lights = [{id:'summit-light',position:[0,12,-127],color:0xffefba,intensity:15,distance:20}];
