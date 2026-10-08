import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdventureState, beginAdventureActivity, settleAdventureActivity, getAdventureSummary } from './adventureState.js';
import { applyValleyEvent as event, getValleyProgress as progress, requirementMet, getPlayableRegionAt, validateWorldGateBindings } from './valleyProgression.js';
import { REGION_IDS as R, VALLEY_REGIONS, WORLD_GATES } from './valleyBlueprint.js';
import { FOREST_LESSON_CHESTS } from '../world/composition/forestAdventureComposition.js';
import { WORLD_BLUEPRINT } from '../world/worldBlueprint.js';
import { createAdventurePersistence } from '../services/adventurePersistence.js';
import { createWorldActivityState, worldActivityReducer as reduce } from '../state/worldActivityFlow.js';

const discover = (state, regionId) => event(state, { type: 'REGION_DISCOVERED', regionId });
function forestComplete() {
  let state = discover(createAdventureState(), R.FOREST);
  for (const object of FOREST_LESSON_CHESTS) state = settleAdventureActivity(beginAdventureActivity(state, object.id, object.activityId), object.id, { activityId: object.activityId, completed: true });
  return state;
}
function prototypeComplete(state, id) {
  state = discover(state, id);
  const region = VALLEY_REGIONS.find(item => item.id === id);
  for (const req of region.regionCompletionRequirements) state = event(state, { type: 'MILESTONE_REACHED', id: req.id });
  return state;
}

test('initial Valley knows Plaza, exposes Forest, locks future routes and has no educational currency', () => {
  const state = createAdventureState(), view = progress(state);
  assert.equal(state.schemaVersion, 2);
  assert.equal(view.currentRegion, R.PLAZA);
  assert.deepEqual(view.discoveredRegions, [R.PLAZA]);
  assert.equal(view.regions[R.PLAZA].state, 'DISCOVERED');
  assert.deepEqual(view.availableRegions, [R.PLAZA, R.FOREST]);
  assert.equal(view.regions[R.FOREST].state, null); // Available is not discovered.
  assert.equal(view.regions[R.RIVER].state, 'LOCKED');
  assert.deepEqual(view.regions[R.RIVER].missingUnlockRequirements, [{ type: 'REGION_COMPLETED', id: R.FOREST }]);
  assert.equal(view.currentObjective.id, 'EXPLORE_PLAZA');
  assert.equal(view.valleyCompleted, false);
  for (const key of ['xp', 'medals', 'ranks', 'performances']) assert.equal(Object.hasOwn(state.valley, key), false);
});

test('region IDs and logical topology match the actual World Blueprint', () => {
  assert.deepEqual(new Set(VALLEY_REGIONS.map(region => region.id)), new Set(WORLD_BLUEPRINT.regions.map(region => region.id)));
  assert.deepEqual(WORLD_GATES.find(gate => gate.id === 'routes_to_ruins').from, [R.RIVER, R.MOUNTAIN]);
  assert.equal(VALLEY_REGIONS.find(region => region.id === R.GROTTO).secret, true);
});

test('physical exploration discovers Forest, opens its gate and updates objective without XP', () => {
  let flow = reduce(createWorldActivityState(), { type: 'START_ADVENTURE' });
  flow = reduce(flow, { type: 'OBJECTIVE', position: { x: 4, z: -11 }, distance: 5 });
  assert.equal(progress(flow.game.adventure).currentObjective.id, 'FIND_FOREST_PATH');
  flow = reduce(flow, { type: 'OBJECTIVE', position: { x: 18, z: -22 }, distance: 30 });
  const view = progress(flow.game.adventure);
  assert.equal(view.currentRegion, R.FOREST);
  assert.equal(view.regions[R.FOREST].state, 'ACTIVE');
  assert.equal(view.gates.plaza_to_forest, 'OPEN');
  assert.equal(view.currentObjective.id, 'COMPLETE_FOREST');
  assert.equal(flow.game.progression.xp, 0);
  flow = reduce(flow, { type: 'OBJECTIVE', position: { x: 0, z: 5 }, distance: 45 });
  assert.equal(progress(flow.game.adventure).currentRegion, R.PLAZA);
  assert.equal(progress(flow.game.adventure).regions[R.FOREST].state, 'DISCOVERED');
  assert.equal(getPlayableRegionAt({ x: -26, z: -75 }), null);
});

