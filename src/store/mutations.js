import { STORE_CONFIG } from "./config";
import { normClientFilter, normCashFilter } from "./normalize";
import { dropSalaryReport } from "./menuUtils";

const COMPANY_DATA_FIELDS = STORE_CONFIG.companyDataFields;

export const mutations = {
  SET_USER(state, user) {
    state.user = user;
    if (!user) {
      state.mobile_sidebar_nav_open = false;
    }
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
  SET_IN_APP_UNREAD_TOTAL(state, value) {
    const n = Number(value);
    state.inAppUnreadTotal = Number.isFinite(n) && n >= 0 ? n : 0;
  },
  IN_APP_NOTIFICATION_RECEIVED(state, payload) {
    if (payload && !payload.read_at) {
      state.inAppUnreadTotal = (state.inAppUnreadTotal || 0) + 1;
    }
  },
  ADJUST_IN_APP_UNREAD_TOTAL(state, delta) {
    const next = (state.inAppUnreadTotal || 0) + Number(delta);
    state.inAppUnreadTotal = next < 0 ? 0 : next;
  },
  SET_MOBILE_SIDEBAR_NAV_OPEN(state, value) {
    state.mobile_sidebar_nav_open = value;
  },
  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query;
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
    if (company && state.currentCompany?.id === company?.id) {
      state.currentCompany = company;
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
  SET_UI_THEME(state, theme) {
    state.uiTheme = theme === "dark" ? "dark" : "light";
  },
  SET_LOADING_FLAG(state, { type, loading }) {
    state.loadingFlags[type] = loading;
  },
  SET_APP_INITIALIZING(state, value) {
    state.appInitializing = value;
  },
  SET_LOGGED_DATA_FLAG(state, { type, logged }) {
    state.loggedDataFlags[type] = logged;
  },
  SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB(state, value) {
    state.isSyncingCompanyFromOtherTab = value;
  },
  SET_CLIENT_TYPE_FILTER(state, value) {
    const normalized = normClientFilter(value);
    state.clientTypeFilter = normalized;
  },
  SET_CASH_REGISTER_FILTER(state, value) {
    const normalized = normCashFilter(value);
    state.cashRegisterFilter = normalized;
  },
  SET_CLIENT_BALANCES_CURRENCY_ID(state, value) {
    state.clientBalancesCurrencyId = value == null ? null : value;
  },
  SET_MENU_ITEMS(state, { main, available }) {
    state.menuItems.main = dropSalaryReport(main);
    state.menuItems.available = dropSalaryReport(available);
  },
  UPDATE_KANBAN_CARD_FIELDS(state, { mode, fields }) {
    if (mode === "orders" || mode === "projects" || mode === "tasks") {
      state.kanbanCardFields[mode] = { ...state.kanbanCardFields[mode], ...fields };
    }
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
    if (["table", "calendar", "cards"].includes(mode)) {
      state.viewModes.leaves = mode;
    }
  },
  SET_PROJECTS_VIEW_MODE(state, mode) {
    if (["table", "kanban", "cards"].includes(mode)) {
      state.viewModes.projects = mode;
    }
  },
  SET_ORDERS_VIEW_MODE(state, mode) {
    if (["table", "kanban", "cards"].includes(mode)) {
      state.viewModes.orders = mode;
    }
  },
  SET_TASKS_VIEW_MODE(state, mode) {
    if (["table", "kanban", "cards"].includes(mode)) {
      state.viewModes.tasks = mode;
    }
  },
  SET_CLIENTS_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.clients = mode;
    }
  },
  SET_USERS_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.users = mode;
    }
  },
  SET_TRANSACTIONS_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.transactions = mode;
    }
  },
  SET_SALES_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.sales = mode;
    }
  },
  SET_INVOICES_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.invoices = mode;
    }
  },
  SET_TRANSFERS_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.transfers = mode;
    }
  },
  SET_TRANSACTION_CATEGORIES_VIEW_MODE(state, mode) {
    if (["table", "cards"].includes(mode)) {
      state.viewModes.transactionCategories = mode;
    }
  },
  SET_LIST_PAGE_VIEW_MODE(state, { key, mode }) {
    if (!key || !["table", "cards"].includes(mode)) {
      return;
    }
    if (!state.viewModes.listPages) {
      state.viewModes.listPages = {};
    }
    state.viewModes.listPages[key] = mode;
  },
};
