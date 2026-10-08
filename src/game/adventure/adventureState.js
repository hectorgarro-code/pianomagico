import { FOREST_LESSON_CHESTS, ADVENTURE_OBJECT_TYPES, REWARD_TYPES } from '../world/composition/forestAdventureComposition.js';
import { normalizeJourney } from './adventureStart.js';

export const ADVENTURE_STATES = Object.freeze({ LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED' });
export const findAdventureObject = id => FOREST_LESSON_CHESTS.find(object => object.id === id);

function refreshAvailability(entries) {
  for (const object of FOREST_LESSON_CHESTS) {
    const entry = entries[object.id];
    if (entry.state === ADVENTURE_STATES.COMPLETED || entry.state === ADVENTURE_STATES.IN_PROGRESS) continue;
    entry.state = object.requirements.completedObjects.every(id => entries[id]?.state === ADVENTURE_STATES.COMPLETED)
      ? ADVENTURE_STATES.AVAILABLE : ADVENTURE_STATES.LOCKED;
  }
  return entries;
}

export function createAdventureState(snapshot) {
  const entries = Object.fromEntries(FOREST_LESSON_CHESTS.map(object => [object.id, { state: ADVENTURE_STATES.LOCKED, activityId: object.activityId, claimedRewards: [] }]));
  // Restore only known completed activities whose prerequisites and reward IDs match.
  for (const object of FOREST_LESSON_CHESTS) {
    const saved = snapshot?.schemaVersion === 1 ? snapshot.entries?.[object.id] : null;
    if (saved?.state === ADVENTURE_STATES.COMPLETED && String(saved.activityId) === String(object.activityId)
      && object.requirements.completedObjects.every(id => entries[id].state === ADVENTURE_STATES.COMPLETED)
      && Array.isArray(saved.claimedRewards) && saved.claimedRewards.includes(object.reward.id)) {
      entries[object.id] = { state: ADVENTURE_STATES.COMPLETED, activityId: object.activityId, claimedRewards: [object.reward.id] };
    }
  }
  return { schemaVersion: 1, entries: refreshAvailability(entries), lastReward: null, journey: normalizeJourney(snapshot?.schemaVersion === 1 ? snapshot.journey : null) };
}

export function canRequestAdventureActivity(state, objectId, activityId) {
  const object = findAdventureObject(objectId);
  return object?.type === ADVENTURE_OBJECT_TYPES.LESSON_CHEST && String(object.activityId) === String(activityId)
    && [ADVENTURE_STATES.AVAILABLE, ADVENTURE_STATES.COMPLETED].includes(state.entries[objectId]?.state);
}

export function beginAdventureActivity(state, objectId, activityId) {
  if (!canRequestAdventureActivity(state, objectId, activityId)) return state;
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
  return { ...state, entries: refreshAvailability(entries), lastReward: firstClaim ? { ...object.reward, objectId } : null };
}

export function getAdventureSummary(state) {
  const completed = FOREST_LESSON_CHESTS.filter(object => state.entries[object.id]?.state === ADVENTURE_STATES.COMPLETED);
  return { completedActivityIds: completed.map(object => object.activityId),
    claimedRewardIds: completed.flatMap(object => state.entries[object.id].claimedRewards),
    segmentCompleted: completed.length === FOREST_LESSON_CHESTS.length };
}
