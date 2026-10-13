import { getValleyProgress } from '../adventure/valleyProgression.js';

export function getActiveWorldColliders(colliders, adventure) {
  const gates = getValleyProgress(adventure).gates;
  return colliders.filter(collider => !collider.gateId || gates[collider.gateId] === 'LOCKED');
}

export function updateGateModels(models, adventure, onOpened) {
  const gates = getValleyProgress(adventure).gates;
  for (const model of models) {
    const locked=gates[model.userData.gateId] === 'LOCKED';
    const wasLocked=model.userData.gateWasLocked;
    model.visible=locked;model.userData.gateWasLocked=locked;
    if(wasLocked===true && !locked)onOpened?.(model);
  }
}
