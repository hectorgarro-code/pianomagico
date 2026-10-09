import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JUNCTION_COMPOSITION } from './junctionComposition.js';
import { RIVER_COMPOSITION } from './riverComposition.js';
import { MOUNTAIN_COMPOSITION } from './mountainComposition.js';
import { GROTTO_ENTRANCE_COMPOSITION } from './grottoEntranceComposition.js';
import { ALL_LESSON_CHESTS, ROUTE_LESSON_CHESTS } from './routeAdventureComposition.js';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity } from '../../adventure/adventureState.js';
import { getValleyProgress, validateWorldGateBindings } from '../../adventure/valleyProgression.js';
import { validateComposition, collectAssetUrls } from './validateComposition.js';
import { calculateTerrainElevation } from '../worldGenerationRules.js';
import { createWorldActivityState, worldActivityReducer } from '../../state/worldActivityFlow.js';
const catalog=JSON.parse(fs.readFileSync(new URL('../../assets/kaykitCatalog.json',import.meta.url)));
const registry=[...collectAssetUrls(catalog),'/models/props/chest_wood.glb'];
for(const c of [JUNCTION_COMPOSITION,RIVER_COMPOSITION,MOUNTAIN_COMPOSITION,GROTTO_ENTRANCE_COMPOSITION]) test(`${c.groupName}: materializable assets, collision metadata, paths and gates`,()=>{
  const result=validateComposition(c,{registeredAssets:registry,assetExists:url=>fs.existsSync('public'+url)});
  assert.deepEqual(result.errors,[]);assert.deepEqual(validateWorldGateBindings(c),[]);
  for(const i of c.instances) {
    assert.ok(i.collision);
    if(i.kind==='trees'||i.kind==='rocks'||i.assetUrl.endsWith('chest_wood.glb')) assert.equal(i.collision.type,'solid');
    if(i.assetUrl.endsWith('.gltf')) {
      const gltf=JSON.parse(fs.readFileSync('public'+i.assetUrl));
      for(const r of [...(gltf.buffers||[]),...(gltf.images||[])]) if(r.uri&&!r.uri.startsWith('data:')) assert.ok(fs.existsSync(path.resolve(path.dirname('public'+i.assetUrl),r.uri)));
    }
  }
});
test('actual route requirements, either order, persistence and optional grotto',()=>{
  for(const c of [RIVER_COMPOSITION,MOUNTAIN_COMPOSITION]) {
    assert.equal(c.adventureObjects.length,3);
    for(const object of c.adventureObjects) assert.ok(c.instances.some(i=>i.id===object.instanceId));
  }
  for(const order of [['river','mountain'],['mountain','river']]) {
    let s=createAdventureState();
    for(const c of ALL_LESSON_CHESTS.slice(0,3)) s=settleAdventureActivity(beginAdventureActivity(s,c.id,c.activityId),c.id,{activityId:c.activityId,completed:true});
    for(const [index,prefix] of order.entries()) {
      for(const c of ROUTE_LESSON_CHESTS.filter(c=>c.id.startsWith(prefix))) s=settleAdventureActivity(beginAdventureActivity(s,c.id,c.activityId),c.id,{activityId:c.activityId,completed:true});
      assert.equal(getValleyProgress(s).gates.routes_to_ruins,index?'AVAILABLE':'LOCKED');
    }
    assert.deepEqual(getValleyProgress(createAdventureState(s)),getValleyProgress(s));
    assert.equal(getValleyProgress(s).discoveredRegions.includes('GRUTA_DEL_ECO'),false);
  }
});
test('physical grotto trigger is idempotent and records a secret without educational reward',()=>{
  let f=worldActivityReducer(createWorldActivityState(),{type:'START_ADVENTURE'});
  f=worldActivityReducer(f,{type:'OBJECTIVE',position:{x:-2,z:-49},distance:50});
  f=worldActivityReducer(f,{type:'OBJECTIVE',position:{x:-19,z:-54},distance:70});
  assert.ok(f.game.adventure.valley.discoveries.includes('echo-grotto-found'));
  assert.equal(getValleyProgress(f.game.adventure).currentRegion,'GRUTA_DEL_ECO');
  assert.equal(f.game.progression.xp,0);
});
test('new paths are grounded, bridge dry and mountain ascends with gentle sampled slopes',()=>{
  assert.ok(calculateTerrainElevation(37,-75)>calculateTerrainElevation(18,-58)+2);
  assert.ok(calculateTerrainElevation(-28,-64)>0);
  const deck=RIVER_COMPOSITION.instances.find(i=>i.id==='river-bridge-deck');
  const model=JSON.parse(fs.readFileSync('public'+deck.assetUrl));
  const top=model.accessors[model.meshes[0].primitives[0].attributes.POSITION].max[1];
  assert.ok(deck.position[1]+top*deck.scale[1]>calculateTerrainElevation(-28,-64)+.005,'wood deck must remain visible above the terrain proxy');
  assert.ok(calculateTerrainElevation(-26.5,-74)>.1);
  assert.ok(calculateTerrainElevation(-25.3,-74)<-1.1);
  for(const terrace of MOUNTAIN_COMPOSITION.terrain.plateaus) {
    assert.equal(calculateTerrainElevation(...terrace.center),terrace.height);
  }
  for(const c of [JUNCTION_COMPOSITION,RIVER_COMPOSITION,MOUNTAIN_COMPOSITION]) for(const p of c.paths) for(let i=1;i<p.points.length;i++) {
    const a=p.points[i-1],b=p.points[i],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
    let last=calculateTerrainElevation(a[0],a[2]);
    for(let n=1;n<=100;n++) { const t=n/100,h=calculateTerrainElevation(a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t);assert.ok(Math.abs(h-last)/(length/100)<1.1,`${p.id} slope`);last=h; }
  }
});
