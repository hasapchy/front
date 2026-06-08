<template>
  <div class="flex items-center">
    <i
      :class="iconClass"
      class="mr-2"
    />
    <span :class="textClass">{{ text }}</span>
  </div>
</template>

<script>
export default {
    name: 'OperationTypeCell',
    props: {
        item: {
            type: Object,
            required: true
        },
        variant: {
            type: String,
            default: 'default',
            validator: (value) => ['default', 'payment'].includes(value)
        }
    },
    computed: {
        amount() {
            return parseFloat(this.item.amount || 0);
        },
        isDebt() {
            return this.item.isDebt == 1 || this.item.isDebt === true;
        },
        iconClass() {
            if (this.variant === 'payment') {
                return this.amount > 0 
                    ? 'fas fa-check text-[var(--color-success)]' 
                    : 'fas fa-exchange-alt text-gray-500';
            }
            
            if (this.amount > 0 && this.isDebt) {
                return 'fas fa-arrow-up text-[var(--color-danger)]';
            }
            if (this.amount > 0 && !this.isDebt) {
                return 'fas fa-check text-[var(--color-success)]';
            }
            if (this.amount < 0) {
                return 'fas fa-arrow-down text-[var(--color-success)]';
            }
            return 'fas fa-exchange-alt text-gray-500';
        },
        textClass() {
            if (this.variant === 'payment') {
                return this.amount > 0 
                    ? 'text-[var(--color-success)]' 
                    : 'text-gray-500';
            }
            
            if (this.amount > 0 && this.isDebt) {
                return 'text-[var(--color-danger)]';
            }
            if (this.amount > 0 && !this.isDebt) {
                return 'text-[var(--color-success)]';
            }
            if (this.amount < 0) {
                return 'text-[var(--color-success)]';
            }
            return 'text-gray-500';
        },
        text() {
            if (this.variant === 'payment') {
                return this.amount > 0 
                    ? 'Оплата получена' 
                    : 'Оплата';
            }
            
            if (this.amount > 0 && this.isDebt) {
                return 'Кредит клиента';
            }
            if (this.amount > 0 && !this.isDebt) {
                return 'Оплачено';
            }
            if (this.amount < 0) {
                return 'Оплата клиента';
            }
            return 'Транзакция';
        }
    }
}
</script>

