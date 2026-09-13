import { useEffect, useRef } from 'react';
import { usePianoMicStore } from './usePianoMicStore';

export const usePianoMic = (onNoteDetected) => {
    const isListening = usePianoMicStore((state) => state.isListening);
    const startMic = usePianoMicStore((state) => state.startMic);
    const stopMic = usePianoMicStore((state) => state.stopMic);
    const toggleMic = usePianoMicStore((state) => state.toggleMic);
    const addListener = usePianoMicStore((state) => state.addListener);

    const cbRef = useRef(onNoteDetected);
    cbRef.current = onNoteDetected;

    useEffect(() => {
        const handler = (note, rms, strikeId) => {
            if (cbRef.current) {
                cbRef.current(note, rms, strikeId);
            }
        };
        const remove = addListener(handler);
        return () => remove();
    }, [addListener]);

    return { isListening, toggleMic, startMic, stopMic };
};
