<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addTransfer') }}</PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.transfers" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TransferCreatePage ref="transfercreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TransferController from '@/api/TransferController';
import TransferCreatePage from '@/views/pages/transfers/TransferCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [modalMixin, notificationMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        Pagination,
        DraggableTable,
        TransferCreatePage,
        BatchButton,
        AlertDialog
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: TransferController,
            //editingItem: null,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'cashFromName', label: 'senderCashRegister' },
                { name: 'amount', label: 'transferAmount', html: true },
                { name: 'cashToName', label: 'destination' },
                { name: 'note', label: 'note' },
                { name: 'dateUser', label: 'date' },
            ],
        }
    },
    created() {
        this.fetchItems();
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'amount':
                    return i.amountDescription();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.userName}`;
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            // Проверяем, есть ли изменения в форме
            const formRef = this.$refs.transfercreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const new_data = await TransferController.getItems(page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingTransferList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleSaved() {
            this.showNotification(this.$t('transferSuccessfullyAdded'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleSavedError(m) {
            this.showNotification(this.$t('errorSavingTransfer'), m, true);
        },
        handleDeleted() {
            this.showNotification(this.$t('transferSuccessfullyDeleted'), '', false);
            this.fetchItems(this.data?.currentPage || 1, true);
            this.closeModal();
        },
        handleDeletedError(m) {
            this.showNotification(this.$t('errorDeletingTransfer'), m, true);
        }
    },
    computed: {
        translatedColumnsConfig() {
            return this.columnsConfig.map(column => ({
                ...column,
                label: column.label === '#' ? '#' : this.$t(column.label)
            }));
        }
    },
}
</script>