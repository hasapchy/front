<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Оприходование</h2>

        <ClientSearch v-model:selectedClient="selectedClient" :onlySuppliers="true" :disabled="!!editingItemId"
            required />

        <div>
            <label>Дата</label>
            <input type="datetime-local" :disabled="!!editingItemId" v-model="date">
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Склад</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId" :disabled="!!editingItemId">
                    <option value="">Нет</option>
                    <option v-if="allWarehouses.length" v-for="parent in allWarehouses" :value="parent.id">{{
                        parent.name }}
                    </option>
                </select>
            </div>
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
                    <input type="radio" v-model="type" value="balance">
                    <span class="ml-2">В баланс клиента</span>
                </label>
            </div>
        </div>
        <div v-if="type === 'cash'" class="mt-2">
            <label class="block mb-1 required">Касса</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
                    {{ c.name }}
                </option>
            </select>
        </div>

        <div class="mt-2">
            <label>Примечание</label>
            <input type="text" v-model="note" :disabled="!!editingItemId">
        </div>

        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :is-receipt="true" :only-products="true" required />
    </div>
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
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import debounce from 'lodash.debounce';


export default {
    components: {
        PrimaryButton,
        AlertDialog,
        ClientSearch,
        ProductSearch
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
            // currencyId: this.editingItem ? this.editingItem.currencyId || '' : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            // 
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            ///
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
        }
    },
    created() {
        this.fetchAllWarehouses();
        this.fetchCurrencies();
        this.fetchAllCashRegisters();
    },
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            if (!this.cashId && this.allCashRegisters.length) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },

        async save() {
            this.saveLoading = true;
            try {
                var formData = {
                    client_id: this.selectedClient.id,
                    warehouse_id: this.warehouseId,
                    // currency_id: this.currencyId,
                    note: this.note,
                    type: this.type,
                    cash_id: this.type === 'cash' ? this.cashId : null,
                    // currency_id: this.type === 'cash'
                    //     ? (this.allCashRegisters.find(c => c.id === this.cashId)?.currency_id)
                    //     : null,
                    products: this.products.map(product => ({
                        product_id: product.productId,
                        quantity: product.quantity,
                        price: product.price
                    }))
                };
                console.log('📦 formData', JSON.stringify(formData, null, 2));
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