import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { GAME_MODES, createWorldActivityState, worldActivityReducer } from './state/worldActivityFlow.js';
import { progressService } from './services/progressService';
import World3DView from './world/World3DView';
import PianoStageView from './piano/PianoStageView';
import GameTransitionManager from './transitions/GameTransitionManager';
import { Zap, X } from 'lucide-react';
import { STICKERS_BASE } from '../modules/piano-magico/PianoMagico';
import AdventureDiscovery from './adventure/AdventureDiscovery.jsx';
import { findAdventureObject, getAdventureSummary } from './adventure/adventureState.js';
import AdventureStart from './adventure/AdventureStart.jsx';
import { hasAdventureProgress, getNewAdventurePhase } from './adventure/adventureStart.js';
import { getValleyProgress } from './adventure/valleyProgression.js';
import ValleyProgressDebug from './adventure/ValleyProgressDebug.jsx';
import WorldMusic from './audio/WorldMusic.jsx';

// Estados del Orquestador General
export { GAME_MODES } from './state/worldActivityFlow.js';

export default function GameApp({ userId, onExitApp }) {
  // Estado General del Juego (WORLD vs PIANO vs TRANSITION)
  const [flow, dispatch] = useReducer(worldActivityReducer, userId, id => createWorldActivityState(progressService.loadAdventure(id)));
  const gameMode = flow.mode;
  const gameState = flow.game;
  const [startPhase, setStartPhase] = useState('ENTRY');
  const [worldVisit, setWorldVisit] = useState(0);
  const debugEnabled = import.meta.env.DEV && new URLSearchParams(globalThis.location?.search || '').get('debug') === '1';
  const handleObjective = useCallback((position, distance) => dispatch({ type: 'OBJECTIVE', position, distance }), []);
  const beginAdventure = () => { dispatch({ type: 'START_ADVENTURE' }); setStartPhase('PLAYING'); };
  const resetAdventure = () => { dispatch({ type: 'RESET_ADVENTURE' }); setWorldVisit(value => value + 1); setStartPhase('ENTRY'); };
  const newAdventure = (confirmed = false) => {
    const phase = getNewAdventurePhase(gameState.adventure, confirmed);
    if (phase === 'CHARACTER') {
      dispatch({ type: 'RESET_ADVENTURE' });
      setWorldVisit(value => value + 1);
    }
    setStartPhase(phase);
  };

  // Datos pedagógicos y de backend
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [songs, setSongs] = useState([]);
  const [userPerformances, setUserPerformances] = useState([]);
  const [memoryMedals, setMemoryMedals] = useState([]);
  const [adventureSaved, setAdventureSaved] = useState(true);
  useEffect(() => {
    setAdventureSaved(progressService.saveAdventure(userId, flow.game.adventure));
  }, [userId, flow.game.adventure]);

  // Lección seleccionada para el desafío musical
  const selectedSong = flow.activity?.song;
  const selectedMode = flow.activity?.mode;
  const discoveredObject = findAdventureObject(flow.discovery?.objectId);
  const discoveredSong = songs.find(song => String(song.id) === String(discoveredObject?.activityId));
  const adventureSummary = getAdventureSummary(gameState.adventure);
  const valleyProgress = getValleyProgress(gameState.adventure);

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
  const handleDiscoverAdventure = useCallback((objectId, context) => {
    dispatch({ type: 'DISCOVER_ADVENTURE', objectId, context });
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

  if (startPhase !== 'PLAYING') return <AdventureStart
    phase={startPhase} profile={profile} canContinue={hasAdventureProgress(gameState.adventure)}
    onPhase={setStartPhase} onBegin={beginAdventure} onContinue={beginAdventure}
    onNewAdventure={newAdventure} debugEnabled={debugEnabled}
    onCharacter={async avatarId => {
      const saved = await progressService.selectCharacter(userId, avatarId);
      if (!saved || saved.avatarId !== avatarId) throw new Error('Character not confirmed');
      setProfile(saved); dispatch({ type: 'PROFILE', profile: saved });
    }}
    onExit={onExitApp} onReset={resetAdventure}
  />;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* HUD SUPERIOR DEL VIDEOJUEGO (Solo visible en WORLD) */}
      {(
        <div className={`fixed top-0 left-0 right-0 z-50 pointer-events-none p-3 sm:p-5 flex justify-between items-start ${gameMode !== GAME_MODES.WORLD ? 'hidden' : ''}`}>
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
              {adventureSummary.segmentCompleted ? 'Recorrido del Bosque completado' : `Bosque: ${adventureSummary.completedActivityIds.length}/3 cofres completados`}
            </span>
          </div>

          {/* HUD Derecha: XP y Salir */}
          <div className="pointer-events-auto flex items-center gap-2">
            <WorldMusic active={gameMode === GAME_MODES.WORLD} immediatePause={gameMode === GAME_MODES.PIANO} />
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
              title="Volver a perfiles"
            >
              Salir
            </button>
          </div>
        </div>
      )}
      {gameMode === GAME_MODES.WORLD && !flow.discovery && <div role="status" className="absolute top-14 left-3 z-40 max-w-[calc(100%-6rem)] rounded-lg bg-zinc-950/80 px-3 py-2 text-xs pointer-events-none">
        {valleyProgress.currentObjective.text}
      </div>}
      {debugEnabled && gameMode === GAME_MODES.WORLD && !flow.discovery && <ValleyProgressDebug
        adventure={gameState.adventure} onEvent={event => dispatch({ type: 'VALLEY_EVENT', event })} onReset={resetAdventure}
      />}

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
              key={worldVisit}
              debugEnabled={debugEnabled}
              active={gameMode === GAME_MODES.WORLD && !flow.discovery}
              returnContext={flow.context}
              completedStationIds={Object.keys(gameState.world.stationResults)}
              songs={songs}
              profile={profile}
              userPerformances={userPerformances}
              memoryMedals={memoryMedals}
              initialPosition={gameState.player.position}
              initialRotation={gameState.player.rotation}
              onEnterLesson={handleEnterLesson}
              onDiscoverAdventure={handleDiscoverAdventure}
              adventureState={gameState.adventure}
              onObjectiveProgress={handleObjective}
              onAdventureDebug={() => setStartPhase('ENTRY')}
            />
          </div>
        )}

        {gameMode === GAME_MODES.WORLD && discoveredObject && <AdventureDiscovery
          object={discoveredObject} song={discoveredSong} state={gameState.adventure.entries[discoveredObject.id].state}
          onClose={() => dispatch({ type: 'CLOSE_DISCOVERY' })}
          onStart={() => handleEnterLesson(discoveredSong, 'solo', flow.context)}
        />}
        {gameMode === GAME_MODES.WORLD && gameState.adventure.lastReward && !flow.discovery && <div role="status" className="absolute bottom-16 left-1/2 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-emerald-400 bg-zinc-900 px-4 py-3 text-sm">
          <span>Recompensa: {gameState.adventure.lastReward.label}</span>
          <button onClick={() => dispatch({ type: 'ACK_REWARD' })} title="Cerrar recompensa" aria-label="Cerrar recompensa"><X size={16}/></button>
        </div>}
        {!adventureSaved && gameMode === GAME_MODES.WORLD && <p role="alert" className="absolute bottom-16 left-4 z-40 max-w-xs bg-zinc-900 p-3 text-xs">No se pudo guardar la aventura en este dispositivo. El progreso se conserva durante esta sesión.</p>}

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
