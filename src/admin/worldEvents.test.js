import test from 'node:test';
import process from 'node:process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createDefaultContent,applyGameContent} from '../game/content/contentDefaults.js';
import {prepareEditorContent,addSceneRecord,sceneRecords,removeSceneRecord} from './editorState.js';
import {transformSelection} from './editorAuthoring.js';
import {createWorldEvent} from './worldEventAuthoring.js';
import {createAdventureState} from '../game/adventure/adventureState.js';
import {applyToyEvent} from '../game/adventure/toyState.js';
import {getValleyProgress} from '../game/adventure/valleyProgression.js';
import {getValleyMap} from '../game/navigation/valleyNavigation.js';
import {TOY_NOTES} from '../game/world/composition/toyComposition.js';
import {ASSET_CATALOG} from '../game/assets/assetCatalog.js';
const baseline=createDefaultContent();
const fixture=()=>{const c=prepareEditorContent(structuredClone(baseline));c.activities.filter(a=>a.type==='PRACTICE_STATION').forEach(a=>a.lessonId=1);return c;};
function validate(content) {
  const lessons=JSON.parse(readFileSync('docs/audits/lesson-catalog-snapshot.json')).lessons.map(l=>({...l,enabled:true,is_user_created:false,user_id:null}));
  return execFileSync(process.env.PHP_BINARY||(process.platform==='win32'?'C:/xampp/php/php.exe':'php'),['-r',"require 'backend/content/validation.php';$i=json_decode(stream_get_contents(STDIN),true);$registry=json_decode(file_get_contents('backend/content/registry.json'),true);try{validate_game_content($i['content'],$registry,$i['lessons']);echo 'valid';}catch(Throwable $e){echo $e->getMessage();}"],{input:JSON.stringify({content,lessons}),encoding:'utf8'});
}
test('authored secret discovery is idempotent and survives reload without educational progression',()=>{
  const c=fixture(),event=createWorldEvent(c.world[0].regionId,[12,0,4]);event.noteCount=2;c.worldEvents=[event];assert.equal(validate(c),'valid');
  try{applyGameContent(c);let adventure=createAdventureState();const progress=getValleyProgress(adventure);assert.ok(!getValleyMap(adventure).secrets.some(s=>s.id===event.id));
    const id=`${event.id}:note-0`;adventure=applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id});assert.ok(getValleyMap(adventure).secrets.some(s=>s.id===event.id));assert.equal(applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id}),adventure);
    assert.deepEqual(getValleyProgress(adventure),progress);const loaded=createAdventureState(adventure);assert.ok(loaded.toy.collectedNotes.includes(id));assert.ok(loaded.toy.discoveredSecrets.includes(event.id));
  }finally{applyGameContent(baseline);}assert.ok(!TOY_NOTES.some(n=>n.id.startsWith(event.id)));
});
test('target-triggered notes require defeat and disabling/re-enabling cannot duplicate rewards',()=>{
  let c=fixture();const asset=ASSET_CATALOG.assets.find(a=>a.url==='/models/props/Assets/gltf/barrel_small.gltf');
  c=addSceneRecord(c,c.world[0].id,'destructible',asset,[12,0,4]).content;const source=c.worldActions.at(-1),event={...createWorldEvent(c.world[0].regionId,[13,0,4]),trigger:'TARGET_DEFEATED',sourceId:source.id};c.worldEvents=[event];assert.equal(validate(c),'valid');
  try{applyGameContent(c);let adventure=createAdventureState();const id=`${event.id}:note-0`;assert.equal(applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id}),adventure);
    adventure=applyToyEvent(adventure,{type:'TOY_TARGET_DEFEATED',id:source.id});adventure=applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id});
    c.worldEvents[0].enabled=false;applyGameContent(c);adventure=createAdventureState(adventure);assert.ok(adventure.toy.collectedNotes.includes(id));assert.ok(!getValleyMap(adventure).secrets.some(s=>s.id===event.id));
    c.worldEvents[0].enabled=true;applyGameContent(c);assert.equal(applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id}),adventure);
    assert.throws(()=>removeSceneRecord(c,c.world[0].id,sceneRecords(c,c.world[0]).find(r=>r.id===source.id)),/evento depende/);
  }finally{applyGameContent(baseline);}
});
test('musical trigger uses the existing world mechanism completion authority',()=>{
  const c=fixture(),event={...createWorldEvent(c.world[1].regionId,[-6,0,-32]),trigger:'WORLD_MECHANISM_COMPLETED',sourceId:'forest-three-runes'};c.worldEvents=[event];assert.equal(validate(c),'valid');
  try{applyGameContent(c);let adventure=createAdventureState();const id=`${event.id}:note-0`;assert.equal(applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id}),adventure);adventure=applyToyEvent(adventure,{type:'WORLD_MECHANISM_COMPLETED',id:event.sourceId});adventure=applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id});assert.ok(adventure.toy.collectedNotes.includes(id));}finally{applyGameContent(baseline);}
});
test('event publication rejects XP, protected sources, invalid IDs and outside positions',()=>{
  const c=fixture(),event=createWorldEvent(c.world[0].regionId,[12,0,4]);c.worldEvents=[event];event.reward='XP';assert.match(validate(c),/Campos de evento/);delete event.reward;
  event.trigger='TARGET_DEFEATED';event.sourceId='intro-box';assert.match(validate(c),/protegida/);event.sourceId='missing';assert.match(validate(c),/ausente/);
  event.trigger='WORLD_MECHANISM_COMPLETED';event.sourceId='unsupported';assert.match(validate(c),/Mecanismo/);event.trigger='NEAR_PLAYER';event.sourceId=null;event.position[2]=-500;assert.match(validate(c),/fuera del Valle/);
});
test('world editor moves event markers without persisting artificial rotation or scale',()=>{
  const c=fixture(),event=createWorldEvent(c.world[0].regionId,[12,0,4]);c.worldEvents=[event];const records=sceneRecords(c,c.world[0]),record=records.find(r=>r.id===event.id);
  const moved=transformSelection(c,c.world[0].id,records,[record.key],record,{position:[13,0,5]});assert.deepEqual(moved.worldEvents[0].position,[13,0,5]);assert.equal(moved.worldEvents[0].rotation,undefined);assert.equal(validate(moved),'valid');
  assert.throws(()=>transformSelection(c,c.world[0].id,records,[record.key],record,{scale:[2,2,2]}),/no se rotan/);
});
