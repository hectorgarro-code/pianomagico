import {Plus,Trash2} from 'lucide-react';
import {RESIDENT_BEHAVIOR_DEFAULTS} from '../game/gameplay/residentBehavior.js';
import {CREATURE_BEHAVIOR_DEFAULTS} from '../game/gameplay/creatureEncounter.js';

function Parameter({label,value,min,max,step=.1,onChange}) {
  return <label>{label}<input type="number" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value))}/></label>;
}
export function CreatureBehaviorFields({record,onChange}) {
  if(record.type!=='WORLD_CREATURE')return null;
  const config={...CREATURE_BEHAVIOR_DEFAULTS,...record.encounter};
  return <fieldset className="editor-behavior" disabled={record.editor?.locked||record.firstMinutesOnly||record.training}><legend>Encuentro arcade</legend>
    <label>Movimiento<select value={record.behaviorType} onChange={e=>onChange({behaviorType:e.target.value})}><option value="stationary">Quieto</option><option value="wander">Explorar / perseguir</option></select></label>
    {record.behaviorType==='wander'&&[['noticeRange','Detectar a distancia',2,12],['leash','Distancia de retorno',3,16],['chaseSpeed','Velocidad de persecucion',.5,3],['windup','Preparacion del golpe (s)',.4,2],['recovery','Pausa entre golpes (s)',.8,3]].map(([key,label,min,max])=><Parameter key={key} label={label} value={config[key]} min={min} max={max} onChange={value=>onChange({encounter:{...record.encounter,[key]:value}})}/>)}
  </fieldset>;
}
export function ResidentBehaviorFields({record,activities,onChange}) {
  const config={...RESIDENT_BEHAVIOR_DEFAULTS,...record.behavior};
  const behavior=(key,value)=>onChange({behavior:{...record.behavior,[key]:value}});
  return <fieldset className="editor-behavior" disabled={record.editor?.locked}><legend>Comportamiento amistoso</legend>
    <label>Activo<input type="checkbox" checked={record.enabled!==false} onChange={e=>onChange({enabled:e.target.checked})}/></label>
    <Parameter label="Distancia de saludo" value={config.nearRadius} min={2} max={10} onChange={v=>behavior('nearRadius',v)}/>
    <label>Saludo<select value={config.greeting} onChange={e=>behavior('greeting',e.target.value)}><option value="WAVE">Saludar</option><option value="LOOK_AT_PLAYER">Mirar al jugador</option></select></label>
    <label>Region restaurada<select value={config.restored} onChange={e=>behavior('restored',e.target.value)}><option value="LOOK_AT_PLAYER">Mirar al jugador</option><option value="WAVE">Saludar</option><option value="CHEER">Celebrar</option></select></label>
    <label>Celebrar actividades<select multiple value={record.watch||[]} onChange={e=>onChange({watch:Array.from(e.target.selectedOptions,o=>o.value)})}>{activities.map(a=><option key={a.id} value={a.id}>{a.label||a.id}</option>)}</select></label>
    <label>Recorrido<input type="checkbox" checked={!!record.walk} onChange={e=>onChange({walk:e.target.checked?[[record.position[0],record.position[2]],[record.position[0]+2,record.position[2]]]:undefined})}/></label>
    {record.walk&&<><Parameter label="Velocidad de paseo" value={config.walkSpeed} min={.2} max={1.5} onChange={v=>behavior('walkSpeed',v)}/>
      {record.walk.map((point,index)=><fieldset className="editor-vector" key={index}><legend>Punto {index+1}</legend>{point.map((value,axis)=><Parameter key={axis} label={axis===0?'X':'Z'} value={value} min={axis===0?-60:-145} max={axis===0?60:35} onChange={v=>onChange({walk:record.walk.map((p,i)=>i===index?p.map((n,j)=>j===axis?v:n):p)})}/>)}<button title="Quitar punto" aria-label={`Quitar punto ${index+1}`} disabled={record.walk.length<=2} onClick={()=>onChange({walk:record.walk.filter((_,i)=>i!==index)})}><Trash2 size={16}/></button></fieldset>)}
      <button disabled={record.walk.length>=20} onClick={()=>onChange({walk:[...record.walk,[...record.walk.at(-1)]]})}><Plus size={16}/>Punto de recorrido</button>
    </>}
  </fieldset>;
}
