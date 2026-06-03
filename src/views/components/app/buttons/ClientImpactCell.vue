<template>
  <span
    :class="amountClass"
    class="font-semibold"
  >
    <span v-if="showSign">{{ sign }}</span>{{ formattedAmount }} {{ displayCurrencyCode }}
  </span>
</template>

<script>
import { formatNumberForDisplay } from '@/utils/numberUtils';

export default {
    name: 'ClientImpactCell',
    props: {
        item: {
            type: Object,
            required: true
        },
        currencyCode: {
            type: String,
            default: ''
        },
        formatNumberFn: {
            type: Function,
            default: null
        },
        variant: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'payment'].includes(value)
        }
    },
    computed: {
        amount() {
            return parseFloat(this.item.amount || 0);
        },
        isDebt() {
            return this.item.isDebt == 1 || this.item.isDebt === true;
        },
        displayCurrencyCode() {
            return this.item.currencyCode || this.currencyCode;
        },
        formatFn() {
            return this.formatNumberFn || ((val) => formatNumberForDisplay(val, true));
        },
        amountClass() {
            if (this.variant === 'payment') {
                return 'text-[#5CB85C]';
            }
            return this.isDebt ? 'text-[#EE4F47]' : 'text-[#5CB85C]';
        },
        showSign() {
            return this.variant === 'default';
        },
        sign() {
            if (this.variant === 'payment') {
                return '';
            }
            return this.isDebt ? '+' : '-';
        },
        formattedAmount() {
            return this.formatFn(Math.abs(this.amount));
        }
    }
}
</script>

