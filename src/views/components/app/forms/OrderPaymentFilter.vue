<template>
  <div>
    <button
      :onclick="toggleFilter"
      :class="[
        'flex items-center space-x-2 px-2 sm:px-3 py-2 rounded transition duration-300 focus:outline-none focus:shadow-outline cursor-pointer',
        isActive 
          ? 'bg-blue-600 text-white hover:bg-blue-700' 
          : 'bg-black text-white hover:bg-gray-800'
      ]"
    >
      <i class="fas fa-shopping-cart text-sm sm:text-base"></i>
      <span class="text-xs sm:text-sm whitespace-nowrap">
        <span class="hidden sm:inline">{{ $t('toPay') }}: </span>
        <span>{{ formatAmount(totalAmount) }}</span>
      </span>
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
    currencySymbol: { type: String, default: '' },
    unpaidOrdersTotal: { type: Number, default: 0 }
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    isActive() {
      return this.modelValue;
    },
    totalAmount() {
      return this.unpaidOrdersTotal || 0;
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
