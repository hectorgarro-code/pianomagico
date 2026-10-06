// Explicit authored positions. Mapping only normalizes the instance contract;
// no position, orientation or scale is generated randomly.
const floorPositions = [
  [-4,-8], [0,-8], [4,-8],
  [-8,-4], [-4,-4], [0,-4], [4,-4], [8,-4],
  [-8,0], [-4,0], [0,0], [4,0], [8,0],
  [-8,4], [-4,4], [0,4], [4,4], [8,4],
  [-4,8], [0,8], [4,8]
];
const pavingCorners = [
  {id:'paving-corner-nw',position:[-8,0.045,-8],yaw:-Math.PI/2},
  {id:'paving-corner-ne',position:[8,0.045,-8],yaw:Math.PI},
  {id:'paving-corner-se',position:[8,0.045,8],yaw:Math.PI/2},
  {id:'paving-corner-sw',position:[-8,0.045,8],yaw:0}
].map(item => ({
  id:item.id,role:'floor',kind:'props',assetUrl:'/models/props/Assets/gltf/floor_tile_small_corner.gltf',
  position:item.position,rotation:[0,item.yaw,0],scale:[2,1,2],
  grounding:'absolute',castShadow:false,receiveShadow:true
}));
const atriumInstances = [
  {id:'atrium-base-west',asset:'floor_tile_large',position:[-3.801,0.09,-5.13],scale:[1,2,1.3],role:'floor'},
  {id:'atrium-base-east',asset:'floor_tile_large',position:[-0.199,0.09,-6.87],scale:[1,2,1.3],role:'floor'},
  {id:'atrium-column-front-west',asset:'pillar',position:[-3.918,0.19,-3.074],scale:[1,1,1]},
  {id:'atrium-column-front-east',asset:'pillar',position:[1.484,0.19,-5.685],scale:[1,1,1]},
  {id:'atrium-column-back-west',asset:'pillar',position:[-5.484,0.19,-6.315],scale:[1,1,1]},
  {id:'atrium-column-back-east',asset:'pillar',position:[-0.082,0.19,-8.926],scale:[1,1,1]},
  {id:'atrium-lintel-front',asset:'floor_tile_large',position:[-1.217,4.32,-4.379],scale:[1.875,2.6,0.375]},
  {id:'atrium-lintel-back',asset:'floor_tile_large',position:[-2.783,4.32,-7.621],scale:[1.875,2.6,0.375]},
  {id:'atrium-lintel-west',asset:'floor_tile_large',position:[-4.701,4.32,-4.695],scale:[0.375,2.6,1.275]},
  {id:'atrium-lintel-east',asset:'floor_tile_large',position:[0.701,4.32,-7.305],scale:[0.375,2.6,1.275]},
  {id:'atrium-banner',asset:'banner_blue',position:[-3.65,0.5,-2.55],scale:[0.65,0.65,0.65],role:'importantProp'}
].map(item => ({
  id:item.id,role:item.role || 'architecture',kind:'props',
  assetUrl:'/models/props/Assets/gltf/' + item.asset + '.gltf',
  position:item.position,rotation:[0,0.45,0],scale:item.scale,
  grounding:'absolute',castShadow:item.role !== 'floor',receiveShadow:true
}));
const gardenInstances = [
  {id:'west-grove-main',asset:'Tree_3_A_Color1',position:[-14,0.08,-10],scale:1.55,yaw:0.4},
  {id:'west-grove-back',position:[-17,0.05,-15],scale:1.1,yaw:1.5},
  {id:'west-grove-front',position:[-17,0.06,2],scale:1.15,yaw:-0.8},
  {id:'atrium-backdrop-main',position:[-10,0.06,-17],scale:1.15,yaw:0.9},
  {id:'atrium-backdrop-secondary',position:[-8,0.05,-21],scale:0.9,yaw:2.2},
  {id:'east-grove-main',asset:'Tree_3_A_Color1',position:[17,0.06,-7],scale:1.55,yaw:-0.5},
  {id:'east-grove-back',position:[19,0.06,-16],scale:1.1,yaw:1.1},
  {id:'east-grove-front',position:[18,0.05,6],scale:1.05,yaw:2.6}
].map(item => ({
  id:item.id,role:'mainTree',kind:'trees',assetUrl:'/models/props/Assets/gltf/' + (item.asset || 'Tree_2_A_Color1') + '.gltf',
  position:item.position,rotation:[0,item.yaw,0],scale:[item.scale,item.scale,item.scale],
  grounding:'terrain',castShadow:true,receiveShadow:true
}));
const gardenUnderstory = [
  {id:'west-bank-shrub-main',position:[-13,0,-7],scale:2,yaw:0.5},
  {id:'west-bank-shrub-low',position:[-15,0,-9],scale:1.6,yaw:1.3},
  {id:'west-arrival-shrub',position:[-14,0,1],scale:1.8,yaw:2},
  {id:'east-bank-shrub-main',position:[15,0,-5],scale:2,yaw:0.9},
  {id:'east-bank-shrub-low',position:[17.5,0,-4],scale:1.6,yaw:2.4},
  {id:'atrium-backdrop-shrub',position:[-9,0,-15],scale:1.8,yaw:1.6}
].map(item => ({
  id:item.id,role:'importantProp',kind:'bushes',assetUrl:'/models/props/Assets/gltf/Bush_2_A_Color1.gltf',
  position:item.position,rotation:[0,item.yaw,0],scale:[item.scale,item.scale,item.scale],
  grounding:'terrain',castShadow:true,receiveShadow:true
}));
const exitPaving = [
  {id:'exit-stone-first',asset:'floor_tile_small',position:[3.3,-0.025,-10.2],scale:0.9,rotation:[0.0824,0,0.0226]},
  {id:'exit-stone-middle',asset:'floor_tile_small_weeds_A',position:[4.8,-0.025,-12.4],scale:0.8,rotation:[0.1124,0,0.0407]},
  {id:'exit-stone-last',asset:'floor_tile_small_weeds_A',position:[7,-0.025,-15],scale:0.7,rotation:[0.0247,0,0.0108]}
].map(item => ({
  id:item.id,role:'floor',kind:'props',assetUrl:'/models/props/Assets/gltf/' + item.asset + '.gltf',
  position:item.position,rotation:item.rotation,scale:[item.scale,1,item.scale],
  grounding:'terrain',castShadow:false,receiveShadow:true
}));
const stationInstances = [
  {id:'plaza-lesson-chest',role:'importantProp',kind:'props',assetUrl:'/models/props/chest_wood.glb',position:[7.5,0.065,0.5],rotation:[0,-2.2,0],scale:[0.6,0.6,0.6],grounding:'absolute',castShadow:true,receiveShadow:true},
  {id:'plaza-practice-chair',role:'importantProp',kind:'props',assetUrl:'/models/props/Assets/gltf/chair.gltf',position:[8.7,0.065,1.8],rotation:[0,-2.2,0],scale:[0.9,0.9,0.9],grounding:'absolute',castShadow:true,receiveShadow:true}
];
const gardenDetails = [
  {id:'west-root-stone',asset:'Rock_1_A_Color1',position:[-13.2,0,-9.5],scale:1.8,yaw:0.7,kind:'rocks'},
  {id:'west-root-small-stone',asset:'Rock_1_B_Color1',position:[-14.3,0,-8.8],scale:1,yaw:1.8,kind:'rocks'},
  {id:'east-root-stone',asset:'Rock_1_A_Color1',position:[16.2,0,-6.8],scale:1.7,yaw:1.2,kind:'rocks'},
  {id:'east-root-small-stone',asset:'Rock_1_B_Color1',position:[17.3,0,-5.9],scale:1,yaw:2.5,kind:'rocks'},
  {id:'west-root-grass',asset:'Grass_1_A_Color1',position:[-13.1,0.04,-8.8],scale:1.1,yaw:0.4,kind:'bushes'},
  {id:'east-root-grass',asset:'Grass_1_A_Color1',position:[15.8,0.04,-6.1],scale:1.1,yaw:2,kind:'bushes'}
].map(item => ({
  id:item.id,role:'decoration',kind:item.kind,assetUrl:'/models/props/Assets/gltf/' + item.asset + '.gltf',
  position:item.position,rotation:[0,item.yaw,0],scale:[item.scale,item.scale,item.scale],
  grounding:'terrain',castShadow:true,receiveShadow:true
}));
export const PLAZA_COMPOSITION = {
  schemaVersion: 1,
  regionId: 'PLAZA_DE_LAS_NOTAS',
  reviewStatus: 'approved',
  constructionPhase: '5F',
  origin: [0,0,0],
  groupName: 'Region_Plaza_de_las_Notas',
  spawn: {position:[0,0.15,5], rotation:[0,Math.PI,0]},
  camera: {yaw:0, pitch:0.26, distance:18, portraitDistance:16, lookAhead:4},
  atmosphere: {color:0x9bd8ff,near:32,far:55},
  terrain: {
    baseY:0, flatRadius:9, reviewExtent:24, transitionWidth:8, rimHeight:0.65,
    outerFalloff:{width:6,depth:3},
    landforms: [
      {id:'west-garden-bank',center:[-16,-2],radius:[8,20],height:2.8},
      {id:'east-garden-bank',center:[17,-15],radius:[8,16],height:3.2},
      {id:'north-atrium-rise',center:[-3,-12],radius:[8,7],height:0.25},
      {id:'northwest-back-bank',center:[-12,-18],radius:[11,9],height:2.8},
      {id:'north-garden-closure',center:[-5,-22],radius:[24,3],height:4.5},
      {id:'arrival-hollow',center:[0,13],radius:[10,6],height:-0.2}
    ]
  },
  paths: [{id:'plaza-north-path',points:[[0,0,13],[3,0,-4],[5,0,-11],[9,0,-17],[10,0,-19.5]],width:2.5,freeMarginEachSide:2.2,color:0x706957,visualImplementation:'terrain-blend',edgeBlend:1.5,endFade:3}],
  entries: [{id:'plaza-arrival',position:[0,0,13],rotation:[0,Math.PI,0]}],
  exits: [{id:'plaza-northeast-exit',position:[9,0,-17],rotation:[0,Math.PI,0]}],
  boundaries: [{id:'plaza-design-boundary',shape:'circle',center:[0,0],radius:22,purpose:'authoring'}],
  openZones: [{id:'plaza-center-clearance',name:'Plaza Center',shape:'circle',center:[0,0],radius:9,excludes:['denseVegetation','rocks']}],
  clearZones: [
    {id:'atrium-reservation',shape:'circle',center:[-2,-6],radius:4,excludes:['denseVegetation','rocks','decoration']},
    {id:'practice-clearance',shape:'circle',center:[7.5,0.5],radius:3.5,excludes:['denseVegetation','rocks']}
  ],
  stations: [{id:'plaza-first-lesson',instanceId:'plaza-lesson-chest',interactionRadius:3,lessonRef:'first-song'}],
  pointsOfInterest: [{id:'atrium-focus',position:[-2,0.19,-6]}],
  sightlines: [{id:'arrival-to-atrium',fromId:'plaza-arrival',toId:'atrium-focus',clearanceWidth:5,clearanceHeight:5}],
  landmarks: [{id:'atrium-first-chord',memberIds:atriumInstances.map(item => item.id)}],
  instances: [...floorPositions.map(([x,z],index) => ({
    id: 'plaza-paving-' + index, role:'floor', kind:'props',
    assetUrl:'/models/props/Assets/gltf/floor_tile_large.gltf',
    position:[x,0.045,z], rotation:[0,0,0], scale:[1,1,1],
    grounding:'absolute', castShadow:false, receiveShadow:true
  })), ...pavingCorners, ...atriumInstances, ...gardenInstances, ...gardenUnderstory, ...exitPaving, ...stationInstances, ...gardenDetails]
};
