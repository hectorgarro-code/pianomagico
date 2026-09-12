import React, { useRef, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { X, Play, Plus, Drum, Keyboard, Circle, Target } from 'lucide-react';

const INSTRUMENTS = [
    { id: 'hihat', label: 'HAT', icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { id: 'snare', label: 'SNARE', icon: Circle, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
    { id: 'kick', label: 'KICK', icon: Drum, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
];

// 10 Presets de Ritmos Básico
const DRUM_PRESETS = [
    {
        name: "Vacío",
        steps: { kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false) }
    },
    {
        name: "Rock Básico",
        steps: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
        }
    },
    {
        name: "Pop Bailable",
        steps: {
            kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
        }
    },
    {
        name: "Disco Groove",
        steps: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [false, false, true, false, false, false, true, true, false, false, true, false, false, false, true, true]
        }
    },
    {
        name: "Reggaeton Duro",
        steps: {
            kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            snare: [false, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
        }
    },
    {
        name: "Hip-Hop Clásico",
        steps: {
            kick: [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, true, true, false, true, true, true, false, true, true, true, false, true, true, true, false]
        }
    },
    {
        name: "Funk Sincopado",
        steps: {
            kick: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, true, false, false, true, false, false, false],
            hihat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]
        }
    },
    {
        name: "Marcha",
        steps: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
            hihat: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]
        }
    },
    {
        name: "House (Four on the Floor)",
        steps: {
            kick: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]
        }
    },
    {
        name: "Trap Rápido",
        steps: {
            kick: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
            snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
            hihat: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true]
        }
    }
];

const PATTERNS = ['A', 'B', 'C', 'D'];

