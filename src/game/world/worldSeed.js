/**
 * worldSeed.js
 * Generador de números pseudo-aleatorios determinista (PRNG) basado en Mulberry32.
 * Garantiza que la misma semilla ('VALLE_DE_LAS_NOTAS_V1') genere exactamente la misma distribución.
 */

export const DEFAULT_WORLD_SEED = 'VALLE_DE_LAS_NOTAS_V1';

/**
 * Convierte un string en un entero de 32 bits para inicializar el PRNG.
 * @param {string} str
 * @returns {number}
 */
export function hashString(str) {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

/**
 * Crea una función generadora pseudo-aleatoria determinista en el rango [0, 1).
 * @param {string|number} seed
 * @returns {() => number}
 */
export function createRNG(seed = DEFAULT_WORLD_SEED) {
  let s = typeof seed === 'number' ? seed >>> 0 : hashString(seed);

  return function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Genera un número flotante en el rango [min, max).
 */
export function randomRange(rng, min, max) {
  return min + rng() * (max - min);
}

/**
 * Genera un número entero en el rango [min, max] inclusive.
 */
export function randomInt(rng, min, max) {
  return Math.floor(min + rng() * (max - min + 1));
}

/**
 * Selecciona un elemento al azar de un arreglo de forma determinista.
 */
export function randomChoice(rng, array) {
  if (!array || array.length === 0) return null;
  const index = Math.floor(rng() * array.length);
  return array[index];
}
