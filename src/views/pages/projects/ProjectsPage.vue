<template>
    <transition name="fade" mode="out-in">
        <!-- Табличный вид -->
        <div v-if="data && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.projects" :columns-config="columnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }">
                <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                    <TableControlsBar
                        :show-filters="true"
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        :on-filters-reset="resetFilters"
                        :show-pagination="true"
                        :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
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
                                :disabled="!$store.getters.hasPermission('projects_create')">
                            </PrimaryButton>
                            
                            <transition name="fade">
                                <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
                                    :statuses="statuses" :handle-change-status="handleChangeStatus" :show-status-select="true" />
                            </transition>
                            
                            <FiltersContainer
                                :has-active-filters="hasActiveFilters"
                                :active-filters-count="getActiveFiltersCount()"
                                @reset="resetFilters"
                                @apply="applyFilters">
                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                                    <select v-model="statusFilter" class="w-full">
                                        <option value="">{{ $t('allStatuses') }}</option>
                                        <option v-for="status in statuses" :key="status.id" :value="status.id">
                                            {{ translateTaskStatus(status.name, $t) }}
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
                                    <select v-model="clientFilter" class="w-full">
                                        <option value="">{{ $t('allClients') }}</option>
                                        <option v-for="client in clients" :key="client.id" :value="client.id">
                                            {{ client.first_name }} {{ client.last_name || client.contact_person }}
                                        </option>
                                    </select>
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

                        <template #right="{ resetColumns, columns, toggleVisible, log }">
                            <Pagination v-if="data != null" :currentPage="data.currentPage" :lastPage="data.lastPage"
                                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
                            <TableFilterButton v-if="viewMode === 'table' && columns && columns.length" :onReset="resetColumns">
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
                        <template #gear>
                        </template>
                    </TableControlsBar>
                </template>
            </DraggableTable>
        </div>

        <!-- Канбан вид -->
        <div v-else-if="data && viewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
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
                        :disabled="!$store.getters.hasPermission('projects_create')">
                    </PrimaryButton>
                    
                    <FiltersContainer
                        :has-active-filters="hasActiveFilters"
                        :active-filters-count="getActiveFiltersCount()"
                        @reset="resetFilters"
                        @apply="applyFilters">
                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('status') || 'Статус' }}</label>
                            <select v-model="statusFilter" class="w-full">
                                <option value="">{{ $t('allStatuses') }}</option>
                                <option v-for="status in statuses" :key="status.id" :value="status.id">
                                    {{ translateTaskStatus(status.name, $t) }}
                                </option>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-2 text-xs font-semibold">{{ $t('client') || 'Клиент' }}</label>
                            <select v-model="clientFilter" class="w-full">
                                <option value="">{{ $t('allClients') }}</option>
                                <option v-for="client in clients" :key="client.id" :value="client.id">
                                    {{ client.first_name }} {{ client.last_name || client.contact_person }}
                                </option>
                            </select>
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
                    <KanbanFieldsButton mode="projects" />
                </template>
            </TableControlsBar>
            
            <KanbanBoard
                :orders="allKanbanItems"
                :statuses="statuses"
                :projects="[]"
                :selected-ids="selectedIds"
                :loading="loading"
                :currency-symbol="''"
                :is-project-mode="true"
                :batch-status-id="batchStatusId"
                @order-moved="handleProjectMoved"
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
        <ProjectCreatePage v-if="modalDialog" ref="projectcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError" @deleted="handleDeleted"
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
import companyChangeMixin from '@/mixins/companyChangeMixin';
import filtersMixin from '@/mixins/filtersMixin';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import debounce from "lodash.debounce";
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import { translateTaskStatus } from '@/utils/translationUtils';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, filtersMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, KanbanBoard, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell, ClientButtonCell, TableControlsBar, TableFilterButton, FiltersContainer, KanbanFieldsButton, draggable: VueDraggableNext },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            viewMode: 'kanban', // 'table' или 'kanban'
            statusFilter: '',
            statuses: [],
            clientFilter: '',
            clients: [],
            controller: ProjectController,
            cacheInvalidationType: 'projects',
            deletePermission: 'projects_delete',
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
            debounceTimer: null,
            pendingStatusUpdates: new Map(),
            batchStatusId: '',
            allKanbanItems: [],
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    async mounted() {
        // Загружаем статусы первыми, чтобы они были доступны при создании проекта
        await this.fetchProjectStatuses();
        
        // Клиенты уже загружаются глобально в App.vue через loadCompanyData
        this.clients = this.$store.getters.clients;
        
        // Восстанавливаем режим просмотра из localStorage
        const savedViewMode = localStorage.getItem('projects_viewMode');
        let shouldFetch = true;
        
        if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
            if (this.viewMode !== savedViewMode) {
                shouldFetch = false;
            }
            this.viewMode = savedViewMode;
            
            if (savedViewMode === 'kanban') {
                this.allKanbanItems = [];
                this.kanbanCurrentPage = 1;
            } else {
                const savedPerPage = localStorage.getItem('perPage');
                this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
            }
        } else {
            if (this.viewMode === 'kanban') {
                this.allKanbanItems = [];
                this.kanbanCurrentPage = 1;
            } else {
                const savedPerPage = localStorage.getItem('perPage');
                this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
            }
        }
        
        // Вызываем fetchItems только если viewMode не изменился (чтобы не было двойного вызова)
        if (shouldFetch) {
            this.fetchItems();
        }
        
        // Слушаем события инвалидации кэша
        eventBus.on('cache:invalidate', this.handleCacheInvalidate);
    },
    beforeUnmount() {
        // Очищаем таймер при уничтожении компонента
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Отписываемся от события
        eventBus.off('cache:invalidate', this.handleCacheInvalidate);
    },
    methods: {
        translateTaskStatus,
        itemMapper(i, c) {
            switch (c) {
                case 'users':
                    return (i.users || '').length + ' ' + this.$t('users');
                case 'budget':
                    return i.getBudgetDisplay ? i.getBudgetDisplay() : '';
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
        async handleCompanyChanged(companyId) {
            this.statusFilter = '';
            this.clientFilter = '';
            this.selectedIds = [];
            this.batchStatusId = '';
            this.pendingStatusUpdates.clear();
            this.allKanbanItems = [];
            
            await this.fetchItems(1, false);
            
            // Уведомляем пользователя о смене компании (из базового миксина)
            this.$store.dispatch('showNotification', {
              title: 'Компания изменена',
              isDanger: false
            });
        },
        async fetchProjectStatuses() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadProjectStatuses');
                this.statuses = this.$store.getters.projectStatuses;
            } catch (error) {
                console.error('Error fetching project statuses:', error);
            }
        },
        async handleCacheInvalidate({ type }) {
            if (type === 'projectStatuses') {
                console.log('[ProjectsPage] Перезагрузка статусов проектов из-за инвалидации кэша');
                await this.fetchProjectStatuses();
            } else if (type === 'projects') {
                await this.$store.dispatch('loadProjects');
                if (this.fetchItems) {
                    await this.fetchItems(this.data?.currentPage || 1, true);
                }
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        debouncedFetchItems() {
            // Очищаем предыдущий таймер
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            // Устанавливаем новый таймер на 300ms
            this.debounceTimer = setTimeout(() => {
                // В канбане обновляем без размонтирования
                if (this.viewMode === 'kanban') {
                    this.fetchItems(1, true);
                } else {
                    this.fetchItems();
                }
            }, 300);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const per_page = this.viewMode === 'kanban' ? 1000 : this.perPage;
                
                const filters = {};
                if (this.statusFilter) filters.status_id = this.statusFilter;
                if (this.clientFilter) filters.client_id = this.clientFilter;
                
                const new_data = await ProjectController.getItems(page, filters, per_page);
                
                if (this.viewMode === 'kanban') {
                    this.allKanbanItems = [...new_data.items];
                    this.data = { ...new_data, items: this.allKanbanItems, currentPage: 1, nextPage: null, lastPage: 1 };
                } else {
                    this.data = new_data;
                }
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async loadMoreItems() {
            return;
        },
        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await ProjectController.batchUpdateStatus({ ids, status_id: statusId });
                await this.$store.dispatch('invalidateCache', { type: 'projects' });
                await this.$store.dispatch('loadProjects');
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
                this.selectedIds = []; // Очищаем выбранные элементы
            } catch (error) {
                this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
            }
            this.loading = false;
        },
        resetFilters() {
            this.statusFilter = '';
            this.clientFilter = '';
            if (this.viewMode === 'kanban') {
                this.fetchItems(1, true);
            } else {
                this.fetchItems(1);
            }
        },
        getActiveFiltersCount() {
            let count = 0;
            if (this.statusFilter !== '') count++;
            if (this.clientFilter !== '') count++;
            return count;
        },
        // Переопределяем метод из modalMixin для добавления специфичной логики
        showModal(item = null) {
            this.modalDialog = true;
            this.showTimeline = true;
            this.editingItem = item;
        },

        // Обработчик перемещения проекта в канбане
        handleProjectMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const items = this.viewMode === 'kanban' ? this.allKanbanItems : this.data.items;
                    const project = items.find(p => p.id === updateData.orderId);
                    if (project) {
                        project.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            project.statusName = translateTaskStatus(status.name, this.$t);
                        }
                    }
                    
                    // Сохраняем в очередь для debounce
                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    
                    // Вызываем debounced функцию
                    this.debouncedStatusUpdate();
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data.currentPage, true);
            }
        },

        // Debounced функция для отправки обновлений статусов
        debouncedStatusUpdate: debounce(function() {
            if (this.pendingStatusUpdates.size === 0) return;
            
            // Группируем обновления по статусам
            const updatesByStatus = new Map();
            this.pendingStatusUpdates.forEach((statusId, projectId) => {
                if (!updatesByStatus.has(statusId)) {
                    updatesByStatus.set(statusId, []);
                }
                updatesByStatus.get(statusId).push(projectId);
            });
            
            // Очищаем очередь
            this.pendingStatusUpdates.clear();
            
            // Отправляем батч-запросы для каждого статуса
            const promises = [];
            updatesByStatus.forEach((projectIds, statusId) => {
                const promise = ProjectController.batchUpdateStatus({ 
                    ids: projectIds, 
                    status_id: statusId 
                }).catch(error => {
                    const errors = this.getApiErrorMessage(error);
                    this.showNotification(this.$t('error'), errors.join("\n"), true);
                    this.fetchItems(this.data.currentPage, true);
                });
                promises.push(promise);
            });
            
            // Показываем уведомление после всех обновлений и перезагружаем проекты в store
            Promise.all(promises).then(async () => {
                await this.$store.dispatch('invalidateCache', { type: 'projects' });
                await this.$store.dispatch('loadProjects');
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
            });
        }, 500),

        // Переключение выбора строки (для канбана)
        toggleSelectRow(id) {
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },

        // Обработка выбора всех карточек в колонке
        handleColumnSelectToggle(orderIds, select) {
            if (select) {
                // Добавляем все ID колонки к выбранным
                const newSelectedIds = [...this.selectedIds];
                orderIds.forEach(id => {
                    if (!newSelectedIds.includes(id)) {
                        newSelectedIds.push(id);
                    }
                });
                this.selectedIds = newSelectedIds;
            } else {
                // Убираем все ID колонки из выбранных
                this.selectedIds = this.selectedIds.filter(id => !orderIds.includes(id));
            }
        },

        // Массовое изменение статуса в канбане
        handleBatchStatusChange() {
            if (!this.batchStatusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, this.batchStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        // Обработка смены статуса из toolbar канбана
        handleBatchStatusChangeFromToolbar(statusId) {
            if (!statusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, statusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        }
    },
    watch: {
        viewMode: {
            handler(newMode) {
                localStorage.setItem('projects_viewMode', newMode);
                
                if (newMode === 'kanban') {
                    this.allKanbanItems = [];
                    this.kanbanCurrentPage = 1;
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                } else {
                    const savedPerPage = localStorage.getItem('perPage');
                    const newPerPage = savedPerPage ? parseInt(savedPerPage) : 10;
                    this.perPage = newPerPage;
                    this.allKanbanItems = [];
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                }
            },
            immediate: false
        }
    },
    computed: {
        hasActiveFilters() {
            return this.statusFilter !== '' || this.clientFilter !== '';
        },
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'dateUser', label: 'dateUser' },
                { name: "statusName", label: 'projectStatus', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                {
                    name: 'client',
                    label: 'client',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,
                    })
                },
                ...(this.$store.getters.hasPermission('settings_project_budget_view') ? [{ name: 'budget', label: 'budget', html: true }] : []),
                { name: 'name', label: 'name' },
            ];
        }
    },
}
</script>

<style scoped>
/* Контейнер для канбана - изолируем канбан */
.kanban-view-container {
    width: 100%;
    /* Не добавляем overflow здесь - канбан сам управляет своим скроллом */
}
</style>