<template>
  <div class="mt-4">
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="editingItem && !balanceLoading"
        :key="'table'"
      >
        <DraggableTable
          :table-key="tableKey"
          :columns-config="columnsConfig"
          :table-data="balanceHistory"
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :show-pagination="showBalancePagination"
              :pagination-data="showBalancePagination ? balancePaginationData : null"
              :on-page-change="fetchBalanceHistory"
              :on-per-page-change="handleBalancePerPageChange"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <FiltersContainer
                  v-if="editingItem"
                  :has-active-filters="getActiveFiltersCount() > 0"
                  :active-filters-count="getActiveFiltersCount()"
                  @reset="onResetFilters"
                  @apply="applyFilters"
                >
                  <div v-if="editingItem?.balances?.length">
                    <label class="block mb-2 text-xs font-semibold">{{ $t('balance') }}</label>
                    <BalanceSelect
                      :model-value="selectedBalanceId"
                      :balances="editingItem.balances"
                      :placeholder="$t('selectBalance')"
                      @update:model-value="onBalanceSelectChangeByValue"
                    />
                  </div>
                  <div v-if="withSourceFilter">
                    <label class="block mb-2 text-xs font-semibold">{{ $t('source') }}</label>
                    <select
                      v-model="sourceFilter"
                      class="w-full"
                      @change="applyFilters"
                    >
                      <option value="">
                        {{ $t('all') }}
                      </option>
                      <option value="order">
                        {{ $t('orders') }}
                      </option>
                      <option value="sale">
                        {{ $t('sales') }}
                      </option>
                      <option value="receipt">
                        {{ $t('warehouseReceipts') }}
                      </option>
                      <option value="transaction">
                        {{ $t('payments') }}
                      </option>
                    </select>
                  </div>
                  <div v-if="withDebtFilter">
                    <label class="block mb-2 text-xs font-semibold">{{ $t('credit') }}</label>
                    <select
                      v-model="debtFilter"
                      class="w-full"
                      @change="applyFilters"
                    >
                      <option value="">
                        {{ $t('all') }}
                      </option>
                      <option value="payments">
                        {{ $t('payments') }}
                      </option>
                      <option value="debt">
                        {{ $t('credit') }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                    <input
                      v-model="dateFrom"
                      type="date"
                      class="w-full"
                      @change="applyFilters"
                    >
                  </div>
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                    <input
                      v-model="dateTo"
                      type="date"
                      class="w-full"
                      @change="applyFilters"
                    >
                  </div>
                </FiltersContainer>
                <slot name="additionalButtons" />
              </template>
              <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <slot
                  name="gear"
                  :reset-columns="resetColumns"
                  :columns="columns"
                  :toggle-visible="toggleVisible"
                  :log="log"
                />
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>
  </div>
</template>

<script>
import { computed, watch } from 'vue';
import { useClientBalanceHistory } from '@/composables/useClientBalanceHistory';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import BalanceSelect from '@/views/components/app/forms/BalanceSelect.vue';

export default {
    name: 'ClientBalanceHistoryBase',
    components: {
        DraggableTable,
        FiltersContainer,
        TableControlsBar,
        TableSkeleton,
        BalanceSelect,
    },
    props: {
        editingItem: { type: Object, default: null },
        columnsConfig: { type: Array, default: () => [] },
        tableKey: { type: String, default: 'client.balance.history' },
        itemMapper: { type: Function, default: null },
        withSourceFilter: { type: Boolean, default: true },
        withDebtFilter: { type: Boolean, default: true },
        withPagination: { type: Boolean, default: true },
    },
    emits: ['item-click', 'selectedBalanceIdChange'],
    expose: ['fetchBalanceHistory', 'setSelectedBalanceId'],
    setup(props, { emit }) {
        const clientRef = computed(() => props.editingItem);
        const history = useClientBalanceHistory(clientRef, {
            withSourceFilter: props.withSourceFilter,
            withDebtFilter: props.withDebtFilter,
            withPagination: props.withPagination,
        });

        watch(history.selectedBalanceId, (v) => {
            emit('selectedBalanceIdChange', v);
        }, { immediate: true });

        function onItemClick(item) {
            emit('item-click', item);
        }

        function onResetFilters() {
            history.resetFilters();
        }

        function onBalanceSelectChange(e) {
            const v = e.target.value;
            history.setSelectedBalanceId(v === '' ? null : v);
        }
        function onBalanceSelectChangeByValue(v) {
            history.setSelectedBalanceId(v == null || v === '' ? null : v);
        }

        return {
            ...history,
            onItemClick: props.onItemClick || onItemClick,
            onResetFilters,
            onBalanceSelectChange,
            onBalanceSelectChangeByValue,
        };
    },
    methods: {
        formatBalance(balance) {
            return this.$formatNumber ? this.$formatNumber(balance, null, true) : String(balance ?? 0);
        },
    },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
