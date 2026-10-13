import {Vector3,Quaternion,Euler} from 'three';
import {patchRecord,newId} from './editorState.js';
import {calculateTerrainElevation as heightAt} from '../game/world/worldGenerationRules.js';

export function editableRecords(records,keys) {
  const selected=records.filter(r=>keys.includes(r.key));
  if(!selected.length)throw Error('Selecciona elementos.');
  if(selected.some(r=>r.editor?.locked))throw Error('Desbloquea los elementos antes de modificarlos.');
  return selected;
}
export function authorMetadata(content,regionId,records,keys,values) {
  return records.filter(r=>keys.includes(r.key)).reduce((c,r)=>patchRecord(c,regionId,r,{editor:{...r.editor,...values}}),content);
}
export function transformSelection(content,regionId,records,keys,anchor,values) {
  const selected=editableRecords(records,keys),old=anchor.position,next=values.position||old;
  const oldScale=anchor.scale,newScale=values.scale||oldScale,rot=values.rotation||anchor.rotation;
  const q=new Quaternion().setFromEuler(new Euler(...rot)).multiply(new Quaternion().setFromEuler(new Euler(...anchor.rotation)).invert());
  const ratio=new Vector3(...newScale).divide(new Vector3(...oldScale));
  if(values.scale&&selected.some(r=>r.collection==='residents')&&(Math.abs(ratio.x-ratio.y)>1e-7||Math.abs(ratio.x-ratio.z)>1e-7))throw Error('Los grupos con habitantes requieren escala uniforme.');
  const world=r=>new Vector3(r.position[0],r.position[1]+(r.grounding==='absolute'?0:heightAt(r.position[0],r.position[2])),r.position[2]);
  const pivot=world(anchor),target=world({...anchor,position:next});
  return selected.reduce((c,r)=>{
    const position=world(r).sub(pivot).multiply(ratio).applyQuaternion(q).add(target).toArray();
    if(r.grounding!=='absolute')position[1]-=heightAt(position[0],position[2]);
    if(!values.rotation&&!values.scale&&next[1]===old[1]&&r.grounding!=='absolute')position[1]=r.position[1];
    const rotation=new Euler().setFromQuaternion(q.clone().multiply(new Quaternion().setFromEuler(new Euler(...r.rotation)))).toArray().slice(0,3);
    const scale=r.scale.map((v,i)=>v*newScale[i]/oldScale[i]);
    if(![...position,...rotation,...scale].every(Number.isFinite)||scale.some(v=>v<=0||v>100))throw Error('Transformacion fuera de limites.');
    return patchRecord(c,regionId,r,{position,rotation,scale});
  },content);
}
export function alignSelection(content,regionId,records,keys,axis) {
  const selected=editableRecords(records,keys),index=axis==='X'?0:2,value=selected[0].position[index];
  return selected.reduce((c,r)=>patchRecord(c,regionId,r,{position:r.position.map((v,i)=>i===index?value:v)}),content);
}
export function saveTemplate(content,records,keys,name) {
  const selected=editableRecords(records,keys);
  if(selected.some(r=>r.collection!=='instances'||r.interaction))throw Error('Las plantillas admiten decoracion y arquitectura sin interaccion.');
  if(!name.trim()||name.length>80)throw Error('Nombre de plantilla requerido (hasta 80 caracteres).');
  const origin=selected[0].position;
  const instances=selected.map(r=>{const item=structuredClone(r);delete item.key;delete item.collection;delete item.editor;return {...item,position:[r.position[0]-origin[0],r.position[1],r.position[2]-origin[2]]};});
  return {...content,editorTemplates:[...(content.editorTemplates||[]),{id:newId('template'),name:name.trim(),instances}]};
}
export function placeTemplate(content,regionId,template,position) {
  const group=newId('group');
  const copies=template.instances.map(item=>({...structuredClone(item),id:newId('prop'),position:[position[0]+item.position[0],item.position[1],position[2]+item.position[2]],editor:{group,layer:'Decoracion',locked:false,hidden:false}}));
  return {...content,world:content.world.map(r=>r.id===regionId?{...r,instances:[...r.instances,...copies]}:r)};
}
