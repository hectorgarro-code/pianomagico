import * as THREE from 'three';
import {firstMinutesPhase,FIRST_MINUTES as F} from './firstMinutes.js';
import {FIRST_MINUTES_PATH} from '../world/composition/firstMinutesComposition.js';
import {getGameplayContent} from './gameplayContent.js';
import {PLAZA_COMPOSITION} from '../world/composition/plazaComposition.js';

export function createFirstMinutesWorld(scene,heightAt){
  const group=new THREE.Group();group.name='First_Minutes_Cues';scene.add(group);
  const geometry=new THREE.RingGeometry(.7,.85,32),material=new THREE.MeshBasicMaterial({color:0xffdf6e,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false});
  const halo=new THREE.Mesh(geometry,material);halo.rotation.x=-Math.PI/2;group.add(halo);
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,31);gradient.addColorStop(0,'#fff8ae');gradient.addColorStop(.35,'#ffdb7daa');gradient.addColorStop(1,'#ffcc0000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const texture=new THREE.CanvasTexture(canvas),glowMaterial=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
  const pathMaterial=glowMaterial.clone();pathMaterial.opacity=.65;
  const glow=new THREE.Sprite(glowMaterial);glow.scale.set(1.3,1.3,1);group.add(glow);
  const path=FIRST_MINUTES_PATH.map(([x,,z])=>{const sprite=new THREE.Sprite(pathMaterial);sprite.position.set(x,heightAt(x,z)+.18,z);sprite.scale.set(1.4,.6,1);group.add(sprite);return sprite;});
  let age=0,last=null;
  return {update(delta,time,adventure){
    const phase=firstMinutesPhase(adventure);if(phase!==last){age=phase==='DONE'&&last===null?5:0;last=phase;}age+=delta;
    const actions=getGameplayContent().worldActions;
    const box=actions.find(t=>t.id===F.box)?.position||[1,0,-1],enemy=actions.find(t=>t.id===F.enemy)?.position||[5,0,-2];
    const chest=PLAZA_COMPOSITION.instances.find(i=>i.id===PLAZA_COMPOSITION.stations.find(s=>s.id===F.station)?.instanceId)?.position||[7.5,0,.5];
    const target={MOVE:[1.6,2],NOTE:[1.6,2],BREAK:[box[0],box[2]],DROP:[box[0],box[2]],DEFEND:[enemy[0],enemy[2]],CHEST:[chest[0],chest[2]]}[phase];
    halo.visible=glow.visible=!!target;
    if(target){const [x,z]=target,y=heightAt(x,z);halo.position.set(x,y+.22,z);halo.scale.setScalar(1+Math.sin(time*3)*.1);glow.position.set(x,y+1,z);glowMaterial.opacity=.3+Math.sin(time*2)*.08;}
    path.forEach((sprite,index)=>{sprite.visible=phase==='DONE'&&age>index*.35;sprite.material.opacity=.65;});
  },dispose(){group.removeFromParent();geometry.dispose();material.dispose();glowMaterial.dispose();pathMaterial.dispose();texture.dispose();}};
}
