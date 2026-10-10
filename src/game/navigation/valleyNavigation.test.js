import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity, ALL_ADVENTURE_OBJECTS } from '../adventure/adventureState.js';
import { applyValleyEvent } from '../adventure/valleyProgression.js';
import { REGION_IDS as R } from '../adventure/valleyBlueprint.js';
import { getValleyMap, getDirectionHint, worldToMap, playerMapMarker, resolveObjectiveTarget } from './valleyNavigation.js';
import { chestSignalStyle } from '../world/chestSignals.js';
import { createChestSignals } from '../world/chestSignals.js';
import { Scene } from 'three';
import { getPlayableRegionAt } from '../adventure/valleyProgression.js';

const discover = (state, id) => applyValleyEvent(state, { type:'REGION_DISCOVERED', regionId:id });
function completeRegion(state, id) {
  state=discover(state,id);
  for(const object of ALL_ADVENTURE_OBJECTS.filter(o=>o.regionId===id && o.activityId)) {
    state=beginAdventureActivity(state,object.id,object.activityId);
    state=settleAdventureActivity(state,object.id,{completed:true,activityId:object.activityId});
  }
  return state;
}
const forestDone = () => completeRegion(createAdventureState(),R.FOREST);
const routesDone = () => completeRegion(completeRegion(forestDone(),R.RIVER),R.MOUNTAIN);

