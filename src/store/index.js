import { createStore } from "vuex";
import api from "@/api/axiosInstance";
import basementApi from "@/api/basement/basementAxiosInstance";
import CacheInvalidator, {
  companyScopedKey,
  isFreshByKey,
  touchKey,
  indexedDBStorage,
  loadGlobalReference,
  loadCompanyScopedData,
  retryWithExponentialBackoff,
  assertStorageAvailable,
} from "@/cache";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import CACHE_TTL from "@/constants/cacheTTL";
import createPersistedState from "vuex-persistedstate";
import { eventBus } from "@/eventBus";
import { PermissionParser, PERMISSIONS_CONFIG, hasPermission as checkPermission, isAdmin } from "@/permissions";
import { STORE_CONFIG } from "./config";
import TokenUtils from "@/utils/tokenUtils";
import AuthController from "@/api/AuthController";
import { BasementAuthController } from "@/api/basement/BasementAuthController";
import BasementProductController from "@/api/basement/BasementProductController";
import ProductController from "@/api/ProductController";
import UsersController from "@/api/UsersController";
import WarehouseController from "@/api/WarehouseController";
import CashRegisterController from "@/api/CashRegisterController";
import ClientController from "@/api/ClientController";
import CategoryController from "@/api/CategoryController";
import ProjectController from "@/api/ProjectController";
import OrderStatusController from "@/api/OrderStatusController";
import ProjectStatusController from "@/api/ProjectStatusController";
import TransactionCategoryController from "@/api/TransactionCategoryController";
import AppController from "@/api/AppController";
import CurrencyDto from "@/dto/app/CurrencyDto";
import ClientDto from "@/dto/client/ClientDto";
import ProjectDto from "@/dto/project/ProjectDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import { isBasementWorkerOnly, getUserFromStorage } from "@/utils/userUtils";

const CLEAR_MUTATIONS_MAPPING = STORE_CONFIG.clearMutationsMapping;
const GLOBAL_REFERENCE_FIELDS = STORE_CONFIG.globalReferenceFields;
const COMPANY_DATA_FIELDS = STORE_CONFIG.companyDataFields;
const FIELDS_WITH_TIMESTAMP = STORE_CONFIG.fieldsWithTimestamp;
const CLIENT_TYPE_FILTER_VALUES = STORE_CONFIG.clientTypeFilterValues;
const REFERENCES_CACHE_FIELDS = STORE_CONFIG.referencesCacheFields;
const USER_SETTINGS_FIELDS = STORE_CONFIG.userSettingsFields;
const LOADING_FLAGS_TO_RESET = STORE_CONFIG.loadingFlagsToReset;


const normalizeClientTypeFilter = (value) => {
  if (!value || value === "all") {
    return [];
  }

  let rawValues = [];
  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === "string") {
    rawValues = value.split(",");
  } else {
    return [];
  }

  const normalized = rawValues
    .map((item) => String(item).trim())
    .filter((item) => CLIENT_TYPE_FILTER_VALUES.includes(item));

  return Array.from(new Set(normalized));
};

const normalizeCashRegisterFilter = (value) => {
  if (!value || value === "all") {
    return [];
  }

  let rawValues = [];
  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === "string") {
    rawValues = value.split(",");
  } else {
    return [];
  }

  const normalized = rawValues
    .map((item) => {
      const num = parseInt(String(item).trim(), 10);
      return isNaN(num) ? null : num;
    })
    .filter((item) => item !== null);

  return Array.from(new Set(normalized));
};


function handleLoadError(dispatch, title, error) {
  console.error(`❌ Ошибка загрузки ${title} после всех попыток:`, error);
  dispatch("showNotification", {
    title: `Ошибка загрузки ${title}`,
    subtitle: error.message,
    isDanger: true,
  });
}

function logRoundingGetter(name, value, state) {
  // Логирование отключено
}

function logCompanyRoundingSettings(company) {
  if (!company) {
    return;
  }
  const payload = {
    companyId: company.id,
    name: company.name,
    amounts: {
      enabled: company.rounding_enabled,
      decimals: company.rounding_decimals,
      direction: company.rounding_direction,
      customThreshold: company.rounding_custom_threshold,
    },
    quantity: {
      enabled: company.rounding_quantity_enabled,
      decimals: company.rounding_quantity_decimals,
      direction: company.rounding_quantity_direction,
      customThreshold: company.rounding_quantity_custom_threshold,
    },
  };
}

async function loadCompanyDataIfNeeded(dispatch, state) {
  if (!state.loadingFlags.companyData) {
    await dispatch("loadCompanyData");
  }
}

async function loadProductsForSearch(getters, isProducts, limit = 10) {
  try {
    if (getters.isBasementMode) {
      if (isProducts === true) {
        const productsResult = await retryWithExponentialBackoff(
          () => BasementProductController.getItems(1, true, {}, limit),
          3
        );
        return {
          items: productsResult.items || [],
        };
      } else if (isProducts === false) {
        const servicesResult = await retryWithExponentialBackoff(
          () => BasementProductController.getItems(1, false, {}, limit),
          3
        );
        return {
          items: servicesResult.items || [],
        };
      } else {
        const [productsResult, servicesResult] = await Promise.allSettled([
          retryWithExponentialBackoff(
            () => BasementProductController.getItems(1, true, {}, limit),
            3
          ),
          retryWithExponentialBackoff(
            () => BasementProductController.getItems(1, false, {}, limit),
            3
          ),
        ]);
        return {
          items: [
            ...(productsResult.status === "fulfilled"
              ? productsResult.value.items || []
              : []),
            ...(servicesResult.status === "fulfilled"
              ? servicesResult.value.items || []
              : []),
          ],
        };
      }
    } else {
      return await retryWithExponentialBackoff(
        () =>
          ProductController.getItems(
            1,
            isProducts ? null : isProducts,
            {},
            limit
          ),
        3
      );
    }
  } catch (error) {
    console.error("Ошибка загрузки товаров для поиска:", error);
    return { items: [] };
  }
}


