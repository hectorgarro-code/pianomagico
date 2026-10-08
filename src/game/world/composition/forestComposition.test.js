import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {CatmullRomCurve3,Vector3} from 'three';
import {FOREST_COMPOSITION as forest} from './forestComposition.js';
import {validateComposition} from './validateComposition.js';
import {calculateTerrainElevation as h,calculatePlazaElevation,pointToSegmentDistance} from '../worldGenerationRules.js';
const catalog=JSON.parse(fs.readFileSync('src/game/assets/kaykitCatalog.json','utf8'));
const registeredAssets=Object.values(catalog).flat();
test('forest medium validates; real models and external dependencies exist',()=>{
  const before=JSON.stringify(forest);
  assert.equal(validateComposition(forest,{registeredAssets,assetExists:url=>fs.existsSync('public'+url)}).valid,true);
  assert.equal(JSON.stringify(forest),before);
  assert.equal(forest.instances.filter(i=>i.kind==='trees').length,33);
  assert.equal(forest.instances.filter(i=>i.kind==='props').length,3);
  assert.equal(forest.stations.length,0);
  for(const item of forest.instances) {
    const file='public'+item.assetUrl,g=JSON.parse(fs.readFileSync(file,'utf8'));
    for(const dependency of [...(g.buffers||[]),...(g.images||[])]) if(dependency.uri&&!dependency.uri.startsWith('data:')) assert.ok(fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(dependency.uri))));
  }
});
test('Plaza interior stays byte-for-byte equal in height; joins are continuous',()=>{
  for(let x=-24;x<=24;x+=1) for(let z=-24;z<=24;z+=1) if(Math.hypot(x,z)<=24) assert.equal(h(x,z),calculatePlazaElevation(x,z));
  for(const z of [-22,-28,-32,-39,-46]) assert.ok(Math.abs(h(12,z-.001)-h(12,z+.001))<.01);
});
test('trees preserve clearings, reserves and route margins',()=>{
  for(const item of forest.instances.filter(i=>i.kind==='trees')) {
    const [x,,z]=item.position;
    for(const zone of [...forest.openZones,...forest.clearZones,...forest.reservations]) {
      const distance=Math.hypot(x-zone.center[0],z-zone.center[1]);
      assert.ok(zone.instanceId===item.id?distance<=zone.radius:distance>=zone.radius,item.id+'/'+zone.id);
    }
    for(const p of forest.paths) for(let i=1;i<p.points.length;i++) {
      const a=p.points[i-1],b=p.points[i];
      assert.ok(pointToSegmentDistance(x,z,a[0],a[2],b[0],b[2])>p.width/2+p.freeMarginEachSide,item.id);
    }
  }
});
test('semantic reserves and masses reject invalid data',()=>{
  for(const mutate of [v=>{v.reservations[0].radius=0;},v=>{v.reservations[2].instanceId='missing';},v=>{v.vegetationMasses[0].memberIds=['missing'];},v=>{v.vegetationMasses=[null];},v=>{v.reservations=null;},v=>{v.terrain.blendBounds.edgeWidth=0;},v=>{v.terrain.plateaus[0].height=NaN;}]) {
    const copy=structuredClone(forest);mutate(copy);
    assert.equal(validateComposition(copy,{registeredAssets}).valid,false);
  }
});

test('approved B geography, path and reserve footprints remain exactly frozen',()=>{
  const frozen=[forest.terrain,forest.paths,forest.entries,forest.exits,forest.boundaries,forest.openZones,forest.clearZones,forest.reservations.map(({id,shape,center,radius})=>({id,shape,center,radius}))];
  assert.equal(createHash('sha256').update(JSON.stringify(frozen)).digest('hex'),'052c06f870b35ba4c5556bd5101fab8d8da488f99cc58f9770117e3acfad1331');
});

test('master is a single landmark with breathing room; future challenges stay empty',()=>{
  const master=forest.instances.find(i=>i.id==='forest-master-tree');
  assert.deepEqual(forest.landmarks,[{id:'master-tree',memberIds:[master.id]}]);
  for(const item of forest.instances.filter(i=>i.kind==='trees'&&i!==master)) assert.ok(Math.hypot(item.position[0]-master.position[0],item.position[2]-master.position[2])>=5.5,item.id);
  for(const item of forest.instances) for(const zone of forest.reservations.filter(r=>r.id.startsWith('challengeZone'))) assert.ok(Math.hypot(item.position[0]-zone.center[0],item.position[2]-zone.center[1])>zone.radius,item.id);
});

test('authored crowns avoid the usual 18-22m camera sweep, including echo exploration',()=>{
  const nativeWidths={Tree_1:3.3,Tree_2:2.6,Tree_3:3.1};
  const curve=new CatmullRomCurve3(forest.paths[0].points.map(p=>new Vector3(...p)));
  for(const p of [...curve.getSpacedPoints(100),new Vector3(-5,0,-39)]) for(const distance of [18,20,22]) for(const sign of [-1,1]) {
    const cameraZ=p.z+sign*Math.cos(forest.camera.pitch)*distance;
    for(const item of forest.instances.filter(i=>i.kind==='trees')) {
      const family=item.assetUrl.match(/Tree_[123]/)[0];
      const crownRadius=nativeWidths[family]/2*item.scale[0]+.6;
      assert.ok(Math.hypot(p.x-item.position[0],cameraZ-item.position[2])>=crownRadius,item.id);
    }
  }
});
test('walkable authored route has no abrupt slopes',()=>{
  for(const p of forest.paths) for(let i=1;i<p.points.length;i++) {
    const a=p.points[i-1],b=p.points[i],distance=Math.hypot(b[0]-a[0],b[2]-a[2]);
    let previous=h(a[0],a[2]);
    for(let j=1;j<=30;j++) {
      const t=j/30,height=h(a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t);
      assert.ok(Math.abs(height-previous)/(distance/30)<.65,`slope ${i}/${j}`);previous=height;
    }
  }
  const curve=new CatmullRomCurve3(forest.paths[0].points.map(p=>new Vector3(...p)));
  const points=curve.getSpacedPoints(400);
  for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i];
    assert.ok(Math.abs(h(a.x,a.z)-h(b.x,b.z))/a.distanceTo(b)<.65,'rendered path slope');
  }
});
