import React from 'react';
import { useUkeStore } from '../store/useUkeStore';

export default function SpatialTablature({ notes, currentTime, onManualHit }) {
    const { focusMode } = useUkeStore();
    const VISUAL_LEAD_TIME = 3000;

    // Ukelele Afinación GCEA
    const STRINGS = [
        { id: '1', name: 'A (La)', color: '#3b82f6' }, // Blue
        { id: '2', name: 'E (Mi)', color: '#ef4444' }, // Red
        { id: '3', name: 'C (Do)', color: '#22c55e' }, // Green
        { id: '4', name: 'G (Sol)', color: '#eab308' } // Yellow
    ];

    return (
        <div className={`w-[90%] max-w-6xl h-[450px] rounded-[3rem] relative overflow-hidden flex flex-col p-4 gap-4 transition-colors duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-slate-700/50 relative
            ${focusMode ? 'bg-slate-950/90' : 'bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950'}
        `}>
            {/* Madera Overlay para aclarar ligeramente si no es focusMode */}
            {!focusMode && <div className="absolute inset-0 bg-white/5 pointer-events-none mix-blend-overlay" />}

            {/* Zona de golpe (Línea de tiempo) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 bg-gradient-to-b from-indigo-500/10 via-white/20 to-indigo-500/10 border-x-2 border-indigo-400/50 z-10 pointer-events-none flex flex-col items-center justify-start shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                <div className="bg-indigo-500 text-white font-black text-[9px] px-3 py-1.5 rounded-b-xl uppercase tracking-widest shadow-lg border border-indigo-300">¡TOCA!</div>
            </div>

            {STRINGS.map((str) => (
                <div
                    key={str.id}
                    className={`flex-1 relative flex items-center rounded-2xl cursor-pointer hover:brightness-110 transition-all shadow-inner ${focusMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10'}`}
                    onPointerDown={(e) => {
                        e.preventDefault();
                        onManualHit(str.id);
                    }}
                >
                    {/* Cuerdas y Notas Background (Full Width) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-20">
                        {/* Cuerda Física (Metálica/Nylon) */}
                        <div className="absolute top-1/2 w-full h-1 sm:h-2 -translate-y-1/2 bg-gradient-to-b from-gray-300 via-white to-gray-500 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.6)]" />

                        {/* Rendering blocks */}
                        {notes.filter(n => n.stringId === str.id).map(note => {
                            const timeRemaining = note.hitTime - currentTime;
                            // Make them disappear past the hit line by giving more time (e.g. -3000)
                            if (timeRemaining < -3000 || timeRemaining > VISUAL_LEAD_TIME) return null;

                            // Mapeo: 50% es la zona de golpe (centro de la pantalla)
                            const percentage = 50 + (timeRemaining / VISUAL_LEAD_TIME) * 50;

                            // Color por dedo
                            const getFingerColor = (finger) => {
                                switch (finger) {
                                    case '1': return '#3b82f6';
                                    case '2': return '#eab308';
                                    case '3': return '#ef4444';
                                    case '4': return '#22c55e';
                                    default: return str.color;
                                }
                            };

                            let bgCol = getFingerColor(note.finger);
                            let glow = '';

                            if (note.hit) {
                                bgCol = '#4ade80'; // Bright green
                                glow = 'brightness-150 scale-125 shadow-[0_0_50px_rgba(74,222,128,1)] opacity-0 duration-500 z-50';
                            } else if (note.missed) {
                                bgCol = '#ef4444'; // Red
                                glow = 'grayscale opacity-70 duration-300';
                            } else if (Math.abs(timeRemaining) <= 150) {
                                // En zona de golpeo exacta (±150ms)
                                bgCol = '#22c55e'; // Highlight green
                                glow = 'scale-110 shadow-[0_0_25px_rgba(34,197,94,0.9)] border-green-300 ring-4 ring-green-400 z-50';
                            }

                            return (
                                <div
                                    key={note.id}
                                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 sm:w-16 h-10 sm:h-16 rounded-full shadow-lg flex items-center justify-center border-4 border-white/40 transition-all ${glow}`}
                                    style={{
                                        left: `${percentage}%`,
                                        backgroundColor: bgCol,
                                    }}
                                >
                                    <span className="text-white font-black text-3xl pb-1 drop-shadow-md">
                                        {note.fret || '0'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    {/* Etiqueta de la Cuerda Frontal */}
                    <div className="w-16 sm:w-24 shrink-0 flex items-center justify-center font-black text-xs sm:text-2xl h-full rounded-l-2xl border-r-4 border-black/40 z-30 shadow-[4px_0_10px_rgba(0,0,0,0.6)] select-none text-white drop-shadow-md relative" style={{ backgroundColor: str.color }}>
                        {str.name}
                    </div>
                </div>
            ))}
        </div>
    );
}
