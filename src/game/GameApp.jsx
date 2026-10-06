import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_GAME_STATE, savePlayerCheckpoint } from './state/GameState';
import { progressService } from './services/progressService';
import World3DView from './world/World3DView';
import PianoStageView from './piano/PianoStageView';
import GameTransitionManager from './transitions/GameTransitionManager';
import { Zap, Shield } from 'lucide-react';
import { STICKERS_BASE } from '../modules/piano-magico/PianoMagico';

// Estados del Orquestador General
export const GAME_MODES = {
  WORLD: 'WORLD',
  PIANO: 'PIANO',
  TRANSITION_TO_PIANO: 'TRANSITION_TO_PIANO',
  TRANSITION_TO_WORLD: 'TRANSITION_TO_WORLD',
  PAUSE: 'PAUSE'
};

export default function GameApp({ userId, onExitApp }) {
  // Estado General del Juego (WORLD vs PIANO vs TRANSITION)
  const [gameMode, setGameMode] = useState(GAME_MODES.WORLD);

  // Estado Centralizado del Videojuego
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);

  // Datos pedagógicos y de backend
  const [profile, setProfile] = useState({ name: 'AVENTURERO', avatarId: 1, total_score: 0 });
  const [songs, setSongs] = useState([]);
  const [userPerformances, setUserPerformances] = useState([]);
  const [memoryMedals, setMemoryMedals] = useState([]);

  // Lección seleccionada para el desafío musical
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedMode, setSelectedMode] = useState('solo');

  // Cargar datos del usuario desde la capa progressService
  const loadUserData = useCallback(async () => {
    if (!userId) return;
    try {
      const [profData, songsData, perfsData, medalsData] = await Promise.all([
        progressService.getProfile(userId).catch(() => null),
        progressService.getSongs(userId).catch(() => []),
        progressService.getUserPerformances(userId).catch(() => []),
        progressService.getMemoryMedals(userId).catch(() => [])
      ]);

      if (profData) {
        setProfile(profData);
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            characterId: profData.avatar_id || 1
          },
          progression: {
            ...prev.progression,
            xp: profData.total_score || 0
          }
        }));
      }
      setSongs(songsData || []);
      setUserPerformances(perfsData || []);
      setMemoryMedals(medalsData || []);
    } catch (e) {
      console.error('[GameApp] Error al cargar datos:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Actualizar checkpoint de posición del jugador
  const handlePlayerTransformChange = useCallback((transform) => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        position: transform.position,
        rotation: transform.rotation,
        lastInteractionObject: transform.stationId
      }
    }));
  }, []);

  // Iniciar transición hacia la Lección Musical
  const handleEnterLesson = useCallback((song, mode = 'solo') => {
    setSelectedSong(song);
    setSelectedMode(mode);

    // Guardar posición exacta para el retorno
    const checkpoint = savePlayerCheckpoint(
      gameState.player.position,
      gameState.player.rotation,
      song.id,
      gameState.world.currentWorld
    );

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        checkpoint
      }
    }));

    setGameMode(GAME_MODES.TRANSITION_TO_PIANO);
  }, [gameState.player.position, gameState.player.rotation, gameState.world.currentWorld]);

  // Regresar de la Lección Musical al Mundo 3D
  const handleExitPianoStage = useCallback(() => {
    setGameMode(GAME_MODES.TRANSITION_TO_WORLD);
  }, []);

  // Lección completada (recargar datos frescos de backend)
  const handleLessonFinished = useCallback(async (result) => {
    await loadUserData();
    setGameMode(GAME_MODES.TRANSITION_TO_WORLD);
  }, [loadUserData]);

  // Fin de la animación de transición
  const handleTransitionComplete = useCallback((targetMode) => {
    if (targetMode === 'PIANO') {
      setGameMode(GAME_MODES.PIANO);
    } else if (targetMode === 'WORLD') {
      setGameMode(GAME_MODES.WORLD);
    }
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* HUD SUPERIOR DEL VIDEOJUEGO (Solo visible en WORLD) */}
      {gameMode === GAME_MODES.WORLD && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-3 sm:p-5 flex justify-between items-start">
          {/* HUD Izquierda: Avatar y Nombre */}
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-sm shadow-md border border-white/20 text-white">
              {STICKERS_BASE[profile.avatar_id]?.emoji || '👤'}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[90px] sm:max-w-[130px]">
              {profile.name}
            </span>
          </div>

          {/* HUD Centro: Misión Activa Discreta */}
          <div className="pointer-events-none hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-white/15 px-4 py-1.5 rounded-full shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
              {gameState.quest.activeQuest}
            </span>
          </div>

          {/* HUD Derecha: XP y Salir */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-amber-400/30 px-3 py-1.5 rounded-full shadow-2xl">
              <Zap size={15} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-black text-amber-300 tracking-wider">
                {profile.total_score || gameState.progression.xp} XP
              </span>
            </div>

            <button
              onClick={() => {
                if (onExitApp) onExitApp();
              }}
              className="bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-full border border-red-400/30 backdrop-blur-md shadow-2xl transition-all cursor-pointer"
              title="Salir al Menú"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* GESTOR DE ESCENAS Y TRANSICIONES CINEMATOGRÁFICAS */}
      <GameTransitionManager
        transitionState={
          gameMode === GAME_MODES.TRANSITION_TO_PIANO
            ? 'TRANSITION_TO_PIANO'
            : gameMode === GAME_MODES.TRANSITION_TO_WORLD
            ? 'TRANSITION_TO_WORLD'
            : 'IDLE'
        }
        onTransitionComplete={handleTransitionComplete}
      >
        {/* VISTA 1: MUNDO 3D (Desacoplado del motor musical) */}
        {(gameMode === GAME_MODES.WORLD || gameMode === GAME_MODES.TRANSITION_TO_PIANO) && (
          <div className="absolute inset-0 w-full h-full">
            <World3DView
              songs={songs}
              profile={profile}
              userPerformances={userPerformances}
              memoryMedals={memoryMedals}
              initialPosition={gameState.player.position}
              initialRotation={gameState.player.rotation}
              onEnterLesson={handleEnterLesson}
              onPlayerTransformChange={handlePlayerTransformChange}
            />
          </div>
        )}

        {/* VISTA 2: PIANO STAGE (Encapsulado del motor musical de PianoMagico) */}
        {(gameMode === GAME_MODES.PIANO || gameMode === GAME_MODES.TRANSITION_TO_WORLD) && (
          <div className="absolute inset-0 w-full h-full z-40">
            <PianoStageView
              userId={userId}
              initialSong={selectedSong}
              initialMode={selectedMode}
              onFinishLesson={handleLessonFinished}
              onExitStage={handleExitPianoStage}
            />
          </div>
        )}
      </GameTransitionManager>
    </div>
  );
}
