<template>
  <div class="flex gap-4 mb-4">
    <!-- Общие балансы клиентов -->
    <div class="flex-1">
      <transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="data != null && !loading && data.length > 0"
          key="table"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            <!-- Нам должны -->
            <div
              class="bg-white p-3 rounded-lg shadow-md balance-item clickable-balance hover-income"
              :class="{ 'ring-2 ring-green-300': activeFilter === 'positive' }"
              :title="$t('clickToFilterDebts')"
              @click="toggleFilter('positive')"
            >
              <div class="text-center mb-3">
                <span class="text-sm font-semibold">{{ $t('oweUs') }}</span>
              </div>
              <div class="text-center">
                <div class="mb-1 flex items-center justify-center space-x-1">
                  <span class="text-xs font-medium text-gray-700">{{ $t('oweUs') }}</span>
                  <i class="fas fa-arrow-up text-green-500 text-xs" />
                </div>
                <div class="text-green-600 font-bold text-sm leading-tight">
                  <div class="balance-amount">
                    {{ $formatNumber(totalDebt, null, false) }}{{ currencySymbol ? ` ${currencySymbol}` : '' }}
                  </div>
                </div>
              </div>
            </div>
                        
            <!-- Мы должны -->
            <div
              class="bg-white p-3 rounded-lg shadow-md balance-item clickable-balance hover-outcome"
              :class="{ 'ring-2 ring-red-300': activeFilter === 'negative' }"
              :title="$t('clickToFilterDebts')"
              @click="toggleFilter('negative')"
            >
              <div class="text-center mb-3">
                <span class="text-sm font-semibold">{{ $t('weOwe') }}</span>
              </div>
              <div class="text-center">
                <div class="mb-1 flex items-center justify-center space-x-1">
                  <span class="text-xs font-medium text-gray-700">{{ $t('weOwe') }}</span>
                  <i class="fas fa-arrow-down text-red-500 text-xs" />
                </div>
                <div class="text-red-600 font-bold text-sm leading-tight">
                  <div class="balance-amount">
                    {{ $formatNumber(totalCredit, null, false) }}{{ currencySymbol ? ` ${currencySymbol}` : '' }}
                  </div>
                </div>
              </div>
            </div>
                        
            <!-- Итоговый баланс -->
            <div class="bg-white p-3 rounded-lg shadow-md">
              <div class="text-center mb-3">
                <span class="text-sm font-semibold">Итоговый баланс</span>
              </div>
              <div class="text-center">
                <div class="mb-1 flex items-center justify-center space-x-1">
                  <span class="text-xs font-medium text-gray-700">Баланс</span>
                  <i class="fas fa-calculator text-blue-500 text-xs" />
                </div>
                <div
                  :class="{
                    'text-green-600': totalBalance >= 0,
                    'text-red-600': totalBalance < 0,
                    'font-bold text-sm': true
                  }"
                  class="leading-tight"
                >
                  <div class="balance-amount">
                    {{ $formatNumber(totalBalance, null, false) }}{{ currencySymbol ? ` ${currencySymbol}` : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else-if="loading"
          key="loader"
        >
          <BalanceCardsSkeleton :card-count="3" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import BalanceCardsSkeleton from '@/views/components/app/BalanceCardsSkeleton.vue';

export default {
    name: 'MutualSettlementsBalanceWrapper',
    components: {
        BalanceCardsSkeleton
    },
    emits: ['filter-change'],
    props: {
        data: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        currencySymbol: {
            type: String,
            default: ''
        },
        activeFilter: {
            type: String,
            default: ''
        }
    },
    computed: {
        totalDebt() {
            return this.data.reduce((sum, client) => sum + (client.debtAmount || 0), 0);
        },
        totalCredit() {
            return this.data.reduce((sum, client) => sum + (client.creditAmount || 0), 0);
        },
        totalBalance() {
            return this.totalDebt - this.totalCredit;
        }
    },
    methods: {
        toggleFilter(next) {
            const value = this.activeFilter === next ? '' : next;
            this.$emit('filter-change', value);
        }
    }
};
</script>

<style scoped>
.balance-item {
    transition: all 0.2s ease;
}

.clickable-balance {
    cursor: pointer;
    border-radius: 4px;
    padding: 4px;
}

.clickable-balance:hover {
    background-color: rgba(0, 0, 0, 0.05);
}

.hover-income:hover {
    background-color: rgba(34, 197, 94, 0.1);
}

.hover-outcome:hover {
    background-color: rgba(239, 68, 68, 0.1);
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
