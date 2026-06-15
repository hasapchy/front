<template>
  <div>
    <div
      v-if="!writeoffId"
      class="p-4 text-gray-500"
    >
      {{ $t('saveWriteoffFirstForTransactions') }}
    </div>
    <transition
      v-else
      name="fade"
      mode="out-in"
    >
      <div
        v-if="!transactionsLoading"
        key="table"
      >
        <div
          v-if="paidPortion > 0"
          class="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
          role="note"
        >
          {{ $t('writeoffReturnPaidPortionHint', { amount: formatAmount(paidPortion) }) }}
        </div>
        <DraggableTable
          table-key="warehouse.writeoff.transactions"
          :columns-config="columnsConfig"
          :table-data="transactions || []"
          :item-mapper="itemMapper"
          :on-item-click="editTransaction"
        >
          <template #tableSettingsAdditional>
            <PrimaryButton
              icon="fas fa-plus"
              :is-small="true"
              :onclick="openCashReturnModal"
              :disabled="!canAddCashReturn"
              :aria-label="$t('addSupplierCashReturn')"
            />
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>

    <SideModalDialog
      :show-form="transactionModal"
      :title="transactionSideTitle"
      :onclose="closeTransactionModal"
      :level="3"
    >
      <template v-if="transactionModal">
        <TransactionCreatePage
          :key="transactionFormInstanceKey"
          :editing-item="editingTransaction"
          :initial-client="client"
          :warehouse-writeoff-id="writeoffId"
          :default-cash-id="cashId"
          :document-balance-id="documentBalanceId"
          :client-balances="clientBalances"
          :prefill-amount="cashPrefillAmount"
          :prefill-currency-id="cashPrefillCurrencyId"
          :form-config="TRANSACTION_FORM_PRESETS.warehouseWriteoffSupplierCashReturn"
          @saved="handleTransactionSaved"
          @saved-error="handleTransactionError"
          @deleted="handleTransactionSaved"
          @deleted-error="handleTransactionError"
          @close-request="closeTransactionModal"
        />
      </template>
    </SideModalDialog>
  </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SideModalDialog, { transactionSideModalTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import TransactionController from '@/api/TransactionController';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { markRaw } from 'vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { formatCashRegisterDisplay, buildCashRegisterRowInlineHtml } from '@/utils/cashRegisterUtils';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import {
    defaultAmountToDocument,
    fetchDocumentToDefaultFactor,
} from '@/utils/documentToDefaultCurrency';

export default {
    components: {
        PrimaryButton,
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        TableSkeleton,
    },
    mixins: [getApiErrorMessage],
    emits: ['finance-changed'],
    props: {
        writeoffId: { type: [String, Number], default: null },
        client: { type: Object, default: null },
        cashId: { type: [String, Number], default: null },
        documentBalanceId: { type: [String, Number, null], default: null },
        clientBalances: { type: Array, default: () => [] },
        paidPortion: { type: Number, default: 0 },
        cashReturnRemainingDefault: { type: Number, default: null },
        currencySymbol: { type: String, default: '' },
    },
    data() {
        return {
            TRANSACTION_FORM_PRESETS,
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
            cashPrefillAmount: null,
            cashPrefillCurrencyId: null,
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                {
                    name: 'debt',
                    label: this.$t('transactionDebtColumn'),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: item.isDebt }),
                },
                {
                    name: 'categoryName',
                    label: this.$t('category'),
                    size: 160,
                },
                {
                    name: 'amount',
                    label: this.$t('amount'),
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({ transaction: item }),
                },
                { name: 'cashName', label: this.$t('cashRegister'), html: true },
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    component: markRaw(DateUserCell),
                    props: (item) => buildDateUserCellProps(item, ''),
                },
            ];
        },
        transactionFormInstanceKey() {
            const editId = this.editingTransaction?.id ?? 'new';
            return `wh-writeoff-txn-${this.writeoffId}-${editId}`;
        },
        transactionSideTitle() {
            if (!this.transactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransaction });
        },
        canAddCashReturn() {
            const remaining = Number(this.cashReturnRemainingDefault);
            return remaining > 0
                && this.$store.getters.hasPermission('transactions_create');
        },
    },
    watch: {
        writeoffId: {
            handler(newVal) {
                if (!newVal) {
                    this.transactions = [];
                    this.transactionsLoading = false;
                    return;
                }
                this.fetchTransactions();
            },
            immediate: true,
        },
    },
    methods: {
        formatAmount(value) {
            const formatted = formatCurrencyForDisplay(value);
            return this.currencySymbol ? `${formatted} ${this.currencySymbol}` : formatted;
        },
        itemMapper(item, col) {
            if (col === 'categoryName') {
                return translateTransactionCategory(item.categoryName, this.$t.bind(this));
            }
            if (col === 'cashName') {
                const displayName = item.cashDisplayName || item.cashName || '';
                const cashCurrencyCode = item.cashCurrencyCode ?? '';
                return buildCashRegisterRowInlineHtml(
                    item,
                    formatCashRegisterDisplay(displayName, cashCurrencyCode),
                );
            }
            return item[col];
        },
        async fetchTransactions() {
            if (!this.writeoffId) {
                this.transactions = [];
                return;
            }
            this.transactionsLoading = true;
            try {
                const response = await TransactionController.getItems(
                    1,
                    null,
                    'all_time',
                    null,
                    null,
                    null,
                    null,
                    null,
                    50,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    this.writeoffId,
                );
                this.transactions = response.items || [];
            } catch (error) {
                this.transactions = [];
                this.handleTransactionError(this.apiErrorLinesAsString(error));
            } finally {
                this.transactionsLoading = false;
            }
        },
        async resolveCashReturnPrefillInCashCurrency(remainingDefault) {
            const totalDefault = Number(remainingDefault) || 0;
            if (totalDefault <= 0) {
                return { amount: null, currencyId: null };
            }
            const cashReg = (this.$store.getters.cashRegisters || []).find(
                (c) => Number(c.id) === Number(this.cashId),
            );
            const cashCurrencyId = cashReg?.currencyId ?? null;
            if (cashCurrencyId == null) {
                return { amount: totalDefault, currencyId: null };
            }
            const currencies = this.$store.getters.currencies || [];
            const def = currencies.find((c) => c.isDefault);
            if (def && Number(def.id) === Number(cashCurrencyId)) {
                return { amount: totalDefault, currencyId: cashCurrencyId };
            }
            const factor = await fetchDocumentToDefaultFactor(cashCurrencyId, currencies);
            return {
                amount: defaultAmountToDocument(totalDefault, factor),
                currencyId: cashCurrencyId,
            };
        },
        async openCashReturnModal() {
            this.editingTransaction = null;
            const pref = await this.resolveCashReturnPrefillInCashCurrency(
                Number(this.cashReturnRemainingDefault) || 0,
            );
            this.cashPrefillAmount = pref.amount;
            this.cashPrefillCurrencyId = pref.currencyId;
            this.transactionModal = true;
        },
        editTransaction(item) {
            if (item.isDebt) {
                return;
            }
            this.editingTransaction = item;
            this.transactionModal = true;
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        async handleTransactionSaved() {
            this.transactionModal = false;
            await this.fetchTransactions();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
            this.$emit('finance-changed');
        },
        handleTransactionError(msg) {
            this.$store.dispatch('showNotification', {
                title: this.$t('error'),
                subtitle: msg || this.$t('error'),
                isDanger: true,
            });
        },
    },
};
</script>
