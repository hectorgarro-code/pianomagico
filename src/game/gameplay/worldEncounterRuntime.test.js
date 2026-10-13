import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as THREE from 'three';
import { CollisionWorld } from '../world/collision/CollisionWorld.js';

test('actual world runtime strikes, staggers, preserves immunity and defeats a creature in two player hits', async () => {
  const compiled = await build({
    entryPoints: ['src/game/gameplay/WorldGameplay.js'], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
    plugins: [{ name: 'local-encounter-fixture', setup(builder) {
      builder.onLoad({filter:/toyComposition\.js$/},()=>({contents:'export const TOY_NOTES=[];export const toyWorldActions=content=>content.worldActions;'}));
      builder.onLoad({filter:/valleyProgression\.js$/},()=>({contents:'export const getValleyProgress=()=>({completedRegions:[]});'}));
      builder.onLoad({filter:/(plazaComposition|forestComposition)\.js$/},()=>({contents:'export const PLAZA_COMPOSITION={regionId:"fixture"};export const FOREST_COMPOSITION={regionId:"fixture"};'}));
      builder.onLoad({ filter: /assetManifest\.js$/ }, () => ({ contents: `
        import * as THREE from 'three';
        export async function loadCachedModel(url){return {scene:new THREE.Group(),animations:(url==='cat'?['idle','walk','run','dance','gesture-positive']:['Idle_A','Walking_A','Throw','Hit_A','Death_A']).map(name=>new THREE.AnimationClip(name,1,[]))};}
      ` }));
      builder.onLoad({ filter: /assetCatalog\.js$/ }, () => ({ contents: `export const ASSET_CATALOG={animationLibraries:[{url:'fixture'}],assets:[{id:'creature',url:'creature'},{id:'kenney-cube-pets:animal-cat',url:'cat',bounds:{size:[1,1,1]}}]};` }));
      builder.onLoad({ filter: /gameplayContent\.js$/ }, () => ({ contents: `export const getGameplayContent=()=>({worldActions:[{id:'enemy',type:'WORLD_CREATURE',assetId:'creature',position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],hitsRequired:2,hitReaction:'Hit_A',behaviorType:'wander',enabledInWorld:true}],gates:['old','fresh'].map((id,index)=>({id,minigameId:id,enabled:true,position:[20+index*10,0,0],rotation:[0,0,0],scale:[1,1,1]})),pets:[{id:'cat',assetId:'kenney-cube-pets:animal-cat',enabled:true}]});` }));
    } }],
  });
  const { createWorldGameplay } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const scene = new THREE.Scene(), player = { x: 0, y: 0, z: 1.1 };
  let hits = 0, rewards = 0, impacts = 0, world = new CollisionWorld();const impactEvents=[];
  let openings=0;const completedMinigames=['old'];
  const runtime = await createWorldGameplay(scene, () => 0, {
    player: () => player, state: () => ({ completedMinigames }),
    onPlayerHit: () => hits++, onReward: () => rewards++, onColliders: colliders => { world = new CollisionWorld(colliders); },
    onPlayerImpact: event => {impacts++;impactEvents.push(event);},
    onGateOpened: () => openings++,
  });
  try {
    await runtime.setPet('cat');
    runtime.update(.1, .1, player, Math.PI, world);
    assert.equal(runtime.stats.attackingCreatures, 1); assert.equal(hits, 0);
    runtime.update(.3, .4, player, Math.PI, world);
    runtime.update(.3, .7, player, Math.PI, world);
    assert.equal(hits, 1); assert.equal(runtime.staggered, true);
    for (let i = 0; i < 10; i++) runtime.update(.1, 1 + i * .1, player, Math.PI, world);
    assert.ok(player.z > 3); assert.equal(hits, 1); assert.equal(runtime.staggered, false);
    const blocked = runtime.movePlayer({ x: 0, z: 2 }, { x: 0, z: -5 }, world);
    assert.ok(blocked.z > .78);
    Object.assign(player, { x: 0, y: 0, z: 1.1 });
    runtime.action('1H_Melee_Attack_Chop', 1); runtime.update(.3, 3, player, Math.PI, world);
    assert.equal(runtime.stats.creatures, 1);
    const enemyModel=scene.getObjectByName('Gameplay_Content').children[0];
    assert.ok(enemyModel.position.z<0, 'enemy knockback updates the visible model during hit reaction');
    assert.equal(enemyModel.position.z,impactEvents[0].position.z);
    runtime.update(.7, 3.7, player, Math.PI, world);
    runtime.action('1H_Melee_Attack_Chop', 1); runtime.update(.3, 4, player, Math.PI, world);
    assert.equal(runtime.stats.creatures, 0); assert.equal(rewards, 1);assert.equal(impacts,2);
    assert.equal(runtime.companionStats.state,'CELEBRATE');assert.equal(runtime.companionStats.clip,'gesture-positive');
    assert.deepEqual(impactEvents.map(event=>({id:event.id,type:event.type,defeated:event.defeated})),[
      {id:'enemy',type:'WORLD_CREATURE',defeated:false},{id:'enemy',type:'WORLD_CREATURE',defeated:true},
    ]);
    runtime.update(1.5, 5.5, player, Math.PI, world); assert.equal(rewards, 1);
    assert.ok(runtime.movePlayer(player, { x: 0, z: -5 }, world).z < 0);
    assert.equal(openings,0);
    completedMinigames.push('fresh');runtime.update(.1,6,player,Math.PI,world);assert.equal(openings,1);
    runtime.update(.1,6.1,player,Math.PI,world);assert.equal(openings,1);
  } finally { runtime.dispose(); }
  assert.equal(scene.children.length, 0);
});
