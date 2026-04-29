<template>
  <div class="space-y-2">
    <div
      v-for="(tx, idx) in transactions"
      :key="tx.id != null ? tx.id : `tx-${idx}`"
      class="border border-gray-100 rounded px-3 py-2 text-gray-800 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
    >
      {{ lineFormatter(tx) }}
    </div>
  </div>
</template>

<script>
export default {
    name: 'SalaryAdjustmentTransactionsList',
    props: {
        transactions: {
            type: Array,
            default: () => [],
        },
        lineFormatter: {
            type: Function,
            required: true,
        },
    },
};
</script>
