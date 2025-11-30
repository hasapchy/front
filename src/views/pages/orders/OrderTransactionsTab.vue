<template>
    <div>
        <div v-if="!orderId" class="p-4 text-gray-500">
            {{ $t('saveOrderFirst') }}
        </div>
        <div v-else>
            <PrimaryButton icon="fas fa-plus" :onclick="showTransactionModal" class="my-3"></PrimaryButton>

            <DraggableTable v-if="transactions.length" table-key="order.transactions" :columns-config="columnsConfig"
                :table-data="transactions" :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="editTransaction" />

            <div v-else class="text-gray-500">{{ $t('noTransactions') }}</div>
        </div>

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
        TransactionAmountCell
    },
    data() {
        return {
            transactions: [],
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
                { name: 'date', label: 'Дата' },
                { name: 'userName', label: 'Сотрудник' },
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
            handler() {
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
            try {
                const response = await TransactionController.getItems(1, null, "all_time", this.orderId, null, null, null, null, 20);
                this.transactions = response.items.filter(item => {
                    return item.isDebt != 1;
                });
            } catch (error) {
                this.transactions = [];
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
            // Кэш клиентов инвалидируется автоматически через CacheInvalidator.onCreate('transactions')
            // Перезагружаем клиентов в store для обновления баланса
            if (this.client?.id) {
                await this.$store.dispatch('loadClients');
            }
        },
        async handleTransactionDeleted() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
            // Перезагружаем клиентов в store для обновления баланса
            if (this.client?.id) {
                await this.$store.dispatch('loadClients');
            }
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
                case 'cashName':
                    return i.cashName ? `${i.cashName} (${i.cashCurrencySymbol})` : '-';
                case 'date':
                    return i.formatDate?.() || '-';
                case 'userName':
                    return i.userName || '-';
                default:
                    return i[c];
            }
        },
    }
}
</script>
