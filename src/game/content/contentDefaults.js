import { PLAZA_COMPOSITION } from '../world/composition/plazaComposition.js';
import { FOREST_ADVENTURE_COMPOSITION } from '../world/composition/forestAdventureComposition.js';
import { JUNCTION_COMPOSITION } from '../world/composition/junctionComposition.js';
import { RIVER_COMPOSITION } from '../world/composition/riverComposition.js';
import { MOUNTAIN_COMPOSITION } from '../world/composition/mountainComposition.js';
import { GROTTO_ENTRANCE_COMPOSITION } from '../world/composition/grottoEntranceComposition.js';
import { GROTTO_COMPOSITION } from '../world/composition/grottoComposition.js';
import { RUINS_COMPOSITION } from '../world/composition/ruinsComposition.js';
import { OBSERVATORY_COMPOSITION } from '../world/composition/observatoryComposition.js';
import { ALL_ADVENTURE_OBJECTS } from '../adventure/adventureState.js';
import { createGameplayContent, ACTIVITY_PET_REWARDS, upgradeGameplayContent, setGameplayContent } from '../gameplay/gameplayContent.js';
import {applyWorldEvents} from '../world/composition/authoredWorldEvents.js';
import {applyWorldDesign} from '../world/worldDesign.js';

export const CONTENT_COMPOSITIONS = [PLAZA_COMPOSITION, FOREST_ADVENTURE_COMPOSITION, JUNCTION_COMPOSITION,
  RIVER_COMPOSITION, MOUNTAIN_COMPOSITION, GROTTO_ENTRANCE_COMPOSITION, GROTTO_COMPOSITION, RUINS_COMPOSITION, OBSERVATORY_COMPOSITION];

// Stable authoring key: a secret entrance and its interior can share a region ID.
export const compositionKey = composition => composition.groupName;
const originalInteractions = new Map(ALL_ADVENTURE_OBJECTS.map(o => [o.id, structuredClone(o.interaction)]));
const originalStationRadii = new Map(PLAZA_COMPOSITION.stations.map(s => [s.id, s.interactionRadius]));
export function createDefaultContent() {
  return { schemaVersion: 1, revision: 0, updated_at: null,
    world: CONTENT_COMPOSITIONS.map(c => ({ id: compositionKey(c), regionId: c.regionId, instances: structuredClone(c.instances) })),
    activities: [...ALL_ADVENTURE_OBJECTS.map(o => ({ id: o.id, regionId: o.regionId, type: o.type,
      lessonId: o.activityId, assignmentStatus: o.type === 'SECRET_REWARD' ? 'NOT_APPLICABLE' : ['river', 'mountain', 'observatory'].some(p => o.id.startsWith(p)) ? 'PROVISIONAL' : 'VERIFICADA',
      rewardId: ACTIVITY_PET_REWARDS[o.id] || null, requirements: structuredClone(o.requirements), progressionReward: structuredClone(o.reward) })),
    ...PLAZA_COMPOSITION.stations.map(s => ({ id: s.id, regionId: PLAZA_COMPOSITION.regionId,
      type: 'PRACTICE_STATION', lessonId: null, lessonRef: s.lessonRef, assignmentStatus: 'PROVISIONAL',
      rewardId: null, requirements: { completedObjects: [] }, progressionReward: null }))],
    ...createGameplayContent() };
}

export function applyGameContent(content) {
  if (content?.schemaVersion !== 1) throw new Error('Unsupported game content version');
  content = applyWorldEvents(upgradeGameplayContent(content));
  applyWorldDesign(content,CONTENT_COMPOSITIONS);
  setGameplayContent(content);
  // Optional authored activities never change the fixed regional curriculum/gates.
  for (let i=ALL_ADVENTURE_OBJECTS.length-1;i>=0;i--) if(ALL_ADVENTURE_OBJECTS[i].id.startsWith('editor-')) ALL_ADVENTURE_OBJECTS.splice(i,1);
  for(const composition of CONTENT_COMPOSITIONS) if(composition.adventureObjects) composition.adventureObjects=composition.adventureObjects.filter(o=>!o.id.startsWith('editor-'));
  const additional=content.activities.filter(a=>a.id.startsWith('editor-'));
  const registered=new Set(ALL_ADVENTURE_OBJECTS.map(o=>o.id));
  while(additional.length) {
    const index=additional.findIndex(a=>a.requirements.completedObjects.every(id=>registered.has(id)));
    if(index<0)throw new Error('Optional activities contain missing/circular requirements');
    const definition=additional.splice(index,1)[0];
    const composition=CONTENT_COMPOSITIONS.find(c=>c.groupName===definition.compositionId);
    if(!composition)throw new Error('Missing optional activity composition');
    const object={id:definition.id,label:definition.label,type:'LESSON_CHEST',regionId:definition.regionId,instanceId:definition.instanceId,activityId:definition.lessonId,
      interaction:{key:'KeyE',radius:3},requirements:structuredClone(definition.requirements),reward:structuredClone(definition.progressionReward),contentRewardId:definition.rewardId};
    ALL_ADVENTURE_OBJECTS.push(object);(composition.adventureObjects ||= []).push(object);registered.add(object.id);
  }
  for (const definition of content.world) {
    const composition = CONTENT_COMPOSITIONS.find(c => compositionKey(c) === definition.id);
    if (!composition) throw new Error(`Unknown composition: ${definition.id}`);
    // Keep exported object identities; all generators and progression bindings share them.
    composition.instances.splice(0, composition.instances.length, ...structuredClone(definition.instances));
    for (const object of composition.adventureObjects || []) {
      const instance = composition.instances.find(i => i.id === object.instanceId);
      if (!instance) throw new Error(`Missing activity instance: ${object.instanceId}`);
      object.instance = instance;
      object.interaction = structuredClone(instance.interaction || originalInteractions.get(object.id));
    }
    for (const station of composition.stations) {
      const instance = composition.instances.find(i => i.id === station.instanceId);
      station.interactionRadius = instance?.interaction?.radius || originalStationRadii.get(station.id);
    }
  }
  for (const definition of content.activities) {
    const object = ALL_ADVENTURE_OBJECTS.find(o => o.id === definition.id);
    if (object) { object.activityId = definition.lessonId; object.contentRewardId = definition.rewardId; if(definition.label)object.label=definition.label; }
    else {
      const station = PLAZA_COMPOSITION.stations.find(s => s.id === definition.id);
      if (station) { station.lessonRef = definition.lessonId == null ? definition.lessonRef : String(definition.lessonId); station.contentRewardId = definition.rewardId;
        if(content.editorVersion===1)station.introActivityId=definition.introLessonId ?? 1;else delete station.introActivityId;
      }
    }
  }
}
