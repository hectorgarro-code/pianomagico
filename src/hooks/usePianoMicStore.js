import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Singleton Web Audio references
let globalAudioCtx = null;
let globalStream = null;
let globalWorkletNode = null;
let listeners = new Set();

// Acoustic note life-cycle state tracking
let activePitchClass = null;
let currentStrikeId = 0;
let strikeCounter = 0;
let peakRms = 0;
let minRmsSincePeak = 0;
let smoothedRms = 0;
let lastAttackTime = 0;
let consecutiveSilenceFrames = 0;

const getPitchClass = (str) => {
  if (!str) return '';
  const clean = String(str).split(':')[0].trim().toUpperCase();
  return clean.replace(/\d+/g, '');
};

function handleAcousticFrame(eventData, sensitivity, set) {
  const { type, note, rms } = eventData;
  const now = Date.now();
  const adjustedRms = (rms || 0) * sensitivity;

  set({ rmsVolume: adjustedRms });

  const noiseFloor = 0.010;

  if (type === 'silence' || !note || adjustedRms < noiseFloor) {
    consecutiveSilenceFrames++;
    // Notify listeners that sound has dropped below threshold (release / damper)
    listeners.forEach(cb => {
      try {
        cb(null, adjustedRms, 0);
      } catch (err) {}
    });

    // After ~230ms (10 frames) of sustained silence, reset active note
    if (consecutiveSilenceFrames >= 10) {
      activePitchClass = null;
      peakRms = 0;
      minRmsSincePeak = 0;
      smoothedRms = 0;
      set({ detectedNote: null });
    }
    return;
  }

  // Sound is present!
  consecutiveSilenceFrames = 0;
  set({ detectedNote: note });

  const pitchClass = getPitchClass(note);

  // Update envelope tracking (exponential moving average)
  if (smoothedRms === 0) {
    smoothedRms = adjustedRms;
  } else {
    smoothedRms = smoothedRms * 0.75 + adjustedRms * 0.25;
  }

  let isNewAttack = false;

  if (activePitchClass === null) {
    // Initial attack from silence
    isNewAttack = true;
  } else if (pitchClass !== activePitchClass) {
    // Pitch class actually changed (e.g. C -> D)
    isNewAttack = true;
  } else {
    // SAME pitch class (e.g. C4 continues, or C4 struck again):
    if (adjustedRms < minRmsSincePeak) {
      minRmsSincePeak = adjustedRms;
    }
    if (adjustedRms > peakRms) {
      peakRms = adjustedRms;
    }

    const timeSinceLastAttack = now - lastAttackTime;

    // Condition 1: Release & Retrigger (Dip and Rise)
    // Key released / damper dropped, sound dropped below 40% of peak, then rebounded with a fresh strike!
    const hadSignificantDip = minRmsSincePeak < peakRms * 0.40 || minRmsSincePeak < noiseFloor * 1.5;
    const isRebounding = adjustedRms > minRmsSincePeak * 1.40 && (adjustedRms - minRmsSincePeak) >= 0.012;

    // Condition 2: Legato / Re-attack (Hammer strike while string is vibrating)
    // Sharp energy spike over the decaying envelope
    const isEnergySpike = adjustedRms > smoothedRms * 1.50 && (adjustedRms - smoothedRms) >= 0.020;

    if (timeSinceLastAttack >= 120 && ((hadSignificantDip && isRebounding) || isEnergySpike)) {
      isNewAttack = true;
    }
  }

  if (isNewAttack) {
    activePitchClass = pitchClass;
    currentStrikeId = ++strikeCounter;
    peakRms = adjustedRms;
    minRmsSincePeak = adjustedRms;
    lastAttackTime = now;

    // Notify listeners with discrete note strike event and UNIQUE strikeId
    listeners.forEach(cb => {
      try {
        cb(note, adjustedRms, currentStrikeId);
      } catch (err) {
        console.error('Error in mic listener:', err);
      }
    });
  }
}

export const usePianoMicStore = create(
  persist(
    (set, get) => ({
      isListening: false,
      isAutoEnabled: true,
      sensitivity: 1.0,
      detectedNote: null,
      rmsVolume: 0,
      error: null,

      setSensitivity: (val) => set({ sensitivity: val }),
      setAutoEnabled: (enabled) => set({ isAutoEnabled: enabled }),

      addListener: (cb) => {
        listeners.add(cb);
        return () => {
          listeners.delete(cb);
        };
      },

      startMic: async () => {
        const state = get();
        if (state.isListening && globalAudioCtx && globalAudioCtx.state === 'running' && globalStream) {
          return;
        }

        if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
          try {
            await globalAudioCtx.resume();
            set({ isListening: true, error: null });
            return;
          } catch (e) {
            console.warn('Failed resuming global AudioContext:', e);
          }
        }

        try {
          if (!globalAudioCtx || globalAudioCtx.state === 'closed') {
            globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }

          if (globalAudioCtx.state === 'suspended') {
            await globalAudioCtx.resume();
          }

          if (!globalWorkletNode) {
            const cacheBuster = '3.1';
            try {
              await globalAudioCtx.audioWorklet.addModule(`/audio/pitch-worklet.js?v=${cacheBuster}`);
            } catch (workletErr) {
              console.warn('Failed loading /audio/pitch-worklet.js, trying fallback:', workletErr);
              await globalAudioCtx.audioWorklet.addModule(`/src/audio/pitch-worklet.js?v=${cacheBuster}`);
            }

            globalWorkletNode = new AudioWorkletNode(globalAudioCtx, 'pitch-processor');

            globalWorkletNode.port.onmessage = (event) => {
              if (event.data.type === 'pitch' || event.data.type === 'silence') {
                handleAcousticFrame(event.data, get().sensitivity, set);
              }
            };

            globalWorkletNode.port.postMessage({
              type: 'init',
              sampleRate: globalAudioCtx.sampleRate
            });
          }

          if (!globalStream || !globalStream.active) {
            globalStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false
              }
            });
            const microphone = globalAudioCtx.createMediaStreamSource(globalStream);
            microphone.connect(globalWorkletNode);
          }

          set({ isListening: true, isAutoEnabled: true, error: null });
        } catch (err) {
          console.error('Error starting microphone in PianoMicStore:', err);
          set({ isListening: false, error: err.message });
        }
      },

      stopMic: () => {
        if (globalStream) {
          globalStream.getTracks().forEach(t => t.stop());
          globalStream = null;
        }
        if (globalWorkletNode) {
          globalWorkletNode.port.close();
          globalWorkletNode.disconnect();
          globalWorkletNode = null;
        }
        if (globalAudioCtx) {
          globalAudioCtx.close().catch(console.error);
          globalAudioCtx = null;
        }
        activeNote = null;
        peakRms = 0;
        minRmsSincePeak = 0;
        smoothedRms = 0;
        lastAttackTime = 0;
        consecutiveSilenceFrames = 0;
        set({ isListening: false, isAutoEnabled: false, detectedNote: null, rmsVolume: 0 });
      },

      toggleMic: () => {
        const { isListening, startMic, stopMic } = get();
        if (isListening) stopMic();
        else startMic();
      }
    }),
    {
      name: 'piano_mic_persistent_v1',
      partialize: (state) => ({
        isAutoEnabled: state.isAutoEnabled,
        sensitivity: state.sensitivity
      })
    }
  )
);
