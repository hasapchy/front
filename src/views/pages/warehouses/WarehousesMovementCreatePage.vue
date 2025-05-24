<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Перемещение</h2>

        <div class="mt-2">
            <label class="block mb-1">Склад отправитель</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseFromId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Склад получатель</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseToId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">{{
                        parent.name }}
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

        <!-- Начало блока поиска товаров -->

        <label class="block mb-1">Поиск товаров и услуг</label>
        <input type="text" v-model="productSearch" placeholder="Введите название или код товара"
            class="w-full p-2 border rounded" @focus="showDropdownProduct = true" @blur="showDropdownProduct = false">
        <transition name="appear">
            <ul v-show="showDropdownProduct"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="productSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                <li v-else-if="productSearch.length === 0" class="p-2 text-gray-500">Ожидание запроса...</li>
                <li v-else-if="productSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                <li v-else-if="productResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                <li v-for="product in productResults" :key="product.id"
                    @mousedown.prevent="() => { selectProduct(product) }"
                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                    <div class="flex justify-between">
                        <div>{{ product.name }}</div>
                        <!-- <div class="text-[#337AB7]">{{ product.code }}</div> -->
                    </div>

                </li>
            </ul>
        </transition>
        <label class="block mt-4 mb-1">Указанные товары и услуги</label>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Название</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-20">Количество</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="index" class="border-b border-gray-300">
                    <td class="py-2 px-4 border-x border-gray-300">{{ product.productName }}</td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.quantity" class="w-full p-1 text-right">
                    </td>
                    <td class=" px-4 border-x border-gray-300">
                        <button v-on:click="() => { removeSelectedProduct(product.productId) }"
                            class="text-red-500 text-2xl cursor-pointer">&times;</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- Конец блока поиска товаров -->

    <!-- {{ editingItem.id }} -->
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите отмену перемещения. Данные будут отражены на стоке!'"
        :confirm-text="'Удалить запись перемещения'" :leave-text="'Отмена'" />
</template>


<script>
import AppController from '@/api/AppController';
import ClientController from '@/api/ClientController';
import ProductController from '@/api/ProductController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseMovementDto from '@/dto/warehouse/WarehouseMovementDto';
import WarehouseMovementProductDto from '@/dto/warehouse/WarehouseMovementProductDto';
import WarehouseMovementController from '@/api/WarehouseMovementController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import debounce from 'lodash.debounce';


export default {
    components: {
        PrimaryButton,
        AlertDialog
    },
    props: {
        editingItem: {
            type: WarehouseMovementDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseFromId: this.editingItem ? this.editingItem.warehouseFromId || '' : '',
            warehouseToId: this.editingItem ? this.editingItem.warehouseToId || '' : '',
            products: this.editingItem ? this.editingItem.products : [],
            // 
            editingItemId: this.editingItem ? this.editingItem.id : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            // Поиск товаров
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            showDropdownProduct: false,
            ///
            allWarehouses: [],
        }
    },
    created() {
        this.fetchAllWarehouses();
    },

    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 4) {
                this.productSearchLoading = true;
                const results = await ProductController.searchItems(this.productSearch);
                this.productSearchLoading = false;
                this.productResults = results;
            } else {
                this.productResults = [];
            }
        }, 250),

        selectProduct(product) {
            this.showDropdownProduct = false;
            this.productSearch = '';
            this.productResults = [];
            this.products.push(WarehouseMovementProductDto.fromProductDto(product, true));
        },

        removeSelectedProduct(id) {
            this.products = this.products.filter(product => product.productId != id);
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
                this.$emit('saved-error', error);
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
                this.$emit('deleted-error', error);
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
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        }

    },
    watch: {
        // Поиск товаров
        productSearch: {
            handler: 'searchProducts',
            immediate: true
        },
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

<!-- Стили для поиска клиентов: -->
<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>