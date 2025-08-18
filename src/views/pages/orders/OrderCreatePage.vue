<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editOrder') : $t('createOrder') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-show="currentTab === 'info'">
                <ClientSearch v-model:selectedClient="selectedClient" />
                <div>
                    <label class="required">{{ $t('type') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="categoryId" required>
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allCategories" :key="parent.id" :value="parent.id">{{ parent.name }}
                            </option>
                        </select>
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showCategoryModal" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('date') }}</label>
                    <input type="datetime-local" v-model="date" :disabled="!!editingItemId">
                </div>
                <div>
                    <label class="required">{{ $t('cashRegister') }}</label>
                    <select v-model="cashId" :disabled="!!editingItemId">
                        <option value="">{{ $t('no') }}</option>
                        <option v-for="c in allCashRegisters" :key="c.id" :value="c.id">
                            {{ c.name }} ({{ c.currency_symbol }})
                        </option>
                    </select>
                </div>
                <div>
                    <label>{{ $t('description') }}</label>
                    <textarea v-model="description" :disabled="!!editingItemId"
                        class="w-full border rounded p-2"></textarea>
                </div>
                <div>
                    <label>{{ $t('project') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="projectId" :disabled="!!editingItemId">
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">{{ parent.name }}
                            </option>
                        </select>
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showProjectModal" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('note') }}</label>
                    <input type="text" v-model="note" :disabled="!!editingItemId">
                </div>
            </div>
            <div v-show="currentTab === 'products'">
                <div>
                    <label class="required">{{ $t('warehouse') }}</label>
                    <select v-model="warehouseId" required :disabled="!!editingItemId">
                        <option value="">{{ $t('no') }}</option>
                        <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">{{ parent.name }}
                        </option>
                    </select>
                </div>
                <ProductSearch ref="productSearch" v-model="products" :show-quantity="true" :show-price="true" :show-price-type="true"
                    :is-sale="true" :isOrder="true" :currency-symbol="currencySymbol" v-model:discount="discount"
                    v-model:discountType="discountType" required @product-removed="onProductRemoved" />
            </div>
            <div v-show="currentTab === 'transactions'">
                <OrderTransactionsTab v-if="editingItemId" :order-id="editingItemId" :client="selectedClient"
                    :project-id="projectId" :cash-id="cashId" :currency-symbol="currencySymbol"
                    @updated-paid="paidTotalAmount = $event" />
                <div v-else class="p-4 text-gray-500">
                    {{ $t('saveOrderFirst') }}
                </div>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <!-- Кнопки -->
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItemId" icon="fas fa-check" :onclick="saveWithoutClose" :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-remove">
            </PrimaryButton>
        </div>

        <!-- Информация в одной строке -->
        <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
            <div>{{ $t('toPay') }}: <span class="font-bold">{{ totalPrice.toFixed(2) }}{{ currencySymbol }}</span></div>
            <div>{{ $t('paid') }}: <span class="font-bold">{{ paidTotalAmount.toFixed(2) }}{{ currencySymbol }}</span></div>
            <div>{{ $t('total') }}: <span class="font-bold">{{ (totalPrice - paidTotalAmount).toFixed(2) }}{{ currencySymbol
            }}</span></div>
        </div>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog"
        :descr="$t('confirmDelete')" :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose"
        :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <SideModalDialog :showForm="projectModalDialog" :onclose="closeProjectModal" :level="1">
        <ProjectCreatePage @saved="handleProjectSaved" @saved-error="handleProjectSavedError" />
    </SideModalDialog>
    <SideModalDialog :showForm="categoryModalDialog" :onclose="closeCategoryModal" :level="1">
        <OrderCategoryCreatePage @saved="handleCategorySaved" @saved-error="handleCategorySavedError" />
    </SideModalDialog>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import CashRegisterController from '@/api/CashRegisterController';
import OrderController from '@/api/OrderController';
import WarehouseController from '@/api/WarehouseController';
import ProjectController from '@/api/ProjectController';
import AppController from '@/api/AppController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import OrderStatusController from '@/api/OrderStatusController';
import OrderCategoryController from '@/api/OrderCategoryController';
import OrderTransactionsTab from '@/views/pages/orders/OrderTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import OrderCategoryCreatePage from '@/views/pages/orders/OrderCategoryCreatePage.vue';


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { ClientSearch, ProductSearch, PrimaryButton, AlertDialog, TabBar, OrderTransactionsTab, SideModalDialog, ProjectCreatePage, OrderCategoryCreatePage },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            currentTab: 'info',
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'products', label: 'products' },
                { name: 'transactions', label: 'transactions' }
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
            editingItemId: this.editingItem?.id || null,
            allWarehouses: [],
            allProjects: [],
            allCategories: [],
            allCashRegisters: [],
            currencies: [],
            statuses: [],
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            paidTotalAmount: 0,
            projectModalDialog: false,
            categoryModalDialog: false,
            removedTempProducts: [], // Список удаленных временных товаров
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
    mounted() {
        // Сохраняем начальное состояние после монтирования компонента
        this.$nextTick(() => {
            this.saveInitialState();
        });
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
            return Math.min(disc, this.subtotal);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        }
    },
    methods: {
        // Переопределяем метод getFormState из миксина
        getFormState() {
            const state = {
                selectedClient: this.selectedClient,
                categoryId: this.categoryId,
                date: this.date,
                cashId: this.cashId,
                description: this.description,
                projectId: this.projectId,
                note: this.note,
                warehouseId: this.warehouseId,
                products: [...this.products],
                discount: this.discount,
                discountType: this.discountType,
            };
            return state;
        },
        async fetchAllWarehouses() {
            this.allWarehouses = await WarehouseController.getAllItems();
            if (!this.editingItem && this.allWarehouses.length) {
                this.warehouseId = this.allWarehouses[0].id;
            }
        },
        async fetchAllProjects() {
            try {
                this.allProjects = await ProjectController.getAllItems();
            } catch (error) {
                this.allProjects = [];
            }
        },
        async fetchAllCategories() {
            try {
                this.allCategories = await OrderCategoryController.getAllItems();
                if (!this.editingItem && this.allCategories.length) {
                    this.categoryId = this.allCategories[0].id;
                }
            } catch (error) {
                this.allCategories = [];
            }
        },
        async fetchCurrencies() {
            this.currencies = await AppController.getCurrencies();
        },
        async fetchAllCashRegisters() {
            this.allCashRegisters = await CashRegisterController.getAllItems();
            if (this.allCashRegisters.length && !this.cashId && !this.defaultCashId) {
                this.cashId = this.allCashRegisters[0].id;
            }
        },
        async fetchOrderStatuses() {
            this.statuses = await OrderStatusController.getAllItems();
        },
        changeTab(tabName) {
            this.currentTab = tabName;
        },

        async save() {
            this.saveLoading = true;
            try {
                const formData = {
                    client_id: this.selectedClient?.id,
                    project_id: this.projectId || null,
                    cash_id: this.cashId || null,
                    currency_id: this.currencyId || null,
                    warehouse_id: this.warehouseId || null,
                    status_id: this.statusId || 1,
                    category_id: this.categoryId,
                    date: this.date,
                    note: this.note,
                    discount: this.discount,
                    discount_type: this.discountType,
                    description: this.description,
                    products: this.products
                        .filter(p => !p.isTempProduct)
                        .map(p => ({
                            product_id: p.productId,
                            quantity: p.quantity,
                            price: p.price
                        })),
                    temp_products: this.products
                        .filter(p => p.isTempProduct)
                        .map(p => ({
                            name: p.name || p.productName,
                            description: p.description || '',
                            quantity: p.quantity,
                            price: p.price,
                            unit_id: p.unitId || p.unit_id || null,
                        })),
                    remove_temp_products: this.removedTempProducts
                };
                let resp;
                if (this.editingItemId) {
                    resp = await OrderController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await OrderController.storeItem(formData);
                    this.editingItemId = resp?.id || null;
                }
                if (resp.message) {
                    this.$emit('saved');
                    // Обновляем начальное состояние формы после успешного сохранения
                    this.resetFormChanges();
                    // Сбрасываем список удаленных временных товаров
                    this.removedTempProducts = [];
                    // НЕ очищаем форму здесь, чтобы избежать создания дублирующих заказов
                    // Форма будет очищена только при закрытии страницы или явном сбросе
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },

        async saveWithoutClose() {
            this.saveLoading = true;
            try {
                const formData = {
                    client_id: this.selectedClient?.id,
                    project_id: this.projectId || null,
                    cash_id: this.cashId || null,
                    currency_id: this.currencyId || null,
                    warehouse_id: this.warehouseId || null,
                    status_id: this.statusId || 1,
                    category_id: this.categoryId,
                    date: this.date,
                    note: this.note,
                    discount: this.discount,
                    discount_type: this.discountType,
                    description: this.description,
                    products: this.products
                        .filter(p => !p.isTempProduct)
                        .map(p => ({
                            product_id: p.productId,
                            quantity: p.quantity,
                            price: p.price
                        })),
                    temp_products: this.products
                        .filter(p => p.isTempProduct)
                        .map(p => ({
                            name: p.name || p.productName,
                            description: p.description || '',
                            quantity: p.quantity,
                            price: p.price,
                            unit_id: p.unitId || p.unit_id || null,
                        })),
                    remove_temp_products: this.removedTempProducts
                };
                
                let resp;
                if (this.editingItemId) {
                    resp = await OrderController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await OrderController.storeItem(formData);
                    this.editingItemId = resp?.id || null;
                }
                
                if (resp.message) {
                    this.$emit('saved-silent');
                    // Обновляем начальное состояние формы после успешного сохранения
                    this.resetFormChanges();
                    // Сбрасываем список удаленных временных товаров
                    this.removedTempProducts = [];
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
        // Обработчик удаления товара
        onProductRemoved(productData) {
            if (productData.wasTempProduct && productData.name) {
                this.removedTempProducts.push(productData.name);
            }
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
            this.editingItemId = null;
            this.statusId = 1;
            this.paidTotalAmount = 0;
            this.removedTempProducts = []; // Сбрасываем список удаленных временных товаров
            this.resetFormChanges(); // Сбрасываем состояние изменений
        },
        showDeleteDialog() {
            this.deleteDialog = true;
        },
        closeDeleteDialog() {
            this.deleteDialog = false;
        },
        showProjectModal() {
            this.projectModalDialog = true;
        },
        closeProjectModal() {
            this.projectModalDialog = false;
        },
        handleProjectSaved(project) {
            // Обновляем список проектов и выбираем новый проект
            this.fetchAllProjects();
            if (project && project.id) {
                this.projectId = project.id;
            }
            this.closeProjectModal();
        },
        handleProjectSavedError(error) {
            console.error('Ошибка создания проекта:', error);
            // Можно добавить уведомление об ошибке
        },
        showCategoryModal() {
            this.categoryModalDialog = true;
        },
        closeCategoryModal() {
            this.categoryModalDialog = false;
        },
        handleCategorySaved(category) {
            // Обновляем список категорий и выбираем новую категорию
            this.fetchAllCategories();
            if (category && category.id) {
                this.categoryId = category.id;
            }
            this.closeCategoryModal();
        },
        handleCategorySavedError(error) {
            console.error('Ошибка создания категории заказа:', error);
            // Можно добавить уведомление об ошибке
        },
        generateTempProductId() {
            // Генерируем уникальный ID для временного товара
            // Используем timestamp + случайное число для уникальности
            return Date.now() + Math.floor(Math.random() * 1000);
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
                    this.projectId = newEditingItem.projectId || newEditingItem.project_id || '';
                    this.warehouseId = newEditingItem.warehouseId || (this.allWarehouses.length ? this.allWarehouses[0].id : '');
                    this.cashId = newEditingItem.cashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    this.statusId = newEditingItem.statusId || '';
                    this.categoryId = newEditingItem.categoryId || '';
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.note = newEditingItem.note || '';
                    this.description = newEditingItem.description || '';
                    // Нормализуем позиции: разделяем обычные и одноразовые
                    const rawProducts = newEditingItem.products || [];
                    this.products = rawProducts.map(p => {
                        // Бэкенд/фронт могут прислать разные кейсы (snake_case / camelCase)
                        // Временный товар определяется по флагу isTempProduct или по отсутствию product_id/productId
                        const isTemp = p.isTempProduct || ((p.product_id == null) && (p.productId == null));
                        if (isTemp) {
                            return {
                                name: p.product_name || p.productName || p.name,
                                productName: p.product_name || p.productName || p.name, // Добавляем для совместимости
                                description: p.description || '',
                                quantity: Number(p.quantity) || 0,
                                price: Number(p.price) || 0,
                                unitId: (p.unit_id ?? p.unitId) ?? null,
                                productId: p.productId || p.product_id || this.generateTempProductId(), // Генерируем ID если его нет
                                isTempProduct: true,
                                icons() { return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>'; },
                            };
                        }
                        return {
                            productId: p.product_id ?? p.productId,
                            productName: p.product_name || p.productName || p.name,
                            name: p.product_name || p.productName || p.name,
                            quantity: Number(p.quantity) || 0,
                            price: Number(p.price) || 0,
                            unitId: (p.unit_id ?? p.unitId) ?? null,
                            // Для товара/услуги, если хотите — можно подменить иконку по типу продукта
                            icons() {
                                const isProduct = p.product_type == 1 || p.product_type === '1' || p.type == 1 || p.type === '1';
                                return isProduct
                                    ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
                                    : '<i class="fas fa-concierge-bell text-[#EAB308]" title="Услуга"></i>';
                            }
                        };
                    });
                    this.discount = newEditingItem.discount || 0;
                    this.discountType = newEditingItem.discount_type || 'fixed';
                    this.editingItemId = newEditingItem.id || null;
                } else {
                    this.clearForm();
                }
                // Сохраняем новое начальное состояние
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