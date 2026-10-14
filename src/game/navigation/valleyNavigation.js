import { VALLEY_REGIONS, REGION_IDS } from '../adventure/valleyBlueprint.js';
import { getValleyProgress } from '../adventure/valleyProgression.js';
import { ALL_ADVENTURE_OBJECTS } from '../adventure/adventureState.js';
import { PLAZA_COMPOSITION } from '../world/composition/plazaComposition.js';
import { FOREST_ADVENTURE_COMPOSITION as FOREST_COMPOSITION } from '../world/composition/forestAdventureComposition.js';
import { JUNCTION_COMPOSITION } from '../world/composition/junctionComposition.js';
import { RIVER_COMPOSITION } from '../world/composition/riverComposition.js';
import { MOUNTAIN_COMPOSITION } from '../world/composition/mountainComposition.js';
import { GROTTO_COMPOSITION } from '../world/composition/grottoComposition.js';
import { RUINS_COMPOSITION } from '../world/composition/ruinsComposition.js';
import { OBSERVATORY_COMPOSITION } from '../world/composition/observatoryComposition.js';
import {EXPLORATION_SECRETS} from '../world/composition/explorationSecrets.js';

export const MAP_COMPOSITIONS = [PLAZA_COMPOSITION, FOREST_COMPOSITION, JUNCTION_COMPOSITION,
  RIVER_COMPOSITION, MOUNTAIN_COMPOSITION, GROTTO_COMPOSITION, RUINS_COMPOSITION, OBSERVATORY_COMPOSITION];
const xz = p => ({ x: p[0], z: p[2] });
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const pathPoints = MAP_COMPOSITIONS.flatMap(c => c.paths.flatMap(p => p.points.map(xz)));
export const MAP_BOUNDS = Object.freeze({
  minX: Math.min(...pathPoints.map(p => p.x)) - 12, maxX: Math.max(...pathPoints.map(p => p.x)) + 12,
  minZ: Math.min(...pathPoints.map(p => p.z)) - 10, maxZ: Math.max(...pathPoints.map(p => p.z)) + 10
});
export const MAP_SIZE = Object.freeze({ width: 420, height: 680, padding: 30 });

// Uniform scale preserves distances and orientation; north (-Z) is up.
export function worldToMap(position, size = MAP_SIZE, bounds = MAP_BOUNDS) {
  const scale = Math.min((size.width - size.padding * 2) / (bounds.maxX - bounds.minX),
    (size.height - size.padding * 2) / (bounds.maxZ - bounds.minZ));
  return { x: size.width / 2 + (position.x - (bounds.minX + bounds.maxX) / 2) * scale,
    y: size.height / 2 + (position.z - (bounds.minZ + bounds.maxZ) / 2) * scale };
}
export function playerMapMarker(pose) {
  return { ...worldToMap(pose.position), angle: 180 - pose.rotation * 180 / Math.PI };
}
const primaryComposition = id => MAP_COMPOSITIONS.find(c => c.regionId === id);
const regionalPath = composition => composition.paths.find(p =>
  p.id === 'ruins-ceremonial-aisle' || p.id === 'observatory-arrival') || composition.paths[0];
const entryTarget = id => {
  const composition = primaryComposition(id);
  const path = regionalPath(composition);
  const point = composition.entries?.[0]?.position || path.points[path.id === 'ruins-ceremonial-aisle' ? 1 : 0];
  return { id: 'entry-' + id, regionId: id, position: xz(point), label: VALLEY_REGIONS.find(r => r.id === id).name, kind: 'ENTRY' };
};
const nextChest = (adventure, regionId) => {
  const object = ALL_ADVENTURE_OBJECTS.find(o => o.regionId === regionId && o.type !== 'SECRET_REWARD'
    && ['AVAILABLE', 'IN_PROGRESS'].includes(adventure.entries[o.id]?.state));
  return object ? { id: object.id, regionId, position: xz(object.instance.position), label: object.label, kind: object.type, interactionRadius: object.interaction.radius } : null;
};

