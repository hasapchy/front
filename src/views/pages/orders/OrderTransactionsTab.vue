<template>
    <div>
        <div v-if="!orderId" class="p-4 text-gray-500">
            {{ $t('saveOrderFirst') }}
        </div>
        <transition v-else name="fade" mode="out-in">
            <div v-if="!transactionsLoading" key="table">
                <DraggableTable
                    table-key="order.transactions"
                    :columns-config="columnsConfig"
                    :table-data="transactions || []"
                    :item-mapper="itemMapper"
                    @selectionChange="selectedIds = $event"
                    :onItemClick="editTransaction">
                    <template #tableSettingsAdditional>
                        <PrimaryButton icon="fas fa-plus" :onclick="showTransactionModal" :is-small="true" />
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="flex justify-center items-center h-64">
                <SpinnerIcon />
            </div>
        </transition>

        <SideModalDialog :showForm="transactionModal" :onclose="closeTransactionModal">
            <template v-if="transactionModal">
                <TransactionCreatePage :editingItem="editingTransaction" :initial-client="client"
                    :initial-project-id="projectId" :order-id="orderId" :default-cash-id="cashId"
                    :form-config="orderFormConfig"
                    @saved="handleTransactionSaved"
                    @saved-error="handleTransactionError"
                    @deleted="handleTransactionDeleted"
                    @deleted-error="handleTransactionError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import TransactionController from '@/api/TransactionController';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import { markRaw } from 'vue';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        orderId: { type: [String, Number], required: true },
        client: { type: Object, default: null },
        projectId: { type: [String, Number], default: null },
        cashId: { type: [String, Number], default: null },
        currencySymbol: { type: String, default: '' },
        orderTotal: { type: Number, default: 0 },
        paidTotal: { type: Number, default: 0 }
    },
    emits: ['updated-paid'],
    components: {
        PrimaryButton,
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        DebtCell,
        TransactionAmountCell,
        SpinnerIcon,
    },
    data() {
        return {
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
            paidTotalAmount: 0,
            columnsConfig: [
                { name: 'id', label: '№', size: 60 },
                {
                    name: 'debt',
                    label: 'Долговая',
                    size: 80,
                    component: markRaw(DebtCell),
                    props: (item) => ({
                        isDebt: item.isDebt
                    })
                },
                {
                    name: 'amount',
                    label: 'Сумма',
                    component: markRaw(TransactionAmountCell),
                    props: (item) => ({
                        transaction: item
                    })
                },
                { name: 'cashName', label: 'Касса' },
                { name: 'dateUser', label: this.$t('dateUser') },
            ]
        }
    },
    computed: {
        orderFormConfig() {
            return TRANSACTION_FORM_PRESETS.orderPayment;
        }
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
            } catch (error) {
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
            } catch (e) {
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
        async handleTransactionSaved() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        async handleTransactionDeleted() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        handleTransactionError(error) {
            let message;
            if (typeof error === 'string') {
                message = error;
            } else if (Array.isArray(error)) {
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
                    return i.cashName ? `${i.cashName} (${i.cashCurrencySymbol})` : '-';
                case 'dateUser':
                    return `${i.formatDate?.() || '-'} / ${i.userName || '-'}`;
                default:
                    return i[c];
            }
        },
    }
}
</script>
