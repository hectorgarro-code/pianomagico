import * as THREE from 'three';

const boundsCache=new WeakMap();

export function getModelCollisionBounds(model) {
  if(boundsCache.has(model))return boundsCache.get(model);
  model.updateWorldMatrix(true,true);
  const inverse=model.matrixWorld.clone().invert(),points=[],bounds=new THREE.Box3();
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const positions=mesh.geometry.getAttribute('position');
    if(!positions)return;
    const matrix=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
    for(let i=0;i<positions.count;i++) {
      const p=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(matrix);
      bounds.expandByPoint(p);points.push(p);
    }
  });
  if(bounds.isEmpty())throw new Error('Cannot derive collision bounds from empty model');
  const base=new THREE.Box3(),cutoff=bounds.min.y+Math.min(.6,(bounds.max.y-bounds.min.y)*.18);
  for(const p of points)if(p.y<=cutoff)base.expandByPoint(p);
  const center=base.getCenter(new THREE.Vector3());
  let radius=0;
  for(const p of points)if(p.y<=cutoff)radius=Math.max(radius,Math.hypot(p.x-center.x,p.z-center.z));
  const result={bounds,base,baseRadius:radius};boundsCache.set(model,result);return result;
}

export function materializeCollider(instance,definition,model,regionId) {
  const spec=definition.collision;
  if(!spec||spec.type==='none')return null;
  const cached=getModelCollisionBounds(model),box=spec.source==='base'?cached.base:cached.bounds;
  const center=spec.center?new THREE.Vector3(spec.center[0],0,spec.center[1]):box.getCenter(new THREE.Vector3());
  instance.updateWorldMatrix(true,false);
  const worldCenter=center.clone().applyMatrix4(instance.matrixWorld);
  const scale=instance.getWorldScale(new THREE.Vector3());
  const rotation=new THREE.Euler().setFromQuaternion(instance.getWorldQuaternion(new THREE.Quaternion()),'YXZ');
  const collider={id:definition.id,regionId,type:'solid',shape:spec.shape,x:worldCenter.x,z:worldCenter.z,y:instance.getWorldPosition(new THREE.Vector3()).y+.07};
  if(spec.shape==='circle') {
    const radius=spec.radius??(spec.source==='base'?cached.baseRadius:Math.hypot(box.max.x-box.min.x,box.max.z-box.min.z)/2);
    collider.radius=radius*Math.max(Math.abs(scale.x),Math.abs(scale.z));
  } else {
    const size=spec.size??[box.max.x-box.min.x,box.max.z-box.min.z];
    collider.halfWidth=size[0]*Math.abs(scale.x)/2;collider.halfDepth=size[1]*Math.abs(scale.z)/2;collider.yaw=rotation.y;
  }
  return collider;
}
