import {useEffect,useRef,useState} from 'react';
import { PawPrint, Play, Star } from 'lucide-react';
import { ValleyButton } from '../presentation/ValleyUI.jsx';
import AssetStage from './AssetStage.jsx';
import './rewardLoop.css';
import {createToyNoteSound} from '../audio/toyNoteSound.js';
import {readMusicSettings} from '../audio/worldMusic.js';
import {usePianoMicStore} from '../../hooks/usePianoMicStore.js';

export default function ValleyActivityResult({result,pet,characterId,pending=false,saveFailed=false,onContinue,onEquip}) {
  const [revealed,setRevealed]=useState(false),[previewReady,setPreviewReady]=useState(false),dialog=useRef(null);
  useEffect(()=>{setPreviewReady(false);setRevealed(false);},[pet?.assetId]);
  useEffect(()=>{if(pending||!previewReady)return;const timer=setTimeout(()=>setRevealed(true),1100);return()=>clearTimeout(timer);},[pending,previewReady]);
  useEffect(()=>{const previous=document.activeElement;dialog.current?.focus();return()=>{if(previous?.isConnected)previous.focus();};},[]);
  const ready=revealed&&!pending;
  useEffect(()=>{
    if(!ready||!result.completed)return;
    const sound=createToyNoteSound();let played=false;
    const silent=()=>{const settings=readMusicSettings(globalThis.localStorage);return document.hidden||settings.muted||settings.volume===0||usePianoMicStore.getState().isListening;};
    const play=()=>{if(played||silent())return;sound.unlock();queueMicrotask(()=>{if(!silent())played=sound.cue(pet?'reward':'chest',{volume:readMusicSettings(globalThis.localStorage).volume});});};
    const stop=()=>{if(silent())sound.stop();};
    const unsubscribe=usePianoMicStore.subscribe(stop);
    play();window.addEventListener('pointerdown',play);document.addEventListener('visibilitychange',stop);window.addEventListener('valley-audio-preferences',stop);
    return()=>{unsubscribe();sound.dispose();window.removeEventListener('pointerdown',play);document.removeEventListener('visibilitychange',stop);window.removeEventListener('valley-audio-preferences',stop);};
  },[ready,result.completed,pet?.assetId]);
  return <section ref={dialog} tabIndex={-1} className="reward-valley" role="dialog" aria-modal="true" aria-label={pet?'Nueva mascota':'Resultado de actividad'}>
    <img className="reward-valley-background" src={`${import.meta.env.BASE_URL}images/entry/character-sanctuary-v1.webp`} alt=""/>
    <header className="reward-valley-heading"><div className="reward-valley-stars" aria-label={result.completed?(result.errors===0?'3 estrellas':'2 estrellas'):'Sigue practicando'}>{[0,1,2].map(i=><Star key={i} size={44} fill={result.completed&&i<(result.errors===0?3:2)?'currentColor':'none'}/>)}</div><h2>{result.completed?'¡LO LOGRASTE!':'SEGUÍ PRACTICANDO'}</h2></header>
    <AssetStage characterId={characterId} petId={pet?.assetId} celebration={result.completed} rewardMode reveal={ready?1:0} autoDemo={false} interactive platform onReady={()=>setPreviewReady(true)}/>
    <span className="sr-only">{result.xp??0} XP educativos</span>
    <footer className="reward-valley-footer"><h3 aria-live="polite">{ready&&pet?result.returningFriend?'¡TU COMPAÑERO!':'¡NUEVO AMIGO!':pending?'GUARDANDO':saveFailed?'GUARDADO PENDIENTE':''}</h3>{ready&&pet&&<p>{pet.name}</p>}
      <div className="gameplay-buttons">{pet&&<ValleyButton disabled={!ready} onClick={onEquip}><PawPrint/>EQUIPAR</ValleyButton>}<ValleyButton disabled={!ready} tone={pet?'violet':'green'} onClick={onContinue}><Play fill="currentColor"/>CONTINUAR</ValleyButton></div>
    </footer>
  </section>;
}
