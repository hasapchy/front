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
        :only-products="true"
        :warehouse-id="warehouseId"
        required
      />
    </div>
    <div class="flex-shrink-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200">
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
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";


export default {
    components: { PrimaryButton, AlertDialog, ProductSearch },
    mixins: [getApiErrorMessage, crudFormMixin],
    props: {
        editingItem: { type: WarehouseWriteoffDto, required: false, default: null }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    data() {
        return {
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId : '',
            products: this.editingItem ? this.editingItem.products : [],
            allWarehouses: [],
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllWarehouses();

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
                date: this.date,
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
        prepareSave() {
            return {
                warehouseId: this.warehouseId,
                note: this.note,
                products: this.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity
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
            this.products = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.note = newEditingItem.note ;
                this.warehouseId = newEditingItem.warehouseId ;
                this.products = newEditingItem.products || [];
            }
        }
    },
}

</script>