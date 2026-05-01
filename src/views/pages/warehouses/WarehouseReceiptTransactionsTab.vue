<template>
  <div>
    <div
      v-if="!receiptId"
      class="p-4 text-gray-500"
    >
      {{ $t('saveReceiptFirstForTransactions') }}
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
          v-if="client"
          class="mb-3 text-sm text-gray-700"
        >
          <span class="text-gray-500">{{ $t('supplier') }}:</span>
          {{ supplierDisplayName }}
        </div>
        <DraggableTable
          table-key="warehouse.receipt.transactions"
          :columns-config="columnsConfig"
          :table-data="transactions || []"
          :item-mapper="itemMapper"
          :on-item-click="editTransaction"
        >
          <template #tableSettingsAdditional>
            <div class="flex items-center gap-1">
              <PrimaryButton
                icon="fas fa-boxes-stacked"
                :is-small="true"
                :is-danger="true"
                :onclick="openGoodsExpenseModal"
                :aria-label="$t('addWarehouseReceiptGoodsExpense')"
              />
              <PrimaryButton
                icon="fas fa-truck"
                :is-small="true"
                :is-danger="true"
                :onclick="openDeliveryExpenseModal"
                :aria-label="$t('addWarehouseReceiptDeliveryExpense')"
              />
            </div>
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
      :title="receiptTransactionSideTitle"
      :onclose="closeTransactionModal"
      :level="3"
    >
      <template v-if="transactionModal">
        <TransactionCreatePage
          :key="transactionFormInstanceKey"
          :editing-item="editingTransaction"
          :initial-client="receiptExpenseKind === 'goods' ? client : null"
          :initial-project-id="projectId"
          :warehouse-receipt-id="receiptId"
          :default-cash-id="cashId"
          :prefill-amount="goodsTransactionPrefillAmount"
          :warehouse-receipt-goods-payment-max-default="warehouseReceiptGoodsPaymentMaxDefault"
          :is-payment-modal="true"
          :form-config="receiptFormConfig"
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
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { markRaw } from 'vue';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';

const RECEIPT_DELIVERY_CATEGORY_ID = 16;

export default {
    components: {
        PrimaryButton,
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        TableSkeleton,
    },
    mixins: [notificationMixin, getApiErrorMessage],
    emits: ['finance-changed'],
    props: {
        receiptId: { type: [String, Number], default: null },
        client: { type: Object, default: null },
        projectId: { type: [String, Number], default: null },
        cashId: { type: [String, Number], default: null },
        goodsPaymentRemainingDefault: { type: Number, default: null },
    },
    data() {
        return {
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
            receiptExpenseKind: 'goods',
        };
    },
    computed: {
        supplierDisplayName() {
            const c = this.client;
            if (!c) {
                return '';
            }
            if (typeof c.displayName === 'function') {
                return c.displayName();
            }
            return c.displayName || c.name || '';
        },
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
                    name: 'amount',
                    label: this.$t('amount'),
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({ transaction: item }),
                },
                { name: 'cashName', label: this.$t('cashRegister') },
                { name: 'dateUser', label: this.$t('dateUser') },
            ];
        },
        receiptFormConfig() {
            return this.receiptExpenseKind === 'delivery'
                ? TRANSACTION_FORM_PRESETS.warehouseReceiptDeliveryExpense
                : TRANSACTION_FORM_PRESETS.warehouseReceiptGoodsExpense;
        },
        transactionFormInstanceKey() {
            const editId = this.editingTransaction?.id ?? 'new';
            return `wh-receipt-txn-${this.receiptId}-${this.receiptExpenseKind}-${editId}`;
        },
        receiptTransactionSideTitle() {
            if (!this.transactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransaction });
        },
        goodsTransactionPrefillAmount() {
            if (this.receiptExpenseKind !== 'goods' || this.editingTransaction) {
                return null;
            }
            const r = this.goodsPaymentRemainingDefault;
            if (r == null || r <= 0) {
                return null;
            }
            return r;
        },
        warehouseReceiptGoodsPaymentMaxDefault() {
            if (this.receiptExpenseKind !== 'goods') {
                return null;
            }
            const rem = this.goodsPaymentRemainingDefault;
            if (rem == null) {
                return null;
            }
            if (!this.editingTransaction) {
                return rem;
            }
            const tr = this.editingTransaction;
            if (!tr || Number(tr.categoryId) !== 6 || tr.isDebt) {
                return rem;
            }
            if (!String(tr.sourceType || '').includes('WhReceipt')) {
                return rem;
            }
            const defCur = this.$store?.state?.currencies?.find((c) => c.isDefault);
            if (!defCur || Number(tr.origCurrencyId) !== Number(defCur.id)) {
                return null;
            }
            return rem + Number(tr.origAmount || 0);
        },
    },
    watch: {
        receiptId: {
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
        async fetchTransactions() {
            if (!this.receiptId) {
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
                    this.receiptId,
                );
                this.transactions = response.items || [];
            } catch {
                this.transactions = [];
            } finally {
                this.transactionsLoading = false;
            }
        },
        itemMapper(item, col) {
            if (col === 'cashName') {
                return formatCashRegisterDisplay(item.cashName, item.currencySymbol);
            }
            if (col === 'dateUser') {
                return item.formatDate ? item.formatDate() : item.date;
            }
            return item[col];
        },
        openGoodsExpenseModal() {
            this.receiptExpenseKind = 'goods';
            this.editingTransaction = null;
            this.transactionModal = true;
        },
        openDeliveryExpenseModal() {
            this.receiptExpenseKind = 'delivery';
            this.editingTransaction = null;
            this.transactionModal = true;
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        editTransaction(transaction) {
            const cid = transaction.categoryId != null ? Number(transaction.categoryId) : null;
            this.receiptExpenseKind = cid === RECEIPT_DELIVERY_CATEGORY_ID ? 'delivery' : 'goods';
            this.editingTransaction = transaction;
            this.transactionModal = true;
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
