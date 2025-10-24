<template>
    <div class="flex gap-4 mb-4">
        <!-- Client Balance Cards -->
        <div class="flex-1">
            <transition name="fade" mode="out-in">
                <div v-if="data != null && !loading && data.length > 0" key="table">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div v-for="item in data" :key="item.id" class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">
                                    {{ item.first_name }} {{ item.last_name }}
                                </span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <!-- Дебет (нам должны) -->
                                <div class="text-center balance-item clickable-balance hover-income"
                                     :title="$t('clickToFilterDebts')"
                                     @click="handleDebtClick(item)">
                                    <div class="mb-1 flex items-center justify-center space-x-1">
                                        <span class="text-xs font-medium text-gray-700">Дебет</span>
                                        <i class="fas fa-arrow-up text-green-500 text-xs"></i>
                                    </div>
                                    <div class="text-green-600 font-bold text-sm leading-tight">
                                        <div class="balance-amount text-base">{{ $formatNumber(item.debt_amount || 0, 0, false) }}</div>
                                    </div>
                                </div>
                                
                                <!-- Кредит (мы должны) -->
                                <div class="text-center balance-item clickable-balance hover-outcome"
                                     :title="$t('clickToFilterCredits')"
                                     @click="handleCreditClick(item)">
                                    <div class="mb-1 flex items-center justify-center space-x-1">
                                        <span class="text-xs font-medium text-gray-700">Кредит</span>
                                        <i class="fas fa-arrow-down text-red-500 text-xs"></i>
                                    </div>
                                    <div class="text-red-600 font-bold text-sm leading-tight">
                                        <div class="balance-amount text-base">{{ $formatNumber(item.credit_amount || 0, 0, false) }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="loading" key="loading" class="text-center text-gray-500 py-8">
                    <svg class="animate-spin h-8 w-8 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <div class="mt-2">{{ $t('loading') }}</div>
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MutualSettlementsBalanceWrapper',
    props: {
        data: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        handleDebtClick(client) {
            // Фильтруем по клиенту и показываем только долги
            this.$emit('filter-by-client', client.id, 'debt');
        },
        handleCreditClick(client) {
            // Фильтруем по клиенту и показываем только кредиты
            this.$emit('filter-by-client', client.id, 'credit');
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
    background-color: rgba(239, 68, 68, 0.1);
}

.hover-outcome:hover {
    background-color: rgba(34, 197, 94, 0.1);
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}
</style>
