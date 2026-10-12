import { useEffect, useRef, useState } from 'react';
import { UserRound, Swords, PawPrint, BookOpen, ChevronLeft, ChevronRight, Check, Lock, Sword, RotateCw, CircleSlash, Music2, Shield, WandSparkles, Crosshair, Play } from 'lucide-react';
import AssetStage from '../gameplay/AssetStage.jsx';
import { EQUIPMENT, readEquipment } from './characterEquipment.js';
import { getGameplayContent } from '../gameplay/gameplayContent.js';
import VisualPreview from './VisualPreview.jsx';
import './visualChildUI.css';

const heroes=['Knight','Mage','Barbarian','Rogue','Ranger'];
const categories=[['CHARACTER',UserRound,'Personaje'],['EQUIPMENT',Swords,'Armas'],['PET',PawPrint,'Mascotas'],['COLLECTION',BookOpen,'Coleccion']];
export default function VisualCustomizer({ profile, gameplay, onSelect, onClose, onConfirm, confirmLabel, initialTab='CHARACTER' }) {
  const dialog=useRef(null),touch=useRef(null),swipeTime=useRef(-Infinity);
  const [tab,setTab]=useState(initialTab),[character,setCharacter]=useState(profile.avatarId),[equipment,setEquipment]=useState(()=>readEquipment(profile.user_id??profile.id,profile.avatarId));
  const [pet,setPet]=useState(gameplay?.equippedPetId??null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[page,setPage]=useState(0),[action,setAction]=useState(null),[rotation,setRotation]=useState(0);
  const [compact,setCompact]=useState(false),pageSize=compact?6:9;
  useEffect(()=>{const media=matchMedia('(max-width:700px)'),update=()=>{setCompact(media.matches);setPage(0);};update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  const pets=getGameplayContent().pets, unlocked=gameplay?.unlockedPets || [];
  const selectedPet=pets.find(p=>p.id===pet)?.assetId || null;
  const express=key=>setAction({key,token:performance.now()});
  useEffect(()=>{const previous=document.activeElement;dialog.current?.querySelector('button')?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
  useEffect(()=>{
    const key=event=>{
      if(event.code==='Tab'){event.preventDefault();event.stopImmediatePropagation();const buttons=Array.from(dialog.current.querySelectorAll('button:not(:disabled)')).filter(b=>b.getClientRects().length),index=buttons.indexOf(document.activeElement);buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();return;}
      if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(!busy)onClose();return;}
      if(event.repeat||event.target.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
      if(event.code==='KeyQ'||event.code==='KeyE'){event.preventDefault();event.stopImmediatePropagation();express(event.code==='KeyQ'?'Q':'E');}
    };
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
  },[busy,onClose]);
  const choose=async(c,e,p)=>{
    if(busy||performance.now()-swipeTime.current<300)return;
    const previous=[character,equipment,pet];setCharacter(c);setEquipment(e);setPet(p);setBusy(true);setError('');
    try{await onSelect?.(c,e,p);express('Q');}
    catch{setCharacter(previous[0]);setEquipment(previous[1]);setPet(previous[2]);setError('No se pudo guardar. Reintenta.');}
    finally{setBusy(false);}
  };
  const changeTab=value=>{setTab(value);setPage(0);};
  const equipped=(EQUIPMENT[character]||EQUIPMENT[1]).find(e=>e.id===equipment),PrimaryIcon=character===2?WandSparkles:character>=4?Crosshair:Sword,SecondaryIcon=equipped?.E==='Block'?Shield:RotateCw;
  const actionButtons=<div className="visual-actions"><button aria-label="Probar accion Q" title="Accion primaria" onClick={()=>express('Q')}><PrimaryIcon size={31}/><kbd>Q</kbd></button><button aria-label="Probar accion E" title="Accion secundaria" onClick={()=>express('E')}><SecondaryIcon size={31}/><kbd>E</kbd></button></div>;
  const finish=async()=>{
    if(busy)return;
    if(!onConfirm){onClose();return;}
    setBusy(true);setError('');
    try{await onConfirm(character,equipment,pet);}
    catch{setError('No se pudo guardar. Reintenta.');}
    finally{setBusy(false);}
  };
  const entries=tab==='CHARACTER'?heroes.map((name,index)=>({id:index+1,name,characterId:index+1})):
    tab==='EQUIPMENT'?(EQUIPMENT[character]||EQUIPMENT[1]).map(eq=>({...eq,characterId:character,weapon:true})):
    pets.slice(page*pageSize,page*pageSize+pageSize).map(p=>({...p,petId:p.assetId,locked:!unlocked.includes(p.id)}));
  return <section ref={dialog} className={'visual-customizer '+(tab==='CHARACTER'?'is-character-showcase ': '')+(['PET','COLLECTION'].includes(tab)?'is-pet-gallery':'')} role="dialog" aria-modal="true" aria-label="Personalizar aventurero">
    <img className="visual-sanctuary" src="images/entry/character-sanctuary-v1.webp" alt="" aria-hidden="true"/>
    <header className="visual-customizer-header"><button onClick={onClose} disabled={busy} aria-label="Volver" title="Volver"><ChevronLeft/></button><h2>{tab==='CHARACTER'?'Elige tu aventurero':tab==='EQUIPMENT'?'Elige tu arma':tab==='PET'?'Elige tu mascota':'Tu coleccion'}</h2></header>
    <nav className="visual-categories" aria-label="Personalizacion">{categories.map(([id,Icon,label])=><button key={id} aria-label={label} title={label} aria-pressed={tab===id} onClick={()=>changeTab(id)}><Icon size={30}/></button>)}</nav>
    <div className="visual-hero-stage"><AssetStage characterId={character} equipment={equipment} petId={selectedPet} action={action} manualRotation={rotation} autoDemo={tab==='CHARACTER'} interactive platform/>
      <div className="visual-rotation"><button aria-label="Girar a la izquierda" title="Girar a la izquierda" onClick={()=>setRotation(r=>r-.5)}><ChevronLeft/></button><button aria-label="Girar a la derecha" title="Girar a la derecha" onClick={()=>setRotation(r=>r+.5)}><ChevronRight/></button></div>
      {tab!=='CHARACTER'&&actionButtons}
    </div>
    <aside className="visual-choice-tray" key={tab} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(!touch.current||!['PET','COLLECTION'].includes(tab))return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>60&&Math.abs(dy)<60){swipeTime.current=performance.now();setPage(p=>Math.max(0,Math.min(Math.ceil(pets.length/pageSize)-1,p+(dx<0?1:-1))));}touch.current=null;}}>
      <div className={'visual-choice-grid '+(tab==='CHARACTER'?'is-heroes':'')}>{entries.map(entry=>{
        const selected=tab==='CHARACTER'?character===entry.id:tab==='EQUIPMENT'?equipment===entry.id:pet===entry.id;
        return <button key={entry.id} disabled={busy||entry.locked} aria-label={entry.locked?'Mascota por descubrir':entry.name||entry.label} title={entry.locked?'Por descubrir':entry.name||entry.label} aria-pressed={selected} className={entry.locked?'is-locked':''}
          onClick={()=>tab==='CHARACTER'?choose(entry.id,readEquipment(profile.user_id??profile.id,entry.id),pet):tab==='EQUIPMENT'?choose(character,entry.id,pet):choose(character,equipment,entry.id)}>
          {entry.locked?<><PawPrint className="pet-silhouette" size={45}/><Lock className="visual-lock" size={23}/></>:<VisualPreview characterId={entry.characterId} equipment={tab==='EQUIPMENT'?entry.id:undefined} petId={entry.petId} weapon={entry.weapon} portrait={tab==='CHARACTER'}/>}
          {selected&&<Check className="visual-selected" size={22}/>}
        </button>;
      })}</div>
      {(tab==='PET'||tab==='COLLECTION')&&<div className="visual-pages"><button disabled={page===0} aria-label="Mascotas anteriores" onClick={()=>setPage(p=>p-1)}><ChevronLeft/></button>{Array.from({length:Math.ceil(pets.length/pageSize)},(_,i)=><button className="visual-page-dot" key={i} aria-label={'Pagina '+(i+1)} aria-pressed={page===i} onClick={()=>setPage(i)}/>) }<button disabled={(page+1)*pageSize>=pets.length} aria-label="Mas mascotas" onClick={()=>setPage(p=>p+1)}><ChevronRight/></button><button disabled={busy||!pet} aria-label="Sin mascota" title="Sin mascota" onClick={()=>choose(character,equipment,null)}><CircleSlash/></button></div>}
    </aside>
    {tab==='CHARACTER'&&<aside className="visual-character-info" aria-label="Informacion del aventurero">
      <h3>{heroes[character-1]}</h3>
      <dl><div><dt><Music2 size={25}/><span className="sr-only">Instrumento</span></dt><dd>Piano</dd></div>
        <div><dt><PrimaryIcon size={25}/><span className="sr-only">Arma equipada</span></dt><dd>{equipped?.label}</dd></div>
        <div><dt><PawPrint size={25}/><span className="sr-only">Mascota</span></dt><dd>{pets.find(p=>p.id===pet)?.name||'Sin mascota'}</dd></div>
      </dl>{actionButtons}
    </aside>}
    <footer className="visual-customizer-footer"><button className="visual-confirm" disabled={busy} onClick={finish} aria-label={confirmLabel||(onConfirm?'Confirmar':'Listo')}>{confirmLabel==='JUGAR'?<Play fill="currentColor"/>:<Check/>}{confirmLabel||(onConfirm?'Seleccionar':'Listo')}</button>{busy&&<span className="visual-save-pulse" role="status" aria-label="Guardando"/>}</footer>
    {error&&<p className="visual-error" role="alert">{error}</p>}
  </section>;
}
