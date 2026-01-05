<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
                
                <div v-if="editingItem" class="flex items-center gap-2">
                    <select 
                        v-model="selectedCashRegisterId"
                        @change="fetchBalanceHistory"
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option :value="null">{{ $t('allCashRegisters') || 'Все кассы' }}</option>
                        <option v-for="cash in cashRegisters" :key="cash.id" :value="cash.id">
                            {{ cash.name }} ({{ cash.currencySymbol || '' }})
                        </option>
                    </select>

                    <input 
                        type="date" 
                        v-model="dateFrom"
                        @change="fetchBalanceHistory"
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

                    <input 
                        type="date" 
                        v-model="dateTo"
                        @change="fetchBalanceHistory"
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

                    <PrimaryButton 
                        :onclick="resetFilters"
                        :is-small="true"
                        icon="fas fa-times"
                        :isDanger="true">
                    </PrimaryButton>
                </div>
            </div>

            <PrimaryButton 
                v-if="canAdjustBalance"
                icon="fas fa-plus" 
                :onclick="openAdjustmentModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('adjustBalance') }}
            </PrimaryButton>
        </div>
        
        <div v-if="!balanceLoading && editingItem" class="mb-4 flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
                <i class="fas fa-wallet text-blue-500"></i>
                <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                <b :class="{
                    'text-[#5CB85C]': totalBalance >= 0,
                    'text-[#EE4F47]': totalBalance < 0
                }">{{ formatBalance(totalBalance) }} {{ displayCurrencySymbol }}</b>
            </div>
        </div>

        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!balanceHistory || balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory && balanceHistory.length > 0 && editingItem" table-key="client.balance"
            :columns-config="columnsConfig" :table-data="balanceHistory" :item-mapper="itemMapper"
            :onItemClick="handleBalanceItemClick" />

        <NotificationToast 
            :title="notificationTitle" 
            :subtitle="notificationSubtitle" 
            :show="notification" 
            :is-danger="notificationIsDanger" 
            @close="closeNotification" 
        />

        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="p-8 flex justify-center items-center min-h-[200px]">
                    <svg class="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                </div>
            </template>
            <template v-else>
                <TransactionCreatePage 
                    v-if="selectedEntity && selectedEntity.type === 'transaction'"
                    :editingItem="editingTransactionItem"
                    :initialClient="editingItem"
                    :form-config="balanceAdjustmentFormConfig"
                    :current-client-balance="editingItem?.balance"
                    :header-text="balanceAdjustmentHeader"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import OperationTypeCell from "@/views/components/app/buttons/OperationTypeCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { defineAsyncComponent, markRaw } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import ClientController from "@/api/ClientController";
