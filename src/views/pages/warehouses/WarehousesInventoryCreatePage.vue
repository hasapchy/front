<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <div class="mt-2">
        <label class="block mb-1 required">{{ $t('warehouse') }}</label>
        <select v-model="warehouseId" :disabled="readonly">
          <option value="">{{ $t('no') }}</option>
          <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('inventoryProductsForAudit') }}</label>
        <div
          v-if="previewLoading"
          class="min-h-48"
        >
          <TableSkeleton />
        </div>
        <DraggableTable
          v-else
          table-key="admin.inventory_create_products_preview"
          :columns-config="productsColumnsConfig"
          :table-data="previewItems"
          :item-mapper="itemMapper"
        />
      </div>
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div v-if="!readonly" class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          icon="fas fa-save"
          :onclick="() => persist('complete')"
          :is-loading="activeAction === 'complete'"
          :aria-label="$t('save')"
        />
        <PrimaryButton
          icon="fas fa-pause"
          :is-info="true"
          :onclick="() => persist('pause')"
          :is-loading="activeAction === 'pause'"
        >
          {{ $t('inventoryPause') }}
        </PrimaryButton>
        <PrimaryButton
          v-if="currentInventoryId"
          icon="fas fa-trash"
          :is-danger="true"
          :onclick="removeInventory"
          :is-loading="activeAction === 'delete'"
        >
          {{ $t('delete') }}
        </PrimaryButton>
      </div>
      <div v-else-if="readonly && currentInventoryId" class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="canExportExcel"
          icon="fas fa-file-excel"
          :is-info="true"
          :onclick="downloadInventoryExcel"
          :is-loading="activeAction === 'excel'"
        >
          {{ $t('inventoryExcel') }}
        </PrimaryButton>
        <PrimaryButton
          v-if="canApplyInventoryStockAdjustment"
          icon="fas fa-rotate"
          :onclick="applyInventoryStockAdjustment"
          :is-loading="activeAction === 'applyStock'"
          :disabled="stockRecalcDisabled"
        >
          {{ $t('inventoryStockRecalc') }}
        </PrimaryButton>
        <PrimaryButton
          v-if="canDeleteInventory"
          icon="fas fa-trash"
          :is-danger="true"
          :onclick="removeInventory"
          :is-loading="activeAction === 'delete'"
        >
          {{ $t('delete') }}
        </PrimaryButton>
      </div>
    </teleport>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import InventoryController from '@/api/InventoryController';
