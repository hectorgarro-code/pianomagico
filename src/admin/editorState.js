import { ASSET_CATALOG } from '../game/assets/assetCatalog.js';
import { CONTENT_COMPOSITIONS } from '../game/content/contentDefaults.js';
import { WORLD_RESIDENTS } from '../game/world/composition/friendlyComposition.js';
import { toyWorldActions } from '../game/world/composition/toyComposition.js';
import { PLAZA_COMPOSITION } from '../game/world/composition/plazaComposition.js';
import { FOREST_COMPOSITION } from '../game/world/composition/forestComposition.js';

export function historyReducer(state, action) {
  if (action.type === 'reset') return { value: structuredClone(action.value), past: [], future: [] };
  if (action.type === 'undo' && state.past.length) return { value: state.past.at(-1), past: state.past.slice(0,-1), future: [state.value,...state.future] };
  if (action.type === 'redo' && state.future.length) return { value: state.future[0], past: [...state.past,state.value], future: state.future.slice(1) };
  if (action.type !== 'change') return state;
  const value = typeof action.value === 'function' ? action.value(state.value) : action.value;
  if (JSON.stringify(value) === JSON.stringify(state.value)) return state;
  return { value, past: [...state.past,state.value].slice(-60), future: [] };
}
export const newId = prefix => `editor-${prefix}-${crypto.randomUUID()}`;
export function contentDiff(before,after) {
  const flatten=c=>Object.fromEntries(['world','activities','rewards','worldActions','minigames','gates','pets','residents','editorTemplates'].flatMap(key=>{
    const records=key==='world'?(c.world||[]).flatMap(r=>r.instances.map(i=>({...i,compositionId:r.id}))):c[key]||[];
    return records.map(item=>[`${key}:${item.id}`,{collection:key,item}]);
  }));
  const old=flatten(before),next=flatten(after);
  return [...new Set([...Object.keys(old),...Object.keys(next)])].flatMap(key=>{
    if(JSON.stringify(old[key]?.item)===JSON.stringify(next[key]?.item))return [];
    const item=next[key]?.item||old[key].item,fields=Object.keys({...old[key]?.item,...next[key]?.item}).filter(f=>JSON.stringify(old[key]?.item[f])!==JSON.stringify(next[key]?.item[f]));
    return [{collection:(next[key]||old[key]).collection,id:item.id,kind:!old[key]?'Agregar':!next[key]?'Eliminar':'Modificar',fields}];
  });
}
export function prepareEditorContent(content) {
  return { ...content, editorVersion:1, worldActions: toyWorldActions(content,[PLAZA_COMPOSITION,FOREST_COMPOSITION]).map(t=>({defeatEffect:'musical-particles',...t})),
    residents: (content.residents || structuredClone(WORLD_RESIDENTS)).map(r=>({...r,...(r.watch?{watch:r.watch.map(id=>id==='ruins-first-voice'?'ruins-chest-01':id)}:{})})) };
}
export function sceneRecords(content, region) {
  return [
    ...region.instances.map(item=>({...item,collection:'instances',key:`instances:${item.id}`})),
    ...content.worldActions.filter(i=>i.regionId===region.regionId).map(i=>({...i,collection:'worldActions',key:`worldActions:${i.id}`,assetUrl:ASSET_CATALOG.assets.find(a=>a.id===i.assetId)?.url,grounding:'terrain'})),
    ...content.gates.filter(i=>i.regionId===region.regionId).map(i=>({...i,collection:'gates',key:`gates:${i.id}`,assetUrl:'/models/props/gate.glb',grounding:'terrain'})),
    ...(content.residents||[]).filter(i=>i.regionId===region.regionId).map(i=>({...i,collection:'residents',key:`residents:${i.id}`,assetUrl:ASSET_CATALOG.assets.find(a=>a.id===`player:${i.characterId}`)?.url,rotation:[0,i.rotation,0],scale:[i.scale,i.scale,i.scale],grounding:'terrain'}))
  ];
}
export function patchRecord(content, regionId, record, patch) {
  if (record.collection==='instances') return {...content,world:content.world.map(r=>r.id===regionId?{...r,instances:r.instances.map(i=>i.id===record.id?{...i,...patch}:i)}:r)};
  if (record.collection==='residents') patch={...patch,...(patch.rotation?{rotation:patch.rotation[1]}:{}),...(patch.scale?{scale:patch.scale.find((v,i)=>v!==record.scale[i])??patch.scale[1]}:{})};
  return {...content,[record.collection]:content[record.collection].map(i=>i.id===record.id?{...i,...patch}:i)};
}
export function removeSceneRecord(content,regionId,record) {
  if(record.editor?.locked)throw Error('Desbloquea este elemento antes de eliminarlo.');
  if(record.firstMinutesOnly)throw Error('Este encuentro pertenece al inicio de la aventura. Puede moverse, pero no eliminarse.');
  if(record.collection==='instances') {
    const composition=CONTENT_COMPOSITIONS.find(c=>c.groupName===regionId);
    const protectedIds=[...(composition.stations||[]),...(composition.adventureObjects||[]).filter(a=>!a.id.startsWith('editor-'))].map(a=>a.instanceId);
    const landmarkIds=(composition.landmarks||[]).flatMap(l=>l.memberIds||l.instanceIds||[]);
    if([...protectedIds,...landmarkIds].includes(record.id)) throw Error('Este objeto pertenece al recorrido principal. No se puede eliminar.');
    const activity=content.activities.find(a=>a.instanceId===record.id);
    if(activity&&content.activities.some(a=>a.requirements.completedObjects.includes(activity.id)))throw Error('Hay actividades que dependen de este cofre.');
    if(activity&&content.residents?.some(r=>r.watch?.includes(activity.id)))throw Error('Un habitante observa este cofre. Retira esa referencia antes de eliminarlo.');
    return {...content,world:content.world.map(r=>r.id===regionId?{...r,instances:r.instances.filter(i=>i.id!==record.id)}:r),activities:content.activities.filter(a=>a!==activity),gates:content.gates.filter(g=>g.instanceId!==record.id)};
  }
  return {...content,[record.collection]:content[record.collection].filter(i=>i.id!==record.id)};
}
export function addSceneRecord(content,regionId,kind,asset,position,lessonId) {
  const region=content.world.find(r=>r.id===regionId), id=newId(kind);
  const transform={position:[...position],rotation:[0,0,0],scale:[1,1,1]};
  if(kind==='chest'&&!lessonId)throw Error('Primero crea o selecciona una leccion global activa.');
  if(kind==='creature'||kind==='destructible') {
    const item={id,regionId:region.regionId,...transform,type:kind==='creature'?'WORLD_CREATURE':'DESTRUCTIBLE',assetId:asset.id,hitsRequired:2,hitReaction:kind==='creature'?'Hit_A':'none',defeatEffect:'musical-particles',behaviorType:kind==='creature'?'wander':'stationary',optionalReward:null,enabledInWorld:true};
    return {content:{...content,worldActions:[...content.worldActions,item]},key:`worldActions:${id}`};
  }
  if(kind==='npc') {
    const item={id,regionId:region.regionId,characterId:Number(asset.id.split(':')[1]),position:[...position],rotation:0,scale:.7,radius:.35,route:null};
    return {content:{...content,residents:[...(content.residents||[]),item]},key:`residents:${id}`};
  }
  if(kind==='gate') {
    const miniId=newId('sequence');
    const item={id,regionId:region.regionId,...transform,minigameId:miniId,instanceId:null,requirements:[],enabled:true};
    return {content:{...content,gates:[...content.gates,item],minigames:[...content.minigames,{id:miniId,type:'SEQUENCE',name:'Eco musical',configuration:{notePool:['C4','E4','G4'],sequenceLength:3,rounds:1},rewardId:null,lessonId:null,enabled:true}]},key:`gates:${id}`};
  }
  const item={id,...transform,assetUrl:asset.url,role:kind==='chest'?'importantProp':'decoration',kind:asset.category==='VEGETATION'?'trees':'props',grounding:'terrain',castShadow:true,receiveShadow:true,collision:{type:kind==='chest'?'solid':'none',...(kind==='chest'?{shape:'box',source:'bounds'}:{})},tags:[],...(kind==='chest'?{interaction:{key:'KeyE',radius:3}}:{})};
  const activities=kind==='chest'?[...content.activities,{id:newId('activity'),instanceId:id,regionId:region.regionId,compositionId:region.id,type:'LESSON_CHEST',label:'Cofre musical',lessonId:Number(lessonId),assignmentStatus:'VERIFICADA',rewardId:null,requirements:{completedObjects:[]},progressionReward:{id:`${id}-progress`,type:'REGION_PROGRESS',regionId:region.regionId,unlocks:[],segmentCompleted:false,label:'Cofre completado'}}]:content.activities;
  return {content:{...content,activities,world:content.world.map(r=>r.id===regionId?{...r,instances:[...r.instances,item]}:r)},key:`instances:${id}`};
}
