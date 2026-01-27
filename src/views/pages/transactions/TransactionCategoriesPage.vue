<template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" key="table">
                <DraggableTable table-key="admin.transaction_categories" :columns-config="columnsConfig"
                    :table-data="data.items" :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                    :onItemClick="(i) => { showModal(i) }">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #left>
                                <PrimaryButton :onclick="() => showModal(null)" icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('transaction_categories_create')">
                                </PrimaryButton>
                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                        :batch-actions="getBatchActions()" />
                                </transition>
                            </template>
                            <template #right>
                                <Pagination v-if="data != null" :currentPage="data.currentPage"
                                    :lastPage="data.lastPage" :per-page="perPage" :per-page-options="perPageOptions"
                                    :show-per-page-selector="true" @changePage="(page) => fetchItems(page)"
                                    @perPageChange="handlePerPageChange" />
                            </template>

                            <template #gear="{ resetColumns, columns, toggleVisible, log }">
                                <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                    <ul>
                                        <draggable v-if="columns.length" class="dragArea list-group w-full"
                                            :list="columns" @change="log">
                                            <li v-for="(element, index) in columns" :key="element.name"
                                                @click="toggleVisible(index)"
                                                class="flex items-center hover:bg-gray-100 p-2 rounded">
                                                <div class="space-x-2 flex flex-row justify-between w-full select-none">
                                                    <div>
                                                        <i class="text-sm mr-2 text-[#337AB7]"
                                                            :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"></i>
                                                        {{ $te(element.label) ? $t(element.label) : element.label }}
                                                    </div>
                                                    <div><i
                                                            class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"></i>
                                                    </div>
                                                </div>
                                            </li>
                                        </draggable>
                                    </ul>
                                </TableFilterButton>
                            </template>
                        </TableControlsBar>
                    </template>
                </DraggableTable>
            </div>
            <div v-else key="loader" class="flex justify-center items-center h-64">
                <SpinnerIcon />
            </div>
        </transition>
        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
            <TransactionCategoryCreatePage ref="transactioncategorycreatepageForm" @saved="handleSaved"
                @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
                @close-request="closeModal" :editingItem="editingItem" />
        </SideModalDialog>
        <NotificationToast :title="notificationTitle" :subtitle="notificationSubtitle" :show="notification"
            :is-danger="notificationIsDanger" @close="closeNotification" />
        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
            :confirm-text="$t('delete')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />
    </div>
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import TransactionCategoryController from '@/api/TransactionCategoryController';
import TransactionCategoryCreatePage from './TransactionCategoryCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { translateTransactionCategory } from '@/utils/transactionCategoryUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, TransactionCategoryCreatePage, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, draggable: VueDraggableNext },
    data() {
        return {
            controller: TransactionCategoryController,
            cacheInvalidationType: 'transactionCategories',
            deletePermission: 'transaction_categories_delete',
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
                    return translateTransactionCategory(i.name, this.$t) || i.name;
                case 'user_name':
                    return i.user_name;
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage;
                this.data = await TransactionCategoryController.getItems(page, per_page);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingTransactionCategories'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    }
}
</script>
