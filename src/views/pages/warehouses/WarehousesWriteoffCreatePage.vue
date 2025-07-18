<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Списание</h2>

        <div class="mt-2">
            <label class="block mb-1">Склад</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
            </div>
        </div>

        <div class="mt-2">
            <label>Примечание</label>
            <input type="text" v-model="note">
        </div>
        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :only-products="true"
            required />
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите отмену списания. Данные будут отражены на стоке!'"
        :confirm-text="'Удалить запись списания'" :leave-text="'Отмена'" />
</template>


<script>
import WarehouseController from '@/api/WarehouseController';
import WarehouseWriteoffDto from '@/dto/warehouse/WarehouseWriteoffDto';
import WarehouseWriteoffController from '@/api/WarehouseWriteoffController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';

export default {
    mixins: [getApiErrorMessage],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: { PrimaryButton, AlertDialog, ProductSearch },
    props: {
        editingItem: { type: WarehouseWriteoffDto, required: false, default: null }
    },
    data() {
        return {
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId || '' : '',
            products: this.editingItem ? this.editingItem.products : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            allWarehouses: [],
        }
    },
    created() {
        this.fetchAllWarehouses();
    },
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
            if (!this.warehouseId && !this.editingItem && this.allWarehouses.length > 0) {
                this.warehouseId = this.allWarehouses[0].id;
            }
        },
        async save() {
            this.saveLoading = true;
            try {
                var formData = {
                    warehouse_id: this.warehouseId,
                    note: this.note,
                    products: this.products.map(product => ({
                        product_id: product.productId,
                        quantity: product.quantity
                    }))
                };
                if (this.editingItemId != null) {
                    var resp = await WarehouseWriteoffController.updateItem(
                        this.editingItemId,
                        formData);
                } else {
                    var resp = await WarehouseWriteoffController.storeItem(formData);
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;

        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (this.editingItemId == null) {
                return;
            }
            this.deleteLoading = true;
            try {
                var resp = await WarehouseWriteoffController.deleteItem(
                    this.editingItemId);
                if (resp.message) {
                    this.$emit('deleted');
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.date = new Date().toISOString().substring(0, 16);
            this.note = '';
            this.warehouseId = '';
            this.products = [];
            this.editingItemId = null;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.note = newEditingItem.note || '';
                    this.warehouseId = newEditingItem.warehouseId || '';
                    this.editingItemId = newEditingItem.id || null;
                    this.products = newEditingItem.products || [];
                } else {
                    this.clearForm();
                }
            },
            deep: true,
            immediate: true
        }
    }
}

</script>