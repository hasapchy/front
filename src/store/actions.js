/* eslint-disable no-console -- Vuex store actions */
import api from "@/api/axiosInstance";
import CacheInvalidator, {
  companyScopedKey,
  isFreshByKey,
  touchKey,
  loadGlobalReference,
  loadCompanyScopedData,
  retryWithExponentialBackoff,
} from "@/cache";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import CACHE_TTL from "@/constants/cacheTTL";
import { hasPermission as checkPermission } from "@/permissions";
import { STORE_CONFIG } from "./config";
import { GLOBAL_REFERENCE_CACHE_SCHEMA, COMPANY_SCOPED_CACHE_SCHEMA } from "./cacheSchema";
import { ALL_MENU_DEFINITIONS, defaultMenuFromCatalog } from "./defaultMenu";
import { syncCompany } from "./crossTabSync";
import { stableKey } from "./normalize";
import { mergeMenus } from "./menuUtils";
import { fetchSearchProducts } from "./productSearchFetch";
import TokenUtils from "@/utils/tokenUtils";
import AuthController from "@/api/AuthController";
import UsersController from "@/api/UsersController";
import WarehouseController from "@/api/WarehouseController";
import CashRegisterController from "@/api/CashRegisterController";
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
import i18n from "@/i18n";
import globalChatRealtime from "@/services/globalChatRealtime";
import inAppNotificationsRealtime from "@/services/inAppNotificationsRealtime";
import InAppNotificationController from "@/api/InAppNotificationController";
import { toast } from "vue3-toastify";
import soundManager from "@/utils/soundUtils";

const CLEAR_MUTATIONS_MAPPING = STORE_CONFIG.clearMutationsMapping;

const t = (key, params) =>
  i18n?.global?.t ? i18n.global.t(key, params) : String(key);

function loadFailed(dispatch, entityKey, error) {
  const entity = t(entityKey);
  console.error(`Load error: ${entity}`, error);
  dispatch("showNotification", {
    title: t("error"),
    subtitle: error?.message || t("errorLoadingEntity", { entity }),
    isDanger: true,
  });
}

async function ensureCompanyData(dispatch, state) {
  if (!state.loadingFlags.companyData) {
    await dispatch("loadCompanyData");
  }
}

const viewModeActions = Object.fromEntries(
  [
    ["setLeavesViewMode", "SET_LEAVES_VIEW_MODE"],
    ["setProjectsViewMode", "SET_PROJECTS_VIEW_MODE"],
    ["setOrdersViewMode", "SET_ORDERS_VIEW_MODE"],
    ["setTasksViewMode", "SET_TASKS_VIEW_MODE"],
    ["setClientsViewMode", "SET_CLIENTS_VIEW_MODE"],
    ["setUsersViewMode", "SET_USERS_VIEW_MODE"],
    ["setTransactionsViewMode", "SET_TRANSACTIONS_VIEW_MODE"],
    ["setSalesViewMode", "SET_SALES_VIEW_MODE"],
    ["setInvoicesViewMode", "SET_INVOICES_VIEW_MODE"],
    ["setTransfersViewMode", "SET_TRANSFERS_VIEW_MODE"],
    ["setTransactionCategoriesViewMode", "SET_TRANSACTION_CATEGORIES_VIEW_MODE"],
  ].map(([actionName, mutation]) => [
    actionName,
    ({ commit }, mode) => {
      commit(mutation, mode);
    },
  ])
);

