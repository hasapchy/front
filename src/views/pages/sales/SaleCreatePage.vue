<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Продажа</h2>
        <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
        <div>
            <label>Дата</label>
            <input type="datetime-local" v-model="date"
                :disabled="editingItemId && !$store.getters.hasPermission('edit_any_date')" />
        </div>
        <div v-if="type === 'cash'" class="mt-2">
            <label class="block mb-1 required">Касса</label>
            <select v-model="cashId" :disabled="!!editingItemId">
                <option value="">Нет</option>
                <option v-for="parent in allCashRegisters" :key="parent.id" :value="parent.id">
                    {{ parent.name }} ({{ parent.currency_symbol }})
                </option>
            </select>
        </div>
        <div class="mt-2">
            <label class="block mb-1 required">Тип оплаты</label>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="cash" :disabled="!!editingItemId" />
                    <span class="ml-2">В кассу</span>
                </label>
            </div>
            <div>
                <label class="inline-flex items-center">
                    <input type="radio" v-model="type" value="balance" :disabled="!!editingItemId" />
                    <span class="ml-2">В баланс клиента</span>
                </label>
            </div>
        </div>
        <div class="mt-2">
            <label class="block mb-1">Проект</label>
            <select v-model="projectId" :disabled="!!editingItemId" v-if="allProjects.length">
                <option value="">Нет</option>
                <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">
                    {{ parent.name }}
                </option>
            </select>
            <select v-model="projectId" :disabled="!!editingItemId" v-else>
                <option value="">Нет</option>
            </select>
        </div>

        <div class="mt-2">
            <label>Примечание</label>
            <input type="text" v-model="note" :disabled="!!editingItemId" />
        </div>

        <div class="mt-2">
            <label class="block mb-1 required">Склад</label>
            <div class="flex items-center space-x-2">
                <select v-model="warehouseId" required :disabled="!!editingItemId" v-if="allWarehouses.length">
                    <option value="">Нет</option>
                    <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                        {{ parent.name }}
                    </option>
                </select>
                <select v-model="warehouseId" required :disabled="!!editingItemId" v-else>
                    <option value="">Нет</option>
                </select>
            </div>
        </div>
        <ProductSearch v-model="products" :disabled="!!editingItemId" :show-quantity="true" :show-price="true"
            :show-price-type="true" :is-sale="true" :currency-symbol="currencySymbol" v-model:discount="discount"
            v-model:discountType="discountType" required />
    </div>
    <div class="mt-4 p-4 flex space-x-2 bg-[#edf4fb]">
        <PrimaryButton v-if="editingItem != null" :onclick="showDeleteDialog" :is-danger="true"
            :is-loading="deleteLoading" icon="fas fa-remove" :disabled="!$store.getters.hasPermission('sales_delete')">
            Удалить
        </PrimaryButton>
        <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading" :disabled="(editingItemId != null && !$store.getters.hasPermission('sales_update')) ||
            (editingItemId == null && !$store.getters.hasPermission('sales_create'))">
            Сохранить
        </PrimaryButton>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление. Данные будут отражены на стоке и балансе клиента!'"
        :confirm-text="'Удалить продажу'" :leave-text="'Отмена'" />
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

export default {
    mixins: [getApiErrorMessage],
    emits: ["saved", "saved-error", "deleted", "deleted-error"],
    components: { PrimaryButton, AlertDialog, ClientSearch, ProductSearch, },
    props: {
        editingItem: { type: SaleDto, required: false, default: null, },
    },
    data() {
        return {
            date: this.editingItem
                ? this.editingItem.date
                : new Date().toISOString().substring(0, 16),
            note: this.editingItem ? this.editingItem.note : "",
            type: this.editingItem ? this.editingItem.type : "cash",
            warehouseId: this.editingItem ? this.editingItem.warehouseId || "" : "",
            currencyId: this.editingItem ? this.editingItem.currencyId || "" : "",
            projectId: this.editingItem ? this.editingItem.projectId : "",
            cashId: this.editingItem ? this.editingItem.cashId : "",
            products: this.editingItem ? this.editingItem.products : [],
            discount: this.editingItem ? this.editingItem.discount : 0,
            discountType: this.editingItem ? this.editingItem.discount_type : "fixed",
            editingItemId: this.editingItem ? this.editingItem.id : null,
            selectedClient: this.editingItem ? this.editingItem.client : null,
            saveLoading: false,
            deleteDialog: false,
            deleteLoading: false,
            allWarehouses: [],
            allProjects: [],
            allCashRegisters: [],
            currencies: [],
        };
    },
    created() {
        this.fetchAllWarehouses();
        this.fetchAllProjects();
        this.fetchCurrencies();
        this.fetchAllCashRegisters();
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
                // console.log("Saving sale with formData:", formData);
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
        cashId: {
            handler(newCashId) {
                const selectedCash = this.allCashRegisters.find((cash) => cash.id == newCashId);
                if (selectedCash && selectedCash.currency_id) {
                    this.currencyId = selectedCash.currency_id;
                }
            },
            immediate: true,
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
                    this.discountType = newEditingItem.discount_type || "fixed";
                } else {
                    this.clearForm();
                }
            },
            deep: true,
            immediate: true,
        },
    },
};
</script>
