<template>
  <div class="mt-4">
    <div
      v-if="warehouseStocks.length > 0"
      class="mb-4 p-3 bg-gray-50 rounded border border-gray-200"
    >
      <div class="text-sm font-medium text-gray-700 mb-2">
        {{ $t('stocks') }}
      </div>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span
          v-for="(ws, idx) in warehouseStocks"
          :key="idx"
          class="text-gray-800"
        >
          {{ ws.warehouse_name }}: <b>{{ ws.quantity }}{{ ws.unit_short_name ? ` ${ws.unit_short_name}` : '' }}</b>
        </span>
      </div>
    </div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-md font-semibold">
        {{ $t('history') }}
      </h3>
      <div class="flex gap-2">
        <button
          v-for="f in filters"
          :key="f.value"
          :class="[
            'px-4 py-2 rounded transition-colors',
            filter === f.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
          @click="filter = f.value"
        >
          {{ $t(f.label) }}
        </button>
      </div>
    </div>
    <div
      v-if="loading"
      class="text-gray-500"
    >
      {{ $t('loading') }}
    </div>
    <div
      v-else-if="!historyData.length"
      class="text-gray-500"
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
