<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Перемещение</h2>

        <div class="mt-2">
            <label class="block mb-1">Склад отправитель</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseFromId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id"
                        :disabled="parent.id === warehouseToId">{{ parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Склад получатель</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseToId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id"
                        :disabled="parent.id === warehouseFromId">{{ parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date">
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
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('warehouse_movements_delete')">
            Удалить
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_movements_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouse_movements_create'))">
            Сохранить
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите отмену перемещения. Данные будут отражены на стоке!'"
        :confirm-text="'Удалить запись перемещения'" :leave-text="'Отмена'" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="'У вас есть несохраненные изменения. Вы действительно хотите закрыть форму?'" :confirm-text="'Закрыть без сохранения'" :leave-text="'Остаться'" />
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


export default {
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    mixins: [getApiErrorMessage, formChangesMixin],
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
                // Переопределяем метод getFormState из миксина
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
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        async save() {
            this.saveLoading = true;
            try {
                var formData = {
                    warehouse_from_id: this.warehouseFromId,
                    warehouse_to_id: this.warehouseToId,
                    date: this.date,
                    note: this.note,
                    products: this.products.map(product => ({
                        product_id: product.productId,
                        quantity: product.quantity
                    }))
                };
                if (this.editingItemId != null) {
                    var resp = await WarehouseMovementController.updateItem(
                        this.editingItemId,
                        formData);
                } else {
                    var resp = await WarehouseMovementController.storeItem(formData);
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
                var resp = await WarehouseMovementController.deleteItem(
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
            this.warehouseFromId = '';
            this.warehouseToId = '';
            this.products = [];
            this.editingItemId = null;
            this.resetFormChanges(); // Сбрасываем состояние изменений
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
                    this.date = newEditingItem.date || '';
                    this.note = newEditingItem.note || '';
                    this.warehouseFromId = newEditingItem.warehouseFromId || '';
                    this.warehouseToId = newEditingItem.warehouseToId || '';
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