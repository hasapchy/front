<template>
    <div class="space-y-6">
        <div class="relative">
            <label class="block mb-1 font-medium text-gray-700">{{ $t('productsInStock') }}</label>
            <input type="text" ref="productInput" v-model="productSearch" :placeholder="$t('enterProductNameOrCode')"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                @focus="onFocus" @blur="handleProductBlur" :disabled="disabled" />

            <transition name="appear">
                <ul v-show="showProductDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-50">
                    <li v-if="productSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                    <template v-else-if="productSearch.length === 0">
                        <li v-if="!lastProducts || lastProducts.length === 0" class="p-2 text-gray-500">{{ $t('noData')
                            }}</li>
                        <template v-else>
                            <li class="p-2 bg-gray-50 text-xs text-gray-600 border-b border-gray-300 sticky top-0">
                                <i class="fas fa-box-open mr-1"></i>
                                {{ $t('allProductsAndServices') }} ({{ lastProducts.length }})
                            </li>
                            <li v-for="product in lastProducts" :key="product.id"
                                @mousedown.prevent="selectProduct(product)"
                                class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center">
                                        <div class="w-7 h-7 flex items-center justify-center mr-2">
                                            <img v-if="product.imgUrl()" :src="product.imgUrl()" alt="icon"
                                                class="w-7 h-7 object-cover rounded" loading="lazy" />
                                            <span v-else v-html="product.icons()"></span>
                                        </div>
                                        {{ product.name }}
                                    </div>
                                    <div class="text-[#337AB7] text-xs flex flex-col items-end min-w-[90px]">
                                        <div>
                                            {{ product.stockQuantity }}
                                            {{ product.unitShortName || product.unitName }}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </template>
                    </template>
                    <li v-else-if="productSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}
                    </li>
                    <li v-else-if="productResults.length === 0" class="p-2 text-gray-500">{{ $t('notFound') }}</li>
                    <li v-else v-for="product in productResults" :key="product.id"
                        @mousedown.prevent="selectProduct(product)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <div class="w-7 h-7 flex items-center justify-center mr-2">
                                    <img v-if="product.imgUrl()" :src="product.imgUrl()" alt="icon"
                                        class="w-7 h-7 object-cover rounded" loading="lazy" />
                                    <span v-else v-html="product.icons()"></span>
                                </div>
                                {{ product.name }}
                            </div>
                            <div class="text-[#337AB7] text-sm">
                                {{ product.stockQuantity }}
                                {{ product.unitShortName || product.unitName }}
                            </div>
                        </div>
                    </li>
                </ul>
            </transition>
        </div>

        <label class="block mt-4 mb-1">{{ $t('specifiedProductsAndServices') }}</label>

        <div v-if="hasZeroQuantityProducts || hasExceededStock" class="mb-2 space-y-2">
            <div v-if="hasZeroQuantityProducts" class="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-sm text-yellow-800">
                        {{ $t('zeroQuantityProductsExcluded') }}
                    </span>
                </div>
            </div>

            <div v-if="hasExceededStock" class="p-2 bg-orange-50 border border-orange-200 rounded-md">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
                    <span class="text-sm text-orange-800">
                        {{ $t('exceededStockWarning') }}
                    </span>
                </div>
            </div>
        </div>
        <div v-if="products.length > 0">
            <table class="min-w-full bg-white shadow-md rounded mb-6 w-full">
                <thead class="bg-gray-100 rounded-t-sm">
                    <tr>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{ $t('name') }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{
                            $t('quantityAndDimensions')
                            }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">{{ $t('price') }}</th>
                        <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(product, index) in products" :key="index" class="border-b border-gray-300">
                        <td class="py-2 px-4 border-x border-gray-300">
                            <div class="flex items-center">
                                <div class="w-7 h-7 flex items-center justify-center mr-2">
                                    <img v-if="product.imgUrl && product.imgUrl()" :src="product.imgUrl()" alt="icon"
                                        class="w-7 h-7 object-cover rounded" loading="lazy" />
                                    <span v-else
                                        v-html="product.icons ? product.icons() : getDefaultIcon(product)"></span>
                                </div>
                                {{ product.productName || product.name }}
                            </div>
                        </td>

                        <td class="py-2 px-4 border-x border-gray-300">
                            <div v-if="isSquareMeter(product)" class="space-y-2">
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs text-gray-600 w-16">{{ $t('width') }}:</span>
                                    <input type="number" :value="getProductWidth(product)"
                                        @input="setProductWidth(product, $event.target.value); calculateQuantity(product);"
                                        class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                                        :disabled="disabled" min="0" step="0.01" placeholder="0" />
                                    <span class="text-xs text-gray-600">m</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-xs text-gray-600 w-16">{{ $t('length') }}:</span>
                                    <input type="number" :value="getProductLength(product)"
                                        @input="setProductLength(product, $event.target.value); calculateQuantity(product);"
                                        class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                                        :disabled="disabled" min="0" step="0.01" placeholder="0" />
                                    <span class="text-xs text-gray-600">m</span>
                                </div>
                                <div class="text-right text-sm font-medium bg-gray-100 p-1 rounded">
                                    = {{ product.quantity || 0 }} {{ product.unitShortName || product.unitName }}
                                </div>
                                <div v-if="!isService(product)" class="text-xs text-right mt-1"
                                    :class="getStockQuantityClass(product)">
                                    {{ $t('stockLeft') }}: {{ product.stockQuantity || 0 }}
                                </div>
                            </div>
                            <div v-else>
                                <input type="number" v-model.number="product.quantity" @blur="roundQuantity(product)"
                                    class="w-full p-1 text-right border border-gray-300 rounded" :disabled="disabled"
                                    min="0" step="0.01"
                                    :placeholder="(product.unitShortName || product.unitName) ? '0 ' + (product.unitShortName || product.unitName) : '0'" />
                                <div v-if="!isService(product)" class="text-xs mt-1 text-right"
                                    :class="getStockQuantityClass(product)">
                                    {{ $t('stockLeft') }}: {{ product.stockQuantity || 0 }}
                                </div>
                            </div>
                        </td>

                        <td class="py-2 px-4 border-x border-gray-300">
                            <div class="w-full p-1 text-right bg-gray-50 border border-gray-300 rounded text-sm">
                                {{ (Number(product.price) || 0).toFixed(2) }} {{ defaultCurrencySymbol }}
                            </div>
                        </td>

                        <td class="px-4 border-x border-gray-300">
                            <button @click="removeSelectedProduct(index)" class="text-red-500 text-2xl cursor-pointer"
                                :disabled="disabled">
                                ×
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-else class="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mb-6">
            <i class="fas fa-box-open text-4xl mb-2"></i>
            <p>{{ $t('addProductsToOrder') }}</p>
        </div>

    </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ServiceCard from './ServiceCard.vue';
