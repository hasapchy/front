import { resolveSearchQuery } from '@/utils/searchUtils';

export default {
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
      if (typeof this.searchAction === 'function') {
        this.searchAction();
        return;
      }

      if (typeof this.fetchItems === 'function') {
        this.fetchItems(1, false);
        return;
      }

      if (typeof this.applyFilters === 'function') {
        this.applyFilters();
      }
    },
  },
};

