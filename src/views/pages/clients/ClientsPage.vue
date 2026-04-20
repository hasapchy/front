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
        cards-root-class="clients-cards-container"
      >
        <template #table>
        <DraggableTable
          table-key="common.clients"
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
              :export-permission="exportPermission"
              :on-export="handleExport"
              :export-loading="exportLoading"
              :reset-columns="resetColumns"
              :columns="columns"
              :toggle-visible="toggleVisible"
              :log="log"
            >
              <template #left>
                <PrimaryButton 
                  :onclick="() => { showModal(null) }"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('clients_create')"
                />
                <ViewModeToggle
                  :view-mode="displayViewMode"
                  :show-kanban="false"
                  :show-cards="true"
                  @change="changeViewMode"
                />
                <transition name="fade">
                  <BatchButton
                    v-if="selectedIds.length"
                    :selected-ids="selectedIds"
                    :batch-actions="getBatchActions()"
                  />
                </transition>
              </template>
              <template #filters-desktop>
                <ClientFilters
                  :status-filter="statusFilter"
                  :type-filter="typeFilter"
                  :has-active-filters="hasActiveFilters"
                  :active-filters-count="getActiveFiltersCount()"
                  @update:status-filter="statusFilter = $event"
                  @update:type-filter="typeFilter = $event"
                  @reset="resetFilters"
                  @apply="applyFilters"
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
            :onclick="() => { showModal(null) }"
            icon="fas fa-plus"
            :disabled="!$store.getters.hasPermission('clients_create')"
          />
          <ViewModeToggle
            :view-mode="displayViewMode"
            :show-kanban="false"
            :show-cards="true"
            @change="changeViewMode"
          />
          <transition name="fade">
            <BatchButton
              v-if="selectedIds.length"
              :selected-ids="selectedIds"
              :batch-actions="getBatchActions()"
            />
          </transition>
        </template>
        <template #card-bar-filters-desktop>
          <ClientFilters
            :status-filter="statusFilter"
            :type-filter="typeFilter"
            :has-active-filters="hasActiveFilters"
            :active-filters-count="getActiveFiltersCount()"
            @update:status-filter="statusFilter = $event"
            @update:type-filter="typeFilter = $event"
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
            :card-mapper="cardMapper"
            title-field="title"
            title-subtitle-field="titleSubtitle"
            :title-prefix="clientCardTitlePrefix"
            header-suffix-field="dateUser"
            :header-suffix="clientCardHeaderSuffix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('clients_delete')"
            :footer-color-class="clientFooterColorClass"
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
      :title="sideModalCrudTitle('sideModalGenClient', 'sideModalNomClient', undefined, sideModalLabelClient)"
      :onclose="handleModalClose"
      :timeline-collapsed="timelineCollapsed"
      :show-timeline-button="!!editingItem"
      @toggle-timeline="toggleTimeline"
    >
      <ClientCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new'"
        ref="clientForm"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
        @deleted="handleDeleted"
        @deleted-error="handleDeletedError"
        @close-request="closeModal"
        @editing-item-update="onClientEditingItemUpdate"
      />

      <template #timeline>
        <TimelinePanel
          v-if="editingItem && !timelineCollapsed"
          :id="editingItem.id"
          ref="timelinePanel"
          :type="'client'"
          @toggle-timeline="toggleTimeline"
        />
      </template>
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
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import ClientController from '@/api/ClientController';
import ClientCreatePage from './ClientCreatePage.vue';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import batchActionsMixin from '@/mixins/batchActionsMixin'
import crudEventMixin from '@/mixins/crudEventMixin';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import { eventBus } from '@/eventBus';
import { VueDraggableNext } from 'vue-draggable-next';

import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import ClientNameCell from '@/views/components/app/buttons/ClientNameCell.vue';
import StatusIconCell from '@/views/components/app/buttons/StatusIconCell.vue';
import ListCell from '@/views/components/app/buttons/ListCell.vue';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import ClientFilters from '@/views/components/app/ClientFilters.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import { markRaw } from 'vue';
import { highlightMatches } from '@/utils/searchUtils';
import { TimelinePanelAsync } from '@/utils/timelinePanelAsync';
import timelineSideModalMixin from '@/mixins/timelineSideModalMixin';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import exportTableMixin from '@/mixins/exportTableMixin';

