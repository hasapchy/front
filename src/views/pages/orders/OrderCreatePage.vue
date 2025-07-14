<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">Заказ</h2>
        <TabBar :tabs="tabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-show="currentTab === 'info'">
                <ClientSearch v-model:selectedClient="selectedClient" :disabled="!!editingItemId" />
                <div>
                    <label class="required">Тип</label>
                    <select v-model="categoryId" required>
                        <option value="">Нет</option>
                        <option v-for="parent in allCategories" :value="parent.id">{{ parent.name }}</option>
                    </select>
                </div>
                <div>
                    <label>Дата</label>
                    <input type="datetime-local" v-model="date" :disabled="!!editingItemId">
                </div>
                <div>
                    <label class="required">Касса</label>
                    <select v-model="cashId" :disabled="!!editingItemId">
                        <option value="">Нет</option>
                        <option v-for="c in allCashRegisters" :value="c.id">{{ c.name }}</option>
                    </select>
                </div>
                <div>
                    <label>Описание</label>
                    <textarea v-model="description" :disabled="!!editingItemId"
                        class="w-full border rounded p-2"></textarea>
                </div>
                <div>
                    <label>Проект</label>
                    <select v-model="projectId" :disabled="!!editingItemId">
                        <option value="">Нет</option>
                        <option v-for="parent in allProjects" :value="parent.id">{{ parent.name }}</option>
                    </select>
                </div>
                <div>
                    <label>Примечание</label>
                    <input type="text" v-model="note" :disabled="!!editingItemId">
                </div>
            </div>
            <div v-show="currentTab === 'products'">
                <div>
                    <label class="required">Склад</label>
                    <select v-model="warehouseId" required :disabled="!!editingItemId">
                        <option value="">Нет</option>
                        <option v-for="parent in allWarehouses" :value="parent.id">{{ parent.name }}</option>
                    </select>
                </div>
                <ProductSearch v-model="products" :show-quantity="true" :show-price="true" :show-price-type="true"
                    :is-sale="true" :currency-symbol="currencySymbol" v-model:discount="discount"
                    v-model:discountType="discountType" @update:subtotal="subtotal = $event"
                    @update:totalPrice="totalPrice = $event" required />
            </div>
            <div v-show="currentTab === 'transactions'">
                <div v-if="!editingItemId" class="p-4 text-gray-500">
                    Сначала сохраните заказ, чтобы добавить/просматривать транзакции.
                </div>
                <div v-else>
                    <PrimaryButton icon="fas fa-plus" :onclick="showTransactionModal" class="my-3">
                        Добавить транзакцию
                    </PrimaryButton>

                    <DraggableTable v-if="transactions.length" table-key="order.transactions"
                        :columns-config="transactionsColumns" :table-data="transactions"
                        :item-mapper="transactionItemMapper" :onItemClick="editTransaction" />

                    <div v-else class="text-gray-500">Транзакции отсутствуют</div>
                </div>
            </div>

        </div>
    </div>
    <div class="mt-4 p-4 flex flex-wrap items-center justify-between bg-[#edf4fb] gap-4">
        <div class="flex space-x-2">
            <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-remove">Удалить</PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">Сохранить</PrimaryButton>
        </div>
        <div class="flex items-center space-x-4 font-medium text-gray-700">
            <div>К оплате: <span class="font-bold">{{ totalPrice.toFixed(2) }}{{ currencySymbol }}</span></div>
            <div>Оплачено: <span class="font-bold">{{ paidTotalAmount.toFixed(2) }}{{ currencySymbol }}</span></div>
            <div>Осталось: <span class="font-bold">{{ (totalPrice - paidTotalAmount).toFixed(2) }}{{ currencySymbol
            }}</span></div>

        </div>
    </div>
    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="'Подтвердите удаление заказа'" :confirm-text="'Удалить заказ'" :leave-text="'Отмена'" />
    <SideModalDialog :showForm="transactionModal" :onclose="closeTransactionModal">
        <template v-if="transactionModal">
            <TransactionCreatePage :editingItem="editingTransaction" :initial-client="selectedClient"
                :initial-project-id="projectId" :order-id="editingItemId" :default-cash-id="cashId"
                @saved="handleTransactionSaved" @deleted="handleTransactionDeleted" />
        </template>
    </SideModalDialog>

