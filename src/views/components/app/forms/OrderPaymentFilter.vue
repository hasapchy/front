<template>
    <div class="relative">
        <button 
            @click="toggleFilter" 
            :class="[
                'flex items-center space-x-2 px-3 py-2 rounded transition duration-300',
                isActive ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-600 text-white hover:bg-gray-500'
            ]"
            :title="isActive ? $t('hidePaidOrders') : $t('showPaidOrders')"
        >
            <i class="fas fa-shopping-cart"></i>
            <span class="text-sm font-medium">
                {{ $t('toPay') }}: {{ formatAmount(totalAmount) }}
            </span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'OrderPaymentFilter',
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        orders: {
            type: Array,
            default: () => []
        },
        statusId: {
            type: Number,
            default: 4 // Статус "Оплачено"
        }
    },
    emits: ['update:modelValue', 'change'],
    computed: {
        isActive() {
            return this.modelValue;
        },
        totalAmount() {
            if (!this.orders || this.orders.length === 0) {
                return 0;
            }
            
            // Фильтруем заказы по статусу ID 4 (Оплачено)
            const paidOrders = this.orders.filter(order => order.statusId === this.statusId);
            
            // Суммируем общую стоимость заказов
            return paidOrders.reduce((total, order) => {
                return total + (parseFloat(order.totalPrice) || 0);
            }, 0);
        }
    },
    methods: {
        toggleFilter() {
            const newValue = !this.isActive;
            this.$emit('update:modelValue', newValue);
            this.$emit('change', newValue);
        },
        formatAmount(amount) {
            if (amount === 0) return '0';
            
            // Форматируем сумму с разделителями тысяч
            return new Intl.NumberFormat('ru-RU', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }).format(amount);
        }
    }
}
</script>

<style scoped>
/* Дополнительные стили если нужны */
</style>
