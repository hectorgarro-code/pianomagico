import { useMemo, useState } from 'react';
import { Play, UserRound, PawPrint, Swords, Map, Settings, LogOut, X, Lock, Check } from 'lucide-react';
import { ValleyButton } from '../presentation/ValleyUI.jsx';
import { EQUIPMENT, readEquipment } from '../presentation/characterEquipment.js';
import { getGameplayContent } from './gameplayContent.js';
import AssetStage from './AssetStage.jsx';
import { readMusicSettings, saveMusicSettings } from '../audio/worldMusic.js';

export default function AdventurerMenu({profile,gameplay,onClose,onApply,onMap,onExit}) {
  const [tab,setTab]=useState('MENU'),[character,setCharacter]=useState(profile.avatarId),[pet,setPet]=useState(gameplay.equippedPetId);
  const [equipment,setEquipment]=useState(()=>readEquipment(profile.user_id??profile.id,profile.avatarId)),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [music,setMusic]=useState(()=>readMusicSettings(globalThis.localStorage));
  const changeMusic=value=>{const next={...music,...value};setMusic(next);saveMusicSettings(globalThis.localStorage,next);window.dispatchEvent(new Event('valley-music-settings'));};
  const pets=getGameplayContent().pets,unlocked=useMemo(()=>gameplay.unlockedPets,[gameplay.unlockedPets]);
  const unlockedModels=useMemo(()=>pets.filter(p=>unlocked.includes(p.id)).map(p=>p.assetId),[pets,unlocked]);
  const apply=async()=>{setBusy(true);setError('');try{await onApply(character,equipment,pet);onClose();}catch{setError('No se pudieron guardar los cambios. Reintenta.');}finally{setBusy(false);}};
  return <div className="gameplay-overlay"><section className="gameplay-panel adventurer-panel" role="dialog" aria-modal="true" aria-label="Menu del aventurero">
    <button disabled={busy} className="gameplay-close" onClick={onClose} title="Volver al mundo" aria-label="Volver al mundo"><X/></button><h2>{tab==='MENU'?'Tu aventura':tab==='COLLECTION'?'Mi coleccion de mascotas':'Personaje, armas y mascota'}</h2>
    {tab==='MENU'?<div className="adventurer-menu-list">{[[Play,'Continuar',onClose],[UserRound,'Personaje y mascota',()=>setTab('CHARACTER')],[Swords,'Armas / habilidades',()=>setTab('EQUIPMENT')],[PawPrint,'Coleccion de mascotas',()=>setTab('COLLECTION')],[Map,'Mapa del Valle',onMap],[Settings,'Configuracion',()=>setTab('SETTINGS')],[LogOut,'Salir al inicio',onExit]].map(([Icon,label,action])=><ValleyButton key={label} tone="dark" onClick={action}><Icon size={20}/>{label}</ValleyButton>)}</div>:<>
      <div className="gameplay-tabs" role="tablist">{[['CHARACTER','Personaje'],['EQUIPMENT','Armas'],['PET','Mascota'],['COLLECTION','Coleccion']].map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
      {tab==='COLLECTION'?<>{unlocked.length?<AssetStage pets={unlockedModels}/>:<p>Aun no tienes mascotas.</p>}<div className="pet-collection">{pets.map(p=><button key={p.id} disabled={!unlocked.includes(p.id)} aria-pressed={pet===p.id} onClick={()=>{setPet(p.id);setTab('PET');}}>{!unlocked.includes(p.id)?<Lock size={18}/>:pet===p.id?<Check size={18}/>:<PawPrint size={18}/>}<span>{unlocked.includes(p.id)?p.name:'???'}</span></button>)}</div></>:<AssetStage characterId={character} petId={pets.find(p=>p.id===pet)?.assetId || null} equipment={equipment}/>}
      {tab==='CHARACTER' && <div className="gameplay-tabs">{['Knight','Mage','Barbarian','Rogue','Ranger'].map((name,i)=><button key={name} aria-pressed={character===i+1} onClick={()=>{setCharacter(i+1);setEquipment(readEquipment(profile.user_id??profile.id,i+1));}}>{name}</button>)}</div>}
      {tab==='EQUIPMENT' && <><label>Armas<select value={equipment} onChange={e=>setEquipment(e.target.value)}>{(EQUIPMENT[character] || EQUIPMENT[1]).map(eq=><option key={eq.id} value={eq.id}>{eq.label}</option>)}</select></label><p>Q · {EQUIPMENT[character]?.find(eq=>eq.id===equipment)?.Q}<br/>E · {EQUIPMENT[character]?.find(eq=>eq.id===equipment)?.E}</p></>}
      {tab==='PET' && <label>Mascota<select value={pet || ''} onChange={e=>setPet(e.target.value || null)}><option value="">Sin mascota</option>{pets.filter(p=>unlocked.includes(p.id)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      {tab==='SETTINGS' && <><label>Volumen de musica<input type="range" min="0" max="100" value={Math.round(music.volume*100)} onChange={e=>changeMusic({volume:Number(e.target.value)/100})}/></label><label>Silenciar musica<input type="checkbox" checked={music.muted} onChange={e=>changeMusic({muted:e.target.checked})}/></label></>}
      <div className="gameplay-buttons"><ValleyButton tone="dark" disabled={busy} onClick={()=>setTab('MENU')}>Volver</ValleyButton>{tab!=='SETTINGS' && <ValleyButton disabled={busy} onClick={apply}>{busy?'Guardando...':'Aplicar cambios'}</ValleyButton>}</div>
    </>}{error && <p role="alert">{error}</p>}
  </section></div>;
}
