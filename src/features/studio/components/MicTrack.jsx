import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { useStudioStore } from '../store/useStudioStore';
import DraggableBlock from './DraggableBlock';
import { useAudioEffectsChain } from '../hooks/useAudioEffectsChain';

export default function MicTrack({ track }) {
    const { playheadPosition, isPlaying, isRecording, addNoteToTrack, tempo, zoomLevel, isCountingIn } = useStudioStore();

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const recordStartTimeRef = useRef(0);
    const recordStartRealTimeRef = useRef(0); // Para calcular la duración de base
    const audioElementsRef = useRef({}); // { [blockId]: HTMLAudioElement }
    const mediaSourceNodesRef = useRef({}); // { [blockId]: MediaElementAudioSourceNode }
    const streamRef = useRef(null);
    const audioCtx = useRef(null);
    const isReadyToRecordRef = useRef(false);

    // Inicializar AudioContext
    useEffect(() => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
        }
    }, []);

    // Construye cadena de efectos y nos entrega el trackInputNode master de esta pista
    const { trackInputNode } = useAudioEffectsChain(audioCtx.current, track.effects, track.volume / 100);

    // --- LÓGICA DE GRABACIÓN ---
    useEffect(() => {
        const prepareRecording = async () => {
            if (streamRef.current && mediaRecorderRef.current) return;

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

                    // Convertir a DataURL (Base64) para poder guardarlo en BD
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result;

                        // Ya no leemos finalPos del playheadPosition porque al pulsar STOP se reinicia a 0
                        const elapsedMs = Date.now() - recordStartRealTimeRef.current;
                        const pixelsPerMs = useStudioStore.getState().tempo / 1500;
                        const calculatedDuration = elapsedMs * pixelsPerMs;
                        const duration = Math.max(20, calculatedDuration); // Mínimo 20 píxeles

                        console.log(`MicTrack Guardado: Start ${recordStartTimeRef.current}, Dur: ${duration}`);

                        // Agregar el bloque al store
                        addNoteToTrack(track.id, {
                            id: `mic-${Date.now()}`,
                            startTime: recordStartTimeRef.current,
                            duration: duration,
                            url: base64data
                        });

                        // Limpiar stream sólo CUANDO el procesamiento haya terminado y guardado
                        if (streamRef.current && !useStudioStore.getState().isCountingIn) {
                            streamRef.current.getTracks().forEach(t => t.stop());
                            streamRef.current = null;
                        }
                        mediaRecorderRef.current = null;
                        isReadyToRecordRef.current = false;
                    };
                };

                isReadyToRecordRef.current = true;
            } catch (err) {
                console.error("Permiso de micrófono denegado:", err);
                alert("No se pudo acceder al micrófono.");
            }
        };

        // Pre-warm durante la cuenta regresiva
        if (isCountingIn && track.isArmed) {
            prepareRecording();
        }

        // Iniciar Grabación
        if (isRecording && track.isArmed) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
                recordStartTimeRef.current = Math.max(0, useStudioStore.getState().playheadPosition);
                recordStartRealTimeRef.current = Date.now();
                mediaRecorderRef.current.start();
            } else if (!mediaRecorderRef.current) {
                // Fallback si por alguna razón no se pre-calentó
                prepareRecording().then(() => {
                    if (mediaRecorderRef.current) {
                        recordStartTimeRef.current = Math.max(0, useStudioStore.getState().playheadPosition);
                        recordStartRealTimeRef.current = Date.now();
                        mediaRecorderRef.current.start();
                    }
                });
            }
        }
        // Detener Grabación (Triggered when isRecording becomes false)
        else if (!isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

    }, [isRecording, isCountingIn, track.isArmed]);

    // Limpieza estricta en caso de que se desmonte el componente track
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // --- LÓGICA DE REPRODUCCIÓN (PLAYBACK) ---
    useEffect(() => {
        const PIXELS_PER_MS = tempo / 1500;
        const currentPos = Math.max(0, playheadPosition);

        // Manejo de Pausa Global
        if (!isPlaying) {
            Object.values(audioElementsRef.current).forEach(audio => {
                if (!audio.paused) {
                    audio.pause();
                }
            });
            return;
        }

        // Acelerar o ralentizar el "playhead virtual" de esta pista
        const localPlayhead = Math.max(0, playheadPosition) * (track.speed || 1);

        // Revisar bloques y reproducir si el playhead cruza su tiempo de inicio
        track.blocks.forEach(block => {
            const lookaheadPx = 16 * PIXELS_PER_MS;

            // Instanciar audio si no existe
            if (!audioElementsRef.current[block.id] && block.url) {
                const newAudio = new Audio(block.url);
                newAudio.preload = 'auto';
                newAudio.crossOrigin = "anonymous";

                if (audioCtx.current && trackInputNode) {
                    try {
                        const sourceNode = audioCtx.current.createMediaElementSource(newAudio);
                        sourceNode.connect(trackInputNode);
                        mediaSourceNodesRef.current[block.id] = sourceNode;
                    } catch (e) {
                        console.warn("MediaElementSource no se pudo crear (quizás ya fue creado)", e);
                    }
                }

                audioElementsRef.current[block.id] = newAudio;
            }

            const audio = audioElementsRef.current[block.id];
            if (!audio) return;

            // Control del Audio
            // El volumen base se gestiona ahora en el EffectChain (gain maestro de la pista).
            // Lo dejamos en 1 para que alimente pura señal a la cadena.
            audio.volume = 1;

            // Silenciar HTML si la pista está muteada
            audio.muted = track.isMuted;
            const targetPlaybackRate = (track.speed || 1) * Math.pow(2, (track.pitch || 0) / 12);
            audio.playbackRate = Math.max(0.1, targetPlaybackRate);
            audio.preservesPitch = false;

            // Detección de entrada en ventana de reproducción
            if (block.startTime <= localPlayhead + lookaheadPx && block.startTime > localPlayhead - 20) {
                if (audio.paused) {
                    // Sincronizar tiempo de inicio exacto + el recorte que el usuario haya hecho por la izquierda
                    const msOffset = (localPlayhead - block.startTime) / (PIXELS_PER_MS * (track.speed || 1));
                    const sourceOffsetMs = block.sourceOffset || 0;

                    if (msOffset > 50) {
                        try {
                            // Sumamos el trozo recortado (sourceOffset) al offset de lag actual
                            audio.currentTime = (sourceOffsetMs + msOffset) / 1000;
                        } catch (e) { }
                    } else {
                        try {
                            audio.currentTime = sourceOffsetMs / 1000;
                        } catch (e) { }
                    }

                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.error("Error reproduciendo audio guardado:", e));
                    }
                }
            }
            // Apagar si el bloque ya pasó (usando la duración original o aproximada)
            else if (localPlayhead > block.startTime + block.duration + 20) {
                if (!audio.paused) {
                    audio.pause();
                }
            }
        });
    }, [playheadPosition, isPlaying, track.blocks, track.volume, track.isMuted, tempo, track.speed, track.pitch]);

    // --- INTERFAZ ---
    return (
        <div className="absolute top-0 left-0 w-max h-full flex z-10">

            {/* Visual indicador si está grabando */}
            {isRecording && track.isArmed && (
                <div className="fixed left-64 w-32 h-16 bg-slate-900 border-r border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] z-50 flex flex-col items-center justify-center p-2 gap-1 translate-x-4 rounded-xl">
                    <Mic className="text-red-500 animate-pulse" size={24} />
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">Grabando</span>
                </div>
            )}

            {/* RENDER DE BLOQUE EN VIVO (Mientras graba) */}
            {isRecording && track.isArmed && (
                <div
                    className="absolute top-2 bottom-2 rounded-md border bg-red-900/50 border-red-500/50 flex items-center px-2 overflow-hidden opacity-80 backdrop-blur-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    style={{
                        left: `${recordStartTimeRef.current * zoomLevel}px`,
                        width: `${Math.max(10, (playheadPosition - recordStartTimeRef.current) * zoomLevel)}px`
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-around opacity-50 gap-px px-1">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={`live-${i}`} className="w-1 bg-red-400 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                    </div>
                </div>
            )}

            {/* RENDER DE BLOQUES GRABADOS */}
            <div className="absolute top-0 bottom-0 left-0 w-[5000px] pointer-events-none">
                {track.blocks.map(block => (
                    <DraggableBlock
                        key={block.id}
                        trackId={track.id}
                        block={block}
                        zoomLevel={zoomLevel}
                        tempo={tempo}
                        trackSpeed={track.speed || 1}
                        className="bg-slate-700 border-slate-500"
                    >
                        {/* Simulación visual de onda (Waveform placeholder) - TODO: Dibujar la real si da tiempo */}
                        <div className="absolute inset-0 flex items-center justify-around opacity-30 gap-px px-1 pointer-events-none">
                            {Array.from({ length: Math.min(20, Math.floor(block.duration / 5)) }).map((_, i) => (
                                <div key={i} className="w-1 bg-white rounded-full" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                            ))}
                        </div>
                        <span className="relative text-[10px] font-bold text-white drop-shadow-md z-10 flex items-center gap-1 pl-1">
                            <Mic size={10} /> Audio
                        </span>
                    </DraggableBlock>
                ))}
            </div>

        </div>
    );
}