export function createActions({ getStore }) {
  return {
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
    ...viewModeActions,
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
        onError: loadFailed,
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
        onError: loadFailed,
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
        loadFailed(dispatch, "clients", error);
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
        onError: loadFailed,
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
        loadFailed(dispatch, "projects", error);
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
        const results = await fetchSearchProducts(isProductsOnly, limit);
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
    async loadAllProducts(context) {
      return context.dispatch("loadProductsForSearch", {
        limit: 1000,
        isProductsOnly: true,
      });
    },
    async loadOrderStatuses(context) {
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
        loadFailed(dispatch, "project contracts", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "projectContracts", loading: false });
      }
    },
    async loadCompanyHolidays(context, filters = {}) {
      const { commit, state, dispatch } = context;
      const companyId = state.currentCompany?.id || "default";
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const filterKey = stableKey(normalizedFilters);
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
        loadFailed(dispatch, "company holidays", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "companyHolidays", loading: false });
      }
    },
    async loadLeavesByFilters(context, filters = {}) {
      const { commit, state, dispatch } = context;
      const companyId = state.currentCompany?.id || "default";
      const normalizedFilters = filters && typeof filters === "object" ? filters : {};
      const filterKey = stableKey(normalizedFilters);
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
        loadFailed(dispatch, "leaves", error);
        return [];
      } finally {
        commit("SET_LOADING_FLAG", { type: "leaves", loading: false });
      }
    },
    // Загрузка всех данных компании
    async loadCompanyData({ dispatch, commit, state, rootGetters }) {
      if (rootGetters.isSimpleUserAccount) {
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
    async initializeApp({ commit, dispatch, state }, options = {}) {
      commit("SET_PERMISSIONS_LOADED", false);
      await dispatch("setPermissions", []);

      try {
        const maxGetUserAttempts = options.afterLogin ? 3 : 1;
        let userData = null;
        for (let attempt = 0; attempt < maxGetUserAttempts; attempt++) {
          userData = await AuthController.getUser();
          if (userData) {
            break;
          }
          if (attempt + 1 < maxGetUserAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 75));
          }
        }

        if (!userData) {
          TokenUtils.clearAuthData();
          inAppNotificationsRealtime.cleanup();
          commit("SET_IN_APP_UNREAD_TOTAL", 0);
          await dispatch("setUser", null);
          await dispatch("setPermissions", []);
          await dispatch("initializeMenu");
          return { authenticated: false };
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
          await globalChatRealtime.initialize(getStore());
        } catch (error) {
          console.error("[Store] Ошибка инициализации глобального chatRealtime:", error);
        }

        try {
          await inAppNotificationsRealtime.initialize(getStore());
          await dispatch("refreshInAppUnreadTotal");
        } catch (error) {
          console.error("[Store] inAppNotificationsRealtime:", error);
        }

        return { authenticated: true };
      } catch (error) {
        console.error("Error fetching user:", error);
        commit("SET_APP_INITIALIZING", false);
        inAppNotificationsRealtime.cleanup();
        commit("SET_IN_APP_UNREAD_TOTAL", 0);
        await dispatch("setUser", null);
        await dispatch("setPermissions", []);
        TokenUtils.clearAuthData();
        await dispatch("initializeMenu");
        return { authenticated: false };
      }
    },
    async refreshInAppUnreadTotal({ commit, state }) {
      if (!state.user?.id || !state.currentCompany?.id) {
        commit("SET_IN_APP_UNREAD_TOTAL", 0);
        return;
      }
      try {
        const res = await InAppNotificationController.list({ per_page: 1 });
        const total = res?.meta?.unread_total;
        if (typeof total === "number") {
          commit("SET_IN_APP_UNREAD_TOTAL", total);
        }
      } catch {
        void 0;
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
        if (!options.forceFromServer) {
          if (state.currentCompany?.id) {
            const normalized = new CompanyDto(state.currentCompany);
            commit("SET_CURRENT_COMPANY", normalized);
            await ensureCompanyData(dispatch, state);
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
              await ensureCompanyData(dispatch, state);
              await refreshPermissions();
              return lastCompany;
            }
          }
        }

        const response = await retryWithExponentialBackoff(
          () => api.get("/user/current-company"),
          3
        );
        const company = new CompanyDto(response.data.data);
        commit("SET_CURRENT_COMPANY", company);

        if (company?.id) {
          await ensureCompanyData(dispatch, state);
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
    async setCurrentCompany({ commit }, companyId) {
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

        try {
          localStorage.setItem(
            STORE_CONFIG.localStorageKeys.companyContextSync,
            String(Date.now())
          );
        } catch {
          void 0;
        }

        await syncCompany(this, oldCompanyId, companyId);

        return company;
      } catch (error) {
        console.error("Error setting current company:", error);
        commit("SET_LOADING_FLAG", { type: "companyData", loading: false });
        throw error;
      }
    },
    async refreshUserPermissions({ commit, state }, options = {}) {
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
        if (!response?.user) {
          return null;
        }
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
      { commit },
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
    initializeMenu({ commit, state }) {
      const persistedHadLists =
        state.menuItems &&
        ((state.menuItems.main?.length ?? 0) > 0 ||
          (state.menuItems.available?.length ?? 0) > 0);

      const baseMenuFromState = persistedHadLists
        ? {
            main: state.menuItems.main || [],
            available: state.menuItems.available || [],
          }
        : null;

      const defaults = defaultMenuFromCatalog();
      const baseMenu = baseMenuFromState || defaults;
      const baseMainIds = new Set((baseMenu.main || []).map((i) => i.id));
      const baseAvailableIds = new Set((baseMenu.available || []).map((i) => i.id));

      const missingItems = ALL_MENU_DEFINITIONS.filter(
        (i) => i && i.id && !baseMainIds.has(i.id) && !baseAvailableIds.has(i.id)
      );

      commit("SET_MENU_ITEMS", {
        main: baseMenu.main || [],
        available: [...(baseMenu.available || []), ...missingItems],
      });
    },
    updateBothMenuLists({ commit }, { mainItems, availableItems }) {
      if (!Array.isArray(mainItems) || !Array.isArray(availableItems)) {
        console.error("updateBothMenuLists: both arguments must be arrays");
        return;
      }
      const pickMenu = (item) => ({
        id: item.id,
        to: item.to,
        icon: item.icon,
        label: item.label,
        permission: item.permission,
        permissions: item.permissions,
      });
      const current = mergeMenus(mainItems, availableItems, pickMenu);
      commit("SET_MENU_ITEMS", current);
    },
    setListPageViewMode({ commit }, payload) {
      commit('SET_LIST_PAGE_VIEW_MODE', payload);
    },

  };
}
