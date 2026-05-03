<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
    :class="badgeClass"
  >
    {{ statusLabel }}
  </span>
</template>

<script>
export default {
    name: 'ReceiptStatusBadgeCell',
    props: {
        status: {
            type: String,
            default: 'purchasing'
        }
    },
    computed: {
        statusLabel() {
            const labels = {
                in_transit: this.$t('receiptStatusInTransit'),
                customs_clearance: this.$t('receiptStatusCustoms'),
                purchasing: this.$t('receiptStatusPurchasing'),
                fully_received: this.$t('receiptStatusFullyReceived'),
                completed: this.$t('receiptStatusCompleted'),
            };
            return labels[this.status] || this.$t('receiptStatusPurchasing');
        },
        badgeClass() {
            const classes = {
                in_transit: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
                customs_clearance: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
                purchasing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
                fully_received: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                completed: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
            };
            return classes[this.status] || classes.purchasing;
        },
    },
};
</script>
