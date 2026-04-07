<template>
  <div class="flex min-h-0 min-w-0 flex-1 flex-col">
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
              :show-filters="true"
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              :on-filters-reset="resetFilters"
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
                  :onclick="() => { showModal(null) }" 
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
                            
                <FiltersContainer
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @reset="resetFilters"
                  @apply="applyFilters"
                >
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
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
                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
                      <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                      <input
                        v-model="startDate"
                        type="date"
                        class="w-full"
                      >
                    </div>
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                      <input
                        v-model="endDate"
                        type="date"
                        class="w-full"
                      >
                    </div>
                  </div>
                </FiltersContainer>

                <ViewModeToggle
                  :view-mode="displayViewMode"
                  :show-kanban="true"
                  :show-cards="true"
                  @change="changeViewMode"
                />
              </template>

              <template #right="{ resetColumns, columns, toggleVisible, log }">
                <Pagination
                  v-if="data != null"
                  :current-page="data.currentPage"
                  :last-page="data.lastPage"
                  :per-page="perPage"
                  :per-page-options="perPageOptions"
                  :show-per-page-selector="true"
                  @change-page="fetchItems"
                  @per-page-change="handlePerPageChange"
                />

                <TableFilterButton
                  v-if="displayViewMode === 'table'"
                  :on-reset="resetColumns"
                >
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
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
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
              <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
                <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                <input
                  v-model="startDate"
                  type="date"
                  class="w-full"
                >
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                <input
                  v-model="endDate"
                  type="date"
                  class="w-full"
                >
              </div>
            </div>
          </FiltersContainer>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="true"
            :show-cards="true"
            @change="changeViewMode"
          />
        </template>
        <template #card-bar-right>
          <Pagination
            v-if="data != null"
            :current-page="data.currentPage"
            :last-page="data.lastPage"
            :per-page="perPage"
            :per-page-options="perPageOptions"
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
            :card-mapper="taskCardMapper"
            title-field="title"
            title-subtitle-field="status"
            :title-prefix="taskCardTitlePrefix"
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
              :disabled="!$store.getters.hasPermission('tasks_create')"
            />
                    
            <FiltersContainer
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @reset="resetFilters"
              @apply="applyFilters"
            >
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('status') }}</label>
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
                <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter') }}</label>
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
                  <label class="block mb-2 text-xs font-semibold">{{ $t('startDate') }}</label>
                  <input
                    v-model="startDate"
                    type="date"
                    class="w-full"
                  >
                </div>
                <div>
                  <label class="block mb-2 text-xs font-semibold">{{ $t('endDate') }}</label>
                  <input
                    v-model="endDate"
                    type="date"
                    class="w-full"
                  >
                </div>
              </div>
            </FiltersContainer>

            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-kanban="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
          <template #right>
            <KanbanFieldsButton mode="tasks" />
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
            :is-task-mode="true"
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
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal" 
        @update:editing-item="editingItem = $event"
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
import KanbanFieldsButton from '@/views/components/app/kanban/KanbanFieldsButton.vue';
import kanbanByStatusMixin from "@/mixins/kanbanByStatusMixin";
import StatusSelectCell from '@/views/components/app/buttons/StatusSelectCell.vue';
import { markRaw } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import debounce from 'lodash.debounce';
import { translateTaskStatus } from '@/utils/translationUtils';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';

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
        TimelinePanel: TimelinePanelAsync,
        TableSkeleton,
        CardsSkeleton,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, kanbanByStatusMixin, tasksViewModeMixin, cardFieldsVisibilityMixin, timelineSideModalMixin],
    data() {
        return {
            cardFieldsKey: 'admin.tasks.cards',
            titleField: 'title',
            statusFilter: 'all',
            dateFilter: 'all_time',
            startDate: '',
            endDate: '',
            pendingStatusUpdates: new Map(),
            batchStatusId: '',
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
        }
    },
    computed: {
        taskStatuses() {
            return this.$store.getters.taskStatuses || [];
        },
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60 },
                { name: 'title', label: 'title', sortable: true },
                { 
                    name: 'status', 
                    label: 'status', 
                    component: markRaw(StatusSelectCell), 
                    props: (i) => ({ 
                        id: i.id, 
                        value: i.statusId || (i.status?.id), 
                        statuses: this.statuses, 
                        onChange: (newStatusId) => this.handleChangeStatus([i.id], newStatusId) 
                    }), 
                },
                { name: 'creator', label: 'creator', sortable: false },
                { name: 'description', label: 'description', sortable: false, visible: true },
                { name: 'supervisor', label: 'supervisor', sortable: false },
                { name: 'executor', label: 'executor', sortable: false },
                { name: 'deadline', label: 'deadline', sortable: true },
                { name: 'createdAt', label: 'createdAt', sortable: true },
            ];
        },
        hasActiveFilters() {
            return this.statusFilter !== 'all' || this.dateFilter !== 'all_time';
        },
        kanbanTasks() {
            const tasksToUse = this.displayViewMode === 'kanban' ? this.allKanbanItems : (this.data?.items || []);
            return tasksToUse.map(task => {
                let status = task.status;
                if (!status && task.statusId) {
                    status = this.taskStatuses.find(s => s.id === task.statusId);
                }
                return {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    statusId: task.statusId || (status?.id),
                    statusName: status?.name ? translateTaskStatus(status.name, this.$t) : '',
                    deadline: task.deadline,
                    creator: task.creator,
                    supervisor: task.supervisor,
                    executor: task.executor,
                    project: task.project,
                    createdAt: task.createdAt,
                    priority: task.priority,
                    complexity: task.complexity,
                    checklist: task.checklist,
                };
            });
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
                { name: 'title', label: null },
                { name: 'status', label: 'status', icon: 'fas fa-flag text-[#3571A4]' },
                { name: 'creator', label: 'creator', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'description', label: 'description', icon: 'fas fa-align-left text-[#3571A4]' },
                { name: 'supervisor', label: 'supervisor', icon: 'fas fa-user-tie text-[#3571A4]' },
                { name: 'executor', label: 'executor', icon: 'fas fa-user-check text-[#3571A4]' },
                { name: 'deadline', label: 'deadline', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'createdAt', label: 'createdAt', icon: 'fas fa-clock text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
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
        async showModal(item = null) {
            this.resetTimelineSidebar();
            this.savedScrollPosition = window.pageYOffset ?? document.documentElement.scrollTop;
            this.shouldRestoreScrollOnClose = true;
            this.modalDialog = true;
            this.showTimeline = true;
            if (item && item.id) {
                try {
                    const fullTask = await TaskController.getItem(item.id);
                    this.editingItem = fullTask;
                } catch (error) {
                    console.error('Ошибка при загрузке задачи:', error);
                    this.editingItem = item;
                }
            } else {
                this.editingItem = item;
            }
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            this.resetTimelineSidebar();
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
                case 'deadline':
                    return i.deadline ? this.formatDatabaseDateTime(i.deadline) : '';
                case 'createdAt':
                    return i.createdAt ? this.formatDatabaseDate(i.createdAt) : '';
                default:
                    return i[c];
            }
        },
        taskCardTitlePrefix() {
            return '<i class="fas fa-tasks text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
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
        taskCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                return item.title || String(item.id);
            }
            if (fieldName === 'status') {
                return this.taskStatusPlain(item);
            }
            return this.itemMapper(item, fieldName) ?? '';
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
        refreshDataAfterOperation() {
            if (this.fetchItems) {
                this.fetchItems(this.data?.currentPage || 1, true)
                    .then(() => this.restoreScrollPosition?.())
                    .catch((error) => console.error("❌ [TasksPage.refreshDataAfterOperation] Ошибка обновления данных:", error));
            }
            if (this.closeModal) {
                this.shouldRestoreScrollOnClose = false;
                this.closeModal(true);
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
        debouncedStatusUpdate: debounce(function() {
            if (this.pendingStatusUpdates.size === 0) return;
            
            const promises = [];
            this.pendingStatusUpdates.forEach((statusId, taskId) => {
                const updateData = { statusId };
                const promise = TaskController.updateItem(taskId, updateData)
                    .catch(error => {
                        console.error('Error updating task status:', error);
                    });
                promises.push(promise);
            });
            
            this.pendingStatusUpdates.clear();
            
            Promise.all(promises).then(() => {
                this.$store.dispatch('invalidateCache', { type: 'tasks' });
                this.showNotification(this.$t('success'), this.$t('statusUpdated'), false);
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
        handleBatchStatusChange() {
            if (!this.batchStatusId || this.selectedIds.length === 0) return;
            
            this.handleChangeStatus(this.selectedIds, this.batchStatusId);
            this.batchStatusId = '';
            this.selectedIds = [];
        },
        handleBatchStatusChangeFromToolbar(statusId) {
            if (!statusId || this.selectedIds.length === 0) return;
            this.handleChangeStatus(this.selectedIds, statusId);
            this.batchStatusId = '';
            this.selectedIds = [];
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
