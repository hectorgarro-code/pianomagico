import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventureState,beginAdventureActivity,settleAdventureActivity,findAdventureObject} from '../adventure/adventureState.js';
import {applyValleyEvent,getValleyProgress} from '../adventure/valleyProgression.js';
import {VALLEY_REGIONS,REGION_IDS as R} from '../adventure/valleyBlueprint.js';
import {createRestorationPresentation,restorationLevel} from './worldRestorationState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {WORLD_RESTORATION,RESTORATION_DURATION} from '../world/composition/worldRestoration.js';
export function completeRegion(state,id){
  state=applyValleyEvent(state,{type:'REGION_DISCOVERED',regionId:id});
  for(const req of VALLEY_REGIONS.find(r=>r.id===id).regionCompletionRequirements){
    const object=findAdventureObject(req.id);
    state=settleAdventureActivity(beginAdventureActivity(state,object.id,object.activityId),object.id,{completed:true,activityId:object.activityId});
  }
  return state;
}
test('five restorations derive only validated Adventure completion, animate progressively and do not lock controls',()=>{
  let state=createAdventureState();const original=structuredClone(state),view=createRestorationPresentation(state);
  assert.equal(view.states.length,5);assert.ok(view.states.every(s=>restorationLevel(s)===0));
  for(const id of [R.FOREST,R.RIVER,R.MOUNTAIN,R.RUINS,R.OBSERVATORY]){
    state=completeRegion(state,id);assert.ok(getValleyProgress(state).completedRegions.includes(id));
    assert.deepEqual(view.update(state,.1,{x:3,z:-40}),[id]);
    const region=view.states.find(s=>s.definition.id===id);assert.ok(restorationLevel(region)>0&&restorationLevel(region)<1);
    assert.ok(restorationLevel(region,3,4)<restorationLevel(region,0,4));
    assert.deepEqual(view.update(state,RESTORATION_DURATION,{x:3,z:-40}),[]);assert.equal(restorationLevel(region),1);
  }
  assert.deepEqual(original,createAdventureState());assert.equal(state.xp,undefined);
  assert.equal(Object.hasOwn(view,'controlsLocked'),false);
});
test('cancel, wrong result and merely discovering a region cannot restore it; reload is restored without replay',()=>{
  let state=applyValleyEvent(createAdventureState(),{type:'REGION_DISCOVERED',regionId:R.FOREST});
  const view=createRestorationPresentation(state);
  const object=findAdventureObject('forest-chest-01');
  state=settleAdventureActivity(beginAdventureActivity(state,object.id,object.activityId),object.id,{completed:false,cancelled:true,activityId:object.activityId});
  assert.deepEqual(view.update(state,1,{x:3,z:-40}),[]);assert.equal(restorationLevel(view.states[0]),0);
  state=completeRegion(state,R.FOREST);
  const values=new Map(),persist=createAdventurePersistence(()=>({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}));
  persist.save(4,state);const restored=createRestorationPresentation(persist.load(4));
  assert.equal(restorationLevel(restored.states[0]),1);assert.deepEqual(restored.update(persist.load(4),.1,{x:3,z:-40}),[]);
  assert.equal(restorationLevel(createRestorationPresentation(persist.load(5)).states[0]),0);
  assert.equal(WORLD_RESTORATION.some(d=>d.id===R.GROTTO||d.id===R.PLAZA),false);
});
