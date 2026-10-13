import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {FOREST_MUSIC,WORLD_MUSIC_TYPES} from '../world/composition/musicalMechanismComposition.js';
import {createWorldSequence,advanceWorldSequence,answerWorldSequence} from './worldMusicSequence.js';
import {normalizeToyState,applyToyEvent} from '../adventure/toyState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {createAdventureState} from '../adventure/adventureState.js';
const listen=state=>{state=advanceWorldSequence(state,0,true);for(let i=0;i<70;i++)state=advanceWorldSequence(state,.05,true);return state;};
test('world sequence listens, rejects early input, retries softly and completes only correct notes',()=>{
  let state=createWorldSequence(FOREST_MUSIC);assert.equal(answerWorldSequence(state,'C4'),state);
  state=listen(state);assert.equal(state.phase,'ANSWER');state=answerWorldSequence(state,'G4');assert.equal(state.phase,'ERROR');
  state=advanceWorldSequence(state,1,true);state=listen(state);
  for(const pitch of FOREST_MUSIC.sequence)state=answerWorldSequence(state,pitch);
  assert.equal(state.phase,'OPEN');assert.equal(advanceWorldSequence(state,1,false).phase,'OPEN');
  assert.equal(answerWorldSequence(state,'G4'),state);
});
test('leaving resets an incomplete sequence and unsupported types never silently run memory',()=>{
  const state=answerWorldSequence(listen(createWorldSequence(FOREST_MUSIC)),'C4');
  assert.deepEqual(advanceWorldSequence(state,.1,false).session.answers,[]);
  assert.equal(WORLD_MUSIC_TYPES.length,5);assert.throws(()=>createWorldSequence({...FOREST_MUSIC,type:'RHYTHM'}));
});
test('completion persists per profile, gates notes, is idempotent and leaves educational state alone',()=>{
  let adventure=createAdventureState();const entries=adventure.entries,valley=adventure.valley;
  assert.equal(applyToyEvent(adventure,{type:'LOST_NOTE_COLLECTED',id:FOREST_MUSIC.rewards[0].id}),adventure);
  adventure=applyToyEvent(adventure,{type:'WORLD_MECHANISM_COMPLETED',id:FOREST_MUSIC.id});
  assert.equal(applyToyEvent(adventure,{type:'WORLD_MECHANISM_COMPLETED',id:FOREST_MUSIC.id}),adventure);
  assert.equal(adventure.entries,entries);assert.equal(adventure.valley,valley);
  const data=new Map(),persistence=createAdventurePersistence(()=>({getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)}));
  persistence.save(1,adventure);assert.deepEqual(persistence.load(1).toy.completedMechanisms,[FOREST_MUSIC.id]);
  assert.deepEqual(persistence.load(2).toy.completedMechanisms,[]);assert.equal(createWorldSequence(FOREST_MUSIC,true).phase,'OPEN');
  assert.deepEqual(normalizeToyState({collectedNotes:FOREST_MUSIC.rewards.map(n=>n.id)}).collectedNotes,[]);
});
test('authored mechanism has real assets and leaves main path and existing gameplay intact',()=>{
  assert.ok(existsSync('public'+FOREST_MUSIC.gateAsset));assert.ok(existsSync('public'+FOREST_MUSIC.stoneAsset));
  assert.equal(FOREST_MUSIC.rewards.length,3);assert.ok(FOREST_MUSIC.position[0]<-4);
});
