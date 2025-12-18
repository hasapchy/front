<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
            <h3 class="text-md font-semibold">{{ $t('paymentsHistory') }}</h3>
            <PrimaryButton 
                icon="fas fa-plus" 
                :onclick="openCreatePaymentModal"
                :is-success="true"
                :disabled="!editingItem || !editingItem.id">
                {{ $t('createPayment') }}
            </PrimaryButton>
        </div>

        <div v-if="!paymentsLoading && editingItem && (totalIncome > 0 || totalExpense > 0)" class="mb-4 space-y-2">
            <div class="flex items-center gap-2">
                <i class="fas fa-arrow-up text-green-500"></i>
                <span class="text-sm text-gray-600">{{ $t('totalIncome') || 'Приходы' }}:</span>
                <b class="text-[#5CB85C]">{{ formatBalance(totalIncome) }}</b>
            </div>
            <div class="flex items-center gap-2">
                <i class="fas fa-arrow-down text-red-500"></i>
                <span class="text-sm text-gray-600">{{ $t('totalExpense') || 'Расходы' }}:</span>
                <b class="text-red-600">{{ formatBalance(totalExpense) }}</b>
            </div>
        </div>

        <div v-if="paymentsLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!paymentsHistory || paymentsHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!paymentsLoading && paymentsHistory && paymentsHistory.length > 0 && editingItem" table-key="client.payments"
            :columns-config="columnsConfig" :table-data="paymentsHistory" :item-mapper="itemMapper"
            :onItemClick="handlePaymentItemClick" />

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
                    :form-config="paymentsFormConfig"
                    :header-text="paymentsHeaderText"
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
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import OperationTypeCell from "@/views/components/app/buttons/OperationTypeCell.vue";
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
        TransactionCreatePage,
        SourceButtonCell,
        OperationTypeCell,
    },
    emits: ['payments-updated'],
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
            paymentsLoading: false,
            paymentsHistory: [],
            lastFetchedClientId: null,
            forceRefresh: false,
            totalIncome: 0,
            totalExpense: 0,
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("date"), size: 120 },
                {
                    name: "operationType",
                    label: this.$t("type"),
                    size: 150,
                    component: markRaw(OperationTypeCell),
                    props: (item) => ({
                        item: item,
                        variant: 'payment'
                    })
                },
                {
                    name: "sourceType",
                    label: "Источник",
                    size: 120,
                    component: markRaw(SourceButtonCell),
                    props: (item) => ({
                        source: item.source
                    })
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "user_name", label: this.$t("user"), size: 120 },
                {
                    name: "clientImpact",
                    label: this.$t("amount"),
                    size: 130,
                    component: markRaw(ClientImpactCell),
                    props: (item) => ({
                        item: item,
                        currencySymbol: this.currencySymbol,
                        formatNumberFn: this.$formatNumber,
                        variant: 'payment'
                    })
                },
            ],
        };
    },
    computed: {
        paymentsFormConfig() {
            return TRANSACTION_FORM_PRESETS.clientPayment;
        },
        paymentsHeaderText() {
            return 'Транзакция — платеж';
        }
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
        formatBalance(balance) {
            return `${this.$formatNumber(balance, null, true)} ${this.currencySymbol}`;
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
        async fetchPaymentsHistory() {
            if (!this.editingItem || !this.editingItem.id) return;
            
            if (!this.$store.getters.hasPermission('settings_client_balance_view')) {
                this.paymentsHistory = [];
                this.totalIncome = 0;
                this.totalExpense = 0;
                return;
            }
            
            if (this.lastFetchedClientId === this.editingItem.id && !this.forceRefresh) {
                return;
            }
            
            this.paymentsLoading = true;
            try {
                const data = await ClientController.getBalanceHistory(
                    this.editingItem.id,
                    true
                );
                
                this.paymentsHistory = data || [];
                
                // Раздельно считаем приходы (положительные) и расходы (отрицательные)
                let income = 0;
                let expense = 0;
                
                this.paymentsHistory.forEach(item => {
                    const amount = parseFloat(item.amount || 0);
                    if (amount > 0) {
                        income += amount;
                    } else if (amount < 0) {
                        expense += Math.abs(amount);
                    }
                });
                
                this.totalIncome = income;
                this.totalExpense = expense;
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.paymentsHistory = [];
                this.totalIncome = 0;
                this.totalExpense = 0;
            } finally {
                this.paymentsLoading = false;
            }
        },

        async handlePaymentItemClick(item) {
            if (!this.editingItem || !this.editingItem.id) return;
            
            try {
                this.entityLoading = true;
                this.editingTransactionItem = await TransactionController.getItem(item.sourceId);
                
                this.entityModalOpen = true;
                this.selectedEntity = {
                    type: 'transaction',
                    data: this.editingTransactionItem,
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
        },
        async onEntitySaved() {
            this.entityModalOpen = false;
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchPaymentsHistory();
            }
            this.$emit('payments-updated');
        },
        onEntitySavedError(error) {
            this.handleEntityError(error);
        },
        async onEntityDeleted() {
            this.entityModalOpen = false;
            if (this.editingItem && this.editingItem.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
                this.forceRefresh = true;
                await this.fetchPaymentsHistory();
            }
            this.$emit('payments-updated');
        },
        onEntityDeletedError(error) {
            this.handleEntityError(error);
        },
        openCreatePaymentModal() {
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
                case "user_name":
                    return i.user_name || '-';
                case "note":
                    return i.note || '-';
                case "clientImpact":
                    // Возвращаем числовое значение для сортировки (отображение через компонент ClientImpactCell)
                    return parseFloat(i.amount || 0);
                default:
                    return i[c];
            }
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.fetchPaymentsHistory();
                } else {
                    this.paymentsHistory = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.totalIncome = 0;
                    this.totalExpense = 0;
                }
            },
            immediate: true,
        },
    },
};
</script>
