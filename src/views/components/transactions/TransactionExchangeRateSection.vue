<template>
  <div
    v-if="showExchangeRate"
    class="mt-2"
  >
    <label>{{ $t('exchangeRate') }}</label>
    <input
      type="number"
      :value="exchangeRate"
      :step="exchangeRateInputStep"
      :min="exchangeRateInputMin"
      @input="handleExchangeRateInput"
    >
  </div>
  <div
    v-if="showCalculatedAmount"
    class="mt-2 p-2 bg-blue-50 rounded"
  >
    <div class="text-sm text-gray-600 mb-1">
      {{ formatCurrency(origAmount, transactionCurrencySymbol , null, true) }}
      {{ $t('atExchangeRate') }}
      {{ exchangeRate }} =
      <span class="text-lg font-bold text-black inline-flex items-center gap-1">
        <FormattedDecimalInput
          :model-value="calculatedCashAmountNumber"
          variant="amount"
          min="0.01"
          :disabled="isTransferTransaction"
          class="w-24 bg-transparent border-b border-black focus:outline-none text-lg font-bold"
          @update:model-value="onCalculatedCashModelUpdate"
        />
        <span>{{ cashCurrencySymbol  }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import { EXCHANGE_RATE_DECIMAL_PLACES, EXCHANGE_RATE_INPUT_MIN } from '@/constants/exchangeRateDecimals';
import { formatCurrency, getStepForDecimals } from '@/utils/numberUtils';

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
        exchangeRateInputStep() {
            return getStepForDecimals(EXCHANGE_RATE_DECIMAL_PLACES);
        },
        exchangeRateInputMin() {
            return EXCHANGE_RATE_INPUT_MIN;
        },
        calculatedCashAmountNumber() {
            const v = this.calculatedCashAmount;
            if (v === null || v === undefined) {
                return 0;
            }
            const n = parseFloat(v);
            return Number.isFinite(n) ? n : 0;
        },
    },
    methods: {
        formatCurrency,
        handleExchangeRateInput(event) {
            this.$emit('update:exchangeRate', event.target.value);
            this.$emit('exchange-rate-manual');
        },
        onCalculatedCashModelUpdate(val) {
            const amount = typeof val === 'number' ? val : parseFloat(val);
            const orig = parseFloat(this.origAmount);
            if (!orig || !Number.isFinite(amount) || amount <= 0) {
                return;
            }
            const rate = amount / orig;
            this.$emit('update:exchangeRate', rate.toFixed(EXCHANGE_RATE_DECIMAL_PLACES));
            this.$emit('exchange-rate-manual');
        },
    }
}
</script>

