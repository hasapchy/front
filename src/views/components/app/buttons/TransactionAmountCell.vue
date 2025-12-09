<template>
    <span :class="amountClass" class="font-semibold">
        {{ sign }}{{ formattedAmount }}
    </span>
</template>

<script>
import { formatCurrencyWithRounding } from "@/utils/numberUtils";

export default {
    name: 'TransactionAmountCell',
    props: {
        transaction: {
            type: Object,
            required: true
        },
        showOriginal: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        amount() {
            if (this.showOriginal) {
                return this.transaction.origAmount || 0;
            }
            const isPositive = this.transaction.type == 1;
            return this.transaction.cashAmount * (isPositive ? 1 : -1);
        },
        currencySymbol() {
            return this.showOriginal 
                ? (this.transaction.origCurrencySymbol || '') 
                : (this.transaction.cashCurrencySymbol || '');
        },
        amountClass() {
            const val = parseFloat(this.amount);
            return val >= 0 ? "text-[#5CB85C]" : "text-[#EE4F47]";
        },
        sign() {
            const val = parseFloat(this.amount);
            return val >= 0 ? "+" : "-";
        },
        formattedAmount() {
            return formatCurrencyWithRounding(Math.abs(this.amount), this.currencySymbol, true);
        }
    }
}
</script>

