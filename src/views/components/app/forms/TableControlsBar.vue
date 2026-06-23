<template>
  <div class="[&_button_i:not(.fa-spinner)]:inline-flex [&_button_i:not(.fa-spinner)]:size-3 [&_button_i:not(.fa-spinner)]:shrink-0 [&_button_i:not(.fa-spinner)]:items-center [&_button_i:not(.fa-spinner)]:justify-center [&_button_i:not(.fa-spinner)]:text-[12px] [&_button_i:not(.fa-spinner)]:leading-none flex flex-row flex-nowrap items-center justify-between gap-2 mb-4 min-w-0 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-md sticky top-0 z-20 dark:bg-[var(--surface-elevated)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
    <div class="flex min-w-0 flex-1 items-center gap-2 flex-nowrap overflow-x-auto md:flex-wrap md:overflow-x-visible">
      <slot name="left">
        <PrimaryButton
          v-if="showCreateButton && onCreateClick"
          :onclick="onCreateClick"
          icon="fas fa-plus"
          :disabled="createButtonDisabled"
          :aria-label="$t('create')"
        />
        <PrimaryButton
          v-if="showExportButton"
          icon="fas fa-file-excel"
          :onclick="onExportClick"
          :disabled="exportLoading"
          :aria-label="$t('export')"
        />
        <slot name="additionalButtons" />
      </slot>
      <slot name="filters-desktop" />
    </div>

    <div class="flex shrink-0 flex-row items-center gap-2">
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <slot name="right-before" />
        <slot
          name="right"
          :reset-columns="resetColumns"
          :resetColumns="resetColumns"
          :columns="columns"
          :toggle-visible="toggleVisible"
          :toggleVisible="toggleVisible"
          :log="log"
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
          :reset-columns="resetColumns"
          :resetColumns="resetColumns"
          :columns="columns"
          :toggle-visible="toggleVisible"
          :toggleVisible="toggleVisible"
          :log="log"
        >
          <TableColumnsGearMenu
            v-if="columns?.length && resetColumns && toggleVisible && log"
            :reset-columns="resetColumns"
            :columns="columns"
            :toggle-visible="toggleVisible"
            :log="log"
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import TableColumnsGearMenu from '@/views/components/app/forms/TableColumnsGearMenu.vue';

export default {
    name: 'TableControlsBar',
    inheritAttrs: false,
    components: {
        PrimaryButton,
        Pagination,
        TableColumnsGearMenu,
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
        },
        resetColumns: {
            type: Function,
            default: null,
        },
        columns: {
            type: Array,
            default: null,
        },
        toggleVisible: {
            type: Function,
            default: null,
        },
        log: {
            type: Function,
            default: null,
        },
    },
    computed: {
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
