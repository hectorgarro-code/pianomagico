import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, X, Activity } from 'lucide-react';

export default function MicSettingsModal({ isOpen, onClose }) {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [volume, setVolume] = useState(0); // 0 to 100
    const [isTesting, setIsTesting] = useState(false);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animFrameRef = useRef(null);

    // Detener y limpiar audio cuando se cierra o desmonta
    const cleanup = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (analyserRef.current) analyserRef.current.disconnect();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
        }
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        setIsTesting(false);
    };

    useEffect(() => {
        if (!isOpen) {
            cleanup();
        }
        return cleanup;
    }, [isOpen]);

    const startTest = async () => {
        try {
            setError(null);
            setIsTesting(true);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(mediaStream);

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
            sourceRef.current.connect(analyserRef.current);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

            const updateVoIume = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                // Escalar volumen un poco para que el vúmetro se mueva más fácilmente (max ~255)
                const volPercent = Math.min(100, Math.max(0, (average / 150) * 100));
                setVolume(volPercent);
                animFrameRef.current = requestAnimationFrame(updateVoIume);
            };

            updateVoIume();

        } catch (err) {
            console.error("Error al acceder al micrófono:", err);
            setError(err.name === 'NotAllowedError' ? 'Permiso denegado por el usuario o sistema.' : err.message);
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    // Calcular barritas del Vúmetro
    const numBars = 20;
    const activeBars = Math.floor((volume / 100) * numBars);

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
                    <div className="flex items-center gap-2 text-pink-400">
                        <Settings size={20} />
                        <h2 className="font-bold text-lg">Configuración de Micrófono</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-6">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex gap-2 items-start">
                            <MicOff size={18} className="shrink-0 mt-0.5" />
                            <p>{error} Asegúrate de autorizar el micrófono en tu navegador.</p>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isTesting && !error ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.3)]' : 'bg-slate-800 text-slate-500'}`}>
                            {isTesting && !error ? <Mic size={32} className="animate-pulse" /> : <MicOff size={32} />}
                        </div>

                        <div>
                            <h3 className="text-white font-bold">{isTesting && !error ? 'Micrófono Activo' : 'Prueba de Micrófono'}</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                {isTesting && !error
                                    ? 'Habla para comprobar el nivel de volumen. Deberías ver moverse el analizador abajo.'
                                    : 'Haz clic en el botón para solicitar permisos al navegador e iniciar la prueba de audio.'}
                            </p>
                        </div>
                    </div>

                    {/* Vúmetro */}
                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                            <span className="flex items-center gap-1"><Activity size={12} /> Nivel de Entrada</span>
                            <span>{Math.round(volume)}%</span>
                        </div>

                        <div className="flex items-center justify-between gap-1 h-8">
                            {Array.from({ length: numBars }).map((_, i) => {
                                const isActive = i < activeBars;
                                // Colores: verdes (< 60%), amarillos (60-80%), rojos (> 80%)
                                let colorClass = 'bg-slate-800';
                                if (isActive) {
                                    if (i > numBars * 0.8) colorClass = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]';
                                    else if (i > numBars * 0.5) colorClass = 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]';
                                    else colorClass = 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
                                }

                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 rounded-sm transition-all duration-75 ${colorClass}`}
                                        style={{ height: isActive ? '100%' : '20%' }}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-slate-800/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition"
                    >
                        Cerrar
                    </button>
                    {!isTesting && (
                        <button
                            onClick={startTest}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-pink-500 hover:bg-pink-400 transition shadow-[0_4px_14px_0_rgba(244,114,182,0.39)]"
                        >
                            Solicitar Permisos / Probar
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
