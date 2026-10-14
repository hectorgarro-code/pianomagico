import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createDefaultContent} from '../game/content/contentDefaults.js';
import {prepareEditorContent,sceneRecords,patchRecord} from './editorState.js';
import {createResidentBehavior,stepResident} from '../game/gameplay/residentBehavior.js';
import {creatureStep} from '../game/gameplay/creatureEncounter.js';

function validate(content){
  const lessons=JSON.parse(readFileSync('docs/audits/lesson-catalog-snapshot.json')).lessons.map(l=>({...l,enabled:true,is_user_created:false,user_id:null}));
  return execFileSync(process.env.PHP_BINARY||(process.platform==='win32'?'C:/xampp/php/php.exe':'php'),['-r',"require 'backend/content/validation.php';$i=json_decode(stream_get_contents(STDIN),true);$r=json_decode(file_get_contents('backend/content/registry.json'),true);try{validate_game_content($i['content'],$r,$i['lessons']);echo 'valid';}catch(Throwable $e){echo $e->getMessage();}"],{input:JSON.stringify({content,lessons}),encoding:'utf8'});
}
const fixture=()=>{const c=prepareEditorContent(createDefaultContent());c.activities.filter(a=>a.type==='PRACTICE_STATION').forEach(a=>a.lessonId=1);return c;};
test('resident authored greetings and restored gestures keep original defaults',()=>{
  assert.equal(stepResident(createResidentBehavior(),{distance:4},.1).state,'WAVE');
  const memory=createResidentBehavior(),behavior={nearRadius:3,greeting:'LOOK_AT_PLAYER',restored:'CHEER'};
  assert.equal(stepResident(memory,{distance:4,behavior},.1).state,'IDLE');
  assert.equal(stepResident(memory,{distance:2,behavior},.1).state,'LOOK_AT_PLAYER');
  assert.equal(stepResident(memory,{distance:2,behavior,regionComplete:true},4).state,'CHEER');
  assert.equal(stepResident(memory,{distance:2,behavior,regionComplete:true},4).state,'CHEER');
});
test('moving resident translates its authored patrol without mutating the source',()=>{
  const c=fixture(),r=sceneRecords(c,c.world[0]).find(r=>r.walk),old=structuredClone(r.walk);
  const next=patchRecord(c,c.world[0].id,r,{position:[r.position[0]+3,0,r.position[2]-2]});
  assert.deepEqual(next.residents.find(n=>n.id===r.id).walk,old.map(([x,z])=>[x+3,z-2]));assert.deepEqual(r.walk,old);assert.equal(validate(next),'valid');
});
test('arcade config controls chase and strike timing while training remains protected',()=>{
  const target={position:{x:0,y:0,z:0},home:{x:0,z:0},phase:0,behaviorType:'wander',reaction:0,encounter:{noticeRange:3,chaseSpeed:.9,windup:1.5,recovery:2}};
  assert.equal(creatureStep(target,{x:4,z:0},.1).state,'WANDER');
  assert.equal(creatureStep(target,{x:2,z:0},.1).speed,.9);
  creatureStep(target,{x:1,z:0},.1);assert.equal(creatureStep(target,{x:1,z:0},.6).hit,false);
  assert.equal(creatureStep(target,{x:1,z:0},1).hit,true);
  target.training=true;target.strike=null;assert.equal(creatureStep(target,{x:2,z:0},.1).speed,.8);
});
test('publication validates behaviors, patrol limits and onboarding protection',()=>{
  const c=fixture(),r=c.residents[0],t=c.worldActions.find(t=>t.type==='WORLD_CREATURE'&&!t.firstMinutesOnly);
  r.behavior={nearRadius:4,walkSpeed:.8,greeting:'LOOK_AT_PLAYER',restored:'CHEER'};t.encounter={noticeRange:4,leash:8,chaseSpeed:1,windup:1,recovery:2};assert.equal(validate(c),'valid');
  r.behavior.greeting='Attack';assert.match(validate(c),/Gesto/);r.behavior.greeting='WAVE';
  r.walk=[[0,0],[0,-900]];assert.match(validate(c),/Recorrido/);delete r.walk;
  t.encounter.leash=3;assert.match(validate(c),/Retorno/);t.encounter.leash=8;
  t.encounter.damage=200;assert.match(validate(c),/arcade/);delete t.encounter.damage;
  c.worldActions.find(t=>t.id==='intro-skeleton').encounter={noticeRange:10};assert.match(validate(c),/arcade/);
});
