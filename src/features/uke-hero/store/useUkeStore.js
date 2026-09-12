import { create } from 'zustand';

export const useUkeStore = create((set, get) => ({
    focusMode: false,
    setFocusMode: (val) => set({ focusMode: val }),

    isPlaying: false,
    setIsPlaying: (val) => set({ isPlaying: val }),

    tempoBpm: 60, // Slower default for kids
    setTempoBpm: (val) => set({ tempoBpm: val }),

    currentNarrative: 'Casa', // Casa (I), Tienda (IV), Escuela (V)
    setCurrentNarrative: (val) => set({ currentNarrative: val }),

    // Logic state
    score: 0,
    addScore: (pts) => set((s) => ({ score: s.score + pts })),

    errorCount: 0,
    addError: () => set((s) => ({ errorCount: s.errorCount + 1 })),
    resetErrors: () => set({ errorCount: 0 }),

    lastManualHit: null, // { note: 'A4', time: Date.now() }
    setLastManualHit: (note) => set({ lastManualHit: { note, time: Date.now() } }),
}));
