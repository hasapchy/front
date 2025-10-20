<template>
    <div class="flex gap-4 mb-4">
        <!-- Balance Cards -->
        <div class="flex-1">
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
                            <div :class="getGridClass(item.balance)">
                                <div v-for="balance in getVisibleBalanceItems(item.balance)" :key="balance.title" 
                                     class="text-center balance-item"
                                     :class="{
                                         'clickable-balance': balance.type === 'income' || balance.type === 'outcome',
                                         'hover-income': balance.type === 'income',
                                         'hover-outcome': balance.type === 'outcome'
                                     }"
                                     :title="(balance.type === 'income' || balance.type === 'outcome') ? $t('clickToFilterTransactions') : ''"
                                     @click="handleBalanceClick(item, balance)">
                                    <div class="mb-1 flex items-center justify-center space-x-1">
                                        <span class="text-xs font-medium text-gray-700">{{ translateBalanceTitle(balance.title) }}</span>
                                        <i :class="{
                                            'fas fa-arrow-up text-green-500': balance.type === 'income',
                                            'fas fa-arrow-down text-red-500': balance.type === 'outcome',
                                            'fas fa-exclamation-triangle text-orange-500': balance.type === 'debt',
                                            'fas fa-calculator text-blue-500': balance.type === 'default',
                                            'fas fa-chart-line text-orange-500': balance.type === 'project_income'
                                        }" class="text-xs"></i>
                                    </div>
                                    <div :class="{
                                        'text-green-600': balance.type === 'income',
                                        'text-red-600': balance.type === 'outcome',
                                        'text-orange-600': balance.type === 'debt',
                                        'text-blue-600': balance.type === 'default',
                                        'text-orange-600': balance.type === 'project_income',
                                        'font-bold text-sm': true
                                    }" class="leading-tight">
                                        <div class="balance-amount text-base">{{ $formatNumber(balance.value, 0, false) }}</div>
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
        </div>
        
        <!-- Debt Balance -->
        <div class="w-auto ml-auto">
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
                                    <div class="balance-amount text-base">{{ $formatNumber(item.debtValue, 0, false) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else key="loader" class="flex justify-center items-center h-20">
                    <i class="fas fa-spinner fa-spin text-2xl"></i><br>
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
        };
    },
    computed: {
        // Вычисляемое свойство для отслеживания всех фильтров
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
    methods: {
        handleBalanceClick(cashRegister, balance) {
            // Только для прихода и расхода
            if (balance.type === 'income' || balance.type === 'outcome') {
                this.$emit('balance-click', {
                    cashRegisterId: cashRegister.id,
                    transactionType: balance.type
                });
            }
        },
        handleDebtClick() {
            this.$emit('debt-click');
        },
        getVisibleBalanceItems(balanceItems) {
            // Полностью убираем долги из основного баланса - они показываются отдельно справа
            return balanceItems.filter(item => item.type !== 'debt');
        },
        getGridClass(balanceItems) {
            const visibleItems = this.getVisibleBalanceItems(balanceItems);
            const itemCount = visibleItems.length;
            
            if (itemCount === 1) return 'grid grid-cols-1 gap-2';
            if (itemCount === 2) return 'grid grid-cols-2 gap-2';
            if (itemCount === 3) return 'grid grid-cols-3 gap-2';
            return 'grid grid-cols-4 gap-2';
        },
        translateBalanceTitle(title) {
            const translations = {
                'Приход': 'income',
                'Расход': 'outcome', 
                'Долг': 'debt',
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
                        start = end = dayjs().utc().add(5, 'hour').format('DD.MM.YYYY'); // UTC+5 для Asia/Ashgabat
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

                // ✅ ОДИН запрос вместо двух!
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
        // ✅ Объединяем все фильтры в один watch для предотвращения дублей
        filters: {
            handler() {
                // Очищаем предыдущий таймер
                if (this.fetchDebounceTimer) {
                    clearTimeout(this.fetchDebounceTimer);
                }
                
                // Устанавливаем новый таймер (100ms debounce)
                this.fetchDebounceTimer = setTimeout(() => {
                    this.fetchItems();
                }, 100);
            },
            immediate: true,
            deep: true
        }
    },
    beforeUnmount() {
        // Очищаем таймер при уничтожении компонента
        if (this.fetchDebounceTimer) {
            clearTimeout(this.fetchDebounceTimer);
        }
    }
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

/* Базовые стили для всех элементов баланса */
.balance-item {
    border: 1px solid transparent !important;
    border-radius: 0.5rem !important;
    padding: 0.5rem !important;
    min-height: 60px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
}

/* Стили для кликабельных элементов баланса */
.clickable-balance {
    cursor: pointer !important;
}

.clickable-balance.hover-income:hover {
    border: 1px dashed #22c55e !important;
    background-color: rgba(34, 197, 94, 0.05) !important;
}

.clickable-balance.hover-outcome:hover {
    border: 1px dashed #ef4444 !important;
    background-color: rgba(239, 68, 68, 0.05) !important;
}

/* Debt clickable styling */
.clickable-debt:hover {
    background-color: rgba(249, 115, 22, 0.05); /* orange-500 with very light opacity */
    border-left-width: 6px;
}
</style>

