import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import {Buffer} from 'node:buffer';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdtempSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createDefaultContent,applyGameContent,CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
import {prepareEditorContent,contentDiff} from './editorState.js';
import {authoredLimitColliders,createRevealController} from '../game/world/worldDesign.js';
import {calculateTerrainElevation} from '../game/world/worldGenerationRules.js';
import {getPlayableRegionAt} from '../game/adventure/valleyProgression.js';
import {WorldGenerator} from '../game/world/WorldGenerator.js';
import {CollisionWorld} from '../game/world/collision/CollisionWorld.js';
import {validateComposition} from '../game/world/composition/validateComposition.js';
const base=createDefaultContent();
const php=process.env.PHP_BINARY||(process.platform==='win32'?'C:/xampp/php/php.exe':'php');
const validate=c=>execFileSync(php,['-r',"require 'backend/content/validation.php';$i=json_decode(stream_get_contents(STDIN),true);try{validate_game_content($i['c'],json_decode(file_get_contents('backend/content/registry.json'),true),$i['lessons']);echo 'valid';}catch(Throwable $e){echo $e->getMessage();}"],{input:JSON.stringify({c,lessons:JSON.parse(readFileSync('docs/audits/lesson-catalog-snapshot.json')).lessons.map(l=>({...l,enabled:true,is_user_created:false,user_id:null}))}),encoding:'utf8'});
function fixture(){const c=prepareEditorContent(structuredClone(base));c.activities.filter(a=>a.type==='PRACTICE_STATION').forEach(a=>a.lessonId=1);return c;}
test('authored height is shared by terrain and collision boundaries; clearing restores exact baseline',()=>{
  const before=calculateTerrainElevation(12,5),c=fixture();c.worldDesign={terrainPatches:[{id:'hill',position:[12,0,5],radius:5,height:1}],limits:[{id:'edge',regionId:c.world[0].regionId,position:[12,0,5],size:[2,2]}]};assert.equal(validate(c),'valid');
  try{applyGameContent(c);assert.equal(calculateTerrainElevation(12,5),before+1);const mesh=new WorldGenerator().buildTerrain({widthSegments:22,depthSegments:40});assert.ok(mesh.geometry.attributes.position.array.some(n=>n>0));mesh.geometry.dispose();mesh.material.dispose();const world=new CollisionWorld(authoredLimitColliders());assert.ok(world.overlaps({x:12,z:5}));assert.ok(!world.overlaps({x:20,z:5}));assert.equal(contentDiff(base,c).some(d=>d.collection==='worldDesign'),true);}finally{applyGameContent(base);}assert.equal(calculateTerrainElevation(12,5),before);
});
test('paths, connections, spawn and entry positions materialize without changing curriculum',()=>{
  const c=fixture(),plaza=CONTENT_COMPOSITIONS[0],points=structuredClone(plaza.paths[0].points),originalSpawn=[...plaza.spawn.position];points[1][0]+=.5;
  c.worldDesign={paths:[{id:plaza.paths[0].id,compositionId:plaza.groupName,points,width:3}],regions:[{compositionId:plaza.groupName,spawn:{position:[2,0,5],rotation:[0,Math.PI,0]},entryPoints:structuredClone(plaza.entries),exitPoints:structuredClone(plaza.exits)}],connections:[{id:'editor-connector',compositionId:plaza.groupName,toCompositionId:CONTENT_COMPOSITIONS[1].groupName,gateId:'plaza_to_forest',points:[[9,0,-17],[10,0,-19.5]],width:3}]};assert.equal(validate(c),'valid');
  try{applyGameContent(c);assert.deepEqual(plaza.spawn.position,[2,0,5]);assert.equal(plaza.paths.length,2);assert.equal(validateComposition(plaza).errors.some(e=>String(e.code).startsWith('INVALID_PATH')),false);}finally{applyGameContent(base);}assert.equal(plaza.paths.length,1);assert.deepEqual(plaza.spawn.position,originalSpawn);
});
test('reveal occurs once and interruption yields camera control',()=>{
  const c=fixture();c.worldDesign={reveals:[{id:'reveal',position:[0,0,5],camera:[8,10,15],target:[0,1,0],radius:4,duration:2}]};assert.equal(validate(c),'valid');
  try{applyGameContent(c);const controller=createRevealController();assert.ok(controller.step({x:0,z:5},.1));assert.equal(controller.step({x:0,z:5},.1,true),null);assert.equal(controller.step({x:0,z:5},.1),null);}finally{applyGameContent(base);}
});
test('regional footprints are authored but never alter logical progression',()=>{
  const c=fixture();c.worldDesign={areas:[{id:'forest-area',regionId:'BOSQUE_DE_LAS_NOTAS',min:[20,-30],max:[24,-20]}]};assert.equal(validate(c),'valid');
  try{applyGameContent(c);assert.equal(getPlayableRegionAt({x:22,z:-25}),'BOSQUE_DE_LAS_NOTAS');assert.equal(getPlayableRegionAt({x:0,z:-30}),null);}finally{applyGameContent(base);}
  c.worldDesign.areas.push({...c.worldDesign.areas[0],id:'river-area',regionId:'RIO_DEL_RITMO'});assert.match(validate(c),/superpuestas/);
});
test('design rejects out-of-range resources, removed original exits and curriculum rewiring',()=>{
  const c=fixture();c.worldDesign={sounds:[{id:'sound',position:[0,0,5],pitch:'C5',volume:1,interval:1,radius:20}]};assert.match(validate(c),/Fuente musical/);
  c.worldDesign={regions:[{compositionId:c.world[0].id,exitPoints:[]}]};assert.match(validate(c),/acceso original/);
  c.worldDesign={connections:[{id:'wrong',compositionId:c.world[0].id,toCompositionId:'Observatory',gateId:'plaza_to_forest',points:[[0,0,5],[0,0,-130]],width:3}]};assert.match(validate(c),/topologia/);
});
test('GLB importer rejects external assets and rigs before any writes',()=>{
  const b=readFileSync('public/models/props/floor_tile.glb');const run=bytes=>execFileSync(php,['-r',"require 'backend/content/validation.php';require 'backend/content/imports.php';try{echo json_encode(content_validate_glb_import(base64_decode(stream_get_contents(STDIN),true)));}catch(Throwable $e){echo $e->getMessage();}"],{input:bytes.toString('base64'),encoding:'utf8'});
  assert.ok(JSON.parse(run(b)).vertices>0);assert.match(run(Buffer.from('not a glb')),/GLB/);
  assert.match(run(readFileSync('public/models/characters/Knight.glb')),/estaticos|MB|Cabecera/);
  const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));doc.buffers[0].uri='https://bad.example/model.bin';let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=b.subarray(20+b.readUInt32LE(12));const header=Buffer.from(b.subarray(0,20));header.writeUInt32LE(20+json.length+bin.length,8);header.writeUInt32LE(json.length,12);assert.match(run(Buffer.concat([header,json,bin])),/Buffer externo/);
});
test('imported assets are content-addressed and repeated import cannot create duplicate files',()=>{
  const root=mkdtempSync(path.join(tmpdir(),'valle-import-test-'));assert.ok(root.startsWith(path.resolve(tmpdir())+path.sep));
  try{const bytes=readFileSync('public/models/props/floor_tile.glb'),input={name:'QA losa',author:'Kay Lousberg',license:'CC0',category:'PROP',rightsConfirmed:true,data:bytes.toString('base64')};
    const script="require 'backend/content/validation.php';require 'backend/content/imports.php';$i=json_decode(stream_get_contents(STDIN),true);try{$a=content_import_asset($i['asset'],$i['root'].'/models',$i['root'].'/meta');$b=content_import_asset($i['asset'],$i['root'].'/models',$i['root'].'/meta');echo json_encode([$a,$b,content_imported_assets($i['root'].'/meta')]);}catch(Throwable $e){echo $e->getMessage();}";
    const [a,b,catalog]=JSON.parse(execFileSync(php,['-r',script],{input:JSON.stringify({asset:input,root}),encoding:'utf8'}));assert.equal(a.id,b.id);assert.equal(catalog.length,1);assert.equal(readdirSync(path.join(root,'models')).length,1);assert.deepEqual(readFileSync(path.join(root,'models',a.id.slice(9)+'.glb')),bytes);assert.equal(a.license.type,'CC0');
  }finally{rmSync(root,{recursive:true,force:true});}
});
