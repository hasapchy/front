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
          v-if="transactions.length"
          class="mb-3 flex flex-wrap gap-x-5 gap-y-2 border-b border-gray-200 pb-3 text-sm dark:border-[var(--border-subtle)]"
        >
          <div class="tabular-nums">
            <span class="font-medium text-gray-600 dark:text-gray-400">{{ $t('warehouseReceiptTxnTotalGoods') }}:</span>
            {{ transactionTotalsDisplay.goods }}
          </div>
          <div class="tabular-nums">
            <span class="font-medium text-gray-600 dark:text-gray-400">{{ $t('warehouseReceiptTxnTotalLogistics') }}:</span>
            {{ transactionTotalsDisplay.logistics }}
          </div>
          <div class="tabular-nums">
            <span class="font-medium text-gray-600 dark:text-gray-400">{{ $t('warehouseReceiptTxnTotalOther') }}:</span>
            {{ transactionTotalsDisplay.other }}
          </div>
        </div>
        <DraggableTable
          table-key="warehouse.receipt.transactions"
          :columns-config="columnsConfig"
          :table-data="transactions || []"
          :item-mapper="itemMapper"
          :on-item-click="receiptCompleted ? null : editTransaction"
        >
          <template #tableSettingsAdditional>
            <div
              v-if="!receiptCompleted"
              class="flex items-center gap-1"
            >
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
              <PrimaryButton
                icon="fas fa-minus"
                :is-small="true"
                :is-danger="true"
                :onclick="openGeneralExpenseModal"
                :aria-label="$t('addWarehouseReceiptGeneralExpense')"
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
          :client-balances="receiptExpenseKind === 'goods' ? clientBalances : []"
          :prefill-amount="goodsTransactionPrefillAmount"
          :warehouse-receipt-goods-payment-max-default="warehouseReceiptGoodsPaymentMaxDefault"
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
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { formatCurrencyWithRounding } from '@/utils/numberUtils';

const RECEIPT_GOODS_CATEGORY_ID = 6;
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
        clientBalanceId: { type: [String, Number], default: null },
        clientBalances: { type: Array, default: () => [] },
        goodsPaymentRemainingDefault: { type: Number, default: null },
        receiptCompleted: { type: Boolean, default: false },
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
                { name: 'cashName', label: this.$t('cashRegister') },
                { name: 'dateUser', label: this.$t('dateUser') },
            ];
        },
        receiptFormConfig() {
            if (this.receiptExpenseKind === 'delivery') {
                return TRANSACTION_FORM_PRESETS.warehouseReceiptDeliveryExpense;
            }
            if (this.receiptExpenseKind === 'general') {
                return TRANSACTION_FORM_PRESETS.warehouseReceiptGeneralExpense;
            }
            return TRANSACTION_FORM_PRESETS.warehouseReceiptGoodsExpense;
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
            if (!tr || Number(tr.categoryId) !== RECEIPT_GOODS_CATEGORY_ID || tr.isDebt) {
                return rem;
            }
            if (!String(tr.sourceType || '').includes('WhReceipt')) {
                return rem;
            }
            const balanceRow = this.client?.balances?.find(
                (b) => Number(b.id) === Number(this.clientBalanceId)
            );
            const expectedCurId = balanceRow?.currency?.id ?? balanceRow?.currency_id ?? null;
            if (expectedCurId == null || Number(tr.origCurrencyId) !== Number(expectedCurId)) {
                return null;
            }
            return rem + Number(tr.origAmount || 0);
        },
        transactionTotalsDisplay() {
            return {
                goods: this.formatExpenseBucketTotals(RECEIPT_GOODS_CATEGORY_ID),
                logistics: this.formatExpenseBucketTotals(RECEIPT_DELIVERY_CATEGORY_ID),
                other: this.formatExpenseBucketTotals(null),
            };
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
        formatExpenseBucketTotals(fixedCategoryId) {
            const list = Array.isArray(this.transactions) ? this.transactions : [];
            const byCurrency = {};
            for (const t of list) {
                if (t?.isDeleted || Number(t.type) !== 0) {
                    continue;
                }
                const cid = t.categoryId != null ? Number(t.categoryId) : null;
                if (fixedCategoryId != null) {
                    if (cid !== fixedCategoryId) {
                        continue;
                    }
                } else if (cid === RECEIPT_GOODS_CATEGORY_ID || cid === RECEIPT_DELIVERY_CATEGORY_ID) {
                    continue;
                }
                const amt = Math.abs(Number(t.origAmount) || 0);
                if (amt <= 0) {
                    continue;
                }
                const key = String(t.origCurrencyId ?? '');
                const sym = t.origCurrencySymbol || '';
                if (!byCurrency[key]) {
                    byCurrency[key] = { total: 0, symbol: sym };
                }
                byCurrency[key].total += amt;
                if (!byCurrency[key].symbol && sym) {
                    byCurrency[key].symbol = sym;
                }
            }
            const parts = Object.keys(byCurrency)
                .map((k) => byCurrency[k])
                .filter((v) => v.total > 0)
                .map((v) => formatCurrencyWithRounding(v.total, v.symbol, true));
            return parts.length ? parts.join(' · ') : '—';
        },
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
            if (col === 'categoryName') {
                return translateTransactionCategory(item.categoryName, this.$t.bind(this));
            }
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
        openGeneralExpenseModal() {
            this.receiptExpenseKind = 'general';
            this.editingTransaction = null;
            this.transactionModal = true;
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        editTransaction(transaction) {
            const cid = transaction.categoryId != null ? Number(transaction.categoryId) : null;
            if (cid === RECEIPT_DELIVERY_CATEGORY_ID) {
                this.receiptExpenseKind = 'delivery';
            } else if (cid === RECEIPT_GOODS_CATEGORY_ID) {
                this.receiptExpenseKind = 'goods';
            } else {
                this.receiptExpenseKind = 'general';
            }
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
