import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, Trash2, Drum, Music, Guitar, Mic2, Circle } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import DraggableBlock from './DraggableBlock';
import { useAudioEffectsChain } from '../hooks/useAudioEffectsChain';

const NOTE_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const KEYBOARD_MAPPING = [
    { noteClass: 'C', keyLabel: 'A', keyCode: 'KeyA', isBlack: false, octaveOffset: 0 },
    { noteClass: 'C#', keyLabel: 'W', keyCode: 'KeyW', isBlack: true, octaveOffset: 0 },
    { noteClass: 'D', keyLabel: 'S', keyCode: 'KeyS', isBlack: false, octaveOffset: 0 },
    { noteClass: 'D#', keyLabel: 'E', keyCode: 'KeyE', isBlack: true, octaveOffset: 0 },
    { noteClass: 'E', keyLabel: 'D', keyCode: 'KeyD', isBlack: false, octaveOffset: 0 },
    { noteClass: 'F', keyLabel: 'F', keyCode: 'KeyF', isBlack: false, octaveOffset: 0 },
    { noteClass: 'F#', keyLabel: 'T', keyCode: 'KeyT', isBlack: true, octaveOffset: 0 },
    { noteClass: 'G', keyLabel: 'G', keyCode: 'KeyG', isBlack: false, octaveOffset: 0 },
    { noteClass: 'G#', keyLabel: 'Y', keyCode: 'KeyY', isBlack: true, octaveOffset: 0 },
    { noteClass: 'A', keyLabel: 'H', keyCode: 'KeyH', isBlack: false, octaveOffset: 0 },
    { noteClass: 'A#', keyLabel: 'U', keyCode: 'KeyU', isBlack: true, octaveOffset: 0 },
    { noteClass: 'B', keyLabel: 'J', keyCode: 'KeyJ', isBlack: false, octaveOffset: 0 },

    { noteClass: 'C', keyLabel: 'K', keyCode: 'KeyK', isBlack: false, octaveOffset: 1 },
    { noteClass: 'C#', keyLabel: 'O', keyCode: 'KeyO', isBlack: true, octaveOffset: 1 },
    { noteClass: 'D', keyLabel: 'L', keyCode: 'KeyL', isBlack: false, octaveOffset: 1 },
    { noteClass: 'D#', keyLabel: 'P', keyCode: 'KeyP', isBlack: true, octaveOffset: 1 },
    { noteClass: 'E', keyLabel: 'Ñ', keyCode: 'Semicolon', isBlack: false, octaveOffset: 1 },
    { noteClass: 'F', keyLabel: '{', keyCode: 'Quote', isBlack: false, octaveOffset: 1 },
];

const PRESETS = [
    { id: 'studio_grand', name: 'Studio Grand' },
    { id: 'classic_organ', name: 'Órgano Clásico' },
    { id: 'synth_lead', name: 'Sinte Vintaje' },
    { id: 'epiano', name: 'Piano Eléctrico' },
];

const getNoteFreq = (noteStr) => {
    const isSharp = noteStr.includes('#');
    const noteClass = isSharp ? noteStr.slice(0, 2) : noteStr.slice(0, 1);
    const octave = parseInt(isSharp ? noteStr.slice(2) : noteStr.slice(1));
    const noteIndex = NOTE_CLASSES.indexOf(noteClass);
    if (noteIndex === -1 || isNaN(octave)) return 440;
    const midiNote = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midiNote - 69) / 12);
};

