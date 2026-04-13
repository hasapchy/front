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
          table-key="admin.sales"
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
                  :disabled="!$store.getters.hasPermission('sales_create')"
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
                  <div>
                    <label class="block mb-2 text-xs font-semibold">{{ $t('dateFilter')
                    }}</label>
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
            :disabled="!$store.getters.hasPermission('sales_create')"
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
            :card-mapper="saleCardMapper"
            title-field="title"
            :title-prefix="saleCardTitlePrefix"
            :selected-ids="selectedIds"
            :show-checkbox="$store.getters.hasPermission('sales_delete')"
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
      :title="sideModalCrudTitle('sideModalGenSale', 'sideModalNomSale')"
      :onclose="handleModalClose"
    >
      <SaleCreatePage
        v-if="modalDialog"
        :key="editingItem ? editingItem.id : 'new-sale'"
        ref="salecreatepageForm"
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
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import SaleController from '@/api/SaleController';
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
import ClientButtonCell from '@/views/components/app/buttons/ClientButtonCell.vue';
import ProductsListCell from '@/views/components/app/buttons/ProductsListCell.vue';
import { markRaw } from 'vue';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import notificationMixin from '@/mixins/notificationMixin';
import modalMixin from '@/mixins/modalMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import batchActionsMixin from '@/mixins/batchActionsMixin';
import BatchButton from '@/views/components/app/buttons/BatchButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import { VueDraggableNext } from 'vue-draggable-next';

import { eventBus } from '@/eventBus';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import { highlightMatches } from '@/utils/searchUtils';
import ViewModeToggle from '@/views/components/app/ViewModeToggle.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import CardFieldsGearMenu from '@/views/components/app/CardFieldsGearMenu.vue';
import cardFieldsVisibilityMixin from '@/mixins/cardFieldsVisibilityMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';

const salesViewModeMixin = createStoreViewModeMixin({
    getter: 'salesViewMode',
    dispatch: 'setSalesViewMode',
    modes: ['table', 'cards'],
});

