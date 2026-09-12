import { useUkeStore } from '../store/useUkeStore';

export const evaluatePerformance = () => {
    const store = useUkeStore.getState();

    // Si hay 3 o más fallos acumulados en corto tiempo
    if (store.errorCount >= 3) {
        // Reducir tempo un 20%
        const newTempo = Math.max(40, Math.floor(store.tempoBpm * 0.8));

        setTimeout(() => {
            useUkeStore.getState().setTempoBpm(newTempo);
            useUkeStore.getState().resetErrors();
        }, 0);

        // Activar retroalimentación háptica nativa si está disponible (Metrónomo háptico)
        if (navigator.vibrate) {
            try {
                navigator.vibrate([200, 100, 200]);
            } catch (e) {
                console.log("Haptics not supported on this device.");
            }
        }

        return {
            action: 'loop_and_slow',
            message: '¡Atención, te perdiste algunas notas! Vamos un poco más lento.',
            newTempo
        };
    }
    return { action: 'continue' };
};
