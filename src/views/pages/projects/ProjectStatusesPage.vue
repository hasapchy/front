<template>
    <div>
        <transition name="fade" mode="out-in">
            <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
                <DraggableTable table-key="project_statuses" :columns-config="columnsConfig" :table-data="data.items"
                    :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                    :onItemClick="(i) => { showModal(i) }">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #left>
                                <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">
                                </PrimaryButton>
                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                        :batch-actions="getBatchActions()" />
                                </transition>
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
            <ProjectStatusCreatePage ref="projectstatuscreatepageForm" @saved="handleSaved"
                @saved-error="handleSavedError" @deleted="handleDeleted" @deleted-error="handleDeletedError"
                @close-request="closeModal" :editingItem="editingItem" />
        </SideModalDialog>
        <AlertDialog :dialog="deleteDialog" :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
            :confirm-text="$t('deleteSelected')" :leave-text="$t('cancel')" @confirm="confirmDeleteItems"
            @leave="deleteDialog = false" />
    </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectStatusCreatePage from './ProjectStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { translateProjectStatus } from '@/utils/translationUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin],
    components: {
        PrimaryButton, SideModalDialog, ProjectStatusCreatePage, Pagination, DraggableTable, AlertDialog, BatchButton, TableControlsBar, TableFilterButton, draggable: VueDraggableNext
    },
    data() {
        return {
            controller: ProjectStatusController,
            cacheInvalidationType: 'projectStatuses',
            savedSuccessText: this.$t('projectStatusSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProjectStatus'),
            deletedSuccessText: this.$t('projectStatusSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProjectStatus'),
            showStatusSelect: false,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: '№', size: 60 },
                { name: 'name', label: 'name' },
                { name: 'color', label: 'color', html: true },
                { name: 'createdAt', label: 'creationDate' }
            ]
        }
    },
    created() {
        this.fetchItems();
    },
    methods: {
        getBatchActions() {
            const actions = [];

            if (this.$store?.getters?.hasPermission?.('project_statuses_delete')) {
                actions.push({
                    label: "",
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                });
            }

            return actions;
        },
        itemMapper(i, c) {
            switch (c) {
                case 'name':
                    return translateProjectStatus(i.name, this.$t);
                case 'color':
                    if (i.color) {
                        return `<div style="width: 20px; height: 20px; background-color: ${i.color}; border-radius: 4px; display: inline-block; border: 1px solid #ddd;"></div>`;
                    }
                    return '-';
                case 'createdAt':
                    return i.formatCreatedAt ? i.formatCreatedAt() : i.createdAt;
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

                const per_page = this.perPage;

                this.data = await ProjectStatusController.getItems(page, per_page);
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectStatuses'), error.message, true);
            }
            if (!silent) this.loading = false;
        }
    }
}
</script>
