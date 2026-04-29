<template>
  <div class="relative">
    <label
      class="block mb-1"
      :class="{ 'required': required }"
    >{{ $t('searchProductsAndServices') }}</label>
    <input
      ref="productInput"
      v-model="productSearch"
      type="text"
      :placeholder="$t('enterProductNameOrCode')"
      class="w-full rounded border border-gray-300 bg-[var(--input-bg)] p-2 text-gray-900 placeholder:text-gray-400 dark:border-[var(--input-border)] dark:text-[var(--text-primary)] dark:placeholder:text-[var(--text-secondary)]"
      :disabled="disabled"
      @focus="onProductSearchFocus"
      @blur="handleBlur"
    >
    <transition name="appear">
      <div
        v-show="showDropdown"
        class="absolute left-0 right-0 z-10 mt-1 flex w-full flex-col overflow-hidden rounded border border-gray-300 bg-[var(--surface-elevated)] shadow-lg dark:border-[var(--border-subtle)] dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
      >
        <ul
          class="max-h-60 overflow-y-auto min-h-0"
          @scroll.passive="onResultsScroll"
        >
          <li
            v-if="productSearchLoading"
            class="p-2 text-gray-500 dark:text-[var(--text-secondary)]"
          >
            {{ $t('loading') }}
          </li>
          <template v-else-if="productSearch.length === 0">
            <li
              v-if="warehouseId && !warehouseProductsLoaded"
              class="p-2 text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ $t('loading') }}
            </li>
            <li
              v-else-if="lastProducts.length === 0"
              class="p-2 text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ $t('productSearchRecentEmpty') }}
            </li>
            <template v-else>
              <li
                v-for="product in lastProducts"
                :key="product.id"
                class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
                @mousedown.prevent="selectProduct(product)"
              >
              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
                  <div class="w-7 h-7 flex items-center justify-center mr-2">
                    <img
                      v-if="product.imgUrl()"
                      :src="product.imgUrl()"
                      alt="icon"
                      class="w-7 h-7 object-cover rounded"
                      loading="lazy"
                    >
                    <span
                      v-else
                      v-html="product.icons()"
                    />
                  </div>
                  {{ product.name }}
                </div>
                <div class="flex min-w-[90px] flex-col items-end text-xs text-[#337AB7] dark:text-[var(--label-accent)]">
                  <template v-if="product.typeName() === 'product'">
                    <div>
                      {{ product.stockQuantity }}
                      {{ product.unitShortName ||
                        product.unitName }}
                      {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol
                      }}
                    </div>
                  </template>
                  <template v-else>
                    <div>
                      ∞{{ product.unitShortName ||
                        product.unitName }} | {{ product.retailPriceFormatted() }}{{
                        defaultCurrencySymbol }}
                    </div>
                  </template>
                </div>
              </div>
              </li>
            </template>
          </template>
          <li
            v-else-if="productSearch.length < 3"
            class="p-2 text-gray-500 dark:text-[var(--text-secondary)]"
          >
            {{ $t('minimum3Characters') }}
          </li>
          <li
            v-else-if="productResults.length === 0"
            class="p-2 text-gray-500 dark:text-[var(--text-secondary)]"
          >
            {{ $t('notFound') }}
          </li>
          <template v-else>
            <li
              v-for="product in productResults"
              :key="product.id"
              class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="selectProduct(product)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
                  <div class="w-7 h-7 flex items-center justify-center mr-2">
                    <img
                      v-if="product.imgUrl()"
                      :src="product.imgUrl()"
                      alt="icon"
                      class="w-7 h-7 object-cover rounded"
                      loading="lazy"
                    >
                    <span
                      v-else
                      v-html="product.icons()"
                    />
                  </div>
                  {{ product.name }}
                </div>
                <div class="text-sm text-[#337AB7] dark:text-[var(--label-accent)]">
                  <template v-if="product.typeName && product.typeName() === 'product'">
                    {{ product.stockQuantity }}
                    {{ product.unitShortName  }}
                    {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                  </template>
                  <template v-else>
                    ∞{{ product.unitShortName  }} | {{
                      product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                  </template>
                </div>
              </div>
            </li>
            <li
              v-if="searchLoadingMore"
              class="p-2 text-center text-sm text-gray-500 dark:text-[var(--text-secondary)]"
            >
              {{ $t('loading') }}
            </li>
          </template>
        </ul>
        <div class="flex w-full shrink-0 gap-2 border-t border-gray-300 bg-[var(--surface-muted)] p-2 dark:border-[var(--border-subtle)]">
          <PrimaryButton
            class="flex-1 min-w-0 basis-0"
            :is-info="true"
            :is-full="true"
            icon="fas fa-plus"
            @mousedown.prevent="openCreateProductModal"
          >
            {{ $t('createProductOrService') }}{{ productSearch ? ` "${productSearch}"` : '' }}
          </PrimaryButton>
          <PrimaryButton
            v-if="showTempProductButton"
            class="flex-1 min-w-0 basis-0"
            :is-light="true"
            :is-full="true"
            icon="fas fa-bolt"
            :disabled="!productSearch.trim() || disabled"
            @mousedown.prevent="createTempProductQuick"
          >
            {{ $t('createTempProduct') }}
          </PrimaryButton>
        </div>
      </div>
    </transition>

    <label class="block mt-4 mb-1">{{ $t('specifiedProductsAndServices') }}</label>
    <CardViewEmptyState
      v-if="!products.length"
      class="mb-6"
    />
    <table
      v-else
      class="mb-6 w-100 min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
    >
      <thead class="rounded-t-sm bg-[var(--surface-muted)]">
        <tr>
          <th class="w-48 border border-gray-300 px-4 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            {{ $t('name') }}
          </th>
          <th
            v-if="showQuantity"
            class="w-20 border border-gray-300 px-4 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ $t('quantity') }}
          </th>
          <th
            v-if="showPrice"
            class="w-48 border border-gray-300 px-4 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ isReceipt ? $t('purchasePrice') : $t('price') }}
          </th>
          <th
            v-if="isReceipt && showPrice && showAmount"
            class="w-48 border border-gray-300 px-4 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
          >
            {{ $t('amount') }}
          </th>
          <th class="w-12 border border-gray-300 px-4 py-2 text-left font-medium text-gray-900 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]">
            ~
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(product, index) in products"
          :key="index"
          class="border-b border-gray-300 dark:border-[var(--border-subtle)]"
        >
          <td class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]">
            <div class="flex items-center text-gray-900 dark:text-[var(--text-primary)]">
              <div class="w-7 h-7 flex items-center justify-center mr-2">
                <img
                  v-if="product.imgUrl && product.imgUrl()"
                  :src="product.imgUrl()"
                  alt="icon"
                  class="w-7 h-7 object-cover rounded"
                  loading="lazy"
                >
                <span
                  v-else
                  v-html="product.icons ? product.icons() : getDefaultIcon(product)"
                />
              </div>
              {{ product.productName || product.name }}
            </div>
          </td>
          <td
            v-if="showQuantity"
            class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]"
          >
            <FormattedDecimalInput
              v-model="product.quantity"
              variant="quantity"
              class="w-full p-1 text-right"
              :disabled="disabled"
              min="0.01"
              @update:model-value="onQuantityChange(product)"
            />
          </td>
          <td
            v-if="showPrice"
            class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]"
          >
            <div class="flex items-center space-x-2">
              <FormattedDecimalInput
                v-model="product.price"
                variant="amount"
                class="w-full p-1 text-right"
                :disabled="disabled"
                min="0.01"
                @update:model-value="onPriceChange(product)"
              />
            </div>
          </td>
          <td
            v-if="isReceipt && showPrice && showAmount"
            class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]"
          >
            <FormattedDecimalInput
              v-model="product.amount"
              variant="amount"
              class="w-full p-1 text-right"
              :disabled="disabled"
              min="0.01"
              @update:model-value="onAmountChange(product)"
            />
          </td>
          <td
            v-if="showPriceType && !isReceipt && !isSale"
            class="border-x border-gray-300 px-4 py-2 dark:border-[var(--border-subtle)]"
          >
            <select
              v-model="product.priceType"
              class="w-full p-1"
              :disabled="disabled"
              @change="onPriceTypeChange(product)"
            >
              <option
                v-if="product.purchasePrice !== undefined"
                value="purchase"
              >
                {{ $t('purchasePrice')
                }}
              </option>
              <option value="retail">
                {{ $t('retailPrice') }}
              </option>
              <option
                v-if="product.wholesalePrice !== undefined && product.wholesalePrice > 0"
                value="wholesale"
              >
                {{ $t('wholesalePrice') }}
              </option>
            </select>
          </td>
          <td class="border-x border-gray-300 px-4 dark:border-[var(--border-subtle)]">
            <button
              class="z-50 cursor-pointer text-2xl text-red-500 dark:text-red-400"
              :disabled="disabled"
              @click="removeSelectedProduct(product.productId)"
            >
              ×
            </button>
          </td>
        </tr>
      </tbody>
      <tfoot v-if="products.length && isSale">
        <tr class="bg-[var(--surface-muted)] font-medium">
          <td
            :colspan="showQuantity ? 2 : 1"
            class="px-4 py-2 text-right text-gray-900 dark:text-[var(--text-primary)]"
          >
            {{ $t('amountWithoutDiscount') }}
          </td>
          <td class="px-4 py-2 text-right text-gray-900 dark:text-[var(--text-primary)]">
            {{ formatCurrency(subtotal, currencySymbol, null, true) }}
          </td>
          <td />
        </tr>
        <tr>
          <td
            :colspan="showQuantity ? 3 : 2"
            class="px-4 py-2"
          >
            <div class="flex items-center justify-end space-x-2 text-gray-900 dark:text-[var(--text-primary)]">
              <label class="flex">{{ $t('discount') }}</label>
              <div class="relative">
                <FormattedDecimalInput
                  v-model="discountLocal"
                  variant="amount"
                  class="w-24 p-1 text-right border rounded"
                  :disabled="disabled"
                  @update:model-value="updateTotals"
                />
              </div>
              <select
                v-model="discountTypeLocal"
                class="border ml-2 p-1 text-sm !w-14 text-center"
                :disabled="disabled"
                @change="updateTotals"
              >
                <option value="percent">
                  %
                </option>
                <option value="fixed">
                  {{ currencySymbol }}
                </option>
              </select>
            </div>
          </td>
          <td />
        </tr>
        <tr class="bg-[var(--surface-muted)] font-bold">
          <td
            :colspan="showQuantity ? 2 : 1"
            class="px-4 py-2 text-right text-gray-900 dark:text-[var(--text-primary)]"
          >
            {{ $t('total') }}
          </td>
          <td class="px-4 py-2 text-right text-gray-900 dark:text-[var(--text-primary)]">
            {{ formatCurrency(totalPrice, currencySymbol, null, true) }}
          </td>
          <td />
        </tr>
      </tfoot>
    </table>
    <SideModalDialog
      :show-form="modalCreateProduct"
      :title="productCreateModalTitle"
      :onclose="() => modalCreateProduct = false"
      :level="3"
    >
      <ProductsCreatePage
        :default-type="defaultProductType"
        :default-name="defaultProductName"
        :editing-item="null"
        @saved="onProductCreated"
        @saved-error="onProductCreatedError"
      />
    </SideModalDialog>
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import SaleProductDto from '@/dto/sale/SaleProductDto';
import OrderProductDto from '@/dto/order/OrderProductDto';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import SideModalDialog, { sideModalCrudTitle } from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import notificationMixin from '@/mixins/notificationMixin';
import { formatCurrency, roundValue } from '@/utils/numberUtils';
import { catalogToDocumentMultiplier } from '@/utils/catalogToDocumentMultiplier';

