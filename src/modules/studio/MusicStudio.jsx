import React, { useEffect, useRef, useState } from 'react';
import { Home, Play, Square, Circle, Plus, Minus, Settings, Trash2, Volume2, VolumeX, Mic2, Drum, Music, Guitar, ZoomIn, ZoomOut } from 'lucide-react';
import { useStudioStore } from '../../features/studio/store/useStudioStore';
import DrumTrack from '../../features/studio/components/DrumTrack';
import PianoTrack from '../../features/studio/components/PianoTrack';
import MicTrack from '../../features/studio/components/MicTrack';
import DrumMachineEditor from '../../features/studio/components/DrumMachineEditor';
import MicSettingsModal from '../core/components/MicSettingsModal';
import EffectsPanel from '../../features/studio/components/EffectsPanel';

export default function MusicStudio({ userId, onExit }) {
    const {
        tracks, isPlaying, isRecording, playheadPosition, tempo, zoomLevel, setZoomLevel,
        togglePlay, stop, toggleRecord, setPlayhead, addTrack, removeTrack, updateTrack, setTempo, armTrack,
        isCountingIn, countInBeat, startRecordingActual, setCountInBeat,
        projectId, projectName, setProjectName, toggleMicSettings, isMicSettingsOpen,
        activeEffectsTrackId, setActiveEffectsTrack
    } = useStudioStore();

    // --- AUTOGUARDADO EN BASE DE DATOS ---
    useEffect(() => {
        // No guardar si el proyecto está vacío
        if (tracks.length === 0) return;

        // Auto-guardado con Debounce de 2.5 segundos
        const timer = setTimeout(() => {
            const projectData = { tracks, tempo };

            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost/pianomagicoweb/backend'}/api.php?action=save_studio_project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    id: projectId,
                    name: projectName,
                    data: projectData
                })
            })
                .then(res => res.json())
                .then(data => console.log("Proyecto de Estudio Autoguardado:", data))
                .catch(err => console.error("Error en autoguardado:", err));

        }, 2500);

        return () => clearTimeout(timer);
    }, [tracks, tempo, projectName, projectId, userId]);

    const leftPanelRef = useRef(null);
    const timelineRef = useRef(null);
    const animationRef = useRef(null);
    const lastTimeRef = useRef(0);
    const [isPortrait, setIsPortrait] = useState(false);

    // --- DETECCIÓN DE ORIENTACIÓN PARA MÓVILES ---
    useEffect(() => {
        const checkOrientation = () => {
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        // Chequeo inicial
        checkOrientation();

        // Listener de redimensionamiento
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    // --- LOOP PRINCIPAL DE TIEMPO ---
    useEffect(() => {
        if (isPlaying || isRecording) {
            lastTimeRef.current = performance.now();

            const animate = (time) => {
                const deltaTime = time - lastTimeRef.current;
                lastTimeRef.current = time;

                // Calcular avance en píxeles. 
                // Usamos 40px = 1 negra (1 beat) para celdas grandes de secuenciador.
                // 1 minuto = tempo beats -> 60000ms = tempo * 40px
                // velocidad = (tempo * 40px) / 60000ms = (tempo / 1500) px/ms

                const pixelsPerMs = tempo / 1500;
                const advance = deltaTime * pixelsPerMs;

                useStudioStore.setState(state => ({
                    playheadPosition: state.playheadPosition + advance
                }));

                animationRef.current = requestAnimationFrame(animate);
            };

            animationRef.current = requestAnimationFrame(animate);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, isRecording, tempo]);

    // --- METRÓNOMO DE CUENTA REGRESIVA ---
    useEffect(() => {
        let intervalId;

        if (isCountingIn) {
            // Unidades en milisegundos basadas en el tempo (ej: 120bpm = 500ms por beat)
            const msPerBeat = 60000 / tempo;
            let currentBeat = 4;
            setCountInBeat(currentBeat);

            // Función para tocar un beep de metrónomo (sinte básico)
            const playMetronomeBeep = (isFirst) => {
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();

                    osc.connect(gain);
                    gain.connect(audioCtx.destination);

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(isFirst ? 880 : 440, audioCtx.currentTime); // Tono más agudo en el primer golpe

                    gain.gain.setValueAtTime(1, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.1);
                } catch (e) {
                    console.log("AudioContext blocked or failed", e);
                }
            };

            // Tocar el primer beat inmediatamente
            playMetronomeBeep(true);

            intervalId = setInterval(() => {
                currentBeat -= 1;

                if (currentBeat > 0) {
                    setCountInBeat(currentBeat);
                    playMetronomeBeep(false);
                } else {
                    // Terminó el conteo
                    clearInterval(intervalId);
                    startRecordingActual();
                }
            }, msPerBeat);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isCountingIn, tempo, setCountInBeat, startRecordingActual]);

    const handleTimelineClick = (e) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        // The playheadPosition is in logical pixels (zoom = 1). 
        // We get the physical pixel clicked (including scroll) and divide by zoomLevel.
        const physicalX = e.clientX - rect.left + timelineRef.current.scrollLeft;
        setPlayhead(Math.max(0, physicalX / zoomLevel));
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden relative">

            {/* --- PANTALLA DE BLOQUEO HORIZONTAL (MÓVILES) --- */}
            {isPortrait && (
                <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <svg className="w-12 h-12 text-indigo-400 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">¡Gira tu pantalla!</h2>
                    <p className="text-slate-400 font-medium max-w-xs">
                        El Estudio de Grabación necesita más espacio. Gira tu dispositivo horizontalmente para empezar a crear música.
                    </p>
                    <button
                        onClick={onExit}
                        className="mt-8 px-6 py-3 bg-white/10 text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-white/20 transition-colors"
                    >
                        Volver al menú
                    </button>
                </div>
            )}

            {/* --- OVERLAY DE CUENTA REGRESIVA (METRÓNOMO) --- */}
            {isCountingIn && (
                <div className="absolute inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <div
                        key={countInBeat} // Forzar re-render para la animación en cada beat
                        className="text-white font-black text-[20vw] animate-in zoom-in spin-in-12 duration-300 drop-shadow-[0_0_80px_rgba(99,102,241,0.8)] text-indigo-400"
                    >
                        {countInBeat}
                    </div>
                </div>
            )}

            {/* --- MENU SUPERIOR --- */}
            <header className="h-16 border-b border-indigo-900/50 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                    >
                        <Home size={20} className="text-indigo-300" />
                    </button>
                    <div className="flex items-center gap-2 group cursor-text">
                        <Mic2 size={24} className="text-pink-400" />
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="bg-transparent border-none outline-none text-xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 w-64 focus:border-b focus:border-indigo-500/50"
                            title="Haz clic para renombrar el proyecto"
                        />
                        <button
                            onClick={toggleMicSettings}
                            className="ml-2 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shadow-xl hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-pink-400 transition-colors"
                            title="Configuración de Micrófono"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* --- TRANSPORT CONTROLS --- */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-2xl p-1 border border-white/5">
                    <button onClick={stop} className="w-12 h-12 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all text-slate-400 hover:text-white">
                        <Square size={20} fill="currentColor" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-lg ${isPlaying && !isRecording ? 'bg-indigo-500 text-white shadow-indigo-500/50' : isPlaying && isRecording ? 'bg-red-500 text-white shadow-red-500/50 animate-pulse' : 'bg-slate-700 text-indigo-400 hover:bg-slate-600'}`}
                    >
                        <Play size={24} fill="currentColor" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-2 bg-slate-800/80 border border-indigo-500/20 rounded-xl px-2 py-1">
                        <button onClick={() => setZoomLevel(zoomLevel - 0.25)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Alejar">
                            <ZoomOut size={14} />
                        </button>
                        <div className="flex flex-col items-center justify-center min-w-[40px]">
                            <span className="font-bold text-sm text-indigo-400 leading-none">{Math.round(zoomLevel * 100)}%</span>
                        </div>
                        <button onClick={() => setZoomLevel(zoomLevel + 0.25)} className="p-1 text-slate-400 hover:text-white transition-colors" title="Acercar">
                            <ZoomIn size={14} />
                        </button>
                    </div>

                    {/* BPM Control */}
                    <div className="flex items-center gap-2 bg-slate-800/80 border border-indigo-500/20 rounded-xl px-2 py-1">
                        <button onClick={() => setTempo(Math.max(40, tempo - 5))} className="p-1 text-slate-400 hover:text-white transition-colors" title="-5 BPM">
                            <Minus size={14} />
                        </button>
                        <div className="flex flex-col items-center justify-center min-w-[50px]">
                            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">Tempo</span>
                            <span className="font-bold text-lg leading-none">{tempo}</span>
                        </div>
                        <button onClick={() => setTempo(Math.min(240, tempo + 5))} className="p-1 text-slate-400 hover:text-white transition-colors" title="+5 BPM">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- AREA DE TRABAJO --- */}
            <main className="flex-1 flex overflow-hidden relative">

                {/* CABECERAS DE PISTAS (Izquierda) */}
                <div
                    ref={leftPanelRef}
                    onScroll={(e) => {
                        if (timelineRef.current) timelineRef.current.scrollTop = e.target.scrollTop;
                    }}
                    className="w-64 bg-slate-900 border-r border-indigo-900/50 flex flex-col z-20 shadow-xl overflow-y-auto custom-scrollbar pb-32"
                >
                    {/* ADD TRACK BUTTONS (Arriba para alinear con el ruler h-8) */}
                    <div className="h-8 shrink-0 sticky top-0 z-30 bg-slate-950 border-b border-indigo-900/50 flex items-center justify-between px-2 gap-1 backdrop-blur-md">
                        <button onClick={() => addTrack('drum')} className="flex-1 h-6 flex items-center justify-center rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 text-[9px] font-bold transition-colors">
                            + BATERÍA
                        </button>
                        <button onClick={() => addTrack('piano')} className="flex-1 h-6 flex items-center justify-center rounded bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 text-[9px] font-bold transition-colors">
                            + PIANO
                        </button>
                        <button onClick={() => addTrack('mic')} className="flex-1 h-6 flex items-center justify-center rounded bg-red-500/20 text-red-300 hover:bg-red-500/40 text-[9px] font-bold transition-colors">
                            + VOZ
                        </button>
                    </div>

                    {tracks.map(track => {
                        const bgColors = {
                            drum: 'bg-indigo-950/40',
                            piano: 'bg-pink-950/40',
                            mic: 'bg-red-950/40',
                            uke: 'bg-emerald-950/40'
                        };
                        const trackBg = bgColors[track.type] || 'bg-slate-800/30';

                        return (
                            <div key={track.id} className={`h-32 shrink-0 border-b border-white/5 p-3 flex flex-col justify-between group ${trackBg}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                            {track.type === 'drum' && <Drum size={16} />}
                                            {track.type === 'piano' && <Music size={16} />}
                                            {track.type === 'uke' && <Guitar size={16} />}
                                            {track.type === 'mic' && <Mic2 size={16} />}
                                        </div>
                                        <span className="font-bold text-sm text-slate-200 truncate max-w-[120px]" title={track.name}>{track.name}</span>
                                    </div>
                                    <button
                                        onClick={() => removeTrack(track.id)}
                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar pista"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {/* Controles de Estado y Volumen */}
                                    <div className="flex gap-2 items-center">
                                        <button className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 hover:bg-slate-600">M</button>
                                        <button className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400 hover:bg-slate-600">S</button>

                                        {track.type !== 'drum' && (
                                            <button
                                                onClick={() => toggleRecord(track.id)}
                                                className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-bold transition-all ${isRecording && track.isArmed ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : 'border-transparent bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-red-400'}`}
                                                title="Grabar en esta pista"
                                            >
                                                <Circle size={8} fill="currentColor" />
                                            </button>
                                        )}

                                        {track.type === 'drum' && (
                                            <button
                                                onClick={() => useStudioStore.getState().setActiveDrumMachine(track.id, 'A')}
                                                className="h-6 px-2 rounded-md bg-indigo-500/20 text-indigo-400 font-bold text-[10px] border border-indigo-500/40 hover:bg-indigo-500/40 transition-colors"
                                            >
                                                EDITAR
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setActiveEffectsTrack(activeEffectsTrackId === track.id ? null : track.id)}
                                            className={`h-6 px-2 rounded-md font-bold text-[10px] border transition-colors flex items-center gap-1 ${activeEffectsTrackId === track.id ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                                            title="Rack de Efectos"
                                        >
                                            <Settings size={10} /> FX
                                        </button>

                                        <div className="flex-1 ml-2 h-1 bg-slate-700 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-indigo-500 w-[80%]"></div>
                                        </div>
                                    </div>

                                    {/* Controles de Velocidad y Tono (Pitch/Speed) */}
                                    <div className="flex items-center justify-between gap-2 mt-1 px-1">
                                        {/* Pitch */}
                                        <div className="flex items-center gap-1 group/pitch" title="Tono (Semitonos)">
                                            <span className="text-[9px] font-bold text-slate-500 group-hover/pitch:text-pink-400 transition-colors">P</span>
                                            <input
                                                type="range"
                                                min="-12" max="12" step="1"
                                                value={track.pitch || 0}
                                                onChange={(e) => updateTrack(track.id, { pitch: parseInt(e.target.value) })}
                                                className="w-16 h-1 bg-slate-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400 w-4 text-right">{(track.pitch > 0 ? '+' : '') + (track.pitch || 0)}</span>
                                        </div>

                                        {/* Speed */}
                                        <div className="flex items-center gap-1 group/speed" title="Velocidad de Reproducción">
                                            <span className="text-[9px] font-bold text-slate-500 group-hover/speed:text-emerald-400 transition-colors">V</span>
                                            <input
                                                type="range"
                                                min="0.5" max="2.0" step="0.1"
                                                value={track.speed || 1}
                                                onChange={(e) => updateTrack(track.id, { speed: parseFloat(e.target.value) })}
                                                className="w-16 h-1 bg-slate-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full"
                                            />
                                            <span className="text-[9px] font-mono text-slate-400 w-4 text-right">{(track.speed || 1).toFixed(1)}x</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* TIMELINE Y REGIONES (Derecha) */}
                <div className="flex-1 bg-slate-950 relative overflow-x-auto overflow-y-hidden custom-scrollbar" ref={timelineRef}>

                    {/* Contenedor del Timeline Expandible */}
                    <div className="relative h-full" style={{ width: Math.max(5000, (playheadPosition + 1000) * zoomLevel) + 'px' }}>

                        {/* Regla Superior (Ruler) Numerada */}
                        <div
                            className="h-8 bg-slate-900/80 border-b border-indigo-900/50 sticky top-0 z-20 w-full flex"
                            onClick={handleTimelineClick}
                        >
                            {Array.from({ length: 50 }).map((_, i) => (
                                <div key={`measure-${i}`} className="absolute h-full flex items-end pb-1 border-l border-white/20 px-1" style={{ left: `${i * 160 * zoomLevel}px`, width: `${160 * zoomLevel}px` }}>
                                    <span className="text-[10px] font-bold text-slate-400 select-none cursor-pointer hover:text-white transition-colors">
                                        {i + 1}
                                    </span>

                                    {/* Divisiones (Pulsos) */}
                                    <div className="absolute bottom-0 h-2 border-l border-white/10" style={{ left: `${40 * zoomLevel}px` }}>
                                        <span className="absolute top-[-14px] left-1 text-[8px] text-slate-600 select-none pointer-events-none">{i + 1}.2</span>
                                    </div>
                                    <div className="absolute bottom-0 h-3 border-l border-white/20" style={{ left: `${80 * zoomLevel}px` }}>
                                        <span className="absolute top-[-14px] left-1 text-[8px] text-slate-500 select-none pointer-events-none">{i + 1}.3</span>
                                    </div>
                                    <div className="absolute bottom-0 h-2 border-l border-white/10" style={{ left: `${120 * zoomLevel}px` }}>
                                        <span className="absolute top-[-14px] left-1 text-[8px] text-slate-600 select-none pointer-events-none">{i + 1}.4</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Grid de Pistas Background Lines */}
                        <div className="absolute inset-x-0 bottom-0 top-8 pointer-events-none z-0 overflow-hidden">
                            {Array.from({ length: 50 }).map((_, i) => (
                                <React.Fragment key={`grid-${i}`}>
                                    <div className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${i * 160 * zoomLevel}px` }}></div>
                                    <div className="absolute top-0 bottom-0 border-l border-white/5 opacity-50" style={{ left: `${(i * 160 + 40) * zoomLevel}px` }}></div>
                                    <div className="absolute top-0 bottom-0 border-l border-white/5 opacity-50" style={{ left: `${(i * 160 + 80) * zoomLevel}px` }}></div>
                                    <div className="absolute top-0 bottom-0 border-l border-white/5 opacity-50" style={{ left: `${(i * 160 + 120) * zoomLevel}px` }}></div>
                                </React.Fragment>
                            ))}
                        </div>

                        {tracks.map(track => {
                            const laneColors = {
                                drum: 'bg-indigo-900/30',
                                piano: 'bg-pink-900/30',
                                mic: 'bg-red-900/30',
                                uke: 'bg-emerald-900/30'
                            };
                            const laneColor = laneColors[track.type] || 'bg-transparent';

                            return (
                                <div key={track.id} className={`h-32 shrink-0 border-b-2 border-slate-800/50 relative z-10 group ${laneColor}`}>
                                    {track.type === 'drum' && <DrumTrack track={track} />}
                                    {track.type === 'piano' && <PianoTrack track={track} />}
                                    {track.type === 'mic' && <MicTrack track={track} />}
                                    <div className="absolute h-full inset-0 bg-gradient-to-r from-transparent to-slate-900/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            )
                        })}

                        {/* CABEZAL DE REPRODUCCIÓN (PLAYHEAD) */}
                        <div
                            className="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center group"
                            style={{ transform: `translateX(${playheadPosition * zoomLevel}px)` }}
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                            <div className="w-px h-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        </div>
                    </div>

                </div>
            </main>

            {/* CAJA DE RITMOS (Bottom Panel) */}
            <DrumMachineEditor />

            {/* PANEL DE EFECTOS (Bottom Panel) */}
            <EffectsPanel />

            {/* MODAL CONFIGURACIÓN MICRÓFONO */}
            <MicSettingsModal isOpen={isMicSettingsOpen} onClose={toggleMicSettings} />
        </div>
    );
}
