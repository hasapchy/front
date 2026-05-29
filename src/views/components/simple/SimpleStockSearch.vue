<template>
  <div class="space-y-4">
    <div class="relative">
      <label class="mb-1 block font-medium text-[var(--text-primary)]">{{ $t('stocks') }}</label>
      <input
        ref="stockInput"
        v-model="stockSearch"
        type="text"
        :placeholder="$t('enterProductNameOrCode')"
        class="w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] p-2 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--nav-accent)]/35"
        :disabled="disabled"
        @focus="onFocus"
        @blur="handleStockBlur"
      >

      <transition name="appear">
        <ul
          v-show="showStockDropdown"
          class="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded border border-[var(--input-border)] bg-[var(--surface-elevated)] shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
        >
          <li
            v-if="stockSearchLoading"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t('loading') }}
          </li>
          <li
            v-else-if="stockDropdownHintKey"
            class="p-2 text-[var(--text-secondary)]"
          >
            {{ $t(stockDropdownHintKey) }}
          </li>
          <template v-else>
            <li
              v-for="product in stockDropdownList"
              :key="product.id"
              class="cursor-pointer border-b border-[var(--border-subtle)] p-2 text-[var(--text-primary)] hover:bg-[var(--surface-muted)]"
              @mousedown.prevent="selectStock(product)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <ProductLineImage
                    :item="product"
                    alt="icon"
                    class="mr-2"
                  />
                  {{ product.name }}
                </div>
                <div class="flex items-center text-xs text-emerald-700 dark:text-emerald-400">
                  <i class="fas fa-infinity mr-1" />
                  <span>{{ $t('unlimited') }}</span>
                </div>
              </div>
            </li>
          </template>
        </ul>
      </transition>
    </div>

    <div>
      <label class="mb-1 mt-4 block font-medium text-[var(--text-primary)]">{{ $t('selectedStock') }}</label>
      <CardViewEmptyState
        v-if="!stockItems.length"
        class="mb-6"
      />
      <table
        v-else
        class="product-search-table mb-6 w-full min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
      >
        <thead class="rounded-t-sm bg-[var(--surface-muted)]">
          <tr>
            <th class="w-36 border border-[var(--border-subtle)] px-3 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('name') }}
            </th>
            <th
              v-if="showQuantity"
              class="w-72 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]"
            >
              {{ $t('quantityAndDimensions') }}
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
            v-for="(item, index) in stockItems"
            :key="index"
            class="product-search-row border-b border-[var(--border-subtle)]"
          >
            <td class="border-x border-[var(--border-subtle)] px-3 py-2 text-[var(--text-primary)]">
              <div class="flex items-center">
                <ProductLineImage
                  :item="item"
                  alt="icon"
                  class="mr-2"
                />
                {{ item.name }}
              </div>
            </td>
            <td
              v-if="showQuantity"
              class="border-x border-[var(--border-subtle)] px-4 py-2"
            >
              <div v-if="isSquareMeter(item)">
                <div class="sqm-inline-row">
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      v-model="item.width"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="calculateQuantity(item)"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">m</span>
                  </div>
                  <span class="sqm-inline-sep">×</span>
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      v-model="item.height"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="calculateQuantity(item)"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">m</span>
                  </div>
                  <span class="sqm-inline-sep">=</span>
                  <div class="line-input-group line-input-group--with-unit min-w-0">
                    <FormattedDecimalInput
                      :model-value="Number(item.quantity) || 0"
                      variant="quantity"
                      class="line-input-group__field"
                      :disabled="disabled"
                      min="0"
                      placeholder="0"
                      @update:model-value="onSquareQuantityInput(item, $event)"
                    />
                    <span class="line-input-group__unit line-input-group__unit--static">{{ item.unitShortName }}</span>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="line-input-group line-input-group--with-unit">
                  <FormattedDecimalInput
                    v-model="item.quantity"
                    variant="quantity"
                    class="line-input-group__field"
                    :disabled="disabled"
                    min="0"
                    placeholder="0"
                  />
                  <span
                    v-if="item.unitShortName"
                    class="line-input-group__unit line-input-group__unit--static"
                  >
                    {{ item.unitShortName }}
                  </span>
                </div>
              </div>
            </td>
            <td class="border-x border-[var(--border-subtle)] px-1.5 py-2">
              <div class="line-input-group line-input-group--with-suffix">
                <span class="line-input-group__field text-right text-sm tabular-nums">
                  {{ $formatNumber(Number(item.price) || 0, true) }}
                </span>
                <span
                  v-if="defaultCurrencySymbol"
                  class="line-input-group__currency"
                >
                  {{ defaultCurrencySymbol }}
                </span>
              </div>
            </td>
            <td class="border-x border-[var(--border-subtle)] px-1 py-2 text-center align-middle">
              <button
                class="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-xl leading-none text-red-600 hover:bg-red-50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                :disabled="disabled"
                @click="removeStock(index)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import { formatQuantity, roundQuantityValue } from '@/utils/numberUtils';
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
        showQuantity: {
            type: Boolean,
            default: true,
        },
        projectId: {
            type: [String, Number],
            default: null
        },
    },
    emits: ['update:modelValue'],
    data() {
        return {
            stockSearch: '',
            stockSearchLoading: false,
            stockResults: [],
            lastProducts: [],
            showStockDropdown: false,
        };
    },
    computed: {
        stockItems: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            },
        },
        stockDropdownHintKey() {
            if (this.stockSearchLoading) {
                return null;
            }
            if (this.stockSearch.length === 0 && (!this.lastProducts || this.lastProducts.length === 0)) {
                return 'noData';
            }
            if (this.stockSearch.length > 0 && this.stockSearch.length < 3) {
                return 'minimum3Characters';
            }
            if (this.stockSearch.length >= 3 && this.stockResults.length === 0) {
                return 'notFound';
            }
            return null;
        },
        stockDropdownList() {
            if (this.stockDropdownHintKey) {
                return [];
            }
            if (this.stockSearch.length === 0) {
                return this.lastProducts || [];
            }
            return this.stockResults;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store?.state?.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : '';
        },
    },
    watch: {
        stockSearch: {
            handler: 'searchStock',
            immediate: true,
        },
    },
    async created() {
        await this.fetchLastProducts();
    },
    methods: {
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
                return name.includes(query) || code.includes(query);
            });
        },
        formatCatalogQuantity(value) {
            return formatQuantity(value);
        },
        async onFocus() {
            this.showStockDropdown = true;
            if (this.lastProducts.length === 0) {
                await this.fetchLastProducts();
            }
        },
        async fetchLastProducts() {
            try {
                let products = this.getAllProductsFromStore();
                if (products.length === 0) {
                    await this.$store.dispatch('loadAllProducts');
                    products = this.getAllProductsFromStore();
                }
                if (products.length === 0) {
                    const prodPage = await ProductController.getItems(1, true);
                    products = prodPage.items || [];
                }

                this.lastProducts = products
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 10);
            } catch {
                this.lastProducts = [];
            }
        },
        searchStock: debounce(async function () {
            if (this.stockSearch.length < 3) {
                this.stockResults = [];
                this.stockSearchLoading = false;
                return;
            }
            this.stockSearchLoading = true;
            try {
                const storeProducts = this.getAllProductsFromStore();
                if (storeProducts.length > 0) {
                    this.stockResults = this.filterProductsLocal(storeProducts, this.stockSearch).slice(0, 100);
                    return;
                }
                const { items } = await ProductController.search(this.stockSearch);
                this.stockResults = items;
            } catch {
                this.stockResults = [];
            } finally {
                this.stockSearchLoading = false;
            }
        }, 250),
        selectStock(product) {
            this.showStockDropdown = false;
            this.stockSearch = '';
            this.stockResults = [];

            const unitShortName = String(product.unitShortName || '').trim();
            const wholesalePrice = product.wholesalePrice;
            const retailPrice = product.retailPrice;
            const price =
                this.projectId && wholesalePrice > 0 ? (wholesalePrice || 0) : (retailPrice || 0);

            const tempProduct = {
                name: product.name,
                description: product.description,
                price,
                unitId: product.unitId,
                unitShortName,
                unitName: String(product.unitName || '').trim(),
                isTempProduct: true,
                image: product.image ?? product.productImage,
                icons: product.icons ? product.icons.bind(product) : null,
                type: product.type || 1,
                width: 0,
                height: 0,
                quantity: 0
            };

            this.stockItems = [...this.stockItems, tempProduct];
            this.$refs.stockInput.blur();
        },
        removeStock(index) {
            this.stockItems = this.stockItems.filter((_, i) => i !== index);
        },
        handleStockBlur() {
            requestAnimationFrame(() => {
                this.showStockDropdown = false;
            });
        },
        isSquareMeter(item) {
            if (!item) return false;
            const unitShortName = String(item.unitShortName || '').trim();
            return isSquareMeterUnit(unitShortName);
        },
        calculateQuantity(item) {
            if (!this.isSquareMeter(item)) {
                return;
            }

            const width = Number(item.width) || 0;
            const height = Number(item.height) || 0;

            if (!width || !height || width <= 0 || height <= 0) {
                item.quantity = 0;
                return;
            }

            if (isNaN(width) || isNaN(height)) {
                item.quantity = 0;
                return;
            }

            const rawQuantity = width * height;
            item.quantity = roundQuantityValue(rawQuantity);
        },
        getBalancedSquareDimensions(quantityValue) {
            const quantity = Number(quantityValue) || 0;
            if (quantity <= 0) {
                return { width: 0, height: 0 };
            }

            const roundedInt = Math.round(quantity);
            if (Math.abs(quantity - roundedInt) < 1e-9) {
                const root = Math.floor(Math.sqrt(roundedInt));
                for (let divisor = root; divisor >= 1; divisor -= 1) {
                    if (roundedInt % divisor === 0) {
                        const width = roundQuantityValue(roundedInt / divisor);
                        const height = roundQuantityValue(divisor);
                        return { width, height };
                    }
                }
            }

            const width = roundQuantityValue(Math.sqrt(quantity));
            const safeWidth = width > 0 ? width : 1;
            const height = roundQuantityValue(quantity / safeWidth);
            return {
                width: safeWidth,
                height: height > 0 ? height : 1,
            };
        },
        onSquareQuantityInput(item, value) {
            const targetQuantity = roundQuantityValue(Number(value) || 0);
            item.quantity = targetQuantity;

            if (targetQuantity <= 0) {
                item.width = 0;
                item.height = 0;
                return;
            }

            const balanced = this.getBalancedSquareDimensions(targetQuantity);
            item.width = balanced.width;
            item.height = balanced.height;
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
