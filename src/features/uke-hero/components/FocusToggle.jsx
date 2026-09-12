import React from 'react';
import { useUkeStore } from '../store/useUkeStore';
import { Eye, EyeOff } from 'lucide-react';

export default function FocusToggle() {
    const { focusMode, setFocusMode } = useUkeStore();

    return (
        <button
            onClick={() => setFocusMode(!focusMode)}
            className={`flex items-center justify-center gap-2 p-3 md:p-4 min-w-[140px] md:min-w-[180px] rounded-2xl border-4 transition-all duration-300 shadow-md ${focusMode ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-300 active:scale-95'}`}
        >
            {focusMode ? <EyeOff size={24} /> : <Eye size={24} />}
            <span className="text-sm md:text-lg font-black uppercase tracking-widest">{focusMode ? 'Modo Calmo' : 'Modo Acción'}</span>
        </button>
    );
}