export default {
    components: { PrimaryButton, SideModalDialog, DraggableTable, SaleCreatePage, BatchButton, AlertDialog, TableControlsBar, TableFilterButton, FiltersContainer, TableSkeleton, CardsSkeleton, ViewModeToggle, MapperCardGrid, CardFieldsGearMenu, CardListViewShell, draggable: VueDraggableNext },
    mixins: [modalMixin, notificationMixin, crudEventMixin, batchActionsMixin, getApiErrorMessageMixin, companyChangeMixin, listQueryMixin, cardFieldsVisibilityMixin, salesViewModeMixin],
    data() {
        return {
            cardFieldsKey: 'admin.sales.cards',
            titleField: 'title',
            controller: SaleController,
            cacheInvalidationType: 'sales',
            itemViewRouteName: 'SaleView',
            baseRouteName: 'Sales',
            errorGettingItemText: this.$t('errorGettingSaleList'),
            showStatusSelect: false,
            deletePermission: 'sales_delete',
            savedSuccessText: this.$t('saleRecordAdded'),
            savedErrorText: this.$t('errorSavingRecord'),
            deletedSuccessText: this.$t('recordSuccessfullyDeleted'),
            deletedErrorText: this.$t('errorDeletingRecord'),
            columnsConfig: [
                { name: 'select', label: '#', size: 15 },
                { name: 'id', label: 'number', size: 60, html: true },
                { name: 'dateUser', label: 'dateUser' },
                { name: 'cashName', label: 'cashRegister' },
                { name: 'warehouseName', label: 'warehouse' },
                { name: 'client', label: 'buyer', component: markRaw(ClientButtonCell), props: (item) => ({ client: item.client, searchQuery: this.searchQuery }) },
                {
                    name: 'products',
                    label: 'products',
                    component: markRaw(ProductsListCell),
                    props: (item) => ({
                        products: item.products || []
                    })
                },
                { name: 'note', label: 'note' },
                { name: 'price', label: 'saleAmount' },
            ],
            dateFilter: 'all_time',
            startDate: null,
            endDate: null
        }
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
                perPageOptions: this.perPageOptions
            };
        },
        hasActiveFilters() {
            return this.dateFilter !== 'all_time' ||
                (this.startDate !== null && this.startDate !== '') ||
                (this.endDate !== null && this.endDate !== '');
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
                { name: 'dateUser', label: 'dateUser', icon: 'fas fa-calendar text-[#3571A4]' },
                { name: 'cashName', label: 'cashRegister', icon: 'fas fa-cash-register text-[#3571A4]' },
                { name: 'warehouseName', label: 'warehouse', icon: 'fas fa-warehouse text-[#3571A4]' },
                { name: 'client', label: 'buyer', icon: 'fas fa-user text-[#3571A4]', html: true },
                { name: 'products', label: 'products', icon: 'fas fa-box text-[#3571A4]' },
                { name: 'note', label: 'note', icon: 'fas fa-sticky-note text-[#3571A4]' },
                { name: 'price', label: 'saleAmount', icon: 'fas fa-money-bill text-[#3571A4]', slot: 'footer' },
            ];
        },
        cardConfigMerged() {
            const title = { name: 'title', label: null };
            const rest = (this.cardFields || []).map(f => ({ ...f, visible: f.visible }));
            return [title, ...rest];
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
        itemMapper(i, c) {
            const search = this.searchQuery;

            if (c === 'cashName') {
                return i.cashNameDisplay();
            }
            if (c === 'warehouseName') {
                return i.warehouseNameDisplay();
            }
            switch (c) {
                case 'id':
                    if (search) {
                        return highlightMatches(String(i.id ?? ''), search);
                    }
                    return i.id;
                case 'dateUser':
                    return `${i.formatDate()} / ${i.creator?.name }`;
                case 'products':
                    return (i.products || []).length;
                case 'price':
                    return i.priceInfo();
                case 'client': {
                    if (!i.client) return '';
                    const saleClientName = getClientDisplayName(i.client);
                    const saleClientPosition = getClientDisplayPosition(i.client);
                    const salePhone = i.client.phones?.[0]?.phone;
                    const salePositionPart = saleClientPosition ? `<div class="text-xs text-gray-500">${saleClientPosition}</div>` : '';
                    const salePhonePart = salePhone ? ` (<span>${salePhone}</span>)` : '';
                    return salePositionPart || salePhonePart ? `<div>${saleClientName}${salePositionPart}${salePhonePart}</div>` : saleClientName;
                }
                default:
                    return i[c];
            }
        },
        async handleCompanyChanged(companyId, previousCompanyId) {
            this.dateFilter = 'all_time';
            this.startDate = null;
            this.endDate = null;
            this.selectedIds = [];
            await this.fetchItems(1, previousCompanyId == null);
        },
        async fetchItems(page = 1, silent = false) {
            if (!silent) {
                this.loading = true;
            }
            try {

                this.data = await SaleController.getItems(page, this.searchQuery, this.dateFilter, this.startDate, this.endDate, this.perPage);
            } catch (error) {
                this.showNotification(this.$t('errorGettingSaleList'), error.message, true);
            }
            if (!silent) {
                this.loading = false;
            }
        },
        resetFilters() {
            this.resetFiltersFromConfig({
                dateFilter: 'all_time',
                startDate: null,
                endDate: null
            });
        },
        getActiveFiltersCount() {
            return this.getActiveFiltersCountFromConfig([
                { value: this.dateFilter, defaultValue: 'all_time' },
                { value: this.startDate, defaultValue: null },
                { value: this.endDate, defaultValue: null }
            ]);
        },
        async onAfterSaved() {
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        async onAfterDeleted() {
            await this.$store.dispatch('invalidateCache', { type: 'clients' });
            await this.$store.dispatch('loadClients');
        },
        saleCardTitlePrefix() {
            return '<i class="fas fa-shopping-cart text-[#3571A4] mr-1.5 flex-shrink-0"></i>';
        },
        saleCardMapper(item, fieldName) {
            if (!item) return '';
            switch (fieldName) {
                case 'title':
                    return `${this.$t('number')}${this.$t('symbolEmDash')}${item.id}`;
                case 'products':
                    return String((item.products || []).length);
                case 'price':
                    return item.priceInfo?.() ?? '';
                default:
                    return this.itemMapper(item, fieldName) ?? '';
            }
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