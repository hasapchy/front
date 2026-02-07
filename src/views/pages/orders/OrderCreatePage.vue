<template>
    <div class="flex flex-col h-full">
        <div class="flex flex-col overflow-auto h-full p-4 pb-24">
            <h2 class="text-lg font-bold mb-4">{{ editingItem ? $t('editOrder') : $t('createOrder') }}</h2>
            <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
            <div>
            <div v-show="currentTab === 'info'">
                <ClientSearch v-model:selectedClient="selectedClient" :allowDeselect="true" />
                <div>
                    <label class="required">{{ $t('productCategory') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="categoryId" required>
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="category in allProductCategories" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showProductCategoryModal"
                            :disabled="!$store.getters.hasPermission('categories_create')" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('date') }}</label>
                    <input type="datetime-local" v-model="date"
                        :disabled="editingItemId && !canEditDate()"
                        :min="this.getMinDate()" />
                </div>
                <div>
                    <label>{{ $t('description') }}</label>
                    <textarea v-model="description" class="w-full border rounded p-2"></textarea>
                </div>
                <div>
                    <label>{{ $t('project') }}</label>
                    <div class="flex items-center space-x-2">
                        <select v-model="projectId">
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">{{ parent.name }}
                            </option>
                        </select>
                        <PrimaryButton icon="fas fa-add" :is-info="true" :onclick="showProjectModal"
                            :disabled="!$store.getters.hasPermission('projects_create')" />
                    </div>
                </div>
                <div>
                    <label>{{ $t('note') }}</label>
                    <input type="text" v-model="note">
                </div>
            </div>
            <div v-show="currentTab === 'products'">
                <template v-if="productsTabVisited">
                    <div>
                        <label class="required">{{ $t('warehouse') }}</label>
                        <select v-model="warehouseId" required>
                            <option value="">{{ $t('no') }}</option>
                            <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">{{ parent.name
                                }}
                            </option>
                        </select>
                    </div>
                    <ProductSearch ref="productSearch" v-model="products" :show-quantity="true" :show-price="true"
                        :show-price-type="false" :is-sale="true" :currency-symbol="currencySymbol"
                        :warehouse-id="warehouseId" :project-id="projectId" :allow-temp-product="true"
                        v-model:discount="discount" v-model:discountType="discountType" required
                        @product-removed="onProductRemoved" />
                </template>
            </div>
            <div v-show="currentTab === 'transactions'">
                <template v-if="transactionsTabVisited">
                    <OrderTransactionsTab v-if="editingItemId" :order-id="editingItemId" :client="selectedClient"
                        :project-id="projectId" :cash-id="cashId" :currency-symbol="currencySymbol"
                        :order-total="roundedTotalPrice" :paid-total="paidTotalAmount"
                        @updated-paid="paidTotalAmount = $event" />
                    <div v-else class="p-4 text-gray-500">
                        {{ $t('saveOrderFirst') }}
                    </div>
                </template>
            </div>
        </div>
        </div>
        
        <div class="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap border-t border-gray-200 z-10">
        <div class="flex items-center space-x-2">
            <PrimaryButton v-if="editingItemId" icon="fas fa-check" :onclick="saveWithoutClose"
                :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading">
            </PrimaryButton>
            <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                :is-loading="deleteLoading" icon="fas fa-trash">
            </PrimaryButton>
        </div>

        <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
            <div>{{ $t('toPay') }}: <span class="font-bold">{{ formatCurrency(roundedTotalPrice, currencySymbol, 2,
                    true)
                    }}</span></div>
            <div>{{ $t('paid') }}: <span class="font-bold">{{ formatCurrency(paidTotalAmount, currencySymbol, 2, true)
                    }}</span></div>
            <div>{{ $t('total') }}: <span class="font-bold" :class="remainingAmountClass">{{
                formatCurrency(remainingAmount,
                    currencySymbol, 2, true) }}</span></div>
        </div>
    </div>

    <AlertDialog :dialog="deleteDialog" @confirm="deleteItem" @leave="closeDeleteDialog" :descr="$t('confirmDelete')"
        :confirm-text="$t('delete')" :leave-text="$t('cancel')" />
    <AlertDialog :dialog="closeConfirmDialog" @confirm="confirmClose" @leave="cancelClose" :descr="$t('unsavedChanges')"
        :confirm-text="$t('closeWithoutSaving')" :leave-text="$t('stay')" />
    <SideModalDialog :showForm="projectModalDialog" :onclose="closeProjectModal" :level="1">
        <ProjectCreatePage v-if="projectModalDialog" @saved="handleProjectSaved" />
    </SideModalDialog>
    <SideModalDialog :showForm="productCategoryModalDialog" :onclose="closeProductCategoryModal" :level="1">
        <CategoriesCreatePage v-if="productCategoryModalDialog" @saved="handleProductCategorySaved" />
    </SideModalDialog>
    </div>