async function clearAllCacheOnCompanyChange() {
  try {
    await CacheInvalidator.invalidateAll();
  } catch (error) {
    console.error("Error clearing cache on company change:", error);
  }
}

// ✅ Listener для синхронизации между вкладками
function initializeStorageSync(_store) {
  let lastEmittedCompanyId = null;
  let debounceTimer = null;

  window.addEventListener("storage", (e) => {
    // Слушаем изменения в настройках пользователя (где хранится currentCompany)
    if (
      e.key !== STORE_CONFIG.localStorageKeys.userSettings &&
      e.key !== STORE_CONFIG.localStorageKeys.persistKey
    ) {
      return;
    }

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
            await clearAllCacheOnCompanyChange();
            _store.commit("CLEAR_COMPANY_DATA");
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
      categories: false,
      projects: false,
      orderStatuses: false,
      projectStatuses: false,
      taskStatuses: false,
      transactionCategories: false,
      productStatuses: false,
      companyData: false,
      userCompanies: false,
      userPermissions: false,
      currentCompany: false,
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
    taskStatuses: [], // Статусы задач
    transactionCategories: [], // Категории транзакций
    productStatuses: [], // Статусы товаров
    currentCompany: null, // Текущая выбранная компания
    lastCompanyId: null, // ID последней загруженной компании (для отслеживания смены)
    userCompanies: [], // Список компаний пользователя
    // Кэш данных по компаниям (удаляем, используем только localStorage)
    // companyDataCache: {}, // { companyId: { warehouses: [], clients: [], ... } }
    soundEnabled: true,
    orderStatusesCustomOrder: null,
    // ✅ Флаг синхронизации компании, пришедшей из другой вкладки
    isSyncingCompanyFromOtherTab: false,
    // Фильтр по типу клиента для взаиморасчетов/финансов
    clientTypeFilter: [],
    // Фильтр по кассе для взаиморасчетов
    cashRegisterFilter: [],
    // Версия логотипа для инвалидации кэша изображений
    logoVersion: 0,
    // Настройки меню
    menuItems: {
      main: [],
      available: [],
    },
    // Настройки полей карточек канбана
    kanbanCardFields: {
      orders: {
        cashRegister: false,
        warehouse: false,
        client: true,
        project: true,
        products: false,
        note: false,
        description: false,
        date: true,
        totalPrice: true,
      },
      projects: {
        description: true,
        date: true,
        client: true,
        user: true,
        budget: true,
      },
      tasks: {
        description: true,
        created_at: true,
        deadline: true,
        creator: true,
        supervisor: true,
        executor: true,
        priority: true,
        complexity: true,
      },
    },
    // Режимы просмотра для разных страниц
    viewModes: {
      leaves: 'table', // 'table' или 'calendar'
      projects: 'kanban', // 'table' или 'kanban'
      orders: 'table', // 'table' или 'kanban'
      tasks: 'table', // 'table' или 'kanban'
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
    INCREMENT_API_CALLS(state) {
      state.activeApiCalls++;
    },
    DECREMENT_API_CALLS(state) {
      state.activeApiCalls = Math.max(0, state.activeApiCalls - 1);
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
    SET_TASK_STATUSES(state, taskStatuses) {
      state.taskStatuses = taskStatuses;
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
      logCompanyRoundingSettings(company);
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
    SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB(state, value) {
      state.isSyncingCompanyFromOtherTab = value;
    },
    SET_CLIENT_TYPE_FILTER(state, value) {
      const normalized = normalizeClientTypeFilter(value);
      state.clientTypeFilter = normalized;
    },
    SET_CASH_REGISTER_FILTER(state, value) {
      const normalized = normalizeCashRegisterFilter(value);
      state.cashRegisterFilter = normalized;
    },
    SET_ORDER_STATUSES_CUSTOM_ORDER(state, order) {
      state.orderStatusesCustomOrder = order;
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
    SET_KANBAN_CARD_FIELDS(state, fields) {
      state.kanbanCardFields = fields;
    },
    UPDATE_KANBAN_CARD_FIELDS(state, { mode, fields }) {
      if (mode === "orders" || mode === "projects" || mode === "tasks") {
        state.kanbanCardFields[mode] = { ...state.kanbanCardFields[mode], ...fields };
      }
    },
    SET_LEAVES_VIEW_MODE(state, mode) {
      if (['table', 'calendar'].includes(mode)) {
        state.viewModes.leaves = mode;
      }
    },
    SET_PROJECTS_VIEW_MODE(state, mode) {
      if (['table', 'kanban'].includes(mode)) {
        state.viewModes.projects = mode;
      }
    },
    SET_ORDERS_VIEW_MODE(state, mode) {
      if (['table', 'kanban'].includes(mode)) {
        state.viewModes.orders = mode;
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
      commit("SET_CLIENT_TYPE_FILTER", value);
    },
    setCashRegisterFilter({ commit }, value) {
      commit("SET_CASH_REGISTER_FILTER", value);
    },
    setUser({ commit }, user) {
      commit("SET_USER", user);
    },
    setPermissions({ commit }, permissions) {
      commit("SET_PERMISSIONS", permissions);
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
    async loadUnits(context) {
      await loadGlobalReference(context, {
        cacheKey: "units",
        ttl: CACHE_TTL.units,
        mutation: "SET_UNITS",
        loadingFlag: "units",
        logName: "⚙️ Единицы",
        fetchFn: async () => {
          const apiInstance = context.getters.isBasementMode
            ? basementApi
            : api;
          const response = await apiInstance.get("/app/units");
          return response.data;
        },
      });
    },
    async loadCurrencies(context) {
      const { commit, state, getters } = context;
      const cacheKey = "currencies";
      const ttl = CACHE_TTL.currencies;

      if (!isFreshByKey(cacheKey, ttl)) {
        commit("SET_CURRENCIES", []);
      }

      if (Array.isArray(state.currencies) && state.currencies.length > 0) {
        const hasAccessToOtherCurrencies = checkPermission(
          "settings_currencies_view",
          state.permissions,
          state.user
        );
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
            commit(
              "SET_CURRENCIES",
              CurrencyDto.fromApiArray(state.currencies)
            );
          }
          return;
        }
      }

      await loadGlobalReference(context, {
        cacheKey,
        ttl,
        mutation: "SET_CURRENCIES",
        loadingFlag: "currencies",
        logName: "💱 Валюты",
        fetchFn: async () => {
          const apiInstance = getters.isBasementMode ? basementApi : api;
          const response = await apiInstance.get("/app/currency");
          return CurrencyDto.fromApiArray(response.data);
        },
      });
    },
    async loadUsers(context) {
      await loadGlobalReference(context, {
        cacheKey: "users",
        ttl: CACHE_TTL.users,
        mutation: "SET_USERS",
        loadingFlag: "users",
        logName: "👥 Сотрудники",
        fetchFn: async () => {
          return await UsersController.getListItems();
        },
      });
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
          return await WarehouseController.getListItems();
        },
        errorName: "складов",
        onError: handleLoadError,
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
          return await CashRegisterController.getListItems();
        },
        errorName: "касс",
        onError: handleLoadError,
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

      if (
        Array.isArray(state.clientsData) &&
        state.clientsData.length > 0 &&
        Array.isArray(state.clients) &&
        state.clients.length === 0 &&
        isFreshByKey(cacheKey, ttl)
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
          const clients = ClientDto.fromApiArray(state.clientsData);
          commit("SET_CLIENTS", clients);
          return;
        }
      }

      if (
        Array.isArray(state.clients) &&
        state.clients.length > 0 &&
        isFreshByKey(cacheKey, ttl)
      ) {
        if (!state.loggedDataFlags.clients) {
          const clientsLength = Array.isArray(state.clients)
            ? state.clients.length
            : 0;
          console.log(`  👤 Клиенты (${clientsLength}) - из кэша`);
          commit("SET_LOGGED_DATA_FLAG", { type: "clients", logged: true });
        }
        return;
      }

      commit("SET_LOADING_FLAG", { type: "clients", loading: true });

      try {
        const response = await retryWithExponentialBackoff(async () => {
          const res = await api.get(`/clients/all`);
          return res.data;
        }, 3);

        const responseData = response.data || response;
        const plainData = Array.isArray(responseData) ? responseData : [];
        const clients = ClientDto.fromApiArray(plainData);

        commit("SET_CLIENTS_DATA", plainData);
        commit("SET_CLIENTS", clients);
        touchKey(cacheKey);
        console.log(`  👤 Клиенты (${clients.length})`);
      } catch (error) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
        handleLoadError(dispatch, "клиентов", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "clients", loading: false });
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
          return await CategoryController.getListItems();
        },
        errorName: "категорий",
        onError: handleLoadError,
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
        commit("SET_PROJECTS_DATA_COMPANY_ID", companyId);
      }

      const isProjectsCompanyChanged =
        state.projectsDataCompanyId !== null &&
        state.projectsDataCompanyId !== companyId;

      if (isProjectsCompanyChanged) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
        commit("SET_PROJECTS_DATA_COMPANY_ID", companyId);
      }

      if (
        Array.isArray(state.projectsData) &&
        state.projectsData.length > 0 &&
        Array.isArray(state.projects) &&
        state.projects.length === 0 &&
        state.projectsDataCompanyId === companyId &&
        isFreshByKey(cacheKey, ttl)
      ) {
        const projects = ProjectDto.fromApiArray(state.projectsData);
        commit("SET_PROJECTS", projects);
        return;
      }

      if (
        Array.isArray(state.projects) &&
        state.projects.length > 0 &&
        state.projectsDataCompanyId === companyId &&
        isFreshByKey(cacheKey, ttl)
      ) {
        if (!state.loggedDataFlags.projects) {
          const projectsLength = Array.isArray(state.projects)
            ? state.projects.length
            : 0;
          console.log(`  📋 Проекты (${projectsLength}) - из кэша`);
          commit("SET_LOGGED_DATA_FLAG", { type: "projects", logged: true });
        }
        return;
      }

      commit("SET_LOADING_FLAG", { type: "projects", loading: true });

      try {
        const data = await retryWithExponentialBackoff(
          () => ProjectController.getListItems(),
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
    async loadProductsForSearch(
      { commit, state, getters },
      { limit = 10, force = false, isProductsOnly = null }
    ) {
      const isLastProducts = limit === 10;
      const stateKey = isLastProducts ? "lastProducts" : "allProducts";
      const dataKey = isLastProducts ? "lastProductsData" : "allProductsData";
      const setProductsMutation = isLastProducts
        ? "SET_LAST_PRODUCTS"
        : "SET_ALL_PRODUCTS";
      const setProductsDataMutation = isLastProducts
        ? "SET_LAST_PRODUCTS_DATA"
        : "SET_ALL_PRODUCTS_DATA";

      if (!force) {
        if (
          Array.isArray(state[dataKey]) &&
          state[dataKey].length > 0 &&
          Array.isArray(state[stateKey]) &&
          state[stateKey].length === 0
        ) {
          const products = ProductSearchDto.fromApiArray(state[dataKey]);
          commit(setProductsMutation, products);
          return;
        }

        if (Array.isArray(state[stateKey]) && state[stateKey].length > 0) {
          return;
        }
      }

      try {
        const results = await loadProductsForSearch(
          getters,
          isProductsOnly,
          limit
        );
        const products = ProductSearchDto.fromApiArray(results.items || []);
        commit(setProductsMutation, products);
        commit(
          setProductsDataMutation,
          (results.items || []).map((item) => ({ ...item }))
        );
        if (!isLastProducts) {
          console.log(
            `✅ Загружено ${products.length} товаров для поиска (кэш на 30 дней)`
          );
        }
      } catch (error) {
        console.error(
          `Ошибка загрузки товаров для поиска (limit: ${limit}):`,
          error
        );
        commit(setProductsMutation, []);
        commit(setProductsDataMutation, []);
      }
    },
    async loadLastProducts(context) {
      return context.dispatch("loadProductsForSearch", {
        limit: 10,
        isProductsOnly: null,
      });
    },
    async loadAllProducts(context) {
      return context.dispatch("loadProductsForSearch", {
        limit: 1000,
        isProductsOnly: true,
      });
    },
    async loadOrderStatuses(context) {
      const { state } = context;
      await loadGlobalReference(context, {
        cacheKey: "orderStatuses",
        ttl: CACHE_TTL.orderStatuses,
        mutation: "SET_ORDER_STATUSES",
        loadingFlag: "orderStatuses",
        logName: "📊 Статусы заказов",
        fetchFn: async () => {
          return await OrderStatusController.getListItems();
        },
        transformFn: (data) => {
          if (state.orderStatusesCustomOrder) {
            const orderArray = state.orderStatusesCustomOrder;
            return orderArray
              .map((id) => data.find((status) => status.id === id))
              .filter(Boolean)
              .concat(data.filter((status) => !orderArray.includes(status.id)));
          }
          return data;
        },
      });
    },
    async loadProjectStatuses(context) {
      await loadGlobalReference(context, {
        cacheKey: "projectStatuses",
        ttl: CACHE_TTL.projectStatuses,
        mutation: "SET_PROJECT_STATUSES",
        loadingFlag: "projectStatuses",
        logName: "🎯 Статусы проектов",
        fetchFn: async () => {
          return await ProjectStatusController.getListItems();
        },
      });
    },
    async loadTaskStatuses(context) {
      await loadGlobalReference(context, {
        cacheKey: "taskStatuses",
        ttl: CACHE_TTL.taskStatuses,
        mutation: "SET_TASK_STATUSES",
        loadingFlag: "taskStatuses",
        logName: "🎯 Статусы задач",
        fetchFn: async () => {
          const TaskStatusController = (
            await import("@/api/TaskStatusController")
          ).default;
          return await TaskStatusController.getListItems();
        },
      });
    },
    async loadTransactionCategories(context) {
      await loadGlobalReference(context, {
        cacheKey: "transactionCategories",
        ttl: CACHE_TTL.transactionCategories,
        mutation: "SET_TRANSACTION_CATEGORIES",
        loadingFlag: "transactionCategories",
        logName: "💳 Категории транзакций",
        fetchFn: async () => {
          return await TransactionCategoryController.getListItems();
        },
      });
    },
    async loadProductStatuses(context) {
      await loadGlobalReference(context, {
        cacheKey: "productStatuses",
        ttl: CACHE_TTL.productStatuses,
        mutation: "SET_PRODUCT_STATUSES",
        loadingFlag: "productStatuses",
        logName: "🏷️ Статусы товаров",
        fetchFn: async () => {
          return await retryWithExponentialBackoff(
            () => AppController.getProductStatuses(),
            3
          );
        },
      });
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

        const otherLoadsPromises = [
          dispatch("loadCategories"),
          dispatch("loadClients"),
          dispatch("loadProjects"),
        ];

        const otherLoads = Promise.allSettled(otherLoadsPromises);

        // ✅ Запускаем все параллельно для максимальной скорости
        // Используем allSettled чтобы один упавший промис не ломал все
        const [criticalResults, otherResults] = await Promise.allSettled([
          criticalLoads,
          otherLoads,
        ]).then((results) => [
          results[0].status === "fulfilled" ? results[0].value : [],
          results[1].status === "fulfilled" ? results[1].value : [],
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
      await CacheInvalidator.invalidateAll();
      commit("CLEAR_COMPANY_DATA");
      GLOBAL_REFERENCE_FIELDS.forEach((type) => {
        if (CLEAR_MUTATIONS_MAPPING[type]) {
          commit(CLEAR_MUTATIONS_MAPPING[type], []);
        }
      });
    },
    async initializeApp({ commit, dispatch, state, rootGetters }) {
      commit("SET_PERMISSIONS_LOADED", false);
      await dispatch("setPermissions", []);

      if (!TokenUtils.isAuthenticated()) {
        TokenUtils.clearAuthData();
        await dispatch("setUser", null);
        await dispatch("setPermissions", []);
        await dispatch("initializeMenu");
        return { authenticated: false };
      }

      try {
        const userFromStorage = getUserFromStorage();
        const isBasementWorker = isBasementWorkerOnly(userFromStorage);

        commit("SET_CURRENT_COMPANY", null);

        const userData = isBasementWorker
          ? await BasementAuthController.getBasementUser()
          : await AuthController.getUser();

        if (!userData) {
          throw new Error("Не удалось получить данные пользователя");
        }

        await dispatch("setUser", userData.user);
        await dispatch("setPermissions", userData.user?.permissions || userData.permissions || []);
        await dispatch("initializeMenu");

        if (!isBasementWorker) {
          await Promise.all([
            dispatch("loadCurrencies"),
            dispatch("loadUnits"),
          ]);

          try {
            await dispatch("loadUserCompanies");
            await dispatch("loadCurrentCompany", { skipPermissionRefresh: false });
          } catch (error) {
            console.error("Ошибка загрузки компаний:", error);
          }
        }

        return { authenticated: true };
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
        await dispatch("setUser", null);
        await dispatch("setPermissions", []);
        TokenUtils.clearAuthData();
        throw error;
      }
    },
    async loadUserCompanies({ commit, state }) {
      if (state.loadingFlags.userCompanies) {
        return state.userCompanies;
      }

      commit("SET_LOADING_FLAG", { type: "userCompanies", loading: true });
      try {
        const response = await retryWithExponentialBackoff(
          () => api.get("/user/companies"),
          3
        );
        const companies = CompanyDto.fromApiArray(response.data);
        commit("SET_USER_COMPANIES", companies);
        return companies;
      } catch (error) {
        console.error("Ошибка загрузки компаний пользователя:", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "userCompanies", loading: false });
      }
    },
    async loadCurrentCompany({ commit, dispatch, state }, options = {}) {
      if (state.loadingFlags.currentCompany) {
        return state.currentCompany;
      }

      commit("SET_LOADING_FLAG", { type: "currentCompany", loading: true });
      try {
        if (state.currentCompany?.id) {
          const normalized = new CompanyDto(state.currentCompany);
          commit("SET_CURRENT_COMPANY", normalized);
          await loadCompanyDataIfNeeded(dispatch, state);
          if (!options.skipPermissionRefresh) {
            await dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: true });
          }
          return normalized;
        }

        if (
          state.lastCompanyId &&
          Array.isArray(state.userCompanies) &&
          state.userCompanies.length > 0
        ) {
          const lastCompany = state.userCompanies.find(
            (c) => c.id === state.lastCompanyId
          );
          if (lastCompany) {
            commit("SET_CURRENT_COMPANY", lastCompany);
            await loadCompanyDataIfNeeded(dispatch, state);
            if (!options.skipPermissionRefresh) {
              await dispatch("refreshUserPermissions");
            }
            return lastCompany;
          }
        }

        const response = await retryWithExponentialBackoff(
          () => api.get("/user/current-company"),
          3
        );
        const company = new CompanyDto(response.data.company);
        commit("SET_CURRENT_COMPANY", company);

        if (company?.id) {
          await loadCompanyDataIfNeeded(dispatch, state);
          if (!options.skipPermissionRefresh) {
            await dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: true });
          }
        }

        return company;
      } catch (error) {
        console.error(
          "[loadCurrentCompany] Ошибка загрузки текущей компании:",
          error
        );
        return null;
      } finally {
        commit("SET_LOADING_FLAG", { type: "currentCompany", loading: false });
      }
    },
    async setCurrentCompany({ commit, dispatch }, companyId) {
      try {
        const oldCompanyId = this.state.currentCompany?.id;

        if (oldCompanyId === companyId) {
          return this.state.currentCompany;
        }

        const response = await retryWithExponentialBackoff(
          () =>
            api.post("/user/set-company", {
              company_id: companyId,
            }),
          3
        );
        const company = new CompanyDto(response.data.company);

        commit("SET_CURRENT_COMPANY", company);

        if (oldCompanyId && oldCompanyId !== companyId) {
          await clearAllCacheOnCompanyChange();
        }

        commit("CLEAR_COMPANY_DATA");
        await dispatch("loadCompanyData");
        await dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: false });
        eventBus.emit("company-changed", companyId);

        return company;
      } catch (error) {
        console.error("Ошибка установки текущей компании:", error);
        commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
        throw error;
      }
    },
    async refreshUserPermissions({ commit, dispatch, getters, state }, options = {}) {
      if (state.loadingFlags.userPermissions) {
        return;
      }

      if (options.skipIfAlreadyLoaded && state.permissionsLoaded && state.permissions && state.permissions.length > 0) {
        return;
      }

      commit("SET_LOADING_FLAG", { type: "userPermissions", loading: true });
      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await retryWithExponentialBackoff(
          () => apiInstance.get("/user/me"),
          3
        );
        const permissions = response.data.user?.permissions || response.data.permissions || [];
        commit("SET_USER", response.data.user);
        commit("SET_PERMISSIONS", permissions);
        await dispatch("initializeMenu");
        return response.data;
      } catch (error) {
        console.error("Ошибка обновления прав пользователя:", error);
        throw error;
      } finally {
        commit("SET_LOADING_FLAG", { type: "userPermissions", loading: false });
      }
    },
    async invalidateCache(
      { commit, dispatch },
      { type, companyId = null, skipEventBus = false }
    ) {
      if (!skipEventBus) {
        await CacheInvalidator.invalidateByType(type, companyId);
      }

      if (CLEAR_MUTATIONS_MAPPING[type]) {
        commit(CLEAR_MUTATIONS_MAPPING[type], []);
      }

      if (type === "products" || type === "services") {
        commit("SET_LAST_PRODUCTS", []);
        commit("SET_LAST_PRODUCTS_DATA", []);
        commit("SET_ALL_PRODUCTS", []);
        commit("SET_ALL_PRODUCTS_DATA", []);
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
    async onCompanyChange({ commit }, { oldCompanyId, newCompanyId }) {
      await CacheInvalidator.invalidateAll();
      commit("CLEAR_COMPANY_DATA");
    },
    // Инвалидация при смене пользователя
    async onUserChange({ commit }) {
      await CacheInvalidator.onUserChange();
      commit("CLEAR_COMPANY_DATA");
      GLOBAL_REFERENCE_FIELDS.forEach((field) => {
        if (CLEAR_MUTATIONS_MAPPING[field]) {
          commit(CLEAR_MUTATIONS_MAPPING[field], []);
        }
      });
      commit("SET_USERS", []);
    },
    initializeMenu({ commit, state }) {
      const companyId = state.currentCompany?.id || 'default';
      const storageKey = `menuItems_${companyId}`;
      let saved = null;
      let savedMenu = null;

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
            savedMenu = cleaned;

            try {
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            } catch (e) {
              console.warn("Failed to save cleaned menu to localStorage:", e);
            }
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
          id: "tasks",
          to: "/tasks",
          icon: "fas fa-tasks mr-2",
          label: "tasks",
          permission: "tasks_view",
        },
        {
          id: "news",
          to: "/news",
          icon: "fas fa-newspaper mr-2",
          label: "news",
          permission: "news_view_all",
        },
        {
          id: "messenger",
          to: "/messenger",
          icon: "fas fa-comments mr-2",
          label: "messenger",
          permission: "chats_view",
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
          id: "org-structure",
          to: "/org-structure",
          icon: "fa-solid fa-sitemap mr-2",
          label: "orgStructure",
          permission: "departments_view",
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
          permission: "cash_registers_view",
        },
        {
          id: "mutual-settlements",
          to: "/mutual-settlements",
          icon: "fa-solid fa-handshake mr-2",
          label: "mutualSettlements",
          permission: "mutual_settlements_view",
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
        {
          id: "leaves",
          to: "/leaves",
          icon: "fa-solid fa-calendar-days mr-2",
          label: "leaves",
          permission: "leaves_view_all",
        },
      ];

      const defaultMain = [
        "orders",
        "sales",
        "tasks",
        "news",
        "messenger",
        "transactions",
        "clients",
        "projects",
        "warehouses",
      ];
      const defaultAvailable = [
        "users",
        "org-structure",
        "roles",
        "companies",
        "cash-registers",
        "mutual-settlements",
        "products",
        "services",
        "currency-history",
        "leaves",
      ];

      const defaults = {
        main: defaultMain
          .map((id) => allMenuItems.find((item) => item.id === id))
          .filter(Boolean),
        available: defaultAvailable
          .map((id) => allMenuItems.find((item) => item.id === id))
          .filter(Boolean),
      };

      // Если меню уже было в localStorage — мерджим с новыми пунктами (чтобы новые фичи появлялись без сброса настроек)
      const baseMenu = savedMenu || defaults;
      const baseMainIds = new Set((baseMenu.main || []).map((i) => i.id));
      const baseAvailableIds = new Set((baseMenu.available || []).map((i) => i.id));

      // Находим новые пункты, которых нет ни в main, ни в available
      const missingItems = allMenuItems.filter(
        (i) => i && i.id && !baseMainIds.has(i.id) && !baseAvailableIds.has(i.id)
      );

      const merged = {
        main: baseMenu.main || [],
        available: [...(baseMenu.available || []), ...missingItems],
      };

      commit("SET_MENU_ITEMS", merged);
      localStorage.setItem(storageKey, JSON.stringify(merged));
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

      const companyId = state.currentCompany?.id || 'default';
      const storageKey = `menuItems_${companyId}`;
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
        const companyId = state.currentCompany?.id || 'default';
        localStorage.setItem(`menuItems_${companyId}`, JSON.stringify(current));
      } catch (e) {
        console.error("Failed to save menu items to localStorage:", e);
      }
    },
    setLeavesViewMode({ commit }, mode) {
      commit('SET_LEAVES_VIEW_MODE', mode);
    },
    setProjectsViewMode({ commit }, mode) {
      commit('SET_PROJECTS_VIEW_MODE', mode);
    },
    setOrdersViewMode({ commit }, mode) {
      commit('SET_ORDERS_VIEW_MODE', mode);
    },
  },

  getters: {
    user: (state) => state.user,
    permissions: (state) => state.permissions,
    hasPermission: (state) => (perm) => {
      return checkPermission(perm, state.permissions, state.user);
    },
    activeApiCalls: (state) => state.activeApiCalls,
    notification: (state) => state.notification,
    notificationTitle: (state) => state.notificationTitle,
    notificationSubtitle: (state) => state.notificationSubtitle,
    notificationIsDanger: (state) => state.notificationIsDanger,
    notificationDuration: (state) => state.notificationDuration,
    notificationTimeoutId: (state) => state.notificationTimeoutId,
    isBasementMode: (state) => {
      // Проверяем, находимся ли мы в basement режиме по роли пользователя
      return (
        state.user &&
        state.user.roles &&
        state.user.roles.includes("basement_worker")
      );
    },
    units: (state) => state.units,
    currencies: (state) => state.currencies,
    users: (state) => state.users,
    warehouses: (state) => state.warehouses,
    cashRegisters: (state) => state.cashRegisters,
    clients: (state) => state.clients,
    lastProducts: (state) => state.lastProducts,
    allProducts: (state) => state.allProducts,
    categories: (state) => state.categories,
    projects: (state) => state.projects,
    activeProjects: (state) =>
      state.projects.filter((p) => p.status?.isTrVisible ?? true),
    orderStatuses: (state) => state.orderStatuses,
    projectStatuses: (state) => state.projectStatuses,
    taskStatuses: (state) => state.taskStatuses,
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
    usersForCurrentCompany: (state) => {
      const currentCompanyId = state.currentCompany?.id;
      const activeUsers = state.users.filter((user) => Boolean(user?.isActive));
      if (!currentCompanyId) {
        // Если нет текущей компании - возвращаем только активных (глобальный режим)
        return activeUsers;
      }
      // Фильтруем: показываем пользователей, у которых текущая компания есть в списке компаний
      return activeUsers.filter((user) => {
        if (!user.companies || user.companies.length === 0) {
          return false; // Если у пользователя нет компаний - не показываем
        }
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
    clientTypeFilter: (state) =>
      normalizeClientTypeFilter(state.clientTypeFilter),
    cashRegisterFilter: (state) =>
      normalizeCashRegisterFilter(state.cashRegisterFilter),
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
    leavesViewMode: (state) => state.viewModes.leaves || 'table',
    projectsViewMode: (state) => state.viewModes.projects || 'kanban',
    ordersViewMode: (state) => state.viewModes.orders || 'table',
  },
  plugins: [
    // 1. Долгосрочный кэш справочников (localStorage)
    // Исключаем allProductsData, clientsData, projectsData - они в IndexedDB
    createPersistedState({
      key: STORE_CONFIG.localStorageKeys.referencesCache,
      storage: window.localStorage,
      paths: [
        ...GLOBAL_REFERENCE_FIELDS,
        ...REFERENCES_CACHE_FIELDS.filter(
          (field) =>
            field !== "allProductsData" &&
            field !== "clientsData" &&
            field !== "projectsData" &&
            field !== "projectsDataCompanyId"
        ),
      ],
      filter: (mutation) => {
        // Исключаем временные флаги и loading состояния
        if (!mutation?.type) return false;
        return (
          !mutation.type.includes("LOADING_FLAG") &&
          !mutation.type.includes("LOGGED_DATA_FLAG") &&
          !mutation.type.includes("IS_SYNCING")
        );
      },
      reducer: (state) => {
        // Используем paths автоматически - не нужно дублировать
        const cacheData = {};
        const fieldsToCache = [
          ...GLOBAL_REFERENCE_FIELDS,
          ...REFERENCES_CACHE_FIELDS.filter(
            (field) =>
              field !== "allProductsData" &&
              field !== "clientsData" &&
              field !== "projectsData" &&
              field !== "projectsDataCompanyId"
          ),
        ];

        fieldsToCache.forEach((field) => {
          if (state[field] !== undefined) {
            cacheData[field] = state[field];
          }
        });

        // Исключаем projectsData - он в IndexedDB
        delete cacheData.projectsData;
        delete cacheData.projectsDataCompanyId;

        return {
          ...cacheData,
          _meta: {
            timestamp: Date.now(),
            version: STORE_CONFIG.cacheVersion,
          },
        };
      },
      parser: (value) => {
        try {
          const parsed = JSON.parse(value);
          const now = Date.now();
          const meta = parsed._meta || { timestamp: 0 };

          // projectsData теперь в IndexedDB - не проверяем здесь

          // Проверка TTL для каждого поля
          GLOBAL_REFERENCE_FIELDS.forEach((field) => {
            const fieldData = parsed[field];
            if (Array.isArray(fieldData) && fieldData.length > 0) {
              const ttl = CACHE_TTL[field] || CACHE_TTL.default;
              if (now - meta.timestamp > ttl) {
                parsed[field] = [];
              }
            }
          });

          Object.entries(STORE_CONFIG.fieldTTLMapping).forEach(
            ([field, ttlKey]) => {
              const fieldData = parsed[field];
              if (Array.isArray(fieldData) && fieldData.length > 0) {
                const ttl = CACHE_TTL[ttlKey] || CACHE_TTL.default;
                if (now - meta.timestamp > ttl) {
                  parsed[field] = [];
                }
              }
            }
          );

          // Проверка TTL для lastProductsData
          if (
            Array.isArray(parsed.lastProductsData) &&
            parsed.lastProductsData.length > 0 &&
            now - meta.timestamp > STORE_CONFIG.cacheTTL.lastProductsData
          ) {
            parsed.lastProductsData = [];
          }

          // allProductsData, clientsData и projectsData теперь в IndexedDB - не проверяем здесь

          delete parsed._meta;
          return parsed;
        } catch {
          return {};
        }
      },
      rehydrated: (store) => {
        // Валидация и очистка после восстановления
        const state = store.state;

        // Очистить временные флаги загрузки
        LOADING_FLAGS_TO_RESET.forEach((flag) => {
          store.commit("SET_LOADING_FLAG", { type: flag, loading: false });
        });

        // Сбросить флаги логирования
        Object.keys(state.loggedDataFlags || {}).forEach((key) => {
          store.commit("SET_LOGGED_DATA_FLAG", { type: key, logged: false });
        });
      },
      assertStorage: (storage) =>
        assertStorageAvailable(storage, [
          STORE_CONFIG.localStorageKeys.referencesCache,
          STORE_CONFIG.localStorageKeys.userSettings,
        ], STORE_CONFIG.storageTestKey),
    }),

    // 3. Настройки пользователя (localStorage, всегда сохранять)
    createPersistedState({
      key: STORE_CONFIG.localStorageKeys.userSettings,
      storage: window.localStorage,
      assertStorage: (storage) => assertStorageAvailable(storage, [], STORE_CONFIG.storageTestKey),
      paths: USER_SETTINGS_FIELDS,
      getState: (key, storage) => {
        try {
          const value = storage.getItem(key);
          if (!value) {
            return undefined;
          }
          const parsed = JSON.parse(value);
          if (parsed.clientTypeFilter !== undefined && parsed.clientTypeFilter !== null) {
            parsed.clientTypeFilter = normalizeClientTypeFilter(parsed.clientTypeFilter);
          } else if (parsed.clientTypeFilter === undefined) {
            parsed.clientTypeFilter = [];
          }
          if (parsed.cashRegisterFilter !== undefined && parsed.cashRegisterFilter !== null) {
            parsed.cashRegisterFilter = normalizeCashRegisterFilter(parsed.cashRegisterFilter);
          } else if (parsed.cashRegisterFilter === undefined) {
            parsed.cashRegisterFilter = [];
          }
          return parsed;
        } catch (error) {
          console.error('[Store] Ошибка загрузки userSettings из localStorage:', error);
          return undefined;
        }
      },
      reducer: (state) => {
        const userSettings = {};
        USER_SETTINGS_FIELDS.forEach((field) => {
          if (state[field] !== undefined) {
            if (field === 'clientTypeFilter' || field === 'cashRegisterFilter') {
              userSettings[field] = Array.isArray(state[field]) ? state[field] : [];
            } else {
              userSettings[field] = state[field];
            }
          }
        });
        return userSettings;
      },
    }),

    // 4. Большие данные (IndexedDB) - для allProductsData, clientsData, projectsData
    createPersistedState({
      key: "hasap_large_cache",
      storage: indexedDBStorage,
      paths: [
        "allProductsData",
        "clientsData",
        "projectsData",
        "projectsDataCompanyId",
      ],
      fetchBeforeUse: true,
      filter: (mutation) => {
        if (!mutation?.type) return false;
        return (
          mutation.type.includes("SET_ALL_PRODUCTS_DATA") ||
          mutation.type.includes("SET_CLIENTS_DATA") ||
          mutation.type.includes("SET_PROJECTS_DATA") ||
          mutation.type.includes("SET_PROJECTS_DATA_COMPANY_ID")
        );
      },
      reducer: (state) => ({
        allProductsData: state.allProductsData || [],
        clientsData: state.clientsData || [],
        projectsData: state.projectsData || [],
        projectsDataCompanyId: state.projectsDataCompanyId || null,
        _meta: {
          timestamp: Date.now(),
          version: STORE_CONFIG.cacheVersion,
        },
      }),
      parser: (value) => {
        try {
          const parsed = JSON.parse(value);
          const now = Date.now();
          const meta = parsed._meta || { timestamp: 0 };

          // Проверка TTL для allProductsData
          if (
            Array.isArray(parsed.allProductsData) &&
            parsed.allProductsData.length > 0 &&
            now - meta.timestamp > CACHE_TTL.allProductsData
          ) {
            parsed.allProductsData = [];
          }

          // Проверка TTL для clientsData
          if (
            Array.isArray(parsed.clientsData) &&
            parsed.clientsData.length > 0 &&
            now - meta.timestamp > CACHE_TTL.clients
          ) {
            parsed.clientsData = [];
          }

          // Проверка TTL для projectsData
          if (
            Array.isArray(parsed.projectsData) &&
            parsed.projectsData.length > 0 &&
            now - meta.timestamp > CACHE_TTL.projects
          ) {
            parsed.projectsData = [];
            parsed.projectsDataCompanyId = null;
          }

          // Проверка соответствия projectsData компании
          try {
            const userSettings = JSON.parse(
              localStorage.getItem(
                STORE_CONFIG.localStorageKeys.userSettings
              ) || "{}"
            );
            const currentCompanyId = userSettings.currentCompany?.id || null;
            const projectsDataCompanyId = parsed.projectsDataCompanyId || null;
            if (
              projectsDataCompanyId &&
              currentCompanyId &&
              projectsDataCompanyId !== currentCompanyId
            ) {
              parsed.projectsData = [];
              parsed.projectsDataCompanyId = null;
            }
          } catch {
            // Если не удалось прочитать настройки - пропускаем проверку
          }

          delete parsed._meta;
          return parsed;
        } catch {
          return {
            allProductsData: [],
            clientsData: [],
            projectsData: [],
            projectsDataCompanyId: null,
          };
        }
      },
      assertStorage: (storage) => {
        // Проверка доступности IndexedDB
        if (!window.indexedDB) {
          console.warn("IndexedDB not available");
          return false;
        }
        return true;
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
    const response = await retryWithExponentialBackoff(
      () => api.get("/user/current-company"),
      3
    );
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
