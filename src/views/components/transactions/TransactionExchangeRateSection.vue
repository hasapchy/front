<template>
  <div>
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
      class="mt-2 rounded bg-blue-50 p-2 dark:bg-[var(--surface-muted)]"
    >
      <div class="mb-1 text-sm text-gray-600 dark:text-[var(--text-muted)]">
        {{ formatCurrencyForDisplay(origAmount, transactionCurrencyCode , true) }}
        {{ $t('atExchangeRate') }}
        {{ exchangeRateDisplay }} =
        <span class="inline-flex items-center gap-1 text-lg font-bold text-black dark:text-[var(--text-primary)]">
          <FormattedDecimalInput
            :model-value="calculatedCashAmountNumber"
            variant="amount"
            min="0.01"
            :disabled="isTransferTransaction"
            class="w-24 border-b border-black bg-transparent text-lg font-bold focus:outline-none dark:border-[var(--text-primary)] dark:text-[var(--text-primary)]"
            @update:model-value="onCalculatedCashModelUpdate"
          />
          <span>{{ cashCurrencyCode }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { EXCHANGE_RATE_DECIMAL_PLACES, EXCHANGE_RATE_INPUT_MIN } from '@/constants/exchangeRateDecimals';
import {
    formatCurrencyForDisplay,
    formatExchangeRateForDisplay,
    getStepForDecimals,
    normalizeExchangeRateValue,
} from '@/utils/numberUtils';

export default {
    name: 'TransactionExchangeRateSection',
    props: {
        showExchangeRate: { type: Boolean, default: false },
        showCalculatedAmount: { type: Boolean, default: false },
        exchangeRate: { type: [String, Number], default: null },
        origAmount: { type: [Number, String], required: true },
        transactionCurrencyCode: { type: String, default: '' },
        cashCurrencyCode: { type: String, default: '' },
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
        exchangeRateDisplay() {
            return formatExchangeRateForDisplay(this.exchangeRate);
        },
    },
    methods: {
        formatCurrencyForDisplay,
        handleExchangeRateInput(event) {
            this.$emit('update:exchangeRate', normalizeExchangeRateValue(event.target.value));
            this.$emit('exchange-rate-manual');
        },
        onCalculatedCashModelUpdate(val) {
            const amount = typeof val === 'number' ? val : parseFloat(val);
            const orig = parseFloat(this.origAmount);
            if (!orig || !Number.isFinite(amount) || amount <= 0) {
                return;
            }
            const rate = amount / orig;
            this.$emit('update:exchangeRate', normalizeExchangeRateValue(rate));
            this.$emit('exchange-rate-manual');
        },
    }
}
</script>

