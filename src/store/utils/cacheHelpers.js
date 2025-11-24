import { retryWithExponentialBackoff } from './retry';

export function isCompanyChanged(companyState, companyId) {
  if (!companyState || !companyState.lastCompanyId) {
    return false;
  }
  return companyState.lastCompanyId !== null && companyState.lastCompanyId !== companyId;
}

export function shouldUseCache(dataState, dataKey, companyState, companyId) {
  if (!companyState) {
    return false;
  }
  const isChanged = isCompanyChanged(companyState, companyId);
  const hasData = dataState[dataKey]?.length > 0;
  return hasData && !isChanged;
}

export function handleLoadError(dispatch, title, error) {
  console.error(`❌ Ошибка загрузки ${title} после всех попыток:`, error);
  dispatch("ui/showNotification", {
    title: `Ошибка загрузки ${title}`,
    subtitle: error.message,
    isDanger: true,
  }, { root: true });
}

export function generateQueryCacheKey(prefix, params, companyId) {
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  const paramsKey = JSON.stringify(sortedParams);
  const companyKey = companyId ? `_company_${companyId}` : "";
  return `${prefix}_${paramsKey}${companyKey}`;
}

export async function waitForLoading(state, loadingFlags, type, maxAttempts = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkLoaded = () => {
      if (!loadingFlags[type]) {
        resolve();
      } else if (attempts >= maxAttempts) {
        console.warn(`Таймаут ожидания загрузки: ${type}`);
        reject(new Error("Таймаут загрузки"));
      } else {
        attempts++;
        setTimeout(checkLoaded, 50);
      }
    };
    checkLoaded();
  });
}

export async function loadCompanyScopedData({ commit, state, dispatch, rootState }, config) {
  const {
    loadingFlagKey,
    companyId,
    clearMutations,
    loggedFlagKey,
    logEmoji,
    logName,
    fetchData,
    errorName,
    stateKey,
  } = config;

  if (state.loadingFlags[loadingFlagKey]) {
    return waitForLoading(state, state.loadingFlags, loadingFlagKey);
  }

  if (!companyId) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    return;
  }

  // TTL проверяется автоматически через vuex-persistedstate в getState
  // Убрана проверка через старые ключи isFreshByKey/touchKey

  const companyState = rootState.company || {};
  const isChanged = isCompanyChanged(companyState, companyId);
  if (isChanged && state[stateKey]?.length > 0) {
    clearMutations.forEach((mutation) => commit(mutation, []));
  }

  if (shouldUseCache(state, stateKey, companyState, companyId)) {
    if (!state.loggedDataFlags[loggedFlagKey]) {
      console.log(
        `  ${logEmoji} ${logName} (${state[stateKey].length}) - из кэша`
      );
      commit("SET_LOGGED_DATA_FLAG", { type: loggedFlagKey, logged: true });
    }
    return;
  }

  commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: true });

  try {
    const data = await retryWithExponentialBackoff(fetchData, 3);
    commit(clearMutations[0], data);
    console.log(`  ${logEmoji} ${logName} (${data.length})`);
    // Timestamp сохраняется автоматически через vuex-persistedstate в setState
  } catch (error) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    handleLoadError(dispatch, errorName, error);
  } finally {
    commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: false });
  }
}

export function clearOldCompanyCache(oldCompanyId) {
  // Очистка старых данных компании происходит через мутации store
  // persistedstate автоматически синхронизирует изменения с localStorage
}

export async function loadCompanyDataIfNeeded(dispatch, state) {
  if (state.loadingFlags.companyData) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!state.loadingFlags.companyData) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }
  await dispatch("loadCompanyData");
}

export async function loadProductsForSearch(getters, isProducts, limit = 10) {
  if (getters.isBasementMode) {
    const BasementProductController = (
      await import("@/api/basement/BasementProductController")
    ).default;

    if (isProducts === true) {
      const productsResult = await BasementProductController.getItems(
        1,
        true,
        {},
        limit
      );
      return {
        items: productsResult.items || [],
      };
    } else if (isProducts === false) {
      const servicesResult = await BasementProductController.getItems(
        1,
        false,
        {},
        limit
      );
      return {
        items: servicesResult.items || [],
      };
    } else {
      const [productsResult, servicesResult] = await Promise.all([
        BasementProductController.getItems(1, true, {}, limit),
        BasementProductController.getItems(1, false, {}, limit),
      ]);
      return {
        items: [
          ...(productsResult.items || []),
          ...(servicesResult.items || []),
        ],
      };
    }
  } else {
    const ProductController = (await import("@/api/ProductController")).default;
    return await ProductController.getItems(
      1,
      isProducts ? null : isProducts,
      {},
      limit
    );
  }
}