export default {
    components: {
        ProductsCreatePage,
        SideModalDialog,
        PrimaryButton,
        CardViewEmptyState,
    },
    mixins: [notificationMixin],
    props: {
        modelValue: {
            type: Array,
            default: () => [],
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        showQuantity: {
            type: Boolean,
            default: true,
        },
        showPrice: {
            type: Boolean,
            default: false,
        },
        showAmount: {
            type: Boolean,
            default: true,
        },
        showPriceType: {
            type: Boolean,
            default: false,
        },
        required: {
            type: Boolean,
            default: false,
        },
        isReceipt: {
            type: Boolean,
            default: false,
        },
        isSale: {
            type: Boolean,
            default: false,
        },
        onlyProducts: {
            type: Boolean,
            default: false,
        },
        currencySymbol: {
            type: String,
            default: '',
        },
        documentCurrencyId: {
            type: [Number, String],
            default: null,
        },
        discount: {
            default: 0
        },
        discountType: {
            type: String,
            default: 'fixed'
        },
        warehouseId: {
            type: [String, Number],
            default: null
        },
        projectId: {
            type: [String, Number],
            default: null
        },
        useAllProducts: {
            type: Boolean,
            default: false
        },
        allowTempProduct: {
            type: Boolean,
            default: false
        },
        allowAllWarehouseProducts: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue', 'update:discount', 'update:discountType', 'update:subtotal', 'update:totalPrice', 'product-removed'],
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            searchAbortController: null,
            showDropdown: false,
            modalCreateProduct: false,
            defaultProductType: 'product',
            defaultProductName: '',
            warehouseProducts: [],
            warehouseProductsLoaded: false,
            searchMeta: null,
            searchLoadingMore: false,
            searchPerPage: 20,
        };
    },
    computed: {
        productCreateModalTitle() {
            return sideModalCrudTitle(this.$t.bind(this), {
                item: null,
                entityGenitiveKey: 'sideModalGenProduct',
                entityNominativeKey: 'sideModalNomProduct',
            });
        },
        products: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            },
        },
        subtotal() {
            const rawSubtotal = this.products.reduce((sum, p) => {
                if (this.isReceipt && p.amount !== null && p.amount !== undefined) {
                    return sum + (parseFloat(p.amount) || 0);
                }
                const price = parseFloat(p.price) || 0;
                const qty = parseFloat(p.quantity) || 0;
                return sum + price * qty;
            }, 0);
            return roundValue(rawSubtotal);
        },
        discountAmount() {
            const sanitized = this.sanitizeDiscountValue(this.discount);
            if (!sanitized) {
                return 0;
            }

            let amount;
            if (this.discountType === 'percent') {
                amount = (this.subtotal * sanitized) / 100;
            } else {
                amount = sanitized;
            }
            amount = Math.min(amount, this.subtotal);

            return roundValue(amount);
        },
        totalPrice() {
            const total = this.subtotal - this.discountAmount;
            return total < 0 ? 0 : total;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : this.$t('noCurrency');
        },
        discountLocal: {
            get() {
                return this.discount;
            },
            set(value) {
                this.emitSanitizedDiscount(value);
            }
        },
        discountTypeLocal: {
            get() {
                return this.discountType;
            },
            set(value) {
                this.$emit('update:discountType', value);
            }
        },
        lastProducts() {
            if (this.warehouseId) {
                if (!this.warehouseProductsLoaded) {
                    return [];
                }
                let products = this.warehouseProducts;
                if (this.onlyProducts) {
                    products = products.filter(p => Number(p.type) === 1);
                }
                return products;
            }
            if (this.useAllProducts) {
                let products = this.$store.getters.allProducts;
                if (this.onlyProducts) {
                    products = products.filter(p => Number(p.type) === 1);
                }
                return products;
            }
            return [];
        },
        canCreateTempProduct() {
            return this.$store.getters.hasPermission('products_create_temp');
        },
        showTempProductButton() {
            return this.allowTempProduct && !this.isReceipt && this.canCreateTempProduct;
        }
    },
    async created() {
        if (this.warehouseId) {
            await this.loadWarehouseProducts();
        } else if (this.useAllProducts) {
            await this.$store.dispatch('loadAllProducts');
        }
    },
    methods: {
        formatCurrency,
        onProductSearchFocus() {
            this.showDropdown = true;
        },
        sanitizeDiscountValue(value) {
            const numeric = Number(value) || 0;
            const nonNegative = numeric < 0 ? 0 : numeric;

            if (this.discountType === 'percent') {
                return Math.min(nonNegative, 100);
            }

            if (this.subtotal <= 0) {
                return 0;
            }

            return Math.min(nonNegative, this.subtotal);
        },
        emitSanitizedDiscount(value = this.discount) {
            const sanitized = this.sanitizeDiscountValue(value);
            if (sanitized !== this.discount) {
                this.$emit('update:discount', sanitized);
            }
            return sanitized;
        },
        warehouseListParams() {
            const params = { warehouseId: this.warehouseId };
            if (this.allowAllWarehouseProducts) {
                params.warehouseStockPolicy = 'all';
            }
            return params;
        },
        async loadWarehouseProducts() {
            const limit = 50;
            this.warehouseProductsLoaded = false;
            const params = this.warehouseListParams();
            try {
                if (this.onlyProducts) {
                    const results = await ProductController.getItems(1, true, params, limit);
                    this.warehouseProducts = results.items || [];
                } else {
                    const half = Math.ceil(limit / 2);
                    const other = Math.max(1, limit - half);
                    const [prodRes, servRes] = await Promise.all([
                        ProductController.getItems(1, true, params, half),
                        ProductController.getItems(1, false, params, other),
                    ]);
                    const pItems = prodRes.items || [];
                    const sItems = servRes.items || [];
                    const merged = [...pItems, ...sItems].sort((a, b) => {
                        const ta = new Date(a.createdAt || 0).getTime();
                        const tb = new Date(b.createdAt || 0).getTime();
                        return tb - ta;
                    }).slice(0, limit);
                    this.warehouseProducts = merged;
                }
                this.warehouseProductsLoaded = true;
            } catch (error) {
                console.error('[ProductSearch] loadWarehouseProducts error', error);
                this.warehouseProducts = [];
                this.warehouseProductsLoaded = true;
            }
        },
        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 3) {
                if (this.searchAbortController) {
                    this.searchAbortController.abort();
                }
                this.searchAbortController = new AbortController();
                const signal = this.searchAbortController.signal;
                this.productSearchLoading = true;
                this.searchMeta = null;
                try {
                    const { items, meta } = await ProductController.search(
                        this.productSearch,
                        this.onlyProducts ? true : null,
                        this.warehouseId,
                        signal,
                        this.allowAllWarehouseProducts ? 'all' : null,
                        1,
                        this.searchPerPage
                    );
                    if (signal.aborted) return;

                    let products = items;

                    if (this.onlyProducts) {
                        products = products.filter(p => Number(p.type) === 1);
                    }

                    this.productResults = products;
                    this.searchMeta = meta;
                } catch (error) {
                    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
                    this.productResults = [];
                    this.searchMeta = null;
                } finally {
                    if (!signal.aborted) this.productSearchLoading = false;
                }
            } else {
                this.productResults = [];
                this.searchMeta = null;
            }
        }, 250),
        onResultsScroll(e) {
            const el = e.target;
            if (this.productSearch.length < 3 || this.productSearchLoading || this.searchLoadingMore) return;
            if (!this.searchMeta || this.searchMeta.current_page >= this.searchMeta.last_page) return;
            if (el.scrollHeight - el.scrollTop - el.clientHeight > 56) return;
            this.loadMoreSearchResults();
        },
        async loadMoreSearchResults() {
            if (this.productSearch.length < 3 || this.productSearchLoading || this.searchLoadingMore) return;
            if (!this.searchMeta || this.searchMeta.current_page >= this.searchMeta.last_page) return;
            const nextPage = this.searchMeta.current_page + 1;
            this.searchLoadingMore = true;
            try {
                const { items, meta } = await ProductController.search(
                    this.productSearch,
                    this.onlyProducts ? true : null,
                    this.warehouseId,
                    null,
                    this.allowAllWarehouseProducts ? 'all' : null,
                    nextPage,
                    this.searchPerPage
                );
                let products = items;
                if (this.onlyProducts) {
                    products = products.filter(p => Number(p.type) === 1);
                }
                this.productResults = [...this.productResults, ...products];
                this.searchMeta = meta;
            } finally {
                this.searchLoadingMore = false;
            }
        },
        async selectProduct(product) {
            try {
                this.showDropdown = false;
                this.productSearch = '';
                this.productResults = [];
                this.searchMeta = null;

                const existing = this.products.find(p => p.productId === product.id);
                if (existing && this.isSale) {
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                } else {
                    let productDto;
                    if (this.isReceipt) {
                        productDto = WarehouseReceiptProductDto.fromProductDto(product, true);
                    } else if (this.showPrice && (this.isSale && !this.showPriceType || !this.isSale)) {
                        productDto = OrderProductDto.fromProductDto(product, true);
                        const retailPrice = Number(product.retailPrice) || 0;
                        const wholesalePrice = Number(product.wholesalePrice) || 0;
                        let mult = 1;
                        if (this.documentCurrencyId) {
                            mult = await catalogToDocumentMultiplier(
                                this.documentCurrencyId,
                                this.$store.state.currencies || []
                            );
                        }
                        productDto.retailPrice = roundValue(retailPrice * mult);
                        productDto.wholesalePrice = roundValue(wholesalePrice * mult);
                        productDto.price = (this.projectId && wholesalePrice > 0) ? productDto.wholesalePrice : productDto.retailPrice;
                    } else if (this.isSale && this.showPriceType) {
                        productDto = SaleProductDto.fromProductDto(product, true);
                        productDto.retailPrice = product.retailPrice || 0;
                        productDto.wholesalePrice = product.wholesalePrice || 0;
                        if (this.projectId && productDto.wholesalePrice > 0) {
                            productDto.priceType = 'wholesale';
                            productDto.price = productDto.wholesalePrice;
                        } else {
                            productDto.priceType = 'retail';
                            productDto.price = productDto.retailPrice;
                        }
                    } else {
                        productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                        if (this.showPriceType) {
                            productDto.priceType = 'purchase';
                        }
                    }
                    if (productDto && product.id) {
                        productDto.productId = product.id;
                    }
                    if (this.isReceipt && productDto.quantity && productDto.price) {
                        productDto.amount = (Number(productDto.quantity) || 0) * (Number(productDto.price) || 0);
                    }
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch {
                void 0;
            }
        },
        calculateAmountFromPrice(product) {
            if (this.isReceipt && product.quantity && product.quantity > 0 && product.price) {
                product.amount = (Number(product.price) || 0) * (Number(product.quantity) || 0);
            }
        },
        onPriceTypeChange(product) {
            if (this.isSale || (this.showPrice && product.retailPrice !== undefined && product.wholesalePrice !== undefined)) {
                if (product.priceType === 'retail') {
                    product.price = product.retailPrice || 0;
                } else if (product.priceType === 'wholesale') {
                    product.price = product.wholesalePrice || 0;
                } else if (product.priceType === 'purchase') {
                    product.price = product.purchasePrice || 0;
                }
                this.updateTotals();
            }
        },
        onPriceChange(product) {
            this.calculateAmountFromPrice(product);
            this.updateTotals();
        },
        onAmountChange(product) {
            if ((this.isReceipt || this.isSale) && product.quantity && product.quantity > 0) {
                product.price = (Number(product.amount) || 0) / (Number(product.quantity) || 1);
            }
            this.updateTotals();
        },
        onQuantityChange(product) {
            this.calculateAmountFromPrice(product);
            this.updateTotals();
        },
        removeSelectedProduct(id) {
            const removedProduct = this.products.find(p => p.productId === id);

            this.products = this.products.filter(p => p.productId !== id);
            this.updateTotals();

            this.$emit('product-removed', {
                id,
                wasTempProduct: removedProduct?.isTempProduct,
                name: removedProduct?.name,
                orderProductId: removedProduct?.orderProductId || null
            });
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },
        updateTotals() {
            this.emitSanitizedDiscount(this.discount);
            this.$emit('update:discountType', this.discountType);
            this.$emit('update:subtotal', this.subtotal);
            this.$emit('update:totalPrice', this.totalPrice);
        },
        createTempProductQuick() {
            const name = (this.productSearch ).trim();
            if (!name) return;
            this.showDropdown = false;
            const tempItem = {
                name,
                productName: name,
                description: '',
                quantity: 1,
                price: 0,
                unitId: null,
                productId: Date.now() + Math.floor(Math.random() * 1000),
                isTempProduct: true,
                icons() { return '<i class="fas fa-bolt text-[#EAB308]"></i>'; }
            };
            this.products = [...this.products, tempItem];
            this.productSearch = '';
            this.productResults = [];
            this.searchMeta = null;
            this.updateTotals();
            if (this.$refs.productInput) this.$refs.productInput.blur();
        },
        openCreateProductModal() {
            this.defaultProductType = this.onlyProducts ? 'product' : 'service';
            this.defaultProductName = this.productSearch;
            this.modalCreateProduct = true;
        },
        async onProductCreated(newProduct) {
            this.modalCreateProduct = false;
            if (newProduct) {
                await this.selectProduct(newProduct);
            }
        },
        onProductCreatedError(error) {
            this.showNotification(this.$t('errorCreatingProduct'), error, true);
        },
        getDefaultIcon(product) {
            if (product.isTempProduct) {
                return '<i class="fas fa-bolt text-[#EAB308]"></i>';
            }
            const isProduct = product.type == 1;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
        },
    },
    watch: {
        productSearch: {
            handler: 'searchProducts',
            immediate: true,
        },
        warehouseId: {
            async handler(newWarehouseId, oldWarehouseId) {
                if (newWarehouseId !== oldWarehouseId) {
                    if (newWarehouseId) {
                        await this.loadWarehouseProducts();
                    } else {
                        this.warehouseProducts = [];
                        this.warehouseProductsLoaded = true;
                    }
                    if (this.productSearch.length >= 3) {
                        this.searchProducts();
                    }
                }
            },
        },
        projectId: {
            handler(newProjectId, oldProjectId) {
                if (newProjectId !== oldProjectId && this.showPrice && !this.isReceipt) {
                    this.products.forEach(product => {
                        if (product.retailPrice !== undefined && product.wholesalePrice !== undefined) {
                            if (newProjectId && product.wholesalePrice > 0) {
                                product.price = product.wholesalePrice;
                            } else {
                                product.price = product.retailPrice;
                            }
                        }
                    });
                    this.updateTotals();
                }
            },
            immediate: false
        },
        discountType: {
            handler() {
                this.emitSanitizedDiscount();
            },
            immediate: true,
        },
        subtotal(newVal, oldVal) {
            if (newVal !== oldVal) {
                this.emitSanitizedDiscount();
            }
        },
    },
};
</script>

<style scoped>
.appear-enter-active,
.appear-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.appear-enter-from,
.appear-leave-to {
    transform: scaleY(0);
    opacity: 0;
    transform-origin: top;
}

.appear-enter-to,
.appear-leave-from {
    transform: scaleY(1);
    opacity: 1;
    transform-origin: top;
}
</style>