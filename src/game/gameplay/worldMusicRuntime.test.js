import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as THREE from 'three';
import {FOREST_MUSIC} from '../world/composition/musicalMechanismComposition.js';
import {applyToyEvent} from '../adventure/toyState.js';
import {createAdventureState} from '../adventure/adventureState.js';

test('world music renderer raycasts real 3D symbols, opens once, releases collider after lift and restores completion',async()=>{
  const compiled=await build({entryPoints:['src/game/gameplay/WorldMusicMechanisms.js'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'music-fixture',setup(builder){
    builder.onLoad({filter:/assetManifest\.js$/},()=>({contents:`import * as THREE from 'three';export async function loadCachedModel(url){const scene=new THREE.Group();const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshStandardMaterial());if(url.includes('gate'))mesh.name='wall_doorway_door';scene.add(mesh);return {scene};}`}));
  }}]});
  const {createWorldMusicMechanisms}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const old=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillText(){}})})};
  const scene=new THREE.Scene(),player={x:-6,y:0,z:-26},tones=[];let adventure=createAdventureState(),opened=0,sync=0,runtime;
  const options={adventure:()=>adventure,onToyEvent:event=>{adventure=applyToyEvent(adventure,event);},onNoteSound:pitch=>tones.push(pitch),onBurst(){},onOpened(){opened++;},onColliders(){sync++;}};
  try{
    runtime=await createWorldMusicMechanisms(scene,()=>0,[FOREST_MUSIC],options);
    assert.equal(runtime.colliders().length,6);for(let i=0;i<75;i++)runtime.update(.05,player);
    assert.deepEqual(tones,FOREST_MUSIC.sequence);assert.equal(runtime.key(2),true);assert.equal(runtime.stats[0].phase,'ERROR');
    for(let i=0;i<90;i++)runtime.update(.05,player);assert.equal(runtime.stats[0].phase,'ANSWER');
    assert.ok(runtime.key(0));assert.ok(runtime.key(1));
    const camera=new THREE.PerspectiveCamera(50,1,.1,100);camera.position.set(-6,6,-20);camera.lookAt(-6,1,-27);camera.updateMatrixWorld();scene.updateMatrixWorld(true);
    const point=new THREE.Vector3(-4.6,1.05,-27).project(camera);assert.ok(runtime.pointer(point.x,point.y,camera));
    assert.equal(opened,1);assert.equal(runtime.colliders().length,6);
    for(let i=0;i<25;i++)runtime.update(.05,player);assert.equal(runtime.colliders().length,5);assert.equal(sync,1);assert.equal(runtime.key(0),false);
    assert.deepEqual(adventure.toy.completedMechanisms,[FOREST_MUSIC.id]);runtime.dispose();
    runtime=await createWorldMusicMechanisms(scene,()=>0,[FOREST_MUSIC],options);assert.equal(runtime.stats[0].phase,'OPEN');assert.equal(runtime.colliders().length,5);assert.equal(opened,1);
  }finally{runtime?.dispose();if(old===undefined)delete globalThis.document;else globalThis.document=old;}
  assert.equal(scene.children.length,0);
});
