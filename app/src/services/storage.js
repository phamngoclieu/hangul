const fallbackStores = {
  local: new Map(),
  session: new Map()
};

const writeListeners = new Set();

function notifyWrite(scope, key, value) {
  for (const listener of writeListeners) {
    try {
      listener({ scope, key, value, writtenAt: new Date().toISOString() });
    } catch (error) {
      console.warn("Storage listener failed:", error);
    }
  }
}

function createAdapter(scope, webStorage) {
  const fallback = fallbackStores[scope];

  return {
    getItem(key) {
      try {
        return webStorage?.getItem(key) ?? fallback.get(key) ?? null;
      } catch {
        return fallback.get(key) ?? null;
      }
    },

    setItem(key, value) {
      const normalized = String(value);
      fallback.set(key, normalized);
      try {
        webStorage?.setItem(key, normalized);
      } catch (error) {
        console.warn(`Unable to persist ${scope} storage:`, error);
      }
      notifyWrite(scope, key, normalized);
    },

    removeItem(key) {
      fallback.delete(key);
      try {
        webStorage?.removeItem(key);
      } catch (error) {
        console.warn(`Unable to remove ${scope} storage:`, error);
      }
      notifyWrite(scope, key, null);
    }
  };
}

export const storage = {
  local: createAdapter("local", globalThis.localStorage),
  session: createAdapter("session", globalThis.sessionStorage),

  onWrite(listener) {
    writeListeners.add(listener);
    return () => writeListeners.delete(listener);
  }
};
