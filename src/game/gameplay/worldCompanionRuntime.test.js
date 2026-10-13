import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as THREE from 'three';
import {CollisionWorld} from '../world/collision/CollisionWorld.js';

test('world companion swaps five pets, queues lesson reaction while loading and disposes stale models',async()=>{
  const compiled=await build({entryPoints:['src/game/gameplay/WorldGameplay.js'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',
    plugins:[{name:'companion-fixture',setup(builder){
      builder.onLoad({filter:/toyComposition\.js$/},()=>({contents:'export const TOY_NOTES=[];export const toyWorldActions=content=>content.worldActions;'}));
      builder.onLoad({filter:/valleyProgression\.js$/},()=>({contents:'export const getValleyProgress=()=>({completedRegions:[]});'}));
      builder.onLoad({filter:/(plazaComposition|forestComposition)\.js$/},()=>({contents:'export const PLAZA_COMPOSITION={regionId:"fixture"};export const FOREST_COMPOSITION={regionId:"fixture"};'}));
      builder.onLoad({filter:/assetManifest\.js$/},()=>({contents:`import * as THREE from 'three';export async function loadCachedModel(){await Promise.resolve();return {scene:new THREE.Group(),animations:['static','idle','walk','run','eat','dance','gesture-positive','gesture-negative'].map(name=>new THREE.AnimationClip(name,1,[]))};}`}));
      builder.onLoad({filter:/assetCatalog\.js$/},()=>({contents:`export const ASSET_CATALOG={animationLibraries:[],assets:['elephant','cat','dog','bee','panda'].map(name=>({id:'kenney-cube-pets:animal-'+name,url:name,bounds:{size:[1,1,1]}}))};`}));
      builder.onLoad({filter:/gameplayContent\.js$/},()=>({contents:`export const getGameplayContent=()=>({worldActions:[],gates:[],pets:['elephant','cat','dog','bee','panda'].map(name=>({id:'kenney-cube-pets:animal-'+name,assetId:'kenney-cube-pets:animal-'+name,enabled:true}))});`}));
    }}]});
  const {createWorldGameplay}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const player={x:0,y:0,z:0},scene=new THREE.Scene(),world=new CollisionWorld();
  const runtime=await createWorldGameplay(scene,()=>.6,{player:()=>player,state:()=>({completedMinigames:[]}),onColliders:()=>{}});
  try{
    for(const name of ['elephant','cat','dog','bee','panda']){
      const id='kenney-cube-pets:animal-'+name;
      await runtime.setPet(id);runtime.update(.1,0,player,0,world);
      assert.equal(runtime.companionStats.id,id);assert.equal(runtime.companionStats.position[1],.6);
      assert.equal(scene.getObjectByName('Gameplay_Content').children.filter(n=>n.name.startsWith('Companion:')).length,1);
      assert.equal(runtime.interactPet(),true);assert.equal(runtime.interactPet(),false);
      runtime.update(.1,.1,player,0,world);assert.equal(runtime.companionStats.state,'CELEBRATE');
      assert.equal(runtime.companionStats.clip,name==='bee'||name==='dog'?'dance':'gesture-positive');
      player.z=30;runtime.update(.1,.2,player,0,world);assert.equal(runtime.companionStats.recoveries,1);player.z=0;
    }
    const loading=runtime.setPet('kenney-cube-pets:animal-cat');runtime.companionEvent('LESSON_COMPLETED');await loading;
    runtime.update(.1,1,player,0,world);assert.equal(runtime.companionStats.state,'CELEBRATE');
    await Promise.all([runtime.setPet('kenney-cube-pets:animal-cat'),runtime.setPet('kenney-cube-pets:animal-bee')]);
    assert.equal(runtime.companionStats.id,'kenney-cube-pets:animal-bee');
    const pending=runtime.setPet('kenney-cube-pets:animal-panda');runtime.dispose();await pending;
    assert.equal(scene.children.length,0);
  }finally{runtime.dispose();}
});
