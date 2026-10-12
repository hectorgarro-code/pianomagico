import { wrapAngle } from '../presentation/characterActions.js';

export function assistedCameraYaw({ yaw, rotation, moving, dragging, sinceManual, delta }) {
  if (!moving || dragging || sinceManual < 1.6) return yaw;
  const difference = wrapAngle(rotation - Math.PI - yaw);
  const step = Math.sign(difference) * Math.min(Math.abs(difference) * (1 - Math.exp(-1.8 * delta)), .75 * delta);
  return yaw + step;
}

export function terrainSafeCameraHeight(camera, target, heightAt) {
  let height = camera.y;
  for (let i = 1; i < 12; i++) {
    const fraction = i / 12;
    const ground = heightAt(target.x + (camera.x - target.x) * fraction, target.z + (camera.z - target.z) * fraction) + .35;
    height = Math.max(height, target.y + (ground - target.y) / fraction);
  }
  return height;
}
