import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IMPACT_SOUNDS,createImpactSounds,targetImpactSound} from './impactSounds.js';

function fixture(){
  let time=0;const voices=[];
  const sounds=createImpactSounds({now:()=>time,createAudio:url=>{
    const audio={url,paused:true,count:0,play(){this.count++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){this.removed=true;},load(){}};
    voices.push(audio);return audio;
  }});
  return {sounds,voices,advance:ms=>{time+=ms;}};
}
test('impact selections reference real local files and distinguish striking wood from breaking it',()=>{
  for(const {file} of Object.values(IMPACT_SOUNDS))assert.ok(fs.existsSync('public/audio/Audio/'+file));
  const target={type:'DESTRUCTIBLE',assetId:'existing:/models/barrel_small.gltf',defeated:false};
  assert.equal(targetImpactSound(target),'woodHit');assert.equal(targetImpactSound({...target,defeated:true}),'woodBreak');
  assert.equal(targetImpactSound({type:'WORLD_CREATURE'}),'creature');
  assert.equal(targetImpactSound({type:'WORLD_CREATURE',defeated:true}),'defeat');
  assert.equal(targetImpactSound({type:'DESTRUCTIBLE',assetId:'rock',defeated:true}),'stoneBreak');
  for(const name of ['box_small','box_small_decorated','keg'])assert.equal(targetImpactSound({...target,assetId:name}),'woodHit');
});
test('impacts are bounded, quiet, distance-aware and suppress simultaneous duplicates',()=>{
  const {sounds,voices,advance}=fixture();
  assert.equal(sounds.play('creature'),true);assert.equal(sounds.play('creature'),false);
  assert.equal(sounds.play('hurt'),true);
  advance(100);assert.equal(sounds.play('creature',{position:{x:30,z:0},player:{x:0,z:0}}),false);
  assert.equal(sounds.play('woodBreak',{position:{x:11,z:0},player:{x:0,z:0}}),true);
  assert.equal(voices.find(v=>v.url.endsWith(IMPACT_SOUNDS.woodBreak.file)&&v.count).volume,.1);
  assert.ok(voices.filter(v=>v.count).every(v=>v.volume<=.2));sounds.dispose();
});
test('mute, pause and cleanup prevent lingering or new impact sounds',()=>{
  const {sounds,voices}=fixture();assert.equal(sounds.play('woodHit',{silent:true}),false);
  sounds.play('hurt');sounds.stop();assert.ok(voices.every(v=>v.paused));
  sounds.dispose();assert.equal(sounds.play('hurt'),false);assert.ok(voices.every(v=>v.removed));
});
test('failed audio playback does not escape into gameplay',async()=>{
  const sounds=createImpactSounds({createAudio:()=>({paused:true,pause(){},removeAttribute(){},load(){},play(){return Promise.reject(Error('Blocked'));}})});
  assert.equal(sounds.play('hurt'),true);await Promise.resolve();sounds.dispose();
});

test('impact volume follows world preference without increasing authored loudness',()=>{
  const {sounds,voices}=fixture();sounds.play('woodBreak',{volume:.25});
  assert.equal(voices.find(v=>v.count).volume,.05);sounds.dispose();
});
