import React, { useEffect, useRef, useState } from 'react';
import { Music2, Volume2, VolumeX, X } from 'lucide-react';
import { createWorldMusic, readMusicSettings, saveMusicSettings } from './worldMusic.js';
import { usePianoMicStore } from '../../hooks/usePianoMicStore.js';
import { createValleySoundscape, regionalAudioState } from './valleySoundscape.js';
import './worldAudio.css';

export default function WorldMusic({ active, immediatePause, unlockOnEntry = false, adventure }) {
  const micActive = usePianoMicStore(state => state.isListening);
  const regional = regionalAudioState(adventure);
  const ambienceRef = useRef(null);
  const musicalFocusRef = useRef(false);
  const audioRef = useRef(null);
  const controllerRef = useRef(null);
  const panelRef = useRef(null);
  const [settings, setSettings] = useState(() => {
    try { return readMusicSettings(window.localStorage); }
    catch { return readMusicSettings(null); }
  });
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const latest = useRef({ settings, active, immediatePause, regional, micActive });
  useEffect(()=>{
    const changed=()=>setSettings(readMusicSettings(window.localStorage));
    window.addEventListener('valley-music-settings',changed);
    return()=>window.removeEventListener('valley-music-settings',changed);
  },[]);

  useEffect(() => {
    const controller = createWorldMusic(audioRef.current, { onStatus: setStatus });
    const ambience = createValleySoundscape();
    ambienceRef.current = ambience;
    controllerRef.current = controller;
    const sync = () => {
      const state = latest.current;
      const enabled = state.active && !document.hidden && !usePianoMicStore.getState().isListening && !musicalFocusRef.current;
      const hard = document.hidden || state.immediatePause || usePianoMicStore.getState().isListening || musicalFocusRef.current;
      controller.update({ ...state.settings, volume: state.settings.volume * (.45 + state.regional.stage * .12) }, enabled, hard);
      ambience.update(state.regional, state.settings, enabled, hard);
      if (audioRef.current) audioRef.current.dataset.soundscape = JSON.stringify(ambience.stats);
    };
    const unlock = () => { if (document.hidden || usePianoMicStore.getState().isListening) return; void controller.resume(); ambience.unlock(); if (audioRef.current) audioRef.current.dataset.soundscape = JSON.stringify(ambience.stats); };
    const enter = () => { if (unlockOnEntry) unlock(); };
    const unsubscribeMic = usePianoMicStore.subscribe((state, previous) => { if (state.isListening !== previous.isListening) sync(); });
    const focus = event => { musicalFocusRef.current = event.detail === true; sync(); };
    window.addEventListener('valley-musical-focus', focus);
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
      unsubscribeMic(); ambience.dispose(); ambienceRef.current = null;
      window.removeEventListener('valley-musical-focus', focus);
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    latest.current = { settings, active, immediatePause, regional, micActive };
    const enabled = active && !document.hidden && !micActive && !musicalFocusRef.current;
    const hard = document.hidden || immediatePause || micActive || musicalFocusRef.current;
    controllerRef.current?.update({ ...settings, volume: settings.volume * (.45 + regional.stage * .12) }, enabled, hard);
    ambienceRef.current?.update(regional, settings, enabled, hard);
    try { saveMusicSettings(window.localStorage, settings); } catch { /* Optional preference storage. */ }
    window.dispatchEvent(new Event('valley-audio-preferences'));
    if (audioRef.current) audioRef.current.dataset.soundscape = JSON.stringify(ambienceRef.current?.stats);
  }, [settings, active, immediatePause, micActive, regional.region, regional.stage]);

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
        <button type="button" className="grid h-8 w-8 place-items-center" title="Cerrar" aria-label="Cerrar ajustes de música" onClick={() => setOpen(false)}><X size={16} /></button>
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
