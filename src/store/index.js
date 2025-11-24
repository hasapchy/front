import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

// Модули
import authModule from "./modules/auth";
import uiModule from "./modules/ui";
import cacheModule from "./modules/cache";
import companyModule from "./modules/company";
import referencesModule from "./modules/references";
import dataModule from "./modules/data";

// Плагины и утилиты
import { createPersistedStateConfig } from "./plugins/persistedState";
import { initializeStorageSync } from "./utils/storageSync";
import { logCompanyRoundingSettings } from "./utils/logging";

const store = createStore({
  modules: {
    auth: authModule,
    ui: uiModule,
    cache: cacheModule,
    company: companyModule,
    references: referencesModule,
    data: dataModule,
  },
  // Root mutations для обратной совместимости
  mutations: {
    SET_USER(state, user) {
      state.auth.user = user;
    },
    SET_PERMISSIONS(state, permissions) {
      state.auth.permissions = permissions;
      state.auth.permissionsLoaded = true;
    },
    SET_PERMISSIONS_LOADED(state, loaded) {
      state.auth.permissionsLoaded = loaded;
    },
    SET_TOKEN(state, payload) {
      state.auth.token = payload.token;
      state.auth.tokenExpiresAt = payload.expiresAt;
    },
    CLEAR_TOKEN(state) {
      state.auth.token = null;
      state.auth.tokenExpiresAt = null;
    },
    SET_CURRENT_COMPANY(state, company) {
      if (state.company.currentCompany?.id === company?.id) {
        return;
      }
      state.company.currentCompany = company;
      logCompanyRoundingSettings(company);
    },
    SET_LAST_COMPANY_ID(state, companyId) {
      state.company.lastCompanyId = companyId;
    },
    SET_USER_COMPANIES(state, companies) {
      state.company.userCompanies = companies;
    },
    SET_LOADING_FLAG(state, { type, loading }) {
      // Определяем, в каком модуле находится флаг
      if (['warehouses', 'cashRegisters', 'clients', 'products', 'services', 'categories', 'projects'].includes(type)) {
        state.data.loadingFlags[type] = loading;
      } else if (['units', 'currencies', 'users', 'orderStatuses', 'projectStatuses', 'transactionCategories', 'productStatuses'].includes(type)) {
        state.references.loadingFlags[type] = loading;
      } else if (type === 'companyData') {
        state.company.loadingFlags[type] = loading;
      }
    },
    SET_LOGGED_DATA_FLAG(state, { type, logged }) {
      state.data.loggedDataFlags[type] = logged;
    },
    SET_IS_CHANGING_COMPANY(state, value) {
      state.company.isChangingCompanyFromThisTab = value;
    },
    SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB(state, value) {
      state.company.isSyncingCompanyFromOtherTab = value;
    },
    SET_ORDER_STATUSES_CUSTOM_ORDER(state, order) {
      state.references.orderStatusesCustomOrder = order;
    },
    INCREMENT_LOGO_VERSION(state) {
      state.ui.logoVersion = (state.ui.logoVersion || 0) + 1;
    },
    SET_SETTINGS_OPEN(state, value) {
      state.ui.settings_open = value;
    },
    // Data mutations
    SET_WAREHOUSES(state, warehouses) {
      state.data.warehouses = warehouses;
    },
    SET_CASH_REGISTERS(state, cashRegisters) {
      state.data.cashRegisters = cashRegisters;
    },
    SET_CLIENTS(state, clients) {
      state.data.clients = clients;
    },
    SET_CLIENTS_DATA(state, clientsData) {
      state.data.clientsData = clientsData;
    },
    SET_PRODUCTS(state, products) {
      state.data.products = products;
    },
    SET_SERVICES(state, services) {
      state.data.services = services;
    },
    SET_LAST_PRODUCTS(state, lastProducts) {
      state.data.lastProducts = lastProducts;
    },
    SET_LAST_PRODUCTS_DATA(state, lastProductsData) {
      state.data.lastProductsData = lastProductsData;
    },
    SET_ALL_PRODUCTS(state, allProducts) {
      state.data.allProducts = allProducts;
    },
    SET_ALL_PRODUCTS_DATA(state, allProductsData) {
      state.data.allProductsData = allProductsData;
    },
    SET_CATEGORIES(state, categories) {
      state.data.categories = categories;
    },
    SET_PROJECTS(state, projects) {
      state.data.projects = projects;
    },
    SET_PROJECTS_DATA(state, projectsData) {
      state.data.projectsData = projectsData;
      state.data.projectsDataCompanyId = state.company.currentCompany?.id || null;
    },
    SET_PROJECTS_DATA_COMPANY_ID(state, companyId) {
      state.data.projectsDataCompanyId = companyId;
    },
    CLEAR_COMPANY_DATA(state) {
      state.data.clients = [];
      state.data.clientsData = [];
      state.data.warehouses = [];
      state.data.cashRegisters = [];
      state.data.products = [];
      state.data.services = [];
      state.data.lastProducts = [];
      state.data.allProducts = [];
      state.data.lastProductsData = [];
      state.data.allProductsData = [];
      state.data.categories = [];
      state.data.projects = [];
      state.data.projectsData = [];
      state.data.projectsDataCompanyId = null;
      state.data.loggedDataFlags = {
        warehouses: false,
        cashRegisters: false,
        clients: false,
        categories: false,
        projects: false,
      };
    },
    // References mutations
    SET_UNITS(state, units) {
      state.references.units = units;
    },
    SET_CURRENCIES(state, currencies) {
      state.references.currencies = currencies;
    },
    SET_USERS(state, users) {
      state.references.users = users;
    },
    SET_ORDER_STATUSES(state, orderStatuses) {
      state.references.orderStatuses = orderStatuses;
    },
    SET_PROJECT_STATUSES(state, projectStatuses) {
      state.references.projectStatuses = projectStatuses;
    },
    SET_TRANSACTION_CATEGORIES(state, transactionCategories) {
      state.references.transactionCategories = transactionCategories;
    },
    SET_PRODUCT_STATUSES(state, productStatuses) {
      state.references.productStatuses = productStatuses;
    },
  },
  // Root getters для обратной совместимости
  getters: {
    // Auth
    user: (state) => state.auth.user,
    permissions: (state) => state.auth.permissions,
    hasPermission: (state, getters) => (perm) => getters['auth/hasPermission'](perm),
    token: (state) => state.auth.token,
    tokenExpiresAt: (state) => state.auth.tokenExpiresAt,
    isTokenExpired: (state, getters) => getters['auth/isTokenExpired'],
    isBasementMode: (state, getters) => getters['auth/isBasementMode'],
    // Company
    currentCompany: (state) => state.company.currentCompany,
    userCompanies: (state) => state.company.userCompanies,
    currentCompanyId: (state, getters) => getters['company/currentCompanyId'],
    // References
    units: (state) => state.references.units,
    currencies: (state) => state.references.currencies,
    users: (state) => state.references.users,
    orderStatuses: (state) => state.references.orderStatuses,
    projectStatuses: (state) => state.references.projectStatuses,
    transactionCategories: (state) => state.references.transactionCategories,
    productStatuses: (state) => state.references.productStatuses,
    getUnitById: (state, getters) => (id) => getters['references/getUnitById'](id),
    getUnitName: (state, getters) => (id) => getters['references/getUnitName'](id),
    getUnitShortName: (state, getters) => (id) => getters['references/getUnitShortName'](id),
    getCurrencyById: (state, getters) => (id) => getters['references/getCurrencyById'](id),
    getCurrencySymbol: (state, getters) => (id) => getters['references/getCurrencySymbol'](id),
    usersForCurrentCompany: (state, getters) => getters['references/usersForCurrentCompany'],
    // Data
    warehouses: (state) => state.data.warehouses,
    cashRegisters: (state) => state.data.cashRegisters,
    clients: (state) => state.data.clients,
    products: (state) => state.data.products,
    services: (state) => state.data.services,
    lastProducts: (state) => state.data.lastProducts,
    allProducts: (state) => state.data.allProducts,
    categories: (state) => state.data.categories,
    projects: (state) => state.data.projects,
    activeProjects: (state, getters) => getters['data/activeProjects'],
    // UI
    isLoading: (state) => state.ui.isLoading,
    activeApiCalls: (state) => state.ui.activeApiCalls,
    notification: (state) => state.ui.notification,
    notificationTitle: (state) => state.ui.notificationTitle,
    notificationSubtitle: (state) => state.ui.notificationSubtitle,
    notificationIsDanger: (state) => state.ui.notificationIsDanger,
    notificationDuration: (state) => state.ui.notificationDuration,
    notificationTimeoutId: (state) => state.ui.notificationTimeoutId,
    soundEnabled: (state) => state.ui.soundEnabled,
    clientTypeFilter: (state) => state.ui.clientTypeFilter,
    locale: (state) => state.ui.locale,
    perPage: (state) => state.ui.perPage,
    ordersViewMode: (state) => state.ui.ordersViewMode,
    projectsViewMode: (state) => state.ui.projectsViewMode,
    mainMenuItems: (state, getters) => getters['ui/mainMenuItems'],
    availableMenuItems: (state, getters) => getters['ui/availableMenuItems'],
    getTableColumns: (state, getters) => (tableKey) => getters['ui/getTableColumns'](tableKey),
    getTableSort: (state, getters) => (tableKey) => getters['ui/getTableSort'](tableKey),
    getKanbanColumnOrder: (state, getters) => (mode) => getters['ui/getKanbanColumnOrder'](mode),
    getKanbanCompactView: (state, getters) => getters['ui/getKanbanCompactView'],
    getBasementServicesOrder: (state, getters) => (userId) => getters['ui/getBasementServicesOrder'](userId),
    globalSearchQuery: (state, getters) => getters['ui/globalSearchQuery'],
    isMobileMenuOpen: (state, getters) => getters['ui/isMobileMenuOpen'],
    // Rounding (из company)
    roundingDecimals: (state, getters) => {
      const decimals = state.company.currentCompany?.rounding_decimals;
      return decimals;
    },
    roundingEnabled: (state) => {
      const enabled = state.company.currentCompany?.rounding_enabled ?? true;
      return enabled;
    },
    roundingDirection: (state) => {
      const direction = state.company.currentCompany?.rounding_direction || "standard";
      return direction;
    },
    roundingCustomThreshold: (state) =>
      state.company.currentCompany?.rounding_custom_threshold ?? 0.5,
    roundingQuantityDecimals: (state) => {
      const decimals = state.company.currentCompany?.rounding_quantity_decimals ?? 2;
      return decimals;
    },
    roundingQuantityEnabled: (state) => {
      const enabled = state.company.currentCompany?.rounding_quantity_enabled ?? true;
      return enabled;
    },
    roundingQuantityDirection: (state) => {
      const direction =
        state.company.currentCompany?.rounding_quantity_direction || "standard";
      return direction;
    },
    roundingQuantityCustomThreshold: (state) =>
      state.company.currentCompany?.rounding_quantity_custom_threshold ?? 0.5,
  },
  // Root actions для обратной совместимости
  actions: {
    // Auth
    setUser({ dispatch }, user) {
      return dispatch('auth/setUser', user);
    },
    setPermissions({ dispatch }, permissions) {
      return dispatch('auth/setPermissions', permissions);
    },
    setToken({ dispatch }, payload) {
      return dispatch('auth/setToken', payload);
    },
    clearAuth({ dispatch }) {
      return dispatch('auth/clearAuth');
    },
    refreshUserPermissions({ dispatch }) {
      return dispatch('auth/refreshUserPermissions');
    },
    // Company
    loadUserCompanies({ dispatch }) {
      return dispatch('company/loadUserCompanies');
    },
    loadCurrentCompany({ dispatch }) {
      return dispatch('company/loadCurrentCompany');
    },
    setCurrentCompany({ dispatch }, companyId) {
      return dispatch('company/setCurrentCompany', companyId);
    },
    loadCompanyData({ dispatch }) {
      return dispatch('company/loadCompanyData');
    },
    onCompanyChange({ dispatch }, payload) {
      return dispatch('company/onCompanyChange', payload);
    },
    // References
    loadUnits({ dispatch }) {
      return dispatch('references/loadUnits');
    },
    loadCurrencies({ dispatch }) {
      return dispatch('references/loadCurrencies');
    },
    loadUsers({ dispatch }) {
      return dispatch('references/loadUsers');
    },
    loadOrderStatuses({ dispatch }) {
      return dispatch('references/loadOrderStatuses');
    },
    loadProjectStatuses({ dispatch }) {
      return dispatch('references/loadProjectStatuses');
    },
    loadTransactionCategories({ dispatch }) {
      return dispatch('references/loadTransactionCategories');
    },
    loadProductStatuses({ dispatch }) {
      return dispatch('references/loadProductStatuses');
    },
    // Data
    loadWarehouses({ dispatch }) {
      return dispatch('data/loadWarehouses');
    },
    loadCashRegisters({ dispatch }) {
      return dispatch('data/loadCashRegisters');
    },
    loadClients({ dispatch }) {
      return dispatch('data/loadClients');
    },
    loadProducts({ dispatch }) {
      return dispatch('data/loadProducts');
    },
    loadServices({ dispatch }) {
      return dispatch('data/loadServices');
    },
    loadCategories({ dispatch }) {
      return dispatch('data/loadCategories');
    },
    loadProjects({ dispatch }) {
      return dispatch('data/loadProjects');
    },
    loadLastProducts({ dispatch }) {
      return dispatch('data/loadLastProducts');
    },
    loadAllProducts({ dispatch }) {
      return dispatch('data/loadAllProducts');
    },
    waitForLoading({ dispatch }, type, maxAttempts) {
      return dispatch('data/waitForLoading', type, maxAttempts);
    },
    // UI
    setSearchQuery({ dispatch }, query) {
      return dispatch('ui/setSearchQuery', query);
    },
    setClientTypeFilter({ dispatch }, value) {
      return dispatch('ui/setClientTypeFilter', value);
    },
    setLoading({ dispatch }, isLoading) {
      return dispatch('ui/setLoading', isLoading);
    },
    startApiCall({ dispatch }) {
      return dispatch('ui/startApiCall');
    },
    endApiCall({ dispatch }) {
      return dispatch('ui/endApiCall');
    },
    showNotification({ dispatch }, payload) {
      return dispatch('ui/showNotification', payload);
    },
    closeNotification({ dispatch }) {
      return dispatch('ui/closeNotification');
    },
    pauseNotificationTimer({ dispatch }) {
      return dispatch('ui/pauseNotificationTimer');
    },
    resumeNotificationTimer({ dispatch }) {
      return dispatch('ui/resumeNotificationTimer');
    },
    setLocale({ dispatch }, locale) {
      return dispatch('ui/setLocale', locale);
    },
    setPerPage({ dispatch }, perPage) {
      return dispatch('ui/setPerPage', perPage);
    },
    setOrdersViewMode({ dispatch }, mode) {
      return dispatch('ui/setOrdersViewMode', mode);
    },
    setProjectsViewMode({ dispatch }, mode) {
      return dispatch('ui/setProjectsViewMode', mode);
    },
    initializeMenu({ dispatch }) {
      return dispatch('ui/initializeMenu');
    },
    updateMenuItems({ dispatch }, payload) {
      return dispatch('ui/updateMenuItems', payload);
    },
    updateBothMenuLists({ dispatch }, payload) {
      return dispatch('ui/updateBothMenuLists', payload);
    },
    setTableColumns({ dispatch }, payload) {
      return dispatch('ui/setTableColumns', payload);
    },
    setTableSort({ dispatch }, payload) {
      return dispatch('ui/setTableSort', payload);
    },
    setKanbanColumnOrder({ dispatch }, payload) {
      return dispatch('ui/setKanbanColumnOrder', payload);
    },
    setKanbanCompactView({ dispatch }, value) {
      return dispatch('ui/setKanbanCompactView', value);
    },
    setBasementServicesOrder({ dispatch }, payload) {
      return dispatch('ui/setBasementServicesOrder', payload);
    },
    setGlobalSearchQuery({ dispatch }, query) {
      return dispatch('ui/setGlobalSearchQuery', query);
    },
    toggleMobileMenu({ dispatch }) {
      return dispatch('ui/toggleMobileMenu');
    },
    setMobileMenuOpen({ dispatch }, isOpen) {
      return dispatch('ui/setMobileMenuOpen', isOpen);
    },
    handleCompanyUpdated({ dispatch }) {
      return dispatch('company/handleCompanyUpdated');
    },
    // Cache
    getQueryCache({ dispatch }, payload) {
      return dispatch('cache/getQueryCache', payload);
    },
    setQueryCache({ dispatch }, payload) {
      return dispatch('cache/setQueryCache', payload);
    },
    invalidateQueryCache({ dispatch }, payload) {
      return dispatch('cache/invalidateQueryCache', payload);
    },
    invalidateCache({ dispatch }, payload) {
      return dispatch('cache/invalidateCache', payload);
    },
    onDataCreate({ dispatch }, payload) {
      return dispatch('cache/onDataCreate', payload);
    },
    onDataUpdate({ dispatch }, payload) {
      return dispatch('cache/onDataUpdate', payload);
    },
    onDataDelete({ dispatch }, payload) {
      return dispatch('cache/onDataDelete', payload);
    },
    clearCache({ dispatch }) {
      return dispatch('cache/clearCache');
    },
    onUserChange({ dispatch }) {
      return dispatch('cache/onUserChange');
    },
  },
  plugins: [createPersistedState(createPersistedStateConfig())],
});

// ✅ Инициализируем синхронизацию между вкладками
initializeStorageSync(store);

// Обработка обновления компании теперь через store action company/handleCompanyUpdated
// Компоненты могут вызывать: store.dispatch('company/handleCompanyUpdated')

export default store;

