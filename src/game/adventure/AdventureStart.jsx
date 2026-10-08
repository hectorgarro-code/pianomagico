import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Play, RotateCcw, X } from 'lucide-react';
import Model3DViewer from '../../modules/core/components/Model3DViewer';
import { getCharacterModel } from '../../modules/core/utils/characterModels';

const names = ['Knight', 'Mage', 'Barbarian', 'Rogue'];
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 hover:bg-white/10 disabled:opacity-50';

export default function AdventureStart({ phase, profile, canContinue, onPhase, onCharacter, onBegin, onContinue, onNewAdventure, onExit, onReset, debugEnabled = false }) {
  const [selected, setSelected] = useState(profile.avatarId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const confirm = async () => {
    setBusy(true); setError('');
    try { await onCharacter(selected); onPhase('INTRO'); }
    catch { setError('No se pudo guardar el personaje. Intenta otra vez.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-[100dvh] overflow-auto bg-zinc-950 text-white px-5 py-8 flex flex-col items-center justify-center gap-6">
    <button disabled={busy} onClick={onExit} title="Volver a perfiles" aria-label="Volver a perfiles" className="absolute right-5 top-5"><X size={22}/></button>
    <h1 className="text-2xl sm:text-3xl font-bold text-center">VALLE DE LAS NOTAS</h1>
    {phase === 'ENTRY' && <>
      <p>{profile.name}</p>
      {canContinue && <button className={buttonClass} onClick={onContinue}><Play size={18}/>Continuar</button>}
      <button className={buttonClass} onClick={() => onNewAdventure()}><Play size={18}/>Nueva Aventura</button>
    </>}
    {phase === 'CONFIRM_NEW' && <section role="alertdialog" aria-label="Comenzar una nueva aventura" className="max-w-lg text-center space-y-5">
      <p>Ya existe una aventura. ¿Quieres comenzar una nueva?</p>
      <p>Se reiniciara el progreso del Valle, pero conservaras tu progreso educativo.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button className={buttonClass} onClick={() => onPhase('ENTRY')}>Cancelar</button>
        <button className={buttonClass} onClick={() => onNewAdventure(true)}><Play size={18}/>Nueva Aventura</button>
      </div>
    </section>}
    {phase === 'CHARACTER' && <>
      <h2 className="text-lg">Elige tu personaje</h2>
      <div role="radiogroup" aria-label="Personaje" className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl">
        {names.map((name, index) => { const id = index + 1, model = getCharacterModel(id); return <div key={id} className={`rounded-lg border ${selected === id ? 'border-emerald-400 bg-emerald-950/30' : 'border-white/20'} overflow-hidden`}>
          <Model3DViewer modelUrl={model.file} animationName="Idle" scale={model.scale * 0.8} yOffset={-1.4} cameraDistance={6} className="h-40 sm:h-52 w-full"/>
          <button role="radio" aria-checked={selected === id} disabled={busy} onClick={() => setSelected(id)} className="w-full py-3 border-t border-white/20">{name}</button>
        </div>; })}
      </div>
      <div className="flex gap-3"><button disabled={busy} className={buttonClass} onClick={() => onPhase('ENTRY')}><ArrowLeft size={18}/>Volver</button><button disabled={busy} className={buttonClass} onClick={confirm}>{busy ? 'Guardando...' : 'Confirmar'}<ArrowRight size={18}/></button></div>
    </>}
    {phase === 'INTRO' && <>
      <div className="max-w-lg text-center space-y-4 leading-relaxed">
        <p>Hace mucho tiempo, la musica recorria todo el Valle.</p>
        <p>Ahora sus antiguos caminos permanecen en silencio.</p>
        <p>Explora el Valle, encuentra las notas perdidas y devuelve la musica a sus caminos.</p>
        <p>Tu aventura comienza en la Plaza de las Notas.</p>
      </div>
      <button className={buttonClass} onClick={onBegin}><Play size={18}/>Comenzar</button>
    </>}
    {error && <p role="alert" className="text-red-300">{error}</p>}
    {debugEnabled && import.meta.env.DEV && <details className="text-xs text-zinc-400 max-w-lg w-full"><summary className="cursor-pointer">Desarrollo</summary>
      <div className="flex flex-wrap gap-3 mt-3">
        <button onClick={() => onPhase('CHARACTER')}>Seleccionar personaje</button>
        <button onClick={onBegin}>Saltar intro</button>
        <button onClick={() => setConfirmReset(true)} className="inline-flex items-center gap-1"><RotateCcw size={14}/>Reiniciar aventura / Nueva Aventura</button>
      </div>
      {confirmReset && <div role="alertdialog" aria-label="Reiniciar aventura" className="mt-3 border border-red-400 p-3 space-y-3">
        <p>Se reinician solo los cofres y objetivos del Valle. XP, interpretaciones, medallas y personaje se conservan.</p>
        <button onClick={() => { onReset(); setConfirmReset(false); }}>Confirmar reinicio</button><button onClick={() => setConfirmReset(false)} className="ml-4">Cancelar</button>
      </div>}
    </details>}
  </main>;
}
