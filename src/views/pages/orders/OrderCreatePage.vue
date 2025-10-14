<template>
    <div class="flex flex-col overflow-auto h-full p-4">
        <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editOrder') : $t('createOrder') }}</h2>
        <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
        <div>
            <div v-show="currentTab === 'info'">
                <ClientSearch v-model:selectedClient="selectedClient" />
                <div>
                    <label class="required">{{ $t('productCategory') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="categoryId" required>
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="category in allProductCategories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                        <PrimaryButton 
                            icon="fas fa-add" 
                            :is-info="true" 
                            :onclick="showProductCategoryModal"
                            :disabled="!$store.getters.hasPermission('categories_create')" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('date') }}</label>
                    <input type="datetime-local" v-model="date"
                        :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                        :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null" />
                </div>
                <div>
                    <label>{{ $t('description') }}</label>
                    <textarea v-model="description"
                        class="w-full border rounded p-2"></textarea>
                </div>
                <div>
                    <label>{{ $t('project') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="projectId">
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">{{ parent.name }}
                            </option>
                        </select>
                        <PrimaryButton 
                            icon="fas fa-add" 
                            :is-info="true" 
                            :onclick="showProjectModal"
                            :disabled="!$store.getters.hasPermission('projects_create')" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('note') }}</label>
                    <input type="text" v-model="note">
                </div>
                
                <!-- <div class="space-y-4 mt-6">
                    <label class="block text-sm font-medium text-gray-700">{{ $t('additionalFields') }}</label>
                    <div v-if="additionalFields.length > 0" class="space-y-4">

                        <div v-for="field in additionalFields" :key="field.id" class="space-y-2">
                            <label :class="{ 'required': field.required }" class="block text-sm font-medium">
                                {{ field.name }}
                            </label>
                            
                            <select v-if="field.type === 'select'" v-model="additionalFieldValues[field.id]" 
                                    :required="field.required" 
                                    class="w-full border rounded p-2">
                                <option value="">{{ $t('selectOption') }}</option>
                                <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
                            </select>
                            
                            <input v-else-if="field.type === 'date'" type="date" 
                                   v-model="additionalFieldValues[field.id]" 
                                   :required="field.required"
                                   :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                                   :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 10) : null" 
                                   class="w-full border rounded p-2">
                            
                            <input v-else-if="field.type === 'datetime'" type="datetime-local" 
                                   v-model="additionalFieldValues[field.id]" 
                                   :required="field.required"
                                   :disabled="editingItemId && !$store.getters.hasPermission('settings_edit_any_date')"
                                   :min="!$store.getters.hasPermission('settings_edit_any_date') ? new Date().toISOString().substring(0, 16) : null"
                                   class="w-full border rounded p-2">
                            
                            <input v-else-if="field.type === 'int'" type="number" 
                                   v-model="additionalFieldValues[field.id]" 
                                   :required="field.required" 
                                   class="w-full border rounded p-2">
                            
                            <div v-else-if="field.type === 'boolean'" class="flex items-center space-x-2">
                                <input type="checkbox" 
                                       v-model="additionalFieldValues[field.id]" 
                                       :required="field.required">
                            </div>
                            
                            <input v-else type="text" 
                                   v-model="additionalFieldValues[field.id]" 
                                   :required="field.required" 
                                   class="w-full border rounded p-2">
                        </div>
                    </div>
                    <div v-else-if="categoryId" class="text-sm text-gray-500">
                        Для выбранной категории нет дополнительных полей
                    </div>
                    <div v-else class="text-sm text-gray-500">
                        Выберите категорию заказа для отображения дополнительных полей
                    </div>
                </div> -->
            </div>
            <div v-show="currentTab === 'products'">
                <!-- ✅ Ленивая загрузка: компонент рендерится только после первого посещения вкладки -->
                <template v-if="productsTabVisited">
                    <div>
                        <label class="required">{{ $t('warehouse') }}</label>
                        <select v-model="warehouseId" required>
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">{{ parent.name }}
                            </option>
                        </select>
                    </div>
                    <ProductSearch ref="productSearch" v-model="products" :show-quantity="true" :show-price="true" :show-price-type="true"
                        :is-sale="true" :isOrder="true" :currency-symbol="currencySymbol" :warehouse-id="warehouseId"
                        :project-id="projectId" v-model:discount="discount" v-model:discountType="discountType" required @product-removed="onProductRemoved" />
                </template>
            </div>
            <div v-show="currentTab === 'transactions'">
                <!-- ✅ Ленивая загрузка: компонент рендерится только после первого посещения вкладки -->
                <template v-if="transactionsTabVisited">
                    <OrderTransactionsTab v-if="editingItemId" :order-id="editingItemId" :client="selectedClient"
                        :project-id="projectId" :cash-id="cashId" :currency-symbol="currencySymbol"
                        @updated-paid="paidTotalAmount = $event" />
                    <div v-else class="p-4 text-gray-500">
                        {{ $t('saveOrderFirst') }}
                    </div>
                </template>
            </div>
        </div>
    </div>
    <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItemId" icon="fas fa-check" :onclick="saveWithoutClose" :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash">
            </PrimaryButton>
        </div>

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
        <ProjectCreatePage v-if="projectModalDialog" @saved="handleProjectSaved" @saved-error="handleProjectSavedError" />
    </SideModalDialog>
    <SideModalDialog :showForm="productCategoryModalDialog" :onclose="closeProductCategoryModal" :level="1">
        <CategoriesCreatePage v-if="productCategoryModalDialog" @saved="handleProductCategorySaved" @saved-error="handleProductCategorySavedError" />
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
import CategoriesController from '@/api/CategoriesController';
// import OrderAfController from '@/api/OrderAfController';
import OrderTransactionsTab from '@/views/pages/orders/OrderTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import CategoriesCreatePage from '@/views/pages/categories/CategoriesCreatePage.vue';


