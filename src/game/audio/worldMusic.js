export const MUSIC_SETTINGS_KEY = 'valle.worldMusic.v1';
export const DEFAULT_MUSIC_SETTINGS = { volume: 0.2, muted: false };

export function readMusicSettings(storage) {
  try {
    const value = JSON.parse(storage.getItem(MUSIC_SETTINGS_KEY));
    return {
      volume: typeof value?.volume === 'number' && Number.isFinite(value.volume)
        ? Math.max(0, Math.min(1, value.volume)) : DEFAULT_MUSIC_SETTINGS.volume,
      muted: value?.muted === true,
    };
  } catch { return { ...DEFAULT_MUSIC_SETTINGS }; }
}

export function saveMusicSettings(storage, settings) {
  try { storage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Playback works without storage. */ }
}

// Owns only the exploration track, never the piano's AudioContext or microphone.
export function createWorldMusic(audio, {
  schedule = setTimeout, cancel = clearTimeout, now = () => performance.now(),
  onStatus = () => {},
} = {}) {
  let settings = DEFAULT_MUSIC_SETTINGS;
  let active = false;
  let disposed = false;
  let timer;
  let generation = 0;
  audio.loop = true;
  audio.volume = 0;

  function fade(target, duration, finish = () => {}) {
    cancel(timer);
    const start = audio.volume;
    const started = now();
    function step() {
      if (disposed) return;
      const fraction = Math.min(1, (now() - started) / duration);
      audio.volume = start + (target - start) * fraction;
      if (fraction < 1) timer = schedule(step, 25);
      else finish();
    }
    step();
  }

  async function resume() {
    if (disposed || !active || settings.muted || settings.volume === 0) return;
    if (!audio.paused) return;
    const request = ++generation;
    try {
      await audio.play();
      if (disposed) return;
      if (!active || settings.muted || settings.volume === 0) {
        audio.pause();
        return;
      }
      if (request !== generation) return;
      onStatus('playing');
      fade(settings.volume, 650);
    } catch (error) {
      if (!disposed && request === generation) onStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error');
    }
  }

  return {
    resume,
    update(next, enabled, immediate = false) {
      settings = next;
      active = enabled;
      ++generation;
      cancel(timer);
      if (!active || settings.muted || settings.volume === 0) {
        if (immediate) { audio.volume = 0; audio.pause(); }
        else fade(0, 200, () => audio.pause());
      } else if (!audio.paused) fade(settings.volume, 200);
      else void resume();
    },
    dispose() {
      disposed = true;
      ++generation;
      cancel(timer);
      audio.pause();
      audio.volume = 0;
    },
  };
}
