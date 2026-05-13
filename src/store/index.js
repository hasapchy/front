/* eslint-disable no-console -- Vuex store: error/diagnostic logging */
import { createStore } from "vuex";
import {
  indexedDBStorage,
  assertStorageAvailable,
} from "@/cache";
import CACHE_TTL from "@/constants/cacheTTL";
import createPersistedState from "vuex-persistedstate";
import { eventBus } from "@/eventBus";
import { STORE_CONFIG } from "./config";
import { listenStorage } from "./crossTabSync";
import { normClientFilter, normCashFilter } from "./normalize";
import { stripSalaryMenu } from "./menuUtils";
import { mutations } from "./mutations";
import { createActions } from "./actions";
import { getters } from "./getters";

const GLOBAL_REFERENCE_FIELDS = STORE_CONFIG.globalReferenceFields;
const REFERENCES_CACHE_FIELDS = STORE_CONFIG.referencesCacheFields;
const USER_SETTINGS_FIELDS = STORE_CONFIG.userSettingsFields;
const LOADING_FLAGS_TO_RESET = STORE_CONFIG.loadingFlagsToReset;

function sanitizeLargeCacheParsedAgainstUserSettings(parsed, userSettings) {
  const currentCompanyId = userSettings?.currentCompany?.id ?? null;
  const ownerId =
    parsed.largeCacheCompanyId ?? parsed.projectsDataCompanyId ?? null;
  const hasPayload =
    (Array.isArray(parsed.clientsData) && parsed.clientsData.length > 0) ||
    (Array.isArray(parsed.projectsData) && parsed.projectsData.length > 0) ||
    (Array.isArray(parsed.allProductsData) && parsed.allProductsData.length > 0);
  if (!hasPayload) {
    return;
  }
  if (
    ownerId != null &&
    ownerId !== "" &&
    currentCompanyId != null &&
    Number(ownerId) !== Number(currentCompanyId)
  ) {
    parsed.allProductsData = [];
    parsed.clientsData = [];
    parsed.projectsData = [];
    parsed.projectsDataCompanyId = null;
    parsed.largeCacheCompanyId = null;
    return;
  }
  if (
    (ownerId == null || ownerId === "") &&
    currentCompanyId != null
  ) {
    parsed.allProductsData = [];
    parsed.clientsData = [];
    parsed.projectsData = [];
    parsed.projectsDataCompanyId = null;
    parsed.largeCacheCompanyId = null;
  }
}

const refCachePaths = [
  ...GLOBAL_REFERENCE_FIELDS,
  ...REFERENCES_CACHE_FIELDS.filter(
    (field) =>
      field !== "allProductsData" &&
      field !== "clientsData" &&
      field !== "projectsData" &&
      field !== "projectsDataCompanyId"
  ),
];

function normalizeReferenceCacheField(field, value) {
  if (!Array.isArray(value)) {
    return value;
  }

  if (field === "warehouses" || field === "cashRegisters") {
    return value.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }
      const { createdAt, updatedAt, ...rest } = item;
      void createdAt;
      void updatedAt;
      return rest;
    });
  }

  return value;
}

