const state = {
  settings_open: false,
  searchQuery: "",
  globalSearchQuery: "", // Глобальный поиск (замена eventBus 'global-search')
  isMobileMenuOpen: false, // Состояние мобильного меню (замена eventBus 'toggleMobileMenu')
  notification: false,
  notificationTitle: "",
  notificationSubtitle: "",
  notificationIsDanger: false,
  notificationDuration: 10000,
  notificationTimeoutId: null,
  isLoading: false,
  activeApiCalls: 0,
  soundEnabled: true,
  locale: 'ru',
  perPage: 10,
  ordersViewMode: 'kanban',
  projectsViewMode: 'table',
  clientTypeFilter: "all",
  logoVersion: 0,
  // Настройки меню
  menuItems: {
    main: [],
    available: [],
  },
  // Настройки таблиц: { tableKey: columns[] }
  tableColumns: {},
  // Настройки сортировки таблиц: { tableKey: { key, order } }
  tableSort: {},
  // Настройки Kanban: порядок колонок { 'projects': [id, ...], 'orders': [id, ...] }
  kanbanColumnOrder: {
    projects: null,
    orders: null,
  },
  // Компактный вид Kanban
  kanbanCompactView: false,
  // Порядок сервисов basement: { userId: [serviceId, ...] }
  basementServicesOrder: {},
};

