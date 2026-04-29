<template>
  <div class="mt-4">
    <ClientBalanceStatusPlaque
      v-if="editingItem?.id && editingItem?.balances?.length"
      :status-text="balanceStatusText"
      :total-balance="totalBalance"
      :currency-symbol="balanceSummaryCurrencySymbol"
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
        <template v-if="isEmployeeClient">
          <PrimaryButton
            icon="fas fa-money-bill-wave"
            :onclick="() => openEmployeeTransactionModal('salaryAccrual')"
            :is-success="true"
            :disabled="!editingItem?.id"
          >
            {{ $t('accrueSalary') }}
          </PrimaryButton>
          <PrimaryButton
            icon="fas fa-hand-holding-usd"
            :onclick="() => openEmployeeTransactionModal('salaryPayment')"
            :is-success="true"
            :disabled="!editingItem?.id"
          >
            {{ $t('paySalary') }}
          </PrimaryButton>
          <PrimaryButton
            icon="fas fa-gift"
            :onclick="() => openEmployeeTransactionModal('bonus')"
            :is-success="true"
            :disabled="!editingItem?.id"
          >
            {{ $t('bonus') }}
          </PrimaryButton>
          <PrimaryButton
            icon="fas fa-exclamation-triangle"
            :onclick="() => openEmployeeTransactionModal('penalty')"
            :is-danger="true"
            :disabled="!editingItem?.id"
          >
            {{ $t('penalty') }}
          </PrimaryButton>
          <PrimaryButton
            icon="fas fa-money-check-alt"
            :onclick="() => openEmployeeTransactionModal('advance')"
            :is-success="true"
            :disabled="!editingItem?.id"
          >
            {{ $t('advance') }}
          </PrimaryButton>
        </template>
        <PrimaryButton
          v-if="editingItem?.id"
          icon="fas fa-plus"
          :onclick="openCreatePaymentModal"
          :is-success="true"
        >
          {{ $t('createPayment') }}
        </PrimaryButton>
      </template>
      <template #gear="{ resetColumns, columns, toggleVisible, log }">
        <TableFilterButton
          v-if="columns && columns.length"
          :on-reset="resetColumns"
        >
          <ul>
            <draggable
              v-if="columns.length"
              class="dragArea list-group w-full"
              :list="columns"
              @change="log"
            >
              <li
                v-for="(element, index) in columns"
                v-show="element.name !== 'select'"
                :key="element.name"
                class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                @click="toggleVisible(index)"
              >
                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                  <div>
                    <i
                      class="text-sm mr-2 text-[#337AB7]"
                      :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                    />
                    {{ $te(element.label) ? $t(element.label) : element.label }}
                  </div>
                  <div><i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" /></div>
                </div>
              </li>
            </draggable>
          </ul>
        </TableFilterButton>
      </template>
    </ClientBalanceHistoryBase>

    <SideModalDialog
      :show-form="employeeTransactionModalOpen"
      :title="employeeTransactionModalOpen ? employeeTransactionHeaderText : ''"
      :onclose="closeEmployeeTransactionModal"
      :level="2"
    >
      <TransactionCreatePage
        v-if="employeeTransactionModalOpen && editingItem && editingItem.id && employeeTransactionModalType"
        :key="employeeTransactionModalType"
        :form-config="employeeTransactionFormConfig"
        :initial-client="editingItem"
        :client-balances="editingItem?.balances || []"
        :header-text="employeeTransactionHeaderText"
        @saved="onEmployeeTransactionSaved"
        @saved-error="onEntitySavedError"
      />
    </SideModalDialog>

    <SideModalDialog
      :show-form="entityModalOpen"
      :title="balanceHistoryEntityModalTitle"
      :onclose="closeEntityModal"
      :level="2"
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
          :header-text="transactionHeaderText"
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
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import SideModalDialog, { transactionSideModalTitle } from "@/views/components/app/dialog/SideModalDialog.vue";
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
import ClientController from "@/api/ClientController";
import TransactionController from "@/api/TransactionController";
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";
import TableFilterButton from "@/views/components/app/forms/TableFilterButton.vue";
import { VueDraggableNext } from "vue-draggable-next";

