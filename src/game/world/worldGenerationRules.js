/**
 * worldGenerationRules.js
 * Reglas matemáticas y topológicas de generación para el Valle de las Notas.
 * Gobierna distancias mínimas, corridors de seguridad, negative space y cálculo de alturas.
 */

import { PLAZA_COMPOSITION } from './composition/plazaComposition.js';
import { FOREST_COMPOSITION } from './composition/forestComposition.js';

const smooth = (value) => { const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t); };

export function calculateForestElevation(x,z) {
  const terrain=FOREST_COMPOSITION.terrain;
  let height=terrain.baseY;
  for(const form of terrain.landforms) {
    const d=Math.hypot((x-form.center[0])/form.radius[0],(z-form.center[1])/form.radius[1]);
    height+=form.height*Math.max(0,1-d*d)**2;
  }
  for(const p of terrain.plateaus) {
    const weight=1-smooth((Math.hypot(x-p.center[0],z-p.center[1])-p.radius)/p.blendWidth);
    height=height*(1-weight)+p.height*weight;
  }
  return height;
}

export function calculateTerrainElevation(x,z) {
  const plazaHeight=calculatePlazaElevation(x,z);
  const b=FOREST_COMPOSITION.terrain.blendBounds;
  const weight=smooth(Math.min(x-b.min[0],b.max[0]-x,z-b.min[1],b.max[1]-z)/b.edgeWidth)*smooth((Math.hypot(x,z)-b.protectedRadius)/b.edgeWidth);
  return plazaHeight*(1-weight)+calculateForestElevation(x,z)*weight;
}

export const GENERATION_RULES = {
  // Corredor despejado a cada lado de cualquier camino
  pathSafeMargin: PLAZA_COMPOSITION.paths[0].freeMarginEachSide,

  // Negative space por áreas clave
  clearanceZones: [
    ...PLAZA_COMPOSITION.openZones.map(zone => ({ name: zone.name, x: zone.center[0], z: zone.center[1], radius: zone.radius })),
    { name: 'Claro del Árbol Maestro', x: 3.5, z: -18, radius: 5.5 },
    { name: 'Bifurcación Central', x: 0, z: -32, radius: 6.0 }
  ],

  // Composición de clusters de arboleda
  clusterRules: {
    minSecondaryTrees: 2,
    maxSecondaryTrees: 2,
    secondaryScaleMin: 0.75,
    secondaryScaleMax: 0.85,
    maxOffsetFromDominant: 3.2,
    bushesPerCluster: 2,
    rocksPerCluster: 1
  }
};

/**
 * Calcula la distancia más corta de un punto (x, z) a un segmento de camino (x1, z1) -> (x2, z2).
 */
export function pointToSegmentDistance(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) {
    const ex = px - x1;
    const ez = pz - z1;
    return Math.sqrt(ex * ex + ez * ez);
  }
  let t = ((px - x1) * dx + (pz - z1) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;
  const rx = px - projX;
  const rz = pz - projZ;
  return Math.sqrt(rx * rx + rz * rz);
}

/**
 * Comprueba si una posición está demasiado cerca de un trazado de camino.
 */
export function isNearPath(px, pz, pathPoints, margin = GENERATION_RULES.pathSafeMargin) {
  if (!pathPoints || pathPoints.length < 2) return false;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    const d = pointToSegmentDistance(px, pz, p1.x, p1.z, p2.x, p2.z);
    if (d < margin) return true;
  }
  return false;
}

/**
 * Comprueba si un punto cae dentro de alguna zona de Negative Space obligatorio.
 */
export function isInClearanceZone(px, pz, customZones = []) {
  const allZones = [...GENERATION_RULES.clearanceZones, ...customZones];
  for (const zone of allZones) {
    const dx = px - zone.x;
    const dz = pz - zone.z;
    if (Math.sqrt(dx * dx + dz * dz) < zone.radius) {
      return true;
    }
  }
  return false;
}

/**
 * Función matemática de elevación de terreno para la Sección 1 (Plaza -> Bosque -> Bifurcación)
 * Transiciones orgánicas continuas respetando el Blueprint:
 * - Plaza (0.0m)
 * - Transición a bosque (+0.6m -> +1.8m)
 * - Inicio del desnivel hacia el río (-X) y montaña (+X) al llegar a la bifurcación.
 */
export function calculatePlazaElevation(x, z) {
  if (PLAZA_COMPOSITION.constructionPhase) {
    const terrain = PLAZA_COMPOSITION.terrain;
    const t = Math.max(0, Math.min(1, (Math.hypot(x, z) - terrain.flatRadius) / terrain.transitionWidth));
    const blend = t * t * (3 - 2 * t);
    // Compact, explicitly authored landforms; no noise or random placement.
    const falloff = terrain.outerFalloff;
    const edgeT = falloff ? Math.max(0, Math.min(1, (Math.hypot(x,z)-terrain.reviewExtent)/falloff.width)) : 0;
    const edgeDrop = falloff ? falloff.depth*edgeT*edgeT*(3-2*edgeT) : 0;
    return terrain.baseY - edgeDrop + blend * (terrain.rimHeight + terrain.landforms.reduce((height, form) => {
      const d = Math.hypot((x - form.center[0]) / form.radius[0], (z - form.center[1]) / form.radius[1]);
      const influence = Math.max(0, 1 - d * d);
      return height + form.height * influence * influence;
    }, 0));
  }
  const distCenter = Math.sqrt(x * x + z * z);

  // 1. Plaza de las Notas: planicie perfecta en el radio central
  if (distCenter < PLAZA_COMPOSITION.terrain.flatRadius) {
    return PLAZA_COMPOSITION.terrain.baseY;
  }

  // Factor de transición suave desde la plaza hacia el exterior
  const plazaTransition = Math.min(1.0, Math.max(0.0, (distCenter - PLAZA_COMPOSITION.terrain.flatRadius) / 7.0));

  // 2. Progresión hacia el Bosque (hacia -Z)
  let baseForestHeight = 0.0;
  if (z < -8.0 && z > -36.0) {
    // Ascenso gradual suave desde 0m hasta +1.5m en el claro y bifurcación
    const forestProgress = Math.min(1.0, Math.max(0.0, (-z - 8.0) / 22.0));
    baseForestHeight = forestProgress * 1.5;
  }

  // 3. Inicio suave del cauce fluvial hacia el Oeste (-X) pasado z < -20
  let riverDepression = 0.0;
  if (x < -14.0 && z < -18.0) {
    const riverX = -24.0 + Math.sin(z * 0.1) * 3.0;
    const distRiver = Math.abs(x - riverX);
    if (distRiver < 7.0) {
      riverDepression = -1.2 * (1.0 - distRiver / 7.0);
    }
  }

  // 4. Inicio suave de las terrazas orientales (+X) hacia la Montaña
  let mountainAscent = 0.0;
  if (x > 14.0 && z < -20.0) {
    const distEast = Math.min(1.0, (x - 14.0) / 16.0);
    mountainAscent = distEast * 2.8;
  }

  // 5. Micro-ondulación orgánica natural del suelo
  const organicNoise = (Math.sin(x * 0.09) * Math.cos(z * 0.08) * 0.35) +
    (Math.sin(x * 0.18 + z * 0.14) * 0.15);

  return (baseForestHeight + riverDepression + mountainAscent + organicNoise) * plazaTransition;
}
