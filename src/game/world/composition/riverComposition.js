import { composition, instance, path } from './prototypeAuthoring.js';
import { RIVER_LESSON_CHESTS } from './routeAdventureComposition.js';
export const RIVER_CHANNEL = [[-28,-57],[-28,-64],[-29,-69],[-26,-75],[-23,-82]];
export const BRIDGE = {x:-28,z:-64,width:9,depth:3,height:.25};
export const RIVER_COMPOSITION = composition('RIO_DEL_RITMO','River',[
  path('river-main',[[-18,-59],[-23,-61],[-23,-64],[-33,-64],[-34,-70],[-32,-75],[-30,-78],[-29,-85],[-18,-85],[-9,-85]]),
  path('river-island-detour',[[-34,-70],[-32,-72],[-31,-74]])
],[
  instance('river-west-canopy','Tree_2_A_Color1',-39,-62,1.3,'trees'),
  instance('river-south-tree','Tree_2_A_Color1',-39,-75,1.1,'trees'),
  instance('river-north-tree','Tree_2_A_Color1',-35.5,-84,1.2,'trees'),
  instance('river-island-bush','Bush_2_A_Color1',-26.5,-74,.45,'bushes'),
  instance('river-east-bank-rock','Rock_1_D_Color1',-24,-69,1.2),
  instance('river-west-bank-rock','Rock_1_D_Color1',-37,-73,1.4),
  instance('river-bridge-support-west','barrier_column',-31,-66,.8,'props'),
  instance('river-bridge-support-east','barrier_column',-25,-66,.8,'props'),
  instance('river-barrel','barrel_large',-38,-67,.9,'props'),
  instance('river-reeds-west','Bush_1_A_Color1',-33,-68,.8,'bushes'),
  instance('river-reeds-east','Bush_1_A_Color1',-22,-74,.9,'bushes'),
  ...RIVER_LESSON_CHESTS.map(c=>c.instance)
]);
const deck = instance('river-bridge-deck','floor_wood_large',-28,-64,1,'props');
deck.position[1]=BRIDGE.height+.04; deck.grounding='absolute'; deck.scale=[2.25,.5,.75]; deck.collision={type:'none'};
RIVER_COMPOSITION.instances.push(deck);
RIVER_COMPOSITION.landmarks=[{id:'river-bridge',memberIds:['river-bridge-deck','river-bridge-support-west','river-bridge-support-east']}];
RIVER_COMPOSITION.adventureObjects=RIVER_LESSON_CHESTS;
RIVER_COMPOSITION.exits=[{id:'river-ruins-reserve',position:[-9,0,-85]}];
RIVER_COMPOSITION.gates=[{id:'river-ruins-binding',gateId:'routes_to_ruins',exitId:'river-ruins-reserve'}];
