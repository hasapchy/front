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
      if (this.searchAction) {
        this.searchAction();
      } else if (this.fetchItems) {
        this.fetchItems(1, false);
      } else if (this.applyFilters) {
        this.applyFilters();
      }
    },
  },
};

