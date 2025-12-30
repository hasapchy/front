<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editMovement') : $t('createMovement') }}</h2>

        <div class="mt-2">
            <label class="block mb-1">{{ $t('movementWarehouseSender') }}</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseFromId">
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="allWarehouses.length">
                        <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id"
                            :disabled="parent.id === warehouseToId">{{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('movementWarehouseReceiver') }}</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseToId">
                    <option value="">{{ $t('no') }}</option>
                    <template v-if="allWarehouses.length">
                        <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id"
                            :disabled="parent.id === warehouseFromId">{{ parent.name }}
                        </option>
                    </template>
                </select>
            </div>
        </div>
        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
        </div>
        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note">
        </div>

        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :only-products="true"
            :warehouse-id="fromWarehouseId" required />
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItemId != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash"
            :disabled="!$store.getters.hasPermission('warehouse_movements_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_movements_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouse_movements_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
                  :descr="$t('confirmCancelMovement')"
                  :confirm-text="$t('deleteMovement')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
</template>


<script>
import WarehouseController from '@/api/WarehouseController';
import WarehouseMovementDto from '@/dto/warehouse/WarehouseMovementDto';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";


export default {
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin],
    components: { PrimaryButton, AlertDialog, ProductSearch },
    props: {
        editingItem: { type: WarehouseMovementDto, required: false, default: null }
    },
    data() {
        return {
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseFromId: this.editingItem ? this.editingItem.warehouseFromId || '' : '',
            warehouseToId: this.editingItem ? this.editingItem.warehouseToId || '' : '',
            products: this.editingItem ? this.editingItem.products : [],
            allWarehouses: [],
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await this.fetchAllWarehouses();
            
            if (!this.editingItem) {
                if (this.allWarehouses.length > 0) {
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
                fromWarehouseId: this.fromWarehouseId,
                toWarehouseId: this.toWarehouseId,
                date: this.date,
                note: this.note,
                products: [...this.products]
            };
        },
        async fetchAllWarehouses() {
            if (this.$store.getters.warehouses && this.$store.getters.warehouses.length > 0) {
                this.allWarehouses = this.$store.getters.warehouses;
                return;
            }
            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses;
        },
        prepareSave() {
            return {
                warehouse_from_id: this.warehouseFromId,
                warehouse_to_id: this.warehouseToId,
                date: this.date,
                note: this.note,
                products: this.products.map(product => ({
                    product_id: product.productId,
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
            this.date = new Date().toISOString().substring(0, 16);
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
                this.date = newEditingItem.date || '';
                this.note = newEditingItem.note || '';
                this.warehouseFromId = newEditingItem.warehouseFromId || '';
                this.warehouseToId = newEditingItem.warehouseToId || '';
                this.products = newEditingItem.products || [];
            }
        },
    },
}
</script>