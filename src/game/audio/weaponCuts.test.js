import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWeaponCuts,WEAPON_CUT_FILES,MAGE_IMPACT_FILE} from './weaponCuts.js';

function fixture(){
  const voices=[];
  const cuts=createWeaponCuts({createAudio:url=>{
    const voice={url,paused:true,count:0,currentTime:0,play(){this.count++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){this.removed=true;},load(){}};
    voices.push(voice);return voice;
  }});
  return {cuts,voices};
}
for(const [weapon,file] of Object.entries(WEAPON_CUT_FILES))test(`${weapon} plays the exact supplied cut once at the attack window`,()=>{
  assert.ok(fs.existsSync('public/audio/Audio/'+file));
  const {cuts,voices}=fixture();assert.equal(cuts.begin(weapon,'Dualwield_Melee_Attack_Chop',1),true);
  cuts.update(.1);assert.equal(voices.reduce((n,v)=>n+v.count,0),0);
  cuts.update(.13);cuts.update(.5);
  assert.equal(voices.reduce((n,v)=>n+v.count,0),1);
  assert.equal(voices.find(v=>v.count).url,'/audio/Audio/'+file);cuts.dispose();
});
test('defense, spells, ranged actions and other weapons do not produce sword or axe sounds',()=>{
  const {cuts,voices}=fixture();
  for(const clip of ['Block','Spellcast_Raise','Throw','1H_Ranged_Shoot','Dualwield_Melee_Attack_Stab','Idle']){
    assert.equal(cuts.begin('sword',clip,1),false);cuts.update(2);
  }
  assert.equal(cuts.begin(null,'1H_Melee_Attack_Chop',1),false);
  assert.equal(voices.reduce((n,v)=>n+v.count,0),0);cuts.dispose();
});
test('pause, interruption, mute and teardown cancel pending or playing cuts without delayed audio',()=>{
  const {cuts,voices}=fixture();cuts.begin('axe','2H_Melee_Attack_Spin',1);cuts.update(.1);cuts.stop();cuts.update(1);
  assert.equal(voices.reduce((n,v)=>n+v.count,0),0);
  cuts.begin('sword','1H_Melee_Attack_Slice_Horizontal',1);cuts.update(.3,{silent:true});cuts.update(1);
  assert.equal(voices.reduce((n,v)=>n+v.count,0),0);
  cuts.begin('axe','2H_Melee_Attack_Chop',1);cuts.update(.3);cuts.update(.1,{silent:true});assert.ok(voices.every(v=>v.paused));
  cuts.begin('sword','1H_Melee_Attack_Chop',1);cuts.dispose();cuts.update(1);
  assert.ok(voices.every(v=>v.removed));assert.equal(voices.reduce((n,v)=>n+v.count,0),1);
});
test('playback rejection does not interrupt gameplay',async()=>{
  const cuts=createWeaponCuts({createAudio:()=>({paused:true,pause(){},removeAttribute(){},load(){},play(){return Promise.reject(Error('Blocked'));}})});
  cuts.begin('sword','2H_Melee_Attack_Chop',1);cuts.update(.3);await Promise.resolve();cuts.dispose();
});

test('mage impact uses the supplied punch sound only for a real hit, once per attack',()=>{
  assert.ok(fs.existsSync('public/audio/Audio/'+MAGE_IMPACT_FILE));
  const {cuts,voices}=fixture();
  for(const clip of ['Unarmed_Melee_Attack_Punch_A','2H_Melee_Attack_Chop','Spellcast_Raise']){
    assert.equal(cuts.begin('mage',clip,1),true);cuts.update(.3);
    const before=voices.reduce((n,v)=>n+v.count,0);
    assert.equal(cuts.impact(),true);assert.equal(cuts.impact(),false);
    assert.equal(voices.reduce((n,v)=>n+v.count,0),before+1);
  }
  assert.ok(voices.filter(v=>v.count).every(v=>v.url.endsWith(MAGE_IMPACT_FILE)&&v.volume===.18));
  cuts.begin('mage','Spellcast_Raise',1);const count=voices.reduce((n,v)=>n+v.count,0);
  cuts.update(1.1);assert.equal(cuts.impact(),false);assert.equal(voices.reduce((n,v)=>n+v.count,0),count);
  cuts.dispose();
});
test('mage impact is cancelled by silence, interruption and defense; other weapons are unaffected',()=>{
  const {cuts,voices}=fixture();
  cuts.begin('mage','Spellcast_Shoot',1);assert.equal(cuts.impact({silent:true}),false);assert.equal(cuts.impact(),false);
  cuts.begin('mage','Unarmed_Melee_Attack_Punch_A',1);cuts.stop();assert.equal(cuts.impact(),false);
  assert.equal(cuts.begin('mage','Block',1),false);assert.equal(cuts.impact(),false);
  cuts.begin('sword','1H_Melee_Attack_Chop',1);assert.equal(cuts.impact(),false);cuts.update(.3);
  assert.equal(voices.reduce((n,v)=>n+v.count,0),1);cuts.dispose();
});
