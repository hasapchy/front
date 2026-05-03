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
        :cards-toolbar="inventoriesCardsToolbar"
      >
        <template #table>
          <DraggableTable
            table-key="admin.inventories"
            :columns-config="columnsConfig"
            :table-data="data.items || []"
            :item-mapper="itemMapper"
            :on-item-click="openModal"
          >
            <template #tableControlsBar="{ resetColumns, columns, toggleVisible, log }">
              <TableControlsBar
                :show-pagination="true"
                :pagination-data="inventoriesPaginationData"
                :on-page-change="fetchItems"
                :on-per-page-change="handlePerPageChange"
                :reset-columns="resetColumns"
                :columns="columns"
                :toggle-visible="toggleVisible"
                :log="log"
              >
                <template #left>
                  <div class="flex shrink-0 items-center gap-2">
                    <PrimaryButton
                      :onclick="() => openModal()"
                      icon="fas fa-plus"
                      :disabled="!$store.getters.hasPermission('inventories_create')"
                    />
                    <WarehouseInventoryFilters
                      :status-filter="statusFilter"
                      :has-active-filters="hasActiveFilters"
                      :active-filters-count="getActiveFiltersCount()"
                      @update:status-filter="statusFilter = $event"
                      @reset="resetFilters"
                      @apply="applyFilters"
                    />
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
    <SideModalDialog :show-form="modalDialog" :title="inventoryModalTitle" :onclose="handleModalClose">
      <WarehousesInventoryCreatePage
        ref="warehousesinventorycreatepageForm"
        v-if="inventoryFormShell"
        :key="inventoryFormKey"
        :editing-item="editingItem"
        @saved="handleSaved"
        @saved-error="handleSavedError"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableControlsBar from '@/views/components/app/forms/TableControlsBar.vue';
import TableFilterButton from '@/views/components/app/forms/TableFilterButton.vue';
import WarehouseInventoryFilters from '@/views/components/app/WarehouseInventoryFilters.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehousesInventoryCreatePage from '@/views/pages/warehouses/WarehousesInventoryCreatePage.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import CardsSkeleton from '@/views/components/app/CardsSkeleton.vue';
import CardListViewShell from '@/views/components/app/cards/CardListViewShell.vue';
import BaseController from '@/api/BaseController';
import InventoryController from '@/api/InventoryController';
import { dtoDateFormatters } from '@/utils/dateUtils';
import notificationMixin from '@/mixins/notificationMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';
import listQueryMixin from '@/mixins/listQueryMixin';
import companyChangeMixin from '@/mixins/companyChangeMixin';
import { createStoreViewModeMixin } from '@/mixins/storeViewModeMixin';
import { VueDraggableNext } from 'vue-draggable-next';

const warehouseInventoriesListViewModeMixin = createStoreViewModeMixin({
    listPageKey: 'warehouseInventories',
    modes: ['table'],
});

