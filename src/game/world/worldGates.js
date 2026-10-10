import { getValleyProgress } from '../adventure/valleyProgression.js';

export function getActiveWorldColliders(colliders, adventure) {
  const gates = getValleyProgress(adventure).gates;
  return colliders.filter(collider => !collider.gateId || gates[collider.gateId] === 'LOCKED');
}

export function updateGateModels(models, adventure) {
  const gates = getValleyProgress(adventure).gates;
  for (const model of models) model.visible = gates[model.userData.gateId] === 'LOCKED';
}
