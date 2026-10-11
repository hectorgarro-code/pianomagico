const base = `${import.meta.env?.BASE_URL || '/'}backend/api.php`;
export async function loadPianoLessons(userId = '') {
  const response = await fetch(`${base}?action=get_songs&user_id=${encodeURIComponent(userId)}&instrument=piano`);
  const data = await response.json();
  if (!response.ok || !Array.isArray(data)) throw new Error('No se pudo cargar el catalogo real de piano');
  return data;
}
export function lessonForActivity(activity, lessons) {
  return lessons.find(l => String(l.id) === String(activity.lessonId ?? activity.activityId ?? activity.lessonRef));
}
export function lessonBadgeData(object, song, state, near = false) {
  if (!song) return null;
  const names = { C: 'DO', D: 'RE', E: 'MI', F: 'FA', G: 'SOL', A: 'LA', B: 'SI', R: 'Silencio' };
  const sequence = Array.isArray(song.sequence) ? song.sequence : [];
  const notes = sequence.slice(0, 5).map(n => { const match = /^([A-GR])(#?)(\d*)/.exec(n); return match ? names[match[1]] + match[2] + match[3] : ''; });
  return { title: `${state === 'COMPLETED' ? '\u2713' : '\u266a'} ${song.title}`, state,
    subtitle: near ? `${notes.filter(Boolean).join(' \u2192 ')}${sequence.length > 5 ? ' ...' : ''}` : '',
    action: near ? state === 'LOCKED' ? 'Bloqueado' : state === 'COMPLETED' ? 'E - Practicar' : 'E - Abrir' : '' };
}
