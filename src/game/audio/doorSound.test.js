import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDoorSound,DOOR_SOUND_FILE} from './doorSound.js';
import {updateGateModels} from '../world/worldGates.js';
import {createAdventureState,beginAdventureActivity,settleAdventureActivity} from '../adventure/adventureState.js';
import {applyValleyEvent} from '../adventure/valleyProgression.js';
import {FOREST_LESSON_CHESTS} from '../world/composition/forestAdventureComposition.js';

function fixture(){
  let time=0;const voices=[];
  const sound=createDoorSound({now:()=>time,createAudio:url=>{
    const audio={url,paused:true,count:0,play(){this.count++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){this.removed=true;},load(){}};
    voices.push(audio);return audio;
  }});
  return {sound,voices,advance:seconds=>{time+=seconds*1000;}};
}
test('supplied door sound plays once for a nearby opening and not for distant doors',()=>{
  assert.ok(fs.existsSync('public/audio/Audio/'+DOOR_SOUND_FILE));
  const {sound,voices}=fixture();sound.opened('near',{x:0,z:0});sound.opened('near',{x:0,z:0});sound.opened('far',{x:50,z:0});
  sound.update({player:{x:0,z:0}});sound.update({player:{x:0,z:0}});
  assert.equal(voices.reduce((n,v)=>n+v.count,0),1);assert.equal(voices.find(v=>v.count).url,'/audio/Audio/'+DOOR_SOUND_FILE);
  assert.equal(voices.find(v=>v.count).volume,.22);sound.dispose();
});
test('opening waits for world return briefly, but mute, expiry and session reset discard it',()=>{
  const {sound,voices,advance}=fixture(),player={x:0,z:0};
  sound.opened('gate',player);sound.update({active:false,player});assert.equal(voices.reduce((n,v)=>n+v.count,0),0);
  advance(1);sound.update({player});assert.equal(voices.reduce((n,v)=>n+v.count,0),1);
  sound.opened('muted',player);sound.update({silent:true,player});sound.update({player});
  sound.opened('expired',player);advance(11);sound.update({player});
  sound.opened('reset',player);sound.reset();sound.update({player});
  assert.equal(voices.reduce((n,v)=>n+v.count,0),1);
  sound.dispose();assert.ok(voices.every(v=>v.removed));
});
test('progression doors emit opening only on a transition; loading an already open door is silent',()=>{
  const initial=createAdventureState();let completed=applyValleyEvent(initial,{type:'REGION_DISCOVERED',regionId:'BOSQUE_DE_LAS_NOTAS'});
  for(const chest of FOREST_LESSON_CHESTS)completed=settleAdventureActivity(beginAdventureActivity(completed,chest.id,chest.activityId),chest.id,{activityId:chest.activityId,completed:true});
  const model={userData:{gateId:'forest_to_river'},visible:true};let opened=0;
  updateGateModels([model],initial,()=>opened++);assert.equal(model.visible,true);
  updateGateModels([model],completed,()=>opened++);assert.equal(model.visible,false);assert.equal(opened,1);
  updateGateModels([model],completed,()=>opened++);assert.equal(opened,1);
  const restored={userData:{gateId:'forest_to_river'},visible:true};updateGateModels([restored],completed,()=>opened++);
  assert.equal(restored.visible,false);assert.equal(opened,1);
});
