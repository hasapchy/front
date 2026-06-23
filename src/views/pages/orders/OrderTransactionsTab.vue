<template>
  <div>
    <div
      v-if="!orderId"
      class="p-4 text-gray-500"
    >
      {{ $t('saveOrderFirst') }}
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
        <DraggableTable
          table-key="order.transactions"
          :columns-config="columnsConfig"
          :table-data="transactions || []"
          :item-mapper="itemMapper"
          :on-item-click="editTransaction"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton
                  icon="fas fa-plus"
                  :onclick="showTransactionModal"
                  :is-small="true"
                  :aria-label="$t('addTransaction')"
                />
              </template>
              <template #gear="gearProps">
                <TableColumnsGearMenuWithDateModes
                  v-bind="gearProps"
                  table-columns-persist-key="order.transactions"
                />
              </template>
            </TableControlsBar>
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
      :title="orderTransactionSideTitle"
      :onclose="closeTransactionModal"
      :level="3"
    >
      <template v-if="transactionModal">
        <TransactionCreatePage
          :editing-item="editingTransaction"
          :initial-client="client"
          :initial-project-id="projectId"
          :order-id="orderId"
          :document-balance-id="documentBalanceId"
          :default-cash-id="cashId"
          :client-balances="clientBalances"
          :form-config="orderFormConfig"
          @saved="handleTransactionChanged"
          @saved-error="handleTransactionError"
          @deleted="handleTransactionChanged"
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
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableColumnsGearMenuWithDateModes from '@/views/components/app/forms/TableColumnsGearMenuWithDateModes.vue';
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

export default {
    components: {
        PrimaryButton,
        DraggableTable,
        TableControlsBar,
        TableColumnsGearMenuWithDateModes,
        SideModalDialog,
        TransactionCreatePage,
        TableSkeleton,
    },
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        orderId: { type: [String, Number], required: true },
        client: { type: Object, default: null },
        projectId: { type: [String, Number], default: null },
        cashId: { type: [String, Number], default: null },
        documentBalanceId: { type: [String, Number, null], default: null },
        clientBalances: { type: Array, default: () => [] },
    },
    emits: ['updated-paid'],
    data() {
        return {
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
            paidTotalAmount: 0,
        }
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
                    props: (item) => ({
                        isDebt: item.isDebt
                    })
                },
                {
                    name: 'amount',
                    label: this.$t('amount'),
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
                { name: 'cashName', label: this.$t('cashRegister'), html: true },
                {
                    name: 'dateUser',
                    label: this.$t('dateUser'),
                    type: 'datetime',
                    component: markRaw(DateUserCell),
                    props: (item, column) => buildDateUserCellProps(item, '', column?.dateDisplayMode),
                },
            ];
        },
        orderFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        },
        orderTransactionSideTitle() {
            if (!this.transactionModal) {
                return '';
            }
            return transactionSideModalTitle(this.$t.bind(this), { editingItem: this.editingTransaction });
        },
    },
    watch: {
        orderId: {
            handler(newVal) {
                if (!newVal) {
                    this.transactions = [];
                    this.transactionsLoading = false;
                    return;
                }
                this.transactionsLoading = true;
                this.fetchTransactions();
                this.fetchPaidTotal();
            },
            immediate: true
        }
    },
    methods: {
        async fetchTransactions() {
            if (!this.orderId) {
                this.transactions = [];
                return;
            }
            this.transactionsLoading = true;
            try {
                const response = await TransactionController.getItems(1, null, "all_time", this.orderId, null, null, null, null, 20);
                this.transactions = response.items.filter(item => item.isDebt != 1);
            } catch {
                this.transactions = [];
            } finally {
                this.transactionsLoading = false;
            }
        },
        async fetchPaidTotal() {
            if (!this.orderId) {
                this.paidTotalAmount = 0;
                this.$emit('updated-paid', 0);
                return;
            }
            try {
                const resp = await TransactionController.getTotalPaidByOrderId(this.orderId);
                this.paidTotalAmount = parseFloat(resp.total) || 0;
                this.$emit('updated-paid', this.paidTotalAmount);
            } catch {
                this.paidTotalAmount = 0;
                this.$emit('updated-paid', 0);
            }
        },
        showTransactionModal() {
            this.editingTransaction = null;
            this.transactionModal = true;
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        editTransaction(transaction) {
            this.editingTransaction = transaction;
            this.transactionModal = true;
        },
        async handleTransactionChanged() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        handleTransactionError(error) {
            let message;
            if (Array.isArray(error)) {
                message = error.join(', ');
            } else {
                const parsed = this.getApiErrorMessage(error);
                message = Array.isArray(parsed) ? parsed.join(', ') : parsed;
            }
            this.showNotification(this.$t('error'), message || this.$t('unknownError'), true);
        },
        itemMapper(i, c) {
            switch (c) {
                case 'id':
                    return i.id ?? '-';
                case 'cashName':
                    return buildCashRegisterRowInlineHtml(
                        i,
                        formatCashRegisterDisplay(i.cashDisplayName, i.cashCurrencyCode) || '-',
                    );
                case 'dateUser':
                    return `${i.formatDate?.() } / ${i.creator?.name }`;
                default:
                    return i[c];
            }
        },
    }
}
</script>
