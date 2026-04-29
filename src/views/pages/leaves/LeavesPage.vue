<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <CardListViewShell
        v-if="data != null && !loading && (displayViewMode === 'table' || displayViewMode === 'cards')"
        :key="cardListShellKey"
        :display-view-mode="displayViewMode"
        :cards-toolbar="leavesCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.leaves"
            :columns-config="columnsConfig"
            :table-data="data.items"
            :item-mapper="itemMapper"
            :on-item-click="onItemClick"
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
                    icon="fas fa-plus"
                    :onclick="() => { showModal(null) }"
                    :disabled="!$store.getters.hasPermission('leaves_create')"
                  />

                  <FiltersContainer
                    :has-active-filters="hasActiveFilters"
                    :active-filters-count="getActiveFiltersCount()"
                    @reset="resetFilters"
                  >
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('user') }}</label>
                      <select
                        v-model="userFilter"
                        class="w-full"
                        @change="debouncedFetchItems"
                      >
                        <option value="">
                          {{ $t('allUsers') }}
                        </option>
                        <option
                          v-for="user in users"
                          :key="user.id"
                          :value="user.id"
                        >
                          {{ user.name }} {{ user.surname  }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('leaveType') }}</label>
                      <select
                        v-model="leaveTypeFilter"
                        class="w-full"
                        @change="debouncedFetchItems"
                      >
                        <option value="">
                          {{ $t('allLeaveTypes') }}
                        </option>
                        <option
                          v-for="leaveType in leaveTypes"
                          :key="leaveType.id"
                          :value="leaveType.id"
                        >
                          {{ translateLeaveType(leaveType.name, $t) }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                      <input
                        v-model="dateFromFilter"
                        type="datetime-local"
                        class="w-full"
                        @change="debouncedFetchItems"
                      >
                    </div>
                    <div>
                      <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                      <input
                        v-model="dateToFilter"
                        type="datetime-local"
                        class="w-full"
                        @change="debouncedFetchItems"
                      >
                    </div>
                  </FiltersContainer>

                  <ViewModeToggle
                    :view-mode="displayViewMode"
                    :show-calendar="true"
                    :show-cards="true"
                    @change="changeViewMode"
                  />
                </template>
                <template #gear="{ resetColumns, columns, toggleVisible, log }">
                  <TableFilterButton
                    v-if="columns && columns.length"
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
                          class="flex items-center hover:bg-gray-100 dark:hover:bg-[var(--surface-muted)] p-2 rounded"
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
              </TableControlsBar>
            </template>
          </DraggableTable>
        </template>
        <template #card-bar-left>
          <PrimaryButton
            icon="fas fa-plus"
            :onclick="() => { showModal(null) }"
            :disabled="!$store.getters.hasPermission('leaves_create')"
          />
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
          >
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('user') }}</label>
              <select
                v-model="userFilter"
                class="w-full"
                @change="debouncedFetchItems"
              >
                <option value="">
                  {{ $t('allUsers') }}
                </option>
                <option
                  v-for="user in users"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} {{ user.surname  }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('leaveType') }}</label>
              <select
                v-model="leaveTypeFilter"
                class="w-full"
                @change="debouncedFetchItems"
              >
                <option value="">
                  {{ $t('allLeaveTypes') }}
                </option>
                <option
                  v-for="leaveType in leaveTypes"
                  :key="leaveType.id"
                  :value="leaveType.id"
                >
                  {{ translateLeaveType(leaveType.name, $t) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
              <input
                v-model="dateFromFilter"
                type="datetime-local"
                class="w-full"
                @change="debouncedFetchItems"
              >
            </div>
            <div>
              <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
              <input
                v-model="dateToFilter"
                type="datetime-local"
                class="w-full"
                @change="debouncedFetchItems"
              >
            </div>
          </FiltersContainer>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-calendar="true"
            :show-cards="true"
            @change="changeViewMode"
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
            :card-mapper="leaveCardMapper"
            title-field="title"
            title-subtitle-field="creatorName"
            :title-prefix="leaveCardTitlePrefix"
            header-suffix-field="dateFrom"
            :show-checkbox="false"
            @dblclick="onItemClick"
          />
        </template>
      </CardListViewShell>

      <div
        v-else-if="calendarLeaves != null && !loading && displayViewMode === 'calendar'"
        key="calendar-view"
        class="calendar-view-container"
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
              icon="fas fa-plus"
              :onclick="() => { showModal(null) }"
              :disabled="!$store.getters.hasPermission('leaves_create')"
            />
                    
            <FiltersContainer
              :has-active-filters="hasActiveFilters"
              :active-filters-count="getActiveFiltersCount()"
              @reset="resetFilters"
            >
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('user') }}</label>
                <select
                  v-model="userFilter"
                  class="w-full"
                  @change="debouncedFetchItems"
                >
                  <option value="">
                    {{ $t('allUsers') }}
                  </option>
                  <option
                    v-for="user in users"
                    :key="user.id"
                    :value="user.id"
                  >
                    {{ user.name }} {{ user.surname  }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('leaveType') }}</label>
                <select
                  v-model="leaveTypeFilter"
                  class="w-full"
                  @change="debouncedFetchItems"
                >
                  <option value="">
                    {{ $t('allLeaveTypes') }}
                  </option>
                  <option
                    v-for="leaveType in leaveTypes"
                    :key="leaveType.id"
                    :value="leaveType.id"
                  >
                    {{ translateLeaveType(leaveType.name, $t) }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('dateFrom') }}</label>
                <input
                  v-model="dateFromFilter"
                  type="datetime-local"
                  class="w-full"
                  @change="debouncedFetchItems"
                >
              </div>
              <div>
                <label class="block mb-2 text-xs font-semibold">{{ $t('dateTo') }}</label>
                <input
                  v-model="dateToFilter"
                  type="datetime-local"
                  class="w-full"
                  @change="debouncedFetchItems"
                >
              </div>
            </FiltersContainer>

            <ViewModeToggle
              :view-mode="displayViewMode"
              :show-calendar="true"
              :show-cards="true"
              @change="changeViewMode"
            />
          </template>
        </TableControlsBar>
            
        <LeaveCalendarView
          :leaves="filteredCalendarLeaves"
          :leave-types="leaveTypes"
          @leave-click="showModal"
          @day-click="handleDayClick"
        />
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
      :title="sideModalCrudTitle('sideModalGenLeave', 'sideModalNomLeave')"
      :onclose="handleModalClose"
    >
      <LeaveCreatePage
        :key="editingItem ? editingItem.id : 'new-leave'"
        ref="leavecreatepageForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import LeaveController from '@/api/LeaveController';
