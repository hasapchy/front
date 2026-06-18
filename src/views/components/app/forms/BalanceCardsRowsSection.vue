<template>
  <div class="mb-2 border-b border-gray-200 px-2 pb-2 dark:border-[var(--border-subtle)]">
    <div class="mb-2 text-xs text-[var(--text-secondary)]">
      {{ $t('balanceCardsRows') }}
    </div>
    <div class="grid grid-cols-2 gap-1">
      <button
        v-for="option in rowOptions"
        :key="option"
        type="button"
        class="rounded border px-2 py-1 text-sm font-medium transition select-none"
        :class="option === modelValue
          ? 'border-[var(--nav-accent)] bg-[var(--nav-accent)] text-white'
          : 'border-gray-200 bg-white text-[var(--text-primary)] hover:bg-gray-50 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:hover:bg-[var(--surface-elevated)]'"
        @click.stop="$emit('update:modelValue', option)"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<script>
const BALANCE_CARD_ROW_OPTIONS = [1, 2];

export default {
  name: 'BalanceCardsRowsSection',
  props: {
    modelValue: {
      type: Number,
      default: 1,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    rowOptions() {
      return BALANCE_CARD_ROW_OPTIONS;
    },
  },
};
</script>
