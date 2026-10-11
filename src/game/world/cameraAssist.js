import { wrapAngle } from '../presentation/characterActions.js';

export function assistedCameraYaw({ yaw, rotation, moving, dragging, sinceManual, delta }) {
  if (!moving || dragging || sinceManual < 1.6) return yaw;
  const difference = wrapAngle(rotation - Math.PI - yaw);
  const step = Math.sign(difference) * Math.min(Math.abs(difference) * (1 - Math.exp(-1.8 * delta)), .75 * delta);
  return yaw + step;
}
