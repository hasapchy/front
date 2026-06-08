<template>
  <span
    :class="amountClass"
    class="font-bold"
  >
    {{ formattedAmount }}
    <span
      v-if="showOriginal"
      class="text-gray-600"
    >
      ({{ formattedOriginal }} {{ originalSymbol }})
    </span>
  </span>
</template>

<script>
import { formatNumberForDisplay } from '@/utils/numberUtils';

export default {
    name: 'ProjectAmountCell',
    props: {
        item: {
            type: Object,
            required: true
        },
        projectCurrency: {
            type: String,
            default: ''
        },
        formatNumberFn: {
            type: Function,
            default: null
        }
    },
    computed: {
        amount() {
            return parseFloat(this.item.amount || 0);
        },
        originalAmount() {
            return parseFloat(this.item.origAmount || 0);
        },
        originalSymbol() {
            return this.item.cashCurrencyCode;
        },
        currency() {
            return this.projectCurrency || this.$t('noCurrency');
        },
        formatFn() {
            return this.formatNumberFn || ((val) => formatNumberForDisplay(val, true));
        },
        showOriginal() {
            return this.originalSymbol && this.originalAmount && this.originalSymbol !== this.currency;
        },
        amountClass() {
            return this.amount >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]';
        },
        formattedAmount() {
            return `${this.formatFn(Math.abs(this.amount))} ${this.currency}`;
        },
        formattedOriginal() {
            return this.formatFn(Math.abs(this.originalAmount));
        }
    }
}
</script>

