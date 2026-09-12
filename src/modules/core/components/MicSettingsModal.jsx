import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Settings, X, Activity, Music, Sliders } from 'lucide-react';
import { usePianoMic } from '../../../hooks/usePianoMic';
import { usePianoMicStore } from '../../../hooks/usePianoMicStore';

const SOLFEGE_MAP = {
  'C': 'DO', 'C#': 'DO#', 'D': 'RE', 'D#': 'RE#', 'E': 'MI', 'F': 'FA',
  'F#': 'FA#', 'G': 'SOL', 'G#': 'SOL#', 'A': 'LA', 'A#': 'LA#', 'B': 'SI'
};

const formatDetectedNote = (noteStr) => {
  if (!noteStr) return null;
  const match = String(noteStr).match(/^([A-G]#?)(\d+)?$/);
  if (!match) return noteStr;
  const pitchClass = match[1];
  const octave = match[2] || '';
  const spanish = SOLFEGE_MAP[pitchClass] || pitchClass;
  return { spanish: `${spanish}${octave}`, english: `${pitchClass}${octave}` };
};

export default function MicSettingsModal({ isOpen, onClose }) {
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(0);
  const [detectedNote, setDetectedNote] = useState(null);
  const timeoutRef = useRef(null);

  const sensitivity = usePianoMicStore((state) => state.sensitivity);
  const setSensitivity = usePianoMicStore((state) => state.setSensitivity);

  const { isListening, startMic, stopMic } = usePianoMic((note, rms) => {
    if (note) {
      setDetectedNote(note);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDetectedNote(null);
      }, 1200);
    }
    if (rms !== undefined) {
      const volPercent = Math.min(100, Math.max(0, rms * 400));
      setVolume(volPercent);
    }
  });

  useEffect(() => {
    if (isOpen && !isListening) {
      startMic();
    }
  }, [isOpen, isListening, startMic]);

  if (!isOpen) return null;

  const formatted = detectedNote ? formatDetectedNote(detectedNote) : null;
  const numBars = 20;
  const activeBars = Math.floor((volume / 100) * numBars);

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-800/50">
          <div className="flex items-center gap-2 text-pink-400">
            <Settings size={20} />
            <h2 className="font-bold text-lg">Calibración de Micrófono</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex gap-2 items-start">
              <MicOff size={18} className="shrink-0 mt-0.5" />
              <p>{error} Asegúrate de autorizar el micrófono en tu navegador.</p>
            </div>
          )}

          <div className="flex flex-col items-center gap-3 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
              {isListening ? <Mic size={32} className="animate-pulse" /> : <MicOff size={32} />}
            </div>

            <div>
              <h3 className="text-white font-bold">{isListening ? 'Escuchando tu Piano...' : 'Prueba de Micrófono'}</h3>
              <p className="text-slate-400 text-xs mt-1">
                {isListening
                  ? 'Toca cualquier tecla en tu piano para verificar la nota reconocida.'
                  : 'Haz clic abajo para iniciar la calibración y comprobar qué notas identifica.'}
              </p>
            </div>
          </div>

          {/* Nota Reconocida en Tiempo Real */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-white/10 flex flex-col items-center justify-center gap-2 min-h-[90px] relative overflow-hidden shadow-inner">
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <Music size={12} className="text-pink-400" /> Nota Detectada en Tiempo Real
            </span>

            {formatted ? (
              <div className="flex items-baseline gap-2 animate-in zoom-in-95 duration-150">
                <span className="text-4xl font-black text-pink-400 drop-shadow-[0_0_20px_rgba(244,114,182,0.8)] tracking-tight">
                  {formatted.spanish}
                </span>
                <span className="text-sm font-bold text-white/40 uppercase">
                  ({formatted.english})
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-600 italic">
                {isListening ? "Toca una tecla en tu piano..." : "Inicia la prueba para calibrar"}
              </span>
            )}
          </div>

          {/* Vúmetro */}
          <div className="bg-slate-950 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
              <span className="flex items-center gap-1"><Activity size={12} /> Nivel de Entrada</span>
              <span>{Math.round(volume)}%</span>
            </div>

            <div className="flex items-center justify-between gap-1 h-6">
              {Array.from({ length: numBars }).map((_, i) => {
                const isActive = i < activeBars;
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

          {/* Sensibilidad / Ganancia */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
              <span className="flex items-center gap-1"><Sliders size={12} className="text-pink-400" /> Sensibilidad Guardada</span>
              <span className="text-pink-400 font-black">{Math.round(sensitivity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex justify-between items-center bg-slate-800/30">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">✓ Ajustes guardados en el equipo</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black text-white bg-pink-600 hover:bg-pink-500 transition shadow-[0_4px_14px_0_rgba(244,114,182,0.39)] uppercase cursor-pointer"
          >
            Listo / Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
