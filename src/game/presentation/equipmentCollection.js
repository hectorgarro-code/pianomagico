import {EQUIPMENT} from './characterEquipment.js';
import {normalizeToyState} from '../adventure/toyState.js';

export const EQUIPMENT_UNLOCKS={
  greatsword:{secret:'mountain-stone-chord'},
  'dual-swords':{mechanism:'forest-three-runes'},
  'wand-book':{mechanism:'ruins-side-runes'},
  'great-axe':{secret:'mountain-banner-trail'},
  'axe-shield':{secret:'river-resonant-barrel'},
  'heavy-crossbow':{secret:'river-bridge-pocket'},
  daggers:{secret:'forest-note-nook'},
};
const ids=Object.values(EQUIPMENT).flat().map(e=>e.id);
const initial=Object.values(EQUIPMENT).flatMap(list=>list.filter((_,i)=>i===0).map(e=>e.id));
// Ranger keeps both previously supported accessories; no new retargeting.
initial.push('ranger-crossbow');
const key=userId=>`valle-arsenal-v1-user-${userId}`;
export function loadEquipmentCollection(userId,storage=globalThis.localStorage){
  let saved=[],legacy=[];
  try{
    const payload=JSON.parse(storage?.getItem(key(userId))||'null');
    saved=Array.isArray(payload?.unlocked)?payload.unlocked:[];
    if(!payload)legacy=Object.entries(EQUIPMENT).flatMap(([character,list])=>{
      const selected=storage?.getItem(`valley_equipment_${userId}_${character}`);
      return list.some(e=>e.id===selected)?[selected]:[];
    });
  }catch{/* Storage failure must not lock starter equipment. */}
  return [...new Set([...initial,...saved,...legacy])].filter(id=>ids.includes(id));
}
export function unlockEquipment(collection,adventure){
  const toy=normalizeToyState(adventure?.toy);
  return [...new Set([...collection,...Object.entries(EQUIPMENT_UNLOCKS).filter(([,rule])=>
    rule.secret?toy.discoveredSecrets.includes(rule.secret):toy.completedMechanisms.includes(rule.mechanism)
  ).map(([id])=>id)])].filter(id=>ids.includes(id));
}
export function saveEquipmentCollection(userId,collection,storage=globalThis.localStorage){
  try{if(!userId||!storage)return false;storage.setItem(key(userId),JSON.stringify({version:1,unlocked:collection.filter(id=>ids.includes(id))}));return true;}
  catch{return false;}
}
export function canEquip(character,choice,collection){
  return Boolean(EQUIPMENT[character]?.some(e=>e.id===choice)&&collection.includes(choice));
}
