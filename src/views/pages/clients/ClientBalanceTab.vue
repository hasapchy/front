<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
                
                <div v-if="editingItem" class="flex items-center gap-2">
                    <select 
                        v-if="editingItem.balances && editingItem.balances.length > 0"
                        v-model="selectedBalanceId"
                        @change="fetchBalanceHistory"
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option 
                            v-for="balance in editingItem.balances" 
                            :key="balance.id" 
                            :value="balance.id">
                            {{ balance.currency?.symbol || '' }} - {{ formatBalance(balance.balance) }}
                            <span v-if="balance.isDefault"> ({{ $t('default') || 'По умолчанию' }})</span>
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

            <div class="flex gap-2">
                <PrimaryButton 
                    v-if="canCreateBalance && editingItem && editingItem.id"
                    icon="fas fa-plus" 
                    :onclick="openAddBalanceModal"
                    :is-success="true">
                    {{ $t('createBalance') || 'Создать баланс' }}
                </PrimaryButton>
                
                <PrimaryButton 
                    v-if="canAdjustBalance"
                    icon="fas fa-plus" 
                    :onclick="openAdjustmentModal"
                    :is-success="true"
                    :disabled="!editingItem || !editingItem.id">
                    {{ $t('adjustBalance') }}
                </PrimaryButton>
            </div>
        </div>
        
        <div v-if="editingItem && editingItem.balances && editingItem.balances.length > 0" class="mb-4">
            <h4 class="text-sm font-semibold mb-2">{{ $t('balances') || 'Балансы' }}</h4>
            <div class="overflow-x-auto w-full">
                <table class="draggable-table min-w-full bg-white shadow-md rounded mb-6" style="font-size: 12px;">
                    <thead class="bg-gray-100 rounded-t-sm">
                        <tr>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('currency') || 'Валюта' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('balance') || 'Баланс' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('status') || 'Статус' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('note') || 'Примечание' }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(balance, idx) in editingItem.balances" :key="balance.id" 
                            @dblclick.stop="openBalanceModal(balance)"
                            class="cursor-pointer hover:bg-gray-100 transition-all"
                            :class="{ 'border-b border-gray-300': idx !== editingItem.balances.length - 1 }">
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                {{ balance.currency?.symbol || balance.currency?.code || '-' }}
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300" :class="{
                                'text-[#5CB85C]': balance.balance > 0,
                                'text-[#EE4F47]': balance.balance < 0,
                                'text-[#337AB7]': balance.balance == 0
                            }">
                                {{ formatBalance(balance.balance) }}
                                <span v-if="balance.balance > 0" class="text-xs ml-1">({{ $t('clientOwesUs') }})</span>
                                <span v-else-if="balance.balance < 0" class="text-xs ml-1">({{ $t('weOweClient') }})</span>
                                <span v-else class="text-xs ml-1">({{ $t('mutualSettlement') }})</span>
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                <span v-if="balance.isDefault" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {{ $t('default') || 'По умолчанию' }}
                                </span>
                                <span v-else class="text-gray-400">-</span>
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                {{ balance.note || '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
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
                    :client-balances="editingItem?.balances || []"
                    :header-text="balanceAdjustmentHeader"
                    @saved="onEntitySaved"
                    @saved-error="onEntitySavedError"
                    @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>

        <SideModalDialog :showForm="addBalanceModalOpen" :onclose="closeAddBalanceModal">
            <ClientBalanceCreatePage 
                :editing-item="null"
                :initial-client="editingItem"
                @saved="onBalanceSaved"
                @saved-error="onBalanceSavedError"
                @close-request="closeAddBalanceModal" />
        </SideModalDialog>


        <SideModalDialog :showForm="balanceModalOpen" :onclose="closeBalanceModal">
            <ClientBalanceCreatePage 
                v-if="balanceModalOpen"
                :editing-item="selectedBalance"
                :initial-client="editingItem"
                @saved="onBalanceSaved"
                @saved-error="onBalanceSavedError"
                @deleted="onBalanceDeleted"
                @deleted-error="onBalanceDeletedError"
                @close-request="closeBalanceModal" />
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import NotificationToast from "@/views/components/app/dialog/NotificationToast.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import OperationTypeCell from "@/views/components/app/buttons/OperationTypeCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import ClientBalanceCreatePage from "@/views/pages/clients/ClientBalanceCreatePage.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { defineAsyncComponent, markRaw } from 'vue';
import ClientController from "@/api/ClientController";
import ClientBalanceDto from "@/dto/client/ClientBalanceDto";

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);
import TransactionController from "@/api/TransactionController";
import TransactionDto from "@/dto/transaction/TransactionDto";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

export default {
    mixins: [notificationMixin, getApiErrorMessage, filtersMixin],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        NotificationToast,
        AlertDialog,
        SourceButtonCell,
        TransactionCreatePage,
        ClientBalanceCreatePage,
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
            transactionModalOpen: false,
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            isAdjustmentMode: false,
            dateFrom: null,
            dateTo: null,
            selectedBalanceId: null,
            addBalanceModalOpen: false,
            balanceModalOpen: false,
            selectedBalance: null,
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
        this.initDefaultBalance();
    },

    methods: {
        async updateClientData() {
            if (!this.editingItem || !this.editingItem.id) return;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                if (updatedClient) {
                    Object.assign(this.editingItem, updatedClient);
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
                return;
            }
            
            this.balanceLoading = true;
            try {
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id,
                    null,
                    null,
                    this.dateFrom,
                    this.dateTo,
                    this.selectedBalanceId
                );
                
                this.lastFetchedClientId = this.editingItem.id;
                this.forceRefresh = false;
            } catch (e) {
                this.balanceHistory = [];
            } finally {
                this.balanceLoading = false;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFrom: null,
                dateTo: null,
                selectedBalanceId: null
            }, () => {
                this.initDefaultBalance();
                this.fetchBalanceHistory();
            });
        },
        initDefaultBalance() {
            if (this.editingItem && this.editingItem.balances && this.editingItem.balances.length > 0) {
                const defaultBalance = this.editingItem.balances.find(b => b.isDefault);
                this.selectedBalanceId = defaultBalance ? defaultBalance.id : (this.editingItem.balances[0]?.id || null);
            } else {
                this.selectedBalanceId = null;
            }
        },

        async handleBalanceItemClick(item) {
            if (!item?.sourceId) return;
            
            try {
                this.entityLoading = true;
                const data = await this.ENTITY_CONFIG.transaction.fetch(item.sourceId);
                this.editingTransactionItem = data;
                this.entityModalOpen = true;
                this.selectedEntity = { type: 'transaction', data };
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
                    return parseFloat(i.amount || 0);
                default:
                    return i[c];
            }
        },
        openAddBalanceModal() {
            this.addBalanceModalOpen = true;
        },
        closeAddBalanceModal() {
            this.addBalanceModalOpen = false;
        },
        async onBalanceSaved() {
            await this.updateClientData();
            this.closeAddBalanceModal();
            this.closeBalanceModal();
            this.$emit('balance-updated');
        },
        onBalanceSavedError(error) {
            console.error('Error saving balance:', error);
        },
        async onBalanceDeleted() {
            await this.updateClientData();
            this.closeBalanceModal();
            this.$emit('balance-updated');
        },
        onBalanceDeletedError(error) {
            console.error('Error deleting balance:', error);
        },
        openBalanceModal(balance) {
            if (!balance || !this.editingItem) return;
            this.selectedBalance = balance;
            this.balanceModalOpen = true;
        },
        closeBalanceModal() {
            this.balanceModalOpen = false;
            this.selectedBalance = null;
        },
    },
    computed: {
        canAdjustBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_adjustment');
        },
        canCreateBalance() {
            return this.$store.getters.hasPermission('clients_update');
        },
        canUpdateBalance() {
            return this.$store.getters.hasPermission('clients_update');
        },
        canDeleteBalance() {
            return this.$store.getters.hasPermission('clients_delete');
        },
        balanceAdjustmentFormConfig() {
            return this.isAdjustmentMode ? TRANSACTION_FORM_PRESETS.balanceAdjustment : {};
        },
        balanceAdjustmentHeader() {
            return this.isAdjustmentMode ? 'Транзакция — корректировка баланса' : '';
        },
        availableCurrencies() {
            return this.$store.getters.currencies || [];
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.initDefaultBalance();
                    this.$nextTick(() => {
                        this.fetchBalanceHistory();
                    });
                } else {
                    this.balanceHistory = [];
                    this.lastFetchedClientId = null;
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.selectedBalanceId = null;
                }
            },
            immediate: true,
        },
        'editingItem.balances': {
            handler() {
                if (this.editingItem && this.editingItem.id) {
                    this.initDefaultBalance();
                    this.$nextTick(() => {
                        if (this.lastFetchedClientId === this.editingItem.id) {
                            this.fetchBalanceHistory();
                        }
                    });
                }
            },
            deep: true,
        },
    },
};
</script>
