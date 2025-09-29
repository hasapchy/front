import { createStore } from "vuex";
import api from "@/api/axiosInstance";
import CacheUtils from "@/utils/cacheUtils";

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
    // Флаги загрузки для предотвращения множественных запросов
    loadingFlags: {
      units: false,
      currencies: false,
      warehouses: false,
      cashRegisters: false,
      clients: false,
      products: false,
      services: false,
      categories: false,
      projects: false
    },
    warehouses: [], // Склады
    cashRegisters: [], // Кассы
    clients: [], // Клиенты
    products: [], // Товары
    services: [], // Услуги
    categories: [], // Категории
    projects: [], // Проекты
    currentCompany: null, // Текущая выбранная компания
    userCompanies: [], // Список компаний пользователя
    // Кэш данных по компаниям
    companyDataCache: {}, // { companyId: { warehouses: [], clients: [], ... } }
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
    SET_WAREHOUSES(state, warehouses) {
      state.warehouses = warehouses;
    },
    SET_CASH_REGISTERS(state, cashRegisters) {
      state.cashRegisters = cashRegisters;
    },
    SET_CLIENTS(state, clients) {
      state.clients = clients;
    },
    SET_PRODUCTS(state, products) {
      state.products = products;
    },
    SET_SERVICES(state, services) {
      state.services = services;
    },
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_PROJECTS(state, projects) {
      state.projects = projects;
    },
    SET_COMPANY_DATA_CACHE(state, { companyId, dataType, data }) {
      if (!state.companyDataCache[companyId]) {
        state.companyDataCache[companyId] = {};
      }
      state.companyDataCache[companyId][dataType] = data;
    },
    CLEAR_COMPANY_DATA(state) {
      state.warehouses = [];
      state.cashRegisters = [];
      state.clients = [];
      state.products = [];
      state.services = [];
      state.categories = [];
      state.projects = [];
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
    SET_LOADING_FLAG(state, { type, loading }) {
      state.loadingFlags[type] = loading;
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
    async loadUnits({ commit, state }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.units) {
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (!state.loadingFlags.units) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      // Если уже загружены, не загружаем повторно
      if (state.units.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'units', loading: true });
      
      try {
        // Проверяем кэш (24 часа)
        const cachedUnits = CacheUtils.get('units_cache', 24 * 60 * 60 * 1000);
        if (cachedUnits) {
          commit('SET_UNITS', cachedUnits);
          console.log('Единицы измерения загружены из кэша');
          return;
        }
        
        // Загружаем с сервера
        const response = await api.get('/app/units');
        const data = response.data;
        commit('SET_UNITS', data);
        
        // Сохраняем в кэш
        CacheUtils.set('units_cache', data);
        console.log('Единицы измерения загружены с сервера и закэшированы');
      } catch (error) {
        console.error('Ошибка загрузки единиц измерения:', error);
        // При ошибке пытаемся использовать устаревший кэш
        const cachedUnits = CacheUtils.get('units_cache', Infinity);
        if (cachedUnits) {
          commit('SET_UNITS', cachedUnits);
          console.log('Используем устаревший кэш единиц измерения из-за ошибки сети');
        }
      } finally {
        commit('SET_LOADING_FLAG', { type: 'units', loading: false });
      }
    },
    async loadCurrencies({ commit, state }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.currencies) {
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (!state.loadingFlags.currencies) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      // Если уже загружены, не загружаем повторно
      if (state.currencies.length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type: 'currencies', loading: true });
      
      try {
        // Проверяем кэш (24 часа)
        const cachedCurrencies = CacheUtils.get('currencies_cache', 24 * 60 * 60 * 1000);
        if (cachedCurrencies) {
          commit('SET_CURRENCIES', cachedCurrencies);
          console.log('Валюты загружены из кэша');
          return;
        }
        
        // Загружаем с сервера
        const response = await api.get('/app/currency');
        const data = response.data;
        commit('SET_CURRENCIES', data);
        
        // Сохраняем в кэш
        CacheUtils.set('currencies_cache', data);
        console.log('Валюты загружены с сервера и закэшированы');
      } catch (error) {
        console.error('Ошибка загрузки валют:', error);
        // При ошибке пытаемся использовать устаревший кэш
        const cachedCurrencies = CacheUtils.get('currencies_cache', Infinity);
        if (cachedCurrencies) {
          commit('SET_CURRENCIES', cachedCurrencies);
          console.log('Используем устаревший кэш валют из-за ошибки сети');
        }
      } finally {
        commit('SET_LOADING_FLAG', { type: 'currencies', loading: false });
      }
    },
    async loadWarehouses({ commit, state }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.warehouses) {
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (!state.loadingFlags.warehouses) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }


      commit('SET_LOADING_FLAG', { type: 'warehouses', loading: true });
      
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`warehouses_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`warehouses_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const warehouses = JSON.parse(cachedData);
            commit('SET_WAREHOUSES', warehouses);
            console.log(`Склады компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const WarehouseController = (await import('@/api/WarehouseController')).default;
        const data = await WarehouseController.getAllItems();
        commit('SET_WAREHOUSES', data);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`warehouses_${companyId}`, JSON.stringify(data));
          localStorage.setItem(`warehouses_${companyId}_timestamp`, Date.now().toString());
          console.log(`Склады компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки складов:', error);
        commit('SET_WAREHOUSES', []);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'warehouses', loading: false });
      }
    },
    async loadCashRegisters({ commit, state }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.cashRegisters) {
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (!state.loadingFlags.cashRegisters) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }


      commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: true });
      
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`cashRegisters_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`cashRegisters_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const cashRegisters = JSON.parse(cachedData);
            commit('SET_CASH_REGISTERS', cashRegisters);
            console.log(`Кассы компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const CashRegisterController = (await import('@/api/CashRegisterController')).default;
        const data = await CashRegisterController.getAllItems();
        commit('SET_CASH_REGISTERS', data);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`cashRegisters_${companyId}`, JSON.stringify(data));
          localStorage.setItem(`cashRegisters_${companyId}_timestamp`, Date.now().toString());
          console.log(`Кассы компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки касс:', error);
        // При ошибке пытаемся использовать кэш
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`cashRegisters_${companyId}`);
          if (cachedData) {
            commit('SET_CASH_REGISTERS', JSON.parse(cachedData));
            console.log('Используем кэшированные кассы из-за ошибки сети');
          }
        }
      } finally {
        commit('SET_LOADING_FLAG', { type: 'cashRegisters', loading: false });
      }
    },
    async loadClients({ commit, state }) {
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags.clients) {
        return new Promise((resolve) => {
          const checkLoaded = () => {
            if (!state.loadingFlags.clients) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }


      commit('SET_LOADING_FLAG', { type: 'clients', loading: true });
      
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`clients_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`clients_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const ClientDto = (await import('@/dto/client/ClientDto')).default;
            const rawClients = JSON.parse(cachedData);
            console.log('DEBUG: Raw client data from cache:', rawClients[0]);
            
            // Проверяем формат данных - если уже ClientDto (camelCase), используем как есть
            const clients = rawClients.map(clientData => {
              if (clientData.firstName !== undefined) {
                // Данные уже в формате ClientDto, создаем новый объект
                return new ClientDto(
                  clientData.id,
                  clientData.clientType,
                  clientData.balance,
                  clientData.isSupplier,
                  clientData.isConflict,
                  clientData.firstName,
                  clientData.lastName,
                  clientData.contactPerson,
                  clientData.address,
                  clientData.note,
                  clientData.status,
                  clientData.discountType,
                  clientData.discount,
                  clientData.createdAt,
                  clientData.updatedAt,
                  clientData.emails || [],
                  clientData.phones || [],
                  clientData.userId,
                  clientData.userName
                );
              } else {
                // Данные в формате API (snake_case), используем fromApi
                return ClientDto.fromApi(clientData);
              }
            });
            
            console.log('DEBUG: Created ClientDto from cache:', clients[0]);
            commit('SET_CLIENTS', clients);
            console.log(`Клиенты компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const ClientController = (await import('@/api/ClientController')).default;
        const data = await ClientController.getAllItems();
        commit('SET_CLIENTS', data);
        
        // Кэшируем для текущей компании (сохраняем сырые данные для корректного восстановления)
        if (companyId) {
          const rawData = data.map(client => client.toJson ? client.toJson() : client);
          localStorage.setItem(`clients_${companyId}`, JSON.stringify(rawData));
          localStorage.setItem(`clients_${companyId}_timestamp`, Date.now().toString());
          console.log(`Клиенты компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки клиентов:', error);
        commit('SET_CLIENTS', []);
      } finally {
        commit('SET_LOADING_FLAG', { type: 'clients', loading: false });
      }
    },
    async loadProducts({ commit, state }) {
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`products_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`products_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const products = JSON.parse(cachedData);
            commit('SET_PRODUCTS', products);
            console.log(`Товары компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const ProductController = (await import('@/api/ProductController')).default;
        const data = await ProductController.getItems(1, true); // получаем товары
        commit('SET_PRODUCTS', data.items);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`products_${companyId}`, JSON.stringify(data.items));
          localStorage.setItem(`products_${companyId}_timestamp`, Date.now().toString());
          console.log(`Товары компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        commit('SET_PRODUCTS', []);
      }
    },
    async loadServices({ commit, state }) {
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`services_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`services_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const services = JSON.parse(cachedData);
            commit('SET_SERVICES', services);
            console.log(`Услуги компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const ProductController = (await import('@/api/ProductController')).default;
        const data = await ProductController.getItems(1, false); // получаем услуги
        commit('SET_SERVICES', data.items);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`services_${companyId}`, JSON.stringify(data.items));
          localStorage.setItem(`services_${companyId}_timestamp`, Date.now().toString());
          console.log(`Услуги компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
        commit('SET_SERVICES', []);
      }
    },
    async loadCategories({ commit, state }) {
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`categories_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`categories_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const categories = JSON.parse(cachedData);
            commit('SET_CATEGORIES', categories);
            console.log(`Категории компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const CategoryController = (await import('@/api/CategoryController')).default;
        const data = await CategoryController.getAllItems();
        commit('SET_CATEGORIES', data);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`categories_${companyId}`, JSON.stringify(data));
          localStorage.setItem(`categories_${companyId}_timestamp`, Date.now().toString());
          console.log(`Категории компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        commit('SET_CATEGORIES', []);
      }
    },
    async loadProjects({ commit, state }) {
      try {
        // Проверяем кэш для текущей компании
        const companyId = state.currentCompany?.id;
        if (companyId) {
          const cachedData = localStorage.getItem(`projects_${companyId}`);
          const cacheTimestamp = localStorage.getItem(`projects_${companyId}_timestamp`);
          const now = Date.now();
          const cacheAge = 10 * 60 * 1000; // 10 минут для данных компании
          
          if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheAge) {
            const projects = JSON.parse(cachedData);
            commit('SET_PROJECTS', projects);
            console.log(`Проекты компании ${companyId} загружены из кэша`);
            return;
          }
        }
        
        // Используем контроллер для правильного преобразования в DTO
        const ProjectController = (await import('@/api/ProjectController')).default;
        const data = await ProjectController.getActiveItems();
        commit('SET_PROJECTS', data);
        
        // Кэшируем для текущей компании
        if (companyId) {
          localStorage.setItem(`projects_${companyId}`, JSON.stringify(data));
          localStorage.setItem(`projects_${companyId}_timestamp`, Date.now().toString());
          console.log(`Проекты компании ${companyId} загружены с сервера и закэшированы`);
        }
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error);
        commit('SET_PROJECTS', []);
      }
    },
    // Загрузка всех данных компании
    async loadCompanyData({ dispatch, commit, state }) {
      if (!state.currentCompany?.id) return;
      
      commit('CLEAR_COMPANY_DATA');
      
      // Загружаем все данные параллельно
      await Promise.all([
        dispatch('loadWarehouses'),
        dispatch('loadCashRegisters'),
        dispatch('loadClients'),
        dispatch('loadProducts'),
        dispatch('loadServices'),
        dispatch('loadCategories'),
        dispatch('loadProjects')
      ]);
    },
    // Очистка кэша
    async clearCache({ commit }) {
      // Очищаем глобальный кэш (валюты, единицы)
      localStorage.removeItem('currencies_cache');
      localStorage.removeItem('currencies_cache_timestamp');
      localStorage.removeItem('units_cache');
      localStorage.removeItem('units_cache_timestamp');
      
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
      
      console.log('Кэш очищен');
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
    async setCurrentCompany({ commit, dispatch }, companyId) {
      try {
        const response = await api.post('/user/set-company', { company_id: companyId });
        commit('SET_CURRENT_COMPANY', response.data.company);
        
        // После смены компании загружаем все данные компании
        await dispatch('loadCompanyData');
        
        return response.data.company;
      } catch (error) {
        console.error('Ошибка установки текущей компании:', error);
        throw error;
      }
    },
    // Принудительное обновление прав пользователя
    async refreshUserPermissions({ commit, state }) {
      try {
        const response = await api.get('/user/me');
        commit('SET_USER', response.data.user);
        commit('SET_PERMISSIONS', response.data.permissions);
        return response.data;
      } catch (error) {
        console.error('Ошибка обновления прав пользователя:', error);
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
    warehouses: (state) => state.warehouses,
    cashRegisters: (state) => state.cashRegisters,
    clients: (state) => state.clients,
    products: (state) => state.products,
    services: (state) => state.services,
    categories: (state) => state.categories,
    projects: (state) => state.projects,
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
