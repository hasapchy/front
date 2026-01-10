<template>
    <div v-if="showExchangeRate" class="mt-2">
        <label>{{ $t('exchangeRate') }}</label>
        <input type="number" :value="exchangeRate" @input="handleExchangeRateInput" step="0.000001" min="0.000001">
    </div>
    <div v-if="showCalculatedAmount" class="mt-2 p-2 bg-blue-50 rounded">
        <div class="text-sm text-gray-600 mb-1">
            {{ formatCurrency(origAmount, transactionCurrencySymbol || '', 2, true) }}
            {{ $t('atExchangeRate') || 'по курсу' }}
            {{ exchangeRate }} =
            <span class="text-lg font-bold text-black inline-flex items-center gap-1">
                <input type="number" :value="calculatedCashAmountInput" @input="handleCalculatedAmountInput" step="0.01" min="0.01"
                    :disabled="isTransferTransaction"
                    class="w-24 bg-transparent border-b border-black focus:outline-none text-lg font-bold">
                <span>{{ cashCurrencySymbol || '' }}</span>
            </span>
        </div>
    </div>
</template>

<script>
import { formatCurrency } from '@/utils/numberUtils';

export default {
    name: 'TransactionExchangeRateSection',
    props: {
        showExchangeRate: { type: Boolean, default: false },
        showCalculatedAmount: { type: Boolean, default: false },
        exchangeRate: { type: [String, Number], default: null },
        origAmount: { type: [Number, String], required: true },
        transactionCurrencySymbol: { type: String, default: '' },
        cashCurrencySymbol: { type: String, default: '' },
        calculatedCashAmount: { type: [Number, null], default: null },
        isTransferTransaction: { type: Boolean, default: false },
    },
    emits: ['update:exchangeRate', 'exchange-rate-manual'],
    computed: {
        calculatedCashAmountInput: {
            get() {
                return this.calculatedCashAmount !== null && this.calculatedCashAmount !== undefined ? this.calculatedCashAmount : '';
            },
            set(value) {
                const amount = parseFloat(value);
                const orig = parseFloat(this.origAmount);
                if (!orig || isNaN(amount) || amount <= 0) {
                    return;
                }
                const rate = amount / orig;
                this.$emit('update:exchangeRate', rate.toFixed(6));
                this.$emit('exchange-rate-manual');
            }
        }
    },
    methods: {
        formatCurrency,
        handleExchangeRateInput(event) {
            this.$emit('update:exchangeRate', event.target.value);
            this.$emit('exchange-rate-manual');
        },
        handleCalculatedAmountInput(event) {
            const value = event.target.value;
            const amount = parseFloat(value);
            const orig = parseFloat(this.origAmount);
            if (!orig || isNaN(amount) || amount <= 0) {
                return;
            }
            const rate = amount / orig;
            this.$emit('update:exchangeRate', rate.toFixed(6));
            this.$emit('exchange-rate-manual');
        }
    }
}
</script>

