<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
            <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
            <div>
                <div v-show="currentTab === 'info'">
                    <ClientSearch
                        v-model:selected-client="selectedClient"
                        :allow-deselect="true"
                        :balance-id="clientBalanceId"
                        @balance-changed="onBalanceChanged"
                    />
                    <div>
                        <label class="required">{{ $t('productCategory') }}</label>
                        <div class="flex items-center space-x-2">
                            <select v-model="categoryId" required>
                                <option value="">
                                    {{ $t('no') }}
                                </option>
                                <option v-for="category in allProductCategories" :key="category.id"
                                    :value="category.id">
                                    {{ category.name }}
                                </option>
                            </select>
                            <PrimaryButton icon="fas fa-add" :is-success="true" :onclick="showProductCategoryModal"
                                :disabled="!$store.getters.hasPermission('categories_create')"
                                :aria-label="$t('addCategory')" />
                        </div>
                    </div>
                    <div>
                        <label>{{ $t('date') }}</label>
                        <DatePickerField v-model="date" type="datetime" :editing-item-id="editingItemId"
                            :restrict-to-now="true" :clearable="false" class="w-full rounded" />
                    </div>
                    <div>
                        <label>{{ $t('description') }}</label>
                        <textarea v-model="description" class="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label>{{ $t('project') }}</label>
                        <select v-model="projectId">
                            <option value="">
                                {{ $t('no') }}
                            </option>
                            <option v-for="parent in allProjects" :key="parent.id" :value="parent.id">
                                {{ parent.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="required">{{ $t('cashRegister') }}</label>
                        <select v-model="cashId" required class="w-full border rounded p-2" :disabled="!!editingItemId"
                            :class="{ 'bg-gray-100 cursor-not-allowed': !!editingItemId }">
                            <option value="">
                                {{ $t('no') }}
                            </option>
                            <option v-for="c in cashRegistersForSelect" :key="c.id" :value="c.id">
                                {{ formatCashRegisterDisplay(c.displayName || c.name, c.currencySymbol) }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label>{{ $t('note') }}</label>
                        <input v-model="note" type="text">
                    </div>
                </div>
                <div v-show="currentTab === 'products'">
                    <template v-if="productsTabVisited">
                        <div>
                            <label class="required">{{ $t('warehouse') }}</label>
                            <select v-model="warehouseId" required>
                                <option value="">
                                    {{ $t('no') }}
                                </option>
                                <option v-for="parent in allWarehouses" :key="parent.id" :value="parent.id">
                                    {{ parent.name
                                    }}
                                </option>
                            </select>
                        </div>
                        <ProductSearch v-model="products" v-model:discount="discount"
                            :show-quantity="true" v-model:discount-type="discountType" :show-price="true"
                            :show-price-type="false" :is-sale="true" :currency-symbol="currencySymbol"
                            :document-currency-id="currencyId" :warehouse-id="warehouseId" :project-id="projectId"
                            :allow-temp-product="true" required @product-removed="onProductRemoved" />
                    </template>
                </div>
                <div v-show="currentTab === 'transactions' && editingItemId">
                    <template v-if="transactionsTabVisited">
                        <OrderTransactionsTab :order-id="editingItemId" :client="selectedClient" :project-id="projectId"
                            :cash-id="cashId" :currency-symbol="currencySymbol" :order-total="roundedTotalPrice"
                            :paid-total="paidTotalAmount" @updated-paid="paidTotalAmount = $event" />
                    </template>
                </div>
            </div>
        </div>

        <teleport v-bind="sideModalFooterTeleportBind">
            <div class="flex w-full flex-wrap items-center justify-between gap-4 md:flex-nowrap">
                <div class="flex flex-wrap items-center gap-2 space-x-2">
                    <PrimaryButton v-if="editingItemId" icon="fas fa-check" :onclick="saveWithoutClose"
                        :is-loading="saveLoading" :aria-label="$t('saveWithoutClose')" />
                    <PrimaryButton icon="fas fa-save" :onclick="save" :is-loading="saveLoading"
                        :aria-label="$t('save')" />
                    <PrimaryButton v-if="editingItemId" :onclick="showDeleteDialog" :is-danger="true"
                        :is-loading="deleteLoading" icon="fas fa-trash" :aria-label="$t('delete')" />
                </div>

                <div class="text-sm text-gray-700 flex flex-wrap md:flex-nowrap gap-x-4 gap-y-1 font-medium">
                    <div>
                        {{ $t('toPay') }}: <span class="font-bold">{{ formatCurrency(roundedTotalPrice, currencySymbol,
                            2,
                            true)
                        }}</span>
                    </div>
                    <div>
                        {{ $t('paid') }}: <span class="font-bold">{{ formatCurrency(paidTotalAmount, currencySymbol, 2,
                            true)
                            }}</span>
                    </div>
                    <div>
                        {{ $t('total') }}: <span class="font-bold" :class="remainingAmountClass">{{
                            formatCurrency(remainingAmount,
                                currencySymbol, 2, true) }}</span>
                    </div>
                </div>
            </div>
        </teleport>

        <AlertDialog :dialog="deleteDialog" :descr="$t('confirmDelete')" :confirm-text="$t('delete')"
            :leave-text="$t('cancel')" @confirm="deleteItem" @leave="closeDeleteDialog" />
        <AlertDialog :dialog="closeConfirmDialog" :descr="$t('unsavedChanges')" :confirm-text="$t('closeWithoutSaving')"
            :leave-text="$t('stay')" @confirm="confirmClose" @leave="cancelClose" />
        <SideModalDialog :show-form="productCategoryModalDialog" :title="nestedProductCategoryModalTitle"
            :onclose="closeProductCategoryModal" :level="4">
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
import AppController from '@/api/AppController';
import OrderProductDto from '@/dto/order/OrderProductDto';
import TabBar from '@/views/components/app/forms/TabBar.vue';
import OrderTransactionsTab from '@/views/pages/orders/OrderTransactionsTab.vue';
import getApiErrorMessage from '@/mixins/getApiErrorMessageMixin';
import SideModalDialog, { sideModalCrudTitle, sideModalFooterPortal } from '@/views/components/app/dialog/SideModalDialog.vue';
import CategoriesCreatePage from '@/views/pages/categories/CategoriesCreatePage.vue';
import { formatCurrency, roundValue } from '@/utils/numberUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';
import { dateFormMixin } from '@/utils/dateUtils';
import crudFormMixin from '@/mixins/crudFormMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import DatePickerField from '@/views/components/app/forms/DatePickerField.vue';
import { filterCashRegistersByClientBalance } from '@/utils/clientBalanceCashUtils';

export default {
    components: {
        ClientSearch,
        ProductSearch,
        PrimaryButton,
        AlertDialog,
        TabBar,
        OrderTransactionsTab,
        SideModalDialog,
        CategoriesCreatePage,
        DatePickerField,
    },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal],
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', 'close-request'],
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
            projectId: this.editingItem?.projectId,
            cashId: this.editingItem ? this.editingItem.cashId : '',
            currencyId: this.editingItem?.currencyId || null,
            warehouseId: this.editingItem?.warehouseId,
            statusId: this.editingItem?.statusId || 1,
            categoryId: this.editingItem?.categoryId,
            date: this.editingItem?.date ? this.getFormattedDate(this.editingItem.date) : this.getCurrentLocalDateTime(),
            note: this.editingItem?.note,
            description: this.editingItem?.description,
            products: this.editingItem?.products || [],
            discount: this.editingItem ? this.editingItem.discount : 0,
            discountType: this.editingItem ? this.editingItem.discountType : 'fixed',
            allWarehouses: [],
            allProjects: [],
            allProductCategories: [],
            allCashRegisters: [],
            currencies: [],
            clientBalanceId: this.editingItem?.clientBalanceId ?? this.editingItem?.client_balance_id ?? null,
            paidTotalAmount: 0,
            productCategoryModalDialog: false,
            removedTempProducts: [],
        };
    },
    computed: {
        currencySymbol() {
            return this.currencies.find(c => c.id === this.currencyId)?.symbol;
        },
        clientBalances() {
            return this.selectedClient?.balances ?? [];
        },
        selectedBalanceRecord() {
            if (!this.clientBalanceId || !this.clientBalances.length) {
                return null;
            }
            return this.clientBalances.find((b) => Number(b.id) === Number(this.clientBalanceId)) ?? null;
        },
        balanceLocksCurrencyCash() {
            return Boolean(this.selectedClient?.id && this.clientBalanceId && this.selectedBalanceRecord);
        },
        cashRegistersForSelect() {
            if (!this.balanceLocksCurrencyCash || !this.selectedBalanceRecord) {
                return this.allCashRegisters;
            }
            return filterCashRegistersByClientBalance(this.selectedBalanceRecord, this.allCashRegisters);
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
            if (this.discountType === 'percent') {
                return this.subtotal * disc / 100;
            }
            return Math.min(disc, this.subtotal);
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
            const availableTabs = this.editingItemId
                ? this.tabs
                : this.tabs.filter(tab => tab.name !== 'transactions');

            return availableTabs.map(tab => ({
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
        },
        nestedProductCategoryModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenCategory',
                entityNominativeKey: 'sideModalNomCategory',
            });
        },
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
                if (this.balanceLocksCurrencyCash) {
                    return;
                }
                if (!newCashId || !this.allCashRegisters?.length) return;
                const selectedCash = this.allCashRegisters.find(c => c.id == newCashId);
                if (selectedCash?.currencyId) {
                    this.currencyId = selectedCash.currencyId;
                }
            },
            immediate: true
        },
        currencyId: {
            async handler(newId, oldId) {
                if (this.editingItemId || !newId || !oldId || Number(newId) === Number(oldId)) {
                    return;
                }
                if (!this.products?.length && !(this.discountType === 'fixed' && Number(this.discount) > 0)) {
                    return;
                }
                const mult = await this.orderCurrencyMultiplier(oldId, newId);
                const scale = (v) => {
                    const n = Number(v);
                    return v != null && v !== '' && Number.isFinite(n) ? roundValue(n * mult) : v;
                };
                for (const p of this.products) {
                    p.price = scale(p.price);
                    if (p.retailPrice != null) {
                        p.retailPrice = scale(p.retailPrice);
                    }
                    if (p.wholesalePrice != null) {
                        p.wholesalePrice = scale(p.wholesalePrice);
                    }
                }
                if (this.discountType === 'fixed' && Number(this.discount) > 0) {
                    this.discount = scale(this.discount);
                }
            },
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
                if (newCashRegisters?.length && this.clientBalanceId && this.balanceLocksCurrencyCash) {
                    this.applyBalanceDefaults(this.clientBalanceId);
                }
                if (
                    this.editingItem &&
                    this.cashId &&
                    !this.currencyId &&
                    newCashRegisters?.length
                ) {
                    const selectedCash = newCashRegisters.find(c => c.id == this.cashId);
                    if (selectedCash?.currencyId) {
                        this.currencyId = selectedCash.currencyId;
                    } else {
                        const defaultCurrency = (this.currencies || []).find(c => c.isDefault);
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
        },
    },
    async created() {
        await Promise.all([
            this.fetchAllWarehouses(),
            this.fetchAllCashRegisters(),
            this.fetchAllProjects(),
            this.fetchAllProductCategories(),
            this.fetchCurrencies(),
        ]);

        if (!this.editingItem) {
            if (!this.warehouseId && this.allWarehouses?.length) {
                this.warehouseId = this.allWarehouses[0].id;
            }
            if (!this.currencyId) {
                const defaultCurrency = this.currencies?.find((c) => c.isDefault);
                if (defaultCurrency) {
                    this.currencyId = defaultCurrency.id;
                }
            }
        }
        await this.$nextTick();
        this.saveInitialState();
    },
    methods: {
        formatCurrency,
        formatCashRegisterDisplay,
        firstCashIdMatchingCurrency(currencyId) {
            if (currencyId == null || currencyId === '' || !this.allCashRegisters?.length) {
                return '';
            }
            const row = this.allCashRegisters.find((c) => Number(c.currencyId) === Number(currencyId));
            return row != null ? row.id : '';
        },
        async orderCurrencyMultiplier(fromId, toId) {
            if (fromId == null || toId == null || Number(fromId) === Number(toId)) {
                return 1;
            }
            const def = this.currencies.find((c) => c.isDefault);
            if (!def) {
                return 1;
            }
            const has = (id) => this.currencies.some((c) => Number(c.id) === Number(id));
            if (!has(fromId) || !has(toId)) {
                return 1;
            }
            try {
                const [a, b] = await Promise.all([
                    AppController.getCurrencyExchangeRate(fromId),
                    AppController.getCurrencyExchangeRate(toId),
                ]);
                const fr = parseFloat(a?.exchangeRate);
                const tr = parseFloat(b?.exchangeRate);
                if (!fr || !tr || fr <= 0 || tr <= 0) {
                    return 1;
                }
                const fi = Number(fromId);
                const ti = Number(toId);
                const di = Number(def.id);
                if (fi === di) {
                    return 1 / tr;
                }
                if (ti === di) {
                    return fr;
                }
                return fr / tr;
            } catch {
                return 1;
            }
        },
        getFormState() {
            const state = {
                selectedClient: this.selectedClient,
                date: this.date,
                cashId: this.cashId,
                description: this.description,
                projectId: this.projectId,
                note: this.note,
                warehouseId: this.warehouseId,
                categoryId: this.categoryId,
                products: [...this.products],
                discount: this.discount,
                discountType: this.discountType,
                statusId: this.statusId,
                currencyId: this.currencyId,
                clientBalanceId: this.clientBalanceId,
            };
            return state;
        },
        applyBalanceDefaults(balanceId) {
            const row = this.clientBalances.find((b) => Number(b.id) === Number(balanceId));
            if (!row) {
                return;
            }
            const curId = row.currencyId ?? row.currency?.id;
            if (curId != null) {
                this.currencyId = curId;
            }
            const list = filterCashRegistersByClientBalance(row, this.allCashRegisters);
            const currentOk = list.some((c) => Number(c.id) === Number(this.cashId));
            if (!currentOk && list.length) {
                this.cashId = list[0].id;
            }
        },
        onBalanceChanged(balanceId) {
            this.clientBalanceId = balanceId ?? null;
            if (balanceId) {
                this.applyBalanceDefaults(balanceId);
            }
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
        changeTab(tabName) {
            if (tabName === 'transactions' && !this.editingItemId) {
                return;
            }

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
            const docLinePrice = OrderProductDto.documentUnitPriceFromSavedLine(p);
            if (isTemp) {
                return {
                    orderProductId: p.id || null,
                    name: p.productName || p.name,
                    productName: p.productName || p.name,
                    description: p.description,
                    quantity: Number(p.quantity) || 0,
                    price: docLinePrice,
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
                price: docLinePrice,
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
            formData.clientId = this.selectedClient?.id || null;
            formData.cashId = this.cashId || null;
            formData.products = this.products
                .filter(p => !p.isTempProduct)
                .map(p => ({
                    id: p.orderProductId || null,
                    productId: p.productId,
                    quantity: p.quantity,
                    price: p.price,
                    width: p.width ?? null,
                    height: p.height ?? null
                }));
            formData.tempProducts = this.products
                .filter(p => p.isTempProduct)
                .map(p => ({
                    id: p.orderProductId || null,
                    name: p.name || p.productName,
                    description: p.description,
                    quantity: p.quantity,
                    price: p.price,
                    unitId: p.unitId || null,
                    width: p.width ?? null,
                    height: p.height ?? null
                }));
            formData.removeTempProducts = this.removedTempProducts;
            return formData;
        },
        prepareSave() {
            return this.prepareFormData();
        },
        async performSave(data) {
            const resp = this.editingItemId
                ? await OrderController.updateItem(this.editingItemId, data)
                : await OrderController.storeItem(data);

            if (!this.editingItemId && resp?.item?.id) {
                this.editingItemId = resp.item.id;
            }

            if (resp.message) {
                await this.refreshSelectedClientData();
                this.resetFormChanges();
                this.removedTempProducts = [];
                return resp;
            }
        },
        async performSaveInternal(silent = false) {
            this.saveLoading = true;
            try {
                const resp = await this.performSave(this.prepareSave());
                if (resp?.message) {
                    this.$emit(silent ? 'saved-silent' : 'saved');
                }
            } catch (error) {
                this.emitSavedError(error);
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
                await this.performSave(this.prepareSave());
            } finally {
                this.saveLoading = false;
            }
        },

        async performDelete() {
            const resp = await OrderController.deleteItem(this.editingItemId);
            if (resp.message) {
                return resp;
            }
            throw new Error('Failed to delete');
        },
        async deleteItem() {
            this.closeDeleteDialog();
            if (!this.editingItemId) return;
            this.deleteLoading = true;
            try {
                await this.performDelete();
                this.$emit('deleted');
                this.clearForm();
            } catch (error) {
                this.emitDeletedError(error);
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
            this.clientBalanceId = null;
            this.projectId = '';
            this.cashId = '';
            this.currencyId = this.currencies?.find((x) => x.isDefault)?.id ?? null;
            this.warehouseId = this.allWarehouses[0]?.id;
            this.categoryId = '';
            this.date = this.getCurrentLocalDateTime();
            this.note = '';
            this.description = '';
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
                }

                this.clientBalanceId = newEditingItem.clientBalanceId ?? newEditingItem.client_balance_id ?? null;
                this.selectedClient = newEditingItem.client || null;
                this.projectId = newEditingItem.projectId;
                this.warehouseId = newEditingItem.warehouseId || this.allWarehouses?.[0]?.id;
                this.statusId = newEditingItem.statusId;
                this.categoryId = newEditingItem.categoryId;
                this.date = newEditingItem.date ? this.getFormattedDate(newEditingItem.date) : this.getCurrentLocalDateTime();
                this.note = newEditingItem.note;
                this.description = newEditingItem.description;
                const rawProducts = newEditingItem.products || [];
                this.products = rawProducts.map(p => this.mapProductFromEditingItem(p));
                this.discount = newEditingItem.discount || 0;
                this.discountType = newEditingItem.discountType || 'fixed';
                this.currencyId = newEditingItem.currencyId || null;
                const savedCashId = newEditingItem.cashId;
                if (savedCashId != null && savedCashId !== '') {
                    this.cashId = savedCashId;
                } else {
                    this.cashId = this.firstCashIdMatchingCurrency(this.currencyId);
                }
                this.paidTotalAmount = Number(newEditingItem.paidAmount ?? newEditingItem.paid_amount ?? 0);
                this.$nextTick(() => {
                    if (this.clientBalanceId) {
                        this.applyBalanceDefaults(this.clientBalanceId);
                    }
                });
            } else {
                if (!this.editingItemId) {
                    this.clearForm();
                }
            }
        }
    }
}
</script>