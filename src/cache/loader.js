import { companyScopedKey, isFreshByKey, touchKey } from "./invalidator";
import { retryWithExponentialBackoff } from "./utils";

export async function loadGlobalReference(
  { commit, state, dispatch },
  {
    cacheKey,
    ttl,
    mutation,
    loadingFlag,
    fetchFn,
    logName,
    transformFn,
    stateKey,
  }
) {
  if (!cacheKey || !mutation || !loadingFlag || !fetchFn) {
    throw new Error("loadGlobalReference: required parameters missing");
  }

  const cacheDebugEnabled =
    process.env.NODE_ENV !== "production" &&
    (import.meta.env?.VITE_CACHE_DEBUG === "1" || import.meta.env?.VITE_CACHE_DEBUG === "true");
  const cacheName = logName || cacheKey;
  const debug = (event, payload = {}) => {
    if (!cacheDebugEnabled) return;
    console.info(`[cache:${event}] ${cacheName}`, payload);
  };

  if (state.loadingFlags && state.loadingFlags[loadingFlag]) {
    debug("wait_loading", { loadingFlag });
    return dispatch("waitForLoading", loadingFlag);
  }

  const isFresh = isFreshByKey(cacheKey, ttl);
  if (!isFresh) {
    commit(mutation, []);
    debug("miss", { cacheKey, ttl });
  } else {
    debug("hit", { cacheKey, ttl });
  }

  const dataKey = stateKey || cacheKey;
  const data = state[dataKey];
  if (Array.isArray(data) && data.length > 0) {
    debug("state_hit", { dataKey, length: data.length });
    return;
  }

  commit("SET_LOADING_FLAG", { type: loadingFlag, loading: true });

  try {
    debug("fetch_start", { cacheKey });
    const data = await retryWithExponentialBackoff(fetchFn, 3);
    const finalData = transformFn ? transformFn(data, state) : data;
    commit(mutation, finalData);
    touchKey(cacheKey);
    debug("fetch_success", {
      cacheKey,
      length: Array.isArray(finalData) ? finalData.length : null,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Ошибка загрузки ${logName || "данных"}:`, error);
    }
    commit(mutation, []);
    debug("fetch_error", { cacheKey, message: error?.message || "unknown_error" });
  } finally {
    commit("SET_LOADING_FLAG", { type: loadingFlag, loading: false });
  }
}

export async function loadCompanyScopedData({ commit, state, dispatch }, config) {
  const {
    loadingFlagKey,
    companyId,
    cacheKeyPrefix,
    cacheTtl,
    clearMutations,
    loggedFlagKey,
    fetchData,
    errorName,
    stateKey,
    onError,
  } = config;

  if (!loadingFlagKey || !cacheKeyPrefix || !stateKey || !fetchData) {
    throw new Error("loadCompanyScopedData: required parameters missing");
  }
  if (!Array.isArray(clearMutations) || clearMutations.length === 0) {
    throw new Error("loadCompanyScopedData: clearMutations must be a non-empty array");
  }

  const cacheDebugEnabled =
    process.env.NODE_ENV !== "production" &&
    (import.meta.env?.VITE_CACHE_DEBUG === "1" || import.meta.env?.VITE_CACHE_DEBUG === "true");
  const debug = (event, payload = {}) => {
    if (!cacheDebugEnabled) return;
    console.info(`[cache:${event}] ${cacheKeyPrefix}`, payload);
  };

  if (state.loadingFlags && state.loadingFlags[loadingFlagKey]) {
    debug("wait_loading", { loadingFlagKey, companyId });
    return dispatch("waitForLoading", loadingFlagKey);
  }

  if (!companyId) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    debug("clear_no_company", { clearMutations });
    return;
  }

  const cacheKey = companyScopedKey(cacheKeyPrefix, companyId);
  const ttl = cacheTtl;

  const isFresh = isFreshByKey(cacheKey, ttl);
  if (!isFresh) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    debug("miss", { cacheKey, companyId, ttl });
  } else {
    debug("hit", { cacheKey, companyId, ttl });
  }

  const stateData = state[stateKey];
  
  if (Array.isArray(stateData) && stateData.length > 0 && isFreshByKey(cacheKey, ttl)) {
    if (loggedFlagKey && state.loggedDataFlags && !state.loggedDataFlags[loggedFlagKey]) {
      commit("SET_LOGGED_DATA_FLAG", { type: loggedFlagKey, logged: true });
    }
    debug("state_hit", { stateKey, length: stateData.length, companyId });
    return;
  }

  commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: true });

  try {
    debug("fetch_start", { cacheKey, companyId });
    const data = await retryWithExponentialBackoff(fetchData, 3);
    commit(clearMutations[0], data);
    if (clearMutations.length > 1) {
      clearMutations.slice(1).forEach((mutation) => {
        commit(mutation, data);
      });
    }
    touchKey(cacheKey);
    debug("fetch_success", {
      cacheKey,
      companyId,
      length: Array.isArray(data) ? data.length : null,
    });
  } catch (error) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    if (onError) {
      onError(dispatch, errorName, error);
    } else {
      if (process.env.NODE_ENV !== "production") {
        console.error(`❌ Ошибка загрузки ${errorName || "данных"}:`, error);
      }
      dispatch("showNotification", {
        title: `Ошибка загрузки ${errorName || "данных"}`,
        subtitle: error.message,
        isDanger: true,
      });
    }
    debug("fetch_error", { cacheKey, companyId, message: error?.message || "unknown_error" });
  } finally {
    commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: false });
  }
}

export async function restoreDtoFromPlainData({
  commit,
  state,
  plainDataKey,
  dtoKey,
  dtoClassPath,
  dtoMutation,
  plainDataMutation,
  cacheKey,
  ttl,
  companyId = null,
  validateFn = null,
}) {
  if (!plainDataKey || !dtoKey || !dtoClassPath || !cacheKey) {
    throw new Error("restoreDtoFromPlainData: required parameters missing");
  }

  const plainData = state[plainDataKey];
  const dtoData = state[dtoKey];

  if (
    Array.isArray(plainData) &&
    plainData.length > 0 &&
    Array.isArray(dtoData) &&
    dtoData.length === 0 &&
    isFreshByKey(cacheKey, ttl)
  ) {
    if (validateFn && !validateFn(plainData)) {
      if (plainDataMutation) commit(plainDataMutation, []);
      if (dtoMutation) commit(dtoMutation, []);
      return false;
    }

    try {
      const DtoClass = (await import(dtoClassPath)).default;
      if (!DtoClass?.fromApiArray) {
        return false;
      }
      const restored = DtoClass.fromApiArray(plainData);
      if (dtoMutation) commit(dtoMutation, restored);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error restoring DTO from plain data:", error);
      }
      return false;
    }
  }

  return false;
}

