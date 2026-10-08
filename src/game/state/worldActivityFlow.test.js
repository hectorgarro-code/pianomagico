import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldActivityState, worldActivityReducer as reduce, restoreWorldContext, GAME_MODES } from './worldActivityFlow.js';
import { CollisionWorld } from '../world/collision/CollisionWorld.js';
import { normalizeGameProfile } from '../services/profileAdapter.js';
import { buildLessonResult } from '../piano/lessonResult.js';

const song = { id: 2, title: 'Subiendo la Escalera', sequence: ['C', 'D', 'E'] };
const context = { stationId: 'plaza-station-01', regionId: 'PLAZA_DE_LAS_NOTAS', worldId: 'valle_notas', position: { x: 6.2, y: 0, z: 2.1 }, rotation: 1.3, camera: { currentYaw: .7, targetYaw: .7 } };
const request = state => reduce(state, { type: 'REQUEST_PIANO', song, context, mode: 'solo' });
const enter = () => reduce(request(createWorldActivityState()), { type: 'TRANSITION_COMPLETE', target: 'PIANO' });

test('WORLD -> transition -> PIANO snapshots real context and rejects duplicate activation', () => {
  const initial = createWorldActivityState(), next = request(initial);
  assert.equal(next.mode, GAME_MODES.TRANSITION_TO_PIANO);
  assert.deepEqual(next.context.position, context.position);
  assert.notEqual(next.context.position, context.position);
  assert.equal(next.context.stationId, context.stationId);
  assert.equal(next.context.activityId, song.id);
  assert.equal(next.context.regionId, context.regionId);
  assert.deepEqual(next.context.camera, context.camera);
  assert.equal(next.game.player.rotation, context.rotation);
  assert.equal(request(next), next);
  assert.equal(enter().mode, GAME_MODES.PIANO);
});
test('cancel returns through transition without completing or moving the world', () => {
  const piano = enter(), returning = reduce(piano, { type: 'RETURN', result: { completed: false, cancelled: true } });
  assert.equal(returning.mode, GAME_MODES.TRANSITION_TO_WORLD);
  assert.equal(returning.lastResult.cancelled, true);
  assert.deepEqual(returning.game.world.completedLessons, []);
  assert.deepEqual(returning.game.player.position, context.position);
  assert.equal(reduce(returning, { type: 'TRANSITION_COMPLETE', target: 'WORLD' }).mode, GAME_MODES.WORLD);
});
test('completion belongs to the originating station; cancellation/replay preserves success', () => {
  const completed = reduce(enter(), { type: 'RETURN', result: { activityId: song.id, completed: true, score: 2400, xp: 600 } });
  assert.equal(completed.game.world.stationResults[context.stationId].xp, 600);
  assert.deepEqual(completed.game.world.completedLessons, [song.id]);
  assert.equal(reduce(completed, { type: 'RETURN', result: { completed: false } }), completed);
  let replay = request(reduce(completed, { type: 'TRANSITION_COMPLETE', target: 'WORLD' }));
  replay = reduce(replay, { type: 'TRANSITION_COMPLETE', target: 'PIANO' });
  replay = reduce(replay, { type: 'RETURN', result: { cancelled: true } });
  assert.equal(replay.game.world.stationResults[context.stationId].completed, true);
});
test('unrelated results and stale transition callbacks cannot switch modes', () => {
  const piano = enter();
  assert.equal(reduce(piano, { type: 'RETURN', result: { activityId: 99, completed: true } }), piano);
  assert.equal(reduce(piano, { type: 'TRANSITION_COMPLETE', target: 'WORLD' }), piano);
});
test('return is ground-aligned and depenetrated with CollisionWorld, preserving context', () => {
  const collisions = new CollisionWorld([{ type: 'solid', shape: 'circle', x: 6.2, z: 2.1, radius: .5 }]);
  const safe = restoreWorldContext(context, collisions, () => 1.6);
  assert.equal(collisions.overlaps(safe.position), false);
  assert.equal(safe.position.y, 1.6);
  assert.equal(safe.rotation, context.rotation);
  assert.equal(safe.stationId, context.stationId);
  assert.deepEqual(context.position, { x: 6.2, y: 0, z: 2.1 });
  const empty = restoreWorldContext(context, new CollisionWorld(), () => 0);
  assert.deepEqual(empty.position, context.position);
});
test('profile mapping accepts SQL/camelCase contracts and chosen local avatar without mutation', () => {
  const raw = { name: 'Musico', avatar_id: '3', total_score: 500 };
  assert.equal(normalizeGameProfile(raw).avatarId, 3);
  assert.equal(normalizeGameProfile(raw, '4').avatar_id, 4);
  assert.equal(normalizeGameProfile({ name: 'Musico', avatarId: 2 }).avatarId, 2);
  assert.equal(raw.avatar_id, '3');
  assert.equal(normalizeGameProfile({ error: 'Database unavailable' }), null);
});
test('lesson result reports real score delta and failure criteria, without fabricated accuracy', () => {
  const result = buildLessonResult({ songId: 2, totalScore: 1400, initialScore: 800, errors: 0, medals: [1, 2] });
  assert.equal(result.completed, true); assert.equal(result.xp, 600);
  assert.deepEqual(result.medals, [2]); assert.equal('accuracy' in result, false);
  assert.equal(buildLessonResult({ songId: 2, totalScore: 900, initialScore: 800, errors: 3, medals: [] }).completed, false);
});
test('stopMic is idempotent and no longer references undeclared activeNote', async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem() {}, removeItem() {} } });
  try {
    const { usePianoMicStore } = await import('../../hooks/usePianoMicStore.js');
    assert.doesNotThrow(() => { usePianoMicStore.getState().stopMic(); usePianoMicStore.getState().stopMic(); });
    assert.equal(usePianoMicStore.getState().isListening, false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
