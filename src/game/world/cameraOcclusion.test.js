import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCameraOcclusion } from './cameraOcclusion.js';
import { terrainSafeCameraHeight } from './cameraAssist.js';

test('only camera blockers fade; shared asset materials remain untouched and cleanup restores them', () => {
  const environment = new THREE.Group(), root = new THREE.Group(); root.userData.compositionId = 'tree';
  const material = new THREE.MeshBasicMaterial({ color: 'green' }), geometry = new THREE.BoxGeometry(2, 4, 2);
  const mesh = new THREE.Mesh(geometry, material); root.add(mesh); root.position.set(0, 1, 3); environment.add(root);
  const other = new THREE.Mesh(geometry, material); other.position.x = 10; environment.add(other);
  const occlusion = createCameraOcclusion(environment);
  occlusion.update(new THREE.Vector3(0, 2, 6), [{ x: 0, y: 0, z: 0 }], .1, 1);
  assert.notEqual(mesh.material, material); assert.ok(mesh.material.opacity < .2);
  assert.equal(material.opacity, 1); assert.equal(other.material, material);
  occlusion.update(new THREE.Vector3(5, 2, 6), [{ x: 5, y: 0, z: 0 }], 1, 2);
  assert.equal(mesh.material, material);
  occlusion.update(new THREE.Vector3(0, 2, 3), [{ x: 0, y: 0, z: 0 }], 1, 3);
  assert.notEqual(mesh.material, material);
  occlusion.reset(); assert.equal(mesh.material, material);
  occlusion.dispose(); assert.equal(mesh.material, material);
  geometry.dispose(); material.dispose();
});

test('hills between the camera and player cannot hide the encounter', () => {
  const target={x:0,y:1.15,z:0},camera={x:0,y:4,z:12};
  const heightAt=(_x,z)=>z>4&&z<8?4:0;
  const safeHeight=terrainSafeCameraHeight(camera,target,heightAt);
  assert.ok(safeHeight>camera.y);
  for(let i=1;i<12;i++) {
    const t=i/12;
    assert.ok(target.y+(safeHeight-target.y)*t>=heightAt(0,12*t)+.35-1e-6);
  }
  assert.equal(terrainSafeCameraHeight(camera,target,()=>0),camera.y);
});
