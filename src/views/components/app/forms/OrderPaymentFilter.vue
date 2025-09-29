<template>
  <div>
    <button
      :onclick="toggleFilter"
      :class="[
        'flex items-center space-x-2 px-3 py-2 rounded transition duration-300 focus:outline-none focus:shadow-outline',
        isActive 
          ? 'bg-gray-500 text-white hover:bg-gray-600' 
          : 'bg-white border border-gray-300 text-black hover:bg-gray-300/50'
      ]"
    >
      <i class="fas fa-shopping-cart"></i>
      <span>{{ $t('toPay') }}: {{ formatAmount(totalAmount) }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: 'OrderPaymentFilter',
  props: {
    modelValue: { type: Boolean, default: false },
    orders: { type: Array, default: () => [] },
    statusId: { type: Number, default: 4 },
    currencySymbol: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    isActive() {
      return this.modelValue;
    },
    totalAmount() {
      if (!this.orders || this.orders.length === 0) return 0;
      const paidOrders = this.orders.filter(order => order.statusId === this.statusId);
      return paidOrders.reduce((total, order) => total + (parseFloat(order.totalPrice) || 0), 0);
    }
  },
  methods: {
    toggleFilter() {
      const newValue = !this.isActive;
      this.$emit('update:modelValue', newValue);
      this.$emit('change', newValue);
    },
    formatAmount(amount) {
      if (amount === 0) return `0 ${this.currencySymbol}`;
      const formattedAmount = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
      return `${formattedAmount} ${this.currencySymbol}`;
    }
  }
}
</script>
