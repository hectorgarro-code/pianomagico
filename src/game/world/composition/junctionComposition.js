import { composition, instance, path } from './prototypeAuthoring.js';
export const JUNCTION_COMPOSITION = composition('BOSQUE_DE_LAS_NOTAS', 'Junction', [
  path('junction-approach', [[-2,-46],[-2,-50],[-2,-54]]),
  path('junction-west', [[-2,-54],[-10,-55],[-18,-59]]),
  path('junction-east', [[-2,-54],[8,-55],[18,-58]])
], [
  instance('junction-west-grove', 'Tree_2_A_Color1', -14,-51,1.1,'trees'),
  instance('junction-west-rock', 'Rock_1_D_Color1', -13,-57,1.1),
  instance('junction-east-rock', 'Rock_3_A_Color1', 10,-51,1.4),
  instance('junction-east-pine', 'Tree_1_A_Color1', 15,-53,1.1,'trees'),
  instance('junction-backdrop', 'Tree_2_A_Color1', -3,-62,1.3,'trees')
]);
JUNCTION_COMPOSITION.exits = [{id:'junction-river',position:[-18,0,-59]}, {id:'junction-mountain',position:[18,0,-58]}];
JUNCTION_COMPOSITION.gates = [{id:'junction-river-binding',gateId:'forest_to_river',exitId:'junction-river'}, {id:'junction-mountain-binding',gateId:'forest_to_mountain',exitId:'junction-mountain'}];
JUNCTION_COMPOSITION.openZones = [{id:'junction-decision',shape:'circle',center:[-2,-54],radius:6,excludes:['trees','rocks']}];
