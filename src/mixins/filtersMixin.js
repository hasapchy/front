export default {
  computed: {
    hasActiveFilters() {
      return this.getActiveFiltersCount() > 0;
    }
  },
  methods: {
    /**
     * Применить фильтры - вызывает fetchItems с первой страницы
     * Можно переопределить в компоненте для дополнительной логики
     */
    applyFilters() {
      if (this.viewMode === 'kanban' && typeof this.resetKanbanPagination === 'function') {
        this.resetKanbanPagination();
      }
      
      if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, true);
      }
    },
    
    /**
     * Сбросить фильтры - базовый метод, должен быть переопределен в компоненте
     * для сброса конкретных фильтров
     */
    resetFilters() {
      if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, true);
      }
    },
    
    /**
     * Получить количество активных фильтров - должен быть переопределен в компоненте
     * @returns {number}
     */
    getActiveFiltersCount() {
      return 0;
    },

    /**
     * Утилита для подсчета активных фильтров на основе массива проверок
     * @param {Array<{value: any, defaultValue: any, isArray?: boolean}>} filters - Массив объектов с проверками
     * @returns {number} Количество активных фильтров
     * 
     * @example
     * getActiveFiltersCountFromConfig([
     *   { value: this.statusFilter, defaultValue: '' },
     *   { value: this.clientFilter, defaultValue: '' },
     *   { value: this.dateFilter, defaultValue: 'all_time' },
     *   { value: this.categoryFilter, defaultValue: [], isArray: true }
     * ])
     */
    getActiveFiltersCountFromConfig(filters) {
      if (!Array.isArray(filters)) return 0;
      
      return filters.reduce((count, filter) => {
        if (!filter || filter.value === undefined) return count;
        
        const { value, defaultValue, isArray } = filter;
        
        if (isArray) {
          return count + (Array.isArray(value) && value.length > 0 ? 1 : 0);
        }
        
        if (value !== defaultValue) {
          return count + 1;
        }
        
        return count;
      }, 0);
    },

    /**
     * Утилита для сброса фильтров на основе объекта с дефолтными значениями
     * @param {Object} defaultValues - Объект с дефолтными значениями фильтров
     * @param {Function} [callback] - Опциональный callback после сброса
     * 
     * @example
     * resetFiltersFromConfig({
     *   statusFilter: '',
     *   clientFilter: '',
     *   dateFilter: 'all_time',
     *   categoryFilter: []
     * })
     */
    resetFiltersFromConfig(defaultValues, callback) {
      if (!defaultValues || typeof defaultValues !== 'object') return;
      
      Object.keys(defaultValues).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(this, key) || this[key] !== undefined) {
          this[key] = defaultValues[key];
        }
      });
      
      if (this.viewMode === 'kanban' && typeof this.resetKanbanPagination === 'function') {
        this.resetKanbanPagination();
      }
      
      if (typeof callback === 'function') {
        callback();
      } else if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, this.viewMode === 'kanban');
      }
    }
  }
};
