/**
 * WorldGenerator.js
 * Materializes the authored Plaza composition with cached KayKit assets.
 * Plaza review materializes the authored terrain and its active composition. The legacy outer
 * environment remains available but is not built during the staged Plaza review.
 */

import * as THREE from 'three';
import { createRNG } from './worldSeed';
import {
  GENERATION_RULES,
  calculateTerrainElevation,
  isInClearanceZone
} from './worldGenerationRules';
import { KAYKIT_ASSETS, loadCachedModel } from '../assets/assetManifest';
import { WORLD_BLUEPRINT } from './worldBlueprint';
import { PLAZA_COMPOSITION } from './composition/plazaComposition.js';
import { FOREST_COMPOSITION } from './composition/forestComposition.js';
import { collectAssetUrls, validateComposition } from './composition/validateComposition.js';
import { materializeCollider } from './collision/modelColliders.js';
import { createCollisionOutline } from './collision/collisionDebug.js';

export class WorldGenerator {
  constructor(seed = 'VALLE_DE_LAS_NOTAS_V1') {
    this.seed = seed;
    this.rng = createRNG(seed);
    this.models = new Map();
    this.colliders = [];
    this.collisionDebug = new THREE.Group();
    this.collisionDebug.name = 'Collision_Debug';
    this.stats = {
      objectsPlaced: 0,
      treesCount: 0,
      rocksCount: 0,
      bushesCount: 0,
      propsCount: 0,
      drawCallsEstimate: 0
    };
  }

  /**
   * Carga previa de los modelos KayKit requeridos para la Fase 1
   */
  async preloadModels() {
    const requiredUrls = PLAZA_COMPOSITION.constructionPhase
      ? [...new Set([...PLAZA_COMPOSITION.instances,...FOREST_COMPOSITION.instances].map(item => item.assetUrl))]
      : [
      ...new Set(PLAZA_COMPOSITION.instances.map(item => item.assetUrl)),

      // Bosque & Árbol Maestro
      '/models/props/Assets/gltf/Tree_1_A_Color1.gltf',
      '/models/props/Assets/gltf/Tree_1_B_Color1.gltf',
      '/models/props/Assets/gltf/Tree_2_A_Color1.gltf',
      '/models/props/Assets/gltf/Tree_2_B_Color1.gltf',
      '/models/props/Assets/gltf/Tree_3_A_Color1.gltf',
      '/models/props/Assets/gltf/Bush_1_A_Color1.gltf',
      '/models/props/Assets/gltf/Bush_2_A_Color1.gltf',
      '/models/props/Assets/gltf/Bush_3_A_Color1.gltf',
      '/models/props/Assets/gltf/Rock_1_A_Color1.gltf',
      '/models/props/Assets/gltf/Rock_1_B_Color1.gltf',
      '/models/props/Assets/gltf/trunk_large_A.gltf',
      '/models/props/Assets/gltf/trunk_medium_B.gltf',

      // Bifurcación
      '/models/props/Assets/gltf/barrier_column.gltf'
    ];

    await Promise.all(
      requiredUrls.map(async (url) => {
        try {
          const gltf = await loadCachedModel(url);
          if (gltf && gltf.scene) {
            this.models.set(url, gltf.scene);
          }
        } catch (e) {
          console.warn(`[WorldGenerator] No se pudo cargar: ${url}`, e);
        }
      })
    );
  }

