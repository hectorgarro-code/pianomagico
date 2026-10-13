import test from 'node:test';
import assert from 'node:assert/strict';
import {claimLessonPetReward} from './lessonPetReward.js';
import {createGameplayState,equipPet,gameplayPersistence} from './gameplayState.js';
import {createGameplayContent} from './gameplayContent.js';
const content=createGameplayContent();
const fixture=()=>({result:{completed:true,errors:0,activityId:2,stationId:'forest-chest-01',performanceId:81},context:{stationId:'forest-chest-01',activityId:2},activity:{song:{id:2}},object:{id:'forest-chest-01',type:'LESSON_CHEST',contentRewardId:'pet-elephant'},userId:9,performances:[{id:81,user_id:9,song_id:2}]});
test('only matching saved educational results unlock a catalog pet, without extra XP or auto equip',()=>{
  const initial=createGameplayState(null,content),won=claimLessonPetReward(initial,fixture(),content);
  assert.ok(won.valid);assert.equal(won.pet.assetId,'kenney-cube-pets:animal-elephant');assert.equal(won.state.equippedPetId,null);
  assert.equal(won.state.unlockedPets.length,1);assert.equal(won.state.xp,undefined);
  const repeat=claimLessonPetReward(won.state,fixture(),content);assert.equal(repeat.state,won.state);assert.equal(repeat.pet,null);
});
test('cancel, failed, missing save, wrong profile/song/station and non-lesson sources never grant pets',()=>{
  const initial=createGameplayState(null,content);
  for(const change of [f=>{f.result.cancelled=true;},f=>{f.result.completed=false;},f=>{f.result.errors=3;},f=>{f.result.performanceId=null;},f=>{f.performances=[];},f=>{f.performances[0].user_id=10;},f=>{f.performances[0].song_id=7;},f=>{f.result.stationId='wrong';},f=>{f.result.activityId=99;},f=>{f.object.type='SECRET_REWARD';}]){
    const input=fixture();change(input);const result=claimLessonPetReward(initial,input,content);assert.equal(result.state,initial);assert.equal(result.pet,null);assert.equal(result.valid,false);
  }
});
test('equip and continue persist distinct collection states per profile and never equip locked pets',()=>{
  const won=claimLessonPetReward(createGameplayState(null,content),fixture(),content);
  assert.equal(equipPet(won.state,'kenney-cube-pets:animal-bee'),won.state);
  const equipped=equipPet(won.state,won.pet.id),values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const persistence=gameplayPersistence(storage);persistence.save(9,equipped);assert.equal(persistence.load(9).equippedPetId,won.pet.id);assert.equal(persistence.load(10).unlockedPets.length,0);
  const second=fixture();second.object.contentRewardId='pet-cat';const continued=claimLessonPetReward(equipped,second,content);
  assert.equal(continued.state.equippedPetId,won.pet.id);assert.equal(continued.state.unlockedPets.length,2);
  persistence.save(9,continued.state);assert.equal(persistence.load(9).unlockedPets.length,2);
});
