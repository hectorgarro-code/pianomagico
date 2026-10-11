import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import process from 'node:process';
import * as THREE from 'three';
import { build } from 'esbuild';
import { Buffer } from 'node:buffer';
import { createDefaultContent, applyGameContent, CONTENT_COMPOSITIONS } from './contentDefaults.js';
import { lessonBadgeData, lessonForActivity } from './lessonRepository.js';
import { createAdventureState, findAdventureObject } from '../adventure/adventureState.js';
import { createWorldActivityState } from '../state/worldActivityFlow.js';
import { validateComposition } from '../world/composition/validateComposition.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import audit from '../../../docs/audits/lesson-catalog-snapshot.json' with { type: 'json' };
const baseline = createDefaultContent();

test('real lesson audit contains exact MySQL fields, not a runtime hardcoded catalog', () => {
  assert.equal(audit.count,40); assert.equal(audit.lessons[0].id,2); assert.equal(audit.lessons[1].id,1);
  assert.ok(audit.lessons.some(l => l.id===82)); assert.ok(!audit.lessons.some(l => l.id===40));
  assert.equal(baseline.activities.length,15);
  for (const a of baseline.activities.filter(a => a.type!=='SECRET_REWARD' && !a.lessonRef)) assert.ok(lessonForActivity(a,audit.lessons));
});
test('badge title and notes always resolve from the associated real lesson', () => {
  const song=audit.lessons.find(l=>l.id===2);
  assert.deepEqual(lessonBadgeData({},song,'AVAILABLE',true),{title:'\u266a '+song.title,state:'AVAILABLE',subtitle:'DO \u2192 RE \u2192 MI',action:'E - Abrir'});
  assert.ok(lessonBadgeData({},song,'COMPLETED').title.startsWith('\u2713'));
  assert.equal(lessonBadgeData({},undefined,'AVAILABLE'),null);
  assert.equal(lessonBadgeData({},song,'LOCKED',true).action,'Bloqueado');
});
test('content serializes without progress and matches the generated server seed', () => {
  const roundtrip=JSON.parse(JSON.stringify(baseline)); assert.deepEqual(roundtrip,baseline);
  assert.deepEqual(JSON.parse(fs.readFileSync('backend/content/seed.json','utf8')),baseline);
  assert.ok(!('entries' in baseline)); assert.ok(!('valley' in baseline));
  const registry=JSON.parse(fs.readFileSync('backend/content/registry.json','utf8'));
  assert.equal(registry.assets.length,ASSET_CATALOG.assets.length);
  assert.ok(registry.assets.every(a=>fs.existsSync('public'+a.url)));
});
test('saved activity assignment updates the same Adventure authority without copying lessons', () => {
  const copy=structuredClone(baseline), id='forest-chest-01'; copy.activities.find(a=>a.id===id).lessonId=2;
  try { applyGameContent(copy); assert.equal(findAdventureObject(id).activityId,2);
    assert.equal(createAdventureState().entries[id].activityId,2);
    assert.equal(createWorldActivityState().game.adventure.entries[id].activityId,2);
    assert.equal(findAdventureObject(id).sequence,undefined);
  } finally { applyGameContent(baseline); }
});
test('world edit and restoration preserve shared composition identity and instance references', () => {
  const copy=structuredClone(baseline), composition=CONTENT_COMPOSITIONS[1], identity=composition;
  const object=findAdventureObject('forest-chest-01');
  const moved=copy.world[1].instances.find(i=>i.id===object.instanceId); moved.position[0]+=1;
  moved.interaction={key:'KeyE',radius:5};
  try { applyGameContent(copy); assert.equal(CONTENT_COMPOSITIONS[1],identity); assert.equal(object.instance.position[0],moved.position[0]);
    assert.equal(object.interaction.radius,5);
    assert.ok(validateComposition(composition,{registeredAssets:ASSET_CATALOG.assets.map(a=>a.url)}).valid);
  } finally { applyGameContent(baseline); assert.equal(object.interaction.radius,3); }
});
test('PHP server validates admin roles, lessons, worlds and all future reference schemas', () => {
  const result=JSON.parse(execFileSync(process.env.PHP_BINARY || 'C:/xampp/php/php.exe',['backend/content/schema-test.php'],{encoding:'utf8'}));
  assert.ok(result.passed>=30);
});
test('PianoMagico and Adventure share lesson repository; preview cannot persist educational writes', () => {
  const piano=fs.readFileSync('src/modules/piano-magico/PianoMagico.jsx','utf8'), progress=fs.readFileSync('src/game/services/progressService.js','utf8');
  assert.ok(piano.includes('await loadPianoLessons(userId)')); assert.ok(progress.includes('return loadPianoLessons'));
  for(const fn of ['updateProfileOnServer','unlockStickerOnServer','unlockMedalOnServer','addSongOnServer','persistPerformance'])
    assert.match(piano,new RegExp('const '+fn+' = async[^]*?if \\(adminPreview \\|\\| !userId\\) return'));
  assert.ok(fs.readFileSync('src/admin/ValleAdmin.jsx','utf8').includes('preparationComplete adminPreview'));
});
test('legacy global mutation routes cannot bypass ADMIN and CSRF', () => {
  const api=fs.readFileSync('backend/api.php','utf8'),security=fs.readFileSync('backend/content/security.php','utf8');
  assert.ok(api.includes('content_legacy_guard($conn, $action, $input)'));
  for(const action of ['update_song','delete_song','reorder_songs']) assert.ok(security.includes(action));
  assert.ok(security.includes('hash_equals')); assert.ok(security.includes('content_post()'));
  assert.ok(!fs.readFileSync('src/admin/ValleAdmin.jsx','utf8').includes('?debug=1'));
});
test('the actual WorldGenerator materializes edited transforms and colliders, not a separate Admin world', async () => {
  const compiled=await build({entryPoints:['src/game/world/WorldGenerator.js'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
  const {WorldGenerator}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const generator=new WorldGenerator(),root=new THREE.Group(),prototype=new THREE.Group();
  prototype.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial()));
  const original=baseline.world[0].instances.find(i=>i.assetUrl.includes('chest_wood'));
  const item={...structuredClone(original),position:[4,.2,7],rotation:[0,.5,0],scale:[1.5,1.5,1.5],grounding:'absolute',collision:{type:'solid',shape:'box',source:'bounds'}};
  generator.models.set(item.assetUrl,prototype);
  generator.generateComposition(root,{...CONTENT_COMPOSITIONS[0],instances:[item],stations:[],adventureObjects:[]});
  let actual;root.traverse(node=>{if(node.userData.compositionId===item.id)actual=node;});
  assert.deepEqual(actual.position.toArray(),item.position);assert.deepEqual(actual.scale.toArray(),item.scale);assert.equal(actual.rotation.y,.5);
  assert.equal(generator.colliders.length,1);
  generator.collisionDebug.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});
  prototype.children[0].geometry.dispose();prototype.children[0].material.dispose();
});
