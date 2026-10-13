import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSET_CATALOG } from '../assets/assetCatalog.js';
import { loadCachedModel } from '../assets/assetManifest.js';
import { getGameplayContent } from './gameplayContent.js';
import { createAttack, attackHits, hitTarget } from './gameplayState.js';
import {createCompanion, companionProfile, companionStep, companionClip, reactCompanion} from './companionBehavior.js';
import { creatureStep, moveWithBodies, ENCOUNTER } from './creatureEncounter.js';
import {PLAZA_COMPOSITION} from '../world/composition/plazaComposition.js';
import {FOREST_COMPOSITION} from '../world/composition/forestComposition.js';
import {toyWorldActions} from '../world/composition/toyComposition.js';
import {createWorldCollectibles} from './WorldCollectibles.js';
import {createWorldMusicMechanisms} from './WorldMusicMechanisms.js';
import {createWorldResidents} from './WorldResidents.js';
import {EXPLORATION_MECHANISMS} from '../world/composition/explorationSecrets.js';
import {createWorldRestoration} from './WorldRestoration.js';
import {FIRST_MINUTES as F,firstTargetActive,firstMinutesPhase,firstMinutesStarted} from './firstMinutes.js';
const hitColor=new THREE.Color(0xfff5cb),hitEmissive=new THREE.Color(0xffd979);

