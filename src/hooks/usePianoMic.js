import { useState, useEffect, useRef } from 'react';

export const usePianoMic = (onNoteDetected) => {
    const [isListening, setIsListening] = useState(false);

    // References for Audio API components
    const audioCtxRef = useRef(null);
    const streamRef = useRef(null);
    const workletNodeRef = useRef(null);

    // References for debouncing and game mechanics
    const lastNoteRef = useRef(null);
    const lastNoteTimeRef = useRef(0);
    const DEMOUNT_TIME = 200;

    // Used to keep the callback reference fresh inside the worklet listener
    const onNoteDetectedRef = useRef(onNoteDetected);
    useEffect(() => {
        onNoteDetectedRef.current = onNoteDetected;
    }, [onNoteDetected]);

    const startMic = async () => {
        if (isListening || audioCtxRef.current) return;

        try {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

            // Load the worklet from public/audio/ (production) with fallback to /src/audio/
            try {
                await audioCtxRef.current.audioWorklet.addModule('/audio/pitch-worklet.js');
            } catch (workletErr) {
                console.warn('Failed loading /audio/pitch-worklet.js, trying fallback:', workletErr);
                await audioCtxRef.current.audioWorklet.addModule('/src/audio/pitch-worklet.js');
            }

            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            // Create media stream source
            const microphone = audioCtxRef.current.createMediaStreamSource(streamRef.current);

            // Create the AudioWorklet node
            workletNodeRef.current = new AudioWorkletNode(audioCtxRef.current, 'pitch-processor');

            // Handle messages originating from the Worklet thread
            workletNodeRef.current.port.onmessage = (event) => {
                if (event.data.type === 'pitch') {
                    const { note, rms } = event.data;

                    // Only process natural notes (no sharps/flats as per handleAction)
                    if (note && !note.includes('#')) {
                        const now = Date.now();

                        // Hardware debounce
                        if (note !== lastNoteRef.current || (now - lastNoteTimeRef.current) > DEMOUNT_TIME) {
                            lastNoteRef.current = note;
                            lastNoteTimeRef.current = now;

                            if (onNoteDetectedRef.current) {
                                onNoteDetectedRef.current(note);
                            }
                        }
                    }
                } else if (event.data.type === 'ready') {
                    console.log('Worklet Engine:', event.data.engine);
                }
            };

            // Initialize the worklet by passing down config
            workletNodeRef.current.port.postMessage({
                type: 'init',
                sampleRate: audioCtxRef.current.sampleRate
                // Note: To pass wasmBuffer here, you would fetch it in JS first.
                // Currently falling back to isolated pure-JS YIN in worklet.
            });

            // Connect Microphone -> Worklet Processor
            microphone.connect(workletNodeRef.current);
            // Optionally connect Worklet -> Destination if audio passthrough is wanted.
            // workletNodeRef.current.connect(audioCtxRef.current.destination);

            setIsListening(true);

        } catch (err) {
            console.error('Error starting AudioWorklet or Mic:', err);
            setIsListening(false);

            // Cleanup on failure
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(console.error);
                audioCtxRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }

            alert("No se pudo acceder al micrófono o falló la carga del motor de audio (AudioWorklet). Asegúrate de correrlo bajo HTTPS / Localhost.");
        }
    };

    const stopMic = () => {
        if (workletNodeRef.current) {
            workletNodeRef.current.port.close();
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(console.error);
            audioCtxRef.current = null;
        }

        setIsListening(false);
        lastNoteRef.current = null;
    };

    const toggleMic = () => {
        if (isListening) {
            stopMic();
        } else {
            startMic();
        }
    };

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopMic();
        };
    }, []);

    return { isListening, toggleMic, startMic, stopMic };
};
