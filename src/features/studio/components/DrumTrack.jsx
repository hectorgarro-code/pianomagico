import React, { useEffect, useRef } from 'react';
import { Drum, Trash2 } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import DraggableBlock from './DraggableBlock';
import { useAudioEffectsChain } from '../hooks/useAudioEffectsChain';

const BEAT_WIDTH = 40; // 40px por beat
const PIXELS_PER_MS = 120 / 1500; // Aproximado para cálculo visual

export default function DrumTrack({ track }) {
    const { playheadPosition, isPlaying, isRecording, tempo, zoomLevel, removeBlockFromTrack } = useStudioStore();

    // Audio Context Local
    const audioCtx = useRef(null);
    const audioElementsRef = useRef({}); // Para almacenar buffers decodificados si fuera necesario, pero usaremos síntesis directa

    useEffect(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    const { trackInputNode } = useAudioEffectsChain(audioCtx.current, track.effects, track.volume / 100);

    const pitchMultiplier = Math.pow(2, (track.pitch || 0) / 12);

    // --- SÍNTESIS BÁSICA ---
    const playKick = (time) => {
        if (!audioCtx.current) return;
        const osc = audioCtx.current.createOscillator();
        const gain = audioCtx.current.createGain();
        osc.connect(gain);
        gain.connect(trackInputNode || audioCtx.current.destination);
        osc.frequency.setValueAtTime(150 * pitchMultiplier, time);
        osc.frequency.exponentialRampToValueAtTime(0.01 * pitchMultiplier, time + 0.5);
        gain.gain.setValueAtTime((track.volume / 100) * 0.8, time);
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
        noiseFilter.frequency.value = 1000 * pitchMultiplier;
        noise.connect(noiseFilter);
        noiseFilter.connect(gain);
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(trackInputNode || audioCtx.current.destination);
        osc.frequency.setValueAtTime(250 * pitchMultiplier, time);
        gain.gain.setValueAtTime((track.volume / 100) * 0.6, time);
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
        bandpass.frequency.value = 10000 * pitchMultiplier;
        const highpass = audioCtx.current.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 7000 * pitchMultiplier;
        noise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gain);
        gain.connect(trackInputNode || audioCtx.current.destination);
        gain.gain.setValueAtTime((track.volume / 100) * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        noise.start(time);
    };

    const lastStepPlayed = useRef(-1);

    // --- REPRODUCCIÓN (PLAYBACK DE PATRONES EN BLOQUES) ---
    useEffect(() => {
        if (!isPlaying || track.isMuted || !audioCtx.current || !track.patterns) return;

        // Limpieza de state si el playhead retrocede
        if (playheadPosition <= 0) lastStepPlayed.current = -1;

        // Acelerar o ralentizar el "playhead virtual" de esta pista
        const localPlayhead = Math.max(0, playheadPosition) * (track.speed || 1);

        // Buscar qué bloque de batería está pisando el playhead actualmente
        const activeBlock = track.blocks.find(b => localPlayhead >= b.startTime && localPlayhead <= b.startTime + b.duration);

        if (activeBlock) {
            const pattern = track.patterns[activeBlock.patternId];
            if (!pattern) return;

            // Calcular en qué step del patrón (0-15) estamos dentro del bloque activo
            // Cada step = 10px (160px / 16 steps = 10px/step)
            const relativeOffset = localPlayhead - activeBlock.startTime;
            const currentStepIndex = Math.floor(relativeOffset / 10) % 16;

            if (currentStepIndex !== lastStepPlayed.current) {
                lastStepPlayed.current = currentStepIndex;

                const time = audioCtx.current.currentTime;

                // Disparar las 3 voces acorde al patrón
                if (pattern.kick[currentStepIndex]) playKick(time);
                if (pattern.snare[currentStepIndex]) playSnare(time);
                if (pattern.hihat[currentStepIndex]) playHiHat(time);
            }
        }

    }, [playheadPosition, isPlaying, track.blocks, track.isMuted, track.volume, track.patterns, track.speed, track.pitch]);

    // --- INTERFAZ ---
    return (
        <div className="absolute top-0 left-0 w-[5000px] h-full flex z-10 pointer-events-none">

            {/* RENDER DE BLOQUES (Toda la pista virtual) */}
            {track.blocks.map(block => (
                <DraggableBlock
                    key={block.id}
                    trackId={track.id}
                    block={block}
                    zoomLevel={zoomLevel}
                    tempo={tempo}
                    trackSpeed={track.speed || 1}
                    className="bg-indigo-500/20 border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:bg-indigo-500/30 transition-colors"
                >
                    {/* Minimal Grid Background */}
                    <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(16, 1fr)' }}>
                        {Array.from({ length: 16 }).map((_, i) => (
                            <div key={i} className="border-r border-indigo-200/5 h-full mix-blend-overlay"></div>
                        ))}
                    </div>

                    {/* Contenido / Label */}
                    <div className="flex items-center gap-1.5 opacity-90 relative z-10 w-full justify-between group-hover/block:opacity-100 transition-opacity px-2 pointer-events-auto">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1 h-full" onClick={(e) => {
                            e.stopPropagation();
                            useStudioStore.getState().setActiveDrumMachine(track.id, block.patternId);
                        }}>
                            <div className="w-5 h-5 rounded-md bg-indigo-500/40 border border-indigo-400/50 flex items-center justify-center font-black text-[10px] text-white shrink-0 shadow-inner drop-shadow-md">
                                {block.patternId}
                            </div>
                            <Drum size={12} className="text-indigo-200 shrink-0 drop-shadow-md" />
                            <span className="text-[10px] font-bold text-indigo-100 tracking-wider flex-1 truncate drop-shadow-md select-none">
                                CAJA DE RITMOS
                            </span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeBlockFromTrack(track.id, block.id);
                            }}
                            className="w-5 h-5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded flex items-center justify-center opacity-0 group-hover/block:opacity-100 transition-all ml-2 shrink-0 z-20 pointer-events-auto"
                            title="Eliminar bloque"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </DraggableBlock>
            ))}

        </div>
    );
}