</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import CashRegisterController from '@/api/CashRegisterController';
import TransactionCreatePage from '@/views/pages/transactions/TransactionCreatePage.vue';
import OrderController from '@/api/OrderController';
import WarehouseController from '@/api/WarehouseController';
import ProjectController from '@/api/ProjectController';
import AppController from '@/api/AppController';
import TransactionController from '@/api/TransactionController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import DraggableTable from '@/views/components/app/forms/DraggableTable.vue';


export default {
    emits: ['saved', 'saved-error', 'deleted', 'deleted-error'],
    components: {
        ClientSearch,
        ProductSearch,
        PrimaryButton,
        AlertDialog,
        SideModalDialog,
        TransactionCreatePage,
        TabBar,
        DraggableTable
    },
    props: {
        editingItem: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'Информация' },
                { name: 'products', label: 'Товары' },
                { name: 'transactions', label: 'Транзакции' }
            ],
            selectedClient: this.editingItem?.client || null,
            projectId: this.editingItem?.projectId || '',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            currencyId: this.editingItem?.currency_id || null,
            warehouseId: this.editingItem?.warehouseId || '',
            statusId: this.editingItem?.statusId || 1,
            categoryId: this.editingItem?.categoryId || '',
            date: this.editingItem?.date || new Date().toISOString().substring(0, 16),
            note: this.editingItem?.note || '',
            description: this.editingItem?.description || '',
            products: this.editingItem?.products || [],
            discount: this.editingItem ? this.editingItem.discount : 0,
            discountType: this.editingItem ? this.editingItem.discount_type : 'fixed',
            transactions: [],
            editingItemId: this.editingItem?.id || null,
            allWarehouses: [],
            allProjects: [],
            allCategories: [],
            allCashRegisters: [],
            currencies: [],
            allStatuses: [],
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            transactionModal: false,
            editingTransaction: null,
            paidTotalAmount: 0,
            transactionsColumns: [
                { name: 'id', label: 'ID' },
                { name: 'amount', label: 'Сумма', html: true },
                { name: 'cashName', label: 'Касса' },
                { name: 'date', label: 'Дата' },
            ],

        };
    },
    created() {
        this.fetchAllWarehouses();
        this.fetchAllProjects();
        this.fetchAllCategories();
        this.fetchCurrencies();
        this.fetchAllCashRegisters();
        this.fetchOrderStatuses();
    },
    computed: {
        currencySymbol() {
            return this.currencies.find(c => c.id === this.currencyId)?.symbol || '';
        },
        selectedCash() {
            return this.allCashRegisters.find(c => c.id == this.cashId);
        },
        defaultCurrencySymbol() {
            const def = this.currencies.find(c => c.is_default);
            return def ? def.symbol : '';
        },
        subtotal() {
            return this.products.reduce((sum, p) => {
                const price = Number(p.price) || 0;
                const qty = Number(p.quantity) || 0;
                return sum + price * qty;
            }, 0);
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === 'percent') {
                return this.subtotal * disc / 100;
            }
            // фиксированная скидка: не больше суммы
            return Math.min(disc, this.subtotal);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        paidTotal() {
            return this.transactions.reduce((sum, t) => {
                const amount = Number(t.amount || t.cash_amount || 0);
                return sum + amount;
            }, 0);
        }
    },
    methods: {
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
            if (!this.editingItem && this.allWarehouses.length) {
                this.warehouseId = this.allWarehouses[0].id;
            }
        },
        async fetchAllProjects() {
            this.allProjects = await ProjectController.getAllItems();
        },
        async fetchAllCategories() {
            this.allCategories = await AppController.getOrderCategories();
            if (!this.editingItem && this.allCategories.length) {
                this.categoryId = this.allCategories[0].id;
            }
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            this.allCashRegisters = this.allCashRegisters.map(cash => {
                const currency = this.currencies.find(c => c.id === cash.currency_id);
                return { ...cash, currencySymbol: currency.symbol };
            });
            if (this.allCashRegisters.length && !this.cashId && !this.defaultCashId) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async fetchOrderStatuses() {
            this.allStatuses = await AppController.getOrderStatuses();
        },
        async fetchTransactions() {
            if (!this.editingItemId) {
                this.transactions = [];
                return;
            }
            try {
                const response = await TransactionController.getItems(1, null, "all_time", this.editingItemId);
                this.transactions = response.items;
            } catch (error) {
                this.transactions = [];
            }
        },
        showTransactionModal() {
            this.editingTransaction = null;
            this.transactionModal = true;
        },
        closeTransactionModal() {
            this.transactionModal = false;
            this.editingTransaction = null;
        },
        handleTransactionSaved() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
        },
        handleTransactionDeleted() {
            this.transactionModal = false;
            this.fetchTransactions();
            this.fetchPaidTotal();
        },
        editTransaction(transaction) {
            this.editingTransaction = transaction;
            this.transactionModal = true;
        },
        changeTab(tabName) {
            this.currentTab = tabName;
            if (tabName === 'transactions') {
                this.fetchTransactions();
                this.fetchPaidTotal();
            }
        },
        async fetchPaidTotal() {
            if (!this.editingItemId) {
                this.paidTotalAmount = 0;
                return;
            }
            try {
                const resp = await TransactionController.getTotalPaidByOrderId(this.editingItemId);
                this.paidTotalAmount = parseFloat(resp.total) || 0;
            } catch (e) {
                console.error('Ошибка при получении total:', e);
                this.paidTotalAmount = 0;
            }
        },

        async save() {
            this.saveLoading = true;
            try {
                const formData = {
                    client_id: this.selectedClient?.id,
                    project_id: this.projectId || null,
                    cash_id: this.cashId || null,
                    // currency_id: this.currencyIdComputed || null,
                    currency_id: this.currencyId || null,
                    warehouse_id: this.warehouseId || null,
                    status_id: this.statusId || 1,
                    category_id: this.categoryId,
                    date: this.date,
                    note: this.note,
                    discount: this.discount,
                    discount_type: this.discountType,
                    description: this.description,
                    products: this.products.map(p => ({
                        product_id: p.productId,
                        quantity: p.quantity,
                        price: p.price
                    }))
                };
                let resp;
                if (this.editingItemId) {
                    resp = await OrderController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await OrderController.storeItem(formData);
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
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                const resp = await OrderController.deleteItem(this.editingItemId);
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
            this.selectedClient = null;
            this.projectId = '';
            this.warehouseId = this.allWarehouses[0]?.id || '';
            this.statusId = '';
            this.categoryId = this.allCategories[0]?.id || '';
            this.date = new Date().toISOString().substring(0, 16);
            this.note = '';
            this.description = ''
            this.products = [];
            this.transactions = [];
            this.editingItemId = null;
            this.statusId = 1;
            this.paidTotalAmount = 0;
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        transactionItemMapper(item, field) {
            switch (field) {
                case 'amount':
                    return item.cashAmountData?.() || '-';
                case 'cashName':
                    return item.cashName || '-';
                case 'date':
                    return item.formatDate?.() || '-';
                default:
                    return item[field];
            }
        },
        getApiErrorMessage(e) {
            if (e?.response && e.response.data) {
                if (e.response.data.errors) {
                    return Object.values(e.response.data.errors).flat();
                }
                if (e.response.data.message) {
                    return [e.response.data.message];
                }
            }
            if (e?.message) return [e.message];
            return ["Ошибка"];
        },
    },
    watch: {
        cashId: {
            handler(newCashId) {
                if (!newCashId || !this.allCashRegisters.length) return;
                const selectedCash = this.allCashRegisters.find(c => c.id == newCashId);
                if (selectedCash?.currency_id) {
                    this.currencyId = selectedCash.currency_id;
                }
            },
            immediate: true
        },
        allCashRegisters: {
            handler(newCashRegisters) {
                if (
                    this.editingItem &&
                    this.cashId &&
                    !this.currencyId &&
                    newCashRegisters.length
                ) {
                    const selectedCash = newCashRegisters.find(c => c.id == this.cashId);
                    if (selectedCash?.currency_id) {
                        this.currencyId = selectedCash.currency_id;
                    }
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
                    this.selectedClient = newEditingItem.client || null;
                    this.projectId = newEditingItem.projectId || '';
                    this.warehouseId = newEditingItem.warehouseId || (this.allWarehouses.length ? this.allWarehouses[0].id : '');
                    this.cashId = newEditingItem.cashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    this.statusId = newEditingItem.statusId || '';
                    this.categoryId = newEditingItem.categoryId || '';
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.note = newEditingItem.note || '';
                    this.description = this.editingItem?.description || '';
                    this.products = newEditingItem.products || [];
                    // this.currentTab = 'info';
                    this.discount = newEditingItem.discount || 0;
                    this.discountType = newEditingItem.discount_type || 'fixed';
                    this.editingItemId = newEditingItem.id || null;

                    this.fetchTransactions();
                    this.fetchPaidTotal();

                } else {
                    this.clearForm();
                    // this.currentTab = 'info';
                }
            },
            deep: true,
            immediate: true
        }
    }
}
</script>