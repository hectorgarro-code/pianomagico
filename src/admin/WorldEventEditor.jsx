import {Plus,Trash2,Play,Music2} from 'lucide-react';
import {createWorldEvent} from './worldEventAuthoring.js';
import {EXPLORATION_MECHANISMS} from '../game/world/composition/explorationSecrets.js';

export function WorldEventFields({event,content,onChange}) {
  return <><label>Nombre<input maxLength={80} value={event.name} onChange={e=>onChange({name:e.target.value})}/></label>
    <label>Disparador<select value={event.trigger} onChange={e=>onChange({trigger:e.target.value,sourceId:e.target.value==='NEAR_PLAYER'?null:e.target.value==='TARGET_DEFEATED'?content.worldActions.find(t=>t.enabledInWorld&&!t.firstMinutesOnly)?.id||null:EXPLORATION_MECHANISMS[0].id})}><option value="NEAR_PLAYER">Acercarse</option><option value="TARGET_DEFEATED">Destruir objeto / derrotar criatura</option><option value="WORLD_MECHANISM_COMPLETED">Completar mecanismo de runas</option></select></label>
    {event.trigger!=='NEAR_PLAYER'&&<label>Fuente<select value={event.sourceId||''} onChange={e=>onChange({sourceId:e.target.value})}><option value="" disabled>Seleccionar fuente</option>{(event.trigger==='TARGET_DEFEATED'?content.worldActions.filter(t=>t.enabledInWorld&&!t.firstMinutesOnly):EXPLORATION_MECHANISMS).map(t=><option key={t.id} value={t.id}>{t.id}</option>)}</select></label>}
    <label>Nota<select value={event.pitch} onChange={e=>onChange({pitch:e.target.value})}>{['C','D','E','F','G','A','B'].flatMap(n=>[3,4,5,6].map(o=><option key={n+o}>{n+o}</option>))}</select></label>
    <label>Notas Perdidas<input type="number" min="1" max="3" value={event.noteCount} onChange={e=>onChange({noteCount:Number(e.target.value)})}/></label>
    <label>Radio de revelacion<input type="number" min="2" max="10" step=".5" value={event.revealRadius} onChange={e=>onChange({revealRadius:Number(e.target.value)})}/></label>
    <label>Secreto<input type="checkbox" checked={event.secret} onChange={e=>onChange({secret:e.target.checked})}/></label><label>Activo<input type="checkbox" checked={event.enabled} onChange={e=>onChange({enabled:e.target.checked})}/></label>
  </>;
}
export default function WorldEventEditor({content,onChange,onTest}) {
  const edit=(id,patch)=>onChange(c=>({...c,worldEvents:(c.worldEvents||[]).map(e=>e.id===id?{...e,...patch}:e)}));
  return <><button onClick={()=>onChange(c=>({...c,worldEvents:[...(c.worldEvents||[]),createWorldEvent(c.world[0].regionId,[6,0,5])]}))}><Plus size={18}/>Crear evento</button>
    {(content.worldEvents||[]).map(event=><section className="admin-record" key={event.id}><div className="admin-toolbar"><h2><Music2 size={18}/>{event.name}</h2><button disabled={!!event.editor?.locked} aria-label={`Eliminar ${event.id}`} title="Eliminar evento del borrador" onClick={()=>onChange(c=>({...c,worldEvents:c.worldEvents.filter(e=>e.id!==event.id)}))}><Trash2 size={18}/></button><button onClick={()=>onTest([event.position[0]+2,0,event.position[2]+2])}><Play size={18}/>Probar evento</button></div>
      <fieldset className="admin-form-grid editor-properties" disabled={!!event.editor?.locked}><WorldEventFields event={event} content={content} onChange={patch=>edit(event.id,patch)}/><label>Region<select value={event.regionId} onChange={e=>edit(event.id,{regionId:e.target.value})}>{[...new Set(content.world.map(r=>r.regionId))].map(id=><option key={id}>{id}</option>)}</select></label>{event.position.map((n,i)=><label key={i}>Posicion {['X','Y','Z'][i]}<input type="number" step=".1" value={n} onChange={e=>edit(event.id,{position:event.position.map((v,j)=>j===i?Number(e.target.value):v)})}/></label>)}</fieldset>
    </section>)}
  </>;
}