test('three real chest completions declaratively complete Forest and unlock both routes', () => {
  const state = forestComplete(), view = progress(state);
  assert.equal(view.regions[R.FOREST].state, 'COMPLETED');
  assert.ok(view.availableRegions.includes(R.RIVER));
  assert.ok(view.availableRegions.includes(R.MOUNTAIN));
  assert.equal(view.gates.forest_to_river, 'AVAILABLE');
  assert.equal(view.gates.forest_to_mountain, 'AVAILABLE');
  assert.equal(view.currentObjective.id, 'EXPLORE_ROUTES');
  assert.equal(getAdventureSummary(state).segmentCompleted, true);
  assert.equal(view.discoveredRegions.includes(R.RIVER), false);
});

for (const route of [R.RIVER, R.MOUNTAIN]) test(`${route} alone cannot unlock Ruins`, () => {
  const view = progress(prototypeComplete(forestComplete(), route));
  assert.equal(view.regions[R.RUINS].state, 'LOCKED');
  assert.equal(view.gates.routes_to_ruins, 'LOCKED');
});

test('both route orders converge to Ruins, Observatory and Valley completion without Grotto', () => {
  for (const order of [[R.RIVER, R.MOUNTAIN], [R.MOUNTAIN, R.RIVER]]) {
    let state = forestComplete();
    for (const id of order) state = prototypeComplete(state, id);
    assert.ok(progress(state).availableRegions.includes(R.RUINS));
    assert.equal(progress(state).currentObjective.id, 'REACH_RUINS');
    state = prototypeComplete(state, R.RUINS);
    assert.equal(progress(state).gates.ruins_to_observatory, 'AVAILABLE');
    assert.equal(progress(state).currentObjective.id, 'REACH_OBSERVATORY');
    state = prototypeComplete(state, R.OBSERVATORY);
    assert.equal(progress(state).valleyCompleted, true);
    assert.equal(progress(state).currentObjective.id, 'VALLEY_COMPLETED');
    assert.equal(progress(state).completedRegions.includes(R.GROTTO), false);
  }
});

test('locked discovery/open attempts and repeated events are rejected or idempotent', () => {
  const initial = createAdventureState();
  assert.equal(discover(initial, R.RIVER), initial);
  assert.equal(discover(initial, 'UNKNOWN'), initial);
  assert.equal(event(initial, null), initial);
  assert.equal(event(initial, { type: 'GATE_OPENED', gateId: 'forest_to_river' }), initial);
  assert.equal(event(initial, { type: 'GATE_OPENED', gateId: 'bad' }), initial);
  const entered = discover(initial, R.FOREST);
  assert.equal(discover(entered, R.FOREST), entered);
  assert.equal(event(entered, { type: 'GATE_OPENED', gateId: 'plaza_to_forest' }), entered);
});

test('challenge, discovery, milestone and secret reward contracts contribute only explicit facts', () => {
  let state = discover(createAdventureState(), R.FOREST);
  assert.equal(event(state, { type: 'CHALLENGE_COMPLETED', id: 'future-challenge', completed: false }), state);
  state = event(state, { type: 'CHALLENGE_COMPLETED', id: 'future-challenge', completed: true });
  state = event(state, { type: 'SECRET_REWARD_COLLECTED', id: 'optional-reward' });
  state = event(state, { type: 'DISCOVERY_RECORDED', id: 'echo-grotto-found' });
  assert.ok(progress(state).availableRegions.includes(R.GROTTO));
  assert.equal(progress(state).discoveredRegions.includes(R.GROTTO), false);
  assert.equal(requirementMet({ type: 'CHALLENGE_COMPLETED', id: 'future-challenge' }, state, new Set()), true);
  assert.equal(requirementMet({ type: 'SECRET_REWARD', id: 'optional-reward' }, state, new Set()), true);
  assert.equal(requirementMet({ type: 'XP', id: 5000 }, state, new Set()), false);
  assert.equal(event(state, { type: 'SECRET_REWARD_COLLECTED', id: 'optional-reward' }), state);
});

