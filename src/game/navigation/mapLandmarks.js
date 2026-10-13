import { MAP_COMPOSITIONS, worldToMap } from './valleyNavigation.js';
import { RIVER_CHANNEL } from '../world/composition/riverComposition.js';

export const MAP_LABEL_OFFSETS = Object.freeze({
  PLAZA_DE_LAS_NOTAS: [-65, 70], BOSQUE_DE_LAS_NOTAS: [82, 24],
  RIO_DEL_RITMO: [-32, -38], MONTANA_DE_LAS_MELODIAS: [30, -38],
  GRUTA_DEL_ECO: [-16, 32], RUINAS_DEL_GRAN_PENTAGRAMA: [0, 39], OBSERVATORIO_MUSICAL: [0, -40],
});

// A small, authored semantic selection, referencing actual instance IDs, not
// invented map coordinates. This never places anything in the 3D world.
const selections = [
  ['atrium-column-front-west', 'architecture'], ['west-grove-main', 'tree'], ['east-grove-front', 'tree'],
  ['forest-master-tree', 'tree', 1.35], ['forest-west-04', 'pines'], ['forest-east-04', 'pines'],
  ['junction-backdrop', 'pines'],
  ['river-bridge-deck', 'bridge'], ['river-south-tree', 'tree'], ['river-east-bank-rock', 'rocks'],
  ['mountain-east-ridge', 'mountain'], ['mountain-north-ridge', 'mountain'], ['mountain-first-pine', 'pines'],
  ['grotto-north-wall', 'rocks'], ['grotto-west-wall', 'mountain'],
  ['ruins-wall-0--13', 'ruins'], ['ruins-wall-1-13', 'ruins'],
  ['observatory-column-2', 'colonnade'], ['ascent-rock-east', 'rocks'],
];
export const MAP_LANDMARKS = Object.freeze(selections.map(([instanceId, asset, scale = 1]) => {
  const composition = MAP_COMPOSITIONS.find(c => c.instances.some(i => i.id === instanceId));
  const instance = composition?.instances.find(i => i.id === instanceId);
  if (!instance) throw new Error('Missing cartography landmark: ' + instanceId);
  return { id: instanceId, regionId: composition.regionId, asset, scale,
    position: { x: instance.position[0], z: instance.position[2] } };
}));

export function mapIllustration(model) {
  const known = new Set(model.regions.map(r => r.id));
  const landmarks = MAP_LANDMARKS.filter(l => known.has(l.regionId)).flatMap(landmark=>{
    const instance=MAP_COMPOSITIONS.find(c=>c.regionId===landmark.regionId)?.instances.find(i=>i.id===landmark.id);
    return instance?[{...landmark,position:{x:instance.position[0],z:instance.position[2]}}]:[];
  });
  const water = known.has('RIO_DEL_RITMO') ? RIVER_CHANNEL.map(([x, z]) => ({ x, z })) : [];
  const labels = model.regions.map(region => {
    const p=worldToMap(region.position), [dx,dy]=MAP_LABEL_OFFSETS[region.id] || [0,-25];
    return {x:p.x+dx,y:p.y+dy+18};
  });
  const targets = model.target?.choices || (model.target ? [model.target] : []);
  return { landmarks, water,
    mapPoints: [...model.paths.flatMap(p => p.points), ...landmarks.map(l => l.position), ...targets.map(t => t.position)].map(p => worldToMap(p)).concat(labels) };
}
