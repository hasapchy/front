import { createStore } from "vuex";
import api from "@/api/axiosInstance";
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
import { GLOBAL_REFERENCE_CACHE_SCHEMA, COMPANY_SCOPED_CACHE_SCHEMA } from "./cacheSchema";
import TokenUtils from "@/utils/tokenUtils";
import AuthController from "@/api/AuthController";
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
import RolesController from "@/api/RolesController";
import LeaveTypeController from "@/api/LeaveTypeController";
import OrderStatusCategoryController from "@/api/OrderStatusCategoryController";
import ProjectContractController from "@/api/ProjectContractController";
import CompanyHolidayController from "@/api/CompanyHolidayController";
import LeaveController from "@/api/LeaveController";
import AppController from "@/api/AppController";
import ClientDto from "@/dto/client/ClientDto";
import ProjectDto from "@/dto/project/ProjectDto";
import ProductSearchDto from "@/dto/product/ProductSearchDto";
import { isSimpleWorkerOnly, getUserFromStorage } from "@/utils/userUtils";
import i18n from "@/i18n";
import globalChatRealtime from "@/services/globalChatRealtime";
import { toast } from "vue3-toastify";
import soundManager from "@/utils/soundUtils";

const CLEAR_MUTATIONS_MAPPING = STORE_CONFIG.clearMutationsMapping;
const GLOBAL_REFERENCE_FIELDS = STORE_CONFIG.globalReferenceFields;
const COMPANY_DATA_FIELDS = STORE_CONFIG.companyDataFields;
const FIELDS_WITH_TIMESTAMP = STORE_CONFIG.fieldsWithTimestamp;
const CLIENT_TYPE_FILTER_VALUES = STORE_CONFIG.clientTypeFilterValues;
const REFERENCES_CACHE_FIELDS = STORE_CONFIG.referencesCacheFields;
const USER_SETTINGS_FIELDS = STORE_CONFIG.userSettingsFields;
const LOADING_FLAGS_TO_RESET = STORE_CONFIG.loadingFlagsToReset;

function withoutSalariesReportMenuItem(items) {
  return (items || []).filter((i) => i && i.id !== "salaries-report");
}

function menuItemsWithoutSalariesReport(menuItems) {
  if (!menuItems || typeof menuItems !== "object") {
    return menuItems;
  }
  return {
    ...menuItems,
    main: withoutSalariesReportMenuItem(menuItems.main),
    available: withoutSalariesReportMenuItem(menuItems.available),
  };
}


