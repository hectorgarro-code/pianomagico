import { composition, instance, path } from './prototypeAuthoring.js';
import { MOUNTAIN_LESSON_CHESTS } from './routeAdventureComposition.js';
export const MOUNTAIN_COMPOSITION=composition('MONTANA_DE_LAS_MELODIAS','Mountain',[
  path('mountain-ascent',[[18,-58],[27,-60],[31,-64],[31,-69],[23,-72],[23,-77],[14,-80],[9,-80]]),
  path('mountain-lookout-detour',[[31,-69],[37,-72],[37,-75]])
],[
  instance('mountain-east-ridge','Rock_3_A_Color1',39,-61,2.2),
  instance('mountain-north-ridge','Rock_3_A_Color1',33,-82,2),
  instance('mountain-west-rock','Rock_3_A_Color1',19,-68,1.5),
  instance('mountain-summit-rock','Rock_3_A_Color1',40,-80,1.8),
  instance('mountain-first-pine','Tree_1_A_Color1',23,-54,1.1,'trees'),
  instance('mountain-ridge-pine','Tree_1_A_Color1',40,-67,1.15,'trees'),
  instance('mountain-north-pine','Tree_1_B_Color1',19,-83,.9,'trees'),
  instance('mountain-lookout-marker','barrier_column',39,-75,.65,'props'),
  instance('mountain-lookout-banner','banner_blue',39,-75,.8,'props'),
  ...MOUNTAIN_LESSON_CHESTS.map(c=>c.instance)
]);
MOUNTAIN_COMPOSITION.terrain.plateaus=[
  {id:'mountain-first-terrace',center:[23,-59],height:4.15,radius:2.5,blendWidth:3},
  {id:'mountain-middle-terrace',center:[31,-68],height:6.1,radius:2.5,blendWidth:3},
  {id:'mountain-upper-terrace',center:[27,-77],height:7.45,radius:3,blendWidth:3}
];
MOUNTAIN_COMPOSITION.pointsOfInterest=[{id:'mountain-lookout',position:[37,6,-75]}];
MOUNTAIN_COMPOSITION.adventureObjects=MOUNTAIN_LESSON_CHESTS;
MOUNTAIN_COMPOSITION.exits=[{id:'mountain-ruins-reserve',position:[9,0,-80]}];
MOUNTAIN_COMPOSITION.gates=[{id:'mountain-ruins-binding',gateId:'routes_to_ruins',exitId:'mountain-ruins-reserve'}];
