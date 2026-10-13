import { VALLEY_REGIONS } from '../adventure/valleyBlueprint.js';
import { getValleyProgress, requirementMet } from '../adventure/valleyProgression.js';

const palettes = {
  PLAZA_DE_LAS_NOTAS: { cutoff: 700, root: 261.63, interval: 8 },
  BOSQUE_DE_LAS_NOTAS: { cutoff: 950, root: 329.63, interval: 9 },
  RIO_DEL_RITMO: { cutoff: 1600, root: 261.63, interval: 4 },
  MONTANA_DE_LAS_MELODIAS: { cutoff: 450, root: 392, interval: 7 },
  GRUTA_DEL_ECO: { cutoff: 260, root: 196, interval: 10 },
  RUINAS_DEL_GRAN_PENTAGRAMA: { cutoff: 550, root: 220, interval: 8 },
  OBSERVATORIO_MUSICAL: { cutoff: 1100, root: 523.25, interval: 6 },
};

export function regionalAudioState(adventure) {
  if (!adventure) return { region: 'PLAZA_DE_LAS_NOTAS', stage: 0 };
  const progress = getValleyProgress(adventure);
  const region = VALLEY_REGIONS.find(r => r.id === progress.currentRegion);
  const completed = new Set(progress.completedRegions);
  const count = region.regionCompletionRequirements.filter(r => requirementMet(r, adventure, completed)).length;
  return { region: region.id, stage: completed.has(region.id) ? 3 : Math.min(2, count) };
}

// Independent, gesture-unlocked world bus. Never receives a piano/microphone context.
export function createValleySoundscape({ createContext = () => new (window.AudioContext || window.webkitAudioContext)(), schedule = setTimeout, cancel = clearTimeout } = {}) {
  let context, master, filter, noise, timer, disposed = false, unlocked = false;
  let state = { region: 'PLAZA_DE_LAS_NOTAS', stage: 0 }, settings = { volume: 0, muted: true }, active = false;
  const voices = new Set();
  const allowed = () => !disposed && active && !settings.muted && settings.volume > 0;
  function stopVoices() {
    for (const voice of voices) { try { voice.osc.stop(); } catch {} voice.osc.disconnect(); voice.gain.disconnect(); }
    voices.clear();
  }
  function tone(frequency, level) {
    if (!allowed() || context?.state !== 'running' || voices.size >= 4) return;
    const osc = context.createOscillator(), gain = context.createGain(), at = context.currentTime;
    osc.type = 'sine'; osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(level, at + .04);
    gain.gain.exponentialRampToValueAtTime(.00001, at + .8);
    osc.connect(gain); gain.connect(master);
    const voice = { osc, gain }; voices.add(voice);
    osc.onended = () => { voices.delete(voice); osc.disconnect(); gain.disconnect(); };
    osc.start(); osc.stop(at + .85);
  }
  function tick() {
    timer = null;
    if (!allowed() || !context) return;
    const palette = palettes[state.region] || palettes.PLAZA_DE_LAS_NOTAS;
    if (state.stage >= 1) tone(palette.root / 2, .007);
    if (state.stage >= 2) tone(palette.root, .005);
    if (state.stage >= 3) tone(palette.root * 1.5, .003);
    timer = schedule(tick, palette.interval * 1000);
  }
  function sync(hard = false) {
    cancel(timer); timer = null;
    if (!context) return;
    const at = context.currentTime;
    master.gain.cancelScheduledValues(at);
    master.gain.setValueAtTime(master.gain.value, at);
    if (!allowed()) {
      stopVoices();
      if (hard) { master.gain.setValueAtTime(0, at); void context.suspend().catch(() => {}); }
      else master.gain.linearRampToValueAtTime(0, at + .2);
      return;
    }
    void context.resume().catch(() => {});
    filter.frequency.setTargetAtTime((palettes[state.region] || palettes.PLAZA_DE_LAS_NOTAS).cutoff, at, .8);
    master.gain.linearRampToValueAtTime(settings.volume, at + .65);
    timer = schedule(tick, 1800);
  }
  return {
    unlock() {
      if (!allowed()) return;
      if (unlocked) { void context.resume().catch(() => {}); return; }
      try {
        context = createContext(); master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
        filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.connect(master);
        const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate), data = buffer.getChannelData(0);
        let seed = 17, smooth = 0;
        for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; smooth = .97 * smooth + .03 * (seed / 2147483647 * 2 - 1); data[i] = smooth * .012; }
        noise = context.createBufferSource(); noise.buffer = buffer; noise.loop = true; noise.connect(filter); noise.start();
        unlocked = true; sync();
      } catch { void context?.close()?.catch(() => {}); context = null; }
    },
    update(next, preferences, enabled, hard = false) { state = next; settings = preferences; active = enabled; sync(hard); },
    get stats() { return { ...state, active: allowed(), unlocked }; },
    dispose() { disposed = true; cancel(timer); stopVoices(); try { noise?.stop(); } catch {} noise?.disconnect(); filter?.disconnect(); master?.disconnect(); void context?.close()?.catch(() => {}); },
  };
}
