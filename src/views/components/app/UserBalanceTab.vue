<template>
    <div class="mt-4">
        <h3 class="text-md font-semibold mb-4">{{ $t('balanceHistory') }}</h3>
        
        <!-- Итого (баланс клиента) -->
        <div v-if="!balanceLoading && currentClientAccount" class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="fas fa-wallet text-blue-500"></i>
                    <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                </div>
                <b :class="{
                    'text-[#5CB85C]': totalBalance >= 0,
                    'text-[#EE4F47]': totalBalance < 0
                }" class="text-lg">{{ formatBalance(totalBalance) }}</b>
            </div>
        </div>

        <div v-if="balanceLoading" class="text-gray-500 p-4 text-center">
            <svg class="animate-spin h-6 w-6 text-gray-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <p class="mt-2">{{ $t('loading') }}</p>
        </div>
        
        <div v-else-if="!balanceHistory || balanceHistory.length === 0" class="text-gray-500 p-4 text-center">
            {{ $t('noHistory') }}
        </div>
        
        <!-- Упрощенный список транзакций без переходов -->
        <div v-else class="space-y-2">
            <div 
                v-for="(item, index) in balanceHistory" 
                :key="index"
                class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span v-html="getOperationTypeIcon(item)" class="text-sm"></span>
                            <span class="text-xs text-gray-500">{{ formatDate(item.date) }}</span>
                            <span v-if="item.user_name" class="text-xs text-gray-400">• {{ item.user_name }}</span>
                        </div>
                        <div v-if="item.note" class="text-sm text-gray-700 mt-1">
                            {{ item.note }}
                        </div>
                    </div>
                    <div class="ml-4 text-right">
                        <div v-html="formatAmount(item)" class="font-semibold"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import ClientController from "@/api/ClientController";

export default {
    name: 'UserBalanceTab',
    props: {
        editingItem: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            currencyCode: '',
            balanceLoading: false,
            balanceHistory: [],
            totalBalance: 0,
        };
    },
    computed: {
        currentClientAccount() {
            return this.editingItem;
        },
        balanceStatusText() {
            if (this.totalBalance > 0) {
                return this.$t('clientOwesUs') || 'Клиент нам должен';
            } else if (this.totalBalance < 0) {
                return this.$t('weOweClient') || 'Мы клиенту должны';
            } else {
                return this.$t('mutualSettlements') || 'Взаиморасчеты';
            }
        }
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        if (this.editingItem && this.editingItem.id) {
            await this.fetchBalanceHistory();
        }
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.totalBalance = 0;
                }
            },
            immediate: true,
        }
    },
    methods: {
        formatBalance(balance) {
            return `${this.$formatNumber(balance, null, true)} ${this.currencyCode}`;
        },
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        formatAmount(item) {
            const amount = parseFloat(item.amount);
            const currencySymbol = this.currencyCode || '';
            const formatted = this.$formatNumber(Math.abs(amount), null, true);
            
            // is_debt = 1 → Продажа (долг) → +amount (красный)
            // is_debt = 0 → Оплата → -amount (зеленый)
            if (item.is_debt === 1 || item.is_debt === true || item.is_debt === '1') {
                return `<span class="text-[#EE4F47]">+${formatted} ${currencySymbol}</span>`;
            } else {
                return `<span class="text-[#5CB85C]">-${formatted} ${currencySymbol}</span>`;
            }
        },
        getOperationTypeIcon(item) {
            const amount = parseFloat(item.amount);
            const isDebt = item.is_debt === 1 || item.is_debt === true || item.is_debt === '1';
            
            if (amount > 0 && isDebt) {
                return '<i class="fas fa-arrow-up text-[#EE4F47] mr-1"></i><span class="text-[#EE4F47] text-sm">Кредит</span>';
            } else if (amount > 0 && !isDebt) {
                return '<i class="fas fa-check text-[#5CB85C] mr-1"></i><span class="text-[#5CB85C] text-sm">Оплачено</span>';
            } else if (amount < 0) {
                return '<i class="fas fa-arrow-down text-[#5CB85C] mr-1"></i><span class="text-[#5CB85C] text-sm">Оплата</span>';
            } else {
                return '<i class="fas fa-exchange-alt text-gray-500 mr-1"></i><span class="text-gray-500 text-sm">Транзакция</span>';
            }
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : '';
            } catch (error) {
                this.currencyCode = '';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            this.balanceLoading = true;
            try {
                const data = await ClientController.getBalanceHistory(this.editingItem.id);
                
                this.balanceHistory = (data || []).map(item => ({
                    ...item,
                    date: item.date || item.created_at || ''
                }));
                
                // Используем баланс из editingItem
                this.totalBalance = parseFloat(this.editingItem.balance || 0);
            } catch (e) {
                console.error('Error fetching balance history:', e);
                this.balanceHistory = [];
                this.totalBalance = 0;
            } finally {
                this.balanceLoading = false;
            }
        }
    }
};
</script>

