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
          v-if="isFromPurchase"
          class="mb-3 flex gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-[var(--border-subtle)] dark:bg-[var(--surface-muted)] dark:text-[var(--text-secondary)]"
          role="note"
        >
          <i
            class="fas fa-circle-info mt-0.5 shrink-0 text-slate-500 dark:text-[var(--text-secondary)]"
            aria-hidden="true"
          />
          <span>{{ $t('receiptGoodsPaymentViaPurchase') }}</span>
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
                v-if="!isFromPurchase"
                icon="fas fa-boxes"
                :is-small="true"
                :is-danger="true"
                :onclick="openGoodsPaymentModal"
                :disabled="!canPayGoods"
                :aria-label="$t('payForGoods')"
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
          :warehouse-receipt-id="receiptId"
          :document-balance-id="receiptExpenseKind === 'goods' ? documentBalanceId : null"
          :default-cash-id="cashId"
          :client-balances="receiptExpenseKind === 'goods' ? clientBalances : []"
          :prefill-amount="goodsPrefillAmount"
          :prefill-currency-id="goodsPrefillCurrencyId"
          :warehouse-receipt-goods-payment-max-default="warehouseReceiptGoodsPaymentMaxForForm"
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
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { formatCashRegisterDisplay, buildCashRegisterRowInlineHtml } from '@/utils/cashRegisterUtils';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import { logWhReceiptGoodsPayment } from '@/utils/warehouseReceiptGoodsPaymentDebug';
import {
    defaultAmountToDocument,
    fetchDocumentToDefaultFactor,
} from '@/utils/documentToDefaultCurrency';

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
    emits: ['finance-changed', 'totals-changed'],
    props: {
        receiptId: { type: [String, Number], default: null },
        client: { type: Object, default: null },
        cashId: { type: [String, Number], default: null },
        documentBalanceId: { type: [String, Number, null], default: null },
        clientBalances: { type: Array, default: () => [] },
        goodsPaymentRemainingDefault: { type: Number, default: null },
        isFromPurchase: { type: Boolean, default: false },
        receiptCompleted: { type: Boolean, default: false },
    },
    data() {
        return {
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
            receiptExpenseKind: 'goods',
            goodsPrefillAmount: null,
            goodsPrefillCurrencyId: null,
            goodsPrefillCap: null,
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
        warehouseReceiptGoodsPaymentMaxForForm() {
            if (this.receiptExpenseKind === 'goods' && this.goodsPrefillCap != null) {
                return this.goodsPrefillCap;
            }
            return this.warehouseReceiptGoodsPaymentMaxDefault;
        },
        canPayGoods() {
            if (this.isFromPurchase) {
                return false;
            }
            if (this.receiptCompleted) {
                return false;
            }
            const getters = this.$store.getters;
            const canUpdate = getters.hasPermission('warehouse_receipts_update')
                || getters.hasPermission('warehouse_receipts_update_all')
                || getters.hasPermission('warehouse_receipts_update_own');
            if (!canUpdate) {
                return false;
            }
            const remaining = this.goodsPaymentRemainingDefault;
            if (remaining != null && remaining <= 0) {
                return false;
            }
            return true;
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
                (b) => Number(b.id) === Number(this.documentBalanceId)
            );
            const expectedCurId = balanceRow?.currencyId ?? balanceRow?.currency?.id ?? null;
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
                if (t?.isDeleted || Number(t.type) !== 0 || Number(t.isDebt) === 1) {
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
                const sym = t.origCurrencyCode || '';
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
                .map((v) => formatCurrencyForDisplay(v.total, v.symbol, true));
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
                this.$emit('totals-changed', this.transactionTotalsDisplay);
            } catch {
                this.transactions = [];
                this.$emit('totals-changed', this.transactionTotalsDisplay);
            } finally {
                this.transactionsLoading = false;
            }
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
            if (col === 'dateUser') {
                return item.formatDate ? item.formatDate() : item.date;
            }
            return item[col];
        },
        async resolveGoodsPaymentPrefillInCashCurrency(remainingDefault, extraDefault = 0) {
            const totalDefault = (Number(remainingDefault) || 0) + (Number(extraDefault) || 0);
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
        async openGoodsPaymentModal() {
            this.receiptExpenseKind = 'goods';
            this.editingTransaction = null;
            const pref = await this.resolveGoodsPaymentPrefillInCashCurrency(this.goodsPaymentRemainingDefault);
            this.goodsPrefillAmount = pref.amount;
            this.goodsPrefillCurrencyId = pref.currencyId;
            this.goodsPrefillCap = pref.amount;
            logWhReceiptGoodsPayment('tab-open-goods-modal', {
                receiptId: this.receiptId,
                documentBalanceId: this.documentBalanceId,
                clientId: this.client?.id ?? null,
                clientBalancesPropCount: this.clientBalances?.length ?? 0,
                clientBalancesPropIds: (this.clientBalances || []).map((b) => b.id),
                goodsPaymentRemainingDefault: this.goodsPaymentRemainingDefault,
                goodsPrefillAmount: this.goodsPrefillAmount,
                goodsPrefillCurrencyId: this.goodsPrefillCurrencyId,
                cashId: this.cashId,
            });
            this.transactionModal = true;
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
