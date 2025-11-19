<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
            <div class="flex gap-2">
                <PrimaryButton 
                    icon="fas fa-gift" 
                    :onclick="handleBonus"
                    :is-success="true"
                    :disabled="!editingItem || !editingItem.id">
                    {{ $t('bonus') || 'Начислить премию' }}
                </PrimaryButton>
                <PrimaryButton 
                    icon="fas fa-exclamation-triangle" 
                    :onclick="handlePenalty"
                    :is-danger="true"
                    :disabled="!editingItem || !editingItem.id">
                    {{ $t('penalty') || 'Выписать штраф' }}
                </PrimaryButton>
            </div>
        </div>
        
        <!-- Итого (баланс сотрудника) -->
        <div v-if="!balanceLoading && editingItem" class="mb-4 p-4 bg-gray-50 rounded-lg">
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
                            <span class="text-xs text-gray-500">{{ formatDate(item) }}</span>
                            <span v-if="item.userName || item.user_name" class="text-xs text-gray-400">• {{ item.userName || item.user_name }}</span>
                        </div>
                        <div v-if="item.note" class="text-sm text-gray-700 mt-1">
                            {{ item.note }}
                        </div>
                        <div v-if="item.description" class="text-xs text-gray-500 mt-1">
                            {{ item.description }}
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
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";

export default {
    name: 'UserBalanceTab',
    components: {
        PrimaryButton,
    },
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
        formatDate(item) {
            return item.formatDate ? item.formatDate() : '';
        },
        formatAmount(item) {
            return item.getClientImpactHtml ? item.getClientImpactHtml(this.currencyCode, this.$formatNumber) : '';
        },
        getOperationTypeIcon(item) {
            return item.getOperationTypeHtml ? item.getOperationTypeHtml() : '';
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
                const UsersController = (await import("@/api/UsersController")).default;
                const balanceInfo = await UsersController.getEmployeeBalance(this.editingItem.id);
                const history = await UsersController.getEmployeeBalanceHistory(this.editingItem.id);
                
                this.balanceHistory = history || [];
                
                this.totalBalance = balanceInfo ? parseFloat(balanceInfo.balance || 0) : 0;
            } catch (e) {
                console.error('Error fetching balance history:', e);
                this.balanceHistory = [];
                this.totalBalance = 0;
            } finally {
                this.balanceLoading = false;
            }
        },
        handleBonus() {
            alert('Начислить премию - заглушка');
        },
        handlePenalty() {
            alert('Выписать штраф - заглушка');
        }
    }
};
</script>

