<template>
  <div class="flex items-center">
    <i class="fas fa-right-long text-[var(--color-danger)] mr-2" />
    <span class="font-semibold">{{ formattedAmount }}</span>
    <i class="fas fa-right-long text-[var(--color-success)] ml-2" />
  </div>
</template>

<script>
import { formatCurrencyForDisplay } from "@/utils/numberUtils";

export default {
    name: 'TransferAmountCell',
    props: {
        transfer: {
            type: Object,
            required: true
        }
    },
    computed: {
        formattedAmount() {
            return formatCurrencyForDisplay(this.transfer.amount, this.transfer.currencyFromSymbol, true);
        }
    }
}
</script>

