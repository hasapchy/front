<template>
  <div class="layout-flex-fill-col">
    <transition name="fade" mode="out-in">
      <CardListViewShell
        v-if="isDataReady && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="projectsCardsToolbar"
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
                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-kanban="true"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #filters-desktop>
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
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
                    :on-reset="resetColumns"
                  >
                    <TableColumnDateModeSection
                      :items="dateColumnsForSettings(columns)"
                      :resolve-mode="resolveColumnDateMode"
                      @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)"
                    />
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
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
                          @click="toggleVisible(index)"
                        >
                          <div class="space-x-2 flex flex-row justify-between w-full select-none items-center">
                            <div class="min-w-0">
                              <i
                                class="text-sm mr-2 text-[var(--color-info)]"
                                :class="[element.visible ? 'fas fa-circle-check' : 'far fa-circle']"
                              />
                              {{ $te(element.label) ? $t(element.label) : element.label }}
                            </div>
                            <div class="flex items-center gap-1">
                              <i class="fas fa-grip-vertical text-gray-300 text-sm cursor-grab" />
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
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="true"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-filters-desktop>
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
            card-layout="entity"
            title-field="name"
            title-subtitle-field="idSubtitle"
            :entity="projectEntityCard"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('projects_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>

      <div v-else-if="displayViewMode === 'kanban'" key="kanban-view" class="kanban-view-container">
        <TableControlsBar :show-pagination="false">
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
            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #filters-desktop>
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
          </template>
          <template #right-after>
            <CardFieldsGearMenu
              :card-fields="cardFields"
              :on-reset="resetCardFields"
              @toggle="toggleCardFieldVisible"
            />
          </template>
        </TableControlsBar>
        <div class="kanban-board-area">
          <KanbanBoard
            :orders="allKanbanItems"
            :statuses="statuses"
            :selected-ids="selectedIds"
            :loading="kanbanBoardLoading"
            :is-project-mode="true"
            :entity-card="projectKanbanEntityCard"
            :status-meta="kanbanByStatus"
            @order-moved="handleProjectMoved"
            @card-dblclick="onItemClick"
            @card-select-toggle="toggleSelectRow"
            @column-select-toggle="handleColumnSelectToggle"
            @load-more="loadMoreKanbanItems($event)"
          />
        </div>
      </div>

      <div v-else key="loader" class="min-h-64">
        <TableSkeleton v-if="displayViewMode === 'table'" />
        <CardsSkeleton
          v-else-if="displayViewMode === 'cards'"
          layout="entity"
        />
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
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import KanbanBoard from '@/views/components/app/kanban/KanbanBoard.vue';
import ProjectController from '@/api/ProjectController';
import { formatCurrencyForDisplay, formatNumberForDisplay } from '@/utils/numberUtils';
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
import DateUserCell from '@/views/components/app/buttons/DateUserCell.vue';
import { buildDateUserCellProps } from '@/utils/userCellUtils';
import ProjectChatButtonCell from '@/views/components/app/buttons/ProjectChatButtonCell.vue';
import { hasChatsViewPermission } from '@/utils/projectChat';
import { markRaw } from 'vue';
import debounce from 'lodash.debounce';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';
import { translateProjectStatus } from '@/utils/translationUtils';
import { normalizeKanbanStatuses } from '@/utils/kanbanUtils';
import {
    createEntityCardOptions,
    createEntityStatusPillForItem,
    entityChip,
    entityHeroCompact,
    entityStandardFooter,
    ENTITY_CHIP_ICON,
    mapEntityChip,
    mapEntityClientChip,
    mapEntityIdSubtitle,
    resolveEntityCardField,
} from '@/utils/entityCardUtils';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import ProjectFilters from '@/views/components/projects/ProjectFilters.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';

import listQueryMixin from '@/mixins/listQueryMixin';
import filterPresetsMixin from '@/mixins/filterPresetsMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { FILTER_PRESET_SOURCE_PROJECTS } from '@/constants/filterPresetSources';

const projectsViewModeMixin = createStoreViewModeMixin({
  getter: 'projectsViewMode',
  dispatch: 'setProjectsViewMode',
  modes: ['table', 'kanban', 'cards'],
});

export default {
  components: {
    PrimaryButton,
    SideModalDialog,
    DraggableTable,
    TableControlsBar,
    KanbanBoard,
    ProjectCreatePage,
    BatchButton,
    AlertDialog,
    TableFilterButton,
    TableColumnDateModeSection,
    ViewModeToggle,
    ProjectFilters,
    TableSkeleton,
    CardsSkeleton,
    MapperCardGrid,
    CardListViewShell,
    CardFieldsGearMenu,
    TimelinePanel: TimelinePanelAsync,
    draggable: VueDraggableNext,
  },
  mixins: [
    modalMixin,
    notificationMixin,
    crudEventMixin,
    batchActionsMixin,
    getApiErrorMessageMixin,
    companyChangeMixin,
    storeDataLoaderMixin,
    kanbanByStatusMixin,
    listQueryMixin,
    filterPresetsMixin,
    projectsViewModeMixin,
    cardFieldsVisibilityMixin,
    timelineSideModalMixin,
    timelineUnreadMixin,
    tableColumnDateModeMixin,
  ],
  data() {
    return {
      tableColumnsPersistKey: 'admin.projects',
      filterPresetSource: FILTER_PRESET_SOURCE_PROJECTS,
      cardFieldsKey: 'admin.projects.cards',
      titleField: 'name',
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
    };
  },
  created() {
    this.$store.commit('SET_SETTINGS_OPEN', false);
  },

  async mounted() {
    eventBus.on('global-search', this.handleSearch);
    await this.fetchProjectStatuses();
    if (!this.$store.getters.clients?.length) {
      await this.$store.dispatch('loadClients');
    }
    this.syncFilterClients();

    await this.waitForFilterPresetsInitialization();
    if (!this._filterPresetsTriggeredListFetch) {
      await this.fetchItems();
    }
    eventBus.on('cache:invalidate', this.handleCacheInvalidate);
  },
  beforeUnmount() {
    eventBus.off('cache:invalidate', this.handleCacheInvalidate);
    eventBus.off('global-search', this.handleSearch);
  },
  methods: {
    syncFilterClients() {
      this.clients = this.$store.getters.clients || [];
    },
    formatProjectBudget(item) {
      const code = item?.currency?.code || item?.currencyCode;
      const budget = item?.budget ?? 0;
      if (item?.currencyId && code) {
        return formatCurrencyForDisplay(budget, code, true);
      }
      return formatNumberForDisplay(budget, true);
    },
    itemMapper(i, c) {
      const search = this.searchQuery?.trim();
      const searchActive = search && search.length >= 3;
      switch (c) {
        case 'users':
          return `${i.users?.length || 0} ${this.$t('users')}`;
        case 'budget':
          if (typeof i.getBudgetDisplay === 'function') {
            return i.getBudgetDisplay();
          }
          return this.formatProjectBudget(i);
        case 'createdAt':
          return i.formatCreatedAt?.();
        case 'dateUser':
          return `${i.formatDate?.()} / ${i.creator?.name}`;
        case 'description':
          return i.description || 'Не указано';
        case 'id':
          return `${searchActive ? highlightMatches(String(i.id ?? ''), search) : (i.id ?? '')}${this.timelineUnreadBadgeHtml(i.id)}`;
        case 'name':
          return searchActive && i.name ? highlightMatches(i.name, search) : (i.name ?? '');
        default:
          return i[c];
      }
    },
    refetchList(page = 1, silent = false) {
      return this.fetchItems(page, silent);
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      this.selectedIds = [];
      this.pendingStatusUpdates.clear();
      this.resetKanbanPagination();
      await this.waitForFilterPresetsInitialization();
    },
    async fetchProjectStatuses() {
      await this.loadStoreData({
        getterName: 'projectStatuses',
        dispatchName: 'loadProjectStatuses',
        localProperty: 'statuses',
        defaultValue: [],
        transform: normalizeKanbanStatuses,
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
          const kanbanItems = this.allKanbanItems || [];
          await this.fetchTimelineUnreadCounts('project', kanbanItems.map(item => item.id));
          this.applyTimelineUnreadCounts(kanbanItems);
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
        const items = this.data?.items || [];
        await this.fetchTimelineUnreadCounts('project', items.map(item => item.id));
        this.applyTimelineUnreadCounts(items);
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
        this.showNotification(this.$t('statusUpdated'), '', false);
        if (this.editingItem && ids.includes(this.editingItem.id)) {
          this.refreshTimelineIfVisible();
        }
        this.selectedIds = [];
      } catch (error) {
        this.showNotification(this.$t('errorUpdatingStatus'), this.getApiErrorMessage(error), true);
      }
      this.loading = false;
    },
    async resetFilters() {
      this.$store.dispatch('setSearchQuery', '');
      await this.resetFiltersToSystemDefaults(() => {
        this.fetchItems(1);
      });
    },
    applyFilters() {
      this.fetchItems(1);
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.statusFilter, defaultValue: '' },
        { value: this.clientFilter, defaultValue: '' },
      ]);
    },
    async toggleTimeline() {
      const willOpen = this.timelineCollapsed;
      timelineSideModalMixin.methods.toggleTimeline.call(this);
      if (!willOpen || !this.editingItem?.id) {
        return;
      }
      await this.markTimelineEntityAsRead('project', this.editingItem.id);
      this.applyTimelineUnreadCounts(this.data?.items || []);
      this.applyTimelineUnreadCounts(this.allKanbanItems || []);
    },
    showModal(item = null) {
      this.resetTimelineSidebar();
      this.modalDialog = true;
      this.editingItem = item;
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
        this.showNotification(this.$t('error'), errors.join('\n'), true);
        this.fetchItems(this.data?.currentPage ?? 1, true);
      }
    },

    debouncedStatusUpdate: debounce(async function () {
      if (this.pendingStatusUpdates.size === 0) return;

      const updatesByStatus = new Map();
      this.pendingStatusUpdates.forEach((statusId, projectId) => {
        if (!updatesByStatus.has(statusId)) {
          updatesByStatus.set(statusId, []);
        }
        updatesByStatus.get(statusId).push(projectId);
      });

      this.pendingStatusUpdates.clear();

      const updateStatus = async (projectIds, statusId) => {
        try {
          await ProjectController.batchUpdateStatus({ ids: projectIds, statusId });
        } catch (error) {
          const errors = this.getApiErrorMessage(error);
          this.showNotification(this.$t('error'), errors.join('\n'), true);
          this.fetchItems(this.data?.currentPage ?? 1, true);
        }
      };

      const promises = [];
      updatesByStatus.forEach((projectIds, statusId) => {
        promises.push(updateStatus(projectIds, statusId));
      });

      await Promise.all(promises);
      await this.$store.dispatch('loadProjects');
      this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
    }, 500),

    toggleSelectRow(id) {
      const index = this.selectedIds.indexOf(id);
      if (index > -1) {
        this.selectedIds.splice(index, 1);
      } else {
        this.selectedIds.push(id);
      }
    },
    timelineUnreadBadgeHtml(entityId) {
      const count = this.getTimelineUnreadCount(entityId);
      if (count <= 0) {
        return '';
      }
      return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
    },
    projectCardMapper(item, fieldName) {
      if (!item) {
        return '';
      }
      return resolveEntityCardField(item, fieldName, {
        idSubtitle: () => mapEntityIdSubtitle(item.id),
        name: () => item.name ?? '',
        statusName: () => {
          const statusName = item.status?.name || item.statusName;
          return statusName ? translateProjectStatus(statusName, this.$t) : '';
        },
        description: () => item.description || '',
        client: () => mapEntityClientChip(item.client),
        budget: () => this.formatProjectBudget(item),
      }, (name) => this.itemMapper(item, name) ?? '');
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
    projectsCardsToolbar() {
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
        perPageOptions: this.perPageOptions,
      };
    },
    cardConfigBase() {
      const rows = [
        entityHeroCompact('description'),
        entityChip('client', ENTITY_CHIP_ICON.client),
        ...entityStandardFooter('statusName', 'budget', {
          withPayment: false,
          amountOptions: { html: true },
        }),
      ];
      if (!this.canViewProjectBudget) {
        return rows.filter((field) => field.name !== 'budget');
      }
      return rows;
    },
    projectEntityCard() {
      return createEntityCardOptions({
        statusPill: createEntityStatusPillForItem({
          statuses: this.statuses,
          translateStatus: (name) => translateProjectStatus(name, this.$t),
          onChange: (item, statusId) => this.handleChangeStatus([item.id], statusId),
        }),
        headerSuffix: (item) => this.timelineUnreadBadgeHtml(item?.id),
      });
    },
    cardConfigMerged() {
      return (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
    },
    projectKanbanEntityCard() {
      return {
        cardConfig: this.cardConfigMerged.filter((field) => field.name !== 'statusName'),
        cardMapper: this.projectCardMapper,
        entity: {
          ...this.projectEntityCard,
          statusPill: null,
          showAccent: false,
        },
        titleField: 'name',
        titleSubtitleField: 'idSubtitle',
        showCheckbox: this.$store.getters.hasPermission('projects_delete'),
      };
    },
    columnsConfig() {
      const q = this.searchQuery?.trim();
      return [
        { name: 'select', label: '#', size: 15 },
        { name: 'id', label: 'number', size: 60, html: true },
        {
          name: 'dateUser',
          label: 'dateUser',
          type: 'datetime',
          component: markRaw(DateUserCell),
          props: (item, column) => buildDateUserCellProps(item, this.searchQuery?.trim?.()?.length >= 3 ? this.searchQuery : '', column?.dateDisplayMode),
        },
        { name: 'statusName', label: 'projectStatus', component: markRaw(StatusSelectCell), props: (i) => ({ value: i.statusId, statuses: this.statuses, onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) }) },
        {
          name: 'client',
          label: 'client',
          component: markRaw(ClientButtonCell),
          props: (item) => ({ client: item.client, searchQuery: (q && q.length >= 3) ? q : null }),
        },
        ...(this.canViewProjectBudget ? [{ name: 'budget', label: 'budget', html: true }] : []),
        { name: 'name', label: 'name', html: true },
        ...(hasChatsViewPermission(this.$store.getters)
          ? [{
              name: 'projectChat',
              label: 'projectChat',
              size: 48,
              component: markRaw(ProjectChatButtonCell),
              props: (item) => ({ projectId: item.id }),
            }]
          : []),
      ];
    },
  },
  watch: {
    '$store.state.clients'() {
      this.syncFilterClients();
    },
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
      immediate: false,
    },
    '$route.params.id': {
      immediate: true,
      handler(value) {
        this.handleRouteItem(value);
      },
    },
  },
};
</script>
