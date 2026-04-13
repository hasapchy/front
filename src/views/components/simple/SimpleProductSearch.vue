<template>
  <div class="space-y-6">
    <div class="relative">
      <label class="mb-1 block font-medium text-[var(--text-primary)]">{{ $t('productsInStock') }}</label>
      <input
        ref="productInput"
        v-model="productSearch"
        type="text"
        :placeholder="$t('enterProductNameOrCode')"
        class="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--nav-accent)]/35"
        :disabled="disabled"
        @focus="onFocus"
        @blur="handleProductBlur"
      >

      <transition name="appear">
        <ul
          v-show="showProductDropdown"
          class="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-[var(--input-border)] bg-[var(--surface-elevated)] shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
        >
          <li
            v-if="productSearchLoading"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('loading') }}
          </li>
          <template v-else-if="productSearch.length === 0">
            <li
              v-if="!lastProducts || lastProducts.length === 0"
              class="p-2 text-[var(--text-secondary)]"
            >
              {{ $t('noData')
              }}
            </li>
            <template v-else>
              <li class="sticky top-0 border-b border-[var(--border-subtle)] bg-[var(--surface-muted)] p-2 text-xs text-[var(--text-secondary)]">
                <i class="fas fa-box-open mr-1" />
                {{ onlyProducts ? $t('productsInStock') : $t('allProductsAndServices') }} ({{ lastProducts.length }})
              </li>
              <li
                v-for="product in lastProducts"
                :key="product.id"
                class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
                @mousedown.prevent="selectProduct(product)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center text-[var(--text-primary)]">
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
                    <div>
                      {{ product.stockQuantity }}
                      {{ product.unitShortName  }}
                    </div>
                  </div>
                </div>
              </li>
            </template>
          </template>
          <li
            v-else-if="productSearch.length < 3"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('minimum3Characters') }}
          </li>
          <li
            v-else-if="productResults.length === 0"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('notFound') }}
          </li>
          <li
            v-for="product in productResults"
            v-else
            :key="product.id"
            class="cursor-pointer border-b border-[var(--border-subtle)] p-2 hover:bg-[var(--surface-muted)]"
            @mousedown.prevent="selectProduct(product)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center text-[var(--text-primary)]">
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
                {{ product.stockQuantity }}
                {{ product.unitShortName  }}
              </div>
            </div>
          </li>
        </ul>
      </transition>
    </div>

    <label class="mb-1 mt-4 block font-medium text-[var(--text-primary)]">{{ onlyProducts ? $t('orderProducts') : $t('specifiedProductsAndServices') }}</label>

    <div
      v-if="hasZeroQuantityProducts || hasExceededStock"
      class="mb-2 space-y-2"
    >
      <div
        v-if="hasZeroQuantityProducts"
        class="rounded-md border border-yellow-200 bg-yellow-50 p-2 dark:border-yellow-800/60 dark:bg-yellow-950/35"
      >
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle mr-2 text-yellow-600 dark:text-yellow-500" />
          <span class="text-sm text-yellow-900 dark:text-yellow-100">
            {{ $t('zeroQuantityProductsExcluded') }}
          </span>
        </div>
      </div>

      <div
        v-if="hasExceededStock"
        class="rounded-md border border-orange-200 bg-orange-50 p-2 dark:border-orange-800/60 dark:bg-orange-950/35"
      >
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle mr-2 text-orange-600 dark:text-orange-400" />
          <span class="text-sm text-orange-900 dark:text-orange-100">
            {{ $t('exceededStockWarning') }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="products.length > 0">
      <table class="mb-6 w-full min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
        <thead class="rounded-t-sm bg-[var(--surface-muted)]">
          <tr>
            <th class="w-48 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('name') }}
            </th>
            <th class="w-48 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]">
              {{
                $t('quantityAndDimensions')
              }}
            </th>
            <th class="w-24 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('price') }}
            </th>
            <th class="w-12 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]">
              ~
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(product, index) in products"
            :key="index"
            class="border-b border-[var(--border-subtle)]"
          >
            <td class="border-x border-[var(--border-subtle)] px-4 py-2">
              <div class="flex items-center text-[var(--text-primary)]">
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

            <td class="border-x border-[var(--border-subtle)] px-4 py-2">
              <div
                v-if="isSquareMeter(product)"
                class="space-y-2"
              >
                <div class="flex items-center space-x-2">
                  <span class="w-16 text-xs text-[var(--text-secondary)]">{{ $t('width') }}:</span>
                  <FormattedDecimalInput
                    :model-value="Number(getProductWidth(product)) || 0"
                    variant="quantity"
                    class="flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-sm text-[var(--text-primary)]"
                    :disabled="disabled"
                    min="0"
                    placeholder="0"
                    @update:model-value="setProductWidth(product, $event); calculateQuantity(product);"
                  />
                  <span class="text-xs text-[var(--text-secondary)]">m</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="w-16 text-xs text-[var(--text-secondary)]">{{ $t('length') }}:</span>
                  <FormattedDecimalInput
                    :model-value="Number(getProductLength(product)) || 0"
                    variant="quantity"
                    class="flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-sm text-[var(--text-primary)]"
                    :disabled="disabled"
                    min="0"
                    placeholder="0"
                    @update:model-value="setProductLength(product, $event); calculateQuantity(product);"
                  />
                  <span class="text-xs text-[var(--text-secondary)]">m</span>
                </div>
                <div class="rounded bg-[var(--surface-muted)] p-1 text-right text-sm font-medium text-[var(--text-primary)]">
                  = {{ product.quantity || 0 }} {{ product.unitShortName  }}
                </div>
                <div
                  v-if="!isService(product)"
                  class="text-xs text-right mt-1"
                  :class="getStockQuantityClass(product)"
                >
                  {{ $t('stockLeft') }}: {{ product.stockQuantity || 0 }}
                </div>
              </div>
              <div v-else>
                <FormattedDecimalInput
                  v-model="product.quantity"
                  variant="quantity"
                  class="w-full rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-[var(--text-primary)]"
                  :disabled="disabled"
                  min="0"
                  :placeholder="product.unitShortName ? '0 ' + product.unitShortName : '0'"
                />
                <div
                  v-if="!isService(product)"
                  class="text-xs mt-1 text-right"
                  :class="getStockQuantityClass(product)"
                >
                  {{ $t('stockLeft') }}: {{ product.stockQuantity || 0 }}
                </div>
              </div>
            </td>

            <td class="border-x border-[var(--border-subtle)] px-4 py-2">
              <div class="w-full rounded border border-[var(--input-border)] bg-[var(--surface-muted)] p-1 text-right text-sm text-[var(--text-primary)]">
                {{ $formatNumber(Number(product.price) || 0, null, true) }} {{ lineCurrencySymbol }}
              </div>
            </td>

            <td class="border-x border-[var(--border-subtle)] px-4">
              <button
                class="cursor-pointer text-2xl text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                :disabled="disabled"
                @click="removeSelectedProduct(index)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <CardViewEmptyState
      v-else
      class="mb-6"
    />
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import { roundQuantityValue, roundValue } from '@/utils/numberUtils';
import { catalogToDocumentMultiplier } from '@/utils/catalogToDocumentMultiplier';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';

export default {
    components: { CardViewEmptyState },
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
        required: {
            type: Boolean,
            default: false,
        },
        onlyProducts: {
            type: Boolean,
            default: false,
        },
        projectId: {
            type: [String, Number],
            default: null
        },
        documentCurrencyId: {
            type: [Number, String],
            default: null,
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            showProductDropdown: false,
            productDimensions: {},
            lastProductsList: []
        };
    },
    computed: {
        products: {
            get() {
                return this.modelValue;
            },
            set(value) {
                value.forEach(product => {
                    if (product.productId && !this.productDimensions[product.productId]) {
                        this.productDimensions[product.productId] = {
                            width: product.width || 0,
                            length: product.height || 0
                        };
                    }
                });
                this.$emit('update:modelValue', value);
            },
        },

        hasZeroQuantityProducts() {
            return this.products.some(product => !product.quantity || product.quantity <= 0);
        },

        hasExceededStock() {
            return this.products.some(product => {
                if (this.isService(product)) {
                    return false;
                }

                const stockQuantity = product.stockQuantity || 0;
                const orderQuantity = product.quantity || 0;
                return orderQuantity > stockQuantity && stockQuantity > 0;
            });
        },

        lastProducts() {
            return this.lastProductsList;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store?.state?.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        },
        lineCurrencySymbol() {
            if (this.documentCurrencyId) {
                const c = (this.$store?.state?.currencies || []).find(
                    (x) => Number(x.id) === Number(this.documentCurrencyId)
                );
                return c?.symbol || this.defaultCurrencySymbol;
            }
            return this.defaultCurrencySymbol;
        },
    },
    watch: {
        productSearch: {
            handler: 'searchProducts',
            immediate: false,
        },
        products: {
            handler(newProducts) {
                if (newProducts && newProducts.length > 0) {
                    newProducts.forEach(product => {
                        if (product.productId) {
                            // Всегда обновляем размеры из данных продукта
                            this.productDimensions[product.productId] = {
                                width: product.width || 0,
                                length: product.height || 0
                            };
                        }
                    });
                }
            },
            immediate: true,
            deep: true
        }
    },
    async created() {
        await this.fetchLastProducts();

        this.performSearch = debounce(async (searchTerm) => {
            if (searchTerm && searchTerm.length >= 3) {
                this.productSearchLoading = true;
                try {
                    const { items } = await ProductController.search(
                        searchTerm,
                        this.onlyProducts ? true : null
                    );
                    this.productResults = items;
                    this.productSearchLoading = false;
                } catch {
                    this.productResults = [];
                    this.productSearchLoading = false;
                }
            }
        }, 250);
    },
    methods: {
        async fetchLastProducts() {
            try {
                let allProducts = [];
                let currentPage = 1;
                let hasMorePages = true;
                const perPage = 2000;

                while (hasMorePages) {
                    const prodPage = await ProductController.getItems(currentPage, true, {}, perPage);
                    const products = prodPage.items || [];
                    allProducts.push(...products);

                    if (prodPage.nextPage && currentPage < prodPage.lastPage) {
                        currentPage++;
                    } else {
                        hasMorePages = false;
                    }
                }

                this.lastProductsList = allProducts
                    .sort((a, b) => {
                        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        return dateB - dateA;
                    });
            } catch {
                this.lastProductsList = [];
            }
        },
        async onFocus() {
            this.showProductDropdown = true;
            if (!this.lastProductsList || this.lastProductsList.length === 0) {
                await this.fetchLastProducts();
            }
        },
        searchProducts() {
            if (this.productSearch.length >= 3) {
                this.performSearch(this.productSearch);
            } else {
                this.productResults = [];
            }
        },
        async selectProduct(product) {
            try {
                this.showProductDropdown = false;
                this.productSearch = '';
                this.productResults = [];

                const productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                if (productDto && product.id) {
                    productDto.productId = product.id;
                    let mult = 1;
                    if (this.documentCurrencyId) {
                        mult = await catalogToDocumentMultiplier(
                            this.documentCurrencyId,
                            this.$store.state.currencies || []
                        );
                    }
                    const retail = Number(product.retailPrice) || 0;
                    const wholesale = Number(product.wholesalePrice) || 0;
                    if (this.projectId && wholesale > 0) {
                        productDto.price = roundValue(wholesale * mult);
                    } else {
                        productDto.price = roundValue(retail * mult);
                    }
                    productDto.type = product.type || 1;
                    productDto.stockQuantity = product.stockQuantity || 0;

                     const unitShortName = productDto.unitShortName ;
                    const isSquareMeter = this.isSquareMeterShortName(unitShortName);


                    if (isSquareMeter) {
                        this.productDimensions[product.id] = { width: 0, length: 0 };
                        productDto.width = 0;
                        productDto.height = 0;
                        productDto.quantity = 0;
                    } else {
                        productDto.quantity = 0;
                        productDto.width = 0;
                        productDto.height = 0;
                    }
                }
                
                const existingIndex = this.products.findIndex(p => 
                    p.productId === productDto.productId &&
                    p.price === productDto.price &&
                    (p.width || 0) === (productDto.width || 0) &&
                    (p.height || 0) === (productDto.height || 0)
                );
                
                if (existingIndex !== -1) {
                    const existing = this.products[existingIndex];
                    const newQuantity = (Number(existing.quantity) || 0) + (Number(productDto.quantity) || 0);
                    this.products[existingIndex] = {
                        ...existing,
                        quantity: newQuantity
                    };
                } else {
                    this.products = [...this.products, productDto];
                }
                
                this.$refs.productInput.blur();
            } catch {
                void 0;
            }
        },
        async selectService(service) {
            try {
                const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                if (productDto && service.id) {
                    productDto.productId = service.id;
                    let mult = 1;
                    if (this.documentCurrencyId) {
                        mult = await catalogToDocumentMultiplier(
                            this.documentCurrencyId,
                            this.$store.state.currencies || []
                        );
                    }
                    const retail = Number(service.retailPrice) || 0;
                    const wholesale = Number(service.wholesalePrice) || 0;
                    if (this.projectId && wholesale > 0) {
                        productDto.price = roundValue(wholesale * mult);
                    } else {
                        productDto.price = roundValue(retail * mult);
                    }
                    productDto.type = service.type || 0;
                    productDto.stockQuantity = service.stockQuantity || 0;

                    const unitShortName = productDto.unitShortName ;
                    const isSquareMeter = this.isSquareMeterShortName(unitShortName);


                    if (isSquareMeter) {
                        this.productDimensions[service.id] = { width: 0, length: 0 };
                        productDto.width = 0;
                        productDto.height = 0;
                        productDto.quantity = 0;
                    } else {
                        productDto.quantity = 0;
                        productDto.width = 0;
                        productDto.height = 0;
                    }
                }
                
                const existingIndex = this.products.findIndex(p => 
                    p.productId === productDto.productId &&
                    p.price === productDto.price &&
                    (p.width || 0) === (productDto.width || 0) &&
                    (p.height || 0) === (productDto.height || 0)
                );
                
                if (existingIndex !== -1) {
                    const existing = this.products[existingIndex];
                    const newQuantity = (Number(existing.quantity) || 0) + (Number(productDto.quantity) || 0);
                    this.products[existingIndex] = {
                        ...existing,
                        quantity: newQuantity
                    };
                } else {
                    this.products = [...this.products, productDto];
                }
            } catch {
                void 0;
            }
        },
        removeSelectedProduct(index) {
            const productToRemove = this.products[index];
            if (productToRemove) {
                const remainingProductsWithSameId = this.products.filter((p, i) =>
                    i !== index && p.productId === productToRemove.productId
                );
                if (remainingProductsWithSameId.length === 0) {
                    delete this.productDimensions[productToRemove.productId];
                }
            }

            this.products = this.products.filter((_, i) => i !== index);
        },
        handleProductBlur() {
            requestAnimationFrame(() => {
                this.showProductDropdown = false;
            });
        },
        getDefaultIcon(product) {
            const isProduct = product.type == 1;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
        },

        getProductWidth(product) {
            if (product.width !== undefined && product.width !== null) {
                return product.width;
            }

            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            return this.productDimensions[product.productId].width;
        },

        setProductWidth(product, value) {
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            this.productDimensions[product.productId].width = value;
            product.width = value;
        },

        getProductLength(product) {
            if (product.height !== undefined && product.height !== null) {
                return product.height;
            }

            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            return this.productDimensions[product.productId].length;
        },

        setProductLength(product, value) {
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            this.productDimensions[product.productId].length = value;
            product.height = value;
        },


        calculateQuantity(product) {
            if (!this.isSquareMeter(product)) {
                return;
            }

            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }

            const width = Number(product.width || this.productDimensions[product.productId].width) || 0;
            const length = Number(product.height || this.productDimensions[product.productId].length) || 0;

            if (!width || !length || width <= 0 || length <= 0) {
                product.quantity = 0;
                return;
            }

            if (isNaN(width) || isNaN(length)) {
                product.quantity = 0;
                return;
            }

            const rawQuantity = width * length;
            product.quantity = roundQuantityValue(rawQuantity);
        },

        validateInput(product, field) {
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }

            const value = product[field];
            if (value < 0) {
                product[field] = 0;
                this.productDimensions[product.productId][field] = 0;
            }
            this.calculateQuantity(product);
        },

        isService(product) {
            const isServiceType = product.type === 0 || product.type === '0' || product.type === false;

            const hasNoStockInfo = product.stockQuantity === undefined ||
                product.stockQuantity === null ||
                product.stockQuantity === '';

            return isServiceType || (!product.type && hasNoStockInfo);
        },

        isSquareMeter(product) {
            const unitShortName = product.unitShortName ;
            return this.isSquareMeterShortName(unitShortName);
        },
        isSquareMeterShortName(unitShortNameRaw) {
            const s = String(unitShortNameRaw ).trim().toLowerCase();
            return s === 'м²' || s === 'м2' || s === 'm²' || s === 'm2';
        },

        getStockDisplayValue(product) {
            if (this.isService(product)) {
                return '∞';
            }
            return product.stockQuantity || 0;
        },

        getStockQuantityClass(product) {
            if (this.isService(product)) {
                return 'text-[var(--text-secondary)]';
            }

            const stockQuantity = product.stockQuantity || 0;
            const orderQuantity = product.quantity || 0;

            if (stockQuantity === 0) {
                return 'font-medium text-red-600 dark:text-red-400';
            } else if (orderQuantity > stockQuantity) {
                return 'font-medium text-orange-600 dark:text-orange-400';
            } else if (stockQuantity <= 5) {
                return 'font-medium text-amber-600 dark:text-amber-400';
            } else {
                return 'text-[var(--text-secondary)]';
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

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
}
</style>
