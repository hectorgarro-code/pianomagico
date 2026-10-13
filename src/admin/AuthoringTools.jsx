import {useState} from 'react';
import {Group,LockKeyhole,UnlockKeyhole,Eye,EyeOff,AlignHorizontalJustifyStart,AlignVerticalJustifyStart,Layers,Save} from 'lucide-react';
import {authorMetadata,alignSelection,saveTemplate} from './editorAuthoring.js';

export default function AuthoringTools({content,regionId,records,keys,onChange,onSelect,onPlace,onError}) {
  const [name,setName]=useState(''),[layer,setLayer]=useState('Decoracion');
  const selected=records.filter(r=>keys.includes(r.key));
  const run=fn=>{try{onError('');onChange(fn());}catch(e){onError(e.message);}};
  const meta=values=>run(()=>authorMetadata(content,regionId,records,keys,values));
  return <details className="editor-authoring"><summary><Layers size={16}/>Autoria · {selected.length} seleccionados</summary>
    <div className="admin-toolbar">
      <input aria-label="Nombre de grupo o plantilla" maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre"/>
      <button disabled={!selected.length||!name.trim()} onClick={()=>meta({group:name.trim()})}><Group size={16}/>Agrupar</button>
      <button disabled={!selected.length} onClick={()=>meta({group:''})}>Separar</button>
      <button disabled={!selected[0]?.editor?.group} onClick={()=>onSelect(records.filter(r=>r.editor?.group===selected[0].editor.group).map(r=>r.key))}>Seleccionar grupo</button>
      <input aria-label="Capa de seleccion" maxLength={80} value={layer} onChange={e=>setLayer(e.target.value)}/>
      <button disabled={!selected.length||!layer.trim()} onClick={()=>meta({layer:layer.trim()})}>Asignar capa</button>
      <button title="Bloquear seleccion" aria-label="Bloquear seleccion" disabled={!selected.length} onClick={()=>meta({locked:true})}><LockKeyhole size={16}/></button>
      <button title="Desbloquear seleccion" aria-label="Desbloquear seleccion" disabled={!selected.length} onClick={()=>meta({locked:false})}><UnlockKeyhole size={16}/></button>
      <button title="Ocultar en editor" aria-label="Ocultar en editor" disabled={!selected.length} onClick={()=>meta({hidden:true})}><EyeOff size={16}/></button>
      <button title="Mostrar en editor" aria-label="Mostrar en editor" disabled={!selected.length} onClick={()=>meta({hidden:false})}><Eye size={16}/></button>
      <button title="Alinear X" aria-label="Alinear X" disabled={selected.length<2} onClick={()=>run(()=>alignSelection(content,regionId,records,keys,'X'))}><AlignHorizontalJustifyStart size={16}/></button>
      <button title="Alinear Z" aria-label="Alinear Z" disabled={selected.length<2} onClick={()=>run(()=>alignSelection(content,regionId,records,keys,'Z'))}><AlignVerticalJustifyStart size={16}/></button>
      <button disabled={!selected.length||!name.trim()} onClick={()=>run(()=>saveTemplate(content,records,keys,name))}><Save size={16}/>Guardar plantilla</button>
    </div>
    <div className="admin-toolbar">{(content.editorTemplates||[]).map(t=><button key={t.id} onClick={()=>onPlace(t.id)}>{t.name}</button>)}</div>
  </details>;
}
