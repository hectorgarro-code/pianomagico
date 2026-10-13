import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {EXPLORATION_SECRETS,EXPLORATION_CUES,EXPLORATION_TARGETS,EXPLORATION_MECHANISMS,RUINS_SECRET_MUSIC,explorationOverlay} from '../world/composition/explorationSecrets.js';
import {TOY_NOTES} from '../world/composition/toyComposition.js';
import {applyToyEvent,normalizeToyState} from './toyState.js';
import {createAdventureState} from './adventureState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {getValleyMap,MAP_COMPOSITIONS,resolveObjectiveTarget} from '../navigation/valleyNavigation.js';
import {validateComposition} from '../world/composition/validateComposition.js';
import {pointToSegmentDistance,calculateTerrainElevation} from '../world/worldGenerationRules.js';

test('nine authored secrets use existing footprints, real assets and deliberate approach cues',()=>{
  assert.equal(EXPLORATION_SECRETS.length,9);
  assert.deepEqual(Object.values(Object.groupBy(EXPLORATION_SECRETS,s=>s.regionId)).map(s=>s.length),[2,2,2,2,1]);
  assert.ok(new Set(EXPLORATION_SECRETS.map(s=>s.type)).size>=5);
  for(const secret of EXPLORATION_SECRETS){
    assert.ok(secret.approach.length>=3);assert.ok(secret.cue);assert.equal(secret.reward,'LOST_NOTES');
    assert.ok(Math.abs(secret.position[0])<55&&secret.position[2]>-145&&secret.position[2]<55);
    assert.ok(TOY_NOTES.some(n=>n.secretId===secret.id));
    for(const [x,z] of secret.approach)assert.ok(Number.isFinite(calculateTerrainElevation(x,z)));
  }
  for(const cue of EXPLORATION_CUES){
    const filename='public'+cue.assetUrl;assert.ok(fs.existsSync(filename),filename);
    const model=JSON.parse(fs.readFileSync(filename,'utf8'));
    for(const resource of [...(model.buffers||[]),...(model.images||[])])if(resource.uri&&!resource.uri.startsWith('data:'))assert.ok(fs.existsSync(path.resolve(path.dirname(filename),decodeURI(resource.uri))),resource.uri);
  }
  for(const base of MAP_COMPOSITIONS){const before=JSON.stringify(base),overlay=explorationOverlay(base);
    assert.equal(JSON.stringify(base),before);assert.deepEqual(overlay.paths,[]);assert.deepEqual(overlay.adventureObjects,[]);
    if(overlay.instances.length)assert.ok(validateComposition(overlay,{registeredAssets:EXPLORATION_CUES.map(c=>c.assetUrl)}).valid);
  }
});
test('small solid cues and the suspicious barrel stay outside primary routes and lesson space',()=>{
  const solids=[...EXPLORATION_CUES.filter(c=>c.collision.type==='solid'),...EXPLORATION_TARGETS];
  for(const item of solids){const [x,,z]=item.position,base=MAP_COMPOSITIONS.find(c=>c.regionId===item.regionId);
    for(const route of base.paths.filter(p=>!p.id.includes('detour')))for(let i=1;i<route.points.length;i++){
      const a=route.points[i-1],b=route.points[i];assert.ok(pointToSegmentDistance(x,z,a[0],a[2],b[0],b[2])>route.width/2+2.2,`${item.id} invades ${route.id}`);
    }
    for(const chest of base.adventureObjects||[]){const p=chest.position||chest.instance.position;assert.ok(Math.hypot(x-p[0],z-p[2])>3.5,item.id);}
  }
});
test('undiscovered secrets never enter map or objective; discoveries persist without duplicate rewards or educational changes',()=>{
  let state=createAdventureState();const objective=resolveObjectiveTarget(state);
  assert.deepEqual(getValleyMap(state).secrets,[]);
  assert.equal(applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'secret-river-barrel-a'}),state);
  state=applyToyEvent(state,{type:'TOY_TARGET_DEFEATED',id:'secret-river-barrel'});
  state=applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'secret-river-barrel-a'});
  assert.deepEqual(getValleyMap(state).secrets.map(s=>s.id),['river-resonant-barrel']);assert.deepEqual(resolveObjectiveTarget(state),objective);
  assert.equal(applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'secret-river-barrel-a'}),state);
  assert.equal(applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'secret-ruins-runes-a'}),state);
  state=applyToyEvent(state,{type:'WORLD_MECHANISM_COMPLETED',id:RUINS_SECRET_MUSIC.id});
  state=applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:'secret-ruins-runes-a'});
  assert.equal(Object.hasOwn(state.toy,'xp'),false);assert.equal(Object.hasOwn(state.toy,'pets'),false);
  const storage=new Map(),persist=createAdventurePersistence(()=>({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}));
  persist.save(4,state);assert.deepEqual(persist.load(4).toy,state.toy);assert.deepEqual(getValleyMap(persist.load(5)).secrets,[]);
  assert.deepEqual(normalizeToyState({discoveredSecrets:EXPLORATION_SECRETS.map(s=>s.id)}).discoveredSecrets,[]);
});
test('legacy Forest rewards migrate into discovery without creating or repeating notes; other mechanisms are rejected',()=>{
  const normalized=normalizeToyState({completedMechanisms:['forest-three-runes','bogus'],collectedNotes:['note-runes-do']});
  assert.deepEqual(normalized.discoveredSecrets,['forest-runes-cache']);assert.equal(normalized.collectedNotes.length,1);
  assert.equal(EXPLORATION_MECHANISMS.length,2);assert.notDeepEqual(EXPLORATION_MECHANISMS[0].sequence,EXPLORATION_MECHANISMS[1].sequence);
  const state=createAdventureState();assert.equal(applyToyEvent(state,{type:'WORLD_MECHANISM_COMPLETED',id:'bogus'}),state);
});
