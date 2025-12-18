<template>
    <span :class="amountClass" class="font-semibold">
        <span v-if="showSign">{{ sign }}</span>{{ formattedAmount }} {{ displayCurrencySymbol }}
    </span>
</template>

<script>
import { formatNumber } from '@/utils/numberUtils';

export default {
    name: 'ClientImpactCell',
    props: {
        item: {
            type: Object,
            required: true
        },
        currencySymbol: {
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
            return this.item.isDebt == 1 || this.item.is_debt == 1;
        },
        displayCurrencySymbol() {
            return this.item.currencySymbol || this.currencySymbol || '';
        },
        formatFn() {
            return this.formatNumberFn || ((val) => formatNumber(val, null, true));
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

