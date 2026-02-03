<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <h3 class="text-md font-semibold">{{ $t('balanceHistory') }}</h3>
                <div v-if="editingItem" class="flex items-center gap-2">
                    <select 
                        v-if="editingItem.balances?.length"
                        v-model="selectedBalanceId"
                        @change="fetchBalanceHistory"
                        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option 
                            v-for="balance in editingItem.balances" 
                            :key="balance.id" 
                            :value="balance.id">
                            {{ balance.currency?.symbol || '' }} - {{ formatBalance(balance.balance) }}
                            <span v-if="balance.isDefault"> ({{ $t('default') }})</span>
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
        </div>

        <div v-if="balanceLoading" class="text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="!balanceHistory || balanceHistory.length === 0" class="text-gray-500">
            {{ $t('noHistory') }}
        </div>
        <DraggableTable v-if="!balanceLoading && balanceHistory?.length && editingItem" table-key="client.balance.history"
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
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

const TransactionCreatePage = defineAsyncComponent(() => 
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);

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
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            currencySymbol: '',
            balanceLoading: false,
            balanceHistory: [],
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            isAdjustmentMode: false,
            dateFrom: null,
            dateTo: null,
            selectedBalanceId: null,
            columnsConfig: [
                { name: "id", label: "№", size: 60 },
                { name: "dateUser", label: this.$t("dateUser"), size: 120 },
                {
                    name: "operationType",
                    label: this.$t("type"),
                    size: 150,
                    component: markRaw(OperationTypeCell),
                    props: (item) => ({ item: item })
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
                            sourceType,
                            sourceId,
                            onUpdated: () => this.fetchBalanceHistory(),
                            onDeleted: () => this.fetchBalanceHistory()
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
                    props: (item) => ({ isDebt: item.is_debt, variant: 'text' })
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
                transaction: { fetch: id => TransactionController.getItem(id) },
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
            const msg = typeof error === 'string' ? error : this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
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
                    this.editingItem.id, null, null,
                    this.dateFrom, this.dateTo, this.selectedBalanceId
                );
            } catch (e) {
                this.balanceHistory = [];
            } finally {
                this.balanceLoading = false;
            }
        },
        resetFilters() {
            this.dateFrom = null;
            this.dateTo = null;
            this.initDefaultBalance();
            this.fetchBalanceHistory();
        },
        initDefaultBalance() {
            if (this.editingItem?.balances?.length) {
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
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
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
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                await this.updateClientData();
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
                case "id": return i.sourceId || '-';
                case "dateUser": return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "userName": return i.userName || i.user_name || '-';
                case "note": return i.note || '-';
                case "categoryName":
                    const categoryName = i.categoryName || '';
                    return categoryName ? this.$t(`transactionCategory.${categoryName}`, categoryName) : '-';
                case "clientImpact": return parseFloat(i.amount || 0);
                default: return i[c];
            }
        },
    },
    computed: {
        canAdjustBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_adjustment');
        },
        balanceAdjustmentFormConfig() {
            return this.isAdjustmentMode ? TRANSACTION_FORM_PRESETS.balanceAdjustment : {};
        },
        balanceAdjustmentHeader() {
            return this.isAdjustmentMode ? 'Транзакция — корректировка баланса' : '';
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (newId) {
                    this.initDefaultBalance();
                    this.$nextTick(() => this.fetchBalanceHistory());
                } else {
                    this.balanceHistory = [];
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
                this.initDefaultBalance();
                this.$nextTick(() => this.fetchBalanceHistory());
            },
            deep: true,
        },
    },
};
</script>
