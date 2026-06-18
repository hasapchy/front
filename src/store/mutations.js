import { CompanyDto } from "@/dto/companies/CompanyDto";
import { applyCompanyTheme } from "@/utils/companyTheme";
import { UserDto } from "@/dto/users/UserDto";
import { STORE_CONFIG } from "./config";
import { normClientFilter, normCashFilter } from "./normalize";
import { dropSalaryReport } from "./menuUtils";
import {
  mergeClientBalancesList,
  mergeClientPreservingBalances,
} from "@/utils/clientBalanceCashUtils";
import {
  DEFAULT_CARD_GRID_COLUMNS,
  normalizeCardGridColumns,
} from "@/utils/cardGridUtils";
import { storageCompanySegment } from "@/utils/browserLocalStorageUi";

function balanceDtoToPlainRow(balance) {
  if (!balance) {
    return null;
  }
  return {
    id: balance.id,
    client_id: balance.clientId,
    currency_id: balance.currencyId,
    type: balance.type,
    currency: balance.currency,
    balance: balance.balance,
    is_default: balance.isDefault ? 1 : 0,
    note: balance.note,
    users: balance.users,
  };
}

function patchClientsDataFromClientDto(state, client) {
  if (!client?.id) {
    return;
  }
  const id = Number(client.id);
  const data = Array.isArray(state.clientsData) ? [...state.clientsData] : [];
  const idx = data.findIndex((row) => Number(row?.id) === id);
  const plainBalances = (client.balances || [])
    .map(balanceDtoToPlainRow)
    .filter(Boolean);
  if (idx >= 0) {
    const prev = data[idx];
    data[idx] = {
      ...prev,
      balance: client.balance,
      balances: mergeClientBalancesList(plainBalances, prev.balances),
    };
  } else {
    data.push({
      id: client.id,
      client_type: client.clientType,
      balance: client.balance,
      is_supplier: client.isSupplier ? 1 : 0,
      is_conflict: client.isConflict ? 1 : 0,
      first_name: client.firstName,
      last_name: client.lastName,
      patronymic: client.patronymic,
      position: client.position,
      address: client.address,
      note: client.note,
      status: client.status ? 1 : 0,
      phones: (client.phones || []).map((p) => ({ id: p.id, phone: p.phone })),
      emails: (client.emails || []).map((e) => ({ id: e.id, email: e.email })),
      balances: plainBalances,
    });
  }
  state.clientsData = data;
  touchLargeCacheCompanyId(state);
}

const COMPANY_DATA_FIELDS = STORE_CONFIG.companyDataFields;

function touchLargeCacheCompanyId(state) {
  const has =
    (Array.isArray(state.clientsData) && state.clientsData.length > 0) ||
    (Array.isArray(state.projectsData) && state.projectsData.length > 0) ||
    (Array.isArray(state.ordersData) && state.ordersData.length > 0) ||
    (Array.isArray(state.allProductsData) && state.allProductsData.length > 0) ||
    (Array.isArray(state.lastProductsData) && state.lastProductsData.length > 0);
  state.largeCacheCompanyId = has ? state.currentCompany?.id ?? null : null;
}

