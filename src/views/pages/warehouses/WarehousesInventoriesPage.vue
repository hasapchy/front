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
    <SideModalDialog :show-form="modalDialog" :title="inventoryModalTitle" :onclose="closeModal">
      <WarehousesInventoryCreatePage
        v-if="modalDialog"
        :editing-item="editingItem"
        @saved="handleCreated"
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
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  components: { DraggableTable, TableControlsBar, PrimaryButton, SideModalDialog, WarehousesInventoryCreatePage, TableSkeleton },
  mixins: [notificationMixin, getApiErrorMessageMixin],
  data() {
    return {
      modalDialog: false,
      editingItem: null,
      savedErrorText: this.$t('errorSavingInventory'),
      loading: true,
      data: null,
      perPage: 20,
      perPageOptions: [20, 50],
      columnsConfig: [
        { name: 'id', label: 'number', size: 80 },
        { name: 'status', label: 'status' },
        { name: 'itemsCount', label: 'products' },
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
    itemMapper(item, col) {
      if (col === 'itemsCount') return item.items_count;
      if (col === 'startedAt') return dtoDateFormatters.formatCreatedAt(item.started_at) || '—';
      if (col === 'status') return this.statusLabel(item.status);
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
        const msg = this.getApiErrorMessage(e);
        const text = Array.isArray(msg) ? msg.join(', ') : msg;
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
      this.modalDialog = true;
    },
    closeModal() {
      this.modalDialog = false;
      this.editingItem = null;
    },
    handleCreated() {
      this.closeModal();
      this.fetchItems(1);
    },
    handleSavedError(err) {
      const readOnly = [
        this.$t('transactionReadonlyDueToSource'),
        this.$t('transactionDeletedReadonly'),
      ].filter(Boolean);
      const lines = typeof err === 'string'
        ? (err ? [err] : [])
        : (() => {
          const parsed = this.getApiErrorMessage(err);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : (parsed ? [parsed] : []);
        })();
      const readonlyHit = readOnly.find((msg) => lines.includes(msg));
      if (readonlyHit) {
        this.showNotification(this.$t('warning') || this.savedErrorText, readonlyHit, { isDanger: false, isInfo: true });
        return;
      }
      const messages = lines.length ? lines : [this.$t('error')];
      this.showNotification(this.savedErrorText || this.$t('error'), messages, true);
    },
  },
};
</script>
