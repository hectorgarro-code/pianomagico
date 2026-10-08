import React, { useEffect, useState } from 'react';
import { Sparkles, Music } from 'lucide-react';

/**
 * GameTransitionManager.jsx
 * Controla las transiciones cinematográficas y mágicas entre:
 * WORLD -> PIANO
 * PIANO -> WORLD
 */
export default function GameTransitionManager({
  transitionState, // 'IDLE', 'TRANSITION_TO_PIANO', 'TRANSITION_TO_WORLD'
  onTransitionComplete,
  children
}) {
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    if (transitionState === 'TRANSITION_TO_PIANO') {
      setAnimProgress(1);
      const timer = setTimeout(() => {
        if (onTransitionComplete) onTransitionComplete('PIANO');
      }, 700);
      return () => clearTimeout(timer);
    } else if (transitionState === 'TRANSITION_TO_WORLD') {
      setAnimProgress(1);
      const timer = setTimeout(() => {
        setAnimProgress(0);
        if (onTransitionComplete) onTransitionComplete('WORLD');
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setAnimProgress(0);
    }
  }, [transitionState, onTransitionComplete]);

  const isTransitioning = transitionState !== 'IDLE';

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Contenido principal de la escena */}
      {children}

      {/* Cortina Mágica de Transición */}
      {isTransitioning && (
        <div
          className={`absolute inset-0 z-[150] pointer-events-auto flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
            animProgress === 1 ? 'opacity-100 backdrop-blur-md bg-slate-950/80 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="relative flex flex-col items-center animate-bounce">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.8)] border-2 border-white/50">
              <Music size={36} className="text-white" />
            </div>
            <Sparkles size={28} className="absolute -top-2 -right-2 text-yellow-300 animate-spin-slow" />
          </div>
          <span className="mt-4 text-xs font-black uppercase tracking-widest text-sky-200">
            {transitionState === 'TRANSITION_TO_PIANO' ? '¡Entrando a la Lección Musical!' : 'Regresando al Valle...'}
          </span>
        </div>
      )}
    </div>
  );
}
