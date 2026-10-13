import {createElement,useMemo,useState} from 'react';
import {Move,Rotate3d,Scaling,Focus,Copy,Trash2,Plus,Boxes,MapPin,Eye,Search,Shield,Gift,Music,User,DoorOpen,Play} from 'lucide-react';
import {ASSET_CATALOG,ASSET_CATEGORIES} from '../game/assets/assetCatalog.js';
import {sceneRecords,patchRecord,addSceneRecord,removeSceneRecord,newId} from './editorState.js';
import WorldEditorViewport from './WorldEditorViewport.jsx';
import ContentPreview from './ContentPreview.jsx';
import {CONTENT_COMPOSITIONS} from '../game/content/contentDefaults.js';
import {MinigameFields} from './MinigameEditor.jsx';
import AuthoringTools from './AuthoringTools.jsx';
import {transformSelection,placeTemplate} from './editorAuthoring.js';

function IconButton({icon:Icon,label,...props}){return <button title={label} aria-label={label} {...props}>{createElement(Icon,{size:18})}</button>;}
export default function WorldEditor({content,onChange,lessons,onEditLesson,onTest}) {
  const [regionId,setRegionId]=useState(content.world[0].id),[selection,setSelection]=useState(''),[query,setQuery]=useState('');
  const [additional,setAdditional]=useState([]),[layerFilter,setLayerFilter]=useState('');
  const [tab,setTab]=useState('objects'),[category,setCategory]=useState('PROP'),[assetId,setAssetId]=useState('runtime:chest_wood');
  const [mode,setMode]=useState('translate'),[snap,setSnap]=useState(true),[bounds,setBounds]=useState(false),[focus,setFocus]=useState(0),[placing,setPlacing]=useState(null),[error,setError]=useState('');
  const region=content.world.find(r=>r.id===regionId),records=useMemo(()=>sceneRecords(content,region),[content,region]);
  const record=records.find(r=>r.key===selection),asset=ASSET_CATALOG.assets.find(a=>a.id===assetId);
  const selectedKeys=[selection,...additional].filter(key=>records.some(r=>r.key===key));
  const visibleRecords=records.filter(r=>!layerFilter||(r.editor?.layer||'Sin capa')===layerFilter);
  const selectKeys=keys=>{setSelection(keys[0]||'');setAdditional(keys.slice(1));};
  const select=(key,extend=false)=>selectKeys(extend?(selectedKeys.includes(key)?selectedKeys.filter(k=>k!==key):[...selectedKeys,key]):key?[key]:[]);
  const binding=CONTENT_COMPOSITIONS.find(c=>c.groupName===regionId),boundActivity=record&&[...(binding.stations||[]),...(binding.adventureObjects||[])].find(a=>a.instanceId===record.id);
  const activity=record&&content.activities.find(a=>a.instanceId===record.id||a.id===boundActivity?.id);
  const globals=lessons.filter(l=>l.user_id===null&&!l.isUserCreated&&l.enabled);
  const mini=record?.collection==='gates'?content.minigames.find(m=>m.id===record.minigameId):null;
  function perform(fn){try{setError('');fn();}catch(e){setError(e.message);}}
  const transform=(item,values)=>perform(()=>{if(item.collection==='residents'&&values.scale){const axis=values.scale.findIndex((v,i)=>Math.abs(v-item.scale[i])>1e-7);if(axis>=0)values={...values,scale:Array(3).fill(values.scale[axis])};}onChange(c=>transformSelection(c,regionId,records,selectedKeys,item,values));});
  const patch=values=>perform(()=>{if(record.editor?.locked)throw Error('Desbloquea este elemento antes de editarlo.');if(['position','rotation','scale'].some(k=>k in values))transform(record,values);else onChange(c=>patchRecord(c,regionId,record,values));});
  const editActivity=values=>onChange(c=>({...c,activities:c.activities.map(a=>a.id===activity.id?{...a,...values}:a)}));
  const editMini=values=>onChange(c=>({...c,minigames:c.minigames.map(m=>m.id===mini.id?{...m,...values}:m)}));
  const add=(kind,position)=>perform(()=>{
    if(kind.startsWith('template:')){const template=content.editorTemplates.find(t=>t.id===kind.slice(9));if(!template)throw Error('Plantilla inexistente.');onChange(placeTemplate(content,regionId,template,position));setPlacing(null);return;}
    const chosen=kind==='chest'?ASSET_CATALOG.assets.find(a=>a.url==='/models/props/chest_wood.glb'):asset;
    if(!chosen)throw Error('Selecciona un modelo de la biblioteca.');
    if(kind==='creature'&&chosen.category!=='WORLD_CREATURE')throw Error('Selecciona una criatura del catalogo.');
    if(kind==='npc'&&chosen.category!=='CHARACTER_PLAYER')throw Error('Selecciona un personaje del catalogo.');
    if(kind==='destructible'&&!['PROP','DESTRUCTIBLE','DECORATION'].includes(chosen.category))throw Error('Selecciona un prop compatible.');
    if(kind==='decoration'&&['PET','WORLD_CREATURE','CHARACTER_PLAYER'].includes(chosen.category))throw Error('Usa el tipo de objeto correspondiente al personaje. Las mascotas se asignan como recompensas.');
    const result=addSceneRecord(content,regionId,kind,chosen,position,globals[0]?.id);onChange(result.content);setSelection(result.key);setPlacing(null);
  });
  function duplicate(){perform(()=>{
    if(record.editor?.locked)throw Error('Desbloquea este elemento antes de duplicarlo.');
    if(record.collection==='gates')throw Error('Crea una nueva puerta para darle su propio minijuego.');
    const raw=record.collection==='instances'?region.instances.find(i=>i.id===record.id):content[record.collection].find(i=>i.id===record.id);
    const id=newId('copy'),copy={...structuredClone(raw),id,position:[raw.position[0]+2,raw.position[1],raw.position[2]]};
    let next=record.collection==='instances'?{...content,world:content.world.map(r=>r.id===regionId?{...r,instances:[...r.instances,copy]}:r)}:{...content,[record.collection]:[...content[record.collection],copy]};
    if(activity){const aid=newId('activity');next={...next,activities:[...next.activities,{...structuredClone(activity),id:aid,instanceId:id,compositionId:regionId,type:'LESSON_CHEST',label:'Cofre musical',requirements:{completedObjects:[]},progressionReward:{id:`${id}-progress`,type:'REGION_PROGRESS',regionId:region.regionId,unlocks:[],segmentCompleted:false,label:'Cofre completado'}}]};}
    onChange(next);setSelection(`${record.collection}:${id}`);
  });}
  return <section className="visual-world-editor">
    <div className="admin-toolbar"><select aria-label="Region del editor" value={regionId} onChange={e=>{setRegionId(e.target.value);selectKeys([]);setLayerFilter('');setPlacing(null);}}>{content.world.map(r=><option key={r.id} value={r.id}>{r.regionId.replaceAll('_',' ')} · {r.id}</option>)}</select>
      {[['translate',Move,'Mover'],['rotate',Rotate3d,'Rotar'],['scale',Scaling,'Dimensionar']].map(([value,icon,label])=><IconButton key={value} icon={icon} label={label} className={mode===value?'selected':''} onClick={()=>setMode(value)}/>)}
      <IconButton icon={Focus} label="Encuadrar seleccion" disabled={!record} onClick={()=>setFocus(v=>v+1)}/><label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)}/> Ajuste</label><label><input type="checkbox" checked={bounds} onChange={e=>setBounds(e.target.checked)}/> Limites</label>
      {placing&&<button className="selected" onClick={()=>setPlacing(null)}><MapPin size={16}/>Cancelar colocacion</button>}
      <button onClick={()=>{const position=record?.position||binding.spawn?.position||[0,0,5];onTest([position[0]+2,0,position[2]+2]);}}><Play size={16}/>Probar borrador</button>
    </div>
    <AuthoringTools content={content} regionId={regionId} records={records} keys={selectedKeys} onChange={onChange} onSelect={selectKeys} onPlace={id=>setPlacing(`template:${id}`)} onError={setError}/>
    {error&&<p className="admin-error" role="alert">{error}</p>}
    <div className="visual-editor-layout">
      <aside className="editor-library"><div className="editor-tabs"><button className={tab==='objects'?'selected':''} onClick={()=>setTab('objects')}><Eye size={16}/>Objetos</button><button className={tab==='library'?'selected':''} onClick={()=>setTab('library')}><Boxes size={16}/>Biblioteca</button></div>
        <label className="editor-search"><Search size={16}/><input aria-label="Buscar elementos" placeholder="Buscar" value={query} onChange={e=>setQuery(e.target.value)}/></label>
        {tab==='objects'?<><select aria-label="Filtrar capa" value={layerFilter} onChange={e=>setLayerFilter(e.target.value)}><option value="">Todas las capas</option>{[...new Set(records.map(r=>r.editor?.layer||'Sin capa'))].map(l=><option key={l}>{l}</option>)}</select><div className="editor-object-list">{visibleRecords.filter(r=>`${r.id} ${r.label||''}`.toLowerCase().includes(query.toLowerCase())).map(r=><div className="editor-selection-row" key={r.key}><input type="checkbox" aria-label={`Seleccionar ${r.id}`} checked={selectedKeys.includes(r.key)} onChange={()=>select(r.key,true)}/><button className={selectedKeys.includes(r.key)?'selected':''} onClick={e=>select(r.key,e.ctrlKey||e.metaKey||e.shiftKey)}><span>{r.label||r.id}<small>{r.collection}{r.editor?.locked?' · Bloqueado':''}{r.editor?.hidden?' · Oculto':''}</small></span></button></div>)}</div></>:<>
          <select aria-label="Categoria de biblioteca" value={category} onChange={e=>setCategory(e.target.value)}>{ASSET_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
          <div className="editor-asset-grid">{ASSET_CATALOG.assets.filter(a=>a.category===category&&a.name.toLowerCase().includes(query.toLowerCase())).map(a=><button key={a.id} className={assetId===a.id?'selected':''} title={a.name} onClick={()=>setAssetId(a.id)}>{a.previewUrl?<img src={a.previewUrl} alt=""/>:<Boxes size={26}/>}<span>{a.name}</span></button>)}</div>
          {asset&&<><ContentPreview asset={asset}/><small>{asset.name}</small><button onClick={()=>setPlacing(asset.category==='WORLD_CREATURE'?'creature':asset.category==='CHARACTER_PLAYER'?'npc':'decoration')} disabled={asset.category==='PET'}><Plus size={16}/>Colocar</button>{['PROP','DESTRUCTIBLE','DECORATION'].includes(asset.category)&&<button onClick={()=>setPlacing('destructible')}><Shield size={16}/>Destructible</button>}</>}
        </>}
        <div className="editor-add-tools"><button onClick={()=>setPlacing('chest')}><Gift size={16}/>Cofre</button><button onClick={()=>setPlacing('gate')}><DoorOpen size={16}/>Puerta musical</button></div>
      </aside>
      <WorldEditorViewport region={region} records={visibleRecords} selectedKey={selection} selectedKeys={selectedKeys} onSelect={select} onTransform={transform} mode={mode} snap={snap} showBounds={bounds} focusToken={focus} onPlacement={placing?position=>add(placing,position):null}/>
      <aside className="editor-inspector">{record?<>
        <div className="admin-toolbar"><h2>{activity?.label||record.id}</h2><IconButton icon={Copy} label="Duplicar" onClick={duplicate}/><IconButton icon={Trash2} label="Eliminar" onClick={()=>perform(()=>{if(confirm('Eliminar este elemento del borrador?')){onChange(removeSceneRecord(content,regionId,record));setSelection('');}})}/></div>
        <fieldset className="editor-properties" disabled={!!record.editor?.locked}>
        {['position','rotation','scale'].map(field=><fieldset className="editor-vector" key={field}><legend>{field==='position'?'Posicion':field==='rotation'?'Rotacion (grados)':'Escala'}</legend>{record[field].map((value,i)=><label key={i}>{['X','Y','Z'][i]}<input type="number" disabled={field==='rotation'&&i!==1&&(record.collection==='residents'||record.collision?.type==='solid'||record.collection==='worldActions'||record.collection==='gates')} aria-label={`${field} ${['X','Y','Z'][i]}`} step={field==='rotation'?5:.1} min={field==='scale'?.01:undefined} value={field==='rotation'?Math.round(value*180/Math.PI*100)/100:value} onChange={e=>{const n=Number(e.target.value);patch({[field]:record[field].map((v,j)=>j===i?(field==='rotation'?n*Math.PI/180:n):v)});}}/></label>)}</fieldset>)}
        {record.collection==='instances'&&<><label>Suelo<select value={record.grounding} onChange={e=>patch({grounding:e.target.value})}><option value="terrain">Apoyado en terreno</option><option value="absolute">Altura absoluta</option></select></label><label>Colision<select value={record.collision?.type||'none'} onChange={e=>patch({collision:e.target.value==='none'?{type:'none'}:{type:'solid',shape:'box',source:'bounds'}})}><option value="none">Ninguna</option><option value="solid">Solida</option></select></label></>}
        {activity?.id==='plaza-first-lesson'&&<label>Leccion inicial (hasta 100 BPM)<select value={activity.introLessonId??1} onChange={e=>editActivity({introLessonId:Number(e.target.value)})}>{globals.filter(l=>Number(l.speed)>300?60000/Number(l.speed)<=100:Number(l.speed)<=100).map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>}
        {activity&&<><label>Nombre<input value={activity.label||activity.id} onChange={e=>editActivity({label:e.target.value})}/></label><label>Leccion<select value={activity.lessonId||''} onChange={e=>editActivity({lessonId:Number(e.target.value),assignmentStatus:'VERIFICADA'})}>{globals.map(l=><option value={l.id} key={l.id}>{l.title}</option>)}</select></label><button onClick={()=>onEditLesson(lessons.find(l=>String(l.id)===String(activity.lessonId)))}><Music size={16}/>Editar leccion</button><label>Recompensa<select value={activity.rewardId||''} onChange={e=>editActivity({rewardId:e.target.value||null})}><option value="">Ninguna</option>{content.rewards.filter(r=>r.enabled).map(r=><option key={r.id}>{r.id}</option>)}</select></label><label>Radio de interaccion<input type="number" min=".5" max="20" step=".1" value={record.interaction?.radius||3} onChange={e=>patch({interaction:{key:'KeyE',radius:Number(e.target.value)}})}/></label>
          {activity.id.startsWith('editor-')&&<label>Requisitos<select multiple value={activity.requirements.completedObjects} onChange={e=>editActivity({requirements:{completedObjects:Array.from(e.target.selectedOptions,o=>o.value)}})}>{content.activities.filter(a=>a.id!==activity.id&&a.type!=='PRACTICE_STATION').map(a=><option key={a.id} value={a.id}>{a.label||a.id}</option>)}</select></label>}
        </>}
        {record.collection==='worldActions'&&<><label>Activo<input type="checkbox" disabled={record.firstMinutesOnly} checked={record.enabledInWorld} onChange={e=>patch({enabledInWorld:e.target.checked})}/></label><label>Impactos<input type="number" min="1" max="3" value={record.hitsRequired} onChange={e=>patch({hitsRequired:Number(e.target.value)})}/></label><label>Comportamiento<select value={record.behaviorType} onChange={e=>patch({behaviorType:e.target.value})}><option value="stationary">Quieto</option><option value="wander">Explorar / perseguir</option></select></label><label>Recompensa<select value={record.optionalReward||''} onChange={e=>patch({optionalReward:e.target.value||null})}><option value="">Ninguna</option>{content.rewards.filter(r=>r.enabled&&(r.type==='SECRET'||r.id===record.optionalReward)).map(r=><option key={r.id} disabled={r.type!=='SECRET'}>{r.id}{r.type!=='SECRET'?' (legacy, sin premio Adventure)':''}</option>)}</select></label></>}
        {record.collection==='residents'&&<><label><User size={16}/>Personaje<select value={record.characterId} onChange={e=>patch({characterId:Number(e.target.value)})}>{ASSET_CATALOG.assets.filter(a=>a.category==='CHARACTER_PLAYER').map(a=><option key={a.id} value={Number(a.id.split(':')[1])}>{a.name}</option>)}</select></label><label>Celebrar actividades<select multiple value={record.watch||[]} onChange={e=>patch({watch:Array.from(e.target.selectedOptions,o=>o.value)})}>{content.activities.map(a=><option key={a.id} value={a.id}>{a.label||a.id}</option>)}</select></label><label>Caminar<input type="checkbox" checked={!!record.walk} onChange={e=>patch({walk:e.target.checked?[[record.position[0],record.position[2]],[record.position[0]+2,record.position[2]]]:undefined})}/></label>{record.walk?.map((point,index)=><fieldset className="editor-vector" key={index}><legend>Punto {index+1}</legend>{point.map((value,axis)=><label key={axis}>{axis===0?'X':'Z'}<input type="number" step=".5" value={value} onChange={e=>patch({walk:record.walk.map((p,i)=>i===index?p.map((n,j)=>j===axis?Number(e.target.value):n):p)})}/></label>)}</fieldset>)}</>}
        {mini&&<><label>Puerta activa<input type="checkbox" checked={record.enabled} onChange={e=>patch({enabled:e.target.checked})}/></label><label>Minijuego<select value={record.minigameId} onChange={e=>patch({minigameId:e.target.value})}>{content.minigames.filter(m=>m.enabled).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label><MinigameFields definition={mini} rewards={content.rewards} onChange={editMini}/></>}
        </fieldset>
      </>:<h2>{placing?'Elegir lugar en el terreno':'Seleccionar elemento'}</h2>}</aside>
    </div>
  </section>;
}
