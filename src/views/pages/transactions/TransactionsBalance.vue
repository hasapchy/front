<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <div v-if="data.length === 0" class="text-center text-gray-500 py-8">
                {{ $t('noDataFound') }}
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                <div v-for="item in data" :key="item.id" class="bg-white p-3 rounded-lg shadow-md">
                    <div class="text-center mb-3">
                        <span class="text-sm font-semibold">
                            {{ translateCashRegisterName(item.name) }}
                            <span class="text-sm font-bold text-black ml-1">({{ item.currency_symbol || item.currency_code || '' }})</span>
                        </span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div v-for="balance in item.balance" :key="balance.title" class="text-center">
                            <div class="mb-1 flex items-center justify-center space-x-1">
                                <span class="text-xs font-medium text-gray-700">{{ translateBalanceTitle(balance.title) }}</span>
                                <i :class="{
                                    'fas fa-arrow-up text-green-500': balance.type === 'income',
                                    'fas fa-arrow-down text-red-500': balance.type === 'outcome',
                                    'fas fa-calculator text-blue-500': balance.type === 'default',
                                    'fas fa-chart-line text-orange-500': balance.type === 'project_income'
                                }" class="text-xs"></i>
                            </div>
                            <div :class="{
                                'text-green-600': balance.type === 'income',
                                'text-red-600': balance.type === 'outcome',
                                'text-blue-600': balance.type === 'default',
                                'text-orange-600': balance.type === 'project_income',
                                'font-bold text-sm': true
                            }" class="leading-tight">
                                <div class="balance-amount text-base">{{ Number(balance.value).toFixed(0) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-20">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
</template>
<script>
import CashRegisterController from '@/api/CashRegisterController';
import dayjs from 'dayjs';

export default {
    props: {
        cashRegisterId: { type: Number, default: null },
        startDate: { type: String, default: null },
        endDate: { type: String, default: null },
        dateFilter: { type: String, default: 'all_time' },
        transactionTypeFilter: { type: String, default: '' },
        sourceFilter: { type: Array, default: () => [] }
    },
    data() {
        return {
            data: null,
            loading: false,
        };
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        translateBalanceTitle(title) {
            const translations = {
                'Приход': 'income',
                'Расход': 'outcome', 
                'Итого': 'итого',
                'Главная касса': 'mainCashRegister'
            };
            
            const translationKey = translations[title];
            if (translationKey) {
                return this.$t(translationKey);
            }
            
            return title;
        },
        translateCashRegisterName(name) {
            const translations = {
                'Главная касса': 'mainCashRegister'
            };
            
            const translationKey = translations[name];
            if (translationKey) {
                return this.$t(translationKey);
            }
            
            return name;
        },
        async fetchItems() {
            this.loading = true;
            try {
                let start = null, end = null;
                switch (this.dateFilter) {
                    case 'today':
                        start = end = dayjs().format('DD.MM.YYYY');
                        break;
                    case 'yesterday':
                        start = end = dayjs().subtract(1, 'day').format('DD.MM.YYYY');
                        break;
                    case 'this_week':
                        start = dayjs().startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'last_week':
                        start = dayjs().subtract(1, 'week').startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().subtract(1, 'week').endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'this_month':
                        start = dayjs().startOf('month').format('DD.MM.YYYY');
                        end = dayjs().endOf('month').format('DD.MM.YYYY');
                        break;
                    case 'last_month':
                        start = dayjs().subtract(1, 'month').startOf('month').format('DD.MM.YYYY');
                        end = dayjs().subtract(1, 'month').endOf('month').format('DD.MM.YYYY');
                        break;
                    case 'custom':
                        start = this.startDate ? dayjs(this.startDate).format('DD.MM.YYYY') : null;
                        end = this.endDate ? dayjs(this.endDate).format('DD.MM.YYYY') : null;
                        break;
                    case 'all_time':
                    default:
                }
                const cashIds = this.cashRegisterId !== null ? [this.cashRegisterId] : [];

                const params = {
                    cash_register_ids: cashIds.join(','),
                    start_date: start,
                    end_date: end,
                    transaction_type: this.transactionTypeFilter || undefined,
                    source: this.sourceFilter.length > 0 ? this.sourceFilter.join(',') : undefined
                };

                Object.keys(params).forEach(key => {
                    if (params[key] === undefined) {
                        delete params[key];
                    }
                });

                this.data = await CashRegisterController.getCashBalance(
                    cashIds,
                    start,
                    end,
                    params
                );
            } finally {
                this.loading = false;
            }
        }
    },
    watch: {
        cashRegisterId: 'fetchItems',
        dateFilter: 'fetchItems',
        startDate: 'fetchItems',
        endDate: 'fetchItems',
        transactionTypeFilter: 'fetchItems',
        sourceFilter: 'fetchItems',
    },
}
</script>
<style>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

.balance-amount {
    white-space: nowrap;
    font-weight: 700;
    font-size: 1.1rem;
    line-height: 1.2;
}

/* Авторесайз для больших чисел */
@media (max-width: 768px) {
    .balance-amount {
        font-size: 0.9rem;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    .balance-amount {
        font-size: 1rem;
    }
}

@media (min-width: 1025px) {
    .balance-amount {
        font-size: 1.2rem;
    }
}
</style>
