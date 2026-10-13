import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {loadCharacterPresentation,hideEquipment} from '../presentation/characterEquipment.js';
import {getValleyProgress} from '../adventure/valleyProgression.js';
import {moveWithBodies} from './creatureEncounter.js';
import {WORLD_RESIDENTS} from '../world/composition/friendlyComposition.js';
import {createResidentBehavior,stepResident,RESIDENT_CLIPS} from './residentBehavior.js';
import {FIRST_MINUTES as F,firstMinutesStarted} from './firstMinutes.js';
import {getGameplayContent} from './gameplayContent.js';

export async function createWorldResidents(parent,heightAt,options){
  const group=new THREE.Group();group.name='Friendly_Residents';parent.add(group);
  const residents=[],bubbleMaterials=new Map();let previousAdventure=null,completedRegions=[],completedObjects=new Set();
  function bubble(text){
    if(bubbleMaterials.has(text))return bubbleMaterials.get(text).material;
    const canvas=document.createElement('canvas');canvas.width=192;canvas.height=96;const context=canvas.getContext('2d');
    context.fillStyle='#173c46dd';context.beginPath();context.roundRect(4,4,184,88,20);context.fill();context.fillStyle='#fff0ab';context.font='52px Segoe UI Emoji, sans-serif';context.textAlign='center';context.fillText(text,96,68);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});bubbleMaterials.set(text,{texture,material});return material;
  }
  function cleanup(){for(const resident of residents){resident.mixer.stopAllAction();resident.mixer.uncacheRoot(resident.model);const skeletons=new Set();resident.model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());}for(const {texture,material} of bubbleMaterials.values()){texture.dispose();material.dispose();}group.removeFromParent();}
  try{for(const definition of getGameplayContent().residents || WORLD_RESIDENTS){
    const data=await loadCharacterPresentation(definition.characterId),model=clone(data.scene);hideEquipment(model);model.scale.setScalar(definition.scale);
    const position={x:definition.position[0],y:heightAt(definition.position[0],definition.position[2])+definition.position[1],z:definition.position[2]};model.position.set(position.x,position.y,position.z);model.rotation.y=definition.rotation;model.userData.friendlyResident=definition.id;
    model.traverse(n=>{if(n.isMesh)n.castShadow=true;if(n.isSkinnedMesh)n.frustumCulled=false;});group.add(model);
    const mixer=new THREE.AnimationMixer(model),actions=Object.fromEntries(data.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
    const icon=new THREE.Sprite(bubble('\u266a ?'));icon.scale.set(1.6,.8,1);icon.visible=false;group.add(icon);
    residents.push({definition,model,mixer,actions,icon,position,memory:createResidentBehavior(),clip:null,state:'IDLE',budget:0,pathIndex:1});
  }}catch(error){cleanup();throw error;}
  const bodies=()=>residents.map(r=>({id:r.definition.id,x:r.position.x,z:r.position.z,radius:r.definition.radius}));
  return {
    bodies,
    update(delta,player,collisionWorld,playerHit=false){
      const adventure=options.adventure();let newlyCompleted=new Set();
      if(adventure&&adventure!==previousAdventure){const next=new Set(Object.entries(adventure.entries).filter(([,e])=>e.state==='COMPLETED').map(([id])=>id));newlyCompleted=new Set([...next].filter(id=>!completedObjects.has(id)));completedObjects=next;completedRegions=getValleyProgress(adventure).completedRegions;previousAdventure=adventure;}
      for(const resident of residents){
        const {definition,model,position}=resident,distance=Math.hypot(position.x-player.x,position.z-player.z);
        model.visible=distance<45;if(distance>=45){resident.icon.visible=false;continue;}
        resident.budget+=delta;if(distance>20&&resident.budget<.25)continue;const step=Math.min(.3,resident.budget);resident.budget=0;
        const goalComplete=definition.goal&&adventure?.toy?.collectedNotes.includes(definition.goal.noteId);
        const introRestored=firstMinutesStarted(adventure)&&definition.regionId==='PLAZA_DE_LAS_NOTAS'?adventure.valley.milestones.includes(F.restored):null;
        const pose=stepResident(resident.memory,{distance,hasGoal:!!definition.goal,goalComplete,regionComplete:introRestored??completedRegions.includes(definition.regionId),nearbyComplete:definition.watch?.some(id=>newlyCompleted.has(id)),playerHit,walking:!!definition.walk},step);
        resident.state=pose.state;
        let target=pose.state==='POINT'?{x:definition.goal.position[0],z:definition.goal.position[2]}:pose.near?player:null;
        let moving=false;
        if(pose.state==='WALK'){
          const point=definition.walk[resident.pathIndex],dx=point[0]-position.x,dz=point[1]-position.z,length=Math.hypot(dx,dz);
          if(length<.2)resident.pathIndex=(resident.pathIndex+1)%definition.walk.length;
          else{const amount=Math.min(length,step*.7),old={...position};Object.assign(position,moveWithBodies(position,{x:dx/length*amount,z:dz/length*amount},collisionWorld,[...options.bodies().filter(b=>b.id!==definition.id),{x:player.x,z:player.z,radius:.34}],definition.radius));moving=Math.hypot(position.x-old.x,position.z-old.z)>.001;target={x:point[0],z:point[1]};}
        }
        if(target){const desired=Math.atan2(target.x-position.x,target.z-position.z);model.rotation.y+=Math.atan2(Math.sin(desired-model.rotation.y),Math.cos(desired-model.rotation.y))*Math.min(1,step*5);}
        position.y=heightAt(position.x,position.z)+definition.position[1];model.position.set(position.x,position.y,position.z);
        const intent=pose.state==='WALK'&&!moving?'IDLE':pose.state,clip=RESIDENT_CLIPS[intent].find(name=>resident.actions[name]);
        if(clip&&clip!==resident.clip){resident.actions[resident.clip]?.fadeOut(.2);resident.actions[clip].reset().setLoop(THREE.LoopRepeat,Infinity).fadeIn(.2).play();resident.clip=clip;}
        resident.mixer.update(step);resident.icon.visible=!!pose.bubble;
        if(pose.bubble){resident.icon.material=bubble(pose.bubble);resident.icon.position.set(position.x,position.y+3,position.z);}
      }
    },
    get stats(){return {residents:residents.length,activeResidents:residents.filter(r=>r.model.visible).length,residentStates:residents.filter(r=>r.model.visible).map(r=>({id:r.definition.id,state:r.state}))};},
    dispose:cleanup,
  };
}