export async function createWorldGameplay(scene,heightAt,options) {
  const content=getGameplayContent(), group=new THREE.Group();group.name='Gameplay_Content';scene.add(group);
  const targets=[],gates=[],bursts=[];let attack=null,pet=null,petToken=0,disposed=false,impact=null,immunity=0,playerHits=0;
  const defeatedToy=new Set(options.adventure?.()?.toy?.defeatedTargets || []);
  let collectibles=null,music=null,residents=null,restoration=null;
  let pendingCompanionEvent=null,loadingPetId=null;
  const knownDiscoveries=new Set(options.adventure?.()?.valley?.discoveries||[]);
  const libraries=await Promise.all(ASSET_CATALOG.animationLibraries.map(l=>loadCachedModel(l.url)));
  const creatureClips=libraries.flatMap(data=>data.animations).filter(c=>c.name!=='T-Pose');
  const assetById=id=>ASSET_CATALOG.assets.find(a=>a.id===id);
  const disposeModel=model=>{const skeletons=new Set();model.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());model.removeFromParent();};
  const animation=(model,clips)=>{
    const mixer=new THREE.AnimationMixer(model),actions=Object.fromEntries(clips.map(c=>[c.name,mixer.clipAction(c)]));let playing='';
    return {mixer,play(name,once=false){if(playing===name && !once)return;const action=actions[name];if(!action)return;actions[playing]?.fadeOut(.12);action.reset().setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.fadeIn(.12).play();playing=name;},dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);}};
  };
  const collider=t=>({id:t.id,type:'solid',shape:'circle',x:t.position.x,z:t.position.z,radius:t.radius});
  const gateCollider=g=>({id:g.id,type:'solid',shape:'box',x:g.position[0],z:g.position[2],halfWidth:2.2*g.scale[0],halfDepth:.3*g.scale[2],yaw:g.rotation[1]});
  const targetActive=t=>firstTargetActive(t,options.adventure?.())&&!(firstMinutesStarted(options.adventure?.())&&firstMinutesPhase(options.adventure?.())!=='DONE'&&['toy-plaza-box','toy-plaza-barrel'].includes(t.id));
  const colliders=()=>[...targets.filter(t=>targetActive(t)&&!t.defeated && t.type==='DESTRUCTIBLE').map(collider),...gates.filter(g=>!options.state().completedMinigames.includes(g.minigameId)).map(gateCollider),...(music?.colliders()||[])];
  const sync=()=>options.onColliders(colliders());
  const bodies=(except=null)=>[...targets.filter(t=>targetActive(t)&&t!==except && t.type==='WORLD_CREATURE' && !t.defeated).map(t=>({x:t.position.x,z:t.position.z,radius:t.radius})),...(residents?.bodies()||[])];
  function burst(position) {
    const count=22,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const material=new THREE.PointsMaterial({color:0xffd979,size:.15,transparent:true,opacity:1});const points=new THREE.Points(geometry,material);points.position.copy(position);group.add(points);
    bursts.push({points,geometry,material,age:0});
  }
  try {
    for(const definition of toyWorldActions(content,[PLAZA_COMPOSITION,FOREST_COMPOSITION]).filter(t=>t.enabledInWorld)) {
      if(defeatedToy.has(definition.id))continue;
      const asset=assetById(definition.assetId);if(!asset)throw Error(`Missing target ${definition.assetId}`);
      const data=await loadCachedModel(asset.url);if(disposed)break;const model=clone(data.scene);model.scale.fromArray(definition.scale);model.rotation.fromArray(definition.rotation);
      const position={x:definition.position[0],y:heightAt(definition.position[0],definition.position[2])+definition.position[1],z:definition.position[2]};model.position.set(position.x,position.y,position.z);model.traverse(n=>{if(n.isMesh)n.castShadow=true;if(n.isSkinnedMesh)n.frustumCulled=false;});group.add(model);
      const anim=definition.type==='WORLD_CREATURE'?animation(model,creatureClips):null;anim?.play('Idle_A');
      const owned=[];model.traverse(node=>{if(!node.isMesh)return;const originals=Array.isArray(node.material)?node.material:[node.material];const copies=originals.map(material=>{const copy=material.clone();owned.push({copy,color:copy.color?.clone(),emissive:copy.emissive?.clone(),intensity:copy.emissiveIntensity});return copy;});node.material=Array.isArray(node.material)?copies:copies[0];});
      let cue=null;
      if(definition.explorationSecretId&&typeof document!=='undefined'){
        const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
        const ctx=canvas.getContext('2d');ctx.font='bold 100px serif';ctx.textAlign='center';ctx.fillStyle='#ffe6a0';ctx.fillText('\u266a',64,100);
        const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
        const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:.4});
        const sprite=new THREE.Sprite(material);sprite.position.y=1.1;sprite.scale.set(.7,.7,1);model.add(sprite);cue={sprite,texture,material};
      }
      model.visible=targetActive(definition);
      targets.push({...definition,model,anim,position,home:{...position},radius:definition.radius||(anim?.45:.65),baseScale:model.scale.clone(),owned,cue,flash:0,hits:0,defeated:false,state:'IDLE',reaction:0,phase:0,strike:null});
    }
    const gateData=await loadCachedModel('/models/props/gate.glb');
    for(const definition of content.gates.filter(g=>g.enabled)) {
      const model=clone(gateData.scene);model.scale.fromArray(definition.scale);model.rotation.fromArray(definition.rotation);model.position.set(definition.position[0],heightAt(definition.position[0],definition.position[2])+definition.position[1],definition.position[2]);model.visible=!options.state().completedMinigames.includes(definition.minigameId);group.add(model);gates.push({...definition,model});
    }
  } catch(error) {targets.forEach(t=>{t.anim?.dispose();t.cue?.texture.dispose();t.cue?.material.dispose();t.owned?.forEach(o=>o.copy.dispose());disposeModel(t.model);});group.removeFromParent();throw error;}
  let gateSignature='',targetSignature='';
  const companionEvent=(event,position)=>{
    if(pet)reactCompanion(pet.behavior,event,position);
    else if(event==='LESSON_COMPLETED'&&loadingPetId)pendingCompanionEvent=event;
  };
  async function setPet(id) {
    const token=++petToken;
    loadingPetId=id;
    if(pet){pet.anim.dispose();disposeModel(pet.model);pet=null;}
    if(!id){pendingCompanionEvent=null;return;}
    const definition=content.pets.find(p=>p.id===id && p.enabled),asset=definition && assetById(definition.assetId);if(!asset){loadingPetId=null;pendingCompanionEvent=null;return;}
    let data;
    try{data=await loadCachedModel(asset.url);}catch(error){if(token===petToken){loadingPetId=null;pendingCompanionEvent=null;}throw error;}
    if(disposed || token!==petToken)return;
    loadingPetId=null;
    const model=clone(data.scene);model.name='Companion:'+id;model.scale.setScalar(.8/asset.bounds.size[1]);model.position.set(options.player().x+1,heightAt(options.player().x+1,options.player().z),options.player().z);group.add(model);
    pet={id,model,anim:animation(model,data.animations),clips:data.animations.map(c=>c.name),behavior:createCompanion(definition.behaviorProfile||companionProfile(definition.assetId)),clip:null,interactionAfter:0};
    pet.anim.play(companionClip(pet.behavior,pet.clips));
    if(pendingCompanionEvent){reactCompanion(pet.behavior,pendingCompanionEvent);pendingCompanionEvent=null;}
  }
  sync();
  if(typeof document!=='undefined')collectibles=createWorldCollectibles(group,heightAt,{
    adventure:()=>options.adventure?.(),onCollect:note=>{options.onToyEvent?.({type:'LOST_NOTE_COLLECTED',id:note.id});options.onNoteSound?.(note.pitch,note.position);companionEvent('NOTE_COLLECTED');},onBurst:position=>burst(position),
    onSecret:(id,position)=>{companionEvent('SECRET_DISCOVERED');burst(position);options.onSecretFound?.(id,position);},
  });
  if(typeof document!=='undefined')music=await createWorldMusicMechanisms(group,heightAt,EXPLORATION_MECHANISMS,{
    adventure:()=>options.adventure?.(),onToyEvent:event=>options.onToyEvent?.(event),onNoteSound:(pitch,position)=>options.onNoteSound?.(pitch,position),onFocus:focused=>options.onMusicalFocus?.(focused),onBurst:burst,
    onOpened:definition=>options.onGateOpened?.({id:definition.id,position:definition.position}),onColliders:sync,
  });
  sync();
  return {
    async prepareResidents(){if(typeof document!=='undefined'){
      const created=await createWorldResidents(group,heightAt,{adventure:()=>options.adventure?.(),bodies:()=>bodies()});if(disposed){created.dispose();return;}residents=created;
      const restored=await createWorldRestoration(scene,heightAt,{adventure:()=>options.adventure?.(),player:options.player,
        onNote:(pitch,volume)=>options.onRestorationNote?.(pitch,volume),onRestored:()=>companionEvent('REGION_RESTORED'),onSettled:id=>options.onRestorationSettled?.(id)});
      if(disposed)restored.dispose();else restoration=restored;
    }},
    get restorationStats(){return restoration?.stats||[];},
    musicPointer(x,y,camera){return music?.pointer(x,y,camera)||false;},
    musicKey(index){return music?.key(index)||false;},
    get musicStats(){return music?.stats||[];},
    get residentStats(){return residents?.stats||{};},
    musicFocus(){return music?.focus()||null;},
    setPet,
    companionEvent,
    interactPet(){
      if(!pet || impact || pet.behavior.elapsed<pet.interactionAfter || Math.hypot(pet.model.position.x-options.player().x,pet.model.position.z-options.player().z)>2.8)return false;
      pet.interactionAfter=pet.behavior.elapsed+2;companionEvent('PET_INTERACTION');
      burst(pet.model.position.clone().add(new THREE.Vector3(0,.8,0)));return true;
    },
    get companionStats(){return pet?{id:pet.id,profile:pet.behavior.profile,state:pet.behavior.state,clip:pet.clip,recoveries:pet.behavior.recoveries,position:pet.model.position.toArray()}:null;},
    colliders,
    introTarget(){const phase=firstMinutesPhase(options.adventure?.());return targets.find(t=>!t.defeated&&targetActive(t)&&t.id===(phase==='BREAK'?F.box:phase==='DEFEND'?F.enemy:null))?.position||null;},
    movePlayer(position, displacement, world){return moveWithBodies(position,displacement,world,bodies());},
    get staggered(){return !!impact;},
    combatFocus(player){return targets.filter(t=>t.anim&&!t.defeated&&['CHASE','ATTACK','HIT_REACTION'].includes(t.state)&&Math.hypot(t.position.x-player.x,t.position.z-player.z)<8).sort((a,b)=>Math.hypot(a.position.x-player.x,a.position.z-player.z)-Math.hypot(b.position.x-player.x,b.position.z-player.z))[0]?.position || null;},
    action(clip,duration){attack=createAttack(clip,duration);},
    get stats(){return {creatures:targets.filter(t=>t.type==='WORLD_CREATURE'&&!t.defeated).length,destructibles:targets.filter(t=>t.type==='DESTRUCTIBLE'&&!t.defeated).length,animationMixers:targets.filter(t=>t.anim&&!t.defeated).length+(pet?1:0),petFollower:pet?.id || null,activeCreatures:targets.filter(t=>t.anim&&!t.defeated&&Math.hypot(t.position.x-options.player().x,t.position.z-options.player().z)<22).length,chasingCreatures:targets.filter(t=>t.state==='CHASE'&&!t.defeated).length,attackingCreatures:targets.filter(t=>t.state==='ATTACK'&&!t.defeated).length,playerHits,playerStaggered:!!impact,lostNotes:collectibles?.count||0,toyDefeated:defeatedToy.size};},
    nearestGate(player){return gates.filter(g=>Math.hypot(player.x-g.position[0],player.z-g.position[2])<4 && !options.state().completedMinigames.includes(g.minigameId) && (g.requirements || []).every(id=>options.state().completedMinigames.includes(id))).sort((a,b)=>Math.hypot(player.x-a.position[0],player.z-a.position[2])-Math.hypot(player.x-b.position[0],player.z-b.position[2]))[0] || null;},
    update(delta,time,player,rotation,collisionWorld){
      const activeTargets=targets.filter(t=>targetActive(t)&&!t.defeated).map(t=>t.id).join('|');if(activeTargets!==targetSignature){targetSignature=activeTargets;sync();}
      Object.assign(player,moveWithBodies(player,{x:0,z:0},collisionWorld,bodies()));
      immunity=Math.max(0,immunity-delta);
      if(impact) {
        const step=Math.min(delta,ENCOUNTER.stagger-impact.elapsed),speed=(impact.training?2:8)*(1-impact.elapsed/ENCOUNTER.stagger);
        Object.assign(player,moveWithBodies(player,{x:impact.x*speed*step,z:impact.z*speed*step},collisionWorld,bodies()));
        impact.elapsed+=step;if(impact.elapsed>=ENCOUNTER.stagger)impact=null;
      }
      const completed=options.state().completedMinigames.join('|');if(completed!==gateSignature){gateSignature=completed;gates.forEach(g=>{const open=options.state().completedMinigames.includes(g.minigameId);if(g.model.visible && open)options.onGateOpened?.(g);g.model.visible=!open;});sync();}
      if(attack) {
        for(const id of attackHits(attack,delta,player,rotation,targets.filter(targetActive))) {
          const t=targets.find(t=>t.id===id);Object.assign(t,hitTarget(t));t.strike=null;t.flash=.15;t.reaction=t.defeated?(t.anim?creatureClips.find(c=>c.name==='Death_A')?.duration||1.2:.28):.6;t.anim?.play(t.defeated?'Death_A':t.hitReaction,true);
          if(t.anim&&!t.defeated){const dx=t.position.x-player.x,dz=t.position.z-player.z,d=Math.hypot(dx,dz)||1;Object.assign(t.position,moveWithBodies(t.position,{x:dx/d*.35,z:dz/d*.35},collisionWorld,[...bodies(t),{x:player.x,z:player.z,radius:.34}],t.radius));t.position.y=heightAt(t.position.x,t.position.z)+t.home.y-heightAt(t.home.x,t.home.z);t.model.position.set(t.position.x,t.position.y,t.position.z);}
          if(t.defeated&&t.toy){defeatedToy.add(t.id);collectibles?.release(t.id,t.position);options.onToyEvent?.({type:'TOY_TARGET_DEFEATED',id:t.id});}
          options.onPlayerImpact?.({id:t.id,type:t.type,assetId:t.assetId,defeated:t.defeated,position:{...t.position}});
          if(!t.defeated)burst(t.model.position.clone().add(new THREE.Vector3(0,1,0)));
          if(t.defeated){burst(t.model.position.clone().add(new THREE.Vector3(0,1,0)));if(t.type==='WORLD_CREATURE')companionEvent('ENEMY_DEFEATED');options.onReward(t.optionalReward);sync();}
        }
        if(attack.elapsed>attack.duration)attack=null;
      }
      for(const t of targets) {
        const visible=targetActive(t);if(!visible){t.model.visible=false;continue;}if(!t.defeated)t.model.visible=true;
        if(t.cue){t.cue.sprite.visible=!t.defeated&&Math.hypot(t.position.x-player.x,t.position.z-player.z)<7;t.cue.material.opacity=.3+Math.sin(time*2)*.1;}
        t.flash=Math.max(0,t.flash-delta);
        if(t.flash>0||t.flashed)for(const owned of t.owned){if(owned.color)owned.copy.color.copy(owned.color).lerp(hitColor,t.flash>0?.45:0);if(owned.emissive){owned.copy.emissive.copy(t.flash>0?hitEmissive:owned.emissive);owned.copy.emissiveIntensity=t.flash>0?1.5:owned.intensity;}}
        t.flashed=t.flash>0;
        if(!t.anim)t.model.scale.copy(t.baseScale).multiplyScalar(t.defeated?Math.max(.01,t.reaction/.28):1+Math.sin(t.reaction*45)*.06*(t.reaction/.6));
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
            impact={x:dx/d,z:dz/d,elapsed:0,training:t.training};immunity=t.training?5:ENCOUNTER.immunity;attack=null;playerHits++;
            options.onPlayerHit?.({training:t.training});burst(new THREE.Vector3(player.x,player.y+.8,player.z));
          }
        } else {
          const {desired=t.position,speed=0}=decision;
          const dx=desired.x-t.position.x,dz=desired.z-t.position.z,d=Math.hypot(dx,dz);
          if(d>.15 && speed){const step=Math.min(d,delta*speed);const obstacles=[...bodies(t),{x:player.x,z:player.z,radius:.34}];Object.assign(t.position,moveWithBodies(t.position,{x:dx/d*step,z:dz/d*step},collisionWorld,obstacles,t.radius));t.model.rotation.y=Math.atan2(dx,dz);t.anim.play('Walking_A');}else t.anim.play('Idle_A');
        }
        t.position.y=heightAt(t.position.x,t.position.z)+t.home.y-heightAt(t.home.x,t.home.z);t.model.position.set(t.position.x,t.position.y,t.position.z);t.anim.mixer.update(delta);
      }
      collectibles?.update(delta,time,player,defeatedToy);
      music?.update(delta,player);
      residents?.update(delta,player,collisionWorld,!!impact);
      restoration?.update(delta,time,player);
      for(const id of options.adventure?.()?.valley?.discoveries||[]){if(!knownDiscoveries.has(id)){knownDiscoveries.add(id);companionEvent('SECRET_DISCOVERED');}}
      if(pet) {
        const before={x:pet.model.position.x,z:pet.model.position.z};
        const candidates=[...(options.companionChests?.()||[]),...(collectibles?.companionInterests()||[]),...targets.filter(t=>!t.defeated&&t.model.visible).map(t=>({...t.position,kind:t.type==='WORLD_CREATURE'?'ENEMY':'PROP'})),...(residents?.bodies()||[]).map(p=>({...p,kind:'NPC'}))];
        const obstacles=[...bodies(),{x:player.x,z:player.z,radius:.34}];
        const petWorld={move:(position,displacement,radius)=>moveWithBodies(position,displacement,collisionWorld,obstacles,radius),
          overlaps:(position,radius)=>collisionWorld.overlaps(position,radius)||obstacles.some(b=>Math.hypot(b.x-position.x,b.z-position.z)<b.radius+radius)};
        const next=companionStep(pet.behavior,before,player,rotation,delta,petWorld,candidates);
        pet.model.position.set(next.x,heightAt(next.x,next.z),next.z);
        const dx=next.lookAt.x-next.x,dz=next.lookAt.z-next.z;
        if(Math.hypot(dx,dz)>.05){const yaw=Math.atan2(dx,dz),difference=Math.atan2(Math.sin(yaw-pet.model.rotation.y),Math.cos(yaw-pet.model.rotation.y));pet.model.rotation.y+=difference*(1-Math.exp(-Math.min(delta,.1)*8));}
        const clip=companionClip(pet.behavior,pet.clips);if(clip!==pet.clip){pet.anim.play(clip);pet.clip=clip;}
        pet.anim.mixer.update(Math.min(delta,.1));
      }
      for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=delta;const points=b.geometry.attributes.position;for(let j=0;j<points.count;j++){const angle=j*2.4;points.setXYZ(j,Math.sin(angle)*b.age*2,b.age*(2+j%3*.2)-b.age*b.age,Math.cos(angle)*b.age*2);}points.needsUpdate=true;b.material.opacity=1-b.age;if(b.age>1){b.points.removeFromParent();b.geometry.dispose();b.material.dispose();bursts.splice(i,1);}}
    },
    dispose(){disposed=true;petToken++;restoration?.dispose();residents?.dispose();music?.dispose();collectibles?.dispose();targets.forEach(t=>{t.anim?.dispose();t.cue?.texture.dispose();t.cue?.material.dispose();t.owned.forEach(o=>o.copy.dispose());disposeModel(t.model);});gates.forEach(g=>disposeModel(g.model));if(pet){pet.anim.dispose();disposeModel(pet.model);}bursts.forEach(b=>{b.geometry.dispose();b.material.dispose();});group.removeFromParent();}
  };
}
