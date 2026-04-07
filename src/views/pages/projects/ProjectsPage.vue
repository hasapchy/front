<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="cardsToolbar"
      >
        <template #table>
        <DraggableTable
          table-key="admin.projects"
          :columns-config="columnsConfig"
          :table-data="data.items"
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
          @selection-change="selectedIds = $event"
        >
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
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton
                  :onclick="() => { showModal(null) }"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('projects_create')"
                />

                <transition name="fade">
                  <BatchButton
                    v-if="selectedIds.length"
                    :selected-ids="selectedIds"
                    :batch-actions="getBatchActions()"
                    :statuses="statuses"
                    :handle-change-status="handleChangeStatus"
                    :show-status-select="true"
                  />
                </transition>

                <ProjectFilters
                  :status-filter="statusFilter"
                  :client-filter="clientFilter"
                  :statuses="statuses"
                  :clients="clients"
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @update:status-filter="statusFilter = $event"
                  @update:client-filter="clientFilter = $event"
                  @reset="resetFilters"
                  @apply="applyFilters"
                />

                <ViewModeToggle
                  :view-mode="displayViewMode"
                  :show-kanban="true"
                  :show-cards="true"
                  @change="changeViewMode"
                />
              </template>

              <template #right="{ resetColumns, columns, toggleVisible, log }">
                <Pagination
                  v-if="paginationData"
                  :current-page="paginationData.currentPage"
                  :last-page="paginationData.lastPage"
                  :per-page="paginationData.perPage"
                  :per-page-options="paginationData.perPageOptions"
                  :show-per-page-selector="true"
                  @change-page="fetchItems"
                  @per-page-change="handlePerPageChange"
                />
                <TableFilterButton
                  v-if="displayViewMode === 'table' && columns?.length"
                  :on-reset="resetColumns"
                >
                  <ul>
                    <draggable
                      v-if="columns.length"
                      class="dragArea list-group w-full"
                      :list="columns"
                      @change="log"
                    >
                      <li
                        v-for="(element, index) in columns"
                        v-show="element.name !== 'select'"
                        :key="element.name"
                        class="flex items-center hover:bg-gray-100 p-2 rounded"
                        @click="toggleVisible(index)"
                      >
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                          <div>
                            <i
                              class="text-sm mr-2 text-[#337AB7]"
                              :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                            />
                            {{ $te(element.label) ? $t(element.label) : element.label }}
                          </div>
                          <div>
                            <i
                              class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab"
                            />
                          </div>
                        </div>
                      </li>
                    </draggable>
                  </ul>
                </TableFilterButton>
              </template>
              <template #gear />
            </TableControlsBar>
          </template>
        </DraggableTable>
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('projects_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
              :statuses="statuses"
              :handle-change-status="handleChangeStatus"
              :show-status-select="true"
            />
          </transition>
          <ProjectFilters
            :status-filter="statusFilter"
            :client-filter="clientFilter"
            :statuses="statuses"
            :clients="clients"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:status-filter="statusFilter = $event"
            @update:client-filter="clientFilter = $event"
            @reset="resetFilters"
            @apply="applyFilters"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="true"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right>
          <Pagination
            v-if="paginationData"
            :current-page="paginationData.currentPage"
            :last-page="paginationData.lastPage"
            :per-page="paginationData.perPage"
            :per-page-options="paginationData.perPageOptions"
            :show-per-page-selector="true"
            @change-page="fetchItems"
            @per-page-change="handlePerPageChange"
          />
        </template>
        <template #card-bar-gear>
          <CardFieldsGearMenu
            :card-fields="cardFields"
            :on-reset="resetCardFields"
            @toggle="toggleCardFieldVisible"
          />
        </template>
        <template #cards>
          <MapperCardGrid
            class="mt-4"
            :items="data.items"
            :card-config="cardConfigMerged"
            :card-mapper="projectCardMapper"
            title-field="title"
            title-subtitle-field="name"
            :title-prefix="projectCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('projects_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>

      <div
        v-else-if="displayViewMode === 'kanban'"
        key="kanban-view"
        class="kanban-view-container"
      >
        <TableControlsBar
          :show-filters="true"
          :has-active-filters="hasActiveFilters"
          :active-filters-count="getActiveFiltersCount()"
          :on-filters-reset="resetFilters"
          :show-pagination="false"
        >
          <template #left>
            <PrimaryButton
              :onclick="() => { showModal(null) }"
              icon="fas fa-plus"
              :disabled="!$store.getters.hasPermission('projects_create')"
            />

            <ProjectFilters
              :status-filter="statusFilter"
              :client-filter="clientFilter"
              :statuses="statuses"
              :clients="clients"
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @update:status-filter="statusFilter = $event"
              @update:client-filter="clientFilter = $event"
              @reset="resetFilters"
              @apply="applyFilters"
            />

            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #right>
            <KanbanFieldsButton mode="projects" />
          </template>
        </TableControlsBar>

        <div
          v-if="selectedIds.length && displayViewMode === 'kanban'"
          class="mb-4"
        >
          <BatchButton
            :selected-ids="selectedIds"
            :batch-actions="getBatchActions()"
            :statuses="statuses"
            :handle-change-status="handleChangeStatus"
            :show-status-select="true"
          />
        </div>

        <div class="kanban-board-area">
          <KanbanBoard
            :orders="allKanbanItems"
            :statuses="statuses"
            :selected-ids="selectedIds"
            :loading="loading"
            :is-project-mode="true"
            :status-meta="kanbanByStatus"
            @order-moved="handleProjectMoved"
            @card-dblclick="onItemClick"
            @card-select-toggle="toggleSelectRow"
            @column-select-toggle="handleColumnSelectToggle"
            @load-more="loadMoreKanbanItems($event)"
          />
        </div>
      </div>

      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton v-else-if="displayViewMode === 'cards'" />
        <TableSkeleton v-else />
      </div>
    </transition>
    <SideModalDialog
      :show-form="modalDialog"
      :title="sideModalCrudTitle('sideModalGenProject', 'sideModalNomProject')"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <ProjectCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-project'"
        ref="projectcreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
        @project-files-updated="onProjectFilesUpdated"
      />

      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'project'"
          @toggle-timeline="toggleTimeline"
        />
      </template>
    </SideModalDialog>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDeleteSelected')} (${selectedIds.length})?`"
      :confirm-text="$t('deleteSelected')"
      :leave-text="$t('cancel')"
      @confirm="confirmDeleteItems"
      @leave="deleteDialog = false"
    />
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
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
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import kanbanByStatusMixin from '@/mixins/kanbanByStatusMixin';
import { highlightMatches } from '@/utils/searchUtils';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import { markRaw } from 'vue';
import debounce from "lodash.debounce";
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import { translateProjectStatus } from '@/utils/translationUtils';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import ProjectFilters from '@/views/components/projects/ProjectFilters.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';

import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const projectsViewModeMixin = createStoreViewModeMixin({
    getter: 'projectsViewMode',
    dispatch: 'setProjectsViewMode',
    modes: ['table', 'kanban', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, Pagination, DraggableTable, KanbanBoard, ProjectCreatePage, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, KanbanFieldsButton, ViewModeToggle, ProjectFilters, TableSkeleton, CardsSkeleton, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, TimelinePanel: TimelinePanelAsync, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, storeDataLoaderMixin, kanbanByStatusMixin, listQueryMixin, projectsViewModeMixin, cardFieldsVisibilityMixin, timelineSideModalMixin],
    data() {
        return {
            cardFieldsKey: 'admin.projects.cards',
            titleField: 'title',
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
            kanbanErrorMessage: 'errorGettingProjectList',
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },

    async mounted() {
        eventBus.on('global-search', this.handleSearch);
        await this.fetchProjectStatuses();
        this.clients = this.$store.getters.clients || [];

        await this.fetchItems();
        eventBus.on('cache:invalidate', this.handleCacheInvalidate);
    },
    beforeUnmount() {
        eventBus.off('cache:invalidate', this.handleCacheInvalidate);
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        itemMapper(i, c) {
            const search = this.searchQuery?.trim();
            const searchActive = search && search.length >= 3;
            switch (c) {
                case 'users':
                    return `${i.users?.length || 0} ${this.$t('users')}`;
                case 'budget':
                    return i.getBudgetDisplay?.() ;
                case 'createdAt':
                    return i.formatCreatedAt?.() ;
                case 'dateUser':
                    return `${i.formatDate?.() } / ${i.creator?.name }`;
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
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.statusFilter = '';
            this.clientFilter = '';
            this.selectedIds = [];
            this.pendingStatusUpdates.clear();
            this.resetKanbanPagination();
            await this.fetchItems(1, previousCompanyId == null);
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
        async fetchItems(page = 1, silent = false) {
            if (this.displayViewMode === 'kanban') {
                if (page === 1) this.resetKanbanPagination();
                if (!silent) this.loading = true;
                try {
                    await this.fetchKanbanInitial();
                } catch (error) {
                    this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
                }
                if (!silent) this.loading = false;
                return;
            }
            if (!silent) this.loading = true;
            try {
                const filters = {};
                if (this.statusFilter) filters.statusId = this.statusFilter;
                if (this.clientFilter) filters.clientId = this.clientFilter;
                const searchTrimmed = this.searchQuery?.trim();
                if (searchTrimmed && searchTrimmed.length >= 3) filters.search = searchTrimmed;
                this.data = await ProjectController.getItems(page, filters, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingProjectList'), error.message, true);
            }
            if (!silent) this.loading = false;
        },
        ensureKanbanStatuses() {
            return this.fetchProjectStatuses();
        },
        getKanbanFilters(statusId) {
            const filters = statusId ? { statusId } : {};
            if (this.clientFilter) filters.clientId = this.clientFilter;
            const searchTrimmed = this.searchQuery?.trim();
            if (searchTrimmed && searchTrimmed.length >= 3) filters.search = searchTrimmed;
            return filters;
        },
        async fetchKanbanStatusPage(statusId, page) {
            return ProjectController.getItems(page, this.getKanbanFilters(statusId), this.kanbanFetchPerPage);
        },
        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await ProjectController.batchUpdateStatus({ ids, statusId });
                await this.$store.dispatch('invalidateCache', { type: 'projects' });
                await this.$store.dispatch('loadProjects');
                await this.fetchItems(this.data?.currentPage ?? 1, true);
                this.showNotification(this.$t('statusUpdated'), "", false);
                if (this.editingItem && ids.includes(this.editingItem.id)) {
                    this.refreshTimelineIfVisible();
                }
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
            this.resetTimelineSidebar();
            this.modalDialog = true;
            this.editingItem = item;
        },
        onProjectFilesUpdated(files) {
            if (this.editingItem) {
                this.editingItem.files = files;
            }
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Projects' });
            }
        },

        getCurrentItems() {
            return this.displayViewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
        },
        handleProjectMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const project = this.getCurrentItems().find(p => Number(p.id) === Number(updateData.orderId));
                    if (project && project.statusId == updateData.statusId) {
                        return;
                    }
                    if (project) {
                        project.statusId = updateData.statusId != null ? Number(updateData.statusId) : updateData.statusId;
                        const status = this.statuses.find(s => Number(s.id) === Number(updateData.statusId));
                        if (status) {
                            project.status = status;
                            project.statusName = translateProjectStatus(status.name, this.$t);
                        }
                    }

                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    this.syncKanbanOrdersStable();
                    this.debouncedStatusUpdate();
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors.join("\n"), true);
                this.fetchItems(this.data?.currentPage ?? 1, true);
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
                    statusId
                }).catch(error => {
                    const errors = this.getApiErrorMessage(error);
                    this.showNotification(this.$t('error'), errors.join("\n"), true);
                    this.fetchItems(this.data?.currentPage ?? 1, true);
                });
                promises.push(promise);
            });

            Promise.all(promises).then(async () => {
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
        projectCardTitlePrefix() {
            return '<i class="fas fa-folder text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        projectCardMapper(item, fieldName) {
            if (!item) return '';
            switch (fieldName) {
                case 'title':
                    return `${this.$t('number')}${this.$t('symbolEmDash')}${item.id ?? ''}`;
                case 'name':
                    return item.name ?? '';
                case 'statusName': {
                    const statusName = item.status?.name || item.statusName;
                    return statusName ? translateProjectStatus(statusName, this.$t) : '';
                }
                case 'client': {
                    if (!item.client) return '';
                    const search = this.searchQuery?.trim();
                    const searchActive = search && search.length >= 3;
                    const name = item.client.name || '';
                    if (searchActive && name) {
                        return highlightMatches(name, search);
                    }
                    return name;
                }
                default:
                    return this.itemMapper(item, fieldName) ?? '';
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
        isDataReady() {
            return this.data != null && !this.loading;
        },
        paginationData() {
            if (!this.data) return null;
            return {
                currentPage: this.data.currentPage,
                lastPage: this.data.lastPage,
                perPage: this.perPage,
                perPageOptions: this.perPageOptions
            };
        },
        cardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: true,
                paginationData: this.paginationData,
                onPageChange: this.fetchItems,
                onPerPageChange: this.handlePerPageChange,
            };
        },
        cardConfigBase() {
            const rows = [
                { name: 'title', label: null },
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'statusName', label: 'projectStatus', icon: 'fas fa-flag text-[#3571A4]' },
                { name: 'client', label: 'client', icon: 'fas fa-user text-[#3571A4]', html: true },
                { name: 'description', label: 'description', icon: 'fas fa-align-left text-[#3571A4]' },
            ];
            if (this.canViewProjectBudget) {
                rows.push({ name: 'budget', label: 'budget', icon: 'fas fa-coins text-[#3571A4]', html: true, slot: 'footer' });
            }
            return rows;
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
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
    watch: {
        displayViewMode: {
            handler(newMode, oldMode) {
                if (oldMode === undefined) {
                    return;
                }
                this.loading = true;

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
}
</script>

<style scoped>
.kanban-view-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.kanban-view-container .kanban-board-area {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
</style>