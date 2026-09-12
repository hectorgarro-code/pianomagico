import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { Settings2, X, Plus, Trash2, SlidersHorizontal } from 'lucide-react';

const EFFECT_CATEGORIES = {
    'Delay': [
        { type: 'delay', name: 'Digital Delay', desc: 'Eco limpio y repetitivo.', defaults: { time: 0.3, feedback: 0.4, mix: 0.5 } },
        { type: 'slapback', name: 'Slapback', desc: 'Eco corto tipo Rockabilly.', defaults: { time: 0.1, feedback: 0.1, mix: 0.5 } }
    ],
    'Reverb': [
        { type: 'reverb_room', name: 'Room Reverb', desc: 'Simula una habitación pequeña.', defaults: { time: 0.5, mix: 0.4 } },
        { type: 'reverb_hall', name: 'Hall Reverb', desc: 'Gran auditorio.', defaults: { time: 2.0, mix: 0.6 } }
    ],
    'Distortion': [
        { type: 'overdrive', name: 'Overdrive', desc: 'Saturación suave de tubo.', defaults: { drive: 0.5, mix: 1.0 } },
        { type: 'fuzz', name: 'Fuzz', desc: 'Distorsión destructiva.', defaults: { drive: 0.8, mix: 1.0 } }
    ],
    'EQ & Filter': [
        { type: 'lowpass', name: 'Lowpass Filter', desc: 'Corta frecuencias agudas.', defaults: { frequency: 1000, Q: 1 } },
        { type: 'highpass', name: 'Highpass Filter', desc: 'Corta frecuencias graves.', defaults: { frequency: 500, Q: 1 } }
    ]
};

const Knob = ({ label, value, min, max, step, onChange }) => {
    return (
        <div className="flex flex-col items-center gap-1">
            <input
                type="range"
                min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-16 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:bg-indigo-400
                    [&::-webkit-slider-thumb]:rounded-full"
            />
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</div>
            <div className="text-[11px] text-white font-bold">{value.toFixed(2)}</div>
        </div>
    );
};

export default function EffectsPanel() {
    const {
        tracks,
        activeEffectsTrackId,
        setActiveEffectsTrack,
        addEffectToTrack,
        removeEffectFromTrack,
        updateEffectParam
    } = useStudioStore();

    const [selectedCategory, setSelectedCategory] = useState(Object.keys(EFFECT_CATEGORIES)[0]);

    if (!activeEffectsTrackId) return null;

    const track = tracks.find(t => t.id === activeEffectsTrackId);
    if (!track) return null;

    const renderKnobs = (fx) => {
        switch (fx.type) {
            case 'delay':
            case 'slapback':
                return (
                    <>
                        <Knob label="Time" value={fx.params.time} min={0.01} max={1.0} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'time', val)} />
                        <Knob label="Feedback" value={fx.params.feedback} min={0.0} max={0.9} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'feedback', val)} />
                        <Knob label="Mix" value={fx.params.mix} min={0.0} max={1.0} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'mix', val)} />
                    </>
                );
            case 'reverb_room':
            case 'reverb_hall':
                return (
                    <>
                        <Knob label="Time" value={fx.params.time} min={0.1} max={5.0} step={0.1} onChange={(val) => updateEffectParam(track.id, fx.id, 'time', val)} />
                        <Knob label="Mix" value={fx.params.mix} min={0.0} max={1.0} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'mix', val)} />
                    </>
                );
            case 'overdrive':
            case 'fuzz':
                return (
                    <>
                        <Knob label="Drive" value={fx.params.drive} min={0.0} max={1.0} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'drive', val)} />
                        <Knob label="Mix" value={fx.params.mix} min={0.0} max={1.0} step={0.01} onChange={(val) => updateEffectParam(track.id, fx.id, 'mix', val)} />
                    </>
                );
            case 'lowpass':
            case 'highpass':
                return (
                    <>
                        <Knob label="Freq" value={fx.params.frequency} min={20} max={20000} step={10} onChange={(val) => updateEffectParam(track.id, fx.id, 'frequency', val)} />
                        <Knob label="Q" value={fx.params.Q} min={0.1} max={10} step={0.1} onChange={(val) => updateEffectParam(track.id, fx.id, 'Q', val)} />
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-64 bg-[#111] border-t border-slate-700 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col z-50 overflow-hidden text-slate-200 absolute bottom-0 left-0 right-0">
            {/* Header */}
            <div className="h-10 bg-[#1a1a1a] border-b border-black/50 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-indigo-400" />
                    <span className="font-bold text-sm">Effect Rack:</span>
                    <span className="text-sm text-indigo-300 font-medium">{track.name}</span>
                </div>
                <button
                    onClick={() => setActiveEffectsTrack(null)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Menú de Categorías Sidebar */}
                <div className="w-40 border-r border-slate-800 bg-[#151515] flex flex-col overflow-y-auto shrink-0 py-2">
                    {Object.keys(EFFECT_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`text-left px-4 py-2 text-xs font-bold transition-colors ${selectedCategory === cat
                                    ? 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Lista de Presets */}
                <div className="w-64 border-r border-slate-800 bg-[#1c1c1c] overflow-y-auto p-4 flex flex-col gap-2 shrink-0">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Available Effects</div>
                    {EFFECT_CATEGORIES[selectedCategory].map(preset => (
                        <div key={preset.type} className="group flex flex-col bg-black/20 hover:bg-black/40 border border-slate-700 hover:border-indigo-500/50 rounded-lg p-3 cursor-pointer transition-all"
                            onClick={() => addEffectToTrack(track.id, preset.type, preset.defaults)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-slate-200">{preset.name}</span>
                                <Plus size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs text-slate-500 line-clamp-2">{preset.desc}</span>
                        </div>
                    ))}
                </div>

                {/* Área de Rack (Efectos Activos) */}
                <div className="flex-1 bg-[#111] overflow-x-auto overflow-y-hidden p-6 flex gap-4 items-center">
                    {(!track.effects || track.effects.length === 0) ? (
                        <div className="w-full flex flex-col items-center justify-center text-slate-600">
                            <Settings2 size={48} className="opacity-20 mb-4" />
                            <p className="text-sm font-medium">No effects mounted.</p>
                            <p className="text-xs mt-1">Select an effect from the list to add it to the chain.</p>
                        </div>
                    ) : (
                        track.effects.map((fx, idx) => (
                            <div key={fx.id} className="h-full w-48 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-xl border border-slate-600/50 shadow-xl flex flex-col shrink-0 overflow-hidden">
                                <div className="h-8 bg-black/40 border-b border-white/5 flex items-center justify-between px-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center text-[9px] font-black text-indigo-300">
                                            {idx + 1}
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider">{fx.type.split('_').join(' ')}</span>
                                    </div>
                                    <button
                                        onClick={() => removeEffectFromTrack(track.id, fx.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex-1 p-4 grid grid-cols-2 gap-4 items-center justify-items-center">
                                    {renderKnobs(fx)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
