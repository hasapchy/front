<template>
  <div class="mt-4">
    <teleport v-bind="sideModalBookmarkTeleportBind">
      <FormBookmarks :tabs="employeeActionBookmarkTabs" />
    </teleport>
    <ClientBalanceStatusPlaque
      v-if="editingItem?.id && editingItem?.balances?.length"
      :status-text="balanceStatusText"
      :total-balance="totalBalance"
      :currency-code="balanceSummaryCurrencyCode"
      :balances="editingItem.balances"
      @select-balance="selectBalance"
    />

    <ClientBalanceHistoryBase
      ref="balanceHistoryBase"
      :editing-item="editingItem"
      :columns-config="columnsConfig"
      table-key="client.balance.history"
      :item-mapper="itemMapper"
      :on-item-click="handleBalanceItemClick"
      @selected-balance-id-change="selectedBalanceIdFromBase = $event"
    >
      <template #additionalButtons>
        <template v-if="false" />
      </template>
    </ClientBalanceHistoryBase>

    <SideModalDialog
      :show-form="employeeTransactionModalOpen"
      :title="employeeTransactionModalOpen ? employeeTransactionHeaderText : ''"
      :onclose="closeEmployeeTransactionModal"
    >
      <TransactionCreatePage
        v-if="employeeTransactionModalOpen && editingItem && editingItem.id && employeeTransactionModalType"
        :key="employeeTransactionModalType"
        :form-config="employeeTransactionFormConfig"
        :initial-client="editingItem"
        :client-balances="editingItem?.balances || []"
        @saved="onEmployeeTransactionSaved"
        @saved-error="onEntitySavedError"
      />
    </SideModalDialog>

    <SideModalDialog
      :show-form="entityModalOpen"
      :title="balanceHistoryEntityModalTitle"
      :onclose="closeEntityModal"
    >
      <template v-if="entityLoading">
        <div class="min-h-64">
          <TableSkeleton />
        </div>
      </template>
      <template v-else>
        <TransactionCreatePage
          v-if="selectedEntity && selectedEntity.type === 'transaction'"
          :editing-item="editingTransactionItem"
          :initial-client="editingItem"
          :form-config="transactionFormConfig"
          :current-client-balance="editingItem?.balance"
          :client-balances="editingItem?.balances || []"
          @saved="onEntitySaved"
          @saved-error="onEntitySavedError"
          @deleted="onEntityDeleted"
          @deleted-error="onEntityDeletedError"
        />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import FormBookmarks from "@/views/components/app/FormBookmarks.vue";
