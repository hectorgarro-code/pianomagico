import { composition, instance, path } from './prototypeAuthoring.js';
import { RUINS_ACTIVITIES } from './finalAdventureComposition.js';

// Five authored architectural lines evoke the staff; the central aisle stays open.
const rows = [-91,-95,-99,-103,-107];
const columns = rows.flatMap((z, index) => [-10,10].map(x => ({
  ...instance(`ruins-staff-${index}-${x < 0 ? 'west' : 'east'}`, 'column', x,z,1,'props'),
  scale:[1.4,index === 3 ? 1.5 : 2.5,1.4],
})));
const walls = [-95,-103].flatMap((z,index) => [-13,13].map(x => ({
  ...instance(`ruins-wall-${index}-${x}`, index ? 'wall_broken' : 'wall_arched', x,z,1,'props',Math.PI/2),
  scale:[2,1,1],
})));
const floor = rows.map((z,index) => ({
  ...instance(`ruins-staff-floor-${index}`, 'floor_tile_large', 0,z,1,'props'),
  scale:[2.4,1,.15],collision:{type:'none'},
}));
const gate = { ...instance('ruins-entry-gate','wall',0,-89,1,'props'),
  assetUrl:'/models/props/gate.glb',scale:[1.5,1,1] };
export const RUINS_COMPOSITION = composition('RUINAS_DEL_GRAN_PENTAGRAMA','Ruins',[
  path('river-ruins-connection',[[-9,-85],[-5,-87],[0,-89]],3.5),
  path('mountain-ruins-connection',[[9,-80],[9,-84],[5,-87],[0,-89]],3.5),
  path('ruins-ceremonial-aisle',[[0,-89],[0,-94],[0,-100],[0,-108]],4),
  path('ruins-first-voice',[[0,-94],[-3,-94],[-6,-94]],2.5),
  path('ruins-second-voice',[[0,-99],[3,-99],[6,-99]],2.5),
], [...columns,...walls,...floor,gate,
  instance('ruins-entry-left','wall',-8,-89,1,'props'),
  instance('ruins-entry-right','wall',8,-89,1,'props'),
  instance('ruins-rubble-west','rubble_large',-8,-106,.6,'props'),
  instance('ruins-rubble-east','rubble_half',9,-91,.8,'props'),
  {...instance('ruins-torch-west','torch_lit',-5,-91,1,'props'),collision:{type:'none'}},
  {...instance('ruins-torch-east','torch_lit',5,-91,1,'props'),collision:{type:'none'}},
  instance('ruins-vine-west','Bush_1_A_Color1',-12,-97,.9,'bushes'),
  ...RUINS_ACTIVITIES.map(object => object.instance),
]);
RUINS_COMPOSITION.adventureObjects = RUINS_ACTIVITIES;
RUINS_COMPOSITION.gates = [{id:'ruins-entry-binding',gateId:'routes_to_ruins',instanceId:gate.id}];
RUINS_COMPOSITION.landmarks = [{id:'grand-staff',memberIds:columns.map(item => item.id)}];
RUINS_COMPOSITION.exits = [{id:'ruins-ascent',position:[0,1.8,-108]}];
