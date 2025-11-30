<template>
    <div class="flex items-center">
        <i :class="iconClass" class="mr-2"></i>
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
            return this.item.isDebt == 1 || this.item.is_debt == 1;
        },
        iconClass() {
            if (this.variant === 'payment') {
                return this.amount > 0 
                    ? 'fas fa-check text-[#5CB85C]' 
                    : 'fas fa-exchange-alt text-gray-500';
            }
            
            if (this.amount > 0 && this.isDebt) {
                return 'fas fa-arrow-up text-[#EE4F47]';
            }
            if (this.amount > 0 && !this.isDebt) {
                return 'fas fa-check text-[#5CB85C]';
            }
            if (this.amount < 0) {
                return 'fas fa-arrow-down text-[#5CB85C]';
            }
            return 'fas fa-exchange-alt text-gray-500';
        },
        textClass() {
            if (this.variant === 'payment') {
                return this.amount > 0 
                    ? 'text-[#5CB85C]' 
                    : 'text-gray-500';
            }
            
            if (this.amount > 0 && this.isDebt) {
                return 'text-[#EE4F47]';
            }
            if (this.amount > 0 && !this.isDebt) {
                return 'text-[#5CB85C]';
            }
            if (this.amount < 0) {
                return 'text-[#5CB85C]';
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

