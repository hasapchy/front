<template>
    <BatchButton v-if="selectedIds.length && viewMode === 'table'" :selected-ids="selectedIds" :batch-actions="getBatchActions()" />
    
    <transition name="fade" mode="out-in">
        <!-- Табличный вид -->
        <div v-if="!loading && viewMode === 'table' && rawTasks.length > 0" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.tasks" :columns-config="columnsConfig" :table-data="tableTasks"
                :item-mapper="itemMapper" :onItemClick="handleItemClick" @selectionChange="selectedIds = $event">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="paginationData"
                        :on-page-change="fetchItems"
                        :on-per-page-change="handlePerPageChange"
                        :resetColumns="resetColumns"
                        :columns="columns"
                        :toggleVisible="toggleVisible"
                        :log="log">
                        <template #left>
                            <PrimaryButton 
                                :onclick="() => { showModal(null) }" 
                                icon="fas fa-plus"
                                :disabled="!$store.getters.hasPermission('tasks_create')">
                            </PrimaryButton>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                                    <select v-model="statusFilter" @change="debouncedFetchItems" class="w-full">
                                        <option value="all">{{ $t('allStatuses') }}</option>
                                        <option value="pending">{{ $t('pending') }}</option>
                                        <option value="in_progress">{{ $t('inProgress') }}</option>
                                        <option value="completed">{{ $t('completed') }}</option>
                                        <option value="postponed">{{ $t('postponed') }}</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                                    <select v-model="dateFilter" @change="debouncedFetchItems" class="w-full">
                                        <option value="all_time">{{ $t('allTime') }}</option>
                                        <option value="today">{{ $t('today') }}</option>
                                        <option value="yesterday">{{ $t('yesterday') }}</option>
                                        <option value="this_week">{{ $t('thisWeek') }}</option>
                                        <option value="this_month">{{ $t('thisMonth') }}</option>
                                        <option value="last_week">{{ $t('lastWeek') }}</option>
                                        <option value="last_month">{{ $t('lastMonth') }}</option>
                                        <option value="custom">{{ $t('selectDates') }}</option>
                                    </select>
                                </div>
                                
                                <div v-if="dateFilter === 'custom'" class="space-y-2">
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                                        <input type="date" v-model="startDate" @change="debouncedFetchItems" class="w-full" />
                                    </div>
                                    <div>
                                        <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                        <input type="date" v-model="endDate" @change="debouncedFetchItems" class="w-full" />
                                    </div>
                                </div>
                            </FiltersContainer>

                            <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                                <button 
                                    @click="viewMode = 'table'"
                                    class="px-3 py-2 transition-colors"
                                    :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                                    <i class="fas fa-table"></i>
                                </button>
                                <button 
                                    @click="viewMode = 'kanban'"
                                    class="px-3 py-2 transition-colors"
                                    :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                                    <i class="fas fa-columns"></i>
                                </button>
                            </div>
                        </template>

                        <template #right>
                            <Pagination v-if="paginationData" :currentPage="paginationData.currentPage" :lastPage="paginationData.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                        </template>
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

        <!-- Канбан вид -->
        <div v-else-if="!loading && viewMode === 'kanban' && rawTasks.length > 0" key="kanban-view" class="kanban-view-container">
            <TableControlsBar
                :show-filters="true"
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                :on-filters-reset="resetFilters"
                :show-pagination="false">
                <template #left>
                    <PrimaryButton 
                        :onclick="() => { showModal(null) }" 
                        icon="fas fa-plus"
                        :disabled="!$store.getters.hasPermission('tasks_create')">
                    </PrimaryButton>
                    
                    <FiltersContainer
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        @reset="resetFilters">
                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                            <select v-model="statusFilter" @change="debouncedFetchItems" class="w-full">
                                <option value="all">{{ $t('allStatuses') }}</option>
                                <option value="pending">{{ $t('pending') }}</option>
                                <option value="in_progress">{{ $t('inProgress') }}</option>
                                <option value="completed">{{ $t('completed') }}</option>
                                <option value="postponed">{{ $t('postponed') }}</option>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') || 'Период' }}</label>
                            <select v-model="dateFilter" @change="debouncedFetchItems" class="w-full">
                                <option value="all_time">{{ $t('allTime') }}</option>
                                <option value="today">{{ $t('today') }}</option>
                                <option value="yesterday">{{ $t('yesterday') }}</option>
                                <option value="this_week">{{ $t('thisWeek') }}</option>
                                <option value="this_month">{{ $t('thisMonth') }}</option>
                                <option value="last_week">{{ $t('lastWeek') }}</option>
                                <option value="last_month">{{ $t('lastMonth') }}</option>
                                <option value="custom">{{ $t('selectDates') }}</option>
                            </select>
                        </div>
                        
                        <div v-if="dateFilter === 'custom'" class="space-y-2">
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') || 'Начальная дата' }}</label>
                                <input type="date" v-model="startDate" @change="debouncedFetchItems" class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') || 'Конечная дата' }}</label>
                                <input type="date" v-model="endDate" @change="debouncedFetchItems" class="w-full" />
                            </div>
                        </div>
                    </FiltersContainer>

                    <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                        <button 
                            @click="viewMode = 'table'"
                            class="px-3 py-2 transition-colors"
                            :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                            <i class="fas fa-table"></i>
                        </button>
                        <button 
                            @click="viewMode = 'kanban'"
                            class="px-3 py-2 transition-colors"
                            :class="viewMode === 'kanban' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'">
                            <i class="fas fa-columns"></i>
                        </button>
                    </div>
                </template>
                <template #right>
                    <KanbanFieldsButton mode="tasks" />
                </template>
            </TableControlsBar>
            
            <KanbanBoard
                :orders="kanbanTasks"
                :statuses="taskStatuses"
                :projects="[]"
                :selected-ids="selectedIds"
                :loading="loading"
                :currency-symbol="''"
                :is-project-mode="false"
                :batch-status-id="batchStatusId"
                @order-moved="handleTaskMoved"
                @card-dblclick="showModal"
                @card-select-toggle="toggleSelectRow"
                @column-select-toggle="handleColumnSelectToggle"
                @batch-status-change="handleBatchStatusChangeFromToolbar"
                @batch-delete="() => deleteItems(selectedIds)"
                @clear-selection="() => selectedIds = []"
            />
        </div>

        <!-- Загрузка -->
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <SpinnerIcon />
        </div>
    </transition>
    <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
        <TaskCreatePage v-if="modalDialog" ref="taskForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import KanbanBoard from '@/views/components/app/kanban/KanbanBoard.vue';
