<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="min-h-0 flex-1 overflow-auto p-4">
    <div class="mt-2">
      <label class="block mb-1">{{ $t('movementWarehouseSender') }}</label>
      <div class="flex items-center space-x-2">
        <select v-model="warehouseFromId">
          <option value="">
            {{ $t('no') }}
          </option>
          <template v-if="allWarehouses.length">
            <option
              v-for="parent in allWarehouses"
              :key="parent.id"
              :value="parent.id"
              :disabled="parent.id === warehouseToId"
            >
              {{ parent.name }}
            </option>
          </template>
        </select>
      </div>
    </div>
    <div class="mt-2">
      <label class="block mb-1">{{ $t('movementWarehouseReceiver') }}</label>
      <div class="flex items-center space-x-2">
        <select v-model="warehouseToId">
          <option value="">
            {{ $t('no') }}
          </option>
          <template v-if="allWarehouses.length">
            <option
              v-for="parent in allWarehouses"
              :key="parent.id"
              :value="parent.id"
              :disabled="parent.id === warehouseFromId"
            >
              {{ parent.name }}
            </option>
          </template>
        </select>
      </div>
    </div>
    <div>
      <label>{{ $t('date') }}</label>
      <input
        v-model="date"
        type="datetime-local"
        :disabled="editingItemId && !canEditDate()"
        :min="getMinDate()"
      >
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
      :warehouse-id="fromWarehouseId"
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
          :disabled="!$store.getters.hasPermission('warehouse_movements_delete')"
        />
        <PrimaryButton
          icon="fas fa-save"
          :onclick="save"
          :is-loading="saveLoading"
          :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_movements_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouse_movements_create'))"
          :aria-label="$t('save')"
        />
      </div>
    </teleport>
  </div>
  <AlertDialog
    :dialog="deleteDialog"
    :on-confirm="deleteItem"
    :on-leave="closeDeleteDialog"
    :descr="$t('confirmCancelMovement')"
    :confirm-text="$t('deleteMovement')"
    :leave-text="$t('cancel')"
  />
  <AlertDialog
    :dialog="closeConfirmDialog"
    :on-confirm="confirmClose"
    :on-leave="cancelClose"
    :descr="$t('unsavedChanges')"
    :confirm-text="$t('closeWithoutSaving')"
    :leave-text="$t('stay')"
  />
</template>


<script>
import WarehouseMovementDto from '@/dto/warehouse/WarehouseMovementDto';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import crudFormMixin from "@/mixins/crudFormMixin";
import { sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import { dateFormMixin } from '@/utils/dateUtils';


export default {
    components: { PrimaryButton, AlertDialog, ProductSearch },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: WarehouseMovementDto, required: false, default: null }
    },
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    data() {
        return {
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseFromId: this.editingItem ? this.editingItem.warehouseFromId  : '',
            warehouseToId: this.editingItem ? this.editingItem.warehouseToId  : '',
            products: this.editingItem ? this.editingItem.products : [],
            allWarehouses: [],
        }
    },
    computed: {
        fromWarehouseId: {
            get() {
                return this.warehouseFromId;
            },
            set(value) {
                this.warehouseFromId = value;
            }
        },
        toWarehouseId: {
            get() {
                return this.warehouseToId;
            },
            set(value) {
                this.warehouseToId = value;
            }
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllWarehouses();
            
            if (!this.editingItem) {
                if (this.allWarehouses?.length) {
                    if (!this.fromWarehouseId) {
                        this.fromWarehouseId = this.allWarehouses[0].id;
                    }
                    if (!this.toWarehouseId && this.allWarehouses.length > 1) {
                        this.toWarehouseId = this.allWarehouses[1].id;
                    }
                }
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        getFormState() {
            return {
                fromWarehouseId: this.warehouseFromId,
                toWarehouseId: this.warehouseToId,
                date: this.date,
                note: this.note,
                products: [...this.products]
            };
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses?.length) {
                this.allWarehouses = this.$store.getters.warehouses;
                return;
            }
            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses;
        },
        prepareSave() {
            return {
                warehouseFromId: this.warehouseFromId,
                warehouseToId: this.warehouseToId,
                date: this.date,
                note: this.note,
                products: this.products.map(product => ({
                    productId: product.productId,
                    quantity: product.quantity
                }))
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseMovementController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseMovementController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseMovementController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete movement');
            }
            return resp;
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.warehouseFromId = '';
            this.warehouseToId = '';
            this.products = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date ;
                this.note = newEditingItem.note ;
                this.warehouseFromId = newEditingItem.warehouseFromId ;
                this.warehouseToId = newEditingItem.warehouseToId ;
                this.products = newEditingItem.products || [];
            }
        },
    },
}
</script>