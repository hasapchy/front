<template>
    <div class="relative">
        <label v-if="!readonly" class="block mb-1" :class="{ 'required': required }">{{ $t('searchOrders') }}</label>
        <input v-if="!readonly" type="text" ref="orderInput" v-model="orderSearch" :placeholder="$t('enterOrderNumberOrClient')"
            class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur" :disabled="disabled" />
        <transition name="appear">
            <ul v-show="showDropdown && !readonly"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="orderSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                <template v-else-if="orderSearch.length === 0">
                    <li v-for="order in lastOrders" :key="order.id" @mousedown.prevent="selectOrder(order)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <div class="w-7 h-7 flex items-center justify-center mr-2">
                                    <i class="fas fa-shopping-cart text-[#3571A4]"></i>
                                </div>
                                <div>
                                    <div class="font-medium">#{{ order.id }} - {{ order.client?.fullName() || $t('noClient') }}</div>
                                    <div class="text-sm text-gray-500">{{ order.formatDate() }}</div>
                                </div>
                            </div>
                            <div class="text-[#337AB7] text-xs flex flex-col items-end min-w-[90px]">
                                <div class="font-medium">{{ order.priceInfo() }} {{ currencySymbol }}</div>
                                <div class="text-sm text-gray-500">{{ order.statusName }}</div>
                            </div>
                        </div>
                    </li>
                </template>
                <li v-else-if="orderSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
                <li v-else-if="orderResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                <li v-else v-for="order in orderResults" :key="order.id"
                    @mousedown.prevent="selectOrder(order)"
                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="w-7 h-7 flex items-center justify-center mr-2">
                                <i class="fas fa-shopping-cart text-[#3571A4]"></i>
                            </div>
                            <div>
                                <div class="font-medium">#{{ order.id }} - {{ order.client?.fullName() || $t('noClient') }}</div>
                                <div class="text-sm text-gray-500">{{ order.formatDate() }}</div>
                            </div>
                        </div>
                        <div class="text-[#337AB7] text-sm">
                            <div class="font-medium">{{ order.priceInfo() }} {{ currencySymbol }}</div>
                            <div class="text-sm text-gray-500">{{ order.statusName }}</div>
                        </div>
                    </div>
                </li>
            </ul>
        </transition>

        <label class="block mt-4 mb-1">{{ $t('selectedOrders') }}</label>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-32">{{ $t('orderNumber') }}</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium">{{ $t('client') }}</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-40">{{ $t('date') }}</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">{{ $t('total') }}</th>
                    <th v-if="!readonly" class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(order, index) in selectedOrders" :key="index" class="border-b border-gray-300">
                    <td class="py-2 px-4 border-x border-gray-300">
                        <div class="flex items-center">
                            <div class="w-7 h-7 flex items-center justify-center mr-2">
                                <i class="fas fa-shopping-cart text-[#3571A4]"></i>
                            </div>
                            #{{ order.id }}
                        </div>
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        {{ order.client?.fullName() || $t('noClient') }}
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        {{ order.formatDate() }}
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        {{ order.priceInfo() }} {{ currencySymbol || defaultCurrencySymbol }}
                    </td>
                    <td v-if="!readonly" class="px-4 border-x border-gray-300">
                        <button @click="removeSelectedOrder(order.id)"
                            class="text-red-500 text-2xl cursor-pointer z-99" :disabled="disabled">
                            ×
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>

        <div v-if="selectedOrders.length > 0" class="mt-4">
            <label class="block mb-1">{{ $t('productsAndServicesFromOrders') }}</label>
            <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
                <thead class="bg-gray-100 rounded-t-sm">
                    <tr>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium">{{ $t('name') }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">{{ $t('quantity') }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">{{ $t('price') }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">{{ $t('orderNumber') }}</th>
                        <th v-if="!readonly" class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(product, index) in allProductsFromOrders" :key="index" class="border-b border-gray-300">
                        <td class="py-2 px-4 border-x border-gray-300">
                            <div class="flex items-center">
                                <div class="w-7 h-7 flex items-center justify-center mr-2">
                                    <img v-if="product.imgUrl && product.imgUrl()" :src="product.imgUrl()" alt="icon"
                                        class="w-7 h-7 object-cover rounded" loading="lazy" />
                                    <span v-else v-html="product.icons ? product.icons() : getDefaultIcon(product)"></span>
                                </div>
                                {{ product.productName || product.name }}
                            </div>
                        </td>
                        <td class="py-2 px-4 border-x border-gray-300">
                            <input v-if="!readonly" type="number" v-model.number="product.quantity" class="w-full p-1 text-right"
                                :disabled="disabled" min="0.01" @input="updateTotals" />
                            <span v-else>{{ product.quantity }} {{ getUnitShortName(product.unitId) }}</span>
                        </td>
                        <td class="py-2 px-4 border-x border-gray-300">
                            <div class="flex items-center space-x-2">
                                <input v-if="!readonly" type="number" v-model.number="product.price" class="w-full p-1 text-right"
                                    :disabled="disabled" min="0.01" @input="updateTotals" />
                                <span v-else>{{ product.price }} {{ currencySymbol || defaultCurrencySymbol }}</span>
                            </div>
                        </td>
                        <td class="py-2 px-4 border-x border-gray-300">
                            #{{ product.orderId || 'N/A' }}
                        </td>
                        <td v-if="!readonly" class="px-4 border-x border-gray-300">
                            <button @click="removeProductFromOrder(product.productId, product.orderId)"
                                class="text-red-500 text-2xl cursor-pointer z-99" :disabled="disabled">
                                ×
                            </button>
                        </td>
                    </tr>
                </tbody>
                <tfoot v-if="allProductsFromOrders.length">
                    <tr class="bg-gray-50 font-medium">
                        <td :colspan="3" class="py-2 px-4 text-right">{{ $t('subtotal') }}</td>
                        <td class="py-2 px-4 text-right">
                            {{ subtotal.toFixed(2) }} <span class="ml-1">{{ currencySymbol || defaultCurrencySymbol }}</span>
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</template>

<script>
import OrderController from "@/api/OrderController";
import debounce from 'lodash.debounce';

export default {
    emits: ['update:modelValue', 'update:subtotal', 'change'],
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
        }
    },
    data() {
        return {
            orderSearch: '',
            orderSearchLoading: false,
            orderResults: [],
            lastOrders: [],
            showDropdown: false,
            selectedOrders: [],
            allProductsFromOrders: []
        };
    },
    computed: {
        subtotal() {
            return this.allProductsFromOrders.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0);
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.is_default);
            return defaultCurrency ? defaultCurrency.symbol : 'TMT';
        }
    },
    watch: {
        modelValue: {
            handler(newVal) {
                if (JSON.stringify(newVal) !== JSON.stringify(this.selectedOrders)) {
                    this.selectedOrders = [...newVal];
                    this.updateProductsFromOrders();
                }
            },
            immediate: true
        },
        selectedOrders: {
            handler(newVal) {
                this.$emit('update:modelValue', newVal);
                this.$emit('change', newVal);
                this.updateProductsFromOrders();
            }
        },
        orderSearch: {
            handler: 'searchOrders',
            immediate: true
        }
    },
    created() {
        this.fetchLastOrders();
    },
    methods: {
        async fetchLastOrders() {
            try {
                const response = await OrderController.getItemsPaginated(1, '', 'all_time');
                this.lastOrders = response.items.slice(0, 10);
            } catch (error) {
                console.error('Ошибка при загрузке последних заказов:', error);
                this.lastOrders = [];
            }
        },

        searchOrders: debounce(async function () {
            if (this.orderSearch.length >= 3) {
                this.orderSearchLoading = true;
                try {
                    const response = await OrderController.getItemsPaginated(1, this.orderSearch, 'all_time');
                    this.orderResults = response.items;
                    this.orderSearchLoading = false;
                } catch (error) {
                    this.orderResults = [];
                    this.orderSearchLoading = false;
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
                console.error('Ошибка при выборе заказа:', error);
            }
        },

        removeSelectedOrder(orderId) {
            this.selectedOrders = this.selectedOrders.filter(o => o.id !== orderId);
        },

        updateProductsFromOrders() {
            const newProducts = [];
            
            this.selectedOrders.forEach(order => {
                if (order.products && Array.isArray(order.products)) {
                    order.products.forEach(product => {
                        newProducts.push({
                            id: product.id || product.productId,
                            productId: product.productId || product.id,
                            productName: product.productName || product.name,
                            name: product.productName || product.name,
                            productDescription: product.productDescription || '',
                            quantity: product.quantity,
                            price: product.price,
                            totalPrice: product.quantity * product.price,
                            unitId: product.unitId,
                            unitName: product.unitName || product.unitShortName || '',
                            productImage: product.productImage,
                            orderId: order.id,
                            type: 1,
                            imgUrl() {
                                return this.productImage?.length
                                    ? `${import.meta.env.VITE_APP_BASE_URL}/storage/${this.productImage}`
                                    : null;
                            },
                            icons() {
                                return '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>';
                            }
                        });
                    });
                }
            });
            
            if (JSON.stringify(newProducts) !== JSON.stringify(this.allProductsFromOrders)) {
                this.allProductsFromOrders = newProducts;
                this.updateTotals();
            }
        },

        removeProductFromOrder(productId, orderId) {
            const order = this.selectedOrders.find(o => o.id === orderId);
            if (order && order.products) {
                order.products = order.products.filter(p => (p.id || p.productId) !== productId);
                this.selectedOrders = [...this.selectedOrders];
            }
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
            const isProduct = product.type === 1 || product.type === '1' || product.type === true;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]" title="Услуга"></i>';
        },

        getUnitShortName(unitId) {
            if (!unitId) return '';
            return this.$store.getters.getUnitShortName(unitId);
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
