<template>
  <div class="mt-4">
    <div
      v-if="warehouseStocks.length > 0"
      class="mb-4 rounded border border-gray-200 bg-[var(--surface-muted)] p-3 dark:border-[var(--border-subtle)]"
    >
      <div class="mb-2 text-sm font-medium text-gray-700 dark:text-[var(--text-primary)]">
        {{ $t('stocks') }}
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span
          v-for="(ws, idx) in warehouseStocks"
          :key="idx"
          class="text-gray-800 dark:text-[var(--text-primary)]"
        >
          {{ ws.warehouse_name }}: <b>{{ ws.quantity }}{{ ws.unit_short_name ? ` ${ws.unit_short_name}` : '' }}</b>
        </span>
      </div>
    </div>
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-md font-semibold text-gray-900 dark:text-[var(--text-primary)]">
        {{ $t('history') }}
      </h3>
      <div class="flex gap-2">
        <button
          v-for="f in filters"
          :key="f.value"
          type="button"
          :class="historyFilterButtonClass(f)"
          @click="filter = f.value"
        >
          {{ $t(f.label) }}
        </button>
      </div>
    </div>
    <div
      v-if="loading"
      class="text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else-if="!historyData.length"
      class="text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('noData') }}
    </div>
    <DraggableTable
      v-else
      table-key="product.history"
      :columns-config="columnsConfig"
      :table-data="historyData"
      :item-mapper="itemMapper"
      :on-item-click="() => {}"
    />
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';

export default {
    name: 'ProductHistoryTab',
    components: { DraggableTable },
    props: {
        productId: {
            type: [Number, String],
            required: true
        }
    },
    data() {
        return {
            filter: 'all',
            loading: false,
            historyData: [],
            warehouseStocks: [],
            filters: [
                { value: 'all', label: 'filterAll' },
                { value: 'income', label: 'filterIncome' },
                { value: 'expense', label: 'filterExpense' }
            ],
            columnsConfig: [
                { name: 'source_label', label: 'source', size: 180 },
                { name: 'quantity', label: 'quantity', size: 120, html: true },
                { name: 'date', label: 'date', size: 160 },
                { name: 'creatorName', label: 'user', size: 140 }
            ]
        };
    },
    watch: {
        productId: {
            handler(id) {
                id ? this.fetchHistory() : (this.historyData = [], this.warehouseStocks = []);
            },
            immediate: true
        },
        filter() {
            this.fetchHistory();
        }
    },
    methods: {
        historyFilterButtonClass(f) {
            const base = 'rounded px-4 py-2 text-sm font-medium transition-colors focus:outline-none';
            const inactive =
                'border border-[var(--border-subtle)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]';
            if (this.filter !== f.value) {
                return [base, inactive];
            }
            if (f.value === 'all') {
                return [
                    base,
                    'border border-transparent bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)] text-white shadow-sm shadow-black/10 hover:brightness-110',
                ];
            }
            if (f.value === 'income') {
                return [
                    base,
                    'border border-transparent bg-gradient-to-r from-[#5CB85C] to-[#4EA84E] text-white shadow-sm shadow-black/10 hover:brightness-110',
                ];
            }
            if (f.value === 'expense') {
                return [base, 'border border-transparent bg-[#EE4F47] text-white hover:bg-[#D53935]'];
            }
            return [base, inactive];
        },
        async fetchHistory() {
            if (!this.productId) return;
            this.loading = true;
            let data;
            try {
                data = await ProductController.getHistory(this.productId, this.filter);
            } catch {
                data = { items: [], warehouseStocks: [] };
            }
            const rows = data.items || [];
            this.historyData = rows.map((row) => ({
                ...row,
                unitShortName: row.unit_short_name,
            }));
            this.warehouseStocks = data.warehouse_stocks || data.warehouseStocks || [];
            this.loading = false;
        },
        itemMapper(item, column) {
            switch (column) {
                case 'date':
                    return item.date ? new Date(item.date).toLocaleString() : '-';
                case 'quantity': {
                    const q = item.quantity;
                    const suffix = item.unitShortName ? ` ${item.unitShortName}` : '';
                    const text = (q > 0 ? '+' : '') + q + suffix;
                    const cls = q > 0 ? 'text-green-600' : (q < 0 ? 'text-red-600' : '');
                    return cls ? `<span class="${cls}">${text}</span>` : text;
                }
                case 'creatorName':
                    return item.creator?.name ;
                default:
                    return item[column] ?? '';
            }
        }
    }
};
</script>
