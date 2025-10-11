<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"></PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            storage-key="orderStatusesPerPage"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.order_statuses" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <OrderStatusCreatePage ref="orderstatuscreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
            @deleted-error="handleDeletedError" @close-request="closeModal" :editingItem="editingItem" />
    </SideModalDialog>
    <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
        :is-danger="notificationIsDanger" @close="closeNotification" />
            <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`" :confirm-text="$t('deleteSelected')"
                  :leave-text="$t('cancel')" @confirm="confirmDeleteItems" @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import OrderStatusController from '@/api/OrderStatusController';
import OrderStatusCreatePage from './OrderStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, tableTranslationMixin],
    components: {
        NotificationToast, PrimaryButton, SideModalDialog, OrderStatusCreatePage, Pagination, DraggableTable, AlertDialog
    },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            controller: OrderStatusController,
            cacheInvalidationType: 'orderStatuses', // Тип кэша для инвалидации
            savedSuccessText: this.$t('statusSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingStatus'),
            deletedSuccessText: this.$t('statusSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingStatus'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'categoryName', label: 'category' },
                { name: 'createdAt', label: 'creationDate' }
            ],
            perPage: 10,
            perPageOptions: [10, 25, 50, 100]
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            const formRef = this.$refs.orderstatuscreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await OrderStatusController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingStatuses'), error.message, true);
            }
            if (!silent) this.loading = false;
        }
    }
}
</script>
