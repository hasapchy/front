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
      <div
        v-if="categoryOptions.length"
        class="mt-2"
      >
        <label class="block mb-1">{{ $t('category') }}</label>
        <div
          class="min-w-0"
          :class="{ 'pointer-events-none opacity-60': !!currentInventoryId || readonly }"
        >
          <CheckboxFilter
            v-model="selectedCategoryIds"
            :options="categoryOptions"
            :placeholder="'selectCategories'"
            :single-line-preview="true"
            @change="loadPreviewItems"
          />
        </div>
      </div>
      <div class="mt-2">
        <label class="block mb-1">{{ $t('inventoryProductsForAudit') }}</label>
        <div
          v-if="currentInventoryId"
          class="mb-2 flex flex-wrap items-center gap-3"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm text-gray-900 dark:text-[var(--text-primary)]">{{ $t('inventoryHideMatchedPositions') }}</span>
            <ToggleSwitch
              v-model="hideMatchedPositions"
              :aria-label="$t('inventoryHideMatchedPositions')"
            />
          </div>
          <FiltersContainer
            :has-active-filters="differenceFilter !== 'all'"
            :active-filters-count="differenceFilter !== 'all' ? 1 : 0"
            @reset="resetDifferenceFilter"
            @apply="applyDifferenceFilter"
          >
            <div>
              <select v-model="differenceFilter" class="w-full">
                <option
                  v-for="option in differenceFilterOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
          </FiltersContainer>
        </div>
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
          :table-data="filteredPreviewItems"
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
          icon="fas fa-file-pen"
          :is-info="true"
          :onclick="() => persist('pause')"
          :is-loading="activeAction === 'pause'"
        >
          {{ $t('inventoryDraft') }}
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
          :onclick="openApplyStockConfirmDialog"
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
    <AlertDialog
      :dialog="applyStockConfirmDialog"
      :descr="'Вы уверены?'"
      :confirm-text="$t('confirm')"
      :leave-text="$t('cancel')"
      @confirm="confirmApplyInventoryStockAdjustment"
      @leave="applyStockConfirmDialog = false"
    />
  </div>
</template>

<script>
import { markRaw } from 'vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import InventoryController from '@/api/InventoryController';
import ProductController from '@/api/ProductController';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';
import CheckboxFilter from '@/views/components/app/forms/CheckboxFilter.vue';
import FiltersContainer from '@/views/components/app/forms/FiltersContainer.vue';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import InventoryActualQuantityCell from '@/views/components/app/buttons/InventoryActualQuantityCell.vue';
import InventoryDifferenceCell from '@/views/components/app/buttons/InventoryDifferenceCell.vue';
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ToggleSwitch from '@/views/components/app/forms/ToggleSwitch.vue';
import notificationMixin from '@/mixins/notificationMixin';
import { formatQuantity } from '@/utils/numberUtils';
import getApiErrorMessageMixin from '@/mixins/getApiErrorMessageMixin';

