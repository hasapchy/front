import debounce from "lodash.debounce";
import UsersController from "@/api/UsersController";
import { eventBus } from "@/eventBus";
import { STORE_CONFIG } from "@/store/config";
import {
  UI_PREFERENCES_META_KEY,
  UI_PREFERENCES_FLUSH_DEBOUNCE_MS,
  UI_PREFERENCES_LS_BATCH_SIZE,
  UI_PREFERENCES_HYDRATE_CHUNK_SIZE,
  UI_PREFERENCES_VUEX_MUTATIONS,
  isUiPreferencesLsKey,
  pickUiPreferencesVuexFromUserSettings,
} from "@/constants/uiPreferencesConfig";

const MAX_FLUSH_RETRIES = 3;

let storeRef = null;
let originalSetItem = null;
let originalRemoveItem = null;
let isHydrating = false;
let flushInFlight = false;
let flushQueued = false;
let vuexDirty = false;
let flushRetryAttempt = 0;
const dirtyLsKeys = new Set();
const deletedLsKeys = new Set();
let memoryUpdatedAt = null;
let flushRevisionAtSchedule = null;

const runIdle =
  typeof requestIdleCallback === "function"
    ? (cb) => requestIdleCallback(cb, { timeout: 2000 })
    : (cb) => setTimeout(cb, 0);

