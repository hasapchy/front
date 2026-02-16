<template>
    <div class="mt-4">
        <div v-if="!canViewBalance" class="text-gray-500 py-4">
            {{ $t('noPermissionToViewBalances') || 'Нет прав на просмотр балансов' }}
        </div>
        <DraggableTable
            v-else
            table-key="client.balances"
            :columns-config="columnsConfig"
            :table-data="editingItem?.balances || []"
            :item-mapper="itemMapper"
            :onItemClick="(item) => openBalanceModal(item)">
            <template #tableSettingsAdditional>
                <PrimaryButton
                    v-if="canAdjustBalance"
                    icon="fas fa-edit"
                    :onclick="openAdjustmentModal"
                    :disabled="!editingItem?.id">
                    {{ $t('adjustBalance') }}
                </PrimaryButton>
                <PrimaryButton
                    v-if="canCreateBalance"
                    icon="fas fa-plus"
                    :onclick="openAddBalanceModal"
                    :is-success="true">
                    {{ $t('createBalance') }}
                </PrimaryButton>
            </template>
        </DraggableTable>

        <SideModalDialog :showForm="addBalanceModalOpen" :onclose="closeAddBalanceModal">
            <ClientBalanceCreatePage 
                :editing-item="null"
                :initial-client="editingItem"
                @saved="onBalanceSaved"
                @saved-error="onBalanceSavedError"
                @close-request="closeAddBalanceModal" />
        </SideModalDialog>

        <SideModalDialog :showForm="balanceModalOpen" :onclose="closeBalanceModal">
            <ClientBalanceCreatePage 
                v-if="balanceModalOpen"
                :editing-item="selectedBalance"
                :initial-client="editingItem"
                @saved="onBalanceSaved"
                @saved-error="onBalanceSavedError"
                @deleted="onBalanceDeleted"
                @deleted-error="onBalanceDeletedError"
                @close-request="closeBalanceModal" />
        </SideModalDialog>

        <SideModalDialog :showForm="adjustmentModalOpen" :onclose="closeAdjustmentModal">
            <TransactionCreatePage 
                v-if="adjustmentModalOpen"
                :editingItem="null"
                :initialClient="editingItem"
                :form-config="balanceAdjustmentFormConfig"
                :current-client-balance="editingItem?.balance"
                :client-balances="editingItem?.balances || []"
                :header-text="balanceAdjustmentHeader"
                @saved="onAdjustmentSaved"
                @saved-error="onAdjustmentSavedError"
                @deleted="onAdjustmentDeleted"
                @deleted-error="onAdjustmentDeletedError" />
        </SideModalDialog>
    </div>
</template>

<script>
import DraggableTable from "@/views/components/app/forms/DraggableTable.vue";
import SideModalDialog from "@/views/components/app/dialog/SideModalDialog.vue";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import ClientBalanceCreatePage from "@/views/pages/clients/ClientBalanceCreatePage.vue";
import notificationMixin from "@/mixins/notificationMixin";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import ClientController from "@/api/ClientController";
import { defineAsyncComponent } from 'vue';
import { TRANSACTION_FORM_PRESETS } from "@/constants/transactionFormPresets";

const TransactionCreatePage = defineAsyncComponent(() =>
    import("@/views/pages/transactions/TransactionCreatePage.vue")
);

