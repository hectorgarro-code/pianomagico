import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { createFootsteps, FOOTSTEP_FILES } from './footsteps.js';
import { createFootstepSurface } from '../world/footstepSurface.js';

function fixture() {
  const voices=[];
  const controller=createFootsteps({createAudio:url=>{
    const voice={url,paused:true,plays:0,currentTime:0,play(){this.plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){this.removed=true;},load(){}};
    voices.push(voice);return voice;
  }});
  return {controller,voices};
}
test('exact user audio files exist; cadence follows actual distance and surface is checked only per step',()=>{
  for(const file of Object.values(FOOTSTEP_FILES))assert.ok(fs.existsSync('public/audio/Audio/'+file));
  const {controller,voices}=fixture();let queries=0;
  const surface=()=>{queries++;return 'concrete';};
  controller.update({moved:.5,grounded:true,time:1,surface});assert.equal(queries,0);
  controller.update({moved:1,grounded:true,time:1.3,surface});assert.equal(queries,1);
  assert.equal(voices.filter(v=>v.plays)[0].url,'/audio/Audio/footstep_concrete_004.ogg');
  controller.update({moved:1.5,grounded:true,time:1.7,surface:'grass'});
  assert.ok(voices.some(v=>v.url.endsWith('footstep_grass_000.ogg')&&v.plays));
  assert.ok(voices.every(v=>v.volume<=.14));controller.dispose();
});
test('idle, blocked movement, jumps, mute and pause produce no steps or delayed playback',()=>{
  const {controller,voices}=fixture();
  for(const args of [{moved:0,grounded:true},{moved:5,grounded:false},{moved:5,grounded:true,silent:true}])controller.update({...args,time:1});
  assert.equal(voices.reduce((n,v)=>n+v.plays,0),0);
  controller.update({moved:1.5,grounded:true,time:2});controller.stop();assert.ok(voices.every(v=>v.paused));
  controller.update({moved:.1,grounded:true,time:4});assert.equal(voices.reduce((n,v)=>n+v.plays,0),1);
  controller.dispose();controller.update({moved:5,grounded:true,time:5});assert.ok(voices.every(v=>v.removed));
});
test('running cadence stays bounded and rejected playback never breaks movement',async()=>{
  let plays=0;const controller=createFootsteps({createAudio:()=>({paused:true,pause(){},removeAttribute(){},load(){},play(){plays++;return Promise.reject(Error('Gesture required'));}})});
  controller.update({moved:1.5,running:true,grounded:true,time:1});assert.equal(plays,0);
  controller.update({moved:1,running:true,grounded:true,time:1.1});assert.equal(plays,1);
  controller.update({moved:10,running:true,grounded:true,time:1.15});assert.equal(plays,1);
  await Promise.resolve();controller.dispose();
});
test('surface detection matches real stone footprints, not region boundaries or overhead lintels',()=>{
  const group=new THREE.Group(),floor=new THREE.Mesh(new THREE.BoxGeometry(2,.1,2),new THREE.MeshBasicMaterial());
  floor.userData.footstepSurface='concrete';group.add(floor);
  const roof=floor.clone();roof.position.set(4,4,0);group.add(roof);group.updateMatrixWorld(true);
  const surface=createFootstepSurface(group);
  assert.equal(surface({x:0,y:0,z:0}),'concrete');
  assert.equal(surface({x:2,y:0,z:0}),'grass');
  assert.equal(surface({x:4,y:0,z:0}),'grass');
  floor.geometry.dispose();floor.material.dispose();
});
