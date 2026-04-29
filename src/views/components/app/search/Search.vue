<template>
  <div class="relative w-full">
    <i
      class="fas fa-search pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-xs text-gray-400 sm:left-3.5"
      aria-hidden="true"
    />
    <input
      v-model="searchQuery"
      type="search"
      :placeholder="$t('searchPlaceholder')"
      :title="$t('searchFieldsHint')"
      autocomplete="off"
      class="app-header-search-input w-full rounded-full border border-gray-200 bg-slate-50 py-2 pl-9 pr-9 text-[13px] leading-tight text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[var(--nav-accent)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--nav-accent)]/30 hover:border-gray-300 sm:py-2 sm:pl-10 sm:pr-10 sm:text-sm"
    >
    <button
      v-if="searchQuery"
      type="button"
      class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-accent)]/40 dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-secondary)] sm:right-2.5"
      :aria-label="$t('clear')"
      @click="clearSearch"
    >
      <i
        class="fas fa-times text-xs"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { eventBus } from '@/eventBus';

export default {
    data() {
        return {
            searchTimeout: null
        };
    },
    computed: {
        searchQuery: {
            get() {
                return this.$store.state.searchQuery;
            },
            set(value) {
                this.setSearchQuery(value);
            }
        }
    },
    watch: {
        searchQuery: {
            handler(newValue) {
                this.debouncedSearch(newValue);
            },
            immediate: false
        }
    },
    methods: {
        ...mapActions({
            setSearchQuery: 'setSearchQuery'
        }),
        clearSearch() {
            this.searchQuery = '';
        },
        debouncedSearch(query) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 500);
        },
        performSearch(query) {
            this.$emit('search', query);

            eventBus.emit('global-search', query);
        }
    },
    beforeUnmount() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
};
</script>

<style scoped>
.app-header-search-input {
    -webkit-appearance: none;
    appearance: none;
}
.app-header-search-input::-webkit-search-cancel-button,
.app-header-search-input::-webkit-search-decoration {
    display: none;
}
</style>