function readMeta() {
  try {
    const raw = localStorage.getItem(UI_PREFERENCES_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeMeta(patch) {
  const prev = readMeta() || {};
  originalSetItem?.call(
    localStorage,
    UI_PREFERENCES_META_KEY,
    JSON.stringify({ ...prev, ...patch })
  );
}

function currentUserId() {
  return storeRef?.state?.user?.id ?? null;
}

function getCanSyncBlockReason() {
  const userId = currentUserId();
  if (!userId) {
    return "no_user";
  }
  if (storeRef?.state?.appInitializing) {
    return "app_initializing";
  }
  if (isHydrating) {
    return "hydrating";
  }
  const meta = readMeta();
  if (meta?.user_id != null && Number(meta.user_id) !== Number(userId)) {
    return "meta_user_mismatch";
  }
  return null;
}

function canSync() {
  return getCanSyncBlockReason() == null;
}

function isStaleFlushRevision() {
  const meta = readMeta();
  if (meta?.updated_at == null || flushRevisionAtSchedule == null) {
    return false;
  }
  return Number(meta.updated_at) > Number(flushRevisionAtSchedule);
}

function markDirtyLs(key) {
  if (isHydrating || !key) {
    return;
  }
  if (!isUiPreferencesLsKey(key, currentUserId())) {
    return;
  }
  dirtyLsKeys.add(key);
  flushRevisionAtSchedule = readMeta()?.updated_at ?? flushRevisionAtSchedule;
  scheduleFlush();
}

function markVuexDirty() {
  if (isHydrating) {
    return;
  }
  vuexDirty = true;
  flushRevisionAtSchedule = readMeta()?.updated_at ?? flushRevisionAtSchedule;
  scheduleFlush();
}

function collectVuexPatch() {
  if (!vuexDirty) {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORE_CONFIG.localStorageKeys.userSettings);
    if (!raw) {
      return {};
    }
    return pickUiPreferencesVuexFromUserSettings(JSON.parse(raw));
  } catch {
    return {};
  }
}

function collectLsPatch(keys, deletedKeys = []) {
  const deleted = new Set(deletedKeys);
  const ls = {};
  for (const key of keys) {
    if (deleted.has(key)) {
      ls[key] = null;
      continue;
    }
    const value = localStorage.getItem(key);
    if (value !== null) {
      ls[key] = value;
    }
  }
  return ls;
}

function scheduleFlushRetry() {
  if (flushRetryAttempt >= MAX_FLUSH_RETRIES) {
    return;
  }
  flushRetryAttempt += 1;
  const delay = Math.min(1000 * 2 ** flushRetryAttempt, 8000);
  setTimeout(() => {
    void flushOnce();
  }, delay);
}

async function flushOnce() {
  if (!canSync()) {
    if (dirtyLsKeys.size > 0 || deletedLsKeys.size > 0 || vuexDirty) {
      scheduleFlush();
    }
    return;
  }
  if (dirtyLsKeys.size === 0 && deletedLsKeys.size === 0 && !vuexDirty) {
    return;
  }
  if (isStaleFlushRevision()) {
    memoryUpdatedAt = readMeta()?.updated_at ?? memoryUpdatedAt;
    if (dirtyLsKeys.size > 0 || deletedLsKeys.size > 0 || vuexDirty) {
      scheduleFlush();
    }
    return;
  }
  if (flushInFlight) {
    flushQueued = true;
    return;
  }

  flushInFlight = true;
  writeMeta({ sync_state: "pending" });

  const lsKeys = [...dirtyLsKeys];
  const deleteKeys = [...deletedLsKeys];
  const vuexPatch = collectVuexPatch();
  dirtyLsKeys.clear();
  deletedLsKeys.clear();
  vuexDirty = false;

  const allLsKeys = [...new Set([...lsKeys, ...deleteKeys])];

  try {
    for (let i = 0; i < allLsKeys.length; i += UI_PREFERENCES_LS_BATCH_SIZE) {
      const batchKeys = allLsKeys.slice(i, i + UI_PREFERENCES_LS_BATCH_SIZE);
      const payload = { ls: collectLsPatch(batchKeys, deleteKeys) };
      if (i === 0 && vuexPatch && Object.keys(vuexPatch).length > 0) {
        payload.vuex = vuexPatch;
      }
      if ((!payload.ls || Object.keys(payload.ls).length === 0) && !payload.vuex) {
        continue;
      }
      const result = await UsersController.patchUiPreferences(payload);
      if (result?.updated_at != null) {
        memoryUpdatedAt = result.updated_at;
        flushRevisionAtSchedule = result.updated_at;
        writeMeta({
          user_id: currentUserId(),
          updated_at: result.updated_at,
          migrated: true,
          sync_state: "idle",
          last_sync_error: null,
        });
      }
    }

    if (allLsKeys.length === 0 && vuexPatch && Object.keys(vuexPatch).length > 0) {
      const result = await UsersController.patchUiPreferences({ vuex: vuexPatch });
      if (result?.updated_at != null) {
        memoryUpdatedAt = result.updated_at;
        flushRevisionAtSchedule = result.updated_at;
        writeMeta({
          user_id: currentUserId(),
          updated_at: result.updated_at,
          migrated: true,
          sync_state: "idle",
          last_sync_error: null,
        });
      }
    }
    flushRetryAttempt = 0;
  } catch (error) {
    writeMeta({
      sync_state: "error",
      last_sync_error: error?.message || String(error),
    });
    for (const key of allLsKeys) {
      dirtyLsKeys.add(key);
    }
    for (const key of deleteKeys) {
      deletedLsKeys.add(key);
    }
    vuexDirty = true;
    scheduleFlushRetry();
  } finally {
    flushInFlight = false;
    if (flushQueued) {
      flushQueued = false;
      scheduleFlush();
    }
  }
}

const scheduleFlush = debounce(() => {
  void flushOnce();
}, UI_PREFERENCES_FLUSH_DEBOUNCE_MS);

function applyVuexPreferences(vuex) {
  if (!storeRef || !vuex || typeof vuex !== "object") {
    return;
  }
  storeRef.commit("HYDRATE_UI_PREFERENCES_VUEX", vuex);
  if (vuex.menuItems) {
    void storeRef.dispatch("initializeMenu");
  }
}

function hydrateChunk(entries, index, onDone) {
  const end = Math.min(index + UI_PREFERENCES_HYDRATE_CHUNK_SIZE, entries.length);
  for (let i = index; i < end; i += 1) {
    const [key, value] = entries[i];
    if (value === null || value === undefined) {
      originalRemoveItem.call(localStorage, key);
    } else {
      originalSetItem.call(localStorage, key, value);
    }
  }
  if (end < entries.length) {
    runIdle(() => hydrateChunk(entries, end, onDone));
  } else {
    onDone();
  }
}

function hydratePreferences(preferences, updatedAt) {
  if (!preferences || typeof preferences !== "object") {
    return;
  }

  isHydrating = true;
  try {
    applyVuexPreferences(preferences.vuex);
    const lsEntries = Object.entries(preferences.ls || {});
    if (lsEntries.length === 0) {
      finishHydrate(updatedAt);
      return;
    }
    runIdle(() => {
      hydrateChunk(lsEntries, 0, () => finishHydrate(updatedAt));
    });
  } catch (error) {
    isHydrating = false;
    writeMeta({
      sync_state: "error",
      last_sync_error: error?.message || String(error),
    });
  }
}

function finishHydrate(updatedAt) {
  writeMeta({
    user_id: currentUserId(),
    updated_at: updatedAt ?? memoryUpdatedAt,
    migrated: true,
    sync_state: "idle",
    last_sync_error: null,
  });
  memoryUpdatedAt = updatedAt ?? memoryUpdatedAt;
  flushRevisionAtSchedule = memoryUpdatedAt;
  isHydrating = false;
  eventBus.emit("ui-preferences-hydrated");
}

async function fetchAndHydrateIfNeeded(serverRevisionHint = null) {
  if (!canSync()) {
    return;
  }

  const meta = readMeta();
  const userId = currentUserId();
  if (
    serverRevisionHint != null &&
    meta?.user_id === userId &&
    meta?.updated_at === serverRevisionHint
  ) {
    memoryUpdatedAt = serverRevisionHint;
    flushRevisionAtSchedule = serverRevisionHint;
    return;
  }

  try {
    const payload = await UsersController.getUiPreferences();
    const updatedAt = payload?.updated_at ?? null;
    const preferences = payload?.preferences ?? null;
    memoryUpdatedAt = updatedAt;
    flushRevisionAtSchedule = updatedAt;

    if (preferences && (updatedAt == null || meta?.updated_at !== updatedAt)) {
      hydratePreferences(preferences, updatedAt);
      return;
    }

    if (meta?.user_id !== userId) {
      writeMeta({
        user_id: userId,
        updated_at: updatedAt,
        migrated: false,
        sync_state: "idle",
        last_sync_error: null,
      });
    }
  } catch (error) {
    writeMeta({
      sync_state: "error",
      last_sync_error: error?.message || String(error),
    });
  }
}

export function onUserChange(userId) {
  dirtyLsKeys.clear();
  deletedLsKeys.clear();
  vuexDirty = false;
  flushRetryAttempt = 0;
  if (userId == null) {
    memoryUpdatedAt = null;
    flushRevisionAtSchedule = null;
    localStorage.removeItem(UI_PREFERENCES_META_KEY);
    return;
  }
  const prev = readMeta();
  if (prev?.user_id != null && Number(prev.user_id) === Number(userId)) {
    memoryUpdatedAt = prev.updated_at ?? null;
    flushRevisionAtSchedule = prev.updated_at ?? null;
    return;
  }
  memoryUpdatedAt = null;
  flushRevisionAtSchedule = null;
  writeMeta({
    user_id: userId,
    updated_at: null,
    migrated: false,
    sync_state: "idle",
    last_sync_error: null,
  });
}

export function bootstrapUiPreferences(serverRevisionHint = null) {
  runIdle(() => {
    void fetchAndHydrateIfNeeded(serverRevisionHint);
  });
}

export function installUserUiPreferencesSync(store) {
  storeRef = store;
  if (originalSetItem) {
    return;
  }

  originalSetItem = localStorage.setItem.bind(localStorage);
  originalRemoveItem = localStorage.removeItem.bind(localStorage);

  localStorage.setItem = function patchedSetItem(key, value) {
    originalSetItem(key, value);
    markDirtyLs(key);
  };

  localStorage.removeItem = function patchedRemoveItem(key) {
    originalRemoveItem(key);
    if (!isHydrating && isUiPreferencesLsKey(key, currentUserId())) {
      dirtyLsKeys.delete(key);
      deletedLsKeys.add(key);
      flushRevisionAtSchedule = readMeta()?.updated_at ?? flushRevisionAtSchedule;
      scheduleFlush();
    }
  };

  store.subscribe((mutation) => {
    if (!mutation?.type || !UI_PREFERENCES_VUEX_MUTATIONS.has(mutation.type)) {
      return;
    }
    markVuexDirty();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === UI_PREFERENCES_META_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.updated_at != null) {
          memoryUpdatedAt = parsed.updated_at;
          flushRevisionAtSchedule = parsed.updated_at;
        }
        if (parsed?.sync_state === "idle") {
          dirtyLsKeys.clear();
          deletedLsKeys.clear();
          vuexDirty = false;
        }
      } catch {
        void 0;
      }
      return;
    }
    if (event.key && isUiPreferencesLsKey(event.key, currentUserId())) {
      eventBus.emit("ui-preferences-hydrated");
    }
  });
}

export function flushUiPreferencesNow() {
  scheduleFlush.cancel();
  return flushOnce();
}
