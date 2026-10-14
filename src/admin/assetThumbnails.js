import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {loadCachedModel} from '../game/assets/assetManifest.js';

export function thumbnailFrame(box){
  const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  const radius=Math.max(size.length()/2,.05),distance=radius/Math.sin(THREE.MathUtils.degToRad(20))*1.12;
  return {center,distance,near:Math.max(.001,distance-radius*2),far:distance+radius*4};
}
export function createThumbnailQueue(render,limit=160){
  const cache=new Map();let tail=Promise.resolve();
  return asset=>{
    if(cache.has(asset.url))return cache.get(asset.url);
    const job=tail.then(()=>render(asset));tail=job.catch(()=>{});cache.set(asset.url,job);
    job.catch(()=>{if(cache.get(asset.url)===job)cache.delete(asset.url);});
    if(cache.size>limit)cache.delete(cache.keys().next().value);
    return job;
  };
}

async function renderThumbnail(asset){
  const data=await loadCachedModel(asset.url),model=clone(data.scene);
  let renderer,mixer;
  try{
    let clips=data.animations;
    const source=asset.animationSources?.find(s=>s.clips.some(c=>/idle/i.test(c)));
    if(source)clips=(await loadCachedModel(source.url)).animations;
    const clip=clips.find(c=>/idle/i.test(c.name));
    if(clip){mixer=new THREE.AnimationMixer(model);mixer.clipAction(clip).play();mixer.update(.15);}
    model.updateWorldMatrix(true,true);
    const box=new THREE.Box3().setFromObject(model);
    if(box.isEmpty()||!box.min.toArray().concat(box.max.toArray()).every(Number.isFinite))throw Error('Modelo sin limites validos');
    const {center,distance,near,far}=thumbnailFrame(box),scene=new THREE.Scene();scene.background=new THREE.Color('#eaf0ec');scene.add(model);
    scene.add(new THREE.HemisphereLight(0xffffff,0x61756b,2.5));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.copy(center).add(new THREE.Vector3(distance,distance,distance));scene.add(sun);
    const camera=new THREE.PerspectiveCamera(40,1,near,far);camera.position.copy(center).add(new THREE.Vector3(.7,.45,1).normalize().multiplyScalar(distance));camera.lookAt(center);
    renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(96,96,false);renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
  }finally{
    mixer?.stopAllAction();mixer?.uncacheRoot(model);
    const skeletons=new Set();model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());
    // Model geometry/materials belong to the shared loader cache.
    renderer?.dispose();renderer?.forceContextLoss();
  }
}
export const getAssetThumbnail=createThumbnailQueue(renderThumbnail);
