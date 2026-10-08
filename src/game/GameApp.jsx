import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { GAME_MODES, createWorldActivityState, worldActivityReducer } from './state/worldActivityFlow.js';
import { progressService } from './services/progressService';
import World3DView from './world/World3DView';
import PianoStageView from './piano/PianoStageView';
import GameTransitionManager from './transitions/GameTransitionManager';
import { Zap, Shield } from 'lucide-react';
import { STICKERS_BASE } from '../modules/piano-magico/PianoMagico';

// Estados del Orquestador General
export { GAME_MODES } from './state/worldActivityFlow.js';

export default function GameApp({ userId, onExitApp }) {
  // Estado General del Juego (WORLD vs PIANO vs TRANSITION)
  const [flow, dispatch] = useReducer(worldActivityReducer, undefined, createWorldActivityState);
  const gameMode = flow.mode;
  const gameState = flow.game;

  // Datos pedagógicos y de backend
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [userPerformances, setUserPerformances] = useState([]);
  const [memoryMedals, setMemoryMedals] = useState([]);

  // Lección seleccionada para el desafío musical
  const selectedSong = flow.activity?.song;
  const selectedMode = flow.activity?.mode;

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

      if (!profData) throw new Error('No se pudo cargar el perfil real.');
      if (!Array.isArray(songsData) || !songsData.length) throw new Error('No hay lecciones de piano disponibles.');
      if (profData) {
        setProfile(profData);
        dispatch({ type: 'PROFILE', profile: profData });
      }
      setSongs(songsData || []);
      setUserPerformances(perfsData || []);
      setMemoryMedals(medalsData || []);
      setLoadError(null);
    } catch (e) {
      console.error('[GameApp] Error al cargar datos:', e);
      setLoadError(e.message);
    }
  }, [userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Iniciar transición hacia la Lección Musical
  const handleEnterLesson = useCallback((song, mode = 'solo', context) => {
    dispatch({ type: 'REQUEST_PIANO', song, mode, context });
  }, []);

  // Regresar de la Lección Musical al Mundo 3D
  const handleExitPianoStage = useCallback(() => {
    dispatch({ type: 'RETURN', result: { completed: false, cancelled: true } });
    void loadUserData();
  }, [loadUserData]);

  // Lección completada (recargar datos frescos de backend)
  const handleLessonFinished = useCallback(async (result) => {
    dispatch({ type: 'RETURN', result });
    await loadUserData();
  }, [loadUserData]);

  // Fin de la animación de transición
  const handleTransitionComplete = useCallback((targetMode) => {
    dispatch({ type: 'TRANSITION_COMPLETE', target: targetMode });
  }, []);

  if (!profile) return (
    <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 bg-slate-950 text-white">
      <p role={loadError ? 'alert' : 'status'}>{loadError || 'Cargando tu aventura...'}</p>
      {loadError && <button onClick={loadUserData} className="px-4 py-2 border rounded">Reintentar</button>}
    </div>
  );

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
        {(
          <div className={`absolute inset-0 w-full h-full ${gameMode === GAME_MODES.PIANO || gameMode === GAME_MODES.TRANSITION_TO_WORLD ? 'invisible pointer-events-none' : ''}`}>
            <World3DView
              active={gameMode === GAME_MODES.WORLD}
              returnContext={flow.context}
              completedStationIds={Object.keys(gameState.world.stationResults)}
              songs={songs}
              profile={profile}
              userPerformances={userPerformances}
              memoryMedals={memoryMedals}
              initialPosition={gameState.player.position}
              initialRotation={gameState.player.rotation}
              onEnterLesson={handleEnterLesson}
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
              worldContext={flow.context}
              onFinishLesson={handleLessonFinished}
              onExitStage={handleExitPianoStage}
            />
          </div>
        )}
      </GameTransitionManager>
    </div>
  );
}
