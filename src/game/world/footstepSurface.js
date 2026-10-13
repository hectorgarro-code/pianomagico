import * as THREE from 'three';

export function createFootstepSurface(environment) {
  const floors=[];
  environment.traverse(root=>{
    if(root.userData.footstepSurface!=='concrete')return;
    root.traverse(mesh=>{if(mesh.isMesh)floors.push(mesh);});
  });
  const ray=new THREE.Raycaster(undefined,new THREE.Vector3(0,-1,0),0,1.2);
  return position=>{
    ray.ray.origin.set(position.x,position.y+.6,position.z);
    return ray.intersectObjects(floors,false).length?'concrete':'grass';
  };
}