export default function PianoTrack({ track }) {
    const { playheadPosition, isPlaying, isRecording, addNoteToTrack, tempo, zoomLevel } = useStudioStore();
    const [activeKeys, setActiveKeys] = useState({});
    const [currentPreset, setCurrentPreset] = useState('studio_grand');
    const [baseOctave, setBaseOctave] = useState(3);
    const activeRecordings = useRef({});

    const audioCtx = useRef(null);
    const audioNodes = useRef({});
    const lastPlayedNotes = useRef({});

    useEffect(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    const { trackInputNode } = useAudioEffectsChain(audioCtx.current, track.effects, track.volume / 100);

    // --- SINTETIZADOR MULTI-PRESET ---
    const playSynthesizer = (note, preset = currentPreset, vol = track.volume) => {
        if (!audioCtx.current) return null;
        if (audioCtx.current.state === 'suspended') audioCtx.current.resume();

        const pitchMultiplier = Math.pow(2, (track.pitch || 0) / 12);
        const freq = getNoteFreq(note) * pitchMultiplier;

        if (!freq) return null;

        const masterGain = audioCtx.current.createGain();
        masterGain.connect(trackInputNode || audioCtx.current.destination);

        let oscs = [];
        let gains = [];
        const now = audioCtx.current.currentTime;
        masterGain.gain.value = vol / 100;

        if (preset === 'studio_grand') {
            const osc1 = audioCtx.current.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.value = freq;
            const osc2 = audioCtx.current.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq;

            const gain1 = audioCtx.current.createGain();
            const gain2 = audioCtx.current.createGain();

            osc1.connect(gain1);
            osc2.connect(gain2);
            gain1.connect(masterGain);
            gain2.connect(masterGain);

            gain1.gain.setValueAtTime(0, now);
            gain1.gain.linearRampToValueAtTime(0.8, now + 0.05);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 3);

            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.4, now + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 2);

            osc1.start(now);
            osc2.start(now);
            oscs = [osc1, osc2];
            gains = [gain1, gain2];

        } else if (preset === 'classic_organ') {
            const createDrawbar = (harmonicMultiple, v) => {
                const osc = audioCtx.current.createOscillator();
                const g = audioCtx.current.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq * harmonicMultiple;
                osc.connect(g);
                g.connect(masterGain);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(v, now + 0.02);
                osc.start(now);
                return { osc, g };
            };

            const harmonics = [
                createDrawbar(1, 0.7), // Base
                createDrawbar(2, 0.4), // Octava arriba
                createDrawbar(3, 0.3), // Quinta y octava
                createDrawbar(0.5, 0.5) // Sub-octava
            ];

            oscs = harmonics.map(h => h.osc);
            gains = harmonics.map(h => h.g);
            masterGain.gain.value = (vol / 100) * 0.7; // El organo es muy fuerte

        } else if (preset === 'synth_lead') {
            const osc1 = audioCtx.current.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.value = freq;
            const osc2 = audioCtx.current.createOscillator();
            osc2.type = 'square';
            osc2.frequency.value = freq * 1.01; // Ligero desafine

            const filter = audioCtx.current.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(3000, now + 0.2);

            const g1 = audioCtx.current.createGain();
            osc1.connect(g1);
            osc2.connect(g1);
            g1.connect(filter);
            filter.connect(masterGain);

            g1.gain.setValueAtTime(0, now);
            g1.gain.linearRampToValueAtTime(0.6, now + 0.05);
            g1.gain.setTargetAtTime(0.4, now + 0.1, 0.2);

            osc1.start(now);
            osc2.start(now);
            oscs = [osc1, osc2];
            gains = [g1];

        } else if (preset === 'epiano') {
            const osc1 = audioCtx.current.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = freq;

            const osc2 = audioCtx.current.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.value = freq * 2; // Armónico

            const g1 = audioCtx.current.createGain();
            const g2 = audioCtx.current.createGain();

            osc1.connect(g1);
            osc2.connect(g2);
            g1.connect(masterGain);
            g2.connect(masterGain);

            g1.gain.setValueAtTime(0, now);
            g1.gain.linearRampToValueAtTime(0.9, now + 0.01);
            g1.gain.exponentialRampToValueAtTime(0.1, now + 2);

            g2.gain.setValueAtTime(0, now);
            g2.gain.linearRampToValueAtTime(0.5, now + 0.01);
            g2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc1.start(now);
            osc2.start(now);
            oscs = [osc1, osc2];
            gains = [g1, g2];
        }

        return { oscs, masterGain };
    };

    const stopSynthesizer = (nodes) => {
        if (!nodes || !nodes.masterGain) return;
        try {
            const now = audioCtx.current.currentTime;
            nodes.masterGain.gain.cancelScheduledValues(now);
            nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
            nodes.masterGain.gain.linearRampToValueAtTime(0, now + 0.1);
            nodes.oscs.forEach(osc => osc.stop(now + 0.15));
        } catch (e) { }
    };

    // --- INTERACTIVIDAD Y GRABACIÓN ---
    const startNote = (note) => {
        if (!activeKeys[note]) {
            setActiveKeys(prev => ({ ...prev, [note]: true }));
            const nodes = playSynthesizer(note);
            audioNodes.current[note] = nodes;

            if (isRecording && track.isArmed) {
                activeRecordings.current[note] = { startTime: Math.max(0, playheadPosition) };
            }
        }
    };

    const endNote = (note) => {
        if (activeKeys[note]) {
            setActiveKeys(prev => ({ ...prev, [note]: false }));

            if (audioNodes.current[note]) {
                stopSynthesizer(audioNodes.current[note]);
                delete audioNodes.current[note];
            }

            if (activeRecordings.current[note]) {
                const start = activeRecordings.current[note].startTime;
                const endPos = Math.max(0, playheadPosition);
                const duration = Math.max(10, endPos - start);

                addNoteToTrack(track.id, {
                    id: Date.now() + '-' + note,
                    note: note,
                    startTime: start,
                    duration: duration,
                    preset: currentPreset
                });
                delete activeRecordings.current[note];
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            const keyObj = KEYBOARD_MAPPING.find(k => k.keyCode === e.code);
            if (keyObj && !e.repeat) {
                const noteStr = `${keyObj.noteClass}${baseOctave + keyObj.octaveOffset}`;
                startNote(noteStr);
            }
        };
        const handleKeyUp = (e) => {
            const keyObj = KEYBOARD_MAPPING.find(k => k.keyCode === e.code);
            // Parar todas las notas asociadas si cambiaron la octava mientras la tecla estaba presionada
            // Lo más seguro es parar todas las iteraciones de octavas de esa tecla
            if (keyObj) {
                for (let o = 1; o <= 7; o++) {
                    const noteStr = `${keyObj.noteClass}${o + keyObj.octaveOffset}`;
                    endNote(noteStr);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            Object.values(audioNodes.current).forEach(stopSynthesizer);
        };
    }, [isPlaying, isRecording, track.isArmed, playheadPosition, activeKeys, currentPreset, baseOctave]);

    // --- REPRODUCCIÓN AUTOMÁTICA (PLAYBACK) ---
    useEffect(() => {
        if (!isPlaying) {
            lastPlayedNotes.current = {};
            return;
        }

        const PIXELS_PER_MS = tempo / 1500;
        const LOOKAHEAD = 16;
        const lookaheadPx = LOOKAHEAD * PIXELS_PER_MS;

        // Acelerar o ralentizar el "playhead virtual" de esta pista
        const localPlayhead = Math.max(0, playheadPosition) * (track.speed || 1);

        track.blocks.forEach(block => {
            if (block.startTime <= localPlayhead + lookaheadPx && block.startTime > localPlayhead - 10) {
                if (!lastPlayedNotes.current[block.id] && !track.isMuted) {
                    lastPlayedNotes.current[block.id] = true;
                    // Usa el preset guardado en el bloque o el actual si es antiguo
                    const nodes = playSynthesizer(block.note, block.preset || 'studio_grand', track.volume);

                    if (nodes && audioCtx.current) {
                        const durationMs = (block.duration / (track.speed || 1)) / PIXELS_PER_MS;
                        setTimeout(() => {
                            stopSynthesizer(nodes);
                        }, durationMs);
                    }
                }
            }
        });

    }, [playheadPosition, isPlaying, track.blocks, track.isMuted, track.volume, track.speed, track.pitch]);

    return (
        <div className="absolute top-0 left-0 w-max h-full flex z-10">
            {track.isArmed && createPortal(
                <div className="fixed bottom-0 left-0 right-0 h-80 bg-[#111] border-t border-slate-700 shadow-[0_0_80px_rgba(0,0,0,0.8)] z-[999999] flex flex-col justify-between">

                    {/* Toolbar Superior (BandLab Style) */}
                    <div className="px-6 py-4 flex items-center justify-between bg-slate-900 border-b border-white/5 shadow-md">
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-bold text-slate-300">Instrumento:</span>
                            <div className="flex bg-slate-800/80 rounded border border-slate-700">
                                {PRESETS.map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setCurrentPreset(preset.id)}
                                        className={`px-4 py-2 text-xs font-bold transition-all border-r border-slate-700 last:border-r-0 ${currentPreset === preset.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-300">Octava</span>
                                <div className="flex items-center bg-slate-800 rounded border border-slate-700">
                                    <button onClick={() => setBaseOctave(Math.max(1, baseOctave - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Minus size={14} /></button>
                                    <span className="w-8 text-center text-sm font-bold text-white">{baseOctave}</span>
                                    <button onClick={() => setBaseOctave(Math.min(6, baseOctave + 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Plus size={14} /></button>
                                </div>
                            </div>
                            <div className="text-xs font-black tracking-widest text-indigo-300 uppercase px-4 py-2 rounded-full border border-indigo-500/30">
                                Modo Grabación
                            </div>
                        </div>
                    </div>

                    {/* Contenedor del Teclado Realista */}
                    <div className="flex-1 bg-slate-900 overflow-x-auto flex items-start justify-center pt-8 pb-4">
                        <div
                            className="flex relative items-start bg-slate-900 mx-auto border border-black shadow-2xl"
                            style={{ width: 'max-content', minWidth: 'max-content' }}
                        >
                            {KEYBOARD_MAPPING.map((keyObj, i) => {
                                if (!keyObj.isBlack) {
                                    const noteStr = `${keyObj.noteClass}${baseOctave + keyObj.octaveOffset}`;
                                    const hasNextBlack = i + 1 < KEYBOARD_MAPPING.length && KEYBOARD_MAPPING[i + 1].isBlack;
                                    const nextBlackObj = hasNextBlack ? KEYBOARD_MAPPING[i + 1] : null;
                                    const nextBlackNoteStr = hasNextBlack ? `${nextBlackObj.noteClass}${baseOctave + nextBlackObj.octaveOffset}` : null;

                                    return (
                                        <div
                                            key={noteStr}
                                            className="relative group/key"
                                            style={{ flex: '0 0 60px', width: '60px' }}
                                        >
                                            {/* Tecla Blanca */}
                                            <button
                                                onMouseDown={() => startNote(noteStr)}
                                                onMouseUp={() => endNote(noteStr)}
                                                onMouseLeave={() => endNote(noteStr)}
                                                onTouchStart={(e) => { e.preventDefault(); startNote(noteStr); }}
                                                onTouchEnd={(e) => { e.preventDefault(); endNote(noteStr); }}
                                                className={`w-full bg-white border-r border-b border-[#222] rounded-b-md flex flex-col justify-end items-center pb-2 transition-all relative outline-none select-none hover:bg-slate-50
                                                ${activeKeys[noteStr] ? 'bg-slate-200 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]' : ''} ${i === 0 ? 'border-l' : ''}`}
                                                style={{ height: '180px' }}
                                            >
                                                {/* Octava label */}
                                                {keyObj.noteClass === 'C' && (
                                                    <span className="absolute bottom-[3.5rem] left-2 text-[10px] text-slate-400 font-bold">{noteStr}</span>
                                                )}
                                                <span className="text-[14px] font-bold text-slate-500">{keyObj.keyLabel}</span>
                                            </button>

                                            {/* Tecla Negra */}
                                            {hasNextBlack && (
                                                <button
                                                    onMouseDown={() => startNote(nextBlackNoteStr)}
                                                    onMouseUp={() => endNote(nextBlackNoteStr)}
                                                    onMouseLeave={() => endNote(nextBlackNoteStr)}
                                                    onTouchStart={(e) => { e.preventDefault(); startNote(nextBlackNoteStr); }}
                                                    onTouchEnd={(e) => { e.preventDefault(); endNote(nextBlackNoteStr); }}
                                                    className={`absolute top-0 -right-[20px] bg-[#222] rounded-b-md flex flex-col justify-end items-center pb-2 transition-all outline-none select-none z-20 hover:bg-[#333] border-x border-b border-black shadow-lg
                                                    ${activeKeys[nextBlackNoteStr] ? 'bg-[#111] shadow-none' : ''}`}
                                                    style={{ width: '40px', height: '110px' }}
                                                >
                                                    <span className="text-[12px] font-bold text-white">{nextBlackObj.keyLabel}</span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* RENDER DE BLOQUES MUSICALES EN TIMELINE */}
            <div className="absolute top-0 bottom-0 left-0 w-[5000px] pointer-events-none">
                {track.blocks.map(block => {
                    const blockColors = {
                        'C': 'bg-red-500 border-red-400', 'C#': 'bg-red-400 border-red-300', 'D': 'bg-orange-500 border-orange-400', 'D#': 'bg-orange-400 border-orange-300',
                        'E': 'bg-yellow-400 border-yellow-300', 'F': 'bg-green-500 border-green-400', 'F#': 'bg-green-400 border-green-300', 'G': 'bg-cyan-500 border-cyan-400',
                        'G#': 'bg-cyan-400 border-cyan-300', 'A': 'bg-blue-500 border-blue-400', 'A#': 'bg-blue-400 border-blue-300', 'B': 'bg-purple-500 border-purple-400'
                    };
                    const isSharp = block.note.includes('#');
                    const noteClass = isSharp ? block.note.slice(0, 2) : block.note.slice(0, 1);

                    return (
                        <DraggableBlock
                            key={block.id}
                            trackId={track.id}
                            block={block}
                            zoomLevel={zoomLevel}
                            tempo={tempo}
                            trackSpeed={track.speed || 1}
                            className={`${blockColors[noteClass] || 'bg-indigo-500 border-indigo-400'}`}
                        >
                            <span className="text-[9px] font-bold text-white/80 drop-shadow-md truncate absolute pl-1">
                                {block.note}
                            </span>
                        </DraggableBlock>
                    )
                })}
            </div>
        </div>
    );
}