const mutations = {
  SET_SETTINGS_OPEN(state, value) {
    state.settings_open = value;
  },
  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query;
  },
  SET_GLOBAL_SEARCH_QUERY(state, query) {
    state.globalSearchQuery = query;
  },
  SET_MOBILE_MENU_OPEN(state, isOpen) {
    state.isMobileMenuOpen = isOpen;
  },
  TOGGLE_MOBILE_MENU(state) {
    state.isMobileMenuOpen = !state.isMobileMenuOpen;
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  INCREMENT_API_CALLS(state) {
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
  SET_SOUND_ENABLED(state, enabled) {
    state.soundEnabled = enabled;
  },
  SET_LOCALE(state, locale) {
    state.locale = locale;
  },
  SET_PER_PAGE(state, perPage) {
    state.perPage = perPage;
  },
  SET_ORDERS_VIEW_MODE(state, mode) {
    state.ordersViewMode = mode;
  },
  SET_PROJECTS_VIEW_MODE(state, mode) {
    state.projectsViewMode = mode;
  },
  SET_CLIENT_TYPE_FILTER(state, value) {
    state.clientTypeFilter = value || "all";
  },
  INCREMENT_LOGO_VERSION(state) {
    state.logoVersion = (state.logoVersion || 0) + 1;
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
  SET_TABLE_COLUMNS(state, { tableKey, columns }) {
    state.tableColumns[tableKey] = columns;
  },
  SET_TABLE_SORT(state, { tableKey, sort }) {
    state.tableSort[tableKey] = sort;
  },
  SET_KANBAN_COLUMN_ORDER(state, { mode, order }) {
    state.kanbanColumnOrder[mode] = order;
  },
  SET_KANBAN_COMPACT_VIEW(state, value) {
    state.kanbanCompactView = value;
  },
  SET_BASEMENT_SERVICES_ORDER(state, { userId, order }) {
    state.basementServicesOrder[userId] = order;
  },
};

const actions = {
  setSearchQuery({ commit }, query) {
    commit("SET_SEARCH_QUERY", query);
  },
  setGlobalSearchQuery({ commit }, query) {
    commit("SET_GLOBAL_SEARCH_QUERY", query);
  },
  toggleMobileMenu({ commit }) {
    commit("TOGGLE_MOBILE_MENU");
  },
  setMobileMenuOpen({ commit }, isOpen) {
    commit("SET_MOBILE_MENU_OPEN", isOpen);
  },
  setClientTypeFilter({ commit }, value) {
    commit("SET_CLIENT_TYPE_FILTER", value || "all");
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
    if (state.notificationTimeoutId) {
      clearTimeout(state.notificationTimeoutId);
      commit("SET_NOTIFICATION_TIMEOUT_ID", null);
    }
    commit("CLOSE_NOTIFICATION");
  },
  pauseNotificationTimer({ commit, state }) {
    if (state.notificationTimeoutId) {
      clearTimeout(state.notificationTimeoutId);
      commit("SET_NOTIFICATION_TIMEOUT_ID", null);
    }
  },
  resumeNotificationTimer({ commit, state }) {
    if (state.notification && !state.notificationTimeoutId) {
      const timeoutId = setTimeout(() => {
        commit("CLOSE_NOTIFICATION");
        commit("SET_NOTIFICATION_TIMEOUT_ID", null);
      }, state.notificationDuration);

      commit("SET_NOTIFICATION_TIMEOUT_ID", timeoutId);
    }
  },
  setLocale({ commit }, locale) {
    commit("SET_LOCALE", locale);
  },
  setPerPage({ commit }, perPage) {
    commit("SET_PER_PAGE", perPage);
  },
  setOrdersViewMode({ commit }, mode) {
    commit("SET_ORDERS_VIEW_MODE", mode);
  },
  setProjectsViewMode({ commit }, mode) {
    commit("SET_PROJECTS_VIEW_MODE", mode);
  },
  initializeMenu({ commit, state }) {
    if (state.menuItems && state.menuItems.main && state.menuItems.main.length > 0) {
      const mainIds = new Set(
        state.menuItems.main.map((item) => item?.id).filter(Boolean)
      );
      const availableIds = new Set(
        (state.menuItems.available || []).map((item) => item?.id).filter(Boolean)
      );

      const mainUnique = state.menuItems.main.filter(
        (item) => item && item.id && !availableIds.has(item.id)
      );
      const availableUnique = (state.menuItems.available || []).filter(
        (item) => item && item.id && !mainIds.has(item.id)
      );

      const cleaned = {
        main: mainUnique,
        available: availableUnique,
      };
      commit("SET_MENU_ITEMS", cleaned);
      return;
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
  },
  setTableColumns({ commit }, { tableKey, columns }) {
    commit("SET_TABLE_COLUMNS", { tableKey, columns });
  },
  setTableSort({ commit }, { tableKey, sort }) {
    commit("SET_TABLE_SORT", { tableKey, sort });
  },
  getKanbanColumnOrder({ state }, mode) {
    return state.kanbanColumnOrder[mode] || null;
  },
  setKanbanColumnOrder({ commit }, { mode, order }) {
    commit("SET_KANBAN_COLUMN_ORDER", { mode, order });
  },
  getKanbanCompactView({ state }) {
    return state.kanbanCompactView;
  },
  setKanbanCompactView({ commit }, value) {
    commit("SET_KANBAN_COMPACT_VIEW", value);
  },
  getBasementServicesOrder({ state }, userId) {
    return state.basementServicesOrder[userId] || null;
  },
  setBasementServicesOrder({ commit }, { userId, order }) {
    commit("SET_BASEMENT_SERVICES_ORDER", { userId, order });
  },
};

const getters = {
  isLoading: (state) => state.isLoading,
  activeApiCalls: (state) => state.activeApiCalls,
  notification: (state) => state.notification,
  notificationTitle: (state) => state.notificationTitle,
  notificationSubtitle: (state) => state.notificationSubtitle,
  notificationIsDanger: (state) => state.notificationIsDanger,
  notificationDuration: (state) => state.notificationDuration,
  notificationTimeoutId: (state) => state.notificationTimeoutId,
  soundEnabled: (state) => state.soundEnabled,
  clientTypeFilter: (state) => state.clientTypeFilter || "all",
  locale: (state) => state.locale || 'ru',
  perPage: (state) => state.perPage || 10,
  ordersViewMode: (state) => state.ordersViewMode || 'kanban',
  projectsViewMode: (state) => state.projectsViewMode || 'table',
  mainMenuItems: (state, getters, rootState, rootGetters) => {
    if (!state.menuItems.main || state.menuItems.main.length === 0) {
      return [];
    }
    if (!Array.isArray(rootGetters['auth/permissions'])) {
      return [];
    }
    return state.menuItems.main.filter((item) => {
      if (!item) return false;
      if (!item.permission) return true;
      return rootGetters['auth/hasPermission'](item.permission);
    });
  },
  availableMenuItems: (state, getters, rootState, rootGetters) => {
    if (
      !state.menuItems.available ||
      state.menuItems.available.length === 0
    ) {
      return [];
    }
    if (!Array.isArray(rootGetters['auth/permissions'])) {
      return [];
    }
    return state.menuItems.available.filter((item) => {
      if (!item) return false;
      if (!item.permission) return true;
      return rootGetters['auth/hasPermission'](item.permission);
    });
  },
  getTableColumns: (state) => (tableKey) => {
    return state.tableColumns[tableKey] || null;
  },
  getTableSort: (state) => (tableKey) => {
    return state.tableSort[tableKey] || null;
  },
  getKanbanColumnOrder: (state) => (mode) => {
    return state.kanbanColumnOrder[mode] || null;
  },
  getKanbanCompactView: (state) => {
    return state.kanbanCompactView;
  },
  getBasementServicesOrder: (state) => (userId) => {
    return state.basementServicesOrder[userId] || null;
  },
  globalSearchQuery: (state) => state.globalSearchQuery,
  isMobileMenuOpen: (state) => state.isMobileMenuOpen,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};

