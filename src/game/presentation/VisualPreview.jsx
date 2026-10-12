import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCharacterPresentation, applyEquipment, getEquipment } from './characterEquipment.js';

const cache = new Map();
let queue = Promise.resolve();

// Static renders of real models: one short-lived renderer, serialized requests,
// cached bitmaps. Never run 24 pet animation loops for a selection grid.
export function previewImage({ characterId, equipment, petId, weapon = false, portrait = false }) {
  const key = JSON.stringify([characterId, equipment, petId, weapon, portrait]);
  if (cache.has(key)) return cache.get(key);
  const result = queue.catch(() => {}).then(async () => {
    const asset = petId && ASSET_CATALOG.assets.find(a => a.id === petId);
    const data = characterId ? await loadCharacterPresentation(characterId) : asset ? await loadCachedModel(asset.url) : null;
    if (!data) throw Error('Missing preview asset');
    const root = clone(data.scene), skeletons = new Set();
    let previewMixer;
    root.traverse(n => { if (n.skeleton) skeletons.add(n.skeleton); });
    const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, preserveDrawingBuffer:true });
    try {
      renderer.setSize(192,192); renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35,1,.01,100);
      scene.add(new THREE.HemisphereLight(0xfff1d1,0x547c78,2.8));
      const light = new THREE.DirectionalLight(0xffffff,3); light.position.set(3,5,6); scene.add(light);
      if (characterId) await applyEquipment(root,characterId,equipment);
      const idle=data.animations.find(c=>c.name===(characterId?'Idle':'idle'));if(idle){previewMixer=new THREE.AnimationMixer(root);previewMixer.clipAction(idle).play();previewMixer.update(.15);root.updateMatrixWorld(true);}
      let bounds = new THREE.Box3();
      if (weapon) {
        const selected=getEquipment(characterId,equipment);
        const nodes=selected.nodes.map(name=>root.getObjectByName(name)).filter(Boolean);
        const accessory=root.getObjectByName('valley-equipped-accessory'); if(accessory)nodes.push(accessory);
        const included = n => nodes.some(parent => { for(let current=n;current;current=current.parent)if(current===parent)return true;return false; });
        root.traverse(n=>{if(n.isMesh)n.visible=included(n);});
        root.updateMatrixWorld(true);
        // GLTF meshes can share position buffers; bounds must use each weapon's
        // indexed vertices, not the entire shared character buffer.
        const vertex=new THREE.Vector3();
        root.traverse(n=>{if(!n.isMesh||!n.visible)return;n.skeleton?.update();const geometry=n.geometry,index=geometry.index,count=index?.count??geometry.attributes.position.count;for(let i=0;i<count;i++){n.getVertexPosition(index?index.getX(i):i,vertex);bounds.expandByPoint(vertex.applyMatrix4(n.matrixWorld));}});
      } else bounds.setFromObject(root);
      if(bounds.isEmpty())throw Error('Empty preview');
      if(portrait&&characterId){
        const headBounds=new THREE.Box3(),vertex=new THREE.Vector3();
        root.traverse(n=>{const head=/(?:_Head|_Hat|_Helmet)(?:_\d+)?$/i;if(!n.isMesh||!(head.test(n.name)||head.test(n.parent?.name||'')))return;n.skeleton?.update();const g=n.geometry,index=g.index,count=index?.count??g.attributes.position.count;for(let i=0;i<count;i++){n.getVertexPosition(index?index.getX(i):i,vertex);headBounds.expandByPoint(vertex.applyMatrix4(n.matrixWorld));}});
        if(!headBounds.isEmpty())bounds.copy(headBounds);
      }
      const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
      root.position.sub(center); scene.add(root);
      const distance=Math.max(size.x,size.y,size.z)*1.65;
      camera.position.set(distance*.2,distance*.12,distance); camera.lookAt(0,0,0); camera.updateProjectionMatrix();
      renderer.render(scene,camera);
      return renderer.domElement.toDataURL('image/png');
    } finally { previewMixer?.stopAllAction();previewMixer?.uncacheRoot(root);skeletons.forEach(s=>s.dispose()); renderer.dispose(); renderer.forceContextLoss(); }
  });
  cache.set(key,result); queue=result;
  result.catch(()=>cache.delete(key));
  return result;
}

export default function VisualPreview(props) {
  const [image,setImage]=useState(null),[failed,setFailed]=useState(false);
  useEffect(()=>{let live=true;setImage(null);setFailed(false);previewImage(props).then(value=>{if(live)setImage(value);}).catch(()=>{if(live)setFailed(true);});return()=>{live=false;};},[props.characterId,props.equipment,props.petId,props.weapon,props.portrait]);
  return image ? <img className="visual-preview" src={image} alt="" draggable="false"/> : <span className={'visual-preview-placeholder'+(failed?' is-failed':'')} aria-hidden="true"/>;
}
