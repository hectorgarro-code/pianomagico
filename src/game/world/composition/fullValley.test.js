import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GROTTO_COMPOSITION } from './grottoComposition.js';
import { RUINS_COMPOSITION } from './ruinsComposition.js';
import { OBSERVATORY_COMPOSITION } from './observatoryComposition.js';
import { RIVER_COMPOSITION } from './riverComposition.js';
import { MOUNTAIN_COMPOSITION } from './mountainComposition.js';
import { FINAL_ADVENTURE_OBJECTS, RUINS_ACTIVITIES, FINAL_CHALLENGE, GROTTO_REWARD } from './finalAdventureComposition.js';
import { ALL_ADVENTURE_OBJECTS, createAdventureState, beginAdventureActivity, settleAdventureActivity, collectAdventureSecret } from '../../adventure/adventureState.js';
import { getValleyProgress, applyValleyEvent, getPlayableRegionAt, validateWorldGateBindings } from '../../adventure/valleyProgression.js';
import { REGION_IDS as R } from '../../adventure/valleyBlueprint.js';
import { validateComposition, collectAssetUrls } from './validateComposition.js';
import { calculateTerrainElevation } from '../worldGenerationRules.js';
import { getActiveWorldColliders, updateGateModels } from '../worldGates.js';
import { materializeCollider } from '../collision/modelColliders.js';
import { CollisionWorld } from '../collision/CollisionWorld.js';
import { createWorldActivityState, worldActivityReducer as reduce } from '../../state/worldActivityFlow.js';

