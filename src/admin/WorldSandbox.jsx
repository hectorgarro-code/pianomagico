import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {X,FlaskConical} from 'lucide-react';
import {applyGameContent,createDefaultContent} from '../game/content/contentDefaults.js';
import World3DView from '../game/world/World3DView.jsx';
import PianoMagico from '../modules/piano-magico/PianoMagico.jsx';
import MinigameView from '../game/gameplay/MinigameView.jsx';
import {createAdventureState,findAdventureObject,beginAdventureActivity,settleAdventureActivity} from '../game/adventure/adventureState.js';
import {createGameplayState,completeMinigame} from '../game/gameplay/gameplayState.js';
import {applyToyEvent} from '../game/adventure/toyState.js';
import {calculateTerrainElevation} from '../game/world/worldGenerationRules.js';
import {getGameplayContent} from '../game/gameplay/gameplayContent.js';

function SandboxSession({content,lessons,spawn,onClose}) {
  const [adventure,setAdventure]=useState(()=>{const a=createAdventureState();a.journey.started=true;return a;}),[gameplay,setGameplay]=useState(()=>createGameplayState(null,content));
  const [lesson,setLesson]=useState(null),[mini,setMini]=useState(null),[completed,setCompleted]=useState([]),[context,setContext]=useState(null);
  const enter=(song,mode,worldContext)=>{setContext(worldContext);setAdventure(a=>beginAdventureActivity(a,worldContext.stationId,song.id));setLesson({song,mode,context:worldContext});};
  return <div className="editor-sandbox">
    <div className="editor-sandbox-bar"><FlaskConical size={18}/><strong>PRUEBA DEL BORRADOR</strong><span>Sin guardar progreso ni otorgar XP</span><button aria-label="Cerrar prueba" title="Cerrar prueba" onClick={onClose}><X size={20}/></button></div>
    <World3DView sessionKey="admin-preview" profile={{avatarId:1,name:'PREVIEW'}} songs={lessons.filter(l=>l.enabled&&l.user_id===null)} adventureState={adventure} gameplayState={gameplay} active={!lesson&&!mini}
      initialPosition={{x:spawn[0],y:calculateTerrainElevation(spawn[0],spawn[2]),z:spawn[2]}} returnContext={context} completedStationIds={completed}
      onEnterLesson={enter} onDiscoverAdventure={(id,worldContext)=>{const object=findAdventureObject(id),song=lessons.find(l=>String(l.id)===String(object?.activityId));if(song)enter(song,'solo',worldContext);}}
      onToyEvent={event=>setAdventure(a=>applyToyEvent(a,event))} onMinigame={id=>setMini(content.minigames.find(m=>m.id===id))}/>
    {lesson&&<div className="editor-sandbox-piano"><PianoMagico initialSong={lesson.song} initialMode={lesson.mode} initialView="game" preparationComplete adminPreview
      onExit={()=>{setAdventure(a=>settleAdventureActivity(a,lesson.context.stationId,{activityId:lesson.song.id,completed:false,cancelled:true}));setLesson(null);}} onFinishLesson={result=>{setAdventure(a=>settleAdventureActivity(a,lesson.context.stationId,result));if(result.completed)setCompleted(ids=>[...new Set([...ids,lesson.context.stationId])]);setLesson(null);}}/></div>}
    {mini&&<MinigameView key={mini.id} definition={mini} onClose={()=>setMini(null)} onComplete={()=>{setGameplay(s=>completeMinigame(s,mini.id,true,{...content,rewards:content.rewards.filter(r=>r.type!=='PET')}).state);setMini(null);}}/>}
  </div>;
}
export default function WorldSandbox(props) {
  const [ready,setReady]=useState(false),[error,setError]=useState('');
  useEffect(()=>{let live=true;const baseline={...createDefaultContent(),...structuredClone(getGameplayContent())};Promise.resolve().then(()=>{if(!live)return;try{applyGameContent(props.content);setReady(true);}catch(e){setError(e.message);}});return()=>{live=false;applyGameContent(baseline);};},[props.content]);
  return createPortal(error?<div className="admin-modal"><section className="admin-error"><p role="alert">{error}</p><button onClick={props.onClose}>Cerrar prueba</button></section></div>:ready?<SandboxSession {...props}/>:<div className="admin-modal" role="status">Preparando prueba...</div>,document.body);
}
