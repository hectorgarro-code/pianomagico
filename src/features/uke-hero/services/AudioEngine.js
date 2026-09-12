// UkeHero AudioEngine using AudioWorklet and WebAssembly / YIN
// FRECUENCIAS OBJETIVO (Afinación Ukelele Standard - GCEA)
// Tolerancia indulgente para TDAH/Dispaxias: +/- 150 cents (1.5 semitonos)
const STRINGS_TARGETS = [
    { id: '1', name: 'A (La)', freq: 440.00 }, // A4
    { id: '2', name: 'E (Mi)', freq: 329.63 }, // E4
    { id: '3', name: 'C (Do)', freq: 261.63 }, // C4
    { id: '4', name: 'G (Sol)', freq: 392.00 } // G4
];

class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.analyzer = null;
        this.microphone = null;
        this.detectPitch = null;
        this.stream = null;
        this.interval = null;
        this.onPitchDetected = null;
    }

    async start() {
        if (this.audioCtx) return;

        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // Cargar el AudioWorklet
            await this.audioCtx.audioWorklet.addModule('/src/audio/pitch-worklet.js');

            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    autoGainControl: false,
                    noiseSuppression: false
                }
            });

            this.microphone = this.audioCtx.createMediaStreamSource(this.stream);

            // Instanciar el nodo del procesador
            const workletNode = new AudioWorkletNode(this.audioCtx, 'pitch-processor');

            workletNode.port.onmessage = (event) => {
                if (event.data.type === 'pitch') {
                    const rawPitch = event.data.pitch;

                    if (rawPitch && this.onPitchDetected) {
                        // Aplicar heurística indulgente
                        const matchedString = this.heuristicMatch(rawPitch);
                        if (matchedString) {
                            this.onPitchDetected(matchedString.id, rawPitch);
                        }
                    }
                } else if (event.data.type === 'ready') {
                    console.log('UkeHero Audio Engine Started:', event.data.engine);
                }
            };

            // Iniciar config en el Worklet
            workletNode.port.postMessage({
                type: 'init',
                sampleRate: this.audioCtx.sampleRate
            });

            this.microphone.connect(workletNode);
            // Guardar ref al nodo para limpieza
            this.detectPitchNode = workletNode;

        } catch (err) {
            console.error('Error accessing microphone or AudioWorklet for Uke Hero:', err);
        }
    }

    heuristicMatch(pitch) {
        // Tolerancia extremadamente holgada (~15% de desviación de frecuencia)
        // Permite ukeleles ligeramente desafinados o niños tarareando
        const TOLERANCE_RATIO = 0.15;

        for (const target of STRINGS_TARGETS) {
            const minFreq = target.freq * (1 - TOLERANCE_RATIO);
            const maxFreq = target.freq * (1 + TOLERANCE_RATIO);
            if (pitch >= minFreq && pitch <= maxFreq) {
                return target;
            }
        }
        return null;
    }

    stop() {
        if (this.detectPitchNode) {
            this.detectPitchNode.port.close();
            this.detectPitchNode.disconnect();
            this.detectPitchNode = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.audioCtx) {
            this.audioCtx.close().catch(console.error);
            this.audioCtx = null;
        }
        this.onPitchDetected = null;
    }
}

export const audioEngine = new AudioEngine();
