<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Продажа</h2>
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
        <div class="mt-2">
            <label class="block mb-1">Проект</label>
            <select v-model="projectId">
                <option value="">Нет</option>
                <option v-if="allProjects.length" v-for="parent in allProjects" :value="parent.id">{{ parent.name }}
                </option>
            </select>
        </div>
        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date">
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Склад</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId" required>
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
            </div>
        </div>
        <!-- <div class=" mt-2">
        <label class="block mb-1">Валюта</label>
        <select v-model="currencyId" :disabled="!!editingItemId">
            <option value="">Нет</option>
            <option v-if="currencies.length" v-for="parent in currencies" :value="parent.id">{{ parent.name }}
            </option>
        </select>
    </div> -->

        <div class="mt-2">
            <label>Примечание</label>
            <input type="text" v-model="note">
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Тип оплаты</label>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId">
                    <span class="ml-2">В кассу</span>
                </label>
            </div>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance" :disabled="!!editingItemId">
                    <span class="ml-2">В баланс клиента</span>
                </label>
            </div>
        </div>
        <div v-if="type === 'cash'" class="mt-2">
            <label class="block mb-1 required">Касса</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-if="allCashRegisters.length" v-for="parent in allCashRegisters" :value="parent.id">{{
                    parent.name
                }}
                </option>
            </select>
        </div>
        <!-- Начало блока поиска товаров -->
        <div class="relative">
            <label class="block mb-1 required">Поиск товаров и услуг</label>
            <input type="text" ref="productInput" v-model="productSearch" placeholder="Введите название или код товара"
                class="w-full p-2 border rounded" @focus="showDropdownProduct = true"
                @blur="showDropdownProduct = false">
            <transition name="appear">
                <ul v-show="showDropdownProduct"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                    <li v-if="productSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                    <!-- <li v-else-if="productSearch.length === 0" class="p-2 text-gray-500">Ожидание запроса...</li> -->
                    <template v-else-if="productSearch.length === 0">
                        <li v-for="product in lastProducts" :key="product.id"
                            @mousedown.prevent="selectProduct(product)"
                            class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center">
                                    <span v-html="product.icons()"></span>
                                    {{ product.name }}
                                </div>
                                <div class="text-[#337AB7]">{{ product.sku }}</div>
                            </div>
                        </li>
                    </template>
                    <li v-else-if="productSearch.length < 4" class="p-2 text-gray-500">Минимум 4 символа</li>
                    <li v-else-if="productResults.length === 0" class="p-2 text-gray-500">Не найдено</li>
                    <li v-else v-for="product in productResults" :key="product.id"
                        @mousedown.prevent="selectProduct(product)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <span v-html="product.icons()"></span>
                                {{ product.name }}
                            </div>
                            <div class="text-[#337AB7]">{{ product.sku }}</div>
                        </div>
                    </li>
                </ul>
            </transition>
        </div>
        <label class="block mt-4 mb-1">Указанные товары и услуги</label>
        <table class="min-w-full bg-white rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Название</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-20">Количество</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Цена</th>
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
            <tfoot v-if="products.length">
                <tr class="bg-gray-50 font-medium">
                    <td colspan="2" class="py-2 px-4 text-right">Сумма без скидки</td>
                    <td class="py-2 px-4 text-right">{{ subtotal.toFixed(2) }}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="2" class="py-2 px-4 text-right">
                        <select v-model="discountType" class="border ml-2 p-1">
                            <option value="percent">%</option>
                            <option value="fixed">– сумма</option>
                        </select>
                    </td>
                    <td class="py-2 px-4 text-right">
                        <input type="number" v-model.number="discount" class="w-full p-1 text-right">
                    </td>
                    <td></td>
                </tr>
                <tr class="bg-gray-100 font-bold">
                    <td colspan="2" class="py-2 px-4 text-right">Итого</td>
                    <td class="py-2 px-4 text-right">{{ totalPrice.toFixed(2) }}</td>
                    <td></td>
                </tr>
            </tfoot>
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
import CashRegisterController from '@/api/CashRegisterController';
import ClientController from '@/api/ClientController';
import ProductController from '@/api/ProductController';
import ProjectController from '@/api/ProjectController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import SaleController from '@/api/SaleController';
import SaleDto from '@/dto/sale/SaleDto';
import SaleProductDto from '@/dto/sale/SaleProductDto';
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
            type: SaleDto,
            required: false,
            default: null
        }
    },
    data() {
        return {
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            warehouseId: this.editingItem ? this.editingItem.warehouseId || '' : '',
            currencyId: this.editingItem ? this.editingItem.currencyId || '' : '',
            projectId: this.editingItem ? this.editingItem.projectId : '',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            discount: this.editingItem ? this.editingItem.discount : 0,
            discountType: this.editingItem ? this.editingItem.discount_type : 'fixed',
            // 
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            // Состояния загрузки
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
            lastProducts: [],
            showDropdownProduct: false,
            ///
            allWarehouses: [],
            allProjects: [],
            allCashRegisters: [],
            currencies: [],
        }
    },
    created() {
        this.fetchAllWarehouses();
        this.fetchAllProjects();
        this.fetchCurrencies();
        this.fetchAllCashRegisters();
        this.fetchLastClients();
        this.fetchLastProducts();
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find(currency => currency.id == this.currency_id);
        },
        selectedCash() {
            return this.allCashRegisters.find(c => c.id == this.cashId);
        },
        subtotal() {
            return this.products.reduce((sum, p) =>
                sum + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0
            );
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === 'percent') {
                return this.subtotal * disc / 100;
            }
            return Math.min(disc, this.subtotal);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        }
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        async fetchAllProjects() {
            this.allProjects = await ProjectController.getAllItems();
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            if (this.allCashRegisters.length && !this.cashId && !this.editingItem) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async fetchLastClients() {
            const paginated = await ClientController.getItems(1);
            this.lastClients = paginated.items.slice(0, 10);
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

        async fetchLastProducts() {
            const prodPage = await ProductController.getItems(1, true)
            const servPage = await ProductController.getItems(1, false)
            this.lastProducts = [
                ...prodPage.items,
                ...servPage.items
            ]
                .sort((a, b) => {
                    // сортировка по дате создания
                    return new Date(b.created_at) - new Date(a.created_at)
                })
                .slice(0, 10)
        },

        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 4) {
                this.productSearchLoading = true
                this.productResults = await ProductController.searchItems(this.productSearch)
                this.productSearchLoading = false
            } else {
                this.productResults = []
            }
        }, 250),
        selectClient(client) {
            this.showDropdown = false;
            this.clientSearch = '';
            this.clientResults = [];
            this.selectedClient = client;
            this.discount = client.discount || 0;
            this.discountType = client.discountType || 'fixed';
            console.log('Selected client:', client);
        },
        selectProduct(product) {
            this.showDropdownProduct = false;
            this.productSearch = '';
            this.productResults = [];
            const existing = this.products.find(p => p.productId === product.id)
            if (existing) {
                // Паша, я это сделал, чтобы при клике был +1, если товар уже есть в таблице
                existing.quantity++
            } else {
                this.products.push(SaleProductDto.fromProductDto(product, true))
            }
            //Паша, это добавил из-за проблемы, что при выборе товара, когда поле в фокусе, нужно было снимать фокус и заново брать его,чтобы он искал
            this.$nextTick(() => {
                this.$refs.productInput.focus();
                this.showDropdownProduct = true;
            });
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
                    client_id: this.selectedClient?.id,
                    project_id: this.projectId || null,
                    warehouse_id: this.warehouseId,
                    currency_id: this.type === 'cash'
                        ? this.selectedCash?.currency_id
                        : this.currencyId,
                    cash_id: this.type === 'cash' ? this.cashId : null,
                    type: this.type,
                    date: this.date,
                    note: this.note,
                    discount: this.discount,
                    discount_type: this.discountType,
                    products: this.products.map(p => ({
                        product_id: p.productId,
                        quantity: p.quantity,
                        price: p.price
                    }))
                };
                let resp;
                if (this.editingItemId != null) {
                    resp = await SaleController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await SaleController.storeItem(formData);
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
                var resp = await SaleController.deleteItem(this.editingItemId);
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
            this.type = 'cash';
            this.warehouseId = this.allWarehouses.length ? this.allWarehouses[0].id : '';
            this.currencyId = '';
            this.projectId = '';
            this.cashId = this.allCashRegisters.length ? this.allCashRegisters[0].id : '';
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
        productSearch: {
            handler: 'searchProducts',
            immediate: true
        },
        type: {
            handler(newType) {
                if (newType === 'balance') {
                    this.cashId = '';
                }
            }
        },
        cashId: {
            handler(newCashId) {
                const selectedCash = this.allCashRegisters.find(cash => cash.id == newCashId);
                if (selectedCash && selectedCash.currency_id) {
                    this.currencyId = selectedCash.currency_id;
                }
            },
            immediate: true
        },
        allWarehouses: {
            handler(newWarehouses) {
                if (newWarehouses.length && !this.warehouseId && !this.editingItem) {
                    this.warehouseId = newWarehouses[0].id;
                }
            },
            immediate: true
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.note = newEditingItem.note || '';
                    this.type = newEditingItem.type || 'cash';
                    this.warehouseId = newEditingItem.warehouseId || (this.allWarehouses.length ? this.allWarehouses[0].id : '');
                    this.currencyId = newEditingItem.currencyId || '';
                    this.projectId = newEditingItem.projectId || '';
                    this.cashId = newEditingItem.cashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    this.selectedClient = newEditingItem.client || null;
                    this.editingItemId = newEditingItem.id || null;
                    this.products = newEditingItem.products || [];
                    this.discount = newEditingItem.discount || 0;
                    this.discountType = newEditingItem.discount_type || 'fixed';
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