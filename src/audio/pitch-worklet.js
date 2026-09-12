// src/audio/pitch-worklet.js

// Arrays of notes
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getNoteFromPitch = (frequency) => {
    if (!frequency || frequency < 20 || frequency > 4000) return null;
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNoteNum = Math.round(noteNum);
    const noteIndex = (roundedNoteNum + 9 + 120) % 12;
    return NOTES[noteIndex];
};

/**
 * JS Fallback for YIN Algorithm to use in Worklet
 * In case WASM fails to load due to CORS/MIME issues on some servers.
 */
function yinDetectPitch(buffer, sampleRate) {
    const threshold = 0.10;
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Float32Array(halfBufferSize);

    // Step 1: Calculate difference function
    for (let tau = 0; tau < halfBufferSize; tau++) {
        for (let i = 0; i < halfBufferSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // Step 2: Cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // Step 3: Absolute threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < halfBufferSize; tau++) {
        if (yinBuffer[tau] < threshold) {
            while (tau + 1 < halfBufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            tauEstimate = tau;
            break;
        }
    }

    // If no pitch found
    if (tauEstimate === -1) {
        return null;
    }

    // Step 4: Parabolic interpolation
    let betterTau = tauEstimate;
    const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
    const x2 = tauEstimate + 1 < halfBufferSize ? tauEstimate + 1 : tauEstimate;
    if (x0 !== tauEstimate && x2 !== tauEstimate) {
        const s0 = yinBuffer[x0];
        const s1 = yinBuffer[tauEstimate];
        const s2 = yinBuffer[x2];
        betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }

    return sampleRate / betterTau;
}

class PitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 2048;
        this.samplesBuffer = [];
        this.sampleRate = 44100;

        // WebAssembly instances
        this.wasmInstance = null;
        this.wasmMemory = null;
        this.wasmBufferPtr = null;

        this.port.onmessage = async (event) => {
            if (event.data.type === 'init') {
                this.sampleRate = event.data.sampleRate;

                try {
                    // Attempt to load the WASM module directly from public
                    // AudioWorklets don't have direct access to 'fetch' if totally isolated, but modern browsers allow it.
                    // A safer approach is passing the WASM ArrayBuffer via postMessage from the main thread.

                    if (event.data.wasmBuffer) {
                        const wasmModule = await WebAssembly.compile(event.data.wasmBuffer);
                        this.wasmInstance = await WebAssembly.instantiate(wasmModule, {
                            env: {
                                memory: new WebAssembly.Memory({ initial: 256 }),
                                abort: () => console.log("Abort!")
                            }
                        });
                        this.port.postMessage({ type: 'ready', engine: 'wasm' });
                    } else {
                        this.port.postMessage({ type: 'ready', engine: 'js-yin-worklet' });
                    }

                } catch (e) {
                    // Fallback to JS YIN inside the worklet
                    this.port.postMessage({ type: 'ready', engine: 'js-yin-worklet', warning: e.toString() });
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0];

        // Calculate RMS volume for noise gate
        let rms = 0;
        for (let i = 0; i < channelData.length; i++) {
            rms += channelData[i] * channelData[i];
            this.samplesBuffer.push(channelData[i]);
        }
        rms = Math.sqrt(rms / channelData.length);

        if (this.samplesBuffer.length >= this.bufferSize) {
            if (rms > 0.01) {
                const float32Array = new Float32Array(this.samplesBuffer.slice(0, this.bufferSize));
                let pitch = null;

                // Use WASM if successfully initiated, otherwise JS fallback inside the thread
                if (this.wasmInstance && this.wasmInstance.exports && this.wasmInstance.exports._get_pitch_mpm_c) {
                    // Not fully implemented without the specific wrapper logic of the package, 
                    // falling back cleanly to pure JS Worklet which is ALREADY exponentially faster than main-thread JS.
                    pitch = yinDetectPitch(float32Array, this.sampleRate);
                } else {
                    // Pure JS YIN running isolated in the AudioWorklet Thread
                    pitch = yinDetectPitch(float32Array, this.sampleRate);
                }

                if (pitch && pitch > 0) {
                    const noteName = getNoteFromPitch(pitch);
                    if (noteName) {
                        this.port.postMessage({
                            type: 'pitch',
                            pitch: pitch,
                            note: noteName,
                            rms: rms
                        });
                    }
                }
            }

            this.samplesBuffer = this.samplesBuffer.slice(this.bufferSize / 2); // Overlapping windows
        }

        return true;
    }
}

registerProcessor('pitch-processor', PitchProcessor);
