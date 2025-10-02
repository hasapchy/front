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
                    @saved="handleTransactionSaved" @deleted="handleTransactionDeleted" />
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

export default {
    props: {
        orderId: { type: [String, Number], required: true },
        client: { type: Object, default: null },
        projectId: { type: [String, Number], default: null },
        cashId: { type: [String, Number], default: null },
        currencySymbol: { type: String, default: '' }
    },
    emits: ['updated-paid'],
    components: {
        PrimaryButton,
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage
    },
    data() {
        return {
            transactions: [],
            transactionModal: false,
            editingTransaction: null,
            paidTotalAmount: 0,
            columnsConfig: [
                { name: 'id', label: '№', size: 60 },
                { name: 'amount', label: 'Сумма', html: true },
                { name: 'cashName', label: 'Касса' },
                { name: 'date', label: 'Дата' },
            ]
        }
    },
    mounted() {
        this.fetchTransactions();
        this.fetchPaidTotal();
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
                const response = await TransactionController.getItems(1, null, "all_time", this.orderId);
                this.transactions = response.items;
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
        handleTransactionSaved() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
        },
        handleTransactionDeleted() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
        },
        itemMapper(i, c) {
            switch (c) {
                case 'amount':
                    return i.cashAmountData?.() || '-';
                case 'cashName':
                    return i.cashName ? `${i.cashName} (${i.cashCurrencySymbol})` : '-';
                case 'date':
                    return i.formatDate?.() || '-';
                default:
                    return i[c];
            }
        },
    }
}
</script>
