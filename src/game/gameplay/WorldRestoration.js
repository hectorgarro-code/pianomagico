import * as THREE from 'three';
import {loadCachedModel} from '../assets/assetManifest.js';
import {createRestorationPresentation,restorationLevel} from './worldRestorationState.js';
import {RESTORATION_DURATION} from '../world/composition/worldRestoration.js';

export async function createWorldRestoration(scene,heightAt,options){
  const group=new THREE.Group();group.name='World_Restoration';scene.add(group);
  const timeline=createRestorationPresentation(options.adventure?.());
  const ownedMaterials=[],ownedGeometry=[],ownedTextures=[],ownedInstances=[],replacements=[],modified=[];
  const objects=new Map();scene.traverse(n=>{if(n.userData.compositionId)objects.set(n.userData.compositionId,n);});
  const material=m=>{ownedMaterials.push(m);return m;};
  const geometry=g=>{ownedGeometry.push(g);return g;};
  function texture(kind){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.clearRect(0,0,128,128);
    if(kind==='flower'){
      ctx.fillStyle='#ffc5df';for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.ellipse(64+Math.cos(a)*24,64+Math.sin(a)*24,22,14,a,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle='#fff2a6';ctx.beginPath();ctx.arc(64,64,14,0,Math.PI*2);ctx.fill();
    }else{ctx.font='bold 100px serif';ctx.textAlign='center';ctx.fillStyle='#ffffff';ctx.shadowColor='#ffffff';ctx.shadowBlur=8;ctx.fillText('\u266a',64,104);}
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;ownedTextures.push(map);return map;
  }
  const noteTexture=texture('note'),flowerTexture=texture('flower');
  const ringGeometry=geometry(new THREE.RingGeometry(.96,1,64));
  const flowerGeometry=geometry(new THREE.PlaneGeometry(.65,.65));
  const beamGeometry=geometry(new THREE.PlaneGeometry(.2,7));
  let offData,litData;
  try{[offData,litData]=await Promise.all([
    loadCachedModel('/models/props/Assets/gltf/torch.gltf'),loadCachedModel('/models/props/Assets/gltf/torch_lit.gltf')]);
    for(const state of timeline.states){
      const definition=state.definition,root=new THREE.Group();root.name='Restoration:'+definition.id;group.add(root);
      state.root=root;state.accents=[];state.bindings=[];
      const color=new THREE.Color(definition.color);
      const notesGeometry=geometry(new THREE.BufferGeometry());notesGeometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(24*3),3));
      const notesMaterial=material(new THREE.PointsMaterial({color:definition.flowers?0xffdf86:definition.color,map:noteTexture,size:.8,transparent:true,depthWrite:false,opacity:0}));
      state.notesMesh=new THREE.Points(notesGeometry,notesMaterial);state.notesMesh.frustumCulled=false;root.add(state.notesMesh);
      definition.anchors.forEach(([x,z],index)=>{
        const y=definition.water?-1.11:heightAt(x,z);
        const accent=new THREE.Group();accent.position.set(x,y,z);root.add(accent);
        if(definition.flowers){
          const m=material(new THREE.MeshBasicMaterial({map:flowerTexture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
          const flowers=new THREE.InstancedMesh(flowerGeometry,m,4),matrix=new THREE.Matrix4();
          [[0,0],[.8,.4],[-.7,.6],[.2,-.8]].forEach(([dx,dz],i)=>{matrix.makeRotationX(-Math.PI/2);matrix.setPosition(dx,heightAt(x+dx,z+dz)-y+.08,dz);flowers.setMatrixAt(i,matrix);});ownedInstances.push(flowers);accent.add(flowers);
        }else if(definition.water){
          const ripple=new THREE.Mesh(ringGeometry,material(new THREE.MeshBasicMaterial({color:0xc6f8ff,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false})));ripple.rotation.x=-Math.PI/2;accent.add(ripple);
        }else{
          const rune=new THREE.Sprite(material(new THREE.SpriteMaterial({map:noteTexture,color:definition.color,transparent:true,depthWrite:false})));rune.position.y=definition.torches?2.2:2.8;rune.scale.set(.8,1,1);accent.add(rune);
          if(definition.final){const beam=new THREE.Mesh(beamGeometry,material(new THREE.MeshBasicMaterial({color:definition.color,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})));beam.position.y=3.5;accent.add(beam);}
        }
        state.accents.push({node:accent,index});
        if(definition.torches){
          const off=offData.scene.clone(true),lit=litData.scene.clone(true);off.position.set(x,y,z);lit.position.copy(off.position);off.scale.setScalar(.8);lit.scale.copy(off.scale);root.add(off,lit);
          state.accents.push({off,lit,index});
        }
      });
      for(const [index,id] of (definition.existingTorches||[]).entries()){
        const lit=objects.get(id);if(!lit)continue;
        const off=offData.scene.clone(true);off.position.copy(lit.position);off.rotation.copy(lit.rotation);off.scale.copy(lit.scale);lit.parent.add(off);
        replacements.push({off,lit,visible:lit.visible});state.accents.push({off,lit,index});
      }
      for(const [index,id] of (definition.bindings||[]).entries())objects.get(id)?.traverse(n=>{
        if(!n.isMesh)return;const original=n.material;
        const copies=(Array.isArray(original)?original:[original]).map(m=>{const copy=material(m.clone());state.bindings.push({copy,color:copy.color?.clone(),emissive:copy.emissive?.clone(),intensity:copy.emissiveIntensity,colorTarget:color,index});return copy;});
        n.material=Array.isArray(original)?copies:copies[0];modified.push({node:n,original});
      });
      const waveGeometry=geometry(ringGeometry.clone().rotateX(-Math.PI/2));state.waveBase=waveGeometry.attributes.position.array.slice();
      state.wave=new THREE.Mesh(waveGeometry,material(new THREE.MeshBasicMaterial({color:definition.color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})));state.wave.frustumCulled=false;state.wave.visible=false;root.add(state.wave);
    }
    const water=scene.getObjectByName('River_Water');
    if(water){const original=water.material;water.material=material(original.clone());modified.push({node:water,original});timeline.states.find(s=>s.definition.water).water={node:water,color:original.color.clone(),roughness:original.roughness};}
    const light=scene.getObjectByName('summit-light'),originalIntensity=light?.intensity;
    let disposed=false;
    const runtime={
      update(delta,time,player){
        if(disposed)return;
        const started=timeline.update(options.adventure?.(),delta,player);
        for(const id of started)options.onRestored?.(id);
        for(const state of timeline.states){
          const {definition}=state,level=restorationLevel(state),near=Math.hypot(player.x-definition.center[0],player.z-definition.center[1])<38;
          state.root.visible=near;
          for(const accent of state.accents){const amount=restorationLevel(state,accent.index,definition.anchors.length);
            if(accent.node){accent.node.visible=amount>.001;accent.node.scale.setScalar(Math.max(.01,amount));if(definition.water){const phase=(time*.65+accent.index*.22)%1;accent.node.scale.setScalar((.25+phase*1.25)*amount);accent.node.children[0].material.opacity=(1-phase)*.5*amount;}}
            if(accent.lit){accent.lit.visible=amount>.45;accent.off.visible=amount<=.45;}
          }
          for(const b of state.bindings){const amount=restorationLevel(state,b.index,state.bindings.length);if(b.copy.emissive){b.copy.emissive.copy(b.emissive).lerp(b.colorTarget,amount*.35);b.copy.emissiveIntensity=b.intensity+amount*.45;}}
          state.notesMesh.visible=state.target&&near;state.notesMesh.material.opacity=level*.7;
          if(state.notesMesh.visible){const positions=state.notesMesh.geometry.attributes.position;
            for(let i=0;i<positions.count;i++){const anchor=definition.anchors[i%definition.anchors.length],angle=i*2.4+time*.15,radius=.4+i%3*.6;
              positions.setXYZ(i,anchor[0]+Math.cos(angle)*radius,(definition.water?-1.1:heightAt(anchor[0],anchor[1]))+.5+(time*.45+i*.19)%3.4,anchor[1]+Math.sin(angle)*radius);
            }positions.needsUpdate=true;
          }
          state.wave.visible=state.target&&state.age<RESTORATION_DURATION&&near;
          if(state.wave.visible){
            state.wave.position.set(state.origin.x,0,state.origin.z);const radius=.5+state.age*5,vertices=state.wave.geometry.attributes.position;
            for(let i=0;i<vertices.count;i++){const x=state.waveBase[i*3]*radius,z=state.waveBase[i*3+2]*radius;vertices.setXYZ(i,x,heightAt(state.origin.x+x,state.origin.z+z)+.12,z);}vertices.needsUpdate=true;
            state.wave.material.opacity=.7*(1-state.age/RESTORATION_DURATION);
          }
          if(state.water){state.water.node.material.color.copy(state.water.color).lerp(new THREE.Color(0x47dbdf),level);state.water.node.material.roughness=state.water.roughness-level*.14;}
          if(definition.final&&light)light.intensity=4+(originalIntensity-4)*level;
          if(state.target&&state.age<RESTORATION_DURATION){while(state.notes<4&&state.age>=state.notes*.55){if(near)options.onNote?.(definition.motif[state.notes],.65);state.notes++;}}
          if(state.target&&!state.settled&&state.age>=RESTORATION_DURATION){state.settled=true;options.onSettled?.(definition.id);}
        }
      },
      get stats(){return timeline.states.map(s=>({id:s.definition.id,restored:s.target,level:restorationLevel(s),celebrating:s.target&&s.age<RESTORATION_DURATION}));},
      dispose(){if(disposed)return;disposed=true;modified.forEach(({node,original})=>{node.material=original;});replacements.forEach(({off,lit,visible})=>{off.removeFromParent();lit.visible=visible;});if(light)light.intensity=originalIntensity;ownedInstances.forEach(n=>n.dispose());ownedMaterials.forEach(m=>m.dispose());ownedGeometry.forEach(g=>g.dispose());ownedTextures.forEach(t=>t.dispose());group.removeFromParent();},
    };
    runtime.update(0,0,options.player());return runtime;
  }catch(error){modified.forEach(({node,original})=>{node.material=original;});replacements.forEach(({off,lit,visible})=>{off.removeFromParent();lit.visible=visible;});ownedInstances.forEach(n=>n.dispose());ownedMaterials.forEach(m=>m.dispose());ownedGeometry.forEach(g=>g.dispose());ownedTextures.forEach(t=>t.dispose());group.removeFromParent();throw error;}
}