export default {
  components: {
    DraggableTable,
    TableControlsBar,
    TableFilterButton,
    WarehouseInventoryFilters,
    PrimaryButton,
    SideModalDialog,
    WarehousesInventoryCreatePage,
    TableSkeleton,
    CardsSkeleton,
    CardListViewShell,
    draggable: VueDraggableNext,
  },
  mixins: [notificationMixin, crudEventMixin, getApiErrorMessageMixin, listQueryMixin, companyChangeMixin, warehouseInventoriesListViewModeMixin],
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      inventoryFormShell: false,
      inventoryFormKey: 0,
      savedSuccessText: this.$t('inventorySuccessfullySaved'),
      savedErrorText: this.$t('errorSavingInventory'),
      data: null,
      statusFilter: '',
      columnsConfig: [
        { name: 'id', label: 'number', size: 80 },
        { name: 'status', label: 'status', size: 130, html: true },
        { name: 'responsible', label: 'inventoryResponsible', size: 160 },
        { name: 'itemsCount', label: 'products' },
        { name: 'stockRecalc', label: 'inventoryStockRecalcColumn', size: 150, html: true },
        { name: 'startedAt', label: 'date' },
      ],
    };
  },
  computed: {
    isDataReady() {
      return this.data != null && !this.loading;
    },
    inventoriesCardsToolbar() {
      return {
        showPagination: false,
      };
    },
    inventoriesPaginationData() {
      if (!this.data) {
        return null;
      }
      const currentPage = this.data.currentPage ?? this.data.current_page;
      const lastPage = this.data.lastPage ?? this.data.last_page;
      if (currentPage == null || lastPage == null) {
        return null;
      }
      return {
        currentPage,
        lastPage,
        perPage: this.perPage,
        perPageOptions: this.perPageOptions,
      };
    },
    inventoryModalTitle() {
      if (this.editingItem?.status === 'completed') {
        return `${this.$t('inventory')} · ${this.$t('view')}`;
      }
      return this.$t('inventory');
    },
  },
  watch: {
    '$route.params.id': {
      immediate: false,
      handler() {
        this.openFromRouteIfNeeded();
      },
    },
  },
  mounted() {
    this.fetchItems();
    this.openFromRouteIfNeeded();
  },
  methods: {
    statusLabel(status) {
      const labels = {
        in_progress: this.$t('inventoryStatusInProgress'),
        completed: this.$t('inventoryStatusCompleted'),
      };
      return labels[status] || status || '—';
    },
    escHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },
    statusCellHtml(status) {
      const text = this.statusLabel(status);
      const safe = this.escHtml(text);
      if (status === 'in_progress') {
        return `<span class="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-900 dark:bg-amber-900/35 dark:text-amber-100">${safe}</span>`;
      }
      if (status === 'completed') {
        return `<span class="inline-flex rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-900 dark:bg-emerald-900/35 dark:text-emerald-100">${safe}</span>`;
      }
      return safe;
    },
    stockRecalcCellHtml(item) {
      const st = item.stock_recalc_status;
      if (st === 'not_required') {
        return `<span class="text-gray-600 dark:text-gray-400">${this.escHtml(this.$t('inventoryStockRecalcNotRequired'))}</span>`;
      }
      if (st === 'done') {
        return `<span class="font-medium text-emerald-700 dark:text-emerald-400">${this.escHtml(this.$t('inventoryStockRecalcDone'))}</span>`;
      }
      if (st === 'pending') {
        return `<span class="font-medium text-amber-700 dark:text-amber-400">${this.escHtml(this.$t('inventoryStockRecalcPending'))}</span>`;
      }
      return '<span class="text-gray-400">—</span>';
    },
    itemMapper(item, col) {
      if (col === 'itemsCount') return item.items_count;
      if (col === 'startedAt') return dtoDateFormatters.formatCreatedAt(item.started_at) || '—';
      if (col === 'status') return this.statusCellHtml(item.status);
      if (col === 'responsible') {
        const n = String(item.creator_name ?? '').trim();
        return n || '—';
      }
      if (col === 'stockRecalc') return this.stockRecalcCellHtml(item);
      return item[col];
    },
    listFilterParams() {
      const params = {};
      if (this.statusFilter) {
        params.status = this.statusFilter;
      }
      return params;
    },
    async fetchItems(page = 1, silent = false) {
      if (!silent) {
        this.loading = true;
      }
      try {
        const raw = await BaseController.getItems('/inventories', page, this.perPage, this.listFilterParams());
        this.data = {
          items: raw.items ?? [],
          currentPage: raw.current_page ?? raw.currentPage,
          lastPage: raw.last_page ?? raw.lastPage,
          total: raw.total,
          nextPage: raw.next_page ?? raw.nextPage,
        };
      } catch (e) {
        const text = this.apiErrorLinesAsString(e);
        this.showNotification(this.$t('error'), text || this.$t('errorLoadingInventories'), true);
        this.data = {
          items: [],
          currentPage: 1,
          lastPage: 1,
          total: 0,
          nextPage: null,
        };
      }
      if (!silent) {
        this.loading = false;
      }
    },
    async openFromRouteIfNeeded() {
      const routeId = Number(this.$route.params.id);
      if (!Number.isInteger(routeId) || routeId <= 0) {
        return;
      }

      try {
        const inventory = await InventoryController.getItem(routeId);
        if (inventory?.id) {
          this.openModal(inventory);
        }
      } catch {
        return;
      }
    },
    handlePerPageChange(v) {
      this.perPage = v;
      this.fetchItems(1);
    },
    openModal(item = null) {
      this.editingItem = item || null;
      if (!this.inventoryFormShell) {
        this.inventoryFormShell = true;
      } else {
        this.inventoryFormKey += 1;
      }
      this.modalDialog = true;
    },
    handleModalClose() {
      const formRef = this.$refs?.warehousesinventorycreatepageForm;
      if (formRef?.handleCloseRequest) {
        formRef.handleCloseRequest();
        return;
      }
      this.closeModal();
    },
    closeModal() {
      this.modalDialog = false;
      this.editingItem = null;
    },
    handleSaved() {
      this.showNotification(this.savedSuccessText, '', false);
      this.closeModal();
      this.fetchItems(1, true);
    },
    resetFilters() {
      this.statusFilter = '';
      this.fetchItems(1, true);
    },
    getActiveFiltersCount() {
      return this.getActiveFiltersCountFromConfig([
        { value: this.statusFilter, defaultValue: '' },
      ]);
    },
    async handleCompanyChanged(companyId, previousCompanyId) {
      this.statusFilter = '';
      await this.fetchItems(1, previousCompanyId == null);
    },
  },
};
</script>
