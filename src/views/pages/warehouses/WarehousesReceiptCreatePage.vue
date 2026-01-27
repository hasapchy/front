<template>
    <div>
        <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editReceipt') : $t('createReceipt') }}</h2>

        <ClientSearch :selectedClient="selectedClient" @update:selectedClient="selectedClient = $event" :onlySuppliers="true" :disabled="!!editingItemId"
            required />

        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="!!editingItemId && !canEditDate()"
                        :min="this.getMinDate()" />
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('warehouse') }}</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId" :disabled="!!editingItemId" v-if="allWarehouses.length">
                    <option value="">{{ $t('no') }}</option>
                    <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
                <select v-model="warehouseId" :disabled="!!editingItemId" v-else>
                    <option value="">{{ $t('no') }}</option>
                </select>
            </div>
        </div>

        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.currencySymbol || '' }})
                </option>
            </select>
        </div>

        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('paymentType') }}</label>
            <div class="flex space-x-4">
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId">
                    <i class="fas fa-cash-register ml-2 mr-1" style="color: #337AB7;"></i>
                    <span>{{ $t('toCash') }}</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance" :disabled="!!editingItemId">
                    <i class="fas fa-handshake ml-2 mr-1" style="color: #F0AD4E;"></i>
                    <span>{{ $t('inDebt') }}</span>
                </label>
            </div>
        </div>

        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note">
        </div>

        <ProductSearch ref="productSearch" v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :is-receipt="true" :show-amount="editingItemId == null" :only-products="true" :warehouse-id="warehouseId" required />
        </div>
    
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItemId != null" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash"
                :disabled="!$store.getters.hasPermission('warehouse_receipts_delete')">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
                (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))">
            </PrimaryButton>
        </div>
        
        <div v-if="products && products.length > 0" class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
            <div>{{ $t('total') }}: <span class="font-bold">{{ totalAmount.toFixed(2) }} {{ defaultCurrencySymbol }}</span></div>
        </div>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteReceiptConfirm')"
                  :confirm-text="$t('deleteReceipt')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

    </div>
</template>


<script>
import AppController from '@/api/AppController';
import CashRegisterController from '@/api/CashRegisterController';
import WarehouseReceiptController from '@/api/WarehouseReceiptController';
import WarehouseController from '@/api/WarehouseController';
import WarehouseReceiptDto from '@/dto/warehouse/WarehouseReceiptDto';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import { formatDatabaseDateTime } from '@/utils/dateUtils';


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin, dateFormMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch },
    props: {
        editingItem: { type: WarehouseReceiptDto, required: false, default: null }
    },
    data() {
        return {
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId || '' : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            selectedClient: this.editingItem ? this.editingItem.client : null,
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
        }
    },
    computed: {
        totalAmount() {
            if (!this.products?.length) return 0;
            return this.products.reduce((sum, product) => {
                if (product.amount !== null && product.amount !== undefined) {
                    return sum + (Number(product.amount) || 0);
                }
                const quantity = Number(product.quantity) || 0;
                const price = Number(product.price) || 0;
                return sum + (quantity * price);
            }, 0);
        },
        defaultCurrencySymbol() {
            const defaultCurrency = this.currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllCashRegisters()
            ]);
            
            if (!this.editingItem) {
                if (this.allWarehouses?.length && !this.warehouseId) {
                    this.warehouseId = this.allWarehouses[0].id;
                }
            }
            
            this.saveInitialState();
        });
    },
    methods: {
        // Методы formatDatabaseDateTimeForInput и getCurrentLocalDateTime теперь используются из dateFormMixin
        
        getFormState() {
            return {
                warehouseId: this.warehouseId,
                clientId: this.selectedClient?.id,
                date: this.date,
                note: this.note,
                products: this.products.map(p => ({ ...p }))
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
        async fetchCurrencies() {
            if (this.$store.getters.currencies?.length) {
                this.currencies = this.$store.getters.currencies;
                return;
            }
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCashRegisters() {
            if (this.$store.getters.cashRegisters?.length) {
                this.allCashRegisters = this.$store.getters.cashRegisters;
            } else {
                await this.$store.dispatch('loadCashRegisters');
                this.allCashRegisters = this.$store.getters.cashRegisters;
            }
            if (!this.cashId && this.allCashRegisters?.length) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },

        prepareSave() {
            const validationErrors = [];
            
            if (!this.selectedClient?.id) {
                validationErrors.push('• Выберите клиента (поставщика)');
            }
            
            if (!this.warehouseId) {
                validationErrors.push('• Выберите склад');
            }
            
            if (!this.cashId) {
                validationErrors.push('• Выберите кассу');
            }
            
            if (!this.type || (this.type !== 'cash' && this.type !== 'balance')) {
                validationErrors.push('• Выберите тип оплаты (В кассу или В кредит)');
            }
            
            if (!this.products?.length) {
                validationErrors.push('• Добавьте товары');
            }
            
            const invalidProducts = this.products.filter(p => 
                !p.productId || !p.quantity || p.quantity <= 0 || !p.price || p.price < 0
            );
            
            if (invalidProducts?.length) {
                validationErrors.push('• У некоторых товаров не заполнены обязательные поля (ID, количество, цена)');
            }
            
            if (validationErrors?.length) {
                this.$emit('saved-error', validationErrors.join('\n'));
                throw new Error(validationErrors.join('\n'));
            }

            const productsData = this.products.map(product => ({
                product_id: product.productId,
                quantity: product.quantity,
                price: product.price,
            }));
            
            return {
                client_id: this.selectedClient?.id,
                warehouse_id: this.warehouseId,
                date: this.date,
                note: this.note,
                cash_id: this.cashId,
                type: this.type,
                products: productsData
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await WarehouseReceiptController.updateItem(this.editingItemId, data);
            } else {
                return await WarehouseReceiptController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await WarehouseReceiptController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete receipt');
            }
            return resp;
        },
        onSaveSuccess(response) {
            if (response && response.message) {
                this.$store.dispatch('invalidateCache', { type: 'products' }).then(() => {
                    return this.$store.dispatch('loadAllProducts');
                });
                this.clearForm();
            }
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.warehouseId = '';
            this.currencyId = '';
            this.selectedClient = null;
            this.products = [];
            this.type = 'cash';
            this.cashId = this.allCashRegisters?.length ? this.allCashRegisters[0].id : '';
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date || '';
                this.note = newEditingItem.note || '';
                this.warehouseId = newEditingItem.warehouseId || '';
                this.currencyId = newEditingItem.currencyId || '';
                this.selectedClient = newEditingItem.client || null;
                this.products = newEditingItem.products || [];
                this.cashId = newEditingItem.cashId || '';
                this.type = newEditingItem.type || (newEditingItem.cashId ? 'cash' : 'balance');
            }
        },
    },
    watch: {
        warehouseId: {
            async handler(newWarehouseId) {
                if (newWarehouseId && this.$refs.productSearch) {
                    await this.$refs.productSearch.fetchLastProducts();
                }
            }
        }
    }
}
</script>