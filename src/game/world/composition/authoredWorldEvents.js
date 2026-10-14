import {TOY_NOTES,TOY_TARGETS} from './toyComposition.js';
import {EXPLORATION_SECRETS} from './explorationSecrets.js';

const originalNotes=structuredClone(TOY_NOTES.filter(n=>!n.id.startsWith('editor-event-'))),originalTargets=structuredClone(TOY_TARGETS.filter(t=>!t.id.startsWith('editor-'))),originalSecrets=structuredClone(EXPLORATION_SECRETS.filter(s=>!s.id.startsWith('editor-event-')));
export const WORLD_EVENT_TRIGGERS=['NEAR_PLAYER','TARGET_DEFEATED','WORLD_MECHANISM_COMPLETED'];
export function compileWorldEvents(content) {
  const events=content.worldEvents||[];
  const sources=new Set(events.filter(e=>e.trigger==='TARGET_DEFEATED').map(e=>e.sourceId));
  const worldActions=content.worldActions.map(target=>sources.has(target.id)?{...target,toy:true}:target);
  const targets=new Map(originalTargets.map(t=>[t.id,t]));
  for(const target of worldActions)if(target.toy||sources.has(target.id))targets.set(target.id,structuredClone(target));
  const notes=events.flatMap(event=>Array.from({length:event.noteCount},(_,i)=>({id:`${event.id}:note-${i}`,position:[event.position[0]+(i-(event.noteCount-1)/2)*.6,event.position[1],event.position[2]],pitch:event.pitch,
    secretId:event.secret?event.id:null,enabled:event.enabled,revealRadius:event.revealRadius,stayAtAuthoredPosition:true,
    sourceId:event.trigger==='TARGET_DEFEATED'?event.sourceId:null,mechanismId:event.trigger==='WORLD_MECHANISM_COMPLETED'?event.sourceId:null})));
  const secrets=events.filter(e=>e.secret).map(e=>({id:e.id,regionId:e.regionId,type:'AUTHORED_EVENT',label:e.name,position:[...e.position],reward:'LOST_NOTES',enabled:e.enabled}));
  return {content:{...content,worldActions},notes:[...structuredClone(originalNotes),...notes],targets:[...targets.values()],secrets:[...structuredClone(originalSecrets),...secrets]};
}
export function applyWorldEvents(content) {
  const compiled=compileWorldEvents(content);
  TOY_NOTES.splice(0,TOY_NOTES.length,...compiled.notes);
  TOY_TARGETS.splice(0,TOY_TARGETS.length,...compiled.targets);
  EXPLORATION_SECRETS.splice(0,EXPLORATION_SECRETS.length,...compiled.secrets);
  return compiled.content;
}
