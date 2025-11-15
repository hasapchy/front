<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
            <PrimaryButton 
                v-if="canAdjustBalance"
                icon="fas fa-plus" 
                :onclick="openAdjustmentModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('adjustBalance') }}
            </PrimaryButton>
        </div>
        
        <div v-if="!balanceLoading && editingItem" class="mb-4">
            <div class="flex items-center gap-2">
                <i class="fas fa-wallet text-blue-500"></i>
                <span class="text-sm text-gray-600">{{ balanceStatusText }}:</span>
                <b :class="{
                    'text-[#5CB85C]': totalBalance >= 0,
                    'text-[#EE4F47]': totalBalance < 0
                }">{{ formatBalance(totalBalance) }}</b>
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
                    :preselectedClientId="editingItem.id"
                    :forceDebt="isAdjustmentMode"
                    :requireNote="isAdjustmentMode"
                    :adjustmentMode="isAdjustmentMode"
                    :adjustmentType="0"
                    :initialClient="editingItem"
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
            currencyCode: '',
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
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("date"), size: 120 },
                { name: "operationType", label: this.$t("type"), size: 150, html: true },
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
                { name: "debt", label: "Долг", size: 80, html: true },
                { name: "userName", label: this.$t("user"), size: 120 },
                { name: "clientImpact", label: this.$t("impact"), size: 130, html: true },
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
            return item.is_debt === 1 || item.is_debt === true || item.is_debt === '1';
        },
        formatBalance(balance) {
            return `${this.$formatNumber(balance, null, true)} ${this.currencyCode}`;
        },
        async fetchDefaultCurrency() {
            try {
                await this.$store.dispatch('loadCurrencies');
                const currencies = this.$store.getters.currencies;
                const defaultCurrency = currencies.find(c => c.isDefault);
                this.currencyCode = defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
            } catch (error) {
                this.currencyCode = 'Нет валюты';
            }
        },
        async fetchBalanceHistory() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            if (!this.$store.getters.hasPermission('settings_client_balance_view')) {
                this.balanceHistory = [];
                this.totalBalance = 0;
                return;
            }
            
            if (this.lastFetchedClientId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
            
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id
                );
                
                this.totalBalance = parseFloat(this.editingItem.balance || 0);
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
                this.totalBalance = 0;
            } finally {
                this.balanceLoading = false;
            }
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
                case "operationType":
                    return i.getOperationTypeHtml ? i.getOperationTypeHtml() : '-';
                case "dateUser":
                    return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "userName":
                    return i.userName || i.user_name || '-';
                case "note":
                    return i.note || '-';
                case "debt":
                    return i.getDebtHtml ? i.getDebtHtml() : '-';
                case "clientImpact":
                    return i.getClientImpactHtml ? i.getClientImpactHtml(i.currencySymbol || this.currencyCode, this.$formatNumber) : '-';
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
