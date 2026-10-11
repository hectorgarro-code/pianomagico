import { useState } from 'react';
import { ArrowRight, ArrowLeft, Play, Pause, RotateCcw, X, ChevronLeft, ChevronRight, Sparkles, WandSparkles } from 'lucide-react';
import ValleyScene from '../presentation/ValleyScene.jsx';
import { ValleyTitle, ValleyButton, ValleyPanel } from '../presentation/ValleyUI.jsx';
import { rotateShowcase } from '../presentation/characterActions.js';
import { EQUIPMENT, readEquipment } from '../presentation/characterEquipment.js';

const names = ['Knight', 'Mage', 'Barbarian', 'Rogue', 'Ranger'];
export default function AdventureStart({ phase, profile, canContinue, onPhase, onCharacter, onBegin, onContinue, onNewAdventure, onExit, onReset, debugEnabled = false }) {
  const [selected, setSelected] = useState(profile.avatarId);
  const [rotation, setRotation] = useState(0), [action, setAction] = useState(null);
  const [equipment, setEquipment] = useState(() => readEquipment(profile.user_id ?? profile.id, profile.avatarId));
  const [autoDemo, setAutoDemo] = useState(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirmReset, setConfirmReset] = useState(false);
  const confirm = async () => {
    setBusy(true); setError('');
    try { await onCharacter(selected, equipment); onPhase('INTRO'); }
    catch { setError('No se pudo guardar el personaje. Intenta otra vez.'); }
    finally { setBusy(false); }
  };
  const expression = key => setAction({ key, token: performance.now() });
  const selector = phase === 'CHARACTER';
  return <main className={`valley-menu ${selector ? 'valley-character-menu' : ''}`}>
    <ValleyScene characterId={selector ? selected : phase === 'ENTRY' ? profile.avatarId : null} showcase={selector} rotation={rotation} action={action} equipment={selector ? equipment : readEquipment(profile.user_id ?? profile.id, profile.avatarId)} autoDemo={selector && autoDemo}/>
    <button disabled={busy} onClick={onExit} title="Volver a perfiles" aria-label="Volver a perfiles" className="valley-exit"><X size={22}/></button>
    {phase === 'ENTRY' && <div className="valley-entry-layout">
      <ValleyTitle />
      <div className="valley-entry-options"><p className="valley-entry-profile">{profile.name}{profile.total_score != null && <span className="block text-sm text-amber-200">{Number(profile.total_score) || 0} XP</span>}</p>
        {canContinue && <ValleyButton onClick={onContinue}><Play size={24}/>Continuar</ValleyButton>}
        <ValleyButton tone="gold" onClick={() => onNewAdventure()}><Sparkles size={24}/>Nueva Aventura</ValleyButton>
        <ValleyButton tone="dark" onClick={onExit}><ArrowLeft size={18}/>Cambiar de perfil</ValleyButton>
      </div>
    </div>}
    {phase === 'CONFIRM_NEW' && <div className="valley-center-layout"><ValleyTitle/><ValleyPanel role="alertdialog" aria-label="Comenzar una nueva aventura" className="valley-intro">
      <p>Ya existe una aventura. ¿Quieres comenzar una nueva?</p><p>Se reiniciara el progreso del Valle, pero conservaras tu progreso educativo.</p>
      <div className="valley-lesson-actions"><ValleyButton tone="dark" onClick={() => onPhase('ENTRY')}>Cancelar</ValleyButton><ValleyButton onClick={() => onNewAdventure(true)}><Play size={18}/>Nueva Aventura</ValleyButton></div>
    </ValleyPanel></div>}
    {selector && <div className="valley-character-layout">
      <h2>Elige tu personaje</h2>
      <div className="valley-character-options">
        <div role="radiogroup" aria-label="Personaje" className="valley-character-list">{names.map((name, index) => <button key={name} role="radio" aria-checked={selected === index + 1} disabled={busy} onClick={() => { setSelected(index + 1); setEquipment(readEquipment(profile.user_id ?? profile.id, index + 1)); setAction(null); }}>{name}</button>)}</div>
        <label className="valley-equipment">Armas<select aria-label="Armas" disabled={busy} value={equipment} onChange={event => setEquipment(event.target.value)}>{(EQUIPMENT[selected] || EQUIPMENT[1]).map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="valley-character-footer">
        <ValleyButton disabled={busy} tone="dark" onClick={() => onPhase('ENTRY')}><ArrowLeft size={18}/>Volver</ValleyButton>
        <div className="valley-character-tools">
          <button onClick={() => setAutoDemo(value => !value)} aria-pressed={autoDemo} title={autoDemo ? 'Pausar demostracion' : 'Reproducir demostracion'} aria-label={autoDemo ? 'Pausar demostracion' : 'Reproducir demostracion'}>{autoDemo ? <Pause/> : <Play/>}</button>
          <button onClick={() => setRotation(value => rotateShowcase(value, -.6))} title="Girar a la izquierda" aria-label="Girar a la izquierda"><ChevronLeft/></button>
          <button onClick={() => expression('Q')} title="Accion Q" aria-label="Accion Q"><Sparkles/></button>
          <button onClick={() => expression('E')} title="Accion E" aria-label="Accion E"><WandSparkles/></button>
          <button onClick={() => setRotation(value => rotateShowcase(value, .6))} title="Girar a la derecha" aria-label="Girar a la derecha"><ChevronRight/></button>
        </div>
        <ValleyButton disabled={busy} onClick={confirm}>{busy ? 'Guardando...' : 'Confirmar'}<ArrowRight size={18}/></ValleyButton>
      </div>
    </div>}
    {phase === 'INTRO' && <div className="valley-center-layout"><ValleyTitle/><ValleyPanel className="valley-intro">
      <p>Hace mucho tiempo, la musica recorria todo el Valle.</p><p>Ahora sus antiguos caminos permanecen en silencio.</p>
      <p>Explora el Valle, encuentra las notas perdidas y devuelve la musica a sus caminos.</p><p>Tu aventura comienza en la Plaza de las Notas.</p>
      <ValleyButton onClick={onBegin}><Play size={20}/>Comenzar</ValleyButton>
    </ValleyPanel></div>}
    {error && <p role="alert" className="valley-menu-error">{error}</p>}
    {debugEnabled && import.meta.env.DEV && <details className="valley-dev"><summary>Desarrollo</summary>
      <div className="flex gap-3"><button onClick={() => onPhase('CHARACTER')}>Seleccionar personaje</button><button onClick={onBegin}>Saltar intro</button><button onClick={() => setConfirmReset(true)}><RotateCcw size={14}/>Reiniciar aventura / Nueva Aventura</button></div>
      {confirmReset && <div role="alertdialog" aria-label="Reiniciar aventura"><p>Se reinician solo los cofres y objetivos del Valle. XP, interpretaciones, medallas y personaje se conservan.</p><button onClick={() => { onReset(); setConfirmReset(false); }}>Confirmar reinicio</button><button onClick={() => setConfirmReset(false)}>Cancelar</button></div>}
    </details>}
  </main>;
}
