import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createGameplayContent,upgradeGameplayContent} from './gameplayContent.js';
import {createGameplayState,claimReward,equipPet,completeMinigame,gameplayPersistence,createAttack,attackHits,hitTarget,followerStep} from './gameplayState.js';
import {createMiniSession,miniAnswer,rhythmResult} from './minigameEngine.js';
import {ASSET_CATALOG} from '../assets/assetCatalog.js';
import {worldActivityReducer,createWorldActivityState} from '../state/worldActivityFlow.js';
import {CollisionWorld} from '../world/collision/CollisionWorld.js';

const content=createGameplayContent();
test('all placed assets and pet rewards are real, authored and bounded; Plaza is safe',()=>{
  assert.equal(content.pets.length,24);assert.equal(content.rewards.length,8);
  for(const record of [...content.pets,...content.worldActions]){const asset=ASSET_CATALOG.assets.find(a=>a.id===record.assetId);assert.ok(asset);assert.ok(fs.existsSync('public'+asset.url));}
  assert.equal(content.worldActions.filter(t=>t.regionId==='PLAZA_DE_LAS_NOTAS' && t.type==='WORLD_CREATURE').length,0);
  assert.equal(new Set(content.worldActions.filter(t=>t.type==='WORLD_CREATURE').map(t=>t.assetId)).size,4);
  for(const target of content.worldActions)assert.ok(target.hitsRequired>=1 && target.hitsRequired<=3);
});
test('active window hits forward volume only once, respects elevation and excludes defensive clips',()=>{
  const player={x:0,y:0,z:0},targets=[{id:'front',position:{x:0,y:0,z:1}},{id:'back',position:{x:0,y:0,z:-1}},{id:'side',position:{x:4,y:0,z:1}},{id:'high',position:{x:0,y:5,z:1}}];
  const attack=createAttack('1H_Melee_Attack_Chop',1);
  assert.deepEqual(attackHits(attack,.1,player,0,targets),[]);
  assert.deepEqual(attackHits(attack,.2,player,0,targets),['front']);
  assert.deepEqual(attackHits(attack,.1,player,0,targets),[]);
  for(const clip of ['Block','Dodge_Backward','1H_Ranged_Reload'])assert.deepEqual(attackHits(createAttack(clip,1),.4,player,0,targets),[]);
  assert.deepEqual(attackHits(createAttack('Spellcast_Shoot',1),.4,player,Math.PI,targets),['back']);
});
for(const type of ['DESTRUCTIBLE','WORLD_CREATURE'])test(`${type}: 1-3 impacts defeat exactly once`,()=>{
  for(const hitsRequired of [1,2,3]){let target={type,hitsRequired,hits:0,defeated:false};for(let i=0;i<hitsRequired;i++){target=hitTarget(target);assert.equal(target.defeated,i===hitsRequired-1);}assert.equal(hitTarget(target),target);}
});
test('pet reward adds identical catalog pet, rejects duplicates and locked equips; profile persistence is isolated',()=>{
  const state=createGameplayState(),claim=claimReward(state,'pet-elephant');assert.equal(claim.pet.id,'kenney-cube-pets:animal-elephant');
  assert.equal(claimReward(claim.state,'pet-elephant').state,claim.state);assert.equal(claimReward(claim.state,'pet-elephant').pet,null);
  assert.equal(equipPet(state,claim.pet.id),state);const equipped=equipPet(claim.state,claim.pet.id);assert.equal(equipPet(equipped,null).equippedPetId,null);
  const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},p=gameplayPersistence(storage);assert.ok(p.save(1,equipped));assert.deepEqual(p.load(1),equipped);assert.deepEqual(p.load(2),state);
  assert.deepEqual(createGameplayState({unlockedPets:content.pets.map(p=>p.id)}).unlockedPets,[]);
});
test('follower moves, idles, repositions and never owns a solid collider',()=>{
  const player={x:0,z:0},world=new CollisionWorld();const idle=followerStep({x:.9,z:-1.8},player,0,.1,world);assert.equal(idle.moving,false);
  assert.equal(followerStep({x:0,z:-6},player,0,.1,world).moving,true);assert.equal(followerStep({x:50,z:50},player,0,.1,world).teleported,true);assert.equal(world.colliders.length,0);
});
test('changing character preserves world context, Adventure, XP input and gameplay state',()=>{
  const state=createWorldActivityState();state.game.player.position={x:12,y:1,z:-28};state.game.adventure.journey.started=true;
  const next=worldActivityReducer(state,{type:'PROFILE',profile:{avatarId:2,total_score:123}});
  assert.equal(next.game.adventure,state.game.adventure);assert.deepEqual(next.game.player.position,state.game.player.position);assert.equal(next.game.player.characterId,2);assert.equal(next.game.progression.xp,123);
});
test('three reusable mini engines fail and succeed; completion opens gates and claims pet once',()=>{
  for(const definition of content.minigames.filter(m=>m.type!=='RHYTHM')){
    const session=createMiniSession(definition,()=>0);assert.equal(miniAnswer(session,'Z4').status,'FAILED');let current=session;while(current.status!=='SUCCESS')current=miniAnswer(current,'C4');assert.equal(current.status,'SUCCESS');
  }
  const definition=content.minigames[0],session=createMiniSession(definition);session.startedAt=1000;session.taps=session.pattern.map(b=>1000+b*60000/definition.configuration.bpm);assert.ok(rhythmResult(session,definition.configuration));session.taps[2]+=1000;assert.equal(rhythmResult(session,definition.configuration),false);
  const state=createGameplayState();assert.equal(completeMinigame(state,definition.id,false).state,state);const won=completeMinigame(state,definition.id,true);assert.ok(won.state.completedMinigames.includes(content.gates[0].minigameId));assert.ok(won.pet);assert.equal(completeMinigame(won.state,definition.id,true).state,won.state);
});
test('legacy content adopts gameplay without mutating authoring and current content is not repopulated',()=>{
  const legacy={schemaVersion:1,activities:[{id:'forest-chest-01',rewardId:null}],rewards:[],worldActions:[],minigames:[],gates:[]};const copy=structuredClone(legacy),upgraded=upgradeGameplayContent(legacy);assert.deepEqual(legacy,copy);assert.equal(upgraded.activities[0].rewardId,'pet-elephant');assert.deepEqual(upgradeGameplayContent({...upgraded,worldActions:[]}).worldActions,[]);
});
test('recognition difficulty changes distractors without omitting the correct note',()=>{
  const definition=content.minigames.find(m=>m.type==='NOTE_RECOGNITION');
  for(const difficulty of ['easy','normal']){const session=createMiniSession({...definition,configuration:{...definition.configuration,difficulty}},()=>.4);for(let i=0;i<session.questions.length;i++){assert.ok(session.choices[i].includes(session.questions[i][0]));assert.equal(new Set(session.choices[i]).size,session.choices[i].length);assert.equal(session.choices[i].length,difficulty==='easy'?3:definition.configuration.notePool.length);}}
});
test('Valley result is opt-in, waits for real saved piano result and does not replace standalone result',()=>{
  const piano=fs.readFileSync('src/modules/piano-magico/PianoMagico.jsx','utf8');assert.ok(piano.includes('valleyResult = false'));assert.ok(piano.includes("view === 'success' && currentSong && !valleyResult"));assert.ok(piano.includes('await performanceSaveRef.current'));
  const result=fs.readFileSync('src/game/gameplay/ValleyActivityResult.jsx','utf8');assert.ok(result.includes('result.xp'));assert.ok(result.includes('petId={pet?.assetId}'));assert.ok(result.includes('rewardMode'));assert.ok(result.includes('EQUIPAR'));assert.ok(result.includes('disabled={!ready}'));
  const world=fs.readFileSync('src/game/world/World3DView.jsx','utf8');assert.ok(world.includes('onClick={()=>performWorldAction(\'Q\')}'));assert.ok(world.includes('onClick={()=>performWorldAction(\'E\')}'));
});
test('server validates active gameplay, negative cases and keeps ADMIN security',()=>{
  const result=JSON.parse(execFileSync(process.env.PHP_BINARY || 'C:/xampp/php/php.exe',['backend/content/schema-test.php'],{encoding:'utf8'}));assert.ok(result.passed>=32);
});
