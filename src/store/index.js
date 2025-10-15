import { createStore } from "vuex";
import api from "@/api/axiosInstance";
import basementApi from "@/api/basementAxiosInstance";
import CacheMonitor from "@/utils/cacheMonitor";
import CacheInvalidator from "@/utils/cacheInvalidator";
import { CompanyDto } from "@/dto/companies/CompanyDto";
import CACHE_TTL from "@/constants/cacheTTL";
import createPersistedState from "vuex-persistedstate";

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
      productStatuses: false
    },
    users: [], // Пользователи (для модалок создания)
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
      // Очищаем ВСЕ данные компании (вызывается только при смене компании)
      state.warehouses = [];
      state.cashRegisters = [];
      state.clients = [];
      state.clientsData = [];
      state.products = [];
      state.services = [];
      state.lastProducts = []; // ✅ Очищаем DTO
      state.allProducts = []; // ✅ Очищаем DTO
      // НЕ очищаем lastProductsData и allProductsData - пусть кэшируется
      state.categories = [];
      state.projects = [];
      state.projectsData = [];
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
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        commit('SET_USERS', []);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'users', loading: false });
      }
    },
    async loadWarehouses({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.warehouses) {
        return dispatch('waitForLoading', 'warehouses');
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.warehouses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'warehouses', loading: true });
      
      try {
        const WarehouseController = (await import('@/api/WarehouseController')).default;
        const data = await WarehouseController.getAllItems();
        commit('SET_WAREHOUSES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки складов:', error);
        commit('SET_WAREHOUSES', []);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'warehouses', loading: false });
      }
    },
    async loadCashRegisters({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.cashRegisters) {
        return dispatch('waitForLoading', 'cashRegisters');
      }

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.cashRegisters.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: true });
      
      try {
        const companyId = state.currentCompany?.id;
        if (!companyId) {
          commit('SET_CASH_REGISTERS', []);
          return;
        }
        
        const CashRegisterController = (await import('@/api/CashRegisterController')).default;
        const data = await CashRegisterController.getAllItems();
        commit('SET_CASH_REGISTERS', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки касс:', error);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: false });
      }
    },
    async loadClients({ commit, state, dispatch }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.clients) {
        return dispatch('waitForLoading', 'clients');
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
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'clients', loading: true });
      
      try {
        const ClientController = (await import('@/api/ClientController')).default;
        const data = await ClientController.getAllItems();
        
        // Сохраняем DTO для использования
        commit('SET_CLIENTS', data);
        
        // Сохраняем plain data для кэширования в localStorage
        const plainData = data.map(client => ({ ...client }));
        commit('SET_CLIENTS_DATA', plainData);
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        commit('SET_CLIENTS', []);
        commit('SET_CLIENTS_DATA', []);
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
    async loadCategories({ commit, state }) {
      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.categories.length > 0) {
        return;
      }

      try {
        const CategoryController = (await import('@/api/CategoryController')).default;
        const data = await CategoryController.getAllItems();
        commit('SET_CATEGORIES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        commit('SET_CATEGORIES', []);
      }
    },
    async loadProjects({ commit, state }) {
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
        return;
      }

      try {
        const ProjectController = (await import('@/api/ProjectController')).default;
        const data = await ProjectController.getAllItems();
        
        // Сохраняем DTO для использования
        commit('SET_PROJECTS', data);
        
        // Сохраняем plain data для кэширования в localStorage
        const plainData = data.map(project => ({ ...project }));
        commit('SET_PROJECTS_DATA', plainData);
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        commit('SET_PROJECTS', []);
        commit('SET_PROJECTS_DATA', []);
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

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.orderStatuses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'orderStatuses', loading: true });
      
      try {
        const OrderStatusController = (await import('@/api/OrderStatusController')).default;
        const data = await OrderStatusController.getAllItems();
        commit('SET_ORDER_STATUSES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
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

      // Если уже в state - возвращаем (vuex-persistedstate восстановил!)
      if (state.productStatuses.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'productStatuses', loading: true });
      
      try {
        const AppController = (await import('@/api/AppController')).default;
        const data = await AppController.getProductStatuses();
        commit('SET_PRODUCT_STATUSES', data);
        // ✅ vuex-persistedstate автоматически сохранит в localStorage!
      } catch (error) {
        console.error('Ошибка загрузки статусов товаров:', error);
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
        
        // Загружаем только нужные данные параллельно
        // Products/Services НЕ загружаются глобально - они загружаются на своих страницах через API
        await Promise.all([
          dispatch('loadWarehouses'),
          dispatch('loadCashRegisters'),
          dispatch('loadClients'),
          // dispatch('loadProducts'),   // ❌ Убрано - ProductsPage делает API запрос
          // dispatch('loadServices'),   // ❌ Убрано - ServicesPage делает API запрос
          dispatch('loadCategories'),    // ✅ Нужно для фильтров
          dispatch('loadProjects')
        ]);
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
      
      // НЕ очищаем текущую компанию, только кэш данных
      // localStorage.removeItem('current_company');
      
      // Очищаем кэш данных компаний
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
    async loadCurrentCompany({ commit, dispatch, state, getters }) {
      try {
        // Для basement системы используем компанию по умолчанию
        if (getters.isBasementMode) {
          const defaultCompany = new CompanyDto({ id: 1, name: 'Default Company' });
          commit('SET_CURRENT_COMPANY', defaultCompany);
          commit('SET_LAST_COMPANY_ID', defaultCompany.id);
          return defaultCompany;
        }
        
        // ✅ Проверяем есть ли компания в state (vuex-persistedstate восстановил)
        if (state.currentCompany?.id) {
          // Компания уже в state, загружаем только данные
          await dispatch('loadCompanyData');
          return state.currentCompany;
        }
        
        // Если в state нет, загружаем с сервера
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
        console.error('Ошибка загрузки текущей компании:', error);
        return null;
      }
    },
    async setCurrentCompany({ commit, dispatch }, companyId) {
      try {
        const response = await api.post('/user/set-company', { company_id: companyId });
        const company = new CompanyDto(response.data.company);
        commit('SET_CURRENT_COMPANY', company);
        
        // vuex-persistedstate автоматически сохранит в localStorage, не нужно дублировать
        
        // После смены компании загружаем все данные компании
        // loadCompanyData сам проверит что компания изменилась и очистит кэш
        await dispatch('loadCompanyData');
        
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
    soundEnabled: (state) => state.soundEnabled,
    // Мониторинг кэша
    cacheMonitor: (state) => state.cacheMonitor,
    cacheInfo: () => CacheMonitor.getCacheInfo(),
    cacheStatus: () => CacheMonitor.getCacheStatus(),
  },
  plugins: [
    createPersistedState({
      key: 'birhasap_vuex_cache',
      paths: [
        // Глобальные справочники (24 часа)
        'units',
        'currencies',
        'users',         // ✅ Пользователи (для модалок создания)
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