import ClientDto from "@/dto/client/ClientDto";
import TransactionDto from "@/dto/transaction/TransactionDto";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        NotificationToast,
        SourceButtonCell,
        TransactionCreatePage,
    },
    emits: ['balance-updated'],
    props: {
        editingItem: { 
            required: false,
            default: null,
            validator: function(value) {
                return value === null || (value && typeof value === 'object' && value.id !== undefined);
            }
        },
    },
    data() {
        return {
            currencySymbol: '',
            balanceLoading: false,
            balanceHistory: [],
            lastFetchedClientId: null,
            forceRefresh: false,
            totalBalance: 0,
            transactionModalOpen: false,
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            isAdjustmentMode: false,
            selectedCashRegisterId: null,
            dateFrom: null,
            dateTo: null,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("dateUser"), size: 120 },
                {
                    name: "operationType",
                    label: this.$t("type"),
                    size: 150,
                    component: markRaw(OperationTypeCell),
                    props: (item) => ({
                        item: item
                    })
                },
                {
                    name: "sourceType", 
                    label: "Источник", 
                    size: 120, 
                    component: markRaw(SourceButtonCell),
                    props: (item) => {
                        const sourceType = item.sourceType || null;
                        const isTransaction = sourceType && sourceType.includes('Transaction');
                        const sourceId = isTransaction ? item.sourceId : (item.sourceSourceId || item.sourceId);
                        
                        return {
                            sourceType: sourceType,
                            sourceId: sourceId,
                            onUpdated: () => {
                                this.forceRefresh = true;
                                this.fetchBalanceHistory();
                            },
                            onDeleted: () => {
                                this.forceRefresh = true;
                                this.fetchBalanceHistory();
                            }
                        };
                    }
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "categoryName", label: this.$t("category"), size: 150 },
                {
                    name: "debt",
                    label: "Долг",
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.is_debt,
                        variant: 'text'
                    })
                },
                { name: "userName", label: this.$t("user"), size: 120 },
                {
                    name: "clientImpact",
                    label: this.$t("impact"),
                    size: 130,
                    component: markRaw(ClientImpactCell),
                    props: (item) => ({
                        item: item,
                        currencySymbol: this.currencySymbol,
                        formatNumberFn: this.$formatNumber
                    })
                },
            ],
            ENTITY_CONFIG: {
                transaction: {
                    fetch: id => TransactionController.getItem(id),
                },
            },
        };
    },
    async mounted() {
        await this.fetchDefaultCurrency();
        if (!this.$store.getters.cashRegisters || this.$store.getters.cashRegisters.length === 0) {
            await this.$store.dispatch('loadCashRegisters');
        }
    },

    methods: {
        async updateClientData() {
            if (!this.editingItem || !this.editingItem.id) return;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                if (updatedClient && updatedClient.balance !== undefined) {
                    this.editingItem.balance = updatedClient.balance;
                }
            } catch (error) {
                console.error('Error updating client data:', error);
            }
        },
        handleEntityError(error) {
            let errorMessage;
            if (typeof error === 'string') {
                errorMessage = error;
            } else {
                errorMessage = this.getApiErrorMessage(error);
                if (Array.isArray(errorMessage)) {
                    errorMessage = errorMessage.join(', ');
                }
            }
            this.showNotification(this.$t('error'), errorMessage, true);
        },
        isDebtOperation(item) {
            return item.is_debt == 1;
        },
        formatBalance(balance) {
            return this.$formatNumber(balance, null, true);
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencySymbol = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencySymbol = 'Нет валюты';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            if (!this.$store.getters.hasPermission('settings_client_balance_view')) {
                this.balanceHistory = [];
                this.totalBalance = 0;
                return;
            }
            
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id,
                    null,
                    this.selectedCashRegisterId,
                    this.dateFrom,
                    this.dateTo
                );
                
                // Всегда рассчитываем баланс из истории для корректного отображения
                this.totalBalance = this.balanceHistory.reduce((sum, item) => {
                    const delta = item.balanceDelta !== null && item.balanceDelta !== undefined 
                        ? parseFloat(item.balanceDelta) 
                        : (parseFloat(item.amount) || 0);
                    return sum + delta;
                }, 0);
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
                this.totalBalance = 0;
            } finally {
                this.balanceLoading = false;
            }
        },
        resetFilters() {
            this.selectedCashRegisterId = null;
            this.dateFrom = null;
            this.dateTo = null;
            this.fetchBalanceHistory();
        },

        async handleBalanceItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            try {
                this.entityLoading = true;
                const data = await this.ENTITY_CONFIG.transaction.fetch(item.sourceId);
                this.editingTransactionItem = data;
                
                this.entityModalOpen = true;
                this.selectedEntity = {
                    type: 'transaction',
                    data,
                };
            } catch (error) {
                console.error('Error loading transaction:', error);
                this.$notify?.({ type: 'error', text: 'Ошибка при загрузке транзакции' });
            } finally {
                this.entityLoading = false;
            }
        },
        closeEntityModal() {
            this.entityModalOpen = false;
            this.selectedEntity = null;
            this.entityLoading = false;
            this.isAdjustmentMode = false;
        },
        async onEntitySaved() {
            this.entityModalOpen = false;
            this.isAdjustmentMode = false;
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchBalanceHistory();
            }
            this.$emit('balance-updated');
        },
        onEntitySavedError(error) {
            this.handleEntityError(error);
        },
        async onEntityDeleted() {
            this.entityModalOpen = false;
            this.isAdjustmentMode = false;
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchBalanceHistory();
            }
            this.$emit('balance-updated');
        },
        onEntityDeletedError(error) {
            this.handleEntityError(error);
        },
        openAdjustmentModal() {
            this.isAdjustmentMode = true;
            this.entityModalOpen = true;
            this.selectedEntity = { type: 'transaction' };
            this.editingTransactionItem = null;
        },
        itemMapper(i, c) {
            switch (c) {
                case "id":
                    return i.sourceId || '-';
                case "dateUser":
                    return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "userName":
                    return i.userName || i.user_name || '-';
                case "note":
                    return i.note || '-';
                case "categoryName":
                    const categoryName = i.categoryName || '';
                    return categoryName ? this.$t(`transactionCategory.${categoryName}`, categoryName) : '-';
                case "clientImpact":
                    // Возвращаем числовое значение для сортировки (отображение через компонент ClientImpactCell)
                    return parseFloat(i.amount || 0);
                default:
                    return i[c];
            }
        },
    },
    computed: {
        balanceStatusText() {
            if (this.totalBalance > 0) {
                return 'Клиент нам должен';
            } else if (this.totalBalance < 0) {
                return 'Мы клиенту должны';
            } else {
                return 'Взаиморасчеты';
            }
        },
        canAdjustBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_adjustment');
        },
        balanceAdjustmentFormConfig() {
            return this.isAdjustmentMode ? TRANSACTION_FORM_PRESETS.balanceAdjustment : {};
        },
        balanceAdjustmentHeader() {
            return this.isAdjustmentMode ? 'Транзакция — корректировка баланса' : '';
        },
        cashRegisters() {
            return this.$store.getters.cashRegisters || [];
        },
        displayCurrencySymbol() {
            if (this.selectedCashRegisterId) {
                const selectedCash = this.cashRegisters.find(cash => cash.id === this.selectedCashRegisterId);
                return selectedCash?.currencySymbol || this.currencySymbol || 'TMT';
            }
            return this.currencySymbol || 'TMT';
        }
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchBalanceHistory();
                } else {
                    this.balanceHistory = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.totalBalance = 0;
                }
            },
            immediate: true,
        },
    },
};
</script>
