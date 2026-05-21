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
          {{ ws.warehouse_name }}: <b>{{ warehouseStockQuantityText(ws.quantity) }}{{ ws.unit_short_name ? ` ${ws.unit_short_name}` : '' }}</b>
        </span>
      </div>
    </div>
    <DraggableTable
      table-key="product.history"
      :columns-config="columnsConfig"
      :table-data="historyData"
      :item-mapper="itemMapper"
      :on-item-click="() => {}"
    >
      <template #tableSettingsAdditional>
        <div class="flex flex-wrap gap-2">
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
      </template>
    </DraggableTable>
    <div
      v-if="loading"
      class="mt-2 text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else-if="!historyData.length"
      class="mt-2 text-gray-500 dark:text-[var(--text-secondary)]"
    >
      {{ $t('noData') }}
    </div>
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';
import { formatQuantity } from '@/utils/numberUtils';
import { escapeHtmlText } from '@/utils/cashRegisterUtils';
import { formatSignedHistoryQuantity } from '@/utils/warehouseLineOrigDisplay';
import { markRaw } from 'vue';

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
            productUnitId: null,
            filters: [
                { value: 'all', label: 'filterAll' },
                { value: 'income', label: 'filterIncome' },
                { value: 'expense', label: 'filterExpense' }
            ],
            columnsConfig: [
                {
                    name: 'source_label',
                    label: 'source',
                    size: 180,
                    component: markRaw(SourceButtonCell),
                    props: (item) => ({
                        sourceType: this.resolveSourceTypeForHistory(item),
                        sourceId: this.resolveSourceIdForHistory(item),
                    })
                },
                { name: 'quantity', label: 'quantity', size: 200, html: true },
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
        warehouseStockQuantityText(value) {
            return formatQuantity(value);
        },
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
            this.productUnitId = data.product_unit_id != null ? Number(data.product_unit_id) : null;
            this.historyData = rows.map((row) => ({
                ...row,
                unitShortName: row.unit_short_name,
                origQuantity: row.orig_quantity,
                origUnitShortName: row.orig_unit_short_name,
                origUnitId: row.orig_unit_id,
            }));
            this.warehouseStocks = data.warehouse_stocks || data.warehouseStocks || [];
            this.loading = false;
        },
        resolveSourceTypeForHistory(item) {
            const rawType = item?.sourceType || item?.source_type || null;
            if (!rawType) {
                return null;
            }
            if (String(rawType).includes('WhWaybill')) {
                return 'WhReceipt';
            }
            return rawType;
        },
        resolveSourceIdForHistory(item) {
            const rawType = item?.sourceType || item?.source_type || null;
            if (rawType && String(rawType).includes('WhWaybill')) {
                return Number(item?.receipt_id || 0) || null;
            }
            return Number(item?.sourceId || item?.source_id || 0) || null;
        },
        itemMapper(item, column) {
            switch (column) {
                case 'date':
                    return item.date ? new Date(item.date).toLocaleString() : '-';
                case 'quantity': {
                    const q = Number(item.quantity || 0);
                    const label = formatSignedHistoryQuantity(q, item, this.productUnitId);
                    const cls = q > 0 ? 'text-green-600' : (q < 0 ? 'text-red-600' : '');
                    return cls ? `<span class="${cls}">${escapeHtmlText(label)}</span>` : escapeHtmlText(label);
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
