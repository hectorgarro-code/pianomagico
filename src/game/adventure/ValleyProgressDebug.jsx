import React, { useState } from 'react';
import { RotateCcw, Check, Unlock, Download } from 'lucide-react';
import { REGION_IDS, VALLEY_REGIONS } from './valleyBlueprint.js';
import { getValleyProgress } from './valleyProgression.js';

export default function ValleyProgressDebug({ adventure, onEvent, onReset, onExportPlaytest }) {
  const [playtestJson, setPlaytestJson] = useState('');
  const progress = getValleyProgress(adventure);
  const enter = region => onEvent({ type: 'REGION_DISCOVERED', regionId: region.id });
  const complete = region => {
    enter(region);
    for (const requirement of region.regionCompletionRequirements) {
      if (requirement.type === 'MILESTONE') onEvent({ type: 'MILESTONE_REACHED', id: requirement.id });
    }
  };
  return <details className="absolute bottom-16 right-3 z-50 w-[min(360px,calc(100%-1.5rem))] max-h-[60dvh] overflow-auto border border-white/20 rounded bg-zinc-950/95 p-3 text-xs">
    <summary className="cursor-pointer">Progresion del Valle (DEV)</summary>
    <button onClick={() => setPlaytestJson(onExportPlaytest?.() || '')} title="Exportar playtest JSON" aria-label="Exportar playtest JSON" className="my-2"><Download size={18}/></button>
    {playtestJson && <textarea aria-label="Registro de playtest JSON" readOnly value={playtestJson} onFocus={event => event.target.select()} className="block w-full h-40 resize-y bg-zinc-900 text-white p-2 text-xs font-mono" />}
    <dl className="my-2 space-y-1">
      <dt>Current Region</dt><dd>{progress.currentRegion}</dd>
      <dt>Discovered Regions</dt><dd>{progress.discoveredRegions.join(', ')}</dd>
      <dt>Completed Regions</dt><dd>{progress.completedRegions.join(', ') || '-'}</dd>
      <dt>Available Regions</dt><dd>{progress.availableRegions.join(', ')}</dd>
      <dt>Current Objective</dt><dd>{progress.currentObjective.text}</dd>
      <dt>Valley Completed</dt><dd>{String(progress.valleyCompleted)}</dd>
    </dl>
    <div>Chest States</div>{Object.entries(adventure.entries).map(([id, entry]) => <div key={id}>{id}: {entry.state}</div>)}
    <div className="mt-2">Gate States</div>{Object.entries(progress.gates).map(([id, state]) => <div key={id}>{id}: {state}</div>)}
    <div className="mt-2 space-y-2">{VALLEY_REGIONS.filter(region => ![REGION_IDS.PLAZA, REGION_IDS.FOREST, REGION_IDS.GROTTO].includes(region.id)).map(region => <div key={region.id} className="flex items-center justify-between gap-2">
      <span>{region.name}</span>
      <div className="flex shrink-0 gap-2">
        <button disabled={!progress.availableRegions.includes(region.id)} onClick={() => enter(region)} title={`Descubrir ${region.name}`} aria-label={`Descubrir ${region.name}`} className="disabled:opacity-30"><Unlock size={16}/></button>
        <button disabled={!progress.availableRegions.includes(region.id)} onClick={() => complete(region)} title={`Simular completion: ${region.name}`} aria-label={`Simular completion: ${region.name}`} className="disabled:opacity-30"><Check size={16}/></button>
      </div>
    </div>)}</div>
    <button onClick={() => { if (window.confirm('Reiniciar solamente Adventure para este perfil? El progreso educativo se conserva.')) onReset(); }} title="Reiniciar Adventure" aria-label="Reiniciar Adventure" className="mt-3"><RotateCcw size={16}/></button>
  </details>;
}
