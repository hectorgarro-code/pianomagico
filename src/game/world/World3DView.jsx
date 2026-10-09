import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Play, Sparkles, Compass, Database, Eye } from 'lucide-react';
import { getCharacterModel } from '../../modules/core/utils/characterModels';
import { ASSET_MANIFEST, loadCachedModel } from '../assets/assetManifest';
import { WorldGenerator } from './WorldGenerator';
import AssetDiagnosticModal from '../assets/AssetDiagnosticModal';
import { PLAZA_COMPOSITION } from './composition/plazaComposition.js';
import { CollisionWorld, PLAYER_COLLIDER } from './collision/CollisionWorld.js';
import { createCollisionOutline, disposeCollisionDebug } from './collision/collisionDebug.js';
import { restoreWorldContext } from '../state/worldActivityFlow.js';
import { ADVENTURE_STATES } from '../adventure/adventureState.js';
import { getPlayableRegionAt } from '../adventure/valleyProgression.js';
import { ADVENTURE_OBJECT_TYPES } from './composition/forestAdventureComposition.js';

function updateChestLids(models, state) {
  for (const [id, lid] of models) lid.node.rotation.x = lid.closedRotation + (state?.entries[id]?.state === ADVENTURE_STATES.COMPLETED ? -1.15 : 0);
}

