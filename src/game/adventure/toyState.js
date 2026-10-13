import {TOY_NOTES,TOY_TARGETS} from '../world/composition/toyComposition.js';
import {EXPLORATION_MECHANISMS,EXPLORATION_SECRETS} from '../world/composition/explorationSecrets.js';

export function normalizeToyState(saved) {
  const defeatedTargets=[...new Set(Array.isArray(saved?.defeatedTargets)?saved.defeatedTargets:[])].filter(id=>TOY_TARGETS.some(t=>t.id===id));
  const completedMechanisms=[...new Set(Array.isArray(saved?.completedMechanisms)?saved.completedMechanisms:[])].filter(id=>EXPLORATION_MECHANISMS.some(m=>m.id===id));
  const collectedNotes=[...new Set(Array.isArray(saved?.collectedNotes)?saved.collectedNotes:[])].filter(id=>TOY_NOTES.some(n=>n.id===id&&(!n.sourceId||defeatedTargets.includes(n.sourceId))&&(!n.mechanismId||completedMechanisms.includes(n.mechanismId))));
  return {defeatedTargets,collectedNotes,completedMechanisms,discoveredSecrets:EXPLORATION_SECRETS.filter(s=>collectedNotes.some(id=>TOY_NOTES.find(n=>n.id===id)?.secretId===s.id)).map(s=>s.id)};
}
export function applyToyEvent(adventure,event) {
  const toy=adventure.toy||normalizeToyState();
  if(event.type==='WORLD_MECHANISM_COMPLETED'){
    if(!EXPLORATION_MECHANISMS.some(m=>m.id===event.id)||toy.completedMechanisms?.includes(event.id))return adventure;
    return {...adventure,toy:{...toy,completedMechanisms:[...(toy.completedMechanisms||[]),event.id]}};
  }
  if(event.type==='TOY_TARGET_DEFEATED'){
    if(!TOY_TARGETS.some(t=>t.id===event.id)||toy.defeatedTargets.includes(event.id))return adventure;
    return {...adventure,toy:{...toy,defeatedTargets:[...toy.defeatedTargets,event.id]}};
  }
  if(event.type!=='LOST_NOTE_COLLECTED')return adventure;
  const note=TOY_NOTES.find(n=>n.id===event.id);
  if(!note||toy.collectedNotes.includes(note.id)||(note.sourceId&&!toy.defeatedTargets.includes(note.sourceId))||(note.mechanismId&&!toy.completedMechanisms?.includes(note.mechanismId)))return adventure;
  return {...adventure,toy:{...toy,collectedNotes:[...toy.collectedNotes,note.id],discoveredSecrets:note.secretId?[...new Set([...toy.discoveredSecrets,note.secretId])]:toy.discoveredSecrets}};
}
