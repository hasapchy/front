<template>
  <span :class="colorClass">
    {{ differenceText }} ({{ statusText }})
  </span>
</template>

<script>
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
      return `${value} ${unit}`.trim();
    },
    statusText() {
      if (this.diffValue > 0) return 'пересорт';
      if (this.diffValue < 0) return 'недостача';
      return 'все ок';
    },
    colorClass() {
      if (this.diffValue > 0) return 'text-[#EAB308] font-semibold';
      if (this.diffValue < 0) return 'text-[#EE4F47] font-semibold';
      return 'text-[#16A34A] font-semibold';
    },
  },
};
</script>