export default {
    mixins: [getApiErrorMessage, formChangesMixin],
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { ClientSearch, ProductSearch, PrimaryButton, AlertDialog, TabBar, OrderTransactionsTab, SideModalDialog, ProjectCreatePage, CategoriesCreatePage },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            currentTab: 'info',
            productsTabVisited: false, // ✅ Флаг для ленивой загрузки вкладки "Товары"
            transactionsTabVisited: false, // ✅ Флаг для ленивой загрузки вкладки "Транзакции"
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
            categoryId: this.editingItem?.categoryId || this.editingItem?.category_id || '',
            date: this.editingItem?.date ? this.editingItem.date.substring(0, 16) : new Date().toISOString().substring(0, 16),
            note: this.editingItem?.note || '',
            description: this.editingItem?.description || '',
            products: this.editingItem?.products || [],
            discount: this.editingItem ? this.editingItem.discount : 0,
            discountType: this.editingItem ? this.editingItem.discount_type : 'fixed',
            editingItemId: this.editingItem?.id || null,
            allWarehouses: [],
            allProjects: [],
            allProductCategories: [],
            allCashRegisters: [],
            currencies: [],
            statuses: [],
            saveLoading: false,
            deleteLoading: false,
            deleteDialog: false,
            paidTotalAmount: 0,
            projectModalDialog: false,
            productCategoryModalDialog: false,
            removedTempProducts: [],
            // additionalFields: [],
            // additionalFieldValues: {},
        };
    },
    async created() {
        // ✅ Загружаем данные один раз при создании компонента
        await Promise.all([
            this.fetchAllWarehouses(),
            this.fetchAllCashRegisters(),
            this.fetchAllProjects(),
            this.fetchAllProductCategories(),
            this.fetchCurrencies(),
            this.fetchOrderStatuses()
        ]);
        
        // Устанавливаем дефолтные значения для нового заказа
        if (!this.editingItem) {
            if (this.allWarehouses.length > 0 && !this.warehouseId) {
                this.warehouseId = this.allWarehouses[0].id;
            }
            if (this.allCashRegisters.length > 0 && !this.cashId) {
                this.cashId = this.allCashRegisters[0].id;
            }
        }
    },
    mounted() {
        this.$watch('editingItem', async (newItem, oldItem) => {
            if (newItem !== oldItem) {
                await this.handleEditingItemChange(newItem);
            }
        }, { immediate: true });
        
        if (this.editingItem) {
            this.handleEditingItemChange(this.editingItem);
        }
        
        // Сохраняем начальное состояние после полной инициализации формы
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
        getFormState() {
            const state = {
                selectedClient: this.selectedClient,
                date: this.date,
                cash_id: this.cashId,
                description: this.description,
                project_id: this.projectId,
                note: this.note,
                warehouse_id: this.warehouseId,
                category_id: this.categoryId,
                products: [...this.products],
                discount: this.discount,
                discount_type: this.discountType,
                status_id: this.statusId,
                currency_id: this.currencyId,
                // additional_fields: Object.keys(this.additionalFieldValues).map(fieldId => {
                //     const rawValue = this.additionalFieldValues[fieldId];
                //     let stringValue = '';
                //     
                //     if (rawValue === null || rawValue === undefined) {
                //         stringValue = '';
                //     } else if (typeof rawValue === 'boolean') {
                //         stringValue = rawValue ? 'true' : 'false';
                //     } else if (typeof rawValue === 'number') {
                //         stringValue = rawValue.toString();
                //     } else {
                //         stringValue = String(rawValue);
                //     }
                //     
                //     return {
                //         field_id: parseInt(fieldId),
                //         value: stringValue
                //     };
                // }).filter(field => field.value !== '' && field.value !== 'null' && field.value !== 'false')
            };
            return state;
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
      if (this.allProjects.length > 0) return; // Уже загружены
      
      await this.$store.dispatch('loadProjects');
      this.allProjects = this.$store.getters.projects;
    },
        async fetchAllProductCategories() {
            // ✅ Проверяем есть ли уже данные
            if (this.allProductCategories.length > 0) return;
            
            try {
                // Используем store для categories
                await this.$store.dispatch('loadCategories');
                const allCategories = this.$store.getters.categories;
                
                // Фильтруем только родительские
                this.allProductCategories = allCategories.filter(c => !c.parentId);
            } catch (error) {
                this.allProductCategories = [];
            }
        },
        // async fetchAllCategories() {
        //     try {
        //         this.allCategories = await OrderCategoryController.getAllItems();
        //     } catch (error) {
        //         this.allCategories = [];
        //     }
        // },
        async fetchCurrencies() {
            // Всегда загружаем данные заново
            await this.$store.dispatch('loadCurrencies');
            this.currencies = this.$store.getters.currencies;
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
        async fetchOrderStatuses() {
            // Используем данные из store
            await this.$store.dispatch('loadOrderStatuses');
            this.statuses = this.$store.getters.orderStatuses;
        },
        changeTab(tabName) {
            this.currentTab = tabName;
            
            // ✅ Устанавливаем флаги при первом посещении вкладки (ленивая загрузка)
            if (tabName === 'products' && !this.productsTabVisited) {
                this.productsTabVisited = true;
            }
            if (tabName === 'transactions' && !this.transactionsTabVisited) {
                this.transactionsTabVisited = true;
            }
        },
        // async loadAdditionalFields(categoryId, preserveValues = true) {
        //     try {
        //         if (!categoryId) {
        //             this.additionalFields = [];
        //             if (!preserveValues) {
        //                 this.additionalFieldValues = {};
        //             }
        //             return;
        //         }
        //         
        //         const response = await OrderController.getAdditionalFields(categoryId);
        //         
        //         let fields = [];
        //         if (response.fields && Array.isArray(response.fields)) {
        //             fields = response.fields;
        //         } else if (Array.isArray(response)) {
        //             fields = response;
        //         } else if (response.data && Array.isArray(response.data)) {
        //             fields = response.data;
        //         }
        //         
        //         this.additionalFields = fields;
        //         
        //         this.additionalFields.forEach(field => {
        //             let defaultValue = field.default_value || field.default || field.defaultValue || '';
        //             
        //             if (!this.additionalFieldValues.hasOwnProperty(field.id)) {
        //                 if (field.type === 'boolean') {
        //                     this.additionalFieldValues[field.id] = defaultValue === 'true' || defaultValue === true;
        //                 } else if (field.type === 'int' || field.type === 'number') {
        //                     this.additionalFieldValues[field.id] = defaultValue || '';
        //                 } else {
        //                     this.additionalFieldValues[field.id] = defaultValue || '';
        //                 }
        //             }
        //         });
        //     } catch (error) {
        //         this.additionalFields = [];
        //         if (!preserveValues) {
        //             this.additionalFieldValues = {};
        //         }
        //     }
        // },

        async save() {
            const validationErrors = [];
            if (!this.categoryId) {
                validationErrors.push('Поле "Категория" обязательно для заполнения');
            }
            if (!this.warehouseId) {
                validationErrors.push('Поле "Склад" обязательно для заполнения');
            }
            if (this.discount && !this.discountType) {
                validationErrors.push('Поле "Тип скидки" обязательно для заполнения, если указана скидка');
            }
            
            
            if (validationErrors.length > 0) {
                this.$emit('saved-error', validationErrors.join('\n'));
                return;
            }
            
            this.saveLoading = true;
            try {
                const formData = this.getFormState();
                // Добавляем недостающие поля
                formData.client_id = this.selectedClient?.id;
                formData.cash_id = this.cashId || null;
                formData.products = this.products
                    .filter(p => !p.isTempProduct)
                    .map(p => ({
                        product_id: p.productId,
                        quantity: p.quantity,
                        price: p.price
                    }));
                formData.temp_products = this.products
                    .filter(p => p.isTempProduct)
                    .map(p => ({
                        name: p.name || p.productName,
                        description: p.description || '',
                        quantity: p.quantity,
                        price: p.price,
                        unit_id: p.unitId || p.unit_id || null,
                    }));
                formData.remove_temp_products = this.removedTempProducts;
                let resp;
                if (this.editingItemId) {
                    resp = await OrderController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await OrderController.storeItem(formData);
                    this.editingItemId = resp?.id || null;
                }
                if (resp.message) {
                    this.$emit('saved');
                    this.resetFormChanges();
                    this.removedTempProducts = [];
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            }
            this.saveLoading = false;
        },

        async saveWithoutClose() {
            const validationErrors = [];
            
            if (!this.categoryId) {
                validationErrors.push('Поле "Категория" обязательно для заполнения');
            }
            if (!this.warehouseId) {
                validationErrors.push('Поле "Склад" обязательно для заполнения');
            }
            if (this.discount && !this.discountType) {
                validationErrors.push('Поле "Тип скидки" обязательно для заполнения, если указана скидка');
            }
            
            
            if (validationErrors.length > 0) {
                this.$emit('saved-error', validationErrors.join('\n'));
                return;
            }
            
            this.saveLoading = true;
            try {
                const formData = this.getFormState();
                // Добавляем недостающие поля
                formData.client_id = this.selectedClient?.id;
                formData.cash_id = this.cashId || null;
                formData.products = this.products
                    .filter(p => !p.isTempProduct)
                    .map(p => ({
                        product_id: p.productId,
                        quantity: p.quantity,
                        price: p.price
                    }));
                formData.temp_products = this.products
                    .filter(p => p.isTempProduct)
                    .map(p => ({
                        name: p.name || p.productName,
                        description: p.description || '',
                        quantity: p.quantity,
                        price: p.price,
                        unit_id: p.unitId || p.unit_id || null,
                    }));
                formData.remove_temp_products = this.removedTempProducts;
                
                let resp;
                if (this.editingItemId) {
                    resp = await OrderController.updateItem(this.editingItemId, formData);
                } else {
                    resp = await OrderController.storeItem(formData);
                    this.editingItemId = resp?.id || null;
                }
                
                if (resp.message) {
                    this.$emit('saved-silent');
                    this.resetFormChanges();
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
            this.categoryId = '';
            this.date = new Date().toISOString().substring(0, 16);
            this.note = '';
            this.description = ''
            this.products = [];
            this.editingItemId = null;
            this.statusId = 1;
            this.paidTotalAmount = 0;
            this.removedTempProducts = [];
            // Сбрасываем флаги ленивой загрузки для нового заказа
            this.productsTabVisited = false;
            this.transactionsTabVisited = false;
            // this.additionalFields = [];
            // this.additionalFieldValues = {};
            this.resetFormInitialization();
            this.resetFormChanges();
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
            this.fetchAllProjects();
            if (project && project.id) {
                this.projectId = project.id;
            }
            this.closeProjectModal();
        },
        handleProjectSavedError(error) {
        },
        showProductCategoryModal() {
            this.productCategoryModalDialog = true;
        },
        closeProductCategoryModal() {
            this.productCategoryModalDialog = false;
        },
        handleProductCategorySaved(category) {
            this.fetchAllProductCategories();
            if (category && category.id) {
                this.categoryId = category.id;
            }
            this.closeProductCategoryModal();
        },
        handleProductCategorySavedError(error) {
        },
        // showCategoryModal() {
        //     this.categoryModalDialog = true;
        // },
        // closeCategoryModal() {
        //     this.categoryModalDialog = false;
        // },
        // handleCategorySaved(category) {
        //     this.fetchAllCategories();
        //     if (category && category.id) {
        //         this.categoryId = category.id;
        //     }
        //     this.closeCategoryModal();
        // },
        // handleCategorySavedError(error) {
        // },
        // onCategoryChange(event) {
        //     if (this.categoryId) {
        //         const currentValues = { ...this.additionalFieldValues };
        //         
        //         this.loadAdditionalFields(this.categoryId, false);
        //         
        //         this.$nextTick(() => {
        //             Object.keys(currentValues).forEach(fieldId => {
        //                 if (this.additionalFieldValues.hasOwnProperty(fieldId)) {
        //                     this.additionalFieldValues[fieldId] = currentValues[fieldId];
        //                 }
        //             });
        //         });
        //     } else {
        //         this.additionalFields = [];
        //         this.additionalFieldValues = {};
        //     }
        // },
        generateTempProductId() {
            return Date.now() + Math.floor(Math.random() * 1000);
        },

        async handleEditingItemChange(newItem) {
            if (!newItem) {
                // this.additionalFieldValues = {};
                // this.additionalFields = [];
                return;
            }
            
            // const additionalFields = newItem?.additionalFields || newItem?.additional_fields;
            
            // if (additionalFields && additionalFields.length > 0) {
            //     additionalFields.forEach(field => {
            //         let value = field.value;
            //         
            //         if (typeof value === 'string') {
            //             if (value === 'true') value = true;
            //             else if (value === 'false') value = false;
            //             else if (value === 'null' || value === '') value = '';
            //             else if (!isNaN(value) && value !== '') value = value;
            //         }
            //         
            //         this.additionalFieldValues[field.field_id] = value;
            //     });
            // }
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
                    // ✅ Для существующего заказа сразу помечаем вкладки как посещенные
                    // чтобы компоненты загрузились (там уже есть данные)
                    if (newEditingItem.id) {
                        this.productsTabVisited = true;
                        this.transactionsTabVisited = true;
                    }
                    
                    this.selectedClient = newEditingItem.client || null;
                    this.projectId = newEditingItem.projectId || newEditingItem.project_id || '';
                    this.warehouseId = newEditingItem.warehouseId || (this.allWarehouses.length ? this.allWarehouses[0].id : '');
                    this.cashId = newEditingItem.cashId || (this.allCashRegisters.length ? this.allCashRegisters[0].id : '');
                    this.statusId = newEditingItem.statusId || '';
                    this.categoryId = newEditingItem.categoryId || newEditingItem.category_id || '';
                    this.date = newEditingItem.date || new Date().toISOString().substring(0, 16);
                    this.note = newEditingItem.note || '';
                    this.description = newEditingItem.description || '';
                    const rawProducts = newEditingItem.products || [];
                    this.products = rawProducts.map(p => {
                        const isTemp = p.isTempProduct || ((p.product_id == null) && (p.productId == null));
                        if (isTemp) {
                            return {
                                name: p.product_name || p.productName || p.name,
                                productName: p.product_name || p.productName || p.name,
                                description: p.description || '',
                                quantity: Number(p.quantity) || 0,
                                price: Number(p.price) || 0,
                                unitId: (p.unit_id ?? p.unitId) ?? null,
                                productId: p.productId || p.product_id || this.generateTempProductId(),
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
                    
                    // if (newEditingItem.categoryId || newEditingItem.category_id) {
                    //     this.loadAdditionalFields(newEditingItem.categoryId || newEditingItem.category_id);
                    // }
                    // if (newEditingItem.additional_fields && newEditingItem.additional_fields.length > 0) {
                    //     newEditingItem.additional_fields.forEach(field => {
                    //         this.additionalFieldValues[field.field_id] = field.value;
                    //     });
                    // }
                } else {
                    this.clearForm();
                }
                this.$nextTick(() => {
                    this.saveInitialState();
                });
            },
            deep: true,
            immediate: true
        },
        // Отслеживаем изменения в store
        '$store.state.warehouses'(newVal) {
            this.allWarehouses = newVal;
        },
        '$store.state.cashRegisters'(newVal) {
            this.allCashRegisters = newVal;
        },
        '$store.state.projects'(newVal) {
            this.allProjects = newVal;
        },
        '$store.state.currencies'(newVal) {
            this.currencies = newVal;
        },
        '$store.state.orderStatuses'(newVal) {
            this.statuses = newVal;
        },
        projectId(newProjectId) {
            // При выборе проекта переключаем все товары на оптовые цены
            if (newProjectId && this.products.length > 0) {
                this.products.forEach(product => {
                    if (product.wholesale_price !== undefined && product.wholesale_price > 0) {
                        product.price = product.wholesale_price;
                        product.priceType = 'wholesale';
                    }
                });
            } else if (!newProjectId && this.products.length > 0) {
                // При отмене выбора проекта возвращаем розничные цены
                this.products.forEach(product => {
                    if (product.retail_price !== undefined) {
                        product.price = product.retail_price;
                        product.priceType = 'retail';
                    }
                });
            }
        }
    }
}
</script>