const finish = (state, object) => settleAdventureActivity(beginAdventureActivity(state,object.id,object.activityId),object.id,{activityId:object.activityId,completed:true});
function routesComplete(order = ['river','mountain']) {
  let state = createAdventureState();
  for (const object of ALL_ADVENTURE_OBJECTS.filter(o=>o.id.startsWith('forest'))) state=finish(state,object);
  for (const prefix of order) for (const object of ALL_ADVENTURE_OBJECTS.filter(o=>o.id.startsWith(prefix))) state=finish(state,object);
  return state;
}
function finalComplete(state=routesComplete()) {
  for (const object of RUINS_ACTIVITIES) state=finish(state,object);
  return finish(state,FINAL_CHALLENGE);
}
function gltf(url) {
  const bytes=fs.readFileSync('public'+url);
  return url.endsWith('.glb') ? JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()) : JSON.parse(bytes);
}
function boundsModel(url) {
  const doc=gltf(url), box=new THREE.Box3();
  for(const mesh of doc.meshes) for(const primitive of mesh.primitives) {
    const accessor=doc.accessors[primitive.attributes.POSITION];
    box.expandByPoint(new THREE.Vector3(...accessor.min));box.expandByPoint(new THREE.Vector3(...accessor.max));
  }
  const size=box.getSize(new THREE.Vector3());
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z));
  mesh.position.copy(box.getCenter(new THREE.Vector3()));
  const root=new THREE.Group();root.add(mesh);return root;
}
const compositions=[GROTTO_COMPOSITION,RUINS_COMPOSITION,OBSERVATORY_COMPOSITION];
const registry=[...collectAssetUrls(JSON.parse(fs.readFileSync(new URL('../../assets/kaykitCatalog.json',import.meta.url)))), '/models/props/gate.glb','/models/props/chest_gold.glb','/models/props/chest_wood.glb'];
for (const composition of compositions) test(`${composition.groupName}: actual assets, dependencies, collision contract and gate references`,()=>{
  assert.deepEqual(validateComposition(composition,{registeredAssets:registry,assetExists:url=>fs.existsSync('public'+url)}).errors,[]);
  assert.deepEqual(validateWorldGateBindings(composition),[]);
  for (const instance of composition.instances) {
    const doc=gltf(instance.assetUrl);
    for(const entry of [...(doc.images||[]),...(doc.buffers||[])]) if(entry.uri&&!entry.uri.startsWith('data:')) assert.ok(fs.existsSync(path.resolve(path.dirname('public'+instance.assetUrl),entry.uri)));
    if(instance.collision.type==='solid') {
      const model=boundsModel(instance.assetUrl), placed=model.clone();
      placed.position.fromArray(instance.position);placed.scale.fromArray(instance.scale);placed.rotation.set(...instance.rotation);
      const collider=materializeCollider(placed,instance,model,composition.regionId);
      const world=new CollisionWorld([collider]);
      assert.equal(world.overlaps({x:collider.x,z:collider.z}),true);
      assert.equal(world.overlaps(world.move({x:collider.x,z:collider.z},{x:0,z:0})),false);
    }
  }
});
test('physical triggers discover only actual footprints; locked regions cannot be discovered',()=>{
  assert.equal(getPlayableRegionAt({x:-33,z:-54}),R.GROTTO);
  assert.equal(getPlayableRegionAt({x:0,z:-94}),R.RUINS);
  assert.equal(getPlayableRegionAt({x:0,z:-126}),R.OBSERVATORY);
  const initial=createAdventureState();
  assert.equal(applyValleyEvent(initial,{type:'REGION_DISCOVERED',regionId:R.RUINS}),initial);
  const ruins=applyValleyEvent(routesComplete(),{type:'REGION_DISCOVERED',regionId:R.RUINS});
  assert.equal(getValleyProgress(ruins).currentRegion,R.RUINS);
});
test('secret requires physical discovery, is collected once, persists, and adds no educational currency',()=>{
  let state=createAdventureState();
  assert.equal(collectAdventureSecret(state,GROTTO_REWARD.id),state);
  state=applyValleyEvent(state,{type:'REGION_DISCOVERED',regionId:R.FOREST});
  state=applyValleyEvent(state,{type:'DISCOVERY_RECORDED',id:'echo-grotto-found'});
  state=applyValleyEvent(state,{type:'REGION_DISCOVERED',regionId:R.GROTTO});
  state=collectAdventureSecret(state,GROTTO_REWARD.id);
  assert.ok(getValleyProgress(state).completedRegions.includes(R.GROTTO));
  assert.equal(collectAdventureSecret(state,GROTTO_REWARD.id),state);
  assert.ok(getValleyProgress(createAdventureState(state)).completedRegions.includes(R.GROTTO));
  assert.equal(Object.hasOwn(state,'xp'),false);
});
test('Ruins uses two actual lessons and a challenge; cancellation and wrong results cannot open Observatory',()=>{
  let state=routesComplete();
  assert.equal(beginAdventureActivity(state,FINAL_CHALLENGE.id,35),state);
  state=finish(state,RUINS_ACTIVITIES[0]);state=finish(state,RUINS_ACTIVITIES[1]);
  const pending=beginAdventureActivity(state,RUINS_ACTIVITIES[2].id,13);
  assert.equal(settleAdventureActivity(pending,RUINS_ACTIVITIES[2].id,{activityId:12,completed:true}),pending);
  assert.equal(getValleyProgress(settleAdventureActivity(pending,RUINS_ACTIVITIES[2].id,{activityId:13,completed:false})).gates.ruins_to_observatory,'LOCKED');
  state=settleAdventureActivity(pending,RUINS_ACTIVITIES[2].id,{activityId:13,completed:true});
  assert.ok(state.valley.completedChallenges.includes('ruins-challenge'));
  assert.equal(getValleyProgress(state).gates.ruins_to_observatory,'AVAILABLE');
});
test('final is real and optional Grotto does not affect either route order; replay is idempotent',()=>{
  for(const order of [['river','mountain'],['mountain','river']]) {
    const state=finalComplete(routesComplete(order));
    assert.equal(getValleyProgress(state).valleyCompleted,true);
    assert.equal(getValleyProgress(state).completedRegions.includes(R.GROTTO),false);
    assert.equal(getValleyProgress(createAdventureState(state)).valleyCompleted,true);
    assert.equal(finish({...state,lastReward:null},FINAL_CHALLENGE).lastReward,null);
  }
});
test('unvalidated saved challenge facts and old placeholder milestones do not complete final regions',()=>{
  const state=routesComplete();
  state.valley.discoveredRegions.push(R.RUINS,R.OBSERVATORY);
  state.valley.completedChallenges.push('ruins-challenge',FINAL_CHALLENGE.id);
  state.valley.milestones.push('ruins-prototype-complete','observatory-prototype-complete');
  assert.equal(getValleyProgress(createAdventureState(state)).valleyCompleted,false);
});
test('Continue Exploring keeps completions and context; reloading a completed valley does not reopen ending',()=>{
  let state=createWorldActivityState(finalComplete());
  state.endingAcknowledged=false;
  const prior=state.game.adventure;
  state=reduce(state,{type:'ACK_ENDING'});
  assert.equal(state.endingAcknowledged,true);assert.equal(state.mode,'WORLD');assert.equal(state.game.adventure,prior);
  assert.equal(createWorldActivityState(prior).endingAcknowledged,true);
  assert.equal(reduce(state,{type:'RESET_ADVENTURE'}).endingAcknowledged,false);
});
test('visible gate models and collisions share derived gate state; both routes are required',()=>{
  const colliders=[{id:'wall',type:'solid'},...['routes_to_ruins','ruins_to_observatory'].map(gateId=>({id:gateId,type:'solid',gateId}))];
  const models=colliders.slice(1).map(c=>({userData:{gateId:c.gateId},visible:true}));
  assert.equal(getActiveWorldColliders(colliders,createAdventureState()).length,3);
  const state=routesComplete();
  assert.deepEqual(getActiveWorldColliders(colliders,state).map(c=>c.id),['wall','ruins_to_observatory']);
  updateGateModels(models,state);assert.equal(models[0].visible,false);assert.equal(models[1].visible,true);
  assert.equal(getActiveWorldColliders(colliders,finalComplete()).length,1);
});
test('connections and ascent are continuous, use flat ruins and end on the 8.5m summit',()=>{
  assert.equal(calculateTerrainElevation(0,-99),1.8);
  assert.equal(calculateTerrainElevation(0,-126),8.5);
  for(const c of compositions) for(const p of c.paths) for(let i=1;i<p.points.length;i++) {
    const a=p.points[i-1],b=p.points[i],distance=Math.hypot(b[0]-a[0],b[2]-a[2]);
    let last=calculateTerrainElevation(a[0],a[2]);
    for(let n=1;n<=100;n++) {const t=n/100,h=calculateTerrainElevation(a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t);assert.ok(Math.abs(h-last)/(distance/100)<1.1,p.id);last=h;}
  }
});
test('new activity IDs are unique, later than route activities, and the secret never launches piano',()=>{
  assert.deepEqual(FINAL_ADVENTURE_OBJECTS.filter(o=>o.activityId).map(o=>o.activityId),[11,12,13,35]);
  assert.equal(new Set(ALL_ADVENTURE_OBJECTS.map(o=>o.id)).size,ALL_ADVENTURE_OBJECTS.length);
  const state=createAdventureState();
  assert.equal(beginAdventureActivity(state,GROTTO_REWARD.id,null),state);
});

