import * as THREE from 'three';

export function createCameraOcclusion(environment) {
  const records = [];
  environment.updateMatrixWorld(true);
  environment.traverse(root => {
    if (!root.userData.compositionId) return;
    const bounds = new THREE.Box3().setFromObject(root, true);
    if (bounds.isEmpty() || bounds.max.y - bounds.min.y < 1.2) return;
    const meshes = [];
    root.traverse(mesh => { if (mesh.isMesh) meshes.push({ mesh, original: mesh.material, faded: null }); });
    records.push({ bounds, meshes, amount: 0 });
  });
  const ray = new THREE.Ray(), direction = new THREE.Vector3(), contact = new THREE.Vector3();
  let sampled = -Infinity, blocked = new Set();
  const restore = item => { item.mesh.material = item.original; };
  return {
    update(camera, subjects, delta, time) {
      if (time - sampled > .1) {
        sampled = time; blocked = new Set();
        for (const subject of subjects) {
          const point = new THREE.Vector3(subject.x, subject.y + 1, subject.z);
          const distance = direction.subVectors(point, camera).length();
          ray.set(camera, direction.normalize());
          for (const record of records) {
            if (record.bounds.containsPoint(camera) || (ray.intersectBox(record.bounds, contact) && contact.distanceTo(camera) < distance - .3)) blocked.add(record);
          }
        }
      }
      for (const record of records) {
        record.amount += ((blocked.has(record) ? 1 : 0) - record.amount) * Math.min(1, delta * 14);
        if (record.amount < .01 && !blocked.has(record)) { record.meshes.forEach(restore); continue; }
        for (const item of record.meshes) {
          if (!item.faded) item.faded = (Array.isArray(item.original) ? item.original : [item.original]).map(material => material.clone());
          const originals = Array.isArray(item.original) ? item.original : [item.original];
          item.faded.forEach((material, index) => {
            material.transparent = true; material.depthWrite = false;
            material.opacity = originals[index].opacity * (1 - record.amount * .88);
          });
          item.mesh.material = Array.isArray(item.original) ? item.faded : item.faded[0];
        }
      }
    },
    reset() { blocked.clear(); sampled=-Infinity; records.forEach(record => { record.amount=0; record.meshes.forEach(restore); }); },
    dispose() { records.forEach(record => record.meshes.forEach(item => { restore(item); item.faded?.forEach(material => material.dispose()); })); },
  };
}