export const mutations = {
  SET_USER(state, user) {
    const normalizedUser = user ? UserDto.fromApi(user) : null;
    state.user = normalizedUser;
    if (!normalizedUser) {
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
    const list = Array.isArray(clients) ? clients : [];
    const prevById = new Map((state.clients || []).map((c) => [Number(c.id), c]));
    state.clients = list.map((client) =>
      mergeClientPreservingBalances(client, prevById.get(Number(client.id))),
    );
  },
  UPSERT_CLIENT(state, client) {
    if (!client?.id) {
      return;
    }
    const id = Number(client.id);
    const list = Array.isArray(state.clients) ? [...state.clients] : [];
    const idx = list.findIndex((c) => Number(c.id) === id);
    const prev = idx >= 0 ? list[idx] : null;
    const merged = mergeClientPreservingBalances(client, prev);
    if (idx >= 0) {
      list[idx] = merged;
    } else {
      list.push(merged);
    }
    state.clients = list;
    patchClientsDataFromClientDto(state, merged);
  },
  SET_CLIENTS_DATA(state, clientsData) {
    const list = Array.isArray(clientsData) ? clientsData : [];
    const prevById = new Map((state.clientsData || []).map((c) => [Number(c.id), c]));
    state.clientsData = list.map((row) => {
      const prev = prevById.get(Number(row?.id));
      if (!prev) {
        return row;
      }
      return {
        ...row,
        balances: mergeClientBalancesList(row.balances, prev.balances),
      };
    });
    touchLargeCacheCompanyId(state);
  },
  SET_LAST_PRODUCTS(state, lastProducts) {
    state.lastProducts = lastProducts;
  },
  SET_LAST_PRODUCTS_DATA(state, lastProductsData) {
    state.lastProductsData = lastProductsData;
    touchLargeCacheCompanyId(state);
  },
  SET_ALL_PRODUCTS(state, allProducts) {
    state.allProducts = allProducts;
  },
  SET_ALL_PRODUCTS_DATA(state, allProductsData) {
    state.allProductsData = allProductsData;
    touchLargeCacheCompanyId(state);
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
    touchLargeCacheCompanyId(state);
  },
  SET_PROJECTS_DATA_COMPANY_ID(state, companyId) {
    state.projectsDataCompanyId = companyId;
    touchLargeCacheCompanyId(state);
  },
  SET_ORDERS(state, orders) {
    state.orders = orders;
  },
  SET_ORDERS_DATA(state, ordersData) {
    state.ordersData = ordersData;
    state.ordersDataCompanyId = state.currentCompany?.id || null;
    touchLargeCacheCompanyId(state);
  },
  SET_ORDERS_DATA_COMPANY_ID(state, companyId) {
    state.ordersDataCompanyId = companyId;
    touchLargeCacheCompanyId(state);
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
  SET_HOLIDAYS_FOR_FILTER(state, { filterKey, items }) {
    state.holidaysByFilter = {
      ...state.holidaysByFilter,
      [filterKey]: Array.isArray(items) ? items : [],
    };
  },
  CLEAR_HOLIDAYS(state) {
    state.holidaysByFilter = {};
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
  SET_CHATS(state, chats) {
    state.chats = Array.isArray(chats) ? chats : [];
  },
  PATCH_CHAT_UNREAD(state, { chatId, unreadCount }) {
    const id = Number(chatId);
    state.chats = state.chats.map((chat) =>
      chat && Number(chat.id) === id ? { ...chat, unreadCount } : chat
    );
  },
  CLEAR_COMPANY_DATA(state) {
    COMPANY_DATA_FIELDS.forEach((f) => {
      state[f] = [];
    });
    state.chats = [];
    state.projectsDataCompanyId = null;
    state.ordersDataCompanyId = null;
    state.largeCacheCompanyId = null;
    state.clientBalancesCurrencyId = null;
    state.loggedDataFlags = {
      warehouses: false,
      cashRegisters: false,
      clients: false,
      categories: false,
      projects: false,
      orders: false,
    };
    state.projectContractsByProject = {};
    state.holidaysByFilter = {};
    state.leavesByFilter = {};
  },
  BUMP_CASH_REGISTER_USER_COLORS_REVISION(state) {
    state.cashRegisterUserColorsRevision += 1;
  },
  SET_CURRENT_COMPANY(state, company) {
    const next =
      company == null
        ? null
        : company instanceof CompanyDto
          ? company
          : new CompanyDto(company);
    if (next && state.currentCompany?.id === next.id) {
      state.currentCompany = next;
      applyCompanyTheme(next?.uiTheme ?? {});
      return;
    }
    state.currentCompany = next;
    applyCompanyTheme(next?.uiTheme ?? {});
  },
  SET_LAST_COMPANY_ID(state, companyId) {
    state.lastCompanyId = companyId;
  },
  SET_USER_COMPANIES(state, companies) {
    state.userCompanies = companies;
  },
  UPSERT_USER_COMPANY(state, company) {
    const next = company instanceof CompanyDto ? company : new CompanyDto(company);
    if (!next?.id) {
      return;
    }
    const list = Array.isArray(state.userCompanies) ? [...state.userCompanies] : [];
    const index = list.findIndex((item) => Number(item.id) === Number(next.id));
    if (index >= 0) {
      list[index] = next;
    } else {
      list.push(next);
    }
    state.userCompanies = list;
  },
  SET_SOUND_ENABLED(state, enabled) {
    state.soundEnabled = enabled;
  },
  SET_UI_THEME(state, theme) {
    state.uiTheme = theme === "dark" ? "dark" : "light";
  },
  SET_PROFILE_WALLPAPER(state, wallpaperId) {
    if (!state.user) {
      return;
    }
    state.user.profileWallpaper =
      wallpaperId === "" || wallpaperId === "default" ? null : wallpaperId;
  },
  SET_PROFILE_WALLPAPERS_CATALOG(state, catalog) {
    state.profileWallpapersCatalog = Array.isArray(catalog) ? catalog : [];
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
    if (mode === "leads") {
      state.kanbanCardFields[mode] = { ...state.kanbanCardFields[mode], ...fields };
    }
  },
  UPDATE_KANBAN_CARD_FIELD_DATE_MODES(state, { mode, fields }) {
    if (mode !== "leads") {
      return;
    }
    if (!state.kanbanCardFieldDateModes) {
      state.kanbanCardFieldDateModes = {};
    }
    const prev = state.kanbanCardFieldDateModes[mode] || {};
    state.kanbanCardFieldDateModes[mode] = { ...prev, ...fields };
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
  SET_LEADS_VIEW_MODE(state, mode) {
    if (["table", "kanban", "cards"].includes(mode)) {
      state.viewModes.leads = mode;
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
  SET_CARD_GRID_COLUMNS(state, { companyId, columns }) {
    if (!state.cardGridColumns) {
      state.cardGridColumns = {};
    }
    const key = storageCompanySegment(companyId);
    state.cardGridColumns[key] = normalizeCardGridColumns(columns);
  },
  RESET_CARD_GRID_COLUMNS(state, companyId) {
    if (!state.cardGridColumns) {
      state.cardGridColumns = {};
    }
    const key = storageCompanySegment(companyId);
    state.cardGridColumns[key] = DEFAULT_CARD_GRID_COLUMNS;
  },
};
