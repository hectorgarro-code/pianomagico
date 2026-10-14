import test from 'node:test';
import process from 'node:process';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createDefaultContent,applyGameContent,CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
import {ASSET_CATALOG} from '../game/assets/assetCatalog.js';
import {createAdventureState,beginAdventureActivity,settleAdventureActivity,findAdventureObject} from '../game/adventure/adventureState.js';
import {getValleyProgress} from '../game/adventure/valleyProgression.js';
import {historyReducer,prepareEditorContent,sceneRecords,addSceneRecord,patchRecord,removeSceneRecord,contentDiff} from './editorState.js';
import {toyWorldActions} from '../game/world/composition/toyComposition.js';
import {getValleyMap} from '../game/navigation/valleyNavigation.js';
import {mapIllustration} from '../game/navigation/mapLandmarks.js';
import {saveTemplate,authorMetadata} from './editorAuthoring.js';
const original=createDefaultContent(),regionId=original.world[0].id,asset=ASSET_CATALOG.assets.find(a=>a.url==='/models/props/chest_wood.glb');
const fixture=()=>{const c=prepareEditorContent(structuredClone(original));c.activities.filter(a=>a.type==='PRACTICE_STATION').forEach(a=>a.lessonId=1);return c;};
function validate(content){const lessons=JSON.parse(readFileSync('docs/audits/lesson-catalog-snapshot.json')).lessons.map(l=>({...l,enabled:true,is_user_created:false,user_id:null}));return execFileSync(process.env.PHP_BINARY||(process.platform==='win32'?'C:/xampp/php/php.exe':'php'),['-r',`require 'backend/content/validation.php'; $i=json_decode(stream_get_contents(STDIN),true); $r=json_decode(file_get_contents('backend/content/registry.json'),true); try {validate_game_content($i['content'],$r,$i['lessons']);echo 'valid';} catch(Throwable $e){echo $e->getMessage();}`],{input:JSON.stringify({content,lessons}),encoding:'utf8'});}
test('history is immutable, bounded and restores edits including added objects',()=>{
  const state=historyReducer({},{type:'reset',value:fixture()}),added=addSceneRecord(state.value,regionId,'chest',asset,[12,0,3],1);
  const changed=historyReducer(state,{type:'change',value:added.content});assert.equal(state.value.activities.length+1,changed.value.activities.length);
  const undone=historyReducer(changed,{type:'undo'});assert.deepEqual(undone.value,state.value);assert.deepEqual(historyReducer(undone,{type:'redo'}).value,added.content);
});
test('editor snapshots the actual authored targets and permits deliberate edits without runtime overrides',()=>{
  const c=fixture();assert.ok(c.worldActions.some(t=>t.id==='intro-skeleton'));
  c.worldActions.find(t=>t.id==='intro-skeleton').position=[2,0,3];assert.deepEqual(toyWorldActions(c,CONTENT_COMPOSITIONS).find(t=>t.id==='intro-skeleton').position,[2,0,3]);assert.equal(validate(c),'valid');
});
test('optional chest reaches Adventure, physical composition and map metadata without changing regional progression',()=>{
  const added=addSceneRecord(fixture(),regionId,'chest',asset,[12,0,3],1),a=added.content.activities.at(-1);assert.equal(validate(added.content),'valid');
  try {applyGameContent(added.content);const o=findAdventureObject(a.id);assert.deepEqual(o.instance.position,[12,0,3]);assert.ok(CONTENT_COMPOSITIONS[0].adventureObjects.includes(o));
    let adventure=createAdventureState();const progress=getValleyProgress(adventure);assert.equal(adventure.entries[a.id].state,'AVAILABLE');
    adventure=beginAdventureActivity(adventure,a.id,1);adventure=settleAdventureActivity(adventure,a.id,{activityId:1,completed:true});assert.equal(adventure.entries[a.id].state,'COMPLETED');
    assert.deepEqual(getValleyProgress(adventure).completedRegions,progress.completedRegions);assert.equal(createAdventureState(adventure).entries[a.id].state,'COMPLETED');
  }finally{applyGameContent(original);}assert.equal(findAdventureObject(a.id),undefined);
});
test('protected landmark cannot be deleted and optional chest deletion removes its own binding',()=>{
  const c=fixture(),protectedRecord=sceneRecords(c,c.world[0]).find(r=>r.id==='atrium-column-front-west');assert.throws(()=>removeSceneRecord(c,regionId,protectedRecord));
  const result=addSceneRecord(c,regionId,'chest',asset,[12,0,3],1),record=sceneRecords(result.content,result.content.world[0]).find(r=>r.key===result.key);
  const removed=removeSceneRecord(result.content,regionId,record);assert.equal(removed.activities.length,c.activities.length);assert.equal(validate(removed),'valid');
});
test('new gate carries a valid reusable mini and NPC transforms roundtrip in their native schema',()=>{
  const gate=addSceneRecord(fixture(),regionId,'gate',asset,[12,0,3]);assert.equal(validate(gate.content),'valid');
  const player=ASSET_CATALOG.assets.find(a=>a.id==='player:1'),npc=addSceneRecord(gate.content,regionId,'npc',player,[15,0,3]);
  const record=sceneRecords(npc.content,npc.content.world[0]).find(r=>r.key===npc.key),moved=patchRecord(npc.content,regionId,record,{rotation:[0,.5,0],scale:[1,1,1],position:[16,0,3]});
  assert.equal(moved.residents.at(-1).rotation,.5);assert.equal(moved.residents.at(-1).scale,1);assert.equal(validate(moved),'valid');
});
test('server rejects missing dependencies, cycles, invalid clips and mutations to principal progression',()=>{
  const result=addSceneRecord(fixture(),regionId,'chest',asset,[12,0,3],1),c=result.content,a=c.activities.at(-1);
  a.requirements.completedObjects=[a.id];assert.match(validate(c),/circulares/);a.requirements.completedObjects=['missing'];assert.match(validate(c),/inexistente/);
  a.requirements.completedObjects=['plaza-first-lesson'];assert.match(validate(c),/practica libre/);a.requirements.completedObjects=[];a.progressionReward.type='XP';assert.match(validate(c),/progreso principal/);
});
test('publication review names changes and map ink follows edited landmarks',()=>{
  const c=fixture(),tree=c.world[0].instances.find(i=>i.id==='west-grove-main');tree.position[0]-=2;
  const changes=contentDiff(original,c);assert.ok(changes.some(i=>i.id===tree.id&&i.fields.includes('position')));
  try{applyGameContent(c);const ink=mapIllustration(getValleyMap(createAdventureState()));assert.equal(ink.landmarks.find(l=>l.id===tree.id).position.x,tree.position[0]);}finally{applyGameContent(original);}
});
test('onboarding encounters and initial tempo remain protected when publishing',()=>{
  const c=fixture();c.activities.find(a=>a.id==='plaza-first-lesson').introLessonId=2;assert.match(validate(c),/100 BPM/);
  delete c.activities.find(a=>a.id==='plaza-first-lesson').introLessonId;
  const target=c.worldActions.find(t=>t.id==='intro-box');target.enabledInWorld=false;assert.match(validate(c),/inicio de la aventura/);
});
test('server preserves valid authoring metadata and rejects unsafe templates',()=>{
  const c=fixture(),records=sceneRecords(c,c.world[0]).filter(r=>r.id.startsWith('west-root-')),keys=records.map(r=>r.key);
  const saved=saveTemplate(authorMetadata(c,regionId,records,keys,{group:'Jardin',layer:'Raices',locked:true}),records,keys,'Raices');
  assert.equal(validate(saved),'valid');saved.editorTemplates[0].instances[0].assetUrl='/not-a-model.glb';assert.match(validate(saved),/Asset fuera/);
  delete saved.editorTemplates;saved.world[0].instances.find(i=>i.id===records[0].id).editor.locked='yes';assert.match(validate(saved),/Estado editorial/);
});
