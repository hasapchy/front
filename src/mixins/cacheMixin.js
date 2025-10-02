/**
 * Миксин для работы с кэшированием данных
 */
import CacheUtils from '@/utils/cacheUtils';

export default {
  methods: {
    /**
     * Универсальная функция загрузки данных с кэшированием
     * @param {string} type - тип данных (units, currencies, etc.)
     * @param {Function} loader - функция загрузки данных
     * @param {number} ttl - время жизни кэша в миллисекундах
     * @param {string} cacheKey - ключ кэша (опционально)
     * @param {boolean} isCompanyData - является ли данными компании
     */
    async loadCachedData(type, loader, ttl = 24 * 60 * 60 * 1000, cacheKey = null, isCompanyData = false) {
      const { commit, state, dispatch } = this.$store;
      const key = cacheKey || `${type}_cache`;
      
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags[type]) {
        return this.waitForLoading(state.loadingFlags[type]);
      }

      // Если уже загружены, не загружаем повторно
      if (state[type] && state[type].length > 0) {
        return;
      }

      commit('SET_LOADING_FLAG', { type, loading: true });
      
      try {
        // Проверяем кэш
        const cachedData = CacheUtils.get(key, ttl);
        if (cachedData) {
          commit(`SET_${type.toUpperCase()}`, cachedData);
          return;
        }
        
        // Загружаем с сервера
        const data = await loader();
        commit(`SET_${type.toUpperCase()}`, data);
        
        // Сохраняем в кэш
        CacheUtils.set(key, data);
      } catch (error) {
        console.error(`Ошибка загрузки ${type}:`, error);
        
        // При ошибке пытаемся использовать устаревший кэш
        const cachedData = CacheUtils.get(key, Infinity);
        if (cachedData) {
          commit(`SET_${type.toUpperCase()}`, cachedData);
        } else {
          commit(`SET_${type.toUpperCase()}`, []);
        }
      } finally {
        commit('SET_LOADING_FLAG', { type, loading: false });
      }
    },

    /**
     * Ожидание завершения загрузки
     */
    async waitForLoading(loadingFlag, maxAttempts = 50) {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkLoaded = () => {
          if (!loadingFlag) {
            resolve();
          } else if (attempts >= maxAttempts) {
            console.warn(`Таймаут ожидания загрузки: ${loadingFlag}`);
            reject(new Error('Таймаут загрузки'));
          } else {
            attempts++;
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    },

    /**
     * Загрузка данных компании с кэшированием
     */
    async loadCompanyCachedData(type, loader, companyId) {
      const { commit, state } = this.$store;
      const key = `${type}_${companyId}`;
      const ttl = 10 * 60 * 1000; // 10 минут для данных компании
      
      // Если уже загружаются, ждем завершения
      if (state.loadingFlags[type]) {
        return this.waitForLoading(state.loadingFlags[type]);
      }

      commit('SET_LOADING_FLAG', { type, loading: true });
      
      try {
        // Проверяем кэш для текущей компании
        const cachedData = localStorage.getItem(key);
        const cacheTimestamp = localStorage.getItem(`${key}_timestamp`);
        const now = Date.now();
        
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ttl) {
          const data = JSON.parse(cachedData);
          commit(`SET_${type.toUpperCase()}`, data);
          return;
        }
        
        // Загружаем с сервера
        const data = await loader();
        commit(`SET_${type.toUpperCase()}`, data);
        
        // Кэшируем для текущей компании
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      } catch (error) {
        console.error(`Ошибка загрузки ${type}:`, error);
        
        // При ошибке пытаемся использовать кэш
        const cachedData = localStorage.getItem(key);
        if (cachedData) {
          commit(`SET_${type.toUpperCase()}`, JSON.parse(cachedData));
        } else {
          commit(`SET_${type.toUpperCase()}`, []);
        }
      } finally {
        commit('SET_LOADING_FLAG', { type, loading: false });
      }
    }
  }
};
