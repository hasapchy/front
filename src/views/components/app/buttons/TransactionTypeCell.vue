<template>
  <div class="flex items-center justify-center">
    <i
      :class="iconClass"
      class="mr-2"
    />
    <span>{{ text }}</span>
  </div>
</template>

<script>
export default {
    name: 'TransactionTypeCell',
    props: {
        transaction: {
            type: Object,
            required: true
        }
    },
    computed: {
        iconClass() {
            if (this.transaction.isTransfer == 1) {
                return 'fas fa-right-left text-[var(--color-info)]';
            }
            if (this.transaction.type == 1) {
                return 'fas fa-circle-down text-[var(--color-success)]';
            }
            return 'fas fa-circle-up text-[var(--color-danger)]';
        },
        text() {
            if (this.transaction.isTransfer == 1) {
                return 'Трансфер';
            }
            return this.transaction.type == 1 ? 'Приход' : 'Расход';
        }
    }
}
</script>

