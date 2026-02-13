<template>
    <div class="flex gap-4 mb-4">
        <!-- Общие балансы клиентов -->
        <div class="flex-1">
            <transition name="fade" mode="out-in">
                <div v-if="data != null && !loading && data.length > 0" key="table">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                        <!-- Общий дебет -->
                        <div class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">Общий дебет</span>
                            </div>
                            <div class="text-center">
                                <div class="mb-1 flex items-center justify-center space-x-1">
                                    <span class="text-xs font-medium text-gray-700">Дебет</span>
                                    <i class="fas fa-arrow-up text-green-500 text-xs"></i>
                                </div>
                                <div class="text-green-600 font-bold text-sm leading-tight">
                                    <div class="balance-amount ">{{ $formatNumber(totalDebt, null, false) }}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Общий кредит -->
                        <div class="bg-white p-3 rounded-lg shadow-md">
                            <div class="text-center mb-3">
                                <span class="text-sm font-semibold">Общий кредит</span>
                            </div>
                            <div class="text-center">
                                <div class="mb-1 flex items-center justify-center space-x-1">
                                    <span class="text-xs font-medium text-gray-700">Кредит</span>
                                    <i class="fas fa-arrow-down text-red-500 text-xs"></i>
                                </div>
                                <div class="text-red-600 font-bold text-sm leading-tight">
                                    <div class="balance-amount ">{{ $formatNumber(totalCredit, null, false) }}</div>
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
                                    <i class="fas fa-calculator text-blue-500 text-xs"></i>
                                </div>
                                <div :class="{
                                    'text-green-600': totalBalance >= 0,
                                    'text-red-600': totalBalance < 0,
                                    'font-bold text-sm': true
                                }" class="leading-tight">
                                    <div class="balance-amount ">{{ $formatNumber(totalBalance, null, false) }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else-if="loading" key="loader" class="min-h-64">
                    <TableSkeleton />
                </div>
            </transition>
        </div>
    </div>
</template>

<script>
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    name: 'MutualSettlementsBalanceWrapper',
    components: {
        TableSkeleton
    },
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
    computed: {
        totalDebt() {
            return this.data.reduce((sum, client) => sum + (client.debt_amount || 0), 0);
        },
        totalCredit() {
            return this.data.reduce((sum, client) => sum + (client.credit_amount || 0), 0);
        },
        totalBalance() {
            return this.totalDebt - this.totalCredit;
        }
    },
    methods: {
        // Убираем методы кликов, так как теперь показываем общие суммы
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