export function resolveObjectiveTarget(adventure, assisted = true) {
  if (!assisted) return null;
  const progress = getValleyProgress(adventure), ids = REGION_IDS;
  const regionTarget = id => progress.currentRegion === id ? nextChest(adventure, id) || entryTarget(id) : entryTarget(id);
  switch (progress.currentObjective.id) {
    case 'EXPLORE_PLAZA': return { id: 'plaza-atrium', regionId: ids.PLAZA,
      position: xz(PLAZA_COMPOSITION.pointsOfInterest[0].position), label: 'Plaza de las Notas', kind: 'LANDMARK' };
    case 'FIND_FOREST_PATH': return entryTarget(ids.FOREST);
    case 'COMPLETE_FOREST': return nextChest(adventure, ids.FOREST);
    case 'EXPLORE_ROUTES': return { id: 'bifurcation', regionId: ids.FOREST,
      position: xz(JUNCTION_COMPOSITION.paths[0].points.at(-1)), label: 'Rio o Montana', kind: 'CHOICE',
      choices: [entryTarget(ids.RIVER), entryTarget(ids.MOUNTAIN)] };
    case 'EXPLORE_RIVER': return regionTarget(ids.RIVER);
    case 'EXPLORE_MOUNTAIN': return regionTarget(ids.MOUNTAIN);
    case 'EXPLORE_REMAINING_ROUTE': return regionTarget(progress.completedRegions.includes(ids.RIVER) ? ids.MOUNTAIN : ids.RIVER);
    case 'REACH_RUINS': return entryTarget(ids.RUINS);
    case 'COMPLETE_RUINS': return nextChest(adventure, ids.RUINS);
    case 'REACH_OBSERVATORY': return entryTarget(ids.OBSERVATORY);
    case 'FINAL_CHALLENGE': return nextChest(adventure, ids.OBSERVATORY);
    default: return null;
  }
}

export function getValleyMap(adventure, target = resolveObjectiveTarget(adventure)) {
  const progress = getValleyProgress(adventure);
  const known = new Set(progress.discoveredRegions);
  const regions = VALLEY_REGIONS.filter(r => known.has(r.id)).map(r => {
    const points = regionalPath(primaryComposition(r.id)).points;
    const center = points[Math.floor(points.length / 2)];
    return { id: r.id, name: r.name, state: progress.regions[r.id].state, position: xz(center) };
  });
  const paths = MAP_COMPOSITIONS.filter(c => known.has(c.regionId)).flatMap(c => c.paths.map(p => ({
    id: p.id, regionId: c.regionId, points: p.points.map(xz)
  })));
  // Region discovery is the existing physical exploration authority. No new save/store.
  const chests = ALL_ADVENTURE_OBJECTS.filter(o => known.has(o.regionId)).map(o => ({
    id: o.id, regionId: o.regionId, label: o.label, position: xz(o.instance.position),
    state: adventure.entries[o.id]?.state || 'LOCKED', type: o.type
  }));
  const secrets=EXPLORATION_SECRETS.filter(s=>s.enabled!==false&&adventure.toy?.discoveredSecrets?.includes(s.id)).map(s=>({id:s.id,position:xz(s.position)}));
  return { regions, paths, chests, secrets, target, currentRegion: progress.currentRegion };
}

export function getDirectionHint(position, target, cameraYaw, projected) {
  if (!target) return null;
  const meters = distance(position, target.position);
  const bearing = Math.atan2(target.position.x - position.x, -(target.position.z - position.z));
  let angle = bearing + cameraYaw;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));
  const visible = projected && Math.abs(projected.x) < .8 && Math.abs(projected.y) < .8 && projected.z > -1 && projected.z < 1;
  return { angle, meters, subdued: meters < 12 && visible, arrived: meters < Math.min(3, target.interactionRadius || 3) };
}
