<template>
  <div class="space-y-4">
    <div class="relative">
      <label class="block mb-1 font-medium text-gray-700">{{ $t('stocks') }}</label>
      <input
        ref="stockInput"
        v-model="stockSearch"
        type="text"
        :placeholder="$t('enterProductNameOrCode')"
        class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        :disabled="disabled"
        @focus="onFocus"
        @blur="handleStockBlur"
      >

      <transition name="appear">
        <ul
          v-show="showStockDropdown"
          class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-50"
        >
          <li
            v-if="stockSearchLoading"
            class="p-2 text-gray-500"
          >
            {{ $t('loading') }}
          </li>
          <template v-else-if="stockSearch.length === 0">
            <li
              v-if="!lastProducts || lastProducts.length === 0"
              class="p-2 text-gray-500"
            >
              {{ $t('noData')
              }}
            </li>
            <li
              v-for="product in lastProducts"
              v-else
              :key="product.id"
              class="cursor-pointer p-2 border-b border-gray-300 hover:bg-gray-100"
              @mousedown.prevent="selectStock(product)"
            >
              <div class="flex justify-between items-center">
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
                <div class="text-green-600 text-xs flex items-center">
                  <i class="fas fa-infinity mr-1" />
                  <span>{{ $t('unlimited') }}</span>
                </div>
              </div>
            </li>
          </template>
          <li
            v-else-if="stockSearch.length < 3"
            class="p-2 text-gray-500"
          >
            {{ $t('minimum3Characters') }}
          </li>
          <li
            v-else-if="stockResults.length === 0"
            class="p-2 text-gray-500"
          >
            {{ $t('notFound') }}
          </li>
          <li
            v-for="product in stockResults"
            v-else
            :key="product.id"
            class="cursor-pointer p-2 border-b border-gray-300 hover:bg-gray-100"
            @mousedown.prevent="selectStock(product)"
          >
            <div class="flex justify-between items-center">
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
              <div class="text-green-600 text-xs flex items-center">
                <i class="fas fa-infinity mr-1" />
                <span>{{ $t('unlimited') }}</span>
              </div>
            </div>
          </li>
        </ul>
      </transition>
    </div>

    <div v-if="stockItems.length > 0">
      <label class="block mt-4 mb-1">{{ $t('selectedStock') }}</label>
      <table class="min-w-full bg-white shadow-md rounded mb-6 w-full">
        <thead class="bg-gray-100 rounded-t-sm">
          <tr>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
              {{ $t('name') }}
            </th>
            <th
              v-if="showQuantity"
              class="text-left border border-gray-300 py-2 px-4 font-medium w-32"
            >
              {{ $t('quantityAndDimensions') }}
            </th>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
              {{ $t('price') }}
            </th>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">
              ~
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(item, index) in stockItems"
            :key="index"
            class="border-b border-gray-300"
          >
            <td class="py-2 px-4 border-x border-gray-300">
              <div class="flex items-center">
                <div class="w-7 h-7 flex items-center justify-center mr-2">
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
              class="py-2 px-4 border-x border-gray-300"
            >
              <div
                v-if="isSquareMeter(item)"
                class="space-y-2"
              >
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-600 w-16">{{ $t('width') }}:</span>
                  <input
                    v-model.number="item.width"
                    type="number"
                    class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                    :disabled="disabled"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    @input="calculateQuantity(item)"
                  >
                  <span class="text-xs text-gray-600">m</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-600 w-16">{{ $t('length') }}:</span>
                  <input
                    v-model.number="item.height"
                    type="number"
                    class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                    :disabled="disabled"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    @input="calculateQuantity(item)"
                  >
                  <span class="text-xs text-gray-600">m</span>
                </div>
                <div class="text-right text-sm font-medium bg-gray-100 p-1 rounded">
                  = {{ item.quantity || 0 }} {{ item.unitShortName }}
                </div>
              </div>
              <div v-else>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  class="w-full p-1 text-right border border-gray-300 rounded"
                  :disabled="disabled"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  @blur="roundQuantity(item)"
                >
              </div>
            </td>
            <td class="py-2 px-4 border-x border-gray-300">
              <div class="w-full p-1 text-right bg-gray-50 border border-gray-300 rounded text-sm">
                {{ (Number(item.price) || 0).toFixed(2) }}
              </div>
            </td>
            <td class="px-4 border-x border-gray-300">
              <button
                class="text-red-500 text-2xl cursor-pointer"
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

export default {
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
            if (this.stockSearch.length >= 3) {
                this.stockSearchLoading = true;
                try {
                    const { items } = await ProductController.search(this.stockSearch);
                    this.stockResults = items;
                    this.stockSearchLoading = false;
                } catch {
                    this.stockResults = [];
                    this.stockSearchLoading = false;
                }
            } else {
                this.stockResults = [];
            }
        }, 250),
        selectStock(product) {
            try {
                this.showStockDropdown = false;
                this.stockSearch = '';
                this.stockResults = [];

                const unitShortName = (product.unitShortName ).trim();

                let price;
                const wholesalePrice = product.wholesalePrice;
                const retailPrice = product.retailPrice;

                if (this.projectId && wholesalePrice > 0) {
                    price = wholesalePrice || 0;
                } else {
                    price = retailPrice || 0;
                }

                const tempProduct = {
                    name: product.name,
                    description: product.description ,
                    price: price,
                    unitId: product.unitId,
                    unitShortName: unitShortName,
                    unitName: (product.unitName ).trim(),
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
            } catch {
                void 0;
            }
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
            const unitShortName = (item.unitShortName ).trim();
            return this.isSquareMeterShortName(unitShortName);
        },
        isSquareMeterShortName(unitShortNameRaw) {
            const s = String(unitShortNameRaw ).trim().toLowerCase();
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
        roundQuantity(item) {
            if (item && item.quantity !== null && item.quantity !== undefined) {
                const num = Number(item.quantity);
                if (!isNaN(num)) {
                    item.quantity = roundQuantityValue(num);
                }
            }
        },
    },
    watch: {
        stockSearch: {
            handler: 'searchStock',
            immediate: true,
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
