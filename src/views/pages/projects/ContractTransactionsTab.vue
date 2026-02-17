<template>
    <div>
        <div v-if="!contractId" class="p-4 text-gray-500">
            {{ $t('saveContractFirst') }}
        </div>
        <transition v-else name="fade" mode="out-in">
            <div v-if="!transactionsLoading" key="table">
                <DraggableTable
                    table-key="contract.transactions"
                    :columns-config="columnsConfig"
                    :table-data="transactions || []"
                    :item-mapper="itemMapper"
                    @selectionChange="selectedIds = $event"
                    :onItemClick="editTransaction" />
            </div>
            <div v-else key="loader" class="min-h-64">
                <TableSkeleton />
            </div>
        </transition>

        <SideModalDialog :showForm="transactionModal" :onclose="closeTransactionModal">
            <template v-if="transactionModal">
                <TransactionCreatePage :editingItem="editingTransaction" :initial-client="client"
                    :initial-project-id="projectId" :contract-id="contractId" :default-cash-id="cashId"
                    :form-config="contractFormConfig"
                    @saved="handleTransactionChanged"
                    @saved-error="handleTransactionError"
                    @deleted="handleTransactionChanged"
                    @deleted-error="handleTransactionError" />
            </template>
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import TransactionController from '@/api/TransactionController';
import { TRANSACTION_FORM_PRESETS } from '@/constants/transactionFormPresets';
import notificationMixin from '@/mixins/notificationMixin';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import DebtCell from '@/views/components/app/buttons/DebtCell.vue';
import TransactionAmountCell from '@/views/components/app/buttons/TransactionAmountCell.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { markRaw } from 'vue';

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    props: {
        contractId: { type: [String, Number], required: true },
        client: { type: Object, default: null },
        projectId: { type: [String, Number], default: null },
        cashId: { type: [String, Number], default: null }
    },
    emits: ['updated'],
    components: {
        DraggableTable,
        SideModalDialog,
        TransactionCreatePage,
        DebtCell,
        TransactionAmountCell,
        TableSkeleton,
    },
    data() {
        return {
            transactions: [],
            transactionsLoading: false,
            transactionModal: false,
            editingTransaction: null,
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
        contractFormConfig() {
            return TRANSACTION_FORM_PRESETS.contractPayment;
        }
    },
    watch: {
        contractId: {
            handler(val) {
                if (!val) {
                    this.transactions = [];
                    this.transactionsLoading = false;
                    return;
                }
                this.transactionsLoading = true;
                this.fetchTransactions();
            },
            immediate: true
        }
    },
    methods: {
        async fetchTransactions() {
            if (!this.contractId) {
                this.transactions = [];
                return;
            }
            this.transactionsLoading = true;
            try {
                const response = await TransactionController.getItemsByContractId(this.contractId);
                this.transactions = response.items.filter(item => item.isDebt != 1);
            } catch (error) {
                this.transactions = [];
            } finally {
                this.transactionsLoading = false;
            }
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
            this.$emit('updated');
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
