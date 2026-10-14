import {useState} from 'react';
import {Upload} from 'lucide-react';
import {contentRequest} from '../game/content/contentRepository.js';
import {setImportedAssets} from '../game/assets/assetCatalog.js';
export default function AssetImporter({onImported}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <form className="admin-record" onSubmit={async e=>{
    e.preventDefault();const form=e.currentTarget,fields=new FormData(form),file=fields.get('model');setError('');setBusy(true);
    try{if(!file?.size||file.size>4194304||!file.name.toLowerCase().endsWith('.glb'))throw Error('Selecciona un GLB autocontenido hasta 4 MB.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('No se pudo leer el modelo'));reader.readAsDataURL(file);});
      const asset=await contentRequest('import_asset',{data,name:fields.get('name'),author:fields.get('author'),license:fields.get('license'),category:fields.get('category'),rightsConfirmed:fields.get('rights')==='on'});
      const catalog=await contentRequest('public_assets');setImportedAssets(catalog.assets);onImported(asset);form.reset();
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }}><h2>Importar modelo local</h2><fieldset className="editor-behavior" disabled={busy}>
    <label>Modelo GLB<input name="model" type="file" accept=".glb" required/></label>
    <label>Nombre<input name="name" maxLength={100} required/></label><label>Autor / credito<input name="author" maxLength={100} required/></label>
    <label>Licencia<select name="license"><option value="CC0">CC0</option><option value="CC-BY-4.0">CC BY 4.0</option><option value="OWN">Propio</option></select></label>
    <label>Categoria<select name="category">{['PROP','ARCHITECTURE','VEGETATION','DECORATION','DESTRUCTIBLE'].map(c=><option key={c}>{c}</option>)}</select></label>
    <label><input type="checkbox" name="rights" required/>Tengo permiso para alojar y usar este asset con esta licencia</label>
    <button type="submit"><Upload size={16}/>{busy?'Verificando...':'Importar GLB'}</button>
  </fieldset>{error&&<p className="admin-error" role="alert">{error}</p>}</form>;
}
