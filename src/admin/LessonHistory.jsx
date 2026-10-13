import {useState} from 'react';
import {History,Undo2,Play} from 'lucide-react';
import {contentRequest} from '../game/content/contentRepository.js';
import {compareLessonVersions} from './lessonEditorData.js';
const labels={title:'Nombre',speed:'BPM',rhythm:'Acompanamiento',order_index:'Orden',stickerId:'Sticker',enabled:'Activa',sequence:'Notas'};
const display=value=>Array.isArray(value)?`${value.length} notas: ${value.slice(0,12).join(' ')}${value.length>12?' ...':''}`:typeof value==='boolean'?(value?'Si':'No'):String(value);
export default function LessonHistory({lesson,onRecover,onPreview,onError}) {
  const [versions,setVersions]=useState(null),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false);
  const run=async task=>{setBusy(true);onError('');try{await task();}catch(e){onError(e.message);}finally{setBusy(false);}};
  return <section className="lesson-history">
    <button type="button" disabled={busy} onClick={()=>run(async()=>setVersions(await contentRequest('lesson_history',{id:lesson.id})))}><History size={16}/>Versiones de leccion</button>
    {versions?.length===0&&<p>El historial comienza con la primera publicacion desde este editor.</p>}
    <div className="admin-toolbar">{versions?.map(version=><button type="button" key={version.revision} disabled={busy} onClick={()=>run(async()=>setSelected(await contentRequest('lesson_history_content',{id:lesson.id,revision:version.revision})))}>Revision {version.revision} · {version.created_at}</button>)}</div>
    {selected&&<><h3>Revision {selected.revision} frente a la leccion publicada</h3><div className="admin-table-wrap"><table><thead><tr><th>Campo</th><th>Publicada</th><th>Version elegida</th></tr></thead><tbody>{compareLessonVersions(lesson,selected).map(change=><tr key={change.field}><td>{labels[change.field]}</td><td>{display(change.before)}</td><td>{display(change.after)}</td></tr>)}</tbody></table></div>
      {compareLessonVersions(lesson,selected).length===0&&<p>Mismo contenido musical.</p>}
      <div className="admin-toolbar"><button type="button" disabled={busy} onClick={()=>onPreview(selected)}><Play size={16}/>Probar version</button><button type="button" disabled={busy} onClick={()=>{onRecover(selected);setSelected(null);}}><Undo2 size={16}/>Recuperar esta version como borrador</button></div>
    </>}
  </section>;
}
