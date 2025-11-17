import { createStore } from "vuex";
import api from "@/api/axiosInstance";
import basementApi from "@/api/basement/basementAxiosInstance";
import CacheInvalidator, {
  companyScopedKey,
  isFreshByKey,
  touchKey,
} from "@/utils/cache";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import CACHE_TTL from "@/constants/cacheTTL";
import createPersistedState from "vuex-persistedstate";
import { eventBus } from "@/eventBus";

// DRY: единый маппинг для очистки state по типу данных
const CLEAR_MUTATIONS_MAPPING = {
  currencies: "SET_CURRENCIES",
  units: "SET_UNITS",
  orderStatuses: "SET_ORDER_STATUSES",
  projectStatuses: "SET_PROJECT_STATUSES",
  transactionCategories: "SET_TRANSACTION_CATEGORIES",
  productStatuses: "SET_PRODUCT_STATUSES",
  warehouses: "SET_WAREHOUSES",
  cashRegisters: "SET_CASH_REGISTERS",
  clients: "SET_CLIENTS",
  products: "SET_PRODUCTS",
  services: "SET_SERVICES",
  categories: "SET_CATEGORIES",
  projects: "SET_PROJECTS",
};

// DRY: глобальные справочники (не зависят от компании)
const GLOBAL_REFERENCE_FIELDS = [
  "units",
  "currencies",
  "users",
  "orderStatuses",
  "projectStatuses",
  "transactionCategories",
  "productStatuses",
];

// DRY: поля данных компании, которые нужно очищать при смене компании/очистке кэша
const COMPANY_DATA_FIELDS = [
  "warehouses",
  "cashRegisters",
  "clients",
  "clientsData",
  "products",
  "services",
  "lastProducts",
  "allProducts",
  "lastProductsData",
  "allProductsData",
  "categories",
  "projects",
  "projectsData",
];

// DRY: поля с timestamp для persistedState (включает глобальные и данные компании)
const FIELDS_WITH_TIMESTAMP = [
  ...GLOBAL_REFERENCE_FIELDS,
  "warehouses",
  "cashRegisters",
  "clientsData",
  "categories",
  "projectsData",
  "lastProductsData",
  "allProductsData",
];

async function retryWithExponentialBackoff(
  fn,
  maxRetries = 3,
  initialDelay = 1000
) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(
          `⚠️ Попытка ${attempt + 1} не удалась, повторяю через ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

function isCompanyChanged(state, companyId) {
  return state.lastCompanyId !== null && state.lastCompanyId !== companyId;
}

function shouldUseCache(state, dataKey, companyId) {
  const isChanged = isCompanyChanged(state, companyId);
  const hasData = state[dataKey]?.length > 0;
  return hasData && !isChanged;
}

function handleLoadError(dispatch, title, error) {
  console.error(`❌ Ошибка загрузки ${title} после всех попыток:`, error);
  dispatch("showNotification", {
    title: `Ошибка загрузки ${title}`,
    subtitle: error.message,
    isDanger: true,
  });
}

function generateQueryCacheKey(prefix, params, companyId) {
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

function logRoundingGetter(name, value, state) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Store] ${name}:`, {
      companyId: state.currentCompany?.id,
      companyName: state.currentCompany?.name,
      value,
    });
  }
}

async function loadCompanyDataIfNeeded(dispatch, state) {
  if (!state.loadingFlags.companyData) {
    await dispatch("loadCompanyData");
  }
}

async function loadProductsForSearch(getters, isProducts, limit = 10) {
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

async function loadCompanyScopedData({ commit, state, dispatch }, config) {
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
  } = config;

  if (state.loadingFlags[loadingFlagKey]) {
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

  const isChanged = isCompanyChanged(state, companyId);
  if (isChanged && state[stateKey]?.length > 0) {
    clearMutations.forEach((mutation) => commit(mutation, []));
  }

  if (shouldUseCache(state, stateKey, companyId)) {
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
    touchKey(cacheKey);
  } catch (error) {
    clearMutations.forEach((mutation) => commit(mutation, []));
    handleLoadError(dispatch, errorName, error);
  } finally {
    commit("SET_LOADING_FLAG", { type: loadingFlagKey, loading: false });
  }
}

function clearOldCompanyCache(oldCompanyId) {
  setTimeout(async () => {
    CacheInvalidator.invalidateByCompany(oldCompanyId);

    const persistKey = "hasap_vuex_cache";
    const stored = JSON.parse(localStorage.getItem(persistKey) || "{}");
    COMPANY_DATA_FIELDS.forEach((field) => {
      if (stored[field]) delete stored[field];
    });
    localStorage.setItem(persistKey, JSON.stringify(stored));

    const preservePrefixes = ["tableColumns_", "tableSort_"];
    const shouldPreserve = (key) =>
      preservePrefixes.some((prefix) => key?.startsWith(prefix));
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        !shouldPreserve(key) &&
        (key.includes("transaction") || key.includes("balance"))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }, 0);
}

// ✅ Listener для синхронизации между вкладками
function initializeStorageSync(_store) {
  let lastEmittedCompanyId = null;
  let debounceTimer = null;

  window.addEventListener("storage", (e) => {
    // ✅ Слушаем ТОЛЬКО события от ДРУГИХ вкладок (не от этой вкладки)
    if (e.key !== "hasap_vuex_cache") return;

    try {
      const newState = JSON.parse(e.newValue || "{}");
      const oldState = JSON.parse(e.oldValue || "{}");
      const newCompanyId = newState.currentCompany?.id;
      const oldCompanyId = oldState.currentCompany?.id;

      // ✅ Базируемся на ТЕКУЩЕМ store, а не на oldValue из события
      const currentTabCompanyId = _store.state.currentCompany?.id || null;

      // ✅ Эмитим только если в ДРУГОЙ вкладке действительно сменилась компания
      if (!newCompanyId || newCompanyId === currentTabCompanyId) return;
      if (!oldCompanyId || newCompanyId === oldCompanyId) return;
      if (newCompanyId === lastEmittedCompanyId) return;

      // Если уже синхронизируемся — выходим
      if (_store.state.isSyncingCompanyFromOtherTab) return;

      // ✅ Небольшой debounce, чтобы не сыпать событиями при серии записей
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", true);

          // ⚡ Не дергаем сервер: берем компанию из newState другой вкладки
          if (newState.currentCompany) {
            const newCompanyId = newState.currentCompany?.id;
            const currentCompanyId = _store.state.currentCompany?.id;

            if (newCompanyId === currentCompanyId) {
              return;
            }

            const updatedCompany = new CompanyDto(newState.currentCompany);
            _store.commit("SET_CURRENT_COMPANY", updatedCompany);
            await _store.dispatch("loadCompanyData");
            lastEmittedCompanyId = updatedCompany.id;
            eventBus.emit("company-changed", updatedCompany.id);
          }
        } catch (err) {
          console.error("Ошибка синхронизации текущей компании:", err);
        } finally {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", false);
        }
      }, 50);
    } catch (error) {
      console.error("Ошибка синхронизации между вкладками:", error);
    }
  });
}

