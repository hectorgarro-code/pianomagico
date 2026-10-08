export const OBJECTIVES = Object.freeze({
  EXPLORE_PLAZA: 'Explora la Plaza',
  FIND_FOREST_PATH: 'Busca el camino hacia el Bosque',
  FIND_FIRST_CHEST: 'Encuentra tu primer cofre de leccion'
});

export function normalizeJourney(snapshot) {
  const objective = Object.hasOwn(OBJECTIVES, snapshot?.objective) ? snapshot.objective : 'EXPLORE_PLAZA';
  return { started: snapshot?.started === true, objective };
}

export function hasAdventureProgress(adventure) {
  return adventure.journey.started || Object.values(adventure.entries).some(entry => entry.state === 'COMPLETED');
}

export function getNewAdventurePhase(adventure, confirmed = false) {
  return hasAdventureProgress(adventure) && confirmed !== true ? 'CONFIRM_NEW' : 'CHARACTER';
}

export function advanceObjective(journey, position, distance) {
  if (!journey.started) return journey;
  // The authored entrance passes through the east side of the Plaza, into clearing one.
  if (position.z <= -19.5 && position.x >= 6 && position.x <= 25) {
    return journey.objective === 'FIND_FIRST_CHEST' ? journey : { ...journey, objective: 'FIND_FIRST_CHEST' };
  }
  if (journey.objective === 'EXPLORE_PLAZA' && (distance >= 3 || position.z < -10)) {
    return { ...journey, objective: 'FIND_FOREST_PATH' };
  }
  return journey;
}
