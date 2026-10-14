import * as THREE from 'three';
import {TOY_NOTES} from '../world/composition/toyComposition.js';
import {firstMinutesStarted,firstMinutesPhase} from './firstMinutes.js';

export function createWorldCollectibles(group,heightAt,options) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;
  const ctx=canvas.getContext('2d');ctx.font='bold 128px serif';ctx.textAlign='center';ctx.fillStyle='#fff4b5';ctx.shadowColor='#ffc442';ctx.shadowBlur=10;ctx.fillText('\u266a',64,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
  const secretCanvas=document.createElement('canvas');secretCanvas.width=512;secretCanvas.height=128;
  const secretContext=secretCanvas.getContext('2d');secretContext.font='bold 66px sans-serif';secretContext.textAlign='center';secretContext.fillStyle='#fff2b0';secretContext.fillText('\u2726 \u00a1SECRETO!',256,90);
  const secretTexture=new THREE.CanvasTexture(secretCanvas),secretMaterial=new THREE.SpriteMaterial({map:secretTexture,transparent:true,depthWrite:false});
  secretTexture.colorSpace=THREE.SRGBColorSpace;
  const discovery=new THREE.Sprite(secretMaterial);discovery.name='SecretDiscovery';discovery.scale.set(3,.75,1);discovery.visible=false;group.add(discovery);
  let discoveryAge=3;const knownSecrets=new Set(options.adventure()?.toy?.discoveredSecrets||[]);
  const haloGeometry=new THREE.RingGeometry(.22,.28,24),haloMaterial=new THREE.MeshBasicMaterial({color:0xffd76b,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false});
  const notes=TOY_NOTES.map(definition=>{
    const node=new THREE.Group(),sprite=new THREE.Sprite(material);node.name='LostNote:'+definition.id;sprite.scale.set(.65,.8,1);node.add(sprite);
    const halo=new THREE.Mesh(haloGeometry,haloMaterial);halo.rotation.x=-Math.PI/2;halo.position.y=-.8;node.add(halo);
    node.position.set(definition.position[0],heightAt(definition.position[0],definition.position[2])+definition.position[1]+1,definition.position[2]);node.visible=false;group.add(node);
    return {definition,node,collected:options.adventure()?.toy?.collectedNotes.includes(definition.id)||false,age:null};
  });
  return {
    release(sourceId,position){for(const item of notes)if(item.definition.sourceId===sourceId&&!item.definition.stayAtAuthoredPosition){item.node.position.x=position.x;item.node.position.z=position.z;}},
    update(delta,time,player,defeated) {
      discoveryAge+=delta;discovery.visible=discoveryAge<1.8;discovery.material.opacity=Math.min(1,Math.max(0,(1.8-discoveryAge)*2));if(discovery.visible)discovery.position.y+=delta*.25;
      for(const item of notes){
        const {definition,node}=item;
        if(definition.enabled===false){node.visible=false;continue;}
        if(definition.firstMinutesOnly&&!firstMinutesStarted(options.adventure())||firstMinutesStarted(options.adventure())&&firstMinutesPhase(options.adventure())!=='DONE'&&['note-arrival','note-plaza','note-exit','note-corner','note-box','note-barrel'].includes(definition.id)){node.visible=false;continue;}
        if(item.age!==null){item.age+=delta;node.position.y+=delta*2;node.scale.setScalar(Math.max(.01,1-item.age/.4));if(item.age>=.4)node.visible=false;continue;}
        node.visible=!item.collected&&(!definition.sourceId||defeated.has(definition.sourceId))&&(!definition.mechanismId||options.adventure()?.toy?.completedMechanisms?.includes(definition.mechanismId))&&(!(definition.secretId||definition.stayAtAuthoredPosition)||Math.hypot(player.x-node.position.x,player.z-node.position.z)<(definition.revealRadius||5));if(!node.visible)continue;
        node.position.y=heightAt(node.position.x,node.position.z)+definition.position[1]+1+Math.sin(time*2+definition.position[0])*.12;
        if(Math.hypot(player.x-node.position.x,player.z-node.position.z)<1.15&&Math.abs(player.y-(node.position.y-1))<1.2){
          item.collected=true;item.age=0;options.onCollect(definition);options.onBurst(node.position.clone());
          if(definition.secretId&&!knownSecrets.has(definition.secretId)){
            knownSecrets.add(definition.secretId);discoveryAge=0;discovery.position.copy(node.position).add(new THREE.Vector3(0,1,0));discovery.visible=true;
            options.onSecret?.(definition.secretId,node.position.clone());
          }
        }
      }
    },
    get count(){return notes.filter(n=>n.collected).length;},
    companionInterests(){return notes.filter(n=>n.node.visible&&!n.collected&&!n.definition.secretId).map(n=>({x:n.node.position.x,z:n.node.position.z,kind:'NOTE'}));},
    dispose(){notes.forEach(n=>n.node.removeFromParent());discovery.removeFromParent();secretTexture.dispose();secretMaterial.dispose();texture.dispose();material.dispose();haloGeometry.dispose();haloMaterial.dispose();},
  };
}
