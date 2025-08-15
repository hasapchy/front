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
                                        {{ $t('price') }} {{ product.retailPriceFormatted() }}m
                                    </div>
                                </template>
                                <template v-else>
                                    <div>∞{{ product.unit_short_name ||
                                        product.unit_name || '' }} | {{ product.retailPriceFormatted() }}m</div>
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
                            <template v-if="product.type === true">
                            </template>
                            <template v-else>
                                ∞
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
                             v-if="isOrder"
                             :is-light="true" 
                             :is-full="true"
                             icon="fas fa-plus"
                             @mousedown.prevent="openCreateTempProductModal">
                             {{ $t('createTemporaryProduct') }}{{ productSearch ? ` "${productSearch}"` : '' }}
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
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                                 <tr v-for="(product, index) in products" :key="index" class="border-b border-gray-300">
                     <td class="py-2 px-4 border-x border-gray-300">{{ product.productName || product.name }}</td>
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
    <SideModalDialog :showForm="modalCreateTempProduct" :onclose="() => modalCreateTempProduct = false" :level="1">
        <OrderTempProductCreatePage :defaultName="defaultProductName" :editingItem="null"
            @saved="onTempProductCreated" @saved-error="onProductCreatedError" />
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
import OrderTempProductCreatePage from '@/views/pages/orders/OrderTempProductCreatePage.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import notificationMixin from '@/mixins/notificationMixin';

export default {
    mixins: [notificationMixin],
    emits: ['update:modelValue', 'update:discount', 'update:discountType', 'update:subtotal', 'update:totalPrice', 'product-removed'],
    components: {
        ProductsCreatePage,
        OrderTempProductCreatePage,
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
        isOrder: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            lastProducts: [],
            showDropdown: false,
            modalCreateProduct: false,
            modalCreateTempProduct: false,
            defaultProductType: 'product',
            defaultProductName: '',
            tempProductCounter: 1000000, // Простой счетчик для временных товаров (начинаем с большого числа)
            removedTempProducts: [], // Список удаленных временных товаров
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
    },
    created() {
        this.fetchLastProducts();
    },
    methods: {
        async fetchLastProducts() {
            try {
                if (this.onlyProducts) {
                    const prodPage = await ProductController.getItems(1, true);
                    this.lastProducts = prodPage.items
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 10);
                } else {
                    const prodPage = await ProductController.getItems(1, true);
                    const servPage = await ProductController.getItems(1, false);
                    this.lastProducts = [...prodPage.items, ...servPage.items]
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 10);
                }
            } catch (error) {
                this.lastProducts = [];
            }
        },
        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 4) {
                this.productSearchLoading = true;
                try {
                    const results = await ProductController.searchItems(this.productSearch, this.onlyProducts ? true : null);
                    this.productResults = results;
                    this.productSearchLoading = false;
                } catch (error) {
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
                        productDto.priceType = 'retail';
                        productDto.price = productDto.retail_price;
                    } else {
                        productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                        if (this.showPriceType) {
                            productDto.priceType = 'purchase';
                        }
                    }
                    // Убеждаемся, что у обычного товара есть productId
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
            // Проверяем, был ли это временный товар
            const removedProduct = this.products.find(p => p.productId === id);
            if (removedProduct && removedProduct.isTempProduct) {
                // Добавляем в список удаленных временных товаров
                if (!this.removedTempProducts) {
                    this.removedTempProducts = [];
                }
                this.removedTempProducts.push(removedProduct.name);
            }
            
            this.products = this.products.filter(p => p.productId !== id);
            this.updateTotals();
            
            // Эмитим событие об удалении товара
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
        openCreateTempProductModal() {
            this.defaultProductName = this.productSearch;
            this.modalCreateTempProduct = true;
        },
        generateTempProductId() {
            // Генерируем уникальный ID для временного товара
            return this.tempProductCounter++;
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
        onTempProductCreated(newProduct) {
            this.modalCreateTempProduct = false;
            if (newProduct) {
                // Создаем временный товар с уникальным ID
                const tempProduct = {
                    productId: this.generateTempProductId(),
                    productName: newProduct.name,
                    name: newProduct.name,
                    quantity: newProduct.quantity,
                    price: newProduct.price,
                    description: newProduct.description,
                    unitId: newProduct.unitId,
                    isTempProduct: true,
                    icons() { return '<i class="fas fa-bolt text-[#EAB308]" title="временный товар"></i>'; }
                };
                
                // Добавляем в список товаров
                const updatedProducts = [...this.products, tempProduct];
                this.$emit('update:modelValue', updatedProducts);
                this.updateTotals();
            }
        },
        // Метод для получения списка удаленных временных товаров
        getRemovedTempProducts() {
            return [...this.removedTempProducts];
        },
        // Метод для сброса списка удаленных временных товаров
        resetRemovedTempProducts() {
            this.removedTempProducts = [];
        },
    },
    watch: {
        productSearch: {
            handler: 'searchProducts',
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
</style>