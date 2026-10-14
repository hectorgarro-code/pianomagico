import { circleContact } from '../world/collision/CollisionWorld.js';

export const ENCOUNTER = Object.freeze({ noticeRange: 7, leash: 10, strikeRange: 1.65, windup: .55, recovery: 1.1, immunity: 1.5, stagger: .65 });
export const CREATURE_BEHAVIOR_DEFAULTS={noticeRange:7,leash:10,chaseSpeed:2.1,windup:.55,recovery:1.1};

export function creatureStep(target, player, delta) {
  const encounter=target.training?{...ENCOUNTER,noticeRange:3.5,leash:4,windup:1.4,recovery:2.5,chaseSpeed:.8}:{...ENCOUNTER,...CREATURE_BEHAVIOR_DEFAULTS,...target.encounter};
  const distance = Math.hypot(player.x - target.position.x, player.z - target.position.z);
  const homeDistance = Math.hypot(target.position.x - target.home.x, target.position.z - target.home.z);
  if (target.reaction > 0) { target.strike = null; return { state: 'HIT_REACTION' }; }
  if (target.strike) {
    const before = target.strike.elapsed;
    target.strike.elapsed += delta;
    const hit = before < encounter.windup && target.strike.elapsed >= encounter.windup &&
      distance <= ENCOUNTER.strikeRange && Math.abs((player.y || 0) - target.position.y) < 1.4 &&
      ((player.x - target.position.x) * target.strike.x + (player.z - target.position.z) * target.strike.z) > 0;
    const direction = { x: target.strike.x, z: target.strike.z };
    if (target.strike.elapsed >= encounter.windup + encounter.recovery) target.strike = null;
    return { state: 'ATTACK', hit, direction };
  }
  if (target.returning) {
    if (homeDistance > .3) return { state: 'RETURN', desired: target.home, speed: 2 };
    target.returning = false;
  }
  if (homeDistance >= encounter.leash) {
    target.returning = true;
    return { state: 'RETURN', desired: target.home, speed: 2 };
  }
  if (target.behaviorType !== 'stationary' && distance < encounter.noticeRange) {
    if (distance <= 1.35) {
      if(target.training&&!(target.hits>0))return {state:'IDLE'};
      target.strike = { elapsed: 0, x: (player.x - target.position.x) / (distance || 1), z: (player.z - target.position.z) / (distance || 1) };
      return { state: 'ATTACK', started: true, direction: target.strike };
    }
    return { state: 'CHASE', desired: player, speed: encounter.chaseSpeed };
  }
  return target.behaviorType === 'stationary' ? { state: 'IDLE' } : {
    state: 'WANDER', speed: .6, desired: { x: target.home.x + Math.sin(target.phase * .5) * 1.2, z: target.home.z + Math.cos(target.phase * .5) * 1.2 },
  };
}

// Moving bodies are resolved separately from the world's static spatial hash.
export function moveWithBodies(position, displacement, world, bodies, radius = .34) {
  let current = { x: position.x, z: position.z };
  const steps = Math.max(1, Math.ceil(Math.hypot(displacement.x, displacement.z) / (radius * .5)));
  for (let step = 0; step < steps; step++) {
    const next = world.move(current, { x: displacement.x / steps, z: displacement.z / steps }, radius);
    for (let pass = 0; pass < 4; pass++) {
      let changed = false;
      for (const body of bodies) {
        const contact = circleContact(next, radius, { type: 'solid', shape: 'circle', ...body });
        if (!contact) continue;
        next.x += contact.x * (contact.depth + .00001); next.z += contact.z * (contact.depth + .00001); changed = true;
      }
      if (!changed) break;
    }
    if (!world.overlaps(next, radius) && !bodies.some(body => circleContact(next, radius, { type: 'solid', shape: 'circle', ...body }))) current = next;
  }
  return current;
}
