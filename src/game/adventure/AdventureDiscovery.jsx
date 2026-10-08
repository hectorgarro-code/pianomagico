import { Play, X } from 'lucide-react';
import { ADVENTURE_STATES } from './adventureState.js';

export default function AdventureDiscovery({ object, song, state, onStart, onClose }) {
  const locked = state === ADVENTURE_STATES.LOCKED;
  return <div className="absolute inset-0 z-50 grid place-items-center bg-black/45 p-4">
    <section role="dialog" aria-modal="true" aria-labelledby="chest-title" className="relative w-full max-w-sm rounded-lg border border-white/25 bg-zinc-900 p-6 shadow-xl">
      <button onClick={onClose} aria-label="Volver a explorar" title="Volver a explorar" className="absolute right-3 top-3 p-2"><X size={18}/></button>
      <p className="text-xs text-emerald-300">{object.label} · Cofre de lección</p>
      <h2 id="chest-title" className="mt-3 text-xl font-bold">{locked ? 'Cofre cerrado' : state === ADVENTURE_STATES.COMPLETED ? 'Lección completada' : 'Has descubierto una lección'}</h2>
      <p className="my-4 text-sm text-zinc-200">{locked ? 'Completa la lección anterior para abrir este cofre.' : song?.title || 'Esta lección no está disponible en el catálogo actual.'}</p>
      {!locked && song && <button onClick={onStart} className="flex items-center gap-2 rounded border border-emerald-400 bg-emerald-700 px-4 py-2 text-sm font-bold"><Play size={16}/>{state === ADVENTURE_STATES.COMPLETED ? 'Practicar de nuevo' : 'Comenzar'}</button>}
    </section>
  </div>;
}
