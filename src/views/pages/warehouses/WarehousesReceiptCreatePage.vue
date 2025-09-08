<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editReceipt') : $t('createReceipt') }}</h2>

        <ClientSearch v-model:selectedClient="selectedClient" :onlySuppliers="true" :disabled="!!editingItemId"
            required />

        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="!!editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
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
            <label class="block mb-1 required">{{ $t('paymentType') }}</label>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId">
                    <span class="ml-2">{{ $t('toCash') }}</span>
                </label>
            </div>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance">
                    <span class="ml-2">{{ $t('toClientBalance') }}</span>
                </label>
            </div>
        </div>
        <div v-if="type === 'cash'" class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.currency_symbol || c.currency_code || '' }})
                </option>
            </select>
        </div>

        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" :disabled="!!editingItemId">
        </div>

        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :is-receipt="true" :only-products="true" required />
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove"
            :disabled="!$store.getters.hasPermission('warehouse_receipts_delete')">
            {{ $t('delete') }}
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))">
            {{ $t('save') }}
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteReceiptConfirm')"
                  :confirm-text="$t('deleteReceipt')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />

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


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch },
    props: {
        editingItem: { type: WarehouseReceiptDto, required: false, default: null }
    },
    data() {
        return {
            date: this.editingItem ? this.editingItem.date : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : '',
            warehouseId: this.editingItem ? this.editingItem.warehouseId || '' : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            allWarehouses: [],
            currencies: [],
            allCashRegisters: [],
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
                clientId: this.selectedClient?.id,
                date: this.date,
                note: this.note,
                products: this.products.map(p => ({ ...p }))
            };
        },
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
                    note: this.note,
                    type: this.type,
                    cash_id: this.type === 'cash' ? this.cashId : null,

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
                var resp = await WarehouseReceiptController.deleteReceipt(
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
            this.currencyId = '';
            this.selectedClient = null;
            this.products = [];
            this.editingItemId = null;
            this.resetFormChanges();
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
                    this.warehouseId = newEditingItem.warehouseId || '';
                    this.currencyId = newEditingItem.currencyId || '';
                    this.selectedClient = newEditingItem.client || null;
                    this.editingItemId = newEditingItem.id || null;
                    this.products = newEditingItem.products || [];
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        }
    }
}
</script>