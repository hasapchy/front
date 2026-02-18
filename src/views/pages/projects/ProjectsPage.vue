<template>
    <div>
        <transition name="fade" mode="out-in">
            <!-- Табличный вид -->
            <div v-if="data?.items && !loading && viewMode === 'table'" :key="`table-${$i18n.locale}`">
                <DraggableTable table-key="admin.projects" :columns-config="columnsConfig" :table-data="data.items"
                    :item-mapper="itemMapper" @selectionChange="selectedIds = $event" :onItemClick="onItemClick">
                    <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
                        <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                            :show-pagination="true"
                            :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
                            :on-page-change="fetchItems" :on-per-page-change="handlePerPageChange"
                            :resetColumns="resetColumns" :columns="columns" :toggleVisible="toggleVisible" :log="log">
                            <template #left>
                                <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                                    :disabled="!$store.getters.hasPermission('projects_create')">
                                </PrimaryButton>

                                <transition name="fade">
                                    <BatchButton v-if="selectedIds.length" :selected-ids="selectedIds"
                                        :batch-actions="getBatchActions()" :statuses="statuses"
                                        :handle-change-status="handleChangeStatus" :show-status-select="true" />
                                </transition>

                                <ProjectFilters :statusFilter="statusFilter" :clientFilter="clientFilter"
                                    :statuses="statuses" :clients="clients" :has-active-filters="hasActiveFilters"
                                    :active-filters-count="getActiveFiltersCount()"
                                    @update:statusFilter="statusFilter = $event"
                                    @update:clientFilter="clientFilter = $event" @reset="resetFilters"
                                    @apply="applyFilters" />

                                <ViewModeToggle :view-mode="viewMode" @change="changeViewMode" />
                            </template>

                            <template #right="{ resetColumns, columns, toggleVisible, log }">
                                <Pagination v-if="data != null" :currentPage="data.currentPage"
                                    :lastPage="data.lastPage" :per-page="perPage" :per-page-options="perPageOptions"
                                    :show-per-page-selector="true" @changePage="fetchItems"
                                    @perPageChange="handlePerPageChange" />
                                <TableFilterButton v-if="viewMode === 'table' && columns?.length"
                                    :onReset="resetColumns">
                                    <ul>
                                        <draggable v-if="columns.length" class="dragArea list-group w-full"
                                            :list="columns" @change="log">
                                            <li v-for="(element, index) in columns" :key="element.name" v-show="element.name !== 'select'"
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
                <TableControlsBar :show-filters="true" :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()" :on-filters-reset="resetFilters"
                    :show-pagination="false">
                    <template #left>
                        <PrimaryButton :onclick="() => { showModal(null) }" icon="fas fa-plus"
                            :disabled="!$store.getters.hasPermission('projects_create')">
                        </PrimaryButton>

                        <ProjectFilters :statusFilter="statusFilter" :clientFilter="clientFilter" :statuses="statuses"
                            :clients="clients" :has-active-filters="hasActiveFilters"
                            :active-filters-count="getActiveFiltersCount()" @update:statusFilter="statusFilter = $event"
                            @update:clientFilter="clientFilter = $event" @reset="resetFilters" @apply="applyFilters" />

                        <ViewModeToggle :view-mode="viewMode" @change="changeViewMode" />
                    </template>
                    <template #right>
                        <KanbanFieldsButton mode="projects" />
                    </template>
                </TableControlsBar>

                <KanbanBoard :orders="allKanbanItems" :statuses="statuses" :projects="[]" :selected-ids="selectedIds"
                    :loading="loading" :currency-symbol="''" :is-project-mode="true" :batch-status-id="batchStatusId"
                    @order-moved="handleProjectMoved" @card-dblclick="onItemClick" @card-select-toggle="toggleSelectRow"
                    @column-select-toggle="handleColumnSelectToggle"
                    @batch-status-change="handleBatchStatusChangeFromToolbar"
                    @batch-delete="() => deleteItems(selectedIds)" @clear-selection="() => selectedIds = []" />
            </div>

            <div v-else key="loader" class="min-h-64">
                <KanbanSkeleton v-if="viewMode === 'kanban'" />
                <TableSkeleton v-else />
            </div>
        </transition>
        <SideModalDialog :showForm="modalDialog" :onclose="handleModalClose">
            <ProjectCreatePage v-if="modalDialog" :key="editingItem ? editingItem.id : 'new-project'"
                ref="projectcreatepageForm" @saved="handleSaved" @saved-error="handleSavedError"
                @deleted="handleDeleted" @deleted-error="handleDeletedError" @close-request="closeModal"
                :editingItem="editingItem" />
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
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import KanbanBoard from '@/views/components/app/kanban/KanbanBoard.vue';
import ProjectController from '@/api/ProjectController';
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
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import searchMixin from '@/mixins/searchMixin';
import { highlightMatches } from '@/utils/searchUtils';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import debounce from "lodash.debounce";
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import { translateProjectStatus } from '@/utils/translationUtils';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import ProjectFilters from '@/views/components/projects/ProjectFilters.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import KanbanSkeleton from '@/views/components/app/kanban/KanbanSkeleton.vue';

