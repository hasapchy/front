<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="flex-1 min-h-0 overflow-y-auto p-4">
      <div class="mt-2">
        <label class="block mb-1">{{ $t('warehouse') }}</label>
        <div class="flex items-center space-x-2">
          <select v-model="warehouseId">
            <option value="">
              {{ $t('no') }}
            </option>
            <template v-if="allWarehouses.length">
              <option
                v-for="parent in allWarehouses"
                :key="parent.id"
                :value="parent.id"
              >
                {{ parent.name }}
              </option>
            </template>
          </select>
        </div>
      </div>

      <div
        v-if="!lockedReturnSupplier"
        class="mt-2"
      >
        <label class="block mb-1">{{ $t('writeoffReason') }}</label>
        <select v-model="reason">
          <option
            v-for="opt in reasonOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ $t(opt.labelKey) }}
          </option>
        </select>
      </div>

      <div
        v-if="isReturnSupplierReason"
        class="mt-2"
      >
        <label class="block mb-1 required">{{ $t('receipt') }}</label>
        <select
          v-model="sourceReceiptId"
          :disabled="!!editingItemId"
        >
          <option value="">
            {{ $t('select') }}
          </option>
          <option
            v-for="receipt in availableReceipts"
            :key="receipt.id"
            :value="receipt.id"
          >
            #{{ receipt.id }} — {{ receipt.client?.displayName?.() || receipt.client?.name || $t('notSpecified') }}
          </option>
        </select>
      </div>

      <div
        v-if="isReturnSupplierReason"
        class="mt-2"
      >
        <ClientSearch
          :selected-client="selectedReceipt?.client || null"
          :only-suppliers="true"
          label-key="supplier"
          :allow-deselect="false"
          :disabled="true"
          :client-selection-disabled="true"
          :skip-fetch-selected-client-on-create="true"
        />
      </div>

      <div class="mt-2">
        <label>{{ $t('note') }}</label>
        <input
          v-model="note"
          type="text"
        >
      </div>
      <ProductSearch
        v-model="products"
        :disabled="!!editingItemId"
        :show-quantity="true"
        :show-price="isReturnSupplierReason"
        :only-products="true"
        :warehouse-id="warehouseId"
        :receipt-waybill-catalog-products="receiptCatalogProducts"
        required
      />
    </div>
    <teleport v-bind="sideModalFooterTeleportBind">
      <div class="flex w-full flex-wrap items-center gap-2">
        <PrimaryButton
          v-if="editingItemId != null"
          :onclick="showDeleteDialog"
          :is-danger="true"
          :is-loading="deleteLoading"
          icon="fas fa-trash"
          :disabled="!$store.getters.hasPermission('warehouse_writeoffs_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_writeoffs_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouse_writeoffs_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
    <AlertDialog
      :dialog="deleteDialog"
      :descr="$t('confirmCancelWriteoff')"
      :confirm-text="$t('deleteWriteoff')"
      :leave-text="$t('cancel')"
      @confirm="deleteItem"
      @leave="closeDeleteDialog"
    />
    <AlertDialog
      :dialog="closeConfirmDialog"
      :descr="$t('unsavedChanges')"
      :confirm-text="$t('closeWithoutSaving')"
      :leave-text="$t('stay')"
      @confirm="confirmClose"
      @leave="cancelClose"
    />
  </div>
</template>


<script>
import WarehouseWriteoffDto from '@/dto/warehouse/WarehouseWriteoffDto';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ProductDto from '@/dto/product/ProductDto';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { WH_WRITEOFF_REASONS } from '@/constants/warehouseWriteoffReasons';


