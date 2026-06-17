<template>
  <div>
    <DraggableTable
      table-key="warehouse.purchase.transactions"
      :columns-config="columnsConfig"
      :table-data="transactions || []"
      :item-mapper="itemMapper"
      :on-item-click="editTransaction"
    >
      <template #tableSettingsAdditional>
        <PrimaryButton
          icon="fas fa-boxes"
          :is-danger="true"
          :onclick="openPayModal"
          :is-small="true"
          :disabled="!canPayGoods"
          :aria-label="$t('payForGoods')"
        />
      </template>
    </DraggableTable>

    <SideModalDialog
      :show-form="transactionModal"
      :title="transactionModalTitle"
      :onclose="closeTransactionModal"
      :level="3"
    >
      <TransactionCreatePage
        v-if="transactionModal"
        :editing-item="editingTransaction"
        :initial-client="client"
        :warehouse-purchase-id="purchaseId"
        :document-balance-id="documentBalanceId"
        :default-cash-id="defaultCashId"
        :prefill-amount="goodsPrefillAmount"
        :prefill-currency-id="goodsPrefillCurrencyId"
        :warehouse-purchase-goods-payment-max-default="warehousePurchaseGoodsPaymentMaxForForm"
        :client-balances="clientBalances"
        :form-config="purchaseFormConfig"
        @saved="handleTransactionSaved"
        @saved-error="$emit('error', $event)"
        @deleted="handleTransactionSaved"
        @deleted-error="$emit('error', $event)"
        @close-request="closeTransactionModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import WarehousePurchaseController from '@/api/WarehousePurchaseController';
