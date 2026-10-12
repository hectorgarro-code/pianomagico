import * as THREE from 'three';
import { lessonBadgeData } from '../content/lessonRepository.js';

export function createLessonBadge(object) {
  if (!object.song || object.type === 'SECRET_REWARD') return null;
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 128;
  let texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material); sprite.position.y = 1.5;
  let previous = '';
  return { sprite, update(state, near) {
    const data = lessonBadgeData(object, object.song, state, near);
    const key = JSON.stringify(data); if (key === previous) return; previous = key;
    const ctx = canvas.getContext('2d'); ctx.font = 'bold 36px sans-serif';
    const lines = []; let line = '';
    const words = data.title.split(' ');
    for (const word of words) {
      if (ctx.measureText(line + ' ' + word).width > 696 && line) { lines.push(line); line = word; }
      else line = (line + ' ' + word).trim();
    }
    lines.push(line);
    const height = 32 + lines.length * 42 + (near ? 76 : 0);
    if (canvas.height !== height) {
      // Uploaded GPU textures cannot be resized in place.
      canvas.height = height;
      texture.dispose(); texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace; material.map = texture; material.needsUpdate = true;
    } else ctx.clearRect(0, 0, canvas.width, canvas.height);
    sprite.scale.set(3, 3 * canvas.height / canvas.width, 1);
    const accent = state === 'COMPLETED' ? '#9bffcf' : state === 'LOCKED' ? '#c3d6d9' : '#ffe58d';
    ctx.beginPath(); ctx.roundRect(10, 10, 748, canvas.height - 20, 18);
    ctx.fillStyle = 'rgba(12,34,39,.32)'; ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.shadowColor = accent; ctx.shadowBlur = 9; ctx.stroke();
    ctx.shadowBlur = 3; ctx.shadowColor = '#10232b';
    ctx.fillStyle = '#fff8d9'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((text, index) => ctx.fillText(text, 384, 37 + index * 42, 696));
    if (near) {
      const y = 32 + lines.length * 42;
      ctx.font = '27px sans-serif'; ctx.fillStyle = '#fff0b4'; ctx.fillText(data.subtitle, 384, y + 13, 696);
      ctx.font = 'bold 27px sans-serif'; ctx.fillStyle = accent; ctx.fillText(data.action, 384, y + 47, 696);
    }
    texture.needsUpdate = true;
  }, dispose() { material.dispose(); texture.dispose(); } };
}

export function chestSignalStyle(state, type = 'LESSON_CHEST') {
  const color = type === 'SECRET_REWARD' ? 0xc4a6ef : 0xffcf68;
  if (state === 'COMPLETED') return { color: 0x72dba7, glow: .08, particles: false };
  if (state === 'LOCKED') return { color, glow: .035, particles: false };
  return { color, glow: .45, particles: true };
}

// Own all effect resources. Models/material caches are never altered or disposed here.
export function createChestSignals(scene, objects, heightAt) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d'), gradient = context.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(255,255,255,1)'); gradient.addColorStop(.18,'rgba(255,255,255,.65)'); gradient.addColorStop(1,'rgba(255,255,255,0)');
  context.fillStyle=gradient; context.fillRect(0,0,64,64);
  const texture = new THREE.CanvasTexture(canvas);
  const styles = new Map();
  const materialFor = (state,type) => {
    const key=state+type;
    if(!styles.has(key)) {
      const style=chestSignalStyle(state,type);
      styles.set(key,{...style,sprite:new THREE.SpriteMaterial({map:texture,color:style.color,opacity:style.glow,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),
        points:new THREE.PointsMaterial({map:texture,color:style.color,size:.13,opacity:.75,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})});
    }
    return styles.get(key);
  };
  const effects=objects.filter(o=>o.type!=='PRACTICE_STATION').map(object=>{
    const position=object.instance.position, group=new THREE.Group();
    group.position.set(position[0],heightAt(position[0],position[2])+position[1]+1.4,position[2]);
    const style=materialFor('LOCKED',object.type), glow=new THREE.Sprite(style.sprite);
    glow.scale.set(2,2,1); group.add(glow);
    const geometry=new THREE.BufferGeometry(), values=new Float32Array(12*3);
    geometry.setAttribute('position',new THREE.BufferAttribute(values,3));
    const points=new THREE.Points(geometry,style.points); group.add(points); scene.add(group);
    const badge = createLessonBadge(object); if (badge) group.add(badge.sprite);
    return {object,group,glow,points,values,geometry,badge,lastUpdate:-Infinity};
  });
  return {
    update(time, player, adventure) {
      for(const effect of effects) {
        const {object,group,glow,points}=effect;
        const dist=Math.hypot(player.x-group.position.x,player.z-group.position.z);
        const secretKnown=object.type!=='SECRET_REWARD'||adventure?.valley.discoveredRegions.includes(object.regionId);
        group.visible=dist<40&&secretKnown;
        if(!group.visible)continue;
        const style=materialFor(adventure?.entries[object.id]?.state||'LOCKED',object.type);
        if (effect.badge) {
          effect.badge.sprite.visible = dist < 18;
          effect.badge.update(adventure?.entries[object.id]?.state || 'LOCKED', dist < 4);
        }
        glow.material=style.sprite;points.material=style.points;points.visible=style.particles;
        glow.scale.setScalar(1.6+Math.sin(time*1.8)*.1);
        if(!style.particles || time-effect.lastUpdate<(dist>24?.2:.04))continue;
        effect.lastUpdate=time;
        for(let i=0;i<12;i++) {
          const phase=(time*.32+i/12)%1,angle=i*2.4+time*.25;
          effect.values[i*3]=Math.cos(angle)*(.25+phase*.25);
          effect.values[i*3+1]=phase*1.8;
          effect.values[i*3+2]=Math.sin(angle)*(.25+phase*.25);
        }
        effect.geometry.attributes.position.needsUpdate=true;
        effect.geometry.computeBoundingSphere();
      }
    },
    dispose() {
      effects.forEach(effect=>{scene.remove(effect.group);effect.geometry.dispose();effect.badge?.dispose();});
      styles.forEach(style=>{style.sprite.dispose();style.points.dispose();});texture.dispose();
    }
  };
}