  /**
   * Instancia rápida y segura clonando la escena en caché
   */
  spawnInstance(url, scale = 1, castShadow = true, receiveShadow = true) {
    const proto = this.models.get(url);
    if (!proto) return null;
    const instance = proto.clone(true);

    if (scale !== 1) {
      if (typeof scale === 'number') {
        instance.scale.set(scale, scale, scale);
      } else {
        instance.scale.set(scale.x ?? 1, scale.y ?? 1, scale.z ?? 1);
      }
    }

    instance.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
        child.frustumCulled = true;
      }
    });

    this.stats.objectsPlaced++;
    return instance;
  }

  placeAsset(root, url, { x = 0, y = null, z = 0, scale = 1, rotationY = 0, castShadow = true, receiveShadow = true, kind = 'props' }) {
    const obj = this.spawnInstance(url, scale, castShadow, receiveShadow);
    if (!obj) return null;
    obj.position.set(x, y ?? calculateTerrainElevation(x, z) + 0.04, z);
    obj.rotation.y = rotationY;
    root.add(obj);

    if (kind === 'trees') this.stats.treesCount++;
    else if (kind === 'rocks') this.stats.rocksCount++;
    else if (kind === 'bushes') this.stats.bushesCount++;
    else this.stats.propsCount++;

    return obj;
  }

  /**
   * Construye el terreno topográfico respetando las alturas continuas
   */
  buildTerrain() {
    const size = 110;
    const segments = PLAZA_COMPOSITION.constructionPhase ? Math.ceil(size*2) : 56;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = [];
    const path = PLAZA_COMPOSITION.paths[0];
    const curve = new THREE.CatmullRomCurve3(path.points.map(point => new THREE.Vector3(...point)));
    const samples = curve.getSpacedPoints(160);
    const pathLength = curve.getLength();
    const neighboringPaths=FOREST_COMPOSITION.paths.map(p=>{
      const c=new THREE.CatmullRomCurve3(p.points.map(point=>new THREE.Vector3(...point)));
      return {path:p,samples:c.getSpacedPoints(160),length:c.getLength()};
    });
    const grass = new THREE.Color(0x63b75f);
    const earth = new THREE.Color(path.color);
    const darkGrass = new THREE.Color(0x36754b);
    const color = new THREE.Color();
    const bankColor = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      pos.setY(i, calculateTerrainElevation(vx, vz));
      let distance = Infinity;
      let nearestIndex = 0;
      for (let j=0;j<samples.length;j++) {
        const point = samples[j];
        const candidate = Math.hypot(vx - point.x, vz - point.z);
        if (candidate < distance) { distance = candidate; nearestIndex = j; }
      }
      let weight = path.visualImplementation === 'terrain-blend'
        ? THREE.MathUtils.smoothstep(distance, path.width / 2, path.width / 2 + path.edgeBlend) : 1;
      if (path.endFade) {
        const remaining = pathLength * (1 - nearestIndex / (samples.length-1));
        weight = 1 - (1-weight) * THREE.MathUtils.smoothstep(remaining, 0, path.endFade);
      }
      for(const neighbor of neighboringPaths) {
        let nearest=Infinity,index=0;
        for(let j=0;j<neighbor.samples.length;j++) {
          const p=neighbor.samples[j],d=Math.hypot(vx-p.x,vz-p.z);
          if(d<nearest){nearest=d;index=j;}
        }
        const p=neighbor.path,t=index/(neighbor.samples.length-1);
        let coverage=1-THREE.MathUtils.smoothstep(nearest,p.width/2,p.width/2+p.edgeBlend);
        if(p.startFade) coverage*=THREE.MathUtils.smoothstep(neighbor.length*t,0,p.startFade);
        if(p.endFade) coverage*=THREE.MathUtils.smoothstep(neighbor.length*(1-t),0,p.endFade);
        weight=Math.min(weight,1-coverage);
      }
      bankColor.copy(grass).lerp(darkGrass, THREE.MathUtils.smoothstep(Math.hypot(vx, vz), 9, 22) * 0.45);
      color.copy(earth).lerp(bankColor, weight);
      colors.push(color.r, color.g, color.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.name = 'Terrain_Mesh';
    return mesh;
  }

  /**
   * Construye la cinta del camino con borde suave y alineación a la topografía
   */
  buildPathRibbon(points, width = 3.0, color = 0xdcd5cc) {
    const curve = new THREE.CatmullRomCurve3(points);
    const segs = 40;
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

      const yL = calculateTerrainElevation(l.x, l.z) + 0.04;
      const yR = calculateTerrainElevation(r.x, r.z) + 0.04;

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

    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.88,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    mesh.name = 'Path_Ribbon';
    return mesh;
  }

  /**
   * Genera el conjunto arquitectónico de la Plaza de las Notas (Fase 1)
   */
  generateComposition(group, composition) {
    const plazaRoot = new THREE.Group();
    plazaRoot.name = composition.groupName;
    plazaRoot.position.fromArray(composition.origin);
    for (const item of composition.instances) {
      const [x, offsetY, z] = item.position;
      const [sx, sy, sz] = item.scale;
      const y = item.grounding === "terrain" ? calculateTerrainElevation(x, z) + offsetY : offsetY;
      const obj = this.placeAsset(plazaRoot, item.assetUrl, {
        x, y, z, scale: { x: sx, y: sy, z: sz },
        castShadow: item.castShadow, receiveShadow: item.receiveShadow, kind: item.kind
      });
      if (obj) {
        obj.rotation.set(...item.rotation);
        obj.userData.compositionId = item.id;
      }
    }
    group.add(plazaRoot);
    plazaRoot.updateWorldMatrix(true,true);
    for(const item of composition.instances) {
      const instance=plazaRoot.children.find(obj=>obj.userData.compositionId===item.id);
      if(!instance)continue;
      const collider=materializeCollider(instance,item,this.models.get(item.assetUrl),composition.regionId);
      if(collider) {
        this.colliders.push(collider);
        this.collisionDebug.add(createCollisionOutline(collider,collider.shape==='circle'?0x22e68d:0x36bfff,calculateTerrainElevation));
      }
    }
    for(const station of composition.stations) {
      const instance=plazaRoot.children.find(obj=>obj.userData.compositionId===station.instanceId);
      if(!instance)continue;
      const p=instance.getWorldPosition(new THREE.Vector3());
      this.collisionDebug.add(createCollisionOutline({shape:'circle',x:p.x,z:p.z,radius:station.interactionRadius},0xffc247,calculateTerrainElevation));
    }
  }

  /**
   * Genera el Árbol Maestro en el primer claro (Fase 1)
   * Ensamble formalmente aprobado: Tree_2_A_Color1 (1.55x) + trunk_large_A + 2x Rock_1_A + Bush_1_A
   */
  generateMasterTree(group) {
    // Existing external environment: not migrated in the Plaza-only task.
    const x = 3.8;
    const z = -18.0;
    const y = calculateTerrainElevation(x, z);

    const masterTreeRoot = new THREE.Group();
    masterTreeRoot.name = 'Landmark_Arbol_Maestro';
    masterTreeRoot.position.set(x, y, z);

    // 1. Árbol frondoso dominante a escala 1.55x
    const tree = this.spawnInstance('/models/props/Assets/gltf/Tree_2_A_Color1.gltf', 1.55);
    if (tree) {
      tree.rotation.y = 0.45;
      masterTreeRoot.add(tree);
      this.stats.treesCount++;
    }

    // 2. Tronco caído en la base
    const trunk = this.spawnInstance('/models/props/Assets/gltf/trunk_large_A.gltf', 1.3);
    if (trunk) {
      trunk.position.set(-1.4, 0.05, 0.8);
      trunk.rotation.y = 1.1;
      masterTreeRoot.add(trunk);
      this.stats.propsCount++;
    }

    // 3. Dos rocas gemelas apoyadas en las raíces
    const rock1 = this.spawnInstance('/models/props/Assets/gltf/Rock_1_A_Color1.gltf', 1.25);
    if (rock1) {
      rock1.position.set(1.5, 0.02, -0.9);
      rock1.rotation.y = 0.8;
      masterTreeRoot.add(rock1);
      this.stats.rocksCount++;
    }
    const rock2 = this.spawnInstance('/models/props/Assets/gltf/Rock_1_A_Color1.gltf', 0.95);
    if (rock2) {
      rock2.position.set(1.1, 0.02, 1.2);
      rock2.rotation.y = 2.4;
      masterTreeRoot.add(rock2);
      this.stats.rocksCount++;
    }

    // 4. Arbusto floral bajo
    const bush = this.spawnInstance('/models/props/Assets/gltf/Bush_1_A_Color1.gltf', 1.1);
    if (bush) {
      bush.position.set(-1.1, 0.02, -1.0);
      masterTreeRoot.add(bush);
      this.stats.bushesCount++;
    }

    group.add(masterTreeRoot);
  }

  /**
   * Genera los clusters orgánicos de bosque para la Sección 1 respetando Negative Space
   */
  generateForestSection(group) {
    // Legacy external composition retained for visual parity, not expanded.
    const forestRoot = new THREE.Group();
    forestRoot.name = 'Region_Bosque_Transition_Review';

    [
      { x: -12.0, z: -12.5, url: '/models/props/Assets/gltf/Tree_1_A_Color1.gltf', scale: 1.2, rot: 0.4 },
      { x: -14.4, z: -15.4, url: '/models/props/Assets/gltf/Tree_1_B_Color1.gltf', scale: 0.95, rot: 1.8 },
      { x: 12.3, z: -13.0, url: '/models/props/Assets/gltf/Tree_2_A_Color1.gltf', scale: 1.15, rot: -0.5 },
      { x: 15.0, z: -15.7, url: '/models/props/Assets/gltf/Tree_3_A_Color1.gltf', scale: 0.9, rot: 2.2 }
    ].forEach((p) => {
      if (!isInClearanceZone(p.x, p.z)) {
        this.placeAsset(forestRoot, p.url, { x: p.x, z: p.z, scale: p.scale, rotationY: p.rot, kind: 'trees' });
      }
    });

    [
      { x: -9.5, z: -11.2, url: '/models/props/Assets/gltf/Bush_2_A_Color1.gltf', scale: 0.85 },
      { x: 9.7, z: -11.6, url: '/models/props/Assets/gltf/Bush_3_A_Color1.gltf', scale: 0.8 },
      { x: -11.2, z: -17.5, url: '/models/props/Assets/gltf/Rock_1_A_Color1.gltf', scale: 0.9, kind: 'rocks' },
      { x: 11.8, z: -17.2, url: '/models/props/Assets/gltf/Rock_1_B_Color1.gltf', scale: 0.85, kind: 'rocks' }
    ].forEach((p) => {
      this.placeAsset(forestRoot, p.url, { x: p.x, z: p.z, scale: p.scale, kind: p.kind ?? 'bushes' });
    });

    group.add(forestRoot);
  }

  /**
   * Genera el hito de la Bifurcación Central (z = -32)
   */
  generateFork(group) {
    // Legacy, currently unused. Do not activate before region approval.
    const forkRoot = new THREE.Group();
    forkRoot.name = 'Landmark_Bifurcacion_Central';

    const fx = 0;
    const fz = -32;
    const fy = calculateTerrainElevation(fx, fz);

    // Columna marcadora de encrucijada
    const marker = this.spawnInstance('/models/props/Assets/gltf/barrier_column.gltf', 1.25);
    if (marker) {
      marker.position.set(fx, fy + 0.05, fz);
      forkRoot.add(marker);
      this.stats.propsCount++;
    }

    group.add(forkRoot);
  }

  /**
   * Genera la escena de visualización para el modo Debug (radios, negativo space, caminos)
   */
  generateDebugScene(mainPathPoints) {
    const debugGroup = new THREE.Group();
    debugGroup.name = 'World_Debug_Overlay';

    // 1. Visualización de zonas de Negative Space (Círculos amarillos translúcidos)
    const zones = PLAZA_COMPOSITION.constructionPhase
      ? [...PLAZA_COMPOSITION.openZones, ...PLAZA_COMPOSITION.clearZones,...FOREST_COMPOSITION.openZones,...FOREST_COMPOSITION.clearZones,...FOREST_COMPOSITION.reservations].map(zone => ({x:zone.center[0],z:zone.center[1],radius:zone.radius}))
      : GENERATION_RULES.clearanceZones;
    zones.forEach((z) => {
      const geo = new THREE.RingGeometry(z.radius - 0.2, z.radius, 32);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(geo, mat);
      const vertices = geo.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        vertices.setY(i, calculateTerrainElevation(z.x + vertices.getX(i), z.z + vertices.getZ(i)) + 0.15);
      }
      ring.position.set(z.x, 0, z.z);
      debugGroup.add(ring);
    });

    // 2. Línea guía del camino principal
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
    const lineGeo = new THREE.BufferGeometry().setFromPoints(
      mainPathPoints.map((p) => new THREE.Vector3(p.x, calculateTerrainElevation(p.x, p.z) + 0.25, p.z))
    );
    const line = new THREE.Line(lineGeo, lineMat);
    debugGroup.add(line);
    for(const path of FOREST_COMPOSITION.paths) {
      const geometry=new THREE.BufferGeometry().setFromPoints(path.points.map(p=>new THREE.Vector3(p[0],calculateTerrainElevation(p[0],p[2])+0.25,p[2])));
      debugGroup.add(new THREE.Line(geometry,lineMat));
    }

    return debugGroup;
  }

  /**
   * Ejecuta la construcción completa de la Sección 1
   */
  async buildSection1() {
    const forestValidation=validateComposition(FOREST_COMPOSITION,{registeredAssets:collectAssetUrls(KAYKIT_ASSETS),worldBlueprint:WORLD_BLUEPRINT});
    if(!forestValidation.valid) throw new Error(`Invalid Forest composition: ${JSON.stringify(forestValidation.errors)}`);
    const validation = validateComposition(PLAZA_COMPOSITION, {
      registeredAssets: collectAssetUrls(KAYKIT_ASSETS),
      worldBlueprint: WORLD_BLUEPRINT
    });
    for (const warning of validation.warnings) console.warn('[CompositionBlueprint]', warning);
    if (!validation.valid) throw new Error(`Invalid Plaza composition: ${JSON.stringify(validation.errors)}`);
    await this.preloadModels();
    const missingAssets = [...PLAZA_COMPOSITION.instances,...FOREST_COMPOSITION.instances].filter(item => !this.models.has(item.assetUrl));
    if (missingAssets.length) throw new Error(`Plaza assets failed to load: ${missingAssets.map(item => item.assetUrl).join(', ')}`);

    const worldGroup = new THREE.Group();
    worldGroup.name = 'Valle_de_las_Notas_Section_1';

    const path = PLAZA_COMPOSITION.paths[0];
    // Preserve the existing external connector; it is not a new region design.
    const mainPathPoints = [
      ...path.points.map(point => new THREE.Vector3(...point)),
      ...(!PLAZA_COMPOSITION.constructionPhase ? [new THREE.Vector3(1.8, 0, -18)] : [])
    ];

    // 1. Terreno
    const terrain = this.buildTerrain();
    worldGroup.add(terrain);

    // 2. Caminos
    // IMPLEMENTACION VISUAL PROVISIONAL: retain ribbon for migration parity.
    if (path.visualImplementation === 'provisional-ribbon') {
      worldGroup.add(this.buildPathRibbon(mainPathPoints, path.width, path.color));
    }

    // 3. Plaza de las Notas
    this.generateComposition(worldGroup,PLAZA_COMPOSITION);
    this.generateComposition(worldGroup,FOREST_COMPOSITION);

    // 4. Árbol Maestro (Landmark)
    if (!PLAZA_COMPOSITION.constructionPhase) this.generateMasterTree(worldGroup);

    // 5. Transición corta a bosque. La bifurcación queda pausada hasta aprobar Plaza.
    if (!PLAZA_COMPOSITION.constructionPhase) this.generateForestSection(worldGroup);

    // 7. Overlay Debug
    const debugOverlay = this.generateDebugScene(mainPathPoints);
    debugOverlay.add(this.collisionDebug);
    this.stats.solidColliders=this.colliders.length;
    this.stats.collidersByRegion=Object.fromEntries([PLAZA_COMPOSITION,FOREST_COMPOSITION].map(c=>[c.regionId,this.colliders.filter(item=>item.regionId===c.regionId).length]));

    return {
      sceneGroup: worldGroup,
      debugGroup: debugOverlay,
      heightAt: (x, z) => calculateTerrainElevation(x, z),
      composition: PLAZA_COMPOSITION,
      colliders: this.colliders,
      stats: this.stats
    };
  }
}
