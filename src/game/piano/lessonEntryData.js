import { ADVENTURE_OBJECT_TYPES } from '../world/composition/forestAdventureComposition.js';
import { FINAL_CHALLENGE } from '../world/composition/finalAdventureComposition.js';

export function lessonEntryData(object, song, sequence = [], displayName = note => note) {
  const secret = object.type === ADVENTURE_OBJECT_TYPES.SECRET_REWARD;
  const variant = secret ? 'SECRET' : object.type === ADVENTURE_OBJECT_TYPES.PRACTICE_STATION ? 'PRACTICE'
    : object.id === FINAL_CHALLENGE.id ? 'FINAL_CHALLENGE' : object.type === ADVENTURE_OBJECT_TYPES.CHALLENGE ? 'CHALLENGE' : 'LESSON';
  const notes = sequence.filter(note => typeof note === 'string' && /^([A-G]#?\d*|R)(:\d+(\.\d+)?)?$/.test(note) && Number(note.split(':')[1] || 1) > 0);
  const title = secret ? object.label : song?.title || object.label;
  return { variant, title,
    number: secret || /^\s*\d+\s*[.)]/.test(title || '') ? null : song?.order_index ?? song?.id,
    labels: notes.slice(0, 8).map(note => note.startsWith('R') ? 'Silencio' : displayName(note.split(':')[0])),
    totalNotes: notes.length, more: notes.length > 8,
    description: song?.description || (notes.length ? `${notes.length} notas y silencios` : ''),
    canPreview: !secret && notes.length > 0 && notes.length === sequence.length,
    notes };
}
