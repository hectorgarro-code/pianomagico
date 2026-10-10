import { Compass } from 'lucide-react';

export default function ValleyEnding({ onContinue }) {
  return <div role="dialog" aria-modal="true" aria-labelledby="valley-ending-title"
    className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-zinc-950/80 px-6 text-center">
    <h1 id="valley-ending-title" className="text-3xl font-bold">VALLE DE LAS NOTAS</h1>
    <p className="max-w-lg text-xl">¡La música volvió a resonar en el Valle!</p>
    <p className="text-sm text-zinc-200">Has completado tu aventura.</p>
    <button autoFocus onClick={onContinue} className="flex items-center gap-2 rounded border border-emerald-300 bg-emerald-700 px-5 py-3 font-bold"><Compass size={18}/>Continuar explorando</button>
  </div>;
}
