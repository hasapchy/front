<template>
  <div
    class="relative transition-[width] duration-300 ease-out"
    :class="compact && !isExpanded ? 'w-52 sm:w-56' : 'w-full max-w-xl'"
    @mousedown="onWrapperMouseDown"
  >
    <i
      class="fas fa-search pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-xs text-gray-400 dark:text-[var(--text-secondary)] sm:left-3.5"
      aria-hidden="true"
    />
    <input
      ref="searchInput"
      v-model="searchQuery"
      type="search"
      :placeholder="compact && !isExpanded ? $t('searchCompactPlaceholder') : $t('searchPlaceholder')"
      :title="$t('searchFieldsHint')"
      autocomplete="off"
      class="app-header-search-input w-full rounded-full border border-gray-200 bg-slate-50 text-[13px] leading-tight text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[var(--nav-accent)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--nav-accent)]/30 hover:border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)] dark:hover:border-[var(--input-border)] dark:focus:border-[var(--nav-accent)] dark:focus:bg-[var(--input-bg)] sm:text-sm"
      :class="compact && !isExpanded
        ? 'h-9 cursor-pointer py-1.5 pl-9 pr-3 sm:pl-10'
        : 'py-2 pl-9 pr-9 sm:py-2 sm:pl-10 sm:pr-10'"
      @focus="onInputFocus"
      @blur="onInputBlur"
    >
    <button
      v-if="searchQuery && isExpanded"
      type="button"
      class="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--nav-accent)]/40 dark:hover:bg-[var(--surface-muted)] dark:hover:text-[var(--text-secondary)] sm:right-2.5"
      :aria-label="$t('clear')"
      @mousedown.prevent
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
    props: {
        compact: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            searchTimeout: null,
            focused: false
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
        },
        isExpanded() {
            if (!this.compact) {
                return true;
            }
            return this.focused || !!this.searchQuery;
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
            if (this.compact) {
                this.focused = false;
            }
        },
        onWrapperMouseDown(event) {
            if (!this.compact || this.isExpanded) {
                return;
            }
            event.preventDefault();
            this.focused = true;
            this.$nextTick(() => {
                this.$refs.searchInput?.focus();
            });
        },
        onInputFocus() {
            if (this.compact) {
                this.focused = true;
            }
        },
        onInputBlur() {
            if (!this.compact) {
                return;
            }
            window.setTimeout(() => {
                this.focused = false;
            }, 120);
        },
        debouncedSearch(query) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 1200);
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

