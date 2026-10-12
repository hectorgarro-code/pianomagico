import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { getGameplayContent } from './gameplayContent.js';
import { createAttack, attackHits, hitTarget, followerStep } from './gameplayState.js';
import { creatureStep, moveWithBodies, ENCOUNTER } from './creatureEncounter.js';

export async function createWorldGameplay(scene,heightAt,options) {
  const content=getGameplayContent(), group=new THREE.Group();group.name='Gameplay_Content';scene.add(group);
  const targets=[],gates=[],bursts=[];let attack=null,pet=null,petToken=0,disposed=false,impact=null,immunity=0,playerHits=0;
  const libraries=await Promise.all(ASSET_CATALOG.animationLibraries.map(l=>loadCachedModel(l.url)));
  const creatureClips=libraries.flatMap(data=>data.animations).filter(c=>c.name!=='T-Pose');
  const assetById=id=>ASSET_CATALOG.assets.find(a=>a.id===id);
  const disposeModel=model=>{const skeletons=new Set();model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());model.removeFromParent();};
  const animation=(model,clips)=>{
    const mixer=new THREE.AnimationMixer(model),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let playing='';
    return {mixer,play(name,once=false){if(playing===name && !once)return;const action=actions[name];if(!action)return;actions[playing]?.fadeOut(.12);action.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.fadeIn(.12).play();playing=name;},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}};
  };
  const collider=t=>({id:t.id,type:'solid',shape:'circle',x:t.position.x,z:t.position.z,radius:t.radius});
  const gateCollider=g=>({id:g.id,type:'solid',shape:'box',x:g.position[0],z:g.position[2],halfWidth:2.2*g.scale[0],halfDepth:.3,yaw:g.rotation[1]});
  const colliders=()=>[...targets.filter(t=>!t.defeated && t.type==='DESTRUCTIBLE').map(collider),...gates.filter(g=>!options.state().completedMinigames.includes(g.minigameId)).map(gateCollider)];
  const sync=()=>options.onColliders(colliders());
  const bodies=(except=null)=>targets.filter(t=>t!==except && t.type==='WORLD_CREATURE' && !t.defeated).map(t=>({x:t.position.x,z:t.position.z,radius:t.radius}));
  function burst(position) {
    const count=22,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const material=new THREE.PointsMaterial({color:0xffd979,size:.15,transparent:true,opacity:1});const points=new THREE.Points(geometry,material);points.position.copy(position);group.add(points);
    bursts.push({points,geometry,material,age:0});
  }
  try {
    for(const definition of content.worldActions.filter(t=>t.enabledInWorld)) {
      const asset=assetById(definition.assetId);if(!asset)throw Error(`Missing target ${definition.assetId}`);
      const data=await loadCachedModel(asset.url);if(disposed)break;const model=clone(data.scene);model.scale.fromArray(definition.scale);model.rotation.fromArray(definition.rotation);
      const position={x:definition.position[0],y:heightAt(definition.position[0],definition.position[2])+definition.position[1],z:definition.position[2]};model.position.set(position.x,position.y,position.z);model.traverse(n=>{if(n.isMesh)n.castShadow=true;if(n.isSkinnedMesh)n.frustumCulled=false;});group.add(model);
      const anim=definition.type==='WORLD_CREATURE'?animation(model,creatureClips):null;anim?.play('Idle_A');
      targets.push({...definition,model,anim,position,home:{...position},radius:anim?.45:.65,hits:0,defeated:false,state:'IDLE',reaction:0,phase:0,strike:null});
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
    movePlayer(position, displacement, world){return moveWithBodies(position,displacement,world,bodies());},
    get staggered(){return !!impact;},
    combatFocus(player){return targets.filter(t=>t.anim&&!t.defeated&&['CHASE','ATTACK','HIT_REACTION'].includes(t.state)&&Math.hypot(t.position.x-player.x,t.position.z-player.z)<8).sort((a,b)=>Math.hypot(a.position.x-player.x,a.position.z-player.z)-Math.hypot(b.position.x-player.x,b.position.z-player.z))[0]?.position || null;},
    action(clip,duration){attack=createAttack(clip,duration);},
    get stats(){return {creatures:targets.filter(t=>t.type==='WORLD_CREATURE'&&!t.defeated).length,destructibles:targets.filter(t=>t.type==='DESTRUCTIBLE'&&!t.defeated).length,animationMixers:targets.filter(t=>t.anim&&!t.defeated).length+(pet?1:0),petFollower:pet?.id || null,activeCreatures:targets.filter(t=>t.anim&&!t.defeated&&Math.hypot(t.position.x-options.player().x,t.position.z-options.player().z)<22).length,chasingCreatures:targets.filter(t=>t.state==='CHASE'&&!t.defeated).length,attackingCreatures:targets.filter(t=>t.state==='ATTACK'&&!t.defeated).length,playerHits,playerStaggered:!!impact};},
    nearestGate(player){return gates.filter(g=>Math.hypot(player.x-g.position[0],player.z-g.position[2])<4 && !options.state().completedMinigames.includes(g.minigameId) && (g.requirements || []).every(id=>options.state().completedMinigames.includes(id))).sort((a,b)=>Math.hypot(player.x-a.position[0],player.z-a.position[2])-Math.hypot(player.x-b.position[0],player.z-b.position[2]))[0] || null;},
    update(delta,time,player,rotation,collisionWorld){
      Object.assign(player,moveWithBodies(player,{x:0,z:0},collisionWorld,bodies()));
      immunity=Math.max(0,immunity-delta);
      if(impact) {
        const step=Math.min(delta,ENCOUNTER.stagger-impact.elapsed),speed=8*(1-impact.elapsed/ENCOUNTER.stagger);
        Object.assign(player,moveWithBodies(player,{x:impact.x*speed*step,z:impact.z*speed*step},collisionWorld,bodies()));
        impact.elapsed+=step;if(impact.elapsed>=ENCOUNTER.stagger)impact=null;
      }
      const completed=options.state().completedMinigames.join('|');if(completed!==gateSignature){gateSignature=completed;gates.forEach(g=>{g.model.visible=!options.state().completedMinigames.includes(g.minigameId);});sync();}
      if(attack) {
        for(const id of attackHits(attack,delta,player,rotation,targets)) {
          const t=targets.find(t=>t.id===id);Object.assign(t,hitTarget(t));t.strike=null;t.reaction=t.defeated?1.2:.6;t.anim?.play(t.defeated?'Death_A':t.hitReaction,true);
          if(!t.defeated)burst(t.model.position.clone().add(new THREE.Vector3(0,1,0)));
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
        t.phase+=delta;
        const decision=creatureStep(t,player,delta);t.state=decision.state;
        if(t.state==='ATTACK') {
          if(decision.started){t.model.rotation.y=Math.atan2(decision.direction.x,decision.direction.z);t.anim.play('Throw',true);}
          if(decision.hit && immunity<=0){
            const dx=player.x-t.position.x,dz=player.z-t.position.z,d=Math.hypot(dx,dz)||1;
            impact={x:dx/d,z:dz/d,elapsed:0};immunity=ENCOUNTER.immunity;attack=null;playerHits++;
            options.onPlayerHit?.();burst(new THREE.Vector3(player.x,player.y+.8,player.z));
          }
        } else {
          const {desired=t.position,speed=0}=decision;
          const dx=desired.x-t.position.x,dz=desired.z-t.position.z,d=Math.hypot(dx,dz);
          if(d>.15 && speed){const step=Math.min(d,delta*speed);const obstacles=[...bodies(t),{x:player.x,z:player.z,radius:.34}];Object.assign(t.position,moveWithBodies(t.position,{x:dx/d*step,z:dz/d*step},collisionWorld,obstacles,t.radius));t.model.rotation.y=Math.atan2(dx,dz);t.anim.play('Walking_A');}else t.anim.play('Idle_A');
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
