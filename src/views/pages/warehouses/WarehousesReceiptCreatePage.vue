<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Оприходование</h2>

        <!-- Начало блока поиска клиентов -->
        <div v-if="selectedClient == null" class="relative">
            <label class="block mb-1">Поиск клиента</label>
            <input type="text" v-model="clientSearch" placeholder="Введите имя или номер клиента"
                class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="showDropdown = false">
            <transition name="appear">
                <ul v-show="showDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="clientSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                    <!-- <li v-else-if="clientSearch.length === 0" class="p-2 text-gray-500">Ожидание запроса...</li> -->
                    <template v-else-if="clientSearch.length === 0">
                        <li v-for="client in lastClients" :key="client.id" @mousedown.prevent="selectClient(client)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between">
                                <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                                <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="clientSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                    <li v-else-if="clientResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                    <li v-for="client in clientResults" :key="client.id"
                        @mousedown.prevent="() => { selectClient(client) }"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between">
                            <div><span v-html="client.icons()"></span> {{ client.fullName() }}</div>
                            <div class="text-[#337AB7]">{{ client.phones[0]?.phone }}</div>
                        </div>
                        <span
                            :class="client.balance == 0 ? 'text-[#337AB7]' : client.balance > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                            {{ client.balanceFormatted() }}
                            <!-- {{ client.currencySymbol }} -->
                            <span v-if="client.balanceNumeric() > 0">(Клиент должен нам)</span>
                            <span v-else-if="client.balanceNumeric() < 0">(Мы должны клиенту)</span>
                            <span v-else>(Взаимный расчет)</span>
                        </span>
                    </li>
                </ul>
            </transition>
        </div>
        <div v-else class="">
            <div class="p-2 pt-0 mt-2 border-2 border-gray-400/60 rounded-md">
                <div class="flex justify-between items-center">
                    <div>
                        <label>Клиент</label>
                        <p><span class="font-semibold text-sm">Имя:</span> {{ selectedClient.fullName() }}</p>
                        <p><span class="font-semibold text-sm">Номер:</span> {{ selectedClient.phones[0].phone }}</p>
                        <p><span class="font-semibold text-sm">Баланс:</span>
                            <span
                                :class="selectedClient.balanceNumeric() == 0 ? 'text-[#337AB7]' : selectedClient.balanceNumeric() > 0 ? 'text-[#5CB85C]' : 'text-[#EE4F47]'">
                                {{ selectedClient.balanceFormatted() }}
                                <!-- {{ selectedClient.currencySymbol }} -->
                                <span v-if="selectedClient.balanceNumeric() > 0">(Клиент должен нам)</span>
                                <span v-else-if="selectedClient.balanceNumeric() < 0">(Мы должны клиенту)</span>
                                <span v-else>(Взаимный расчет)</span>
                            </span>
                        </p>

                    </div>
                    <button v-on:click="deselectClient" class="text-red-500 text-2xl cursor-pointer">&times;</button>
                </div>
            </div>
        </div>
        <!-- Конец блока поиска клиентов -->

        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date">
        </div>
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
        <div class=" mt-2">
            <label class="block mb-1">Валюта</label>
            <select v-model="currencyId" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.name }}
                </option>
            </select>
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
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Закупочная цена</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="index" class="border-b border-gray-300">
                    <td class="py-2 px-4 border-x border-gray-300">{{ product.productName }}</td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.quantity" class="w-full p-1 text-right">
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.price" class="w-full p-1 text-right">
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
        :descr="'Подтвердите удаление. Данные будут отражены на стоке и балансе клиента!'"
        :confirm-text="'Удалить запись оприходования'" :leave-text="'Отмена'" />
</template>


<script>
import AppController from '@/api/AppController';
import ClientController from '@/api/ClientController';
import ProductController from '@/api/ProductController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
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
            type: WarehouseReceiptDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId || '' : '',
            currencyId: this.editingItem ? this.editingItem.currencyId || '' : '',
            products: this.editingItem ? this.editingItem.products : [],
            // 
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            // Поиск клиентов
            clientSearch: '',
            clientSearchLoading: false,
            clientResults: [],
            lastClients: [],
            showDropdown: false,
            // Поиск товаров
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            showDropdownProduct: false,
            ///
            allWarehouses: [],
            currencies: [],
        }
    },
    created() {
        this.fetchAllWarehouses();
        this.fetchCurrencies();
        this.fetchLastClients();
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currency_id);
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchLastClients() {
            const paginated = await ClientController.getItems(1);
            // Паша, тут фильтр по поставщикам, этим отличается от всех остальных
            this.lastClients = paginated.items
                .filter(client => client.isSupplier)
                .slice(0, 10);
        },
        // Поиск клиентов
        searchClients: debounce(async function () {
            if (this.clientSearch.length >= 4) {
                this.clientSearchLoading = true;
                const results = await ClientController.search(this.clientSearch);
                this.clientSearchLoading = false;
                this.clientResults = results;
            } else {
                this.clientResults = [];
            }
        }, 250),
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
        selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
            console.log('Selected client:', client);
        },
        selectProduct(product) {
            this.showDropdownProduct = false;
            this.productSearch = '';
            this.productResults = [];
            this.products.push(WarehouseReceiptProductDto.fromProductDto(product, true));
            console.log('Selected product:', product);
        },
        deselectClient() {
            this.selectedClient = null;
        },
        removeSelectedProduct(id) {
            this.products = this.products.filter(product => product.productId != id);
        },
        async save() {
            this.saveLoading = true;
            try {
                var formData = {
                    client_id: this.selectedClient.id,
                    warehouse_id: this.warehouseId,
                    currency_id: this.currencyId,
                    note: this.note,
                    products: this.products.map(product => ({
                        product_id: product.productId,
                        quantity: product.quantity,
                        price: product.price
                    }))
                };
                if (this.editingItemId != null) {
                    var resp = await WarehouseReceiptController.updateReceipt(
                        this.editingItemId,
                        formData);
                } else {
                    var resp = await WarehouseReceiptController.storeReceipt(formData);
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
                var resp = await WarehouseReceiptController.deleteReceipt(
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
            this.warehouseId = '';
            this.currencyId = '';
            this.selectedClient = null;
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
        // Поиск клиентов
        clientSearch: {
            handler: 'searchClients',
            immediate: true
        },
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
                    this.warehouseId = newEditingItem.warehouseId || '';
                    this.currencyId = newEditingItem.currencyId || '';
                    this.selectedClient = newEditingItem.client || null;
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