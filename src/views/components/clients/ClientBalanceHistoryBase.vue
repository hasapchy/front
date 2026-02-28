<template>
    <div class="mt-4">
        <transition name="fade" mode="out-in">
            <div v-if="editingItem && !balanceLoading" :key="'table'">
                <DraggableTable
                    :table-key="tableKey"
                    :columns-config="columnsConfig"
                    :table-data="filteredBalanceHistory"
                    :item-mapper="itemMapper"
                    :onItemClick="onItemClick">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar
                            :show-pagination="showBalancePagination"
                            :pagination-data="showBalancePagination ? balancePaginationData : null"
                            :on-page-change="fetchBalanceHistory"
                            :on-per-page-change="handleBalancePerPageChange"
                            :resetColumns="resetColumns"
                            :columns="columns"
                            :toggleVisible="toggleVisible"
                            :log="log">
                            <template #left>
                                <FiltersContainer
                                    v-if="editingItem"
                                    :has-active-filters="getActiveFiltersCount() > 0"
                                    :active-filters-count="getActiveFiltersCount()"
                                    @reset="onResetFilters"
                                    @apply="applyFilters">
                                    <div v-if="editingItem?.balances?.length">
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('balance') }}</label>
                                        <select
                                            :value="selectedBalanceId ?? ''"
                                            @change="onBalanceSelectChange"
                                            class="w-full">
                                            <option
                                                v-for="balance in editingItem.balances"
                                                :key="balance.id"
                                                :value="balance.id">
                                                {{ balance.currency?.symbol || '' }} - {{ formatBalance(balance.balance) }}
                                                <span v-if="balance.isDefault"> ({{ $t('default') }})</span>
                                            </option>
                                        </select>
                                    </div>
                                    <div v-if="withSourceFilter">
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('source') }}</label>
                                        <select v-model="sourceFilter" @change="applyFilters" class="w-full">
                                            <option value="">{{ $t('all') || 'Все' }}</option>
                                            <option value="order">{{ $t('orders') }}</option>
                                            <option value="sale">{{ $t('sales') }}</option>
                                            <option value="receipt">{{ $t('warehouseReceipts') }}</option>
                                            <option value="transaction">{{ $t('payments') }}</option>
                                        </select>
                                    </div>
                                    <div v-if="withDebtFilter">
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('credit') }}</label>
                                        <select v-model="debtFilter" @change="applyFilters" class="w-full">
                                            <option value="">{{ $t('all') || 'Все' }}</option>
                                            <option value="payments">{{ $t('payments') }}</option>
                                            <option value="debt">{{ $t('credit') }}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                                        <input type="date" v-model="dateFrom" @change="applyFilters" class="w-full" />
                                    </div>
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                                        <input type="date" v-model="dateTo" @change="applyFilters" class="w-full" />
                                    </div>
                                </FiltersContainer>
                                <slot name="additionalButtons"></slot>
                            </template>
                            <template #gear="{ resetColumns, columns, toggleVisible, log }">
                                <slot name="gear" :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log"></slot>
                            </template>
                        </TableControlsBar>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
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

export default {
    name: 'ClientBalanceHistoryBase',
    components: {
        DraggableTable,
        FiltersContainer,
        TableControlsBar,
        TableSkeleton,
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
            history.selectedBalanceId = e.target.value ? Number(e.target.value) : null;
            history.fetchBalanceHistory(1);
        }

        function setSelectedBalanceId(id) {
            history.selectedBalanceId = id ?? null;
            history.fetchBalanceHistory(1);
        }

        return {
            ...history,
            onItemClick: props.onItemClick || onItemClick,
            onResetFilters,
            onBalanceSelectChange,
            setSelectedBalanceId,
        };
    },
    expose: ['fetchBalanceHistory', 'setSelectedBalanceId'],
    async mounted() {
        await this.fetchDefaultCurrency();
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
