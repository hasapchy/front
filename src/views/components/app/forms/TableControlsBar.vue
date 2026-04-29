<template>
  <div class="[&_button_i:not(.fa-spinner)]:inline-flex [&_button_i:not(.fa-spinner)]:size-3 [&_button_i:not(.fa-spinner)]:shrink-0 [&_button_i:not(.fa-spinner)]:items-center [&_button_i:not(.fa-spinner)]:justify-center [&_button_i:not(.fa-spinner)]:text-[12px] [&_button_i:not(.fa-spinner)]:leading-none flex flex-row flex-nowrap items-center justify-between gap-2 mb-4 min-w-0 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-md sticky top-0 z-20 dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
    <div class="flex min-w-0 flex-1 items-center gap-2 flex-nowrap overflow-x-auto md:flex-wrap md:overflow-x-visible">
      <slot name="left">
        <PrimaryButton
          v-if="showCreateButton && onCreateClick"
          :onclick="onCreateClick"
          icon="fas fa-plus"
          :disabled="createButtonDisabled"
        />
        <PrimaryButton
          v-if="showExportButton"
          icon="fas fa-file-excel"
          :onclick="onExportClick"
          :disabled="exportLoading"
          :aria-label="$t('export')"
        />
        <slot name="additionalButtons" />
        <slot name="filters-desktop" />
      </slot>
    </div>

    <div class="flex shrink-0 flex-row items-center gap-2">
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <slot name="right-before" />
        <slot
          name="right"
          :reset-columns="resetColumnsHandler"
          :columns="columnsConfig"
          :toggle-visible="toggleVisibleHandler"
          :log="logHandler"
        >
          <Pagination
            v-if="showPagination && paginationData && onPageChange"
            :current-page="paginationData.currentPage"
            :last-page="paginationData.lastPage"
            :per-page="paginationData.perPage"
            :per-page-options="paginationData.perPageOptions"
            :show-per-page-selector="paginationData.showPerPageSelector !== false"
            @change-page="onPageChange"
            @per-page-change="onPerPageChange"
          />
        </slot>
        <slot name="right-after" />
      </div>
      <div class="shrink-0">
        <slot
          name="gear"
          :reset-columns="resetColumnsHandler"
          :columns="columnsConfig"
          :toggle-visible="toggleVisibleHandler"
          :log="logHandler"
        />
      </div>
    </div>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';

export default {
    name: 'TableControlsBar',
    components: {
        PrimaryButton,
        Pagination
    },
    props: {
        showCreateButton: {
            type: Boolean,
            default: false
        },
        onCreateClick: {
            type: Function,
            default: null
        },
        createButtonDisabled: {
            type: Boolean,
            default: false
        },
        showFilters: {
            type: Boolean,
            default: false
        },
        hasActiveFilters: {
            type: Boolean,
            default: false
        },
        activeFiltersCount: {
            type: Number,
            default: 0
        },
        onFiltersReset: {
            type: Function,
            default: null
        },
        showPagination: {
            type: Boolean,
            default: false
        },
        paginationData: {
            type: Object,
            default: null
        },
        onPageChange: {
            type: Function,
            default: null
        },
        onPerPageChange: {
            type: Function,
            default: null
        },
        exportPermission: {
            type: String,
            default: null
        },
        onExport: {
            type: Function,
            default: null
        },
        exportLoading: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        resetColumnsHandler() {
            return this.$attrs.resetColumns ?? this.$attrs['reset-columns'] ?? null;
        },
        columnsConfig() {
            return this.$attrs.columns ?? null;
        },
        toggleVisibleHandler() {
            return this.$attrs.toggleVisible ?? this.$attrs['toggle-visible'] ?? null;
        },
        logHandler() {
            return this.$attrs.log ?? null;
        },
        showExportButton() {
            if (!this.exportPermission || !this.onExport) return false;
            return this.$store.getters.hasPermission(this.exportPermission);
        },
        onExportClick() {
            return () => this.onExport && this.onExport();
        }
    }
};
</script>
