import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity, getAdventureSummary } from './adventureState.js';
import { FOREST_LESSON_CHESTS as objects, FOREST_ADVENTURE_COMPOSITION as composition } from '../world/composition/forestAdventureComposition.js';
import { FOREST_COMPOSITION } from '../world/composition/forestComposition.js';
import { validateComposition } from '../world/composition/validateComposition.js';
import { createAdventurePersistence } from '../services/adventurePersistence.js';
import { createWorldActivityState, worldActivityReducer as reduce } from '../state/worldActivityFlow.js';

const complete = (state, object) => settleAdventureActivity(beginAdventureActivity(state, object.id, object.activityId), object.id, { completed: true, activityId: object.activityId });
const context = object => ({ stationId: object.id, regionId: object.regionId, position: { x: 18, y: 1, z: -22 }, rotation: 1, camera: { currentYaw: .5 } });

test('AVAILABLE requests activity; LOCKED and wrong activity reject without mutation', () => {
  const state = createAdventureState(), original = structuredClone(state);
  assert.equal(state.entries[objects[0].id].state, 'AVAILABLE');
  assert.equal(state.entries[objects[1].id].state, 'LOCKED');
  assert.equal(beginAdventureActivity(state, objects[1].id, objects[1].activityId), state);
  assert.equal(beginAdventureActivity(state, objects[0].id, 999), state);
  assert.equal(beginAdventureActivity(state, objects[0].id, 1).entries[objects[0].id].state, 'IN_PROGRESS');
  assert.deepEqual(state, original);
});

test('cancel and failed result restore AVAILABLE, never claim a reward', () => {
  for (const result of [{ completed: false, cancelled: true }, { completed: false, errors: 3 }]) {
    const state = settleAdventureActivity(beginAdventureActivity(createAdventureState(), objects[0].id, 1), objects[0].id, { ...result, activityId: 1 });
    assert.equal(state.entries[objects[0].id].state, 'AVAILABLE');
    assert.equal(state.entries[objects[1].id].state, 'LOCKED');
    assert.deepEqual(getAdventureSummary(state).claimedRewardIds, []);
  }
});

test('three completions unlock their successors and finish the forest segment', () => {
  let state = createAdventureState();
  for (const [index, object] of objects.entries()) {
    state = complete(state, object);
    assert.equal(state.entries[object.id].state, 'COMPLETED');
    if (objects[index + 1]) assert.equal(state.entries[objects[index + 1].id].state, 'AVAILABLE');
    assert.equal(state.lastReward.id, object.reward.id);
  }
  assert.deepEqual(getAdventureSummary(state), { completedActivityIds: [1, 2, 3], claimedRewardIds: objects.map(o => o.reward.id), segmentCompleted: true });
});

test('reward applies once; practice, repeated callbacks and cancelled practice cannot duplicate it', () => {
  const state = complete(createAdventureState(), objects[0]);
  const repeated = beginAdventureActivity(state, objects[0].id, 1);
  for (const completed of [true, false]) {
    const next = settleAdventureActivity(repeated, objects[0].id, { activityId: 1, completed });
    assert.deepEqual(next.entries, state.entries);
    assert.equal(next.lastReward, null);
    assert.equal(getAdventureSummary(next).claimedRewardIds.length, 1);
  }
  assert.equal(settleAdventureActivity(state, objects[0].id, { activityId: 1, completed: true }), state);
});

test('result must match an activity actually in progress; entering is not completing', () => {
  const available = createAdventureState();
  assert.equal(settleAdventureActivity(available, objects[0].id, { completed: true, activityId: 1 }), available);
  const pending = beginAdventureActivity(available, objects[0].id, 1);
  assert.equal(settleAdventureActivity(pending, objects[0].id, { completed: true, activityId: 2 }), pending);
  assert.deepEqual(getAdventureSummary(pending).completedActivityIds, []);
});

test('profile-scoped persistence restores completions, resets interrupted activity and keeps claims unique', () => {
  const values = new Map(), adapter = createAdventurePersistence(() => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }));
  const state = beginAdventureActivity(complete(createAdventureState(), objects[0]), objects[1].id, 2);
  assert.equal(adapter.save(1, state), true);
  const restored = adapter.load(1);
  assert.equal(restored.entries[objects[0].id].state, 'COMPLETED');
  assert.equal(restored.entries[objects[1].id].state, 'AVAILABLE');
  assert.equal(adapter.load(2).entries[objects[0].id].state, 'AVAILABLE');
  assert.equal(getAdventureSummary(complete(restored, objects[0])).claimedRewardIds.length, 1);
  values.set('valle-adventure-v1-user-1', '{bad');
  assert.equal(adapter.load(1).entries[objects[0].id].state, 'AVAILABLE');
  assert.equal(createAdventurePersistence(() => { throw Error('disabled'); }).save(1, state), false);
  assert.equal(createAdventurePersistence(() => { throw Error('disabled'); }).load(1).entries[objects[0].id].state, 'AVAILABLE');
});

