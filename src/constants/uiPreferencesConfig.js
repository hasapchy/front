import { STORE_CONFIG } from "@/store/config";

export const UI_PREFERENCES_META_KEY = STORE_CONFIG.uiPreferencesMetaKey;
export const UI_PREFERENCES_FLUSH_DEBOUNCE_MS = STORE_CONFIG.uiPreferencesFlushDebounceMs;
export const UI_PREFERENCES_LS_BATCH_SIZE = STORE_CONFIG.uiPreferencesLsBatchSize;
export const UI_PREFERENCES_HYDRATE_CHUNK_SIZE = STORE_CONFIG.uiPreferencesHydrateChunkSize;
export const UI_PREFERENCES_VUEX_FIELDS = STORE_CONFIG.uiPreferencesVuexFields;
export const UI_PREFERENCES_LS_PREFIXES = STORE_CONFIG.uiPreferencesLsPrefixes;
export const UI_PREFERENCES_LS_EXACT_KEYS = STORE_CONFIG.uiPreferencesLsExactKeys;
export const UI_PREFERENCES_LS_USER_PREFIXES = STORE_CONFIG.uiPreferencesLsUserPrefixes;
export const UI_PREFERENCES_VUEX_MUTATIONS = new Set(
  STORE_CONFIG.uiPreferencesVuexMutations
);

/**
 * @param {string} key
 * @param {number|null|undefined} userId
 * @returns {boolean}
 */
export function isUiPreferencesLsKey(key, userId = null) {
  if (!key || typeof key !== "string") {
    return false;
  }
  if (UI_PREFERENCES_LS_EXACT_KEYS.includes(key)) {
    return true;
  }
  for (const prefix of UI_PREFERENCES_LS_USER_PREFIXES) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    if (userId == null) {
      return false;
    }
    return key === `${prefix}${userId}`;
  }
  return UI_PREFERENCES_LS_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * @param {Record<string, unknown>|null|undefined} userSettings
 * @returns {Record<string, unknown>}
 */
export function pickUiPreferencesVuexFromUserSettings(userSettings) {
  const source = userSettings && typeof userSettings === "object" ? userSettings : {};
  const picked = {};
  for (const field of UI_PREFERENCES_VUEX_FIELDS) {
    if (source[field] !== undefined) {
      picked[field] = source[field];
    }
  }
  return picked;
}
