import * as THREE from 'three';

export function createCollisionOutline(collider,color,heightAt) {
  const points=[];
  if(collider.shape==='circle') {
    for(let i=0;i<48;i++) {
      const a=i*Math.PI*2/48;
      points.push(new THREE.Vector3(collider.x+Math.cos(a)*collider.radius,0,collider.z+Math.sin(a)*collider.radius));
    }
  } else {
    const cos=Math.cos(collider.yaw),sin=Math.sin(collider.yaw);
    for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      const dx=x*collider.halfWidth,dz=z*collider.halfDepth;
      points.push(new THREE.Vector3(collider.x+cos*dx+sin*dz,0,collider.z-sin*dx+cos*dz));
    }
  }
  for(const p of points)p.y=heightAt?heightAt(p.x,p.z)+.1:collider.y??.1;
  const material=new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.95});
  const line=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),material);
  line.renderOrder=100;return line;
}

export function disposeCollisionDebug(group) {
  if(!group)return;
  group.traverse(obj=>{obj.geometry?.dispose();obj.material?.dispose();});
}
