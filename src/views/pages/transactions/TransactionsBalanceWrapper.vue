<template>
    <div class="flex gap-4 mb-4">
        <!-- Balance Cards -->
        <div class="flex-1">
            <transition name="fade" mode="out-in">
                <div v-if="data != null && !loading && data.length > 0" key="table">
                    <!-- Slider для касс, если их больше 3 -->
                    <div v-if="data.length > 3" class="relative">
                        <div class="cash-register-slider-container overflow-hidden">
                            <div 
                                class="cash-register-slider flex gap-4 transition-transform duration-300 ease-in-out"
                                :style="{ transform: `translateX(-${currentSlide * (100 / 3)}%)` }"
                            >
                                <div 
                                    v-for="item in data" 
                                    :key="item.id" 
                                    class="cash-register-slide flex-shrink-0 bg-white p-3 rounded-lg shadow-md"
                                    style="width: calc((100% - 2rem) / 3)"
                                >
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
                                                <div class="balance-amount text-base">{{ $formatNumberForCompany(balance.value, true) }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Кнопки навигации -->
                        <button 
                            v-if="currentSlide > 0"
                            @click="prevSlide"
                            class="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                            :disabled="currentSlide === 0"
                        >
                            <i class="fas fa-chevron-left text-gray-700"></i>
                        </button>
                        <button 
                            v-if="currentSlide < maxSlide"
                            @click="nextSlide"
                            class="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                            :disabled="currentSlide >= maxSlide"
                        >
                            <i class="fas fa-chevron-right text-gray-700"></i>
                        </button>
                    </div>
                    <!-- Обычный grid для 3 касс и меньше -->
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
                                        <div class="balance-amount text-base">{{ $formatNumberForCompany(balance.value, true) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="loading" key="loader" class="flex justify-center items-center h-20">
                    <i class="fas fa-spinner fa-spin text-2xl"></i><br>
                </div>
            </transition>
        </div>
        
        <!-- Debt Balance -->
        <div class="w-auto ml-auto">
            <transition name="fade" mode="out-in">
                <div v-if="data != null && !loading" key="table">
                    <div class="flex flex-col gap-3 items-end">
                        <!-- Долги клиентов -->
                        <div class="bg-white p-3 rounded-lg shadow-md min-w-[280px]">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">{{ $t('clientDebts') }}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="text-center balance-item">
                                    <div class="mb-1 flex items-center justify-center space-x-1">
                                        <span class="text-xs font-medium text-gray-700">{{ $t('oweUs') }}</span>
                                        <i class="fas fa-arrow-down text-green-500 text-xs"></i>
                                    </div>
                                    <div class="text-green-600 font-bold text-sm">
                                        {{ $formatNumberForCompany(clientDebts.positive, true) }}
                                    </div>
                                </div>
                                <div class="text-center balance-item">
                                    <div class="mb-1 flex items-center justify-center space-x-1">
                                        <span class="text-xs font-medium text-gray-700">{{ $t('weOwe') }}</span>
                                        <i class="fas fa-arrow-up text-red-500 text-xs"></i>
                                    </div>
                                    <div class="text-red-600 font-bold text-sm">
                                        {{ $formatNumberForCompany(Math.abs(clientDebts.negative), true) }}
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
            clientDebts: {
                positive: 0,
                negative: 0,
                balance: 0
            },
            currentSlide: 0
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
        // Максимальный слайд для слайдера
        maxSlide() {
            if (!this.data || this.data.length <= 3) return 0;
            return Math.ceil(this.data.length / 3) - 1;
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
        getVisibleBalanceItems(balanceItems) {
            // Полностью убираем кредиты из основного баланса - они показываются отдельно справа
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
        nextSlide() {
            if (this.currentSlide < this.maxSlide) {
                this.currentSlide++;
            }
        },
        prevSlide() {
            if (this.currentSlide > 0) {
                this.currentSlide--;
            }
        },
        async fetchItems() {
            this.loading = true;
            this.currentSlide = 0; // Сбрасываем слайдер при обновлении данных
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

                // Загружаем балансы клиентов (логика как во взаиморасчетах) с учетом фильтра типа клиента из localStorage
                try {
                    const ClientController = (await import('@/api/ClientController')).default;
                    const clients = await ClientController.getAllItems();
                    const clientTypeFilter = (this.$store && this.$store.state && this.$store.state.clientTypeFilter) ? this.$store.state.clientTypeFilter : 'all';
                    
                    // Рассчитываем общий дебет и кредит из балансов клиентов
                    let totalDebt = 0;    // Нам должны (положительный баланс)
                    let totalCredit = 0;  // Мы должны (отрицательный баланс)
                    
                    clients
                        .filter(client => {
                            if (!clientTypeFilter || clientTypeFilter === 'all') return true;
                            const type = client.clientType || client.client_type || 'individual';
                            return type === clientTypeFilter;
                        })
                        .forEach(client => {
                        const balance = parseFloat(client.balance) || 0;
                        if (balance > 0) {
                            totalDebt += balance;
                        } else if (balance < 0) {
                            totalCredit += Math.abs(balance);
                        }
                        });
                    
                    this.clientDebts = {
                        positive: totalDebt,
                        negative: totalCredit,
                        balance: totalDebt - totalCredit
                    };
                } catch (error) {
                    console.error('Ошибка при загрузке балансов клиентов:', error);
                    this.clientDebts = { positive: 0, negative: 0, balance: 0 };
                }
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

/* Styles for debt balance items */
.balance-item {
    min-height: 50px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: center !important;
    padding: 0.5rem !important;
    border-radius: 0.5rem !important;
    border: 1px solid transparent !important;
}

/* Стили для слайдера касс */
.cash-register-slider-container {
    position: relative;
    width: 100%;
}

.cash-register-slider {
    display: flex;
    gap: 1rem;
}

.cash-register-slide {
    min-width: 0;
}

@media (max-width: 768px) {
    .cash-register-slide {
        width: 100% !important;
    }
}
</style>

