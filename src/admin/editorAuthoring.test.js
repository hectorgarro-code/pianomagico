import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareEditorContent,sceneRecords,historyReducer} from './editorState.js';
import {createDefaultContent} from '../game/content/contentDefaults.js';
import {authorMetadata,transformSelection,alignSelection,saveTemplate,placeTemplate} from './editorAuthoring.js';
const fixture=()=>{const c=prepareEditorContent(createDefaultContent()),region=c.world[0];return {c,region,records:sceneRecords(c,region).filter(r=>r.id.startsWith('west-root-'))};};
test('batch transforms commit one immutable undo step and preserve grounded offsets',()=>{
  const {c,region,records}=fixture(),keys=records.map(r=>r.key),anchor=records[0];
  const moved=transformSelection(c,region.id,records,keys,anchor,{position:[anchor.position[0]+3,anchor.position[1],anchor.position[2]+2]});
  for(const r of records){const found=moved.world[0].instances.find(i=>i.id===r.id);assert.equal(found.position[0],r.position[0]+3);assert.equal(found.position[1],r.position[1]);}
  const history=historyReducer(historyReducer({},{type:'reset',value:c}),{type:'change',value:moved});assert.equal(history.past.length,1);assert.deepEqual(historyReducer(history,{type:'undo'}).value,c);
});
test('locks block edits and metadata can unlock without modifying gameplay placement',()=>{
  const {c,region,records}=fixture(),keys=records.map(r=>r.key),locked=authorMetadata(c,region.id,records,keys,{locked:true,hidden:true,layer:'Raices',group:'Jardin'}),list=sceneRecords(locked,locked.world[0]);
  assert.throws(()=>alignSelection(locked,region.id,list,keys,'X'),/Desbloquea/);
  const unlocked=authorMetadata(locked,region.id,list,keys,{locked:false});assert.deepEqual(unlocked.world[0].instances.map(i=>i.position),c.world[0].instances.map(i=>i.position));
});
test('templates receive fresh IDs and are placed at authored coordinates',()=>{
  const {c,region,records}=fixture(),keys=records.map(r=>r.key),saved=saveTemplate(c,records,keys,'Raices'),placed=placeTemplate(saved,region.id,saved.editorTemplates[0],[10,0,20]);
  const copies=placed.world[0].instances.slice(-records.length);assert.equal(new Set(copies.map(i=>i.id)).size,records.length);assert.equal(copies[0].position[0],10);assert.equal(copies[0].position[2],20);assert.equal(new Set(copies.map(i=>i.editor.group)).size,1);
  assert.throws(()=>saveTemplate(c,[{...records[0],interaction:{radius:3}}],[records[0].key],'No'),/sin interaccion/);
});
test('alignment changes only the selected horizontal axis',()=>{const {c,region,records}=fixture(),next=alignSelection(c,region.id,records,records.map(r=>r.key),'Z');for(const r of records){const item=next.world[0].instances.find(i=>i.id===r.id);assert.equal(item.position[2],records[0].position[2]);assert.equal(item.position[0],r.position[0]);}});