export default {
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, filtersMixin, storeDataLoaderMixin, searchMixin],
    components: { PrimaryButton, SideModalDialog, Pagination, DraggableTable, KanbanBoard, ProjectCreatePage, BatchButton, AlertDialog, StatusSelectCell, ClientButtonCell, TableControlsBar, TableFilterButton, TableSkeleton, KanbanSkeleton, FiltersContainer, KanbanFieldsButton, ViewModeToggle, ProjectFilters, draggable: VueDraggableNext },
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
            itemViewRouteName: 'ProjectView',
            baseRouteName: 'Projects',
            errorGettingItemText: this.$t('errorGettingProject'),
            savedSuccessText: this.$t('projectSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingProject'),
            deletedSuccessText: this.$t('projectSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingProject'),
            pendingStatusUpdates: new Map(),
            batchStatusId: '',
            allKanbanItems: [],
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    async mounted() {
        eventBus.on('global-search', this.handleSearch);
        await this.fetchProjectStatuses();
        this.clients = this.$store.getters.clients || [];

        const savedViewMode = localStorage.getItem('projects_viewMode');
        if (savedViewMode && ['table', 'kanban'].includes(savedViewMode)) {
            this.viewMode = savedViewMode;
        } else {
            try {
                localStorage.setItem('projects_viewMode', this.viewMode);
            } catch (error) {
                console.warn('Failed to save view mode to localStorage:', error);
            }
        }

        if (this.viewMode === 'kanban') {
            this.allKanbanItems = [];
        } else {
            const savedPerPage = localStorage.getItem('perPage');
            this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
        }

        this.fetchItems();
        eventBus.on('cache:invalidate', this.handleCacheInvalidate);
    },
    beforeUnmount() {
        eventBus.off('cache:invalidate', this.handleCacheInvalidate);
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        // translateProjectStatus,
        itemMapper(i, c) {
            const search = this.searchQuery?.trim();
            const searchActive = search && search.length >= 3;
            switch (c) {
                case 'users':
                    return `${i.users?.length || 0} ${this.$t('users')}`;
                case 'budget':
                    return i.getBudgetDisplay?.() || '';
                case 'createdAt':
                    return i.formatCreatedAt?.() || '';
                case 'dateUser':
                    return `${i.formatDate?.() || ''} / ${i.creator?.name || this.$t('notSpecified')}`;
                case 'description':
                    return i.description || 'Не указано';
                case 'id':
                    return searchActive ? highlightMatches(String(i.id ?? ''), search) : (i.id ?? '');
                case 'name':
                    return searchActive && i.name ? highlightMatches(i.name, search) : (i.name ?? '');
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
        },
        async fetchProjectStatuses() {
            await this.loadStoreData({
                getterName: 'projectStatuses',
                dispatchName: 'loadProjectStatuses',
                localProperty: 'statuses',
                defaultValue: []
            });
        },
        async handleCacheInvalidate({ type }) {
            if (type === 'projectStatuses') {
                await this.fetchProjectStatuses();
            } else if (type === 'projects') {
                await this.$store.dispatch('loadProjects');
                await this.fetchItems(this.data?.currentPage || 1, true);
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) this.loading = true;
            try {
                const per_page = this.viewMode === 'kanban' ? 1000 : this.perPage;
                const filters = {};
                if (this.statusFilter) filters.status_id = this.statusFilter;
                if (this.clientFilter) filters.client_id = this.clientFilter;
                const searchTrimmed = this.searchQuery?.trim();
                if (searchTrimmed && searchTrimmed.length >= 3) filters.search = searchTrimmed;

                const new_data = await ProjectController.getItems(page, filters, per_page);

                if (this.viewMode === 'kanban') {
                    this.allKanbanItems = [...new_data.items];
                    this.data = { ...new_data, items: this.allKanbanItems, currentPage: 1, nextPage: null, lastPage: 1 };
                } else {
                    this.data = new_data;
                }
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
            } finally {
                if (!silent) this.loading = false;
            }
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
                this.selectedIds = [];
            } catch (error) {
                this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
            }
            this.loading = false;
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                statusFilter: '',
                clientFilter: ''
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.statusFilter, defaultValue: '' },
                { value: this.clientFilter, defaultValue: '' }
            ]);
        },
        showModal(item = null) {
            this.modalDialog = true;
            this.editingItem = item;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Projects' });
            }
        },

        getCurrentItems() {
            return this.viewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
        },
        handleProjectMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const project = this.getCurrentItems().find(p => p.id === updateData.orderId);
                    if (project) {
                        project.statusId = updateData.statusId;
                        const status = this.statuses.find(s => s.id === updateData.statusId);
                        if (status) {
                            project.statusName = translateProjectStatus(status.name, this.$t);
                        }
                    }

                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);

                    this.debouncedStatusUpdate();
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data.currentPage, true);
            }
        },

        debouncedStatusUpdate: debounce(function () {
            if (this.pendingStatusUpdates.size === 0) return;

            const updatesByStatus = new Map();
            this.pendingStatusUpdates.forEach((statusId, projectId) => {
                if (!updatesByStatus.has(statusId)) {
                    updatesByStatus.set(statusId, []);
                }
                updatesByStatus.get(statusId).push(projectId);
            });

            // Очищаем очередь
            this.pendingStatusUpdates.clear();

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

            Promise.all(promises).then(async () => {
                await this.$store.dispatch('invalidateCache', { type: 'projects' });
                await this.$store.dispatch('loadProjects');
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
            });
        }, 500),

        toggleSelectRow(id) {
            const index = this.selectedIds.indexOf(id);
            if (index > -1) {
                this.selectedIds.splice(index, 1);
            } else {
                this.selectedIds.push(id);
            }
        },

        handleColumnSelectToggle(orderIds, select) {
            if (select) {
                orderIds.forEach(id => {
                    if (!this.selectedIds.includes(id)) {
                        this.selectedIds.push(id);
                    }
                });
            } else {
                this.selectedIds = this.selectedIds.filter(id => !orderIds.includes(id));
            }
        },

        handleBatchStatusChange(statusId = null) {
            const targetStatusId = statusId || this.batchStatusId;
            if (!targetStatusId || !this.selectedIds.length) return;

            this.handleChangeStatus(this.selectedIds, targetStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },

        handleBatchStatusChangeFromToolbar(statusId) {
            this.handleBatchStatusChange(statusId);
        },
        changeViewMode(mode) {
            if (!['table', 'kanban'].includes(mode)) {
                return;
            }
            this.viewMode = mode;
        }
    },
    watch: {
        viewMode: {
            handler(newMode) {
                try {
                    localStorage.setItem('projects_viewMode', newMode);
                } catch (error) {
                    console.warn('Failed to save view mode to localStorage:', error);
                }

                if (newMode === 'kanban') {
                    this.allKanbanItems = [];
                } else {
                    const savedPerPage = localStorage.getItem('perPage');
                    this.perPage = savedPerPage ? parseInt(savedPerPage) : 10;
                }

                this.$nextTick(() => {
                    this.fetchItems(1, false);
                });
            },
            immediate: false
        },
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return !!(this.statusFilter || this.clientFilter);
        },
        canViewProjectBudget() {
            return this.$store.getters.hasPermission('settings_project_budget_view');
        },
        columnsConfig() {
            const q = this.searchQuery?.trim();
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                { name: 'dateUser', label: 'dateUser' },
                { name: "statusName", label: 'projectStatus', component: markRaw(StatusSelectCell), props: (i) => ({ id: i.id, value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }), },
                {
                    name: 'client',
                    label: 'client',
                    component: markRaw(ClientButtonCell),
                    props: (item) => ({ client: item.client, searchQuery: (q && q.length >= 3) ? q : null })
                },
                ...(this.canViewProjectBudget ? [{ name: 'budget', label: 'budget', html: true }] : []),
                { name: 'name', label: 'name', html: true },
            ];
        }
    },
}
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
}
</style>