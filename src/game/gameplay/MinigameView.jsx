import { useEffect, useRef, useState } from 'react';
import { Play, Volume2, RotateCcw, X, Music2 } from 'lucide-react';
import { playPianoTone } from '../../modules/piano-magico/pianoTone.js';
import { getNoteFrequency, getNoteDisplayName } from '../../modules/piano-magico/PianoMagico.jsx';
import { ValleyButton } from '../presentation/ValleyUI.jsx';
import { createMiniSession, miniAnswer, rhythmResult } from './minigameEngine.js';

export default function MinigameView({ definition, onClose, onComplete }) {
  const [session,setSession]=useState(()=>createMiniSession(definition));
  const sessionRef=useRef(session); sessionRef.current=session;
  const [phase,setPhase]=useState('READY'),[shown,setShown]=useState(''),[error,setError]=useState('');
  const audio=useRef(null),timers=useRef([]),nodes=useRef([]),done=useRef(false);
  const cleanup=()=>{timers.current.forEach(clearTimeout);timers.current=[];nodes.current.forEach(node=>{try{node.stop();}catch{}});nodes.current=[];};
  useEffect(()=>()=>{cleanup();void audio.current?.close().catch(()=>{});},[]);
  const tone=note=>{const node=playPianoTone(audio.current,getNoteFrequency(note),'triangle',.14,.42);if(node)nodes.current.push(node);};
  const finish=success=>{cleanup();setShown('');setPhase(success?'SUCCESS':'FAILED');};
  const listen=async()=>{
    cleanup();setError('');
    try {
      const context=audio.current || new (window.AudioContext || window.webkitAudioContext)();audio.current=context;await context.resume();
      setPhase('LISTEN');
      if(definition.type==='RHYTHM') {
        const start=performance.now()+2000, beat=60000/definition.configuration.bpm;
        const next={...sessionRef.current,startedAt:start,taps:[]};setSession(next);
        timers.current.push(setTimeout(()=>setPhase('ANSWER'),1900));
        for(const offset of next.pattern) timers.current.push(setTimeout(()=>{tone('C5');setShown('Pulso');timers.current.push(setTimeout(()=>setShown(''),150));},2000+offset*beat));
        timers.current.push(setTimeout(()=>finish(rhythmResult(sessionRef.current,definition.configuration)),2000+(Math.max(...next.pattern)+1)*beat));
      } else {
        const sequence=sessionRef.current.questions[sessionRef.current.round];
        const visual=definition.type==='NOTE_RECOGNITION' && definition.configuration.presentationMode==='visual';
        sequence.forEach((note,i)=>timers.current.push(setTimeout(()=>{tone(note);setShown(definition.type==='NOTE_RECOGNITION'?(visual?note:'Escucha'):getNoteDisplayName(note));},i*650)));
        timers.current.push(setTimeout(()=>{if(!visual)setShown('');setPhase('ANSWER');},sequence.length*650));
      }
    } catch {setError('No se pudo reproducir el sonido. Reintenta.');setPhase('READY');}
  };
  const answer=note=>{
    if(phase!=='ANSWER')return;
    if(definition.type==='RHYTHM') {const next={...sessionRef.current,taps:[...sessionRef.current.taps,performance.now()]};sessionRef.current=next;setSession(next);return;}
    tone(note);const next=miniAnswer(sessionRef.current,note);sessionRef.current=next;setSession(next);
    if(next.status==='FAILED')finish(false);
    else if(next.status==='SUCCESS')finish(true);
    else if(next.status==='NEXT'){setShown('');setPhase('READY');}
  };
  useEffect(()=>{const key=e=>{if(e.code==='Space' && definition.type==='RHYTHM' && phase==='ANSWER'){e.preventDefault();answer();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[phase]);
  return <div className="gameplay-overlay"><section className="gameplay-panel" role="dialog" aria-modal="true" aria-label={definition.name}>
    <button className="gameplay-close" onClick={onClose} title="Volver al mundo" aria-label="Volver al mundo"><X/></button>
    <p className="gameplay-kicker"><Music2 size={20}/>Desafio musical</p><h2>{definition.name}</h2>
    <div className="mini-display" aria-live="polite">{shown || (phase==='SUCCESS'?'Desafio completado':phase==='FAILED'?'Prueba otra vez':phase==='ANSWER'?'Tu turno':definition.type==='RHYTHM'?'Sigue el pulso':`Ronda ${session.round+1} / ${session.questions.length}`)}</div>
    {phase==='READY' && <ValleyButton onClick={listen}><Volume2/>Escuchar</ValleyButton>}
    {phase==='ANSWER' && (definition.type==='RHYTHM'?<button className="rhythm-pad" onPointerDown={e=>{e.preventDefault();answer();}}>Tocar</button>:<div className="mini-notes">{(session.choices?.[session.round] || definition.configuration.notePool).map((note,i)=><button key={note} style={{'--note-color':['#f0646a','#eeaa39','#dfcc40','#45b986','#5cbada'][i%5]}} onClick={()=>answer(note)}>{getNoteDisplayName(note)}</button>)}</div>)}
    {phase==='FAILED' && <ValleyButton onClick={()=>{setSession(createMiniSession(definition));setPhase('READY');}}><RotateCcw/>Reintentar</ValleyButton>}
    {phase==='SUCCESS' && <ValleyButton onClick={()=>{if(!done.current){done.current=true;onComplete(definition.id);}}}><Play/>Continuar aventura</ValleyButton>}
    {error && <p role="alert">{error}</p>}
  </section></div>;
}
