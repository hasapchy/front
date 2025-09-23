import { createStore } from "vuex";
import api from "@/api/axiosInstance";

export default createStore({
  state: {
    user: null,
    permissions: [],
    settings_open: false,
    searchQuery: "",
    notification: false,
    notificationTitle: "",
    notificationSubtitle: "",
    notificationIsDanger: false,
    notificationDuration: 10000, // Длительность уведомления в миллисекундах
    notificationTimeoutId: null, // ID таймера для возможности отмены
    isLoading: true, // Состояние загрузки для блокировки навигации
    activeApiCalls: 0, // Счетчик активных API вызовов
    units: [], // Единицы измерения
    currencies: [], // Валюты
    currentCompany: null, // Текущая выбранная компания
    userCompanies: [], // Список компаний пользователя
    soundEnabled: (() => {
      // Синхронно загружаем настройку звука из localStorage при инициализации store
      const soundEnabled = localStorage.getItem('soundEnabled');
      return soundEnabled !== null ? soundEnabled === 'true' : true;
    })(), // Включен ли звук
    tokenInfo: {
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      needsRefresh: false
    }
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_PERMISSIONS(state, permissions) {
      state.permissions = permissions;
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
      state.activeApiCalls++;
      state.isLoading = true;
    },
    DECREMENT_API_CALLS(state) {
      state.activeApiCalls = Math.max(0, state.activeApiCalls - 1);
      if (state.activeApiCalls === 0) {
        state.isLoading = false;
      }
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
    UPDATE_TOKEN_EXPIRATION(state, { accessTokenExpiresAt, refreshTokenExpiresAt }) {
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
    SET_CURRENT_COMPANY(state, company) {
      state.currentCompany = company;
    },
    SET_USER_COMPANIES(state, companies) {
      state.userCompanies = companies;
    },
    SET_SOUND_ENABLED(state, enabled) {
      state.soundEnabled = enabled;
    },
  },

  actions: {
    setSearchQuery({ commit }, query) {
      commit("SET_SEARCH_QUERY", query);
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
    showNotification({ commit, state }, { title, subtitle = '', isDanger = false, duration = 10000 }) {
      // Очищаем предыдущий таймер если есть
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
      }
      
      commit('SHOW_NOTIFICATION', { title, subtitle, isDanger, duration });
      
      const timeoutId = setTimeout(() => {
        commit('CLOSE_NOTIFICATION');
        commit('SET_NOTIFICATION_TIMEOUT_ID', null);
      }, duration);
      
      commit('SET_NOTIFICATION_TIMEOUT_ID', timeoutId);
    },
    closeNotification({ commit, state }) {
      // Очищаем таймер при закрытии
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
        commit('SET_NOTIFICATION_TIMEOUT_ID', null);
      }
      commit('CLOSE_NOTIFICATION');
    },
    pauseNotificationTimer({ commit, state }) {
      // Приостанавливаем таймер при наведении
      if (state.notificationTimeoutId) {
        clearTimeout(state.notificationTimeoutId);
        commit('SET_NOTIFICATION_TIMEOUT_ID', null);
      }
    },
    resumeNotificationTimer({ commit, state }) {
      // Возобновляем таймер при убирании мыши
      if (state.notification && !state.notificationTimeoutId) {
        const timeoutId = setTimeout(() => {
          commit('CLOSE_NOTIFICATION');
          commit('SET_NOTIFICATION_TIMEOUT_ID', null);
        }, state.notificationDuration);
        
        commit('SET_NOTIFICATION_TIMEOUT_ID', timeoutId);
      }
    },
    updateTokenExpiration({ commit }, { accessTokenExpiresAt, refreshTokenExpiresAt }) {
      commit('UPDATE_TOKEN_EXPIRATION', { accessTokenExpiresAt, refreshTokenExpiresAt });
    },
    checkTokenStatus({ commit }) {
      const accessTokenExpiresAt = localStorage.getItem('token_expires_at');
      const refreshTokenExpiresAt = localStorage.getItem('refresh_token_expires_at');
      
      if (accessTokenExpiresAt && refreshTokenExpiresAt) {
        const now = Date.now();
        const accessExpired = now > parseInt(accessTokenExpiresAt);
        const refreshExpired = now > parseInt(refreshTokenExpiresAt);
        
        commit('SET_TOKEN_INFO', {
          accessTokenExpiresAt: parseInt(accessTokenExpiresAt),
          refreshTokenExpiresAt: parseInt(refreshTokenExpiresAt),
          needsRefresh: accessExpired && !refreshExpired
        });
      }
    },
    async loadUnits({ commit }) {
      try {
        const response = await api.get('/app/units');
        commit('SET_UNITS', response.data);
      } catch (error) {
        console.error('Ошибка загрузки единиц измерения:', error);
      }
    },
    async loadCurrencies({ commit }) {
      try {
        const response = await api.get('/app/currency');
        commit('SET_CURRENCIES', response.data);
      } catch (error) {
        console.error('Ошибка загрузки валют:', error);
      }
    },
    async loadUserCompanies({ commit }) {
      try {
        const response = await api.get('/user/companies');
        commit('SET_USER_COMPANIES', response.data);
        return response.data;
      } catch (error) {
        console.error('Ошибка загрузки компаний пользователя:', error);
        return [];
      }
    },
    async loadCurrentCompany({ commit }) {
      try {
        const response = await api.get('/user/current-company');
        commit('SET_CURRENT_COMPANY', response.data.company);
        return response.data.company;
      } catch (error) {
        console.error('Ошибка загрузки текущей компании:', error);
        return null;
      }
    },
    async setCurrentCompany({ commit }, companyId) {
      try {
        const response = await api.post('/user/set-company', { company_id: companyId });
        commit('SET_CURRENT_COMPANY', response.data.company);
        return response.data.company;
      } catch (error) {
        console.error('Ошибка установки текущей компании:', error);
        throw error;
      }
    },
  },

  getters: {
    user: (state) => state.user,
    permissions: (state) => state.permissions,
    hasPermission: (state) => (perm) => state.permissions.includes(perm),
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
    getUnitById: (state) => (id) => state.units.find(unit => unit.id === id),
    getUnitName: (state) => (id) => {
      const unit = state.units.find(unit => unit.id === id);
      return unit ? unit.name : '';
    },
    getUnitShortName: (state) => (id) => {
      const unit = state.units.find(unit => unit.id === id);
      return unit ? unit.short_name : '';
    },
    getCurrencyById: (state) => (id) => state.currencies.find(currency => currency.id === id),
    getCurrencySymbol: (state) => (id) => {
      const currency = state.currencies.find(currency => currency.id === id);
      return currency ? currency.symbol : 'Нет валюты';
    },
    currentCompany: (state) => state.currentCompany,
    userCompanies: (state) => state.userCompanies,
    currentCompanyId: (state) => state.currentCompany?.id || null,
    soundEnabled: (state) => state.soundEnabled,
  },
});
