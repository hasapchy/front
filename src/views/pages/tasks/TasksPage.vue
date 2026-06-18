<template>
  <div class="layout-flex-fill-col">
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="data && !loading && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="tasksCardsToolbar"
      >
        <template #table>
        <DraggableTable
          table-key="admin.tasks"
          :columns-config="columnsConfig"
          :table-data="data.items" 
          :item-mapper="itemMapper"
          :on-item-click="onItemClick"
          @selection-change="selectedIds = $event"
        >
          <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
            <TableControlsBar
              :show-pagination="true"
              :pagination-data="data ? { currentPage: data.currentPage, lastPage: data.lastPage, perPage: perPage, perPageOptions: perPageOptions } : null"
              :on-page-change="fetchItems"
              :on-per-page-change="handlePerPageChange"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton 
                  :onclick="openQuickCreateDialog" 
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('tasks_create')"
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
                <FiltersContainer
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @reset="resetFilters"
                  @apply="applyFilters"
                >
                  <div>
                    <label class="filters-modal-label">{{ $t('status') }}</label>
                    <select
                      v-model="statusFilter"
                      class="w-full"
                    >
                      <option value="all">
                        {{ $t('allStatuses') }}
                      </option>
                      <option
                        v-for="status in taskStatuses"
                        :key="status.id"
                        :value="status.id"
                      >
                        {{ translateTaskStatus(status.name, $t) }}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="filters-modal-label">{{ $t('dateFilter') }}</label>
                    <select
                      v-model="dateFilter"
                      class="w-full"
                    >
                      <option value="all_time">
                        {{ $t('allTime') }}
                      </option>
                      <option value="today">
                        {{ $t('today') }}
                      </option>
                      <option value="yesterday">
                        {{ $t('yesterday') }}
                      </option>
                      <option value="this_week">
                        {{ $t('thisWeek') }}
                      </option>
                      <option value="this_month">
                        {{ $t('thisMonth') }}
                      </option>
                      <option value="last_week">
                        {{ $t('lastWeek') }}
                      </option>
                      <option value="last_month">
                        {{ $t('lastMonth') }}
                      </option>
                      <option value="custom">
                        {{ $t('selectDates') }}
                      </option>
                    </select>
                  </div>
                                
                  <div
                    v-if="dateFilter === 'custom'"
                    class="space-y-2"
                  >
                    <div>
                      <label class="filters-modal-label">{{ $t('startDate') }}</label>
                      <input
                        v-model="startDate"
                        type="date"
                        class="w-full"
                      >
                    </div>
                    <div>
                      <label class="filters-modal-label">{{ $t('endDate') }}</label>
                      <input
                        v-model="endDate"
                        type="date"
                        class="w-full"
                      >
                    </div>
                  </div>
                </FiltersContainer>
              </template>

              <template #gear="{ resetColumns, columns, toggleVisible, log }">
                <TableFilterButton
                  v-if="displayViewMode === 'table'"
                  :on-reset="resetColumns"
                >
                  <TableColumnDateModeSection :items="dateColumnsForSettings(columns)"
                    :resolve-mode="resolveColumnDateMode"
                    @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)" />
                  <ul>
                    <draggable
                      v-if="columns && columns.length"
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
                        <div class="space-x-2 flex flex-row justify-between w-full select-none">
                          <div>
                            <i
                              class="text-sm mr-2 text-[var(--color-info)]"
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
            </TableControlsBar>
          </template>
        </DraggableTable>
        </template>
        <template #card-bar-left>
          <PrimaryButton
            :onclick="openQuickCreateDialog"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('tasks_create')"
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
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="filters-modal-label">{{ $t('status') }}</label>
              <select
                v-model="statusFilter"
                class="w-full"
              >
                <option value="all">
                  {{ $t('allStatuses') }}
                </option>
                <option
                  v-for="status in taskStatuses"
                  :key="status.id"
                  :value="status.id"
                >
                  {{ translateTaskStatus(status.name, $t) }}
                </option>
              </select>
            </div>
            <div>
              <label class="filters-modal-label">{{ $t('dateFilter') }}</label>
              <select
                v-model="dateFilter"
                class="w-full"
              >
                <option value="all_time">
                  {{ $t('allTime') }}
                </option>
                <option value="today">
                  {{ $t('today') }}
                </option>
                <option value="yesterday">
                  {{ $t('yesterday') }}
                </option>
                <option value="this_week">
                  {{ $t('thisWeek') }}
                </option>
                <option value="this_month">
                  {{ $t('thisMonth') }}
                </option>
                <option value="last_week">
                  {{ $t('lastWeek') }}
                </option>
                <option value="last_month">
                  {{ $t('lastMonth') }}
                </option>
                <option value="custom">
                  {{ $t('selectDates') }}
                </option>
              </select>
            </div>
            <div
              v-if="dateFilter === 'custom'"
              class="space-y-2"
            >
              <div>
                <label class="filters-modal-label">{{ $t('startDate') }}</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full"
                >
              </div>
              <div>
                <label class="filters-modal-label">{{ $t('endDate') }}</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full"
                >
              </div>
            </div>
          </FiltersContainer>
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
            :card-mapper="taskCardMapper"
            card-layout="entity"
            title-field="title"
            title-subtitle-field="idSubtitle"
            :entity="taskEntityCard"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('tasks_delete_all')"
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
          :show-pagination="false"
        >
          <template #left>
            <PrimaryButton 
              :onclick="openQuickCreateDialog" 
              icon="fas fa-plus"
              :disabled="!$store.getters.hasPermission('tasks_create')"
            />
            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #filters-desktop>
            <FiltersContainer
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @reset="resetFilters"
              @apply="applyFilters"
            >
              <div>
                <label class="filters-modal-label">{{ $t('status') }}</label>
                <select
                  v-model="statusFilter"
                  class="w-full"
                >
                  <option value="all">
                    {{ $t('allStatuses') }}
                  </option>
                  <option
                    v-for="status in taskStatuses"
                    :key="status.id"
                    :value="status.id"
                  >
                    {{ translateTaskStatus(status.name, $t) }}
                  </option>
                </select>
              </div>

              <div>
                <label class="filters-modal-label">{{ $t('dateFilter') }}</label>
                <select
                  v-model="dateFilter"
                  class="w-full"
                >
                  <option value="all_time">
                    {{ $t('allTime') }}
                  </option>
                  <option value="today">
                    {{ $t('today') }}
                  </option>
                  <option value="yesterday">
                    {{ $t('yesterday') }}
                  </option>
                  <option value="this_week">
                    {{ $t('thisWeek') }}
                  </option>
                  <option value="this_month">
                    {{ $t('thisMonth') }}
                  </option>
                  <option value="last_week">
                    {{ $t('lastWeek') }}
                  </option>
                  <option value="last_month">
                    {{ $t('lastMonth') }}
                  </option>
                  <option value="custom">
                    {{ $t('selectDates') }}
                  </option>
                </select>
              </div>
                        
              <div
                v-if="dateFilter === 'custom'"
                class="space-y-2"
              >
                <div>
                  <label class="filters-modal-label">{{ $t('startDate') }}</label>
                  <input
                    v-model="startDate"
                    type="date"
                    class="w-full"
                  >
                </div>
                <div>
                  <label class="filters-modal-label">{{ $t('endDate') }}</label>
                  <input
                    v-model="endDate"
                    type="date"
                    class="w-full"
                  >
                </div>
              </div>
            </FiltersContainer>
          </template>
          <template #right-after>
            <CardFieldsGearMenu
              :card-fields="cardFields"
              :on-reset="resetCardFields"
              @toggle="toggleCardFieldVisible"
            />
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
            :loading="kanbanBoardLoading"
            :is-task-mode="true"
            :entity-card="taskKanbanEntityCard"
            :status-meta="kanbanByStatus"
            @order-moved="handleTaskMoved"
            @card-dblclick="onItemClick"
            @card-select-toggle="toggleSelectRow"
            @column-select-toggle="handleColumnSelectToggle"
            @status-updated="fetchItems"
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
      :title="sideModalCrudTitle('sideModalGenTask', 'sideModalNomTask')"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <TaskCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-task'"
        ref="taskForm"
        :editing-item="editingItem"
        :initial-draft="taskCreateDraft"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal" 
        @update:editing-item="editingItem = $event"
        @initial-draft-applied="taskCreateDraft = null"
      />

      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'task'"
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
    <CenteredModalDialog
      :show-form="quickCreateDialog"
      :title="$t('taskQuickCreateTitle')"
      overlay-class="z-[130]"
      panel-class="max-w-lg"
      :onclose="closeQuickCreateDialog"
    >
      <TaskQuickCreateForm
        ref="quickTaskForm"
        @saved="handleQuickCreated"
        @open-full-form="openFullFormFromQuick"
      />
      <template #footer>
        <PrimaryButton :is-light="true" :onclick="closeQuickCreateDialog">
          {{ $t('cancel') }}
        </PrimaryButton>
        <PrimaryButton :onclick="openFullFormFromQuickRequest">
          {{ $t('taskOpenFullForm') }}
        </PrimaryButton>
        <PrimaryButton
          icon="fas fa-save"
          :onclick="saveQuickTask"
          :is-loading="quickSaveLoading"
        >
          {{ $t('save') }}
        </PrimaryButton>
      </template>
    </CenteredModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
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
import { formatDatabaseDateTime, formatDatabaseDate, getCurrentServerDate, getCurrentServerStartOfDay, formatServerDateFromObject } from '@/utils/dateUtils';
import { highlightMatches } from '@/utils/searchUtils';
import kanbanByStatusMixin from "@/mixins/kanbanByStatusMixin";
import {
    entityHeaderDeadline,
    entityHero,
    entityHeroAssignees,
    entityFooterCorner,
    entityMeta,
    entityFooterStatus,
    mapEntityIdSubtitle,
    resolveEntityCardField,
    createEntityCardOptions,
    createEntityStatusPillForItem,
    resolveStatusAccentColor,
} from '@/utils/entityCardUtils';
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { markRaw } from 'vue';
import UserButtonCell from '@/views/components/app/buttons/UserButtonCell.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import timelineUnreadMixin from '@/mixins/timelineUnreadMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import debounce from 'lodash.debounce';
import { translateTaskStatus } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import CenteredModalDialog from '@/views/components/app/dialog/CenteredModalDialog.vue';
import TaskQuickCreateForm from '@/views/pages/tasks/TaskQuickCreateForm.vue';

