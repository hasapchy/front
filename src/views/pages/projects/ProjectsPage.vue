<template>
    <div class="flex justify-between items-center mb-2">
        <div class="flex items-center space-x-3">
            <PrimaryButton 
                :onclick="() => { showModal(null) }" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('projects_create')">
            </PrimaryButton>

            <!-- Переключатель вида -->
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
            
            <!-- Фильтр по статусу -->
            <div>
                <select v-model="statusFilter" @change="debouncedFetchItems" class="p-2 border border-gray-300 rounded bg-white">
                    <option value="">{{ $t('allStatuses') }}</option>
                    <option v-for="status in statuses" :key="status.id" :value="status.id">
                        {{ status.name }}
                    </option>
                </select>
            </div>
            
            <!-- Фильтр по клиенту -->
            <div>
                <select v-model="clientFilter" @change="debouncedFetchItems" class="p-2 border border-gray-300 rounded bg-white">
                    <option value="">{{ $t('allClients') }}</option>
                    <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.first_name }} {{ client.last_name || client.contact_person }}
                    </option>
                </select>
            </div>
            
        </div>
        
        <div class="flex items-center space-x-3">
            <Pagination v-if="data && viewMode === 'table'" :currentPage="data.currentPage" :lastPage="data.lastPage"
                :per-page="perPage" :per-page-options="perPageOptions" :show-per-page-selector="true"
                storage-key="projectsPerPage"
                @changePage="fetchItems" @perPageChange="handlePerPageChange" />
        </div>
    </div>
    <!-- Счётчик выбранных карточек для канбана -->
    <div v-if="selectedIds.length && viewMode === 'kanban'" class="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex items-center space-x-3">
            <div class="flex items-center space-x-2">
                <i class="fas fa-check-square text-blue-600"></i>
                <span class="font-medium text-blue-800">
                    {{ $t('selected') }}: <strong>{{ selectedIds.length }}</strong>
                </span>
            </div>
            <button 
                @click="selectedIds = []"
                class="text-sm text-blue-600 hover:text-blue-800 underline">
                {{ $t('clearSelection') }}
            </button>
        </div>
        <div class="flex items-center space-x-2">
            <select 
                v-model="batchStatusId"
                class="px-3 py-1 border border-blue-300 rounded bg-white text-sm"
                @change="handleBatchStatusChange">
                <option value="">{{ $t('changeStatus') }}</option>
                <option v-for="status in statuses" :key="status.id" :value="status.id">
                    {{ status.name }}
                </option>
            </select>
            <button 
                @click="confirmDeleteItems"
                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                <i class="fas fa-trash mr-1"></i>
                {{ $t('delete') }}
            </button>
        </div>
    </div>
    
    <BatchButton v-if="selectedIds.length && viewMode === 'table'" :selected-ids="selectedIds" :batch-actions="getBatchActions()"
        :statuses="statuses" :handle-change-status="handleChangeStatus" :show-status-select="true" />
    
    <transition name="fade" mode="out-in">
        <!-- Табличный вид -->
        <div v-if="data && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
            <DraggableTable table-key="admin.projects" :columns-config="translatedColumnsConfig" :table-data="data.items"
                :item-mapper="itemMapper" @selectionChange="selectedIds = $event"
                :onItemClick="(i) => { showModal(i) }" />
        </div>

        <!-- Канбан вид -->
        <div v-else-if="data && !loading && viewMode === 'kanban'" key="kanban-view">
            <KanbanBoard
                :orders="data.items"
                :statuses="statuses"
                :projects="[]"
                :selected-ids="selectedIds"
                :loading="loading"
                :currency-symbol="''"
                :is-project-mode="true"
                @order-moved="handleProjectMoved"
                @card-dblclick="showModal"
                @card-select-toggle="toggleSelectRow"
            />
        </div>

        <!-- Загрузка -->
        <div v-else key="loader" class="flex justify-center items-center h-64">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
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
import tableTranslationMixin from '@/mixins/tableTranslationMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import debounce from "lodash.debounce";

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, tableTranslationMixin],
    components: { NotificationToast, PrimaryButton, SideModalDialog, Pagination, DraggableTable, KanbanBoard, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell, ClientButtonCell },
    data() {
        return {
            // data, loading, perPage, perPageOptions - из crudEventMixin
            // selectedIds - из batchActionsMixin
            viewMode: 'table', // 'table' или 'kanban'
            statusFilter: '',
            statuses: [],
            clientFilter: '',
            clients: [],
            controller: ProjectController,
            cacheInvalidationType: 'projects',
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
            debounceTimer: null,
            pendingStatusUpdates: new Map(), // Для debounce обновлений статусов
            batchStatusId: '', // Для массового изменения статуса в канбане
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
        if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
            this.viewMode = savedViewMode;
            
            // Если восстанавливаем канбан режим, загружаем больше проектов
            if (savedViewMode === 'kanban') {
                this.perPage = 1000;
            }
        }
        
        this.fetchItems();
    },
    beforeUnmount() {
        // Очищаем таймер при уничтожении компонента
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    },
    methods: {
        itemMapper(i, c) {
            switch (c) {
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
        async fetchProjectStatuses() {
            try {
                // Используем данные из store
                await this.$store.dispatch('loadProjectStatuses');
                this.statuses = this.$store.getters.projectStatuses;
            } catch (error) {
                console.error('Error fetching project statuses:', error);
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
                this.fetchItems();
            }, 300);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const filters = {};
                if (this.statusFilter) filters.status_id = this.statusFilter;
                if (this.clientFilter) filters.client_id = this.clientFilter;
                
                const new_data = await ProjectController.getItems(page, filters, this.perPage);
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
                this.selectedIds = []; // Очищаем выбранные элементы
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
                    // Сначала обновляем локально для плавности
                    const project = this.data.items.find(p => p.id === updateData.orderId);
                    if (project) {
                        project.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            project.statusName = status.name;
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
            
            // Показываем уведомление после всех обновлений
            Promise.all(promises).then(() => {
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

        // Массовое изменение статуса в канбане
        handleBatchStatusChange() {
            if (!this.batchStatusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, this.batchStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        }
    },
    watch: {
        viewMode(newMode) {
            // Сохраняем режим просмотра в localStorage
            localStorage.setItem('projects_viewMode', newMode);
            
            // В режиме канбана загружаем все проекты (без пагинации)
            if (newMode === 'kanban') {
                this.perPage = 1000; // Большое число для загрузки всех проектов
                this.fetchItems(1, false);
            } else {
                // Возвращаем обычную пагинацию для таблицы
                const savedPerPage = localStorage.getItem('projectsPerPage');
                this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
                this.fetchItems(1, false);
            }
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
                {
                    name: 'client',
                    label: 'client',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({
                        client: item.client,
                    })
                },
                { name: 'users', label: 'access' },
            ];
        }
    },
}
</script>
