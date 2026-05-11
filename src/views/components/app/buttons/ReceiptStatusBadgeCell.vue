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
            default: 'draft'
        }
    },
    computed: {
        statusLabel() {
            const labels = {
                draft: this.$t('receiptStatusDraft'),
                completed: this.$t('receiptStatusCompleted'),
            };
            return labels[this.status] || this.$t('receiptStatusDraft');
        },
        badgeClass() {
            const classes = {
                draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
                completed: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
            };
            return classes[this.status] || classes.draft;
        },
    },
};
</script>