import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const clientsViewModeMixin = createStoreViewModeMixin({
    getter: 'clientsViewMode',
    dispatch: 'setClientsViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, DraggableTable, TableControlsBar, TableFilterButton, TableSkeleton, ClientCreatePage, BatchButton, AlertDialog, ClientFilters, CardFieldsGearMenu, ViewModeToggle, CardsSkeleton, MapperCardGrid, CardListViewShell, TimelinePanel: TimelinePanelAsync, draggable: VueDraggableNext },
    mixins: [batchActionsMixin, crudEventMixin, notificationMixin, modalMixin, companyChangeMixin, getApiErrorMessageMixin, cardFieldsVisibilityMixin, exportTableMixin, listQueryMixin, clientsViewModeMixin, timelineSideModalMixin],
    data() {
        return {
            cardFieldsKey: 'common.clients',
            titleField: 'title',
            controller: ClientController,
            cacheInvalidationType: 'clients',
            deletePermission: 'clients_delete',
            itemViewRouteName: 'ClientView',
            baseRouteName: 'Clients',
            errorGettingItemText: this.$t('errorGettingClient'),
            statusFilter: '',
            typeFilter: '',
            savedSuccessText: this.$t('clientSuccessfullyAdded'),
            savedErrorText: this.$t('errorSavingClient'),
            deletedSuccessText: this.$t('clientSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingClient'),
        }
    },
    computed: {
        exportPermission() {
            return 'clients_export';
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
        searchQuery() {
            return this.$store.state.searchQuery;
        },
        hasActiveFilters() {
            return this.statusFilter !== '' || this.typeFilter !== '';
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
                exportPermission: this.exportPermission,
                onExport: this.handleExport,
                exportLoading: this.exportLoading,
            };
        },
        cardConfigBase() {
            return [
                { name: 'title', label: null },
                { name: 'phones', label: 'phoneNumber', icon: 'fas fa-phone text-[#3571A4]' },
                { name: 'emails', label: 'email', icon: 'fas fa-envelope text-[#3571A4]' },
                { name: 'address', label: 'address', icon: 'fas fa-location-dot text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
                {
                    name: 'balance',
                    label: 'balance',
                    slot: 'footer',
                    visible: () => this.$store.getters.hasPermission('settings_client_balance_view')
                }
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => {
                if (f.name === 'balance') {
                    return {
                        ...f,
                        visible: () => f.visible && this.$store.getters.hasPermission('settings_client_balance_view')
                    };
                }
                return { ...f, visible: f.visible };
            });
            return [title, ...rest];
        },
        columnsConfig() {
            return [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                {
                    name: 'firstName',
                    label: 'fullNameCompany',
                    component: markRaw(ClientNameCell),
                    props: (item) => ({ client: item, searchQuery: this.searchQuery })
                },
                {
                    name: 'phones',
                    label: 'phoneNumber',
                    component: markRaw(ListCell),
                    props: (item) => ({
                        items: item.phones || [],
                        getValue: (phone) => phone.phone
                    })
                },
                {
                    name: 'emails',
                    label: 'email',
                    component: markRaw(ListCell),
                    props: (item) => ({
                        items: item.emails || [],
                        getValue: (email) => email.email
                    })
                },
                { name: 'address', label: 'address' },
                { name: 'note', label: 'note' },
                { name: 'discount', label: 'discount', html: true },
                ...(this.$store.getters.hasPermission('settings_client_balance_view') ? [{ name: 'balance', label: 'balance' }] : []),
                {
                    name: 'status',
                    label: 'status',
                    component: markRaw(StatusIconCell),
                    props: (item) => ({
                        status: item.status
                    })
                },
                { name: 'dateUser', label: 'dateUser' },
            ];
        },
    },
    watch: {
        '$route.params.id': {
            immediate: true,
            handler(value) {
                this.handleRouteItem(value);
            }
        },
    },
    created() {
        this.$store.commit('SET_SETTINGS_OPEN', false);
        
        eventBus.on('global-search', this.handleSearch);
    },

    mounted() {
        this.fetchItems();
    },
    beforeUnmount() {
        eventBus.off('global-search', this.handleSearch);
    },

    methods: {
        showModal(item = null) {
            this.resetTimelineSidebar();
            modalMixin.methods.showModal.call(this, item);
        },
        closeModal(skipScrollRestore = false) {
            modalMixin.methods.closeModal.call(this, skipScrollRestore);
            if (this.$route.params.id) {
                this.$router.replace({ name: 'Clients' });
            }
            this.resetTimelineSidebar();
        },
        onClientEditingItemUpdate(clientData) {
            if (this.editingItem && clientData) {
                Object.assign(this.editingItem, clientData);
            }
        },
        itemMapper(i, c) {
            const search = this.searchQuery;

            switch (c) {
                case 'id':
                    if (search) {
                        return highlightMatches(String(i.id ?? ''), search);
                    }
                    return i.id;
                case 'discount':
                    return i.discountFormatted();
                case 'balance':
                    return i.balanceFormatted();
                case 'dateUser':
                    return i.formatCreatedAt();
                default:
                    return i[c];
            }
        },
        clientCardTitlePrefix(item) {
            const typeMap = {
                individual: 'fas fa-user text-[#3571A4]',
                company: 'fas fa-building text-[#3571A4]',
                employee: 'fas fa-id-badge text-[#3571A4]',
                investor: 'fas fa-hand-holding-usd text-[#3571A4]'
            };
            const type = item.clientType || 'individual';
            const iconClass = typeMap[type] || typeMap.individual;
            return `<i class="${iconClass} mr-1.5 flex-shrink-0" title="${this.$t('clientType')}"></i>`;
        },
        clientCardHeaderSuffix(item) {
            const parts = [];
            const activeTitle = this.$t('active');
            const activeIcon = item.status
                ? '<i class="fas fa-circle-check text-green-600" title="' + activeTitle + '"></i>'
                : '<i class="fas fa-circle-xmark text-red-500" title="' + (this.$t('inactive')) + '"></i>';
            parts.push(activeIcon);
            if (item.isSupplier) {
                const supplierTitle = this.$t('supplier');
                parts.push('<i class="fas fa-truck text-[#3571A4]" title="' + supplierTitle + '"></i>');
            }
            if (item.isConflict) {
                const problemTitle = this.$t('problemClient');
                parts.push('<i class="fas fa-angry text-[#D53935]" title="' + problemTitle + '"></i>');
            }
            return parts.join('');
        },
        cardMapper(item, fieldName) {
            switch (fieldName) {
                case 'title':
                    return getClientDisplayName(item) ;
                case 'titleSubtitle':
                    return getClientDisplayPosition(item);
                case 'phones': {
                    const phones = item.phones || [];
                    if (phones.length === 0) return '—';
                    const phoneList = phones.slice(0, 2).map(p => p?.phone).filter(Boolean);
                    return phoneList.join(', ') || '—';
                }
                case 'emails':
                    return item.emails?.[0]?.email ?? '—';
                case 'address':
                    return item.address ?? '—';
                case 'note':
                    return item.note ?? '—';
                case 'balance':
                    return item.balanceFormatted() + (item.currencySymbol ? ` ${item.currencySymbol}` : '');
                case 'discount':
                    return item.discountFormatted();
                default:
                    return this.itemMapper(item, fieldName) ?? '—';
            }
        },
        clientFooterColorClass(item, fieldName) {
            if (fieldName === 'balance' && item.balance != null) {
                return item.balance >= 0 ? 'text-green-600' : 'text-red-600';
            }
            return null;
        },
        getExportParams() {
            return {
                search: this.searchQuery || undefined,
                includeInactive: this.statusFilter === 'inactive',
                statusFilter: this.statusFilter || undefined,
                typeFilter: this.typeFilter != null ? (Array.isArray(this.typeFilter) ? this.typeFilter : [this.typeFilter]) : undefined,
            };
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.statusFilter = '';
            this.typeFilter = '';
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {
                this.data = await ClientController.getItems(page, this.searchQuery, this.statusFilter === 'inactive', this.statusFilter, this.typeFilter, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingClientList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                statusFilter: '',
                typeFilter: ''
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.statusFilter, defaultValue: '' },
                { value: this.typeFilter, defaultValue: '' }
            ]);
        },
        toggleSelectRow(id) {
            if (!id) return;
            if (this.selectedIds.includes(id)) {
                this.selectedIds = this.selectedIds.filter(x => x !== id);
            } else {
                this.selectedIds = [...this.selectedIds, id];
            }
        },
    },
}
</script>