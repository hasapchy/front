<template>
  <button
    v-if="useModalOpen"
    type="button"
    class="text-xs text-left underline cursor-pointer bg-transparent border-0 p-0 text-[#337AB7]"
    style="font: inherit"
    :title="detailTitle"
    @click.stop="onOpen"
  >
    {{ displayText }}
  </button>
  <span
    v-else-if="clickable && detailTitle"
    class="text-xs text-left underline decoration-dotted cursor-help"
    :class="kindColorClass"
    :title="detailTitle"
  >{{ displayText }}</span>
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
        detailTitle: {
            type: String,
            default: '',
        },
        onOpen: {
            type: Function,
            default: null,
        },
    },
    computed: {
        useModalOpen() {
            return this.clickable && typeof this.onOpen === 'function';
        },
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
