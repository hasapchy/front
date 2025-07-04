<template>
    <div class="relative">
        <label class="block mb-1" :class="{ 'required': required }">Поиск товаров и услуг</label>
        <input type="text" ref="productInput" v-model="productSearch" placeholder="Введите название или код товара"
            class="w-full p-2 border rounded" @focus="showDropdown = true" @blur="handleBlur" :disabled="disabled" />
        <transition name="appear">
            <ul v-show="showDropdown"
                class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-96 mt-1 z-10">
                <li v-if="productSearchLoading" class="p-2 text-gray-500">Загрузка...</li>
                <template v-else-if="productSearch.length === 0">
                    <li v-for="product in lastProducts" :key="product.id" @mousedown.prevent="selectProduct(product)"
                        class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center">
                                <span v-html="product.icons()"></span>
                                {{ product.name }}
                            </div>
                            <div class="text-[#337AB7] text-sm">
                                <template v-if="product.type === true">
                                    <!-- {{ console.log('stock_quantity:', product.stock_quantity) }} {{
                                        product.unit?.short_name ||
                                        product.unit_short_name || '' }} -->
                                </template>
                                <template v-else>
                                    ∞
                                </template>
                            </div>

                        </div>
                    </li>
                </template>
                <li v-else-if="productSearch.length < 3" class="p-2 text-gray-500">Минимум 3 символа</li>
                <li v-else-if="productResults.length === 0" class="p-2 text-gray-500">Не найдено
                    <button class="text-blue-600 underline ml-2 cursor-pointer"
                        @mousedown.prevent="openCreateProductModal">
                        Создать "{{ productSearch }}"
                    </button>
                </li>
                <li v-else v-for="product in productResults" :key="product.id"
                    @mousedown.prevent="selectProduct(product)"
                    class="cursor-pointer p-2 border-b-gray-300 hover:bg-gray-100">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <span v-html="product.icons()"></span>
                            {{ product.name }}
                        </div>
                        <div class="text-[#337AB7] text-sm">
                            <template v-if="product.type === true">
                                <!-- {{ console.log('stock_quantity:', product.stock_quantity) }} {{ product.unit?.short_name
                                    || product.unit_short_name
                                    || '' }} -->
                            </template>
                            <template v-else>
                                ∞
                            </template>
                        </div>
                    </div>
                </li>
            </ul>
        </transition>

        <label class="block mt-4 mb-1">Указанные товары и услуги</label>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Название</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-20">
                        Количество</th>
                    <th v-if="showPrice" class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
                        {{ isReceipt ? 'Закупочная цена' : 'Цена' }}
                    </th>
                    <!-- <th v-if="showPriceType && !isReceipt"
                        class="text-left border border-gray-300 py-2 px-4 font-medium w-48">
                        Тип цены</th> -->
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="index" class="border-b border-gray-300">
                    <td class="py-2 px-4 border-x border-gray-300">{{ product.productName }}</td>
                    <td v-if="showQuantity" class="py-2 px-4 border-x border-gray-300">
                        <input type="number" v-model.number="product.quantity" class="w-full p-1 text-right"
                            :disabled="disabled" min="0.01" @input="updateTotals" />
                    </td>
                    <td v-if="showPrice" class="py-2 px-4 border-x border-gray-300">
                        <div class="flex items-center space-x-2">
                            <input type="number" v-model.number="product.price" class="w-full p-1 text-right"
                                :disabled="disabled" min="0.01" @input="updateTotals" />
                            <!-- <select v-if="isSale && showPriceType" v-model="product.priceType"
                                class="border p-1 text-sm w-20" :disabled="disabled"
                                @change="onPriceTypeChange(product)">
                                <option value="retail">Розн.</option>
                                <option value="wholesale">Опт.</option>
                            </select> -->
                        </div>
                    </td>
                    <td v-if="showPriceType && !isReceipt && !isSale" class="py-2 px-4 border-x border-gray-300">
                        <select v-model="product.priceType" class="w-full p-1" :disabled="disabled">
                            <option value="purchase">Закупочная</option>
                            <option value="retail">Розничная</option>
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
                    <td :colspan="showQuantity ? 2 : 1" class="py-2 px-4 text-right">Сумма без скидки</td>
                    <td class="py-2 px-4 text-right">
                        {{ subtotal.toFixed(2) }} <span class="ml-1">{{ currencySymbol }}</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td :colspan="showQuantity ? 3 : 2" class="py-2 px-4">
                        <div class="flex justify-end items-center space-x-2">
                            <label class="flex">Скидка</label>
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
                    <td :colspan="showQuantity ? 2 : 1" class="py-2 px-4 text-right">Итого</td>
                    <td class="py-2 px-4 text-right">
                        {{ totalPrice.toFixed(2) }} <span class="ml-1">{{ currencySymbol }}</span>
                    </td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    </div>
    <SideModalDialog :showForm="modalCreateProduct" :onclose="() => modalCreateProduct = false" :level="1">
        <AdminProductsCreatePage :defaultType="defaultProductType" :defaultName="defaultProductName" :editingItem="null"
            @saved="onProductCreated" @saved-error="() => modalCreateProduct = false" />
    </SideModalDialog>
</template>

<script>
import ProductController from '@/api/ProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import WarehouseReceiptProductDto from '@/dto/warehouse/WarehouseReceiptProductDto';
import SaleProductDto from '@/dto/sale/SaleProductDto';
import AdminProductsCreatePage from '@/views/pages/admin/products/AdminProductsCreatePage.vue';
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';

export default {
    components: {
        AdminProductsCreatePage,
        SideModalDialog,
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
        }
    },
    data() {
        return {
            productSearch: '',
            productSearchLoading: false,
            productResults: [],
            lastProducts: [],
            showDropdown: false,
            // discount: 0,
            // discountType: 'fixed',
            modalCreateProduct: false,
            defaultProductType: 'product',
            defaultProductName: '',
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
                // console.log('Last products fetched:', this.lastProducts);
            } catch (error) {
                // console.error('Error fetching last products:', error);
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
                    // console.log('Search results:', this.productResults);
                } catch (error) {
                    // console.error('Error searching products:', error);
                    this.productResults = [];
                    this.productSearchLoading = false;
                }
            } else {
                this.productResults = [];
            }
        }, 250),
        selectProduct(product) {
            try {
                // console.log('Selecting product:', product);
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
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
                this.$refs.productInput.blur();
                // console.log('Product added/updated:', this.products);
            } catch (error) {
                // console.error('Error selecting product:', error);
            }
        },
        onPriceTypeChange(product) {
            if (this.isSale) {
                product.price = product.priceType === 'retail' ? product.retail_price : product.wholesale_price;
                this.updateTotals();
            }
        },
        removeSelectedProduct(id) {
            this.products = this.products.filter(product => product.productId !== id);
            this.updateTotals();
            // console.log('Product removed, current products:', this.products);
        },
        handleBlur() {
            // оставляем задержку, но уменьшаем, чтобы избежать конфликта
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