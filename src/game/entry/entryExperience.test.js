import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { entryReducer, initialEntry, entrySummary, TITLE_SHOTS, titleCamera } from './entryExperience.js';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity } from '../adventure/adventureState.js';
import { getValleyProgress } from '../adventure/valleyProgression.js';
import { normalizeGameProfile } from '../services/profileAdapter.js';

test('fresh load and reload use TITLE, Enter opens profiles, profile opens Adventure and exit returns to profiles', () => {
  assert.deepEqual(initialEntry(), { screen:'TITLE', userId:null });
  const profiles = entryReducer(initialEntry(), {type:'ENTER'});
  assert.equal(profiles.screen, 'PROFILES');
  const adventure = entryReducer(profiles, {type:'PROFILE',userId:'2'});
  assert.deepEqual(adventure, {screen:'ADVENTURE',userId:2});
  assert.equal(entryReducer(adventure, {type:'EXIT'}).screen, 'PROFILES');
  assert.equal(entryReducer(profiles, {type:'BACK'}).screen, 'TITLE');
  assert.equal(entryReducer(profiles, {type:'PROFILE',userId:'invalid'}), profiles);
  assert.equal(entryReducer(profiles, {type:'SELECT_INSTRUMENT'}), profiles);
});
test('both new and existing profiles prepare their adventurer directly without modifying saved facts', () => {
  const fresh = createAdventureState(); assert.equal(entrySummary(fresh).existing, false);
  const started = {...fresh,journey:{...fresh.journey,started:true}};
  const snapshot = structuredClone(started); assert.equal(entrySummary(started).existing, true); assert.deepEqual(started, snapshot);
  const app = fs.readFileSync('src/game/GameApp.jsx','utf8');
  assert.match(app, /\[startPhase, setStartPhase\] = useState\('CHARACTER'\)/);
  assert.match(app, /createWorldActivityState\(progressService.loadAdventure\(id\)\)/);
  const preparation=fs.readFileSync('src/game/adventure/AdventureStart.jsx','utf8');
  assert.match(preparation,/await onCharacter\(c,e,p\);onBegin\(\)/);
  assert.match(preparation,/confirmLabel="JUGAR"/);assert.match(preparation,/onClose=\{onExit\}/);assert.match(preparation,/onNewAdventure=/);
  assert.doesNotMatch(preparation,/entry-resume-layout|entry-resume-info/);
});
test('profile summaries derive objective/current region and progress exclusively from validated Adventure', () => {
  let adventure=createAdventureState();
  adventure=settleAdventureActivity(beginAdventureActivity(adventure,'forest-chest-01',1),'forest-chest-01',{activityId:1,completed:true});
  const summary=entrySummary(adventure),progress=getValleyProgress(adventure);
  assert.equal(summary.objective,progress.currentObjective.text); assert.ok(summary.percent>=0 && summary.percent<=100);
  assert.equal(summary.percent,Math.round(summary.completed/summary.total*100));
  assert.equal(normalizeGameProfile({name:'Real',avatar_id:3},'2').avatarId,2);
});
test('authored title shots are low and public; mobile has its own position; reduced motion freezes attract mode', () => {
  assert.equal(TITLE_SHOTS.length,3);
  for(const shot of TITLE_SHOTS){assert.ok(shot.position[1]<5);assert.ok(shot.position[2]>-30);assert.ok(shot.target[2]>-30);assert.notDeepEqual(shot.mobile,shot.position);}
  assert.notDeepEqual(titleCamera(0).position,titleCamera(15).position);
  assert.notEqual(titleCamera(0).shot,titleCamera(40).shot);
  assert.deepEqual(titleCamera(0,false,true),titleCamera(80,false,true));
  assert.notDeepEqual(titleCamera(0,true).position,titleCamera(0,false).position);
});
test('entry owns one World3DView, shares cached previews, keeps piano/instrument selection disconnected', () => {
  const suite=fs.readFileSync('src/modules/core/MusicSuite.jsx','utf8'),shared=fs.readFileSync('src/game/entry/SharedWorld.jsx','utf8');
  assert.match(suite,/SharedWorldProvider/); assert.doesNotMatch(suite,/InstrumentSelection|UkeHero|MusicStudio/);
  assert.match(shared,/session props/); assert.match(shared,/World3DView/);
  const profiles=fs.readFileSync('src/game/entry/ProfilePortraits.jsx','utf8');assert.match(profiles,/setScissor/);assert.match(profiles,/loadCharacterPresentation/);assert.match(profiles,/user.petId/);assert.doesNotMatch(profiles,/WorldGenerator/);
  const music=fs.readFileSync('src/game/audio/WorldMusic.jsx','utf8');assert.match(music,/valley-entry-unlock/);assert.doesNotMatch(music,/getUserMedia|startMic|stopMic|AudioContext/);assert.match(music,/usePianoMicStore.subscribe/);
  const css=fs.readFileSync('src/game/entry/entryExperience.css','utf8');assert.match(css,/focus-visible/);assert.match(css,/@media\(max-width:700px\)/);
});
