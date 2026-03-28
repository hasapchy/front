<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <!-- Табличный вид -->
      <div
        v-if="data != null && !loading && viewMode === 'table'"
        :key="`table-${$i18n.locale}`"
      >
        <DraggableTable
          table-key="admin.leaves"
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
                  icon="fas fa-plus"
                  :onclick="() => { showModal(null) }"
                  :disabled="!$store.getters.hasPermission('leaves_create')"
                />

                <transition name="fade">
                  <BatchButton
                    v-if="selectedIds.length"
                    :selected-ids="selectedIds"
                    :batch-actions="getBatchActions()"
                  />
                </transition>

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

                <div class="flex items-center border border-gray-300 rounded overflow-hidden">
                  <button 
                    class="px-3 py-2 transition-colors"
                    :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
                    @click="viewMode = 'table'"
                  >
                    <i class="fas fa-table" />
                  </button>
                  <button 
                    class="px-3 py-2 transition-colors"
                    :class="viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
                    @click="viewMode = 'calendar'"
                  >
                    <i class="fas fa-calendar" />
                  </button>
                </div>
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
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>

      <!-- Календарный вид -->
      <div
        v-else-if="calendarLeaves != null && !loading && viewMode === 'calendar'"
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

            <div class="flex items-center border border-gray-300 rounded overflow-hidden">
              <button 
                class="px-3 py-2 transition-colors"
                :class="viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
                @click="viewMode = 'table'"
              >
                <i class="fas fa-table" />
              </button>
              <button 
                class="px-3 py-2 transition-colors"
                :class="viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'"
                @click="viewMode = 'calendar'"
              >
                <i class="fas fa-calendar" />
              </button>
            </div>
          </template>
        </TableControlsBar>
            
        <LeaveCalendarView
          :leaves="filteredCalendarLeaves"
          :leave-types="leaveTypes"
          @leave-click="showModal"
          @day-click="handleDayClick"
        />
      </div>

      <!-- Загрузка -->
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
      </div>
    </transition>
    <SideModalDialog
      :show-form="modalDialog"
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
    <AlertDialog
      :dialog="deleteDialog"
      :descr="`${$t('confirmDelete')} (${selectedIds.length})?`"
      :confirm-text="$t('delete')"
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
import { VueDraggableNext } from 'vue-draggable-next';
import LeaveController from '@/api/LeaveController';
import LeaveCreatePage from './LeaveCreatePage.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import LeaveCalendarView from '@/views/components/leave/LeaveCalendarView.vue';
import debounce from "lodash.debounce";
import { translateLeaveType as translateLeaveTypeUtil } from '@/utils/translationUtils';

import listQueryMixin from '@/mixins/listQueryMixin';
export default {
    components: {
        PrimaryButton,
        SideModalDialog,
        LeaveCreatePage,
        Pagination,
        DraggableTable,
        BatchButton,
        AlertDialog,
        TableControlsBar,
        TableFilterButton,
        FiltersContainer,
        TableSkeleton,
        LeaveCalendarView,
        draggable: VueDraggableNext
    },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin],
    data() {
        return {
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
                { name: 'select', label: '#', size: 15 },
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
        viewMode: {
            get() {
                return this.$store.getters.leavesViewMode;
            },
            set(value) {
                this.$store.dispatch('setLeavesViewMode', value);
            }
        }
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
        viewMode: {
            handler(newMode) {
                // Vuex автоматически сохранит через vuex-persistedstate
                
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
        // Миграция из localStorage в Vuex (однократно)
        const savedViewMode = localStorage.getItem('leaves_viewMode');
        if (savedViewMode && ['table', 'calendar'].includes(savedViewMode)) {
            const currentViewMode = this.$store.getters.leavesViewMode;
            if (currentViewMode === 'table' && savedViewMode !== 'table') {
                this.$store.dispatch('setLeavesViewMode', savedViewMode);
            }
            // Удаляем старый ключ из localStorage после миграции
            localStorage.removeItem('leaves_viewMode');
        }
        
        this.loadFiltersData();
        
        if (this.viewMode === 'calendar') {
            this.fetchCalendarItems();
        } else {
            this.fetchItems();
        }
    },
    beforeUnmount() {
        // Очищаем таймер при уничтожении компонента
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
                case 'leaveTypeName':
                    const color = i.leaveType?.color || '#3B82F6';
                    const translatedName = i.leaveTypeName ? translateLeaveTypeUtil(i.leaveTypeName, this.$t) : '-';
                    return `
                        <div class="flex items-center gap-2">
                            <div class="w-3 h-3 rounded border border-gray-300" style="background-color: ${color}"></div>
                            <span>${translatedName}</span>
                        </div>
                    `;
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
            if (this.viewMode === 'calendar') {
                this.fetchCalendarItems();
            } else {
                this.fetchItems(1);
            }
        },
        debouncedFetchItems() {
            // Очищаем предыдущий таймер
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            // Устанавливаем новый таймер на 300ms
            this.debounceTimer = setTimeout(() => {
                if (this.viewMode === 'calendar') {
                    this.fetchCalendarItems(true);
                } else {
                    this.fetchItems(1);
                }
            }, 300);
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
        handleDayClick(day) {
            // При клике на день можно открыть форму создания отпуска с предзаполненной датой
            // Пока просто открываем форму создания
            this.showModal(null);
        },
        refreshDataAfterOperation() {
            // Переопределяем метод из crudEventMixin для поддержки календарного вида
            if (this.viewMode === 'calendar') {
                if (this.fetchCalendarItems) {
                    this.fetchCalendarItems(true)
                        .then(() => this.restoreScrollPosition?.())
                        .catch((error) => console.error("Ошибка обновления данных:", error));
                }
            } else {
                // Используем стандартную логику для табличного вида
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
            if (this.viewMode === 'calendar') {
                await this.fetchCalendarItems(silent);
            } else {
                await this.fetchItems(1, silent);
            }
        }
    },
}
</script>

