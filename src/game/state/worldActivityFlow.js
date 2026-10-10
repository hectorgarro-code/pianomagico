import { INITIAL_GAME_STATE } from './GameState.js';
import { beginAdventureActivity, canRequestAdventureActivity, findAdventureObject, settleAdventureActivity, collectAdventureSecret } from '../adventure/adventureState.js';
import { createAdventureState } from '../adventure/adventureState.js';
import { applyValleyEvent, getPlayableRegionAt, getValleyProgress } from '../adventure/valleyProgression.js';
import { REGION_IDS } from '../adventure/valleyBlueprint.js';

export const GAME_MODES = Object.freeze({
  WORLD: 'WORLD', PIANO: 'PIANO', PAUSE: 'PAUSE',
  TRANSITION_TO_PIANO: 'TRANSITION_TO_PIANO', TRANSITION_TO_WORLD: 'TRANSITION_TO_WORLD'
});

export function createWorldActivityState(adventure) {
  const game = structuredClone(INITIAL_GAME_STATE);
  if (adventure) game.adventure = { ...adventure, valley: { ...adventure.valley, currentRegion: REGION_IDS.PLAZA } };
  return { mode: GAME_MODES.WORLD, game, activity: null, context: null, lastResult: null, discovery: null,
    endingAcknowledged: getValleyProgress(game.adventure).valleyCompleted };
}

export function restoreWorldContext(context, collisionWorld, heightAt) {
  const position = { ...context.position, ...collisionWorld.move(context.position, { x: 0, z: 0 }) };
  position.y = heightAt(position.x, position.z);
  return { ...context, position, camera: context.camera ? { ...context.camera } : null };
}

export function worldActivityReducer(state, action) {
  switch (action.type) {
    case 'START_ADVENTURE':
      return { ...state, game: { ...state.game, adventure: { ...state.game.adventure, journey: { ...state.game.adventure.journey, started: true } } } };
    case 'OBJECTIVE': {
      if (state.mode !== GAME_MODES.WORLD) return state;
      let adventure = state.game.adventure;
      if (adventure.journey.started && (action.distance >= 3 || action.position.z < -10)) adventure = applyValleyEvent(adventure, { type: 'MILESTONE_REACHED', id: 'plaza-explored' });
      const regionId = getPlayableRegionAt(action.position);
      if(adventure.journey.started && regionId===REGION_IDS.GROTTO) adventure=applyValleyEvent(adventure,{type:'DISCOVERY_RECORDED',id:'echo-grotto-found'});
      if (adventure.journey.started && regionId) adventure = applyValleyEvent(adventure, { type: 'REGION_DISCOVERED', regionId });
      return adventure === state.game.adventure ? state : { ...state, game: { ...state.game, adventure } };
    }
    case 'VALLEY_EVENT': {
      if (state.mode !== GAME_MODES.WORLD) return state;
      const adventure = applyValleyEvent(state.game.adventure, action.event);
      return adventure === state.game.adventure ? state : { ...state, game: { ...state.game, adventure } };
    }
    case 'RESET_ADVENTURE': {
      if (state.mode !== GAME_MODES.WORLD) return state;
      return { ...state, context: null, discovery: null, activity: null, lastResult: null, endingAcknowledged: false,
        game: { ...state.game, adventure: createAdventureState(), player: { ...state.game.player, position: structuredClone(INITIAL_GAME_STATE.player.position), rotation: INITIAL_GAME_STATE.player.rotation, checkpoint: null, lastInteractionObject: null }, world: structuredClone(INITIAL_GAME_STATE.world) } };
    }
    case 'DISCOVER_ADVENTURE': {
      if (state.mode !== GAME_MODES.WORLD || state.discovery) return state;
      const object = findAdventureObject(action.objectId);
      if (!object || action.context?.stationId !== object.id) return state;
      return { ...state, context: structuredClone(action.context), discovery: { objectId: object.id } };
    }
    case 'CLOSE_DISCOVERY':
      return state.mode === GAME_MODES.WORLD ? { ...state, discovery: null } : state;
    case 'CLAIM_SECRET': {
      if (state.mode !== GAME_MODES.WORLD || state.discovery?.objectId !== action.objectId) return state;
      const adventure = collectAdventureSecret(state.game.adventure, action.objectId);
      if (adventure === state.game.adventure) return state;
      return { ...state, discovery: null, game: { ...state.game, adventure } };
    }
    case 'ACK_ENDING':
      return state.mode === GAME_MODES.WORLD && getValleyProgress(state.game.adventure).valleyCompleted
        ? { ...state, endingAcknowledged: true } : state;
    case 'ACK_REWARD':
      return { ...state, game: { ...state.game, adventure: { ...state.game.adventure, lastReward: null } } };
    case 'PROFILE':
      return { ...state, game: { ...state.game,
        player: { ...state.game.player, characterId: action.profile.avatarId },
        progression: { ...state.game.progression, xp: Number(action.profile.total_score) || 0 }
      } };
    case 'REQUEST_PIANO': {
      if (state.mode !== GAME_MODES.WORLD || !action.song?.id || !action.context?.stationId) return state;
      const adventureObject = findAdventureObject(action.context.stationId);
      if (adventureObject && (!state.discovery || state.discovery.objectId !== adventureObject.id || !canRequestAdventureActivity(state.game.adventure, adventureObject.id, action.song.id))) return state;
      const context = structuredClone({ ...action.context, activityId: action.song.id, activityMode: action.mode || 'solo' });
      return { ...state, mode: GAME_MODES.TRANSITION_TO_PIANO, context, discovery: null,
        activity: { song: action.song, mode: context.activityMode }, lastResult: null,
        game: { ...state.game, adventure: adventureObject ? beginAdventureActivity(state.game.adventure, adventureObject.id, action.song.id) : state.game.adventure,
          player: { ...state.game.player, position: { ...context.position }, rotation: context.rotation, lastInteractionObject: context.stationId, checkpoint: context },
          world: state.game.world }
      };
    }
    case 'TRANSITION_COMPLETE':
      if (action.target === 'PIANO' && state.mode === GAME_MODES.TRANSITION_TO_PIANO) return { ...state, mode: GAME_MODES.PIANO };
      if (action.target === 'WORLD' && state.mode === GAME_MODES.TRANSITION_TO_WORLD) return { ...state, mode: GAME_MODES.WORLD };
      return state;
    case 'RETURN': {
      if (state.mode !== GAME_MODES.PIANO) return state;
      const result = { ...action.result, stationId: state.context.stationId, activityId: state.context.activityId, completed: action.result?.completed === true };
      if (action.result?.activityId != null && String(action.result.activityId) !== String(state.context.activityId)) return state;
      const world = state.game.world;
      return { ...state, mode: GAME_MODES.TRANSITION_TO_WORLD, lastResult: result,
        game: { ...state.game, adventure: settleAdventureActivity(state.game.adventure, result.stationId, result), world: result.completed && !findAdventureObject(result.stationId) ? { ...world,
          completedLessons: [...new Set([...world.completedLessons, result.activityId])],
          stationResults: { ...world.stationResults, [result.stationId]: result }
        } : world }
      };
    }
    default: return state;
  }
}
