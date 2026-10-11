import React, { useEffect, useRef, useState } from 'react';
import { Music2, Volume2, VolumeX, X } from 'lucide-react';
import { createWorldMusic, readMusicSettings, saveMusicSettings } from './worldMusic.js';

export default function WorldMusic({ active, immediatePause, unlockOnEntry = false }) {
  const audioRef = useRef(null);
  const controllerRef = useRef(null);
  const panelRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    try { return readMusicSettings(window.localStorage); }
    catch { return readMusicSettings(null); }
  });
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const latest = useRef({ settings, active, immediatePause });
  useEffect(()=>{
    const changed=()=>setSettings(readMusicSettings(window.localStorage));
    window.addEventListener('valley-music-settings',changed);
    return()=>window.removeEventListener('valley-music-settings',changed);
  },[]);

  useEffect(() => {
    const controller = createWorldMusic(audioRef.current, { onStatus: setStatus });
    controllerRef.current = controller;
    const sync = () => {
      const state = latest.current;
      controller.update(state.settings, state.active && !document.hidden,
        document.hidden || state.immediatePause);
    };
    const unlock = () => void controller.resume();
    const enter = () => { if (unlockOnEntry) { controller.update(latest.current.settings, true); void controller.resume(); } };
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('valley-entry-unlock', enter);
    sync();
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('valley-entry-unlock', enter);
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    latest.current = { settings, active, immediatePause };
    controllerRef.current?.update(settings, active && !document.hidden,
      document.hidden || immediatePause);
    try { saveMusicSettings(window.localStorage, settings); } catch { /* Optional preference storage. */ }
  }, [settings, active, immediatePause]);

  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const silent = settings.muted || settings.volume === 0;
  return <div ref={panelRef} className="relative" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') setOpen(false);
  }} onPointerDown={event => event.stopPropagation()}>
    <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/valle-background.m4a`}
      preload="metadata" loop data-world-music onError={() => setStatus('error')} />
    <button type="button" title="Música de fondo" aria-label="Música de fondo"
      aria-expanded={open} aria-controls="world-music-settings" onClick={() => setOpen(value => !value)}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-zinc-900/90 text-white hover:bg-zinc-700">
      {silent ? <VolumeX size={18} /> : <Music2 size={18} />}
    </button>
    {open && <div id="world-music-settings" className="fixed right-3 top-14 w-56 rounded-lg border border-white/20 bg-zinc-950/95 p-3 shadow-xl sm:absolute sm:right-0 sm:top-11">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm">Música</span>
        <button type="button" title="Cerrar" aria-label="Cerrar ajustes de música" onClick={() => setOpen(false)}><X size={16} /></button>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={settings.muted ? 'Activar música' : 'Silenciar música'}
          title={settings.muted ? 'Activar música' : 'Silenciar música'} aria-pressed={settings.muted}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/20"
          onClick={() => setSettings(value => ({ ...value, muted: !value.muted }))}>
          {silent ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input type="range" min="0" max="100" step="1" aria-label="Volumen de música"
          value={Math.round(settings.volume * 100)} className="min-w-0 flex-1 accent-emerald-400"
          onChange={event => setSettings(value => ({ ...value, volume: Number(event.target.value) / 100 }))} />
        <output className="w-9 text-right text-xs tabular-nums">{Math.round(settings.volume * 100)}%</output>
      </div>
      {status === 'blocked' && <button type="button" className="mt-3 text-xs underline" onClick={() => controllerRef.current?.resume()}>Activar música</button>}
      {status === 'error' && <p role="alert" className="mt-3 text-xs text-amber-300">No se pudo reproducir la música.</p>}
    </div>}
  </div>;
}