import listQueryMixin from "@/mixins/listQueryMixin";
import { createStoreViewModeMixin } from "@/mixins/storeViewModeMixin";

const tasksViewModeMixin = createStoreViewModeMixin({
    getter: "tasksViewMode",
    dispatch: "setTasksViewMode",
    modes: ["table", "kanban", "cards"],
});

export default {
    components: { 
        PrimaryButton, 
        SideModalDialog, 
        DraggableTable, 
        KanbanBoard, 
        TaskCreatePage, 
        BatchButton, 
        AlertDialog, 
        TableControlsBar, 
        TableFilterButton,
        TableColumnDateModeSection,
        FiltersContainer, 
        TimelinePanel: TimelinePanelAsync,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        CenteredModalDialog,
        TaskQuickCreateForm,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, kanbanByStatusMixin, tasksViewModeMixin, cardFieldsVisibilityMixin, timelineSideModalMixin, timelineUnreadMixin, tableColumnDateModeMixin],
    data() {
        return {
            tableColumnsPersistKey: 'admin.tasks',
            cardFieldsKey: 'admin.tasks.cards',
            titleField: 'title',
            statusFilter: 'all',
            dateFilter: 'all_time',
            startDate: '',
            endDate: '',
            pendingStatusUpdates: new Map(),
            statuses: [],
            kanbanErrorMessage: 'errorGettingTaskList',
            controller: TaskController,
            cacheInvalidationType: 'tasks',
            itemViewRouteName: 'TaskView',
            baseRouteName: 'Tasks',
            errorGettingItemText: this.$t('errorGettingTask'),
            savedSuccessText: this.$t('taskSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingTask'),
            deletedSuccessText: this.$t('taskSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingTask'),
            deletePermission: 'tasks_delete_all',
            quickCreateDialog: false,
            quickSaveLoading: false,
            taskCreateDraft: null,
        }
    },
    computed: {
        taskStatuses() {
            return this.$store.getters.taskStatuses || [];
        },
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                { name: 'title', label: 'title', sortable: true },
                { 
                    name: 'status', 
                    label: 'status', 
                    component: markRaw(StatusSelectCell), 
                    props: (i) => ({
                        value: i.statusId || (i.status?.id),
                        statuses: this.statuses,
                        onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId),
                    }), 
                },
                {
                    name: 'creator',
                    label: 'creator',
                    sortable: false,
                    component: markRaw(UserButtonCell),
                    props: (i) => ({ user: i.creator, searchQuery: this.searchQuery }),
                },
                { name: 'description', label: 'description', sortable: false, visible: true },
                {
                    name: 'supervisor',
                    label: 'supervisor',
                    sortable: false,
                    component: markRaw(UserButtonCell),
                    props: (i) => ({ user: i.supervisor, searchQuery: this.searchQuery }),
                },
                {
                    name: 'executor',
                    label: 'executor',
                    sortable: false,
                    component: markRaw(UserButtonCell),
                    props: (i) => ({ user: i.executor, searchQuery: this.searchQuery }),
                },
                {
                    name: 'observers',
                    label: 'taskObservers',
                    sortable: false,
                },
                { name: 'deadline', label: 'deadline', sortable: true },
                { name: 'createdAt', label: 'createdAt', sortable: true },
            ];
        },
        hasActiveFilters() {
            return this.statusFilter !== 'all' || this.dateFilter !== 'all_time';
        },
        tasksCardsToolbar() {
            return {
                showFilters: true,
                hasActiveFilters: this.hasActiveFilters,
                activeFiltersCount: this.getActiveFiltersCount(),
                onFiltersReset: this.resetFilters,
                showPagination: false,
            };
        },
        cardConfigBase() {
            return [
                entityHeaderDeadline('deadline'),
                entityHero('description', { lineClamp: 3 }),
                entityHeroAssignees('assignees', { label: 'taskAssignees' }),
                entityFooterCorner('priorityComplexity', { reserveEmpty: true, label: 'priority' }),
                entityMeta('checklist', 'checklist'),
                entityFooterStatus('statusName'),
            ];
        },
        taskEntityCard() {
            return createEntityCardOptions({
                accentColor: (item) => resolveStatusAccentColor(item, this.statuses),
                headerSuffix: (item) => this.timelineUnreadBadgeHtml(item?.id),
                headerCreator: () => null,
                statusPill: createEntityStatusPillForItem({
                    statuses: this.statuses,
                    translateStatus: (name) => translateTaskStatus(name, this.$t),
                    onChange: (item, statusId) => this.handleChangeStatus([item.id], statusId),
                }),
            });
        },
        cardConfigMerged() {
            return (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
        },
        taskKanbanEntityCard() {
            return {
                cardConfig: this.cardConfigMerged.filter((field) => field.name !== 'statusName'),
                cardMapper: this.taskCardMapper,
                entity: {
                    ...this.taskEntityCard,
                    statusPill: null,
                    showAccent: false,
                },
                titleField: 'title',
                titleSubtitleField: 'idSubtitle',
                showCheckbox: this.$store.getters.hasPermission('tasks_delete_all'),
            };
        },
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
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
    },
    async mounted() {
        await this.fetchTaskStatuses();
        await this.fetchItems();
    },
    methods: {
        openQuickCreateDialog() {
            this.quickCreateDialog = true;
        },
        closeQuickCreateDialog() {
            this.quickCreateDialog = false;
        },
        async saveQuickTask() {
            if (this.quickSaveLoading) {
                return;
            }
            this.quickSaveLoading = true;
            try {
                await this.$refs.quickTaskForm?.saveQuick?.();
            } finally {
                this.quickSaveLoading = false;
            }
        },
        openFullFormFromQuickRequest() {
            const draft = this.$refs.quickTaskForm?.getDraftPayload?.();
            this.openFullFormFromQuick(draft);
        },
        openFullFormFromQuick(draft) {
            this.taskCreateDraft = draft || null;
            this.quickCreateDialog = false;
            this.showModal(null);
        },
        async handleQuickCreated() {
            this.quickCreateDialog = false;
            await this.fetchItems(this.getListCurrentPage(), true);
            this.showNotification(this.$t('success'), this.$t('taskSuccessfullyAdded'), false);
        },
        formatDatabaseDateTime(date) {
            try {
                return formatDatabaseDateTime(date);
            } catch (error) {
                console.error('Ошибка форматирования даты:', error, date);
                return date ;
            }
        },
        formatDatabaseDate(date) {
            try {
                return formatDatabaseDate(date);
            } catch (error) {
                console.error('Ошибка форматирования даты:', error, date);
                return date ;
            }
        },
        translateTaskStatus,
        async handleRouteItem(id) {
            if (!id) {
                if (this.modalDialog) {
                    this.closeModal();
                }
                this.editingItem = null;
                return;
            }
            const itemId = Number(id);
            if (!itemId) {
                const baseRouteName = this.baseRouteName
                    || (this.itemViewRouteName ? this.itemViewRouteName.replace('View', '') : null);
                if (baseRouteName) {
                    this.$router.replace({ name: baseRouteName });
                }
                return;
            }
            if (this._openingTaskId === itemId) {
                return;
            }
            if (this.modalDialog && Number(this.editingItem?.id) === itemId) {
                return;
            }
            return modalMixin.methods.handleRouteItem.call(this, id);
        },
        beforeShowModal() {
            this._taskItemPreloaded = true;
        },
        async showModal(item = null) {
            this.resetTimelineSidebar();
            this.savedScrollPosition = window.pageYOffset ?? document.documentElement.scrollTop;
            this.shouldRestoreScrollOnClose = true;
            this.showTimeline = true;

            const skipFetch = this._taskItemPreloaded;
            this._taskItemPreloaded = false;

            const openingId = item?.id ? Number(item.id) : null;
            if (openingId) {
                this._openingTaskId = openingId;
            }

            try {
                let resolvedItem = item;
                if (item?.id && !skipFetch) {
                    try {
                        const fullTask = await TaskController.getItem(item.id);
                        if (fullTask?.id) {
                            resolvedItem = fullTask;
                        }
                    } catch (error) {
                        console.error('Ошибка при загрузке задачи:', error);
                    }
                }

                this.editingItem = resolvedItem?.id ? resolvedItem : (item?.id ? item : null);
                this.modalDialog = true;
            } finally {
                if (openingId && this._openingTaskId === openingId) {
                    this._openingTaskId = null;
                }
            }
        },
        async toggleTimeline() {
            const willOpen = this.timelineCollapsed;
            timelineSideModalMixin.methods.toggleTimeline.call(this);
            if (!willOpen || !this.editingItem?.id) {
                return;
            }
            await this.markTimelineEntityAsRead('task', this.editingItem.id);
            this.applyTimelineUnreadCounts(this.data?.items || []);
            this.applyTimelineUnreadCounts(this.allKanbanItems || []);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
            this.editingItem = null;
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Tasks' });
            }
        },
        
        async fetchTaskStatuses() {
            try {
                await this.$store.dispatch('loadTaskStatuses');
                this.statuses = this.$store.getters.taskStatuses || [];
            } catch (error) {
                console.error('Error fetching task statuses:', error);
                this.statuses = [];
            }
        },
        itemMapper(i, c) {
            const search = this.searchQuery;
            switch (c) {
                case 'id':
                    return `${i.id ?? ''}${this.timelineUnreadBadgeHtml(i.id)}`;
                case 'title': {
                    const title = i.title ;
                    return search ? highlightMatches(title, search) : title;
                }
                case 'description':
                    return i.description ;
                case 'creator':
                    return i.creator?.name ;
                case 'supervisor':
                    return i.supervisor?.name ;
                case 'executor':
                    return i.executor?.name ;
                case 'observers':
                    return i.getObserverNames?.() || '';
                case 'deadline':
                    return i.deadline ? this.formatDatabaseDateTime(i.deadline) : '';
                case 'createdAt':
                    return i.createdAt ? this.formatDatabaseDate(i.createdAt) : '';
                default:
                    return i[c];
            }
        },
        timelineUnreadBadgeHtml(entityId) {
            const count = this.getTimelineUnreadCount(entityId);
            if (count <= 0) {
                return '';
            }
            return `<span class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white">${count}</span>`;
        },
        taskStatusPlain(item) {
            if (!item) {
                return '—';
            }
            let st = item.status;
            if (!st && item.statusId) {
                st = this.statuses.find((s) => s.id === item.statusId)
                    || this.taskStatuses.find((s) => s.id === item.statusId);
            }
            return st?.name ? translateTaskStatus(st.name, this.$t) : '—';
        },
        getChecklistItems(checklist) {
            if (!checklist) {
                return [];
            }
            let items = checklist;
            if (!Array.isArray(checklist)) {
                try {
                    items = JSON.parse(String(checklist));
                } catch {
                    return [];
                }
            }
            return Array.isArray(items) ? items : [];
        },
        mapChecklistPreview(item) {
            const items = this.getChecklistItems(item?.checklist);
            if (!items.length) {
                return '';
            }
            const completed = items.filter((entry) => entry.completed).length;
            const preview = items
                .slice(0, 3)
                .map((entry) => {
                    const text = entry.text ?? '';
                    const strike = entry.completed ? 'line-through text-gray-400' : '';
                    return `<div class="truncate ${strike}">${text}</div>`;
                })
                .join('');
            const more = items.length > 3
                ? `<div class="text-xs text-gray-500 italic">+${items.length - 3} ${this.$t('more')}</div>`
                : '';
            return `<div class="text-xs"><span class="font-semibold">${completed}/${items.length}</span>${preview}${more}</div>`;
        },
        mapPriorityComplexity(item) {
            const priorityIcons = typeof item?.getPriorityIcons === 'function'
                ? item.getPriorityIcons()
                : '';
            const complexityIcons = typeof item?.getComplexityIcons === 'function'
                ? item.getComplexityIcons()
                : '';
            if (!priorityIcons && !complexityIcons) {
                return '';
            }
            return `<span class="task-priority-complexity"><span class="task-priority-complexity__priority">${priorityIcons}</span><span class="task-priority-complexity__complexity">${complexityIcons}</span></span>`;
        },
        stripTaskDescriptionHtml(value) {
            if (value == null || value === '') {
                return '';
            }
            return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        },
        taskCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            return resolveEntityCardField(item, fieldName, {
                title: () => item.title || String(item.id),
                idSubtitle: () => mapEntityIdSubtitle(item.id),
                statusName: () => this.taskStatusPlain(item),
                description: () => this.stripTaskDescriptionHtml(item.description),
                priorityComplexity: () => this.mapPriorityComplexity(item),
                checklist: () => this.mapChecklistPreview(item),
            }, (name) => this.itemMapper(item, name) ?? '');
        },
        getDateRange() {
            if (this.dateFilter === 'custom') {
                return {
                    dateFrom: this.startDate || null,
                    dateTo: this.endDate || null
                };
            }
            
            const todayStr = getCurrentServerDate();
            const startOfDay = getCurrentServerStartOfDay();

            switch (this.dateFilter) {
                case 'today':
                    return { dateFrom: todayStr, dateTo: todayStr };
                case 'yesterday': {
                    const yesterday = new Date(startOfDay);
                    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
                    const ys = formatServerDateFromObject(yesterday);
                    return { dateFrom: ys, dateTo: ys };
                }
                case 'this_week': {
                    const weekStart = new Date(startOfDay);
                    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
                    return {
                        dateFrom: formatServerDateFromObject(weekStart),
                        dateTo: todayStr
                    };
                }
                case 'this_month': {
                    const monthStart = new Date(startOfDay);
                    monthStart.setUTCDate(1);
                    return {
                        dateFrom: formatServerDateFromObject(monthStart),
                        dateTo: todayStr
                    };
                }
                case 'last_week': {
                    const lastWeekStart = new Date(startOfDay);
                    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - lastWeekStart.getUTCDay() - 7);
                    const lastWeekEnd = new Date(lastWeekStart);
                    lastWeekEnd.setUTCDate(lastWeekEnd.getUTCDate() + 6);
                    return {
                        dateFrom: formatServerDateFromObject(lastWeekStart),
                        dateTo: formatServerDateFromObject(lastWeekEnd)
                    };
                }
                case 'last_month': {
                    const lastMonthStart = new Date(startOfDay);
                    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1, 1);
                    const lastMonthEnd = new Date(startOfDay);
                    lastMonthEnd.setUTCDate(0);
                    return {
                        dateFrom: formatServerDateFromObject(lastMonthStart),
                        dateTo: formatServerDateFromObject(lastMonthEnd)
                    };
                }
                default:
                    return { dateFrom: null, dateTo: null };
            }
        },
        async fetchItems(page = 1, silent = false) {
            if (this.displayViewMode === 'kanban') {
                if (page === 1) this.resetKanbanPagination();
                if (!silent) this.loading = true;
                try {
                    await this.fetchKanbanInitial();
                    const kanbanItems = this.allKanbanItems || [];
                    await this.fetchTimelineUnreadCounts('task', kanbanItems.map(item => item.id));
                    this.applyTimelineUnreadCounts(kanbanItems);
                } catch (error) {
                    this.showNotification(this.$t('errorGettingTaskList'), this.getApiErrorMessage(error), true);
                }
                if (!silent) this.loading = false;
                return;
            }
            if (!silent) this.loading = true;
            try {
                const status = this.statusFilter === 'all' ? '' : this.statusFilter;
                const { dateFrom, dateTo } = this.getDateRange();
                this.data = await TaskController.getItems(page, this.searchQuery, status, this.perPage, dateFrom, dateTo);
                const items = this.data?.items || [];
                await this.fetchTimelineUnreadCounts('task', items.map(item => item.id));
                this.applyTimelineUnreadCounts(items);
            } catch (error) {
                this.showNotification(this.$t('errorGettingTaskList'), this.getApiErrorMessage(error), true);
            }
            if (!silent) this.loading = false;
        },
        ensureKanbanStatuses() {
            return this.fetchTaskStatuses();
        },
        async fetchKanbanStatusPage(statusId, page) {
            const { dateFrom, dateTo } = this.getDateRange();
            return TaskController.getItems(page, this.searchQuery, statusId, this.kanbanFetchPerPage, dateFrom, dateTo);
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                statusFilter: 'all',
                dateFilter: 'all_time',
                startDate: '',
                endDate: ''
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.statusFilter, defaultValue: 'all' },
                { value: this.dateFilter, defaultValue: 'all_time' }
            ]);
        },
        async refreshDataAfterOperation() {
            if (this.closeModal) {
                this.shouldRestoreScrollOnClose = false;
                this.closeModal(true);
            }
            if (this.fetchItems) {
                try {
                    await this.fetchItems(this.getListCurrentPage(), true);
                    this.restoreScrollPosition?.();
                } catch (error) {
                    console.error('Failed to refresh tasks:', error);
                }
            }
        },
        handleTaskMoved(updateData) {
            try {
                if (updateData.type === 'status') {
                    const items = this.displayViewMode === 'kanban' ? this.allKanbanItems : this.data.items;
                    const task = items.find(p => Number(p.id) === Number(updateData.orderId));
                    if (task) {
                        task.statusId = updateData.statusId != null ? Number(updateData.statusId) : updateData.statusId;
                        const status = this.statuses.find(s => Number(s.id) === Number(updateData.statusId));
                        if (status) {
                            task.statusName = translateTaskStatus(status.name, this.$t);
                        }
                    }
                    
                    this.pendingStatusUpdates.set(updateData.orderId, updateData.statusId);
                    this.syncKanbanOrdersStable();
                    this.debouncedStatusUpdate();
                }
            } catch (error) {
                const errors = this.getApiErrorMessage(error);
                this.showNotification(this.$t('error'), errors, true);
                this.fetchItems(this.data.currentPage, true);
            }
        },
        debouncedStatusUpdate: debounce(async function() {
            if (this.pendingStatusUpdates.size === 0) return;

            const updateStatus = async (taskId, statusId) => {
                try {
                    await TaskController.updateItem(taskId, { statusId });
                } catch (error) {
                    console.error('Error updating task status:', error);
                }
            };

            const promises = [];
            this.pendingStatusUpdates.forEach((statusId, taskId) => {
                promises.push(updateStatus(taskId, statusId));
            });

            this.pendingStatusUpdates.clear();

            await Promise.all(promises);
            this.$store.dispatch('invalidateCache', { type: 'tasks' });
            this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
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
        async handleChangeStatus(ids, statusId) {
            if (!ids.length) return;
            this.loading = true;
            try {
                await Promise.all(
                    ids.map(id => {
                        const task = this.data?.items?.find(t => t.id === id);
                        const updateData = { statusId };
                        
                        if (task) {
                            if (task.supervisorId) updateData.supervisorId = task.supervisorId;
                            if (task.executorId) updateData.executorId = task.executorId;
                            if (task.observerIds?.length) updateData.observerIds = task.observerIds;
                        }
                        
                        return TaskController.updateItem(id, updateData);
                    })
                );
                
                await this.$store.dispatch('invalidateCache', { type: 'tasks' });
                await this.fetchItems(this.data.currentPage, true);
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
                this.selectedIds = [];
            } catch (error) {
                this.showNotification(this.$t('error'), this.getApiErrorMessage(error), true);
            }
            this.loading = false;
        },
        handleModalClose() {
            this.resetTimelineSidebar();
            this.closeModal();
        },
        handleSaved() {
            this.refreshTimelineIfVisible();
            this.refreshDataAfterOperation();
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.statusFilter = 'all';
            this.dateFilter = 'all_time';
            this.startDate = '';
            this.endDate = '';
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
    },
}
</script>

