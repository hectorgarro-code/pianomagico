export const RESIDENT_STATES=['IDLE','WALK','LOOK_AT_PLAYER','WAVE','CHEER','POINT','REACT'];
export const RESIDENT_CLIPS={IDLE:['Unarmed_Idle','Idle'],WALK:['Walking_A'],LOOK_AT_PLAYER:['Unarmed_Idle','Idle'],WAVE:['Interact','Cheer'],CHEER:['Cheer','Interact'],POINT:['Interact'],REACT:['Interact','Idle']};
export function createResidentBehavior(){return {clock:0,wasNear:false,wasComplete:false,wasHappy:false,wasHit:false,gesture:null,until:0};}
export const RESIDENT_BEHAVIOR_DEFAULTS={nearRadius:6,walkSpeed:.7,greeting:'WAVE',restored:'LOOK_AT_PLAYER'};
export function stepResident(memory,{distance,goalComplete=false,regionComplete=false,nearbyComplete=false,playerHit=false,hasGoal=false,walking=false,behavior={}},delta){
  const config={...RESIDENT_BEHAVIOR_DEFAULTS,...behavior};
  memory.clock+=delta;const near=distance<config.nearRadius,entered=near&&!memory.wasNear;
  const newWin=goalComplete&&!memory.wasComplete||regionComplete&&!memory.wasHappy||nearbyComplete;
  const regionalWin=regionComplete&&!memory.wasHappy&&distance<35;
  if(regionalWin||near&&(newWin||entered&&(goalComplete||regionComplete))){memory.gesture='CHEER';memory.until=memory.clock+(regionalWin?3.6:3);}
  else if(near&&playerHit&&!memory.wasHit){memory.gesture='REACT';memory.until=memory.clock+1.2;}
  else if(entered){memory.gesture=config.greeting;memory.until=memory.clock+1.8;}
  memory.wasNear=near;memory.wasComplete=goalComplete;memory.wasHappy=regionComplete;memory.wasHit=playerHit;
  const celebrating=memory.gesture==='CHEER'&&distance<(regionComplete?35:12)&&memory.clock<memory.until;
  const state=celebrating?'CHEER':near&&memory.clock<memory.until?memory.gesture:near?hasGoal&&!goalComplete?'POINT':regionComplete?config.restored:'LOOK_AT_PLAYER':walking?'WALK':'IDLE';
  return {state,near,bubble:!near?null:state==='CHEER'?'\u2605':state==='WAVE'?'\u{1f44b}':state==='POINT'?'\u266a \u2192':state==='REACT'?'!':'\u266a ?'};
}
