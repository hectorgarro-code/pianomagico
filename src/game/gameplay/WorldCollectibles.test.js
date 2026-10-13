import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorldCollectibles} from './WorldCollectibles.js';
import {createToyNoteSound} from '../audio/toyNoteSound.js';

test('secret notes stay hidden until nearby and unlocked, celebrate once and restore silently',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
  const group=new THREE.Group(),found=[],collected=[];
  const adventure={toy:{collectedNotes:[],completedMechanisms:[],discoveredSecrets:[]}};
  let runtime;
  const options={adventure:()=>adventure,onCollect:n=>{collected.push(n.id);adventure.toy.collectedNotes.push(n.id);},onBurst(){},onSecret:id=>{found.push(id);adventure.toy.discoveredSecrets.push(id);}};
  try{
    runtime=createWorldCollectibles(group,()=>0,options);
    const note=group.getObjectByName('LostNote:secret-ruins-runes-a');
    assert.equal(note.visible,false);
    runtime.update(.1,1,{x:0,y:0,z:0},new Set());assert.equal(note.visible,false);
    runtime.update(.1,2,{x:16.5,y:0,z:-107},new Set());assert.equal(note.visible,false);
    adventure.toy.completedMechanisms.push('ruins-side-runes');
    runtime.update(.1,3,{x:16.5,y:0,z:-107},new Set());
    runtime.update(.1,4,{x:17.5,y:0,z:-107.4},new Set());
    assert.deepEqual(found,['ruins-runes-cache']);assert.equal(collected.length,2);
    assert.equal(runtime.companionInterests().some(n=>n.x===17.5&&n.z===-107.4),false);
    runtime.dispose();runtime=createWorldCollectibles(group,()=>0,options);
    runtime.update(.1,5,{x:16.5,y:0,z:-107},new Set());
    assert.equal(collected.length,2);assert.equal(found.length,1);
    assert.equal(group.getObjectByName('SecretDiscovery').visible,false);
  }finally{runtime?.dispose();if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
  assert.equal(group.children.length,0);
});

test('real collectible renderer picks up once, hides unreleased drops, animates collection and restores saved notes',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillText(){}})})};
  const group=new THREE.Group(),collected=[];let burst=0,renderer;
  try{
    renderer=createWorldCollectibles(group,()=>0,{adventure:()=>({toy:{collectedNotes:['note-plaza']}}),onCollect:note=>collected.push(note.id),onBurst:()=>burst++});
    const defeated=new Set();renderer.update(.1,1,{x:1.5,y:0,z:2},defeated);renderer.update(.1,1.1,{x:1.5,y:0,z:2},defeated);
    assert.deepEqual(collected,['note-arrival']);assert.equal(burst,1);
    renderer.update(.1,1.2,{x:8.5,y:0,z:-7.5},defeated);assert.equal(collected.length,1);
    defeated.add('toy-plaza-box');renderer.release('toy-plaza-box',{x:7,z:-8});renderer.update(.1,1.3,{x:7,y:0,z:-8},defeated);
    assert.deepEqual(collected,['note-arrival','note-box']);renderer.update(.5,2,{x:7,y:0,z:-8},defeated);
    assert.equal(group.getObjectByName('LostNote:note-box').visible,false);
    assert.equal(renderer.count,3);
  }finally{renderer?.dispose();if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
  assert.equal(group.children.length,0);
});
test('pickup tones are gesture-unlocked and isolated from the piano context, with mute and cleanup',()=>{
  let resumed=0,closed=0,started=0;const frequencies=[];
  const context={state:'running',currentTime:0,destination:{},resume(){resumed++;return Promise.resolve();},close(){closed++;return Promise.resolve();},createOscillator(){const osc={frequency:{},connect(){},disconnect(){},start(){started++;frequencies.push(this.frequency.value);},stop(){}};return osc;},createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
  const sound=createToyNoteSound({createContext:()=>context});assert.equal(sound.play('C4'),false);
  sound.unlock();assert.equal(resumed,1);assert.equal(sound.play('C4'),true);assert.equal(sound.play('E4',{silent:true}),false);
  assert.equal(started,1);assert.deepEqual(frequencies,[261.63]);sound.dispose();assert.equal(closed,1);assert.equal(sound.play('C4'),false);
});