import ProductController from '@/api/ProductController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import InventoryActualQuantityCell from '@/views/components/app/buttons/InventoryActualQuantityCell.vue';
import InventoryDifferenceCell from '@/views/components/app/buttons/InventoryDifferenceCell.vue';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
  components: { PrimaryButton, DraggableTable, TableSkeleton },
  mixins: [sideModalFooterPortal, notificationMixin],
  props: {
    editingItem: {
      type: Object,
      default: null,
    },
  },
  emits: ['saved', 'saved-error'],
  data() {
    return {
      warehouseId: '',
      previewItems: [],
      previewLoading: false,
      activeAction: null,
      currentInventoryId: null,
      inventoryStatus: null,
      whReceiptId: null,
      whWriteOffId: null,
    };
  },
  computed: {
    warehouses() {
      return this.$store.getters.warehouses;
    },
    canExportExcel() {
      return this.$store.getters.hasPermission('inventories_export');
    },
    canApplyInventoryStockAdjustment() {
      return this.$store.getters.hasPermission('inventories_finalize');
    },
    canDeleteInventory() {
      return this.$store.getters.hasPermission('inventories_create');
    },
    readonly() {
      return this.inventoryStatus === 'completed';
    },
    hasPendingShortage() {
      return this.previewItems.some((row) => {
        const a = this.parseActual(row.actualQuantity);
        if (a === null) return false;
        return a < Number(row.stockQuantity);
      });
    },
    hasPendingOverage() {
      return this.previewItems.some((row) => {
        const a = this.parseActual(row.actualQuantity);
        if (a === null) return false;
        return a > Number(row.stockQuantity);
      });
    },
    stockRecalcDisabled() {
      if (!this.readonly || !this.currentInventoryId) return true;
      const needWriteoff = this.hasPendingShortage;
      const needReceipt = this.hasPendingOverage;
      if (!needWriteoff && !needReceipt) return true;
      if (needWriteoff && !this.whWriteOffId) return false;
      if (needReceipt && !this.whReceiptId) return false;
      return true;
    },
    productsColumnsConfig() {
      const ro = this.readonly;
      return [
        { name: 'productName', label: 'product' },
        { name: 'categoryName', label: 'category' },
        { name: 'stockQuantity', label: 'inventoryStockOnHand' },
        {
          name: 'actualQuantity',
          label: 'inventoryActualQuantity',
          component: markRaw(InventoryActualQuantityCell),
          props: (item) => ({
            value: item.actualQuantity,
            disabled: ro,
            onChange: (next) => {
              item.actualQuantity = next;
            },
          }),
        },
        {
          name: 'differenceQuantity',
          label: 'inventoryQuantityDifference',
          component: markRaw(InventoryDifferenceCell),
          props: (item) => ({
            expectedQuantity: item.stockQuantity,
            actualQuantity: item.actualQuantity,
            unitShortName: item.unitShortName,
          }),
        },
      ];
    },
  },
  watch: {
    warehouseId() {
      if (!this.currentInventoryId) this.loadPreviewItems();
    },
  },
  async mounted() {
    if (!this.warehouses.length) await this.$store.dispatch('loadWarehouses');
    if (this.editingItem?.id) {
      await this.loadExistingInventory(this.editingItem.id);
    } else if (this.warehouses.length) {
      this.warehouseId = this.warehouses[0].id;
      await this.loadPreviewItems();
    }
  },
  methods: {
    itemMapper(item, col) {
      if (col === 'stockQuantity') {
        return `${item.stockQuantity} ${item.unitShortName}`.trim();
      }
      return item[col];
    },
    parseActual(value) {
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    },
    emitApiError(e) {
      this.$emit('saved-error', e);
    },
    syncLinkedDocuments(inv) {
      this.whReceiptId = inv.whReceiptId;
      this.whWriteOffId = inv.whWriteOffId;
    },
    async loadExistingInventory(inventoryId) {
      this.previewLoading = true;
      this.currentInventoryId = Number(inventoryId);
      try {
        const inventory = await InventoryController.getItem(this.currentInventoryId);
        this.inventoryStatus = inventory.status;
        this.syncLinkedDocuments(inventory);
        this.warehouseId = inventory.warehouseId;

        const { items: list } = await InventoryController.getItems(this.currentInventoryId, 1, 1000);

        this.previewItems = list.map((item) => ({
          id: item.id,
          productName: item.productName,
          productId: item.productId,
          categoryName: item.categoryName,
          stockQuantity: item.expectedQuantity,
          unitShortName: item.unitShortName,
          actualQuantity: item.actualQuantity,
        }));
      } finally {
        this.previewLoading = false;
      }
    },
    async loadPreviewItems() {
      const wid = Number(this.warehouseId);

      if (!Number.isInteger(wid) || wid <= 0) {
        this.previewItems = [];
        this.previewLoading = false;
        return;
      }

      this.previewLoading = true;
      try {
        let page = 1;
        let lastPage = 1;
        const acc = [];

        do {
          const res = await ProductController.getItems(page, true, {
            warehouseId: wid,
            warehouseStockPolicy: 'all',
          }, 100);
          acc.push(...res.items);
          lastPage = res.lastPage;
          page += 1;
        } while (page <= lastPage);

        this.previewItems = acc.map((product) => ({
          id: product.id,
          productName: product.name,
          productId: product.id,
          categoryName: product.getCategoryDisplayName(),
          stockQuantity: product.stockQuantity,
          unitShortName: product.unitShortName,
          actualQuantity: null,
        }));
      } catch (e) {
        this.emitApiError(e);
      } finally {
        this.previewLoading = false;
      }
    },
    async ensureInventory() {
      const existing = Number(this.currentInventoryId);
      if (Number.isInteger(existing) && existing > 0) return existing;

      const inv = await InventoryController.create({
        warehouse_id: this.warehouseId,
      });
      const id = Number(inv.id);
      if (!Number.isInteger(id) || id <= 0) throw new Error('INVENTORY_CREATE_FAILED');

      this.currentInventoryId = id;
      this.inventoryStatus = inv.status;

      return id;
    },
    async pushActualQuantities(inventoryId) {
      const byProduct = new Map(
        this.previewItems.map((row) => [Number(row.productId), this.parseActual(row.actualQuantity)])
      );

      const { items } = await InventoryController.getItems(inventoryId, 1, 1000);
      const updates = items
        .filter((i) => byProduct.has(Number(i.productId)))
        .map((i) => ({ id: i.id, actual_quantity: byProduct.get(Number(i.productId)) }));

      if (updates.length) {
        await InventoryController.updateItems(inventoryId, { items: updates });
      }
    },
    async persist(mode) {
      if (this.readonly) return;

      this.activeAction = mode;
      try {
        const id = await this.ensureInventory();
        await this.pushActualQuantities(id);

        if (mode === 'complete') {
          const done = await InventoryController.finalize(id);
          this.inventoryStatus = done.status;
          this.syncLinkedDocuments(done);
        }

        if (mode === 'pause') {
          this.$emit('saved', { id });
        }
      } catch (e) {
        this.emitApiError(e);
      } finally {
        this.activeAction = null;
      }
    },
    async applyInventoryStockAdjustment() {
      const id = Number(this.currentInventoryId);
      if (!Number.isInteger(id) || id <= 0 || this.stockRecalcDisabled) return;

      this.activeAction = 'applyStock';
      try {
        const inv = await InventoryController.applyInventoryStockAdjustment(id);
        this.syncLinkedDocuments(inv);
        this.showNotification(this.$t('success'), this.$t('inventoryStockRecalcSuccess'), false);
      } catch (e) {
        this.emitApiError(e);
      } finally {
        this.activeAction = null;
      }
    },
    async downloadInventoryExcel() {
      const id = Number(this.currentInventoryId);
      if (!Number.isInteger(id) || id <= 0) return;

      this.activeAction = 'excel';
      try {
        const res = await InventoryController.export(id);
        const blob = new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${id}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        this.emitApiError(e);
      } finally {
        this.activeAction = null;
      }
    },
    async removeInventory() {
      const id = Number(this.currentInventoryId);
      if (!Number.isInteger(id) || id <= 0) return;

      this.activeAction = 'delete';
      try {
        await InventoryController.delete(id);
        this.$emit('saved', { id });
      } catch (e) {
        this.emitApiError(e);
      } finally {
        this.activeAction = null;
      }
    },
  },
};
</script>