test('restoration rejects unknown IDs, mismatched lessons, missing claims and skipped prerequisites', () => {
  const snapshot = { schemaVersion: 1, entries: { [objects[1].id]: { state: 'COMPLETED', activityId: 2, claimedRewards: [objects[1].reward.id] }, unknown: { state: 'COMPLETED' } } };
  assert.deepEqual(getAdventureSummary(createAdventureState(snapshot)).claimedRewardIds, []);
  snapshot.entries[objects[0].id] = { state: 'COMPLETED', activityId: 999, claimedRewards: [objects[0].reward.id] };
  assert.equal(createAdventureState(snapshot).entries[objects[0].id].state, 'AVAILABLE');
});

test('discovery integrates with approved piano flow and cancellation/return context', () => {
  let flow = createWorldActivityState();
  const request = object => ({ type: 'REQUEST_PIANO', song: { id: object.activityId }, context: context(object) });
  assert.equal(reduce(flow, request(objects[0])), flow);
  flow = reduce(flow, { type: 'DISCOVER_ADVENTURE', objectId: objects[1].id, context: context(objects[1]) });
  assert.equal(reduce(flow, request(objects[1])), flow);
  flow = reduce(flow, { type: 'CLOSE_DISCOVERY' });
  flow = reduce(flow, { type: 'DISCOVER_ADVENTURE', objectId: objects[0].id, context: context(objects[0]) });
  flow = reduce(flow, request(objects[0]));
  assert.equal(flow.game.adventure.entries[objects[0].id].state, 'IN_PROGRESS');
  flow = reduce(flow, { type: 'TRANSITION_COMPLETE', target: 'PIANO' });
  flow = reduce(flow, { type: 'RETURN', result: { completed: false, cancelled: true } });
  flow = reduce(flow, { type: 'TRANSITION_COMPLETE', target: 'WORLD' });
  assert.equal(flow.mode, 'WORLD');
  assert.deepEqual(flow.context.position, context(objects[0]).position);
  assert.equal(flow.game.adventure.entries[objects[0].id].state, 'AVAILABLE');
  flow = reduce(flow, { type: 'DISCOVER_ADVENTURE', objectId: objects[0].id, context: context(objects[0]) });
  flow = reduce(reduce(flow, request(objects[0])), { type: 'TRANSITION_COMPLETE', target: 'PIANO' });
  flow = reduce(flow, { type: 'RETURN', result: { activityId: 1, completed: true, xp: 300 } });
  assert.equal(flow.game.adventure.entries[objects[1].id].state, 'AVAILABLE');
  assert.deepEqual(flow.game.world.stationResults, {}); // Adventure has its own single authority.
});

test('authored chest layer preserves every original forest element and uses available GLB', () => {
  assert.deepEqual(composition.instances.slice(0, FOREST_COMPOSITION.instances.length), FOREST_COMPOSITION.instances);
  for (const field of ['terrain', 'paths', 'landmarks', 'reservations']) assert.deepEqual(composition[field], FOREST_COMPOSITION[field]);
  assert.equal(new Set(objects.map(o => o.id)).size, 3);
  assert.equal(new Set(objects.map(o => o.reward.id)).size, 3);
  const report = validateComposition(composition, { registeredAssets: composition.instances.map(i => i.assetUrl), assetExists: url => fs.existsSync('public' + url) });
  assert.deepEqual(report.errors, []);
  for (const object of objects) {
    assert.equal(object.instance.collision.type, 'solid');
    assert.equal(object.interaction.radius, 3);
    assert.equal(object.reward.type, 'REGION_PROGRESS');
    const [x, , z] = object.instance.position;
    const points = composition.paths[0].points;
    const distance = Math.min(...points.slice(1).map((p, i) => {
      const q = points[i], dx = p[0] - q[0], dz = p[2] - q[2];
      const t = Math.max(0, Math.min(1, ((x - q[0]) * dx + (z - q[2]) * dz) / (dx * dx + dz * dz)));
      return Math.hypot(x - q[0] - t * dx, z - q[2] - t * dz);
    }));
    assert.ok(distance > 3.7, `${object.id} must be outside the route corridor`);
    for (const tree of FOREST_COMPOSITION.instances.filter(i => i.kind === 'trees')) assert.ok(Math.hypot(x - tree.position[0], z - tree.position[2]) > 3.5);
  }
});
