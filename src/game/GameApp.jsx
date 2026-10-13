import React, { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import { GAME_MODES, createWorldActivityState, worldActivityReducer, findWorldActivityObject } from './state/worldActivityFlow.js';
import { progressService } from './services/progressService';
import SharedWorld from './entry/SharedWorld.jsx';
import PianoStageView from './piano/PianoStageView';
import GameTransitionManager from './transitions/GameTransitionManager';
import { Zap, X, Menu, Music2 } from 'lucide-react';
import AdventurerMenu from './gameplay/AdventurerMenu.jsx';
import ValleyActivityResult from './gameplay/ValleyActivityResult.jsx';
import MinigameView from './gameplay/MinigameView.jsx';
import { getGameplayContent } from './gameplay/gameplayContent.js';
import { gameplayPersistence, claimReward, equipPet, completeMinigame } from './gameplay/gameplayState.js';
import './gameplay/gameplay.css';
import { STICKERS_BASE } from '../modules/piano-magico/PianoMagico';
import AdventureDiscovery from './adventure/AdventureDiscovery.jsx';
import { getAdventureSummary } from './adventure/adventureState.js';
import AdventureStart from './adventure/AdventureStart.jsx';
import { getNewAdventurePhase } from './adventure/adventureStart.js';
import { getValleyProgress } from './adventure/valleyProgression.js';
import ValleyProgressDebug from './adventure/ValleyProgressDebug.jsx';
import WorldMusic from './audio/WorldMusic.jsx';
import ValleyEnding from './adventure/ValleyEnding.jsx';
import { getDevPlaytest } from './playtest/playtestTelemetry.js';
import { EQUIPMENT, saveEquipment } from './presentation/characterEquipment.js';
import {loadEquipmentCollection,unlockEquipment,saveEquipmentCollection,canEquip} from './presentation/equipmentCollection.js';
import VisualPreview from './presentation/VisualPreview.jsx';
import {claimLessonPetReward} from './gameplay/lessonPetReward.js';
import {FIRST_MINUTES as F,firstMinutesStarted,firstMinutesPhase,mayRestoreFirstMinutes} from './gameplay/firstMinutes.js';

// Estados del Orquestador General
export { GAME_MODES } from './state/worldActivityFlow.js';

export default function GameApp({ userId, onExitApp, sharedEntry = false }) {
  // Estado General del Juego (WORLD vs PIANO vs TRANSITION)
  const [flow, dispatch] = useReducer(worldActivityReducer, userId, id => createWorldActivityState(progressService.loadAdventure(id)));
  const gameMode = flow.mode;
  const gameState = flow.game;
  const flowRef=useRef(flow);flowRef.current=flow;
  const settlingResultRef=useRef(false);
  const [companionCelebration,setCompanionCelebration]=useState(0);
  const [startPhase, setStartPhase] = useState('CHARACTER');
  const [worldVisit, setWorldVisit] = useState(0);
  const [finalRevealReady,setFinalRevealReady]=useState(()=>getValleyProgress(gameState.adventure).valleyCompleted);
  const [gameplay,setGameplay]=useState(()=>gameplayPersistence().load(userId));
  const gameplayRef=useRef(gameplay);gameplayRef.current=gameplay;
  const [arsenal,setArsenal]=useState(()=>loadEquipmentCollection(userId));
  const [arsenalSaved,setArsenalSaved]=useState(true);
  const [weaponReward,setWeaponReward]=useState(null);
  const arsenalRef=useRef(arsenal);arsenalRef.current=arsenal;
  const visualGameplay={...gameplay,unlockedEquipment:arsenal};
  useEffect(()=>{
    const next=unlockEquipment(arsenalRef.current,gameState.adventure);
    const added=next.filter(id=>!arsenalRef.current.includes(id));
    if(added.length){arsenalRef.current=next;setArsenal(next);if(startPhase==='PLAYING')setWeaponReward(added.at(-1));}
    setArsenalSaved(saveEquipmentCollection(userId,next));
  },[userId,gameState.adventure,startPhase]);
  useEffect(()=>{if(!weaponReward)return;const timer=setTimeout(()=>setWeaponReward(null),3500);return()=>clearTimeout(timer);},[weaponReward]);
  const [menuOpen,setMenuOpen]=useState(false),[activityResult,setActivityResult]=useState(null),[miniId,setMiniId]=useState(null),[equipmentVersion,setEquipmentVersion]=useState(0),[mapRequest,setMapRequest]=useState(0);
  const [gameplaySaved,setGameplaySaved]=useState(true);
  const updateGameplay=next=>{gameplayRef.current=next;setGameplay(next);setGameplaySaved(gameplayPersistence().save(userId,next));};
  const receiveReward=(id,result=null,name='')=>{
    if(getGameplayContent().rewards.find(reward=>reward.id===id)?.type==='PET')return;
    const claimed=claimReward(gameplayRef.current,id);updateGameplay(claimed.state);
    if(claimed.pet || result)setActivityResult({result:result || {completed:true},pet:claimed.pet,name});
  };
  useEffect(()=>{
    const key=e=>{if(flow.mode!==GAME_MODES.WORLD || startPhase!=='PLAYING' || flow.discovery || miniId || activityResult || e.target.closest('input,textarea,select') || e.repeat)return;
      if(e.code==='Tab' || e.code==='Escape'){e.preventDefault();setMenuOpen(value=>!value);}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[flow.mode,startPhase,flow.discovery,miniId,activityResult]);
  const debugEnabled = import.meta.env.DEV && new URLSearchParams(globalThis.location?.search || '').get('debug') === '1';
  const handleObjective = useCallback((position, distance) => dispatch({ type: 'OBJECTIVE', position, distance }), []);
  const beginAdventure = () => {
    getDevPlaytest(userId)?.begin(gameState.adventure.journey.started);
    dispatch({ type: 'START_ADVENTURE' }); setStartPhase('PLAYING');
  };
  const handlePlaytestEvent = useCallback((type, data) => getDevPlaytest(userId)?.record(type, data), [userId]);
  useEffect(() => {
    if (startPhase === 'PLAYING') getDevPlaytest(userId)?.observe(flow);
  }, [userId, startPhase, flow]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const pause = () => getDevPlaytest(userId)?.pause();
    window.addEventListener('pagehide', pause);
    return () => { window.removeEventListener('pagehide', pause); pause(); };
  }, [userId]);
  const resetAdventure = () => { dispatch({ type: 'RESET_ADVENTURE' }); setFinalRevealReady(false);updateGameplay({...gameplayRef.current,completedMinigames:[]});setWorldVisit(value => value + 1); setStartPhase('ENTRY'); };
  const newAdventure = (confirmed = false) => {
    const phase = getNewAdventurePhase(gameState.adventure, confirmed);
    if (phase === 'CHARACTER') {
      dispatch({ type: 'RESET_ADVENTURE' });
      setFinalRevealReady(false);
      updateGameplay({...gameplayRef.current,completedMinigames:[]});
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
  const discoveredObject = findWorldActivityObject(flow.discovery?.objectId);
  const discoveredSong = songs.find(song => String(song.id) === String(discoveredObject?.activityId ?? flow.context?.activityId));
  const adventureSummary = getAdventureSummary(gameState.adventure);
  const valleyProgress = getValleyProgress(gameState.adventure);
  const showEnding = gameMode === GAME_MODES.WORLD && valleyProgress.valleyCompleted && finalRevealReady && !flow.endingAcknowledged;

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
    const current=flowRef.current;
    if(settlingResultRef.current||worldActivityReducer(current,{type:'RETURN',result})===current)return;
    settlingResultRef.current=true;
    dispatch({ type: 'RETURN', result });
    setActivityResult({result,pet:null,pending:true});
    try{
      const performances=await progressService.getUserPerformances(userId);
      const object=findWorldActivityObject(current.context?.stationId);
      const claimed=claimLessonPetReward(gameplayRef.current,{result,context:current.context,activity:current.activity,object,userId,performances});
      if(claimed.state!==gameplayRef.current)updateGameplay(claimed.state);
        if(claimed.valid){setCompanionCelebration(value=>value+1);if(firstMinutesStarted(current.game.adventure)&&mayRestoreFirstMinutes(result,current.context,object))dispatch({type:'VALIDATED_PLAZA_RESULT',performanceId:result.performanceId});}
        const firstReward=claimed.valid&&firstMinutesPhase(current.game.adventure)==='CHEST'&&mayRestoreFirstMinutes(result,current.context,object);
        const reunion=firstReward&&!claimed.pet?getGameplayContent().pets.find(p=>p.id==='kenney-cube-pets:animal-elephant'&&gameplayRef.current.unlockedPets.includes(p.id)):null;
        setActivityResult({result:reunion?{...result,returningFriend:true}:result,pet:claimed.pet||reunion,pending:false,saveFailed:result.completed&&!claimed.valid});
      await loadUserData();
    }catch{setActivityResult({result,pet:null,pending:false,saveFailed:result.completed});}
    finally{settlingResultRef.current=false;}
  }, [loadUserData,userId]);

  // Fin de la animación de transición
  const handleTransitionComplete = useCallback((targetMode) => {
    dispatch({ type: 'TRANSITION_COMPLETE', target: targetMode });
  }, []);

  if (!profile) return (
    <div className={`h-[100dvh] flex flex-col items-center justify-center gap-4 text-white ${sharedEntry ? 'entry-loading' : 'bg-slate-950'}`}>
      <p role={loadError ? 'alert' : 'status'}>{loadError || 'Cargando tu aventura...'}</p>
      {loadError && <button onClick={loadUserData} className="px-4 py-2 border rounded">Reintentar</button>}
    </div>
  );

  if (startPhase !== 'PLAYING') return <AdventureStart
    phase={startPhase} profile={profile}
    sharedEntry={sharedEntry} gameplay={visualGameplay}
    onPhase={setStartPhase} onBegin={beginAdventure}
    onNewAdventure={newAdventure} debugEnabled={debugEnabled}
    onCharacter={async (avatarId, equipment, pet) => {
      if(!canEquip(avatarId,equipment,arsenalRef.current))throw Error('Equipment unavailable');
      const saved = await progressService.selectCharacter(userId, avatarId);
      if (!saved || saved.avatarId !== avatarId) throw new Error('Character not confirmed');
      saveEquipment(userId, avatarId, equipment);
      setProfile(saved); dispatch({ type: 'PROFILE', profile: saved });
      if(pet!==undefined)updateGameplay(equipPet(gameplayRef.current,pet));
    }}
    onExit={onExitApp} onReset={resetAdventure}
  />;

  return (
      <div className={`relative w-full h-[100dvh] overflow-hidden ${sharedEntry ? 'shared-game-ui' : 'bg-slate-950'} ${firstMinutesStarted(gameState.adventure)?'first-minutes-adventure':''} ${firstMinutesPhase(gameState.adventure)&&firstMinutesPhase(gameState.adventure)!=='DONE'?'first-minutes-ui':''} text-slate-100 select-none`}>
      {/* HUD SUPERIOR DEL VIDEOJUEGO (Solo visible en WORLD) */}
      {(
        <div className={`valley-world-hud fixed top-0 left-0 right-0 z-50 pointer-events-none p-3 sm:p-5 flex justify-between items-start ${gameMode !== GAME_MODES.WORLD ? 'hidden' : ''}`}>
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
            <WorldMusic adventure={gameState.adventure} active={gameMode === GAME_MODES.WORLD && !flow.discovery && !miniId && !activityResult && !menuOpen} immediatePause={gameMode === GAME_MODES.PIANO || !!miniId || !!activityResult || menuOpen} />
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
      {gameMode === GAME_MODES.WORLD && !flow.discovery && <div role="status" className="valley-world-objective absolute top-14 left-3 z-40 max-w-[calc(100%-6rem)] rounded-lg bg-zinc-950/80 px-3 py-2 text-xs pointer-events-none">
        {valleyProgress.currentObjective.text}
      </div>}
      {debugEnabled && gameMode === GAME_MODES.WORLD && !flow.discovery && <ValleyProgressDebug
        adventure={gameState.adventure} onEvent={event => dispatch({ type: 'VALLEY_EVENT', event })} onReset={resetAdventure}
        onExportPlaytest={() => JSON.stringify(getDevPlaytest(userId)?.export(), null, 2)}
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
            <SharedWorld
              sessionKey={`${userId}:${worldVisit}`}
              hidden={gameMode === GAME_MODES.PIANO || gameMode === GAME_MODES.TRANSITION_TO_WORLD}
              debugEnabled={debugEnabled}
              active={gameMode === GAME_MODES.WORLD && !flow.discovery && !showEnding && !menuOpen && !miniId && !activityResult}
              returnContext={flow.context}
              companionCelebration={companionCelebration}
              onRestorationSettled={id=>{if(id==='OBSERVATORIO_MUSICAL')setFinalRevealReady(true);}}
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
              onPlaytestEvent={handlePlaytestEvent}
              gameplayState={gameplay} equipmentVersion={equipmentVersion} onGameplayReward={receiveReward}
              onMinigame={setMiniId} mapRequest={mapRequest}
              onToyEvent={event=>dispatch({type:'TOY_EVENT',event})}
            />
          </div>
        )}

        {gameMode === GAME_MODES.WORLD && discoveredObject && <AdventureDiscovery
          object={discoveredObject} song={discoveredSong} state={gameState.adventure.entries[discoveredObject.id]?.state || (gameState.world.stationResults[discoveredObject.id]?.completed ? 'COMPLETED' : 'AVAILABLE')}
          onClose={() => dispatch({ type: 'CLOSE_DISCOVERY' })}
          onStart={() => handleEnterLesson(discoveredSong, 'solo', flow.context)}
          onClaimSecret={() => {const next=worldActivityReducer(flow,{type:'CLAIM_SECRET',objectId:discoveredObject.id});if(next===flow)return;dispatch({ type: 'CLAIM_SECRET', objectId: discoveredObject.id });receiveReward(discoveredObject.contentRewardId);}}
        />}
        {showEnding && !activityResult && <ValleyEnding onContinue={() => dispatch({ type: 'ACK_ENDING' })} />}
        {gameMode===GAME_MODES.WORLD && !flow.discovery && <button className="gameplay-menu-button" onClick={()=>setMenuOpen(true)} title="Menu del aventurero" aria-label="Menu del aventurero"><Menu size={20}/></button>}
        {gameMode===GAME_MODES.WORLD && startPhase==='PLAYING' && <div className="world-toy-count" aria-label="Notas Perdidas recogidas" title="Notas Perdidas"><Music2 size={22}/><span key={gameState.adventure.toy?.collectedNotes.length || 0}>{gameState.adventure.toy?.collectedNotes.length || 0}</span></div>}
        {weaponReward && gameMode===GAME_MODES.WORLD && <div className="arsenal-reward" role="status"><VisualPreview characterId={Object.entries(EQUIPMENT).find(([,list])=>list.some(e=>e.id===weaponReward))?.[0]} equipment={weaponReward} weapon/><span>¡Nueva arma!</span></div>}
        {menuOpen && <AdventurerMenu profile={profile} gameplay={visualGameplay} onClose={()=>setMenuOpen(false)} onExit={onExitApp}
          onMap={()=>{setMenuOpen(false);setMapRequest(value=>value+1);}}
          onApply={async(character,equipment,pet)=>{
            if(!canEquip(character,equipment,arsenalRef.current))throw Error('Equipment unavailable');
            if(character!==profile.avatarId){const saved=await progressService.selectCharacter(userId,character);if(saved?.avatarId!==character)throw Error('Character not confirmed');setProfile(saved);dispatch({type:'PROFILE',profile:saved});}
            saveEquipment(userId,character,equipment);setEquipmentVersion(value=>value+1);updateGameplay(equipPet(gameplayRef.current,pet));
          }}/>
        }
        {miniId && <MinigameView key={miniId} definition={getGameplayContent().minigames.find(m=>m.id===miniId)} onClose={()=>setMiniId(null)} onComplete={id=>{
          const content=getGameplayContent();
          const completion=completeMinigame(gameplayRef.current,id,true,{...content,rewards:content.rewards.filter(reward=>reward.type!=='PET')});updateGameplay(completion.state);setMiniId(null);
        }}/>
        }
        {activityResult && <ValleyActivityResult result={activityResult.result} pet={activityResult.pet} characterId={profile.avatarId} pending={activityResult.pending} saveFailed={activityResult.saveFailed} onContinue={()=>{if(firstMinutesStarted(gameState.adventure)&&gameState.adventure.valley.milestones.includes(F.restored)&&!gameplayRef.current.equippedPetId&&activityResult.pet)updateGameplay(equipPet(gameplayRef.current,activityResult.pet.id));setActivityResult(null);dispatch({type:'ACK_REWARD'});}} onEquip={()=>{if(!activityResult.pet)return;updateGameplay(equipPet(gameplayRef.current,activityResult.pet.id));setActivityResult(null);dispatch({type:'ACK_REWARD'});}}/>}
        {(!gameplaySaved||!arsenalSaved) && <p role="alert" className="absolute bottom-12 left-4 z-50 bg-zinc-900 p-3 text-xs">No se pudo guardar tu coleccion en este dispositivo.</p>}
        {gameMode === GAME_MODES.WORLD && gameState.adventure.lastReward && !flow.discovery && !activityResult && <div role="status" className="absolute bottom-16 left-1/2 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-emerald-400 bg-zinc-900 px-4 py-3 text-sm">
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
