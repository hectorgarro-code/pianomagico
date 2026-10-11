import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Check, Compass, Map, Music2, X } from 'lucide-react';
import { getValleyMap, getDirectionHint, resolveObjectiveTarget } from './valleyNavigation.js';
import CartographyLayer from './CartographyLayer.jsx';
import { cartographyAsset } from './mapCartography.js';
import './worldNavigation.css';

export default function WorldNavigation({ adventure, pose, active, onOpenChange, onPlaytestEvent, requestedOpen = false }) {
  const [open, setOpen] = useState(false);
  useEffect(()=>{if(requestedOpen)setOpen(true);},[requestedOpen]);
  const [assisted, setAssisted] = useState(true);
  const opener = useRef(null);
  const target = useMemo(() => resolveObjectiveTarget(adventure, assisted), [adventure, assisted]);
  const model = useMemo(() => getValleyMap(adventure, target), [adventure, target]);
  const direction = getDirectionHint(pose.position, target, pose.cameraYaw, pose.projected);
  const changeOpen = value => {
    if (value && !open) opener.current = document.activeElement;
    if (value && !open) onPlaytestEvent?.('MAP_OPENED');
    setOpen(value); onOpenChange(value);
  };
  useEffect(() => {
    if (!open) return;
    return () => opener.current?.focus?.();
  }, [open]);
  useEffect(() => {
    if (!active) return;
    const key = event => {
      if (event.repeat) return;
      if (event.code !== 'Escape' && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
      if (event.code === 'KeyM' || (event.code === 'Escape' && open)) {
        if (!open) opener.current = document.activeElement;
        if (!open) onPlaytestEvent?.('MAP_OPENED');
        event.preventDefault(); setOpen(!open); onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, open, onOpenChange, onPlaytestEvent]);
  if (!active) return null;
  const parchmentStyle = { '--map-parchment': `url("${cartographyAsset('parchment')}")` };
  return <div className="valley-navigation" style={parchmentStyle}>
    {direction && !open && !direction.arrived && <div className={`valley-direction ${direction.subdued ? 'is-subdued' : ''}`} aria-label={`Direccion hacia ${target.label}`}>
      <ArrowUp size={20} style={{ transform: `rotate(${direction.angle}rad)` }} />
      <span>{target.label}</span>
    </div>}
    <button className="valley-minimap" onClick={() => changeOpen(true)} title="Abrir mapa" aria-label="Abrir mapa">
      <span className="valley-map-caption"><Map size={16} /><span>{model.regions.find(r => r.id === model.currentRegion)?.name}</span></span>
      <CartographyLayer model={model} pose={pose} />
      <span className="valley-map-key"><kbd>M</kbd> Mapa</span>
    </button>
    <button className="valley-mobile-map" onClick={() => changeOpen(true)} title="Abrir mapa" aria-label="Abrir mapa"><Map size={22}/></button>
    {open && createPortal(<div className="valley-map-backdrop" onClick={() => changeOpen(false)}>
      <section className="valley-map-panel" style={parchmentStyle} role="dialog" aria-modal="true" aria-label="Mapa del Valle" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if(event.key !== 'Tab') return;
        const controls=event.currentTarget.querySelectorAll('button,input');
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
        if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
      }}>
        <header><h2><Music2 size={22}/> Valle de las Notas</h2><button autoFocus onClick={() => changeOpen(false)} title="Cerrar mapa" aria-label="Cerrar mapa"><X size={22}/></button></header>
        <div className="valley-map-content">
          <div className="valley-map-compass" aria-label="Norte"><span>N</span><img src={cartographyAsset('compass')} alt="" onError={event => { event.currentTarget.style.display='none'; }} /></div>
          <CartographyLayer model={model} pose={pose} enlarged />
        </div>
        <footer>
          <div className="valley-map-legend"><span className="map-pending"><span className="map-objective-key"/> Objetivo</span><span><Check size={14}/>Completado</span></div>
          {target && <p>{target.label} · {Math.round(Math.hypot(target.position.x-pose.position.x,target.position.z-pose.position.z))} m</p>}
          <label><Compass size={16}/> Orientacion <input type="checkbox" checked={assisted} onChange={event => {
            setAssisted(event.target.checked); onPlaytestEvent?.('NAVIGATION_TOGGLED', { enabled: event.target.checked });
          }} aria-label="Ayuda de orientacion" /></label>
        </footer>
      </section>
    </div>,document.body)}
  </div>;
}
