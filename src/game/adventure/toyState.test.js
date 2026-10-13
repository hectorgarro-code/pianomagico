import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TOY_TARGETS,TOY_NOTES,TOY_SECRET,toyWorldActions} from '../world/composition/toyComposition.js';
import {PLAZA_COMPOSITION} from '../world/composition/plazaComposition.js';
import {FOREST_COMPOSITION} from '../world/composition/forestComposition.js';
import {ASSET_CATALOG} from '../assets/assetCatalog.js';
import {applyToyEvent,normalizeToyState} from './toyState.js';
import {createAdventureState} from './adventureState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {createWorldActivityState,worldActivityReducer} from '../state/worldActivityFlow.js';
import {createGameplayContent} from '../gameplay/gameplayContent.js';
import {pointToSegmentDistance} from '../world/worldGenerationRules.js';
import {EXPLORATION_TARGETS} from '../world/composition/explorationSecrets.js';

test('toy composition retains five toys and adds one real exploratory barrel, with two real skeletons',()=>{
  assert.equal(TOY_TARGETS.filter(t=>!t.firstMinutesOnly&&t.type==='DESTRUCTIBLE').length,6);assert.equal(TOY_TARGETS.filter(t=>!t.firstMinutesOnly&&t.type==='WORLD_CREATURE').length,2);
  for(const target of TOY_TARGETS){const asset=ASSET_CATALOG.assets.find(a=>a.id===target.assetId);assert.ok(asset,target.assetId);assert.ok(fs.existsSync('public'+asset.url));assert.ok(target.hitsRequired>=1&&target.hitsRequired<=3);}
  const content=createGameplayContent(),result=toyWorldActions(content,[PLAZA_COMPOSITION,FOREST_COMPOSITION]);
  assert.deepEqual(result.filter(t=>!['PLAZA_DE_LAS_NOTAS','BOSQUE_DE_LAS_NOTAS'].includes(t.regionId)),[...content.worldActions.filter(t=>!['PLAZA_DE_LAS_NOTAS','BOSQUE_DE_LAS_NOTAS'].includes(t.regionId)),...EXPLORATION_TARGETS]);
});
test('solid toys leave main route margins and Plaza central space open; no tree positions are changed',()=>{
  const paths=[...PLAZA_COMPOSITION.paths,...FOREST_COMPOSITION.paths];
  for(const target of TOY_TARGETS.filter(t=>!t.firstMinutesOnly&&t.type==='DESTRUCTIBLE')){
    const [x,,z]=target.position;assert.ok(Math.hypot(x,z)>9+target.radius);
    for(const path of paths)for(let i=1;i<path.points.length;i++){
      const a=path.points[i-1],b=path.points[i],d=pointToSegmentDistance(x,z,a[0],a[2],b[0],b[2]);
      assert.ok(d>path.width/2+(path.freeMarginEachSide||2.2)+target.radius,`${target.id} invades ${path.id}`);
    }
  }
});
test('note pickups are idempotent, drops require defeat, secret rewards are notes only and lesson progression is unchanged',()=>{
  const initial=createAdventureState(),entries=initial.entries,valley=initial.valley;
  assert.equal(applyToyEvent(initial,{type:'LOST_NOTE_COLLECTED',id:'unknown'}),initial);
  assert.equal(applyToyEvent(initial,{type:'LOST_NOTE_COLLECTED',id:'note-box'}),initial);
  let state=applyToyEvent(initial,{type:'TOY_TARGET_DEFEATED',id:'toy-plaza-box'});
  state=applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'note-box'});
  assert.equal(applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'note-box'}),state);
  state=applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'note-secret-a'});
  assert.deepEqual(state.toy.discoveredSecrets,[TOY_SECRET]);assert.equal(state.entries,entries);assert.equal(state.valley,valley);
  assert.equal(Object.hasOwn(state.toy,'xp'),false);assert.equal(TOY_NOTES.filter(n=>n.secretId===TOY_SECRET).length,3);
});
test('toy progress persists locally per profile, resets only with Adventure and legacy saves get an empty additive field',()=>{
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)},persistence=createAdventurePersistence(()=>storage);
  const state=applyToyEvent(createAdventureState(),{type:'LOST_NOTE_COLLECTED',id:'note-arrival'});
  assert.ok(persistence.save(1,state));assert.deepEqual(persistence.load(1).toy,state.toy);assert.equal(persistence.load(2).toy.collectedNotes.length,0);
  assert.deepEqual(normalizeToyState({collectedNotes:['bad','note-box','note-arrival','note-arrival']}),{collectedNotes:['note-arrival'],defeatedTargets:[],discoveredSecrets:[],completedMechanisms:[]});
  const flow=createWorldActivityState(state),reset=worldActivityReducer(flow,{type:'RESET_ADVENTURE'});
  assert.equal(reset.game.adventure.toy.collectedNotes.length,0);assert.equal(reset.game.progression,flow.game.progression);
  assert.equal(worldActivityReducer({...flow,mode:'PIANO'},{type:'TOY_EVENT',event:{type:'LOST_NOTE_COLLECTED',id:'note-plaza'}}).game.adventure,flow.game.adventure);
});
