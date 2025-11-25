<template>
    <div class="flex justify-between items-center mb-4">
        <div class="flex justify-start items-center">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                :disabled="!$store.getters.hasPermission('tasks_create')"
                icon="fas fa-plus">
            </PrimaryButton>
            
            <FiltersContainer 
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                @reset="resetFilters">
                <template #desktop>
                    <div class="ml-2">
                        <select v-model="statusFilter" @change="() => fetchItems(1)" class="p-2 border border-gray-300 rounded bg-white">
                            <option value="all">{{ $t('allStatuses') }}</option>
                            <option value="pending">{{ $t('pending') }}</option>
                            <option value="in_progress">{{ $t('inProgress') }}</option>
                            <option value="completed">{{ $t('completed') }}</option>
                            <option value="postponed">{{ $t('postponed') }}</option>
                        </select>
                    </div>
                </template>

                <template #mobile>
                    <div>
                        <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
                        <select v-model="statusFilter" @change="() => fetchItems(1)" class="w-full">
                            <option value="all">{{ $t('allStatuses') }}</option>
                            <option value="pending">{{ $t('pending') }}</option>
                            <option value="in_progress">{{ $t('inProgress') }}</option>
                            <option value="completed">{{ $t('completed') }}</option>
                            <option value="postponed">{{ $t('postponed') }}</option>
                        </select>
                    </div>
                </template>
            </FiltersContainer>
        </div>
        
        <Pagination 
            v-if="data != null" 
            :currentPage="data.meta.current_page" 
            :lastPage="data.meta.last_page"
            :per-page="perPage" 
            :per-page-options="perPageOptions" 
            :show-per-page-selector="true"
            @changePage="fetchItems" 
            @perPageChange="handlePerPageChange" />
    </div>

    <BatchButton 
        v-if="selectedIds.length" 
        :selected-ids="selectedIds" 
        :batch-actions="getBatchActions()" />

    <transition name="fade" mode="out-in">
        <div v-if="data != null && !loading" :key="`table-${$i18n.locale}`">
            <DraggableTable 
                table-key="common.tasks" 
                :columns-config="columnsConfig" 
                :table-data="data.data"
                :item-mapper="itemMapper" 
                :onItemClick="handleItemClick"
                @selectionChange="selectedIds = $event" />
        </div>
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>

    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TaskCreatePage 
            v-if="modalDialog" 
            ref="taskForm" 
            @saved="handleSaved" 
            @saved-error="handleSavedError" 
            @deleted="handleDeleted"
            @deleted-error="handleDeletedError" 
            @close-request="closeModal" 
            :editingItem="editingItem" />
    </SideModalDialog>

    <NotificationToast 
        :title="notificationTitle" 
        :subtitle="notificationSubtitle" 
        :show="notification"
        :is-danger="notificationIsDanger" 
        @close="closeNotification" />

    <AlertDialog 
        :dialog="deleteDialog" 
        :descr="`${$t('confirmDelete')} (${selectedIds.length})?`" 
        :confirm-text="$t('delete')"
        :leave-text="$t('cancel')" 
        @confirm="confirmDeleteItems" 
        @leave="deleteDialog = false" />
</template>

<script>
import NotificationToast from '@/views/components/app/dialog/NotificationToast.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TaskController from '@/api/TaskController';
import TaskCreatePage from './TaskCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { highlightMatches } from '@/utils/searchUtils';
import searchMixin from '@/mixins/searchMixin';

export default {
    mixins: [
        batchActionsMixin, 
        crudEventMixin, 
        notificationMixin, 
        modalMixin, 
        companyChangeMixin, 
        searchMixin, 
        getApiErrorMessageMixin
    ],
    components: { 
        NotificationToast, 
        PrimaryButton, 
        SideModalDialog, 
        Pagination, 
        DraggableTable, 
        TaskCreatePage, 
        BatchButton, 
        AlertDialog, 
        FiltersContainer 
    },
    data() {
        return {
            controller: TaskController,
            cacheInvalidationType: 'tasks',
            statusFilter: 'all',
            savedSuccessText: this.$t('taskSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTask'),
            deletedSuccessText: this.$t('taskSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTask'),
            columnsConfig: [
                { key: 'title', label: 'title', sortable: true },
                { key: 'status', label: 'status', sortable: true },
                { key: 'creator', label: 'creator', sortable: false },
                { key: 'executor', label: 'executor', sortable: false },
                { key: 'deadline', label: 'deadline', sortable: true },
                { key: 'created_at', label: 'createdAt', sortable: true },
            ],
        }
    },
    computed: {
        hasActiveFilters() {
            return this.statusFilter !== 'all';
        },
    },
    mounted() {
        this.fetchItems();
    },
    methods: {
        itemMapper(item, column) {
            const search = this.searchQuery;
            switch (column) {
                case 'title':
                    const title = item.title || '-';
                    return search ? highlightMatches(title, search) : title;
                case 'status':
                    return this.getStatusBadge(item.status);
                case 'creator':
                    return item.creator ? item.creator.name : '-';
                case 'executor':
                    return item.executor ? item.executor.name : '-';
                case 'deadline':
                    return item.deadline ? new Date(item.deadline).toLocaleDateString() : '-';
                case 'created_at':
                    return item.created_at ? new Date(item.created_at).toLocaleDateString() : '-';
                default:
                    return item[column] || '-';
            }
        },
        getStatusBadge(status) {
            const badges = {
                'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Ожидает</span>',
                'in_progress': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">В работе</span>',
                'completed': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Завершена</span>',
                'postponed': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Отложена</span>',
            };
            return badges[status] || status;
        },
        handleItemClick(item) {
            // Используем frontend_link из API или создаем ссылку вручную
            if (item.frontend_link) {
                this.$router.push(item.frontend_link);
            } else {
                this.$router.push(`/tasks/${item.id}`);
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.perPage || 20;
                const status = this.statusFilter === 'all' ? '' : this.statusFilter;
                const new_data = await TaskController.getItems(page, this.searchQuery, status, per_page);
                this.data = new_data;
            } catch (error) {
                this.showNotification(
                    this.$t('errorGettingTaskList'), 
                    this.getApiErrorMessage(error), 
                    true
                );
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.statusFilter = 'all';
            this.fetchItems(1);
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.statusFilter !== 'all') count++;
            return count;
        },
        getBatchActions() {
            return [
                {
                    label: this.$t('delete'),
                    action: () => this.deleteItems(this.selectedIds),
                    permission: 'tasks_delete_all',
                },
            ];
        },
    },
}
</script>