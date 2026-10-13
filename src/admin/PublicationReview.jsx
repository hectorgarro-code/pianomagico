import {useMemo,useEffect,useState} from 'react';
import {X,Upload} from 'lucide-react';
import {contentDiff} from './editorState.js';
import {contentRequest} from '../game/content/contentRepository.js';
import {spatialWarnings} from './editorPreflight.js';

export default function PublicationReview({before,content,busy,error,onClose,onPublish}) {
  const changes=useMemo(()=>contentDiff(before,content),[before,content]);
  const warnings=useMemo(()=>spatialWarnings(content),[content]);
  const [validation,setValidation]=useState({document:null,ok:false,error:'',report:null});
  const [attempt,setAttempt]=useState(0),[playtest,setPlaytest]=useState(null),[warningsReviewed,setWarningsReviewed]=useState(null);
  const checked=validation.document===content;
  useEffect(()=>{let live=true;contentRequest('validate_content',{content}).then(report=>{if(live)setValidation({document:content,ok:true,error:'',report});}).catch(e=>{if(live)setValidation({document:content,ok:false,error:e.message,report:null});});return()=>{live=false;};},[content,attempt]);
  return <div className="admin-modal"><section className="publication-review" role="dialog" aria-modal="true" aria-labelledby="publication-title"><div className="admin-toolbar"><h2 id="publication-title">Publicar revision {content.revision+1}</h2><button aria-label="Cerrar revision" title="Cerrar revision" disabled={busy} onClick={onClose}><X size={18}/></button></div>
    <div className="admin-table-wrap"><table><thead><tr><th>Cambio</th><th>Elemento</th><th>Campos</th></tr></thead><tbody>{changes.map(c=><tr key={`${c.collection}:${c.id}`}><td>{c.kind}</td><td>{c.id}<small>{c.collection}</small></td><td>{c.fields.join(', ')}</td></tr>)}</tbody></table></div>
    <p>Las partidas y el historial educativo se conservan. Reasignar una leccion puede exigir completar de nuevo su cofre.</p>
    <p role="status">{!checked?'Verificando referencias, revision y archivos...':validation.ok?`Contenido validado por el servidor. ${validation.report.modelsChecked} modelos y ${validation.report.dependenciesChecked} dependencias comprobadas.`:validation.error}</p>
    {checked&&!validation.ok&&<button onClick={()=>{setValidation({document:null,ok:false,error:'',report:null});setAttempt(v=>v+1);}}>Reintentar verificacion</button>}
    {warnings.length>0&&<details><summary>{warnings.length} avisos espaciales</summary><ul>{warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul></details>}
    <p>Los avisos son aproximados, no una prueba de navegacion completa. Probar el borrador sigue siendo necesario.</p>
    <label className="publication-check"><input type="checkbox" checked={playtest===content} onChange={e=>setPlaytest(e.target.checked?content:null)}/>Probe este borrador en el juego</label>
    {warnings.length>0&&<label className="publication-check"><input type="checkbox" checked={warningsReviewed===content} onChange={e=>setWarningsReviewed(e.target.checked?content:null)}/>Revise los avisos espaciales</label>}
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <div className="admin-toolbar"><button disabled={busy} onClick={onClose}>Volver al borrador</button><button disabled={busy||!checked||!validation.ok||playtest!==content||(warnings.length>0&&warningsReviewed!==content)} onClick={onPublish}><Upload size={18}/>Publicar para todos los jugadores</button></div>
  </section></div>;
}
