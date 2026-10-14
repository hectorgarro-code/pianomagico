import test from 'node:test';
import process from 'node:process';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDefaultContent} from '../game/content/contentDefaults.js';
import {spatialWarnings} from './editorPreflight.js';
const php=(source,input)=>execFileSync(process.env.PHP_BINARY||(process.platform==='win32'?'C:/xampp/php/php.exe':'php'),['-r',`require 'backend/content/preflight.php';$i=json_decode(stream_get_contents(STDIN),true);try{${source}}catch(Throwable $e){echo $e->getMessage();}`],{input:JSON.stringify(input),encoding:'utf8'});
test('preflight checks real referenced models without modifying the content',()=>{
  const content=createDefaultContent(),registry=JSON.parse(readFileSync('backend/content/registry.json')),before=JSON.stringify(content);
  const result=JSON.parse(php("echo json_encode(content_asset_preflight($i['content'],$i['registry']));",{content,registry}));
  assert.ok(result.modelsChecked>30);assert.ok(result.dependenciesChecked>0);assert.equal(JSON.stringify(content),before);
});
test('missing textures, external URLs and escaping dependencies fail preflight',()=>{
  const fixture=mkdtempSync(join(tmpdir(),'valle-preflight-')),root=join(fixture,'public');mkdirSync(join(root,'models'),{recursive:true});writeFileSync(join(fixture,'outside.png'),'fixture');
  const content={world:[{instances:[{assetUrl:'/models/model.gltf'}]}],worldActions:[],gates:[]},registry={assets:[]};
  const check=()=>php("echo json_encode(content_asset_preflight($i['content'],$i['registry'],$i['root']));",{content,registry,root});
  try{
    writeFileSync(join(root,'models/model.gltf'),JSON.stringify({asset:{version:'2.0'},buffers:[{uri:'missing.bin'}]}));assert.match(check(),/Recurso ausente/);
    writeFileSync(join(root,'models/model.gltf'),JSON.stringify({asset:{version:'2.0'},images:[{uri:'https://example.com/image.png'}]}));assert.match(check(),/externa/);
    writeFileSync(join(root,'models/model.gltf'),JSON.stringify({asset:{version:'2.0'},images:[{uri:'../../outside.png'}]}));assert.match(check(),/fuera de public/);
    writeFileSync(join(root,'models/model.gltf'),JSON.stringify({asset:{version:'2.0'},images:[{uri:'data:image/png;base64,AA=='}]}));assert.equal(JSON.parse(check()).modelsChecked,1);
  }finally{rmSync(fixture,{recursive:true,force:true});}
});
test('stale revisions fail before content can be published',()=>{
  const run=revision=>php("content_revision_check($i['draft'],$i['current']);echo 'valid';",{draft:{revision},current:{revision:2}});
  assert.equal(run(2),'valid');assert.match(run(1),/mundo publicado cambio/);assert.match(run('2'),/mundo publicado cambio/);
});
test('spatial warnings include principal chest bindings, not only editor chests',()=>{
  const content=createDefaultContent(),plaza=content.world[0],chest=plaza.instances.find(i=>i.id==='plaza-lesson-chest');
  plaza.instances.push({...structuredClone(chest),id:'blocking-prop'});
  assert.ok(spatialWarnings(content).some(w=>w.includes('blocking-prop')&&w.includes('acceso')));
});
