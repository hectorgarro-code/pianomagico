import { FOREST_LESSON_CHESTS, ADVENTURE_OBJECT_TYPES, REWARD_TYPES } from '../world/composition/forestAdventureComposition.js';
import { normalizeJourney } from './adventureStart.js';
import { ALL_LESSON_CHESTS } from '../world/composition/routeAdventureComposition.js';
import { FINAL_ADVENTURE_OBJECTS } from '../world/composition/finalAdventureComposition.js';
import { normalizeValley, getValleyProgress, applyValleyEvent } from './valleyProgression.js';
import { normalizeToyState } from './toyState.js';

export const ADVENTURE_STATES = Object.freeze({ LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED' });
export const ALL_ADVENTURE_OBJECTS = [...ALL_LESSON_CHESTS, ...FINAL_ADVENTURE_OBJECTS];
export const findAdventureObject = id => ALL_ADVENTURE_OBJECTS.find(object => object.id === id);

function refreshAvailability(entries) {
  for (const object of ALL_ADVENTURE_OBJECTS) {
    const entry = entries[object.id];
    if (entry.state === ADVENTURE_STATES.COMPLETED || entry.state === ADVENTURE_STATES.IN_PROGRESS) continue;
    entry.state = object.requirements.completedObjects.every(id => entries[id]?.state === ADVENTURE_STATES.COMPLETED)
      ? ADVENTURE_STATES.AVAILABLE : ADVENTURE_STATES.LOCKED;
  }
  return entries;
}

export function createAdventureState(snapshot) {
  const entries = Object.fromEntries(ALL_ADVENTURE_OBJECTS.map(object => [object.id, { state: ADVENTURE_STATES.LOCKED, activityId: object.activityId, claimedRewards: [] }]));
  // Restore only known completed activities whose prerequisites and reward IDs match.
  for (const object of ALL_ADVENTURE_OBJECTS) {
    const saved = [1, 2].includes(snapshot?.schemaVersion) ? snapshot.entries?.[object.id] : null;
    if (saved?.state === ADVENTURE_STATES.COMPLETED && String(saved.activityId) === String(object.activityId)
      && object.requirements.completedObjects.every(id => entries[id].state === ADVENTURE_STATES.COMPLETED)
      && Array.isArray(saved.claimedRewards) && saved.claimedRewards.includes(object.reward.id)) {
      entries[object.id] = { state: ADVENTURE_STATES.COMPLETED, activityId: object.activityId, claimedRewards: [object.reward.id] };
    }
  }
  const supported = [1, 2].includes(snapshot?.schemaVersion);
  const journey = normalizeJourney(supported ? snapshot.journey : null);
  const valley = normalizeValley(snapshot?.schemaVersion === 2 ? snapshot.valley : null, journey, entries);
  for (const object of FINAL_ADVENTURE_OBJECTS) {
    const field = object.type === ADVENTURE_OBJECT_TYPES.SECRET_REWARD ? 'collectedRewards' : 'completedChallenges';
    const id = field === 'collectedRewards' ? object.reward.id : object.id;
    valley[field] = valley[field].filter(value => value !== id);
    if (entries[object.id].state === ADVENTURE_STATES.COMPLETED && (object.type === ADVENTURE_OBJECT_TYPES.CHALLENGE || field === 'collectedRewards')) valley[field].push(id);
  }
  return { schemaVersion: 2, entries: refreshAvailability(entries), lastReward: null, journey, valley, toy:normalizeToyState(supported?snapshot?.toy:null) };
}

export function canRequestAdventureActivity(state, objectId, activityId) {
  const object = findAdventureObject(objectId);
  return [ADVENTURE_OBJECT_TYPES.LESSON_CHEST, ADVENTURE_OBJECT_TYPES.CHALLENGE].includes(object?.type) && String(object.activityId) === String(activityId)
    && [ADVENTURE_STATES.AVAILABLE, ADVENTURE_STATES.COMPLETED].includes(state.entries[objectId]?.state);
}

export function beginAdventureActivity(state, objectId, activityId) {
  if (!canRequestAdventureActivity(state, objectId, activityId)) return state;
  state = applyValleyEvent(state, { type: 'REGION_DISCOVERED', regionId: findAdventureObject(objectId).regionId });
  if (state.entries[objectId].state === ADVENTURE_STATES.COMPLETED) return { ...state, lastReward: null };
  return { ...state, lastReward: null, entries: { ...state.entries, [objectId]: { ...state.entries[objectId], state: ADVENTURE_STATES.IN_PROGRESS } } };
}

export function settleAdventureActivity(state, objectId, result) {
  const object = findAdventureObject(objectId), entry = state.entries[objectId];
  if (!object || !entry || String(result?.activityId) !== String(object.activityId) || entry.state !== ADVENTURE_STATES.IN_PROGRESS) return state;
  const entries = structuredClone(state.entries);
  if (result.completed !== true) {
    entries[objectId].state = ADVENTURE_STATES.AVAILABLE;
    return { ...state, entries: refreshAvailability(entries), lastReward: null };
  }
  if (object.reward.type !== REWARD_TYPES.REGION_PROGRESS) throw new Error('Unsupported adventure reward: use the existing educational XP/medal engine.');
  entries[objectId].state = ADVENTURE_STATES.COMPLETED;
  const firstClaim = !entries[objectId].claimedRewards.includes(object.reward.id);
  if (firstClaim) entries[objectId].claimedRewards.push(object.reward.id);
  const next = { ...state, entries: refreshAvailability(entries), lastReward: firstClaim ? { ...object.reward, objectId } : null };
  return object.type === ADVENTURE_OBJECT_TYPES.CHALLENGE
    ? applyValleyEvent(next, { type: 'CHALLENGE_COMPLETED', id: objectId, completed: true }) : next;
}

export function collectAdventureSecret(state, objectId) {
  const object = findAdventureObject(objectId);
  if (object?.type !== ADVENTURE_OBJECT_TYPES.SECRET_REWARD || state.entries[objectId]?.state !== ADVENTURE_STATES.AVAILABLE
    || !getValleyProgress(state).discoveredRegions.includes(object.regionId)) return state;
  const next = { ...state, entries: { ...state.entries, [objectId]: {
    ...state.entries[objectId], state: ADVENTURE_STATES.COMPLETED, claimedRewards: [object.reward.id],
  } }, lastReward: { ...object.reward, objectId } };
  return applyValleyEvent(next, { type: 'SECRET_REWARD_COLLECTED', id: object.reward.id });
}

export function getAdventureSummary(state) {
  const completed = FOREST_LESSON_CHESTS.filter(object => state.entries[object.id]?.state === ADVENTURE_STATES.COMPLETED);
  return { completedActivityIds: completed.map(object => object.activityId),
    claimedRewardIds: completed.flatMap(object => state.entries[object.id].claimedRewards),
    segmentCompleted: getValleyProgress(state).completedRegions.includes('BOSQUE_DE_LAS_NOTAS') };
}
