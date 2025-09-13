<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex items-center flex-wrap gap-2">
            <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus">{{ $t('addProject') }}</PrimaryButton>
            
            <!-- Фильтр по статусу -->
            <div class="ml-2">
                <select v-model="statusFilter" @change="() => fetchItems()" class="w-full p-2 pl-10 border rounded">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option v-for="status in statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>

            <!-- Фильтр по дате -->
            <div class="ml-2">
                <select v-model="dateFilter" @change="handleDateFilterChange" class="w-full p-2 pl-10 border rounded">
                    <option value="all_time">{{ $t('allTime') }}</option>
                    <option value="today">{{ $t('today') }}</option>
                    <option value="yesterday">{{ $t('yesterday') }}</option>
                    <option value="this_week">{{ $t('thisWeek') }}</option>
                    <option value="this_month">{{ $t('thisMonth') }}</option>
                    <option value="last_week">{{ $t('lastWeek') }}</option>
                    <option value="last_month">{{ $t('lastMonth') }}</option>
                    <option value="custom">{{ $t('customDate') }}</option>
                </select>
            </div>

            <!-- Кастомные даты -->
            <div v-if="dateFilter === 'custom'" class="flex space-x-2 items-center ml-2">
                <input type="date" v-model="startDate" @change="() => fetchItems()" class="w-full p-2 border rounded">
                <input type="date" v-model="endDate" @change="() => fetchItems()" class="w-full p-2 border rounded">
            </div>

        </div>
        <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
            @changePage="fetchItems" />
    </div>
    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.projects" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i><br>
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <ProjectCreatePage ref="projectcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import ProjectController from '@/api/ProjectController';
import ProjectStatusController from '@/api/ProjectStatusController';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { markRaw } from 'vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell },
    data() {
        return {
            data: null,
            loading: false,
            selectedIds: [],
            statusFilter: '',
            statuses: [],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null,
            controller: ProjectController,
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    mounted() {
        this.fetchProjectStatuses();
        this.fetchItems();
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
                case 'clientId':
                    return i.clientId != null && i.client ? i.client.fullName() : this.$t('notSpecified');
                case 'users':
                    return (i.users || '').length + ' ' + this.$t('users');
                case 'createdAt':
                    return i.formatCreatedAt();
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name || this.$t('notSpecified')}`;
                case 'description':
                    return i.description || 'Не указано';
                default:
                    return i[c];
            }
        },
        handleModalClose() {
            const formRef = this.$refs.projectcreatepageForm;
            if (formRef && formRef.handleCloseRequest) {
                formRef.handleCloseRequest();
            } else {
                this.closeModal();
            }
        },
        async fetchProjectStatuses() {
            try {
                this.statuses = await ProjectStatusController.getAllItems();
            } catch (error) {
                console.error('Error fetching project statuses:', error);
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const filters = {};
                
                if (this.statusFilter) {
                    filters.status_id = this.statusFilter;
                }
                
                if (this.dateFilter && this.dateFilter !== 'all_time') {
                    filters.date_filter = this.dateFilter;
                    if (this.dateFilter === 'custom' && this.startDate && this.endDate) {
                        filters.start_date = this.startDate;
                        filters.end_date = this.endDate;
                    }
                }
                
                
                const new_data = await ProjectController.getItems(page, filters);
                this.data = new_data;
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await ProjectController.batchUpdateStatus({ ids, status_id: statusId });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
            } catch (error) {
                this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
            }
            this.loading = false;
        },
        handleDateFilterChange() {
            if (this.dateFilter !== 'custom') {
                this.startDate = null;
                this.endDate = null;
            }
            this.fetchItems();
        }
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'name', label: 'name' },
                { name: "statusName", label: 'projectStatus', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId), }), },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'clientId', label: 'client' },
                { name: 'users', label: 'access' },
            ];
        }
    },
}
</script>
