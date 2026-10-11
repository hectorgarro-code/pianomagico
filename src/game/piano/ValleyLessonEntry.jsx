import { useEffect, useRef, useState } from 'react';
import { Play, Volume2, Square, X, Music2, Trophy, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { getSequenceArray, getNoteFrequency, getNoteDisplayName, getIntervalMs } from '../../modules/piano-magico/PianoMagico.jsx';
import { playPianoTone } from '../../modules/piano-magico/pianoTone.js';
import { ValleyPanel, ValleyButton } from '../presentation/ValleyUI.jsx';
import { lessonEntryData } from './lessonEntryData.js';

export default function ValleyLessonEntry({ object, song, state = 'AVAILABLE', onStart, onClose, onClaimSecret }) {
  const data = lessonEntryData(object, song, getSequenceArray(song?.sequence), getNoteDisplayName);
  const locked = state === 'LOCKED', completed = state === 'COMPLETED', secret = data.variant === 'SECRET';
  const audio = useRef(null), timers = useRef([]), oscillators = useRef([]);
  const [playing, setPlaying] = useState(false), [error, setError] = useState('');
  const disposePreview = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    for (const oscillator of oscillators.current) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    oscillators.current = []; void audio.current?.close().catch(() => {}); audio.current = null;
  };
  useEffect(() => () => disposePreview(), []);
  const stop = () => { disposePreview(); setPlaying(false); };
  const listen = async () => {
    if (audio.current) { stop(); return; }
    setError('');
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      const context = new Context(); audio.current = context; await context.resume();
      if (audio.current !== context) return;
      setPlaying(true); let accumulated = 0;
      const interval = getIntervalMs(song.speed);
      for (const note of data.notes) {
        const [pitch, rawDuration] = note.split(':'), duration = Number(rawDuration || 1);
        const milliseconds = interval * duration;
        if (!Number.isFinite(milliseconds) || milliseconds <= 0) throw new Error('Invalid duration');
        timers.current.push(setTimeout(() => {
          if (audio.current !== context || pitch === 'R') return;
          const oscillator = playPianoTone(context, getNoteFrequency(/\d/.test(pitch) ? pitch : pitch + '4'), 'triangle', .16, milliseconds / 1000 * .9);
          if (oscillator) oscillators.current.push(oscillator);
        }, accumulated));
        accumulated += milliseconds;
      }
      timers.current.push(setTimeout(stop, accumulated));
    } catch { stop(); setError('No se pudo reproducir el ejemplo.'); }
  };
  const labels = { LESSON: 'Cofre de leccion', PRACTICE: 'Practica libre', CHALLENGE: 'Desafio musical', FINAL_CHALLENGE: 'Desafio final del Valle', SECRET: 'Recuerdo secreto' };
  const Icon = secret ? Sparkles : data.variant.includes('CHALLENGE') ? Trophy : data.variant === 'PRACTICE' ? BookOpen : Music2;
  return <div className="valley-lesson-backdrop"><ValleyPanel role="dialog" aria-modal="true" aria-labelledby="valley-lesson-title" className="valley-lesson">
    <button onClick={() => { stop(); onClose(); }} title="Volver a explorar" aria-label="Volver a explorar" className="valley-lesson-close"><X size={20}/></button>
    <p className="valley-lesson-kicker"><Icon size={22}/>{labels[data.variant]}</p>
    <h2 id="valley-lesson-title">{data.number != null && `${data.number}. `}{data.title}</h2>
    {locked ? <p>Completa las actividades anteriores para continuar.</p> : secret ? <p>{completed ? 'Eco descubierto' : 'Este recuerdo del Valle pertenece a tu aventura.'}</p> : <>
      {data.description && <p>{data.description}</p>}
      {data.labels.length > 0 && <div className="valley-lesson-notes">{data.labels.map((note, index) => <span key={index} className="contents"><span className="valley-note">{note}</span>{index < data.labels.length - 1 && <ArrowRight size={15}/>}</span>)}{data.more && <span>...</span>}</div>}
    </>}
    <div className="valley-lesson-actions">
      {!locked && data.canPreview && <ValleyButton tone="violet" onClick={listen}>{playing ? <Square size={20}/> : <Volume2 size={20}/>} {playing ? 'Detener ejemplo' : 'Escuchar ejemplo'}</ValleyButton>}
      {!locked && !secret && song && <ValleyButton onClick={() => { stop(); onStart(); }}><Play size={20}/>{completed ? 'Practicar de nuevo' : 'Comenzar leccion'}</ValleyButton>}
      {!locked && secret && !completed && <ValleyButton onClick={onClaimSecret}><Sparkles size={20}/>Descubrir el eco</ValleyButton>}
    </div>
    {!secret && !song && <p role="alert">Esta actividad no esta disponible en el catalogo actual.</p>}
    {error && <p role="alert">{error}</p>}
  </ValleyPanel></div>;
}
