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
                                        {{ product.stockQuantity }}
                                        {{ product.unitShortName ||
                                            product.unitName || '' }}
                                        {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                                    </div>
                                </template>
                                <template v-else>
                                    <div>∞{{ product.unitShortName ||
                                        product.unitName || '' }} | {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}</div>
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
                                {{ product.stockQuantity }}
                                {{ product.unitShortName || product.unitName || '' }}
                                {{ $t('price') }} {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                            </template>
                            <template v-else>
                                ∞{{ product.unitShortName || product.unitName || '' }} | {{ product.retailPriceFormatted() }}{{ defaultCurrencySymbol }}
                            </template>
                        </div>
                    </div>
                </li>
                <li class="p-2 border-t border-gray-300 bg-gray-50 sticky bottom-0">
                    <div class="flex space-x-2">
                        <PrimaryButton 
                            :is-info="true" 
                            :is-full="true"
                            icon="fas fa-plus"
                            @mousedown.prevent="openCreateProductModal">
                            {{ $t('createProductOrService') }}{{ productSearch ? ` "${productSearch}"` : '' }}
                        </PrimaryButton>
                        <PrimaryButton
                            v-if="!isSale && !isReceipt"
                            :is-light="true"
                            icon="fas fa-bolt"
                            @mousedown.prevent="createTempProductQuick"
                            :disabled="!productSearch.trim() || disabled"
                        >
                            {{ $t('createTempProduct') }}
                        </PrimaryButton>
                    </div>
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
                    <th v-if="isReceipt && showPrice && showAmount" class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
                        {{ $t('amount') }}
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
                            :disabled="disabled" min="0.01" step="0.01" @blur="roundQuantity(product)" @input="onQuantityChange(product)" />
                    </td>
                    <td v-if="showPrice" class="py-2 px-4 border-x border-gray-300">
                        <div class="flex items-center space-x-2">
                            <input type="number" v-model.number="product.price" class="w-full p-1 text-right"
                                :disabled="disabled" min="0.01" @input="onPriceChange(product)" />
                        </div>
                    </td>
                    <td v-if="isReceipt && showPrice && showAmount" class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.amount" class="w-full p-1 text-right"
                            :disabled="disabled" min="0.01" @input="onAmountChange(product)" />
                    </td>
                    <td v-if="showPriceType && !isReceipt && !isSale" class="py-2 px-4 border-x border-gray-300">
                        <select v-model="product.priceType" class="w-full p-1" :disabled="disabled" @change="onPriceTypeChange(product)">
                            <option v-if="product.purchasePrice !== undefined" value="purchase">{{ $t('purchasePrice') }}</option>
                            <option value="retail">{{ $t('retailPrice') }}</option>
                            <option v-if="product.wholesalePrice !== undefined && product.wholesalePrice > 0" value="wholesale">{{ $t('wholesalePrice') }}</option>
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
                        {{ formatCurrency(subtotal, currencySymbol, 2, true) }}
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
                        {{ formatCurrency(totalPrice, currencySymbol, 2, true) }}
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
import OrderProductDto from '@/dto/order/OrderProductDto';
import ProductsCreatePage from '@/views/pages/products/ProductsCreatePage.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import notificationMixin from '@/mixins/notificationMixin';
import { formatCurrency, roundQuantityValue, roundValue } from '@/utils/numberUtils';

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
        showAmount: {
            type: Boolean,
            default: true,
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
            default: false
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
            warehouseProducts: [],
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
            const rawSubtotal = this.products.reduce((sum, p) => {
                if (this.isReceipt && p.amount !== null && p.amount !== undefined) {
                    return sum + (parseFloat(p.amount) || 0);
                }
                const price = parseFloat(p.price) || 0;
                const qty = parseFloat(p.quantity) || 0;
                return sum + price * qty;
            }, 0);
            return roundValue(rawSubtotal);
        },
        discountAmount() {
            const disc = Number(this.discount) || 0;
            if (!disc) return 0;
            let amount = 0;
            if (this.discountType === 'percent') {
                amount = this.subtotal * disc / 100;
            } else {
                amount = disc;
            }
            return roundValue(amount);
        },
        totalPrice() {
            return this.subtotal - this.discountAmount;
        },
        defaultCurrencySymbol() {
            const currencies = this.$store.state.currencies || [];
            const defaultCurrency = currencies.find(c => c.isDefault);
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
            if (this.warehouseId && this.warehouseProductsLoaded) {
                let products = this.warehouseProducts;
                
                if (this.onlyProducts) {
                    products = products.filter(p => Boolean(p.type));
                }
                
                return products;
            }
            
            let products = this.useAllProducts 
                ? this.$store.getters.allProducts 
                : this.$store.getters.lastProducts;
            
            if (this.onlyProducts) {
                products = products.filter(p => Boolean(p.type));
            }
            
            return products;
        }
    },
    async created() {
        if (this.warehouseId) {
            await this.loadWarehouseProducts();
        }
        
        if (this.useAllProducts) {
            await this.$store.dispatch('loadAllProducts');
        } else {
            await this.$store.dispatch('loadLastProducts');
        }
    },
    methods: {
        formatCurrency,
        async loadWarehouseProducts() {
            try {
                const results = await ProductController.getItems(1, true, { warehouse_id: this.warehouseId }, 50);
                this.warehouseProducts = results.items || [];
                this.warehouseProductsLoaded = true;
            } catch (error) {
                console.error('Ошибка загрузки товаров для склада:', error);
                this.warehouseProducts = [];
                this.warehouseProductsLoaded = true;
            }
        },
        async fetchLastProducts() {
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
                    let products = ProductSearchDto.fromApiArray(results);
                    
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
                    } else if (this.showPrice && (this.isSale && !this.showPriceType || !this.isSale)) {
                        productDto = OrderProductDto.fromProductDto(product, true);
                        const retailPrice = Number(product.retailPrice) || 0;
                        const wholesalePrice = Number(product.wholesalePrice) || 0;
                        productDto.retailPrice = retailPrice;
                        productDto.wholesalePrice = wholesalePrice;
                        productDto.price = (this.projectId && wholesalePrice > 0) ? wholesalePrice : retailPrice;
                    } else if (this.isSale && this.showPriceType) {
                        productDto = SaleProductDto.fromProductDto(product, true);
                        productDto.retailPrice = product.retailPrice || 0;
                        productDto.wholesalePrice = product.wholesalePrice || 0;
                        if (this.projectId && productDto.wholesalePrice > 0) {
                            productDto.priceType = 'wholesale';
                            productDto.price = productDto.wholesalePrice;
                        } else {
                            productDto.priceType = 'retail';
                            productDto.price = productDto.retailPrice;
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
                    if (this.isReceipt && productDto.quantity && productDto.price) {
                        productDto.amount = (Number(productDto.quantity) || 0) * (Number(productDto.price) || 0);
                    }
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch (error) {
            }
        },
        calculateAmountFromPrice(product) {
            if (this.isReceipt && product.quantity && product.quantity > 0 && product.price) {
                product.amount = (Number(product.price) || 0) * (Number(product.quantity) || 0);
            }
        },
        onPriceTypeChange(product) {
            if (this.isSale || (this.showPrice && product.retailPrice !== undefined && product.wholesalePrice !== undefined)) {
                if (product.priceType === 'retail') {
                    product.price = product.retailPrice || 0;
                } else if (product.priceType === 'wholesale') {
                    product.price = product.wholesalePrice || 0;
                } else if (product.priceType === 'purchase') {
                    product.price = product.purchasePrice || 0;
                }
                this.updateTotals();
            }
        },
        onPriceChange(product) {
            this.calculateAmountFromPrice(product);
            this.updateTotals();
        },
        onAmountChange(product) {
            if ((this.isReceipt || this.isSale) && product.quantity && product.quantity > 0) {
                product.price = (Number(product.amount) || 0) / (Number(product.quantity) || 1);
            }
            this.updateTotals();
        },
        onQuantityChange(product) {
            this.calculateAmountFromPrice(product);
            this.updateTotals();
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
        roundQuantity(product) {
            if (product && product.quantity !== null && product.quantity !== undefined) {
                const num = Number(product.quantity);
                if (!isNaN(num)) {
                    product.quantity = roundQuantityValue(num);
                    this.updateTotals();
                }
            }
        },
        createTempProductQuick() {
            const name = (this.productSearch || '').trim();
            if (!name) return;
            this.showDropdown = false;
            const tempItem = {
                name,
                productName: name,
                description: '',
                quantity: 1,
                price: 0,
                unitId: null,
                productId: this.generateTempId ? this.generateTempId() : (Date.now() + Math.floor(Math.random() * 1000)),
                isTempProduct: true,
                icons() { return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>'; }
            };
            this.products = [...this.products, tempItem];
            this.productSearch = '';
            this.productResults = [];
            this.updateTotals();
            if (this.$refs.productInput) this.$refs.productInput.blur();
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
                    if (newWarehouseId) {
                        await this.loadWarehouseProducts();
                    } else {
                        this.warehouseProducts = [];
                        this.warehouseProductsLoaded = false;
                        
                        if (this.useAllProducts) {
                            await this.$store.dispatch('loadAllProducts');
                        } else {
                            await this.$store.dispatch('loadLastProducts');
                        }
                    }
                    
                    if (this.productSearch.length >= 3) {
                        this.searchProducts();
                    }
                }
            },
        },
        projectId: {
            handler(newProjectId, oldProjectId) {
                if (newProjectId !== oldProjectId && this.showPrice && !this.isReceipt) {
                    this.products.forEach(product => {
                        if (product.retailPrice !== undefined && product.wholesalePrice !== undefined) {
                            if (newProjectId && product.wholesalePrice > 0) {
                                product.price = product.wholesalePrice;
                            } else {
                                product.price = product.retailPrice;
                            }
                        }
                    });
                    this.updateTotals();
                }
            },
            immediate: false
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