export default {
    components: {
        ClientBalanceHistoryBase,
        ClientBalanceStatusPlaque,
        TableFilterButton,
        PrimaryButton,
        SideModalDialog,
        TableSkeleton,
        TransactionCreatePage,
        draggable: VueDraggableNext,
    },
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['balance-updated'],
    data() {
        return {
            editingTransactionItem: null,
            selectedEntity: null,
            entityModalOpen: false,
            entityLoading: false,
            isPaymentCreateMode: false,
            employeeTransactionModalOpen: false,
            employeeTransactionModalType: null,
            selectedBalanceIdFromBase: null,
            ENTITY_CONFIG: {
                transaction: { fetch: id => TransactionController.getItem(id) },
            },
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: "id", label: this.$t("number"), size: 60 },
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
                    label: this.$t("source"),
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
                            onDeleted: () => this.refreshBalanceHistory()
                        };
                    }
                },
                { name: "note", label: this.$t("note"), size: 200 },
                { name: "categoryName", label: this.$t("category"), size: 150 },
                { name: "projectName", label: this.$t("project"), size: 150 },
                {
                    name: "debt",
                    label: this.$t("balanceHistoryDebtColumn"),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: item.isDebt, variant: 'text' })
                },
                { name: "creatorName", label: this.$t("user"), size: 120 },
                {
                    name: "clientImpact",
                    label: this.$t("impact"),
                    size: 130,
                    component: markRaw(ClientImpactCell),
                    props: (item) => ({
                        item: item,
                        currencySymbol: this.defaultCurrencySymbol,
                        formatNumberFn: this.$formatNumber
                    })
                },
            ];
        },
        isEmployeeClient() {
            const type = this.editingItem?.clientType;
            return type === 'employee';
        },
        totalBalance() {
            if (!this.editingItem?.balances?.length) return 0;
            const sid = this.selectedBalanceIdFromBase;
            const bal = this.editingItem.balances.find(b => b.id === sid) ||
                this.editingItem.balances.find(b => b.isDefault) ||
                this.editingItem.balances[0];
            return bal ? parseFloat(bal.balance || 0) : parseFloat(this.editingItem.balance || 0);
        },
        balanceSummaryCurrencySymbol() {
            if (!this.editingItem?.balances?.length) return this.defaultCurrencySymbol ;
            const sid = this.selectedBalanceIdFromBase;
            const bal = this.editingItem.balances.find(b => b.id === sid) ||
                this.editingItem.balances.find(b => b.isDefault) ||
                this.editingItem.balances[0];
            return bal?.currency?.symbol || this.editingItem.currencySymbol || this.defaultCurrencySymbol ;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.getters.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency?.symbol ;
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
            if (this.isPaymentCreateMode && !this.editingTransactionItem) {
                return TRANSACTION_FORM_PRESETS.clientPayment;
            }
            return {};
        },
        transactionHeaderText() {
            if (this.isPaymentCreateMode && !this.editingTransactionItem) {
                return this.$t('createPayment');
            }
            return '';
        },
        employeeTransactionFormConfig() {
            switch (this.employeeTransactionModalType) {
                case 'bonus': return TRANSACTION_FORM_PRESETS.employeeBonus;
                case 'penalty': return TRANSACTION_FORM_PRESETS.employeePenalty;
                case 'salaryAccrual': return TRANSACTION_FORM_PRESETS.employeeSalaryAccrual;
                case 'salaryPayment': return TRANSACTION_FORM_PRESETS.employeeSalaryPayment;
                case 'advance': return TRANSACTION_FORM_PRESETS.employeeAdvance;
                default: return {};
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
        balanceHistoryEntityModalTitle() {
            if (!this.entityModalOpen) {
                return '';
            }
            if (this.entityLoading) {
                return this.$t('loading');
            }
            return transactionSideModalTitle(this.$t.bind(this), {
                headerText: this.transactionHeaderText,
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
        openCreatePaymentModal() {
            this.isPaymentCreateMode = true;
            this.entityModalOpen = true;
            this.selectedEntity = { type: 'transaction' };
            this.editingTransactionItem = null;
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
                this.isPaymentCreateMode = false;
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
            this.isPaymentCreateMode = false;
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
        itemMapper(i, c) {
            switch (c) {
                case "id": return i.sourceId ;
                case "dateUser": return i.dateUser || (i.formatDate ? i.formatDate() : '');
                case "creatorName": return i.creator?.name ;
                case "note": return i.note ;
                case "categoryName": {
                    const categoryName = i.categoryName ;
                    return categoryName ? this.$t(`transactionCategory.${categoryName}`, categoryName) : '';
                }
                case "projectName": return i.projectName ?? '';
                case "clientImpact": return parseFloat(i.amount || 0);
                default: return i[c];
            }
        },
    },
};
</script>
