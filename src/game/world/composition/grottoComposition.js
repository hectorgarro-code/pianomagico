import { composition, instance, path } from './prototypeAuthoring.js';
import { GROTTO_REWARD } from './finalAdventureComposition.js';

const rocks = [
  ['grotto-west-wall', -39, -54, [6, 8, 8]],
  ['grotto-north-wall', -33, -48, [10, 8, 5]],
  ['grotto-south-wall', -33, -59.5, [10, 7, 5]],
  ['grotto-east-shoulder', -26, -50, [5, 7, 4]],
].map(([id, x, z, scale]) => ({ ...instance(id, 'Rock_3_A_Color1', x, z), scale }));
export const GROTTO_COMPOSITION = composition('GRUTA_DEL_ECO', 'Grotto', [
  path('grotto-interior', [[-19,-54],[-19,-56],[-24,-56],[-27,-54],[-33,-54]], 2.2),
], [...rocks,
  {...instance('grotto-altar', 'floor_tile_small_decorated', -33,-54,1,'props'),collision:{type:'none'}},
  {...instance('grotto-altar-candle', 'candle_lit', -35,-52,1.2,'props'),collision:{type:'none'}},
  instance('grotto-relic', 'rubble_half', -36,-50,.6,'props'),
  GROTTO_REWARD.instance,
]);
GROTTO_COMPOSITION.adventureObjects = [GROTTO_REWARD];
GROTTO_COMPOSITION.landmarks = [{id:'echo-shrine',memberIds:['grotto-altar',GROTTO_REWARD.instanceId]}];
GROTTO_COMPOSITION.lights = [{id:'echo-light',position:[-34,2,-53],color:0xffcf83,intensity:7,distance:10}];
GROTTO_COMPOSITION.openZones = [{id:'echo-reward-clear',shape:'circle',center:[-33,-54],radius:2.2,excludes:['rocks']}];
