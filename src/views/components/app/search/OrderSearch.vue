<template>
  <div class="relative">
    <label
      v-if="!readonly"
      class="block mb-1"
      :class="{ 'required': required }"
    >{{ $t('searchOrders') }}</label>
    <input
      v-if="!readonly"
      ref="orderInput"
      v-model="orderSearch"
      type="text"
      :placeholder="$t('enterOrderNumberOrClient')"
      class="w-full p-2 border rounded"
      :disabled="disabled"
      @focus="showDropdown = true"
      @blur="handleBlur"
    >
    <transition name="appear">
      <ul
        v-show="showDropdown && !readonly"
        class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10"
      >
        <li
          v-if="orderSearchLoading"
          class="p-2 text-gray-500"
        >
          {{ $t('loading') }}
        </li>
        <li
          v-else-if="orderSearch.length < 3"
          class="p-2 text-gray-500"
        >
          {{ $t('minimum3Characters') }}
        </li>
        <li
          v-else-if="orderResults.length === 0"
          class="p-2 text-gray-500"
        >
          {{ $t('notFound') }}
        </li>
        <li
          v-for="order in orderResults"
          v-else
          :key="order.id"
          class="cursor-pointer border-b border-gray-300 p-2 hover:bg-gray-100 dark:border-[var(--border-subtle)] dark:hover:bg-[var(--surface-muted)]"
          @mousedown.prevent="selectOrder(order)"
        >
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <div class="w-7 h-7 flex items-center justify-center mr-2">
                <i class="fas fa-shopping-cart text-[#3571A4]" />
              </div>
              <div>
                <div class="font-medium">
                  #{{ order.id }} - {{ getClientDisplayName(order.client) || $t('noClient') }}
                </div>
                <div
                  v-if="getClientDisplayPosition(order.client)"
                  class="text-xs text-gray-500"
                >
                  {{ getClientDisplayPosition(order.client) }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ order.formatDate() }}
                </div>
              </div>
            </div>
            <div class="text-[#337AB7] text-sm">
              <div class="font-medium">
                {{ order.priceInfo() }}
              </div>
              <div class="text-sm text-gray-500">
                {{ order.statusName }}
              </div>
            </div>
          </div>
        </li>
      </ul>
    </transition>

    <label class="block mt-4 mb-1">{{ $t('selectedOrders') }}</label>
    <CardViewEmptyState
      v-if="!selectedOrders.length"
      class="mb-6"
    />
    <table
      v-else
      class="min-w-full bg-white shadow-md rounded mb-6 w-100"
    >
      <thead class="bg-gray-100 rounded-t-sm">
        <tr>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-32">
            {{ $t('orderNumber') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium">
            {{ $t('client') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-40">
            {{ $t('date') }}
          </th>
          <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
            {{ $t('total') }}
          </th>
          <th
            v-if="!readonly"
            class="text-left border border-gray-300 py-2 px-4 font-medium w-12"
          >
            ~
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(order, index) in selectedOrders"
          :key="index"
          class="border-b border-gray-300"
        >
          <td class="py-2 px-4 border-x border-gray-300">
            <div class="flex items-center">
              <div class="w-7 h-7 flex items-center justify-center mr-2">
                <i class="fas fa-shopping-cart text-[#3571A4]" />
              </div>
              <span
                class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                @click="handleOrderClick(order)"
              >
                #{{ order.id }}
              </span>
            </div>
          </td>
          <td class="py-2 px-4 border-x border-gray-300">
            <div>{{ getClientDisplayName(order.client || fallbackClient) || $t('noClient') }}</div>
            <div
              v-if="getClientDisplayPosition(order.client || fallbackClient)"
              class="text-xs text-gray-500"
            >
              {{ getClientDisplayPosition(order.client || fallbackClient) }}
            </div>
          </td>
          <td class="py-2 px-4 border-x border-gray-300">
            {{ order.date ? order.formatDate() : $t('notSpecified') }}
          </td>
          <td class="py-2 px-4 border-x border-gray-300">
            {{ order.priceInfo() }}
          </td>
          <td
            v-if="!readonly"
            class="px-4 border-x border-gray-300"
          >
            <button
              class="text-red-500 text-2xl cursor-pointer z-50"
              :disabled="disabled"
              @click="removeSelectedOrder(order.id)"
            >
              ×
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="selectedOrders.length > 0"
      class="mt-4"
    >
      <label class="block mb-1">{{ $t('productsAndServicesFromOrders') }}</label>
      <CardViewEmptyState
        v-if="!allProductsFromOrders.length"
        class="mb-6"
      />
      <table
        v-else
        class="min-w-full bg-white shadow-md rounded mb-6 w-100"
      >
        <thead class="bg-gray-100 rounded-t-sm">
          <tr>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium">
              {{ $t('name') }}
            </th>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
              {{ $t('quantity') }}
            </th>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
              {{ $t('price') }}
            </th>
            <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
              {{ $t('orderNumber') }}
            </th>
            <th
              v-if="!readonly"
              class="text-left border border-gray-300 py-2 px-4 font-medium w-12"
            >
              ~
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(product, index) in allProductsFromOrders"
            :key="index"
            class="border-b border-gray-300"
          >
            <td class="py-2 px-4 border-x border-gray-300">
              <div class="flex items-center">
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
            <td class="py-2 px-4 border-x border-gray-300">
              <FormattedDecimalInput
                v-if="!readonly"
                v-model="product.quantity"
                variant="quantity"
                class="w-full p-1 text-right"
                :disabled="disabled"
                min="0.01"
                @update:model-value="onProductFieldInput(product)"
              />
              <span v-else>{{ product.quantity }} {{ getUnitShortName(product.unitId) }}</span>
            </td>
            <td class="py-2 px-4 border-x border-gray-300">
              <div class="flex items-center space-x-2">
                <FormattedDecimalInput
                  v-if="!readonly"
                  v-model="product.price"
                  variant="amount"
                  class="w-full p-1 text-right"
                  :disabled="disabled"
                  min="0.01"
                  @update:model-value="onProductFieldInput(product)"
                />
                <span v-else>{{ product.price }} {{ currencySymbol || defaultCurrencySymbol }}</span>
              </div>
            </td>
            <td class="py-2 px-4 border-x border-gray-300">
              <template v-if="product.orderId && product.orderId !== 'N/A'">
                #{{ product.orderId }}
              </template>
              <template v-else>
                <span class="text-gray-400">{{ $t('notSpecified') }}</span>
              </template>
            </td>
            <td
              v-if="!readonly"
              class="px-4 border-x border-gray-300"
            >
              <button
                class="text-red-500 text-2xl cursor-pointer z-50"
                :disabled="disabled"
                @click="removeProductLine(product)"
              >
                ×
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="allProductsFromOrders.length">
          <tr class="bg-gray-50 font-medium">
            <td
              :colspan="3"
              class="py-2 px-4 text-right"
            >
              {{ $t('subtotal') }}
            </td>
            <td class="py-2 px-4 text-right">
              {{ $formatNumber(subtotal, null, true) }} <span class="ml-1">{{ currencySymbol || defaultCurrencySymbol }}</span>
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script>
import OrderController from "@/api/OrderController";
import InvoiceController from "@/api/InvoiceController";
import debounce from 'lodash.debounce';
import { getClientDisplayName as getClientName, getClientDisplayPosition as getClientPos } from '@/utils/displayUtils';
import {
    createOrderSearchLineFromApiRow,
    invoiceLineExcludeKey,
    invoiceLineExcludeKeyFromLine,
    sortedOrderIdsKey,
    sumInvoiceLineTotals
} from '@/utils/invoiceOrderLinesUtils';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';

export default {
    components: { CardViewEmptyState },
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        required: {
            type: Boolean,
            default: false
        },
        currencySymbol: {
            type: String,
            default: ''
        },
        readonly: {
            type: Boolean,
            default: false
        },
        fallbackClient: {
            type: Object,
            default: null
        }
    },
    emits: ['update:modelValue', 'update:subtotal', 'change', 'order-click'],
    data() {
        return {
            orderSearch: '',
            orderSearchLoading: false,
            orderResults: [],
            searchAbortController: null,
            showDropdown: false,
            selectedOrders: [],
            allProductsFromOrders: [],
            excludedLineKeys: new Set(),
            lastInvoiceSyncOrderIdsKey: '',
            invoiceProductsRequestId: 0
        };
    },
    created() {
        this.scheduleInvoiceProductsSyncImpl = debounce(() => {
            this.syncProductsFromInvoiceApi();
        }, 300);
    },
    computed: {
        subtotal() {
            return sumInvoiceLineTotals(this.allProductsFromOrders);
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.symbol : this.$t('noCurrency');
        }
    },
    watch: {
        modelValue: {
            handler(newVal) {
                const next = Array.isArray(newVal) ? [...newVal] : [];
                if (sortedOrderIdsKey(next) !== sortedOrderIdsKey(this.selectedOrders)) {
                    this.selectedOrders = next;
                }
            },
            immediate: true
        },
        selectedOrders: {
            handler(newVal) {
                this.$emit('update:modelValue', newVal);
                this.$emit('change', newVal);
                const idsKey = sortedOrderIdsKey(newVal);
                if (idsKey !== this.lastInvoiceSyncOrderIdsKey) {
                    this.excludedLineKeys = new Set();
                    this.lastInvoiceSyncOrderIdsKey = idsKey;
                }
                this.scheduleInvoiceProductsSyncImpl();
            }
        },
        orderSearch: {
            handler: 'searchOrders',
            immediate: true
        }
    },
    methods: {
        getClientDisplayName(client) {
            return getClientName(client);
        },
        getClientDisplayPosition(client) {
            return getClientPos(client);
        },
        searchOrders: debounce(async function () {
            if (this.orderSearch.length >= 3) {
                if (this.searchAbortController) {
                    this.searchAbortController.abort();
                }
                this.searchAbortController = new AbortController();
                const signal = this.searchAbortController.signal;
                this.orderSearchLoading = true;
                try {
                    const response = await OrderController.getItems(1, this.orderSearch, 'all_time', null, null, '', '', '', '', 20, false, signal);
                    if (signal.aborted) return;
                    this.orderResults = response.items;
                } catch (error) {
                    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') return;
                    this.orderResults = [];
                } finally {
                    if (!signal.aborted) this.orderSearchLoading = false;
                }
            } else {
                this.orderResults = [];
            }
        }, 300),

        async selectOrder(order) {
            try {
                this.showDropdown = false;
                this.orderSearch = '';
                this.orderResults = [];

                const existing = this.selectedOrders.find(o => o.id === order.id);
                if (!existing) {
                    const fullOrder = await OrderController.getItem(order.id);
                    this.selectedOrders = [...this.selectedOrders, fullOrder];
                }
                this.$refs.orderInput.blur();
            } catch (error) {
                console.error('Error selecting order:', error);
            }
        },

        removeSelectedOrder(orderId) {
            this.selectedOrders = this.selectedOrders.filter(o => o.id !== orderId);
        },

        async syncProductsFromInvoiceApi() {
            if (this.readonly) {
                return;
            }
            const ids = this.selectedOrders.map((o) => o.id).filter(Boolean);
            if (!ids.length) {
                this.allProductsFromOrders = [];
                this.updateTotals();
                return;
            }
            const reqId = ++this.invoiceProductsRequestId;
            try {
                const data = await InvoiceController.getOrdersForInvoice(ids);
                if (reqId !== this.invoiceProductsRequestId) {
                    return;
                }
                const rows = data.products || [];
                const mapped = rows
                    .map((row, idx) => createOrderSearchLineFromApiRow(row, idx))
                    .filter((p) => !this.excludedLineKeys.has(p.excludeKey));
                this.allProductsFromOrders = mapped;
                this.updateTotals();
            } catch (error) {
                console.error(error);
                if (reqId !== this.invoiceProductsRequestId) {
                    return;
                }
                this.allProductsFromOrders = [];
                this.updateTotals();
            }
        },

        removeProductLine(product) {
            this.excludedLineKeys.add(product.excludeKey ?? invoiceLineExcludeKeyFromLine(product));
            this.allProductsFromOrders = this.allProductsFromOrders.filter((p) => p !== product);
            this.updateTotals();
        },

        onProductFieldInput(product) {
            const q = Number(product.quantity) || 0;
            const pr = Number(product.price) || 0;
            product.totalPrice = q * pr;
            product.excludeKey = invoiceLineExcludeKey({
                orderId: product.orderId,
                productId: product.productId,
                productName: product.productName,
                quantity: q,
                price: pr,
                totalPrice: product.totalPrice
            });
            this.updateTotals();
        },

        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        },

        updateTotals() {
            this.$nextTick(() => {
                this.$emit('update:subtotal', this.subtotal);
            });
        },

        getDefaultIcon(product) {
            const isProduct = product.type == 1;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]"></i>';
        },

        getUnitShortName(unitId) {
            if (!unitId) return '';
            return this.$store.getters.getUnitShortName(unitId);
        },

        handleOrderClick(order) {
            this.$emit('order-click', order);
        },

        setProductsFromInvoice(products) {
            if (!products || !Array.isArray(products)) {
                return;
            }

            const formattedProducts = products.map(product => {
                const quantity = parseFloat(product.quantity || 0);
                const price = parseFloat(product.price || 0);
                const totalPrice = product.totalPrice != null && product.totalPrice !== ''
                    ? parseFloat(product.totalPrice)
                    : (quantity * price);

                const orderId = product.orderId;
                const productId = product.productId;
                const productName = product.productName || product.name;
                const excludeKey = product.excludeKey
                    ?? invoiceLineExcludeKey({ orderId, productId, productName, quantity, price, totalPrice });
                return {
                    id: product.id,
                    excludeKey,
                    productId,
                    productName,
                    name: productName,
                    productDescription: product.productDescription ,
                    quantity: quantity,
                    price: price,
                    totalPrice: totalPrice,
                    unitId: product.unitId,
                    unitName: product.unitName,
                    unitShortName: product.unitShortName,
                    orderId: orderId,
                    type: product.type || 1,
                    productImage: product.productImage,
                    imgUrl() {
                        return this.productImage?.length
                            ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}`
                            : null;
                    },
                    icons() {
                        return '<i class="fas fa-box text-[#3571A4]"></i>';
                    }
                };
            });

            this.allProductsFromOrders = formattedProducts;
            this.updateTotals();
        }
    }
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
