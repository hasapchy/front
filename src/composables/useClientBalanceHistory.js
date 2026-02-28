import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import ClientController from '@/api/ClientController';

/**
 * @param {import('vue').Ref|function} clientRef - Ref or getter returning the client (ClientDto) with id, balances
 * @param {Object} options
 * @param {boolean} [options.withSourceFilter=true]
 * @param {boolean} [options.withDebtFilter=true]
 * @param {boolean} [options.withPagination=true]
 */
export function useClientBalanceHistory(clientRef, options = {}) {
    const {
        withSourceFilter = true,
        withDebtFilter = true,
        withPagination = true,
    } = options;

    const store = useStore();
    const balanceLoading = ref(false);
    const balanceHistory = ref([]);
    const balancePaginationMeta = ref(null);
    const balancePerPage = ref(20);
    const perPageOptions = [10, 20, 50, 100];
    const dateFrom = ref(null);
    const dateTo = ref(null);
    const selectedBalanceId = ref(null);
    const sourceFilter = ref('');
    const debtFilter = ref('');
    const currencySymbol = ref('');

    const client = computed(() => {
        const v = typeof clientRef === 'function' ? clientRef() : clientRef?.value;
        return v ?? null;
    });

    const defaultBalanceId = computed(() => {
        const c = client.value;
        if (!c?.balances?.length) return null;
        const defaultBalance = c.balances.find(b => b.isDefault);
        return defaultBalance ? defaultBalance.id : (c.balances[0]?.id ?? null);
    });

    const filteredBalanceHistory = computed(() => {
        let items = balanceHistory.value || [];
        if (withSourceFilter && sourceFilter.value) {
            items = items.filter(i => (i.source || i.sourceType) === sourceFilter.value);
        }
        if (withDebtFilter && debtFilter.value === 'debt') {
            items = items.filter(i => i.isDebt);
        }
        return items;
    });

    const showBalancePagination = computed(() => {
        if (!withPagination) return false;
        const meta = balancePaginationMeta.value;
        return meta && (meta.total ?? 0) > 0;
    });

    const balancePaginationData = computed(() => {
        if (!showBalancePagination.value) return null;
        const meta = balancePaginationMeta.value;
        return {
            currentPage: meta?.currentPage ?? 1,
            lastPage: meta?.lastPage ?? 1,
            perPage: balancePerPage.value,
            perPageOptions,
        };
    });

    async function fetchDefaultCurrency() {
        try {
            await store.dispatch('loadCurrencies');
            const currencies = store.getters.currencies;
            const defaultCurrency = currencies?.find(c => c.isDefault);
            currencySymbol.value = defaultCurrency ? defaultCurrency.symbol : '';
        } catch {
            currencySymbol.value = '';
        }
    }

    function initDefaultBalance() {
        const c = client.value;
        if (c?.balances?.length) {
            const defaultBalance = c.balances.find(b => b.isDefault);
            selectedBalanceId.value = defaultBalance ? defaultBalance.id : (c.balances[0]?.id ?? null);
        } else {
            selectedBalanceId.value = null;
        }
    }

    async function fetchBalanceHistory(page = 1) {
        const c = client.value;
        const clientId = c?.id;
        if (!clientId || !store.getters.hasPermission('settings_client_balance_view')) {
            balanceHistory.value = [];
            balancePaginationMeta.value = null;
            return;
        }
        balanceLoading.value = true;
        try {
            const excludeDebt = withDebtFilter && debtFilter.value === 'payments' ? true : null;
            const result = await ClientController.getBalanceHistory(
                clientId,
                excludeDebt,
                null,
                dateFrom.value,
                dateTo.value,
                selectedBalanceId.value,
                withPagination ? page : 1,
                withPagination ? balancePerPage.value : 9999
            );
            balanceHistory.value = result.history || [];
            if (withPagination) {
                balancePaginationMeta.value = {
                    currentPage: result.current_page,
                    lastPage: result.last_page,
                    total: result.total,
                };
            } else {
                balancePaginationMeta.value = null;
            }
        } catch {
            balanceHistory.value = [];
            balancePaginationMeta.value = null;
        } finally {
            balanceLoading.value = false;
        }
    }

    function handleBalancePerPageChange(perPage) {
        balancePerPage.value = perPage;
        fetchBalanceHistory(1);
    }

    const defaultFilterValues = {
        dateFrom: null,
        dateTo: null,
        selectedBalanceId: null,
        sourceFilter: '',
        debtFilter: '',
    };

    function resetFilters(callback) {
        dateFrom.value = null;
        dateTo.value = null;
        if (withSourceFilter) sourceFilter.value = '';
        if (withDebtFilter) debtFilter.value = '';
        selectedBalanceId.value = defaultBalanceId.value;
        initDefaultBalance();
        if (typeof callback === 'function') {
            callback();
        } else {
            fetchBalanceHistory(1);
        }
    }

    function applyFilters() {
        fetchBalanceHistory(1);
    }

    function getActiveFiltersCount() {
        const checks = [
            { value: dateFrom.value, defaultValue: null },
            { value: dateTo.value, defaultValue: null },
            { value: selectedBalanceId.value, defaultValue: defaultBalanceId.value },
        ];
        if (withSourceFilter) {
            checks.push({ value: sourceFilter.value, defaultValue: '' });
        }
        if (withDebtFilter) {
            checks.push({ value: debtFilter.value, defaultValue: '' });
        }
        return checks.filter(c => c.value !== c.defaultValue).length;
    }

    watch(
        () => client.value?.id,
        (newId) => {
            if (newId) {
                initDefaultBalance();
                fetchBalanceHistory();
            } else {
                balanceHistory.value = [];
                selectedBalanceId.value = null;
                balancePaginationMeta.value = null;
            }
        },
        { immediate: true }
    );

    watch(
        () => client.value?.balances,
        () => {
            if (client.value) {
                initDefaultBalance();
            }
        },
        { deep: true }
    );

    return {
        balanceLoading,
        balanceHistory,
        balancePaginationMeta,
        balancePerPage,
        perPageOptions,
        dateFrom,
        dateTo,
        selectedBalanceId,
        sourceFilter,
        debtFilter,
        currencySymbol,
        client,
        defaultBalanceId,
        filteredBalanceHistory,
        showBalancePagination,
        balancePaginationData,
        fetchDefaultCurrency,
        initDefaultBalance,
        fetchBalanceHistory,
        handleBalancePerPageChange,
        resetFilters,
        applyFilters,
        getActiveFiltersCount,
        withSourceFilter,
        withDebtFilter,
        withPagination,
    };
}
