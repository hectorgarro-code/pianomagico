import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Play, Sparkles, Compass, Database, Eye, Swords, WandSparkles, PawPrint } from 'lucide-react';
import { createWorldGameplay } from '../gameplay/WorldGameplay.js';
import { createCameraOcclusion } from './cameraOcclusion.js';
import { createFootsteps } from '../audio/footsteps.js';
import { createWeaponCuts } from '../audio/weaponCuts.js';
import { createDoorSound } from '../audio/doorSound.js';
import { createImpactSounds, targetImpactSound } from '../audio/impactSounds.js';
import { createToyNoteSound } from '../audio/toyNoteSound.js';
import { readMusicSettings } from '../audio/worldMusic.js';
import { usePianoMicStore } from '../../hooks/usePianoMicStore.js';
import {FIRST_MINUTES as F,firstMinutesPhase,firstMinutesStarted} from '../gameplay/firstMinutes.js';
import FirstMinutesHints from '../gameplay/FirstMinutesHints.jsx';
import {createFirstMinutesWorld} from '../gameplay/FirstMinutesWorld.js';
import { createFootstepSurface } from './footstepSurface.js';
import { getGameplayContent } from '../gameplay/gameplayContent.js';
import { getCharacterModel } from '../../modules/core/utils/characterModels';
import { WorldGenerator } from './WorldGenerator';
import AssetDiagnosticModal from '../assets/AssetDiagnosticModal';
import { PLAZA_COMPOSITION } from './composition/plazaComposition.js';
import { CollisionWorld, PLAYER_COLLIDER } from './collision/CollisionWorld.js';
import { createCollisionOutline, disposeCollisionDebug } from './collision/collisionDebug.js';
import { restoreWorldContext } from '../state/worldActivityFlow.js';
import { ADVENTURE_STATES, createAdventureState } from '../adventure/adventureState.js';
import { getPlayableRegionAt } from '../adventure/valleyProgression.js';
import { ADVENTURE_OBJECT_TYPES } from './composition/forestAdventureComposition.js';
import { getActiveWorldColliders, updateGateModels } from './worldGates.js';
import WorldNavigation from '../navigation/WorldNavigation.jsx';
import { resolveObjectiveTarget } from '../navigation/valleyNavigation.js';
import { createChestSignals } from './chestSignals.js';
import { createCharacterAnimator } from '../presentation/characterActions.js';
import { loadCharacterPresentation, applyEquipment, readEquipment, getEquipment } from '../presentation/characterEquipment.js';
import { assistedCameraYaw, terrainSafeCameraHeight } from './cameraAssist.js';
import { titleCamera } from '../entry/entryExperience.js';

function updateChestLids(models, state) {
  for (const [id, lid] of models) lid.node.rotation.x = lid.closedRotation + (state?.entries[id]?.state === ADVENTURE_STATES.COMPLETED || id===F.station&&state?.valley?.milestones.includes(F.restored) ? -1.15 : 0);
}
const EMPTY_GAMEPLAY = { completedMinigames: [], equippedPetId: null };

