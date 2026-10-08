import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PLAZA_COMPOSITION as plaza } from './plazaComposition.js';
import { collectAssetUrls, validateComposition } from './validateComposition.js';
import { calculateTerrainElevation, calculatePlazaElevation, pointToSegmentDistance } from '../worldGenerationRules.js';

const publicRoot = new URL('../../../../public/', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('../../assets/kaykitCatalog.json', import.meta.url)));
const options = {
  registeredAssets: [...collectAssetUrls(catalog), '/models/props/chest_wood.glb'],
  assetExists: url => fs.existsSync(new URL(url.slice(1), publicRoot))
};

test('authored composition validates without mutation; all asset dependencies exist', () => {
  const before = JSON.stringify(plaza);
  assert.deepEqual(validateComposition(plaza, options).errors, []);
  assert.equal(JSON.stringify(plaza), before);
  for (const asset of new Set(plaza.instances.map(item => item.assetUrl))) {
    const file = new URL(asset.slice(1), publicRoot);
    assert.ok(fs.existsSync(file), asset);
    if (!asset.endsWith('.gltf')) continue;
    const gltf = JSON.parse(fs.readFileSync(file));
    for (const resource of [...gltf.buffers || [], ...gltf.images || []]) {
      if (resource.uri && !resource.uri.startsWith('data:')) {
        assert.ok(fs.existsSync(new URL(resource.uri, file)), resource.uri);
      }
    }
  }
});

test('central ground remains flat; vegetation and rocks stay outside authored clear zones', () => {
  for (const [x,z] of [[0,0],[0,8],[8,0],[-4,-6]]) assert.equal(calculateTerrainElevation(x,z), 0);
  for (const item of plaza.instances.filter(item => ['trees','bushes','rocks'].includes(item.kind))) {
    for (const zone of [...plaza.openZones, ...plaza.clearZones]) {
      assert.ok(Math.hypot(item.position[0]-zone.center[0], item.position[2]-zone.center[1]) >= zone.radius, item.id + ' / ' + zone.id);
    }
    for (const path of plaza.paths) {
      for (let i=1;i<path.points.length;i++) {
        const a=path.points[i-1], b=path.points[i];
        assert.ok(pointToSegmentDistance(item.position[0],item.position[2],a[0],a[2],b[0],b[2]) >= path.width/2 + path.freeMarginEachSide, item.id);
      }
    }
  }
  // Placement checks do not replace rendered crown/sightline inspection.
});

test('invalid landforms, camera, path and station references fail explicitly', () => {
  const cases = [
    ['INVALID_LANDFORM', value => { value.terrain.landforms[0].radius[0]=0; }],
    ['INVALID_TERRAIN', value => { value.terrain.rimHeight=NaN; }],
    ['INVALID_TERRAIN', value => { value.terrain.outerFalloff.width=0; }],
    ['INVALID_TERRAIN', value => { value.terrain.outerFalloff.depth=-1; }],
    ['INVALID_CAMERA', value => { value.camera.lookAhead=-1; }],
    ['INVALID_CAMERA', value => { value.camera.portraitDistance=0; }],
    ['INVALID_PATH_BLEND', value => { value.paths[0].edgeBlend=0; }],
    ['INVALID_PATH_BLEND', value => { value.paths[0].endFade=-1; }],
    ['INVALID_ATMOSPHERE', value => { value.atmosphere.far=value.atmosphere.near; }],
    ['INVALID_ATMOSPHERE', value => { value.atmosphere.color=-1; }],
    ['MISSING_REFERENCE', value => { value.stations[0].instanceId='missing'; }],
    ['INVALID_SCALE', value => { value.instances[0].scale[0]=-1; }]
  ];
  for (const [code, mutate] of cases) {
    const value=structuredClone(plaza); mutate(value);
    assert.ok(validateComposition(value,options).errors.some(error => error.code===code), code);
  }
  assert.equal(plaza.stations.length,1);
  assert.equal(plaza.stations[0].lessonRef,'first-song');
});

test('outer support falls smoothly outside the review; authored route stays inside Plaza', () => {
  const {reviewExtent,outerFalloff}=plaza.terrain;
  // The northern world support is now replaced by the neighboring region.
  assert.ok(calculatePlazaElevation(0,-reviewExtent)>calculatePlazaElevation(0,-reviewExtent-outerFalloff.width));
  for(const radius of [reviewExtent,reviewExtent+outerFalloff.width]) {
    assert.ok(Math.abs(calculateTerrainElevation(radius+.001,0)-calculateTerrainElevation(radius-.001,0))<.001);
  }
  const boundary=plaza.boundaries[0];
  for(const point of plaza.paths[0].points) assert.ok(Math.hypot(point[0],point[2])<=boundary.radius);
});

test('authored banks frame a low exit without a steep final path', () => {
  const exitHeight=calculateTerrainElevation(9,-17);
  for(const [x,z] of [[-16,-2],[17,-15],[0,-22]]) {
    assert.ok(calculateTerrainElevation(x,z)>exitHeight+2,'banks must frame the exit');
  }
  const points=plaza.paths[0].points;
  const a=points.at(-2),b=points.at(-1);
  let previous=calculateTerrainElevation(a[0],a[2]);
  const stepLength=Math.hypot(b[0]-a[0],b[2]-a[2])/20;
  for(let i=1;i<=20;i++) {
    const t=i/20;
    const height=calculateTerrainElevation(a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t);
    assert.ok(Math.abs(height-previous)/stepLength<0.25,'final path slope');
    previous=height;
  }
});

test('5F keeps the object budget and a connected atrium; practice is a side detour', () => {
  assert.equal(plaza.instances.length,61);
  const chest=plaza.instances.find(item=>item.id==='plaza-lesson-chest');
  const path=plaza.paths[0];
  const distance=Math.min(...path.points.slice(1).map((b,i)=>{
    const a=path.points[i];
    return pointToSegmentDistance(chest.position[0],chest.position[2],a[0],a[2],b[0],b[2]);
  }));
  assert.ok(distance > path.width/2 + path.freeMarginEachSide);
  assert.ok(calculateTerrainElevation(9,-17)<1,'exit must not become an artificial hill');
  const members=plaza.instances.filter(item=>item.id.startsWith('atrium-'));
  const pillars=members.filter(item=>item.id.includes('column'));
  const beams=members.filter(item=>item.id.includes('lintel'));
  for(const pillar of pillars) {
    const supports=beams.filter(beam=>{
      const dx=pillar.position[0]-beam.position[0],dz=pillar.position[2]-beam.position[2];
      const yaw=beam.rotation[1];
      const x=Math.cos(yaw)*dx-Math.sin(yaw)*dz;
      const z=Math.sin(yaw)*dx+Math.cos(yaw)*dz;
      return Math.abs(x)<=2*beam.scale[0] && Math.abs(z)<=2*beam.scale[2];
    });
    assert.equal(supports.length,2,pillar.id+' must join two frame members');
    for(const beam of supports) {
      assert.ok(beam.position[1]-.1*beam.scale[1] <= pillar.position[1]+4*pillar.scale[1]);
    }
  }
});
