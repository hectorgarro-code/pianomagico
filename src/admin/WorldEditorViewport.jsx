import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {TransformControls} from 'three/examples/jsm/controls/TransformControls.js';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {WorldGenerator} from '../game/world/WorldGenerator.js';
import {loadCachedModel} from '../game/assets/assetManifest.js';
import {calculateTerrainElevation as heightAt} from '../game/world/worldGenerationRules.js';
import {CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
import {ASSET_CATALOG} from '../game/assets/assetCatalog.js';
import {loadCharacterPresentation,hideEquipment} from '../game/presentation/characterEquipment.js';

export default function WorldEditorViewport({region,records,selectedKey,selectedKeys=[],onSelect,onTransform,mode,snap,showBounds,focusToken,onPlacement}) {
  const host=useRef(null),runtime=useRef(null),props=useRef(null);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true);
  useLayoutEffect(()=>{props.current={records,selectedKey,selectedKeys,onSelect,onTransform,mode,snap,showBounds,onPlacement};runtime.current?.sync();},[records,selectedKey,selectedKeys,onSelect,onTransform,mode,snap,showBounds,onPlacement]);
  useEffect(()=>{
    let live=true,frame,observer;
    const container=host.current,scene=new THREE.Scene();scene.background=new THREE.Color('#9cd7ef');
    const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Editor 3D del Valle');
    const camera=new THREE.PerspectiveCamera(45,1,.1,450),orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;
    scene.add(new THREE.HemisphereLight(0xffffff,0x477953,2.5));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(15,30,15);scene.add(sun);
    const transform=new TransformControls(camera,renderer.domElement);scene.add(transform.getHelper());transform.setSize(.8);
    const source=CONTENT_COMPOSITIONS.find(c=>c.groupName===region.id),origin=source.spawn?.position||source.paths?.[0]?.points?.[0]||[0,0,0];
    orbit.target.set(origin[0],heightAt(origin[0],origin[2]),origin[2]);camera.position.copy(orbit.target).add(new THREE.Vector3(15,18,22));orbit.update();
    const grid=new THREE.GridHelper(160,160,0x526c63,0x9aaa90);grid.position.set(origin[0],heightAt(origin[0],origin[2])+.03,origin[2]);scene.add(grid);
    const generator=new WorldGenerator(),terrain=generator.buildTerrain({widthSegments:44,depthSegments:160});scene.add(terrain);
    const models=new Map(),pending=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let drag=false,down=null;
    const routeGroup=new THREE.Group();scene.add(routeGroup);
    function clearRoutes(){for(const line of [...routeGroup.children]){line.geometry.dispose();line.material.dispose();line.removeFromParent();}}
    const rt={scene,renderer,camera,orbit,transform,models,grid,drag:false};runtime.current=rt;
    function disposeEntry(entry){entry.mixer?.stopAllAction();entry.mixer?.uncacheRoot(entry.model);const skeletons=new Set();entry.model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());entry.helper?.geometry.dispose();entry.helper?.material.dispose();entry.model.removeFromParent();entry.helper?.removeFromParent();}
    function updateModel(entry,item){const [x,y,z]=item.position;entry.model.position.set(x,item.grounding==='absolute'?y:heightAt(x,z)+y,z);entry.model.rotation.fromArray(item.rotation);entry.model.scale.fromArray(item.scale);entry.model.visible=!item.editor?.hidden&&item.enabled!==false&&item.enabledInWorld!==false;entry.helper?.update();}
    rt.sync=()=>{
      const p=props.current,keys=new Set(p.records.map(i=>i.key));
      for(const [key,entry] of models)if(!keys.has(key)){if(transform.object===entry.model)transform.detach();disposeEntry(entry);models.delete(key);}
      for(const item of p.records){
        const existing=models.get(item.key);
        if(existing&&existing.url!==item.assetUrl){disposeEntry(existing);models.delete(item.key);}
        if(models.has(item.key)){if(!rt.drag)updateModel(models.get(item.key),item);continue;}
        if(pending.has(item.key)||!item.assetUrl)continue;
        const token={};pending.set(item.key,token);
        (item.collection==='residents'?loadCharacterPresentation(item.characterId):loadCachedModel(item.assetUrl)).then(async data=>{
          let animations=data.animations;
          const asset=ASSET_CATALOG.assets.find(a=>a.url===item.assetUrl),library=asset?.animationSources?.find(s=>s.clips.some(c=>/idle/i.test(c)));
          if(!animations.some(a=>/idle/i.test(a.name))&&library)animations=(await loadCachedModel(library.url)).animations;
          if(!live)return;pending.delete(item.key);
          const current=props.current.records.find(i=>i.key===item.key&&i.assetUrl===item.assetUrl);if(!current)return;
          const model=clone(data.scene);if(item.collection==='residents')hideEquipment(model);model.userData.editorKey=item.key;scene.add(model);model.traverse(n=>{if(n.isSkinnedMesh)n.frustumCulled=false;});
          const mixer=animations.length?new THREE.AnimationMixer(model):null,clip=animations.find(a=>/idle/i.test(a.name))||animations[0];if(clip)mixer.clipAction(clip).play();
          const helper=new THREE.BoxHelper(model,0xffbd40);scene.add(helper);const entry={model,mixer,helper,url:item.assetUrl};models.set(item.key,entry);updateModel(entry,current);rt.select();setLoading(pending.size>0);
        }).catch(e=>{pending.delete(item.key);if(live){setLoading(pending.size>0);setError(`No se pudo cargar ${item.id}: ${e.message}`);}});
      }
      rt.select();setLoading(pending.size>0);
    };
    rt.select=()=>{
      const p=props.current,entry=models.get(p.selectedKey);
      const selected=p.records.filter(r=>p.selectedKeys.includes(r.key)),locked=selected.some(r=>r.editor?.locked);
      clearRoutes();
      for(const resident of selected.filter(r=>r.collection==='residents'&&r.walk&&!r.editor?.hidden)){
        const points=[...resident.walk,resident.walk[0]].map(([x,z])=>new THREE.Vector3(x,heightAt(x,z)+.12,z));
        routeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xffd15c,depthTest:false,transparent:true,opacity:.9})));
      }
      const positionOnly=selected.some(r=>r.collection==='worldEvents');
      if(entry&&entry.model.visible&&!locked&&(!positionOnly||p.mode==='translate')){if(transform.object!==entry.model)transform.attach(entry.model);}else transform.detach();
      const verticalOnly=p.mode==='rotate'&&selected.some(r=>r.collision?.type==='solid'||['residents','worldActions','gates'].includes(r.collection));
      transform.showX=!verticalOnly;transform.showZ=!verticalOnly;
      transform.setMode(p.mode);transform.setTranslationSnap(p.snap? .5:null);transform.setRotationSnap(p.snap?Math.PI/12:null);transform.setScaleSnap(p.snap? .1:null);
      for(const [key,e] of models)e.helper.visible=e.model.visible&&(p.selectedKeys.includes(key)||p.showBounds);
      grid.visible=p.showBounds;
    };
    let dragAxis='';
    const dragging=e=>{rt.drag=e.value;orbit.enabled=!e.value;if(e.value){drag=true;dragAxis=transform.axis||'';}else{
      const item=props.current.records.find(i=>i.key===props.current.selectedKey),obj=transform.object;if(!item||!obj)return;
      const position=obj.position.toArray();if(item.grounding!=='absolute')position[1]=props.current.mode==='translate'&&!dragAxis.includes('Y')?item.position[1]:position[1]-heightAt(position[0],position[2]);
      const rotation=obj.rotation.toArray().slice(0,3),scale=obj.scale.toArray().map(s=>Math.max(.01,s));
      if(item.collision?.type==='solid'){rotation[0]=0;rotation[2]=0;}
      const hasEvent=props.current.records.some(r=>r.collection==='worldEvents'&&props.current.selectedKeys.includes(r.key));
      props.current.onTransform(item,hasEvent?{position}:{position,rotation,scale});
    }};
    transform.addEventListener('dragging-changed',dragging);
    const start=e=>{down=[e.clientX,e.clientY];drag=false;};
    const end=e=>{
      if(drag||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5||transform.axis)return;
      const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
      if(props.current.onPlacement){const hit=ray.intersectObject(terrain,true)[0];if(hit)props.current.onPlacement([hit.point.x,0,hit.point.z]);return;}
      const hit=ray.intersectObjects([...models.values()].filter(i=>i.model.visible).map(i=>i.model),true)[0];let obj=hit?.object;while(obj&&!obj.userData.editorKey)obj=obj.parent;
      props.current.onSelect(obj?.userData.editorKey||'',e.ctrlKey||e.metaKey||e.shiftKey);
    };
    renderer.domElement.addEventListener('pointerdown',start);renderer.domElement.addEventListener('pointerup',end);
    const resize=()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(container);resize();
    const clock=new THREE.Clock();function tick(){if(!live)return;const dt=Math.min(clock.getDelta(),.05);for(const e of models.values()){e.mixer?.update(dt);e.helper.update();}orbit.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick);}rt.sync();tick();
    return()=>{live=false;runtime.current=null;cancelAnimationFrame(frame);observer.disconnect();clearRoutes();transform.removeEventListener('dragging-changed',dragging);transform.dispose();orbit.dispose();for(const entry of models.values())disposeEntry(entry);terrain.geometry.dispose();terrain.material.dispose();grid.geometry.dispose();grid.material.dispose();renderer.dispose();renderer.domElement.remove();};
  },[region.id]);
  useEffect(()=>{const rt=runtime.current,entry=rt?.models.get(selectedKey);if(!entry)return;const box=new THREE.Box3().setFromObject(entry.model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();const offset=rt.camera.position.clone().sub(rt.orbit.target).normalize().multiplyScalar(Math.max(6,size*2));rt.orbit.target.copy(center);rt.camera.position.copy(center).add(offset);rt.orbit.update();},[focusToken,selectedKey]);
  return <div className="world-editor-viewport" ref={host}>{loading&&<span className="editor-loading" role="status">Cargando modelos...</span>}{error&&<p className="admin-error" role="alert">{error}</p>}</div>;
}
