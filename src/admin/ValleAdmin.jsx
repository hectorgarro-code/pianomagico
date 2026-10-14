import { createElement, useEffect, useState, useReducer, useCallback } from 'react';
import {createPortal} from 'react-dom';
import { BookOpen, Map, Boxes, ListChecks, Gift, Skull, Package, Puzzle, Settings, LogOut, RefreshCw, Download, Plus, Copy, Trash2, Save, Play, X, Undo2, Redo2, Upload, History } from 'lucide-react';
import { contentRequest } from '../game/content/contentRepository.js';
import { ASSET_CATALOG, ASSET_CATEGORIES } from '../game/assets/assetCatalog.js';
import PianoMagico from '../modules/piano-magico/PianoMagico.jsx';
import ContentPreview from './ContentPreview.jsx';
import './valleAdmin.css';
import { upgradeGameplayContent } from '../game/gameplay/gameplayContent.js';
import GameplayEditor from './GameplayEditor.jsx';
import WorldEditor from './WorldEditor.jsx';
import LessonEditor from './LessonEditor.jsx';
import {historyReducer,prepareEditorContent} from './editorState.js';
import WorldSandbox from './WorldSandbox.jsx';
import MinigameEditor from './MinigameEditor.jsx';
import MinigameView from '../game/gameplay/MinigameView.jsx';
import PublicationReview from './PublicationReview.jsx';
import WorldEventEditor from './WorldEventEditor.jsx';
import './visualEditor.css';

const PAGES = [['LECCIONES', BookOpen], ['MUNDO', Map], ['ASSETS', Boxes], ['ACTIVIDADES', ListChecks], ['RECOMPENSAS', Gift],
  ['WORLD CREATURES', Skull], ['DESTRUCTIBLES', Package], ['MINIJUEGOS', Puzzle], ['EVENTOS', Gift], ['CONFIGURACION', Settings]];
