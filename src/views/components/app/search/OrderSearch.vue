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
      @focus="handleFocus"
      @blur="handleBlur"
    >
    <transition name="appear">
      <ul
        v-show="showDropdown && !readonly"
        class="absolute z-10 mt-1 flex max-h-60 w-96 flex-col overflow-y-auto rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-lg dark:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.45)]"
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
            <div class="text-[var(--color-info)] text-sm">
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
      class="product-search-table min-w-full w-100 mb-6 rounded bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-md dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.35)]"
    >
      <thead class="rounded-t-sm bg-[var(--surface-muted)]">
        <tr>
          <th class="w-32 app-table-head-cell-base">
            {{ $t('orderNumber') }}
          </th>
          <th class="app-table-head-cell-base">
            {{ $t('client') }}
          </th>
          <th class="w-40 app-table-head-cell-base">
            {{ $t('date') }}
          </th>
          <th class="w-24 app-table-head-cell-base">
            {{ $t('total') }}
          </th>
          <th
            v-if="!readonly"
            class="w-12 app-table-head-cell-base"
          >
            ~
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(order, index) in selectedOrders"
          :key="index"
          class="product-search-row border-b border-[var(--border-subtle)]"
          :class="{ 'product-search-row--even': index % 2 === 1 }"
        >
          <td class="app-table-body-cell">
            <div class="flex items-center">
              <div class="w-7 h-7 flex items-center justify-center mr-2">
                <i class="fas fa-shopping-cart text-[#3571A4]" />
              </div>
              <span
                class="cursor-pointer text-[var(--nav-accent)] hover:text-[var(--nav-accent)] hover:underline dark:text-[var(--label-accent)] dark:hover:text-[var(--label-accent)]"
                @click="handleOrderClick(order)"
              >
                #{{ order.id }}
              </span>
            </div>
          </td>
          <td class="app-table-body-cell">
            <div>{{ getClientDisplayName(order.client || fallbackClient) || $t('noClient') }}</div>
            <div
              v-if="getClientDisplayPosition(order.client || fallbackClient)"
              class="text-xs text-[var(--text-secondary)]"
            >
              {{ getClientDisplayPosition(order.client || fallbackClient) }}
            </div>
          </td>
          <td class="app-table-body-cell">
            {{ order.date ? order.formatDate() : $t('notSpecified') }}
          </td>
          <td class="app-table-body-cell">
            {{ order.priceInfo() }}
          </td>
          <td
            v-if="!readonly"
            class="border-x border-[var(--border-subtle)] px-4"
          >
            <button
              class="text-[var(--color-danger)] text-2xl cursor-pointer z-50"
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
      <div
        v-for="group in orderProductGroups"
        :key="group.orderId"
        class="mb-6"
      >
        <div
          class="mb-2 border-b border-gray-300 pb-2 text-sm font-semibold text-gray-800 dark:border-[var(--border-subtle)] dark:text-[var(--text-primary)]"
        >
          {{ group.title }}
        </div>
        <DocumentProductLinesTable
          v-if="group.lines.length"
          :lines="group.lines"
          :currency-code="group.currencyCode"
          :disabled="disabled"
          :readonly="readonly"
          :removable="!readonly"
          line-key-field="excludeKey"
          @remove="removeProductLine"
          @quantity-change="onProductFieldInput"
          @price-change="onProductFieldInput"
        />
        <CardViewEmptyState
          v-else
          class="mb-2"
        />
        <div
          class="mt-2 flex justify-end text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)]"
        >
          <span class="tabular-nums">{{ group.totalLabel }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import OrderController from "@/api/OrderController";
import InvoiceController from "@/api/InvoiceController";
import debounce from 'lodash.debounce';
import { getClientDisplayName as getClientName, getClientDisplayPosition as getClientPos } from '@/utils/displayUtils';
import { formatCurrencyForDisplay } from '@/utils/numberUtils';
import {
    createOrderSearchLineFromApiRow,
    invoiceLineExcludeKey,
    invoiceLineExcludeKeyFromLine,
    invoiceOrderGroupTitle,
    sortedOrderIdsKey,
    sumInvoiceLineTotals,
    sumInvoiceLinesForOrder,
} from '@/utils/invoiceOrderLinesUtils';
import { filterOrdersByQuery } from '@/utils/orderSearchUtils';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';
import DocumentProductLinesTable from '@/views/components/app/forms/DocumentProductLinesTable.vue';

const SEARCH_MIN_LENGTH = 3;
const LIST_LIMIT = 20;

export default {
    components: { CardViewEmptyState, DocumentProductLinesTable },
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
        currencyCode: {
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
    emits: ['update:modelValue', 'update:subtotal', 'change', 'order-click', 'orders-sync-error'],
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
        hasMixedOrderCurrencies() {
            const keys = this.selectedOrders.map((order) => this.orderCurrencyKey(order));
            return new Set(keys).size > 1;
        },
        orderProductGroups() {
            return this.selectedOrders.map((order) => {
                const lines = this.allProductsFromOrders.filter(
                    (p) => p.orderId != null && String(p.orderId) === String(order.id),
                );
                const dateLabel = order.date ? order.formatDate() : null;
                const orderCode = this.resolveOrderCurrencyCode(order);
                const total = sumInvoiceLinesForOrder(this.allProductsFromOrders, order.id);
                const currencyInTitle = this.hasMixedOrderCurrencies ? orderCode : null;
                return {
                    orderId: order.id,
                    title: invoiceOrderGroupTitle(order.id, dateLabel, currencyInTitle),
                    currencyCode: orderCode,
                    totalLabel: this.$t('orderLinesTotal', {
                        amount: formatCurrencyForDisplay(total, orderCode, true),
                    }),
                    lines,
                };
            });
        },
        defaultCurrencyCode() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
            return defaultCurrency ? defaultCurrency.code : this.$t('noCurrency');
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
        orderCurrencyKey(order) {
            if (order?.currencyId != null && order.currencyId !== '') {
                return `id:${order.currencyId}`;
            }
            const code = String(order?.currencyCode ?? '').trim().toLowerCase();
            return code && code !== String(this.$t('noCurrency')).trim().toLowerCase()
                ? `code:${code}`
                : 'code:default';
        },
        resolveOrderCurrencyCode(order) {
            const code = String(order?.currencyCode ?? '').trim();
            const noCur = this.$t('noCurrency');
            if (code && code !== noCur) {
                return code;
            }
            return this.currencyCode || this.defaultCurrencyCode;
        },
        wouldMixOrderCurrencies(newOrder) {
            if (!this.selectedOrders.length) {
                return false;
            }
            const keys = new Set(this.selectedOrders.map((o) => this.orderCurrencyKey(o)));
            keys.add(this.orderCurrencyKey(newOrder));
            return keys.size > 1;
        },
        getOrdersFromStore() {
            const orders = this.$store.getters.orders;
            return Array.isArray(orders) && orders.length > 0 ? orders : [];
        },
        async ensureOrdersLoaded() {
            if (this.getOrdersFromStore().length > 0) {
                return;
            }
            await this.$store.dispatch('loadOrders');
        },
        searchOrders: debounce(async function () {
            if (this.orderSearch.length < SEARCH_MIN_LENGTH) {
                this.orderResults = [];
                return;
            }
            if (this.searchAbortController) {
                this.searchAbortController.abort();
            }
            this.searchAbortController = new AbortController();
            const signal = this.searchAbortController.signal;
            this.orderSearchLoading = true;
            try {
                let storeOrders = this.getOrdersFromStore();
                if (storeOrders.length === 0) {
                    await this.$store.dispatch('loadOrders');
                    storeOrders = this.getOrdersFromStore();
                }
                if (storeOrders.length > 0) {
                    const filtered = filterOrdersByQuery(storeOrders, this.orderSearch);
                    this.orderResults = filtered.slice(0, LIST_LIMIT);
                    if (this.orderResults.length > 0) {
                        return;
                    }
                }
                const response = await OrderController.getItems(
                    1,
                    this.orderSearch,
                    'all_time',
                    null,
                    null,
                    '',
                    '',
                    '',
                    '',
                    LIST_LIMIT,
                    false,
                    signal,
                );
                if (signal.aborted) {
                    return;
                }
                this.orderResults = response.items;
            } catch (error) {
                if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
                    return;
                }
                this.orderResults = [];
            } finally {
                if (!this.searchAbortController?.signal?.aborted) {
                    this.orderSearchLoading = false;
                }
            }
        }, 1200),

        async handleFocus() {
            this.showDropdown = true;
            await this.ensureOrdersLoaded();
        },

        async selectOrder(order) {
            try {
                this.showDropdown = false;
                this.orderSearch = '';
                this.orderResults = [];

                const existing = this.selectedOrders.find(o => o.id === order.id);
                if (!existing) {
                    const fullOrder = await OrderController.getItem(order.id);
                    if (this.wouldMixOrderCurrencies(fullOrder)) {
                        this.$emit('orders-sync-error', this.$t('invoiceOrdersMixedCurrency'));
                        return;
                    }
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
                if (reqId !== this.invoiceProductsRequestId) {
                    return;
                }
                this.allProductsFromOrders = [];
                this.updateTotals();
                this.$emit('orders-sync-error', error);
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
