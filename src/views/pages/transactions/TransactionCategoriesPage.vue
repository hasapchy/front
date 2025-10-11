<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }"
            :disabled="!$store.getters.hasPermission('transaction_categories_create')" icon="fas fa-plus">
        </PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            storage-key="transactionCategoriesPerPage"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" key="table">
            <DraggableTable table-key="admin.transaction_categories" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TransactionCategoryCreatePage ref="transactioncategorycreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCategoryCreatePage from './TransactionCategoryCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, TransactionCategoryCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog },
    data() {
        return {
            controller: TransactionCategoryController,
            cacheInvalidationType: 'transactionCategories',
            showStatusSelect: false,
            savedSuccessText: this.$t('transactionCategorySuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTransactionCategory'),
            deletedSuccessText: this.$t('transactionCategorySuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTransactionCategory'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: this.$t('name') },
                { name: 'type', label: this.$t('type') },
                { name: 'user_name', label: this.$t('createdBy') },
                { name: 'createdAt', label: this.$t('creationDate') }
            ]
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'type':
                    return `${i.typeClass()} ${i.typeText()}`;
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'name':
                    return i.canBeDeleted() ? i.name : `${i.name} 🔒`;
                case 'user_name':
                    return i.user_name || '-';
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                this.data = await TransactionCategoryController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification('Ошибка получения списка категорий транзакций', error.message, true);
            }
            if (!silent) this.loading = false;
        }
    }
}
</script>
