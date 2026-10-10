import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaytestRecorder, getDevPlaytest } from './playtestTelemetry.js';
import { createAdventureState, ALL_ADVENTURE_OBJECTS, beginAdventureActivity, settleAdventureActivity } from '../adventure/adventureState.js';
import { applyValleyEvent } from '../adventure/valleyProgression.js';
import { REGION_IDS as R } from '../adventure/valleyBlueprint.js';

const flow = adventure => ({ game: { adventure }, mode: 'WORLD', discovery: null, lastResult: null });
function fixture(storage) {
  let time = 1000;
  return { recorder: createPlaytestRecorder(storage, 'test', () => time), advance: ms => { time += ms; } };
}
const finish = (adventure, object) => settleAdventureActivity(beginAdventureActivity(adventure, object.id, object.activityId), object.id, { activityId: object.activityId, completed: true });

test('starts only explicitly; deduplicates observations without mutating Adventure', () => {
  const { recorder, advance } = fixture();
  const state = flow(createAdventureState()), before = structuredClone(state);
  recorder.observe(state); assert.deepEqual(recorder.export().events, []);
  recorder.begin(); recorder.observe(state); recorder.observe(state); advance(2000);
  const report = recorder.export();
  assert.equal(report.events.filter(e => e.type === 'REGION_ENTERED').length, 1);
  assert.equal(report.summary.totalSeconds, 2);
  assert.equal(report.summary.secondsByRegion[R.PLAZA], 2);
  assert.deepEqual(state, before);
});

test('map/toggle, discovery, activity completion and cancellation are counted once', () => {
  const { recorder } = fixture(); const state = flow(createAdventureState());
  recorder.begin(); recorder.observe(state);
  recorder.record('MAP_OPENED'); recorder.record('NAVIGATION_TOGGLED', { enabled: false });
  state.discovery = { objectId: 'forest-chest-01' }; recorder.observe(state); recorder.observe(state);
  state.mode = 'PIANO'; state.context = { stationId: 'forest-chest-01', activityId: 1 }; recorder.observe(state);
  state.mode = 'TRANSITION_TO_WORLD'; state.lastResult = { stationId: 'forest-chest-01', activityId: 1, cancelled: true }; recorder.observe(state); recorder.observe(state);
  state.lastResult = { stationId: 'forest-chest-01', activityId: 1, completed: true }; recorder.observe(state);
  const report = recorder.export();
  assert.equal(report.summary.mapOpens, 1); assert.equal(report.summary.cancelledActivities, 1);
  for (const type of ['CHEST_DISCOVERED', 'ACTIVITY_STARTED', 'ACTIVITY_COMPLETED']) assert.equal(report.events.filter(e => e.type === type).length, 1);
  assert.equal(report.events.find(e => e.type === 'NAVIGATION_TOGGLED').enabled, false);
});

test('derived regions, optional secret and both route orders reuse existing progression', () => {
  for (const order of [[R.RIVER, R.MOUNTAIN], [R.MOUNTAIN, R.RIVER]]) {
    const { recorder, advance } = fixture(); let adventure = createAdventureState();
    recorder.begin(); recorder.observe(flow(adventure)); advance(1000);
    adventure = applyValleyEvent(adventure, { type: 'REGION_DISCOVERED', regionId: R.FOREST }); recorder.observe(flow(adventure));
    for (const object of ALL_ADVENTURE_OBJECTS.filter(o => o.regionId === R.FOREST)) adventure = finish(adventure, object);
    recorder.observe(flow(adventure));
    adventure = applyValleyEvent(adventure, { type: 'DISCOVERY_RECORDED', id: 'echo-grotto-found' });
    adventure = applyValleyEvent(adventure, { type: 'REGION_DISCOVERED', regionId: R.GROTTO }); recorder.observe(flow(adventure));
    for (const regionId of order) { adventure = applyValleyEvent(adventure, { type: 'REGION_DISCOVERED', regionId }); recorder.observe(flow(adventure)); }
    const report = recorder.export(); assert.deepEqual(report.summary.routeOrder, order);
    assert.equal(report.events.filter(e => e.type === 'SECRET_DISCOVERED').length, 1);
    assert.ok(report.events.some(e => e.type === 'REGION_COMPLETED' && e.regionId === R.FOREST));
  }
});

test('final records real completion before stopping elapsed time', () => {
  const { recorder, advance } = fixture(); let adventure = createAdventureState();
  recorder.begin(); recorder.observe(flow(adventure));
  for (const object of ALL_ADVENTURE_OBJECTS.filter(o => o.activityId != null)) adventure = finish(adventure, object);
  const state = flow(adventure); state.lastResult = { activityId: 35, stationId: 'final', completed: true };
  advance(3000); recorder.observe(state); advance(6000);
  const report = recorder.export(); assert.equal(report.summary.totalSeconds, 3);
  const types = report.events.map(e => e.type);
  assert.ok(types.indexOf('ACTIVITY_COMPLETED') < types.indexOf('FINAL_REACHED'));
  assert.equal(types.filter(t => t === 'FINAL_REACHED').length, 1);
  recorder.begin(true); recorder.observe(state);
  assert.deepEqual(recorder.export(), report);
});

test('local resume excludes time outside session; New resets only telemetry', () => {
  const items = new Map(); const storage = { getItem: k => items.get(k), setItem: (k, v) => items.set(k, v) };
  const { recorder, advance } = fixture(storage);
  recorder.begin(); recorder.observe(flow(createAdventureState())); advance(2000); recorder.pause(); advance(60000);
  recorder.begin(true); advance(1000); assert.equal(recorder.export().summary.totalSeconds, 3);
  const restored = createPlaytestRecorder(storage, 'test'); assert.equal(restored.export().summary.totalSeconds, 3);
  recorder.begin(false); assert.equal(recorder.export().summary.totalSeconds, 0);
  assert.deepEqual(recorder.export().events.map(e => e.type), ['ADVENTURE_STARTED']);
});

test('storage failure/corruption never blocks game and production entry is inert', () => {
  const storage = { getItem: () => '{bad', setItem: () => { throw new Error('quota'); } };
  const { recorder } = fixture(storage); recorder.begin(); recorder.record('MAP_OPENED');
  assert.equal(recorder.export().storageAvailable, false);
  assert.equal(recorder.export().summary.mapOpens, 1);
  assert.equal(getDevPlaytest(1), null);
});