export default {
  components: { PrimaryButton, DraggableTable, TableSkeleton, CheckboxFilter, FiltersContainer, AlertDialog, ToggleSwitch },
  mixins: [sideModalFooterPortal, notificationMixin, getApiErrorMessageMixin],
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
      selectedCategoryIds: [],
      hideMatchedPositions: false,
      differenceFilter: 'all',
      applyStockConfirmDialog: false,
    };
  },
  computed: {
    warehouses() {
      return this.$store.getters.warehouses || [];
    },
    categoryOptions() {
      const cats = this.$store.getters.categories || [];
      return cats.map((cat) => {
        const parent = cat.parentId ? cats.find((c) => c.id == cat.parentId) : null;
        const label = parent ? `${cat.name} (${parent.name})` : cat.name;
        return {
          value: cat.id.toString(),
          label,
        };
      });
    },
    parsedCategoryIds() {
      return (this.selectedCategoryIds || [])
        .map((id) => parseInt(id, 10))
        .filter((n) => Number.isInteger(n) && n > 0);
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
    differenceFilterOptions() {
      return [
        { value: 'all', label: this.$t('filterAll') },
        { value: 'overage', label: this.$t('inventoryDifferenceStatusOverage') },
        { value: 'shortage', label: this.$t('inventoryDifferenceStatusShortage') },
      ];
    },
    filteredPreviewItems() {
      return this.previewItems.filter((item) => {
        const actual = this.parseActual(item.actualQuantity);
        const expected = Number(item.stockQuantity);
        const diff = (actual === null ? 0 : actual) - (Number.isFinite(expected) ? expected : 0);

        if (this.hideMatchedPositions && diff === 0) return false;
        if (this.differenceFilter === 'overage') return diff > 0;
        if (this.differenceFilter === 'shortage') return diff < 0;

        return true;
      });
    },
  },
  watch: {
    warehouseId() {
      if (this.currentInventoryId) return;
      this.loadPreviewItems();
    },
  },
  async mounted() {
    if (!this.warehouses.length) await this.$store.dispatch('loadWarehouses');
    if (!(this.$store.getters.categories || []).length) await this.$store.dispatch('loadCategories');
    if (this.editingItem?.id) {
      await this.loadExistingInventory(this.editingItem.id);
    } else if (this.warehouses.length) {
      this.warehouseId = this.warehouses[0].id;
    }
  },
  methods: {
    resetDifferenceFilter() {
      this.differenceFilter = 'all';
    },
    applyDifferenceFilter() {},
    itemMapper(item, col) {
      if (col === 'stockQuantity') {
        return `${formatQuantity(item.stockQuantity)} ${item.unitShortName}`.trim();
      }
      return item[col];
    },
    parseActual(value) {
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    },
    emitSaveFlowError(e) {
      this.$emit('saved-error', e);
    },
    notifyLoadPreviewError(e) {
      this.showNotification(this.$t('error'), this.apiErrorLinesAsString(e), true);
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
        this.selectedCategoryIds = (inventory.categoryIds || []).map((id) => String(id));

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

      if (!this.currentInventoryId && this.parsedCategoryIds.length === 0) {
        this.previewItems = [];
        this.previewLoading = false;
        return;
      }

      this.previewLoading = true;
      try {
        let page = 1;
        let lastPage = 1;
        const acc = [];

        const productParams = {
          warehouseId: wid,
          warehouseStockPolicy: 'all',
        };
        const catIds = this.parsedCategoryIds;
        if (catIds.length > 0) {
          productParams.category_ids = catIds.join(',');
        }

        do {
          const res = await ProductController.getItems(page, true, productParams, 100);
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
        this.notifyLoadPreviewError(e);
      } finally {
        this.previewLoading = false;
      }
    },
    async ensureInventory() {
      const existing = Number(this.currentInventoryId);
      if (Number.isInteger(existing) && existing > 0) return existing;

      const payload = {
        warehouse_id: this.warehouseId,
      };
      const catIds = this.parsedCategoryIds;
      if (catIds.length > 0) {
        payload.category_ids = catIds;
      }

      const inv = await InventoryController.create(payload);
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
      if (!this.currentInventoryId && this.parsedCategoryIds.length === 0) {
        this.showNotification(this.$t('error'), this.$t('categoriesRequired'), true);
        return;
      }

      this.activeAction = mode;
      try {
        const id = await this.ensureInventory();
        await this.pushActualQuantities(id);

        if (mode === 'complete') {
          const done = await InventoryController.finalize(id);
          this.inventoryStatus = done.status;
          this.syncLinkedDocuments(done);
        }

        this.$emit('saved', { id });
      } catch (e) {
        this.emitSaveFlowError(e);
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
        this.emitSaveFlowError(e);
      } finally {
        this.activeAction = null;
      }
    },
    openApplyStockConfirmDialog() {
      if (this.stockRecalcDisabled) {
        return;
      }
      this.applyStockConfirmDialog = true;
    },
    async confirmApplyInventoryStockAdjustment() {
      this.applyStockConfirmDialog = false;
      await this.applyInventoryStockAdjustment();
    },
    async downloadInventoryExcel() {
      const id = Number(this.currentInventoryId);
      if (!Number.isInteger(id) || id <= 0) return;

      this.activeAction = 'excel';
      try {
        const blob = await InventoryController.export(id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${id}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        this.emitSaveFlowError(e);
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
        this.emitSaveFlowError(e);
      } finally {
        this.activeAction = null;
      }
    },
  },
};
</script>
