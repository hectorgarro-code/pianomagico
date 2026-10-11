import { hasAdventureProgress } from '../adventure/adventureStart.js';
import { getValleyProgress } from '../adventure/valleyProgression.js';
import { VALLEY_REGIONS } from '../adventure/valleyBlueprint.js';

export const initialEntry = () => ({ screen: 'TITLE', userId: null });
export function entryReducer(state, event) {
  switch (event.type) {
    case 'ENTER': return { screen: 'PROFILES', userId: null };
    case 'BACK': return initialEntry();
    case 'EXIT': return { screen: 'PROFILES', userId: null };
    case 'PROFILE': return Number.isSafeInteger(Number(event.userId)) && Number(event.userId) > 0
      ? { screen: 'ADVENTURE', userId: Number(event.userId) } : state;
    default: return state;
  }
}
export function entrySummary(adventure) {
  const progress = getValleyProgress(adventure);
  const main = VALLEY_REGIONS.filter(region => !region.optional);
  const completed = main.filter(region => progress.completedRegions.includes(region.id)).length;
  return { existing: hasAdventureProgress(adventure), objective: progress.currentObjective.text,
    region: VALLEY_REGIONS.find(region => region.id === progress.currentRegion)?.name || 'Plaza de las Notas',
    completed, total: main.length, percent: Math.round(completed / main.length * 100) };
}

// Only public, authored approaches. No secret or final camera shots.
export const TITLE_SHOTS = [
  { position: [12, 3.6, 14], target: [1, 1.6, -1], mobile: [7, 4, 16] },
  { position: [-9, 3.3, 8], target: [4, 1.4, -9], mobile: [-6, 3.7, 12] },
  { position: [19, 4.4, -10], target: [10, 2, -23], mobile: [18, 4.8, -7] },
];
export function titleCamera(seconds, mobile = false, reducedMotion = false) {
  const time = reducedMotion ? 0 : Math.max(0, seconds - 12);
  const index = Math.floor(time / 24) % TITLE_SHOTS.length, next = (index + 1) % TITLE_SHOTS.length;
  const t = Math.max(0, (time % 24 - 16) / 8), blend = t * t * (3 - 2 * t);
  const a = TITLE_SHOTS[index], b = TITLE_SHOTS[next];
  const lerp = (from, to) => from.map((value, i) => value + (to[i] - value) * blend);
  const position = lerp(mobile ? a.mobile : a.position, mobile ? b.mobile : b.position);
  if (!reducedMotion) { position[0] += Math.sin(seconds / 13) * .35; position[1] += Math.sin(seconds / 17) * .08; }
  return { position, target: lerp(a.target, b.target), shot: index };
}
