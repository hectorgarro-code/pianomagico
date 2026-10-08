import { INITIAL_GAME_STATE } from './GameState.js';

export const GAME_MODES = Object.freeze({
  WORLD: 'WORLD', PIANO: 'PIANO', PAUSE: 'PAUSE',
  TRANSITION_TO_PIANO: 'TRANSITION_TO_PIANO', TRANSITION_TO_WORLD: 'TRANSITION_TO_WORLD'
});

export function createWorldActivityState() {
  return { mode: GAME_MODES.WORLD, game: structuredClone(INITIAL_GAME_STATE), activity: null, context: null, lastResult: null };
}

export function restoreWorldContext(context, collisionWorld, heightAt) {
  const position = { ...context.position, ...collisionWorld.move(context.position, { x: 0, z: 0 }) };
  position.y = heightAt(position.x, position.z);
  return { ...context, position, camera: context.camera ? { ...context.camera } : null };
}

export function worldActivityReducer(state, action) {
  switch (action.type) {
    case 'PROFILE':
      return { ...state, game: { ...state.game,
        player: { ...state.game.player, characterId: action.profile.avatarId },
        progression: { ...state.game.progression, xp: Number(action.profile.total_score) || 0 }
      } };
    case 'REQUEST_PIANO': {
      if (state.mode !== GAME_MODES.WORLD || !action.song?.id || !action.context?.stationId) return state;
      const context = structuredClone({ ...action.context, activityId: action.song.id, activityMode: action.mode || 'solo' });
      return { ...state, mode: GAME_MODES.TRANSITION_TO_PIANO, context,
        activity: { song: action.song, mode: context.activityMode }, lastResult: null,
        game: { ...state.game, player: { ...state.game.player, position: { ...context.position }, rotation: context.rotation, lastInteractionObject: context.stationId, checkpoint: context },
          world: { ...state.game.world, currentRegion: context.regionId } }
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
        game: { ...state.game, world: result.completed ? { ...world,
          completedLessons: [...new Set([...world.completedLessons, result.activityId])],
          stationResults: { ...world.stationResults, [result.stationId]: result }
        } : world }
      };
    }
    default: return state;
  }
}
