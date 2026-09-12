import { create } from 'zustand';

export const useStudioStore = create((set, get) => ({
    projectId: `proj_${Date.now()}`,
    projectName: `Proyecto Mágico ${Math.floor(Math.random() * 1000)}`,
    tracks: [],
    isPlaying: false,
    isRecording: false,
    playheadPosition: 0, // En píxeles o porcentaje
    tempo: 120, // BPM por defecto
    duration: 30000, // 30 segundos de duración máxima inicial para el timeline
    zoomLevel: 1, // Nivel de zoom horizontal (1 = normal, 2 = el doble de ancho, etc.)
    isCountingIn: false,
    countInBeat: 0,

    // Caja de Ritmos Abierta (Panel Inferior)
    activeDrumMachine: null, // { trackId: '...', patternId: 'A' }

    // Panel de Efectos Abierto (Cajón Inferior)
    activeEffectsTrackId: null,

    // Acciones de Transporte
    setZoomLevel: (z) => set({ zoomLevel: Math.max(0.5, Math.min(z, 5)) }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    stop: () => set((state) => ({
        isPlaying: false,
        isRecording: false,
        isCountingIn: false,
        countInBeat: 0,
        playheadPosition: 0,
        tracks: state.tracks.map(t => ({ ...t, isArmed: false }))
    })),
    toggleRecord: (trackId) => set((state) => {
        if (state.isRecording || state.isCountingIn) {
            // Detener si ya está grabando o contando
            return {
                isRecording: false,
                isCountingIn: false,
                countInBeat: 0,
                isPlaying: false,
                playheadPosition: 0,
                tracks: state.tracks.map(t => ({ ...t, isArmed: false }))
            };
        } else {
            // Empezar cuenta regresiva
            return {
                isCountingIn: true,
                countInBeat: 4,
                isPlaying: false, // El playhead no se mueve durante el conteo
                isRecording: false, // Aún no graba
                tracks: state.tracks.map(t => ({ ...t, isArmed: t.id === trackId }))
            };
        }
    }),
    startRecordingActual: () => set({
        isCountingIn: false,
        isRecording: true,
        isPlaying: true
    }),
    setCountInBeat: (beat) => set({ countInBeat: beat }),
    setPlayhead: (pos) => set({ playheadPosition: pos }),
    setTempo: (newTempo) => set({ tempo: newTempo }),
    setProjectName: (name) => set({ projectName: name }),
    toggleMicSettings: () => set((state) => ({ isMicSettingsOpen: !state.isMicSettingsOpen })),

    // Gestión de Pistas
    addTrack: (trackType) => set((state) => {
        const newTrack = {
            id: `track-${Date.now()}`,
            type: trackType, // 'drum', 'piano', 'uke', 'mic'
            name: `Pista ${state.tracks.length + 1}`,
            isMuted: false,
            isSolo: false,
            isArmed: false,
            speed: 1, // Velocidad base (0.5 a 2.0)
            pitch: 0, // Tono en semitonos (-12 a 12)
            volume: 80,
            effects: [], // Cadena de efectos
            blocks: [], // Bloques grabados en la línea de tiempo
        };

        // Estructura especial solo para cajas de ritmos
        if (trackType === 'drum') {
            newTrack.patterns = {
                'A': { kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false) },
                'B': { kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false) },
                'C': { kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false) },
                'D': { kick: Array(16).fill(false), snare: Array(16).fill(false), hihat: Array(16).fill(false) },
            };
        }

        return { tracks: [...state.tracks, newTrack] };
    }),

    removeTrack: (trackId) => set((state) => ({
        tracks: state.tracks.filter(t => t.id !== trackId)
    })),

    updateTrack: (trackId, updates) => set((state) => ({
        tracks: state.tracks.map(t => t.id === trackId ? { ...t, ...updates } : t)
    })),

    // Alternar qué pista está "armada" para grabar
    armTrack: (trackId) => set((state) => ({
        tracks: state.tracks.map(t => ({
            ...t,
            isArmed: t.id === trackId ? !t.isArmed : false // Solo una armada a la vez por simplicidad inicial
        }))
    })),

    // Agregar nota grabada al timeline de la pista (Piano, Uke)
    // Agregar un bloque al timeline de la pista (Piano, Mic, Drums)
    // Agregar bloque al timeline
    addNoteToTrack: (trackId, blockData) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    blocks: [...t.blocks, blockData]
                };
            }
            return t;
        })
    })),

    // Eliminar un bloque específico de una pista
    removeBlockFromTrack: (trackId, blockId) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    blocks: t.blocks.filter(b => b.id !== blockId)
                };
            }
            return t;
        })
    })),

    // Actualizar propiedades de un bloque (para Drag & Trim)
    updateBlock: (trackId, blockId, updates) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    blocks: t.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
                };
            }
            return t;
        })
    })),

    // --- ACCIONES DE CAJA DE RITMOS --- //

    // Abre o Cierra el panel inferior de la caja de ritmos
    setActiveDrumMachine: (trackId, patternId = 'A') => set({
        activeDrumMachine: trackId ? { trackId, patternId } : null
    }),

    // Actualiza la matriz (Kick/Snare/Hat) de un patrón dentro de un track
    updateDrumPattern: (trackId, patternId, inst, index, value) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId && t.type === 'drum') {
                const newPattern = { ...t.patterns[patternId] };
                newPattern[inst] = [...newPattern[inst]];
                newPattern[inst][index] = value;
                return {
                    ...t,
                    patterns: {
                        ...t.patterns,
                        [patternId]: newPattern
                    }
                };
            }
            return t;
        })
    })),

    // --- ACCIONES DE EFECTOS (FX) --- //

    setActiveEffectsTrack: (trackId) => set({ activeEffectsTrackId: trackId }),

    addEffectToTrack: (trackId, effectType, defaultParams = {}) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    effects: [...(t.effects || []), {
                        id: `fx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        type: effectType,
                        params: defaultParams
                    }]
                };
            }
            return t;
        })
    })),

    removeEffectFromTrack: (trackId, effectId) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    effects: t.effects.filter(fx => fx.id !== effectId)
                };
            }
            return t;
        })
    })),

    updateEffectParam: (trackId, effectId, paramName, paramValue) => set((state) => ({
        tracks: state.tracks.map(t => {
            if (t.id === trackId) {
                return {
                    ...t,
                    effects: t.effects.map(fx => {
                        if (fx.id === effectId) {
                            return { ...fx, params: { ...fx.params, [paramName]: paramValue } };
                        }
                        return fx;
                    })
                };
            }
            return t;
        })
    }))
}));
