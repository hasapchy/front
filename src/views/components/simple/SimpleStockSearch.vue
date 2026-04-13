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
        class="mb-6 w-full min-w-full rounded bg-[var(--surface-elevated)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
      >
        <thead class="rounded-t-sm bg-[var(--surface-muted)]">
          <tr>
            <th class="w-48 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]">
              {{ $t('name') }}
            </th>
            <th
              v-if="showQuantity"
              class="w-32 border border-[var(--border-subtle)] px-4 py-2 text-left font-medium text-[var(--text-primary)]"
            >
              {{ $t('quantityAndDimensions') }}
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
            v-for="(item, index) in stockItems"
            :key="index"
            class="border-b border-[var(--border-subtle)]"
          >
            <td class="border-x border-[var(--border-subtle)] px-4 py-2 text-[var(--text-primary)]">
              <div class="flex items-center">
                <div class="mr-2 flex h-7 w-7 items-center justify-center">
                  <img
                    v-if="item.imgUrl && item.imgUrl()"
                    :src="item.imgUrl()"
                    alt="icon"
                    class="w-7 h-7 object-cover rounded"
                    loading="lazy"
                  >
                  <span
                    v-else
                    v-html="item.icons ? item.icons() : getDefaultIcon(item)"
                  />
                </div>
                {{ item.name }}
              </div>
            </td>
            <td
              v-if="showQuantity"
              class="border-x border-[var(--border-subtle)] px-4 py-2"
            >
              <div
                v-if="isSquareMeter(item)"
                class="space-y-2"
              >
                <div class="flex items-center space-x-2">
                  <span class="w-16 text-xs text-[var(--text-secondary)]">{{ $t('width') }}:</span>
                  <FormattedDecimalInput
                    v-model="item.width"
                    variant="quantity"
                    class="flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-sm text-[var(--text-primary)]"
                    :disabled="disabled"
                    min="0"
                    placeholder="0"
                    @update:model-value="calculateQuantity(item)"
                  />
                  <span class="text-xs text-[var(--text-secondary)]">m</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="w-16 text-xs text-[var(--text-secondary)]">{{ $t('length') }}:</span>
                  <FormattedDecimalInput
                    v-model="item.height"
                    variant="quantity"
                    class="flex-1 rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-sm text-[var(--text-primary)]"
                    :disabled="disabled"
                    min="0"
                    placeholder="0"
                    @update:model-value="calculateQuantity(item)"
                  />
                  <span class="text-xs text-[var(--text-secondary)]">m</span>
                </div>
                <div class="rounded bg-[var(--surface-muted)] p-1 text-right text-sm font-medium text-[var(--text-primary)]">
                  = {{ item.quantity || 0 }} {{ item.unitShortName }}
                </div>
              </div>
              <div v-else>
                <FormattedDecimalInput
                  v-model="item.quantity"
                  variant="quantity"
                  class="w-full rounded border border-[var(--input-border)] bg-[var(--input-bg)] p-1 text-right text-[var(--text-primary)]"
                  :disabled="disabled"
                  min="0"
                  placeholder="0"
                />
              </div>
            </td>
            <td class="border-x border-[var(--border-subtle)] px-4 py-2">
              <div class="w-full rounded border border-[var(--input-border)] bg-[var(--surface-muted)] p-1 text-right text-sm text-[var(--text-primary)]">
                {{ $formatNumber(Number(item.price) || 0, null, true) }}
              </div>
            </td>
            <td class="border-x border-[var(--border-subtle)] px-4">
              <button
                class="cursor-pointer text-2xl text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
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
import { roundQuantityValue } from '@/utils/numberUtils';
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
        async onFocus() {
            this.showStockDropdown = true;
            if (this.lastProducts.length === 0) {
                await this.fetchLastProducts();
            }
        },
        async fetchLastProducts() {
            try {
                const prodPage = await ProductController.getItems(1, true);
                let products = prodPage.items || [];

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
                imgUrl: product.imgUrl ? product.imgUrl.bind(product) : null,
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
        getDefaultIcon(item) {
            const isProduct = item.type == 1;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
        },

        isSquareMeter(item) {
            if (!item) return false;
            const unitShortName = String(item.unitShortName || '').trim();
            return this.isSquareMeterShortName(unitShortName);
        },
        isSquareMeterShortName(unitShortNameRaw) {
            const s = String(unitShortNameRaw).trim().toLowerCase();
            return s === 'м²' || s === 'м2' || s === 'm²' || s === 'm2';
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
</style>