let store;
store = createStore({
    state: {
    user: null,
    permissions: [],
    permissionsLoaded: false,
    settings_open: false,
    mobile_sidebar_nav_open: false,
    searchQuery: "",
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
      roles: false,
      leaveTypes: false,
      orderStatusCategories: false,
      projectContracts: false,
      companyHolidays: false,
      leaves: false,
      companyData: false,
      userCompanies: false,
      userPermissions: false,
      currentCompany: false,
    },
    appInitializing: false,
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
    lastProducts: [], // Последние товары/услуги для ProductSearch (DTO с методами)
    lastProductsData: [], // Plain data для кэширования
    allProducts: [], // ВСЕ товары и услуги для ProductSearch (DTO с методами)
    allProductsData: [], // Plain data для кэширования (30 дней)
    categories: [], // Категории
    projects: [], // Проекты (DTO с методами)
    projectsData: [], // Plain data для кэширования
    projectsDataCompanyId: null, // ✅ Для кого сохранены projectsData
    largeCacheCompanyId: null,
    orderStatuses: [], // Статусы заказов
    projectStatuses: [], // Статусы проектов
    taskStatuses: [], // Статусы задач
    transactionCategories: [], // Категории транзакций
    roles: [], // Роли
    leaveTypes: [], // Типы отпусков
    orderStatusCategories: [], // Категории статусов заказов
    projectContractsByProject: {}, // Контракты по проектам (кэш по projectId)
    companyHolidaysByFilter: {}, // Праздники по фильтрам
    leavesByFilter: {}, // Отпуска по фильтрам
    currentCompany: null, // Текущая выбранная компания
    lastCompanyId: null, // ID последней загруженной компании (для отслеживания смены)
    userCompanies: [], // Список компаний пользователя
    // Кэш данных по компаниям (удаляем, используем только localStorage)
    // companyDataCache: {}, // { companyId: { warehouses: [], clients: [], ... } }
    uiTheme: "light",
    soundEnabled: true,
    // ✅ Флаг синхронизации компании, пришедшей из другой вкладки
    isSyncingCompanyFromOtherTab: false,
    // Фильтр по типу клиента для взаиморасчетов/финансов
    clientTypeFilter: [],
    // Фильтр по кассе для взаиморасчетов
    cashRegisterFilter: [],
    clientBalancesCurrencyId: null,
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
        checklist: true,
      },
      leads: {
        client: true,
        note: true,
        description: false,
        date: true,
        user: false,
        cashRegister: false,
        warehouse: false,
        project: false,
        products: false,
        totalPrice: false,
        paymentStatus: false,
      },
    },
    // Режимы просмотра для разных страниц
    viewModes: {
      leaves: 'table',
      projects: 'kanban',
      orders: 'table',
      leads: 'table',
      tasks: 'kanban',
      clients: 'table',
      users: 'table',
      transactions: 'table',
      sales: 'table',
      invoices: 'table',
      transfers: 'table',
      transactionCategories: 'table',
      listPages: {},
    },
    // Настройки видимости полей карточек в карточном режиме
    cardFields: {},
    newsFilters: null,
    inAppUnreadTotal: 0,
  },

  mutations,
  actions: createActions({ getStore: () => store }),

  getters,
  plugins: [
    // 1. Долгосрочный кэш справочников (localStorage)
    // Исключаем allProductsData, clientsData, projectsData - они в IndexedDB
    createPersistedState({
      key: STORE_CONFIG.localStorageKeys.referencesCache,
      storage: window.localStorage,
      paths: refCachePaths,
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
        const cacheData = {};

        refCachePaths.forEach((field) => {
          if (state[field] !== undefined) {
            cacheData[field] = normalizeReferenceCacheField(field, state[field]);
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
            parsed.clientTypeFilter = normClientFilter(parsed.clientTypeFilter);
          } else if (parsed.clientTypeFilter === undefined) {
            parsed.clientTypeFilter = [];
          }
          if (parsed.cashRegisterFilter !== undefined && parsed.cashRegisterFilter !== null) {
            parsed.cashRegisterFilter = normCashFilter(parsed.cashRegisterFilter);
          } else if (parsed.cashRegisterFilter === undefined) {
            parsed.cashRegisterFilter = [];
          }
          if (parsed.menuItems) {
            parsed.menuItems = stripSalaryMenu(parsed.menuItems);
          }
          if (
            parsed.uiTheme != null &&
            parsed.uiTheme !== "light" &&
            parsed.uiTheme !== "dark"
          ) {
            parsed.uiTheme = "light";
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
            } else if (field === 'clientBalancesCurrencyId') {
              userSettings[field] = state[field] == null ? null : state[field];
            } else if (field === 'newsFilters') {
              userSettings[field] = state[field] ? { ...state[field] } : null;
            } else if (field === "menuItems" && state.menuItems) {
              userSettings[field] = stripSalaryMenu(state.menuItems);
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
        "largeCacheCompanyId",
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
        largeCacheCompanyId: state.largeCacheCompanyId ?? null,
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

          try {
            const userSettings = JSON.parse(
              localStorage.getItem(
                STORE_CONFIG.localStorageKeys.userSettings
              ) || "{}"
            );
            sanitizeLargeCacheParsedAgainstUserSettings(parsed, userSettings);
          } catch {
            void 0;
          }

          delete parsed._meta;
          return parsed;
        } catch {
          return {
            allProductsData: [],
            clientsData: [],
            projectsData: [],
            projectsDataCompanyId: null,
            largeCacheCompanyId: null,
          };
        }
      },
      assertStorage: () => {
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
listenStorage(store);

eventBus.on("company-updated", async () => {
  await store.dispatch("loadUserCompanies");
  const company = await store.dispatch("loadCurrentCompany", {
    forceFromServer: true,
  });
  if (company?.id) {
    store.commit("INCREMENT_LOGO_VERSION");
    eventBus.emit("company-changed", company.id);
  }
});

eventBus.on("cache:invalidate", ({ type, companyId = null }) => {
  store.dispatch("invalidateCache", { type, companyId, skipEventBus: true });
});

export default store;
