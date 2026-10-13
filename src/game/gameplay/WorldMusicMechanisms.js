import * as THREE from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import {loadCachedModel} from '../assets/assetManifest.js';
import {createWorldSequence,advanceWorldSequence,answerWorldSequence} from './worldMusicSequence.js';

export async function createWorldMusicMechanisms(parent,heightAt,definitions,options){
  const items=[],owned=[],raycaster=new THREE.Raycaster();let listening=false;
  function label(text,color='#fff2b0'){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
    const context=canvas.getContext('2d');context.font='bold 64px sans-serif';context.textAlign='center';context.fillStyle=color;
    context.shadowColor='#17343b';context.shadowBlur=8;context.fillText(text,256,102);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,depthWrite:false});owned.push(texture,material);
    const sprite=new THREE.Sprite(material);sprite.scale.set(3.2,1,1);return sprite;
  }
  for(const definition of definitions){
    const root=new THREE.Group();root.name=definition.id;root.position.set(definition.position[0],heightAt(definition.position[0],definition.position[2]),definition.position[2]);root.rotation.fromArray(definition.rotation);
    const gate=clone((await loadCachedModel(definition.gateAsset)).scene);gate.scale.setScalar(.7);root.add(gate);
    const door=gate.getObjectByName('wall_doorway_door');if(!door)throw Error('Musical door mesh missing');
    const stoneData=await loadCachedModel(definition.stoneAsset);
    const stones=definition.symbols.map((symbol,index)=>{
      const stone=clone(stoneData.scene);const box=new THREE.Box3().setFromObject(stone),size=box.getSize(new THREE.Vector3());
      stone.scale.set(1.15/size.x,2.1/size.y,.8/size.z);stone.position.fromArray(symbol.offset);stone.position.y=heightAt(root.position.x+symbol.offset[0],root.position.z+symbol.offset[2])-root.position.y-box.min.y*stone.scale.y;
      stone.traverse(node=>{if(!node.isMesh)return;node.castShadow=true;node.userData.symbolIndex=index;const copy=node.material.clone();node.material=copy;owned.push(copy);});root.add(stone);
      const glyph=label('\u266a '+symbol.label,String('#'+symbol.color.toString(16)));glyph.scale.set(1.6,.7,1);glyph.position.set(symbol.offset[0],stone.position.y+2.5,symbol.offset[2]);glyph.userData.symbolIndex=index;root.add(glyph);
      return {stone,glyph,symbol};
    });
    const prompts=Object.fromEntries([['LISTEN','\u266b ESCUCH\u00c1'],['ANSWER','\u266a TU TURNO'],['ERROR','\u21ba'],['OPEN','\u266b \u2713']].map(([phase,text])=>{const sprite=label(text);sprite.position.set(0,3.6,0);sprite.visible=false;root.add(sprite);return [phase,sprite];}));
    const completed=options.adventure()?.toy?.completedMechanisms?.includes(definition.id);
    const item={definition,root,door,stones,prompts,state:createWorldSequence(definition,completed),opening:completed?1:0,near:false};door.position.y=completed?4.2:0;items.push(item);parent.add(root);
  }
  const colliders=()=>items.flatMap(item=>[
    ...(item.opening<1?[{id:item.definition.id,type:'solid',shape:'box',x:item.root.position.x,z:item.root.position.z,halfWidth:1.4,halfDepth:.35,yaw:0}]:[]),
    ...[-1.1,1.1].map((offset,index)=>({id:item.definition.id+'-frame-'+index,type:'solid',shape:'circle',x:item.root.position.x+offset,z:item.root.position.z,radius:.28})),
    ...item.stones.map((s,i)=>({id:item.definition.id+'-stone-'+i,type:'solid',shape:'circle',x:item.root.position.x+s.stone.position.x,z:item.root.position.z+s.stone.position.z,radius:.5})),
  ]);
  function answer(item,index){
    if(!item?.near||item.state.phase!=='ANSWER'||!item.stones[index])return false;
    const pitch=item.stones[index].symbol.pitch;options.onNoteSound(pitch,item.root.position);item.state=answerWorldSequence(item.state,pitch);
    if(item.state.phase==='OPEN'){options.onToyEvent({type:'WORLD_MECHANISM_COMPLETED',id:item.definition.id});options.onBurst(item.root.position.clone().add(new THREE.Vector3(0,2,0)));options.onOpened(item.definition);}return true;
  }
  return {
    focus(){const item=items.find(i=>i.near);return item?{x:item.root.position.x,y:item.root.position.y,z:item.root.position.z}:null;},
    colliders,
    key(index){return answer(items.find(item=>item.near&&item.state.phase==='ANSWER'),index);},
    pointer(x,y,camera){raycaster.setFromCamera(new THREE.Vector2(x,y),camera);const item=items.find(item=>item.near&&item.state.phase==='ANSWER');if(!item)return false;const hit=raycaster.intersectObjects([...item.stones.map(s=>s.stone),...item.stones.map(s=>s.glyph)],true)[0];return hit?answer(item,hit.object.userData.symbolIndex):false;},
    update(delta,player){for(const item of items){
      item.near=Math.hypot(player.x-item.root.position.x,player.z-item.root.position.z)<item.definition.radius&&Math.abs(player.y-item.root.position.y)<2;
      const previous=item.state;item.state=advanceWorldSequence(previous,delta,item.near);
      if(item.state.phase==='LISTEN'&&item.state.played!==previous.played&&item.state.played>=0)options.onNoteSound(item.definition.sequence[item.state.played],item.root.position);
      if(item.state.phase==='OPEN'&&item.opening<1){item.opening=Math.min(1,item.opening+delta/.95);item.door.position.y=4.2*(1-Math.pow(1-item.opening,3));if(item.opening===1)options.onColliders();}
      for(const [phase,sprite] of Object.entries(item.prompts))sprite.visible=item.near&&item.state.phase===phase&&(phase!=='OPEN'||item.state.elapsed<2);
      for(const {stone,glyph,symbol} of item.stones){const lit=item.near&&(item.state.flash===symbol.pitch||item.state.session.answers.includes(symbol.pitch)||item.state.phase==='OPEN');glyph.material.opacity=item.near?1:.55;stone.traverse(node=>{if(node.isMesh&&node.material.emissive){node.material.emissive.setHex(item.state.phase==='ERROR'?0xa84635:lit?symbol.color:0x152b27);node.material.emissiveIntensity=lit?.65:.12;}});}
    }
      const focused=items.some(item=>item.near&&item.state.phase!=='OPEN');
      if(focused!==listening){listening=focused;options.onFocus?.(focused);}
    },
    get stats(){return items.map(i=>({id:i.definition.id,phase:i.state.phase,opening:i.opening,near:i.near,answers:i.state.session.answers.length}));},
    dispose(){if(listening)options.onFocus?.(false);items.forEach(i=>i.root.removeFromParent());owned.forEach(resource=>resource.dispose());},
  };
}
