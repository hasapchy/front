<template>
  <button
    v-if="clickable"
    type="button"
    class="text-xs text-left underline cursor-pointer bg-transparent border-0 p-0"
    :class="kindColorClass"
    style="font: inherit"
    @click.stop="onOpen"
  >
    {{ displayText }}
  </button>
  <span
    v-else
    class="text-xs"
    :class="muted ? 'text-gray-400' : kindColorClass"
  >{{ displayText }}</span>
</template>

<script>
import { formatCurrency } from '@/utils/numberUtils';

export default {
    name: 'SalaryPreviewBreakdownCell',
    props: {
        kind: {
            type: String,
            required: true,
            validator: (v) => ['advance', 'penalty', 'bonus'].includes(v),
        },
        amount: {
            type: Number,
            default: 0,
        },
        currencySymbol: {
            type: String,
            default: '',
        },
        transactions: {
            type: Array,
            default: () => [],
        },
        onOpen: {
            type: Function,
            required: true,
        },
    },
    computed: {
        kindColorClass() {
            return this.kind === 'bonus' ? 'text-green-600' : 'text-red-600';
        },
        muted() {
            return Number(this.amount || 0) === 0;
        },
        clickable() {
            return this.transactions.length > 0;
        },
        displayText() {
            const n = Number(this.amount || 0);
            if (n === 0) {
                return '—';
            }
            const core = formatCurrency(n, this.currencySymbol || '');
            if (this.kind === 'bonus') {
                return `+${core}`;
            }
            return `−${core}`;
        },
    },
};
</script>
