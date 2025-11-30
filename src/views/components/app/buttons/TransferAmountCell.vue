<template>
    <div class="flex items-center">
        <i class="fas fa-right-long text-[#EE4F47] mr-2"></i>
        <span class="font-semibold">{{ formattedAmount }}</span>
        <i class="fas fa-right-long text-[#5CB85C] ml-2"></i>
    </div>
</template>

<script>
import { formatCurrency } from "@/utils/numberUtils";

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
            return formatCurrency(this.transfer.amount, this.transfer.currencyFromSymbol, null, true);
        }
    }
}
</script>

