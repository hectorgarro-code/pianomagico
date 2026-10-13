export const COMPANION_PROFILES = Object.freeze({
  ENERGETIC: {walk: 3.8, run: 7.5, curiosityEvery: 12, celebration: 'dance', side: .95},
  CALM: {walk: 2.8, run: 6, curiosityEvery: 22, celebration: 'gesture-positive', side: 1.1},
  CURIOUS: {walk: 3.2, run: 6.8, curiosityEvery: 9, celebration: 'gesture-positive', side: .85},
});

// Metadata is keyed by actual catalog asset names, not promotional characters.
export const COMPANION_METADATA = Object.freeze({
  dog: 'ENERGETIC', bunny: 'ENERGETIC', bee: 'ENERGETIC', monkey: 'ENERGETIC',
  elephant: 'CALM', panda: 'CALM', koala: 'CALM', cow: 'CALM', penguin: 'CALM',
  cat: 'CURIOUS', fox: 'CURIOUS', parrot: 'CURIOUS', deer: 'CURIOUS', beaver: 'CURIOUS',
});
export function companionProfile(assetId) {
  return COMPANION_METADATA[String(assetId).split('animal-').pop()] || 'CALM';
}
export function createCompanion(profile = 'CALM') {
  return {profile, state: 'IDLE', elapsed: 0, quiet: 0, nextCuriosity: COMPANION_PROFILES[profile].curiosityEvery,
    previousPlayer: null, following: false, running: false, reaction: null, interest: null, stuck: 0, recoveries: 0};
}
export function reactCompanion(state, event, position) {
  if (event === 'CHEST_INSPECTED') {
    if (!state.reaction) state.interest = position ? {...position, kind: 'CHEST', until: state.elapsed + 3} : null;
    return;
  }
  const special = event === 'SECRET_DISCOVERED'||event==='REGION_RESTORED';
  if (state.reaction?.special && !special) return;
  state.reaction = {until: state.elapsed + (event==='REGION_RESTORED'?3.6:special ? 2.8 : 1.8), special};
  state.interest = null;
}
export function companionClip(state, available) {
  const profile = COMPANION_PROFILES[state.profile];
  const preferred = state.state === 'CELEBRATE' ? (state.reaction?.special ? 'dance' : profile.celebration)
    : state.state === 'RUN' ? 'run' : state.moving ? 'walk' : 'idle';
  return [preferred, state.moving ? 'walk' : 'idle', 'static'].find(name => available.includes(name)) || available[0] || null;
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function companionStep(state, position, player, rotation, delta, world, candidates = []) {
  const dt = Math.min(Math.max(delta, 0), .1), profile = COMPANION_PROFILES[state.profile];
  state.elapsed += dt;
  const movingPlayer = state.previousPlayer && distance(player, state.previousPlayer) > dt * .35;
  state.previousPlayer = {x: player.x, z: player.z};
  state.quiet = movingPlayer ? 0 : state.quiet + dt;
  const anchor = {x: player.x - Math.sin(rotation) * 1.6 + Math.cos(rotation) * profile.side,
    z: player.z - Math.cos(rotation) * 1.6 - Math.sin(rotation) * profile.side};
  const tether = distance(position, player);
  if (movingPlayer || tether > 4 || state.interest?.until <= state.elapsed) state.interest = null;
  if (state.reaction?.until <= state.elapsed) state.reaction = null;
  if (!state.reaction && !state.interest && state.quiet > 1.5 && state.elapsed >= state.nextCuriosity) {
    state.nextCuriosity = state.elapsed + profile.curiosityEvery;
    const candidate = candidates.filter(c => !c.secret && c.visible !== false && distance(c, player) < 3.8)
      .sort((a, b) => distance(a, position) - distance(b, position))[0];
    if (candidate) state.interest = {...candidate, until: state.elapsed + 3};
  }
  let desired = anchor, looking = player;
  if (state.interest) {
    const target = state.interest, d = distance(target, player) || 1;
    // Observe from the player's side, never approach a hostile creature.
    desired = target.kind === 'ENEMY' ? anchor
      : {x: target.x + (player.x - target.x) / d * 1.2, z: target.z + (player.z - target.z) / d * 1.2};
    looking = target;
  }
  const gap = distance(position, desired);
  if (gap > .85) state.following = true;
  if (gap < .35) state.following = false;
  if (tether > 4.8) state.running = true;
  if (tether < 2.8) state.running = false;
  const recovering = tether > 16 || (state.stuck > 2.5 && tether > 4);
  if (recovering) {
    const alternate={x:player.x-Math.sin(rotation)*1.6-Math.cos(rotation)*profile.side,
      z:player.z-Math.cos(rotation)*1.6+Math.sin(rotation)*profile.side};
    const safe=[anchor,alternate,{x:player.x+Math.cos(rotation)*1.6,z:player.z-Math.sin(rotation)*1.6}]
      .map(point=>world?world.move(point,{x:0,z:0},.2):point)
      .find(point=>distance(point,player)<3&&distance(point,player)>.6&&!world?.overlaps?.(point,.2));
    if (safe) {
      state.stuck = 0; state.recoveries++; state.interest = null; state.reaction = null;
      state.state = 'FOLLOW'; state.moving = false;
      return {...safe, moving: false, teleported: true, lookAt: player};
    }
  }
  const celebrate = state.reaction && tether < 3.5 && !movingPlayer;
  const shouldMove = state.following && !celebrate;
  const step = Math.min(gap, dt * (state.running ? profile.run : profile.walk));
  const displacement = shouldMove && gap ? {x: (desired.x - position.x) / gap * step, z: (desired.z - position.z) / gap * step} : {x: 0, z: 0};
  const next = world ? world.move(position, displacement, .2) : {x: position.x + displacement.x, z: position.z + displacement.z};
  state.moving = distance(position, next) > .001;
  state.stuck = shouldMove && !state.moving ? state.stuck + dt : 0;
  state.state = celebrate ? 'CELEBRATE' : state.running && state.moving ? 'RUN'
    : state.interest ? 'CURIOUS' : state.moving ? 'FOLLOW' : state.quiet > 2 ? 'LOOK_AT_PLAYER' : 'IDLE';
  return {...next, moving: state.moving, lookAt: state.moving ? desired : looking};
}