test('new solid scenery preserves the approved River and Mountain paths',()=>{
  const colliders = compositions.flatMap(c=>c.instances.filter(i=>i.collision.type==='solid').map(i=>{
    const model=boundsModel(i.assetUrl),placed=model.clone();
    placed.position.fromArray(i.position);placed.scale.fromArray(i.scale);placed.rotation.set(...i.rotation);
    return materializeCollider(placed,i,model,c.regionId);
  }));
  const world=new CollisionWorld(colliders);
  for(const c of [RIVER_COMPOSITION,MOUNTAIN_COMPOSITION]) for(const p of c.paths) for(let i=1;i<p.points.length;i++) {
    const a=p.points[i-1],b=p.points[i];
    for(let n=0;n<=100;n++) {const t=n/100;
      assert.equal(world.overlaps({x:a[0]+(b[0]-a[0])*t,z:a[2]+(b[2]-a[2])*t}),false,p.id);
    }
  }
  for(let z=-64;z>=-69;z-=.1) assert.equal(world.overlaps({x:-34,z}),false,'west bridge arrival');
});

test('floors and small ornaments never block the new regions',()=>{
  for(const c of compositions) for(const i of c.instances) {
    if(/\/(?:candle_lit|torch_lit|banner_[^/]+|floor_tile_[^/]+)\.gltf$/.test(i.assetUrl)) assert.equal(i.collision.type,'none',i.id);
  }
});
