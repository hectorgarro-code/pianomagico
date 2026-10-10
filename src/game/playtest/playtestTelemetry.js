import { getValleyProgress } from '../adventure/valleyProgression.js';
import { REGION_IDS } from '../adventure/valleyBlueprint.js';

export function createPlaytestRecorder(storage, key, now = Date.now) {
  let session = null, previous = null, activeSince = null;
  try { session = JSON.parse(storage?.getItem(key) || 'null'); } catch { /* Storage is optional. */ }
  if (session?.schemaVersion !== 1 || !Array.isArray(session.events) || session.events.length > 5000
    || !session.events.every(event => typeof event?.type === 'string')
    || !Number.isFinite(session.totalMs) || session.totalMs < 0
    || !session.regionMs || Array.isArray(session.regionMs) || typeof session.regionMs !== 'object'
    || !Object.values(session.regionMs).every(ms => Number.isFinite(ms) && ms >= 0)) session = null;
  let storageAvailable = Boolean(storage);
  const save = () => {
    try { storage?.setItem(key, JSON.stringify(session)); }
    catch { storageAvailable = false; }
  };
  const touch = () => {
    if (!session || activeSince === null) return;
    const time = now(), delta = Math.max(0, time - activeSince);
    session.totalMs += delta;
    if (session.currentRegion) session.regionMs[session.currentRegion] = (session.regionMs[session.currentRegion] || 0) + delta;
    activeSince = time;
  };
  const record = (type, data = {}) => {
    if (!session || activeSince === null) return;
    touch();
    if (session.events.length < 5000) session.events.push({ type, timestamp: new Date(now()).toISOString(), elapsedMs: session.totalMs, ...data });
    else session.truncated = true;
    if (type === 'REGION_ENTERED') session.currentRegion = data.regionId;
    save();
  };
  return {
    begin(continued = false) {
      if (continued && session?.finishedAt) { activeSince = null; previous = null; return; }
      if (!continued || !session) session = { schemaVersion: 1, startedAt: new Date(now()).toISOString(), continued, totalMs: 0, regionMs: {}, events: [] };
      activeSince = now(); previous = null;
      record(continued ? 'SESSION_RESUMED' : 'ADVENTURE_STARTED');
    },
    record,
    observe(flow) {
      if (!session || activeSince === null) return;
      const adventure = flow.game.adventure, progress = getValleyProgress(adventure);
      if (!previous || previous.region !== progress.currentRegion) record('REGION_ENTERED', { regionId: progress.currentRegion });
      if (previous) {
        for (const regionId of progress.completedRegions) if (!previous.completed.includes(regionId)) record('REGION_COMPLETED', { regionId });
        if (!previous.discovered.includes(REGION_IDS.GROTTO) && progress.discoveredRegions.includes(REGION_IDS.GROTTO)) record('SECRET_DISCOVERED', { regionId: REGION_IDS.GROTTO });
      }
      if (flow.discovery && flow.discovery.objectId !== previous?.discovery) record('CHEST_DISCOVERED', { objectId: flow.discovery.objectId });
      if (flow.mode === 'PIANO' && previous?.mode !== 'PIANO') record('ACTIVITY_STARTED', { objectId: flow.context?.stationId, activityId: flow.context?.activityId });
      if (flow.lastResult && flow.lastResult !== previous?.result) {
        const result = flow.lastResult;
        record(result.completed ? 'ACTIVITY_COMPLETED' : result.cancelled ? 'ACTIVITY_CANCELLED' : 'ACTIVITY_FAILED', { objectId: result.stationId, activityId: result.activityId });
      }
      if (previous && !previous.final && progress.valleyCompleted) {
        record('FINAL_REACHED'); session.finishedAt = new Date(now()).toISOString(); activeSince = null; save();
      }
      previous = { region: progress.currentRegion, completed: progress.completedRegions, discovered: progress.discoveredRegions,
        final: progress.valleyCompleted, discovery: flow.discovery?.objectId, mode: flow.mode, result: flow.lastResult };
    },
    pause() { record('SESSION_PAUSED'); activeSince = null; save(); },
    export() {
      touch(); save();
      if (!session) return { schemaVersion: 1, events: [], summary: null, storageAvailable };
      const count = type => session.events.filter(event => event.type === type).length;
      const routeOrder = [...new Set(session.events.filter(event => event.type === 'REGION_ENTERED' && [REGION_IDS.RIVER, REGION_IDS.MOUNTAIN].includes(event.regionId)).map(event => event.regionId))];
      return structuredClone({ ...session, storageAvailable, summary: { totalSeconds: Math.round(session.totalMs / 1000),
        secondsByRegion: Object.fromEntries(Object.entries(session.regionMs).map(([region, ms]) => [region, Math.round(ms / 1000)])),
        mapOpens: count('MAP_OPENED'), cancelledActivities: count('ACTIVITY_CANCELLED'), routeOrder } });
    }
  };
}

const recorders = new Map();
export function getDevPlaytest(userId) {
  if (!import.meta.env?.DEV) return null;
  if (!recorders.has(userId)) {
    let storage;
    try { storage = globalThis.localStorage; } catch { /* Keep an in-memory log. */ }
    recorders.set(userId, createPlaytestRecorder(storage, `valle-playtest-1:${userId}`));
  }
  return recorders.get(userId);
}

