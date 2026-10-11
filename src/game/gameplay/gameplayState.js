import { getGameplayContent } from './gameplayContent.js';

export function createGameplayState(saved, content = getGameplayContent()) {
  const pets = new Set(content.pets.filter(p => p.enabled).map(p => p.id));
  const rewards = new Set(content.rewards.map(r => r.id));
  const claimedRewards = [...new Set(saved?.claimedRewards || [])].filter(id => rewards.has(id));
  const unlockedPets = [...new Set(claimedRewards.map(id => content.rewards.find(r => r.id === id)).filter(r => r?.type === 'PET').map(r => r.referenceId))].filter(id => pets.has(id));
  const minigames = new Set(content.minigames.filter(m => m.enabled).map(m => m.id));
  return { schemaVersion:1, claimedRewards, unlockedPets, equippedPetId:unlockedPets.includes(saved?.equippedPetId) ? saved.equippedPetId : null,
    completedMinigames:[...new Set(saved?.completedMinigames || [])].filter(id => minigames.has(id)) };
}
export function claimReward(state, rewardId, content = getGameplayContent()) {
  const reward = content.rewards.find(r => r.id === rewardId && r.enabled);
  if (!reward || state.claimedRewards.includes(rewardId)) return { state, pet:null };
  const pet = reward.type === 'PET' && content.pets.find(p => p.id === reward.referenceId && p.enabled);
  if (reward.type === 'PET' && !pet) return { state, pet:null };
  return { state:{...state,claimedRewards:[...state.claimedRewards,rewardId],unlockedPets:pet ? [...new Set([...state.unlockedPets,pet.id])] : state.unlockedPets},
    pet:pet && !state.unlockedPets.includes(pet.id) ? pet : null };
}
export const equipPet = (state, id) => id === null || state.unlockedPets.includes(id) ? {...state,equippedPetId:id} : state;
export function completeMinigame(state, id, success, content = getGameplayContent()) {
  const mini = content.minigames.find(m => m.id === id && m.enabled);
  if (!success || !mini || state.completedMinigames.includes(id)) return {state,pet:null};
  return claimReward({...state,completedMinigames:[...state.completedMinigames,id]},mini.rewardId,content);
}
export function gameplayPersistence(storage = globalThis.localStorage) {
  const key = id => `valle-gameplay-v1-user-${id}`;
  return { load(id) { try {return createGameplayState(JSON.parse(storage?.getItem(key(id)) || 'null'));} catch {return createGameplayState();} },
    save(id,state) {try {if(!id || !storage) return false; storage.setItem(key(id),JSON.stringify(state));return true;} catch {return false;}} };
}

export function actionProfile(clip, duration = 1) {
  const damaging = /Attack|Spellcast|Shoot|Throw/.test(clip || '');
  return { damaging, duration, start:duration*.22, end:duration*.65, range:/Spellcast|Shoot|Throw/.test(clip || '') ? 3.8 : 2.4, radius:.9 };
}
export function createAttack(clip,duration) {return {...actionProfile(clip,duration),elapsed:0,hitIds:new Set()};}
export function attackHits(attack, delta, player, rotation, targets) {
  const before = attack.elapsed; attack.elapsed += delta;
  if (!attack.damaging || attack.elapsed < attack.start || before > attack.end) return [];
  const fx=Math.sin(rotation),fz=Math.cos(rotation),hits=[];
  for(const target of targets) {
    if(target.defeated || attack.hitIds.has(target.id) || Math.abs((target.position.y || 0)-player.y)>2) continue;
    const dx=target.position.x-player.x,dz=target.position.z-player.z,forward=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx),radius=target.radius || .6;
    if(forward>=0 && forward<=attack.range+radius && side<=attack.radius+radius) {attack.hitIds.add(target.id);hits.push(target.id);}
  }
  return hits;
}
export function hitTarget(target) {if(target.defeated) return target; const hits=(target.hits || 0)+1;return {...target,hits,defeated:hits>=target.hitsRequired,state:hits>=target.hitsRequired?'DEFEATED':'HIT_REACTION'};}
export function followerStep(position, player, rotation, delta, collisionWorld) {
  const desired={x:player.x-Math.sin(rotation)*1.8+Math.cos(rotation)*.9,z:player.z-Math.cos(rotation)*1.8-Math.sin(rotation)*.9};
  const distance=Math.hypot(position.x-desired.x,position.z-desired.z);
  if(distance>12) return {...desired,teleported:true,moving:false};
  if(distance<.25) return {...position,moving:false};
  const step=Math.min(distance,delta*(distance>4?9:5));
  const displacement={x:(desired.x-position.x)*step/distance,z:(desired.z-position.z)*step/distance};
  const next=collisionWorld ? collisionWorld.move(position,displacement,.2) : {x:position.x+displacement.x,z:position.z+displacement.z};
  return {...next,moving:Math.hypot(next.x-position.x,next.z-position.z)>.001};
}
