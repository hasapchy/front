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
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.currency_symbol || c.currency_code || '' }})
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
            <label>{{ $t('project') }}</label>
            <select v-model="projectId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="project in allProjects" :key="project.id" :value="project.id">
                    {{ project.name }}
                </option>
            </select>
        </div>

        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note">
        </div>

        <ProductSearch ref="productSearch" v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :is-receipt="true" :only-products="true" :warehouse-id="warehouseId" required />
    </div>
    
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash"
                :disabled="!$store.getters.hasPermission('warehouse_receipts_delete')">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('warehouse_receipts_update')) ||
                (editingItemId == null && !$store.getters.hasPermission('warehouse_receipts_create'))">
            </PrimaryButton>
        </div>
        
        <div v-if="products && products.length > 0" class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
            <div>{{ $t('total') || 'Итого' }}: <span class="font-bold">{{ totalAmount.toFixed(2) }} {{ defaultCurrencySymbol }}</span></div>
        </div>
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
import { roundValue } from '@/utils/numberUtils';


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
            projectId: this.editingItem ? this.editingItem.projectId || '' : '',
            type: this.editingItem ? this.editingItem.type : 'cash',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            products: this.editingItem ? this.editingItem.products : [],
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            allWarehouses: [],
            allProjects: [],
            currencies: [],
            allCashRegisters: [],
        }
    },
    computed: {
        totalAmount() {
            if (!this.products || this.products.length === 0) return 0;
            return this.products.reduce((sum, product) => {
                const quantity = Number(product.quantity) || 0;
                const price = Number(product.price) || 0;
                return sum + (quantity * price);
            }, 0);
        },
        defaultCurrencySymbol() {
            const defaultCurrency = this.currencies.find(c => c.is_default);
            return defaultCurrency ? defaultCurrency.symbol : '';
        }
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllCashRegisters(),
                this.fetchAllProjects()
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
            // Используем данные из store
            await this.$store.dispatch('loadWarehouses');
            this.allWarehouses = this.$store.getters.warehouses;
        },
        async fetchCurrencies() {
            // Используем данные из store
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
        },
        async fetchAllCashRegisters() {
            // Используем данные из store
            await this.$store.dispatch('loadCashRegisters');
            this.allCashRegisters = this.$store.getters.cashRegisters;
            if (!this.cashId && this.allCashRegisters.length) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async fetchAllProjects() {
            // Используем данные из store
            await this.$store.dispatch('loadProjects');
            const allProjectsFromStore = this.$store.getters.projects;
            
            // Если редактируем оприходование и у неё есть проект, который завершен (его нет в проектах из store),
            // добавляем его в список опций
            if (this.editingItem && this.editingItem.projectId && this.editingItem.projectName) {
                const hasProject = allProjectsFromStore.some(p => p.id === this.editingItem.projectId);
                if (!hasProject) {
                    // Проект завершен, добавляем его вручную
                    this.allProjects = [
                        ...allProjectsFromStore,
                        { id: this.editingItem.projectId, name: this.editingItem.projectName }
                    ];
                    return;
                }
            }
            
            this.allProjects = allProjectsFromStore;
        },

        async save() {
            // Проверяем обязательные поля
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
            
            if (!this.products || this.products.length === 0) {
                validationErrors.push('• Добавьте товары');
            }
            
            // Проверяем, что у всех товаров есть обязательные поля
            const invalidProducts = this.products.filter(p => 
                !p.productId || !p.quantity || p.quantity <= 0 || !p.price || p.price < 0
            );
            
            if (invalidProducts.length > 0) {
                validationErrors.push('• У некоторых товаров не заполнены обязательные поля (ID, количество, цена)');
            }
            
            if (validationErrors.length > 0) {
                this.$emit('saved-error', validationErrors.join('\n'));
                return;
            }

            this.saveLoading = true;
            try {
                // Для НОВОГО оприходования округляем цены согласно настройкам компании
                const shouldRoundPrices = !this.editingItemId;
                const productsData = this.products.map(product => ({
                    product_id: product.productId,
                    quantity: product.quantity,
                    price: shouldRoundPrices ? roundValue(product.price) : product.price,
                }));
                
                var formData = {
                    client_id: this.selectedClient?.id,
                    warehouse_id: this.warehouseId,
                    project_id: this.projectId || null,
                    date: this.date,
                    note: this.note,
                    cash_id: this.cashId, // всегда отправляем выбранную кассу
                    type: this.type, // "cash" или "balance" - is_debt определяется автоматически
                    products: productsData
                };

                if (this.editingItemId != null) {
                    var resp = await WarehouseReceiptController.updateReceipt(
                        this.editingItemId,
                        formData);
                } else {
                    var resp = await WarehouseReceiptController.storeReceipt(formData);
                }
                if (resp.message) {
                    // Инвалидируем кэш товаров, т.к. остатки изменились
                    await this.$store.dispatch('invalidateCache', { type: 'products' });
                    // Перезагружаем список товаров для ProductSearch
                    await this.$store.dispatch('loadAllProducts');
                    
                    this.$emit('saved');
                    this.clearForm();
                }
            } catch (error) {
                let errorMessage = this.getApiErrorMessage(error);
                
                // Если есть детали валидации от Laravel
                if (error.response?.data?.errors) {
                    const validationErrors = error.response.data.errors;
                    const errorMessages = Object.keys(validationErrors).map(field => {
                        return `${field}: ${validationErrors[field].join(', ')}`;
                    });
                    errorMessage = errorMessages.join('\n');
                }
                
                this.$emit('saved-error', errorMessage);
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
            this.projectId = '';
            this.currencyId = '';
            this.selectedClient = null;
            this.products = [];
            this.editingItemId = null;
            this.type = 'cash'; // Сбрасываем на значение по умолчанию
            this.cashId = this.allCashRegisters.length > 0 ? this.allCashRegisters[0].id : '';
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
        warehouseId: {
            async handler(newWarehouseId) {
                // При изменении склада перезагружаем товары в ProductSearch
                if (newWarehouseId && this.$refs.productSearch) {
                    await this.$refs.productSearch.fetchLastProducts();
                }
            }
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.date = newEditingItem.date || '';
                    this.note = newEditingItem.note || '';
                    this.warehouseId = newEditingItem.warehouseId || '';
                    this.projectId = newEditingItem.projectId || '';
                    this.currencyId = newEditingItem.currencyId || '';
                    this.selectedClient = newEditingItem.client || null;
                    this.editingItemId = newEditingItem.id || null;
                    this.products = newEditingItem.products || [];
                    this.cashId = newEditingItem.cashId || '';
                    // Устанавливаем type на основе наличия cashId
                    this.type = newEditingItem.type || (newEditingItem.cashId ? 'cash' : 'balance');
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