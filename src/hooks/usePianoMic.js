import { useEffect } from 'react';
import { usePianoMicStore } from './usePianoMicStore';

export const usePianoMic = (onNoteDetected) => {
    const isListening = usePianoMicStore((state) => state.isListening);
    const startMic = usePianoMicStore((state) => state.startMic);
    const stopMic = usePianoMicStore((state) => state.stopMic);
    const toggleMic = usePianoMicStore((state) => state.toggleMic);
    const addListener = usePianoMicStore((state) => state.addListener);

    useEffect(() => {
        if (onNoteDetected) {
            const remove = addListener(onNoteDetected);
            return () => remove();
        }
    }, [onNoteDetected, addListener]);

    return { isListening, toggleMic, startMic, stopMic };
};
