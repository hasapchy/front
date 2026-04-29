<template>
  <div
    class="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]"
  >
    <div
      class="px-3 py-2.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)]"
    >
      <span class="text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)]">{{ $t('salaryAccrualPreview') }}</span>
      <button
        type="button"
        class="text-xs px-2.5 py-1.5 rounded border border-gray-300 hover:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--surface-muted)] dark:disabled:opacity-50"
        :disabled="previewLoading || loading"
        @click="$emit('refresh')"
      >
        {{ $t('refresh') }}
      </button>
    </div>
    <div
      v-if="previewLoading"
      class="px-4 py-8 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else
      class="p-2 sm:p-3 overflow-x-auto"
    >
      <DraggableTable
        table-key="salary.accrual.preview"
        :columns-config="columnsConfig"
        :table-data="tableData"
        :item-mapper="itemMapper"
        :disable-local-sort="true"
        :table-bottom-spacer="false"
        :row-class-fn="rowClassFn"
      >
        <template #tableControlsBar />
      </DraggableTable>
    </div>
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';

export default {
    name: 'SalaryAccrualPreviewSection',
    components: { DraggableTable },
    props: {
        previewLoading: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
        columnsConfig: {
            type: Array,
            required: true,
        },
        tableData: {
            type: Array,
            required: true,
        },
        itemMapper: {
            type: Function,
            required: true,
        },
        rowClassFn: {
            type: Function,
            required: true,
        },
    },
    emits: ['refresh'],
};
</script>
