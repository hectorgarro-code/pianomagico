import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { getGameplayContent } from './gameplayContent.js';
import { createAttack, attackHits, hitTarget, followerStep } from './gameplayState.js';

export async function createWorldGameplay(scene,heightAt,options) {
  const content=getGameplayContent(), group=new THREE.Group();group.name='Gameplay_Content';scene.add(group);
  const targets=[],gates=[],bursts=[];let attack=null,pet=null,petToken=0,disposed=false;
  const libraries=await Promise.all(ASSET_CATALOG.animationLibraries.map(l=>loadCachedModel(l.url)));
  const creatureClips=libraries.flatMap(data=>data.animations).filter(c=>c.name!=='T-Pose');
  const assetById=id=>ASSET_CATALOG.assets.find(a=>a.id===id);
  const disposeModel=model=>{const skeletons=new Set();model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());model.removeFromParent();};
  const animation=(model,clips)=>{
    const mixer=new THREE.AnimationMixer(model),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let playing='';
    return {mixer,play(name,once=false){if(playing===name)return;actions[playing]?.fadeOut(.12);const action=actions[name];if(!action)return;action.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.fadeIn(.12).play();playing=name;},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}};
  };
  const collider=t=>({id:t.id,type:'solid',shape:'circle',x:t.position.x,z:t.position.z,radius:t.radius});
  const gateCollider=g=>({id:g.id,type:'solid',shape:'box',x:g.position[0],z:g.position[2],halfWidth:2.2*g.scale[0],halfDepth:.3,yaw:g.rotation[1]});
  const colliders=()=>[...targets.filter(t=>!t.defeated && t.type==='DESTRUCTIBLE').map(collider),...gates.filter(g=>!options.state().completedMinigames.includes(g.minigameId)).map(gateCollider)];
  const sync=()=>options.onColliders(colliders());
  function burst(position) {
    const count=22,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const material=new THREE.PointsMaterial({color:0xffd979,size:.15,transparent:true,opacity:1});const points=new THREE.Points(geometry,material);points.position.copy(position);group.add(points);
    bursts.push({points,geometry,material,age:0});
  }
  try {
    for(const definition of content.worldActions.filter(t=>t.enabledInWorld)) {
      const asset=assetById(definition.assetId);if(!asset)throw Error(`Missing target ${definition.assetId}`);
      const data=await loadCachedModel(asset.url);if(disposed)break;const model=clone(data.scene);model.scale.fromArray(definition.scale);model.rotation.fromArray(definition.rotation);
      const position={x:definition.position[0],y:heightAt(definition.position[0],definition.position[2])+definition.position[1],z:definition.position[2]};model.position.set(position.x,position.y,position.z);model.traverse(n=>{if(n.isMesh)n.castShadow=true;});group.add(model);
      const anim=definition.type==='WORLD_CREATURE'?animation(model,creatureClips):null;anim?.play('Idle_A');
      targets.push({...definition,model,anim,position,home:{...position},radius:.65,hits:0,defeated:false,state:'IDLE',reaction:0,phase:0,pushCooldown:0});
    }
    const gateData=await loadCachedModel('/models/props/gate.glb');
    for(const definition of content.gates.filter(g=>g.enabled)) {
      const model=clone(gateData.scene);model.scale.fromArray(definition.scale);model.rotation.fromArray(definition.rotation);model.position.set(definition.position[0],heightAt(definition.position[0],definition.position[2]),definition.position[2]);group.add(model);gates.push({...definition,model});
    }
  } catch(error) {targets.forEach(t=>{t.anim?.dispose();disposeModel(t.model);});group.removeFromParent();throw error;}
  let gateSignature='';
  async function setPet(id) {
    const token=++petToken;
    if(pet){pet.anim.dispose();disposeModel(pet.model);pet=null;}
    if(!id)return;
    const definition=content.pets.find(p=>p.id===id && p.enabled),asset=definition && assetById(definition.assetId);if(!asset)return;
    const data=await loadCachedModel(asset.url);if(disposed || token!==petToken)return;
    const model=clone(data.scene);model.scale.setScalar(.8/asset.bounds.size[1]);model.position.set(options.player().x+1,heightAt(options.player().x+1,options.player().z),options.player().z);group.add(model);pet={id,model,anim:animation(model,data.animations),stuck:0};pet.anim.play('idle');
  }
  sync();
  return {
    setPet,
    colliders,
    action(clip,duration){attack=createAttack(clip,duration);},
    get stats(){return {creatures:targets.filter(t=>t.type==='WORLD_CREATURE'&&!t.defeated).length,destructibles:targets.filter(t=>t.type==='DESTRUCTIBLE'&&!t.defeated).length,animationMixers:targets.filter(t=>t.anim&&!t.defeated).length+(pet?1:0),petFollower:pet?.id || null,activeCreatures:targets.filter(t=>t.anim&&!t.defeated&&Math.hypot(t.position.x-options.player().x,t.position.z-options.player().z)<22).length};},
    nearestGate(player){return gates.filter(g=>Math.hypot(player.x-g.position[0],player.z-g.position[2])<4 && !options.state().completedMinigames.includes(g.minigameId) && (g.requirements || []).every(id=>options.state().completedMinigames.includes(id))).sort((a,b)=>Math.hypot(player.x-a.position[0],player.z-a.position[2])-Math.hypot(player.x-b.position[0],player.z-b.position[2]))[0] || null;},
    update(delta,time,player,rotation,collisionWorld){
      const completed=options.state().completedMinigames.join('|');if(completed!==gateSignature){gateSignature=completed;gates.forEach(g=>{g.model.visible=!options.state().completedMinigames.includes(g.minigameId);});sync();}
      if(attack) {
        for(const id of attackHits(attack,delta,player,rotation,targets)) {
          const t=targets.find(t=>t.id===id);Object.assign(t,hitTarget(t));t.reaction=.6;t.anim?.play(t.defeated?'Death_A':t.hitReaction,true);
          if(t.defeated){burst(t.model.position.clone().add(new THREE.Vector3(0,1,0)));options.onReward(t.optionalReward);sync();}
        }
        if(attack.elapsed>attack.duration)attack=null;
      }
      for(const t of targets) {
        if(t.defeated){if(t.reaction<=0)continue;t.reaction-=delta;t.anim?.mixer.update(delta);if(t.reaction<=0)t.model.visible=false;continue;}
        if(Math.hypot(t.position.x-player.x,t.position.z-player.z)>22)continue;
        if(t.reaction>0){t.reaction-=delta;t.model.rotation.z=Math.sin(t.reaction*50)*.09;t.anim?.mixer.update(delta);continue;}
        t.model.rotation.z=0;
        if(!t.anim)continue;
        t.phase+=delta;t.pushCooldown=Math.max(0,t.pushCooldown-delta);
        const distance=Math.hypot(t.position.x-player.x,t.position.z-player.z),homeDistance=Math.hypot(t.position.x-t.home.x,t.position.z-t.home.z);
        let desired=t.home,speed=.6;t.state='WANDER';
        if(t.behaviorType==='stationary'){desired=t.position;speed=0;t.state='IDLE';}
        else if(distance<5 && homeDistance<4){t.state=distance<1.2?'ACTION':distance<4?'APPROACH':'NOTICE';desired=player;speed=1.3;}
        else desired={x:t.home.x+Math.sin(t.phase*.5)*1.2,z:t.home.z+Math.cos(t.phase*.5)*1.2};
        if(t.state==='ACTION') {
          t.anim.play('Throw');
          if(t.pushCooldown<=0){const dx=player.x-t.position.x,dz=player.z-t.position.z,d=Math.hypot(dx,dz)||1;Object.assign(player,collisionWorld.move(player,{x:dx/d*.3,z:dz/d*.3}));t.pushCooldown=3;}
        } else {
          const dx=desired.x-t.position.x,dz=desired.z-t.position.z,d=Math.hypot(dx,dz);
          if(d>.15 && speed){const step=Math.min(d,delta*speed);Object.assign(t.position,collisionWorld.move(t.position,{x:dx/d*step,z:dz/d*step},.32));t.model.rotation.y=Math.atan2(dx,dz);t.anim.play('Walking_A');}else t.anim.play('Idle_A');
        }
        t.position.y=heightAt(t.position.x,t.position.z);t.model.position.set(t.position.x,t.position.y,t.position.z);t.anim.mixer.update(delta);
      }
      if(pet) {
        const before={x:pet.model.position.x,z:pet.model.position.z},next=followerStep(before,player,rotation,delta,collisionWorld);
        if(!next.moving && Math.hypot(before.x-player.x,before.z-player.z)>4)pet.stuck+=delta;else pet.stuck=0;
        if(pet.stuck>2){next.x=player.x+Math.cos(rotation);next.z=player.z-Math.sin(rotation);Object.assign(next,collisionWorld.move(next,{x:0,z:0},.2));pet.stuck=0;}
        pet.model.position.set(next.x,heightAt(next.x,next.z),next.z);if(next.moving)pet.model.rotation.y=Math.atan2(next.x-before.x,next.z-before.z);pet.anim.play(next.moving?'walk':'idle');pet.anim.mixer.update(delta);
      }
      for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=delta;const points=b.geometry.attributes.position;for(let j=0;j<points.count;j++){const angle=j*2.4;points.setXYZ(j,Math.sin(angle)*b.age*2,b.age*(2+j%3*.2)-b.age*b.age,Math.cos(angle)*b.age*2);}points.needsUpdate=true;b.material.opacity=1-b.age;if(b.age>1){b.points.removeFromParent();b.geometry.dispose();b.material.dispose();bursts.splice(i,1);}}
    },
    dispose(){disposed=true;petToken++;targets.forEach(t=>{t.anim?.dispose();disposeModel(t.model);});gates.forEach(g=>disposeModel(g.model));if(pet){pet.anim.dispose();disposeModel(pet.model);}bursts.forEach(b=>{b.geometry.dispose();b.material.dispose();});group.removeFromParent();}
  };
}
