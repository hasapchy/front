<template>
    <span :class="amountClass" class="font-bold">
        {{ formattedAmount }}
        <span v-if="showOriginal" class="text-gray-600">
            ({{ formattedOriginal }} {{ originalSymbol }})
        </span>
    </span>
</template>

<script>
import { formatNumber } from '@/utils/numberUtils';

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
            return this.item.cashCurrencySymbol || '';
        },
        currency() {
            return this.projectCurrency || this.$t('noCurrency');
        },
        formatFn() {
            return this.formatNumberFn || ((val) => formatNumber(val, null, true));
        },
        showOriginal() {
            return this.originalSymbol && this.originalAmount && this.originalSymbol !== this.currency;
        },
        amountClass() {
            return this.amount >= 0 ? "text-[#5CB85C]" : "text-[#EE4F47]";
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

