import { createStore } from "vuex";
import api from "@/api/axiosInstance";
import basementApi from "@/api/basementAxiosInstance";
import CacheMonitor from "@/utils/cacheMonitor";
import CacheInvalidator from "@/utils/cacheInvalidator";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import CACHE_TTL from "@/constants/cacheTTL";
import createPersistedState from "vuex-persistedstate";
import { eventBus } from "@/eventBus";

// ✅ Utility для retry с exponential backoff
async function retryWithExponentialBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`⚠️ Попытка ${attempt + 1} не удалась, повторяю через ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// ✅ Listener для синхронизации между вкладками
function initializeStorageSync(_store) {
  let lastEmittedCompanyId = null;
  let debounceTimer = null;

  window.addEventListener('storage', (e) => {
    // ✅ Слушаем ТОЛЬКО события от ДРУГИХ вкладок (не от этой вкладки)
    if (e.key !== 'birhasap_vuex_cache') return;

    try {
      const newState = JSON.parse(e.newValue || '{}');
      const newCompanyId = newState.currentCompany?.id;

      // ✅ Базируемся на ТЕКУЩЕМ store, а не на oldValue из события
      const currentTabCompanyId = _store.state.currentCompany?.id || null;

      // ✅ Эмитим только если в ДРУГОЙ вкладке установлена иная компания
      if (!newCompanyId || newCompanyId === currentTabCompanyId) return;
      if (newCompanyId === lastEmittedCompanyId) return;

      // Если уже синхронизируемся — выходим
      if (_store.state.isSyncingCompanyFromOtherTab) return;

      // ✅ Небольшой debounce, чтобы не сыпать событиями при серии записей
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          _store.commit('SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB', true);

          // Подтягиваем актуальную компанию с сервера и ставим в store
          const response = await api.get('/user/current-company');
          const updatedCompany = new CompanyDto(response.data.company);
          _store.commit('SET_CURRENT_COMPANY', updatedCompany);
          _store.commit('SET_LAST_COMPANY_ID', updatedCompany.id);

          // Загружаем данные компании под новым контекстом
          await _store.dispatch('loadCompanyData');

          console.log('📡 Синхронизация: компания изменилась в другой вкладке');
          lastEmittedCompanyId = updatedCompany.id;
          eventBus.emit('company-changed', updatedCompany.id);
        } catch (err) {
          console.error('Ошибка синхронизации текущей компании:', err);
        } finally {
          _store.commit('SET_IS_SYNCING_COMPANY_FROM_OTHER_TAB', false);
        }
      }, 50);
    } catch (error) {
      console.error('Ошибка синхронизации между вкладками:', error);
    }
  });
}

const store = createStore({
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
    orderStatuses: [], // Статусы заказов
    projectStatuses: [], // Статусы проектов
    transactionCategories: [], // Категории транзакций
    productStatuses: [], // Статусы товаров
    currentCompany: null, // Текущая выбранная компания
    lastCompanyId: null, // ID последней загруженной компании (для отслеживания смены)
    userCompanies: [], // Список компаний пользователя
    // Кэш данных по компаниям (удаляем, используем только localStorage)
    // companyDataCache: {}, // { companyId: { warehouses: [], clients: [], ... } }
    soundEnabled: (() => {
      // Синхронно загружаем настройку звука из localStorage при инициализации store
      const soundEnabled = localStorage.getItem('soundEnabled');
      return soundEnabled !== null ? soundEnabled === 'true' : true;
    })(), // Включен ли звук
    tokenInfo: {
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      needsRefresh: false
    },
    // Мониторинг кэша
    cacheMonitor: {
      enabled: true,
      intervalId: null,
      lastCheck: null
    },
    // ✅ Флаг для предотвращения цикла между вкладками
    isChangingCompanyFromThisTab: false,
    // ✅ Флаг синхронизации компании, пришедшей из другой вкладки
    isSyncingCompanyFromOtherTab: false,
    // Фильтр по типу клиента для взаиморасчетов/финансов
    clientTypeFilter: 'all',
    // Версия логотипа для инвалидации кэша изображений
    logoVersion: 0,
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
      state.warehouses = [];
      state.cashRegisters = [];
      state.clients = [];
      state.clientsData = [];
      state.products = [];
      state.services = [];
      state.lastProducts = []; // ✅ Очищаем DTO
      state.allProducts = []; // ✅ Очищаем DTO
      // ⚠️ ИСПРАВЛЕНИЕ: теперь также очищаем plain data для другой компании!
      state.lastProductsData = []; // ✅ Очищаем plain data
      state.allProductsData = []; // ✅ Очищаем plain data
      state.categories = [];
      state.projects = [];
      state.projectsData = [];
      // ✅ Сбрасываем флаги логирования при смене компании
      state.loggedDataFlags = {
        warehouses: false,
        cashRegisters: false,
        clients: false,
        categories: false,
        projects: false,
      };
      // НЕ очищаем глобальные данные (статусы, валюты, единицы)
      // state.orderStatuses = [];
      // state.projectStatuses = [];
      // state.transactionCategories = [];
      // state.productStatuses = [];
    },
    SET_CURRENT_COMPANY(state, company) {
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
    SET_CACHE_MONITOR_INTERVAL(state, intervalId) {
      state.cacheMonitor.intervalId = intervalId;
    },
    SET_CACHE_MONITOR_LAST_CHECK(state, timestamp) {
      state.cacheMonitor.lastCheck = timestamp;
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
      state.clientTypeFilter = value || 'all';
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
            reject(new Error('Таймаут загрузки'));
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
      commit('SET_CLIENT_TYPE_FILTER', value || 'all');
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
    async loadUnits({ commit, state, dispatch, getters }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.units) {
        return dispatch('waitForLoading', 'units');
      }

      // ✅ Проверяем не истек ли кэш единиц
      const timestamp = localStorage.getItem('units_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.units;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_UNITS', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.units.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'units', loading: true });
      
      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get('/app/units');
        const data = response.data;
        commit('SET_UNITS', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('units_timestamp', Date.now().toString());
        console.log(`⚙️ Единицы (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки единиц измерения:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'units', loading: false });
      }
    },
    async loadCurrencies({ commit, state, dispatch, getters }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.currencies) {
        return dispatch('waitForLoading', 'currencies');
      }

      // ✅ Проверяем не истек ли кэш валют
      const timestamp = localStorage.getItem('currencies_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.currencies;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_CURRENCIES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.currencies.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'currencies', loading: true });
      
      try {
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get('/app/currency');
        const data = response.data;
        commit('SET_CURRENCIES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('currencies_timestamp', Date.now().toString());
        console.log(`💱 Валюты (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки валют:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'currencies', loading: false });
      }
    },
    async loadUsers({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.users) {
        return dispatch('waitForLoading', 'users');
      }

      // ✅ Проверяем не истек ли кэш пользователей
      const timestamp = localStorage.getItem('users_timestamp');
      const now = Date.now();
      const ttl = 24 * 60 * 60 * 1000; // 24 часа (глобальный справочник)
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_USERS', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.users.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'users', loading: true });
      
      try {
        const UsersController = (await import('@/api/UsersController')).default;
        const data = await UsersController.getAllUsers();
        commit('SET_USERS', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        // ✅ ИСПРАВЛЕНИЕ: сохраняем timestamp для TTL проверки
        localStorage.setItem('users_timestamp', Date.now().toString());
        console.log(`👥 Сотрудники (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
        commit('SET_USERS', []);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'users', loading: false });
      }
    },
    async loadWarehouses({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.warehouses) {
        console.log(`📦 Склады - уже загружаются...`);
        return dispatch('waitForLoading', 'warehouses');
      }

      // ✅ Получаем ID компании
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit('SET_WAREHOUSES', []);
        return;
      }

      // ✅ Ключ кэша привязан к компании
      const cacheKey = `warehouses_${companyId}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      const ttl = CACHE_TTL.warehouses;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_WAREHOUSES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.warehouses.length > 0) {
        // Логируем только один раз
        if (!state.loggedDataFlags.warehouses) {
          console.log(`  📦 Склады (${state.warehouses.length}) - из кэша`);
          commit('SET_LOGGED_DATA_FLAG', { type: 'warehouses', logged: true });
        }
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'warehouses', loading: true });
      
      try {
        const WarehouseController = (await import('@/api/WarehouseController')).default;
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => WarehouseController.getAllItems(),
          3  // maxRetries
        );
        commit('SET_WAREHOUSES', data);
        console.log(`  📦 Склады (${data.length})`);
        
        // ✅ Явно сохраняем timestamp с привязкой к компании
        localStorage.setItem(timestampKey, Date.now().toString());
      } catch (error) {
        console.error('❌ Ошибка загрузки складов после всех попыток:', error);
        commit('SET_WAREHOUSES', []);
        // Уведомляем пользователя только при окончательной ошибке
        dispatch('showNotification', {
          title: 'Ошибка загрузки складов',
          subtitle: error.message,
          isDanger: true
        });
      } finally {
        commit('SET_LOADING_FLAG', { type: 'warehouses', loading: false });
      }
    },
    async loadCashRegisters({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.cashRegisters) {
        console.log(`💰 Кассы - уже загружаются...`);
        return dispatch('waitForLoading', 'cashRegisters');
      }

      // ✅ Получаем ID компании
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit('SET_CASH_REGISTERS', []);
        return;
      }

      // ✅ Ключ кэша привязан к компании
      const cacheKey = `cashRegisters_${companyId}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      const ttl = CACHE_TTL.cashRegisters;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_CASH_REGISTERS', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.cashRegisters.length > 0) {
        // Логируем только один раз
        if (!state.loggedDataFlags.cashRegisters) {
          console.log(`  💰 Кассы (${state.cashRegisters.length}) - из кэша`);
          commit('SET_LOGGED_DATA_FLAG', { type: 'cashRegisters', logged: true });
        }
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: true });
      
      try {
        const CashRegisterController = (await import('@/api/CashRegisterController')).default;
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => CashRegisterController.getAllItems(),
          3
        );
        commit('SET_CASH_REGISTERS', data);
        console.log(`  💰 Кассы (${data.length})`);
        
        // ✅ Явно сохраняем timestamp с привязкой к компании
        localStorage.setItem(timestampKey, Date.now().toString());
      } catch (error) {
        console.error('❌ Ошибка загрузки касс после всех попыток:', error);
        commit('SET_CASH_REGISTERS', []);
        dispatch('showNotification', {
          title: 'Ошибка загрузки касс',
          subtitle: error.message,
          isDanger: true
        });
      } finally {
        commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: false });
      }
    },
    async loadClients({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.clients) {
        console.log(`👤 Клиенты - уже загружаются...`);
        return dispatch('waitForLoading', 'clients');
      }

      // ✅ Получаем ID компании
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit('SET_CLIENTS', []);
        commit('SET_CLIENTS_DATA', []);
        return;
      }

      // ✅ Ключ кэша привязан к компании
      const cacheKey = `clients_${companyId}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      const ttl = CACHE_TTL.clients;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_CLIENTS', []);
        commit('SET_CLIENTS_DATA', []);
      }

      // ✅ СНАЧАЛА проверяем есть ли кэшированные plain data (vuex-persistedstate восстановил)
      if (state.clientsData.length > 0 && state.clients.length === 0) {
        // Конвертируем plain data в DTO
        const ClientDto = (await import('@/dto/client/ClientDto')).default;
        const clients = ClientDto.fromArray(state.clientsData);
        commit('SET_CLIENTS', clients);
        return;
      }

      // Если DTO уже в state - возвращаем
      if (state.clients.length > 0) {
        // Логируем только один раз
        if (!state.loggedDataFlags.clients) {
          console.log(`  👤 Клиенты (${state.clients.length}) - из кэша`);
          commit('SET_LOGGED_DATA_FLAG', { type: 'clients', logged: true });
        }
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'clients', loading: true });
      
      try {
        const ClientController = (await import('@/api/ClientController')).default;
        const ClientDto = (await import('@/dto/client/ClientDto')).default;  // ✅ Импортируем!
        
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => ClientController.getAllItems(),
          3
        );
        
        // Сохраняем plain data для кэширования в localStorage
        const plainData = data.map(client => ({ ...client }));
        commit('SET_CLIENTS_DATA', plainData);
        
        // ✅ Конвертируем в DTO и сохраняем
        const clients = ClientDto.fromArray(plainData);
        commit('SET_CLIENTS', clients);
        
        // ✅ Явно сохраняем timestamp с привязкой к компании
        localStorage.setItem(timestampKey, Date.now().toString());
        console.log(`  👤 Клиенты (${data.length})`);
      } catch (error) {
        console.error('❌ Ошибка загрузки клиентов после всех попыток:', error);
        commit('SET_CLIENTS', []);
        commit('SET_CLIENTS_DATA', []);
        dispatch('showNotification', {
          title: 'Ошибка загрузки клиентов',
          subtitle: error.message,
          isDanger: true
        });
      } finally {
        commit('SET_LOADING_FLAG', { type: 'clients', loading: false });
      }
    },
    async loadProducts({ commit, state }) {
      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.products.length > 0) {
        return;
      }

      try {
        const ProductController = (await import('@/api/ProductController')).default;
        const data = await ProductController.getItems(1, true);
        commit('SET_PRODUCTS', data.items);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        commit('SET_PRODUCTS', []);
      }
    },
    async loadServices({ commit, state }) {
      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.services.length > 0) {
        return;
      }

      try {
        const ProductController = (await import('@/api/ProductController')).default;
        const data = await ProductController.getItems(1, false); // получаем услуги
        commit('SET_SERVICES', data.items);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        commit('SET_SERVICES', []);
      }
    },
    async loadCategories({ commit, state, dispatch }) {  // ✅ Добавляем dispatch!
      // ✅ Получаем ID компании
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit('SET_CATEGORIES', []);
        return;
      }

      // ✅ Ключ кэша привязан к компании
      const cacheKey = `categories_${companyId}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      const ttl = CACHE_TTL.categories; // 10 минут
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_CATEGORIES', []);
      }
      
      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.categories.length > 0) {
        // Логируем только один раз
        if (!state.loggedDataFlags.categories) {
          console.log(`  ✅ Категории (${state.categories.length}) - из кэша`);
          commit('SET_LOGGED_DATA_FLAG', { type: 'categories', logged: true });
        }
        return;
      }

      try {
        const CategoryController = (await import('@/api/CategoryController')).default;
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => CategoryController.getAllItems(),
          3
        );
        commit('SET_CATEGORIES', data);
        
        // ✅ Явно сохраняем timestamp с привязкой к компании
        localStorage.setItem(timestampKey, Date.now().toString());
        console.log(`  ✅ Категории (${data.length})`);
      } catch (error) {
        console.error('❌ Ошибка загрузки категорий после всех попыток:', error);
        commit('SET_CATEGORIES', []);
        dispatch('showNotification', {
          title: 'Ошибка загрузки категорий',
          subtitle: error.message,
          isDanger: true
        });
      } finally {
        commit('SET_LOADING_FLAG', { type: 'categories', loading: false });
      }
    },
    async loadProjects({ commit, state, dispatch }) {  // ✅ Добавляем dispatch!
      // ✅ Получаем ID компании
      const companyId = state.currentCompany?.id;
      if (!companyId) {
        commit('SET_PROJECTS', []);
        commit('SET_PROJECTS_DATA', []);
        return;
      }

      // ✅ Ключ кэша привязан к компании
      const cacheKey = `projects_${companyId}`;
      const timestampKey = `${cacheKey}_timestamp`;
      const timestamp = localStorage.getItem(timestampKey);
      const now = Date.now();
      const ttl = CACHE_TTL.projects;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_PROJECTS', []);
        commit('SET_PROJECTS_DATA', []);
      }

      // ✅ СНАЧАЛА проверяем есть ли кэшированные plain data (vuex-persistedstate восстановил)
      if (state.projectsData.length > 0 && state.projects.length === 0) {
        // Конвертируем plain data в DTO
        const ProjectDto = (await import('@/dto/project/ProjectDto')).default;
        const projects = ProjectDto.fromArray(state.projectsData);
        commit('SET_PROJECTS', projects);
        return;
      }

      // Если DTO уже в state - возвращаем
      if (state.projects.length > 0) {
        // Логируем только один раз
        if (!state.loggedDataFlags.projects) {
          console.log(`  📋 Проекты (${state.projects.length}) - из кэша`);
          commit('SET_LOGGED_DATA_FLAG', { type: 'projects', logged: true });
        }
        return;
      }

      try {
        const ProjectController = (await import('@/api/ProjectController')).default;
        const ProjectDto = (await import('@/dto/project/ProjectDto')).default;  // ✅ Импортируем!
        
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => ProjectController.getAllItems(),
          3
        );
        // Сохраняем plain data для кэширования в localStorage
        const plainData = data.map(project => ({ ...project }));
        commit('SET_PROJECTS_DATA', plainData);
        commit('SET_PROJECTS', ProjectDto.fromArray(plainData));
        
        // ✅ Явно сохраняем timestamp с привязкой к компании
        localStorage.setItem(timestampKey, Date.now().toString());
        console.log(`  📋 Проекты (${data.length})`);
      } catch (error) {
        console.error('❌ Ошибка загрузки проектов после всех попыток:', error);
        commit('SET_PROJECTS', []);
        commit('SET_PROJECTS_DATA', []);
        dispatch('showNotification', {
          title: 'Ошибка загрузки проектов',
          subtitle: error.message,
          isDanger: true
        });
      } finally {
        commit('SET_LOADING_FLAG', { type: 'projects', loading: false });
      }
    },
    async loadLastProducts({ commit, state, getters }) {
      // ✅ Проверяем plain data версию (из localStorage)
      if (state.lastProductsData.length > 0 && state.lastProducts.length === 0) {
        // Конвертируем plain data в DTO
        const ProductSearchDto = (await import('@/dto/product/ProductSearchDto')).default;
        const lastProducts = state.lastProductsData.map(item => ProductSearchDto.fromApi(item));
        commit('SET_LAST_PRODUCTS', lastProducts);
        return;
      }

      // ✅ Если DTO уже в state - возвращаем
      if (state.lastProducts.length > 0) {
        return;
      }

      try {
        let results;
        
        // ✅ Для basement режима используем BasementProductController
        if (getters.isBasementMode) {
          const BasementProductController = (await import('@/api/BasementProductController')).default;
          
          // Загружаем последние товары и услуги для basement
          const [productsResult, servicesResult] = await Promise.all([
            BasementProductController.getItems(1, true, {}, 5), // последние 5 товаров
            BasementProductController.getItems(1, false, {}, 5) // последние 5 услуг
          ]);
          
          // Объединяем результаты
          const allItems = [
            ...(productsResult.items || []),
            ...(servicesResult.items || [])
          ];
          
          results = { items: allItems };
        } else {
          // Для обычного режима используем ProductController
          const ProductController = (await import('@/api/ProductController')).default;
          results = await ProductController.getItems(1, null, {}, 10);
        }
        
        // Преобразуем в DTO для поиска
        const ProductSearchDto = (await import('@/dto/product/ProductSearchDto')).default;
        const lastProducts = (results.items || []).map(item => ProductSearchDto.fromApi(item));
        
        commit('SET_LAST_PRODUCTS', lastProducts);
        
        // ✅ Сохраняем plain data для кэширования
        const plainData = (results.items || []).map(item => ({ ...item }));
        commit('SET_LAST_PRODUCTS_DATA', plainData);
      } catch (error) {
        console.error('Ошибка загрузки последних товаров:', error);
        commit('SET_LAST_PRODUCTS', []);
        commit('SET_LAST_PRODUCTS_DATA', []);
      }
    },
    async loadAllProducts({ commit, state, getters }) {
      // ✅ Проверяем plain data версию (из localStorage с TTL 30 дней)
      if (state.allProductsData.length > 0 && state.allProducts.length === 0) {
        // Конвертируем plain data в DTO
        const ProductSearchDto = (await import('@/dto/product/ProductSearchDto')).default;
        const allProducts = state.allProductsData.map(item => ProductSearchDto.fromApi(item));
        commit('SET_ALL_PRODUCTS', allProducts);
        return;
      }

      // ✅ Если DTO уже в state - возвращаем
      if (state.allProducts.length > 0) {
        return;
      }

      try {
        let results;
        
        // ✅ Для basement режима используем BasementProductController
        if (getters.isBasementMode) {
          const BasementProductController = (await import('@/api/BasementProductController')).default;
          
          // Загружаем товары и услуги отдельно для basement
          const [productsResult, servicesResult] = await Promise.all([
            BasementProductController.getItems(1, true, {}, 1000), // товары
            BasementProductController.getItems(1, false, {}, 1000) // услуги
          ]);
          
          // Объединяем результаты
          const allItems = [
            ...(productsResult.items || []),
            ...(servicesResult.items || [])
          ];
          
          results = { items: allItems };
        } else {
          // Для обычного режима используем ProductController
          const ProductController = (await import('@/api/ProductController')).default;
          results = await ProductController.getItems(1, null, {}, 1000);
        }
        
        // Преобразуем в DTO для поиска
        const ProductSearchDto = (await import('@/dto/product/ProductSearchDto')).default;
        const allProducts = (results.items || []).map(item => ProductSearchDto.fromApi(item));
        
        commit('SET_ALL_PRODUCTS', allProducts);
        
        // ✅ Сохраняем plain data для кэширования (30 дней!)
        const plainData = (results.items || []).map(item => ({ ...item }));
        commit('SET_ALL_PRODUCTS_DATA', plainData);
        
        console.log(`✅ Загружено ${allProducts.length} товаров и услуг для поиска (кэш на 30 дней)`);
      } catch (error) {
        console.error('Ошибка загрузки всех товаров:', error);
        commit('SET_ALL_PRODUCTS', []);
        commit('SET_ALL_PRODUCTS_DATA', []);
      }
    },
    async loadOrderStatuses({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.orderStatuses) {
        return dispatch('waitForLoading', 'orderStatuses');
      }

      // ✅ Проверяем не истек ли кэш статусов заказов
      const timestamp = localStorage.getItem('orderStatuses_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.orderStatuses;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_ORDER_STATUSES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.orderStatuses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'orderStatuses', loading: true });
      
      try {
        const OrderStatusController = (await import('@/api/OrderStatusController')).default;
        const data = await OrderStatusController.getAllItems();
        
        // Загружаем пользовательский порядок из localStorage
        const customOrder = localStorage.getItem('orderStatuses_customOrder');
        if (customOrder) {
          const orderArray = JSON.parse(customOrder);
          // Сортируем массив согласно пользовательскому порядку
          const orderedData = orderArray
            .map(id => data.find(status => status.id === id))
            .filter(Boolean)
            .concat(data.filter(status => !orderArray.includes(status.id)));
          commit('SET_ORDER_STATUSES', orderedData);
        } else {
          commit('SET_ORDER_STATUSES', data);
        }
        
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('orderStatuses_timestamp', Date.now().toString());
        console.log(`📊 Статусы заказов (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки статусов заказов:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'orderStatuses', loading: false });
      }
    },
    async loadProjectStatuses({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.projectStatuses) {
        return dispatch('waitForLoading', 'projectStatuses');
      }

      // ✅ Проверяем не истек ли кэш статусов проектов
      const timestamp = localStorage.getItem('projectStatuses_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.projectStatuses;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_PROJECT_STATUSES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate уже восстановил из localStorage!)
      if (state.projectStatuses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'projectStatuses', loading: true });
      
      try {
        // Загружаем с сервера (vuex-persistedstate автоматически сохранит!)
        const ProjectStatusController = (await import('@/api/ProjectStatusController')).default;
        const data = await ProjectStatusController.getAllItems();
        commit('SET_PROJECT_STATUSES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('projectStatuses_timestamp', Date.now().toString());
        console.log(`🎯 Статусы проектов (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки статусов проектов:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'projectStatuses', loading: false });
      }
    },
    async loadTransactionCategories({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.transactionCategories) {
        return dispatch('waitForLoading', 'transactionCategories');
      }

      // ✅ Проверяем не истек ли кэш категорий транзакций
      const timestamp = localStorage.getItem('transactionCategories_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.transactionCategories;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_TRANSACTION_CATEGORIES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.transactionCategories.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'transactionCategories', loading: true });
      
      try {
        const TransactionCategoryController = (await import('@/api/TransactionCategoryController')).default;
        const data = await TransactionCategoryController.getAllItems();
        commit('SET_TRANSACTION_CATEGORIES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('transactionCategories_timestamp', Date.now().toString());
        console.log(`💳 Категории транзакций (${data.length})`);
      } catch (error) {
        console.error('Ошибка загрузки категорий транзакций:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'transactionCategories', loading: false });
      }
    },
    async loadProductStatuses({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.productStatuses) {
        return dispatch('waitForLoading', 'productStatuses');
      }

      // ✅ Проверяем не истек ли кэш статусов товаров
      const timestamp = localStorage.getItem('productStatuses_timestamp');
      const now = Date.now();
      const ttl = CACHE_TTL.productStatuses;
      
      // Если timestamp отсутствует или истек - очищаем state
      if (!timestamp || (now - parseInt(timestamp)) > ttl) {
        commit('SET_PRODUCT_STATUSES', []);
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.productStatuses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'productStatuses', loading: true });
      
      try {
        const AppController = (await import('@/api/AppController')).default;
        // ✅ Используем retry с exponential backoff
        const data = await retryWithExponentialBackoff(
          () => AppController.getProductStatuses(),
          3
        );
        commit('SET_PRODUCT_STATUSES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
        localStorage.setItem('productStatuses_timestamp', Date.now().toString());
        console.log(`🏷️ Статусы товаров (${data.length})`);
      } catch (error) {
        console.error('❌ Ошибка загрузки статусов товаров после всех попыток:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'productStatuses', loading: false });
      }
    },
    // Загрузка всех данных компании
    async loadCompanyData({ dispatch, commit, state }) {
      if (!state.currentCompany?.id) return;
      
      // Защита от повторной загрузки - проверяем флаг
      if (state.loadingFlags.companyData) {
        return;
      }
      
      commit('SET_LOADING_FLAG', { type: 'companyData', loading: true });
      
      try {
        // ✅ Очищаем данные ТОЛЬКО если сменилась компания
        const companyChanged = state.lastCompanyId !== state.currentCompany.id;
        if (companyChanged) {
          commit('CLEAR_COMPANY_DATA');
          commit('SET_LAST_COMPANY_ID', state.currentCompany.id);
        }
        
        // ✅ Используем Promise.allSettled вместо Promise.all
        // Это позволит загружать даже если одно из них упадет
        const results = await Promise.allSettled([
          dispatch('loadWarehouses'),
          dispatch('loadCashRegisters'),
          dispatch('loadClients'),
          dispatch('loadCategories'),
          dispatch('loadProjects')
        ]);
        
        // Проверяем результаты
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length > 0) {
          console.warn(`⚠️ ${failed.length} справочник(ов) не загрузилось`);
        }
      } finally {
        commit('SET_LOADING_FLAG', { type: 'companyData', loading: false });
      }
    },
    // Очистка кэша
    async clearCache({ commit }) {
      // Очищаем глобальный кэш (валюты, единицы, статусы)
      localStorage.removeItem('currencies_cache');
      localStorage.removeItem('currencies_cache_timestamp');
      localStorage.removeItem('units_cache');
      localStorage.removeItem('units_cache_timestamp');
      localStorage.removeItem('orderStatuses_cache');
      localStorage.removeItem('orderStatuses_cache_timestamp');
      localStorage.removeItem('projectStatuses_cache');
      localStorage.removeItem('projectStatuses_cache_timestamp');
      localStorage.removeItem('transactionCategories_cache');
      localStorage.removeItem('transactionCategories_cache_timestamp');
      localStorage.removeItem('productStatuses_cache');
      localStorage.removeItem('productStatuses_cache_timestamp');
    
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('_timestamp') || 
            key.startsWith('warehouses_') || 
            key.startsWith('cashRegisters_') ||
            key.startsWith('clients_') ||
            key.startsWith('products_') ||
            key.startsWith('services_') ||
            key.startsWith('categories_') ||
            key.startsWith('projects_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Очищаем store
      commit('CLEAR_COMPANY_DATA');
      commit('SET_CURRENCIES', []);
      commit('SET_UNITS', []);
      commit('SET_ORDER_STATUSES', []);
      commit('SET_PROJECT_STATUSES', []);
      commit('SET_TRANSACTION_CATEGORIES', []);
      commit('SET_PRODUCT_STATUSES', []);
    },
    async loadUserCompanies({ commit }) {
      try {
        const response = await api.get('/user/companies');
        const companies = CompanyDto.fromArray(response.data);
        commit('SET_USER_COMPANIES', companies);
        return companies;
      } catch (error) {
        console.error('Ошибка загрузки компаний пользователя:', error);
        return [];
      }
    },
    async loadCurrentCompany({ commit, dispatch, state }) {
      try {
        // ✅ Проверяем есть ли компания в state (vuex-persistedstate восстановил)
        if (state.currentCompany?.id) {
          // Нормализуем объект компании через DTO (после восстановления из persisted state он может быть "сырой")
          const normalized = new CompanyDto(state.currentCompany);
          commit('SET_CURRENT_COMPANY', normalized);
          // Компания уже в state, загружаем только данные
          await dispatch('loadCompanyData');
          return normalized;
        }
        
        // ✅ НОВОЕ: Если нет currentCompany, но есть lastCompanyId, восстанавливаем последнюю выбранную
        if (state.lastCompanyId && state.userCompanies?.length > 0) {
          const lastCompany = state.userCompanies.find(c => c.id === state.lastCompanyId);
          if (lastCompany) {
            // Восстанавливаем последнюю выбранную компанию
            commit('SET_CURRENT_COMPANY', lastCompany);
            await dispatch('loadCompanyData');
            return lastCompany;
          }
        }
        
        // Если lastCompanyId не помог, загружаем с сервера
        const response = await api.get('/user/current-company');
        const company = new CompanyDto(response.data.company);
        commit('SET_CURRENT_COMPANY', company);
        commit('SET_LAST_COMPANY_ID', company.id);
        
        // Загружаем данные компании
        if (company?.id) {
          await dispatch('loadCompanyData');
        }
        
        return company;
      } catch (error) {
        console.error('[loadCurrentCompany] Ошибка загрузки текущей компании:', error);
        return null;
      }
    },
    async setCurrentCompany({ commit, dispatch }, companyId) {
      try {
        const oldCompanyId = this.state.currentCompany?.id;
        
        const response = await api.post('/user/set-company', { company_id: companyId });
        const company = new CompanyDto(response.data.company);
        
        commit('SET_CURRENT_COMPANY', company);
        commit('SET_LAST_COMPANY_ID', companyId);
        
        // ✅ Инвалидируем кэш старой компании в localStorage
        if (oldCompanyId && oldCompanyId !== companyId) {
          // Инвалидируем кэш старой компании
          CacheInvalidator.invalidateByCompany(oldCompanyId);
          
          // ✅ Очищаем queryCache (кэш для постраничных списков)
          const queryCache = (await import('@/utils/queryCache')).default;
          queryCache.clear();
          
          // Очищаем данные vuex-persistedstate
          const persistKey = 'birhasap_vuex_cache';
          const stored = JSON.parse(localStorage.getItem(persistKey) || '{}');
          delete stored.warehouses;
          delete stored.cashRegisters;
          delete stored.clients;
          delete stored.clientsData;
          delete stored.products;
          delete stored.services;
          delete stored.lastProducts;
          delete stored.lastProductsData;
          delete stored.allProducts;
          delete stored.allProductsData;
          delete stored.categories;
          delete stored.projects;
          delete stored.projectsData;
          
          // Сохраняем обновленное состояние
          localStorage.setItem(persistKey, JSON.stringify(stored));
          
          // ✅ Очищаем кэш транзакций (все ключи связанные с транзакциями)
          const keysToDelete = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('transaction') || key.includes('balance'))) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => localStorage.removeItem(key));
        }
        
        // После смены компании загружаем все данные компании
        await dispatch('loadCompanyData');
        
        // ✅ Отправляем событие об изменении компании
        eventBus.emit('company-changed', companyId);
        
        return company;
      } catch (error) {
        console.error('Ошибка установки текущей компании:', error);
        throw error;
      }
    },
    // Принудительное обновление прав пользователя
    async refreshUserPermissions({ commit, getters }) {
      try {
        // Выбираем правильный API в зависимости от режима
        const apiInstance = getters.isBasementMode ? basementApi : api;
        const response = await apiInstance.get('/user/me');
        commit('SET_USER', response.data.user);
        commit('SET_PERMISSIONS', response.data.permissions);
        return response.data;
      } catch (error) {
        console.error('Ошибка обновления прав пользователя:', error);
        throw error;
      }
    },
    // Мониторинг кэша
    startCacheMonitoring({ commit, state }) {
      if (state.cacheMonitor.enabled && !state.cacheMonitor.intervalId) {
        const intervalId = CacheMonitor.startMonitoring(60000); // каждую минуту
        commit('SET_CACHE_MONITOR_INTERVAL', intervalId);
      }
    },
    stopCacheMonitoring({ commit, state }) {
      if (state.cacheMonitor.intervalId) {
        clearInterval(state.cacheMonitor.intervalId);
        commit('SET_CACHE_MONITOR_INTERVAL', null);
      }
    },
    checkCacheStatus({ commit }) {
      const info = CacheMonitor.getCacheInfo();
      commit('SET_CACHE_MONITOR_LAST_CHECK', Date.now());
      
      if (info.status.level === 'error') {
        console.error('🚨 Критический размер кэша:', info.status.message);
        // Автоматическая очистка
        CacheMonitor.autoCleanup();
      } else if (info.status.level === 'warning') {
        console.warn('⚠️ Предупреждение о размере кэша:', info.status.message);
      }
      
      return info;
    },
    // Инвалидация кэша
    invalidateCache({ commit }, { type, companyId = null }) {
      const removedCount = CacheInvalidator.invalidateByType(type);
      if (companyId) {
        CacheInvalidator.invalidateByCompany(companyId);
      }
      
      // Очищаем соответствующие данные из store
      const clearMutations = {
        currencies: 'SET_CURRENCIES',
        units: 'SET_UNITS',
        orderStatuses: 'SET_ORDER_STATUSES',
        projectStatuses: 'SET_PROJECT_STATUSES',
        transactionCategories: 'SET_TRANSACTION_CATEGORIES',
        productStatuses: 'SET_PRODUCT_STATUSES',
        warehouses: 'SET_WAREHOUSES',
        cashRegisters: 'SET_CASH_REGISTERS',
        clients: 'SET_CLIENTS',
        products: 'SET_PRODUCTS',
        services: 'SET_SERVICES',
        categories: 'SET_CATEGORIES',
        projects: 'SET_PROJECTS'
      };
      
      if (clearMutations[type]) {
        commit(clearMutations[type], []);
      }
      
      // ✅ При изменении products/services - очищаем lastProducts и allProducts
      if (type === 'products' || type === 'services') {
        commit('SET_LAST_PRODUCTS', []);
        commit('SET_LAST_PRODUCTS_DATA', []);
        commit('SET_ALL_PRODUCTS', []);
        commit('SET_ALL_PRODUCTS_DATA', []);
      }
      
      return removedCount;
    },
    // Инвалидация при CRUD операциях
    onDataCreate({ dispatch }, { type, companyId = null }) {
      dispatch('invalidateCache', { type, companyId });
    },
    onDataUpdate({ dispatch }, { type, companyId = null }) {
      dispatch('invalidateCache', { type, companyId });
    },
    onDataDelete({ dispatch }, { type, companyId = null }) {
      dispatch('invalidateCache', { type, companyId });
    },
    // Инвалидация при смене компании
    onCompanyChange({ commit }, { oldCompanyId, newCompanyId }) {
      CacheInvalidator.onCompanyChange(oldCompanyId, newCompanyId);
      // Очищаем данные компании из store
      commit('CLEAR_COMPANY_DATA');
    },
    // Инвалидация при смене пользователя
    onUserChange({ commit }) {
      CacheInvalidator.onUserChange();
      // Очищаем все данные
      commit('CLEAR_COMPANY_DATA');
      commit('SET_CURRENCIES', []);
      commit('SET_UNITS', []);
      commit('SET_ORDER_STATUSES', []);
      commit('SET_PROJECT_STATUSES', []);
      commit('SET_TRANSACTION_CATEGORIES', []);
      commit('SET_PRODUCT_STATUSES', []);
      // Очищаем текущую компанию из localStorage
      localStorage.removeItem('current_company');
    },
    // Инициализация всех систем кэширования
    initCacheSystems({ dispatch }) {
      dispatch('startCacheMonitoring');
    },
    // Остановка всех систем кэширования
    stopCacheSystems({ dispatch }) {
      dispatch('stopCacheMonitoring');
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
    isBasementMode: (state) => {
      // Проверяем, находимся ли мы в basement режиме по роли пользователя
      return state.user && state.user.roles && state.user.roles.includes('basement_worker')
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
    activeProjects: (state) => state.projects.filter(p => p.statusId !== 3 && p.statusId !== 4), // Только активные для форм
    orderStatuses: (state) => state.orderStatuses,
    projectStatuses: (state) => state.projectStatuses,
    transactionCategories: (state) => state.transactionCategories,
    productStatuses: (state) => state.productStatuses,
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
    // ✅ Пользователи, отфильтрованные по текущей компании
    // Показываем только тех, у кого есть доступ к текущей компании (т.е. они являются сотрудниками этой компании)
    usersForCurrentCompany: (state) => {
      const currentCompanyId = state.currentCompany?.id;
      if (!currentCompanyId) {
        // Если нет текущей компании - возвращаем всех (на случай, если это глобальный режим)
        return state.users;
      }
      // Фильтруем: показываем пользователей, у которых текущая компания есть в списке компаний
      return state.users.filter(user => {
        if (!user.companies || user.companies.length === 0) {
          return false; // Если у пользователя нет компаний - не показываем
        }
        // Проверяем, есть ли у пользователя текущая компания (т.е. он сотрудник этой компании)
        // Используем сравнение с приведением типов для надежности
        return user.companies.some(company => Number(company.id) === Number(currentCompanyId));
      });
    },
    soundEnabled: (state) => state.soundEnabled,
    // Настройки округления для текущей компании
    roundingDecimals: (state) => state.currentCompany?.rounding_decimals ?? 2,
    roundingEnabled: (state) => state.currentCompany?.rounding_enabled ?? true,
    roundingDirection: (state) => state.currentCompany?.rounding_direction || 'standard',
    roundingCustomThreshold: (state) => state.currentCompany?.rounding_custom_threshold ?? 0.5,
    // Мониторинг кэша
    cacheMonitor: (state) => state.cacheMonitor,
    cacheInfo: () => CacheMonitor.getCacheInfo(),
    cacheStatus: () => CacheMonitor.getCacheStatus(),
    clientTypeFilter: (state) => state.clientTypeFilter || 'all',
  },
  plugins: [
    createPersistedState({
      key: 'birhasap_vuex_cache',
      paths: [
        // Глобальные справочники (24 часа)
        'units',
        'currencies',
        'users',         // ✅ Сотрудники (для модалок создания)
        'orderStatuses',
        'projectStatuses',
        'transactionCategories',
        'productStatuses',
        
        // Данные компании (10 минут)
        'warehouses',
        'cashRegisters',
        'clientsData',   // ✅ Кэшируем plain data (без методов DTO)
        'categories',   // ← Нужно для фильтров
        'projectsData',  // ✅ Кэшируем plain data (без методов DTO)
        'lastProductsData',  // ✅ Последние товары - plain data (5 минут)
        'allProductsData',  // ✅ ВСЕ товары - plain data (30 дней!)
        // 'products',  // ← НЕ кэшируем глобально - каждая страница загружает свои данные
        // 'services',  // ← НЕ кэшируем глобально - каждая страница загружает свои данные
        
        // Текущая компания и настройки
        'currentCompany',
        'lastCompanyId', // ✅ Для отслеживания смены компании
        'userCompanies',
        'soundEnabled',
        // Пользовательские UI фильтры
        'clientTypeFilter',
      ],
      
      // Кастомная логика для проверки TTL при восстановлении
      getState: (key, storage) => {
        const value = storage.getItem(key);
        if (!value) return undefined;
        
        try {
          const state = JSON.parse(value);
          
          // Проверяем TTL для каждого кэшируемого поля
          const now = Date.now();
          const fieldsToCheck = {
            // Глобальные
            units: CACHE_TTL.units,
            currencies: CACHE_TTL.currencies,
            users: 24 * 60 * 60 * 1000, // 24 часа (как глобальный справочник)
            orderStatuses: CACHE_TTL.orderStatuses,
            projectStatuses: CACHE_TTL.projectStatuses,
            transactionCategories: CACHE_TTL.transactionCategories,
            productStatuses: CACHE_TTL.productStatuses,
            
            // Данные компании
            warehouses: CACHE_TTL.warehouses,
            cashRegisters: CACHE_TTL.cashRegisters,
            clientsData: CACHE_TTL.clients, // Plain data версия
            categories: CACHE_TTL.categories,
            projectsData: CACHE_TTL.projects, // Plain data версия
            lastProductsData: 5 * 60 * 1000, // 5 минут (часто меняющиеся данные)
            allProductsData: CACHE_TTL.products, // 30 дней (ВСЕ товары для поиска)
            // products, services НЕ кэшируем глобально (загружаются на своих страницах)
          };
          
          // Проверяем timestamp для каждого поля
          Object.keys(fieldsToCheck).forEach(field => {
            if (state[field] && Array.isArray(state[field]) && state[field].length > 0) {
              const timestampKey = `${field}_timestamp`;
              const timestamp = storage.getItem(timestampKey);
              
              if (timestamp && (now - parseInt(timestamp)) > fieldsToCheck[field]) {
                // TTL истёк - очищаем это поле
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
        const fieldsWithTimestamp = [
          'units', 'currencies', 'users', 'orderStatuses', 'projectStatuses',
          'transactionCategories', 'productStatuses', 'warehouses',
          'cashRegisters', 'clientsData', 'categories', 'projectsData', 'lastProductsData', 'allProductsData'
          // products, services НЕ кэшируем глобально (загружаются на своих страницах)
        ];
        
        fieldsWithTimestamp.forEach(field => {
          if (state[field] && Array.isArray(state[field]) && state[field].length > 0) {
            storage.setItem(`${field}_timestamp`, now);
          }
        });
      }
    })
  ],
});

// ✅ Инициализируем синхронизацию между вкладками
initializeStorageSync(store);

// Обработчик события обновления компании
eventBus.on('company-updated', async () => {
  // Загружаем обновленный список компаний
  await store.dispatch('loadUserCompanies');
  
  // Обновляем currentCompany если обновлялась текущая компания
  const currentCompanyId = store.state.currentCompany?.id;
  if (currentCompanyId) {
    // Перезагружаем текущую компанию с сервера, чтобы получить самые свежие данные
    // Это аналогично тому, как происходит при смене компании через setCurrentCompany
    try {
      const response = await api.get('/user/current-company');
      const updatedCompany = new CompanyDto(response.data.company);
      
      // Обновляем currentCompany с новыми данными с сервера (включая логотип и updatedAt)
      store.commit('SET_CURRENT_COMPANY', updatedCompany);
      console.log('[Company Updated] Обновлен currentCompany:', {
        id: updatedCompany.id,
        name: updatedCompany.name,
        logo: updatedCompany.logo,
        updatedAt: updatedCompany.updatedAt,
        rounding_decimals: updatedCompany.rounding_decimals
      });
      // Бамп версии логотипа для инвалидации кэша изображений
      store.commit('INCREMENT_LOGO_VERSION');
      
      // Отправляем событие об изменении компании, чтобы компоненты обновились
      eventBus.emit('company-changed', currentCompanyId);
    } catch (error) {
      console.error('[Company Updated] Ошибка при загрузке обновленной компании:', error);
      // Fallback: используем данные из списка компаний
      const updatedCompany = store.state.userCompanies.find(c => c.id === currentCompanyId);
      if (updatedCompany) {
        store.commit('SET_CURRENT_COMPANY', updatedCompany);
        console.log('[Company Updated] Использованы данные из списка:', {
          id: updatedCompany.id,
          logo: updatedCompany.logo,
          updatedAt: updatedCompany.updatedAt,
          rounding_decimals: updatedCompany.rounding_decimals
        });
        store.commit('INCREMENT_LOGO_VERSION');
        // Отправляем событие об изменении компании
        eventBus.emit('company-changed', currentCompanyId);
      }
    }
  }
});

// Обработчик события инвалидации кэша
eventBus.on('cache:invalidate', ({ type }) => {
  // Очищаем соответствующие данные в state при инвалидации кэша
  const stateMapping = {
    projectStatuses: 'SET_PROJECT_STATUSES',
    orderStatuses: 'SET_ORDER_STATUSES',
    orderStatusCategories: 'SET_ORDER_STATUSES', // также инвалидируем orderStatuses
    transactionCategories: 'SET_TRANSACTION_CATEGORIES',
    productStatuses: 'SET_PRODUCT_STATUSES',
    currencies: 'SET_CURRENCIES',
    units: 'SET_UNITS',
    warehouses: 'SET_WAREHOUSES',
    cashRegisters: 'SET_CASH_REGISTERS',
    clients: 'SET_CLIENTS',
    categories: 'SET_CATEGORIES',
    projects: 'SET_PROJECTS',
    users: 'SET_USERS',
    products: 'SET_PRODUCTS',
    services: 'SET_SERVICES',
  };

  const mutation = stateMapping[type];
  if (mutation) {
    store.commit(mutation, []);
    
    // Для clients также очищаем clientsData
    if (type === 'clients') {
      store.commit('SET_CLIENTS_DATA', []);
    }
    // Для projects также очищаем projectsData
    if (type === 'projects') {
      store.commit('SET_PROJECTS_DATA', []);
    }
  }
});

export default store;