export default function World3DView({
  debugEnabled = false,
  onToyEvent,
  active = true,
  returnContext = null,
  companionCelebration = 0,
  completedStationIds = [],
  songs = [],
  profile = {},
  userPerformances = [],
  memoryMedals = [],
  initialPosition = null,
  initialRotation = null,
  onEnterLesson,
  onDiscoverAdventure,
  adventureState,
  onObjectiveProgress,
  onAdventureDebug,
  onPlaytestEvent,
  onPlayerTransformChange,
  gameplayState,
  equipmentVersion = 0,
  presentation = false,
  sessionKey = null,
  onGameplayReward,
  onRestorationSettled,
  onMinigame,
  mapRequest = 0
}) {
  const containerRef = useRef(null);
  const songsRef = useRef(songs); songsRef.current = songs;
  const presentationRef = useRef(presentation), sessionRef = useRef(sessionKey), prepareSessionRef = useRef(null);
  presentationRef.current = presentation; sessionRef.current = sessionKey;
  const [nearbyStation, setNearbyStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Iniciando...');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [worldMetrics, setWorldMetrics] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const mapOpenRef = useRef(false);
  mapOpenRef.current = mapOpen;
  useEffect(() => { if (mapRequest) setMapOpen(true); }, [mapRequest]);
  useEffect(() => {
    for (const key of Object.keys(keysRef.current)) keysRef.current[key] = false;
    isDraggingMouseRef.current = false;
  }, [mapOpen]);

  // Compute unlock progress defensivamente
  const perfsArray = Array.isArray(userPerformances) ? userPerformances : [];
  const medalsArray = Array.isArray(memoryMedals) ? memoryMedals : [];
  const songsArray = Array.isArray(songs) ? songs : [];

  const completedSongIds = new Set(perfsArray.map(p => p?.song_id).filter(Boolean));
  let highestUnlockedIndex = 0;
  for (let i = 0; i < songsArray.length; i++) {
    const prevId = songsArray[i - 1]?.id || -1;
    const isUnlocked = i === 0 || completedSongIds.has(prevId) || medalsArray.includes(prevId);
    if (isUnlocked) highestUnlockedIndex = i;
    else break;
  }

  const walkedDistanceRef = useRef(0);
  const objectiveCallbackRef = useRef(onObjectiveProgress);
  objectiveCallbackRef.current = onObjectiveProgress;
  const reportedObjectiveRef = useRef(null);

  // Player state refs (Preserva posición recibida o valor inicial)
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, shift: false, space: false });
  const playerPosRef = useRef({
    x: initialPosition?.x ?? PLAZA_COMPOSITION.spawn.position[0],
    y: initialPosition?.y ?? PLAZA_COMPOSITION.spawn.position[1],
    z: initialPosition?.z ?? PLAZA_COMPOSITION.spawn.position[2]
  });
  const playerVelYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const playerRotYRef = useRef(initialRotation ?? PLAZA_COMPOSITION.spawn.rotation[1]);
  const [navigationPose, setNavigationPose] = useState({ position: { ...playerPosRef.current },
    rotation: playerRotYRef.current, cameraYaw: PLAZA_COMPOSITION.camera.yaw });
  const introPhase=firstMinutesPhase(adventureState),introActive=!!introPhase&&introPhase!=='DONE';

  // Camera Orbit / Rotation Controls con Damping suave y Anti-Clipping
  const cameraAngleRef = useRef({
    targetYaw: PLAZA_COMPOSITION.camera.yaw,
    currentYaw: PLAZA_COMPOSITION.camera.yaw,
    targetPitch: PLAZA_COMPOSITION.camera.pitch,
    currentPitch: PLAZA_COMPOSITION.camera.pitch,
    targetDistance: PLAZA_COMPOSITION.camera.distance,
    currentDistance: PLAZA_COMPOSITION.camera.distance,
    fittedDistance: PLAZA_COMPOSITION.camera.distance
  });
  const isDraggingMouseRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Character & scene refs
  const cameraRef = useRef(null);
  const characterMeshRef = useRef(null);
  const characterMixerRef = useRef(null);
  const characterActionsRef = useRef({});
  const expressionRef = useRef(null);
  const weaponCutsRef = useRef(null);
    const worldCueRef = useRef(null);
  const doorSoundRef = useRef(null);
  const encounterCameraRef = useRef(0);
  const gameplayRef = useRef(null), gameplayStateRef = useRef(gameplayState), profileRef = useRef(profile), loadHeroRef = useRef(null), restoredContextRef = useRef(null);
  const callbacksRef = useRef({onGameplayReward,onMinigame,onToyEvent,onRestorationSettled});callbacksRef.current={onGameplayReward,onMinigame,onToyEvent,onRestorationSettled};
  gameplayStateRef.current=gameplayState || EMPTY_GAMEPLAY;profileRef.current=profile;
  const [nearbyGate,setNearbyGate]=useState(null);
  const companionCelebratedRef=useRef(companionCelebration);
  useEffect(()=>{
    if(active && companionCelebration!==companionCelebratedRef.current){
      companionCelebratedRef.current=companionCelebration;gameplayRef.current?.companionEvent('LESSON_COMPLETED');worldCueRef.current?.('chest');
    }
  },[active,companionCelebration]);
  useEffect(()=>{void gameplayRef.current?.setPet(gameplayState?.equippedPetId).catch(console.error);},[gameplayState?.equippedPetId]);
  useEffect(()=>{void loadHeroRef.current?.().catch(console.error);},[profile.avatarId,equipmentVersion]);
  useEffect(() => {
    if (!sessionKey) return;
    Object.assign(playerPosRef.current, initialPosition || { x: PLAZA_COMPOSITION.spawn.position[0], y: PLAZA_COMPOSITION.spawn.position[1], z: PLAZA_COMPOSITION.spawn.position[2] });
    playerRotYRef.current = initialRotation ?? PLAZA_COMPOSITION.spawn.rotation[1];
    playerVelYRef.current = 0; isGroundedRef.current = true; restoredContextRef.current = null;
    walkedDistanceRef.current = 0; reportedObjectiveRef.current = null; setMapOpen(false);
    Object.assign(cameraAngleRef.current, { targetYaw: PLAZA_COMPOSITION.camera.yaw, currentYaw: PLAZA_COMPOSITION.camera.yaw, targetPitch: PLAZA_COMPOSITION.camera.pitch, currentPitch: PLAZA_COMPOSITION.camera.pitch });
    void prepareSessionRef.current?.().then(() => loadHeroRef.current?.()).catch(console.error);
  }, [sessionKey]);
  const lastManualCameraRef = useRef(-Infinity);
  const movementBasisRef = useRef({ signature: '', yaw: 0 });
  const debugGroupRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const interactionLockedRef = useRef(false);
  const collisionWorldRef = useRef(null);
  const allCollidersRef = useRef([]);
  const gateModelsRef = useRef([]);
  const terrainHeightRef = useRef(() => 0);
  const adventureModelsRef = useRef(new Map());
  const adventureStateRef = useRef(adventureState);
  const presentationAdventure = useRef(null);
  if (!presentationAdventure.current) presentationAdventure.current = createAdventureState();
  adventureStateRef.current = adventureState || presentationAdventure.current;
  const [interactionObjects, setInteractionObjects] = useState([]);
  useEffect(() => { updateChestLids(adventureModelsRef.current, adventureState); }, [adventureState]);
  useEffect(() => {
    if (!collisionWorldRef.current || !adventureState) return;
    collisionWorldRef.current = new CollisionWorld([...getActiveWorldColliders(allCollidersRef.current, adventureState),...(gameplayRef.current?.colliders() || [])]);
    updateGateModels(gateModelsRef.current, adventureState,model=>doorSoundRef.current?.opened(model.userData.gateId,model.getWorldPosition(new THREE.Vector3())));
    updateGateModels(debugGroupRef.current?.getObjectByName('Collision_Debug')?.children.filter(node=>node.userData.gateId) || [], adventureState);
  }, [adventureState]);

  useEffect(() => {
    for (const key of Object.keys(keysRef.current)) keysRef.current[key] = false;
    isDraggingMouseRef.current = false;
    if (!active) return;
    interactionLockedRef.current = false;
    if (returnContext && restoredContextRef.current !== returnContext && collisionWorldRef.current) {
      restoredContextRef.current = returnContext;
      const safe = restoreWorldContext(returnContext, collisionWorldRef.current, terrainHeightRef.current);
      Object.assign(playerPosRef.current, safe.position);
      playerRotYRef.current = safe.rotation;
      playerVelYRef.current = 0;
      isGroundedRef.current = true;
      if (safe.camera) Object.assign(cameraAngleRef.current, safe.camera);
    }
  }, [active, returnContext]);

  const performWorldAction = key => {
    if (!activeRef.current || loading || mapOpenRef.current || gameplayRef.current?.staggered) return;
    if (key==='E' && nearbyGate) {callbacksRef.current.onMinigame?.(nearbyGate.minigameId);return;}
    if (key==='E' && nearbyStation) {handleTriggerLesson(nearbyStation);return;}
    const introductoryTarget=key==='Q'?gameplayRef.current?.introTarget():null;
    if(introductoryTarget&&Math.hypot(introductoryTarget.x-playerPosRef.current.x,introductoryTarget.z-playerPosRef.current.z)<2.8)playerRotYRef.current=Math.atan2(introductoryTarget.x-playerPosRef.current.x,introductoryTarget.z-playerPosRef.current.z);
    if (isGroundedRef.current && expressionRef.current?.express(key)) {
      const clip=expressionRef.current.actions[expressionRef.current.name]?.getClip();
      gameplayRef.current?.action(clip?.name,clip?.duration || 1);
      weaponCutsRef.current?.begin(characterMeshRef.current?.userData.weaponCut,clip?.name,clip?.duration || 1);
    }
  };

  // Sincronizar visibilidad del overlay de depuración
  useEffect(() => {
    if (debugGroupRef.current) {
      debugGroupRef.current.visible = debugMode;
    }
  }, [debugMode]);

  // Notificar al estado del juego al interactuar
  const handleTriggerLesson = (station) => {
    if(station?.id===F.station&&firstMinutesStarted(adventureStateRef.current)&&!['CHEST','DONE'].includes(firstMinutesPhase(adventureStateRef.current)))return;
    if (!station || !activeRef.current || mapOpenRef.current || expressionRef.current?.locked || interactionLockedRef.current || loading) return;
    if (station.type !== ADVENTURE_OBJECT_TYPES.PRACTICE_STATION && !onDiscoverAdventure) return;
    interactionLockedRef.current = true;
    const position=station.position;
    if(position)gameplayRef.current?.companionEvent('CHEST_INSPECTED',Array.isArray(position)?{x:position[0],z:position[2]}:position);
    const context = {
      position: { ...playerPosRef.current }, rotation: playerRotYRef.current,
      stationId: station.id, regionId: station.regionId,
      activityId: station.song?.id ?? station.activityId,
      worldId: 'valle_notas', camera: { ...cameraAngleRef.current }
    };
    if (onPlayerTransformChange) {
      onPlayerTransformChange(context);
    }
    if (onDiscoverAdventure) {
      onDiscoverAdventure(station.id, context);
    } else if (onEnterLesson && station.song) {
      onEnterLesson(station.song, 'solo', context);
    }
  };

  // Keyboard Event Listeners (WASD + Shift + Space + E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeRef.current || mapOpenRef.current || e.repeat || e.target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if(/^Digit[123]$/.test(e.code)&&gameplayRef.current?.musicKey(Number(e.code.slice(-1))-1)){e.preventDefault();return;}
      if(e.code==='KeyF'&&!loading&&!gameplayRef.current?.staggered){e.preventDefault();gameplayRef.current?.interactPet();return;}
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keysRef.current.shift = true;

      // Salto / Interactuar
      if (e.code === 'Space') {
        if (expressionRef.current?.locked) return;
        e.preventDefault();
        if (nearbyStation && !keysRef.current.space) {
          handleTriggerLesson(nearbyStation);
        } else if (isGroundedRef.current) {
          playerVelYRef.current = 8.5;
          isGroundedRef.current = false;
          keysRef.current.space = true;
          const jumpAction = characterActionsRef.current['Jump_Full_Short'];
          if (jumpAction) jumpAction.reset().setLoop(THREE.LoopOnce, 1).play();
        }
      }

      // Interactuar (tecla E)
      if (e.code === 'KeyE' && nearbyGate) {
        e.preventDefault();performWorldAction('E');
      } else if (e.code === 'KeyE' && nearbyStation) {
        e.preventDefault();
        handleTriggerLesson(nearbyStation);
      } else if ((e.code === 'KeyQ' || e.code === 'KeyE') && isGroundedRef.current) {
        e.preventDefault(); performWorldAction(e.code.slice(-1));
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keysRef.current.shift = false;
      if (e.code === 'Space') keysRef.current.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    const clearKeys = () => { for (const key of Object.keys(keysRef.current)) keysRef.current[key] = false; };
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [nearbyStation, nearbyGate, active, loading]);

  // Arrastre con ratón para rotación orbital con amortiguación (Damping)
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!activeRef.current || mapOpenRef.current) return;
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      isDraggingMouseRef.current = true;
      lastManualCameraRef.current = performance.now();
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!activeRef.current) return;
      if (!isDraggingMouseRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.targetYaw -= dx * 0.0048;
      lastManualCameraRef.current = performance.now();
      cameraAngleRef.current.targetPitch = Math.max(0.08, Math.min(0.85, cameraAngleRef.current.targetPitch + dy * 0.0035));
    };

    const handleMouseUp = () => {
      isDraggingMouseRef.current = false;
    };

    const handleWheel = (e) => {
      if (!activeRef.current || mapOpenRef.current) return;
      lastManualCameraRef.current = performance.now();
      cameraAngleRef.current.targetDistance = Math.max(8.5, Math.min(22.0, cameraAngleRef.current.targetDistance + e.deltaY * 0.012));
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Main Three.js Scene Setup (Integración con WorldGenerator)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let animFrameId = null;

    // 1. Atmósfera y Cielo Estilizado
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bd8ff);
    const atmosphere = PLAZA_COMPOSITION.constructionPhase && PLAZA_COMPOSITION.atmosphere;
    scene.fog = atmosphere
      ? new THREE.Fog(atmosphere.color, atmosphere.near, atmosphere.far)
      : new THREE.FogExp2(0x9bd8ff, 0.005);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.3, 500);
    const fitCamera = (w, h) => {
      camera.aspect = w / h;
      camera.fov = presentationRef.current ? (camera.aspect < 1 ? 48 : 44) : camera.aspect < 1
        ? Math.min(100, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(22)) / camera.aspect)))
        : 44;
      const nextDistance = camera.aspect < 1
        ? PLAZA_COMPOSITION.camera.portraitDistance || PLAZA_COMPOSITION.camera.distance
        : PLAZA_COMPOSITION.camera.distance;
      const angles = cameraAngleRef.current;
      const baseDistance = PLAZA_COMPOSITION.camera.distance;
      const ratio = nextDistance / (angles.fittedDistance || baseDistance);
      angles.targetDistance = (Number.isFinite(angles.targetDistance) ? angles.targetDistance : baseDistance) * ratio;
      angles.currentDistance = (Number.isFinite(angles.currentDistance) ? angles.currentDistance : baseDistance) * ratio;
      cameraAngleRef.current.fittedDistance = nextDistance;
      camera.updateProjectionMatrix();
    };
    fitCamera(width, height);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    renderer.domElement.dataset.worldInstance = crypto.randomUUID();

    // 2. Iluminación Cálida Estilizada
    const hemiLight = new THREE.HemisphereLight(0xfffdf0, 0x477839, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae0, 2.6);
    sunLight.position.set(45, 65, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 190;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
    fillLight.position.set(-35, 25, -40);
    scene.add(fillLight);

    // 3. Ejecución del Generador del Mundo: escena de revisión Plaza + transición corta.
    setLoadingProgress('Preparando Plaza de las Notas...');
    const generator = new WorldGenerator('VALLE_DE_LAS_NOTAS_V1');
    let getTerrainHeight = (x, z) => 0;
    let collisionWorld = null;
    let playerColliderDebug = null;
    let collisionDebug = null;
    let chestSignals = null;
    let firstMinutesWorld = null;
    let cameraOcclusion = null;
    const footsteps=createFootsteps({baseUrl:import.meta.env.BASE_URL});
    const weaponCuts=createWeaponCuts({baseUrl:import.meta.env.BASE_URL});weaponCutsRef.current=weaponCuts;
    const doorSound=createDoorSound({baseUrl:import.meta.env.BASE_URL});doorSoundRef.current=doorSound;
    const impactSounds=createImpactSounds({baseUrl:import.meta.env.BASE_URL});
    const noteSound=createToyNoteSound();
    worldCueRef.current=kind=>noteSound.cue(kind,{silent:audioSilent(),volume:stepSettings.volume});
    let runePointer=null;
    const runeDown=event=>{runePointer={x:event.clientX,y:event.clientY};};
    const runeUp=event=>{
      if(!runePointer||Math.hypot(event.clientX-runePointer.x,event.clientY-runePointer.y)>8)return;
      runePointer=null;if(!activeRef.current||mapOpenRef.current)return;
      const bounds=renderer.domElement.getBoundingClientRect();
      gameplayRef.current?.musicPointer((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1,camera);
    };
    renderer.domElement.addEventListener('pointerdown',runeDown);renderer.domElement.addEventListener('pointerup',runeUp);
    const unlockNotes=()=>{if(activeRef.current&&!usePianoMicStore.getState().isListening&&!document.hidden)noteSound.unlock();};
    window.addEventListener('pointerdown',unlockNotes);window.addEventListener('keydown',unlockNotes);
    let surfaceAt=()=> 'grass';
    let stepSettings=readMusicSettings(globalThis.localStorage);
    const audioSilent=()=>document.hidden||mapOpenRef.current||!activeRef.current||stepSettings.muted||stepSettings.volume===0||usePianoMicStore.getState().isListening;
    const stopWorldSounds=()=>{footsteps.stop();weaponCuts.stop();doorSound.reset();impactSounds.stop();noteSound.stop();};
    const unsubscribeMic=usePianoMicStore.subscribe((state,previous)=>{if(state.isListening&&!previous.isListening)stopWorldSounds();});
    const syncStepSettings=()=>{stepSettings=readMusicSettings(globalThis.localStorage);if(audioSilent())stopWorldSounds();};
    window.addEventListener('valley-audio-preferences',syncStepSettings);
    window.addEventListener('valley-music-settings',syncStepSettings);
    window.addEventListener('storage',syncStepSettings);
    const pauseSteps=()=>{if(document.hidden){footsteps.stop();weaponCuts.stop();doorSound.reset();impactSounds.stop();noteSound.stop();}};
    document.addEventListener('visibilitychange',pauseSteps);
    const syncWorldVolume=event=>{if(event.target?.hasAttribute?.('data-world-music')){syncStepSettings();if(stepSettings.muted || stepSettings.volume===0){footsteps.stop();weaponCuts.stop();doorSound.reset();impactSounds.stop();noteSound.stop();}}};
    document.addEventListener('volumechange',syncWorldVolume,true);
    const titleHidden = [];
    let titleStarted = performance.now(), wasPresentation = presentationRef.current, sessionToken = 0;
    const resetTitle = () => { if (presentationRef.current) titleStarted = performance.now(); };
    window.addEventListener('pointerdown', resetTitle); window.addEventListener('keydown', resetTitle);
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(72), 3));
    const moteMaterial = new THREE.PointsMaterial({ color: 0xffe7a0, size: .07, transparent: true, opacity: .55, depthWrite: false });
    const motes = new THREE.Points(moteGeometry, moteMaterial); scene.add(motes);

    generator.buildSection1().then(async ({ sceneGroup, debugGroup, heightAt, stats, colliders, interactionObjects: generatedObjects }) => {
      if (!isMounted) {
        disposeCollisionDebug(debugGroup.getObjectByName('Collision_Debug'));
        return;
      }
      getTerrainHeight = heightAt;
      terrainHeightRef.current = heightAt;
      allCollidersRef.current = colliders;
      collisionWorld = new CollisionWorld(getActiveWorldColliders(colliders, adventureStateRef.current));
      collisionWorldRef.current = collisionWorld;
      gateModelsRef.current = [];
      sceneGroup.traverse(obj => { if(obj.userData.gateId) gateModelsRef.current.push(obj); });
      updateGateModels(gateModelsRef.current, adventureStateRef.current);
      const safeSpawn=collisionWorld.move(playerPosRef.current,{x:0,z:0});
      Object.assign(playerPosRef.current,safeSpawn);
      scene.add(sceneGroup);
      cameraOcclusion=createCameraOcclusion(sceneGroup);
      surfaceAt=createFootstepSurface(sceneGroup);

      // Debug overlay
      debugGroup.visible = debugMode;
      scene.add(debugGroup);
      debugGroupRef.current = debugGroup;
      collisionDebug=debugGroup.getObjectByName('Collision_Debug');
      updateGateModels(collisionDebug.children.filter(node=>node.userData.gateId), adventureStateRef.current);
      playerColliderDebug=createCollisionOutline({shape:'circle',x:0,z:0,radius:PLAYER_COLLIDER.radius,y:.1},0xff6580);
      collisionDebug.add(playerColliderDebug);

      setWorldMetrics({...stats,solidColliders:collisionWorld.colliders.length});

      for (const object of generatedObjects) {
        const song = object.lessonRef === 'first-song'
          ? songs[0]
          : songs.find(item => String(item.id) === String(object.activityId ?? object.lessonRef));
        let instance = null;
        sceneGroup.traverse(obj => { if (obj.userData.compositionId === object.instanceId) instance = obj; });
        if (instance) {
          const lid = instance.getObjectByName('chest_lid');
          if (lid) adventureModelsRef.current.set(object.id, { node: lid, closedRotation: lid.rotation.x });
        }
        if (instance) titleHidden.push(instance);
        object.song = song;
        levelPositions.push({ ...object, ...object.position, song, interactionRadius: object.interaction.radius });
      }
      setInteractionObjects(levelPositions);
      updateChestLids(adventureModelsRef.current, adventureStateRef.current);
      chestSignals = createChestSignals(scene, generatedObjects, heightAt);
      firstMinutesWorld=createFirstMinutesWorld(scene,heightAt);

      prepareSessionRef.current = async () => {
        if (!sessionRef.current || !profileRef.current.avatarId) return;
        doorSound.reset();
        const token = ++sessionToken;
        gameplayRef.current?.dispose(); gameplayRef.current = null;
        const runtime=await createWorldGameplay(scene,heightAt,{
          state:()=>gameplayStateRef.current,player:()=>playerPosRef.current,
          adventure:()=>adventureStateRef.current,
          companionChests:()=>levelPositions.filter(object=>object.type!==ADVENTURE_OBJECT_TYPES.SECRET_REWARD &&
            (object.type===ADVENTURE_OBJECT_TYPES.PRACTICE_STATION || adventureStateRef.current?.entries[object.id]?.state===ADVENTURE_STATES.COMPLETED))
            .map(object=>({x:object.x,z:object.z,kind:'CHEST'})),
          onToyEvent:event=>callbacksRef.current.onToyEvent?.(event),
          onSecretFound:(id,position)=>{noteSound.cue('secret',{silent:audioSilent(),volume:stepSettings.volume,position,player:playerPosRef.current,yaw:cameraAngleRef.current.currentYaw});onPlaytestEvent?.('SECRET_DISCOVERED',{id});},
          onNoteSound:(pitch,position)=>noteSound.play(pitch,{silent:audioSilent(),volume:stepSettings.volume,position:Array.isArray(position)?{x:position[0],z:position[2]}:position,player:playerPosRef.current,yaw:cameraAngleRef.current.currentYaw}),
          onMusicalFocus:focused=>window.dispatchEvent(new CustomEvent('valley-musical-focus',{detail:focused})),
          onRestorationNote:(pitch,volume)=>noteSound.play(pitch,{volume:volume*stepSettings.volume,silent:audioSilent()}),
          onRestorationSettled:id=>callbacksRef.current.onRestorationSettled?.(id),
          onReward:id=>callbacksRef.current.onGameplayReward?.(id),
          onPlayerHit:({training}={})=>{weaponCuts.stop();playerVelYRef.current=training?3:8;isGroundedRef.current=false;expressionRef.current?.react();impactSounds.play('hurt',{silent:audioSilent(),volume:stepSettings.volume});},
          onPlayerImpact:target=>{
            const silent=audioSilent();
            const mageSound=weaponCuts.impact({silent,volume:stepSettings.volume});
            if(!mageSound || target.type==='DESTRUCTIBLE'||target.defeated)impactSounds.play(targetImpactSound(target),{silent,volume:stepSettings.volume,position:target.position,player:playerPosRef.current});
          },
          onGateOpened:gate=>doorSound.opened(gate.id,{x:gate.position[0],z:gate.position[2]}),
          onColliders:extra=>{collisionWorldRef.current=new CollisionWorld([...getActiveWorldColliders(allCollidersRef.current,adventureStateRef.current),...extra]);}
        });
        if(!isMounted || token !== sessionToken || !sessionRef.current){runtime.dispose();return;}gameplayRef.current=runtime;
        await runtime.setPet(gameplayStateRef.current.equippedPetId);
        await runtime.prepareResidents();
      };

      // 6. Spawn del Héroe
      let heroToken=0;
      const loadHero=async()=>{
        if (!profileRef.current.avatarId) return;
        const token=++heroToken;
        const charInfo = getCharacterModel(profileRef.current.avatarId);
        const heroGltf = await loadCharacterPresentation(charInfo.id);
        if (heroGltf && heroGltf.scene && isMounted && token===heroToken) {
          const charMesh = SkeletonUtils.clone(heroGltf.scene);
          charMesh.scale.set(1.15, 1.15, 1.15);
          charMesh.position.set(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);
          charMesh.rotation.y = playerRotYRef.current;
          charMesh.traverse(c => { if (c.isMesh) c.castShadow = true; });
          const equipment = getEquipment(charInfo.id, readEquipment(profileRef.current.user_id ?? profileRef.current.id, charInfo.id));
          await applyEquipment(charMesh, charInfo.id, equipment.id);
          charMesh.userData.weaponCut=charInfo.id===2?'mage':equipment.nodes.some(name=>name.includes('Sword'))?'sword':equipment.nodes.some(name=>name.includes('Axe'))?'axe':null;
          weaponCuts.stop();
          if (!isMounted || token!==heroToken) return;
          expressionRef.current?.dispose();
          if(characterMeshRef.current){const skeletons=new Set();characterMeshRef.current.traverse(n=>{if(n.skeleton)skeletons.add(n.skeleton);});skeletons.forEach(s=>s.dispose());characterMeshRef.current.removeFromParent();}
          scene.add(charMesh);
          characterMeshRef.current = charMesh;

          if (heroGltf.animations && heroGltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(charMesh);
            characterMixerRef.current = mixer;
            expressionRef.current = createCharacterAnimator(mixer, heroGltf.animations, charInfo.id, equipment);
            characterActionsRef.current = expressionRef.current.actions;
          }
        }
      };
      loadHeroRef.current=loadHero;
      try {await prepareSessionRef.current(); await loadHero();} catch (e) {
        console.warn('Error cargando héroe:', e);
      }

      setLoading(false);
    }).catch(error => {
      if (!isMounted) return;
      console.error('[CompositionBlueprint]', error);
      setLoadingProgress('No se pudo materializar Plaza. Revisa el diagnostico de composicion.');
    });

    const levelPositions = [];

    // 7. Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      fitCamera(w, h);
      renderer.setSize(w, h);
      // A paused lesson backdrop must survive resize without advancing the world.
      if (!activeRef.current) renderer.render(scene,camera);
    };
    window.addEventListener('resize', handleResize);

    // 8. Bucle de Render y Movimiento de Aventura con Damping de Cámara y Prevención de Clipping
    let lastTime = performance.now();
    let metricsTime=lastTime, metricsFrames=0;
    let navigationTime=0;
    const targetProjection=new THREE.Vector3();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const presenting = presentationRef.current;
      if (wasPresentation !== presenting) { fitCamera(container.clientWidth, container.clientHeight); wasPresentation = presenting; }
      motes.visible = presenting;
      for (const object of titleHidden) object.visible = !presenting;
      const gameplayGroup = scene.getObjectByName('Gameplay_Content');
      if (gameplayGroup) gameplayGroup.visible = !presenting;
      if (characterMeshRef.current) characterMeshRef.current.visible = !presenting;
      if (presenting) {
        footsteps.stop();
        weaponCuts.stop();
        doorSound.reset();
        impactSounds.stop();
        noteSound.stop();
        if (document.hidden) { titleStarted += delta * 1000; return; }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.entryMotion === 'reduced';
        const shot = titleCamera((now - titleStarted) / 1000, camera.aspect < 1, reduced);
        camera.position.lerp(new THREE.Vector3(...shot.position), Math.min(1, delta * 2));
        camera.lookAt(...shot.target);
        const positions = moteGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) positions.setXYZ(i, 2 + Math.sin(i * 2.4) * 7, 1 + (i * .3 + (reduced ? 0 : now / 8000)) % 4, -2 + Math.cos(i * 2.4) * 8);
        positions.needsUpdate = true; renderer.render(scene, camera);
        renderer.domElement.dataset.entryCamera = JSON.stringify({ shot: shot.shot, position: camera.position.toArray(), mobile: camera.aspect < 1 });
        if (import.meta.env.DEV) {
          metricsFrames++;
          if (now - metricsTime >= 1000) {
            renderer.domElement.dataset.renderMetrics = JSON.stringify({ fps: Math.round(metricsFrames * 1000 / (now - metricsTime)), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, presentation: true, foreground: document.hasFocus() });
            metricsFrames = 0; metricsTime = now;
          }
        }
        return;
      }
      if (!activeRef.current) {footsteps.stop();weaponCuts.stop();impactSounds.stop();noteSound.stop();doorSound.update({active:false,silent:document.hidden || stepSettings.muted || stepSettings.volume===0,player:playerPosRef.current});cameraOcclusion?.reset();metricsTime=now;metricsFrames=0;return;}

      if (characterMixerRef.current) {
        characterMixerRef.current.update(delta);
      }

      // Input de Movimiento
      const isShift = keysRef.current.shift;
      const baseSpeed = isShift ? 8.2 : 4.4;
      let inputX = 0;
      let inputZ = 0;

      if (keysRef.current.forward) inputZ -= 1;
      if (keysRef.current.backward) inputZ += 1;
      if (keysRef.current.left) inputX -= 1;
      if (keysRef.current.right) inputX += 1;

      const isInputActive = !mapOpenRef.current && !expressionRef.current?.locked && !gameplayRef.current?.staggered && (inputX !== 0 || inputZ !== 0);

      // Calcular dirección de movimiento orientada según el azimut de la cámara
      let moveDir = new THREE.Vector3(0, 0, 0);
      if (isInputActive) {
        const normInput = new THREE.Vector2(inputX, inputZ).normalize();
        const signature = `${inputX}:${inputZ}`;
        const basis = movementBasisRef.current;
        if (basis.signature !== signature || isDraggingMouseRef.current) { basis.signature = signature; basis.yaw = cameraAngleRef.current.currentYaw; }
        const camYaw = basis.yaw;
        const forward = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
        const right = new THREE.Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));

        moveDir.add(forward.clone().multiplyScalar(-normInput.y));
        moveDir.add(right.clone().multiplyScalar(normInput.x));
        moveDir.normalize();

        const targetRotY = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetRotY - playerRotYRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        playerRotYRef.current += diff * Math.min(1.0, 12 * delta);
      } else movementBasisRef.current.signature = '';

      let isMoving=false;
      let stepDistance=0;
      collisionWorld = collisionWorldRef.current;
      if (isInputActive && collisionWorld) {
        const beforeX=playerPosRef.current.x,beforeZ=playerPosRef.current.z;
        const displacement={x:moveDir.x*baseSpeed*delta,z:moveDir.z*baseSpeed*delta};
        const next=gameplayRef.current?.movePlayer(playerPosRef.current,displacement,collisionWorld) || collisionWorld.move(playerPosRef.current,displacement);
        Object.assign(playerPosRef.current,next);
        isMoving=Math.hypot(next.x-beforeX,next.z-beforeZ)>1e-5;
        stepDistance=Math.hypot(next.x-beforeX,next.z-beforeZ);
        if (isMoving) {
          walkedDistanceRef.current += Math.hypot(next.x-beforeX,next.z-beforeZ);
          const journey = adventureStateRef.current?.journey;
          if(firstMinutesPhase(adventureStateRef.current)==='MOVE'&&walkedDistanceRef.current>=.6)objectiveCallbackRef.current?.({...playerPosRef.current},walkedDistanceRef.current);
          const event = `${getPlayableRegionAt(next) || 'TRANSITION'}:${walkedDistanceRef.current >= 3 || next.z < -10 ? 'WALKED' : 'START'}`;
          if (journey?.started && event && event !== reportedObjectiveRef.current) {
            reportedObjectiveRef.current = event;
            objectiveCallbackRef.current?.({ ...playerPosRef.current }, walkedDistanceRef.current);
          }
        }
      }

      const groundY = getTerrainHeight(playerPosRef.current.x, playerPosRef.current.z);

      // Salto & Gravedad
      if (!isGroundedRef.current) {
        playerVelYRef.current -= 22 * delta;
        playerPosRef.current.y += playerVelYRef.current * delta;
        if (playerPosRef.current.y <= groundY) {
          playerPosRef.current.y = groundY;
          playerVelYRef.current = 0;
          isGroundedRef.current = true;
        }
      } else {
        playerPosRef.current.y = groundY;
      }

      if(!mapOpenRef.current)gameplayRef.current?.update(delta,now/1000,playerPosRef.current,playerRotYRef.current,collisionWorldRef.current);
      weaponCuts.update(delta,{silent:audioSilent(),volume:stepSettings.volume});
      doorSound.update({active:!mapOpenRef.current,silent:audioSilent(),volume:stepSettings.volume,player:playerPosRef.current});
      if(audioSilent())impactSounds.stop();
      footsteps.update({moved:stepDistance,grounded:isGroundedRef.current && !gameplayRef.current?.staggered,
        running:isShift,time:now/1000,surface:()=>surfaceAt(playerPosRef.current),
        silent:audioSilent(),volume:stepSettings.volume});

      // Animaciones de Personaje
      let desiredAnim = 'Idle';
      if (isMoving) {
        desiredAnim = isShift ? 'Running_A' : 'Walking_A';
      }

      expressionRef.current?.locomotion(desiredAnim);

      if (characterMeshRef.current) {
        characterMeshRef.current.position.set(
          playerPosRef.current.x,
          playerPosRef.current.y,
          playerPosRef.current.z
        );
        characterMeshRef.current.rotation.y = playerRotYRef.current;
        sunLight.target = characterMeshRef.current;
      }
      setNearbyGate(gameplayRef.current?.nearestGate(playerPosRef.current) || null);
      if(playerColliderDebug)playerColliderDebug.position.set(playerPosRef.current.x,playerPosRef.current.y,playerPosRef.current.z);

      // Detección de proximidad a estaciones
      let detected = null;
      for (let pos of levelPositions) {
        pos.song = pos.id===F.station&&firstMinutesStarted(adventureStateRef.current)?songsRef.current.find(song=>String(song.id)===String(pos.introActivityId??F.activityId)):pos.lessonRef === 'first-song' ? songsRef.current[0] : songsRef.current.find(song => String(song.id) === String(pos.activityId ?? pos.lessonRef));
        if(pos.id===F.station&&firstMinutesStarted(adventureStateRef.current)&&!['CHEST','DONE'].includes(firstMinutesPhase(adventureStateRef.current)))continue;
        const dx = playerPosRef.current.x - pos.x;
        const dz = playerPosRef.current.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < (pos.interactionRadius ?? 3.0)) {
          detected = pos;
          break;
        }
      }
      setNearbyStation(detected);

      // ==========================================
      // CÁMARA TERCERA PERSONA CON DAMPING SUAVE Y ANTI-CLIPPING
      // ==========================================
      const angles = cameraAngleRef.current;
      angles.targetYaw = assistedCameraYaw({ yaw: angles.targetYaw, rotation: playerRotYRef.current, moving: isMoving,
        dragging: isDraggingMouseRef.current, sinceManual: (now - lastManualCameraRef.current) / 1000, delta });
      const dampSpeed = Math.min(1.0, 9.0 * delta);
      angles.currentYaw += (angles.targetYaw - angles.currentYaw) * dampSpeed;
      angles.currentPitch += (angles.targetPitch - angles.currentPitch) * dampSpeed;
      angles.currentDistance += (angles.targetDistance - angles.currentDistance) * dampSpeed;

      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;
      const pZ = playerPosRef.current.z;

      const opponent=gameplayRef.current?.combatFocus(playerPosRef.current)||gameplayRef.current?.musicFocus();
      const encounter=!!opponent && !isDraggingMouseRef.current && (now-lastManualCameraRef.current)>1600;
      encounterCameraRef.current += ((encounter?1:0)-encounterCameraRef.current)*Math.min(1,delta*4);
      const combatBlend=encounterCameraRef.current;
      const pitch=angles.currentPitch+(Math.max(.65,angles.currentPitch)-angles.currentPitch)*combatBlend;
      const distance=angles.currentDistance+(Math.min(12,Math.max(8,angles.currentDistance))-angles.currentDistance)*combatBlend;
      const focusX=pX+(opponent?(opponent.x-pX)*.4*combatBlend:0);
      const focusZ=pZ+(opponent?(opponent.z-pZ)*.4*combatBlend:0);
      const focusY=pY+(opponent?(opponent.y-pY)*.4*combatBlend:0);
      const camOffsetY = Math.sin(pitch) * distance + 1.25;
      const camHorizontalDist = Math.cos(pitch) * distance;
      const camOffsetX = Math.sin(angles.currentYaw) * camHorizontalDist;
      const camOffsetZ = Math.cos(angles.currentYaw) * camHorizontalDist;

      let targetCamX = focusX + camOffsetX + Math.cos(angles.currentYaw)*1.5*combatBlend;
      let targetCamY = focusY + camOffsetY;
      let targetCamZ = focusZ + camOffsetZ - Math.sin(angles.currentYaw)*1.5*combatBlend;

      // Prevención de clipping contra el relieve del terreno
      const terrainAtCam = getTerrainHeight(targetCamX, targetCamZ);
      if (targetCamY < terrainAtCam + 1.2) {
        targetCamY = terrainAtCam + 1.2;
      }

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      const lookAhead = PLAZA_COMPOSITION.camera.lookAhead || 0;
      const targetLookAt = new THREE.Vector3(
        focusX - Math.sin(angles.currentYaw) * lookAhead*(1-combatBlend),
        focusY + 1.15,
        focusZ - Math.cos(angles.currentYaw) * lookAhead*(1-combatBlend)
      );

      camera.position.lerp(targetCamPos, Math.min(1.0, 8.5 * delta));
      camera.position.y=terrainSafeCameraHeight(camera.position,{x:pX,y:pY+.25,z:pZ},getTerrainHeight);
      if(opponent)camera.position.y=terrainSafeCameraHeight(camera.position,{x:opponent.x,y:opponent.y+.25,z:opponent.z},getTerrainHeight);
      camera.lookAt(targetLookAt);
      cameraOcclusion?.update(camera.position,opponent?[playerPosRef.current,opponent]:[playerPosRef.current],delta,now/1000);

      chestSignals?.update(now / 1000, playerPosRef.current, adventureStateRef.current);
      firstMinutesWorld?.update(delta,now/1000,adventureStateRef.current);
      if (now-navigationTime>=200) {
        navigationTime=now;
        const target=resolveObjectiveTarget(adventureStateRef.current);
        let projected=null;
        if(target) {
          targetProjection.set(target.position.x,getTerrainHeight(target.position.x,target.position.z)+1,target.position.z).project(camera);
          projected={x:targetProjection.x,y:targetProjection.y,z:targetProjection.z};
        }
        setNavigationPose({position:{...playerPosRef.current},rotation:playerRotYRef.current,cameraYaw:angles.currentYaw,projected,introTarget:gameplayRef.current?.introTarget()?{...gameplayRef.current.introTarget()}:null});
      }

      renderer.render(scene, camera);
      if(import.meta.env.DEV) {
        metricsFrames++;
        if(now-metricsTime>=1000) {
          const metrics={fps:Math.round(metricsFrames*1000/(now-metricsTime)),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,solidColliders:collisionWorld?.colliders.length ?? 0,...gameplayRef.current?.stats,sampledAt:Math.round(now),foreground:document.visibilityState==='visible' && document.hasFocus()};
          renderer.domElement.dataset.renderMetrics=JSON.stringify(metrics);
          renderer.domElement.dataset.characterAction=expressionRef.current?.name || 'Idle';
          renderer.domElement.dataset.worldMusic=JSON.stringify(gameplayRef.current?.musicStats||[]);
          renderer.domElement.dataset.worldRestoration=JSON.stringify(gameplayRef.current?.restorationStats||[]);
          renderer.domElement.dataset.residents=JSON.stringify(gameplayRef.current?.residentStats||{});
          renderer.domElement.dataset.companion=JSON.stringify(gameplayRef.current?.companionStats||null);
          renderer.domElement.dataset.playerPose=JSON.stringify({position:playerPosRef.current,rotation:playerRotYRef.current,cameraYaw:angles.currentYaw});
          if(debugEnabled)setWorldMetrics(previous=>previous?{...previous,...metrics}:previous);
          metricsFrames=0;metricsTime=now;
        }
      }
    };

    animate();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      expressionRef.current?.dispose(); expressionRef.current = null;
      cameraOcclusion?.dispose();
      footsteps.dispose();
      weaponCuts.dispose();if(weaponCutsRef.current===weaponCuts)weaponCutsRef.current=null;
      doorSound.dispose();if(doorSoundRef.current===doorSound)doorSoundRef.current=null;
      impactSounds.dispose();
      noteSound.dispose();worldCueRef.current=null;unsubscribeMic();window.removeEventListener('valley-audio-preferences',syncStepSettings);window.removeEventListener('pointerdown',unlockNotes);window.removeEventListener('keydown',unlockNotes);
      renderer.domElement.removeEventListener('pointerdown',runeDown);renderer.domElement.removeEventListener('pointerup',runeUp);
      window.removeEventListener('valley-music-settings',syncStepSettings);
      window.removeEventListener('storage',syncStepSettings);
      document.removeEventListener('visibilitychange',pauseSteps);
      document.removeEventListener('volumechange',syncWorldVolume,true);
      gameplayRef.current?.dispose();gameplayRef.current=null;loadHeroRef.current=null;window.dispatchEvent(new CustomEvent('valley-musical-focus',{detail:false}));
      sessionToken++; prepareSessionRef.current = null;
      window.removeEventListener('pointerdown', resetTitle); window.removeEventListener('keydown', resetTitle);
      moteGeometry.dispose(); moteMaterial.dispose();
      chestSignals?.dispose();
      firstMinutesWorld?.dispose();
      if(collisionDebug)disposeCollisionDebug(collisionDebug);
      debugGroupRef.current=null;
      collisionWorldRef.current=null;
      adventureModelsRef.current.clear();
      scene.clear();
    };
  }, []);

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden bg-slate-950 select-none ${introPhase?'first-minutes-world':''}`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      {!presentation && adventureState && !loading && !introActive && <WorldNavigation adventure={adventureState} pose={navigationPose} active={active} requestedOpen={mapOpen} onOpenChange={setMapOpen} onPlaytestEvent={onPlaytestEvent} />}
      {active&&!loading&&!mapOpen&&introPhase&&<FirstMinutesHints phase={introPhase} position={navigationPose.position} targetPosition={navigationPose.introTarget} onAction={performWorldAction} onMove={(direction,pressed)=>{keysRef.current[direction]=pressed;}}/>}
      {active && !loading && !introActive && <div className="world-action-controls"><button title="Accion primaria" aria-label="Accion primaria" onClick={()=>performWorldAction('Q')}><Swords/></button><button title="Accion secundaria / interactuar" aria-label="Accion secundaria / interactuar" onClick={()=>performWorldAction('E')}><WandSparkles/></button>{gameplayState?.equippedPetId && <button className="companion-greeting" title="Saludar a tu mascota (F)" aria-label="Saludar a tu mascota" onClick={()=>{if(!mapOpenRef.current)gameplayRef.current?.interactPet();}}><PawPrint/></button>}</div>}
      {active && nearbyGate && <button className="absolute top-28 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100%-2rem)] rounded-lg bg-emerald-950 px-4 py-3 border border-emerald-300" onClick={()=>performWorldAction('E')}>Desafio musical · E - Jugar<br/><span className="text-xs">{getGameplayContent().minigames.find(m=>m.id===nearbyGate.minigameId)?.name}</span></button>}

      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-sky-950/80 backdrop-blur-md">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 border-b-4 border-amber-700 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-bounce mb-3 text-white">
            <Compass size={32} />
          </div>
          <span className="text-sm font-black uppercase text-amber-200 tracking-widest">
            {loadingProgress}
          </span>
        </div>
      )}

      {active && nearbyStation && !nearbyGate && !introActive && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-200 pointer-events-auto w-max max-w-[calc(100%-2rem)]">
          <button
            onClick={() => handleTriggerLesson(nearbyStation)}
            className="bg-slate-900/85 hover:bg-slate-900 active:scale-95 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-xl border border-sky-400/40 backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:border-sky-400"
          >
            <Sparkles size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-slate-200">{nearbyStation.type !== ADVENTURE_OBJECT_TYPES.PRACTICE_STATION
              ? `${adventureState?.entries[nearbyStation.id]?.state === ADVENTURE_STATES.COMPLETED ? nearbyStation.type === ADVENTURE_OBJECT_TYPES.SECRET_REWARD ? 'Descubierto · E - Ver' : 'Completado · E - Practicar' : adventureState?.entries[nearbyStation.id]?.state === ADVENTURE_STATES.LOCKED ? 'E - Examinar · Completa la lección anterior' : 'E - Abrir'}: ${nearbyStation.label}`
              : <>{completedStationIds.includes(nearbyStation.id) ? 'Completada · ' : ''}<span className="text-sky-300 font-black">E</span> - Practicar: <strong className="text-white">{nearbyStation.song?.title || nearbyStation.label}</strong></>}</span>
            <Play size={13} fill="white" className="text-white" />
          </button>
        </div>
      )}

      {debugEnabled && active && debugMode && <div className="absolute bottom-16 left-4 z-40 max-h-[40vh] w-[min(440px,calc(100%-2rem))] overflow-auto rounded-lg border border-white/20 bg-zinc-950/90 p-3 text-[11px]">
        {import.meta.env.DEV && onAdventureDebug && <div className="flex gap-3 pb-3">
          <button onClick={onAdventureDebug}>Nueva Aventura / Personaje / Reinicio</button>
          <button onClick={() => {
            Object.assign(playerPosRef.current, { x: PLAZA_COMPOSITION.spawn.position[0], y: PLAZA_COMPOSITION.spawn.position[1], z: PLAZA_COMPOSITION.spawn.position[2] });
            playerRotYRef.current = PLAZA_COMPOSITION.spawn.rotation[1];
            Object.assign(cameraAngleRef.current, { targetYaw: PLAZA_COMPOSITION.camera.yaw, currentYaw: PLAZA_COMPOSITION.camera.yaw, targetPitch: PLAZA_COMPOSITION.camera.pitch, currentPitch: PLAZA_COMPOSITION.camera.pitch });
            playerVelYRef.current = 0; isGroundedRef.current = true;
            for (const key of Object.keys(keysRef.current)) keysRef.current[key] = false;
          }}>Spawn Plaza</button>
        </div>}
        {interactionObjects.map(object => <div key={object.id} className="border-b border-white/15 py-2">
          <div>{object.id} · {object.type}</div>
          <div>STATE: {adventureState?.entries[object.id]?.state || (completedStationIds.includes(object.id) ? 'COMPLETED' : 'AVAILABLE')} · ACTIVITY: {object.song?.id ?? object.activityId ?? 'unavailable'}</div>
          <div>REQUIREMENTS: {object.requirements?.completedObjects.join(', ') || 'none'}</div>
          <div>REWARD: {object.reward ? `${object.reward.type} / ${object.reward.id}` : 'educational engine'}</div>
        </div>)}
      </div>}

      {/* Controles de Diagnóstico y Modo Debug */}
      {debugEnabled && <div className="absolute top-20 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95 border ${
            debugMode
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-500/30 backdrop-blur-md'
          }`}
          title="Alternar visualización de zonas de Negative Space, caminos y radios de seguridad"
        >
          <Eye size={13} />
          <span>{debugMode ? 'Debug ON' : 'Debug World'}</span>
        </button>

        <button
          onClick={() => setShowAssetModal(true)}
          className="bg-slate-900/80 hover:bg-slate-800 text-sky-300 border border-sky-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
          title="Ver inventario y diagnóstico de modelos 3D KayKit"
        >
          <Database size={13} />
          <span>Assets KayKit</span>
        </button>
      </div>}

      {/* Métricas Rápidas en modo Debug */}
      {debugEnabled && debugMode && worldMetrics && (
        <div className="absolute top-32 right-4 z-40 bg-slate-900/90 border border-amber-400/30 backdrop-blur-md px-3 py-2 rounded-xl text-[11px] text-slate-200 font-mono flex flex-col gap-1 shadow-2xl">
          <div className="text-amber-300 font-bold border-b border-white/10 pb-1">Plaza / {PLAZA_COMPOSITION.constructionPhase || 'Legacy'}</div>
          <div>Objetos instanciados: <span className="text-emerald-400 font-bold">{worldMetrics.objectsPlaced}</span></div>
          <div>Árboles colocados: <span className="text-emerald-400">{worldMetrics.treesCount}</span></div>
          <div>Rocas colocadas: <span className="text-emerald-400">{worldMetrics.rocksCount}</span></div>
          <div>Arbustos colocados: <span className="text-emerald-400">{worldMetrics.bushesCount}</span></div>
          <div>Props arquitectónicos: <span className="text-emerald-400">{worldMetrics.propsCount}</span></div>
          <div>Colliders sólidos: <span className="text-sky-300">{worldMetrics.solidColliders}</span></div>
          <div>FPS: {worldMetrics.fps} · Draw calls: {worldMetrics.drawCalls} · Triangles: {worldMetrics.triangles}</div>
          <div className="flex gap-2 text-[10px]"><span className="text-rose-400">Jugador</span><span className="text-emerald-400">Tronco</span><span className="text-sky-300">Caja</span><span className="text-amber-300">Interacción</span></div>
          <div className="text-[10px] text-amber-200/80 mt-1">Centro: {PLAZA_COMPOSITION.openZones[0].radius} m</div>
        </div>
      )}

      {/* Modal de Diagnóstico de Assets */}
      <AssetDiagnosticModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
      />
    </div>
  );
}
