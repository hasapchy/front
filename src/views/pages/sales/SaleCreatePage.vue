<template>
    <div class="flex flex-col h-full">
        <div class="flex flex-col overflow-auto h-full p-4 pb-24">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editSale') : $t('createSale') }}</h2>
        <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !canEditDate()"
                        :min="this.getMinDate()" />
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currencySymbol || '' }})
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('paymentType') }}</label>
            <div class="flex space-x-4">
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId" />
                    <i class="fas fa-cash-register ml-2 mr-1" style="color: #337AB7;"></i>
                    <span>{{ $t('toCash') }}</span>
                </label>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance" :disabled="!!editingItemId" />
                    <i class="fas fa-wallet ml-2 mr-1" style="color: #337AB7;"></i>
                    <span>{{ $t('toClientBalance') }}</span>
                </label>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">{{ $t('project') }}</label>
            <select v-model="projectId" :disabled="!!editingItemId" v-if="allProjects.length">
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">
                    {{ parent.name }}
                </option>
            </select>
            <select v-model="projectId" :disabled="!!editingItemId" v-else>
                <option value="">{{ $t('no') }}</option>
            </select>
        </div>

        <div class="mt-2">
            <label>{{ $t('note') }}</label>
            <input type="text" v-model="note" :disabled="!!editingItemId" />
        </div>

        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('warehouse') }}</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId" required :disabled="!!editingItemId" v-if="allWarehouses.length">
                    <option value="">{{ $t('no') }}</option>
                    <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
                <select v-model="warehouseId" required :disabled="!!editingItemId" v-else>
                    <option value="">{{ $t('no') }}</option>
                </select>
            </div>
        </div>
        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :show-price-type="true" :is-sale="true" :currency-symbol="currencySymbol" :warehouse-id="warehouseId"
            v-model:discount="discount" v-model:discountType="discountType" required />
        </div>
        
        <div class="fixed bottom-0 left-0 right-0 p-4 flex space-x-2 bg-[#edf4fb] border-t border-gray-200 z-10">
        <PrimaryButton v-if="editingItemId != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-trash" :disabled="!$store.getters.hasPermission('sales_delete')">
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('sales_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('sales_create'))">
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('deleteSaleConfirm')"
                  :confirm-text="$t('deleteSale')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    </div>
</template>

<script>
import AppController from "@/api/AppController";
import CashRegisterController from "@/api/CashRegisterController";
import ProjectController from "@/api/ProjectController";
import WarehouseController from "@/api/WarehouseController";
import SaleController from "@/api/SaleController";
import SaleDto from "@/dto/sale/SaleDto";
import PrimaryButton from "@/views/components/app/buttons/PrimaryButton.vue";
import AlertDialog from "@/views/components/app/dialog/AlertDialog.vue";
import ClientSearch from "@/views/components/app/search/ClientSearch.vue";
import ProductSearch from "@/views/components/app/search/ProductSearch.vue";
import getApiErrorMessage from "@/mixins/getApiErrorMessageMixin";
import formChangesMixin from "@/mixins/formChangesMixin";
import crudFormMixin from "@/mixins/crudFormMixin";
import dateFormMixin from "@/mixins/dateFormMixin";
import storeDataLoaderMixin from "@/mixins/storeDataLoaderMixin";


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch, },
    props: {
        editingItem: { type: SaleDto, required: false, default: null, },
    },
    data() {
        return {
            date: this.getCurrentLocalDateTime(),
            note: "",
            type: "cash",
            warehouseId: "",
            currencyId: "",
            projectId: "",
            cashId: "",
            products: [],
            discount: 0,
            discountType: "fixed",
            selectedClient: null,
            allWarehouses: [],
            allProjects: [],
            allCashRegisters: [],
            currencies: [],
        };
    },
    mounted() {
        this.$nextTick(async () => {
            await Promise.all([
                this.fetchCurrencies(),
                this.fetchAllWarehouses(),
                this.fetchAllProjects(),
                this.fetchAllCashRegisters(),
                this.fetchClients()
            ]);
            
            // Инициализация по умолчанию для нового элемента происходит через watchers на Store
            // (allWarehouses, allCashRegisters автоматически установят первые значения)
            if (!this.editingItem) {
                // Инициализируем currencyId для типа balance
                const defaultCurrency = this.currencies.find((c) => c.isDefault);
                if (defaultCurrency && !this.currencyId) {
                    this.currencyId = defaultCurrency.id;
                }
            }
            
            this.saveInitialState();
        });
    },
    computed: {
        selectedCurrency() {
            return this.currencies.find((currency) => currency.id == this.currency_id);
        },
        selectedCash() {
            return this.allCashRegisters.find((c) => c.id == this.cashId);
        },
        subtotal() {
            return this.products.reduce((sum, p) => {
                return sum + (Number(p.price) || 0) * (Number(p.quantity) || 0);
            }, 0);
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === "percent") {
                return (this.subtotal * disc) / 100;
            }
            return disc;
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        defaultCurrency() {
            return this.currencies.find((c) => c.isDefault);
        },
        currencySymbol() {
            if (this.type === "cash") {
                return this.selectedCash?.currencySymbol || "";
            } else {
                return this.defaultCurrency?.symbol || "";
            }
        }
    },
    methods: {
        getFormState() {
            return {
                selectedClient: this.selectedClient?.id || null,
                date: this.date,
                type: this.type,
                cashId: this.cashId,
                projectId: this.projectId,
                note: this.note,
                warehouseId: this.warehouseId,
                products: this.products.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price
                })),
                discount: this.discount,
                discountType: this.discountType,
            };
        },
        async fetchAllWarehouses() {
            await this.forceLoadStoreData({
                getterName: 'warehouses',
                dispatchName: 'loadWarehouses',
                localProperty: 'allWarehouses',
                defaultValue: []
            });
        },
    async fetchAllProjects() {
      await this.loadStoreData({
        getterName: 'activeProjects',
        dispatchName: 'loadProjects',
        onLoaded: (activeProjects) => {
          if (this.editingItem?.projectId && this.editingItem?.projectName) {
            const hasProject = activeProjects.some(p => p.id === this.editingItem.projectId);
            if (!hasProject) {
              this.allProjects = [
                ...activeProjects,
                { id: this.editingItem.projectId, name: this.editingItem.projectName }
              ];
              return;
            }
          }
          this.allProjects = activeProjects;
        }
      });
    },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies',
                defaultValue: []
            });
        },
        async fetchAllCashRegisters() {
            await this.forceLoadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'allCashRegisters',
                defaultValue: []
            });
        },
        async fetchClients() {
            await this.loadStoreData({
                getterName: 'clients',
                dispatchName: 'loadClients'
            });
        },
        prepareSave() {
            if (!this.selectedClient?.id) {
                throw new Error('Необходимо выбрать клиента');
            }
            if (!this.warehouseId) {
                throw new Error('Необходимо выбрать склад');
            }
            if (!this.products?.length) {
                throw new Error('Необходимо добавить товары');
            }

            const calculatedDiscount = this.discountAmount;
            if (calculatedDiscount > this.subtotal) {
                throw new Error('Скидка не может превышать сумму продажи');
            }

            return {
                client_id: this.selectedClient?.id,
                project_id: this.projectId || null,
                warehouse_id: this.warehouseId,
                currency_id: this.type === "cash" ? this.selectedCash?.currency_id : this.currencyId,
                cash_id: this.cashId,
                type: this.type,
                date: this.date,
                note: this.note,
                discount: this.discount,
                discount_type: this.discountType,
                products: this.products.map((p) => ({
                    product_id: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                })),
            };
        },
        async performSave(data) {
            if (this.editingItemId != null) {
                return await SaleController.updateItem(this.editingItemId, data);
            } else {
                return await SaleController.storeItem(data);
            }
        },
        async performDelete() {
            const resp = await SaleController.deleteItem(this.editingItemId);
            if (!resp.message) {
                throw new Error('Failed to delete sale');
            }
            return resp;
        },
        clearForm() {
            this.date = this.getCurrentLocalDateTime();
            this.note = "";
            this.type = "cash";
            this.warehouseId = this.allWarehouses?.[0]?.id || "";
            this.currencyId = "";
            this.projectId = "";
            this.cashId = this.allCashRegisters?.[0]?.id || "";
            this.selectedClient = null;
            this.products = [];
            if (this.resetFormChanges) {
                this.resetFormChanges();
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
                this.note = newEditingItem.note || "";
                this.type = newEditingItem.cashId || newEditingItem.transactionId ? "cash" : "balance";
                this.warehouseId = newEditingItem.warehouseId || this.allWarehouses?.[0]?.id || "";
                this.currencyId = newEditingItem.currencyId || "";
                this.projectId = newEditingItem.projectId || "";
                this.cashId = newEditingItem.cashId || this.allCashRegisters?.[0]?.id || "";
                this.selectedClient = newEditingItem.client || null;
                this.products = newEditingItem.products || [];
                this.discount = newEditingItem.discount || 0;
                this.discountType = newEditingItem.discountType || "fixed";
            }
        },
    },
    watch: {
        type: {
            handler(newType, oldType) {
                if (newType === "balance") {
                    // Не сбрасываем cashId, сохраняем выбранное значение
                    const defaultCurrency = this.currencies.find((c) => c.isDefault);
                    if (defaultCurrency) {
                        this.currencyId = defaultCurrency.id;
                    }
                } else if (newType === "cash" && oldType === "balance") {
                    if (!this.cashId && this.allCashRegisters?.length) {
                        this.cashId = this.allCashRegisters[0].id;
                    }
                }
            },
        },
        // Отслеживаем изменения в store
        '$store.state.warehouses': {
            handler(newVal) {
                this.allWarehouses = newVal;
                if (newVal?.length && !this.warehouseId && !this.editingItem) {
                    this.warehouseId = newVal[0].id;
                }
            },
            immediate: true
        },
        '$store.state.cashRegisters': {
            handler(newVal) {
                this.allCashRegisters = newVal;
                if (newVal?.length && !this.cashId && !this.editingItem) {
                    this.cashId = newVal[0].id;
                }
            },
            immediate: true
        },
        '$store.state.projects': {
            handler(newVal) {
                // Фильтруем только активные проекты
                this.allProjects = newVal.filter(p => p.statusId !== 3 && p.statusId !== 4);
            },
            immediate: true
        },
        '$store.state.currencies': {
            handler(newVal) {
                this.currencies = newVal;
            },
            immediate: true
        },
        '$store.state.clients': {
            handler(newClients) {
                if (this.selectedClient?.id && newClients?.length) {
                    const updated = newClients.find(c => c.id === this.selectedClient.id);
                    if (updated && typeof updated.fullName === 'function') {
                        this.selectedClient = updated;
                    }
                }
            },
            immediate: true,
            deep: true
        },
    },
};
</script>
