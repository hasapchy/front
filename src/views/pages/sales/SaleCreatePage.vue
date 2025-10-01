<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editSale') : $t('createSale') }}</h2>
        <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
        <div>
            <label>{{ $t('date') }}</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
        </div>
        <div v-if="type === 'cash'" class="mt-2">
            <label class="block mb-1 required">{{ $t('cashRegister') }}</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">{{ $t('no') }}</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currency_symbol || parent.currency_code || '' }})
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">{{ $t('paymentType') }}</label>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId" />
                    <span class="ml-2">{{ $t('toCash') }}</span>
                </label>
            </div>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance" :disabled="!!editingItemId" />
                    <span class="ml-2">{{ $t('toClientBalance') }}</span>
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
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
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


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ["saved", "saved-error", "deleted", "deleted-error", "close-request"],
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch, },
    props: {
        editingItem: { type: SaleDto, required: false, default: null, },
    },
    data() {
        return {
            date: new Date().toISOString().substring(0, 16),
            note: "",
            type: "cash",
            warehouseId: "",
            currencyId: "",
            projectId: "",
            cashId: "",
            products: [],
            discount: 0,
            discountType: "fixed",
            editingItemId: null,
            selectedClient: null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
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
                this.fetchAllCashRegisters()
            ]);
            
            if (!this.editingItem) {
                if (this.allWarehouses.length > 0 && !this.warehouseId) {
                    this.warehouseId = this.allWarehouses[0].id;
                }
                if (this.allCashRegisters.length > 0 && !this.cashId) {
                    this.cashId = this.allCashRegisters[0].id;
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
            return this.products.reduce(
                (sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0),
                0
            );
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === "percent") {
                return (this.subtotal * disc) / 100;
            }
            return Math.min(disc, this.subtotal);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        defaultCurrency() {
            return this.currencies.find((c) => c.is_default);
        },
        currencySymbol() {
            if (this.type === "cash") {
                return this.selectedCash?.currency_symbol || "";
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
            // Всегда загружаем данные заново и ждем их появления в store
            await this.$store.dispatch('loadWarehouses');
            
            // Ждем пока данные появятся в store (максимум 3 секунды)
            let attempts = 0;
            while (this.$store.getters.warehouses.length === 0 && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            this.allWarehouses = this.$store.getters.warehouses;
        },
        async fetchAllProjects() {
            // Используем данные из store
            await this.$store.dispatch('loadProjects');
            // Фильтруем только активные проекты
            this.allProjects = this.$store.getters.projects.filter(p => p.statusId !== 3 && p.statusId !== 4);
        },
        async fetchCurrencies() {
            // Используем данные из store
            if (this.$store.getters.currencies.length > 0) {
                this.currencies = this.$store.getters.currencies;
            } else {
                await this.$store.dispatch('loadCurrencies');
                this.currencies = this.$store.getters.currencies;
            }
        },
        async fetchAllCashRegisters() {
            // Всегда загружаем данные заново и ждем их появления в store
            await this.$store.dispatch('loadCashRegisters');
            
            // Ждем пока данные появятся в store (максимум 3 секунды)
            let attempts = 0;
            while (this.$store.getters.cashRegisters.length === 0 && attempts < 30) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            this.allCashRegisters = this.$store.getters.cashRegisters;
        },
        async save() {
            this.saveLoading = true;
            try {
                var formData = {
                    client_id: this.selectedClient?.id,
                    project_id: this.projectId || null,
                    warehouse_id: this.warehouseId,
                    currency_id:
                        this.type === "cash" ? this.selectedCash?.currency_id : this.currencyId,
                    cash_id: this.type === "cash" ? this.cashId : null,
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

                let resp;
                if (this.editingItemId != null) {
                    resp = await SaleController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await SaleController.storeItem(formData);
                }
                if (resp.message) {
                    this.$emit("saved");
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
                var resp = await SaleController.deleteItem(this.editingItemId);
                if (resp.message) {
                    this.$emit("deleted");
                    this.clearForm();
                }
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        clearForm() {
            this.date = new Date().toISOString().substring(0, 16);
            this.note = "";
            this.type = "cash";
            this.warehouseId = this.allWarehouses.length ? this.allWarehouses[0].id : "";
            this.currencyId = "";
            this.projectId = "";
            this.cashId = this.allCashRegisters.length ? this.allCashRegisters[0].id : "";
            this.selectedClient = null;
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
        type: {
            handler(newType) {
                if (newType === "balance") {
                    this.cashId = "";
                    const defaultCurrency = this.currencies.find((c) => c.is_default);
                    if (defaultCurrency) {
                        this.currencyId = defaultCurrency.id;
                    }
                }
            },
        },
        allWarehouses: {
            handler(newWarehouses) {
                if (newWarehouses.length && !this.warehouseId && !this.editingItem) {
                    this.warehouseId = newWarehouses[0].id;
                }
            },
            immediate: true,
        },
        editingItem: {
            handler(newEditingItem) {
                if (newEditingItem) {
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.note = newEditingItem.note || "";
                    this.type =
                        newEditingItem.cashId || newEditingItem.transactionId ? "cash" : "balance";
                    this.warehouseId =
                        newEditingItem.warehouseId ||
                        (this.allWarehouses.length ? this.allWarehouses[0].id : "");
                    this.currencyId = newEditingItem.currencyId || "";
                    this.projectId = newEditingItem.projectId || "";
                    this.cashId =
                        newEditingItem.cashId ||
                        (this.allCashRegisters.length ? this.allCashRegisters[0].id : "");
                    this.selectedClient = newEditingItem.client || null;
                    this.editingItemId = newEditingItem.id || null;
                    this.products = newEditingItem.products || [];
                    this.discount = newEditingItem.discount || 0;
                    this.discountType = newEditingItem.discountType || "fixed";
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true,
        },
        // Отслеживаем изменения в store
        '$store.state.warehouses'(newVal) {
            this.allWarehouses = newVal;
        },
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.projects'(newVal) {
            // Фильтруем только активные проекты
            this.allProjects = newVal.filter(p => p.statusId !== 3 && p.statusId !== 4);
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
        },
    },
};
</script>
