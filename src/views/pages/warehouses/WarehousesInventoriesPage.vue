<template>
  <div>
    <transition
      name="fade"
      mode="out-in"
    >
      <div
        v-if="!loading && data"
        key="content"
      >
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
                <PrimaryButton
                  :onclick="() => openModal()"
                  icon="fas fa-plus"
                  :disabled="!$store.getters.hasPermission('inventories_create')"
                />
              </template>
            </TableControlsBar>
          </template>
        </DraggableTable>
      </div>
      <div
        v-else
        key="loader"
        class="min-h-64"
      >
        <TableSkeleton />
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
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import WarehousesInventoryCreatePage from '@/views/pages/warehouses/WarehousesInventoryCreatePage.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import BaseController from '@/api/BaseController';
import InventoryController from '@/api/InventoryController';
import { dtoDateFormatters } from '@/utils/dateUtils';
import notificationMixin from '@/mixins/notificationMixin';
import crudEventMixin from '@/mixins/crudEventMixin';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  components: { DraggableTable, TableControlsBar, PrimaryButton, SideModalDialog, WarehousesInventoryCreatePage, TableSkeleton },
  mixins: [notificationMixin, crudEventMixin, getApiErrorMessageMixin],
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      inventoryFormShell: false,
      inventoryFormKey: 0,
      savedSuccessText: this.$t('inventorySuccessfullySaved'),
      savedErrorText: this.$t('errorSavingInventory'),
      loading: true,
      data: null,
      columnsConfig: [
        { name: 'id', label: 'number', size: 80 },
        { name: 'status', label: 'status', size: 130, html: true },
        { name: 'itemsCount', label: 'products' },
        { name: 'stockRecalc', label: 'inventoryStockRecalcColumn', size: 150, html: true },
        { name: 'startedAt', label: 'date' },
      ],
    };
  },
  computed: {
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
      if (col === 'stockRecalc') return this.stockRecalcCellHtml(item);
      return item[col];
    },
    async fetchItems(page = 1) {
      const showSkeleton = this.data === null;
      if (showSkeleton) {
        this.loading = true;
      }
      try {
        const raw = await BaseController.getItems('/inventories', page, this.perPage);
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
      } finally {
        if (showSkeleton) {
          this.loading = false;
        }
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
      this.fetchItems(1);
    },
  },
};
</script>
