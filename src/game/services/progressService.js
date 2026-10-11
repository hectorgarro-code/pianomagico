/**
 * progressService.js
 * Capa de adaptación que conecta el estado del juego con la API existente (backend/api.php).
 * No modifica ni duplica endpoints; provee métodos limpios y desacoplados.
 */

import { normalizeGameProfile } from './profileAdapter.js';
import { adventurePersistence } from './adventurePersistence.js';
import { loadPianoLessons } from '../content/lessonRepository.js';
const API_BASE = 'backend/api.php';

export const progressService = {
  async selectCharacter(userId, avatarId) {
    if (!userId || ![1, 2, 3, 4, 5].includes(avatarId)) throw new Error('Invalid character');
    const res = await fetch(`${API_BASE}?action=update_profile`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, avatarId, avatarOnly: true })
    });
    const result = await res.json();
    if (!res.ok || result.error || result.message !== 'Profile updated') throw new Error('Character not saved');
    try { globalThis.localStorage?.setItem(`user_avatar_${userId}`, avatarId); } catch { /* Backend remains authoritative when storage is disabled. */ }
    return this.getProfile(userId);
  },
  loadAdventure: userId => adventurePersistence.load(userId),
  saveAdventure: (userId, state) => adventurePersistence.save(userId, state),
  /**
   * Obtiene el perfil del usuario.
   */
  async getProfile(userId) {
    if (!userId) return null;
    const res = await fetch(`${API_BASE}?action=get_profile&user_id=${userId}`);
    if (!res.ok) throw new Error('Error al cargar perfil');
    const data = await res.json();
    let preferredAvatar;
    try { preferredAvatar = globalThis.localStorage?.getItem(`user_avatar_${userId}`) ?? undefined; } catch { /* Storage can be disabled. */ }
    return normalizeGameProfile(data, preferredAvatar);
  },

  /**
   * Actualiza el perfil y XP total.
   */
  async updateProfile(userId, name, avatarId, totalScore) {
    if (!userId) return;
    const res = await fetch(`${API_BASE}?action=update_profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name, avatarId, totalScore })
    });
    return await res.json();
  },

  /**
   * Obtiene el catálogo de canciones/lecciones para el instrumento.
   */
  async getSongs(userId, instrument = 'piano') {
    if (instrument === 'piano') return loadPianoLessons(userId || '');
    const res = await fetch(`${API_BASE}?action=get_songs&user_id=${userId || ''}&instrument=${instrument}`);
    if (!res.ok) throw new Error('Error al cargar canciones');
    return await res.json();
  },

  /**
   * Obtiene las interpretaciones previas del usuario.
   */
  async getUserPerformances(userId) {
    if (!userId) return [];
    const res = await fetch(`${API_BASE}?action=get_performances&user_id=${userId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  /**
   * Obtiene las medallas de memoria obtenidas.
   */
  async getMemoryMedals(userId) {
    if (!userId) return [];
    const res = await fetch(`${API_BASE}?action=get_medals&user_id=${userId}`);
    if (!res.ok) return [];
    return await res.json();
  },

  /**
   * Registra una lección completada/performance musical.
   */
  async savePerformance(userId, songId, performanceLog, score) {
    if (!userId || !songId) return;
    const res = await fetch(`${API_BASE}?action=save_performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        songId,
        performanceLog,
        score
      })
    });
    return await res.json();
  },

  /**
   * Registra medalla de memoria al tocar una lección perfecta.
   */
  async unlockMedal(userId, songId) {
    if (!userId || !songId) return;
    const res = await fetch(`${API_BASE}?action=unlock_medal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, songId })
    });
    return await res.json();
  }
};
