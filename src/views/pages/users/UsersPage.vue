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
            </template>
            <template #filters-desktop>
              <FiltersContainer
                :has-active-filters="hasActiveFilters"
                :active-filters-count="getActiveFiltersCount()"
                @reset="resetFilters"
                @apply="applyFilters"
              >
                <div class="flex items-center justify-between gap-3">
                  <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('showInactive') }}</span>
                  <ToggleSwitch
                    :model-value="showInactiveFilter"
                    :aria-label="$t('showInactive')"
                    @update:model-value="setShowInactiveFilter"
                  />
                </div>
              </FiltersContainer>
            </template>
            <template #gear="{ resetColumns, columns, toggleVisible, log }">
              <TableFilterButton
                v-if="columns && columns.length"
                :on-reset="resetColumns"
              >
                <TableColumnDateModeSection :items="dateColumnsForSettings(columns)"
                  :resolve-mode="resolveColumnDateMode"
                  @set-mode="(item, mode) => setColumnDateDisplayMode(columns, item.index, mode)" />
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
                            class="text-sm mr-2 text-[var(--color-info)]"
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
        </template>
        <template #card-bar-filters-desktop>
          <FiltersContainer
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @reset="resetFilters"
            @apply="applyFilters"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('showInactive') }}</span>
              <ToggleSwitch
                :model-value="showInactiveFilter"
                :aria-label="$t('showInactive')"
                @update:model-value="setShowInactiveFilter"
              />
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
            :card-mapper="userCardMapper"
            card-layout="entity"
            title-field="title"
            title-subtitle-field="idSubtitle"
            :entity="userEntityCard"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('users_delete')"
            @dblclick="onItemClick"
            @select-toggle="toggleSelectRow"
          >
            <template #entity-footer-actions="{ item }">
              <ClientCardContactActions
                :client="userContactClient(item)"
                in-footer
              />
            </template>
          </MapperCardGrid>
        </template>
      </CardListViewShell>
    <div
      v-else
      key="loader"
      class="min-h-64"
    >
      <TableSkeleton v-if="displayViewMode === 'table'" />
      <CardsSkeleton
        v-else
        layout="entity"
      />
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
      :initial-tab="$route.query.tab"
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
import UsersController from '@/api/UsersController';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableColumnDateModeSection from '@/views/components/app/forms/TableColumnDateModeSection.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import { VueDraggableNext } from 'vue-draggable-next';
import UsersCreatePage from './UsersCreatePage.vue';
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
import PhonesTableCell from '@/views/components/app/buttons/PhonesTableCell.vue';
import UserIdCell from '@/views/components/app/buttons/UserIdCell.vue';
import ClientCardContactActions from '@/views/components/clients/ClientCardContactActions.vue';
import {
    entityChip,
    entityMeta,
    entityFooterDate,
    entityFooterCaption,
    mapEntityIdSubtitle,
    mapEntityChip,
    buildEntityAccentPillHtml,
    createEntityCardOptions,
    resolveEntityCardField,
} from '@/utils/entityCardUtils';

import listQueryMixin from '@/mixins/listQueryMixin';
import tableColumnDateModeMixin from '@/mixins/tableColumnDateModeMixin';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import { markRaw } from 'vue';

