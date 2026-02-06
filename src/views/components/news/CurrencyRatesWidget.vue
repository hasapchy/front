<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center mb-3 border-b border-gray-100 pb-3">
            <div class="flex items-center">
                <i class="fas fa-exchange-alt text-gray-600 text-sm mr-2"></i>
                <h3 class="text-sm font-semibold text-gray-900">{{ $t('currencyRates') || 'Курсы валют' }}</h3>
            </div>
        </div>
        
        <div v-if="loading" class="flex justify-center py-4">
            <i class="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        
        <div v-else-if="currencies.length > 0" class="space-y-3">
            <div 
                v-for="currency in currencies" 
                :key="currency.id"
                class="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors"
            >
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="flex flex-col min-w-0">
                        <div class="flex items-center gap-2 min-w-0">
                            <div class="text-sm font-semibold text-gray-900">
                                {{ currency.symbol }}
                            </div>
                            <span
                                v-if="currency.is_default"
                                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {{ $t('baseCurrency') || 'Базовая' }}
                            </span>
                        </div>
                        <div class="text-xs text-gray-500 truncate">
                            {{ translateCurrency(currency.name, $t) }}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2 ml-2 shrink-0">
                    <div class="text-sm font-semibold text-gray-900">
                        {{ formatRate(currency.current_rate) }}
                    </div>
                    <div v-if="trend(currency).show" class="flex items-center gap-1 text-xs font-semibold" :class="trend(currency).className">
                        <i :class="trend(currency).icon"></i>
                        <span>{{ trend(currency).text }}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-2">
            {{ $t('noCurrencyRates') || 'Нет доступных курсов валют' }}
        </div>
    </div>
</template>

<script>
import CurrencyHistoryController from '@/api/CurrencyHistoryController';
import { translateCurrency } from '@/utils/translationUtils';
import { formatNumber } from '@/utils/numberUtils';

export default {
    name: 'CurrencyRatesWidget',
    data() {
        return {
            currencies: [],
            loading: false
        }
    },
    async mounted() {
        await this.fetchCurrencyRates();
    },
    methods: {
        translateCurrency,
        trend(currency) {
            const current = Number(currency?.current_rate);
            const previous = Number(currency?.previous_rate);

            if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
                return { show: false };
            }

            const diff = current - previous;
            if (diff === 0) {
                return { show: true, icon: 'fas fa-minus', className: 'text-gray-500', text: '0' };
            }

            const percent = (diff / previous) * 100;
            const text = `${diff > 0 ? '+' : ''}${formatNumber(percent, 2, true)}%`;

            return {
                show: true,
                icon: diff > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down',
                className: diff > 0 ? 'text-emerald-600' : 'text-rose-600',
                text
            };
        },
        formatRate(rate) {
            if (!rate || rate === null || rate === undefined) {
                return '-';
            }
            return formatNumber(rate, 6, true);
        },
        async fetchCurrencyRates() {
            this.loading = true;
            try {
                const currencies = await CurrencyHistoryController.getCurrenciesWithRates();
                this.currencies = (currencies || []).filter(c => c.current_rate !== null && c.current_rate !== undefined);
            } catch (error) {
                console.error('Ошибка загрузки курсов валют:', error);
                this.currencies = [];
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<style scoped>
</style>

