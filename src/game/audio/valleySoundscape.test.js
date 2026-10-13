import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createValleySoundscape,regionalAudioState} from './valleySoundscape.js';
import {createAdventureState,beginAdventureActivity,settleAdventureActivity,findAdventureObject} from '../adventure/adventureState.js';
import {applyValleyEvent} from '../adventure/valleyProgression.js';
import {createToyNoteSound} from './toyNoteSound.js';

function fixture(){
  const nodes=[],tasks=new Map();let id=0,created=0;
  const parameter=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},cancelScheduledValues(){}});
  const node=()=>{const n={gain:parameter(),frequency:parameter(),pan:parameter(),connect(){},disconnect(){this.disconnected=true;},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;};
  const context={state:'running',sampleRate:100,currentTime:10,destination:{},createGain:node,createBiquadFilter:node,createBufferSource:node,createOscillator:node,createStereoPanner:node,createBuffer:(c,length)=>({getChannelData:()=>new Float32Array(length)}),resume(){this.state='running';return Promise.resolve();},suspend(){this.state='suspended';return Promise.resolve();},close(){this.closed=true;return Promise.resolve();}};
  const createContext=()=>{created++;return context;};
  const sound=createValleySoundscape({createContext,schedule:callback=>{tasks.set(++id,callback);return id;},cancel:id=>tasks.delete(id)});
  return {sound,context,nodes,tasks,createContext,get created(){return created;},advance(){const pending=[...tasks.values()];tasks.clear();pending.forEach(fn=>fn());}};
}

test('region audio derives validated activities, cancellation cannot enrich it and reload keeps the stage',()=>{
  let state=applyValleyEvent(createAdventureState(),{type:'REGION_DISCOVERED',regionId:'BOSQUE_DE_LAS_NOTAS'});
  assert.equal(regionalAudioState(state).stage,0);
  let object=findAdventureObject('forest-chest-01');
  state=settleAdventureActivity(beginAdventureActivity(state,object.id,object.activityId),object.id,{activityId:object.activityId,completed:false,cancelled:true});
  assert.equal(regionalAudioState(state).stage,0);
  for(let i=1;i<=3;i++){object=findAdventureObject('forest-chest-0'+i);state=settleAdventureActivity(beginAdventureActivity(state,object.id,object.activityId),object.id,{activityId:object.activityId,completed:true});assert.equal(regionalAudioState(state).stage,i);}
  assert.deepEqual(regionalAudioState(JSON.parse(JSON.stringify(state))),{region:'BOSQUE_DE_LAS_NOTAS',stage:3});
});
test('ambient bus is lazy, volume controlled, bounded and independent of musical evaluation',()=>{
  const f=fixture(),preferences={volume:.2,muted:false};
  f.sound.unlock();assert.equal(f.created,0);
  f.sound.update({region:'RIO_DEL_RITMO',stage:0},preferences,true);f.sound.unlock();
  assert.equal(f.created,1);f.advance();assert.equal(f.nodes.filter(n=>n.type==='sine').length,0);
  f.sound.update({region:'RIO_DEL_RITMO',stage:3},preferences,true);f.advance();
  assert.equal(f.nodes.filter(n=>n.type==='sine').length,3);assert.equal(f.nodes[0].gain.value,.2);
  f.sound.update({region:'MONTANA_DE_LAS_MELODIAS',stage:1},{...preferences,volume:.5},true);
  assert.equal(f.nodes[0].gain.value,.5);assert.equal(f.tasks.size,1);f.sound.dispose();
  assert.equal(f.context.closed,true);assert.equal(f.tasks.size,0);assert.ok(f.nodes.every(n=>n.disconnected));
});
test('mic/piano/hidden hard pause clears pending cues, suspends only owned context, gestures cannot restart',()=>{
  const f=fixture(),state={region:'BOSQUE_DE_LAS_NOTAS',stage:3},preferences={volume:.2,muted:false};
  f.sound.update(state,preferences,true);f.sound.unlock();f.advance();
  f.sound.update(state,preferences,false,true);f.sound.unlock();f.advance();
  assert.equal(f.context.state,'suspended');assert.equal(f.nodes[0].gain.value,0);assert.equal(f.tasks.size,0);assert.equal(f.created,1);
  f.sound.update(state,preferences,true);assert.equal(f.context.state,'running');assert.equal(f.tasks.size,1);
  f.sound.update(state,{...preferences,muted:true},true);assert.equal(f.nodes[0].gain.value,0);assert.equal(f.tasks.size,0);f.sound.dispose();f.sound.unlock();assert.equal(f.created,1);
});
test('world notes have bounded stereo/distance, cues cooldown, stop disposes scheduled voices',()=>{
  const f=fixture(),notes=createToyNoteSound({createContext:f.createContext});notes.unlock();
  const options={position:{x:4,z:0},player:{x:0,z:0},volume:.2};
  assert.equal(notes.play('C4',{...options,position:{x:30,z:0}}),false);
  assert.equal(notes.play('C4',options),true);assert.equal(f.nodes.find(n=>n.pan.value).pan.value,.5);
  assert.equal(notes.cue('secret',{volume:.2}),true);assert.equal(notes.cue('secret',{volume:.2}),false);
  notes.stop();assert.ok(f.nodes.every(n=>n.disconnected));
  assert.equal(notes.cue('reward',{silent:true}),false);notes.dispose();assert.equal(f.context.closed,true);
});
test('world audio integration observes mic without starting/stopping it or loading educational soundfonts',()=>{
  for(const path of ['src/game/audio/WorldMusic.jsx','src/game/audio/valleySoundscape.js','src/game/world/World3DView.jsx','src/game/gameplay/ValleyActivityResult.jsx']){
    const source=fs.readFileSync(path,'utf8');assert.doesNotMatch(source,/getUserMedia|\.startMic\(|\.stopMic\(|soundfont/i);
  }
  const world=fs.readFileSync('src/game/world/World3DView.jsx','utf8');assert.match(world,/usePianoMicStore.subscribe/);assert.match(world,/valley-audio-preferences/);
});