const normalizeClientTypeFilter = (value) => {
  if (!value || value === "all") {
    return [];
  }

  let rawValues = [];
  if (Array.isArray(value)) {
    rawValues = value;
  } else if (value?.split) {
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
  } else if (value?.split) {
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

const stableStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

const t = (key, params) =>
  i18n?.global?.t ? i18n.global.t(key, params) : String(key);

function handleLoadError(dispatch, entityKey, error) {
  const entity = t(entityKey);
  console.error(`Load error: ${entity}`, error);
  dispatch("showNotification", {
    title: t("error"),
    subtitle: error?.message || t("errorLoadingEntity", { entity }),
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
      enabled: company.roundingEnabled,
      decimals: company.roundingDecimals,
      direction: company.roundingDirection,
      customThreshold: company.roundingCustomThreshold,
    },
    quantity: {
      enabled: company.roundingQuantityEnabled,
      decimals: company.roundingQuantityDecimals,
      direction: company.roundingQuantityDirection,
      customThreshold: company.roundingQuantityCustomThreshold,
    },
  };
}

async function loadCompanyDataIfNeeded(dispatch, state) {
  if (!state.loadingFlags.companyData) {
    await dispatch("loadCompanyData");
  }
}

function productDtoToSearchPlain(p) {
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    description: p.description,
    sku: p.sku,
    image: p.image,
    category_id: p.categoryId,
    category_name: p.categoryName,
    categories: p.categories ?? [],
    stock_quantity: p.stockQuantity,
    unit_id: p.unitId,
    unit_name: p.unitName,
    unit_short_name: p.unitShortName,
    barcode: p.barcode,
    retail_price: p.retailPrice,
    wholesale_price: p.wholesalePrice,
    purchase_price: p.purchasePrice,
  };
}

async function loadProductsForSearch(isProductsOnly, limit = 20) {
  try {
    if (isProductsOnly === true) {
      const res = await retryWithExponentialBackoff(
        () => ProductController.getItems(1, true, {}, limit),
        3
      );
      return {
        items: res.items.map(productDtoToSearchPlain),
      };
    }
    if (isProductsOnly === false) {
      const res = await retryWithExponentialBackoff(
        () => ProductController.getItems(1, false, {}, limit),
        3
      );
      return {
        items: res.items.map(productDtoToSearchPlain),
      };
    }
    const half = Math.ceil(limit / 2);
    const other = Math.max(1, limit - half);
    const [productsRes, servicesRes] = await Promise.all([
      retryWithExponentialBackoff(
        () => ProductController.getItems(1, true, {}, half),
        3
      ),
      retryWithExponentialBackoff(
        () => ProductController.getItems(1, false, {}, other),
        3
      ),
    ]);
    const merged = [...productsRes.items, ...servicesRes.items]
      .sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return tb - ta;
      })
      .slice(0, limit);
    return {
      items: merged.map(productDtoToSearchPlain),
    };
  } catch (error) {
    console.error("Error loading products for search:", error);
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
            _store.commit("SET_CURRENCIES", []);
            await _store.dispatch("loadCompanyData");
            await _store.dispatch("loadCurrencies");
            lastEmittedCompanyId = updatedCompany.id;
            eventBus.emit("company-changed", updatedCompany.id);
          }
        } catch (err) {
        console.error("Current company sync error:", err);
        } finally {
          _store.commit("SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB", false);
        }
      }, 50);
    } catch (error) {
      console.error("Cross-tab sync error:", error);
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
    soundEnabled: true,
    orderStatusesCustomOrder: null,
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
    },
    // Режимы просмотра для разных страниц
    viewModes: {
      leaves: 'table',
      projects: 'kanban',
      orders: 'table',
      tasks: 'kanban',
      clients: 'table',
      users: 'table',
      transactions: 'table',
    },
    // Настройки видимости полей карточек в карточном режиме
    cardFields: {},
    newsFilters: null,
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
    SET_ROLES(state, roles) {
      state.roles = roles;
    },
    SET_LEAVE_TYPES(state, leaveTypes) {
      state.leaveTypes = leaveTypes;
    },
    SET_ORDER_STATUS_CATEGORIES(state, orderStatusCategories) {
      state.orderStatusCategories = orderStatusCategories;
    },
    SET_PROJECT_CONTRACTS_FOR_PROJECT(state, { projectId, items }) {
      state.projectContractsByProject = {
        ...state.projectContractsByProject,
        [projectId]: Array.isArray(items) ? items : [],
      };
    },
    SET_COMPANY_HOLIDAYS_FOR_FILTER(state, { filterKey, items }) {
      state.companyHolidaysByFilter = {
        ...state.companyHolidaysByFilter,
        [filterKey]: Array.isArray(items) ? items : [],
      };
    },
    SET_LEAVES_FOR_FILTER(state, { filterKey, items }) {
      state.leavesByFilter = {
        ...state.leavesByFilter,
        [filterKey]: Array.isArray(items) ? items : [],
      };
    },
    INCREMENT_LOGO_VERSION(state) {
      state.logoVersion = (state.logoVersion || 0) + 1;
    },
    SET_TRANSACTION_CATEGORIES(state, transactionCategories) {
      state.transactionCategories = transactionCategories;
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
      state.clientBalancesCurrencyId = null;
      state.loggedDataFlags = {
        warehouses: false,
        cashRegisters: false,
        clients: false,
        categories: false,
        projects: false,
      };
      state.projectContractsByProject = {};
      state.companyHolidaysByFilter = {};
      state.leavesByFilter = {};
    },
    SET_CURRENT_COMPANY(state, company) {
      // if (state.currentCompany?.id === company?.id) {
      //   return;
      // }

      if (company && state.currentCompany?.id === company?.id) {
        // Если ID тот же, обновляем данные (для обновления work_schedule и других полей)
        state.currentCompany = company;
        logCompanyRoundingSettings(company);
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
    SET_APP_INITIALIZING(state, value) {
      state.appInitializing = value;
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
    SET_CLIENT_BALANCES_CURRENCY_ID(state, value) {
      state.clientBalancesCurrencyId = value == null ? null : value;
    },
    SET_ORDER_STATUSES_CUSTOM_ORDER(state, order) {
      state.orderStatusesCustomOrder = order;
    },
    SET_MENU_ITEMS(state, { main, available }) {
      state.menuItems.main = withoutSalariesReportMenuItem(main);
      state.menuItems.available = withoutSalariesReportMenuItem(available);
    },
    UPDATE_MENU_ITEMS(state, { type, items }) {
      if (type === "main" || type === "available") {
        state.menuItems[type] = withoutSalariesReportMenuItem(items);
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
    SET_CARD_FIELDS(state, fields) {
      state.cardFields = fields || {};
    },
    UPDATE_CARD_FIELDS(state, { storageKey, fields }) {
      if (!storageKey) {
        return;
      }
      if (!state.cardFields) {
        state.cardFields = {};
      }
      const prev = state.cardFields[storageKey] || {};
      state.cardFields[storageKey] = { ...prev, ...fields };
    },
    SET_NEWS_FILTERS(state, payload) {
      state.newsFilters = payload ? { ...payload } : null;
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
    SET_TASKS_VIEW_MODE(state, mode) {
      if (['table', 'kanban'].includes(mode)) {
        state.viewModes.tasks = mode;
      }
    },
    SET_CLIENTS_VIEW_MODE(state, mode) {
      if (['table', 'cards'].includes(mode)) {
        state.viewModes.clients = mode;
      }
    },
    SET_USERS_VIEW_MODE(state, mode) {
      if (['table', 'cards'].includes(mode)) {
        state.viewModes.users = mode;
      }
    },
    SET_TRANSACTIONS_VIEW_MODE(state, mode) {
      if (['table', 'cards'].includes(mode)) {
        state.viewModes.transactions = mode;
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
            console.warn(`Load timeout: ${type}`);
            reject(new Error(t("loadTimeout")));
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
    setClientBalancesCurrencyId({ commit }, value) {
      commit("SET_CLIENT_BALANCES_CURRENCY_ID", value);
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
      _context,
      { title, subtitle = "", isDanger = false, isInfo = false, duration = 10000 }
    ) {
      const content = subtitle ? `${title}\n${subtitle}` : title;
      const opts = { autoClose: duration };
      if (isDanger) {
        toast.error(content, opts);
        soundManager.playError();
      } else if (isInfo) {
        toast.info(content, opts);
      } else {
        toast.success(content, opts);
        soundManager.playSuccess();
      }
    },
    closeNotification() {
      toast.remove();
    },
    async loadUnits(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.units;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: `⚙️ ${t("unit")}`,
        fetchFn: async () => {
          const apiInstance = api;
          const response = await apiInstance.get("/app/units");
          return response.data.data;
        },
      });
    },
    async loadCurrencies(context) {
      const { commit, state } = context;
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.currencies;
      const companyId = state.currentCompany?.id || "default";
      const cacheKey = companyScopedKey(schema.key, companyId);
      const ttl = schema.ttl;

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
          (c) => c.isDefault === true
        );

        if (hasAccessToOtherCurrencies && onlyDefaultInCache) {
          commit("SET_CURRENCIES", []);
        } else {
          return;
        }
      }

      await loadGlobalReference(context, {
        cacheKey,
        ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: `💱 ${t("currency")}`,
        fetchFn: async () => {
          return AppController.getCurrencies();
        },
      });
    },
    async loadUsers(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.users;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: `👥 ${t("users")}`,
        fetchFn: async () => {
          return await UsersController.getListItems();
        },
      });
    },
    async loadWarehouses(context) {
      const schema = COMPANY_SCOPED_CACHE_SCHEMA.warehouses;
      await loadCompanyScopedData(context, {
        loadingFlagKey: schema.loadingFlag,
        stateKey: schema.stateKey,
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: schema.keyPrefix,
        cacheTtl: schema.ttl,
        clearMutations: schema.clearMutations,
        loggedFlagKey: "warehouses",
        logEmoji: "📦",
        logName: t("warehouses"),
        fetchData: async () => {
          return await WarehouseController.getListItems();
        },
        errorName: "warehouses",
        onError: handleLoadError,
      });
    },
    async loadCashRegisters(context) {
      const schema = COMPANY_SCOPED_CACHE_SCHEMA.cashRegisters;
      await loadCompanyScopedData(context, {
        loadingFlagKey: schema.loadingFlag,
        stateKey: schema.stateKey,
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: schema.keyPrefix,
        cacheTtl: schema.ttl,
        clearMutations: schema.clearMutations,
        loggedFlagKey: "cashRegisters",
        logEmoji: "💰",
        logName: t("cashRegister"),
        fetchData: async () => {
          return await CashRegisterController.getListItems();
        },
        errorName: "cashRegister",
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
        const clients = ClientDto.fromApiArray(state.clientsData);
        commit("SET_CLIENTS", clients);
        return;
      }

      if (
        Array.isArray(state.clients) &&
        state.clients.length > 0 &&
        isFreshByKey(cacheKey, ttl)
      ) {
        if (!state.loggedDataFlags.clients) {
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
      } catch (error) {
        commit("SET_CLIENTS", []);
        commit("SET_CLIENTS_DATA", []);
        handleLoadError(dispatch, "clients", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "clients", loading: false });
      }
    },
    async loadCategories(context) {
      const schema = COMPANY_SCOPED_CACHE_SCHEMA.categories;
      await loadCompanyScopedData(context, {
        loadingFlagKey: schema.loadingFlag,
        stateKey: schema.stateKey,
        companyId: context.state.currentCompany?.id,
        cacheKeyPrefix: schema.keyPrefix,
        cacheTtl: schema.ttl,
        clearMutations: schema.clearMutations,
        loggedFlagKey: "categories",
        logEmoji: "✅",
        logName: t("category"),
        fetchData: async () => {
          return await CategoryController.getListItems();
        },
        errorName: "category",
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
      } catch (error) {
        commit("SET_PROJECTS", []);
        commit("SET_PROJECTS_DATA", []);
        handleLoadError(dispatch, "projects", error);
      } finally {
        commit("SET_LOADING_FLAG", { type: "projects", loading: false });
      }
    },
    async loadProductsForSearch(
      { commit, state },
      { limit = 20, force = false, isProductsOnly = null }
    ) {
      const isLastProducts = limit === 20;
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
        const results = await loadProductsForSearch(isProductsOnly, limit);
        const products = ProductSearchDto.fromApiArray(results.items);
        commit(setProductsMutation, products);
        commit(
          setProductsDataMutation,
          results.items.map((item) => ({ ...item }))
        );
      } catch (error) {
        console.error(
          `Error loading items for search (limit: ${limit}):`,
          error
        );
        commit(setProductsMutation, []);
        commit(setProductsDataMutation, []);
      }
    },
    async loadLastProducts(context) {
      return context.dispatch("loadProductsForSearch", {
        limit: 20,
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
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.orderStatuses;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "📊 Order statuses",
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
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.projectStatuses;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "🎯 Project statuses",
        fetchFn: async () => {
          return await ProjectStatusController.getListItems();
        },
      });
    },
    async loadTaskStatuses(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.taskStatuses;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "🎯 Task statuses",
        fetchFn: async () => {
          const TaskStatusController = (
            await import("@/api/TaskStatusController")
          ).default;
          return await TaskStatusController.getListItems();
        },
      });
    },
    async loadTransactionCategories(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.transactionCategories;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "💳 Transaction categories",
        fetchFn: async () => {
          return await TransactionCategoryController.getListItems();
        },
      });
    },
    async loadRoles(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.roles;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "🛡️ Roles",
        fetchFn: async () => {
          return await RolesController.getListItems();
        },
      });
    },
    async loadLeaveTypes(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.leaveTypes;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "🏖️ Leave types",
        fetchFn: async () => {
          return await LeaveTypeController.getListItems();
        },
      });
    },
    async loadOrderStatusCategories(context) {
      const schema = GLOBAL_REFERENCE_CACHE_SCHEMA.orderStatusCategories;
      await loadGlobalReference(context, {
        cacheKey: schema.key,
        ttl: schema.ttl,
        mutation: schema.mutation,
        loadingFlag: schema.loadingFlag,
        stateKey: schema.stateKey,
        logName: "🧩 Order status categories",
        fetchFn: async () => {
          return await OrderStatusCategoryController.getListItems();
        },
      });
    },
    async loadProjectContractsByProject(context, projectId) {
      const { commit, state, dispatch } = context;
      const normalizedProjectId = Number(projectId);
      if (!normalizedProjectId) {
        return [];
      }

      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit("SET_PROJECT_CONTRACTS_FOR_PROJECT", { projectId: normalizedProjectId, items: [] });
        return [];
      }

      if (state.loadingFlags.projectContracts) {
        await dispatch("waitForLoading", "projectContracts");
      }

      const cacheKey = `projectContracts_${companyId}_${normalizedProjectId}`;
      const ttl = CACHE_TTL.projectContracts;
      const cachedContracts = state.projectContractsByProject?.[normalizedProjectId] || [];

      if (Array.isArray(cachedContracts) && cachedContracts.length > 0 && isFreshByKey(cacheKey, ttl)) {
        return cachedContracts;
      }

      commit("SET_LOADING_FLAG", { type: "projectContracts", loading: true });
      try {
        const items = await ProjectContractController.getListItems(normalizedProjectId);
        commit("SET_PROJECT_CONTRACTS_FOR_PROJECT", { projectId: normalizedProjectId, items });
        touchKey(cacheKey);
        return items;
      } catch (error) {
        commit("SET_PROJECT_CONTRACTS_FOR_PROJECT", { projectId: normalizedProjectId, items: [] });
        handleLoadError(dispatch, "project contracts", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "projectContracts", loading: false });
      }
    },
    async loadCompanyHolidays(context, filters = {}) {
      const { commit, state, dispatch } = context;
      const companyId = state.currentCompany?.id || "default";
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const filterKey = stableStringify(normalizedFilters);
      const cacheKey = `companyHolidays_${companyId}_${filterKey}`;
      const ttl = CACHE_TTL.companyHolidays;
      const cached = state.companyHolidaysByFilter?.[filterKey] || [];

      if (Array.isArray(cached) && cached.length > 0 && isFreshByKey(cacheKey, ttl)) {
        return cached;
      }

      commit("SET_LOADING_FLAG", { type: "companyHolidays", loading: true });
      try {
        const items = await CompanyHolidayController.getListItems(normalizedFilters);
        commit("SET_COMPANY_HOLIDAYS_FOR_FILTER", { filterKey, items });
        touchKey(cacheKey);
        return items;
      } catch (error) {
        commit("SET_COMPANY_HOLIDAYS_FOR_FILTER", { filterKey, items: [] });
        handleLoadError(dispatch, "company holidays", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "companyHolidays", loading: false });
      }
    },
    async loadLeavesByFilters(context, filters = {}) {
      const { commit, state, dispatch } = context;
      const companyId = state.currentCompany?.id || "default";
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const filterKey = stableStringify(normalizedFilters);
      const cacheKey = `leaves_${companyId}_${filterKey}`;
      const ttl = CACHE_TTL.leaves;
      const cached = state.leavesByFilter?.[filterKey] || [];

      if (Array.isArray(cached) && cached.length > 0 && isFreshByKey(cacheKey, ttl)) {
        return cached;
      }

      commit("SET_LOADING_FLAG", { type: "leaves", loading: true });
      try {
        const items = await LeaveController.getListItems(normalizedFilters);
        commit("SET_LEAVES_FOR_FILTER", { filterKey, items });
        touchKey(cacheKey);
        return items;
      } catch (error) {
        commit("SET_LEAVES_FOR_FILTER", { filterKey, items: [] });
        handleLoadError(dispatch, "leaves", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "leaves", loading: false });
      }
    },
    // Загрузка всех данных компании
    async loadCompanyData({ dispatch, commit, state, rootGetters }) {
      if (rootGetters.isSimpleMode) {
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
              title: t("warning"),
              subtitle: t("someCriticalDataNotLoaded"),
              isDanger: false,
              duration: 3000,
            });
          }
        }

        commit("SET_LAST_COMPANY_ID", companyId);
      } catch (error) {
        console.error("Company data load error:", error);
        dispatch("showNotification", {
          title: t("error"),
          subtitle: error.message || t("errorLoadingCompanyData"),
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
        // const isSimpleWorker = isSimpleWorkerOnly(userFromStorage);

        const userData = await AuthController.getUser();

        if (!userData) {
          throw new Error(t("failedToFetchUserData"));
        }

        const isNewUser = !state.user || Number(state.user.id) !== Number(userData.user?.id);
        if (isNewUser) {
          commit("SET_CURRENT_COMPANY", null);
        }

        commit("SET_APP_INITIALIZING", true);
        await dispatch("setUser", userData.user);
        await dispatch("setPermissions", userData.permissions);
        try {
          await dispatch("loadUnits");
          await dispatch("loadUserCompanies");
          await dispatch("loadCurrentCompany", { skipPermissionRefresh: false });
          await dispatch("loadCurrencies");
          await dispatch("initializeMenu");
        } catch (error) {
          console.error("Error loading companies:", error);
        } finally {
          commit("SET_APP_INITIALIZING", false);
        }

        try {
          await globalChatRealtime.initialize(store);
        } catch (error) {
          console.error("[Store] Ошибка инициализации глобального chatRealtime:", error);
        }

        return { authenticated: true };
      } catch (error) {
        console.error("Error fetching user:", error);
        commit("SET_APP_INITIALIZING", false);
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
        const companies = CompanyDto.fromApiArray(response.data.data);
        commit("SET_USER_COMPANIES", companies);
        return companies;
      } catch (error) {
        console.error("Error loading user companies:", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "userCompanies", loading: false });
      }
    },
    async loadCurrentCompany({ commit, dispatch, state }, options = {}) {
      if (state.loadingFlags.currentCompany) {
        return state.currentCompany;
      }

      const refreshPermissions = async () => {
        if (!options.skipPermissionRefresh) {
          await dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: false });
        }
      };

      commit("SET_LOADING_FLAG", { type: "currentCompany", loading: true });
      try {
        if (state.currentCompany?.id) {
          const normalized = new CompanyDto(state.currentCompany);
          commit("SET_CURRENT_COMPANY", normalized);
          await loadCompanyDataIfNeeded(dispatch, state);
          await refreshPermissions();
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
            await refreshPermissions();
            return lastCompany;
          }
        }

        const response = await retryWithExponentialBackoff(
          () => api.get("/user/current-company"),
          3
        );
        const company = new CompanyDto(response.data.data);
        commit("SET_CURRENT_COMPANY", company);

        if (company?.id) {
          await loadCompanyDataIfNeeded(dispatch, state);
          await refreshPermissions();
        }

        return company;
      } catch (error) {
        console.error(
          "[loadCurrentCompany] Error loading current company:",
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
        const company = new CompanyDto(response.data.data);

        commit("SET_CURRENT_COMPANY", company);

        if (oldCompanyId && oldCompanyId !== companyId) {
          await clearAllCacheOnCompanyChange();
        }

        commit("CLEAR_COMPANY_DATA");
        commit("SET_CURRENCIES", []);
        commit("SET_MENU_ITEMS", { main: [], available: [] });
        await dispatch("loadCompanyData");
        await dispatch("loadCurrencies");
        await dispatch("refreshUserPermissions", { skipIfAlreadyLoaded: false });
        await dispatch("initializeMenu");
        eventBus.emit("company-changed", companyId);

        // Подписываем чат на каналы новой компании (presence и чаты)
        if (globalChatRealtime.initialized) {
          await globalChatRealtime.reinitialize();
        } else {
          await globalChatRealtime.initialize(store);
        }

        return company;
      } catch (error) {
        console.error("Error setting current company:", error);
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
        const response = await retryWithExponentialBackoff(
          () => AuthController.getUser(),
          3
        );
        const permissions = response.permissions;
        commit("SET_USER", response.user);
        commit("SET_PERMISSIONS", permissions);
        return response;
      } catch (error) {
        console.error("Error updating user permissions:", error);
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
      // Очищаем глобальный chatRealtime при выходе
      globalChatRealtime.cleanup();
      
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
      if (state.menuItems && state.menuItems.main && state.menuItems.main.length > 0) {
        return;
      }

      const savedMenu = state.menuItems && state.menuItems.main && state.menuItems.main.length > 0 
        ? state.menuItems 
        : null;

      const allMenuItems = [
        {
          id: "orders",
          to: "/orders",
          icon: "fas fa-cart-arrow-down mr-2",
          label: "orders",
          permission: "orders_view",
        },
        {
          id: "simple-orders",
          to: "/simple-orders",
          icon: "fas fa-cart-arrow-down mr-2",
          label: "orders_simple",
          permission: "orders_simple_view",
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
          id: "messenger",
          to: "/messenger",
          icon: "fas fa-comments mr-2",
          label: "messenger",
          permission: "chats_view_all",
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
          permission: "departments_view_all",
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
        {
          id: "message-templates",
          to: "/message-templates",
          icon: "fa-solid fa-file-alt mr-2",
          label: "messageTemplates",
          permission: "templates_view",
        },
        {
          id: "reports",
          to: "/reports",
          icon: "fa-solid fa-chart-pie mr-2",
          label: "reports",
          permission: "reports_view",
        },
      ];

      const defaultMain = [
        "orders",
        "simple-orders",
        "sales",
        "tasks",
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
        "message-templates",
        "reports",
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
          item.id &&
          !seenIds.has(item.id)
        ) {
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
      }

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
    },
    updateBothMenuLists({ commit, state }, { mainItems, availableItems }) {
      if (!Array.isArray(mainItems) || !Array.isArray(availableItems)) {
        console.error("updateBothMenuLists: both arguments must be arrays");
        return;
      }

      const mainUnique = [];
      const mainSeenIds = new Set();
      for (const item of mainItems) {
        if (item && item.id) {
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
        if (item && item.id) {
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
    setTasksViewMode({ commit }, mode) {
      commit('SET_TASKS_VIEW_MODE', mode);
    },
    setClientsViewMode({ commit }, mode) {
      commit('SET_CLIENTS_VIEW_MODE', mode);
    },
    setTransactionsViewMode({ commit }, mode) {
      commit('SET_TRANSACTIONS_VIEW_MODE', mode);
    },
    setUsersViewMode({ commit }, mode) {
      commit('SET_USERS_VIEW_MODE', mode);
    },
  },

  getters: {
    user: (state) => state.user,
    permissions: (state) => state.permissions,
    hasPermission: (state) => (perm) => {
      return checkPermission(perm, state.permissions, state.user);
    },
    activeApiCalls: (state) => state.activeApiCalls,
    isSimpleMode: (state) => {
      // Проверяем, находимся ли мы в simple режиме по роли пользователя
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
    roles: (state) => state.roles,
    leaveTypes: (state) => state.leaveTypes,
    orderStatusCategories: (state) => state.orderStatusCategories,
    projectContractsByProject: (state) => state.projectContractsByProject,
    companyHolidaysByFilter: (state) => state.companyHolidaysByFilter,
    leavesByFilter: (state) => state.leavesByFilter,
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
      return currency ? currency.symbol : t("noCurrency");
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
      const decimals = state.currentCompany?.roundingDecimals;
      logRoundingGetter("Rounding decimals", decimals, state);
      return decimals;
    },
    roundingEnabled: (state) => {
      const enabled = state.currentCompany?.roundingEnabled ?? true;
      logRoundingGetter("Rounding enabled", enabled, state);
      return enabled;
    },
    roundingDirection: (state) => {
      const direction = state.currentCompany?.roundingDirection || "standard";
      logRoundingGetter(
        "Rounding direction",
        {
          direction,
          customThreshold: state.currentCompany?.roundingCustomThreshold,
        },
        state
      );
      return direction;
    },
    roundingCustomThreshold: (state) =>
      state.currentCompany?.roundingCustomThreshold ?? 0.5,
    roundingQuantityDecimals: (state) => {
      const decimals = state.currentCompany?.roundingQuantityDecimals ?? 2;
      logRoundingGetter("Rounding quantity decimals", decimals, state);
      return decimals;
    },
    roundingQuantityEnabled: (state) => {
      const enabled = state.currentCompany?.roundingQuantityEnabled ?? true;
      logRoundingGetter("Rounding quantity enabled", enabled, state);
      return enabled;
    },
    roundingQuantityDirection: (state) => {
      const direction =
        state.currentCompany?.roundingQuantityDirection || "standard";
      logRoundingGetter(
        "Rounding quantity direction",
        {
          direction,
          customThreshold:
            state.currentCompany?.roundingQuantityCustomThreshold,
        },
        state
      );
      return direction;
    },
    roundingQuantityCustomThreshold: (state) =>
      state.currentCompany?.roundingQuantityCustomThreshold ?? 0.5,
    clientTypeFilter: (state) =>
      normalizeClientTypeFilter(state.clientTypeFilter),
    clientBalancesCurrencyId: (state) => state.clientBalancesCurrencyId,
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

        if (item.id === "salaries-report") {
          return false;
        }

        if (item.id === "simple-orders" && getters.hasPermission("orders_view")) {
          return false;
        }

        if (item.id === "mutual-settlements" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if ((item.id === "org-structure" || item.id === "roles") && getters.hasPermission("users_view")) {
          return false;
        }

        if (item.id === "cash-registers" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if (item.id === "invoices" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if (item.id === "contracts" && getters.hasPermission("projects_view")) {
          return false;
        }
        
        if (item.id === 'simple-orders') {
          return getters.hasPermission('orders_simple_view') && !getters.hasPermission('orders_view');
        }
        
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

        if (item.id === "salaries-report") {
          return false;
        }

        if (item.id === "simple-orders" && getters.hasPermission("orders_view")) {
          return false;
        }

        if (item.id === "mutual-settlements" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if ((item.id === "org-structure" || item.id === "roles") && getters.hasPermission("users_view")) {
          return false;
        }

        if (item.id === "cash-registers" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if (item.id === "invoices" && getters.hasPermission("transactions_view")) {
          return false;
        }

        if (item.id === "contracts" && getters.hasPermission("projects_view")) {
          return false;
        }
        
        if (item.id === 'simple-orders') {
          return getters.hasPermission('orders_simple_view') && !getters.hasPermission('orders_view');
        }
        
        if (!item.permission) return true;
        return getters.hasPermission(item.permission);
      });
    },
    leavesViewMode: (state) => state.viewModes.leaves || 'table',
    projectsViewMode: (state) => state.viewModes.projects || 'kanban',
    ordersViewMode: (state) => state.viewModes.orders || 'table',
    tasksViewMode: (state) => state.viewModes.tasks || 'kanban',
    clientsViewMode: (state) => state.viewModes.clients || 'table',
    usersViewMode: (state) => state.viewModes.users || 'table',
    transactionsViewMode: (state) => state.viewModes.transactions || 'table',
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
          if (parsed.menuItems) {
            parsed.menuItems = menuItemsWithoutSalariesReport(parsed.menuItems);
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
              userSettings[field] = menuItemsWithoutSalariesReport(state.menuItems);
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
      "[Company Updated] Error loading updated company:",
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