export default function DrumMachineEditor() {
    const {
        tracks, playheadPosition, activeDrumMachine, setActiveDrumMachine,
        updateDrumPattern, addNoteToTrack, setPlayhead
    } = useStudioStore();

    const audioCtx = useRef(null);

    useEffect(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    // --- SÍNTESIS BÁSICA PARA PREVIEW ---
    const playKick = (time) => {
        if (!audioCtx.current) return;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time);
        osc.stop(time + 0.5);
    };

    const playSnare = (time) => {
        if (!audioCtx.current) return;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        const bufferSize = audioCtx.current.sampleRate * 0.2;
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.current.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = audioCtx.current.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(audioCtx.current.destination);
        osc.frequency.setValueAtTime(250, time);
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.start(time);
        noise.start(time);
        osc.stop(time + 0.2);
    };

    const playHiHat = (time) => {
        if (!audioCtx.current) return;
        const gain = audioCtx.current.createGain();
        const bufferSize = audioCtx.current.sampleRate * 0.1;
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.current.createBufferSource();
        noise.buffer = buffer;
        const bandpass = audioCtx.current.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 10000;
        const highpass = audioCtx.current.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 7000;
        noise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(audioCtx.current.destination);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        noise.start(time);
    };

    if (!activeDrumMachine) return null;

    const track = tracks.find(t => t.id === activeDrumMachine.trackId);
    if (!track || !track.patterns) return null;

    const currentPatternId = activeDrumMachine.patternId;
    const currentPattern = track.patterns[currentPatternId];

    const handleStepToggle = (inst, index) => {
        if (audioCtx.current && audioCtx.current.state === 'suspended') audioCtx.current.resume();
        const newValue = !currentPattern[inst][index];
        updateDrumPattern(track.id, currentPatternId, inst, index, newValue);

        if (newValue && audioCtx.current) {
            const time = audioCtx.current.currentTime;
            if (inst === 'kick') playKick(time);
            if (inst === 'snare') playSnare(time);
            if (inst === 'hihat') playHiHat(time);
        }
    };

    const loadPreset = (e) => {
        const presetIndex = parseInt(e.target.value);
        if (presetIndex >= 0 && presetIndex < DRUM_PRESETS.length) {
            const steps = JSON.parse(JSON.stringify(DRUM_PRESETS[presetIndex].steps));
            // Actualizar todos los instrumentos en el patrón simultáneamente iterando
            Object.keys(steps).forEach(inst => {
                steps[inst].forEach((val, idx) => {
                    updateDrumPattern(track.id, currentPatternId, inst, idx, val);
                });
            });
        }
    };

    const handleAddBlockToTimeline = () => {
        // Duración estándar de 1 compás (160px)
        const duration = 160;
        const startPos = Math.max(0, playheadPosition);

        addNoteToTrack(track.id, {
            id: `block-${Date.now()}`,
            patternId: currentPatternId,
            startTime: startPos,
            duration: duration
        });

        // Auto-avanzar el cabezal para poder seguir añadiendo bloques fácilmente
        setPlayhead(startPos + duration);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-slate-900 border-t border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50 flex flex-col transform transition-transform duration-300">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-950/50 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                        <Drum size={18} />
                        <span>Caja de Ritmos: {track.name}</span>
                    </div>

                    <div className="w-px h-6 bg-slate-700 mx-2"></div>

                    {/* Pattern Selector */}
                    <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700 p-1 gap-1">
                        {PATTERNS.map(p => (
                            <button
                                key={p}
                                onClick={() => setActiveDrumMachine(track.id, p)}
                                className={`w-8 h-6 rounded flex items-center justify-center text-xs font-bold transition-all
                                ${currentPatternId === p ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleAddBlockToTimeline}
                        className="ml-4 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors"
                    >
                        <Plus size={16} /> Añadir {currentPatternId} a la pista
                    </button>
                </div>

                <button
                    onClick={() => setActiveDrumMachine(null)}
                    className="text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500/20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Matrix Editor (BandLab/Previa Estructura) */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar bg-slate-900 flex justify-center items-center">
                <div className="inline-flex flex-col gap-1 items-start bg-slate-900/40 p-2 rounded-xl border border-slate-800">

                    {/* Select de Presets justo arriba de la matriz */}
                    <div className="mb-2 pl-[64px] flex items-center justify-between w-full">
                        <select
                            onChange={loadPreset}
                            className="bg-slate-800 text-slate-300 text-[10px] py-1.5 px-3 rounded border border-indigo-500/50 outline-none cursor-pointer hover:bg-slate-700 font-bold tracking-wider"
                            defaultValue="0"
                        >
                            {DRUM_PRESETS.map((p, idx) => (
                                <option key={idx} value={idx}>{idx === 0 ? "Limpiar Patrón" : p.name}</option>
                            ))}
                        </select>

                        {/* Indicadores numéricos */}
                        <div className="flex text-slate-500 font-bold text-[10px] w-full max-w-[800px] justify-around opacity-50">
                            <span>1</span><span>. 2</span><span>. 3</span><span>. 4</span>
                        </div>
                    </div>

                    {/* Filas */}
                    {INSTRUMENTS.map((inst) => (
                        <div key={inst.id} className="grid items-center h-10 w-max" style={{ gridTemplateColumns: "64px repeat(16, 50px)" }}>
                            <div className="text-[10px] h-full flex flex-col items-center justify-center font-black text-slate-400 bg-slate-950/50 border-r border-indigo-500/20 shadow-md">
                                <inst.icon size={14} className={inst.color} />
                                <span className="mt-1 opacity-70 scale-90">{inst.label}</span>
                            </div>

                            {currentPattern[inst.id].map((isActive, i) => {
                                const isBeatStart = i % 4 === 0;
                                return (
                                    <div key={i} className={`h-full border-b border-indigo-500/20 bg-slate-900/40 p-1 flex items-center justify-center ${isBeatStart ? 'border-l border-indigo-500/30' : 'border-l border-indigo-500/5'}`}>
                                        <button
                                            onClick={() => handleStepToggle(inst.id, i)}
                                            className={`w-full h-full rounded transition-all flex items-center justify-center ${isActive
                                                ? `${inst.bg} shadow-[inset_0_0_15px_rgba(255,255,255,0.2)] scale-105 border`
                                                : 'hover:bg-indigo-500/10 hover:border hover:border-indigo-500/30'
                                                }`}
                                        >
                                            {isActive && <inst.icon size={14} className={`${inst.color} drop-shadow-[0_0_8px_currentColor]`} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
