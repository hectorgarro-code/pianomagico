import { REGION_IDS, VALLEY_REGIONS, WORLD_GATES, VALLEY_COMPLETION_REQUIREMENTS } from './valleyBlueprint.js';

const knownRegion = id => VALLEY_REGIONS.some(region => region.id === id);
const uniqueStrings = values => [...new Set(Array.isArray(values) ? values.filter(value => typeof value === 'string' && value.length > 0 && value.length < 160) : [])];

export function normalizeValley(snapshot, journey, entries) {
  const discoveredRegions = uniqueStrings(snapshot?.discoveredRegions).filter(knownRegion);
  if (!discoveredRegions.includes(REGION_IDS.PLAZA)) discoveredRegions.unshift(REGION_IDS.PLAZA);
  const legacyForest = !snapshot && (journey?.objective === 'FIND_FIRST_CHEST' || Object.values(entries).some(entry => entry.state === 'COMPLETED'));
  if (legacyForest && !discoveredRegions.includes(REGION_IDS.FOREST)) discoveredRegions.push(REGION_IDS.FOREST);
  const milestones = uniqueStrings(snapshot?.milestones);
  if (!snapshot && (legacyForest || journey?.objective === 'FIND_FOREST_PATH') && !milestones.includes('plaza-explored')) milestones.push('plaza-explored');
  return {
    currentRegion: knownRegion(snapshot?.currentRegion) && discoveredRegions.includes(snapshot.currentRegion) ? snapshot.currentRegion : REGION_IDS.PLAZA,
    discoveredRegions, milestones, completedChallenges: uniqueStrings(snapshot?.completedChallenges),
    discoveries: uniqueStrings(snapshot?.discoveries), collectedRewards: uniqueStrings(snapshot?.collectedRewards),
    openedGates: uniqueStrings(snapshot?.openedGates).filter(id => WORLD_GATES.some(gate => gate.id === id))
  };
}

export function requirementMet(requirement, adventure, completedRegions) {
  const facts = adventure.valley;
  switch (requirement.type) {
    case 'REGION_COMPLETED': return completedRegions.has(requirement.id);
    case 'REGION_DISCOVERED': return facts.discoveredRegions.includes(requirement.id);
    case 'OBJECT_COMPLETED': return adventure.entries[requirement.id]?.state === 'COMPLETED';
    case 'CHALLENGE_COMPLETED': return facts.completedChallenges.includes(requirement.id);
    case 'DISCOVERY': return facts.discoveries.includes(requirement.id);
    case 'MILESTONE': return facts.milestones.includes(requirement.id);
    case 'SECRET_REWARD': return facts.collectedRewards.includes(requirement.id);
    default: return false;
  }
}

export function getValleyProgress(adventure) {
  const completed = new Set(), available = new Set();
  // Resolve declarative dependencies to a fixed point, independent of array order.
  for (let pass = 0; pass < VALLEY_REGIONS.length; pass++) {
    for (const region of VALLEY_REGIONS) {
      if (region.unlockRequirements.every(req => requirementMet(req, adventure, completed))) available.add(region.id);
      if (available.has(region.id) && adventure.valley.discoveredRegions.includes(region.id)
        && region.regionCompletionRequirements.length > 0
        && region.regionCompletionRequirements.every(req => requirementMet(req, adventure, completed))) completed.add(region.id);
    }
  }
  const discoveredRegions = adventure.valley.discoveredRegions.filter(id => available.has(id));
  const currentRegion = discoveredRegions.includes(adventure.valley.currentRegion) ? adventure.valley.currentRegion : REGION_IDS.PLAZA;
  const regions = Object.fromEntries(VALLEY_REGIONS.map(region => [region.id, {
    state: completed.has(region.id) ? 'COMPLETED' : !available.has(region.id) ? 'LOCKED'
      : discoveredRegions.includes(region.id) ? currentRegion === region.id && adventure.journey.started ? 'ACTIVE' : 'DISCOVERED' : null,
    available: available.has(region.id), secret: region.secret, optional: region.optional,
    missingUnlockRequirements: region.unlockRequirements.filter(req => !requirementMet(req, adventure, completed)),
    missingRequirements: region.regionCompletionRequirements.filter(req => !requirementMet(req, adventure, completed))
  }]));
  const gates = Object.fromEntries(WORLD_GATES.map(gate => [gate.id, !available.has(gate.to) ? 'LOCKED'
    : adventure.valley.openedGates.includes(gate.id) ? 'OPEN' : 'AVAILABLE']));
  const valleyCompleted = VALLEY_COMPLETION_REQUIREMENTS.every(req => requirementMet(req, adventure, completed));
  const currentObjective = getCurrentObjective(adventure, completed, discoveredRegions, valleyCompleted);
  return { currentRegion, discoveredRegions, completedRegions: [...completed], availableRegions: [...available], regions, gates, currentObjective, valleyCompleted };
}

