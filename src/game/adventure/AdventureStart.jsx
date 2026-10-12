import { useState } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';
import ValleyScene from '../presentation/ValleyScene.jsx';
import { ValleyTitle, ValleyButton, ValleyPanel } from '../presentation/ValleyUI.jsx';
import { readEquipment } from '../presentation/characterEquipment.js';
import VisualCustomizer from '../presentation/VisualCustomizer.jsx';

export default function AdventureStart({ phase, profile, onPhase, onCharacter, onBegin, onNewAdventure, onExit, onReset, debugEnabled = false, sharedEntry = false, gameplay }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const selector = phase === 'CHARACTER' || phase === 'ENTRY';
  if(selector)return <VisualCustomizer profile={profile} gameplay={gameplay} onSelect={onCharacter} onConfirm={async(c,e,p)=>{await onCharacter(c,e,p);onBegin();}} confirmLabel="JUGAR" onClose={onExit}/>;
  return <main className={`valley-menu ${sharedEntry ? 'entry-adventure-screen' : ''}`}>
    {!sharedEntry && <ValleyScene characterId={phase === 'ENTRY' ? profile.avatarId : null} equipment={readEquipment(profile.user_id ?? profile.id, profile.avatarId)} autoDemo={false}/>}
    <button onClick={onExit} title="Volver a perfiles" aria-label="Volver a perfiles" className="valley-exit"><X size={22}/></button>
    {phase === 'CONFIRM_NEW' && <div className="valley-center-layout"><ValleyTitle/><ValleyPanel role="alertdialog" aria-label="Comenzar una nueva aventura" className="valley-intro">
      <p>Ya existe una aventura. ¿Quieres comenzar una nueva?</p><p>Se reiniciara el progreso del Valle, pero conservaras tu progreso educativo.</p>
      <div className="valley-lesson-actions"><ValleyButton tone="dark" onClick={() => onPhase('ENTRY')}>Cancelar</ValleyButton><ValleyButton onClick={() => onNewAdventure(true)}><Play size={18}/>Nueva Aventura</ValleyButton></div>
    </ValleyPanel></div>}
    {phase === 'INTRO' && <div className="valley-center-layout"><ValleyTitle/><ValleyPanel className="valley-intro">
      <p>Hace mucho tiempo, la musica recorria todo el Valle.</p><p>Ahora sus antiguos caminos permanecen en silencio.</p>
      <p>Explora el Valle, encuentra las notas perdidas y devuelve la musica a sus caminos.</p><p>Tu aventura comienza en la Plaza de las Notas.</p>
      <ValleyButton onClick={onBegin}><Play size={20}/>Comenzar</ValleyButton>
    </ValleyPanel></div>}
    {debugEnabled && import.meta.env.DEV && <details className="valley-dev"><summary>Desarrollo</summary>
      <div className="flex gap-3"><button onClick={() => onPhase('CHARACTER')}>Seleccionar personaje</button><button onClick={onBegin}>Saltar intro</button><button onClick={() => setConfirmReset(true)}><RotateCcw size={14}/>Reiniciar aventura / Nueva Aventura</button></div>
      {confirmReset && <div role="alertdialog" aria-label="Reiniciar aventura"><p>Se reinician solo los cofres y objetivos del Valle. XP, interpretaciones, medallas y personaje se conservan.</p><button onClick={() => { onReset(); setConfirmReset(false); }}>Confirmar reinicio</button><button onClick={() => setConfirmReset(false)}>Cancelar</button></div>}
    </details>}
  </main>;
}
