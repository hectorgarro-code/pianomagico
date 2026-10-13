import { createAdventureState } from '../adventure/adventureState.js';

export function createAdventurePersistence(getStorage = () => globalThis.localStorage) {
  const key = userId => `valle-adventure-v1-user-${userId}`;
  return {
    load(userId) {
      if (!userId) return createAdventureState();
      try { return createAdventureState(JSON.parse(getStorage()?.getItem(key(userId)) || 'null')); }
      catch { return createAdventureState(); }
    },
    save(userId, state) {
      if (!userId) return false;
      try {
        const storage = getStorage();
        if (!storage) return false;
        storage.setItem(key(userId), JSON.stringify({ schemaVersion: state.schemaVersion, entries: state.entries, journey: state.journey, valley: state.valley, toy:state.toy }));
        return true;
      } catch { return false; }
    }
  };
}

export const adventurePersistence = createAdventurePersistence();
