<template>
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <div v-if="hasDebts" class="flex flex-col gap-3 items-end">
                <div v-for="item in dataWithDebts" :key="item.id" 
                     class="bg-white p-3 rounded-lg shadow-md border-l-4 border-orange-500 min-w-[200px] cursor-pointer clickable-debt transition-all duration-200"
                     @click="handleDebtClick"
                     :title="$t('clickToFilterDebts')">
                    <div class="text-center mb-2">
                        <span class="text-xs font-semibold">
                            {{ translateCashRegisterName(item.name) }}
                            <span class="text-xs font-bold text-black ml-1">({{ item.currency_symbol || item.currency_code || '' }})</span>
                        </span>
                    </div>
                    <div class="text-center">
                        <div class="mb-1 flex items-center justify-center space-x-1">
                            <span class="text-xs font-medium text-gray-700">{{ $t('debt') }}</span>
                            <i class="fas fa-exclamation-triangle text-orange-500 text-xs"></i>
                        </div>
                        <div class="text-orange-600 font-bold text-sm leading-tight">
                            <div class="balance-amount text-base">{{ Number(item.debtValue).toFixed(0) }}</div>
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
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

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
        };
    },
    computed: {
        dataWithDebts() {
            if (!this.data) return [];
            
            return this.data
                .map(item => {
                    const debtBalance = item.balance.find(b => b.type === 'debt');
                    return {
                        ...item,
                        debtValue: debtBalance ? debtBalance.value : 0
                    };
                })
                .filter(item => Number(item.debtValue) !== 0);
        },
        hasDebts() {
            return this.dataWithDebts.length > 0;
        }
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        handleDebtClick() {
            this.$emit('debt-click');
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
                        start = end = dayjs().utc().add(5, 'hour').format('DD.MM.YYYY');
                        break;
                    case 'yesterday':
                        start = end = dayjs().utc().add(5, 'hour').subtract(1, 'day').format('DD.MM.YYYY');
                        break;
                    case 'this_week':
                        start = dayjs().utc().add(5, 'hour').startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().utc().add(5, 'hour').endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'last_week':
                        start = dayjs().utc().add(5, 'hour').subtract(1, 'week').startOf('isoWeek').format('DD.MM.YYYY');
                        end = dayjs().utc().add(5, 'hour').subtract(1, 'week').endOf('isoWeek').format('DD.MM.YYYY');
                        break;
                    case 'this_month':
                        start = dayjs().utc().add(5, 'hour').startOf('month').format('DD.MM.YYYY');
                        end = dayjs().utc().add(5, 'hour').endOf('month').format('DD.MM.YYYY');
                        break;
                    case 'last_month':
                        start = dayjs().utc().add(5, 'hour').subtract(1, 'month').startOf('month').format('DD.MM.YYYY');
                        end = dayjs().utc().add(5, 'hour').subtract(1, 'month').endOf('month').format('DD.MM.YYYY');
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
                    source: this.sourceFilter || undefined
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

<style scoped>
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

/* Стили для кликабельного элемента долга */
.clickable-debt:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px -1px rgba(255, 152, 0, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background-color: rgba(255, 152, 0, 0.05);
    border-left-width: 6px;
}

.clickable-debt:active {
    transform: translateY(0);
}
</style>

