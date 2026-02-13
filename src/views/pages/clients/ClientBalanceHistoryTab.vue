<template>
    <div class="mt-4">
        <transition name="fade" mode="out-in">
            <div v-if="editingItem && !balanceLoading" key="table">
                <DraggableTable table-key="client.balance.history" :columns-config="columnsConfig"
                    :table-data="filteredBalanceHistory" :item-mapper="itemMapper"
                    :onItemClick="handleBalanceItemClick">
                    <template #tableSettingsAdditional>
                        <FiltersContainer v-if="editingItem" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" @reset="resetFilters" @apply="applyFilters">
                            <div v-if="editingItem?.balances?.length">
                                <label class="block mb-2 text-xs font-semibold">{{ $t('balance') }}</label>
                                <select v-model="selectedBalanceId" @change="fetchBalanceHistory" class="w-full">
                                    <option v-for="balance in editingItem.balances" :key="balance.id"
                                        :value="balance.id">
                                        {{ balance.currency?.symbol || '' }} - {{ formatBalance(balance.balance) }}
                                        <span v-if="balance.isDefault"> ({{ $t('default') }})</span>
                                    </option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('source') }}</label>
                                <select v-model="sourceFilter" @change="applyFilters" class="w-full">
                                    <option value="">{{ $t('all') || 'Все' }}</option>
                                    <option value="order">{{ $t('orders') }}</option>
                                    <option value="sale">{{ $t('sales') }}</option>
                                    <option value="receipt">{{ $t('warehouseReceipts') }}</option>
                                    <option value="transaction">{{ $t('payments') }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('credit') }}</label>
                                <select v-model="debtFilter" @change="applyFilters" class="w-full">
                                    <option value="">{{ $t('all') || 'Все' }}</option>
                                    <option value="payments">{{ $t('payments') }}</option>
                                    <option value="debt">{{ $t('credit') }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                                <input type="date" v-model="dateFrom" class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                                <input type="date" v-model="dateTo" class="w-full" />
                            </div>
                        </FiltersContainer>
                        <PrimaryButton v-if="editingItem?.id" icon="fas fa-plus" :onclick="openCreatePaymentModal"
                            :is-success="true">
                            {{ $t('createPayment') }}
                        </PrimaryButton>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>


        <SideModalDialog :showForm="entityModalOpen" :onclose="closeEntityModal">
            <template v-if="entityLoading">
                <div class="min-h-64">
                    <TableSkeleton />
                </div>
            </template>
            <template v-else>
                <TransactionCreatePage v-if="selectedEntity && selectedEntity.type === 'transaction'"
                    :editingItem="editingTransactionItem" :initialClient="editingItem"
                    :form-config="transactionFormConfig" :current-client-balance="editingItem?.balance"
                    :client-balances="editingItem?.balances || []" :header-text="transactionHeaderText"
                    @saved="onEntitySaved" @saved-error="onEntitySavedError" @deleted="onEntityDeleted"
                    @deleted-error="onEntityDeletedError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import FiltersContainer from "@/views/components/app/forms/FiltersContainer.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import OperationTypeCell from "@/views/components/app/buttons/OperationTypeCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import filtersMixin from "@/mixins/filtersMixin";
import { defineAsyncComponent, markRaw } from 'vue';
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

const TransactionCreatePage = defineAsyncComponent(() =>
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);

export default {
    mixins: [notificationMixin, getApiErrorMessage, filtersMixin],
    components: {
        DraggableTable,
        FiltersContainer,
        PrimaryButton,
        SideModalDialog,
        SourceButtonCell,
        TableSkeleton,
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
            sourceFilter: '',
            debtFilter: '',
            isPaymentCreateMode: false,
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
                { name: "projectName", label: this.$t("project"), size: 150 },
                {
                    name: "debt",
                    label: "Долг",
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: item.isDebt ?? item.is_debt, variant: 'text' })
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
            if (!this.editingItem?.id || !this.$store.getters.hasPermission('settings_client_balance_view')) {
                this.balanceHistory = [];
                return;
            }
            this.balanceLoading = true;
            try {
                const excludeDebt = this.debtFilter === 'payments' ? true : null;
                this.balanceHistory = await ClientController.getBalanceHistory(
                    this.editingItem.id, excludeDebt, null,
                    this.dateFrom, this.dateTo, this.selectedBalanceId
                );
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
                sourceFilter: '',
                debtFilter: ''
            }, () => {
                this.initDefaultBalance();
                this.fetchBalanceHistory();
            });
        },
        openCreatePaymentModal() {
            this.isPaymentCreateMode = true;
            this.entityModalOpen = true;
            this.selectedEntity = { type: 'transaction' };
            this.editingTransactionItem = null;
        },
        applyFilters() {
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
                this.isPaymentCreateMode = false;
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
            this.isPaymentCreateMode = false;
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
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFrom, defaultValue: null },
                { value: this.dateTo, defaultValue: null },
                { value: this.selectedBalanceId, defaultValue: this.defaultBalanceId },
                { value: this.sourceFilter, defaultValue: '' },
                { value: this.debtFilter, defaultValue: '' }
            ]);
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
                case "projectName": return i.projectName ?? '-';
                case "clientImpact": return parseFloat(i.amount || 0);
                default: return i[c];
            }
        },
    },
    computed: {
        defaultBalanceId() {
            if (!this.editingItem?.balances?.length) return null;
            const defaultBalance = this.editingItem.balances.find(b => b.isDefault);
            return defaultBalance ? defaultBalance.id : (this.editingItem.balances[0]?.id ?? null);
        },
        filteredBalanceHistory() {
            let items = this.balanceHistory || [];
            if (this.sourceFilter) {
                items = items.filter(i => (i.source || i.sourceType) === this.sourceFilter);
            }
            if (this.debtFilter === 'debt') {
                items = items.filter(i => i.isDebt);
            }
            return items;
        },
        transactionFormConfig() {
            if (this.isPaymentCreateMode && !this.editingTransactionItem) {
                return TRANSACTION_FORM_PRESETS.clientPayment;
            }
            return {};
        },
        transactionHeaderText() {
            if (this.isPaymentCreateMode && !this.editingTransactionItem) {
                return this.$t('createPayment') || 'Создать платеж';
            }
            return '';
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
            },
            deep: true,
        },
    },
};
</script>