export default function World3DView({
  debugEnabled = false,
  active = true,
  returnContext = null,
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
  onPlayerTransformChange
}) {
  const containerRef = useRef(null);
  const [nearbyStation, setNearbyStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Iniciando...');
  const [showTutorial, setShowTutorial] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [worldMetrics, setWorldMetrics] = useState(null);

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

  const tutorialVisibleRef = useRef(true);
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
  const activeActionNameRef = useRef('Idle');
  const debugGroupRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const interactionLockedRef = useRef(false);
  const collisionWorldRef = useRef(null);
  const terrainHeightRef = useRef(() => 0);
  const adventureModelsRef = useRef(new Map());
  const adventureStateRef = useRef(adventureState);
  adventureStateRef.current = adventureState;
  const [interactionObjects, setInteractionObjects] = useState([]);
  useEffect(() => { updateChestLids(adventureModelsRef.current, adventureState); }, [adventureState]);

  useEffect(() => {
    for (const key of Object.keys(keysRef.current)) keysRef.current[key] = false;
    isDraggingMouseRef.current = false;
    if (!active) return;
    interactionLockedRef.current = false;
    if (returnContext && collisionWorldRef.current) {
      const safe = restoreWorldContext(returnContext, collisionWorldRef.current, terrainHeightRef.current);
      Object.assign(playerPosRef.current, safe.position);
      playerRotYRef.current = safe.rotation;
      playerVelYRef.current = 0;
      isGroundedRef.current = true;
      if (safe.camera) Object.assign(cameraAngleRef.current, safe.camera);
    }
  }, [active, returnContext]);

  // Sincronizar visibilidad del overlay de depuración
  useEffect(() => {
    if (debugGroupRef.current) {
      debugGroupRef.current.visible = debugMode;
    }
  }, [debugMode]);

  // Notificar al estado del juego al interactuar
  const handleTriggerLesson = (station) => {
    if (!station || !activeRef.current || interactionLockedRef.current || loading) return;
    if (station.type === ADVENTURE_OBJECT_TYPES.LESSON_CHEST && !onDiscoverAdventure) return;
    interactionLockedRef.current = true;
    const context = {
      position: { ...playerPosRef.current }, rotation: playerRotYRef.current,
      stationId: station.id, regionId: station.regionId,
      worldId: 'valle_notas', camera: { ...cameraAngleRef.current }
    };
    if (onPlayerTransformChange) {
      onPlayerTransformChange(context);
    }
    if (station.type === ADVENTURE_OBJECT_TYPES.LESSON_CHEST) {
      onDiscoverAdventure(station.id, context);
    } else if (onEnterLesson && station.song) {
      onEnterLesson(station.song, 'solo', context);
    }
  };

  // Keyboard Event Listeners (WASD + Shift + Space + E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeRef.current || e.repeat || e.target.isContentEditable || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keysRef.current.shift = true;

      // Salto / Interactuar
      if (e.code === 'Space') {
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
      if (e.code === 'KeyE' && nearbyStation) {
        e.preventDefault();
        handleTriggerLesson(nearbyStation);
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
  }, [nearbyStation, active, loading]);

  // Arrastre con ratón para rotación orbital con amortiguación (Damping)
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!activeRef.current) return;
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      isDraggingMouseRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!activeRef.current) return;
      if (!isDraggingMouseRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.targetYaw -= dx * 0.0048;
      cameraAngleRef.current.targetPitch = Math.max(0.08, Math.min(0.85, cameraAngleRef.current.targetPitch + dy * 0.0035));
    };

    const handleMouseUp = () => {
      isDraggingMouseRef.current = false;
    };

    const handleWheel = (e) => {
      if (!activeRef.current) return;
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
      camera.fov = camera.aspect < 1
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

    generator.buildSection1().then(async ({ sceneGroup, debugGroup, heightAt, stats, colliders, interactionObjects: generatedObjects }) => {
      if (!isMounted) {
        disposeCollisionDebug(debugGroup.getObjectByName('Collision_Debug'));
        return;
      }
      getTerrainHeight = heightAt;
      terrainHeightRef.current = heightAt;
      collisionWorld = new CollisionWorld(colliders);
      collisionWorldRef.current = collisionWorld;
      const safeSpawn=collisionWorld.move(playerPosRef.current,{x:0,z:0});
      Object.assign(playerPosRef.current,safeSpawn);
      scene.add(sceneGroup);

      // Debug overlay
      debugGroup.visible = debugMode;
      scene.add(debugGroup);
      debugGroupRef.current = debugGroup;
      collisionDebug=debugGroup.getObjectByName('Collision_Debug');
      playerColliderDebug=createCollisionOutline({shape:'circle',x:0,z:0,radius:PLAYER_COLLIDER.radius,y:.1},0xff6580);
      collisionDebug.add(playerColliderDebug);

      setWorldMetrics(stats);

      for (const object of generatedObjects) {
        const song = object.lessonRef === 'first-song'
          ? songs[0]
          : songs.find(item => String(item.id) === String(object.activityId ?? object.lessonRef));
        let instance = null;
        sceneGroup.traverse(obj => { if (obj.userData.compositionId === object.instanceId) instance = obj; });
        if (object.type === ADVENTURE_OBJECT_TYPES.LESSON_CHEST && instance) {
          const lid = instance.getObjectByName('chest_lid');
          if (lid) adventureModelsRef.current.set(object.id, { node: lid, closedRotation: lid.rotation.x });
        }
        if (!song && object.type === ADVENTURE_OBJECT_TYPES.PRACTICE_STATION) continue;
        levelPositions.push({ ...object, ...object.position, song, interactionRadius: object.interaction.radius });
      }
      setInteractionObjects(levelPositions);
      updateChestLids(adventureModelsRef.current, adventureStateRef.current);

      // 6. Spawn del Héroe
      const charInfo = getCharacterModel(profile.avatarId);
      const heroModelUrl = charInfo.file || ASSET_MANIFEST.characters.knight;

      try {
        const heroGltf = await loadCachedModel(heroModelUrl);
        if (heroGltf && heroGltf.scene && isMounted) {
          const charMesh = SkeletonUtils.clone(heroGltf.scene);
          charMesh.scale.set(1.15, 1.15, 1.15);
          charMesh.position.set(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);
          charMesh.rotation.y = playerRotYRef.current;
          charMesh.traverse(c => { if (c.isMesh) c.castShadow = true; });
          scene.add(charMesh);
          characterMeshRef.current = charMesh;

          if (heroGltf.animations && heroGltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(charMesh);
            characterMixerRef.current = mixer;
            heroGltf.animations.forEach((clip) => {
              characterActionsRef.current[clip.name] = mixer.clipAction(clip);
            });
            const initialClip = characterActionsRef.current['Idle'] || characterActionsRef.current[heroGltf.animations[0].name];
            if (initialClip) initialClip.play();
          }
        }
      } catch (e) {
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
    };
    window.addEventListener('resize', handleResize);

    // 8. Bucle de Render y Movimiento de Aventura con Damping de Cámara y Prevención de Clipping
    let lastTime = performance.now();
    let metricsTime=lastTime, metricsFrames=0;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!activeRef.current) return;

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

      const isInputActive = inputX !== 0 || inputZ !== 0;

      // Calcular dirección de movimiento orientada según el azimut de la cámara
      let moveDir = new THREE.Vector3(0, 0, 0);
      if (isInputActive) {
        const normInput = new THREE.Vector2(inputX, inputZ).normalize();
        const camYaw = cameraAngleRef.current.currentYaw;
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
      }

      let isMoving=false;
      if (isInputActive && collisionWorld) {
        const beforeX=playerPosRef.current.x,beforeZ=playerPosRef.current.z;
        const next=collisionWorld.move(playerPosRef.current,{x:moveDir.x*baseSpeed*delta,z:moveDir.z*baseSpeed*delta});
        Object.assign(playerPosRef.current,next);
        isMoving=Math.hypot(next.x-beforeX,next.z-beforeZ)>1e-5;
        if (isMoving) {
          walkedDistanceRef.current += Math.hypot(next.x-beforeX,next.z-beforeZ);
          if (tutorialVisibleRef.current) { tutorialVisibleRef.current = false; setShowTutorial(false); }
          const journey = adventureStateRef.current?.journey;
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

      // Animaciones de Personaje
      let desiredAnim = 'Idle';
      if (isMoving) {
        desiredAnim = isShift ? 'Running_A' : 'Walking_A';
      }

      if (desiredAnim !== activeActionNameRef.current) {
        const currentAction = characterActionsRef.current[activeActionNameRef.current];
        const nextAction = characterActionsRef.current[desiredAnim] ||
          characterActionsRef.current['Walking_A'] ||
          characterActionsRef.current['Idle'];

        if (nextAction && currentAction && nextAction !== currentAction) {
          currentAction.fadeOut(0.2);
          nextAction.reset().fadeIn(0.2).play();
          activeActionNameRef.current = desiredAnim;
        }
      }

      if (characterMeshRef.current) {
        characterMeshRef.current.position.set(
          playerPosRef.current.x,
          playerPosRef.current.y,
          playerPosRef.current.z
        );
        characterMeshRef.current.rotation.y = playerRotYRef.current;
        sunLight.target = characterMeshRef.current;
      }
      if(playerColliderDebug)playerColliderDebug.position.set(playerPosRef.current.x,playerPosRef.current.y,playerPosRef.current.z);

      // Detección de proximidad a estaciones
      let detected = null;
      for (let pos of levelPositions) {
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
      const dampSpeed = Math.min(1.0, 9.0 * delta);
      angles.currentYaw += (angles.targetYaw - angles.currentYaw) * dampSpeed;
      angles.currentPitch += (angles.targetPitch - angles.currentPitch) * dampSpeed;
      angles.currentDistance += (angles.targetDistance - angles.currentDistance) * dampSpeed;

      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;
      const pZ = playerPosRef.current.z;

      const camOffsetY = Math.sin(angles.currentPitch) * angles.currentDistance + 1.25;
      const camHorizontalDist = Math.cos(angles.currentPitch) * angles.currentDistance;
      const camOffsetX = Math.sin(angles.currentYaw) * camHorizontalDist;
      const camOffsetZ = Math.cos(angles.currentYaw) * camHorizontalDist;

      let targetCamX = pX + camOffsetX;
      let targetCamY = pY + camOffsetY;
      let targetCamZ = pZ + camOffsetZ;

      // Prevención de clipping contra el relieve del terreno
      const terrainAtCam = getTerrainHeight(targetCamX, targetCamZ);
      if (targetCamY < terrainAtCam + 1.2) {
        targetCamY = terrainAtCam + 1.2;
      }

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      const lookAhead = PLAZA_COMPOSITION.camera.lookAhead || 0;
      const targetLookAt = new THREE.Vector3(
        pX - Math.sin(angles.currentYaw) * lookAhead,
        pY + 1.15,
        pZ - Math.cos(angles.currentYaw) * lookAhead
      );

      camera.position.lerp(targetCamPos, Math.min(1.0, 8.5 * delta));
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
      if(debugEnabled) {
        metricsFrames++;
        if(now-metricsTime>=1000) {
          const metrics={fps:Math.round(metricsFrames*1000/(now-metricsTime)),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
          renderer.domElement.dataset.renderMetrics=JSON.stringify(metrics);
          setWorldMetrics(previous=>previous?{...previous,...metrics}:previous);
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
      if(collisionDebug)disposeCollisionDebug(collisionDebug);
      debugGroupRef.current=null;
      collisionWorldRef.current=null;
      adventureModelsRef.current.clear();
      scene.clear();
    };
  }, [profile.avatarId]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950 select-none">
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

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

      {showTutorial && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 w-max max-w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-xs font-bold shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>WASD / flechas: mover · Shift: correr · E: interactuar</span>
          </div>
        </div>
      )}

      {active && nearbyStation && !showTutorial && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-200 pointer-events-auto w-max max-w-[calc(100%-2rem)]">
          <button
            onClick={() => handleTriggerLesson(nearbyStation)}
            className="bg-slate-900/85 hover:bg-slate-900 active:scale-95 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase shadow-xl border border-sky-400/40 backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:border-sky-400"
          >
            <Sparkles size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-slate-200">{nearbyStation.type === ADVENTURE_OBJECT_TYPES.LESSON_CHEST
              ? `${adventureState?.entries[nearbyStation.id]?.state === ADVENTURE_STATES.COMPLETED ? 'Completado · E - Practicar' : adventureState?.entries[nearbyStation.id]?.state === ADVENTURE_STATES.LOCKED ? 'E - Examinar · Completa la lección anterior' : 'E - Abrir'}: ${nearbyStation.label}`
              : <>{completedStationIds.includes(nearbyStation.id) ? 'Completada · ' : ''}<span className="text-sky-300 font-black">E</span> - Practicar: <strong className="text-white">{nearbyStation.song.title}</strong></>}</span>
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

      {!onObjectiveProgress && <div className="absolute bottom-4 left-5 z-20 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-950/45 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 shadow-lg">
        <span className="text-[10px] font-medium text-slate-300">
          <span className="text-amber-300 font-bold">WASD</span> Mover • <span className="text-amber-300 font-bold">Shift</span> Correr • <span className="text-amber-300 font-bold">Espacio</span> Saltar • <span className="text-amber-300 font-bold">Arrastrar</span> Mirar
        </span>
      </div>}

      {/* Modal de Diagnóstico de Assets */}
      <AssetDiagnosticModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
      />
    </div>
  );
}
