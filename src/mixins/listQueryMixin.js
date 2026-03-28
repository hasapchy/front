import { resolveSearchQuery } from '@/utils/searchUtils';

export default {
  computed: {
    hasActiveFilters() {
      return this.getActiveFiltersCount() > 0;
    }
  },
  methods: {
    handleSearch(query) {
      const minLength = this.getSearchMinLength?.() ?? this.searchMinLength ?? 3;
      const { inputValue, shouldFetch } = resolveSearchQuery(query, minLength);
      this.$store.dispatch('setSearchQuery', inputValue);
      if (!shouldFetch) {
        return;
      }
      this.executeSearchAction();
    },
    executeSearchAction() {
      if (this.searchAction) {
        this.searchAction();
      } else if (this.fetchItems) {
        this.fetchItems(1, false);
      } else if (this.applyFilters) {
        this.applyFilters();
      }
    },
    applyFilters() {
      if (this.viewMode === 'kanban') {
        this.resetKanbanPagination?.();
      }
      this.fetchItems?.(1, true);
    },
    resetFilters() {
      this.fetchItems?.(1, true);
    },
    getActiveFiltersCount() {
      return 0;
    },
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
    resetFiltersFromConfig(defaultValues, callback) {
      if (!defaultValues) return;
      Object.keys(defaultValues).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(this, key) || this[key] !== undefined) {
          this[key] = defaultValues[key];
        }
      });
      if (this.viewMode === 'kanban') {
        this.resetKanbanPagination?.();
      }
      if (callback) {
        callback();
      } else {
        this.fetchItems?.(1, this.viewMode === 'kanban');
      }
    }
  }
};
