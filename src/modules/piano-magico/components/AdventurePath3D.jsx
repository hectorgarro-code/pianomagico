import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Play, Music2, Star, Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Sparkles, Compass } from 'lucide-react';
import { getCharacterModel } from '../../core/utils/characterModels';

// Singleton loader & cache
const loader = new GLTFLoader();
const modelCache = new Map();

const loadCachedModel = (url) => {
  if (modelCache.has(url)) return Promise.resolve(modelCache.get(url));
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      modelCache.set(url, gltf);
      resolve(gltf);
    }, undefined, reject);
  });
};

export default function AdventurePath3D({
  songs = [],
  profile = {},
  userPerformances = [],
  memoryMedals = [],
  onStartLevel,
  onOpenComposer
}) {
  const containerRef = useRef(null);
  const [activeModalSong, setActiveModalSong] = useState(null);
  const [nearbySong, setNearbySong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(true);

  // Compute unlock progress
  const completedSongIds = new Set(userPerformances.map(p => p.song_id));
  let highestUnlockedIndex = 0;
  for (let i = 0; i < songs.length; i++) {
    const prevId = songs[i - 1]?.id || -1;
    const isUnlocked = i === 0 || completedSongIds.has(prevId) || memoryMedals.includes(prevId);
    if (isUnlocked) highestUnlockedIndex = i;
    else break;
  }

  // Ocultar tutorial inicial tras 5 segundos
  useEffect(() => {
    const t = setTimeout(() => setShowTutorial(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Player state refs
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, shift: false, space: false });
  const playerPosRef = useRef({ x: 0, y: 0.1, z: 2 });
  const playerVelYRef = useRef(0);
  const isGroundedRef = useRef(true);
  const playerRotYRef = useRef(Math.PI);

  // Camera Orbit / Rotation Controls state (Tercera persona de aventura: 10-18% personaje en pantalla)
  const cameraAngleRef = useRef({
    yaw: 0,
    pitch: 0.24, // Ángulo moderado para apreciar horizonte y entorno
    distance: 13.5 // Distancia ideal para encuadre estilizado
  });
  const isDraggingMouseRef = useRef(false);
  const mousePosRef = useRef({ x: 0, y: 0 });

  // Character & scene refs
  const cameraRef = useRef(null);
  const characterMeshRef = useRef(null);
  const characterMixerRef = useRef(null);
  const characterActionsRef = useRef({});
  const activeActionNameRef = useRef('Idle');

  // Keyboard Event Listeners (WASD + Shift + Space + E)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeModalSong) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') keysRef.current.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') keysRef.current.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') keysRef.current.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') keysRef.current.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keysRef.current.shift = true;

      // Salto (Spacebar)
      if (e.code === 'Space') {
        e.preventDefault();
        if (nearbySong && !keysRef.current.space) {
          setActiveModalSong(nearbySong);
        } else if (isGroundedRef.current) {
          playerVelYRef.current = 8.5;
          isGroundedRef.current = false;
          keysRef.current.space = true;
          const jumpAction = characterActionsRef.current['Jump_Full_Short'];
          if (jumpAction) jumpAction.reset().setLoop(THREE.LoopOnce, 1).play();
        }
      }

      // Interactuar (tecla E)
      if (e.code === 'KeyE' && nearbySong) {
        e.preventDefault();
        setActiveModalSong(nearbySong);
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeModalSong, nearbySong]);

  // Arrastre con ratón para rotación orbital suave de cámara
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      isDraggingMouseRef.current = true;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDraggingMouseRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.yaw -= dx * 0.0055;
      cameraAngleRef.current.pitch = Math.max(0.10, Math.min(0.95, cameraAngleRef.current.pitch + dy * 0.004));
    };

    const handleMouseUp = () => {
      isDraggingMouseRef.current = false;
    };

    const handleWheel = (e) => {
      cameraAngleRef.current.distance = Math.max(8.0, Math.min(20.0, cameraAngleRef.current.distance + e.deltaY * 0.01));
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

  // Main Three.js Scene Setup (Polish Visual: Valle de las Notas)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    let animFrameId = null;

    // 1. Atmósfera y Cielo Estilizado Infantil Cálido
    const scene = new THREE.Scene();
    // Cielo celeste suave con degradado de niebla
    scene.background = new THREE.Color(0xa7d8ff); 
    scene.fog = new THREE.FogExp2(0xa7d8ff, 0.0065); // Niebla atmosférica suave y mágica

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.3, 550);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // 2. Iluminación Estilizada Premium (Luz de sol dorada y ambiental rica)
    const hemiLight = new THREE.HemisphereLight(0xfff8db, 0x4f772d, 1.4);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae0, 2.6);
    sunLight.position.set(45, 65, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    scene.add(sunLight);

    // Luz de relleno cálida para evitar sombras negras duras
    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
    fillLight.position.set(-35, 25, -40);
    scene.add(fillLight);

    // 3. Fórmula del Terreno Suave (Colinas, Depresión de Río y Mirador)
    const getTerrainHeight = (x, z) => {
      const distCenter = Math.sqrt(x * x + z * z);
      // Zona central abierta (plaza) plana y accesible
      if (distCenter < 12) return 0;

      // Depresión del cauce del río al Oeste
      const riverCenterX = Math.sin(z * 0.08) * 6 - 22;
      const riverDist = Math.abs(x - riverCenterX);
      if (riverDist < 6 && z < 15 && z > -75) {
        return -1.35 + Math.min(1.35, (riverDist / 6) * 1.35);
      }

      // Colina Mirador al Este (+X, -Z)
      const dxLookout = x - 28;
      const dzLookout = z - (-28);
      const distLookout = Math.sqrt(dxLookout * dxLookout + dzLookout * dzLookout);
      let lookoutHeight = 0;
      if (distLookout < 18) {
        lookoutHeight = (1 - distLookout / 18) * 4.8;
      }

      // Ondulación natural del terreno (suave para niños, sin picos raros)
      const generalHills = Math.sin(x * 0.04) * Math.cos(z * 0.035) * 1.8 +
        Math.sin(x * 0.08 + z * 0.06) * 0.6;

      const flattenCenter = Math.min(1.0, Math.max(0, (distCenter - 12) / 14));
      return (generalHills * flattenCenter) + lookoutHeight;
    };

    // 4. Malla de Terreno con Material Verde Pasto Amigable
    const terrainSize = 380;
    const terrainSegs = 85;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegs, terrainSegs);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, getTerrainHeight(vx, vz));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x58b05c, // Verde pasto amigable y luminoso
      roughness: 0.8,
      metalness: 0.04,
      flatShading: true
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 5. Montañas Lejanas en el Horizonte (En capas suaves, evitando paredes oscuras)
    const mountainMat1 = new THREE.MeshStandardMaterial({ color: 0x6ba8a9, flatShading: true, roughness: 0.9 });
    const mountainMat2 = new THREE.MeshStandardMaterial({ color: 0x8cbdbb, flatShading: true, roughness: 0.95 });

    // Anillo exterior de montañas lejanas
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
      const radius = 160 + Math.sin(angle * 4) * 20;
      const mx = Math.cos(angle) * radius;
      const mz = Math.sin(angle) * radius;
      const mHeight = 24 + Math.random() * 18;
      const mGeo = new THREE.ConeGeometry(32 + Math.random() * 10, mHeight, 6);
      const mMesh = new THREE.Mesh(mGeo, angle % (Math.PI / 5) === 0 ? mountainMat1 : mountainMat2);
      mMesh.position.set(mx, mHeight * 0.45, mz);
      mMesh.rotation.y = Math.random() * Math.PI;
      scene.add(mMesh);
    }

    // 6. Río Curvado con Agua Translúcida y Reflejo
    const riverGeo = new THREE.PlaneGeometry(10, 95, 26, 26);
    riverGeo.rotateX(-Math.PI / 2);
    const riverPos = riverGeo.attributes.position;
    for (let i = 0; i < riverPos.count; i++) {
      const rz = riverPos.getZ(i);
      const rx = riverPos.getX(i);
      const curveX = Math.sin(rz * 0.08) * 6 - 22;
      riverPos.setX(i, rx + curveX);
      riverPos.setY(i, -0.68 + Math.sin(rz * 0.25) * 0.04);
    }
    riverGeo.computeVertexNormals();

    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Azul agua brillante y fresco
      roughness: 0.15,
      metalness: 0.45,
      transparent: true,
      opacity: 0.85
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(0, 0, -30);
    scene.add(riverMesh);

    // Piedras redondeadas decorativas en la orilla del río
    const pebbleGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, flatShading: true });
    for (let z = 10; z > -70; z -= 3.5) {
      const cx = Math.sin(z * 0.08) * 6 - 22;
      for (let side of [-4.5, 4.5]) {
        const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
        const px = cx + side + (Math.random() - 0.5) * 0.8;
        pebble.position.set(px, getTerrainHeight(px, z) + 0.15, z);
        pebble.scale.set(1 + Math.random() * 0.4, 0.6, 1 + Math.random() * 0.4);
        pebble.castShadow = true;
        scene.add(pebble);
      }
    }

    // 7. Plaza Central con Losas de Piedra Claras
    const plazaGroup = new THREE.Group();
    plazaGroup.position.set(0, 0.05, 0);

    const plazaTileGeo = new THREE.CylinderGeometry(9.5, 10.0, 0.12, 28);
    const plazaTileMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.65 });
    const plazaMesh = new THREE.Mesh(plazaTileGeo, plazaTileMat);
    plazaMesh.receiveShadow = true;
    plazaGroup.add(plazaMesh);

    // Borde de adoquines cálido en la plaza
    const plazaRimGeo = new THREE.RingGeometry(9.8, 10.5, 28);
    const plazaRimMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
    const plazaRim = new THREE.Mesh(plazaRimGeo, plazaRimMat);
    plazaRim.rotation.x = -Math.PI / 2;
    plazaRim.position.y = 0.07;
    plazaGroup.add(plazaRim);

    // Fuente Musical Decorativa Central (NO monolito negro)
    const fountainBaseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.7, 16);
    const fountainBaseMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const fountainBase = new THREE.Mesh(fountainBaseGeo, fountainBaseMat);
    fountainBase.position.y = 0.35;
    fountainBase.castShadow = true;
    fountainBase.receiveShadow = true;
    plazaGroup.add(fountainBase);

    // Agua en la fuente
    const fountainWaterGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.1, 16);
    const fountainWater = new THREE.Mesh(fountainWaterGeo, riverMat);
    fountainWater.position.y = 0.68;
    plazaGroup.add(fountainWater);

    // Escultura de Clave de Sol / Nota Dorada flotando sobre la fuente
    const noteGroup = new THREE.Group();
    noteGroup.position.y = 2.4;
    const noteSphereGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const noteStemGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12);
    const noteMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });

    const note1 = new THREE.Mesh(noteSphereGeo, noteMat);
    note1.position.set(-0.4, -0.4, 0);
    const note2 = new THREE.Mesh(noteSphereGeo, noteMat);
    note2.position.set(0.4, -0.2, 0);
    const stem1 = new THREE.Mesh(noteStemGeo, noteMat);
    stem1.position.set(-0.1, 0.2, 0);
    const stem2 = new THREE.Mesh(noteStemGeo, noteMat);
    stem2.position.set(0.7, 0.4, 0);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.18), noteMat);
    bar.position.set(0.3, 0.9, 0);

    noteGroup.add(note1, note2, stem1, stem2, bar);
    plazaGroup.add(noteGroup);

    scene.add(plazaGroup);

    // 8. Caminos Naturales Integrados al Terreno
    const createNaturalPath = (points, width, color = 0xd7ccc8) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const segs = 32;
      const geo = new THREE.BufferGeometry();
      const pos = [];
      const indices = [];

      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const pt = curve.getPoint(t);
        const tangent = curve.getTangent(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const l = pt.clone().add(normal.clone().multiplyScalar(-width * 0.5));
        const r = pt.clone().add(normal.clone().multiplyScalar(width * 0.5));

        const yL = getTerrainHeight(l.x, l.z) + 0.04;
        const yR = getTerrainHeight(r.x, r.z) + 0.04;

        pos.push(l.x, yL, l.z);
        pos.push(r.x, yR, r.z);

        if (i < segs) {
          const b = i * 2;
          indices.push(b, b + 1, b + 2);
          indices.push(b + 1, b + 3, b + 2);
        }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      return mesh;
    };

    // Camino 1: Hacia el Puente y Río (Oeste)
    scene.add(createNaturalPath([
      new THREE.Vector3(-8, 0, -2),
      new THREE.Vector3(-14, 0, -8),
      new THREE.Vector3(-19, 0, -16),
      new THREE.Vector3(-22, 0, -20)
    ], 2.8, 0xdcd5cc));

    // Camino 2: Camino Principal hacia el Norte
    scene.add(createNaturalPath([
      new THREE.Vector3(0, 0, -9),
      new THREE.Vector3(3, 0, -24),
      new THREE.Vector3(-2, 0, -42),
      new THREE.Vector3(2, 0, -65)
    ], 3.2, 0xe2ded9));

    // Camino 3: Sendero hacia la Colina Mirador (Este)
    scene.add(createNaturalPath([
      new THREE.Vector3(8, 0, -4),
      new THREE.Vector3(16, 0, -12),
      new THREE.Vector3(24, 0, -22),
      new THREE.Vector3(28, 0, -28)
    ], 2.4, 0xd4ceca));

    // 9. Puente de Madera sobre el Río
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(-22, -0.05, -20);
    bridgeGroup.rotation.y = 0.45;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75 });
    for (let p = -4.5; p <= 4.5; p += 0.8) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.65), woodMat);
      plank.position.set(0, 0.35 + (1 - Math.abs(p / 4.5)) * 0.3, p);
      plank.castShadow = true;
      plank.receiveShadow = true;
      bridgeGroup.add(plank);
    }
    // Barandillas del puente
    for (let side of [-1.3, 1.3]) {
      const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8), woodMat);
      post1.position.set(side, 0.8, -4.0);
      const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8), woodMat);
      post2.position.set(side, 0.8, 4.0);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 8.8), woodMat);
      rail.position.set(side, 1.0, 0);
      rail.castShadow = true;
      bridgeGroup.add(post1, post2, rail);
    }
    scene.add(bridgeGroup);

    // 10. Cabaña Acogedora de Cuento (Al otro lado del puente)
    const houseGroup = new THREE.Group();
    const houseX = -32;
    const houseZ = -28;
    const houseY = getTerrainHeight(houseX, houseZ);
    houseGroup.position.set(houseX, houseY, houseZ);
    houseGroup.rotation.y = -0.55;

    // Paredes de piedra blanca/beige
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 3.2, 4.2),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.9 })
    );
    walls.position.y = 1.6;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Tejado a dos aguas de madera cálida
    const roofGeo = new THREE.ConeGeometry(4.2, 2.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 }));
    roof.position.y = 4.1;
    roof.castShadow = true;
    houseGroup.add(roof);

    // Puerta de madera con arco
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.9, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    door.position.set(0, 0.95, 2.12);
    houseGroup.add(door);

    // Ventana cálida con luz interior
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.15),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    windowMesh.position.set(1.4, 1.8, 2.12);
    houseGroup.add(windowMesh);

    // Farol cálido exterior
    const lantern = new THREE.Mesh(new THREE.DodecahedronGeometry(0.25, 0), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    lantern.position.set(-0.9, 1.9, 2.3);
    houseGroup.add(lantern);

    scene.add(houseGroup);

    // 11. Árboles y Vegetación Estilizada (Composición equilibrada con aire visual)
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 2.2, 6);
    const folGeo = new THREE.ConeGeometry(1.6, 3.2, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, flatShading: true });
    const folMatLight = new THREE.MeshStandardMaterial({ color: 0x4ade80, flatShading: true });
    const folMatDark = new THREE.MeshStandardMaterial({ color: 0x22c55e, flatShading: true });
    const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, flatShading: true, roughness: 0.85 });

    // Instanciar algunos árboles cuidados alrededor sin saturar
    const treePositions = [
      { x: -12, z: 8 }, { x: 14, z: 6 }, { x: 18, z: -6 }, { x: -8, z: -18 },
      { x: 10, z: -22 }, { x: -16, z: -28 }, { x: -28, z: -15 }, { x: -38, z: -20 },
      { x: 26, z: -18 }, { x: 34, z: -24 }, { x: 20, z: -38 }, { x: -10, z: -48 },
      { x: 12, z: -52 }, { x: -24, z: 18 }, { x: 8, z: 20 }, { x: -4, z: 28 }
    ];

    treePositions.forEach((pos, idx) => {
      const ty = getTerrainHeight(pos.x, pos.z);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.1;
      trunk.castShadow = true;
      tree.add(trunk);

      const fMat = idx % 2 === 0 ? folMatLight : folMatDark;
      const fol1 = new THREE.Mesh(folGeo, fMat);
      fol1.position.y = 2.8;
      fol1.castShadow = true;
      tree.add(fol1);

      const fol2 = new THREE.Mesh(folGeo, fMat);
      fol2.position.y = 4.0;
      fol2.scale.set(0.72, 0.72, 0.72);
      fol2.castShadow = true;
      tree.add(fol2);

      tree.position.set(pos.x, ty, pos.z);
      const s = 0.85 + (idx % 3) * 0.15;
      tree.scale.set(s, s, s);
      scene.add(tree);
    });

    // Rocas redondeadas estilizadas en puntos de interés
    const rockPositions = [
      { x: 8, z: 2 }, { x: -6, z: 12 }, { x: 12, z: -16 },
      { x: -18, z: -12 }, { x: 26, z: -12 }, { x: -28, z: -35 }
    ];
    rockPositions.forEach(pos => {
      const rock = new THREE.Mesh(rockGeo, rockMat);
      const ry = getTerrainHeight(pos.x, pos.z);
      rock.position.set(pos.x, ry + 0.5, pos.z);
      rock.scale.set(0.9, 0.7, 0.9);
      rock.castShadow = true;
      scene.add(rock);
    });

    // 12. Partículas Mágicas Ambientales Sutiles (Luciérnagas doradas)
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 60;
      particlePositions[i * 3 + 1] = 0.8 + Math.random() * 4.5;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.35,
      transparent: true,
      opacity: 0.75
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 13. Carga de Modelos y Solo 2 a 3 Cofres Iniciales Visibles (Objetos de Mundo, NO Checkpoints)
    const levelPositions = [];
    const charInfo = getCharacterModel(profile.avatarId);

    // Ubicaciones de los cofres como descubrimientos orgánicos
    const organicChestSlots = [
      { x: 3.5, z: -14, songIdx: 0, hint: "Junto al sendero florido" },
      { x: -17, z: -12, songIdx: 1, hint: "A orillas del río" },
      { x: 24, z: -24, songIdx: 2, hint: "Colina Mirador" },
      { x: -35, z: -32, songIdx: 3, hint: "Detrás de la cabaña" },
      { x: 0, z: -60, songIdx: 4, hint: "Entrada del bosque", isBoss: true }
    ];

    Promise.all([
      loadCachedModel('/models/props/chest_gold.glb').catch(() => null),
      loadCachedModel('/models/props/chest_wood.glb').catch(() => null),
      loadCachedModel('/models/props/gate.glb').catch(() => null),
      loadCachedModel('/models/props/barrel.glb').catch(() => null),
      loadCachedModel(charInfo.file || '/models/characters/Knight.glb').catch(() => null)
    ]).then(([goldChestGltf, woodChestGltf, gateGltf, barrelGltf, heroGltf]) => {
      if (!isMounted) return;

      // Puerta de piedra lejana en el horizonte (+Z profundo)
      if (gateGltf) {
        const portal = gateGltf.scene.clone(true);
        portal.scale.set(1.5, 1.5, 1.5);
        portal.position.set(0, getTerrainHeight(0, -60), -60);
        portal.traverse(c => { if (c.isMesh) c.castShadow = true; });
        scene.add(portal);
      }

      // Barricas decorativas junto a la cabaña
      if (barrelGltf) {
        const b = barrelGltf.scene.clone(true);
        b.scale.set(0.9, 0.9, 0.9);
        b.position.set(-29, getTerrainHeight(-29, -26), -26);
        b.traverse(c => { if (c.isMesh) c.castShadow = true; });
        scene.add(b);
      }

      // Colocar los cofres iniciales
      organicChestSlots.forEach((slot) => {
        const song = songs[slot.songIdx] || songs[0];
        if (!song) return;

        const x = slot.x;
        const z = slot.z;
        const y = getTerrainHeight(x, z);
        const isCompleted = completedSongIds.has(song.id);
        const isCurrent = slot.songIdx === highestUnlockedIndex;
        const isUnlocked = slot.songIdx <= highestUnlockedIndex;

        levelPositions.push({ x, y, z, songIndex: slot.songIdx, song, isUnlocked, isCompleted });

        const chestGroup = new THREE.Group();
        chestGroup.position.set(x, y, z);

        // Losa circular de piedra en la base
        const baseStone = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.3, 0.15, 16),
          new THREE.MeshStandardMaterial({ color: 0xc8c5c0, roughness: 0.8 })
        );
        baseStone.position.y = 0.08;
        baseStone.receiveShadow = true;
        chestGroup.add(baseStone);

        // Cofre 3D
        const chosenChest = (isCompleted || isCurrent) ? (goldChestGltf || woodChestGltf) : (woodChestGltf || goldChestGltf);
        if (chosenChest) {
          const chest = chosenChest.scene.clone(true);
          chest.scale.set(1.2, 1.2, 1.2);
          chest.position.set(0, 0.15, 0);
          chest.traverse(c => { if (c.isMesh) c.castShadow = true; });
          chestGroup.add(chest);
        }

        // Estrellas doradas si está completado
        if (isCompleted) {
          const starGeo = new THREE.OctahedronGeometry(0.2, 0);
          const starMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
          [-0.28, 0, 0.28].forEach((sx, sIdx) => {
            const starMesh = new THREE.Mesh(starGeo, starMat);
            starMesh.position.set(sx, 1.35 + (sIdx === 1 ? 0.15 : 0), 0);
            chestGroup.add(starMesh);
          });
        }

        scene.add(chestGroup);
      });

      // Spawn Personaje en la Plaza Inicial
      playerPosRef.current = { x: 0, y: 0.1, z: 3.5 };

      if (heroGltf) {
        const charMesh = SkeletonUtils.clone(heroGltf.scene);
        charMesh.scale.set(1.15, 1.15, 1.15);
        charMesh.position.set(playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z);
        charMesh.rotation.y = playerRotYRef.current;
        charMesh.traverse(c => { if (c.isMesh) c.castShadow = true; });
        scene.add(charMesh);
        characterMeshRef.current = charMesh;

        // Animations Setup
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

      setLoading(false);
    });

    // 14. Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 15. Bucle de Render y Movimiento de Aventura con Prevención de Clipping
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      // Rotación suave de la nota musical decorativa en la fuente
      if (noteGroup) {
        noteGroup.rotation.y += 0.012;
      }

      // Animación suave de partículas mágicas
      if (particleSystem) {
        particleSystem.rotation.y += 0.003;
      }

      if (characterMixerRef.current) {
        characterMixerRef.current.update(delta);
      }

      // Input
      const isShift = keysRef.current.shift;
      const baseSpeed = isShift ? 8.2 : 4.4;
      let inputX = 0;
      let inputZ = 0;

      if (keysRef.current.forward) inputZ -= 1;
      if (keysRef.current.backward) inputZ += 1;
      if (keysRef.current.left) inputX -= 1;
      if (keysRef.current.right) inputX += 1;

      const isInputActive = inputX !== 0 || inputZ !== 0;

      let moveDir = new THREE.Vector3(0, 0, 0);
      if (isInputActive) {
        const normInput = new THREE.Vector2(inputX, inputZ).normalize();
        const camYaw = cameraAngleRef.current.yaw;
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

      // Movimiento horizontal
      if (isInputActive) {
        playerPosRef.current.x += moveDir.x * baseSpeed * delta;
        playerPosRef.current.z += moveDir.z * baseSpeed * delta;
      }

      // Cota del terreno bajo el jugador
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

      // Transición de Animaciones (Idle <-> Walking <-> Running)
      let desiredAnim = 'Idle';
      if (isInputActive) {
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

      // Posición de la malla del héroe
      if (characterMeshRef.current) {
        characterMeshRef.current.position.set(
          playerPosRef.current.x,
          playerPosRef.current.y,
          playerPosRef.current.z
        );
        characterMeshRef.current.rotation.y = playerRotYRef.current;
        sunLight.target = characterMeshRef.current;
      }

      // Detección de Proximidad a Cofres (Radio 3.0 unidades)
      let detectedStation = null;
      for (let pos of levelPositions) {
        const dx = playerPosRef.current.x - pos.x;
        const dz = playerPosRef.current.z - pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 3.0) {
          detectedStation = pos.song;
          break;
        }
      }
      setNearbySong(detectedStation);

      // Cámara de Tercera Persona con Prevención de Clipping y Altura Moderada
      const pX = playerPosRef.current.x;
      const pY = playerPosRef.current.y;
      const pZ = playerPosRef.current.z;

      const { yaw, pitch, distance } = cameraAngleRef.current;
      const camOffsetY = Math.sin(pitch) * distance + 1.25;
      const camHorizontalDist = Math.cos(pitch) * distance;
      const camOffsetX = Math.sin(yaw) * camHorizontalDist;
      const camOffsetZ = Math.cos(yaw) * camHorizontalDist;

      let targetCamX = pX + camOffsetX;
      let targetCamY = pY + camOffsetY;
      let targetCamZ = pZ + camOffsetZ;

      // Prevención básica de clipping contra el suelo del terreno
      const terrainAtCam = getTerrainHeight(targetCamX, targetCamZ);
      if (targetCamY < terrainAtCam + 1.2) {
        targetCamY = terrainAtCam + 1.2;
      }

      const targetCamPos = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      const targetLookAt = new THREE.Vector3(pX, pY + 1.15, pZ);

      camera.position.lerp(targetCamPos, Math.min(1.0, 8.0 * delta));
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
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
      scene.clear();
    };
  }, [songs, highestUnlockedIndex]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL World Canvas */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-sky-950/80 backdrop-blur-md">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 border-b-4 border-amber-700 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)] animate-bounce mb-3 text-white">
            <Compass size={32} />
          </div>
          <span className="text-sm font-black uppercase text-amber-200 tracking-widest">Cargando El Valle de las Notas...</span>
        </div>
      )}

      {/* TUTORIAL CONTEXTUAL DISCRETO (Solo los primeros 5 segundos) */}
      {showTutorial && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-white/90 text-xs font-bold shadow-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Explora el valle con <strong className="text-amber-300">WASD</strong> y gira la vista arrastrando el ratón</span>
          </div>
        </div>
      )}

      {/* DISCRETO PROMPT AL ACERCARSE A UN COFRE (Sin tapar la pantalla) */}
      {nearbySong && !showTutorial && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in duration-200 pointer-events-auto">
          <button
            onClick={() => setActiveModalSong(nearbySong)}
            className="bg-slate-900/85 hover:bg-slate-900 active:scale-95 text-white px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-xl border border-sky-400/40 backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all hover:border-sky-400"
          >
            <Sparkles size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-slate-200">Presiona <span className="text-sky-300 font-black">ESPACIO</span> o toca: <strong className="text-white">{nearbySong.title}</strong></span>
            <Play size={13} fill="white" className="text-white" />
          </button>
        </div>
      )}

      {/* HUD DE GUÍA DE CONTROLES TRANSPARENTE Y DISCRETO */}
      <div className="absolute bottom-4 left-5 z-20 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-950/45 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 text-white/70 shadow-lg">
        <span className="text-[10px] font-medium text-slate-300">
          <span className="text-amber-300 font-bold">WASD</span> Mover • <span className="text-amber-300 font-bold">Shift</span> Correr • <span className="text-amber-300 font-bold">Espacio</span> Saltar • <span className="text-amber-300 font-bold">Arrastrar</span> Mirar
        </span>
      </div>

      {/* CONTROLES TÁCTILES TRANSPARENTES (Solo móviles / tablets) */}
      <div className="absolute bottom-5 left-4 z-30 flex flex-col items-center gap-1 opacity-50 hover:opacity-85 transition-opacity sm:hidden">
        <button
          onPointerDown={() => { keysRef.current.forward = true; }}
          onPointerUp={() => { keysRef.current.forward = false; }}
          onPointerLeave={() => { keysRef.current.forward = false; }}
          className="w-10 h-10 rounded-xl bg-slate-950/40 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center active:bg-sky-600/60"
        >
          <ChevronUp size={20} />
        </button>

        <div className="flex gap-1">
          <button
            onPointerDown={() => { keysRef.current.left = true; }}
            onPointerUp={() => { keysRef.current.left = false; }}
            onPointerLeave={() => { keysRef.current.left = false; }}
            className="w-10 h-10 rounded-xl bg-slate-950/40 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center active:bg-sky-600/60"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            onPointerDown={() => { keysRef.current.backward = true; }}
            onPointerUp={() => { keysRef.current.backward = false; }}
            onPointerLeave={() => { keysRef.current.backward = false; }}
            className="w-10 h-10 rounded-xl bg-slate-950/40 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center active:bg-sky-600/60"
          >
            <ChevronDown size={20} />
          </button>

          <button
            onPointerDown={() => { keysRef.current.right = true; }}
            onPointerUp={() => { keysRef.current.right = false; }}
            onPointerLeave={() => { keysRef.current.right = false; }}
            className="w-10 h-10 rounded-xl bg-slate-950/40 backdrop-blur-sm border border-white/15 text-white flex items-center justify-center active:bg-sky-600/60"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* BOTÓN SALTO MÓVIL DISCRETO */}
      <div className="absolute bottom-5 right-4 z-30 flex items-center sm:hidden">
        <button
          onPointerDown={() => {
            if (isGroundedRef.current) {
              playerVelYRef.current = 8.5;
              isGroundedRef.current = false;
              const jumpAction = characterActionsRef.current['Jump_Full_Short'];
              if (jumpAction) jumpAction.reset().setLoop(THREE.LoopOnce, 1).play();
            }
          }}
          className="w-11 h-11 rounded-full bg-slate-950/40 backdrop-blur-sm border border-white/20 text-white text-[9px] font-black flex items-center justify-center shadow-lg active:scale-95"
        >
          SALTO
        </button>
      </div>

      {/* MODAL DE LECCIÓN MUSICAL */}
      {activeModalSong && (
        <div
          className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setActiveModalSong(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border-2 border-sky-500/40 p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(14,165,233,0.3)] relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalSong(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 border border-sky-400/50 flex items-center justify-center text-3xl shadow-lg mb-3 animate-bounce">
                👑
              </div>

              <span className="text-[11px] font-black uppercase text-sky-400 tracking-widest mb-1">
                Estación Musical
              </span>

              <h2 className="text-xl font-black uppercase text-white tracking-tight mb-4">
                {activeModalSong.title}
              </h2>

              <div className="flex gap-1.5 mb-6">
                {[1, 2, 3].map(s => (
                  <Star key={s} size={22} className={memoryMedals.includes(activeModalSong.id) ? 'fill-[#FFC800] text-[#FFC800]' : 'text-slate-700'} />
                ))}
              </div>

              <div className="w-full flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const songToPlay = activeModalSong;
                      setActiveModalSong(null);
                      onStartLevel(songToPlay, 'solo');
                    }}
                    className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <Play size={16} fill="white" /> SOLO
                  </button>

                  <button
                    onClick={() => {
                      const songToPlay = activeModalSong;
                      setActiveModalSong(null);
                      onStartLevel(songToPlay, 'oído');
                    }}
                    className="w-full p-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                  >
                    <Music2 size={16} /> OÍDO
                  </button>
                </div>

                {activeModalSong && (songs.indexOf(activeModalSong) + 1) % 10 === 0 && (
                  <button
                    onClick={() => {
                      const songToPlay = activeModalSong;
                      setActiveModalSong(null);
                      onStartLevel(songToPlay, 'boss');
                    }}
                    className="w-full p-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse"
                  >
                    <Zap size={18} fill="white" /> ¡ENFRENTAR JEFE!
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
