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
          :item-mapper="wrappedItemMapper"
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
                <div class="flex min-w-0 w-full flex-1 flex-wrap items-center gap-2">
                  <div class="shrink-0">
                    <FiltersContainer
                      v-if="editingItem"
                      :has-active-filters="getActiveFiltersCount() > 0"
                      :active-filters-count="getActiveFiltersCount()"
                      @reset="onResetFilters"
                      @apply="applyFilters"
                    >
                      <div v-if="editingItem?.balances?.length">
                        <label class="filters-modal-label">{{ $t('balance') }}</label>
                        <BalanceSelect
                          :model-value="selectedBalanceId"
                          :balances="editingItem.balances"
                          :placeholder="$t('selectBalance')"
                          @update:model-value="onBalanceSelectChangeByValue"
                        />
                      </div>
                      <div>
                        <label class="filters-modal-label">{{ $t('transactionType') }}</label>
                        <select
                          v-model="transactionTypeFilter"
                          class="w-full"
                        >
                          <option value="">
                            {{ $t('allTransactionTypes') }}
                          </option>
                          <option value="income">
                            {{ $t('income') }}
                          </option>
                          <option value="outcome">
                            {{ $t('outcome') }}
                          </option>
                        </select>
                      </div>
                      <div v-if="withSourceFilter">
                        <label class="filters-modal-label">{{ $t('source') }}</label>
                        <select
                          v-model="sourceFilter"
                          class="w-full"
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
                        <label class="filters-modal-label">{{ $t('credit') }}</label>
                        <select
                          v-model="debtFilter"
                          class="w-full"
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
                      <div v-if="cashRegisters.length">
                        <label class="filters-modal-label">{{ $t('cashRegister') }}</label>
                        <select
                          v-model="cashRegisterFilter"
                          class="w-full"
                        >
                          <option value="">
                            {{ $t('allCashRegisters') }}
                          </option>
                          <option
                            v-for="cashRegister in cashRegisters"
                            :key="cashRegister.id"
                            :value="cashRegister.id"
                          >
                            {{ cashRegisterOptionLabel(cashRegister) }}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label class="filters-modal-label">{{ $t('dateFrom') }}</label>
                        <input
                          v-model="dateFrom"
                          type="date"
                          class="w-full"
                        >
                      </div>
                      <div>
                        <label class="filters-modal-label">{{ $t('dateTo') }}</label>
                        <input
                          v-model="dateTo"
                          type="date"
                          class="w-full"
                        >
                      </div>
                    </FiltersContainer>
                  </div>
                  <div class="flex min-w-0 flex-1 justify-center px-2">
                    <div class="relative w-full max-w-md">
                      <i
                        class="fas fa-search pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-xs text-gray-400"
                        aria-hidden="true"
                      />
                      <input
                        v-model="balanceSearchQuery"
                        type="search"
                        :placeholder="$t('searchPlaceholder')"
                        :title="$t('searchFieldsHint')"
                        autocomplete="off"
                        class="app-icon-search-input w-full rounded-full border border-gray-200 bg-slate-50 py-1.5 pl-9 pr-9 text-[13px] leading-tight text-gray-900 shadow-sm transition-all placeholder:text-gray-400 focus:border-[var(--nav-accent)] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--nav-accent)]/30 dark:border-[var(--border-subtle)] dark:bg-[var(--input-bg)] dark:text-[var(--text-primary)]"
                        @input="onBalanceSearchInput"
                      >
                      <button
                        v-if="balanceSearchQuery"
                        type="button"
                        class="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[var(--surface-muted)]"
                        :aria-label="$t('clear')"
                        @click="clearBalanceSearch"
                      >
                        <i
                          class="fas fa-times text-xs"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                  <slot name="additionalButtons" />
                </div>
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
import { computed, watch, getCurrentInstance } from 'vue';
import { useClientBalanceHistory } from '@/composables/useClientBalanceHistory';
import { mapBalanceHistoryTableCell } from '@/utils/clientBalanceHistoryTableUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';
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
        onItemClick: { type: Function, default: null },
        withSourceFilter: { type: Boolean, default: true },
        withDebtFilter: { type: Boolean, default: true },
        withPagination: { type: Boolean, default: true },
    },
    emits: ['item-click', 'selectedBalanceIdChange'],
    setup(props, { emit, expose }) {
        const instance = getCurrentInstance();
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

        function onBalanceSelectChangeByValue(v) {
            history.setSelectedBalanceId(v == null || v === '' ? null : v);
        }

        function cashRegisterOptionLabel(cashRegister) {
            return formatCashRegisterDisplay(
                cashRegister?.displayName || cashRegister?.name,
                cashRegister?.currencyCode
            ) || '';
        }

        function wrappedItemMapper(item, columnName) {
            const search = history.balanceSearchHighlight.value;
            const translateFn = instance?.proxy?.$t?.bind(instance.proxy);
            if (props.itemMapper) {
                return props.itemMapper(item, columnName, search);
            }
            return mapBalanceHistoryTableCell(item, columnName, translateFn, search);
        }

        expose({
            fetchBalanceHistory: history.fetchBalanceHistory,
            setSelectedBalanceId: history.setSelectedBalanceId,
            balanceSearchHighlight: history.balanceSearchHighlight,
        });

        return {
            ...history,
            onItemClick: props.onItemClick || onItemClick,
            onResetFilters,
            onBalanceSelectChangeByValue,
            cashRegisterOptionLabel,
            wrappedItemMapper,
        };
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