export default {
    mixins: [notificationMixin, getApiErrorMessage],
    components: {
        DraggableTable,
        SideModalDialog,
        PrimaryButton,
        ClientBalanceCreatePage,
        TransactionCreatePage,
    },
    emits: ['balance-updated'],
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            addBalanceModalOpen: false,
            balanceModalOpen: false,
            selectedBalance: null,
            adjustmentModalOpen: false,
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'id', label: '№', size: 60 },
                { name: 'currency', label: this.$t('currency') || 'Валюта', size: 120 },
                { name: 'balance', label: this.$t('balance') || 'Баланс', size: 200, html: true },
                { name: 'status', label: this.$t('status') || 'Статус', size: 140, html: true },
                { name: 'note', label: this.$t('note') || 'Примечание', size: 200 },
            ];
        },
        canCreateBalance() {
            return this.$store.getters.hasPermission('client_balances_create');
        },
        canViewBalance() {
            return this.$store.getters.hasPermission('client_balances_view_all');
        },
        canAdjustBalance() {
            return this.$store.getters.hasPermission('settings_client_balance_adjustment');
        },
        balanceAdjustmentFormConfig() {
            return TRANSACTION_FORM_PRESETS.balanceAdjustment;
        },
        balanceAdjustmentHeader() {
            return this.$t('adjustBalance') || 'Корректировка баланса';
        },
    },
    methods: {
        itemMapper(item, column) {
            switch (column) {
                case 'id':
                    return item.id;
                case 'currency':
                    return item.currency?.symbol || item.currency?.code || '';
                case 'balance': {
                    const b = parseFloat(item.balance);
                    let cls = 'text-[#337AB7]';
                    if (b > 0) cls = 'text-[#5CB85C]';
                    else if (b < 0) cls = 'text-[#EE4F47]';
                    let hint = '';
                    if (b > 0) hint = `<span class="text-xs ml-1">(${this.$t('clientOwesUs')})</span>`;
                    else if (b < 0) hint = `<span class="text-xs ml-1">(${this.$t('weOweClient')})</span>`;
                    else hint = `<span class="text-xs ml-1">(${this.$t('mutualSettlement')})</span>`;
                    return `<span class="${cls}">${this.formatBalance(b)} ${hint}</span>`;
                }
                case 'status':
                    return item.isDefault
                        ? `<span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">${this.$t('default')}</span>`
                        : '-';
                case 'note':
                    return item.note || '-';
                default:
                    return item[column] ?? '-';
            }
        },
        async updateClientData() {
            if (!this.editingItem || !this.editingItem.id) return;
            try {
                const updatedClient = await ClientController.getItem(this.editingItem.id);
                if (updatedClient) {
                    Object.assign(this.editingItem, updatedClient);
                }
            } catch (error) {
                console.error('Error updating client data:', error);
            }
        },
        formatBalance(balance) {
            return this.$formatNumber(balance, null, true);
        },
        openAddBalanceModal() {
            this.addBalanceModalOpen = true;
        },
        closeAddBalanceModal() {
            this.addBalanceModalOpen = false;
        },
        async onBalanceSaved() {
            await this.updateClientData();
            this.closeAddBalanceModal();
            this.closeBalanceModal();
            this.$emit('balance-updated');
        },
        onBalanceSavedError(error) {
            console.error('Error saving balance:', error);
        },
        async onBalanceDeleted() {
            await this.updateClientData();
            this.closeBalanceModal();
            this.$emit('balance-updated');
        },
        onBalanceDeletedError(error) {
            console.error('Error deleting balance:', error);
        },
        openBalanceModal(balance) {
            this.selectedBalance = balance;
            this.balanceModalOpen = true;
        },
        closeBalanceModal() {
            this.balanceModalOpen = false;
            this.selectedBalance = null;
        },
        openAdjustmentModal() {
            this.adjustmentModalOpen = true;
        },
        closeAdjustmentModal() {
            this.adjustmentModalOpen = false;
        },
        async onAdjustmentSaved() {
            this.adjustmentModalOpen = false;
            await this.updateClientData();
            this.$emit('balance-updated');
        },
        onAdjustmentSavedError(error) {
            const msg = typeof error === 'string' ? error : this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
        },
        async onAdjustmentDeleted() {
            this.adjustmentModalOpen = false;
            await this.updateClientData();
            this.$emit('balance-updated');
        },
        onAdjustmentDeletedError(error) {
            const msg = typeof error === 'string' ? error : this.getApiErrorMessage(error);
            this.showNotification(this.$t('error'), Array.isArray(msg) ? msg.join(', ') : msg, true);
        },
    },
};
</script>
