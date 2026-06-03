<template>
  <span
    :class="amountClass"
    class="font-semibold"
  >
    {{ sign }}{{ formattedAmount }}
  </span>
</template>

<script>
import { formatCurrencyForDisplay } from "@/utils/numberUtils";

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
        currencyCode() {
            return this.showOriginal
                ? (this.transaction.origCurrencyCode)
                : (this.transaction.cashCurrencyCode);
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
            return formatCurrencyForDisplay(Math.abs(this.amount), this.currencyCode, true);
        }
    }
}
</script>

