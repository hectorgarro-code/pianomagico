import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Check, Compass, Map, X } from 'lucide-react';
import { getValleyMap, getDirectionHint, playerMapMarker, resolveObjectiveTarget, worldToMap, MAP_SIZE } from './valleyNavigation.js';
import './worldNavigation.css';

function MapDrawing({ model, pose, enlarged }) {
  const marker = playerMapMarker(pose);
  const point = position => { const p = worldToMap(position); return `${p.x},${p.y}`; };
  const targets = model.target?.choices || (model.target ? [model.target] : []);
  const viewBox=enlarged ? `0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}` : `${marker.x-65} ${marker.y-85} 130 170`;
  return <svg viewBox={viewBox} role="img" aria-label="Mapa del Valle, norte arriba">
    {enlarged && <text x="26" y="25" fill="#d4d4d8" fontSize="16">N</text>}
    {model.paths.map(path => <polyline key={path.id} points={path.points.map(point).join(' ')} fill="none" stroke="#8a9c8b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />)}
    {model.regions.map(region => {
      const p = worldToMap(region.position);
      const words=region.name.split(' '),lines=region.name.length>19 ? [words.slice(0,-1).join(' '),words.at(-1)] : [region.name];
      return <g key={region.id}><circle cx={p.x} cy={p.y} r="17" fill={region.state === 'COMPLETED' ? '#145b43' : '#343f45'} stroke={region.id === model.currentRegion ? '#f4f4f5' : '#8a9c8b'} strokeWidth="2" />
        {enlarged && <text textAnchor="middle" fill="#f4f4f5" fontSize="16" paintOrder="stroke" stroke="#18181b" strokeWidth="5">{lines.map((line,index)=><tspan key={index} x={p.x} y={p.y-25-(lines.length-1-index)*18}>{line}</tspan>)}</text>}
      </g>;
    })}
    {model.chests.map(chest => {
      const p = worldToMap(chest.position), completed = chest.state === 'COMPLETED';
      return <g key={chest.id} opacity={chest.state === 'LOCKED' ? .38 : 1}>
        <title>{chest.label}: {chest.state}</title>
        <rect x={p.x - 5} y={p.y - 5} width="10" height="10" rx="2" fill={completed ? '#64cf9b' : chest.type === 'SECRET_REWARD' ? '#c4a6ef' : '#ffd16c'} stroke="#18181b" strokeWidth="2" />
        {completed && <path d={`M${p.x-3},${p.y} l2,2 l4,-4`} fill="none" stroke="#112b20" strokeWidth="1.5" />}
      </g>;
    })}
    {targets.map(target => { const p = worldToMap(target.position); return <circle key={target.id} cx={p.x} cy={p.y} r="10" fill="none" stroke="#ffd16c" strokeWidth="2" strokeDasharray="3 3"><title>{target.label}</title></circle>; })}
    <g transform={`translate(${marker.x} ${marker.y}) rotate(${marker.angle})`}>
      <path d="M0,-10 L7,8 L0,4 L-7,8 Z" fill="#f4f4f5" stroke="#173943" strokeWidth="2" />
    </g>
  </svg>;
}

export default function WorldNavigation({ adventure, pose, active, onOpenChange, onPlaytestEvent }) {
  const [open, setOpen] = useState(false);
  const [assisted, setAssisted] = useState(true);
  const target = resolveObjectiveTarget(adventure, assisted);
  const model = getValleyMap(adventure, target);
  const direction = getDirectionHint(pose.position, target, pose.cameraYaw, pose.projected);
  const changeOpen = value => {
    if (value && !open) onPlaytestEvent?.('MAP_OPENED');
    setOpen(value); onOpenChange(value);
  };
  useEffect(() => {
    if (!active) return;
    const key = event => {
      if (event.repeat) return;
      if (event.code !== 'Escape' && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
      if (event.code === 'KeyM' || (event.code === 'Escape' && open)) {
        if (!open) onPlaytestEvent?.('MAP_OPENED');
        event.preventDefault(); setOpen(!open); onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, open, onOpenChange, onPlaytestEvent]);
  if (!active) return null;
  return <div className="valley-navigation">
    {direction && !open && !direction.arrived && <div className={`valley-direction ${direction.subdued ? 'is-subdued' : ''}`} aria-label={`Direccion hacia ${target.label}`}>
      <ArrowUp size={20} style={{ transform: `rotate(${direction.angle}rad)` }} />
      <span>{target.label}</span>
    </div>}
    <button className="valley-minimap" onClick={() => changeOpen(true)} title="Abrir mapa" aria-label="Abrir mapa">
      <span className="valley-map-caption"><Map size={16} /><span>{model.regions.find(r => r.id === model.currentRegion)?.name}</span></span>
      <MapDrawing model={model} pose={pose} enlarged={false} />
    </button>
    <button className="valley-mobile-map" onClick={() => changeOpen(true)} title="Abrir mapa" aria-label="Abrir mapa"><Map size={22}/></button>
    {open && createPortal(<div className="valley-map-backdrop" onClick={() => changeOpen(false)}>
      <section className="valley-map-panel" role="dialog" aria-modal="true" aria-label="Mapa del Valle" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if(event.key !== 'Tab') return;
        const controls=event.currentTarget.querySelectorAll('button,input');
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }}>
        <header><h2>Valle de las Notas</h2><button autoFocus onClick={() => changeOpen(false)} title="Cerrar mapa" aria-label="Cerrar mapa"><X size={22}/></button></header>
        <div className="valley-map-content"><MapDrawing model={model} pose={pose} enlarged /></div>
        <footer>
          <div className="valley-map-legend"><span className="map-pending">Pendiente</span><span><Check size={14}/>Completado</span></div>
          {target && <p>{target.label} · {Math.round(Math.hypot(target.position.x-pose.position.x,target.position.z-pose.position.z))} m</p>}
          <label><Compass size={16}/> Orientacion <input type="checkbox" checked={assisted} onChange={event => {
            setAssisted(event.target.checked); onPlaytestEvent?.('NAVIGATION_TOGGLED', { enabled: event.target.checked });
          }} aria-label="Ayuda de orientacion" /></label>
        </footer>
      </section>
    </div>,document.body)}
  </div>;
}
