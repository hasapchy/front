<template>
    <div class="relative">
        <label class="block mb-1" :class="{ 'required': required }">{{ $t('searchProductsAndServices') }}</label>
        <input type="text" ref="productInput" v-model="productSearch" :placeholder="$t('enterProductNameOrCode')"
            class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur" :disabled="disabled" />
        <transition name="appear">
            <ul v-show="showDropdown"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="productSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                <template v-else-if="productSearch.length === 0">
                    <li v-for="product in lastProducts" :key="product.id" @mousedown.prevent="selectProduct(product)"
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
                                <template v-if="product.typeName() === 'product'">
                                    <div>
                                        {{ product.stock_quantity }}
                                        {{ product.unit_short_name ||
                                            product.unit_name || '' }}
                                        {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                                    </div>
                                </template>
                                <template v-else>
                                    <div>∞{{ product.unit_short_name ||
                                        product.unit_name || '' }} | {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}</div>
                                </template>
                            </div>

                        </div>
                    </li>
                </template>
                <li v-else-if="productSearch.length < 3" class="p-2 text-gray-500">{{ $t('minimum3Characters') }}</li>
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
                            <template v-if="product.typeName && product.typeName() === 'product'">
                                {{ product.stock_quantity }}
                                {{ product.unit_short_name || product.unit_name || '' }}
                                {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                            </template>
                            <template v-else>
                                ∞{{ product.unit_short_name || product.unit_name || '' }} | {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                            </template>
                        </div>
                    </div>
                </li>
                <li class="p-2 border-t border-gray-300 bg-gray-50 sticky bottom-0">
                    <PrimaryButton 
                        :is-info="true" 
                        :is-full="true"
                        icon="fas fa-plus"
                        @mousedown.prevent="openCreateProductModal">
                        {{ $t('createProductOrService') }}{{ productSearch ? ` "${productSearch}"` : '' }}
                    </PrimaryButton>
                </li>
            </ul>
        </transition>

        <label class="block mt-4 mb-1">{{ $t('specifiedProductsAndServices') }}</label>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{ $t('name') }}</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-20">
                        {{ $t('quantity') }}</th>
                    <th v-if="showPrice" class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
                        {{ isReceipt ? $t('purchasePrice') : $t('price') }}
                    </th>
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
                                <span v-else v-html="product.icons ? product.icons() : getDefaultIcon(product)"></span>
                            </div>
                            {{ product.productName || product.name }}
                        </div>
                    </td>
                    <td v-if="showQuantity" class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.quantity" class="w-full p-1 text-right"
                            :disabled="disabled" min="0.01" @input="updateTotals" />
                    </td>
                    <td v-if="showPrice" class="py-2 px-4 border-x border-gray-300">
                        <div class="flex items-center space-x-2">
                            <input type="number" v-model.number="product.price" class="w-full p-1 text-right"
                                :disabled="disabled" min="0.01" @input="updateTotals" />
                        </div>
                    </td>
                    <td v-if="showPriceType && !isReceipt && !isSale" class="py-2 px-4 border-x border-gray-300">
                        <select v-model="product.priceType" class="w-full p-1" :disabled="disabled">
                            <option value="purchase">{{ $t('purchasePrice') }}</option>
                            <option value="retail">{{ $t('retailPrice') }}</option>
                        </select>
                    </td>
                    <td class="px-4 border-x border-gray-300">
                        <button @click="removeSelectedProduct(product.productId)"
                            class="text-red-500 text-2xl cursor-pointer z-99" :disabled="disabled">
                            ×
                        </button>
                    </td>
                </tr>
            </tbody>
            <tfoot v-if="products.length && isSale">
                <tr class="bg-gray-50 font-medium">
                    <td :colspan="showQuantity ? 2 : 1" class="py-2 px-4 text-right">{{ $t('amountWithoutDiscount') }}</td>
                    <td class="py-2 px-4 text-right">
                        {{ subtotal.toFixed(2) }} <span class="ml-1">{{ currencySymbol }}</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td :colspan="showQuantity ? 3 : 2" class="py-2 px-4">
                        <div class="flex justify-end items-center space-x-2">
                            <label class="flex">{{ $t('discount') }}</label>
                            <div class="relative">
                                <input type="number" v-model.number="discountLocal"
                                    class="w-24 p-1 text-right border rounded" :disabled="disabled"
                                    @input="updateTotals" />
                            </div>
                            <select v-model="discountTypeLocal" class="border ml-2 p-1 text-sm !w-14 text-center"
                                :disabled="disabled" @change="updateTotals">
                                <option value="percent">%</option>
                                <option value="fixed">{{ currencySymbol }}</option>
                            </select>
                        </div>
                    </td>
                    <td></td>
                </tr>
                <tr class="bg-gray-100 font-bold">
                    <td :colspan="showQuantity ? 2 : 1" class="py-2 px-4 text-right">{{ $t('total') }}</td>
                    <td class="py-2 px-4 text-right">
                        {{ totalPrice.toFixed(2) }} <span class="ml-1">{{ currencySymbol }}</span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
    <SideModalDialog :showForm="modalCreateProduct" :onclose="() => modalCreateProduct = false" :level="1">
        <ProductsCreatePage :defaultType="defaultProductType" :defaultName="defaultProductName" :editingItem="null"
            @saved="onProductCreated" @saved-error="onProductCreatedError" />
    </SideModalDialog>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import ProductSearchDto from '@/dto/product/ProductSearchDto';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import SaleProductDto from '@/dto/sale/SaleProductDto';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin],
    emits: ['update:modelValue', 'update:discount', 'update:discountType', 'update:subtotal', 'update:totalPrice', 'product-removed'],
    components: {
        ProductsCreatePage,
        SideModalDialog,
        PrimaryButton,
    },
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
            default: false // Для basement - загружать ВСЕ товары
        }
    },
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            showDropdown: false,
            modalCreateProduct: false,
            defaultProductType: 'product',
            defaultProductName: '',
            warehouseProducts: [], // Товары с учетом выбранного склада
            warehouseProductsLoaded: false,
        };
    },
    computed: {
        products: {
            get() {
                return this.modelValue;
            },
            set(value) {
                this.$emit('update:modelValue', value);
            },
        },
        subtotal() {
            return this.products.reduce((sum, p) => sum + (Number(p.price) || 0) * (Number(p.quantity) || 0), 0);
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            if (this.discountType === 'percent') {
                return this.subtotal * disc / 100;
            }
            return Math.min(disc, this.subtotal);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.is_default);
            return defaultCurrency ? defaultCurrency.symbol : 'Нет валюты';
        },
        discountLocal: {
            get() {
                return this.discount;
            },
            set(value) {
                this.$emit('update:discount', value);
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
            // ✅ Если выбран склад, используем товары загруженные для этого склада
            if (this.warehouseId && this.warehouseProductsLoaded) {
                let products = this.warehouseProducts;
                
                // Фильтруем только товары (исключаем услуги), если onlyProducts === true
                if (this.onlyProducts) {
                    products = products.filter(p => Boolean(p.type));
                }
                
                return products;
            }
            
            // ✅ Для basement загружаем ВСЕ товары, иначе - последние 10
            let products = this.useAllProducts 
                ? this.$store.getters.allProducts 
                : this.$store.getters.lastProducts;
            
            // ✅ Фильтруем только товары (исключаем услуги), если onlyProducts === true
            if (this.onlyProducts) {
                products = products.filter(p => Boolean(p.type));
            }
            
            return products;
        }
    },
    async created() {
        // ✅ Если выбран склад, загружаем товары для этого склада
        if (this.warehouseId) {
            await this.loadWarehouseProducts();
        } else if (this.useAllProducts) {
            // Для basement загружаем ВСЕ товары
            await this.$store.dispatch('loadAllProducts');
        } else {
            // Иначе загружаем последние 10 товаров
            await this.$store.dispatch('loadLastProducts');
        }
    },
    methods: {
        async loadWarehouseProducts() {
            // Загружаем товары с учетом выбранного склада
            try {
                const results = await ProductController.getItems(1, null, { warehouse_id: this.warehouseId }, 50);
                this.warehouseProducts = results.items || [];
                this.warehouseProductsLoaded = true;
            } catch (error) {
                console.error('Ошибка загрузки товаров для склада:', error);
                this.warehouseProducts = [];
                this.warehouseProductsLoaded = true;
            }
        },
        async fetchLastProducts() {
            // ✅ Перезагружаем данные
            if (this.warehouseId) {
                await this.loadWarehouseProducts();
            } else if (this.useAllProducts) {
                this.$store.commit('SET_ALL_PRODUCTS', []);
                this.$store.commit('SET_ALL_PRODUCTS_DATA', []);
                await this.$store.dispatch('loadAllProducts');
            } else {
                this.$store.commit('SET_LAST_PRODUCTS', []);
                this.$store.commit('SET_LAST_PRODUCTS_DATA', []);
                await this.$store.dispatch('loadLastProducts');
            }
        },
        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 3) {
                this.productSearchLoading = true;
                try {
                    const results = await ProductController.searchItems(this.productSearch, this.onlyProducts ? true : null, this.warehouseId);
                    let products = results.map(item => ProductSearchDto.fromApi(item));
                    
                    // ✅ Дополнительная фильтрация на фронтенде: только товары, если onlyProducts === true
                    if (this.onlyProducts) {
                        products = products.filter(p => Boolean(p.type));
                    }
                    
                    this.productResults = products;
                    this.productSearchLoading = false;
                } catch (error) {
                    console.error('Ошибка поиска товаров:', error);
                    this.productResults = [];
                    this.productSearchLoading = false;
                }
            } else {
                this.productResults = [];
            }
        }, 250),
        selectProduct(product) {
            try {
                this.showDropdown = false;
                this.productSearch = '';
                this.productResults = [];

                const existing = this.products.find(p => p.productId === product.id);
                if (existing && this.isSale) {
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                } else {
                    let productDto;
                    if (this.isReceipt) {
                        productDto = WarehouseReceiptProductDto.fromProductDto(product, true);
                    } else if (this.isSale) {
                        productDto = SaleProductDto.fromProductDto(product, true);
                        productDto.retail_price = product.retail_price || 0;
                        productDto.wholesale_price = product.wholesale_price || 0;
                        // Если выбран проект, используем оптовую цену
                        if (this.projectId && productDto.wholesale_price > 0) {
                            productDto.priceType = 'wholesale';
                            productDto.price = productDto.wholesale_price;
                        } else {
                            productDto.priceType = 'retail';
                            productDto.price = productDto.retail_price;
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
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch (error) {
            }
        },
        onPriceTypeChange(product) {
            if (this.isSale) {
                product.price = product.priceType === 'retail' ? product.retail_price : product.wholesale_price;
                this.updateTotals();
            }
        },
        removeSelectedProduct(id) {
            const removedProduct = this.products.find(p => p.productId === id);
            
            this.products = this.products.filter(p => p.productId !== id);
            this.updateTotals();
            
            this.$emit('product-removed', { id, wasTempProduct: removedProduct?.isTempProduct, name: removedProduct?.name });
        },
        handleBlur() {
            requestAnimationFrame(() => {
                this.showDropdown = false;
            });
        }
        ,
        updateTotals() {
            this.$emit('update:discount', this.discount);
            this.$emit('update:discountType', this.discountType);
            this.$emit('update:subtotal', this.subtotal);
            this.$emit('update:totalPrice', this.totalPrice);
        },
        openCreateProductModal() {
            this.defaultProductType = this.onlyProducts ? 'product' : 'service';
            this.defaultProductName = this.productSearch;
            this.modalCreateProduct = true;
        },
        onProductCreated(newProduct) {
            this.modalCreateProduct = false;
            if (newProduct) {
                this.selectProduct(newProduct);
            }
        },
        onProductCreatedError(error) {
            this.showNotification('Ошибка создания товара', error, true);
        },
        getDefaultIcon(product) {
            if (product.isTempProduct) {
                return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>';
            }
            const isProduct = product.type === 1 || product.type === '1' || product.type === true;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]" title="Услуга"></i>';
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
                    // ✅ Если склад выбран, загружаем товары для этого склада
                    if (newWarehouseId) {
                        await this.loadWarehouseProducts();
                    } else {
                        // Склад убрали - очищаем товары склада
                        this.warehouseProducts = [];
                        this.warehouseProductsLoaded = false;
                    }
                    
                    // Перезагружаем поиск если есть текст поиска
                    if (this.productSearch.length >= 3) {
                        this.searchProducts();
                    }
                }
            },
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