function getCurrentObjective(adventure, completed, discovered, valleyCompleted) {
  if (valleyCompleted) return { id: 'VALLEY_COMPLETED', text: 'Has completado el Valle de las Notas' };
  if (discovered.includes(REGION_IDS.OBSERVATORY)) return { id: 'FINAL_CHALLENGE', text: 'Interpreta el desafio final del Observatorio' };
  if (completed.has(REGION_IDS.RUINS)) return { id: 'REACH_OBSERVATORY', text: 'Llega al Observatorio Musical' };
  if (discovered.includes(REGION_IDS.RUINS)) return { id: 'COMPLETE_RUINS', text: 'Completa las dos voces y el desafio del Gran Pentagrama' };
  if (completed.has(REGION_IDS.RIVER) && completed.has(REGION_IDS.MOUNTAIN)) return { id: 'REACH_RUINS', text: 'Alcanza el antiguo Pentagrama' };
  if (completed.has(REGION_IDS.RIVER) || completed.has(REGION_IDS.MOUNTAIN)) return {id:'EXPLORE_REMAINING_ROUTE',text:completed.has(REGION_IDS.RIVER)?'Explora la ruta restante: Montana de las Melodias':'Explora la ruta restante: Rio del Ritmo'};
  if (completed.has(REGION_IDS.FOREST) && adventure.valley.currentRegion===REGION_IDS.RIVER) return {id:'EXPLORE_RIVER',text:'Explora el Rio del Ritmo. Completa sus tres cofres'};
  if (completed.has(REGION_IDS.FOREST) && adventure.valley.currentRegion===REGION_IDS.MOUNTAIN) return {id:'EXPLORE_MOUNTAIN',text:'Explora la Montana de las Melodias. Completa sus tres cofres'};
  if (completed.has(REGION_IDS.FOREST)) return { id: 'EXPLORE_ROUTES', text: 'El camino se divide. Explora el Rio o la Montana; completa ambas rutas' };
  if (discovered.includes(REGION_IDS.FOREST)) return { id: 'COMPLETE_FOREST', text: 'Encuentra y completa los cofres de leccion del Bosque' };
  if (adventure.valley.milestones.includes('plaza-explored')) return { id: 'FIND_FOREST_PATH', text: 'Busca el camino hacia el Bosque' };
  return { id: 'EXPLORE_PLAZA', text: 'Explora la Plaza' };
}

export function applyValleyEvent(adventure, event) {
  const progress = getValleyProgress(adventure), facts = adventure.valley;
  let next = facts;
  const add = (field, id) => {
    if (typeof id !== 'string' || !id.length || id.length >= 160 || next[field].includes(id)) return;
    next = { ...next, [field]: [...next[field], id] };
  };
  switch (event?.type) {
    case 'REGION_DISCOVERED': {
      if (!progress.availableRegions.includes(event.regionId)) return adventure;
      add('discoveredRegions', event.regionId);
      if (facts.currentRegion !== event.regionId) next = { ...next, currentRegion: event.regionId };
      const gate = WORLD_GATES.find(item => item.to === event.regionId && item.from.includes(facts.currentRegion));
      if (gate && progress.gates[gate.id] !== 'LOCKED') add('openedGates', gate.id);
      break;
    }
    case 'GATE_OPENED': {
      const gate = WORLD_GATES.find(item => item.id === event.gateId);
      if (!gate || progress.gates[gate.id] === 'LOCKED' || !gate.from.includes(facts.currentRegion)) return adventure;
      add('openedGates', gate.id); break;
    }
    case 'MILESTONE_REACHED': add('milestones', event.id); break;
    case 'CHALLENGE_COMPLETED': if (event.completed === true) add('completedChallenges', event.id); break;
    case 'DISCOVERY_RECORDED': add('discoveries', event.id); break;
    case 'SECRET_REWARD_COLLECTED': add('collectedRewards', event.id); break;
    default: return adventure;
  }
  return next === facts ? adventure : { ...adventure, valley: next };
}

// Authored physical footprints, independent of debug controls.
export function getPlayableRegionAt(position) {
  const authored=authoredRegionAt(position||{});if(authored)return authored;
  const original=getBasePlayableRegionAt(position);
  return getWorldDesign().areas.some(a=>a.regionId===original)?null:original;
}
function getBasePlayableRegionAt(position) {
  if (!Number.isFinite(position?.x) || !Number.isFinite(position?.z)) return null;
  if (Math.hypot(position.x+19,position.z+54)<2 || (position.x>=-39 && position.x<=-24 && position.z>=-62 && position.z<=-48)) return REGION_IDS.GROTTO;
  if (position.z<=-120 && position.z>=-138 && Math.abs(position.x)<=11) return REGION_IDS.OBSERVATORY;
  if (position.z<=-90 && position.z>=-109 && Math.abs(position.x)<=12) return REGION_IDS.RUINS;
  if(position.z<=-57 && position.z>=-83) {
    if(position.x<=-18 && position.x>=-43) return REGION_IDS.RIVER;
    if(position.x>=18 && position.x<=43) return REGION_IDS.MOUNTAIN;
  }
  if(position.z<-46 && position.z>=-60 && Math.abs(position.x)<18) return REGION_IDS.FOREST;
  if (position.z <= -19.5 && position.z >= -57 && position.x >= -28 && position.x <= 32) return REGION_IDS.FOREST;
  if (Math.hypot(position.x, position.z) <= 19) return REGION_IDS.PLAZA;
  return null;
}

export function validateWorldGateBindings(composition) {
  const errors = [], ids = new Set();
  if (composition.gates === undefined) return errors;
  if (!Array.isArray(composition.gates)) return ['INVALID_GATES'];
  for (const binding of composition.gates) {
    const gate = WORLD_GATES.find(item => item.id === binding?.gateId);
    if (!gate || typeof binding.id !== 'string' || !binding.id.trim() || ids.has(binding.id)
      || ![...gate.from, gate.to].includes(composition.regionId)) errors.push('INVALID_GATE_BINDING');
    ids.add(binding?.id);
    if (binding?.instanceId && !composition.instances?.some(instance => instance.id === binding.instanceId)) errors.push('MISSING_GATE_INSTANCE');
    if (binding?.exitId && !composition.exits?.some(exit => exit.id === binding.exitId)) errors.push('MISSING_GATE_EXIT');
  }
  return errors;
}
import {authoredRegionAt,getWorldDesign} from '../world/worldDesign.js';
