import { useState } from 'react';
import { Play, UserRound, PawPrint, Swords, Map, Settings, LogOut, X } from 'lucide-react';
import { ValleyButton } from '../presentation/ValleyUI.jsx';
import { readMusicSettings, saveMusicSettings } from '../audio/worldMusic.js';
import VisualCustomizer from '../presentation/VisualCustomizer.jsx';

export default function AdventurerMenu({profile,gameplay,onClose,onApply,onMap,onExit,initialTab='MENU'}) {
  const [tab,setTab]=useState(initialTab.toUpperCase());
  const [music,setMusic]=useState(()=>readMusicSettings(globalThis.localStorage));
  const changeMusic=value=>{const next={...music,...value};setMusic(next);saveMusicSettings(globalThis.localStorage,next);window.dispatchEvent(new Event('valley-music-settings'));};
  if(['CHARACTER','EQUIPMENT','PET','COLLECTION'].includes(tab))return <VisualCustomizer profile={profile} gameplay={gameplay} initialTab={tab} onSelect={onApply} onClose={onClose}/>;
  return <div className="gameplay-overlay"><section className="gameplay-panel adventurer-panel" role="dialog" aria-modal="true" aria-label="Menu del aventurero">
    <button className="gameplay-close" onClick={onClose} title="Volver al mundo" aria-label="Volver al mundo"><X/></button><h2>{tab==='MENU'?'Tu aventura':'Configuracion'}</h2>
    {tab==='MENU'?<div className="adventurer-menu-list">{[[Play,'Continuar',onClose],[UserRound,'Personaje y mascota',()=>setTab('CHARACTER')],[Swords,'Armas / habilidades',()=>setTab('EQUIPMENT')],[PawPrint,'Coleccion de mascotas',()=>setTab('COLLECTION')],[Map,'Mapa del Valle',onMap],[Settings,'Configuracion',()=>setTab('SETTINGS')],[LogOut,'Salir al inicio',onExit]].map(([Icon,label,action])=><ValleyButton key={label} tone="dark" onClick={action}><Icon size={20}/>{label}</ValleyButton>)}</div>:<>
      {tab==='SETTINGS' && <><label>Volumen de musica<input type="range" min="0" max="100" value={Math.round(music.volume*100)} onChange={e=>changeMusic({volume:Number(e.target.value)/100})}/></label><label>Silenciar musica<input type="checkbox" checked={music.muted} onChange={e=>changeMusic({muted:e.target.checked})}/></label></>}
      <div className="gameplay-buttons"><ValleyButton tone="dark" onClick={()=>setTab('MENU')}>Volver</ValleyButton></div>
    </>}
  </section></div>;
}