test('world/map transform preserves north, west and uniform distances',()=>{
  const size={width:200,height:200,padding:10},bounds={minX:-10,maxX:10,minZ:-10,maxZ:10};
  assert.deepEqual(worldToMap({x:0,z:0},size,bounds),{x:100,y:100});
  assert.deepEqual(worldToMap({x:-10,z:-10},size,bounds),{x:10,y:10});
  assert.deepEqual(worldToMap({x:10,z:10},size,bounds),{x:190,y:190});
});
test('player marker follows actual position and character orientation',()=>{
  const pose={position:{x:15,z:-25},rotation:Math.PI};
  assert.deepEqual(playerMapMarker(pose),{...worldToMap(pose.position),angle:0});
  assert.equal(playerMapMarker({...pose,rotation:Math.PI/2}).angle,90);
});
test('undiscovered regions and chests are hidden on new Adventure',()=>{
  const model=getValleyMap(createAdventureState());
  assert.deepEqual(model.regions.map(r=>r.id),[R.PLAZA]);assert.equal(model.chests.length,0);
  assert.ok(model.paths.every(p=>p.regionId===R.PLAZA));
});
test('physically discovered region and its authored paths become visible',()=>{
  const model=getValleyMap(discover(createAdventureState(),R.FOREST));
  assert.ok(model.regions.some(r=>r.id===R.FOREST));
  assert.ok(model.paths.some(p=>p.id==='forest-main-path'));
});
test('Grotto remains completely hidden before physical secret discovery',()=>{
  const model=getValleyMap(forestDone());
  assert.ok(!model.regions.some(r=>r.id===R.GROTTO));
  assert.ok(!model.paths.some(p=>p.regionId===R.GROTTO));
  assert.ok(!model.chests.some(c=>c.type==='SECRET_REWARD'));
  assert.notEqual(model.target.regionId,R.GROTTO);
});
test('Grotto appears only after the existing discovery and region events',()=>{
  let state=applyValleyEvent(forestDone(),{type:'DISCOVERY_RECORDED',id:'echo-grotto-found'});
  state=discover(state,R.GROTTO);
  assert.ok(getValleyMap(state).regions.some(r=>r.id===R.GROTTO));
  assert.ok(getValleyMap(state).chests.some(c=>c.type==='SECRET_REWARD'));
  assert.notEqual(resolveObjectiveTarget(state).regionId,R.GROTTO);
});
test('available and locked map chests use existing Adventure entry states',()=>{
  const model=getValleyMap(discover(createAdventureState(),R.FOREST));
  assert.equal(model.chests.find(c=>c.id==='forest-chest-01').state,'AVAILABLE');
  assert.equal(model.chests.find(c=>c.id==='forest-chest-02').state,'LOCKED');
});
test('completed map chests and region state update from real settled result',()=>{
  const model=getValleyMap(forestDone());
  assert.ok(model.chests.filter(c=>c.regionId===R.FOREST).every(c=>c.state==='COMPLETED'));
  assert.equal(model.regions.find(r=>r.id===R.FOREST).state,'COMPLETED');
});
test('initial Plaza objective uses its landmark, then Forest uses the real entry',()=>{
  const state=createAdventureState();
  assert.equal(resolveObjectiveTarget(state).regionId,R.PLAZA);
  assert.deepEqual(resolveObjectiveTarget(applyValleyEvent(state,{type:'MILESTONE_REACHED',id:'plaza-explored'})).position,{x:10,z:-19.5});
});
test('Forest objective selects AVAILABLE chest then advances without duplicated requirements',()=>{
  let state=discover(createAdventureState(),R.FOREST);
  assert.equal(resolveObjectiveTarget(state).id,'forest-chest-01');
  state=settleAdventureActivity(beginAdventureActivity(state,'forest-chest-01',1),'forest-chest-01',{completed:true,activityId:1});
  assert.equal(resolveObjectiveTarget(state).id,'forest-chest-02');
});
test('completed Forest offers bifurcation with two equally valid routes',()=>{
  const target=resolveObjectiveTarget(forestDone());
  assert.equal(target.kind,'CHOICE');assert.deepEqual(target.position,{x:-2,z:-54});
  assert.deepEqual(target.choices.map(c=>c.regionId),[R.RIVER,R.MOUNTAIN]);
});
test('entering either available route points to its own lesson',()=>{
  assert.equal(resolveObjectiveTarget(discover(forestDone(),R.RIVER)).regionId,R.RIVER);
  assert.equal(resolveObjectiveTarget(discover(forestDone(),R.MOUNTAIN)).regionId,R.MOUNTAIN);
});
test('one route completed resolves remaining route, both orders',()=>{
  assert.equal(resolveObjectiveTarget(completeRegion(forestDone(),R.RIVER)).regionId,R.MOUNTAIN);
  assert.equal(resolveObjectiveTarget(completeRegion(forestDone(),R.MOUNTAIN)).regionId,R.RIVER);
});
test('both routes completed resolve real Ruins arrival',()=>{
  const target=resolveObjectiveTarget(routesDone());assert.equal(target.regionId,R.RUINS);assert.equal(target.kind,'ENTRY');
});
test('Ruins completion resolves Observatory arrival, then final challenge',()=>{
  let state=completeRegion(routesDone(),R.RUINS);
  assert.equal(resolveObjectiveTarget(state).regionId,R.OBSERVATORY);
  state=discover(state,R.OBSERVATORY);assert.equal(resolveObjectiveTarget(state).id,'observatory-final-challenge');
  assert.equal(resolveObjectiveTarget(completeRegion(state,R.OBSERVATORY)),null);
});
test('navigation off removes target/direction but preserves discovery map',()=>{
  const state=forestDone();assert.equal(resolveObjectiveTarget(state,false),null);
  assert.equal(getDirectionHint({x:0,z:0},null,0),null);
  assert.ok(getValleyMap(state,null).regions.length>0);
});
test('direction uses camera yaw, and reduces only close visible targets',()=>{
  const target={position:{x:0,z:-10}};
  assert.equal(getDirectionHint({x:0,z:0},target,0).angle,0);
  assert.ok(Math.abs(getDirectionHint({x:0,z:0},target,Math.PI/2).angle-Math.PI/2)<1e-6);
  assert.equal(getDirectionHint({x:0,z:0},target,0,{x:0,y:0,z:.5}).subdued,true);
  assert.equal(getDirectionHint({x:0,z:0},target,0,{x:2,y:0,z:.5}).subdued,false);
});
test('AVAILABLE chest signals warm glow and particles',()=>{
  assert.equal(chestSignalStyle('AVAILABLE').particles,true);assert.ok(chestSignalStyle('AVAILABLE').glow>.3);
});
test('LOCKED chest signal is faint without particles',()=>{
  assert.equal(chestSignalStyle('LOCKED').particles,false);assert.ok(chestSignalStyle('LOCKED').glow<.05);
});
test('COMPLETED chest signal keeps only faint residual glow',()=>{
  assert.equal(chestSignalStyle('COMPLETED').particles,false);assert.ok(chestSignalStyle('COMPLETED').glow<.1);
});
test('secret variant reuses same states, only color differs',()=>{
  assert.notEqual(chestSignalStyle('AVAILABLE','SECRET_REWARD').color,chestSignalStyle('AVAILABLE').color);
  assert.equal(chestSignalStyle('LOCKED','SECRET_REWARD').particles,false);
});
test('final region arrival targets actually reach their physical discovery footprints',()=>{
  for(const state of [routesDone(),completeRegion(routesDone(),R.RUINS)]) {
    const target=resolveObjectiveTarget(state);
    assert.equal(getPlayableRegionAt(target.position),target.regionId);
  }
});
test('signal resources are shared, culled, state reactive and fully disposed',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
  try {
    const scene=new Scene(),objects=[ALL_ADVENTURE_OBJECTS[0],ALL_ADVENTURE_OBJECTS.find(o=>o.type==='SECRET_REWARD')];
    const state=createAdventureState(),signals=createChestSignals(scene,objects,()=>0);
    const [chest,secret]=scene.children;
    signals.update(1,{x:20,z:-22},state);
    assert.equal(chest.visible,true); assert.equal(chest.children[1].visible,true);
    assert.equal(secret.visible,false);
    assert.equal(chest.children[0].material.map,chest.children[1].material.map);
    state.entries[objects[0].id].state='COMPLETED';signals.update(2,{x:20,z:-22},state);
    assert.equal(chest.children[1].visible,false);
    signals.update(3,{x:200,z:200},state);assert.equal(chest.visible,false);
    let disposed=0;chest.children[1].geometry.addEventListener('dispose',()=>disposed++);
    chest.children[0].material.map.addEventListener('dispose',()=>disposed++);
    signals.dispose();assert.equal(scene.children.length,0);assert.equal(disposed,2);
  } finally {globalThis.document=previous;}
});