export default {
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch },
    mixins: [getApiErrorMessage, crudFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: WarehouseWriteoffDto, required: false, default: null },
        lockedReturnSupplier: { type: Boolean, default: false },
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId : '',
            reason: this.editingItem ? this.editingItem.reason : (this.lockedReturnSupplier ? 'return_supplier' : 'defect'),
            sourceReceiptId: this.editingItem?.sourceReceiptId ?? '',
            products: this.editingItem ? this.editingItem.products : [],
            allWarehouses: [],
            availableReceipts: [],
            selectedReceipt: null,
        }
    },
    computed: {
        reasonOptions() {
            return WH_WRITEOFF_REASONS;
        },
        isReturnSupplierReason() {
            return this.reason === 'return_supplier';
        },
        createModeDefaultReason() {
            return this.lockedReturnSupplier ? 'return_supplier' : 'defect';
        },
        receiptCatalogProducts() {
            if (!this.isReturnSupplierReason || !this.selectedReceipt?.products?.length) {
                return [];
            }
            return this.selectedReceipt.products.map((p) => {
                const product = ProductDto.fromApi({
                    id: p.productId,
                    type: 1,
                    name: p.productName,
                    image: p.productImage,
                    stock_quantity: p.quantity,
                    unit_id: p.unitId,
                    unit_name: p.unitName,
                    unit_short_name: p.unitShortName,
                    retail_price: p.price,
                    wholesale_price: p.price,
                    purchase_price: p.price,
                });
                product.priceLocked = true;
                return product;
            });
        },
    },
    watch: {
        async warehouseId(newWarehouseId, oldWarehouseId) {
            if (newWarehouseId !== oldWarehouseId && this.isReturnSupplierReason) {
                await this.loadReceiptsForReturnSupplier();
            }
        },
        async reason(newReason, oldReason) {
            if (newReason === oldReason) {
                return;
            }
            if (newReason !== 'return_supplier') {
                this.sourceReceiptId = '';
                this.selectedReceipt = null;
                this.availableReceipts = [];
                this.products = [];
                return;
            }
            await this.loadReceiptsForReturnSupplier();
        },
        async sourceReceiptId(newValue, oldValue) {
            if (newValue === oldValue) {
                return;
            }
            if (!newValue) {
                this.selectedReceipt = null;
                this.products = [];
                return;
            }
            await this.loadSelectedReceipt();
        },
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllWarehouses();
            if (this.reason === 'return_supplier') {
                await this.loadReceiptsForReturnSupplier();
                if (this.sourceReceiptId) {
                    await this.loadSelectedReceipt();
                }
            }

            if (!this.editingItem) {
                if (this.allWarehouses.length > 0 && !this.warehouseId) {
                    this.warehouseId = this.allWarehouses[0].id;
                }
            }

            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                warehouseId: this.warehouseId,
                reason: this.reason,
                note: this.note,
                products: [...this.products]
            };
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses && this.$store.getters.warehouses.length > 0) {
                this.allWarehouses = this.$store.getters.warehouses;
            } else {
                await this.$store.dispatch('loadWarehouses');
                this.allWarehouses = this.$store.getters.warehouses;
            }
            if (!this.warehouseId && !this.editingItem && this.allWarehouses.length > 0) {
                this.warehouseId = this.allWarehouses[0].id;
            }
        },
        async loadReceiptsForReturnSupplier() {
            if (!this.warehouseId) {
                this.availableReceipts = [];
                return;
            }
            const page = await WarehouseReceiptController.getItems(1, 100, { warehouse_id: Number(this.warehouseId) });
            this.availableReceipts = page.items || [];
            if (!this.availableReceipts.some(r => Number(r.id) === Number(this.sourceReceiptId))) {
                this.sourceReceiptId = '';
                this.selectedReceipt = null;
                this.products = [];
            }
        },
        async loadSelectedReceipt() {
            const receiptId = Number(this.sourceReceiptId);
            if (!receiptId) {
                return;
            }
            const receipt = await WarehouseReceiptController.getItem(receiptId);
            this.selectedReceipt = receipt;
            this.products = (receipt.products || []).map((line) => {
                const dto = new WarehouseWriteoffProductDto(
                    null,
                    null,
                    line.productId,
                    line.productName,
                    line.productImage,
                    line.unitId,
                    line.unitName,
                    line.unitShortName,
                    line.quantity,
                    line.quantity,
                    line.price,
                    line.id,
                );
                dto.priceLocked = true;
                return dto;
            });
        },
        prepareSave() {
            const reason = this.lockedReturnSupplier ? this.createModeDefaultReason : this.reason;
            return {
                warehouseId: this.warehouseId,
                reason,
                sourceReceiptId: this.isReturnSupplierReason ? Number(this.sourceReceiptId) : null,
                note: this.note,
                products: this.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity,
                    sourceReceiptProductId: this.isReturnSupplierReason ? (product.sourceReceiptProductId ?? null) : null,
                }))
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseWriteoffController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseWriteoffController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseWriteoffController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete writeoff');
            }
            return resp;
        },
        clearForm() {
            this.note = '';
            this.warehouseId = '';
            this.reason = this.createModeDefaultReason;
            this.sourceReceiptId = '';
            this.availableReceipts = [];
            this.selectedReceipt = null;
            this.products = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.note = newEditingItem.note;
                this.warehouseId = newEditingItem.warehouseId;
                this.reason = newEditingItem.reason;
                this.sourceReceiptId = newEditingItem.sourceReceiptId ?? '';
                this.products = newEditingItem.products || [];
            }
        }
    },
}

</script>