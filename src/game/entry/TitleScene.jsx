import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCharacterPresentation, applyEquipment } from '../presentation/characterEquipment.js';

// Independent authored title set. Never builds or edits gameplay compositions.
const scenery = [
  ['floor_tile.glb',-2,-.12,3,4,'props'], ['floor_tile.glb',2,-.12,3,4,'props'],
  ['floor_tile.glb',-1,-.12,-2,4,'props'], ['chest_gold.glb',2.9,0,2,1.15,'props'],
  ['Tree_2_A_Color1.gltf',-7,0,1,3.6], ['Tree_1_A_Color1.gltf',7,0,-4,4],
  ['Tree_2_B_Color1.gltf',-5,0,-9,3.2], ['Tree_1_B_Color1.gltf',4,0,-12,3.3],
  ['Bush_2_A_Color1.gltf',-5,0,5,1.8], ['Bush_1_A_Color1.gltf',5,0,4,1.5],
  ['Rock_3_A_Color1.gltf',-9,-.3,-28,4], ['Rock_3_A_Color1.gltf',8,-.3,-32,5],
  ['Tree_1_A_Color1.gltf',-10,0,-11,5], ['Tree_2_A_Color1.gltf',10,0,-14,5],
  ['Tree_1_B_Color1.gltf',-2,0,-22,4], ['Tree_2_B_Color1.gltf',3,0,-27,4],
  ['Rock_3_A_Color1.gltf',0,0,-20,4],
  ['pillar_decorated.gltf',5,0,-1,2.8], ['banner_blue.gltf',5,2,-.8,1.1],
  ['Tree_2_A_Color1.gltf',-9,0,7,6], ['Tree_1_B_Color1.gltf',10,0,5,6],
  ['Tree_1_A_Color1.gltf',-7,0,-19,4], ['Tree_2_B_Color1.gltf',6,0,-20,4],
  ['pillar.glb',-.8,4,-20,2.3,'props'], ['pillar.glb',.8,4,-20,2.3,'props'],
  ['floor_tile.glb',0,4,-20,3,'props'],
];
export default function TitleScene({ showHero=true }) {
  const host=useRef(null),heroVisible=useRef(showHero);heroVisible.current=showHero;
  useEffect(()=>{
    let live=true,frame;const skeletons=new Set(),mixers=[],owned=[];
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x83d5eb);scene.fog=new THREE.Fog(0xa8dfd7,18,65);
    const camera=new THREE.PerspectiveCamera(42,1,.1,90),renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;host.current.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff2c9,0x65845e,2.5));const sun=new THREE.DirectionalLight(0xffecd2,3.2);sun.position.set(-6,14,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;scene.add(sun);
    const floorGeometry=new THREE.PlaneGeometry(70,75),floorMaterial=new THREE.MeshStandardMaterial({color:0x66a965,roughness:1});owned.push(floorGeometry,floorMaterial);
    const ground=new THREE.Mesh(floorGeometry,floorMaterial);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.18,-18);ground.receiveShadow=true;scene.add(ground);
    const heroGroup=new THREE.Group();scene.add(heroGroup);
    const add=(data,height,x,y,z,group=scene)=>{
      const model=clone(data.scene),box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
      model.scale.setScalar(height/Math.max(size.y,.1));model.position.set(x,y-box.min.y*model.scale.x,z);model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}if(n.skeleton)skeletons.add(n.skeleton);});group.add(model);return model;
    };
    const glow=new THREE.PointLight(0xffd768,8,8);glow.position.set(2.9,1.5,2);scene.add(glow);
    const motesGeometry=new THREE.BufferGeometry(),motesMaterial=new THREE.PointsMaterial({color:0xffe79b,size:.075,transparent:true,opacity:.8});owned.push(motesGeometry,motesMaterial);motesGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(72),3));const motes=new THREE.Points(motesGeometry,motesMaterial);scene.add(motes);
    const noteCanvas=document.createElement('canvas');noteCanvas.width=64;noteCanvas.height=64;const ctx=noteCanvas.getContext('2d');ctx.fillStyle='#fff0a1';ctx.font='bold 54px serif';ctx.fillText('\u266A',10,52);const noteTexture=new THREE.CanvasTexture(noteCanvas);owned.push(noteTexture);
    const notes=Array.from({length:5},(_,i)=>{const material=new THREE.SpriteMaterial({map:noteTexture,transparent:true,opacity:.65});owned.push(material);const sprite=new THREE.Sprite(material);sprite.scale.set(.5,.5,.5);scene.add(sprite);return sprite;});
    (async()=>{
      for(const [name,x,y,z,height,folder]of scenery){const url=folder==='props'?'/models/props/'+name:'/models/props/Assets/gltf/'+name;const data=await loadCachedModel(url);if(!live)return;const model=add(data,height,x,y,z);if(name==='floor_tile.glb'){model.scale.setScalar(height/4);model.position.y=y;}}
      const data=await loadCharacterPresentation(1);if(!live)return;const hero=add(data,3.1,-2.5,0,4,heroGroup);hero.rotation.y=.18;await applyEquipment(hero,1,'sword-shield');if(!live)return;
      const mixer=new THREE.AnimationMixer(hero),clip=data.animations.find(c=>c.name==='Idle');if(clip)mixer.clipAction(clip).play();mixers.push(mixer);
      const pet=ASSET_CATALOG.assets.find(a=>a.id==='kenney-cube-pets:animal-deer');if(pet){const data=await loadCachedModel(pet.url);if(!live)return;const model=add(data,1.05,-.8,0,3.8,heroGroup),m=new THREE.AnimationMixer(model),clip=data.animations.find(c=>c.name==='idle');if(clip)m.clipAction(clip).play();mixers.push(m);}
      renderer.domElement.dataset.titleReady='true';
    })().catch(error=>{if(live){renderer.domElement.dataset.titleError='true';console.warn('Title scene',error);}});
    const resize=()=>{const w=host.current.clientWidth,h=host.current.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
    let last=performance.now();const animate=()=>{frame=requestAnimationFrame(animate);const now=performance.now(),delta=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.entryMotion==='reduced',t=reduced?0:now/1000;
      heroGroup.visible=heroVisible.current;mixers.forEach(m=>m.update(delta));camera.position.set(camera.aspect<1?-1.6:1.5+Math.sin(t*.12)*.12,camera.aspect<1?4.8:4.4,camera.aspect<1?16:13);camera.lookAt(camera.aspect<1?-1.6:0,camera.aspect<1?1.2:1,camera.aspect<1?0:-3);
      const p=motesGeometry.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,Math.sin(i*2.4)*6,.3+(t*.17+i*.27)%3,Math.cos(i*1.7)*5);p.needsUpdate=true;
      notes.forEach((note,i)=>{note.position.set(-4+i*1.8,1.8+Math.sin(t*.4+i)*.2,(i%2)*2);});glow.intensity=7+Math.sin(t*.7);renderer.render(scene,camera);renderer.domElement.dataset.titleMotion=String(t);
    };animate();
    return()=>{live=false;cancelAnimationFrame(frame);observer.disconnect();mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot());});skeletons.forEach(s=>s.dispose());owned.forEach(o=>o.dispose());sun.shadow.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
  },[]);
  return <div className="title-scene" ref={host} aria-label="Escena del Valle"/>;
}
