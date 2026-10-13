import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCompanion, companionProfile, companionStep, companionClip, reactCompanion, COMPANION_METADATA} from './companionBehavior.js';
import {CollisionWorld} from '../world/collision/CollisionWorld.js';

const pack=JSON.parse(fs.readFileSync(new URL('../assets/localAssetPacks.json',import.meta.url)));
const pets=pack.assets.filter(a=>a.category==='PET');
function glbClips(asset){
  const buffer=fs.readFileSync(new URL('../../../public'+asset.url,import.meta.url));
  const json=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString().trim());
  return json.animations.map(a=>a.name);
}
test('temperament metadata only references real audited pets',()=>{
  for(const name of Object.keys(COMPANION_METADATA))assert.ok(pets.some(p=>p.id.endsWith('animal-'+name)),name);
});
for(const name of ['elephant','cat','dog','bee','panda'])test(name+' uses real clips, follows, runs and settles without vibration',()=>{
  const asset=pets.find(p=>p.id.endsWith('animal-'+name)),clips=glbClips(asset);
  const state=createCompanion(companionProfile(asset.id)),player={x:0,z:0};let position={x:1,z:8};
  let ran=false;
  for(let i=0;i<300;i++){
    position=companionStep(state,position,player,0,1/60,null);
    ran ||= state.state==='RUN';assert.ok(clips.includes(companionClip(state,clips)));
  }
  assert.ok(ran);assert.equal(state.moving,false);
  const settled={...position};
  for(let i=0;i<100;i++)position=companionStep(state,position,player,0,1/60,null);
  assert.equal(position.x,settled.x);assert.equal(position.z,settled.z);
  reactCompanion(state,'NOTE_COLLECTED');companionStep(state,position,player,0,.1,null);
  assert.equal(state.state,'CELEBRATE');assert.ok(clips.includes(companionClip(state,clips)));
  reactCompanion(state,'SECRET_DISCOVERED');assert.equal(companionClip(state,clips),'dance');
});
test('curiosity never reveals secret or hidden notes and is interrupted by movement',()=>{
  const state=createCompanion('CURIOUS'),player={x:0,z:0};let position={x:.85,z:-1.6};
  const candidates=[{x:1,z:0,secret:true},{x:1,z:1,visible:false},{x:9,z:0},{x:2,z:1,kind:'NOTE'}];
  for(let i=0;i<110;i++)position=companionStep(state,position,player,0,.1,null,candidates);
  assert.equal(state.interest.kind,'NOTE');assert.equal(state.interest.x,2);
  companionStep(state,position,{x:.5,z:0},0,.1,null,candidates);assert.equal(state.interest,null);
});
test('extreme distance and blocked recovery use a separated destination on existing collisions',()=>{
  const world=new CollisionWorld([{id:'tree',type:'solid',shape:'circle',x:1.1,z:-1.6,radius:.7}]);
  const state=createCompanion(),player={x:0,z:0};
  const next=companionStep(state,{x:30,z:30},player,0,.1,world);
  assert.equal(next.teleported,true);assert.equal(world.overlaps(next,.2),false);assert.equal(state.recoveries,1);
  const blocked=createCompanion();blocked.stuck=3;
  assert.equal(companionStep(blocked,{x:0,z:8},player,0,.1,world).teleported,true);
});
test('chest attention stays tethered, celebration expires, unavailable clips fall back safely',()=>{
  const state=createCompanion();reactCompanion(state,'CHEST_INSPECTED',{x:2,z:0});
  companionStep(state,{x:1,z:-1}, {x:0,z:0},0,.1,null);assert.equal(state.state,'CURIOUS');
  reactCompanion(state,'LESSON_COMPLETED');
  companionStep(state,{x:1,z:-1},{x:0,z:0},0,.1,null);assert.equal(state.state,'CELEBRATE');
  assert.equal(companionClip(state,['idle']),'idle');
  for(let i=0;i<30;i++)companionStep(state,{x:1,z:-1},{x:0,z:0},0,.1,null);
  assert.equal(state.reaction,null);
});
test('recovery never teleports into a solid even if movement returns a blocked starting point',()=>{
  const state=createCompanion(),player={x:0,z:0};
  const blocked={move:p=>p,overlaps:()=>true};
  const next=companionStep(state,{x:30,z:30},player,0,.1,blocked);
  assert.notEqual(next.teleported,true);assert.equal(state.recoveries,0);
});
