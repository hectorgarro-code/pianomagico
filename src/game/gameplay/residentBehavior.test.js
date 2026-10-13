import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORLD_RESIDENTS,FRIENDLY_NOTE} from '../world/composition/friendlyComposition.js';
import {createResidentBehavior,stepResident,RESIDENT_CLIPS} from './residentBehavior.js';
import {applyToyEvent} from '../adventure/toyState.js';
import {createAdventureState} from '../adventure/adventureState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {getCharacterModel} from '../../modules/core/utils/characterModels.js';

test('regional restoration reaches nearby observers without extending text or normal interaction distance',()=>{
  const memory=createResidentBehavior();stepResident(memory,{distance:9},.1);
  const restored=stepResident(memory,{distance:9,regionComplete:true},.1);
  assert.equal(restored.state,'CHEER');assert.equal(restored.near,false);assert.equal(restored.bubble,null);
  assert.equal(stepResident(memory,{distance:9,regionComplete:true},4).state,'IDLE');
  assert.equal(stepResident(createResidentBehavior(),{distance:30,regionComplete:true},.1).state,'CHEER');
  assert.equal(stepResident(createResidentBehavior(),{distance:45,regionComplete:true},.1).state,'IDLE');
});
test('friendly intentions greet, point, celebrate and settle without combat or quest state',()=>{
  const memory=createResidentBehavior(),context={distance:4,hasGoal:true};
  assert.equal(stepResident(memory,context,.1).state,'WAVE');
  assert.equal(stepResident(memory,context,2).state,'POINT');
  assert.equal(stepResident(memory,{...context,goalComplete:true},.1).state,'CHEER');
  assert.equal(stepResident(memory,{...context,goalComplete:true},4).state,'LOOK_AT_PLAYER');
  assert.equal(stepResident(memory,{distance:20,walking:true},.1).state,'WALK');
  assert.equal(stepResident(memory,{distance:3,regionComplete:true},.1).state,'CHEER');
});
test('nearby result celebrates; player knockback elicits concern, never a hostile attack',()=>{
  const memory=createResidentBehavior();stepResident(memory,{distance:3},.1);
  assert.equal(stepResident(memory,{distance:3,nearbyComplete:true},.1).state,'CHEER');
  assert.equal(stepResident(memory,{distance:3,playerHit:true},.1).state,'REACT');
  assert.equal(stepResident(memory,{distance:3,playerHit:true},2).state,'LOOK_AT_PLAYER');
});
test('seven authored residents use existing models/clips, no invented Wave or Point animations',()=>{
  assert.equal(WORLD_RESIDENTS.length,7);assert.equal(WORLD_RESIDENTS.filter(r=>r.regionId==='PLAZA_DE_LAS_NOTAS').length,2);
  for(const resident of WORLD_RESIDENTS){
    const buffer=fs.readFileSync('public'+getCharacterModel(resident.characterId).file),data=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)));
    const names=data.animations.map(a=>a.name);for(const candidates of Object.values(RESIDENT_CLIPS))assert.ok(candidates.some(name=>names.includes(name)));
    assert.equal(resident.hitsRequired,undefined);assert.equal(resident.optionalReward,undefined);
    if(resident.regionId==='PLAZA_DE_LAS_NOTAS')assert.ok(Math.hypot(resident.position[0],resident.position[2])>9+resident.radius);
  }
});
test('microevent rewards an existing Lost Note contract and survives profile reload without XP',()=>{
  const original=createAdventureState(),won=applyToyEvent(original,{type:'LOST_NOTE_COLLECTED',id:FRIENDLY_NOTE.id});
  assert.equal(won.entries,original.entries);assert.equal(won.valley,original.valley);assert.equal(won.xp,undefined);
  assert.equal(applyToyEvent(won,{type:'LOST_NOTE_COLLECTED',id:FRIENDLY_NOTE.id}),won);
  const values=new Map(),persistence=createAdventurePersistence(()=>({getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}));
  persistence.save(1,won);assert.ok(persistence.load(1).toy.collectedNotes.includes(FRIENDLY_NOTE.id));assert.equal(persistence.load(2).toy.collectedNotes.length,0);
});
