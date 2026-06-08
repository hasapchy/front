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
                    <ProductLineImage
                      :item="product"
                      alt="icon"
                      class="mr-2"
                    />
                    {{ product.name }}
                  </div>
                  <div class="flex min-w-[90px] flex-col items-end text-xs text-[var(--color-info)] dark:text-[var(--label-accent)]">
                    <div>
                      {{ formatCatalogQuantity(product.stockQuantity) }}
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
                <ProductLineImage
                  :item="product"
                  alt="icon"
                  class="mr-2"
                />
                {{ product.name }}
              </div>
              <div class="text-sm text-[var(--color-info)] dark:text-[var(--label-accent)]">
                {{ formatCatalogQuantity(product.stockQuantity) }}
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
        class="rounded-md border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--surface-muted))] p-2 dark:border-[color-mix(in_srgb,var(--color-warning)_45%,var(--border-subtle))] dark:bg-[color-mix(in_srgb,var(--color-warning)_18%,transparent)]"
      >
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle mr-2 text-[var(--color-warning)] dark:text-[var(--color-warning)]" />
          <span class="text-sm text-[var(--color-warning)] dark:text-[var(--color-warning)]">
            {{ $t('zeroQuantityProductsExcluded') }}
          </span>
        </div>
      </div>

      <div
        v-if="hasExceededStock"
        class="rounded-md border border-[color-mix(in_srgb,var(--color-warning)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--surface-muted))] p-2 dark:border-[color-mix(in_srgb,var(--color-warning)_45%,var(--border-subtle))] dark:bg-[color-mix(in_srgb,var(--color-warning)_18%,transparent)]"
      >
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle mr-2 text-[var(--color-warning)] dark:text-[var(--color-warning)]" />
          <span class="text-sm text-[var(--color-warning)] dark:text-[var(--color-warning)]">
            {{ $t('exceededStockWarning') }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="products.length > 0">
      <table class="product-search-table mb-6 w-full min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]">
        <thead class="rounded-t-sm bg-[var(--surface-muted)]">
          <tr>
            <th class="w-36 border border-[var(--border-subtle)] px-3 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('name') }}
            </th>
            <th class="w-72 app-table-head-cell-base">
              {{
                $t('quantityAndDimensions')
              }}
            </th>
            <th class="w-16 border border-[var(--border-subtle)] px-1.5 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('price') }}
            </th>
            <th class="w-8 border border-[var(--border-subtle)] px-2 py-2 text-center font-medium text-[var(--text-primary)]">
              ~
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(product, index) in products"
            :key="index"
            class="product-search-row border-b border-[var(--border-subtle)]"
          >
            <td class="border-x border-[var(--border-subtle)] px-3 py-2">
              <div class="flex items-center text-[var(--text-primary)]">
                <ProductLineImage
                  :item="product"
                  alt="icon"
                  class="mr-2"
                />
                {{ product.productName || product.name }}
              </div>
            </td>

            <td class="border-x border-[var(--border-subtle)] px-4 py-2">
              <div v-if="isSquareMeter(product)" class="flex items-center gap-2">
                <div class="sqm-inline-row min-w-0 flex-1">
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      :model-value="Number(getProductWidth(product)) || 0"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="setProductWidth(product, $event); calculateQuantity(product);"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">m</span>
                  </div>
                  <span class="sqm-inline-sep">×</span>
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      :model-value="Number(getProductLength(product)) || 0"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="setProductLength(product, $event); calculateQuantity(product);"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">m</span>
                  </div>
                  <span class="sqm-inline-sep">=</span>
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      :model-value="Number(product.quantity) || 0"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="onSquareQuantityInput(product, $event)"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">{{ product.unitShortName }}</span>
                  </div>
                </div>
                <span
                  v-if="!isService(product)"
                  class="shrink-0 text-xs whitespace-nowrap"
                  :class="getStockQuantityClass(product)"
                >
                  {{ $t('stockLeft') }}: {{ formatCatalogQuantity(product.stockQuantity || 0) }} {{ product.unitShortName }}
                </span>
              </div>
              <div v-else class="flex items-center gap-2">
                <div class="line-input-group line-input-group--with-unit min-w-0 flex-1">
                  <FormattedDecimalInput
                    v-model="product.quantity"
                    variant="quantity"
                    class="line-input-group__field"
                    :disabled="disabled"
                    min="0"
                    :placeholder="product.unitShortName ? '0' : '0'"
                  />
                  <span
                    v-if="product.unitShortName"
                    class="line-input-group__unit line-input-group__unit--static"
                  >
                    {{ product.unitShortName }}
                  </span>
                </div>
                <span
                  v-if="!isService(product)"
                  class="shrink-0 text-xs whitespace-nowrap"
                  :class="getStockQuantityClass(product)"
                >
                  {{ $t('stockLeft') }}: {{ formatCatalogQuantity(product.stockQuantity || 0) }} {{ product.unitShortName }}
                </span>
              </div>
            </td>

            <td class="border-x border-[var(--border-subtle)] px-1.5 py-2">
              <div class="line-input-group line-input-group--with-suffix">
                <span class="line-input-group__field text-right text-sm tabular-nums">
                  {{ $formatNumber(Number(product.price) || 0, true) }}
                </span>
                <span
                  v-if="lineCurrencyCode"
                  class="line-input-group__currency"
                >
                  {{ lineCurrencyCode }}
                </span>
              </div>
            </td>

            <td class="border-x border-[var(--border-subtle)] px-1 py-2 text-center align-middle">
              <button
                class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xl leading-none text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--surface-muted))] hover:text-[var(--color-danger-hover)] dark:text-[var(--color-danger)] dark:hover:bg-[color-mix(in_srgb,var(--color-danger)_22%,transparent)] dark:hover:text-[var(--color-danger)]"
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
import { formatQuantity, roundQuantityValue, roundValue } from '@/utils/numberUtils';
import { catalogToDocumentMultiplier } from '@/utils/catalogToDocumentMultiplier';
import { isSquareMeterUnit } from '@/utils/unitMeasureUtils';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import ProductLineImage from '@/views/components/app/ProductLineImage.vue';