test('v1 migration preserves validated chests, claims, journey and character outside Adventure', () => {
  const previous = forestComplete();
  const old = { schemaVersion: 1, entries: previous.entries, journey: { started: true, objective: 'FIND_FIRST_CHEST' } };
  const migrated = createAdventureState(old);
  assert.deepEqual(migrated.entries, old.entries);
  assert.deepEqual(migrated.journey, old.journey);
  assert.equal(progress(migrated).regions[R.FOREST].state, 'COMPLETED');
  assert.ok(progress(migrated).availableRegions.includes(R.RIVER));
  const legacy = createAdventureState({ schemaVersion: 1, journey: { started: true, objective: 'FIND_FIRST_CHEST' } });
  assert.ok(progress(legacy).discoveredRegions.includes(R.FOREST));
  assert.equal(progress(legacy).completedRegions.includes(R.FOREST), false);
});

test('v2 roundtrip persists facts, derives gates/objective/completion and retains legacy storage key', () => {
  const values = new Map([['educational', 'untouched']]);
  const adapter = createAdventurePersistence(() => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }));
  let state = forestComplete();
  for (const id of [R.RIVER, R.MOUNTAIN, R.RUINS, R.OBSERVATORY]) state = prototypeComplete(state, id);
  adapter.save(1, state);
  const restored = adapter.load(1);
  assert.deepEqual(progress(restored), progress(state));
  assert.equal(values.has('valle-adventure-v1-user-1'), true);
  assert.equal(values.get('educational'), 'untouched');
  assert.equal(progress(adapter.load(2)).valleyCompleted, false);
  assert.equal(progress(createWorldActivityState(restored).game.adventure).currentRegion, R.PLAZA);
});

test('reset clears Valley facts, region completion and gates, never educational state or character', () => {
  let state = forestComplete();
  for (const id of [R.RIVER, R.MOUNTAIN, R.RUINS, R.OBSERVATORY]) state = prototypeComplete(state, id);
  let flow = createWorldActivityState(state);
  flow = reduce(flow, { type: 'PROFILE', profile: { avatarId: 2, total_score: 25200 } });
  const education = flow.game.progression;
  const reset = reduce(flow, { type: 'RESET_ADVENTURE' });
  assert.deepEqual(progress(reset.game.adventure), progress(createAdventureState()));
  assert.deepEqual(reset.game.progression, education);
  assert.equal(reset.game.player.characterId, 2);
});

test('partial, corrupted and unknown saved facts do not grant region completions or unlocks', () => {
  const state = createAdventureState({ schemaVersion: 2, valley: { currentRegion: 'BAD', discoveredRegions: ['BAD', R.RUINS], milestones: ['ruins-prototype-complete'], openedGates: ['routes_to_ruins', 'bad'] } });
  assert.equal(progress(state).regions[R.RUINS].state, 'LOCKED');
  assert.equal(progress(state).gates.routes_to_ruins, 'LOCKED');
  assert.equal(progress(state).currentRegion, R.PLAZA);
  assert.equal(progress(state).valleyCompleted, false);
});

test('replay and duplicate callbacks cannot re-award Forest progress after migration', () => {
  const state = createAdventureState(forestComplete());
  const replay = beginAdventureActivity(state, FOREST_LESSON_CHESTS[2].id, 3);
  const repeated = settleAdventureActivity(replay, FOREST_LESSON_CHESTS[2].id, { activityId: 3, completed: true });
  assert.equal(repeated.lastReward, null);
  assert.equal(getAdventureSummary(repeated).claimedRewardIds.length, 3);
  assert.equal(progress(repeated).regions[R.FOREST].state, 'COMPLETED');
});

test('future Composition gates reference logical gates and existing authored exits or instances', () => {
  const composition = { regionId: R.FOREST, instances: [], exits: [{ id: 'river-exit' }], gates: [{ id: 'river-link', gateId: 'forest_to_river', exitId: 'river-exit' }] };
  assert.deepEqual(validateWorldGateBindings(composition), []);
  assert.deepEqual(validateWorldGateBindings({ regionId: R.PLAZA }), []);
  assert.deepEqual(validateWorldGateBindings({ ...composition, gates: null }), ['INVALID_GATES']);
  assert.deepEqual(validateWorldGateBindings({ ...composition, gates: [{ id: '', gateId: 'forest_to_river' }] }), ['INVALID_GATE_BINDING']);
  assert.deepEqual(validateWorldGateBindings({ ...composition, regionId: R.OBSERVATORY }), ['INVALID_GATE_BINDING']);
  assert.deepEqual(validateWorldGateBindings({ ...composition, gates: [{ id: 'bad', gateId: 'invented', instanceId: 'missing' }] }), ['INVALID_GATE_BINDING', 'MISSING_GATE_INSTANCE']);
});
