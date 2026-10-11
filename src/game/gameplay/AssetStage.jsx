import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { loadCharacterPresentation, applyEquipment, getEquipment } from '../presentation/characterEquipment.js';
import { createCharacterAnimator } from '../presentation/characterActions.js';

export default function AssetStage({ characterId=null, petId=null, equipment=null, pets=null, celebration=false, manualRotation=0, action=null, autoDemo=true, interactive=false }) {
  const host=useRef(null),[error,setError]=useState(''),[ready,setReady]=useState(false);
  const pose = useRef({ manualRotation, action, autoDemo }); pose.current = { manualRotation, action, autoDemo };
  useEffect(()=>{
    let live=true,frame;const roots=[],mixers=[],animators=[],skeletons=new Set();setError('');setReady(false);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,70);
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
    host.current.appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight(0xfff3d2,0x42725d,2.5));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(3,5,6);scene.add(sun);
    const sparkGeometry=celebration?new THREE.BufferGeometry():null;
    const sparkMaterial=celebration?new THREE.PointsMaterial({color:0xffdf83,size:.055,transparent:true,opacity:.85}):null;
    const sparks=celebration?new THREE.Points(sparkGeometry,sparkMaterial):null;
    if(sparks){sparkGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(90),3));scene.add(sparks);}
    const gallery=Boolean(pets),ids=pets || (petId?[petId]:[]),columns=gallery?Math.min(4,Math.max(1,ids.length)):1;
    const resize=()=>{if(!host.current)return;const w=host.current.clientWidth,h=host.current.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const rows=Math.ceil(ids.length/columns);camera.position.set(0,gallery?Math.max(2,rows*.8):1.7,gallery?Math.max(5,(columns*2+.6)/(2*Math.tan(Math.PI/10)*camera.aspect)*1.15,(rows*1.7+1)/(2*Math.tan(Math.PI/10))):7);camera.lookAt(0,gallery?Math.max(0,rows-1)*.7:.9,0);};
    const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
    let angle = pose.current.manualRotation, lastRotation = angle, actionToken, dragging = false, pointerX = 0;
    const down = event => { if (!interactive) return; dragging = true; pointerX = event.clientX; host.current.setPointerCapture(event.pointerId); };
    const move = event => { if (!dragging) return; angle += (event.clientX - pointerX) * .012; pointerX = event.clientX; };
    const up = () => { dragging = false; };
    host.current.addEventListener('pointerdown', down); host.current.addEventListener('pointermove', move); host.current.addEventListener('pointerup', up); host.current.addEventListener('pointercancel', up);
    const add=async(data,height,x,y)=>{
      if(!live)return null;const model=clone(data.scene);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
      model.scale.setScalar(height/Math.max(size.y,.1));model.position.set(x,y-bounds.min.y*model.scale.x,0);scene.add(model);roots.push(model);model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});return model;
    };
    (async()=>{
      if(characterId){const data=await loadCharacterPresentation(characterId),model=await add(data,2.3,petId?-.45:0,0);if(!model)return;const eq=getEquipment(characterId,equipment);await applyEquipment(model,characterId,eq.id);if(!live)return;const mixer=new THREE.AnimationMixer(model);mixers.push(mixer);animators.push(createCharacterAnimator(mixer,data.animations,characterId,eq));}
      for(let i=0;i<ids.length;i++) {
        const asset=ASSET_CATALOG.assets.find(a=>a.id===ids[i]);if(!asset)throw Error('Unknown pet');
        const data=await loadCachedModel(asset.url),x=gallery?(i%columns-(columns-1)/2)*2:characterId?1:0,y=gallery?(Math.ceil(ids.length/columns)-1-Math.floor(i/columns))*1.7:0;
        const model=await add(data,gallery?1.05:characterId ? .9:1.4,x,y);if(!model)return;const mixer=new THREE.AnimationMixer(model);mixers.push(mixer);const clip=data.animations.find(c=>c.name==='idle');if(clip)mixer.clipAction(clip).play();
      }
      if(live)setReady(true);
    })().catch(()=>{if(live){setError('No se pudo cargar el modelo.');setReady(true);}});
    let last=performance.now(),nextDemo=last+2400,index=0;
    const animate=()=>{frame=requestAnimationFrame(animate);const now=performance.now(),delta=Math.min(.05,(now-last)/1000);last=now;if(pose.current.manualRotation!==lastRotation){angle+=pose.current.manualRotation-lastRotation;lastRotation=pose.current.manualRotation;}if(pose.current.action && pose.current.action.token!==actionToken){actionToken=pose.current.action.token;animators.forEach(a=>a.express(pose.current.action.key));}mixers.forEach(m=>m.update(delta));if(pose.current.autoDemo && !dragging && now>nextDemo){animators.forEach(a=>a.express(index%2?'E':'Q'));index++;nextDemo=now+4200;}roots.forEach(root=>{root.rotation.y=interactive?angle:Math.sin(now/3500)*.25;});if(sparks){const points=sparkGeometry.attributes.position;for(let i=0;i<points.count;i++){const angle=i*2.4+now/2600;points.setXYZ(i,Math.cos(angle)*(1+i%3*.12),(now/1700+i*.17)%2.3,Math.sin(angle)*.7);}points.needsUpdate=true;}renderer.render(scene,camera);};animate();
    return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect();animators.forEach(a=>a.dispose());mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot());});skeletons.forEach(s=>s.dispose());sparkGeometry?.dispose();sparkMaterial?.dispose();scene.clear();renderer.dispose();renderer.domElement.remove();};
  },[characterId,petId,equipment,pets,celebration]);
  return <div className="gameplay-stage" ref={host} aria-label={characterId ? 'Personaje 3D' : 'Mascota 3D'}>{!ready && <p role="status">Cargando modelos...</p>}{error && <p role="alert">{error}</p>}</div>;
}