export default {
    components: { CardViewEmptyState, ProductLineImage },
    props: {
        modelValue: {
            type: Array,
            default: () => [],
        },
        disabled: {
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
        amountRoundingScope: {
            type: String,
            default: 'order',
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
        defaultCurrencyCode() {
            const currencies = this.$store?.state?.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.code : '';
        },
        lineCurrencyCode() {
            if (this.documentCurrencyId) {
                const c = (this.$store?.state?.currencies || []).find(
                    (x) => Number(x.id) === Number(this.documentCurrencyId)
                );
                return c?.code || this.defaultCurrencyCode;
            }
            return this.defaultCurrencyCode;
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
                    const storeProducts = this.getAllProductsFromStore();
                    if (storeProducts.length > 0) {
                        this.productResults = this.filterProductsLocal(storeProducts, searchTerm).slice(0, 100);
                        this.productSearchLoading = false;
                        return;
                    }
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
        }, 1200);
    },
    methods: {
        reportUiError(error, fallbackKey = 'error') {
            const message = error?.message || String(error || '');
            this.$store.dispatch('showNotification', {
                title: this.$t(fallbackKey),
                subtitle: message,
                isDanger: true,
            });
        },
        getAllProductsFromStore() {
            const items = this.$store.getters.allProducts;
            return Array.isArray(items) ? items : [];
        },
        filterProductsLocal(products, searchTerm) {
            const query = String(searchTerm || '').trim().toLowerCase();
            if (!query) {
                return products;
            }
            return products.filter((product) => {
                const name = String(product?.name || '').toLowerCase();
                const code = String(product?.code || product?.article || '').toLowerCase();
                const unit = String(product?.unitShortName || '').toLowerCase();
                return name.includes(query) || code.includes(query) || unit.includes(query);
            });
        },
        async fetchLastProducts() {
            try {
                let allProducts = this.getAllProductsFromStore();
                if (allProducts.length === 0) {
                    await this.$store.dispatch('loadAllProducts');
                    allProducts = this.getAllProductsFromStore();
                }

                if (allProducts.length === 0) {
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
                        productDto.price = roundValue(wholesale * mult, this.amountRoundingScope);
                    } else {
                        productDto.price = roundValue(retail * mult, this.amountRoundingScope);
                    }
                    productDto.type = product.type || 1;
                    productDto.stockQuantity = product.stockQuantity || 0;

                     const unitShortName = productDto.unitShortName ;
                    const isSquareMeter = isSquareMeterUnit(unitShortName);


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
            } catch (error) {
                this.reportUiError(error);
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
                        productDto.price = roundValue(wholesale * mult, this.amountRoundingScope);
                    } else {
                        productDto.price = roundValue(retail * mult, this.amountRoundingScope);
                    }
                    productDto.type = service.type || 0;
                    productDto.stockQuantity = service.stockQuantity || 0;

                    const unitShortName = productDto.unitShortName ;
                    const isSquareMeter = isSquareMeterUnit(unitShortName);


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
            } catch (error) {
                this.reportUiError(error);
            }
        },
        formatCatalogQuantity(value) {
            return formatQuantity(value);
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
        getBalancedSquareDimensions(quantityValue) {
            const quantity = Number(quantityValue) || 0;
            if (quantity <= 0) {
                return { width: 0, length: 0 };
            }

            const roundedInt = Math.round(quantity);
            if (Math.abs(quantity - roundedInt) < 1e-9) {
                const root = Math.floor(Math.sqrt(roundedInt));
                for (let divisor = root; divisor >= 1; divisor -= 1) {
                    if (roundedInt % divisor === 0) {
                        const width = roundQuantityValue(roundedInt / divisor);
                        const length = roundQuantityValue(divisor);
                        return { width, length };
                    }
                }
            }

            const width = roundQuantityValue(Math.sqrt(quantity));
            const safeWidth = width > 0 ? width : 1;
            const length = roundQuantityValue(quantity / safeWidth);
            return {
                width: safeWidth,
                length: length > 0 ? length : 1,
            };
        },
        onSquareQuantityInput(product, value) {
            const targetQuantity = roundQuantityValue(Number(value) || 0);
            product.quantity = targetQuantity;

            if (targetQuantity <= 0) {
                this.setProductWidth(product, 0);
                this.setProductLength(product, 0);
                return;
            }

            const balanced = this.getBalancedSquareDimensions(targetQuantity);
            this.setProductWidth(product, balanced.width);
            this.setProductLength(product, balanced.length);
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
            return isSquareMeterUnit(unitShortName);
        },

        getStockQuantityClass(product) {
            if (this.isService(product)) {
                return 'text-[var(--text-secondary)]';
            }

            const stockQuantity = product.stockQuantity || 0;
            const orderQuantity = product.quantity || 0;

            if (stockQuantity === 0) {
                return 'font-medium text-[var(--color-danger)] dark:text-[var(--color-danger)]';
            } else if (orderQuantity > stockQuantity) {
                return 'font-medium text-[var(--color-warning)] dark:text-[var(--color-warning)]';
            } else if (stockQuantity <= 5) {
                return 'font-medium text-[var(--color-warning)] dark:text-[var(--color-warning)]';
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

.sqm-inline-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1.2fr);
    align-items: center;
    gap: 0.25rem;
}

.sqm-inline-sep {
    font-size: 0.6875rem;
    line-height: 1;
    color: var(--text-secondary);
    opacity: 0.9;
}

@media (max-width: 900px) {
    .sqm-inline-row {
        grid-template-columns: minmax(0, 0.95fr) auto minmax(0, 0.95fr) auto minmax(0, 1.1fr);
        gap: 0.2rem;
    }
    .sqm-inline-sep {
        font-size: 0.625rem;
    }
}
</style>
