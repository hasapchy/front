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
          icon="fas fa-plus"
          :onclick="openPayModal"
          :is-small="true"
          :disabled="!canPay"
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
        :default-cash-id="defaultCashId"
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
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';

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
        transactions: { type: Array, default: () => [] },
        client: { type: Object, default: null },
        clientBalances: { type: Array, default: () => [] },
        cashRegistersForSelect: { type: Array, default: () => [] },
        defaultCashId: { type: [Number, String, null], default: null },
    },
    emits: ['purchase-refreshed', 'error'],
    data() {
        return {
            transactionModal: false,
            editingTransaction: null,
        };
    },
    computed: {
        purchaseFormConfig() {
            return TRANSACTION_FORM_PRESETS.warehousePurchaseGoodsExpense;
        },
        columnsConfig() {
            return [
                { name: 'id', label: this.$t('number'), size: 60 },
                {
                    name: 'debt',
                    label: this.$t('transactionDebtColumn'),
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({ isDebt: Boolean(item?.is_debt ?? item?.isDebt) }),
                },
                { name: 'categoryName', label: this.$t('category'), size: 160 },
                { name: 'amount', label: this.$t('amount') },
                { name: 'cash', label: this.$t('cashRegister') },
                { name: 'dateUser', label: this.$t('dateUser') },
            ];
        },
        transactionModalTitle() {
            if (!this.transactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransaction });
        },
    },
    methods: {
        openPayModal() {
            this.editingTransaction = null;
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
                    return translateTransactionCategory(item?.category_name ?? item?.categoryName ?? '', this.$t.bind(this));
                case 'amount':
                    return item?.orig_amount ?? item?.origAmount ?? '-';
                case 'cash': {
                    const raw = item?.cash_name || item?.cashName || item?.cash_register?.name;
                    if (raw) {
                        return raw;
                    }
                    const cashId = Number(item?.cash_id ?? item?.cashId ?? 0);
                    if (!cashId) {
                        return '-';
                    }
                    const cash = this.cashRegistersForSelect.find((c) => Number(c.id) === cashId);
                    return cash?.displayName || cash?.name || '-';
                }
                case 'dateUser': {
                    const date = item?.date ? formatDatabaseDateTime(item.date) : '-';
                    return `${date} / ${item?.creator?.name || '-'}`;
                }
                default:
                    return item?.[column] ?? '-';
            }
        },
    },
};
</script>
