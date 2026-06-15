import { ref, computed, watch, onMounted } from 'vue';
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
    const perPageOptions = [20, 50];
    const dateFrom = ref(null);
    const dateTo = ref(null);
    const selectedBalanceId = ref(null);
    const sourceFilter = ref('');
    const debtFilter = ref('');
    const transactionTypeFilter = ref('');
    const cashRegisterFilter = ref('');
    const balanceSearchQuery = ref('');
    const balanceSearchTimeout = ref(null);
    const balanceAbortController = ref(null);
    const cashRegisters = ref([]);
    const currencyCode = ref('');

    const client = computed(() => {
        const v = clientRef?.value ?? clientRef?.();
        return v ?? null;
    });

    const balanceSearchHighlight = computed(() => balanceSearchQuery.value?.trim() || '');

    const defaultBalanceId = computed(() => {
        const c = client.value;
        if (!c?.balances?.length) return null;
        const defaultBalance = c.balances.find(b => b.isDefault);
        return defaultBalance ? defaultBalance.id : c.balances[0].id;
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
            currencyCode.value = defaultCurrency ? defaultCurrency.code : '';
        } catch {
            currencyCode.value = '';
        }
    }

    async function loadCashRegisters() {
        try {
            await store.dispatch('loadCashRegisters');
            cashRegisters.value = store.getters.cashRegisters || [];
        } catch {
            cashRegisters.value = [];
        }
    }

    function initDefaultBalance() {
        const c = client.value;
        if (c?.balances?.length) {
            const defaultBalance = c.balances.find(b => b.isDefault);
            selectedBalanceId.value = defaultBalance ? defaultBalance.id : c.balances[0].id;
        } else {
            selectedBalanceId.value = null;
        }
    }

    function setSelectedBalanceId(id) {
        selectedBalanceId.value = id != null && id !== '' ? Number(id) : null;
        return fetchBalanceHistory(1);
    }

    async function fetchBalanceHistory(page = 1) {
        const c = client.value;
        const clientId = c?.id;
        if (
            !clientId ||
            (!store.getters.hasPermission('settings_client_balance_view') &&
                !store.getters.hasPermission('settings_client_balance_view_own'))
        ) {
            balanceHistory.value = [];
            balancePaginationMeta.value = null;
            return;
        }

        if (balanceAbortController.value) {
            balanceAbortController.value.abort();
        }
        balanceAbortController.value = new AbortController();
        const signal = balanceAbortController.value.signal;

        balanceLoading.value = true;
        try {
            const excludeDebt = withDebtFilter && debtFilter.value === 'payments' ? true : null;
            const source = withSourceFilter && sourceFilter.value ? sourceFilter.value : null;
            const isDebt = withDebtFilter && debtFilter.value === 'debt' ? true : null;
            const result = await ClientController.getBalanceHistory(clientId, {
                excludeDebt,
                cashRegisterId: cashRegisterFilter.value || null,
                dateFrom: dateFrom.value,
                dateTo: dateTo.value,
                balanceId: selectedBalanceId.value,
                page: withPagination ? page : 1,
                perPage: withPagination ? balancePerPage.value : 9999,
                source,
                isDebt,
                search: balanceSearchQuery.value?.trim() || null,
                transactionType: transactionTypeFilter.value || null,
                signal,
            });
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
        } catch (e) {
            if (e?.code === 'ERR_CANCELED') {
                return;
            }
            balanceHistory.value = [];
            balancePaginationMeta.value = null;
        } finally {
            balanceLoading.value = false;
            balanceAbortController.value = null;
        }
    }

    function handleBalancePerPageChange(perPage) {
        balancePerPage.value = perPage;
        fetchBalanceHistory(1);
    }

    function onBalanceSearchInput() {
        if (balanceSearchTimeout.value) {
            clearTimeout(balanceSearchTimeout.value);
        }
        balanceSearchTimeout.value = setTimeout(() => {
            fetchBalanceHistory(1);
        }, 1200);
    }

    function clearBalanceSearch() {
        balanceSearchQuery.value = '';
        fetchBalanceHistory(1);
    }

    function resetFilters(callback) {
        dateFrom.value = null;
        dateTo.value = null;
        transactionTypeFilter.value = '';
        cashRegisterFilter.value = '';
        balanceSearchQuery.value = '';
        if (withSourceFilter) sourceFilter.value = '';
        if (withDebtFilter) debtFilter.value = '';
        initDefaultBalance();
        if (callback) {
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
            { value: transactionTypeFilter.value, defaultValue: '' },
            { value: cashRegisterFilter.value, defaultValue: '' },
        ];
        if (withSourceFilter) {
            checks.push({ value: sourceFilter.value, defaultValue: '' });
        }
        if (withDebtFilter) {
            checks.push({ value: debtFilter.value, defaultValue: '' });
        }
        return checks.filter(c => c.value != c.defaultValue).length;
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
        (balances) => {
            if (!balances?.length) {
                selectedBalanceId.value = null;
                return;
            }
            const currentId = selectedBalanceId.value;
            if (currentId != null && balances.some((b) => b.id == currentId)) {
                return;
            }
            initDefaultBalance();
            fetchBalanceHistory(1);
        },
        { deep: true }
    );

    onMounted(() => {
        fetchDefaultCurrency();
        loadCashRegisters();
    });

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
        transactionTypeFilter,
        cashRegisterFilter,
        balanceSearchQuery,
        balanceSearchHighlight,
        cashRegisters,
        currencyCode,
        client,
        defaultBalanceId,
        showBalancePagination,
        balancePaginationData,
        fetchDefaultCurrency,
        loadCashRegisters,
        initDefaultBalance,
        fetchBalanceHistory,
        handleBalancePerPageChange,
        onBalanceSearchInput,
        clearBalanceSearch,
        resetFilters,
        applyFilters,
        getActiveFiltersCount,
        setSelectedBalanceId,
        withSourceFilter,
        withDebtFilter,
        withPagination,
    };
}
