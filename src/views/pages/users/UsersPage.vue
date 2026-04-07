<template>
  <div>
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
        table-key="admin.users"
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
                :onclick="() => showModal(null)" 
                icon="fas fa-plus"
                :disabled="!$store.getters.hasPermission('users_create')"
              />
                            
              <transition name="fade">
                <BatchButton
                  v-if="selectedIds.length"
                  :selected-ids="selectedIds"
                  :batch-actions="getBatchActions()"
                />
              </transition>

              <ViewModeToggle
                :view-mode="displayViewMode"
                :show-kanban="false"
                :show-cards="true"
                @change="changeViewMode"
              />
              <FiltersContainer
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                @reset="resetFilters"
                @apply="applyFilters"
              >
                <div class="flex items-center gap-2">
                  <input
                    id="users-show-inactive"
                    v-model="showInactiveFilter"
                    type="checkbox"
                    class="rounded border-gray-300"
                    @change="applyFilters"
                  >
                  <label
                    for="users-show-inactive"
                    class="text-sm cursor-pointer"
                  >{{ $t('showInactive') }}</label>
                </div>
              </FiltersContainer>
            </template>
            <template #right>
              <Pagination
                v-if="paginationData"
                :current-page="paginationData.currentPage"
                :last-page="paginationData.lastPage"
                :per-page="paginationData.perPage"
                :per-page-options="paginationData.perPageOptions"
                :show-per-page-selector="true"
                @change-page="(page) => fetchItems(page)"
                @per-page-change="handlePerPageChange"
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
            :onclick="() => showModal(null)"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('users_create')"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div class="flex items-center gap-2">
              <input
                id="users-show-inactive-cards"
                v-model="showInactiveFilter"
                type="checkbox"
                class="rounded border-gray-300"
                @change="applyFilters"
              >
              <label
                for="users-show-inactive-cards"
                class="text-sm cursor-pointer"
              >{{ $t('showInactive') }}</label>
            </div>
          </FiltersContainer>
        </template>
        <template #card-bar-right>
          <Pagination
            v-if="paginationData"
            :current-page="paginationData.currentPage"
            :last-page="paginationData.lastPage"
            :per-page="paginationData.perPage"
            :per-page-options="paginationData.perPageOptions"
            :show-per-page-selector="true"
            @change-page="(page) => fetchItems(page)"
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
            :card-mapper="userCardMapper"
            title-field="title"
            :title-prefix="userCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('users_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          />
        </template>
      </CardListViewShell>
    <div
      v-else
      key="loader"
      class="min-h-64"
    >
      <TableSkeleton v-if="displayViewMode === 'table'" />
      <CardsSkeleton v-else />
    </div>
  </transition>
  <SideModalDialog
    :show-form="modalDialog"
    :title="sideModalCrudTitle('sideModalGenUser', 'sideModalNomUser', undefined, sideModalLabelUser)"
    :onclose="handleModalClose"
  >
    <UsersCreatePage
      :key="editingItem ? editingItem.id : 'new-user'"
      ref="userscreatepageForm"
      :editing-item="editingItem"
      @saved="handleSaved"
      @saved-error="handleSavedError"
      @deleted="handleDeleted"
      @deleted-error="handleDeletedError"
      @close-request="closeModal"
    />
  </SideModalDialog>
  <SideModalDialog
    :show-form="salaryAccrualModalOpen"
    :title="salaryAccrualSideTitle"
    :onclose="closeSalaryAccrualModal"
    :level="2"
  >
    <SalaryAccrualModal 
      v-if="salaryAccrualModalOpen"
      :user-ids="selectedIds"
      :users="getSelectedUsers()"
      :operation-type="salaryOperationType"
      @dialog-title="salaryAccrualHeaderLive = $event"
      @success="handleSalaryAccrualSuccess"
      @cancel="closeSalaryAccrualModal"
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
import UsersController from '@/api/UsersController';
import SideModalDialog, { salaryAccrualSideModalTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import Pagination from '@/views/components/app/buttons/Pagination.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import UsersCreatePage from './UsersCreatePage.vue';
import SalaryAccrualModal from '@/views/components/app/SalaryAccrualModal.vue';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import { formatDatabaseDate, formatDatabaseDateTime } from '@/utils/dateUtils';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { eventBus } from '@/eventBus';
import { highlightMatches } from '@/utils/searchUtils';

import listQueryMixin from '@/mixins/listQueryMixin';

const usersViewModeMixin = createStoreViewModeMixin({
    getter: 'usersViewMode',
    dispatch: 'setUsersViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, UsersCreatePage, SalaryAccrualModal, Pagination, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, FiltersContainer, TableSkeleton, CardsSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, draggable: VueDraggableNext },
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, cardFieldsVisibilityMixin, usersViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'admin.users.cards',
            titleField: 'title',
            controller: UsersController,
            cacheInvalidationType: 'users',
            itemViewRouteName: 'UserView',
            baseRouteName: 'users',
            errorGettingItemText: this.$t('errorLoadingUsers'),
            savedSuccessText: this.$t('userSaved'),
            savedErrorText: this.$t('errorSavingUser'),
            deletedSuccessText: this.$t('userDeleted'),
            deletedErrorText: this.$t('errorDeletingUser'),
            deletePermission: 'users_delete',
            salaryAccrualModalOpen: false,
            salaryAccrualHeaderLive: '',
            salaryOperationType: 'salaryAccrual',
            showInactiveFilter: false,
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'ID', size: 60, html: true },
                { name: 'name', label: 'firstName', html: true },
                { name: 'surname', label: 'lastName', html: true },
                { name: 'email', label: 'email', html: true },
                { name: 'phone', label: 'phoneNumber', html: true },
                { name: 'position', label: 'position', html: true },
                { name: 'roles', label: 'roles', html: true },
                { name: 'companies', label: 'companies', html: true },
                { name: 'isActive', label: 'active', size: 80 },
                { name: 'isAdmin', label: 'admin', size: 80 },
                { name: 'lastLoginAt', label: 'lastLogin', visible: false },
                { name: 'createdAt', label: 'created', visible: false },
            ]
        };
    },
    computed: {
        searchQuery() {
            return this.$store.state.searchQuery;
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
            return [
                { name: 'title', label: null },
                { name: 'name', label: 'firstName', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'surname', label: 'lastName', icon: 'fas fa-user text-[#3571A4]' },
                { name: 'email', label: 'email', icon: 'fas fa-envelope text-[#3571A4]' },
                { name: 'phone', label: 'phoneNumber', icon: 'fas fa-phone text-[#3571A4]' },
                { name: 'position', label: 'position', icon: 'fas fa-briefcase text-[#3571A4]' },
                { name: 'roles', label: 'roles', icon: 'fas fa-id-badge text-[#3571A4]' },
                { name: 'companies', label: 'companies', icon: 'fas fa-building text-[#3571A4]' },
                { name: 'isActive', label: 'active', icon: 'fas fa-circle-check text-[#3571A4]' },
                { name: 'lastLoginAt', label: 'lastLogin', icon: 'fas fa-clock text-[#3571A4]' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
        },
        salaryAccrualSideTitle() {
            if (!this.salaryAccrualModalOpen) {
                return '';
            }
            if (this.salaryAccrualHeaderLive) {
                return this.salaryAccrualHeaderLive;
            }
            return salaryAccrualSideModalTitle(this.$t.bind(this), {
                operationType: this.salaryOperationType,
                forAllActiveEmployees: false,
                count: this.selectedIds.length,
            });
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        }
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', true);
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },
    methods: {
        userCardTitlePrefix() {
            return '<i class="fas fa-user text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        userCardMapper(item, fieldName) {
            if (!item) return '';
            if (fieldName === 'title') {
                const n = [item.name, item.surname].filter(Boolean).join(' ').trim();
                return n || String(item.id);
            }
            return this.itemMapper(item, fieldName) ?? '';
        },
        toggleSelectRow(id) {
            if (!id) return;
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
        formatDatabaseDate(date) {
            return formatDatabaseDate(date);
        },
        formatDatabaseDateTime(date) {
            return formatDatabaseDateTime(date);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                const params = { activeOnly: !this.showInactiveFilter };
                if (this.searchQuery) {
                    params.search = this.searchQuery;
                }
                this.data = await UsersController.getItems(page, this.perPage, params);
            } catch (error) {
                this.showNotification(this.$t('errorLoadingUsers'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.showInactiveFilter, defaultValue: false }
            ]);
        },
        resetFilters() {
            this.resetFiltersFromConfig({ showInactiveFilter: false });
        },
        itemMapper(item, column) {
            const search = this.searchQuery;
            switch (column) {
                case 'id':
                    if (search) {
                        return highlightMatches(String(item.id ?? ''), search);
                    }
                    return item.id;
                case 'isActive':
                    return item.isActive ? '✅' : '❌';
                case 'isAdmin':
                    return item.isAdmin ? '✅' : '❌';
                case 'createdAt':
                    return this.formatDatabaseDate(item.createdAt);
                case 'lastLoginAt':
                    return item.lastLoginAt ? this.formatDatabaseDateTime(item.lastLoginAt) : '—';
                case 'phone': {
                    const v = item.phone || '—';
                    if (search && v !== '—') {
                        return highlightMatches(String(v), search);
                    }
                    return v;
                }
                case 'name':
                case 'surname':
                case 'email':
                case 'position': {
                    const v = item[column];
                    if (search && v != null && String(v).length) {
                        return highlightMatches(String(v), search);
                    }
                    return v ?? '—';
                }
                case 'roles': {
                    const v = item.roles && item.roles.length > 0 ? item.roles.join(', ') : '—';
                    if (search && v !== '—') {
                        return highlightMatches(v, search);
                    }
                    return v;
                }
                case 'companies': {
                    const v = item.companies.map(c => c.name).join(', ');
                    if (search && v.length) {
                        return highlightMatches(v, search);
                    }
                    return v;
                }
                default:
                    return item[column];
            }
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
        closeSalaryAccrualModal() {
            this.salaryAccrualModalOpen = false;
            this.salaryAccrualHeaderLive = '';
            this.salaryOperationType = 'salaryAccrual';
        },
        async handleSalaryAccrualSuccess() {
            this.closeSalaryAccrualModal();
            this.selectedIds = [];
            await this.fetchItems(this.data?.currentPage ?? 1, false);
        },
        getBatchActions() {
            const actions = [];

            if (this.$store.getters.hasPermission('employee_salaries_accrue')) {
                actions.push({
                    label: this.$t('bonus'),
                    icon: "fas fa-gift",
                    type: "success",
                    action: () => this.openSalaryOperationModal('bonus'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('penalty'),
                    icon: "fas fa-exclamation-triangle",
                    type: "danger",
                    action: () => this.openSalaryOperationModal('penalty'),
                    disabled: false,
                });
                actions.push({
                    label: this.$t('advance'),
                    icon: "fas fa-money-check-alt",
                    type: "success",
                    action: () => this.openSalaryOperationModal('advance'),
                    disabled: false,
                });
            }

            const deletePermissions = Array.isArray(this.deletePermission)
                ? this.deletePermission
                : (this.deletePermission ? [this.deletePermission] : ['users_delete']);

            const hasDeletePermission = deletePermissions.some(perm =>
                this.$store.getters.hasPermission(perm)
            );

            if (hasDeletePermission) {
                actions.push({
                    label: this.$t('delete'),
                    icon: "fas fa-trash",
                    type: "danger",
                    action: this.deleteItems,
                    disabled: this.loadingBatch,
                });
            }

            return actions;
        },
        getSelectedUsers() {
            if (!this.data || !this.data.items) return [];
            return this.data.items.filter(user => this.selectedIds.includes(user.id));
        },
        openSalaryOperationModal(operationType) {
            if (!this.selectedIds?.length) {
                this.showNotification(
                    this.$t('error'),
                    this.$t('selectUsersFirst'),
                    true
                );
                return;
            }
            this.salaryOperationType = operationType;
            this.salaryAccrualModalOpen = true;
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'users' });
            }
        },
    }
};
</script>