import { roundQuantityValue } from '@/utils/numberUtils';

export default {
    components: {
        ServiceCard
    },
    emits: ['update:modelValue'],
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
    },
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            showProductDropdown: false,
            services: [],
            servicesLoading: false,
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

        filteredServices() {
            return this.services;
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
        }
    },
    async created() {
        await this.fetchLastProducts();
        await this.loadServices();

        this.performSearch = debounce(async (searchTerm) => {
            if (searchTerm && searchTerm.length >= 3) {
                this.productSearchLoading = true;
                try {
                    const results = await ProductController.search(searchTerm);
                    let products = results;

                    if (this.onlyProducts) {
                        products = products.filter(p => Boolean(p.type));
                    }

                    this.productResults = products;
                    this.productSearchLoading = false;
                } catch (error) {
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
                const perPage = 1000;

                while (hasMorePages) {
                    const prodPage = await ProductController.getItems(currentPage, true, {}, perPage);
                    const products = prodPage.items || [];

                    if (this.onlyProducts) {
                        allProducts.push(...products.filter(p => Boolean(p.type)));
                    } else {
                        allProducts.push(...products);
                    }

                    if (prodPage.nextPage && currentPage < prodPage.lastPage) {
                        currentPage++;
                    } else {
                        hasMorePages = false;
                    }
                }

                this.lastProductsList = allProducts
                    .sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                        return dateB - dateA;
                    });
            } catch (error) {
                this.lastProductsList = [];
            }
        },
        async onFocus() {
            this.showProductDropdown = true;
            if (!this.lastProductsList || this.lastProductsList.length === 0) {
                await this.fetchLastProducts();
            }
        },
        async loadServices() {
            this.servicesLoading = true;
            try {
                const servicesData = await ProductController.getItems(1, false, {}, 20);
                this.services = servicesData.items || [];
            } catch (error) {
                this.services = [];
            } finally {
                this.servicesLoading = false;
            }
        },
        searchProducts() {
            if (this.productSearch.length >= 3) {
                this.performSearch(this.productSearch);
            } else {
                this.productResults = [];
            }
        },
        selectProduct(product) {
            try {
                this.showProductDropdown = false;
                this.productSearch = '';
                this.productResults = [];

                const productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                if (productDto && product.id) {
                    productDto.productId = product.id;
                    if (this.projectId && product.wholesalePrice > 0) {
                        productDto.price = product.wholesalePrice || 0;
                    } else {
                        productDto.price = product.retailPrice || 0;
                    }
                    productDto.type = product.type || 1;
                    productDto.stockQuantity = product.stockQuantity || 0;

                    const unitShortName = productDto.unitShortName || '';
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
                this.products = [...this.products, productDto];
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch (error) {
            }
        },
        selectService(service) {
            try {
                const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                if (productDto && service.id) {
                    productDto.productId = service.id;
                    if (this.projectId && service.wholesalePrice > 0) {
                        productDto.price = service.wholesalePrice || 0;
                    } else {
                        productDto.price = service.retailPrice || 0;
                    }
                    productDto.type = service.type || 0;
                    productDto.stockQuantity = service.stockQuantity || 0;

                    const unitShortName = productDto.unitShortName || '';
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
                this.products = [...this.products, productDto];
                this.updateTotals();
            } catch (error) {
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
            this.updateTotals();
        },
        handleProductBlur() {
            requestAnimationFrame(() => {
                this.showProductDropdown = false;
            });
        },
        roundQuantity(product) {
            if (product && product.quantity !== null && product.quantity !== undefined) {
                const num = Number(product.quantity);
                if (!isNaN(num)) {
                    product.quantity = roundQuantityValue(num);
                }
            }
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

            this.updateTotals();
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
            const unitShortName = product.unitShortName || '';
            return this.isSquareMeterShortName(unitShortName);
        },
        isSquareMeterShortName(unitShortNameRaw) {
            const s = String(unitShortNameRaw || '').trim().toLowerCase();
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
                return 'text-gray-400';
            }

            const stockQuantity = product.stockQuantity || 0;
            const orderQuantity = product.quantity || 0;

            if (stockQuantity === 0) {
                return 'text-red-600 font-medium';
            } else if (orderQuantity > stockQuantity) {
                return 'text-orange-600 font-medium';
            } else if (stockQuantity <= 5) {
                return 'text-yellow-600 font-medium';
            } else {
                return 'text-gray-600';
            }
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
                        if (product.productId && !this.productDimensions[product.productId]) {
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