const TYPE_NAMES = { CHARACTER_PLAYER: 'PLAYERS', PET: 'PETS', WORLD_CREATURE: 'WORLD CREATURES', PROP: 'PROPS' };
const newLesson = () => ({ title: '', sequence: ['C:1'], speed: 100, rhythm: 'pop', stickerId: 1, order_index: 0, enabled: true });
const immutableEdit = (items, id, patch) => items.map(item => item.id === id ? { ...item, ...patch } : item);
function Tool({ icon: Icon, label, ...props }) { return <button title={label} aria-label={label} {...props}>{createElement(Icon, { size: 18 })}</button>; }
function Field({ label, children }) { return <label className="admin-field"><span>{label}</span>{children}</label>; }
function exportJson(data, name) { const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

export default function ValleAdmin() {
  const [session, setSession] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [page, setPage] = useState('LECCIONES'), [lessons, setLessons] = useState([]);
  const [documentState,dispatchDocument]=useReducer(historyReducer,{value:null,past:[],future:[]});
  const content=documentState.value, setContent=value=>dispatchDocument({type:'change',value});
  const [history,setHistory]=useState([]),[notice,setNotice]=useState(''),[localDraft,setLocalDraft]=useState(null);
  const [sandbox,setSandbox]=useState(null);
  const [miniPreview,setMiniPreview]=useState(null);
  const [review,setReview]=useState(false);
  const [saved, setSaved] = useState(''), [editor, setEditor] = useState(null), [preview, setPreview] = useState(null);
  const [query, setQuery] = useState(''), [order, setOrder] = useState('order_index'), [category, setCategory] = useState('PET');
  const [assetId, setAssetId] = useState(null);
  const [assetClip, setAssetClip] = useState('');
  useEffect(() => { contentRequest('session').then(setSession).catch(e => setError(e.message)); }, []);
  const load = useCallback(async () => {
    const [rows, document] = await Promise.all([contentRequest('lessons'), contentRequest('content')]);
    try {setLocalDraft(JSON.parse(localStorage.getItem(`valle-admin-world-draft:${session.username}`)));}catch{setLocalDraft(null);}
    setLessons(rows); dispatchDocument({type:'reset',value:prepareEditorContent(upgradeGameplayContent(document))}); setSaved(JSON.stringify(document));
    setHistory(await contentRequest('history'));setNotice('');
  },[session?.username]);
  useEffect(() => { if (session?.authenticated) load().catch(e => setError(e.message)); }, [session?.authenticated,load]);
  const run = async task => { setError(''); setBusy(true); try { await task(); } catch (e) { setError(e.message); if (e.status === 401) setSession(s => ({ ...s, authenticated: false })); } finally { setBusy(false); } };
  const saveContent = () => run(async () => {
    const document = await contentRequest('save_content', { revision: content.revision, content:prepareEditorContent(content) }); dispatchDocument({type:'reset',value:document}); setSaved(JSON.stringify(document));setHistory(await contentRequest('history'));setReview(false);setNotice('Contenido publicado. Se aplica al volver a cargar el juego.'); });
  useEffect(()=>{if(content&&session?.username&&(documentState.past.length||documentState.future.length)){try{localStorage.setItem(`valle-admin-world-draft:${session.username}`,JSON.stringify(content));}catch{setNotice('No se pudo guardar la copia local del borrador.');}}},[content,session?.username,documentState.past.length,documentState.future.length]);
  useEffect(()=>{const guard=e=>{if(content&&saved!==JSON.stringify(content)){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[content,saved]);
  useEffect(()=>{const key=e=>{if(page!=='MUNDO'||sandbox||!(e.ctrlKey||e.metaKey)||e.target.closest('input,textarea,select'))return;if(e.key.toLowerCase()==='z'||e.key.toLowerCase()==='y'){e.preventDefault();dispatchDocument({type:e.shiftKey||e.key.toLowerCase()==='y'?'redo':'undo'});}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[page,sandbox]);
  const editCollection = (key, id, patch) => setContent(c => ({ ...c, [key]: immutableEdit(c[key], id, patch) }));
  const addRecord = (key, record) => setContent(c => ({ ...c, [key]: [...c[key], record] }));
  const removeRecord = (key, id) => setContent(c => ({ ...c, [key]: c[key].filter(r => r.id !== id) }));
  const globalLessons = lessons.filter(l => l.user_id === null && !l.isUserCreated);
  if (!session?.authenticated) return <div className="valle-admin admin-login"><form onSubmit={e => {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    run(async () => setSession(await contentRequest('login', { username: form.get('username'), password: form.get('password') })));
  }}><h1>Valle Admin</h1>{session && !session.configured && <p role="status">Sin cuenta ADMIN configurada</p>}
    <Field label="Usuario"><input name="username" autoComplete="username" required /></Field>
    <Field label="Contraseña"><input name="password" type="password" autoComplete="current-password" required /></Field>
    <button disabled={busy || !session} type="submit">Entrar</button>{error && <p role="alert">{error}</p>}</form></div>;
  if (!content) return <main className="valle-admin"><p role={error ? 'alert' : 'status'}>{error || 'Cargando contenido...'}</p><button onClick={() => run(load)}>Reintentar</button></main>;
  const dirty = saved !== JSON.stringify(content);
  const selectedAsset = ASSET_CATALOG.assets.find(a => a.id === assetId);
  return <div className="valle-admin">
    <header><strong>VALLE ADMIN</strong><span>{session.username}</span><Tool icon={LogOut} label="Cerrar sesión" onClick={() => run(async () => { await contentRequest('logout', {}); setSession(await contentRequest('session')); })} /></header>
    <div className="admin-layout" inert={busy}><nav>{PAGES.map(([name, Icon]) => <button key={name} className={page === name ? 'selected' : ''} onClick={() => { setPage(name); setQuery(''); }}>{createElement(Icon, { size: 18 })}{name}</button>)}</nav>
      <main><div className="admin-toolbar"><h1>{page}</h1><span>Rev. {content.revision}{dirty ? ' · Sin publicar' : ''}</span>
        <Tool icon={RefreshCw} label="Recargar" disabled={busy} onClick={() => { if (!dirty || confirm('Descartar cambios sin guardar?')) run(load); }} />
        <Tool icon={Download} label="Exportar JSON" onClick={() => exportJson({ content, lessons }, 'valle-content.json')} />
        <Tool icon={Undo2} label="Deshacer" disabled={!documentState.past.length} onClick={()=>dispatchDocument({type:'undo'})}/><Tool icon={Redo2} label="Rehacer" disabled={!documentState.future.length} onClick={()=>dispatchDocument({type:'redo'})}/>
        <button disabled={busy} onClick={()=>run(async()=>{await contentRequest('save_draft',{revision:content.revision,content});setNotice('Borrador guardado. El juego publicado no cambio.');})}><Save size={18}/>Guardar borrador</button>
        <button disabled={busy} onClick={()=>run(async()=>{const draft=await contentRequest('draft');if(!draft){setNotice('No hay borrador guardado en el servidor.');return;}if(draft.baseRevision!==content.revision&&!confirm('El contenido publicado cambio. Recuperar este borrador para revisarlo?'))return;setContent({...draft.content,revision:content.revision});setNotice('Borrador recuperado, todavia no publicado.');})}>Recuperar borrador</button>
        <label className="admin-import"><Upload size={18}/><input aria-label="Importar contenido JSON" type="file" accept="application/json,.json" onChange={e=>run(async()=>{const file=e.target.files[0];if(!file)return;if(file.size>2097152)throw Error('El archivo supera 2 MB.');const imported=JSON.parse(await file.text()),doc=imported.content||imported;if(doc.schemaVersion!==1||!Array.isArray(doc.world)||!Array.isArray(doc.activities))throw Error('Formato de contenido invalido');if(confirm('Reemplazar el borrador actual por este contenido? No se publicara automaticamente.'))setContent({...prepareEditorContent(upgradeGameplayContent(doc)),revision:content.revision});e.target.value='';})}/></label>
        <button disabled={!dirty || busy} onClick={()=>{setError('');setReview(true);}}><Upload size={18} />Publicar contenido</button></div>
        {notice&&<p role="status" className="admin-notice">{notice}</p>}
        {localDraft&&<button onClick={()=>{setContent({...prepareEditorContent(localDraft),revision:content.revision});setLocalDraft(null);setNotice('Copia local recuperada como borrador. Revisa los cambios antes de publicar.');}}><Undo2 size={16}/>Recuperar copia local</button>}
        {error && <p role="alert" className="admin-error">{error}</p>}
        {page === 'LECCIONES' && <><div className="admin-toolbar"><input aria-label="Buscar lecciones" placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)} />
          <select aria-label="Ordenar lecciones" value={order} onChange={e => setOrder(e.target.value)}><option value="order_index">Orden</option><option value="id">ID</option><option value="title">Nombre</option></select>
          <span>{lessons.length} lecciones · MySQL</span><button onClick={() => setEditor(newLesson())}><Plus size={18} />Crear</button></div>
          <div className="admin-table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Orden</th><th>Tempo</th><th>Origen</th><th>Estado</th><th /></tr></thead><tbody>
            {lessons.filter(l => `${l.title} ${l.id}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => order === 'title' ? a.title.localeCompare(b.title) : Number(a[order]) - Number(b[order])).map(l => <tr key={l.id}>
              <td>{l.id}</td><td>{l.title}</td><td>{l.order_index}</td><td>{l.speed} {l.speed > 300 ? 'ms' : 'BPM'}</td><td>{l.user_id === null ? 'MYSQL · GLOBAL' : `MYSQL · PERFIL ${l.user_id}`}</td><td>{l.enabled ? 'Activa' : 'Inactiva'}</td><td className="admin-actions">
                <button disabled={l.user_id !== null || l.isUserCreated} onClick={() => setEditor({ ...l, sequence: [...l.sequence] })}>Editar</button>
                <Tool icon={Copy} label="Duplicar lección" onClick={() => setEditor({ ...l, id: undefined, revision: undefined, title: `${l.title} (copia)`, enabled: false })} />
                <Tool icon={Play} label="Probar en PianoMágico" onClick={() => setPreview(l)} /></td></tr>)}
          </tbody></table></div></>}
        {page === 'ACTIVIDADES' && <div className="admin-table-wrap"><table><thead><tr><th>ID / Región</th><th>Tipo</th><th>Lección real</th><th>Requisitos</th><th>Recompensa</th><th>Asignación</th></tr></thead><tbody>
          {content.activities.map(a => <tr key={a.id}><td>{a.id}<small>{a.regionId}</small></td><td>{a.type}</td><td>{a.type === 'SECRET_REWARD' ? 'Sin lección' : <select aria-label={`Lección ${a.id}`} value={a.lessonId ?? ''} onChange={e => editCollection('activities', a.id, { lessonId: Number(e.target.value), assignmentStatus: 'VERIFICADA' })}>
            {globalLessons.filter(l => l.enabled).map(l => <option key={l.id} value={l.id}>{l.id} · {l.title}</option>)}</select>}</td>
            <td>{a.requirements.completedObjects.join(', ') || 'Ninguno'}</td><td><select aria-label={`Recompensa ${a.id}`} value={a.rewardId || ''} onChange={e => editCollection('activities', a.id, { rewardId: e.target.value || null })}><option value="">Sin recompensa adicional</option>{content.rewards.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}</select><small>{a.progressionReward?.id || 'Práctica'}</small></td>
            <td>{a.assignmentStatus}{a.type !== 'SECRET_REWARD' && !lessons.some(l => String(l.id) === String(a.lessonId) && l.enabled) && <strong> · Referencia inválida</strong>}</td></tr>)}
        </tbody></table></div>}
        {page === 'ASSETS' && <><div className="admin-toolbar"><select aria-label="Categoría de asset" value={category} onChange={e => { setCategory(e.target.value); setAssetId(null); }}>{ASSET_CATEGORIES.map(c => <option key={c} value={c}>{TYPE_NAMES[c] || c}</option>)}</select><input aria-label="Buscar assets" placeholder="Buscar" value={query} onChange={e => setQuery(e.target.value)} /></div>
          <div className="admin-split"><div className="admin-asset-list">{ASSET_CATALOG.assets.filter(a => a.category === category && a.name.toLowerCase().includes(query.toLowerCase())).map(a => <button key={a.id} className={assetId === a.id ? 'selected' : ''} onClick={() => { setAssetId(a.id); setAssetClip(''); }}>{a.previewUrl && <img src={a.previewUrl} alt="" />}<span>{a.name}<small>{a.packId}</small></span></button>)}</div>
            <section>{selectedAsset && <><h2>{selectedAsset.name}</h2><ContentPreview asset={selectedAsset} clipName={assetClip} /><Field label="Animación"><select value={assetClip} onChange={e => setAssetClip(e.target.value)}><option value="">Idle / predeterminada</option>{[...new Set([...(selectedAsset.animations || []).map(a => a.name), ...(selectedAsset.animationSources || []).flatMap(s => s.clips)])].map(name => <option key={name}>{name}</option>)}</select></Field><dl><dt>Categoría</dt><dd>{TYPE_NAMES[selectedAsset.category] || selectedAsset.category}</dd><dt>Formato</dt><dd>{selectedAsset.url.split('.').pop().toUpperCase()}</dd><dt>Pack</dt><dd>{selectedAsset.packId}</dd><dt>Licencia</dt><dd>{selectedAsset.license ? JSON.stringify(selectedAsset.license) : 'No reauditada'}</dd><dt>Animaciones</dt><dd>{JSON.stringify(selectedAsset.animations || [])}</dd><dt>Bibliotecas externas</dt><dd>{JSON.stringify(selectedAsset.animationSources || [])}</dd></dl></>}</section></div></>}
        {page === 'MUNDO' && <WorldEditor content={content} onChange={setContent} lessons={lessons} onTest={spawn=>run(async()=>{const draft=prepareEditorContent(content);await contentRequest('validate_content',{content:draft});setSandbox({content:structuredClone(draft),spawn});})} onEditLesson={lesson=>{if(lesson)setEditor({...lesson,sequence:[...lesson.sequence]});}}/>}
        {page === 'RECOMPENSAS' && <><button onClick={() => addRecord('rewards', { id: `reward-${Date.now()}`, type: 'PET', referenceId: ASSET_CATALOG.assets.find(a => a.category === 'PET').id, presentation: '', enabled: false })}><Plus size={18} />Crear recompensa</button>
          {content.rewards.map(r => <section className="admin-record" key={r.id}><div className="admin-toolbar"><h2>{r.id}</h2><Tool icon={Trash2} label="Eliminar recompensa" onClick={() => removeRecord('rewards', r.id)} /></div><div className="admin-form-grid">
            <Field label="ID"><input defaultValue={r.id} onBlur={e => editCollection('rewards', r.id, { id: e.target.value })} /></Field><Field label="Tipo"><select value={r.type} onChange={e => editCollection('rewards', r.id, { type: e.target.value, referenceId: e.target.value === 'PET' ? ASSET_CATALOG.assets.find(a => a.category === 'PET').id : 'future-reference' })}><option>PET</option><option>SECRET</option><option>COSMETIC_FUTURE</option></select></Field>
            <Field label="Referencia">{r.type === 'PET' ? <select value={r.referenceId} onChange={e => editCollection('rewards', r.id, { referenceId: e.target.value })}>{ASSET_CATALOG.assets.filter(a => a.category === 'PET').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select> : <input value={r.referenceId} onChange={e => editCollection('rewards', r.id, { referenceId: e.target.value })} />}</Field>
            <Field label="Presentación"><input value={r.presentation} onChange={e => editCollection('rewards', r.id, { presentation: e.target.value })} /></Field><Field label="Habilitada"><input type="checkbox" checked={r.enabled} onChange={e => editCollection('rewards', r.id, { enabled: e.target.checked })} /></Field></div></section>)}</>}
        {['WORLD CREATURES', 'DESTRUCTIBLES'].includes(page) && <><div className="admin-toolbar"><span>Gameplay activo · cambios aplicados al iniciar el mundo</span><button onClick={() => addRecord('worldActions', { id: `target-${Date.now()}`, type: page === 'WORLD CREATURES' ? 'WORLD_CREATURE' : 'DESTRUCTIBLE', assetId: ASSET_CATALOG.assets.find(a => a.category === (page === 'WORLD CREATURES' ? 'WORLD_CREATURE' : 'PROP')).id, hitsRequired: 1, hitReaction: page === 'WORLD CREATURES' ? 'Hit_A' : 'none', defeatEffect: 'musical-particles', behaviorType: 'stationary', optionalReward: null, enabledInWorld: false })}><Plus size={18} />Preparar target</button></div>
          {content.worldActions.filter(r => r.type === (page === 'WORLD CREATURES' ? 'WORLD_CREATURE' : 'DESTRUCTIBLE')).map(r => <section className="admin-record" key={r.id}><div className="admin-toolbar"><h2>{r.id}</h2><Tool icon={Trash2} label="Eliminar target" onClick={() => removeRecord('worldActions', r.id)} /></div><div className="admin-form-grid">
            <Field label="Asset"><select value={r.assetId} onChange={e => editCollection('worldActions', r.id, { assetId: e.target.value })}>{ASSET_CATALOG.assets.filter(a => r.type === 'WORLD_CREATURE' ? a.category === 'WORLD_CREATURE' : ['PROP', 'DESTRUCTIBLE', 'DECORATION'].includes(a.category)).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
            <Field label="Impactos"><input type="number" min="1" max="3" value={r.hitsRequired} onChange={e => editCollection('worldActions', r.id, { hitsRequired: Number(e.target.value) })} /></Field>
            {['hitReaction', 'defeatEffect', 'behaviorType'].map(key => <Field key={key} label={key}><input value={r[key]} onChange={e => editCollection('worldActions', r.id, { [key]: e.target.value })} /></Field>)}
            <Field label="Recompensa opcional"><select value={r.optionalReward || ''} onChange={e => editCollection('worldActions', r.id, { optionalReward: e.target.value || null })}><option value="">Ninguna</option>{content.rewards.map(reward => <option key={reward.id}>{reward.id}</option>)}</select></Field></div></section>)}</>}
        {page === 'MINIJUEGOS' && <MinigameEditor content={content} onChange={setContent} onPreview={m=>run(async()=>{await contentRequest('validate_content',{content:prepareEditorContent(content)});setMiniPreview(structuredClone(m));})}/>}
        {page === 'EVENTOS' && <WorldEventEditor content={content} onChange={setContent} onTest={spawn=>run(async()=>{const draft=prepareEditorContent(content);await contentRequest('validate_content',{content:draft});setSandbox({content:structuredClone(draft),spawn});})}/>}
        {page === 'CONFIGURACION' && <><div className="admin-toolbar"><button onClick={()=>setPage('LECCIONES')}><BookOpen size={18}/>Editor de lecciones</button><button onClick={()=>setPage('MUNDO')}><Map size={18}/>Editor del Valle</button></div><section className="admin-record"><h2><History size={18}/> Versiones del mundo</h2>{history.length===0?<p>El historial comienza con la primera publicacion desde este editor.</p>:history.map(version=><div className="admin-toolbar" key={version.revision}><span>Revision {version.revision} · {version.created_at}</span><button onClick={()=>run(async()=>{const snapshot=await contentRequest('history_content',{revision:version.revision});if(confirm('Recuperar esta version como borrador? No cambia lecciones ni progreso.'))setContent({...prepareEditorContent(upgradeGameplayContent(snapshot)),revision:content.revision});})}>Recuperar como borrador</button></div>)}</section><GameplayEditor content={content} onChange={setContent}/><dl><dt>Versión</dt><dd>{content.schemaVersion}</dd><dt>Revisión</dt><dd>{content.revision}</dd><dt>Actualización</dt><dd>{content.updated_at}</dd><dt>Persistencia</dt><dd>MySQL · contenido separado de progreso</dd></dl></>}
      </main></div>
    {sandbox&&<WorldSandbox content={sandbox.content} spawn={sandbox.spawn} lessons={lessons} onClose={()=>setSandbox(null)}/>}
    {review&&<PublicationReview before={JSON.parse(saved)} content={content} busy={busy} error={error} onClose={()=>setReview(false)} onPublish={saveContent}/>}
    {miniPreview&&createPortal(<MinigameView definition={miniPreview} onClose={()=>setMiniPreview(null)} onComplete={()=>setMiniPreview(null)}/>,document.body)}
    {editor && <LessonEditor lesson={editor} busy={busy} onClose={()=>setEditor(null)} onPreview={setPreview} onSave={async lesson=>{setBusy(true);try{await contentRequest('save_lesson',{id:editor.id??null,revision:editor.revision,lesson});setLessons(await contentRequest('lessons'));setEditor(null);setNotice('Leccion publicada.');}finally{setBusy(false);}}}/>}
    {preview && createPortal(<div className="admin-piano-preview"><PianoMagico key={`${preview.id}-${preview.revision}`} initialSong={preview} initialView="game" initialMode="solo" preparationComplete adminPreview onExit={() => setPreview(null)} onFinishLesson={() => setPreview(null)} /><Tool className="admin-preview-close" icon={X} label="Cerrar preview" onClick={() => setPreview(null)} /></div>,document.body)}
  </div>;
}
