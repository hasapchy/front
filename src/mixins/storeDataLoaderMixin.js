/**
 * Миксин для унификации загрузки данных из Vuex store
 * Устраняет дублирование логики проверки и загрузки данных
 */
export default {
  methods: {
    /**
     * Загрузить данные из store с проверкой наличия
     * Если данные уже есть в store, использует их, иначе загружает
     * 
     * @param {Object} config - Конфигурация загрузки
     * @param {string} config.getterName - Имя getter в store (например, 'currencies')
     * @param {string} config.dispatchName - Имя action для загрузки (например, 'loadCurrencies')
     * @param {string} config.localProperty - Имя локального свойства для сохранения (например, 'currencies')
     * @param {Function} [config.transform] - Опциональная функция трансформации данных
     * @param {Function} [config.onLoaded] - Опциональный callback после загрузки
     * @param {boolean} [config.forceReload=false] - Принудительная перезагрузка даже если данные есть
     * @param {any} [config.defaultValue=[]] - Значение по умолчанию если данных нет
     * @returns {Promise<any>} Загруженные данные
     * 
     * @example
     * await this.loadStoreData({
     *   getterName: 'currencies',
     *   dispatchName: 'loadCurrencies',
     *   localProperty: 'currencies'
     * });
     * 
     * @example
     * await this.loadStoreData({
     *   getterName: 'categories',
     *   dispatchName: 'loadCategories',
     *   localProperty: 'allProductCategories',
     *   transform: (categories) => categories.filter(c => !c.parentId),
     *   defaultValue: []
     * });
     */
    async loadStoreData(config) {
      if (!config || !config.getterName || !config.dispatchName) {
        console.warn('storeDataLoaderMixin: loadStoreData requires getterName and dispatchName');
        return config?.defaultValue || [];
      }

      const {
        getterName,
        dispatchName,
        localProperty,
        transform,
        onLoaded,
        forceReload = false,
        defaultValue = []
      } = config;

      try {
        // Проверяем наличие данных в store
        const storeData = this.$store.getters[getterName];
        const hasData = Array.isArray(storeData) ? storeData.length > 0 : !!storeData;

        if (!forceReload && hasData) {
          // Используем существующие данные
          let data = storeData;
          
          if (transform && typeof transform === 'function') {
            data = transform(data);
          }

          if (localProperty) {
            this[localProperty] = data;
          }

          if (onLoaded && typeof onLoaded === 'function') {
            onLoaded(data);
          }

          return data;
        }

        // Загружаем данные
        await this.$store.dispatch(dispatchName);
        let data = this.$store.getters[getterName] || defaultValue;

        if (transform && typeof transform === 'function') {
          data = transform(data);
        }

        if (localProperty) {
          this[localProperty] = data;
        }

        if (onLoaded && typeof onLoaded === 'function') {
          onLoaded(data);
        }

        return data;
      } catch (error) {
        console.error(`storeDataLoaderMixin: Error loading ${getterName}:`, error);
        
        const fallbackValue = defaultValue;
        if (localProperty) {
          this[localProperty] = fallbackValue;
        }
        
        return fallbackValue;
      }
    },

    /**
     * Загрузить данные из store без проверки (всегда загружает)
     * 
     * @param {Object} config - Конфигурация загрузки (см. loadStoreData)
     * @returns {Promise<any>} Загруженные данные
     * 
     * @example
     * await this.forceLoadStoreData({
     *   getterName: 'currencies',
     *   dispatchName: 'loadCurrencies',
     *   localProperty: 'currencies'
     * });
     */
    async forceLoadStoreData(config) {
      return this.loadStoreData({ ...config, forceReload: true });
    },

    /**
     * Загрузить несколько наборов данных параллельно
     * 
     * @param {Array<Object>} configs - Массив конфигураций для loadStoreData
     * @returns {Promise<Array>} Массив загруженных данных
     * 
     * @example
     * await this.loadMultipleStoreData([
     *   { getterName: 'currencies', dispatchName: 'loadCurrencies', localProperty: 'currencies' },
     *   { getterName: 'warehouses', dispatchName: 'loadWarehouses', localProperty: 'allWarehouses' }
     * ]);
     */
    async loadMultipleStoreData(configs) {
      if (!Array.isArray(configs)) {
        console.warn('storeDataLoaderMixin: loadMultipleStoreData requires an array of configs');
        return [];
      }

      const promises = configs.map(config => this.loadStoreData(config));
      return Promise.all(promises);
    }
  }
};