const usersViewModeMixin = createStoreViewModeMixin({
    getter: 'usersViewMode',
    dispatch: 'setUsersViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, UsersCreatePage, DraggableTable, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, TableColumnDateModeSection, FiltersContainer, TableSkeleton, CardsSkeleton, ViewModeToggle, MapperCardGrid, CardListViewShell, CardFieldsGearMenu, ClientCardContactActions, ToggleSwitch, draggable: VueDraggableNext },
    mixins: [notificationMixin, modalMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, cardFieldsVisibilityMixin, usersViewModeMixin, tableColumnDateModeMixin],
    data() {
        return {
            tableColumnsPersistKey: 'admin.users',
            cardFieldsKey: 'admin.users.cards',
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
            showInactiveFilter: false,
        };
    },
    computed: {
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                {
                    name: 'id',
                    label: 'ID',
                    size: 90,
                    component: markRaw(UserIdCell),
                    props: (item) => ({ user: item, searchQuery: this.searchQuery })
                },
                { name: 'name', label: 'firstName', html: true },
                { name: 'surname', label: 'lastName', html: true },
                { name: 'email', label: 'email', html: true },
                {
                    name: 'phone',
                    label: 'phoneNumber',
                    component: markRaw(PhonesTableCell),
                    props: (item) => ({
                        phones: item.phone != null && String(item.phone).trim()
                            ? [{ phone: String(item.phone).trim() }]
                            : [],
                        isDeleted: false,
                        searchQuery: this.searchQuery
                    })
                },
                { name: 'position', label: 'position', html: true },
                { name: 'roles', label: 'roles', html: true },
                { name: 'companies', label: 'companies', html: true },
                { name: 'isActive', label: 'active', size: 80 },
                { name: 'isAdmin', label: 'admin', size: 80 },
                { name: 'lastLoginAt', label: 'lastLogin', visible: false },
                { name: 'createdAt', label: 'created', visible: false },
            ];
        },
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
                entityChip('position', 'fas fa-briefcase'),
                entityChip('companies', 'fas fa-building'),
                entityMeta('roles', 'roles'),
                entityFooterDate(),
                entityFooterCaption('adminCaption', { captionClass: 'entity-card__footer-caption--chip' }),
            ];
        },
        userEntityCard() {
            return createEntityCardOptions({
                showAccent: false,
                dateOf: (item) => item?.lastLoginAt ?? item?.createdAt ?? null,
                isInactiveCard: (item) => !item?.isActive,
            });
        },
        cardConfigMerged() {
            return (this.cardFields || []).map((f) => ({ ...f, visible: f.visible }));
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
        setShowInactiveFilter(value) {
            this.showInactiveFilter = Boolean(value);
            this.applyFilters();
        },
        userContactClient(user) {
            const phone = user?.phone != null && String(user.phone).trim() ? String(user.phone).trim() : '';
            const email = user?.email != null && String(user.email).trim() ? String(user.email).trim() : '';
            return {
                phones: phone ? [{ phone }] : [],
                emails: email ? [{ email }] : [],
            };
        },
        mapUserCompaniesHtml(item, searchActive, search) {
            const companies = Array.isArray(item?.companies) ? item.companies : [];
            if (!companies.length) {
                return '';
            }
            const storeCompanies = this.$store.getters.userCompanies || [];
            const byId = new Map(storeCompanies.map((company) => [Number(company.id), company]));
            const rows = companies.map((company) => {
                const full = byId.get(Number(company.id));
                const logoSrc = full?.logoUrl?.() || '/logo.png';
                const name = company.name || '';
                const nameHtml = searchActive && name
                    ? highlightMatches(name, search)
                    : name;
                return (
                    `<span class="entity-card__chip entity-card__chip--company">` +
                    `<img src="${logoSrc}" alt="" class="entity-card__company-logo" loading="lazy" width="16" height="16" />` +
                    `<span>${nameHtml}</span>` +
                    `</span>`
                );
            });
            return `<span class="entity-card__company-list">${rows.join('')}</span>`;
        },
        userCardMapper(item, fieldName) {
            if (!item) {
                return '';
            }
            const search = this.searchQuery?.trim();
            const searchActive = search && search.length >= 3;
            const fullName = [item.name, item.surname].filter(Boolean).join(' ').trim();
            return resolveEntityCardField(item, fieldName, {
                title: () => {
                    const displayName = fullName || String(item.id);
                    return searchActive && fullName
                        ? highlightMatches(displayName, search)
                        : displayName;
                },
                idSubtitle: () => mapEntityIdSubtitle(item.id),
                position: () => {
                    const value = item.position;
                    if (!value || value === '—') {
                        return '';
                    }
                    const label = searchActive
                        ? highlightMatches(String(value), search)
                        : String(value);
                    return mapEntityChip('fas fa-briefcase', label);
                },
                companies: () => this.mapUserCompaniesHtml(item, searchActive, search),
                adminCaption: () => {
                    if (!item.isAdmin) {
                        return '';
                    }
                    return buildEntityAccentPillHtml('var(--nav-accent)', 'fas fa-user-shield', this.$t('admin'));
                },
            }, (name) => this.itemMapper(item, name) ?? '—');
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
                    return item.id;
                case 'isActive':
                    return item.isActive ? '?' : '?';
                case 'isAdmin':
                    return item.isAdmin ? '?' : '?';
                case 'createdAt':
                    return this.formatDatabaseDate(item.createdAt);
                case 'lastLoginAt':
                    return item.lastLoginAt ? this.formatDatabaseDateTime(item.lastLoginAt) : '—';
                case 'phone': {
                    const raw = item.phone != null && String(item.phone).trim() ? String(item.phone).trim() : '';
                    return raw || '—';
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
        getBatchActions() {
            const actions = [];

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
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'users' });
            }
        },
    }
};
</script>
