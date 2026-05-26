<template>
    <div class="flex h-full min-h-0 flex-col">
        <div class="flex min-h-0 flex-1 flex-col overflow-auto p-4">
            <TabBar :tabs="translatedTabs" :active-tab="currentTab" :tab-click="(t) => { changeTab(t) }" />
            <div>
                <div v-show="currentTab === 'info'">
                    <ClientSearch :selected-client="selectedClient" @update:selectedClient="selectedClient = $event" :allow-deselect="true"
                        :balance-id="clientBalanceId" @balance-changed="onBalanceChanged" />
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
                        <ProjectSearch
                            :selected-project="selectedProject"
                            :project-id="projectId"
                            :active-projects-only="true"
                            @update:selected-project="onSelectedProjectUpdate"
                        />
                    </div>
                    <div>
                        <CashRegisterSelect
                            v-model="cashId"
                            :cash-registers="cashRegistersForForm"
                            :readonly="!!editingItemId"
                            :disabled="cashSelectDisabled"
                            :required="true"
                        />
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
                        <ProductSearch
                            v-model="products"
                            :discount="discount"
                            amount-rounding-scope="order"
                            :discount-type="discountType"
                            :show-quantity="true"
                            :show-price="true"
                            :show-price-type="false"
                            :is-sale="true"
                            :currency-symbol="currencySymbol"
                            :document-currency-id="currencyId"
                            :warehouse-id="warehouseId"
                            :project-id="projectId"
                            :allow-temp-product="true"
                            required
                            @update:discount="discount = $event"
                            @update:discount-type="discountType = $event"
                            @product-removed="onProductRemoved"
                        />
                    </template>
                </div>
                <div v-show="currentTab === 'transactions' && editingItemId">
                    <template v-if="transactionsTabVisited">
                        <OrderTransactionsTab :order-id="editingItemId" :client="selectedClient" :project-id="projectId"
                            :cash-id="cashId" :document-balance-id="clientBalanceId"
                            :client-balances="transactionTabClientBalances" @updated-paid="paidTotalAmount = $event" />
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
                    <PrimaryButton
                        v-if="editingItemId && canCreateInvoice"
                        icon="fas fa-file-invoice"
                        :is-info="true"
                        :onclick="openCreateInvoice"
                        :aria-label="$t('createInvoice')"
                        :title="$t('createInvoice')"
                    />
                </div>

                <div
                    class="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-gray-800 dark:text-[var(--text-primary)] md:flex-nowrap">
                    <div>
                        {{ $t('toPay') }}: <span class="font-bold">{{ formatCurrency(roundedTotalPrice, currencySymbol,
                            null,
                            true)
                        }}</span>
                    </div>
                    <div>
                        {{ $t('paid') }}: <span class="font-bold">{{ formatCurrency(paidTotalAmount, currencySymbol,
                            null,
                            true)
                            }}</span>
                    </div>
                    <div>
                        {{ $t('total') }}: <span class="font-bold" :class="remainingAmountClass">{{
                            formatCurrency(remainingAmount,
                                currencySymbol, null, true) }}</span>
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
import { formatCurrency, roundValueForScope } from '@/utils/numberUtils';
import { dateFormMixin } from '@/utils/dateUtils';
import crudFormMixin from '@/mixins/crudFormMixin';
import storeDataLoaderMixin from '@/mixins/storeDataLoaderMixin';
import DatePickerField from '@/views/components/app/forms/DatePickerField.vue';
import CashRegisterSelect from '@/views/components/app/forms/CashRegisterSelect.vue';
import ProjectSearch from '@/views/components/app/search/ProjectSearch.vue';
import { balancesForDocumentPayment } from '@/utils/documentPaymentBalanceUtils';
import projectSelectionMixin from '@/mixins/projectSelectionMixin';
import clientBalanceCashMixin from '@/mixins/clientBalanceCashMixin';

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
        CashRegisterSelect,
        ProjectSearch,
    },
    mixins: [getApiErrorMessage, crudFormMixin, dateFormMixin, storeDataLoaderMixin, sideModalFooterPortal, projectSelectionMixin, clientBalanceCashMixin],
    clientBalanceCashFields: {
        selectedBalanceId: 'clientBalanceId',
    },
    props: {
        editingItem: { type: Object, default: null }
    },
    emits: ['saved', 'saved-silent', 'saved-error', 'deleted', 'deleted-error', 'close-request', 'create-invoice'],
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
            selectedProject: null,
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
        transactionTabClientBalances() {
            return balancesForDocumentPayment(this.clientBalances, this.clientBalanceId);
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
            return roundValueForScope(this.totalPrice, 'order');
        },
        remainingAmount() {
            return roundValueForScope(this.roundedTotalPrice - this.paidTotalAmount, 'order');
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
                return 'text-red-500 dark:text-red-400';
            } else if (remaining < 0) {
                return 'text-green-500 dark:text-green-400';
            } else {
                return 'text-gray-800 dark:text-[var(--text-primary)]';
            }
        },
        nestedProductCategoryModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenCategory',
                entityNominativeKey: 'sideModalNomCategory',
            });
        },
        canCreateInvoice() {
            return this.$store.getters.hasPermission('invoices_create');
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
                if (this.clientBalanceSelected) {
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
                for (const p of this.products) {
                    p.price = await this.convertAnchoredField(p, 'price', '_priceAnchor', '_priceAnchorCurrencyId', oldId, newId);
                    if (p.retailPrice != null) {
                        p.retailPrice = await this.convertAnchoredField(
                            p,
                            'retailPrice',
                            '_retailPriceAnchor',
                            '_retailPriceAnchorCurrencyId',
                            oldId,
                            newId
                        );
                    }
                    if (p.wholesalePrice != null) {
                        p.wholesalePrice = await this.convertAnchoredField(
                            p,
                            'wholesalePrice',
                            '_wholesalePriceAnchor',
                            '_wholesalePriceAnchorCurrencyId',
                            oldId,
                            newId
                        );
                    }
                }
                if (this.discountType === 'fixed' && Number(this.discount) > 0) {
                    this.discount = await this.convertAnchoredValue(
                        this.discount,
                        '_discountAnchor',
                        '_discountAnchorCurrencyId',
                        oldId,
                        newId
                    );
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
                if (newCashRegisters?.length && this.clientBalanceId && this.clientBalanceSelected) {
                    this.applyBalanceDefaults(this.clientBalanceId, { includePaymentType: false });
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
        openCreateInvoice() {
            if (!this.editingItemId) {
                return;
            }
            this.$emit('create-invoice', this.editingItemId);
        },
        formatCurrency,
        async convertAnchoredField(row, valueKey, anchorKey, anchorCurrencyKey, oldId, newId) {
            const value = row[valueKey];
            const converted = await this.convertAnchoredValue(value, anchorKey, anchorCurrencyKey, oldId, newId, row);
            row[valueKey] = converted;
            return converted;
        },
        async convertAnchoredValue(value, anchorKey, anchorCurrencyKey, oldId, newId, holder = null) {
            const target = holder ?? this;
            const currentNumber = Number(value);
            if (value == null || value === '' || !Number.isFinite(currentNumber)) {
                return value;
            }

            if (target[anchorKey] == null || !Number.isFinite(Number(target[anchorKey]))) {
                target[anchorKey] = currentNumber;
                target[anchorCurrencyKey] = Number(oldId);
            }

            if (Number(target[anchorCurrencyKey]) !== Number(oldId)) {
                target[anchorKey] = currentNumber;
                target[anchorCurrencyKey] = Number(oldId);
            }

            const mult = await this.orderCurrencyMultiplier(target[anchorCurrencyKey], newId);
            return roundValueForScope(Number(target[anchorKey]) * mult, 'order');
        },
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
        async fetchAllWarehouses() {
            await this.loadStoreData({
                getterName: 'warehouses',
                dispatchName: 'loadWarehouses',
                localProperty: 'allWarehouses',
                defaultValue: []
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