import TransactionController from '@/api/TransactionController';
import TransactionDto from '@/dto/transaction/TransactionDto';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog, { transactionSideModalTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import { formatDatabaseDateTime } from '@/utils/dateUtils';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import { markRaw } from 'vue';
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';
import { formatCashRegisterDisplay, buildCashRegisterRowInlineHtml } from '@/utils/cashRegisterUtils';
import { resolveDocumentPrefillInCashCurrency } from '@/utils/documentToDefaultCurrency';
import { formatWarehouseExpenseBucketTotals } from '@/utils/warehouseDocumentExpenseTotals';

const PURCHASE_GOODS_CATEGORY_ID = 6;

export default {
    components: {
        DraggableTable,
        PrimaryButton,
        SideModalDialog,
        TransactionCreatePage,
    },
    props: {
        purchaseId: { type: [Number, String], default: null },
        canPay: { type: Boolean, default: false },
        goodsPaymentRemainingDefault: { type: Number, default: null },
        transactions: { type: Array, default: () => [] },
        client: { type: Object, default: null },
        documentBalanceId: { type: [String, Number, null], default: null },
        clientBalances: { type: Array, default: () => [] },
        cashRegistersForSelect: { type: Array, default: () => [] },
        defaultCashId: { type: [Number, String, null], default: null },
    },
    emits: ['purchase-refreshed', 'error', 'totals-changed'],
    watch: {
        transactions: {
            handler() {
                this.$emit('totals-changed', this.transactionGoodsExpenseDisplay);
            },
            immediate: true,
            deep: true,
        },
    },
    data() {
        return {
            transactionModal: false,
            editingTransaction: null,
            goodsPrefillAmount: null,
            goodsPrefillCurrencyId: null,
            goodsPrefillCap: null,
        };
    },
    computed: {
        purchaseFormConfig() {
            return TRANSACTION_FORM_PRESETS.warehousePurchaseGoodsExpense;
        },
        warehousePurchaseGoodsPaymentMaxForForm() {
            if (this.goodsPrefillCap != null) {
                return this.goodsPrefillCap;
            }
            return this.warehousePurchaseGoodsPaymentMaxDefault;
        },
        warehousePurchaseGoodsPaymentMaxDefault() {
            const rem = this.goodsPaymentRemainingDefault;
            if (rem == null) {
                return null;
            }
            if (!this.editingTransaction) {
                return rem;
            }
            const tr = this.editingTransaction;
            if (!tr || Number(tr.categoryId) !== PURCHASE_GOODS_CATEGORY_ID || tr.isDebt) {
                return rem;
            }
            if (!String(tr.sourceType || '').includes('WhPurchase')) {
                return rem;
            }
            const balanceRow = this.client?.balances?.find(
                (b) => Number(b.id) === Number(this.documentBalanceId),
            );
            const expectedCurId = balanceRow?.currencyId ?? balanceRow?.currency?.id ?? null;
            if (expectedCurId == null || Number(tr.origCurrencyId) !== Number(expectedCurId)) {
                return null;
            }
            return rem + Number(tr.origAmount || 0);
        },
        canPayGoods() {
            if (!this.canPay) {
                return false;
            }
            const remaining = this.goodsPaymentRemainingDefault;
            if (remaining != null && remaining <= 0) {
                return false;
            }
            return true;
        },
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                {
                    name: 'debt',
                    label: this.$t('transactionDebtColumn'),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: Boolean(item?.isDebt) }),
                },
                { name: 'categoryName', label: this.$t('category'), size: 160 },
                { name: 'amount', label: this.$t('amount') },
                { name: 'cash', label: this.$t('cashRegister'), html: true },
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, '', column?.dateDisplayMode),
                },
            ];
        },
        transactionModalTitle() {
            if (!this.transactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransaction });
        },
        transactionGoodsExpenseDisplay() {
            const list = Array.isArray(this.transactions) ? this.transactions : [];
            return formatWarehouseExpenseBucketTotals(list, PURCHASE_GOODS_CATEGORY_ID);
        },
    },
    methods: {
        async openPayModal() {
            this.editingTransaction = null;
            const pref = await resolveDocumentPrefillInCashCurrency({
                store: this.$store,
                cashId: this.defaultCashId,
                remainingDefault: this.goodsPaymentRemainingDefault,
            });
            this.goodsPrefillAmount = pref.amount;
            this.goodsPrefillCurrencyId = pref.currencyId;
            this.goodsPrefillCap = pref.amount;
            this.transactionModal = true;
        },
        async editTransaction(item) {
            if (!item) {
                return;
            }
            try {
                const transactionId = Number(item?.id ?? 0);
                if (!transactionId) {
                    return;
                }
                const fullTransaction = await TransactionController.getItem(transactionId);
                this.editingTransaction = TransactionDto.fromApi(fullTransaction);
                this.transactionModal = true;
            } catch (error) {
                this.$emit('error', error);
            }
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        async handleTransactionSaved() {
            this.closeTransactionModal();
            if (!this.purchaseId) {
                return;
            }
            const fresh = await WarehousePurchaseController.getItem(this.purchaseId);
            this.$emit('purchase-refreshed', fresh);
        },
        itemMapper(item, column) {
            switch (column) {
                case 'categoryName':
                    return translateTransactionCategory(
                        item?.categoryName ?? item?.category_name ?? '',
                        this.$t.bind(this),
                    );
                case 'amount':
                    return item?.origAmount ?? '-';
                case 'cash': {
                    const displayName = item?.cashDisplayName || item?.cashName || '';
                    const code = item?.cashCurrencyCode ?? '';
                    let label = '';
                    if (displayName) {
                        label = formatCashRegisterDisplay(displayName, code);
                    } else {
                        const cashId = Number(item?.cashId ?? 0);
                        if (!cashId) {
                            return '-';
                        }
                        const cash = this.cashRegistersForSelect.find((c) => Number(c.id) === cashId);
                        label = formatCashRegisterDisplay(
                            cash?.displayName || cash?.name || '-',
                            cash?.currencyCode ?? '',
                        );
                    }
                    return buildCashRegisterRowInlineHtml(item, label);
                }
                case 'dateUser': {
                    const datePart = typeof item?.formatDate === 'function'
                        ? item.formatDate()
                        : (item?.date ? formatDatabaseDateTime(item.date) : '-');
                    const creatorName = item?.creator?.name?.trim?.()
                        || [item?.creator?.name, item?.creator?.surname].filter(Boolean).join(' ').trim()
                        || '-';
                    return `${datePart} / ${creatorName}`;
                }
                default:
                    return item?.[column] ?? '-';
            }
        },
    },
};
</script>
