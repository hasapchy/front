<template>
    <div class="mt-4">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-md font-semibold">{{ $t('balance') }}</h3>
            <div class="flex items-center gap-2">
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
            </div>
        </div>
        
        <div v-if="editingItem?.balances?.length" class="mb-4">
            <div class="overflow-x-auto w-full">
                <table class="draggable-table min-w-full bg-white shadow-md rounded mb-6" style="font-size: 12px;">
                    <thead class="bg-gray-100 rounded-t-sm">
                        <tr>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('currency') || 'Валюта' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('balance') || 'Баланс' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('status') || 'Статус' }}
                            </th>
                            <th class="text-left border border-gray-300 py-2 px-2 sm:px-3 md:px-4 font-medium whitespace-nowrap">
                                {{ $t('note') || 'Примечание' }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(balance, idx) in editingItem.balances" :key="balance.id" 
                            @dblclick.stop="openBalanceModal(balance)"
                            class="cursor-pointer hover:bg-gray-100 transition-all"
                            :class="{ 'border-b border-gray-300': idx !== editingItem.balances.length - 1 }">
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                {{ balance.currency?.symbol || balance.currency?.code || '-' }}
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300" :class="{
                                'text-[#5CB85C]': balance.balance > 0,
                                'text-[#EE4F47]': balance.balance < 0,
                                'text-[#337AB7]': balance.balance == 0
                            }">
                                {{ formatBalance(balance.balance) }}
                                <span v-if="balance.balance > 0" class="text-xs ml-1">({{ $t('clientOwesUs') }})</span>
                                <span v-else-if="balance.balance < 0" class="text-xs ml-1">({{ $t('weOweClient') }})</span>
                                <span v-else class="text-xs ml-1">({{ $t('mutualSettlement') }})</span>
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                <span v-if="balance.isDefault" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {{ $t('default') || 'По умолчанию' }}
                                </span>
                                <span v-else class="text-gray-400">-</span>
                            </td>
                            <td class="py-2 px-2 sm:px-3 md:px-4 border-x border-gray-300">
                                {{ balance.note || '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-else class="text-gray-500">
            {{ $t('noBalances') }}
        </div>

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
    methods: {
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
    computed: {
        canCreateBalance() {
            return this.$store.getters.hasPermission('clients_update');
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
};
</script>
