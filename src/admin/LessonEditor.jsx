import {useState} from 'react';
import {X,Play,Save,Trash2,ArrowLeft,ArrowRight,Plus,Undo2} from 'lucide-react';
import {normalizeLessonForEditor,lessonEditorPayload} from './lessonEditorData.js';
import LessonHistory from './LessonHistory.jsx';
const names={C:'DO',D:'RE',E:'MI',F:'FA',G:'SOL',A:'LA',B:'SI',R:'Silencio'};
const notes=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const displayNote=value=>{const [pitch,duration='1']=value.split(':');return `${pitch==='R'?names.R:(names[pitch[0]]||pitch)+(pitch.includes('#')?'#':'')+(pitch.match(/\d/)?.[0]||'4')} · ${duration}`;};
export default function LessonEditor({lesson,busy,onSave,onPreview,onClose}) {
  const [value,setValue]=useState(()=>normalizeLessonForEditor(lesson)),[index,setIndex]=useState(0),[octave,setOctave]=useState(4),[duration,setDuration]=useState('1'),[error,setError]=useState('');
  const draftKey=`valle-admin-lesson-draft:${lesson.id||'new'}`;
  const [recoverable,setRecoverable]=useState(()=>{try{return JSON.parse(localStorage.getItem(draftKey));}catch{return null;}});
  const [tempoSource,setTempoSource]=useState(lesson);
  const edit=patch=>{const next={...value,...patch};setValue(next);try{localStorage.setItem(draftKey,JSON.stringify({revision:lesson.revision,value:next,tempoSource}));}catch{setError('No se pudo guardar el borrador local.');}};
  const add=pitch=>{const sequence=[...value.sequence];const at=Math.min(index+1,sequence.length);sequence.splice(at,0,`${pitch==='R'?'R':pitch+octave}:${duration}`);edit({sequence});setIndex(at);};
  const move=step=>{const at=index+step;if(at<0||at>=value.sequence.length)return;const sequence=[...value.sequence];[sequence[index],sequence[at]]=[sequence[at],sequence[index]];edit({sequence});setIndex(at);};
  const dirty=JSON.stringify(value)!==JSON.stringify(normalizeLessonForEditor(lesson));
  const close=()=>{if(!dirty||confirm('Cerrar el editor? El borrador local se conserva.'))onClose();};
  return <div className="admin-modal"><form className="visual-lesson-editor" onSubmit={async e=>{e.preventDefault();setError('');try{await onSave(lessonEditorPayload(value,tempoSource));localStorage.removeItem(draftKey);}catch(e){setError(e.message);}}}>
    <div className="admin-toolbar"><h2>{lesson.id?'Editar leccion':'Nueva leccion'}</h2><button type="button" title="Cerrar" aria-label="Cerrar editor" onClick={close}><X size={20}/></button></div>
    {recoverable&&<div className="admin-toolbar"><button type="button" onClick={()=>{if(recoverable.revision!==lesson.revision&&!confirm('La leccion publicada cambio. Recuperar el borrador anterior para revisarlo?'))return;setValue(recoverable.value);setTempoSource(recoverable.tempoSource||lesson);setRecoverable(null);}}><Undo2 size={16}/>Recuperar borrador</button><button type="button" onClick={()=>{localStorage.removeItem(draftKey);setRecoverable(null);}}>Descartar borrador</button></div>}
    {lesson.id&&<LessonHistory lesson={lesson} onError={setError} onPreview={onPreview} onRecover={snapshot=>{const next=normalizeLessonForEditor(snapshot);setValue(next);setTempoSource(snapshot);setIndex(0);try{localStorage.setItem(draftKey,JSON.stringify({revision:lesson.revision,value:next,tempoSource:snapshot}));}catch{setError('No se pudo guardar el borrador recuperado en este dispositivo.');}}}/>}
    <label className="admin-field"><span>Nombre</span><input required maxLength="255" value={value.title} onChange={e=>edit({title:e.target.value})}/></label>
    <div className="admin-form-grid"><label className="admin-field">BPM<input required type="number" min="20" max="300" value={value.speed} onChange={e=>edit({speed:Number(e.target.value)})}/></label><label className="admin-field">Acompanamiento<select value={value.rhythm} onChange={e=>edit({rhythm:e.target.value})}>{['pop','rock','bubble','clasico','march','marcha'].map(r=><option key={r}>{r}</option>)}</select></label><label className="admin-field">Orden<input type="number" min="0" max="100000" value={value.order_index} onChange={e=>edit({order_index:Number(e.target.value)})}/></label><label className="admin-field">Sticker<input type="number" min="1" max="20" value={value.stickerId} onChange={e=>edit({stickerId:Number(e.target.value)})}/></label></div>
    <div className="lesson-sequence" aria-label="Secuencia musical">{value.sequence.map((n,i)=><button key={i} type="button" aria-label={`Nota ${i+1}: ${displayNote(n)}`} className={index===i?'selected':''} onClick={()=>{setIndex(i);setDuration(n.split(':')[1]||'1');}}><small>{i+1}</small>{displayNote(n)}</button>)}</div>
    <div className="admin-toolbar"><label>Octava<select value={octave} onChange={e=>setOctave(Number(e.target.value))}>{[2,3,4,5,6].map(o=><option key={o}>{o}</option>)}</select></label><label>Duracion<select value={duration} onChange={e=>{setDuration(e.target.value);if(value.sequence[index])edit({sequence:value.sequence.map((n,i)=>i===index?`${n.split(':')[0]}:${e.target.value}`:n)});}}>{['0.25','0.5','1','2','3','4'].map(d=><option value={d} key={d}>{d} pulsos</option>)}</select></label>
      <button type="button" title="Mover nota antes" aria-label="Mover nota antes" disabled={index===0} onClick={()=>move(-1)}><ArrowLeft size={18}/></button><button type="button" title="Mover nota despues" aria-label="Mover nota despues" disabled={index>=value.sequence.length-1} onClick={()=>move(1)}><ArrowRight size={18}/></button><button type="button" title="Eliminar nota" aria-label="Eliminar nota" disabled={!value.sequence.length} onClick={()=>{edit({sequence:value.sequence.filter((_,i)=>i!==index)});setIndex(Math.max(0,index-1));}}><Trash2 size={18}/></button>
    </div>
    <div className="lesson-keyboard">{notes.map(n=><button type="button" key={n} className={n.includes('#')?'sharp':''} onClick={()=>add(n)}><Plus size={12}/>{names[n[0]]}{n.includes('#')?'#':''}</button>)}<button type="button" onClick={()=>add('R')}>{names.R}</button></div>
    <details><summary>Notacion avanzada</summary><textarea aria-label="Secuencia de notas" value={value.sequence.join(' ')} onChange={e=>edit({sequence:e.target.value.trim()?e.target.value.trim().split(/\s+/):[]})}/></details>
    <label className="admin-field">Activa<input type="checkbox" checked={value.enabled} onChange={e=>edit({enabled:e.target.checked})}/></label>
    {error&&<p role="alert" className="admin-error">{error}</p>}
    <div className="admin-toolbar"><button type="button" disabled={busy||!value.sequence.length} onClick={()=>onPreview({...lessonEditorPayload(value,tempoSource),id:lesson.id||'admin-draft'})}><Play size={18}/>Probar en PianoMagico</button><button type="submit" disabled={busy||!value.sequence.length}><Save size={18}/>Publicar leccion</button></div>
  </form></div>;
}
