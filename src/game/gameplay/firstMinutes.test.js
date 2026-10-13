import test from 'node:test';
import assert from 'node:assert/strict';
import {FIRST_MINUTES as F,firstMinutesPhase,firstTargetActive,mayRestoreFirstMinutes} from './firstMinutes.js';
import {FIRST_MINUTES_TARGETS} from '../world/composition/firstMinutesComposition.js';
import {createWorldActivityState,worldActivityReducer} from '../state/worldActivityFlow.js';
import {createAdventureState} from '../adventure/adventureState.js';
import {applyToyEvent} from '../adventure/toyState.js';
import {createAdventurePersistence} from '../services/adventurePersistence.js';
import {creatureStep} from './creatureEncounter.js';
import {claimLessonPetReward} from './lessonPetReward.js';
import {createGameplayState,equipPet} from './gameplayState.js';

test('only genuinely fresh Adventure starts the authored introduction; Continue preserves older facts',()=>{
  const fresh=worldActivityReducer(createWorldActivityState(),{type:'START_ADVENTURE'});
  assert.equal(firstMinutesPhase(fresh.game.adventure),'MOVE');
  const previous=createAdventureState();previous.journey.started=true;
  const existing=worldActivityReducer(createWorldActivityState(previous),{type:'START_ADVENTURE'});
  assert.equal(firstMinutesPhase(existing.game.adventure),null);
  for(const target of FIRST_MINUTES_TARGETS)assert.equal(firstTargetActive(target,existing.game.adventure),false);
});
test('each action teaches only its next control, drops require defeat and facts survive reload',()=>{
  let flow=worldActivityReducer(createWorldActivityState(),{type:'START_ADVENTURE'});
  flow=worldActivityReducer(flow,{type:'OBJECTIVE',position:{x:0,z:4},distance:1});let state=flow.game.adventure;
  assert.equal(firstMinutesPhase(state),'NOTE');
  assert.equal(applyToyEvent(state,{type:'LOST_NOTE_COLLECTED',id:F.drop}),state);
  for(const [type,id,phase] of [['LOST_NOTE_COLLECTED',F.note,'BREAK'],['TOY_TARGET_DEFEATED',F.box,'DROP'],['LOST_NOTE_COLLECTED',F.drop,'DEFEND'],['TOY_TARGET_DEFEATED',F.enemy,'CHEST']]){
    state=applyToyEvent(state,{type,id});assert.equal(firstMinutesPhase(state),phase);
  }
  const values=new Map(),persistence=createAdventurePersistence(()=>({getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}));persistence.save('QA',state);
  assert.equal(firstMinutesPhase(persistence.load('QA')),'CHEST');assert.equal(firstMinutesPhase(persistence.load('another')),null);
});
test('cancelled, unverified and wrong educational activity cannot restore introduction',()=>{
  const result={completed:true,errors:0,performanceId:12,activityId:1},context={stationId:F.station,activityId:1},object={id:F.station};
  assert.equal(mayRestoreFirstMinutes(result,context,object),true);
  for(const override of [{cancelled:true},{completed:false},{performanceId:0},{activityId:2},{errors:3}])assert.equal(mayRestoreFirstMinutes({...result,...override},context,object),false);
  const flow=worldActivityReducer(createWorldActivityState(),{type:'START_ADVENTURE'});
  assert.equal(worldActivityReducer(flow,{type:'VALIDATED_PLAZA_RESULT',performanceId:12}),flow);
});
test('training creature uses real two-hit model with slow readable attack, existing enemies unchanged',()=>{
  const make=training=>({position:{x:0,y:0,z:0},home:{x:0,y:0,z:0},hits:1,training,behaviorType:'wander',phase:0,reaction:0,strike:null});
  const trainee=make(true),normal=make(false),player={x:0,y:0,z:1};creatureStep(trainee,player,.1);creatureStep(normal,player,.1);
  assert.equal(creatureStep(trainee,player,.6).hit,false);assert.equal(creatureStep(normal,player,.6).hit,true);
  assert.equal(creatureStep(trainee,player,.9).hit,true);assert.equal(FIRST_MINUTES_TARGETS[1].hitsRequired,2);
  const patient=make(true);patient.hits=0;assert.equal(creatureStep(patient,player,.1).state,'IDLE');assert.equal(patient.strike,null);
});

test('real validated Plaza result unlocks one real pet; cancelled/repeated results never duplicate reward',()=>{
  let flow=worldActivityReducer(createWorldActivityState(),{type:'START_ADVENTURE'});
  const context={stationId:F.station,activityId:1,position:{x:7,y:0,z:1},rotation:0};
  flow=worldActivityReducer(flow,{type:'REQUEST_PIANO',song:{id:1},context});
  flow=worldActivityReducer(flow,{type:'TRANSITION_COMPLETE',target:'PIANO'});
  const result={stationId:F.station,activityId:1,completed:true,errors:0,performanceId:14};
  flow=worldActivityReducer(flow,{type:'RETURN',result});
  const args={result,context,activity:{song:{id:1}},object:{id:F.station,type:'PRACTICE_STATION'},userId:99,performances:[{id:14,song_id:1,user_id:99}]};
  const initial=createGameplayState(),claimed=claimLessonPetReward(initial,args);
  assert.equal(claimed.valid,true);assert.equal(claimed.pet.id,'kenney-cube-pets:animal-elephant');
  assert.equal(claimLessonPetReward(initial,{...args,result:{...result,cancelled:true}}).state,initial);
  assert.equal(claimLessonPetReward(claimed.state,args).state,claimed.state);
  const equipped=equipPet(claimed.state,claimed.pet.id);assert.equal(createGameplayState(equipped).equippedPetId,claimed.pet.id);
  assert.equal(worldActivityReducer(flow,{type:'VALIDATED_PLAZA_RESULT',performanceId:15}),flow);
  flow=worldActivityReducer(flow,{type:'VALIDATED_PLAZA_RESULT',performanceId:14});assert.equal(firstMinutesPhase(flow.game.adventure),'DONE');
});
