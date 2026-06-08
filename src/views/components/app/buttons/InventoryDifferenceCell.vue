<template>
  <span :class="colorClass">
    {{ differenceText }} ({{ statusText }})
  </span>
</template>

<script>
import { formatQuantity } from '@/utils/numberUtils';

export default {
  name: 'InventoryDifferenceCell',
  props: {
    expectedQuantity: {
      type: [Number, String],
      default: 0,
    },
    actualQuantity: {
      type: [Number, String],
      default: 0,
    },
    unitShortName: {
      type: String,
      default: '',
    },
  },
  computed: {
    diffValue() {
      return (Number(this.actualQuantity) || 0) - (Number(this.expectedQuantity) || 0);
    },
    differenceText() {
      const value = this.diffValue;
      const unit = this.unitShortName || '';
      return `${formatQuantity(value)} ${unit}`.trim();
    },
    statusText() {
      if (this.diffValue > 0) return this.$t('inventoryDifferenceStatusOverage');
      if (this.diffValue < 0) return this.$t('inventoryDifferenceStatusShortage');
      return this.$t('inventoryDifferenceStatusMatch');
    },
    colorClass() {
      if (this.diffValue > 0) return 'text-[#EAB308] font-semibold';
      if (this.diffValue < 0) return 'text-[var(--color-danger)] font-semibold';
      return 'text-[#16A34A] font-semibold';
    },
  },
};
</script>
