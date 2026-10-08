import { WORLD_BLUEPRINT } from '../world/worldBlueprint.js';
import { FOREST_LESSON_CHESTS } from '../world/composition/forestAdventureComposition.js';

export const REGION_IDS = Object.freeze({
  PLAZA: 'PLAZA_DE_LAS_NOTAS', FOREST: 'BOSQUE_DE_LAS_NOTAS', RIVER: 'RIO_DEL_RITMO',
  MOUNTAIN: 'MONTANA_DE_LAS_MELODIAS', GROTTO: 'GRUTA_DEL_ECO',
  RUINS: 'RUINAS_DEL_GRAN_PENTAGRAMA', OBSERVATORY: 'OBSERVATORIO_MUSICAL'
});
const requirement = (type, id) => ({ type, id });
const completed = id => requirement('REGION_COMPLETED', id);
const discovered = id => requirement('REGION_DISCOVERED', id);
const milestone = id => requirement('MILESTONE', id);
const region = (id, unlockRequirements, completionRequirements, optional = false) => ({
  id, name: WORLD_BLUEPRINT.regions.find(item => item.id === id).name,
  optional, secret: optional, unlockRequirements, regionCompletionRequirements: completionRequirements
});

// Future milestones are prototype contracts, not new activities or curriculum.
export const VALLEY_REGIONS = [
  region(REGION_IDS.PLAZA, [], [milestone('plaza-explored')]),
  region(REGION_IDS.FOREST, [discovered(REGION_IDS.PLAZA)], FOREST_LESSON_CHESTS.map(chest => requirement('OBJECT_COMPLETED', chest.id))),
  region(REGION_IDS.RIVER, [completed(REGION_IDS.FOREST)], [milestone('river-prototype-complete')]),
  region(REGION_IDS.MOUNTAIN, [completed(REGION_IDS.FOREST)], [milestone('mountain-prototype-complete')]),
  region(REGION_IDS.GROTTO, [discovered(REGION_IDS.FOREST), requirement('DISCOVERY', 'echo-grotto-found')], [milestone('grotto-prototype-complete')], true),
  region(REGION_IDS.RUINS, [completed(REGION_IDS.RIVER), completed(REGION_IDS.MOUNTAIN)], [milestone('ruins-prototype-complete')]),
  region(REGION_IDS.OBSERVATORY, [completed(REGION_IDS.RUINS)], [milestone('observatory-prototype-complete')])
];
export const WORLD_GATES = [
  { id: 'plaza_to_forest', from: [REGION_IDS.PLAZA], to: REGION_IDS.FOREST },
  { id: 'forest_to_river', from: [REGION_IDS.FOREST], to: REGION_IDS.RIVER },
  { id: 'forest_to_mountain', from: [REGION_IDS.FOREST], to: REGION_IDS.MOUNTAIN },
  { id: 'forest_to_grotto', from: [REGION_IDS.FOREST], to: REGION_IDS.GROTTO },
  { id: 'routes_to_ruins', from: [REGION_IDS.RIVER, REGION_IDS.MOUNTAIN], to: REGION_IDS.RUINS },
  { id: 'ruins_to_observatory', from: [REGION_IDS.RUINS], to: REGION_IDS.OBSERVATORY }
];
export const VALLEY_COMPLETION_REQUIREMENTS = [completed(REGION_IDS.OBSERVATORY)];
export const REGION_STATES = Object.freeze({ LOCKED: 'LOCKED', DISCOVERED: 'DISCOVERED', ACTIVE: 'ACTIVE', COMPLETED: 'COMPLETED' });
export const GATE_STATES = Object.freeze({ LOCKED: 'LOCKED', AVAILABLE: 'AVAILABLE', OPEN: 'OPEN' });
