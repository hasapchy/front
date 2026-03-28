import { STORE_CONFIG } from '@/store/config';

const COMPANY_DATA_FIELDS = new Set(STORE_CONFIG.companyDataFields || []);

export default {
  methods: {
  
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
        const storeData = this.$store.getters[getterName];
        const hasData = Array.isArray(storeData) ? storeData.length > 0 : !!storeData;
        const isCompanyScoped = config.companyScoped === true ||
          COMPANY_DATA_FIELDS.has(getterName) ||
          COMPANY_DATA_FIELDS.has(localProperty);

        if (!forceReload && hasData && !isCompanyScoped) {
          let data = storeData;
          
          if (transform) {
            data = transform(data);
          }

          if (localProperty) {
            this[localProperty] = data;
          }

          if (onLoaded) {
            onLoaded(data);
          }

          return data;
        }

        await this.$store.dispatch(dispatchName);
        let data = this.$store.getters[getterName] || defaultValue;

        if (transform) {
          data = transform(data);
        }

        if (localProperty) {
          this[localProperty] = data;
        }

        if (onLoaded) {
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

