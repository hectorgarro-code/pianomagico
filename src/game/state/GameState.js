/**
 * GameState.js
 * Centraliza el estado de exploración, jugador, progreso y mundo 3D.
 * Diseñado para ser completamente compatible con la persistencia en base de datos.
 */

import { PLAZA_COMPOSITION } from '../world/composition/plazaComposition.js';

export const INITIAL_GAME_STATE = {
  // Estado del Jugador en el Mundo 3D
  player: {
    characterId: 1,
    position: { x: PLAZA_COMPOSITION.spawn.position[0], y: PLAZA_COMPOSITION.spawn.position[1], z: PLAZA_COMPOSITION.spawn.position[2] },
    rotation: PLAZA_COMPOSITION.spawn.rotation[1],
    lastInteractionObject: null
  },

  // Estado de Progresión (XP, Estrellas, Rango)
  progression: {
    level: 1,
    xp: 0,
    coins: 0,
    stars: 0
  },

  // Estado del Mundo
  world: {
    currentWorld: 'valle_notas',
    currentRegion: PLAZA_COMPOSITION.regionId,
    unlockedAreas: ['valle_notas_inicio'],
    completedLessons: [],
    openedChests: [],
    activatedObjects: [],
    stationResults: {}
  },

  // Misión activa
  quest: {
    activeQuest: 'Explora el Valle de las Notas y descubre la melodía perdida'
  }
};

/**
 * Guarda el punto de control del jugador antes de entrar al piano
 * para que pueda volver exactamente a la misma posición y rotación.
 */
export const savePlayerCheckpoint = (currentPos, currentRot, interactionId = null, worldId = 'valle_notas') => {
  return {
    worldId,
    position: { ...currentPos },
    rotation: currentRot,
    interactionId,
    timestamp: Date.now()
  };
};
