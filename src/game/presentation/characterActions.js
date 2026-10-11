import * as THREE from 'three';

export const CHARACTER_ACTIONS = Object.freeze({
  1: { Q: '1H_Melee_Attack_Slice_Horizontal', E: 'Block' },
  2: { Q: 'Spellcast_Raise', E: 'Spellcast_Shoot' },
  3: { Q: 'Dualwield_Melee_Attack_Chop', E: '2H_Melee_Attack_Spin' },
  4: { Q: '1H_Ranged_Shoot', E: 'Dodge_Backward' },
  5: { Q: 'Throw', E: 'Jump_Full_Short' }
});
export const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
export const rotateShowcase = (angle, delta) => wrapAngle(angle + delta);
export function resolveCharacterAction(id, key, available) {
  const preferred = CHARACTER_ACTIONS[id]?.[key];
  return [preferred, key === 'Q' ? 'Cheer' : 'Jump_Full_Short', 'Idle'].find(name => available.includes(name));
}

// One-shot expression layer: no displacement, damage or progression writes.
export function createCharacterAnimator(mixer, clips, characterId, equipment = null) {
  const actions = Object.fromEntries(clips.map(clip => [clip.name, mixer.clipAction(clip)]));
  let current = null, locked = false;
  const switchTo = (name, once = false) => {
    const next = actions[name];
    if (!next || (!once && current === next)) return;
    current?.fadeOut(.15);
    next.reset().setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    next.clampWhenFinished = once; next.fadeIn(.15).play(); current = next;
  };
  const finished = event => {
    if (event.action !== current) return;
    locked = false; switchTo('Idle');
  };
  mixer.addEventListener('finished', finished); switchTo('Idle');
  return {
    actions,
    get locked() { return locked; },
    get name() { return current?.getClip().name; },
    express(key) {
      if (locked) return false;
      const name = equipment?.[key] && actions[equipment[key]] ? equipment[key] : resolveCharacterAction(characterId, key, Object.keys(actions));
      if (!name || name === 'Idle') return false;
      locked = true; switchTo(name, true); return true;
    },
    locomotion(name) { if (!locked) switchTo(actions[name] ? name : 'Idle'); },
    setEquipment(next) { equipment = next; },
    dispose() { mixer.removeEventListener('finished', finished); mixer.stopAllAction(); mixer.uncacheRoot(mixer.getRoot()); }
  };
}
