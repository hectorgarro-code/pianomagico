import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldMusic, readMusicSettings, saveMusicSettings, MUSIC_SETTINGS_KEY } from './worldMusic.js';

function fixture(playOverride) {
  let time = 0;
  let nextId = 0;
  const tasks = new Map();
  const audio = {
    paused: true, volume: 1, currentTime: 42, plays: 0,
    play() { this.plays++; this.paused = false; return playOverride?.() ?? Promise.resolve(); },
    pause() { this.paused = true; },
  };
  const statuses = [];
  const music = createWorldMusic(audio, {
    now: () => time,
    schedule: callback => { tasks.set(++nextId, callback); return nextId; },
    cancel: id => tasks.delete(id), onStatus: status => statuses.push(status),
  });
  const advance = milliseconds => {
    time += milliseconds;
    const pending = [...tasks.values()]; tasks.clear(); pending.forEach(callback => callback());
  };
  return { audio, music, statuses, advance, tasks };
}
const settings = { volume: 0.2, muted: false };
const flush = () => Promise.resolve();

test('starts softly, loops and reaches the requested volume', async () => {
  const { audio, music, advance } = fixture();
  music.update(settings, true); await flush();
  assert.equal(audio.loop, true); assert.equal(audio.volume, 0);
  advance(325); assert.equal(audio.volume, 0.1);
  advance(325); assert.equal(audio.volume, 0.2);
  music.dispose();
});
test('transition fades out and return resumes without rewinding', async () => {
  const { audio, music, advance } = fixture();
  music.update(settings, true); await flush(); advance(650);
  music.update(settings, false); advance(200);
  assert.equal(audio.paused, true); assert.equal(audio.volume, 0);
  music.update(settings, true); await flush(); advance(650);
  assert.equal(audio.paused, false); assert.equal(audio.currentTime, 42);
  music.dispose();
});
test('piano and hidden tabs stop immediately and gestures cannot restart inactive music', async () => {
  const { audio, music, advance } = fixture();
  music.update(settings, true); await flush(); advance(650);
  music.update(settings, false, true); await music.resume();
  assert.equal(audio.paused, true); assert.equal(audio.volume, 0); assert.equal(audio.plays, 1);
  music.dispose();
});
test('mute and zero volume block playback; volume changes do not restart the track', async () => {
  const { audio, music, advance } = fixture();
  music.update({ ...settings, muted: true }, true); await music.resume();
  music.update({ ...settings, volume: 0 }, true); await music.resume();
  assert.equal(audio.plays, 0);
  music.update(settings, true); await flush(); advance(650);
  music.update({ ...settings, volume: 0.35 }, true); advance(200);
  await music.resume();
  assert.equal(audio.volume, 0.35); assert.equal(audio.plays, 1);
  music.dispose();
});
test('autoplay rejection is handled and the next gesture retries', async () => {
  let blocked = true;
  const { audio, music, statuses } = fixture(() => {
    if (blocked) { audio.paused = true; return Promise.reject({ name: 'NotAllowedError' }); }
    return Promise.resolve();
  });
  music.update(settings, true); await flush();
  assert.deepEqual(statuses, ['blocked']);
  blocked = false; await music.resume();
  assert.equal(audio.paused, false); assert.equal(statuses.at(-1), 'playing');
  music.dispose();
});
test('pending playback cannot restore music after entering piano', async () => {
  let resolve;
  const { audio, music, tasks } = fixture(() => new Promise(done => { resolve = done; }));
  music.update(settings, true);
  music.update(settings, false, true);
  resolve(); await flush();
  assert.equal(audio.paused, true); assert.equal(audio.volume, 0);
  music.dispose(); assert.equal(tasks.size, 0);
});
test('StrictMode cleanup does not pause a newer controller when an old promise resolves', async () => {
  const pending = [];
  const { audio, music } = fixture(() => new Promise(done => { pending.push(done); }));
  music.update(settings, true); music.dispose();
  const newer = createWorldMusic(audio);
  newer.update(settings, true);
  pending[0](); await flush();
  assert.equal(audio.paused, false);
  pending[1](); await flush();
  newer.dispose();
});
test('preferences tolerate invalid or unavailable storage and persist only music settings', () => {
  assert.deepEqual(readMusicSettings(null), settings);
  assert.deepEqual(readMusicSettings({ getItem: () => '{' }), settings);
  assert.deepEqual(readMusicSettings({ getItem: () => '{"volume":9,"muted":true}' }), { volume: 1, muted: true });
  assert.deepEqual(readMusicSettings({ getItem: () => '{"volume":"loud"}' }), settings);
  let saved;
  saveMusicSettings({ setItem: (key, value) => { saved = [key, JSON.parse(value)]; } }, settings);
  assert.deepEqual(saved, [MUSIC_SETTINGS_KEY, settings]);
  assert.doesNotThrow(() => saveMusicSettings(null, settings));
});
