import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity } from './adventureState.js';
import { hasAdventureProgress, advanceObjective } from './adventureStart.js';
import { createAdventurePersistence } from '../services/adventurePersistence.js';
import { createWorldActivityState, worldActivityReducer } from '../state/worldActivityFlow.js';
import { progressService } from '../services/progressService.js';
import { PLAZA_COMPOSITION } from '../world/composition/plazaComposition.js';

test('empty adventure offers New; started and legacy completed adventures offer Continue', () => {
  const initial = createAdventureState();
  assert.equal(hasAdventureProgress(initial), false);
  const started = worldActivityReducer(createWorldActivityState(initial), { type: 'START_ADVENTURE' });
  assert.equal(hasAdventureProgress(started.game.adventure), true);
  const legacy = settleAdventureActivity(beginAdventureActivity(initial, 'forest-chest-01', 1), 'forest-chest-01', { activityId: 1, completed: true });
  assert.equal(hasAdventureProgress(createAdventureState(legacy)), true);
});

test('objectives advance through walking and authored forest entrance without regressing', () => {
  const first = { started: true, objective: 'EXPLORE_PLAZA' };
  assert.equal(advanceObjective(first, { x: 0, z: 5 }, 0), first);
  const path = advanceObjective(first, { x: 4, z: 5 }, 4);
  assert.equal(path.objective, 'FIND_FOREST_PATH');
  assert.equal(advanceObjective(path, { x: -40, z: -25 }, 8), path);
  const forest = advanceObjective(path, { x: 10, z: -20 }, 30);
  assert.equal(forest.objective, 'FIND_FIRST_CHEST');
  assert.equal(advanceObjective(forest, { x: 0, z: 5 }, 40), forest);
});

test('journey persists per profile; Continue keeps objective and chest progress', () => {
  const data = new Map(), persistence = createAdventurePersistence(() => ({ getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }));
  let state = settleAdventureActivity(beginAdventureActivity(createAdventureState(), 'forest-chest-01', 1), 'forest-chest-01', { activityId: 1, completed: true });
  state = { ...state, journey: { started: true, objective: 'FIND_FIRST_CHEST' } };
  persistence.save(2, state);
  assert.equal(persistence.load(2).journey.objective, 'FIND_FIRST_CHEST');
  assert.equal(persistence.load(2).entries['forest-chest-01'].state, 'COMPLETED');
  assert.equal(hasAdventureProgress(persistence.load(1)), false);
  assert.equal(createAdventureState({ ...state, journey: { started: true, objective: 'INVENTED' } }).journey.objective, 'EXPLORE_PLAZA');
});

test('reset only resets adventure/world session; preserves character, XP and unrelated educational storage', () => {
  let flow = createWorldActivityState();
  flow = worldActivityReducer(flow, { type: 'PROFILE', profile: { avatarId: 3, total_score: 24600 } });
  flow = worldActivityReducer(flow, { type: 'START_ADVENTURE' });
  const educational = { xp: 24600, performances: [1, 2], medals: [1] };
  const before = structuredClone(educational);
  const reset = worldActivityReducer(flow, { type: 'RESET_ADVENTURE' });
  assert.equal(hasAdventureProgress(reset.game.adventure), false);
  assert.equal(reset.game.progression.xp, 24600);
  assert.equal(reset.game.player.characterId, 3);
  assert.deepEqual(educational, before);
  assert.deepEqual(Object.values(reset.game.player.position), PLAZA_COMPOSITION.spawn.position);
  assert.equal(reset.game.adventure.entries['forest-chest-01'].state, 'AVAILABLE');
});

test('character selection reuses profile persistence and only sends avatar, never educational fields', async () => {
  const previousFetch = globalThis.fetch, previousStorage = globalThis.localStorage;
  const calls = [], storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, String(value)) };
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => options ? { message: 'Profile updated' } : { user_id: 2, name: 'SOPHIA', avatar_id: 2, total_score: 900 } };
  };
  try {
    const profile = await progressService.selectCharacter(2, 2);
    assert.equal(profile.avatarId, 2);
    assert.equal(profile.total_score, 900);
    assert.deepEqual(JSON.parse(calls[0].options.body), { userId: 2, avatarId: 2, avatarOnly: true });
    assert.equal(storage.get('user_avatar_2'), '2');
    await assert.rejects(() => progressService.selectCharacter(2, 9));
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: 'failed' }) });
    await assert.rejects(() => progressService.selectCharacter(2, 4));
    assert.equal(storage.get('user_avatar_2'), '2');
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});

test('all four actual characters supply exploration and celebration animations', () => {
  for (const name of ['Knight', 'Mage', 'Barbarian', 'Rogue']) {
    const bytes = fs.readFileSync(`public/models/characters/${name}.glb`);
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    const clips = gltf.animations.map(clip => clip.name);
    for (const clip of ['Idle', 'Walking_A', 'Running_A', 'Jump_Full_Short', 'Cheer']) assert.ok(clips.includes(clip), `${name}: ${clip}`);
  }
});