import SideModalDialog, { transactionSideModalTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
import { sideModalBookmarkPortal } from "@/views/components/app/dialog/SideModalDialog.vue";
import TableSkeleton from "@/views/components/app/TableSkeleton.vue";
import SourceButtonCell from "@/views/components/app/buttons/SourceButtonCell.vue";
import DebtCell from "@/views/components/app/buttons/DebtCell.vue";
import OperationTypeCell from "@/views/components/app/buttons/OperationTypeCell.vue";
import ClientImpactCell from "@/views/components/app/buttons/ClientImpactCell.vue";
import ClientBalanceHistoryBase from "@/views/components/clients/ClientBalanceHistoryBase.vue";
import ClientBalanceStatusPlaque from "@/views/components/clients/ClientBalanceStatusPlaque.vue";
import TransactionCreatePage from "@/views/pages/transactions/TransactionCreatePage.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import notificationMixin from "@/mixins/notificationMixin";
import { markRaw } from 'vue';
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';
import ClientController from "@/api/ClientController";
import { mapBalanceHistoryTableCell } from "@/utils/clientBalanceHistoryTableUtils";
import TransactionController from "@/api/TransactionController";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

export default {
    components: {
        FormBookmarks,
        ClientBalanceHistoryBase,
        ClientBalanceStatusPlaque,
        SideModalDialog,
        TableSkeleton,
        TransactionCreatePage,
    },
    mixins: [notificationMixin, getApiErrorMessage, sideModalBookmarkPortal],
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['balance-updated'],
    data() {
        return {
            columnsConfig: [
                { name: 'id', label: 'number', size: 60, html: true },
                { name: 'dateUser', label: 'dateUser', size: 120, html: true },
                {
                    name: 'operationType',
                    label: 'type',
                    size: 150,
                    component: markRaw(OperationTypeCell),
                    props: (item) => ({ item }),
                },
                {
                    name: 'sourceType',
                    label: 'source',
                    size: 120,
                    component: markRaw(SourceButtonCell),
                    props: (item) => {
                        const sourceType = item.sourceType || null;
                        const isTransaction = sourceType && sourceType.includes('Transaction');
                        const sourceId = isTransaction ? item.sourceId : (item.sourceSourceId || item.sourceId);
                        return {
                            sourceType,
                            sourceId,
                            onUpdated: () => this.refreshBalanceHistory(),
                            onDeleted: () => this.refreshBalanceHistory(),
                        };
                    },
                },
                { name: 'note', label: 'note', size: 200, html: true },
                { name: 'categoryName', label: 'category', size: 150, html: true },
                { name: 'projectName', label: 'project', size: 150, html: true },
                {
                    name: 'debt',
                    label: 'balanceHistoryDebtColumn',
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: item.isDebt, variant: 'text' }),
                },
                {
                    name: 'creatorName',
                    label: 'user',
                    size: 120,
                    component: markRaw(UserButtonCell),
                    props: (item) => ({
                        user: item.creator,
                        searchQuery: this.$refs.balanceHistoryBase?.balanceSearchHighlight ?? '',
                    }),
                },
                {
                    name: 'clientImpact',
                    label: 'impact',
                    size: 130,
                    component: markRaw(ClientImpactCell),
                    props: (item) => ({
                        item,
                        currencyCode: this.defaultCurrencyCode,
                        formatNumberFn: this.$formatNumber,
                    }),
                },
                {
                    name: 'balanceAfter',
                    label: 'balanceAfterOperation',
                    size: 130,
                },
            ],
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            employeeTransactionModalOpen: false,
            employeeTransactionModalType: null,
            selectedBalanceIdFromBase: null,
            ENTITY_CONFIG: {
                transaction: { fetch: id => TransactionController.getItem(id) },
            },
        };
    },
    computed: {
        isEmployeeClient() {
            const type = this.editingItem?.clientType;
            return type === 'employee';
        },
        selectedBalance() {
            if (!this.editingItem?.balances?.length) {
                return null;
            }
            const sid = this.selectedBalanceIdFromBase;
            return this.editingItem.balances.find(b => b.id === sid) ||
                this.editingItem.balances.find(b => b.isDefault) ||
                this.editingItem.balances[0];
        },
        totalBalance() {
            if (!this.selectedBalance) {
                return parseFloat(this.editingItem?.balance || 0);
            }
            return parseFloat(this.selectedBalance.balance || 0);
        },
        balanceSummaryCurrencyCode() {
            return this.selectedBalance?.currency?.code || this.defaultCurrencyCode;
        },
        defaultCurrencyCode() {
            const currencies = this.$store.getters.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency?.code ;
        },
        balanceStatusText() {
            const t = this.totalBalance;
            if (this.isEmployeeClient) {
                if (t > 0) return this.$t('employeeOwesUs');
                if (t < 0) return this.$t('weOweEmployee');
                return this.$t('mutualSettlements');
            }
            if (t > 0) return this.$t('clientOwesUs');
            if (t < 0) return this.$t('weOweClient');
            return this.$t('mutualSettlement');
        },
        transactionFormConfig() {
            return TRANSACTION_FORM_PRESETS.full;
        },
        employeeTransactionFormConfig() {
            switch (this.employeeTransactionModalType) {
                case 'bonus': return TRANSACTION_FORM_PRESETS.employeeBonus;
                case 'penalty': return TRANSACTION_FORM_PRESETS.employeePenalty;
                case 'salaryAccrual': return TRANSACTION_FORM_PRESETS.employeeSalaryAccrual;
                case 'salaryPayment': return TRANSACTION_FORM_PRESETS.employeeSalaryPayment;
                case 'advance': return TRANSACTION_FORM_PRESETS.employeeAdvance;
                default: return TRANSACTION_FORM_PRESETS.full;
            }
        },
        employeeTransactionHeaderText() {
            switch (this.employeeTransactionModalType) {
                case 'bonus': return this.$t('bonus');
                case 'penalty': return this.$t('penalty');
                case 'salaryAccrual': return this.$t('accrueSalary');
                case 'salaryPayment': return this.$t('paySalary');
                case 'advance': return this.$t('advance');
                default: return '';
            }
        },
        employeeActionBookmarkTabs() {
            const isVisible = this.isEmployeeClient;
            const isDisabled = !this.editingItem?.id;
            return [
                {
                    key: 'salaryAccrual',
                    iconClass: 'fas fa-money-bill-wave text-[11px]',
                    label: this.$t('accrueSalary'),
                    variant: 'success',
                    visible: isVisible,
                    disabled: isDisabled,
                    onClick: () => this.openEmployeeTransactionModal('salaryAccrual'),
                },
                {
                    key: 'salaryPayment',
                    iconClass: 'fas fa-hand-holding-usd text-[11px]',
                    label: this.$t('paySalary'),
                    variant: 'success',
                    visible: isVisible,
                    disabled: isDisabled,
                    onClick: () => this.openEmployeeTransactionModal('salaryPayment'),
                },
                {
                    key: 'bonus',
                    iconClass: 'fas fa-gift text-[11px]',
                    label: this.$t('bonus'),
                    variant: 'success',
                    visible: isVisible,
                    disabled: isDisabled,
                    onClick: () => this.openEmployeeTransactionModal('bonus'),
                },
                {
                    key: 'penalty',
                    iconClass: 'fas fa-exclamation-triangle text-[11px]',
                    label: this.$t('penalty'),
                    variant: 'danger',
                    visible: isVisible,
                    disabled: isDisabled,
                    onClick: () => this.openEmployeeTransactionModal('penalty'),
                },
                {
                    key: 'advance',
                    iconClass: 'fas fa-money-check-alt text-[11px]',
                    label: this.$t('advance'),
                    variant: 'success',
                    visible: isVisible,
                    disabled: isDisabled,
                    onClick: () => this.openEmployeeTransactionModal('advance'),
                },
            ];
        },
        balanceHistoryEntityModalTitle() {
            if (!this.entityModalOpen) {
                return '';
            }
            if (this.entityLoading) {
                return this.$t('loading');
            }
            return transactionSideModalTitle(this.$t.bind(this), {
                editingItem: this.editingTransactionItem,
            });
        },
    },
    watch: {
        'editingItem.id': {
            handler(newId) {
                if (!newId) {
                    this.selectedEntity = null;
                    this.entityModalOpen = false;
                    this.entityLoading = false;
                    this.selectedBalanceIdFromBase = null;
                }
            },
            immediate: true,
        },
    },
    methods: {
        selectBalance(balance) {
            this.selectedBalanceIdFromBase = balance.id;
            this.$refs.balanceHistoryBase.setSelectedBalanceId(balance.id);
        },
        async updateClientData() {
            if (!this.editingItem || !this.editingItem.id) return null;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                return updatedClient ?? null;
            } catch (error) {
                console.error('Error updating client data:', error);
                return null;
            }
        },
        handleEntityError(error) {
            const msg = this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
        },
        refreshBalanceHistory() {
            const base = this.$refs.balanceHistoryBase;
            return base?.fetchBalanceHistory?.(1);
        },
        openEmployeeTransactionModal(type) {
            this.employeeTransactionModalType = type;
            this.employeeTransactionModalOpen = true;
        },
        closeEmployeeTransactionModal() {
            this.employeeTransactionModalOpen = false;
            this.employeeTransactionModalType = null;
        },
        async onEmployeeTransactionSaved() {
            this.closeEmployeeTransactionModal();
            this.showNotification(this.$t('success'), this.$t('transactionSaved'), false);
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                const updated = await this.updateClientData();
                await this.$nextTick();
                await this.refreshBalanceHistory();
                this.$emit('balance-updated', updated);
                return;
            }
            this.$emit('balance-updated', null);
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
                this.$notify?.({ type: 'error', text: this.$t('errorGettingTransaction') });
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
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                const updated = await this.updateClientData();
                await this.$nextTick();
                await this.refreshBalanceHistory();
                this.$emit('balance-updated', updated);
                return;
            }
            this.$emit('balance-updated', null);
        },
        onEntitySavedError(error) {
            this.handleEntityError(error);
        },
        async onEntityDeleted() {
            this.entityModalOpen = false;
            if (this.editingItem?.id) {
                await this.$store.dispatch('invalidateCache', { type: 'clients' });
                await this.$store.dispatch('loadClients');
                const updated = await this.updateClientData();
                await this.$nextTick();
                await this.refreshBalanceHistory();
                this.$emit('balance-updated', updated);
                return;
            }
            this.$emit('balance-updated', null);
        },
        onEntityDeletedError(error) {
            this.handleEntityError(error);
        },
        itemMapper(i, c, search) {
            return mapBalanceHistoryTableCell(i, c, this.$t.bind(this), search);
        },
    },
};
</script>
