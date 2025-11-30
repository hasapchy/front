<template>
    <div class="flex flex-col md:flex-row gap-2 md:gap-4 mb-4">
        <div class="flex-1">
            <transition name="fade" mode="out-in">
                <div v-if="data && !loading && displayCashRegisters.length > 0" key="table">
                    <div class="cash-registers-grid">
                        <div v-for="item in displayCashRegisters" :key="item.id" class="cash-register-card">
                            <div class="cash-register-title">
                                <span class="cash-register-name">
                                    {{ translateName(item.name) }}
                                    <span class="cash-register-currency">({{ item.currencySymbol || item.currencyCode ||
                                        '' }})</span>
                                </span>
                            </div>
                            <div v-if="canViewCashBalance" :class="getGridClass(item.balance)">
                                <div v-for="balance in visibleBalanceItems(item.balance)" :key="balance.title"
                                    class="balance-item" :class="{
                                        'clickable-balance': isClickable(balance.type),
                                        'hover-income': balance.type === 'income',
                                        'hover-outcome': balance.type === 'outcome',
                                        [`balance-${balance.type}`]: true
                                    }" :title="isClickable(balance.type) ? $t('clickToFilterTransactions') : ''"
                                    @click="handleBalanceClick(item, balance)">
                                    <div class="balance-header">
                                        <span class="balance-title">{{ translateTitle(balance.title) }}</span>
                                        <i :class="getBalanceIconClass(balance.type)"></i>
                                    </div>
                                    <div class="balance-value" :class="`balance-value-${balance.type}`">
                                        <div class="balance-amount">{{ formatBalanceValue(balance) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="loading" key="loader" class="flex justify-center items-center h-20">
                    <SpinnerIcon />
                </div>
            </transition>
        </div>

        <div v-if="canViewClientBalance" class="w-full md:w-auto md:ml-auto mt-4 md:mt-0">
            <transition name="fade" mode="out-in">
                <div v-if="data && !loading" key="table">
                    <div class="bg-white p-2 md:p-3 rounded-lg shadow-md">
                        <div class="text-center mb-3">
                            <span class="text-sm font-semibold">{{ clientDebtsTitle }}</span>
                        </div>
                        <div class="debts-grid">
                            <div v-for="debt in displayDebts" :key="debt.id" class="balance-item debt-item">
                                <div class="balance-header">
                                    <span class="balance-title">{{ debt.title }}</span>
                                    <i :class="debt.iconClass"></i>
                                </div>
                                <div class="balance-value" :class="debt.textClass">
                                    <div class="balance-amount">{{ debt.value }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else key="loader" class="flex justify-center items-center h-20">
                    <SpinnerIcon />
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import CashRegisterController from '@/api/CashRegisterController';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const BALANCE_ICONS = {
    income: 'fas fa-arrow-up balance-icon-income',
    outcome: 'fas fa-arrow-down balance-icon-outcome',
    debt: 'fas fa-exclamation-triangle balance-icon-debt',
    default: 'fas fa-calculator balance-icon-default',
    project_income: 'fas fa-chart-line balance-icon-project'
};

const TITLE_TRANSLATIONS = {
    'Приход': 'income',
    'Расход': 'outcome',
    'Долг': 'debt',
    'Итого': 'итого',
    'Главная касса': 'mainCashRegister'
};

export default {
    props: {
        cashRegisterId: { type: Number, default: null },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        dateFilter: { type: String, default: 'all_time' },
        transactionTypeFilter: { type: String, default: '' },
        sourceFilter: { type: String, default: '' }
    },
    data() {
        return {
            data: null,
            loading: false,
            fetchDebounceTimer: null,
            clientDebts: {
                positive: 0,
                negative: 0
            }
        };
    },
    computed: {
        filters() {
            return {
                cashRegisterId: this.cashRegisterId,
                dateFilter: this.dateFilter,
                startDate: this.startDate,
                endDate: this.endDate,
                transactionTypeFilter: this.transactionTypeFilter,
                sourceFilter: this.sourceFilter
            };
        },
        canViewCashBalance() {
            return this.$store.getters.hasPermission('settings_cash_balance_view');
        },
        canViewClientBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_view');
        },
        displayCashRegisters() {
            return this.data || [];
        },
        displayDebts() {
            return [
                {
                    id: 'oweUs',
                    title: this.$t('oweUs'),
                    iconClass: 'fas fa-arrow-trend-down text-green-500',
                    textClass: 'text-green-600 font-bold text-sm',
                    value: this.formatBalanceValue({ value: this.clientDebts.positive, type: 'debt' })
                },
                {
                    id: 'weOwe',
                    title: this.$t('weOwe'),
                    iconClass: 'fas fa-arrow-trend-up text-red-500',
                    textClass: 'text-red-600 font-bold text-sm',
                    value: this.formatBalanceValue({ value: Math.abs(this.clientDebts.negative), type: 'debt' })
                }
            ];
        },
        clientDebtsTitle() {
            const clientTypeFilter = this.$store.getters.clientTypeFilter || [];
            const hasFilter = Array.isArray(clientTypeFilter) && clientTypeFilter.length > 0;

            if (!hasFilter) {
                return this.$t('clientDebts');
            }

            const typeLabels = {
                individual: this.$t('individual'),
                company: this.$t('company'),
                employee: this.$t('employee'),
                investor: this.$t('investor')
            };

            const selectedTypes = clientTypeFilter
                .map(type => typeLabels[type])
                .filter(Boolean);

            if (selectedTypes.length === 0) {
                return this.$t('clientDebts');
            }

            return `${this.$t('clientDebts')}: ${selectedTypes.join(', ').toLowerCase()}`;
        }
    },
    methods: {
        formatBalanceValue(balance) {
            return this.$formatNumberForCompany(balance.value, true);
        },
        isClickable(type) {
            return type === 'income' || type === 'outcome';
        },
        handleBalanceClick(cashRegister, balance) {
            if (this.isClickable(balance.type)) {
                this.$emit('balance-click', {
                    cashRegisterId: cashRegister.id,
                    transactionType: balance.type
                });
            }
        },
        visibleBalanceItems(balanceItems) {
            return balanceItems.filter(item => item.type !== 'debt');
        },
        getGridClass(balanceItems) {
            const count = this.visibleBalanceItems(balanceItems).length;
            return `balance-grid balance-grid-${Math.min(count, 4)}`;
        },
        getBalanceIconClass(type) {
            return BALANCE_ICONS[type] || BALANCE_ICONS.default;
        },
        translateTitle(title) {
            const key = TITLE_TRANSLATIONS[title];
            return key ? this.$t(key) : title;
        },
        translateName(name) {
            return name === 'Главная касса' ? this.$t('mainCashRegister') : name;
        },
        getDateRange() {
            const base = dayjs().utc().add(5, 'hour');
            let start = null;
            let end = null;

            switch (this.dateFilter) {
                case 'today':
                    start = end = base.format('DD.MM.YYYY');
                    break;
                case 'yesterday':
                    start = end = base.subtract(1, 'day').format('DD.MM.YYYY');
                    break;
                case 'this_week':
                    start = base.startOf('isoWeek').format('DD.MM.YYYY');
                    end = base.endOf('isoWeek').format('DD.MM.YYYY');
                    break;
                case 'last_week':
                    const lastWeek = base.subtract(1, 'week');
                    start = lastWeek.startOf('isoWeek').format('DD.MM.YYYY');
                    end = lastWeek.endOf('isoWeek').format('DD.MM.YYYY');
                    break;
                case 'this_month':
                    start = base.startOf('month').format('DD.MM.YYYY');
                    end = base.endOf('month').format('DD.MM.YYYY');
                    break;
                case 'last_month':
                    const lastMonth = base.subtract(1, 'month');
                    start = lastMonth.startOf('month').format('DD.MM.YYYY');
                    end = lastMonth.endOf('month').format('DD.MM.YYYY');
                    break;
                case 'custom':
                    start = this.startDate ? dayjs(this.startDate).format('DD.MM.YYYY') : null;
                    end = this.endDate ? dayjs(this.endDate).format('DD.MM.YYYY') : null;
                    break;
            }

            return { start, end };
        },
        buildParams(start, end) {
            const params = {
                cash_register_ids: this.cashRegisterId !== null ? String(this.cashRegisterId) : undefined,
                start_date: start,
                end_date: end,
                transaction_type: this.transactionTypeFilter || undefined,
                source: this.sourceFilter || undefined
            };

            return Object.fromEntries(
                Object.entries(params).filter(([_, value]) => value !== undefined)
            );
        },
        calculateClientDebts(clients) {
            const clientTypeFilter = this.$store.getters.clientTypeFilter || [];
            const hasFilter = Array.isArray(clientTypeFilter) && clientTypeFilter.length > 0;

            let positive = 0;
            let negative = 0;

            clients
                .filter(client => {
                    if (!hasFilter) return true;
                    const type = client.clientType || client.client_type || 'individual';
                    return clientTypeFilter.includes(type);
                })
                .forEach(client => {
                    const balance = parseFloat(client.balance) || 0;
                    if (balance > 0) {
                        positive += balance;
                    } else if (balance < 0) {
                        negative += Math.abs(balance);
                    }
                });

            return { positive, negative };
        },
        async loadClientDebts() {
            if (!this.canViewClientBalance) {
                this.clientDebts = { positive: 0, negative: 0 };
                return;
            }

            try {
                await this.$store.dispatch('loadClients');
                const clients = this.$store.getters.clients || [];
                this.clientDebts = this.calculateClientDebts(clients);
            } catch (error) {
                console.error('Ошибка при загрузке балансов клиентов:', error);
                this.clientDebts = { positive: 0, negative: 0 };
            }
        },
        async fetchItems() {
            if (!this.canViewCashBalance) {
                this.data = [];
                this.clientDebts = { positive: 0, negative: 0 };
                return;
            }

            this.loading = true;
            try {
                const { start, end } = this.getDateRange();
                const cashIds = this.cashRegisterId !== null ? [this.cashRegisterId] : [];
                const params = this.buildParams(start, end);

                this.data = await CashRegisterController.getCashBalance(cashIds, start, end, params);
                await this.loadClientDebts();
            } finally {
                this.loading = false;
            }
        }
    },
    watch: {
        filters: {
            handler() {
                if (this.fetchDebounceTimer) {
                    clearTimeout(this.fetchDebounceTimer);
                }

                this.fetchDebounceTimer = setTimeout(() => {
                    this.fetchItems();
                }, 100);
            },
            immediate: true,
            deep: true
        },
    },
    beforeUnmount() {
        if (this.fetchDebounceTimer) {
            clearTimeout(this.fetchDebounceTimer);
        }
    }
}
</script>
