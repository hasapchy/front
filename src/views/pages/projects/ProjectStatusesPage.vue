<template>
    <div class="flex justify-between items-center mb-4">
        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"></PrimaryButton>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
            @changePage="fetchItems" @perPageChange="handlePerPageChange" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="project_statuses" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ProjectStatusCreatePage ref="projectstatuscreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectStatusCreatePage from './ProjectStatusCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: {
        NotificationToast, PrimaryButton, SideModalDialog, ProjectStatusCreatePage, Pagination, DraggableTable, AlertDialog, BatchButton
    },
    data() {
        return {
            // selectedIds, deleteDialog - из batchActionsMixin
            controller: ProjectStatusController,
            cacheInvalidationType: 'projectStatuses',
            savedSuccessText: this.$t('projectStatusSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProjectStatus'),
            deletedSuccessText: this.$t('projectStatusSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProjectStatus'),
            showStatusSelect: false, // не показываем смену статуса для статусов
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
            
            // Добавляем кнопку удаления только если у пользователя есть права
            if (this.$store?.getters?.hasPermission?.('projects_delete')) {
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
                this.data = await ProjectStatusController.getItems(page, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectStatuses'), error.message, true);
            }
            if (!silent) this.loading = false;
        }
    }
}
</script>
