import {ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Swords,Music2} from 'lucide-react';
import {FIRST_MINUTES_TARGETS} from '../world/composition/firstMinutesComposition.js';
import {PLAZA_COMPOSITION} from '../world/composition/plazaComposition.js';
import './firstMinutes.css';

export default function FirstMinutesHints({phase,position,targetPosition,onAction,onMove}) {
  const target=phase==='BREAK'?FIRST_MINUTES_TARGETS[0]:phase==='DEFEND'?FIRST_MINUTES_TARGETS[1]:null;
  const close=target&&Math.hypot(position.x-(targetPosition?.x??target.position[0]),position.z-(targetPosition?.z??target.position[2]))<2.8;
  const station=PLAZA_COMPOSITION.stations.find(s=>s.id==='plaza-first-lesson'),chest=PLAZA_COMPOSITION.instances.find(i=>i.id===station?.instanceId)?.position||[7.5,0,.5];
  const arrows=[['forward',ArrowUp],['left',ArrowLeft],['backward',ArrowDown],['right',ArrowRight]];
  return <>
    {phase==='MOVE'&&<div className="first-move-hint" aria-label="Mover: WASD o flechas"><ArrowUp/><kbd>W</kbd><span className="first-move-keys"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></div>}
    {close&&<button className="first-action-hint" aria-label={phase==='BREAK'?'Romper: Q':'Defenderse: Q'} title="Q" onClick={()=>onAction('Q')}><Swords size={36}/><kbd>Q</kbd></button>}
    {phase==='CHEST'&&Math.hypot(position.x-chest[0],position.z-chest[2])<(station?.interactionRadius||3)&&<button className="first-action-hint first-chest-hint" aria-label="Abrir cofre: E" title="E" onClick={()=>onAction('E')}><Music2 size={36}/><kbd>E</kbd></button>}
    <div className="first-touch-move" aria-label="Movimiento tactil">{arrows.map(([direction,Icon])=><button key={direction} className={'move-'+direction} aria-label={'Mover '+({forward:'adelante',left:'izquierda',backward:'atras',right:'derecha'}[direction])}
      onPointerDown={event=>{event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);onMove(direction,true);}}
      onPointerUp={()=>onMove(direction,false)} onPointerCancel={()=>onMove(direction,false)} onLostPointerCapture={()=>onMove(direction,false)} onContextMenu={event=>event.preventDefault()}><Icon/></button>)}</div>
  </>;
}