import TaskController from '@/api/TaskController';
import TaskCreatePage from '@/views/pages/tasks/TaskCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { highlightMatches } from '@/utils/searchUtils';
import searchMixin from '@/mixins/searchMixin';
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import TaskDto from '@/dto/task/TaskDto';
import debounce from "lodash.debounce";

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, searchMixin],
    components: { 
        NotificationToast, 
        PrimaryButton, 
        SideModalDialog, 
        Pagination, 
        DraggableTable, 
        KanbanBoard, 
        TaskCreatePage, 
        BatchButton, 
        AlertDialog, 
        TableControlsBar, 
        TableFilterButton, 
        FiltersContainer, 
        KanbanFieldsButton, 
        draggable: VueDraggableNext 
    },
    data() {
        return {
            // Единый источник данных - массив TaskDto объектов
            rawTasks: [],
            meta: null,
            
            // Состояние UI
            viewMode: 'table',
            selectedIds: [],
            
            // Фильтры
            statusFilter: 'all',
            dateFilter: 'all_time',
            startDate: '',
            endDate: '',
            
            // Загрузка
            debounceTimer: null,
            
            // Пендинг-обновления статусов
            pendingStatusUpdates: new Map(),
            batchStatusId: '',
            
            // Конфигурация
            controller: TaskController,
            cacheInvalidationType: 'tasks',
            savedSuccessText: this.$t('taskSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTask'),
            deletedSuccessText: this.$t('taskSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTask'),
            
            columnsConfig: [
                { name: 'title', label: 'title', sortable: true },
                { name: 'status', label: 'status', sortable: true, html: true },
                { name: 'creator', label: 'creator', sortable: false },
                { name: 'supervisor', label: 'supervisor', sortable: false },
                { name: 'executor', label: 'executor', sortable: false },
                { name: 'deadline', label: 'deadline', sortable: true },
                { name: 'created_at', label: 'createdAt', sortable: true },
            ],
            taskStatuses: [
                { id: 'pending', name: this.$t('pending') || 'Ожидает', isActive: true },
                { id: 'in_progress', name: this.$t('inProgress') || 'В работе', isActive: true },
                { id: 'completed', name: this.$t('completed') || 'Завершена', isActive: true },
                { id: 'postponed', name: this.$t('postponed') || 'Отложена', isActive: true },
            ],
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    async mounted() {
        const savedViewMode = localStorage.getItem('tasks_viewMode');
        if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
            this.viewMode = savedViewMode;
        }
        
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
                case 'supervisor':
                    return item.supervisor ? item.supervisor.name : '-';
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
            if (item.frontend_link) {
                this.$router.push(item.frontend_link);
            } else {
                this.$router.push(`/tasks/${item.id}`);
            }
        },
        debouncedFetchItems() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                if (this.viewMode === 'kanban') {
                    this.fetchItems(1, true);
                } else {
                    this.fetchItems();
                }
            }, 300);
        },
        getDateRange() {
            if (this.dateFilter === 'custom') {
                return {
                    dateFrom: this.startDate || null,
                    dateTo: this.endDate || null
                };
            }
            
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
            
            switch (this.dateFilter) {
                case 'today':
                    return {
                        dateFrom: startOfDay.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'yesterday':
                    const yesterday = new Date(startOfDay);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return {
                        dateFrom: yesterday.toISOString().split('T')[0],
                        dateTo: yesterday.toISOString().split('T')[0]
                    };
                case 'this_week':
                    const weekStart = new Date(startOfDay);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    return {
                        dateFrom: weekStart.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'this_month':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return {
                        dateFrom: monthStart.toISOString().split('T')[0],
                        dateTo: endOfDay.toISOString().split('T')[0]
                    };
                case 'last_week':
                    const lastWeekStart = new Date(startOfDay);
                    lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
                    const lastWeekEnd = new Date(lastWeekStart);
                    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
                    return {
                        dateFrom: lastWeekStart.toISOString().split('T')[0],
                        dateTo: lastWeekEnd.toISOString().split('T')[0]
                    };
                case 'last_month':
                    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                    return {
                        dateFrom: lastMonthStart.toISOString().split('T')[0],
                        dateTo: lastMonthEnd.toISOString().split('T')[0]
                    };
                default:
                    return { dateFrom: null, dateTo: null };
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.viewMode === 'kanban' ? 1000 : this.perPage || 20;
                const status = this.statusFilter === 'all' ? '' : this.statusFilter;
                const { dateFrom, dateTo } = this.getDateRange();
                
                const response = await TaskController.getItems(page, this.searchQuery, status, per_page, dateFrom, dateTo);
                
                // Единый источник данных - сохраняем TaskDto объекты
                this.rawTasks = TaskDto.fromApiArray(response.data || []);
                this.meta = response.meta || {
                    current_page: page,
                    last_page: 1,
                    per_page: per_page,
                    total: 0
                };
            } catch (error) {
                this.showNotification(
                    this.$t('errorGettingTaskList'), 
                    this.getApiErrorMessage(error), 
                    true
                );
                this.rawTasks = [];
                this.meta = null;
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        resetFilters() {
            this.statusFilter = 'all';
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            if (this.viewMode === 'kanban') {
                this.fetchItems(1, true);
            } else {
                this.fetchItems(1);
            }
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.statusFilter !== 'all') count++;
            if (this.dateFilter !== 'all_time') count++;
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
        handleTaskMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    // Обновляем статус в rawTasks (единый источник данных)
                    const task = this.rawTasks.find(t => t.id === updateData.orderId);
                    if (task) {
                        task.status = updateData.statusId;
                    }
                    
                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    this.debouncedStatusUpdate();
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors, true);
                this.fetchItems(this.meta?.current_page || 1, true);
            }
        },
        debouncedStatusUpdate: debounce(function() {
            if (this.pendingStatusUpdates.size === 0) return;
            
            const updatesByStatus = new Map();
            this.pendingStatusUpdates.forEach((statusId, taskId) => {
                if (!updatesByStatus.has(statusId)) {
                    updatesByStatus.set(statusId, []);
                }
                updatesByStatus.get(statusId).push(taskId);
            });
            
            this.pendingStatusUpdates.clear();
            
            const promises = [];
            updatesByStatus.forEach((taskIds, statusId) => {
                const promise = Promise.all(
                    taskIds.map(taskId => {
                        // Находим задачу для получения supervisor_id и executor_id
                        const task = this.rawTasks.find(t => t.id === taskId);
                        const updateData = { status: statusId };
                        
                        // Добавляем обязательные поля для валидации
                        if (task) {
                            if (task.supervisorId) updateData.supervisor_id = task.supervisorId;
                            if (task.executorId) updateData.executor_id = task.executorId;
                        }
                        
                        return TaskController.updateItem(taskId, updateData);
                    })
                ).catch(error => {
                    const errors = this.getApiErrorMessage(error);
                    this.showNotification(this.$t('error'), errors, true);
                    this.fetchItems(this.meta?.current_page || 1, true);
                });
                promises.push(promise);
            });
            
            Promise.all(promises).then(async () => {
                await this.$store.dispatch('invalidateCache', { type: 'tasks' });
                await this.fetchItems(this.meta?.current_page || 1, true);
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
            }).catch(error => {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors, true);
            });
        }, 500),
        toggleSelectRow(id) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
        handleColumnSelectToggle(taskIds, select) {
            if (select) {
                const newSelectedIds = [...this.selectedIds];
                taskIds.forEach(id => {
                    if (!newSelectedIds.includes(id)) {
                        newSelectedIds.push(id);
                    }
                });
                this.selectedIds = newSelectedIds;
            } else {
                this.selectedIds = this.selectedIds.filter(id => !taskIds.includes(id));
            }
        },
        handleBatchStatusChangeFromToolbar(statusId) {
            if (!statusId || this.selectedIds.length === 0) return;
            
            Promise.all(
                this.selectedIds.map(id => {
                    const task = this.rawTasks.find(t => t.id === id);
                    const updateData = { status: statusId };
                    
                    if (task) {
                        if (task.supervisorId) updateData.supervisor_id = task.supervisorId;
                        if (task.executorId) updateData.executor_id = task.executorId;
                    }
                    
                    return TaskController.updateItem(id, updateData);
                })
            ).then(async () => {
                await this.$store.dispatch('invalidateCache', { type: 'tasks' });
                await this.fetchItems(this.meta?.current_page || 1, true);
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
                this.selectedIds = [];
            }).catch(error => {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            });
        }
    },
    watch: {
        viewMode: {
            handler(newMode) {
                localStorage.setItem('tasks_viewMode', newMode);
                this.$nextTick(() => {
                    this.fetchItems(1, false);
                });
            },
            immediate: false
        }
    },
    computed: {
        hasActiveFilters() {
            return this.statusFilter !== 'all' || this.dateFilter !== 'all_time';
        },
        
        // Преобразование rawTasks в формат для таблицы
        tableTasks() {
            return this.rawTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
                deadline: task.deadline,
                creator: task.creator,
                supervisor: task.supervisor,
                executor: task.executor,
                project: task.project,
                created_at: task.createdAt,
                updated_at: task.updatedAt,
                frontend_link: `/tasks/${task.id}`,
            }));
        },
        
        // Преобразование rawTasks в формат для канбана
        kanbanTasks() {
            return this.rawTasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                statusId: task.status,
                statusName: task.getStatusBadge().text,
                deadline: task.deadline,
                creator: task.creator,
                supervisor: task.supervisor,
                executor: task.executor,
                project: task.project,
                created_at: task.createdAt,
            }));
        },
        
        // Данные для пагинации
        paginationData() {
            if (!this.meta) return null;
            return {
                currentPage: this.meta.current_page || 1,
                lastPage: this.meta.last_page || 1,
                perPage: this.perPage || 20,
                perPageOptions: this.perPageOptions || [10, 20, 50, 100]
            };
        }
    },
}
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
}
</style>
