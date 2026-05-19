<template>
  <div class="flex justify-center">
    <SourceButtonCell
      v-if="purchaseId"
      source-type="WhPurchase"
      :source-id="purchaseId"
      :on-updated="onUpdated"
      @error="(e) => $emit('error', e)"
    />
    <span
      v-else
      class="text-gray-500 dark:text-[var(--text-secondary)]"
    >—</span>
  </div>
</template>

<script>
import SourceButtonCell from '@/views/components/app/buttons/SourceButtonCell.vue';

export default {
  components: { SourceButtonCell },
  props: {
    purchaseId: {
      type: [Number, String],
      default: null,
    },
    onUpdated: {
      type: Function,
      default: null,
    },
  },
  emits: ['error'],
};
</script>