import LeaveCreatePage from './LeaveCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import LeaveCalendarView from '@/views/components/leave/LeaveCalendarView.vue';
import { translateLeaveType as translateLeaveTypeUtil } from '@/utils/translationUtils';

import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';

const leavesViewModeMixin = createStoreViewModeMixin({
    getter: 'leavesViewMode',
    dispatch: 'setLeavesViewMode',
    modes: ['table', 'calendar', 'cards'],
    mobileTableFallback: 'cards',
});

export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        LeaveCreatePage,
        DraggableTable,
        TableControlsBar,
        TableFilterButton,
        FiltersContainer,
        TableSkeleton,
        CardsSkeleton,
        LeaveCalendarView,
        ViewModeToggle,
        MapperCardGrid,
        CardListViewShell,
        CardFieldsGearMenu,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, leavesViewModeMixin, cardFieldsVisibilityMixin],
    data() {
        return {
            cardFieldsKey: 'admin.leaves.cards',
            titleField: 'title',
            controller: LeaveController,
            cacheInvalidationType: 'leaves',
            itemViewRouteName: 'LeaveView',
            baseRouteName: 'Leaves',
            errorGettingItemText: this.$t('errorGettingLeave'),
            savedSuccessText: this.$t('leaveSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingLeave'),
            deletedSuccessText: this.$t('leaveSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingLeave'),
            columnsConfig: [
                { name: 'id', label: 'number', size: 60 },
                { name: 'leaveTypeName', label: 'leaveType', html: true },
                { name: 'creatorName', label: 'user' },
                { name: 'dateFrom', label: 'dateFrom' },
                { name: 'dateTo', label: 'dateTo' },
                { name: 'duration', label: 'duration' },
                { name: 'comment', label: 'comment' }
            ],
            userFilter: '',
            leaveTypeFilter: '',
            dateFromFilter: '',
            dateToFilter: '',
            users: [],
            leaveTypes: [],
            calendarLeaves: null,
            debounceTimer: null
        }
    },
    computed: {
        hasActiveFilters() {
            return !!(this.userFilter || this.leaveTypeFilter || this.dateFromFilter || this.dateToFilter);
        },
        filteredCalendarLeaves() {
            if (!this.calendarLeaves) return [];
            return this.calendarLeaves;
        },
        leavesCardsToolbar() {
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
                { name: 'dateFrom', label: 'dateFrom', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'dateTo', label: 'dateTo', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'duration', label: 'duration', icon: 'fas fa-clock text-[#3571A4]' },
                { name: 'comment', label: 'comment', icon: 'fas fa-comment text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
        displayViewMode: {
            handler(newMode, oldMode) {
                if (oldMode === undefined) {
                    return;
                }
                if (newMode === 'calendar') {
                    this.$nextTick(() => {
                        this.fetchCalendarItems(false);
                    });
                } else {
                    this.$nextTick(() => {
                        this.fetchItems(1, false);
                    });
                }
            },
            immediate: false
        }
    },
    mounted() {
        this.loadFiltersData();
        
        if (this.displayViewMode === 'calendar') {
            this.fetchCalendarItems();
        } else {
            this.fetchItems();
        }
    },
    beforeUnmount() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    },
    methods: {
        translateLeaveType(name, t) {
            return translateLeaveTypeUtil(name, t || this.$t);
        },
        itemMapper(i, c) {
            switch (c) {
                case 'leaveTypeName': {
                    const color = i.leaveType?.color || '#3B82F6';
                    const translatedName = i.leaveTypeName ? translateLeaveTypeUtil(i.leaveTypeName, this.$t) : '-';
                    return `
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded border border-gray-300" style="background-color: ${color}"></div>
                            <span>${translatedName}</span>
                        </div>
                    `;
                }
                case 'dateFrom':
                    return i.formatDateFrom();
                case 'dateTo':
                    return i.formatDateTo();
                case 'duration':
                    return i.formatDuration(this.$t);
                case 'creatorName':
                    return i.user?.name || i.user?.email ;
                default:
                    return i[c];
            }
        },
        handlePerPageChange(newPerPage) {
            this.perPage = newPerPage;
            this.fetchItems(1, false);
        },
        async loadFiltersData() {
            try {
                const [usersData, leaveTypesData] = await Promise.all([
                    this.$store.dispatch('loadUsers').then(() => this.$store.getters.usersForCurrentCompany),
                    this.$store.dispatch('loadLeaveTypes').then(() => this.$store.getters.leaveTypes)
                ]);
                this.users = usersData || [];
                this.leaveTypes = leaveTypesData || [];
            } catch (error) {
                console.error('Ошибка загрузки данных для фильтров:', error);
            }
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.userFilter, defaultValue: '' },
                { value: this.leaveTypeFilter, defaultValue: '' },
                { value: this.dateFromFilter, defaultValue: '' },
                { value: this.dateToFilter, defaultValue: '' }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                userFilter: '',
                leaveTypeFilter: '',
                dateFromFilter: '',
                dateToFilter: ''
            });
            if (this.displayViewMode === 'calendar') {
                this.fetchCalendarItems();
            } else {
                this.fetchItems(1);
            }
        },
        debouncedFetchItems() {
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            this.debounceTimer = setTimeout(() => {
                if (this.displayViewMode === 'calendar') {
                    this.fetchCalendarItems(true);
                } else {
                    this.fetchItems(1);
                }
            }, 300);
        },
        leaveCardTitlePrefix() {
            return '<i class="fas fa-calendar-days text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        leaveCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            if (fieldName === 'title') {
                const typeLabel = item.leaveTypeName
                    ? translateLeaveTypeUtil(item.leaveTypeName, this.$t)
                    : '—';
                return `#${item.id} · ${typeLabel}`;
            }
            if (fieldName === 'creatorName') {
                return item.user?.name || item.user?.email || '—';
            }
            if (fieldName === 'leaveTypeName') {
                return item.leaveTypeName
                    ? translateLeaveTypeUtil(item.leaveTypeName, this.$t)
                    : '—';
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const filters = {};
                if (this.userFilter) filters.userId = this.userFilter;
                if (this.leaveTypeFilter) filters.leaveTypeId = this.leaveTypeFilter;
                if (this.dateFromFilter) filters.dateFrom = this.dateFromFilter;
                if (this.dateToFilter) filters.dateTo = this.dateToFilter;
                this.data = await LeaveController.getItems(page, this.perPage, filters);
            } catch (error) {
                this.showNotification(this.$t('errorGettingLeaveList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        async fetchCalendarItems(silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const year = new Date().getFullYear();
                const filters = {};
                if (this.userFilter) filters.userId = this.userFilter;
                if (this.leaveTypeFilter) filters.leaveTypeId = this.leaveTypeFilter;
                filters.dateFrom = this.dateFromFilter || `${year}-01-01`;
                filters.dateTo = this.dateToFilter || `${year + 1}-12-31`;
                const allLeaves = await this.$store.dispatch('loadLeavesByFilters', filters);
                this.calendarLeaves = allLeaves || [];
            } catch (error) {
                this.showNotification(this.$t('errorGettingLeaveList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        handleDayClick() {
            this.showModal(null);
        },
        refreshDataAfterOperation() {
            if (this.displayViewMode === 'calendar') {
                if (this.fetchCalendarItems) {
                    this.fetchCalendarItems(true)
                        .then(() => this.restoreScrollPosition?.())
                        .catch((error) => console.error("Ошибка обновления данных:", error));
                }
            } else {
                if (this.fetchItems) {
                    this.fetchItems(this.data?.currentPage || 1, true)
                        .then(() => this.restoreScrollPosition?.())
                        .catch((error) => console.error("Ошибка обновления данных:", error));
                }
            }
            if (this.closeModal) {
                this.shouldRestoreScrollOnClose = false;
                this.closeModal(true);
            }
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Leaves' });
            }
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            const silent = previousCompanyId == null;
            await this.loadFiltersData();
            if (this.displayViewMode === 'calendar') {
                await this.fetchCalendarItems(silent);
            } else {
                await this.fetchItems(1, silent);
            }
        }
    },
}
</script>

