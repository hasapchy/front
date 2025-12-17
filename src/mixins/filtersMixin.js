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
      // Если есть метод resetKanbanPagination (для kanban режима)
      if (this.viewMode === 'kanban' && typeof this.resetKanbanPagination === 'function') {
        this.resetKanbanPagination();
      }
      
      // Вызываем fetchItems с первой страницы
      if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, true);
      }
    },
    
    /**
     * Сбросить фильтры - базовый метод, должен быть переопределен в компоненте
     * для сброса конкретных фильтров
     */
    resetFilters() {
      // Базовый метод - должен быть переопределен в компоненте
      if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, true);
      }
    },
    
    /**
     * Получить количество активных фильтров - должен быть переопределен в компоненте
     * @returns {number}
     */
    getActiveFiltersCount() {
      // Базовый метод - должен быть переопределен в компоненте
      return 0;
    }
  }
};


