export const FIRST_MINUTES = Object.freeze({ started:'first-minutes-started', moved:'first-minutes-moved', restored:'first-minutes-piano', note:'intro-note', box:'intro-box', drop:'intro-box-note', enemy:'intro-skeleton', station:'plaza-first-lesson', activityId:1, rewardId:'pet-elephant' });
export const firstMinutesStarted = adventure => adventure?.valley?.milestones?.includes(FIRST_MINUTES.started) === true;
export function firstMinutesPhase(adventure) {
  if (!firstMinutesStarted(adventure)) return null;
  if (adventure.valley.milestones.includes(FIRST_MINUTES.restored)) return 'DONE';
  if (!adventure.valley.milestones.includes(FIRST_MINUTES.moved)) return 'MOVE';
  if (!adventure.toy.collectedNotes.includes(FIRST_MINUTES.note)) return 'NOTE';
  if (!adventure.toy.defeatedTargets.includes(FIRST_MINUTES.box)) return 'BREAK';
  if (!adventure.toy.collectedNotes.includes(FIRST_MINUTES.drop)) return 'DROP';
  if (!adventure.toy.defeatedTargets.includes(FIRST_MINUTES.enemy)) return 'DEFEND';
  return 'CHEST';
}
export function firstTargetActive(target, adventure) {
  if (!target.firstMinutesOnly) return true;
  if (!firstMinutesStarted(adventure)) return false;
  return (!target.requiresNote || adventure.toy.collectedNotes.includes(target.requiresNote));
}
export function mayRestoreFirstMinutes(result, context, object) {
  return result?.completed === true && !result.cancelled && result.errors >= 0 && result.errors < 3 && Number(result.performanceId) > 0
    && context?.stationId === FIRST_MINUTES.station && object?.id === FIRST_MINUTES.station
    && String(context.activityId) === String(object.introActivityId ?? FIRST_MINUTES.activityId) && String(result.activityId) === String(object.introActivityId ?? FIRST_MINUTES.activityId);
}
