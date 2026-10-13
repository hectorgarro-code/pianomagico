import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as THREE from 'three';
import {existsSync,readFileSync} from 'node:fs';
import {createAdventureState,beginAdventureActivity,settleAdventureActivity,findAdventureObject} from '../adventure/adventureState.js';
import {VALLEY_REGIONS,REGION_IDS as R} from '../adventure/valleyBlueprint.js';
import {applyValleyEvent} from '../adventure/valleyProgression.js';
import {FOREST_LESSON_CHESTS} from '../world/composition/forestAdventureComposition.js';

test('restoration renderer starts quiet, grows real effects, plays one motif and restores shared materials on cleanup',async()=>{
  for(const name of ['torch','torch_lit']){
    const path='public/models/props/Assets/gltf/'+name+'.gltf',json=JSON.parse(readFileSync(path));
    for(const uri of [...json.buffers,...json.images].map(item=>item.uri).filter(Boolean))assert.ok(existsSync('public/models/props/Assets/gltf/'+uri));
  }
  const built=await build({entryPoints:['src/game/gameplay/WorldRestoration.js'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'restoration-assets',setup(b){b.onLoad({filter:/assetManifest\.js$/},()=>({contents:`import * as THREE from 'three';export async function loadCachedModel(){const scene=new THREE.Group();scene.add(new THREE.Mesh(new THREE.BoxGeometry(.2,1,.2),new THREE.MeshStandardMaterial()));return {scene};}`}));}}]});
  const {createWorldRestoration}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));
  const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({clearRect(){},beginPath(){},ellipse(){},arc(){},fill(){},fillText(){}})})};
  const scene=new THREE.Scene(),shared=new THREE.MeshStandardMaterial({color:0x299caf});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(),shared);water.name='River_Water';scene.add(water);
  const column=new THREE.Mesh(new THREE.BoxGeometry(),shared);column.userData.compositionId='observatory-column-0';scene.add(column);
  const light=new THREE.PointLight(0xffffff,15);light.name='summit-light';scene.add(light);
  let adventure=createAdventureState(),runtime;const tones=[],celebrations=[],settled=[],player={x:3,y:0,z:-40};
  try{
    runtime=await createWorldRestoration(scene,()=>0,{adventure:()=>adventure,player:()=>player,onNote:(pitch,volume)=>tones.push([pitch,volume]),onRestored:id=>celebrations.push(id),onSettled:id=>settled.push(id)});
    assert.equal(light.intensity,4);assert.notEqual(water.material,shared);assert.notEqual(column.material,shared);
    assert.ok(runtime.stats.every(s=>!s.restored));assert.equal(tones.length,0);
    const root=scene.getObjectByName('Restoration:BOSQUE_DE_LAS_NOTAS');assert.ok(root.children.some(n=>n.children.some(m=>m.isInstancedMesh)));
    adventure=applyValleyEvent(adventure,{type:'REGION_DISCOVERED',regionId:'BOSQUE_DE_LAS_NOTAS'});
    for(const c of FOREST_LESSON_CHESTS)adventure=settleAdventureActivity(beginAdventureActivity(adventure,c.id,c.activityId),c.id,{completed:true,activityId:c.activityId});
    for(let i=0;i<80;i++)runtime.update(.05,i*.05,player);
    assert.deepEqual(celebrations,['BOSQUE_DE_LAS_NOTAS']);assert.equal(tones.length,4);assert.equal(runtime.stats[0].level,1);
    assert.deepEqual(settled,['BOSQUE_DE_LAS_NOTAS']);runtime.update(.1,4,player);assert.equal(settled.length,1);
    assert.ok(root.children.filter(n=>n.isGroup).every(n=>n.visible));
    const wave=root.children.find(n=>n.isMesh);assert.equal(wave.visible,false);
    for(const id of [R.RIVER,R.MOUNTAIN,R.RUINS,R.OBSERVATORY]){
      adventure=applyValleyEvent(adventure,{type:'REGION_DISCOVERED',regionId:id});
      for(const req of VALLEY_REGIONS.find(r=>r.id===id).regionCompletionRequirements){const object=findAdventureObject(req.id);adventure=settleAdventureActivity(beginAdventureActivity(adventure,object.id,object.activityId),object.id,{completed:true,activityId:object.activityId});}
      runtime.update(.05,4,player);assert.equal(runtime.stats.find(s=>s.id===id).celebrating,true);
      if(id===R.OBSERVATORY)assert.ok(light.intensity>4&&light.intensity<15);
      for(let i=0;i<80;i++)runtime.update(.05,4+i*.05,player);
    }
    assert.equal(light.intensity,15);assert.ok(runtime.stats.every(s=>s.restored));assert.equal(settled.length,5);
    assert.notDeepEqual(water.material.color.toArray(),shared.color.toArray());
    assert.equal(shared.emissiveIntensity,1);runtime.dispose();runtime.dispose();
    assert.equal(water.material,shared);assert.equal(column.material,shared);assert.equal(light.intensity,15);assert.equal(scene.getObjectByName('World_Restoration'),undefined);
    const beforeReload=tones.length;
    runtime=await createWorldRestoration(scene,()=>0,{adventure:()=>adventure,player:()=>player,onNote:(...args)=>tones.push(args)});
    runtime.update(.1,4,player);assert.equal(runtime.stats[0].level,1);assert.equal(tones.length,beforeReload);
  }finally{runtime?.dispose();if(old===undefined)delete globalThis.document;else globalThis.document=old;shared.dispose();water.geometry.dispose();column.geometry.dispose();}
});