const store = createStore({
  state: {
    user: null,
    permissions: [],
    permissionsLoaded: false,
    settings_open: false,
    searchQuery: "",
    notification: false,
    notificationTitle: "",
    notificationSubtitle: "",
    notificationIsDanger: false,
    notificationDuration: 10000, // Длительность уведомления в миллисекундах
    notificationTimeoutId: null, // ID таймера для возможности отмены
    isLoading: false, // Состояние загрузки для блокировки навигации (отключено)
    activeApiCalls: 0, // Счетчик активных API вызовов
    units: [], // Единицы измерения
    currencies: [], // Валюты
    // Флаги загрузки для предотвращения множественных запросов
    loadingFlags: {
      units: false,
      currencies: false,
      users: false,
      warehouses: false,
      cashRegisters: false,
      clients: false,
      products: false,
      services: false,
      categories: false,
      projects: false,
      orderStatuses: false,
      projectStatuses: false,
      transactionCategories: false,
      productStatuses: false,
      companyData: false,
    },
    // ✅ Флаги для отслеживания уже залогированных данных (чтобы не спамить логи)
    loggedDataFlags: {
      warehouses: false,
      cashRegisters: false,
      clients: false,
      categories: false,
      projects: false,
    },
    users: [], // Сотрудники (для модалок создания)
    warehouses: [], // Склады
    cashRegisters: [], // Кассы
    clients: [], // Клиенты (DTO с методами)
    clientsData: [], // Plain data для кэширования
    products: [], // Товары
    services: [], // Услуги
    lastProducts: [], // Последние 10 товаров для ProductSearch (DTO с методами)
    lastProductsData: [], // Plain data для кэширования
    allProducts: [], // ВСЕ товары и услуги для ProductSearch (DTO с методами)
    allProductsData: [], // Plain data для кэширования (30 дней)
    categories: [], // Категории
    projects: [], // Проекты (DTO с методами)
    projectsData: [], // Plain data для кэширования
    projectsDataCompanyId: null, // ✅ Для кого сохранены projectsData
    orderStatuses: [], // Статусы заказов
    projectStatuses: [], // Статусы проектов
    transactionCategories: [], // Категории транзакций
    productStatuses: [], // Статусы товаров
    currentCompany: null, // Текущая выбранная компания
    lastCompanyId: null, // ID последней загруженной компании (для отслеживания смены)
    userCompanies: [], // Список компаний пользователя
    // Кэш данных по компаниям (удаляем, используем только localStorage)
    // companyDataCache: {}, // { companyId: { warehouses: [], clients: [], ... } }
    soundEnabled: true,
    tokenInfo: {
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      needsRefresh: false,
    },
    orderStatusesCustomOrder: null,
    // ✅ Флаг для предотвращения цикла между вкладками
    isChangingCompanyFromThisTab: false,
    // ✅ Флаг синхронизации компании, пришедшей из другой вкладки
    isSyncingCompanyFromOtherTab: false,
    // Фильтр по типу клиента для взаиморасчетов/финансов
    clientTypeFilter: "all",
    // Версия логотипа для инвалидации кэша изображений
    logoVersion: 0,
    // Кэш пагинированных запросов API
    queryCache: {},
    // Настройки меню
    menuItems: {
      main: [],
      available: [],
    },
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
      state.permissionsLoaded = true;
    },
    SET_PERMISSIONS_LOADED(state, loaded) {
      state.permissionsLoaded = loaded;
    },
    SET_SETTINGS_OPEN(state, value) {
      state.settings_open = value;
    },
    SET_SEARCH_QUERY(state, query) {
      state.searchQuery = query;
    },
    SET_LOADING(state, isLoading) {
      state.isLoading = isLoading;
    },
    INCREMENT_API_CALLS(state) {
      // Отключаем блокировку навигации: только считаем активные вызовы
      state.activeApiCalls++;
      state.isLoading = false;
    },
    DECREMENT_API_CALLS(state) {
      state.activeApiCalls = Math.max(0, state.activeApiCalls - 1);
      state.isLoading = false;
    },
    SHOW_NOTIFICATION(state, { title, subtitle, isDanger, duration }) {
      state.notificationTitle = title;
      state.notificationSubtitle = subtitle;
      state.notificationIsDanger = isDanger;
      state.notificationDuration = duration || 10000;
      state.notification = true;
    },
    CLOSE_NOTIFICATION(state) {
      state.notification = false;
    },
    SET_NOTIFICATION_TIMEOUT_ID(state, timeoutId) {
      state.notificationTimeoutId = timeoutId;
    },
    SET_TOKEN_INFO(state, tokenInfo) {
      state.tokenInfo = { ...state.tokenInfo, ...tokenInfo };
    },
    UPDATE_TOKEN_EXPIRATION(
      state,
      { accessTokenExpiresAt, refreshTokenExpiresAt }
    ) {
      state.tokenInfo.accessTokenExpiresAt = accessTokenExpiresAt;
      state.tokenInfo.refreshTokenExpiresAt = refreshTokenExpiresAt;
      state.tokenInfo.needsRefresh = false;
    },
    SET_UNITS(state, units) {
      state.units = units;
    },
    SET_CURRENCIES(state, currencies) {
      state.currencies = currencies;
    },
    SET_USERS(state, users) {
      state.users = users;
    },
    SET_WAREHOUSES(state, warehouses) {
      state.warehouses = warehouses;
    },
    SET_CASH_REGISTERS(state, cashRegisters) {
      state.cashRegisters = cashRegisters;
    },
    SET_CLIENTS(state, clients) {
      state.clients = clients;
    },
    SET_CLIENTS_DATA(state, clientsData) {
      state.clientsData = clientsData;
    },
    SET_PRODUCTS(state, products) {
      state.products = products;
    },
    SET_SERVICES(state, services) {
      state.services = services;
    },
    SET_LAST_PRODUCTS(state, lastProducts) {
      state.lastProducts = lastProducts;
    },
    SET_LAST_PRODUCTS_DATA(state, lastProductsData) {
      state.lastProductsData = lastProductsData;
    },
    SET_ALL_PRODUCTS(state, allProducts) {
      state.allProducts = allProducts;
    },
    SET_ALL_PRODUCTS_DATA(state, allProductsData) {
      state.allProductsData = allProductsData;
    },
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_PROJECTS(state, projects) {
      state.projects = projects;
    },
    SET_PROJECTS_DATA(state, projectsData) {
      state.projectsData = projectsData;
      state.projectsDataCompanyId = state.currentCompany?.id || null;
    },
    SET_PROJECTS_DATA_COMPANY_ID(state, companyId) {
      state.projectsDataCompanyId = companyId;
    },
    SET_ORDER_STATUSES(state, orderStatuses) {
      state.orderStatuses = orderStatuses;
    },
    SET_PROJECT_STATUSES(state, projectStatuses) {
      state.projectStatuses = projectStatuses;
    },
    INCREMENT_LOGO_VERSION(state) {
      state.logoVersion = (state.logoVersion || 0) + 1;
    },
    SET_TRANSACTION_CATEGORIES(state, transactionCategories) {
      state.transactionCategories = transactionCategories;
    },
    SET_PRODUCT_STATUSES(state, productStatuses) {
      state.productStatuses = productStatuses;
    },
    // Удаляем неиспользуемую мутацию
    // SET_COMPANY_DATA_CACHE(state, { companyId, dataType, data }) {
    //   if (!state.companyDataCache[companyId]) {
    //     state.companyDataCache[companyId] = {};
    //   }
    //   state.companyDataCache[companyId][dataType] = data;
    // },
    CLEAR_COMPANY_DATA(state) {
      COMPANY_DATA_FIELDS.forEach((f) => {
        state[f] = [];
      });
      state.projectsDataCompanyId = null;
      state.loggedDataFlags = {
        warehouses: false,
        cashRegisters: false,
        clients: false,
        categories: false,
        projects: false,
      };
    },
    SET_CURRENT_COMPANY(state, company) {
      if (state.currentCompany?.id === company?.id) {
        return;
      }
      state.currentCompany = company;
    },
    SET_LAST_COMPANY_ID(state, companyId) {
      state.lastCompanyId = companyId;
    },
    SET_USER_COMPANIES(state, companies) {
      state.userCompanies = companies;
    },
    SET_SOUND_ENABLED(state, enabled) {
      state.soundEnabled = enabled;
    },
    SET_LOADING_FLAG(state, { type, loading }) {
      state.loadingFlags[type] = loading;
    },
    // ✅ Управление флагами залогированных данных
    SET_LOGGED_DATA_FLAG(state, { type, logged }) {
      state.loggedDataFlags[type] = logged;
    },
    SET_IS_CHANGING_COMPANY(state, value) {
      state.isChangingCompanyFromThisTab = value;
    },
    SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB(state, value) {
      state.isSyncingCompanyFromOtherTab = value;
    },
    SET_CLIENT_TYPE_FILTER(state, value) {
      state.clientTypeFilter = value || "all";
    },
    SET_ORDER_STATUSES_CUSTOM_ORDER(state, order) {
      state.orderStatusesCustomOrder = order;
    },
    SET_QUERY_CACHE(state, { key, data }) {
      state.queryCache[key] = { data, timestamp: Date.now() };
    },
    CLEAR_QUERY_CACHE(state, prefix = null) {
      if (!prefix) {
        state.queryCache = {};
        return;
      }
      Object.keys(state.queryCache).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete state.queryCache[key];
        }
      });
    },
    CLEAR_QUERY_CACHE_BY_COMPANY(state, companyId) {
      Object.keys(state.queryCache).forEach((key) => {
        if (key.includes(`_company_${companyId}`)) {
          delete state.queryCache[key];
        }
      });
    },
    SET_MENU_ITEMS(state, { main, available }) {
      state.menuItems.main = main || [];
      state.menuItems.available = available || [];
    },
    UPDATE_MENU_ITEMS(state, { type, items }) {
      if (type === "main" || type === "available") {
        state.menuItems[type] = items;
      }
    },
  },

  actions: {
    // Универсальная функция ожидания загрузки
    async waitForLoading({ state }, type, maxAttempts = 50) {
      return new Promise((resolve, reject) => {
        let attempts = 0;

        const checkLoaded = () => {
          if (!state.loadingFlags[type]) {
            resolve();
          } else if (attempts >= maxAttempts) {
            console.warn(`Таймаут ожидания загрузки: ${type}`);
            reject(new Error("Таймаут загрузки"));
          } else {
            attempts++;
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    },
    setSearchQuery({ commit }, query) {
      commit("SET_SEARCH_QUERY", query);
    },
    setClientTypeFilter({ commit }, value) {
      commit("SET_CLIENT_TYPE_FILTER", value || "all");
    },
    setUser({ commit }, user) {
      commit("SET_USER", user);
    },
    setPermissions({ commit }, permissions) {
      commit("SET_PERMISSIONS", permissions);
    },
    setLoading({ commit }, isLoading) {
      commit("SET_LOADING", isLoading);
    },
    startApiCall({ commit }) {
      commit("INCREMENT_API_CALLS");
    },
    endApiCall({ commit }) {
      commit("DECREMENT_API_CALLS");
    },
    showNotification(
      { commit, state },
      { title, subtitle = "", isDanger = false, duration = 10000 }
    ) {
      // Очищаем предыдущий таймер если есть
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
      }

      commit("SHOW_NOTIFICATION", { title, subtitle, isDanger, duration });

      const timeoutId = setTimeout(() => {
        commit("CLOSE_NOTIFICATION");
        commit("SET_NOTIFICATION_TIMEOUT_ID", null);
      }, duration);

      commit("SET_NOTIFICATION_TIMEOUT_ID", timeoutId);
    },
    closeNotification({ commit, state }) {
      // Очищаем таймер при закрытии
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
        commit("SET_NOTIFICATION_TIMEOUT_ID", null);
      }
      commit("CLOSE_NOTIFICATION");
    },
    pauseNotificationTimer({ commit, state }) {
      // Приостанавливаем таймер при наведении
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
        commit("SET_NOTIFICATION_TIMEOUT_ID", null);
      }
    },
    resumeNotificationTimer({ commit, state }) {
      // Возобновляем таймер при убирании мыши
      if (state.notification && !state.notificationTimeoutId) {
        const timeoutId = setTimeout(() => {
          commit("CLOSE_NOTIFICATION");
          commit("SET_NOTIFICATION_TIMEOUT_ID", null);
        }, state.notificationDuration);

        commit("SET_NOTIFICATION_TIMEOUT_ID", timeoutId);
      }
    },
    updateTokenExpiration(
      { commit },
      { accessTokenExpiresAt, refreshTokenExpiresAt }
    ) {
      commit("UPDATE_TOKEN_EXPIRATION", {
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      });
    },
    checkTokenStatus({ commit, state }) {
      if (
        state.tokenInfo.accessTokenExpiresAt &&
        state.tokenInfo.refreshTokenExpiresAt
      ) {
        const now = Date.now();
        const accessExpired = now > state.tokenInfo.accessTokenExpiresAt;
        const refreshExpired = now > state.tokenInfo.refreshTokenExpiresAt;

        commit("SET_TOKEN_INFO", {
          needsRefresh: accessExpired && !refreshExpired,
        });
      }
    },
    async loadUnits({ commit, state, getters }) {
      const cacheKey = "units";
      const ttl = CACHE_TTL.units;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_UNITS", []);
      }

      if (state.units.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "units", loading: true });

      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get("/app/units");
        commit("SET_UNITS", response.data);
        touchKey(cacheKey);
        console.log(`⚙️ Единицы (${response.data.length})`);
      } catch (error) {
        console.error("Ошибка загрузки единиц измерения:", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "units", loading: false });
      }
    },
    async loadCurrencies({ commit, state, getters }) {
      const cacheKey = "currencies";
      const ttl = CACHE_TTL.currencies;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_CURRENCIES", []);
      }

      if (state.currencies.length > 0) {
        const hasAccessToOtherCurrencies =
          typeof getters.hasPermission === "function" &&
          getters.hasPermission("settings_currencies_view");
        const onlyDefaultInCache = state.currencies.every(
          (c) => (c.isDefault || c.is_default) === true
        );

        if (hasAccessToOtherCurrencies && onlyDefaultInCache) {
          commit("SET_CURRENCIES", []);
        } else {
          if (
            state.currencies[0]?.is_default &&
            !state.currencies[0]?.isDefault
          ) {
            const CurrencyDto = (await import("@/dto/app/CurrencyDto")).default;
            commit(
              "SET_CURRENCIES",
              CurrencyDto.fromApiArray(state.currencies)
            );
          }
          return;
        }
      }

      commit("SET_LOADING_FLAG", { type: "currencies", loading: true });

      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get("/app/currency");
        const CurrencyDto = (await import("@/dto/app/CurrencyDto")).default;
        const converted = CurrencyDto.fromApiArray(response.data);
        commit("SET_CURRENCIES", converted);
        touchKey(cacheKey);
        console.log(`💱 Валюты (${converted.length})`);
      } catch (error) {
        console.error("Ошибка загрузки валют:", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "currencies", loading: false });
      }
    },
    async loadUsers({ commit, state }) {
      const cacheKey = "users";
      const ttl = 24 * 60 * 60 * 1000;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_USERS", []);
      }

      if (state.users.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "users", loading: true });

      try {
        const UsersController = (await import("@/api/UsersController")).default;
        const data = await UsersController.getAllItems();
        commit("SET_USERS", data);
        touchKey(cacheKey);
        console.log(`👥 Сотрудники (${data.length})`);
      } catch (error) {
        console.error("Ошибка загрузки сотрудников:", error);
        commit("SET_USERS", []);
      } finally {
        commit("SET_LOADING_FLAG", { type: "users", loading: false });
      }
    },
    async loadWarehouses(context) {
      await loadCompanyScopedData(context, {
        loadingFlagKey: "warehouses",
        stateKey: "warehouses",
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: "warehouses",
        cacheTtl: CACHE_TTL.warehouses,
        clearMutations: ["SET_WAREHOUSES"],
        loggedFlagKey: "warehouses",
        logEmoji: "📦",
        logName: "Склады",
        fetchData: async () => {
          const WarehouseController = (
            await import("@/api/WarehouseController")
          ).default;
          return await WarehouseController.getAllItems();
        },
        errorName: "складов",
      });
    },
    async loadCashRegisters(context) {
      await loadCompanyScopedData(context, {
        loadingFlagKey: "cashRegisters",
        stateKey: "cashRegisters",
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: "cashRegisters",
        cacheTtl: CACHE_TTL.cashRegisters,
        clearMutations: ["SET_CASH_REGISTERS"],
        loggedFlagKey: "cashRegisters",
        logEmoji: "💰",
        logName: "Кассы",
        fetchData: async () => {
          const CashRegisterController = (
            await import("@/api/CashRegisterController")
          ).default;
          return await CashRegisterController.getAllItems();
        },
        errorName: "касс",
      });
    },
    async loadClients({ commit, state, dispatch }) {
      if (state.loadingFlags.clients) {
        return dispatch("waitForLoading", "clients");
      }

      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
        return;
      }

      const cacheKey = companyScopedKey("clients", companyId);
      const ttl = CACHE_TTL.clients;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
      }

      const isChanged = isCompanyChanged(state, companyId);
      if (isChanged) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
      }

      if (
        state.clientsData.length > 0 &&
        state.clients.length === 0 &&
        !isChanged
      ) {
        const firstClient = state.clientsData[0];
        const hasSnakeCase =
          firstClient &&
          (firstClient.first_name !== undefined ||
            firstClient.last_name !== undefined);
        const hasCamelCase =
          firstClient &&
          (firstClient.firstName !== undefined ||
            firstClient.lastName !== undefined);

        if (hasCamelCase && !hasSnakeCase) {
          commit("SET_CLIENTS_DATA", []);
          commit("SET_CLIENTS", []);
        } else {
          const ClientDto = (await import("@/dto/client/ClientDto")).default;
          const clients = ClientDto.fromApiArray(state.clientsData);
          commit("SET_CLIENTS", clients);
          return;
        }
      }

      if (shouldUseCache(state, "clients", companyId)) {
        if (!state.loggedDataFlags.clients) {
          console.log(`  👤 Клиенты (${state.clients.length}) - из кэша`);
          commit("SET_LOGGED_DATA_FLAG", { type: "clients", logged: true });
        }
        return;
      }

      commit("SET_LOADING_FLAG", { type: "clients", loading: true });

      try {
        const ClientDto = (await import("@/dto/client/ClientDto")).default;
        const api = (await import("@/api/axiosInstance")).default;

        const response = await retryWithExponentialBackoff(async () => {
          const res = await api.get(`/clients/all`);
          return res.data;
        }, 3);

        const plainData = Array.isArray(response) ? response : [];
        commit("SET_CLIENTS_DATA", plainData);
        const clients = ClientDto.fromApiArray(plainData);
        commit("SET_CLIENTS", clients);
        touchKey(cacheKey);
        console.log(`  👤 Клиенты (${plainData.length})`);
      } catch (error) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
        handleLoadError(dispatch, "клиентов", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "clients", loading: false });
      }
    },
    async loadProducts({ commit, state }) {
      if (state.products.length > 0) {
        return;
      }

      try {
        const ProductController = (await import("@/api/ProductController"))
          .default;
        const data = await ProductController.getItems(1, true);
        commit("SET_PRODUCTS", data.items);
      } catch (error) {
        console.error("Ошибка загрузки товаров:", error);
        commit("SET_PRODUCTS", []);
      }
    },
    async loadServices({ commit, state }) {
      if (state.services.length > 0) {
        return;
      }

      try {
        const ProductController = (await import("@/api/ProductController"))
          .default;
        const data = await ProductController.getItems(1, false);
        commit("SET_SERVICES", data.items);
      } catch (error) {
        console.error("Ошибка загрузки услуг:", error);
        commit("SET_SERVICES", []);
      }
    },
    async loadCategories(context) {
      await loadCompanyScopedData(context, {
        loadingFlagKey: "categories",
        stateKey: "categories",
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: "categories",
        cacheTtl: CACHE_TTL.categories,
        clearMutations: ["SET_CATEGORIES"],
        loggedFlagKey: "categories",
        logEmoji: "✅",
        logName: "Категории",
        fetchData: async () => {
          const CategoryController = (await import("@/api/CategoryController"))
            .default;
          return await CategoryController.getAllItems();
        },
        errorName: "категорий",
      });
    },
    async loadProjects({ commit, state, dispatch }) {
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
        return;
      }

      const cacheKey = companyScopedKey("projects", companyId);
      const ttl = CACHE_TTL.projects;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
      }

      const isChanged = isCompanyChanged(state, companyId);
      const isProjectsCompanyChanged =
        state.projectsDataCompanyId !== null &&
        state.projectsDataCompanyId !== companyId;

      if (isChanged || isProjectsCompanyChanged) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
        commit("SET_PROJECTS_DATA_COMPANY_ID", companyId);
      }

      if (
        state.projectsData.length > 0 &&
        state.projects.length === 0 &&
        state.projectsDataCompanyId === companyId &&
        !isChanged
      ) {
        const ProjectDto = (await import("@/dto/project/ProjectDto")).default;
        const projects = ProjectDto.fromApiArray(state.projectsData);
        commit("SET_PROJECTS", projects);
        return;
      }

      if (
        state.projects.length > 0 &&
        state.projectsDataCompanyId === companyId &&
        !isChanged
      ) {
        if (!state.loggedDataFlags.projects) {
          console.log(`  📋 Проекты (${state.projects.length}) - из кэша`);
          commit("SET_LOGGED_DATA_FLAG", { type: "projects", logged: true });
        }
        return;
      }

      commit("SET_LOADING_FLAG", { type: "projects", loading: true });

      try {
        const ProjectController = (await import("@/api/ProjectController"))
          .default;
        const ProjectDto = (await import("@/dto/project/ProjectDto")).default;

        const data = await retryWithExponentialBackoff(
          () => ProjectController.getAllItems(),
          3
        );
        const plainData = data.map((project) => ({ ...project }));
        commit("SET_PROJECTS_DATA", plainData);
        commit("SET_PROJECTS", ProjectDto.fromApiArray(plainData));
        touchKey(cacheKey);
        console.log(`  📋 Проекты (${data.length})`);
      } catch (error) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
        handleLoadError(dispatch, "проектов", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "projects", loading: false });
      }
    },
    async loadLastProducts({ commit, state, getters }) {
      if (
        state.lastProductsData.length > 0 &&
        state.lastProducts.length === 0
      ) {
        const ProductSearchDto = (
          await import("@/dto/product/ProductSearchDto")
        ).default;
        const lastProducts = ProductSearchDto.fromApiArray(
          state.lastProductsData
        );
        commit("SET_LAST_PRODUCTS", lastProducts);
        return;
      }

      if (state.lastProducts.length > 0) {
        return;
      }

      try {
        const results = await loadProductsForSearch(getters, null, 10);
        const ProductSearchDto = (
          await import("@/dto/product/ProductSearchDto")
        ).default;
        const lastProducts = ProductSearchDto.fromApiArray(results.items || []);
        commit("SET_LAST_PRODUCTS", lastProducts);
        commit(
          "SET_LAST_PRODUCTS_DATA",
          (results.items || []).map((item) => ({ ...item }))
        );
      } catch (error) {
        console.error("Ошибка загрузки последних товаров:", error);
        commit("SET_LAST_PRODUCTS", []);
        commit("SET_LAST_PRODUCTS_DATA", []);
      }
    },
    async loadAllProducts({ commit, state, getters }) {
      if (state.allProductsData.length > 0 && state.allProducts.length === 0) {
        const ProductSearchDto = (
          await import("@/dto/product/ProductSearchDto")
        ).default;
        const allProducts = ProductSearchDto.fromApiArray(
          state.allProductsData
        );
        commit("SET_ALL_PRODUCTS", allProducts);
        return;
      }

      if (state.allProducts.length > 0) {
        return;
      }

      try {
        const results = await loadProductsForSearch(getters, true, 1000);
        const ProductSearchDto = (
          await import("@/dto/product/ProductSearchDto")
        ).default;
        const allProducts = ProductSearchDto.fromApiArray(results.items || []);
        commit("SET_ALL_PRODUCTS", allProducts);
        commit(
          "SET_ALL_PRODUCTS_DATA",
          (results.items || []).map((item) => ({ ...item }))
        );
        console.log(
          `✅ Загружено ${allProducts.length} товаров для поиска (кэш на 30 дней)`
        );
      } catch (error) {
        console.error("Ошибка загрузки всех товаров:", error);
        commit("SET_ALL_PRODUCTS", []);
        commit("SET_ALL_PRODUCTS_DATA", []);
      }
    },
    async loadOrderStatuses({ commit, state }) {
      const cacheKey = "orderStatuses";
      const ttl = CACHE_TTL.orderStatuses;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_ORDER_STATUSES", []);
      }

      if (state.orderStatuses.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "orderStatuses", loading: true });

      try {
        const OrderStatusController = (
          await import("@/api/OrderStatusController")
        ).default;
        const data = await OrderStatusController.getAllItems();

        if (state.orderStatusesCustomOrder) {
          const orderArray = state.orderStatusesCustomOrder;
          const orderedData = orderArray
            .map((id) => data.find((status) => status.id === id))
            .filter(Boolean)
            .concat(data.filter((status) => !orderArray.includes(status.id)));
          commit("SET_ORDER_STATUSES", orderedData);
        } else {
          commit("SET_ORDER_STATUSES", data);
        }

        touchKey(cacheKey);
        console.log(`📊 Статусы заказов (${data.length})`);
      } catch (error) {
        console.error("Ошибка загрузки статусов заказов:", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "orderStatuses", loading: false });
      }
    },
    async loadProjectStatuses({ commit, state }) {
      const cacheKey = "projectStatuses";
      const ttl = CACHE_TTL.projectStatuses;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_PROJECT_STATUSES", []);
      }

      if (state.projectStatuses.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "projectStatuses", loading: true });

      try {
        const ProjectStatusController = (
          await import("@/api/ProjectStatusController")
        ).default;
        const data = await ProjectStatusController.getAllItems();
        commit("SET_PROJECT_STATUSES", data);
        touchKey(cacheKey);
        console.log(`🎯 Статусы проектов (${data.length})`);
      } catch (error) {
        console.error("Ошибка загрузки статусов проектов:", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "projectStatuses", loading: false });
      }
    },
    async loadTransactionCategories({ commit, state }) {
      const cacheKey = "transactionCategories";
      const ttl = CACHE_TTL.transactionCategories;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_TRANSACTION_CATEGORIES", []);
      }

      if (state.transactionCategories.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", {
        type: "transactionCategories",
        loading: true,
      });

      try {
        const TransactionCategoryController = (
          await import("@/api/TransactionCategoryController")
        ).default;
        const data = await TransactionCategoryController.getAllItems();
        commit("SET_TRANSACTION_CATEGORIES", data);
        touchKey(cacheKey);
        console.log(`💳 Категории транзакций (${data.length})`);
      } catch (error) {
        console.error("Ошибка загрузки категорий транзакций:", error);
      } finally {
        commit("SET_LOADING_FLAG", {
          type: "transactionCategories",
          loading: false,
        });
      }
    },
    async loadProductStatuses({ commit, state }) {
      const cacheKey = "productStatuses";
      const ttl = CACHE_TTL.productStatuses;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_PRODUCT_STATUSES", []);
      }

      if (state.productStatuses.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "productStatuses", loading: true });

      try {
        const AppController = (await import("@/api/AppController")).default;
        const data = await retryWithExponentialBackoff(
          () => AppController.getProductStatuses(),
          3
        );
        commit("SET_PRODUCT_STATUSES", data);
        touchKey(cacheKey);
        console.log(`🏷️ Статусы товаров (${data.length})`);
      } catch (error) {
        console.error(
          "❌ Ошибка загрузки статусов товаров после всех попыток:",
          error
        );
      } finally {
        commit("SET_LOADING_FLAG", { type: "productStatuses", loading: false });
      }
    },
    // Загрузка всех данных компании
    async loadCompanyData({ dispatch, commit, state, rootGetters }) {
      if (rootGetters.isBasementMode) {
        return;
      }

      if (!state.currentCompany?.id) {
        return;
      }

      if (state.loadingFlags.companyData) {
        return;
      }

      const companyId = state.currentCompany.id;
      commit("SET_LOADING_FLAG", { type: "companyData", loading: true });

      try {
        // ✅ Загружаем все данные параллельно для максимальной скорости
        // Критичные данные (warehouses, cashRegisters) загружаются первыми
        const criticalLoads = Promise.allSettled([
          dispatch("loadWarehouses"),
          dispatch("loadCashRegisters"),
        ]);

        const otherLoadsPromises = [dispatch("loadCategories")];

        if (rootGetters.hasPermission("clients_view")) {
          otherLoadsPromises.push(dispatch("loadClients"));
        }

        if (rootGetters.hasPermission("projects_view")) {
          otherLoadsPromises.push(dispatch("loadProjects"));
        }

        const otherLoads = Promise.allSettled(otherLoadsPromises);

        // ✅ Запускаем все параллельно для максимальной скорости
        const [criticalResults, otherResults] = await Promise.all([
          criticalLoads,
          otherLoads,
        ]);

        const allResults = [...criticalResults, ...otherResults];
        const failed = allResults.filter((r) => r.status === "rejected");

        if (failed.length > 0) {
          console.warn(`⚠️ ${failed.length} справочник(ов) не загрузилось`);
          const criticalFailed = criticalResults.filter(
            (r) => r.status === "rejected"
          );
          if (criticalFailed.length > 0) {
            dispatch("showNotification", {
              title: "Предупреждение",
              subtitle: "Некоторые критичные данные не загрузились",
              isDanger: false,
              duration: 3000,
            });
          }
        }

        commit("SET_LAST_COMPANY_ID", companyId);
      } catch (error) {
        console.error("❌ Ошибка загрузки данных компании:", error);
        dispatch("showNotification", {
          title: "Ошибка загрузки",
          subtitle: error.message || "Не удалось загрузить данные компании",
          isDanger: true,
        });
        throw error;
      } finally {
        // ✅ ВСЕГДА сбрасываем флаг загрузки после завершения (успех или ошибка)
        commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
      }
    },
    async clearCache({ commit }) {
      CacheInvalidator.invalidateAll();
      commit("CLEAR_COMPANY_DATA");
      commit("CLEAR_QUERY_CACHE");
      GLOBAL_REFERENCE_FIELDS.forEach((type) => {
        if (CLEAR_MUTATIONS_MAPPING[type]) {
          commit(CLEAR_MUTATIONS_MAPPING[type], []);
        }
      });
    },
    async loadUserCompanies({ commit }) {
      try {
        const response = await api.get("/user/companies");
        const companies = CompanyDto.fromApiArray(response.data);
        commit("SET_USER_COMPANIES", companies);
        return companies;
      } catch (error) {
        console.error("Ошибка загрузки компаний пользователя:", error);
        return [];
      }
    },
    async loadCurrentCompany({ commit, dispatch, state }) {
      try {
        if (state.currentCompany?.id) {
          const normalized = new CompanyDto(state.currentCompany);
          commit("SET_CURRENT_COMPANY", normalized);
          await loadCompanyDataIfNeeded(dispatch, state);
          return normalized;
        }

        if (state.lastCompanyId && state.userCompanies?.length > 0) {
          const lastCompany = state.userCompanies.find(
            (c) => c.id === state.lastCompanyId
          );
          if (lastCompany) {
            commit("SET_CURRENT_COMPANY", lastCompany);
            await loadCompanyDataIfNeeded(dispatch, state);
            return lastCompany;
          }
        }

        const response = await api.get("/user/current-company");
        const company = new CompanyDto(response.data.company);
        commit("SET_CURRENT_COMPANY", company);

        if (company?.id) {
          await loadCompanyDataIfNeeded(dispatch, state);
        }

        return company;
      } catch (error) {
        console.error(
          "[loadCurrentCompany] Ошибка загрузки текущей компании:",
          error
        );
        return null;
      }
    },
    async setCurrentCompany({ commit, dispatch }, companyId) {
      try {
        const oldCompanyId = this.state.currentCompany?.id;

        if (oldCompanyId === companyId) {
          return this.state.currentCompany;
        }

        const response = await api.post("/user/set-company", {
          company_id: companyId,
        });
        const company = new CompanyDto(response.data.company);

        commit("SET_CURRENT_COMPANY", company);

        if (oldCompanyId && oldCompanyId !== companyId) {
          clearOldCompanyCache(oldCompanyId);
          dispatch("invalidateQueryCache", { companyId: oldCompanyId });
        }

        commit("CLEAR_COMPANY_DATA");
        await dispatch("loadCompanyData");
        eventBus.emit("company-changed", companyId);

        return company;
      } catch (error) {
        console.error("Ошибка установки текущей компании:", error);
        commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
        throw error;
      }
    },
    // Принудительное обновление прав пользователя
    async refreshUserPermissions({ commit, getters }) {
      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get("/user/me");
        commit("SET_USER", response.data.user);
        commit("SET_PERMISSIONS", response.data.permissions);
        return response.data;
      } catch (error) {
        console.error("Ошибка обновления прав пользователя:", error);
        throw error;
      }
    },
    invalidateCache(
      { commit, dispatch },
      { type, companyId = null, skipEventBus = false }
    ) {
      if (!skipEventBus) {
        CacheInvalidator.invalidateByType(type, companyId);
        if (companyId) {
          CacheInvalidator.invalidateByCompany(companyId);
        }
      }

      if (CLEAR_MUTATIONS_MAPPING[type]) {
        commit(CLEAR_MUTATIONS_MAPPING[type], []);
      }

      if (type === "products" || type === "services") {
        commit("SET_LAST_PRODUCTS", []);
        commit("SET_LAST_PRODUCTS_DATA", []);
        commit("SET_ALL_PRODUCTS", []);
        commit("SET_ALL_PRODUCTS_DATA", []);
        dispatch("invalidateQueryCache", { prefix: "products_list" });
        dispatch("invalidateQueryCache", { prefix: "services_list" });
      }

      const queryCachePrefixes = {
        clients: "clients_list",
        orders: "orders_list",
        sales: "sales_list",
        transactions: "transactions_list",
        invoices: "invoices_list",
        projects: "projects_list",
      };

      if (queryCachePrefixes[type]) {
        dispatch("invalidateQueryCache", {
          prefix: queryCachePrefixes[type],
          companyId,
        });
      }
    },
    onDataCreate({ dispatch }, { type, companyId = null }) {
      dispatch("invalidateCache", { type, companyId });
    },
    onDataUpdate({ dispatch }, { type, companyId = null }) {
      dispatch("invalidateCache", { type, companyId });
    },
    onDataDelete({ dispatch }, { type, companyId = null }) {
      dispatch("invalidateCache", { type, companyId });
    },
    onCompanyChange({ commit, dispatch }, { oldCompanyId, newCompanyId }) {
      CacheInvalidator.onCompanyChange(oldCompanyId, newCompanyId);
      commit("CLEAR_COMPANY_DATA");
      if (oldCompanyId) {
        dispatch("invalidateQueryCache", { companyId: oldCompanyId });
      }
    },
    // Инвалидация при смене пользователя
    onUserChange({ commit }) {
      CacheInvalidator.onUserChange();
      commit("CLEAR_COMPANY_DATA");
      commit("CLEAR_QUERY_CACHE");
      GLOBAL_REFERENCE_FIELDS.forEach((field) => {
        if (CLEAR_MUTATIONS_MAPPING[field]) {
          commit(CLEAR_MUTATIONS_MAPPING[field], []);
        }
      });
      commit("SET_USERS", []);
    },
    getQueryCache({ state }, { prefix, params, ttl = 120000 }) {
      const companyId = state.currentCompany?.id;
      const key = generateQueryCacheKey(prefix, params, companyId);

      const cached = state.queryCache[key];
      if (!cached) return null;

      if (Date.now() - cached.timestamp > ttl) {
        delete state.queryCache[key];
        return null;
      }

      return cached.data;
    },
    setQueryCache({ commit, state }, { prefix, params, data }) {
      const companyId = state.currentCompany?.id;
      const key = generateQueryCacheKey(prefix, params, companyId);
      commit("SET_QUERY_CACHE", { key, data });
    },
    invalidateQueryCache({ commit }, { prefix = null, companyId = null }) {
      if (companyId) {
        commit("CLEAR_QUERY_CACHE_BY_COMPANY", companyId);
      } else {
        commit("CLEAR_QUERY_CACHE", prefix);
      }
    },
    initializeMenu({ commit }) {
      const storageKey = "menuItems";
      let saved = null;

      try {
        saved = localStorage.getItem(storageKey);
      } catch (e) {
        console.warn("Failed to read from localStorage:", e);
      }

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            parsed &&
            Array.isArray(parsed.main) &&
            Array.isArray(parsed.available)
          ) {
            const mainIds = new Set(
              parsed.main.map((item) => item?.id).filter(Boolean)
            );
            const availableIds = new Set(
              parsed.available.map((item) => item?.id).filter(Boolean)
            );

            const mainUnique = parsed.main.filter(
              (item) => item && item.id && !availableIds.has(item.id)
            );
            const availableUnique = parsed.available.filter(
              (item) => item && item.id && !mainIds.has(item.id)
            );

            const cleaned = {
              main: mainUnique,
              available: availableUnique,
            };
            commit("SET_MENU_ITEMS", cleaned);

            try {
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            } catch (e) {
              console.warn("Failed to save cleaned menu to localStorage:", e);
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to load saved menu, using default:", e);
        }
      }

      const allMenuItems = [
        {
          id: "orders",
          to: "/orders",
          icon: "fas fa-cart-arrow-down mr-2",
          label: "orders",
          permission: "orders_view",
        },
        {
          id: "sales",
          to: "/sales",
          icon: "fas fa-shopping-cart mr-2",
          label: "sales",
          permission: "sales_view",
        },
        {
          id: "transactions",
          to: "/transactions",
          icon: "fas fa-coins mr-2",
          label: "finance",
          permission: "transactions_view",
        },
        {
          id: "clients",
          to: "/clients",
          icon: "fa-solid fa-user-friends mr-2",
          label: "clients",
          permission: "clients_view",
        },
        {
          id: "projects",
          to: "/projects",
          icon: "fa-solid fa-briefcase mr-2",
          label: "projects",
          permission: "projects_view",
        },
        {
          id: "warehouses",
          to: "/warehouses",
          icon: "fa-solid fa-warehouse mr-2",
          label: "warehouses",
          permission: "warehouses_view",
        },
        {
          id: "users",
          to: "/users",
          icon: "fa-solid fa-user mr-2",
          label: "users",
          permission: "users_view",
        },
        {
          id: "roles",
          to: "/roles",
          icon: "fa-solid fa-user-shield mr-2",
          label: "roles",
          permission: "roles_view",
        },
        {
          id: "companies",
          to: "/companies",
          icon: "fa-solid fa-building mr-2",
          label: "companies",
          permission: "companies_view",
        },
        {
          id: "cash-registers",
          to: "/cash-registers",
          icon: "fa-solid fa-cash-register mr-2",
          label: "cashRegisters",
          permission: "cash-registers_view",
        },
        {
          id: "mutual-settlements",
          to: "/mutual-settlements",
          icon: "fa-solid fa-handshake mr-2",
          label: "mutualSettlements",
          permission: "mutual_settlements_view",
        },
        {
          id: "warehouses-admin",
          to: "/admin/warehouses",
          icon: "fa-solid fa-warehouse mr-2",
          label: "warehouses",
          permission: "warehouses_view",
        },
        {
          id: "products",
          to: "/products",
          icon: "fa-solid fa-box mr-2",
          label: "products",
          permission: "products_view",
        },
        {
          id: "services",
          to: "/services",
          icon: "fa-solid fa-paint-roller mr-2",
          label: "services",
          permission: "products_view",
        },
        {
          id: "currency-history",
          to: "/settings/currency-history",
          icon: "fa-solid fa-chart-line mr-2",
          label: "currencyHistory",
          permission: "currency_history_view",
        },
      ];

      const defaultMain = [
        "orders",
        "sales",
        "transactions",
        "clients",
        "projects",
        "warehouses",
      ];
      const defaultAvailable = [
        "users",
        "roles",
        "companies",
        "cash-registers",
        "mutual-settlements",
        "warehouses-admin",
        "products",
        "services",
        "currency-history",
      ];

      const main = defaultMain
        .map((id) => allMenuItems.find((item) => item.id === id))
        .filter(Boolean);
      const available = defaultAvailable
        .map((id) => allMenuItems.find((item) => item.id === id))
        .filter(Boolean);

      commit("SET_MENU_ITEMS", { main, available });
      localStorage.setItem(storageKey, JSON.stringify({ main, available }));
    },
    updateMenuItems({ commit, state }, { type, items }) {
      if (!Array.isArray(items)) {
        console.error("updateMenuItems: items must be an array", items);
        return;
      }

      if (type !== "main" && type !== "available") {
        console.error(
          'updateMenuItems: type must be "main" or "available"',
          type
        );
        return;
      }

      const uniqueItems = [];
      const seenIds = new Set();
      for (const item of items) {
        if (
          item &&
          typeof item === "object" &&
          item.id &&
          !seenIds.has(item.id)
        ) {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      }

      const storageKey = "menuItems";
      const currentMain =
        type === "main" ? uniqueItems : state.menuItems.main || [];
      const currentAvailable =
        type === "available" ? uniqueItems : state.menuItems.available || [];

      const mainIds = new Set(
        currentMain.map((item) => item?.id).filter(Boolean)
      );
      const availableIds = new Set(
        currentAvailable.map((item) => item?.id).filter(Boolean)
      );

      const mainUnique = currentMain.filter(
        (item) => item && item.id && !availableIds.has(item.id)
      );
      const availableUnique = currentAvailable.filter(
        (item) => item && item.id && !mainIds.has(item.id)
      );

      const current = {
        main: mainUnique,
        available: availableUnique,
      };
      commit("SET_MENU_ITEMS", current);

      try {
        localStorage.setItem(storageKey, JSON.stringify(current));
      } catch (e) {
        console.error("Failed to save menu items to localStorage:", e);
      }
    },
    updateBothMenuLists({ commit }, { mainItems, availableItems }) {
      if (!Array.isArray(mainItems) || !Array.isArray(availableItems)) {
        console.error("updateBothMenuLists: both arguments must be arrays");
        return;
      }

      const mainUnique = [];
      const mainSeenIds = new Set();
      for (const item of mainItems) {
        if (item && typeof item === "object" && item.id) {
          if (!mainSeenIds.has(item.id)) {
            mainSeenIds.add(item.id);
            mainUnique.push({
              id: item.id,
              to: item.to,
              icon: item.icon,
              label: item.label,
              permission: item.permission,
            });
          }
        }
      }

      const availableUnique = [];
      const availableSeenIds = new Set();
      for (const item of availableItems) {
        if (item && typeof item === "object" && item.id) {
          if (!availableSeenIds.has(item.id)) {
            availableSeenIds.add(item.id);
            availableUnique.push({
              id: item.id,
              to: item.to,
              icon: item.icon,
              label: item.label,
              permission: item.permission,
            });
          }
        }
      }

      const mainIds = new Set(
        mainUnique.map((item) => item.id).filter(Boolean)
      );
      const availableIds = new Set(
        availableUnique.map((item) => item.id).filter(Boolean)
      );

      const mainFiltered = mainUnique.filter(
        (item) => item && item.id && !availableIds.has(item.id)
      );
      const availableFiltered = availableUnique.filter(
        (item) => item && item.id && !mainIds.has(item.id)
      );

      const current = {
        main: mainFiltered,
        available: availableFiltered,
      };
      commit("SET_MENU_ITEMS", current);

      try {
        localStorage.setItem("menuItems", JSON.stringify(current));
      } catch (e) {
        console.error("Failed to save menu items to localStorage:", e);
      }
    },
  },

  getters: {
    user: (state) => state.user,
    permissions: (state) => state.permissions,
    hasPermission: (state) => (perm) => {
      if (!perm) {
        return true;
      }
      if (perm.startsWith("settings_")) {
        return state.permissions.includes(perm);
      }
      if (
        perm.endsWith("_view") ||
        perm.endsWith("_update") ||
        perm.endsWith("_delete")
      ) {
        const allPerm = perm.replace(/_(view|update|delete)$/, "_$1_all");
        const ownPerm = perm.replace(/_(view|update|delete)$/, "_$1_own");
        return (
          state.permissions.includes(allPerm) ||
          state.permissions.includes(ownPerm)
        );
      }
      return state.permissions.includes(perm);
    },
    isLoading: (state) => state.isLoading,
    activeApiCalls: (state) => state.activeApiCalls,
    notification: (state) => state.notification,
    notificationTitle: (state) => state.notificationTitle,
    notificationSubtitle: (state) => state.notificationSubtitle,
    notificationIsDanger: (state) => state.notificationIsDanger,
    notificationDuration: (state) => state.notificationDuration,
    notificationTimeoutId: (state) => state.notificationTimeoutId,
    tokenInfo: (state) => state.tokenInfo,
    isTokenExpired: (state) => state.tokenInfo.needsRefresh,
    isBasementMode: (state) => {
      // Проверяем, находимся ли мы в basement режиме по роли пользователя
      return (
        state.user &&
        state.user.roles &&
        state.user.roles.includes("basement_worker")
      );
    },
    accessTokenTimeLeft: (state) => {
      if (!state.tokenInfo.accessTokenExpiresAt) return 0;
      const timeLeft = state.tokenInfo.accessTokenExpiresAt - Date.now();
      return Math.max(0, Math.floor(timeLeft / 60000));
    },
    refreshTokenTimeLeft: (state) => {
      if (!state.tokenInfo.refreshTokenExpiresAt) return 0;
      const timeLeft = state.tokenInfo.refreshTokenExpiresAt - Date.now();
      return Math.max(0, Math.floor(timeLeft / (24 * 60 * 60 * 1000)));
    },
    units: (state) => state.units,
    currencies: (state) => state.currencies,
    users: (state) => state.users,
    warehouses: (state) => state.warehouses,
    cashRegisters: (state) => state.cashRegisters,
    clients: (state) => state.clients,
    products: (state) => state.products,
    services: (state) => state.services,
    lastProducts: (state) => state.lastProducts,
    allProducts: (state) => state.allProducts,
    categories: (state) => state.categories,
    projects: (state) => state.projects, // Все проекты для страницы проектов
    activeProjects: (state) =>
      state.projects.filter((p) => p.statusId !== 3 && p.statusId !== 4), // Только активные для форм
    orderStatuses: (state) => state.orderStatuses,
    projectStatuses: (state) => state.projectStatuses,
    transactionCategories: (state) => state.transactionCategories,
    productStatuses: (state) => state.productStatuses,
    getUnitById: (state) => (id) => state.units.find((unit) => unit.id === id),
    getUnitName: (state) => (id) => {
      const unit = state.units.find((unit) => unit.id === id);
      return unit ? unit.name : "";
    },
    getUnitShortName: (state) => (id) => {
      const unit = state.units.find((unit) => unit.id === id);
      return unit ? unit.short_name : "";
    },
    getCurrencyById: (state) => (id) =>
      state.currencies.find((currency) => currency.id === id),
    getCurrencySymbol: (state) => (id) => {
      const currency = state.currencies.find((currency) => currency.id === id);
      return currency ? currency.symbol : "Нет валюты";
    },
    currentCompany: (state) => state.currentCompany,
    userCompanies: (state) => state.userCompanies,
    currentCompanyId: (state) => state.currentCompany?.id || null,
    // ✅ Пользователи, отфильтрованные по текущей компании
    // Показываем только тех, у кого есть доступ к текущей компании (т.е. они являются сотрудниками этой компании)
    usersForCurrentCompany: (state) => {
      const currentCompanyId = state.currentCompany?.id;
      if (!currentCompanyId) {
        // Если нет текущей компании - возвращаем всех (на случай, если это глобальный режим)
        return state.users;
      }
      // Фильтруем: показываем пользователей, у которых текущая компания есть в списке компаний
      return state.users.filter((user) => {
        if (!user.companies || user.companies.length === 0) {
          return false; // Если у пользователя нет компаний - не показываем
        }
        // Проверяем, есть ли у пользователя текущая компания (т.е. он сотрудник этой компании)
        // Используем сравнение с приведением типов для надежности
        return user.companies.some(
          (company) => Number(company.id) === Number(currentCompanyId)
        );
      });
    },
    soundEnabled: (state) => state.soundEnabled,
    // Настройки округления для сумм текущей компании
    roundingDecimals: (state) => {
      const decimals = state.currentCompany?.rounding_decimals;
      logRoundingGetter("Rounding decimals", decimals, state);
      return decimals;
    },
    roundingEnabled: (state) => {
      const enabled = state.currentCompany?.rounding_enabled ?? true;
      logRoundingGetter("Rounding enabled", enabled, state);
      return enabled;
    },
    roundingDirection: (state) => {
      const direction = state.currentCompany?.rounding_direction || "standard";
      logRoundingGetter(
        "Rounding direction",
        {
          direction,
          customThreshold: state.currentCompany?.rounding_custom_threshold,
        },
        state
      );
      return direction;
    },
    roundingCustomThreshold: (state) =>
      state.currentCompany?.rounding_custom_threshold ?? 0.5,
    roundingQuantityDecimals: (state) => {
      const decimals = state.currentCompany?.rounding_quantity_decimals ?? 2;
      logRoundingGetter("Rounding quantity decimals", decimals, state);
      return decimals;
    },
    roundingQuantityEnabled: (state) => {
      const enabled = state.currentCompany?.rounding_quantity_enabled ?? true;
      logRoundingGetter("Rounding quantity enabled", enabled, state);
      return enabled;
    },
    roundingQuantityDirection: (state) => {
      const direction =
        state.currentCompany?.rounding_quantity_direction || "standard";
      logRoundingGetter(
        "Rounding quantity direction",
        {
          direction,
          customThreshold:
            state.currentCompany?.rounding_quantity_custom_threshold,
        },
        state
      );
      return direction;
    },
    roundingQuantityCustomThreshold: (state) =>
      state.currentCompany?.rounding_quantity_custom_threshold ?? 0.5,
    clientTypeFilter: (state) => state.clientTypeFilter || "all",
    mainMenuItems: (state, getters) => {
      if (!state.menuItems.main || state.menuItems.main.length === 0) {
        return [];
      }
      if (!Array.isArray(state.permissions)) {
        return [];
      }
      return state.menuItems.main.filter((item) => {
        if (!item) return false;
        if (!item.permission) return true;
        return getters.hasPermission(item.permission);
      });
    },
    availableMenuItems: (state, getters) => {
      if (
        !state.menuItems.available ||
        state.menuItems.available.length === 0
      ) {
        return [];
      }
      if (!Array.isArray(state.permissions)) {
        return [];
      }
      return state.menuItems.available.filter((item) => {
        if (!item) return false;
        if (!item.permission) return true;
        return getters.hasPermission(item.permission);
      });
    },
  },
  plugins: [
    createPersistedState({
      key: "hasap_vuex_cache",
      paths: [
        // DRY: глобальные справочники (используем константу)
        ...GLOBAL_REFERENCE_FIELDS,

        // Данные компании (10 минут)
        "warehouses",
        "cashRegisters",
        "clientsData", // ✅ Кэшируем plain data (без методов DTO)
        "categories", // ← Нужно для фильтров
        "projectsData", // ✅ Кэшируем plain data (без методов DTO)
        "projectsDataCompanyId", // ✅ Для проверки соответствия компании
        "lastProductsData", // ✅ Последние товары - plain data (5 минут)
        "allProductsData", // ✅ ВСЕ товары - plain data (30 дней!)
        // 'products',  // ← НЕ кэшируем глобально - каждая страница загружает свои данные
        // 'services',  // ← НЕ кэшируем глобально - каждая страница загружает свои данные

        // Текущая компания и настройки
        "currentCompany",
        "lastCompanyId",
        "userCompanies",
        "soundEnabled",
        "tokenInfo",
        "orderStatusesCustomOrder",
        // Пользовательские UI фильтры
        "clientTypeFilter",
        // Кэш пагинированных запросов API (2 минуты TTL)
        "queryCache",
        // Настройки меню
        "menuItems",
      ],

      // Кастомная логика для проверки TTL при восстановлении
      getState: (key, storage) => {
        const value = storage.getItem(key);
        if (!value) return undefined;

        try {
          const state = JSON.parse(value);

          // ✅ Проверяем соответствие данных компании текущей компании
          const currentCompanyId = state.currentCompany?.id || null;
          const projectsDataCompanyId = state.projectsDataCompanyId || null;

          // Если projectsData принадлежит другой компании - очищаем
          if (
            projectsDataCompanyId &&
            currentCompanyId &&
            projectsDataCompanyId !== currentCompanyId
          ) {
            state.projectsData = [];
            state.projectsDataCompanyId = null;
            state.projects = [];
          }

          const now = Date.now();
          const fieldsToCheck = {
            ...GLOBAL_REFERENCE_FIELDS.reduce((acc, field) => {
              acc[field] = CACHE_TTL[field] || CACHE_TTL.default;
              return acc;
            }, {}),
            warehouses: CACHE_TTL.warehouses,
            cashRegisters: CACHE_TTL.cashRegisters,
            clientsData: CACHE_TTL.clients,
            categories: CACHE_TTL.categories,
            projectsData: CACHE_TTL.projects,
            lastProductsData: 5 * 60 * 1000,
            allProductsData: CACHE_TTL.products,
            queryCache: 2 * 60 * 1000,
          };

          Object.keys(fieldsToCheck).forEach((field) => {
            if (field === "queryCache") {
              if (state[field] && typeof state[field] === "object") {
                const cacheKeys = Object.keys(state[field]);
                cacheKeys.forEach((key) => {
                  const cached = state[field][key];
                  if (
                    cached &&
                    cached.timestamp &&
                    now - cached.timestamp > fieldsToCheck[field]
                  ) {
                    delete state[field][key];
                  }
                });
              }
            } else if (state[field]?.length > 0) {
              const timestampKey = `${field}_timestamp`;
              const timestamp = storage.getItem(timestampKey);

              if (
                timestamp &&
                now - parseInt(timestamp) > fieldsToCheck[field]
              ) {
                state[field] = [];
                storage.removeItem(timestampKey);
              }
            }
          });

          return state;
        } catch {
          // Ошибка парсинга state - возвращаем пустое состояние
          return undefined;
        }
      },

      // Сохраняем timestamp при каждом изменении
      setState: (key, state, storage) => {
        storage.setItem(key, JSON.stringify(state));

        // Сохраняем timestamp для каждого массива данных
        const now = Date.now().toString();
        // DRY: используем константу вместо ручного списка

        FIELDS_WITH_TIMESTAMP.forEach((field) => {
          if (state[field]?.length > 0) {
            storage.setItem(`${field}_timestamp`, now);
          }
        });
      },
    }),
  ],
});

// ✅ Инициализируем синхронизацию между вкладками
initializeStorageSync(store);

eventBus.on("company-updated", async () => {
  await store.dispatch("loadUserCompanies");

  const currentCompanyId = store.state.currentCompany?.id;
  if (!currentCompanyId) return;

  try {
    const response = await api.get("/user/current-company");
    const updatedCompany = new CompanyDto(response.data.company);
    store.commit("SET_CURRENT_COMPANY", updatedCompany);
    store.commit("INCREMENT_LOGO_VERSION");
    eventBus.emit("company-changed", currentCompanyId);
  } catch (error) {
    console.error(
      "[Company Updated] Ошибка при загрузке обновленной компании:",
      error
    );
    const updatedCompany = store.state.userCompanies.find(
      (c) => c.id === currentCompanyId
    );
    if (updatedCompany) {
      store.commit("SET_CURRENT_COMPANY", updatedCompany);
      store.commit("INCREMENT_LOGO_VERSION");
      eventBus.emit("company-changed", currentCompanyId);
    }
  }
});

eventBus.on("cache:invalidate", ({ type, companyId = null }) => {
  store.dispatch("invalidateCache", { type, companyId, skipEventBus: true });
});

export default store;
