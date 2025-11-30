import { companyScopedKey, isFreshByKey, touchKey } from "./invalidator";
import { retryWithExponentialBackoff } from "./utils";

export async function loadGlobalReference(
  { commit, state, getters, dispatch },
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
  if (!cacheKey || !mutation || !loadingFlag || typeof fetchFn !== "function") {
    throw new Error("loadGlobalReference: required parameters missing");
  }

  if (state.loadingFlags && state.loadingFlags[loadingFlag]) {
    return dispatch("waitForLoading", loadingFlag);
  }

  if (!isFreshByKey(cacheKey, ttl)) {
    commit(mutation, []);
  }

  const dataKey = stateKey || cacheKey;
  const data = state[dataKey];
  if (Array.isArray(data) && data.length > 0) {
    return;
  }

  commit("SET_LOADING_FLAG", { type: loadingFlag, loading: true });

  try {
    const data = await retryWithExponentialBackoff(fetchFn, 3);
    const finalData = transformFn ? transformFn(data, state) : data;
    commit(mutation, finalData);
    touchKey(cacheKey);
    if (process.env.NODE_ENV !== "production" && logName) {
      const dataLength = Array.isArray(finalData) ? finalData.length : 0;
      console.log(`${logName} (${dataLength})`);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`Ошибка загрузки ${logName || "данных"}:`, error);
    }
    commit(mutation, []);
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
    logEmoji,
    logName,
    fetchData,
    errorName,
    stateKey,
    onError,
  } = config;

  if (!loadingFlagKey || !cacheKeyPrefix || !stateKey || typeof fetchData !== "function") {
    throw new Error("loadCompanyScopedData: required parameters missing");
  }
  if (!Array.isArray(clearMutations) || clearMutations.length === 0) {
    throw new Error("loadCompanyScopedData: clearMutations must be a non-empty array");
  }

  if (state.loadingFlags && state.loadingFlags[loadingFlagKey]) {
    return dispatch("waitForLoading", loadingFlagKey);
  }

  if (!companyId) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    return;
  }

  const cacheKey = companyScopedKey(cacheKeyPrefix, companyId);
  const ttl = cacheTtl;

  if (!isFreshByKey(cacheKey, ttl)) {
    clearMutations.forEach((mutation) => commit(mutation, []));
  }

  const stateData = state[stateKey];
  
  if (Array.isArray(stateData) && stateData.length > 0 && isFreshByKey(cacheKey, ttl)) {
    if (loggedFlagKey && state.loggedDataFlags && !state.loggedDataFlags[loggedFlagKey]) {
      if (process.env.NODE_ENV !== "production" && logEmoji && logName) {
        console.log(`  ${logEmoji} ${logName} (${stateData.length}) - из кэша`);
      }
      commit("SET_LOGGED_DATA_FLAG", { type: loggedFlagKey, logged: true });
    }
    return;
  }

  commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: true });

  try {
    const data = await retryWithExponentialBackoff(fetchData, 3);
    commit(clearMutations[0], data);
    if (clearMutations.length > 1) {
      clearMutations.slice(1).forEach((mutation) => {
        commit(mutation, data);
      });
    }
    if (process.env.NODE_ENV !== "production" && logEmoji && logName) {
      const dataLength = Array.isArray(data) ? data.length : 0;
      console.log(`  ${logEmoji} ${logName} (${dataLength})`);
    }
    touchKey(cacheKey);
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