</template>

<script>
import ClientSearch from '@/views/components/app/search/ClientSearch.vue';
import ProductSearch from '@/views/components/app/search/ProductSearch.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import AlertDialog from '@/views/components/app/dialog/AlertDialog.vue';
import OrderController from '@/api/OrderController';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import OrderTransactionsTab from '@/views/pages/orders/OrderTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import formChangesMixin from "@/mixins/formChangesMixin";
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import ProjectCreatePage from '@/views/pages/projects/ProjectCreatePage.vue';
import CategoriesCreatePage from '@/views/pages/categories/CategoriesCreatePage.vue';
import { formatCurrency, roundValue } from '@/utils/numberUtils';
import dateFormMixin from '@/mixins/dateFormMixin';
import crudFormMixin from '@/mixins/crudFormMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';


export default {
    mixins: [getApiErrorMessage, formChangesMixin, crudFormMixin, dateFormMixin, storeDataLoaderMixin],
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', "close-request"],
    components: { ClientSearch, ProductSearch, PrimaryButton, AlertDialog, TabBar, OrderTransactionsTab, SideModalDialog, ProjectCreatePage, CategoriesCreatePage },
    props: {
        editingItem: { type: Object, default: null }
    },
    data() {
        return {
            currentTab: 'info',
            productsTabVisited: false,
            transactionsTabVisited: false,
            tabs: [
                { name: 'info', label: 'info' },
                { name: 'products', label: 'products' },
                { name: 'transactions', label: 'transactions' }
            ],
            selectedClient: this.editingItem?.client || null,
            projectId: this.editingItem?.projectId || '',
            cashId: this.editingItem ? this.editingItem.cashId : '',
            currencyId: this.editingItem?.currencyId || null,
            warehouseId: this.editingItem?.warehouseId || '',
            statusId: this.editingItem?.statusId || 1,
            categoryId: this.editingItem?.categoryId || '',
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
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
        };
    },
    async created() {
        await Promise.all([
            this.fetchAllWarehouses(),
            this.fetchAllCashRegisters(),
            this.fetchAllProjects(),
            this.fetchAllProductCategories(),
            this.fetchCurrencies(),
            this.fetchOrderStatuses()
        ]);

        if (!this.editingItem) {
            if (!this.warehouseId && this.allWarehouses?.length) {
                this.warehouseId = this.allWarehouses[0].id;
            }
            if (!this.cashId && this.allCashRegisters?.length) {
                this.cashId = this.allCashRegisters[0].id;
            }
            const defaultCurrency = this.currencies?.find((c) => c.isDefault);
            if (!this.currencyId && defaultCurrency) {
                this.currencyId = defaultCurrency.id;
            }
        }
    },
    mounted() {
        this.$nextTick(() => {
            this.saveInitialState();
        });
    },
    computed: {
        currencySymbol() {
            return this.currencies.find(c => c.id === this.currencyId)?.symbol || '';
        },
        subtotal() {
            const rawSubtotal = this.products.reduce((sum, p) => {
                const price = parseFloat(p.price) || 0;
                const qty = parseFloat(p.quantity) || 0;
                return sum + price * qty;
            }, 0);
            return rawSubtotal;
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            let amount = 0;
            if (this.discountType === 'percent') {
                amount = this.subtotal * disc / 100;
            } else {
                amount = Math.min(disc, this.subtotal);
            }
            return amount;
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        roundedTotalPrice() {
            return roundValue(this.totalPrice);
        },
        remainingAmount() {
            return roundValue(this.roundedTotalPrice - this.paidTotalAmount);
        },
        translatedTabs() {
            return this.tabs.map(tab => ({
                ...tab,
                label: this.$t(tab.label)
            }));
        },
        remainingAmountClass() {
            const remaining = this.remainingAmount;
            if (remaining > 0) {
                return 'text-red-500';
            } else if (remaining < 0) {
                return 'text-green-500';
            } else {
                return 'text-gray-700';
            }
        }
    },
    methods: {
        formatCurrency,
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
            };
            return state;
        },
        async fetchAllWarehouses() {
            await this.loadStoreData({
                getterName: 'warehouses',
                dispatchName: 'loadWarehouses',
                localProperty: 'allWarehouses',
                defaultValue: []
            });
        },
        async fetchAllProjects() {
            if (this.allProjects?.length) return;

            await this.loadStoreData({
                getterName: 'projects',
                dispatchName: 'loadProjects',
                onLoaded: (allProjectsFromStore) => {
                    if (this.editingItem?.projectId && this.editingItem?.projectName) {
                        const hasProject = allProjectsFromStore.some(p => p.id === this.editingItem.projectId);
                        if (!hasProject) {
                            this.allProjects = [
                                ...allProjectsFromStore,
                                { id: this.editingItem.projectId, name: this.editingItem.projectName }
                            ];
                            return;
                        }
                    }
                    this.allProjects = allProjectsFromStore;
                }
            });
        },
        async fetchAllProductCategories() {
            await this.loadStoreData({
                getterName: 'categories',
                dispatchName: 'loadCategories',
                localProperty: 'allProductCategories',
                transform: (categories) => categories.filter(c => !c.parentId),
                defaultValue: []
            });
        },
        async fetchCurrencies() {
            await this.loadStoreData({
                getterName: 'currencies',
                dispatchName: 'loadCurrencies',
                localProperty: 'currencies'
            });
        },
        async fetchAllCashRegisters() {
            await this.loadStoreData({
                getterName: 'cashRegisters',
                dispatchName: 'loadCashRegisters',
                localProperty: 'allCashRegisters',
                defaultValue: []
            });
        },
        async fetchOrderStatuses() {
            await this.loadStoreData({
                getterName: 'orderStatuses',
                dispatchName: 'loadOrderStatuses',
                localProperty: 'statuses',
                transform: (statuses) => statuses.filter(status => status.isActive !== false),
                defaultValue: []
            });
        },
        changeTab(tabName) {
            this.currentTab = tabName;

            if (tabName === 'products' && !this.productsTabVisited) {
                this.productsTabVisited = true;
            }
            if (tabName === 'transactions' && !this.transactionsTabVisited) {
                this.transactionsTabVisited = true;
            }
        },
        mapProductFromEditingItem(p) {
            const isTemp = p.isTempProduct || (p.productId == null);
            if (isTemp) {
                return {
                    orderProductId: p.id || null,
                    name: p.productName || p.name,
                    productName: p.productName || p.name,
                    description: p.description || '',
                    quantity: Number(p.quantity) || 0,
                    price: Number(p.price) || 0,
                    unitId: p.unitId ?? null,
                    width: p.width ?? null,
                    height: p.height ?? null,
                    productId: p.productId || this.generateTempProductId(),
                    isTempProduct: true,
                    icons() { return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>'; },
                };
            }
            return {
                orderProductId: p.id || null,
                productId: p.productId,
                productName: p.productName || p.name,
                name: p.productName || p.name,
                quantity: Number(p.quantity) || 0,
                price: Number(p.price) || 0,
                unitId: p.unitId ?? null,
                width: p.width ?? null,
                height: p.height ?? null,
                icons() {
                    const isProduct = p.product_type == 1 || p.type == 1;
                    return isProduct
                        ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
                        : '<i class="fas fa-concierge-bell text-[#EAB308]" title="Услуга"></i>';
                }
            };
        },
        prepareFormData() {
            const formData = this.getFormState();
            formData.client_id = this.selectedClient?.id || null;
            formData.cash_id = this.cashId || null;
            formData.products = this.products
                .filter(p => !p.isTempProduct)
                .map(p => ({
                    id: p.orderProductId || null,
                    product_id: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                    width: p.width ?? null,
                    height: p.height ?? null
                }));
            formData.temp_products = this.products
                .filter(p => p.isTempProduct)
                .map(p => ({
                    id: p.orderProductId || null,
                    name: p.name || p.productName,
                    description: p.description || '',
                    quantity: p.quantity,
                    price: p.price,
                    unit_id: p.unitId || null,
                    width: p.width ?? null,
                    height: p.height ?? null
                }));
            formData.remove_temp_products = this.removedTempProducts;
            return formData;
        },
        // Методы для crudFormMixin
        prepareSave() {
            return this.prepareFormData();
        },
        async performSave(data) {
            try {
                const resp = this.editingItemId
                    ? await OrderController.updateItem(this.editingItemId, data)
                    : await OrderController.storeItem(data);
                
                if (!this.editingItemId && resp?.id) {
                    this.editingItemId = resp.id;
                }
                
                if (resp.message) {
                    await this.refreshSelectedClientData();
                    this.resetFormChanges();
                    this.removedTempProducts = [];
                    return resp;
                }
            } catch (error) {
                throw error;
            }
        },
        async performSaveInternal(silent = false) {
            this.saveLoading = true;
            try {
                const formData = this.prepareFormData();
                const resp = this.editingItemId
                    ? await OrderController.updateItem(this.editingItemId, formData)
                    : await OrderController.storeItem(formData);
                
                if (!this.editingItemId && resp?.id) {
                    this.editingItemId = resp.id;
                }
                
                if (resp.message) {
                    await this.refreshSelectedClientData();
                    this.$emit(silent ? 'saved-silent' : 'saved');
                    this.resetFormChanges();
                    this.removedTempProducts = [];
                }
            } catch (error) {
                this.$emit('saved-error', this.getApiErrorMessage(error));
            } finally {
                this.saveLoading = false;
            }
        },
        async save() {
            await this.performSaveInternal(false);
        },
        async saveWithoutClose() {
            this.saveLoading = true;
            try {
                const formData = this.prepareFormData();
                await this.performSave(formData);
            } finally {
                this.saveLoading = false;
            }
        },

        // Метод для crudFormMixin
        async performDelete() {
            const resp = await OrderController.deleteItem(this.editingItemId);
            if (resp.message) {
                return resp;
            }
            throw new Error('Failed to delete');
        },
        async deleteItem() {
            // Используем метод из crudFormMixin
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await this.performDelete();
                this.$emit('deleted');
                this.clearForm();
            } catch (error) {
                this.$emit('deleted-error', this.getApiErrorMessage(error));
            }
            this.deleteLoading = false;
        },
        onProductRemoved(productData) {
            if (productData.wasTempProduct && productData.orderProductId) {
                if (!this.removedTempProducts.includes(productData.orderProductId)) {
                    this.removedTempProducts.push(productData.orderProductId);
                }
            }
        },
        clearForm() {
            this.selectedClient = null;
            this.projectId = '';
            this.warehouseId = this.allWarehouses[0]?.id || '';
            this.statusId = '';
            this.categoryId = '';
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.description = ''
            this.products = [];
            this.editingItemId = null;
            this.statusId = 1;
            this.paidTotalAmount = 0;
            this.removedTempProducts = [];
            this.productsTabVisited = false;
            this.transactionsTabVisited = false;
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
        showProductCategoryModal() {
            this.productCategoryModalDialog = true;
        },
        closeProductCategoryModal() {
            this.productCategoryModalDialog = false;
        },
        handleProductCategorySaved(category) {
            this.$store.commit('SET_CATEGORIES', []);
            this.fetchAllProductCategories();
            if (category && category.id) {
                this.categoryId = category.id;
            }
            this.closeProductCategoryModal();
        },
        generateTempProductId() {
            return Date.now() + Math.floor(Math.random() * 1000);
        },

        async refreshSelectedClientData() {
            const clientId = this.selectedClient?.id;
            if (!clientId) {
                return;
            }
            this.$store.commit('SET_CLIENTS', []);
            this.$store.commit('SET_CLIENTS_DATA', []);
            await this.$store.dispatch('loadClients');
            const updatedClient = this.$store.getters.clients.find(c => c.id === clientId);
            if (updatedClient) {
                this.selectedClient = updatedClient;
            }
        },
        onEditingItemChanged(newEditingItem) {
            if (newEditingItem) {
                if (newEditingItem.id) {
                    this.productsTabVisited = true;
                    this.transactionsTabVisited = true;
                }

                this.selectedClient = newEditingItem.client || null;
                this.projectId = newEditingItem.projectId || '';
                this.warehouseId = newEditingItem.warehouseId || this.allWarehouses?.[0]?.id || '';
                this.cashId = newEditingItem.cashId || this.allCashRegisters?.[0]?.id || '';
                this.statusId = newEditingItem.statusId || '';
                this.categoryId = newEditingItem.categoryId || '';
                this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
                this.note = newEditingItem.note || '';
                this.description = newEditingItem.description || '';
                const rawProducts = newEditingItem.products || [];
                this.products = rawProducts.map(p => this.mapProductFromEditingItem(p));
                this.discount = newEditingItem.discount || 0;
                this.discountType = newEditingItem.discount_type || 'fixed';
                this.currencyId = newEditingItem.currencyId || null;
                this.editingItemId = newEditingItem.id || null;
            } else {
                // Сброс формы, если editingItem стал null
                if (!this.editingItemId) {
                    this.clearForm();
                }
            }
        }
    },
    watch: {
        editingItem: {
            handler(newEditingItem) {
                this.onEditingItemChanged(newEditingItem);
            },
            immediate: true,
            deep: true
        },
        cashId: {
            handler(newCashId) {
                if (!newCashId || !this.allCashRegisters?.length) return;
                const selectedCash = this.allCashRegisters.find(c => c.id == newCashId);
                if (selectedCash?.currency_id) {
                    this.currencyId = selectedCash.currency_id;
                }
            },
            immediate: true
        },
        projectId: {
            handler(newProjectId) {
                if (!this.products?.length) return;
                
                if (newProjectId) {
                    this.products.forEach(product => {
                        if (product.wholesalePrice > 0) {
                            product.price = product.wholesalePrice;
                            product.priceType = 'wholesale';
                        }
                    });
                } else {
                    this.products.forEach(product => {
                        if (product.retailPrice != null) {
                            product.price = product.retailPrice;
                            product.priceType = 'retail';
                        }
                    });
                }
            },
            immediate: false
        },
        allCashRegisters: {
            handler(newCashRegisters) {
                if (
                    this.editingItem &&
                    this.cashId &&
                    !this.currencyId &&
                    newCashRegisters?.length
                ) {
                    const selectedCash = newCashRegisters.find(c => c.id == this.cashId);
                    if (selectedCash?.currency_id) {
                        this.currencyId = selectedCash.currency_id;
                    } else {
                        const defaultCurrency = (this.currencies || []).find(c => c.isDefault || c.is_default);
                        if (defaultCurrency) {
                            this.currencyId = defaultCurrency.id;
                        }
                    }
                }
            },
            immediate: true
        },
        allWarehouses: {
            handler(newWarehouses) {
                if (newWarehouses?.length && !this.warehouseId && !this.editingItem) {
                    this.warehouseId = newWarehouses[0].id;
                }
            },
            immediate: true
        },
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
        '$store.state.clients': {
            handler(newClients) {
                if (this.selectedClient?.id && newClients?.length) {
                    const updated = newClients.find(c => c.id === this.selectedClient.id);
                    if (updated) {
                        this.selectedClient = updated;
                    }
                }
            },
            immediate: true,
            deep: true
        }
    }
}
</script>