<template>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.leave_types" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-create-button="true"
                        :on-create-click="() => { showModal(null) }"
                        :create-button-disabled="!$store.getters.hasPermission('leave_types_create_all')"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #gear="{ resetColumns, columns, toggleVisible, log }">
                            <TableFilterButton v-if="columns && columns.length" :onReset="resetColumns">
                                <ul>
                                    <draggable v-if="columns.length" class="dragArea list-group w-full" :list="columns"
                                        @change="log">
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
        <LeaveTypeCreatePage ref="leavetypecreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import LeaveTypeController from '@/api/LeaveTypeController';
import LeaveTypeCreatePage from './LeaveTypeCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: {
        NotificationToast,
        PrimaryButton,
        SideModalDialog,
        LeaveTypeCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        SpinnerIcon,
        draggable: VueDraggableNext
    },
    data() {
        return {
            controller: LeaveTypeController,
            cacheInvalidationType: 'leaveTypes',
            savedSuccessText: this.$t('leaveTypeSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingLeaveType'),
            deletedSuccessText: this.$t('leaveTypeSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingLeaveType'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'color', label: 'color', size: 100 },
                { name: 'createdAt', label: 'creationDate' }
            ]
        }
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'color':
                    return i.color || '-';
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
                const new_data = await LeaveTypeController.getItems(page, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingLeaveTypeList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        }
    },
}
</script>

