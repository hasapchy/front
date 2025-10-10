<template>
    <div class="space-y-6">

        <!-- Услуги вынесены в отдельный компонент -->

        <!-- Товары на складе - Поиск -->
        <div class="relative">
            <label class="block mb-1 font-medium text-gray-700">Товары на складе</label>
            <input type="text" ref="productInput" v-model="productSearch" :placeholder="$t('enterProductNameOrCode')"
                class="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" @focus="onFocus" @blur="handleProductBlur" :disabled="disabled" />

            <!-- Результаты поиска товаров -->
            <transition name="appear">
                <ul v-show="showProductDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-50">
                    <li v-if="productSearchLoading" class="p-2 text-gray-500">{{ $t('loading') }}</li>
                    <template v-else-if="productSearch.length === 0">
                        <li v-if="!lastProducts || lastProducts.length === 0" class="p-2 text-gray-500">{{ $t('noData') }}</li>
                        <li v-else v-for="product in lastProducts" :key="product.id" @mousedown.prevent="selectProduct(product)"
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
                                        {{ product.stock_quantity }}
                                        {{ product.unit_short_name || product.unit_name || '' }}
                                    </div>
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
                                {{ product.stock_quantity }}
                                {{ product.unit_short_name || product.unit_name || '' }}
                            </div>
                        </div>
                    </li>
                </ul>
            </transition>
        </div>

        <label class="block mt-4 mb-1">{{ $t('specifiedProductsAndServices') }}</label>
        
        <!-- Предупреждения -->
        <div v-if="hasZeroQuantityProducts || hasExceededStock" class="mb-2 space-y-2">
            <!-- Предупреждение о товарах с нулевым количеством -->
            <div v-if="hasZeroQuantityProducts" class="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-sm text-yellow-800">
                        Товары с количеством 0 будут исключены из заказа
                    </span>
                </div>
            </div>
            
            <!-- Предупреждение о превышении остатков (только для товаров, не для услуг) -->
            <div v-if="hasExceededStock" class="p-2 bg-orange-50 border border-orange-200 rounded-md">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
                    <span class="text-sm text-orange-800">
                        Количество некоторых товаров превышает доступный остаток
                    </span>
                </div>
            </div>
        </div>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-full">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">Название</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-32">
                        Количество / Размеры</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-24">Цена</th>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-12">~</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(product, index) in products" :key="index" 
                    :class="[
                        'border-b border-gray-300',
                        (!product.quantity || product.quantity <= 0) ? 'bg-red-50' : ''
                    ]">
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
                        <!-- Если м² - показываем ширину и длину -->
                        <div v-if="isSquareMeter(product)" class="space-y-2">
                            <div class="flex items-center space-x-2">
                                <span class="text-xs text-gray-600 w-16">Ширина:</span>
                                <input type="number" :value="getProductWidth(product)" @input="setProductWidth(product, $event.target.value); calculateQuantity(product)" 
                                    class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                                    :disabled="disabled" min="0" step="0.01" 
                                    @blur="validateInput(product, 'width')"
                                    placeholder="0" />
                                <span class="text-xs text-gray-600">м</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-xs text-gray-600 w-16">Длина:</span>
                                <input type="number" :value="getProductLength(product)" @input="setProductLength(product, $event.target.value); calculateQuantity(product)" 
                                    class="flex-1 p-1 text-right border border-gray-300 rounded text-sm"
                                    :disabled="disabled" min="0" step="0.01"
                                    @blur="validateInput(product, 'length')"
                                    placeholder="0" />
                                <span class="text-xs text-gray-600">м</span>
                            </div>
                            <div class="text-right text-sm font-medium bg-gray-100 p-1 rounded">
                                = {{ product.quantity || 0 }} {{ product.unitShortName || product.unit_short_name || '' }}
                            </div>
                            <!-- Показываем остаток только для товаров, не для услуг -->
                            <div v-if="!isService(product)" class="text-xs text-right" :class="getStockQuantityClass(product)">
                                Остаток: {{ product.stock_quantity || 0 }}
                            </div>
                        </div>
                        <!-- Для остальных единиц - просто количество -->
                        <div v-else>
                            <input type="number" v-model.number="product.quantity" 
                                class="w-full p-1 text-right border border-gray-300 rounded"
                                :disabled="disabled" min="0" step="0.01"
                                :placeholder="'0 ' + (product.unitShortName || product.unit_short_name || '')" />
                            <!-- Показываем остаток только для товаров, не для услуг -->
                            <div v-if="!isService(product)" class="text-xs mt-1 text-right" :class="getStockQuantityClass(product)">
                                Остаток: {{ product.stock_quantity || 0 }}
                            </div>
                        </div>
                    </td>
                    <td class="py-2 px-4 border-x border-gray-300">
                        <div class="w-full p-1 text-right bg-gray-50 border border-gray-300 rounded text-sm">
                            {{ (Number(product.price) || 0).toFixed(2) }} m
                        </div>
                    </td>
                    <td class="px-4 border-x border-gray-300">
                        <button @click="removeSelectedProduct(index)"
                            class="text-red-500 text-2xl cursor-pointer z-99" :disabled="disabled">
                            ×
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        
    </div>
</template>

<script>
import BasementProductController from '@/api/BasementProductController';
import debounce from 'lodash.debounce';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ServiceCard from './ServiceCard.vue';

// Vue 3 compatibility - $set and $delete removed
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
            lastProducts: [],
            showProductDropdown: false,
            services: [],
            servicesLoading: false,
            productDimensions: {} // Локальное хранилище размеров для каждого товара
        };
    },
    computed: {
        products: {
            get() {
                return this.modelValue;
            },
            set(value) {
                // Инициализируем размеры для новых товаров
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
                // Для услуг не проверяем превышение остатка
                if (this.isService(product)) {
                    return false;
                }
                
                const stockQuantity = product.stock_quantity || 0;
                const orderQuantity = product.quantity || 0;
                return orderQuantity > stockQuantity && stockQuantity > 0;
            });
        }
    },
    async created() {
        await this.fetchLastProducts();
        await this.loadServices();
    },
    methods: {
        async onFocus() {
            this.showProductDropdown = true;
            if (!this.lastProducts || this.lastProducts.length === 0) {
                await this.fetchLastProducts();
            }
        },
        async loadServices() {
            this.servicesLoading = true;
            try {
                const servicesData = await BasementProductController.getItems(1, false);
                this.services = servicesData.items || [];
            } catch (error) {
                console.error('Error loading services:', error);
                this.services = [];
            } finally {
                this.servicesLoading = false;
            }
        },
        async fetchLastProducts() {
            try {
                const prodPage = await BasementProductController.getItems(1, true);
                let products = prodPage.items || [];
                
                this.lastProducts = products
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 10);
            } catch (error) {
                console.error('Error fetching products:', error);
                this.lastProducts = [];
            }
        },
        searchProducts: debounce(async function () {
            if (this.productSearch.length >= 3) {
                this.productSearchLoading = true;
                try {
                    const results = await BasementProductController.searchItems(this.productSearch);
                    // Фильтруем только товары (type === 1 или type === true)
                    const productsOnly = results.filter(item => item.type === 1 || item.type === true || item.type === '1');
                    this.productResults = productsOnly;
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
                this.showProductDropdown = false;
                this.productSearch = '';
                this.productResults = [];

                // Всегда создаем новую строку для товара
                const productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                if (productDto && product.id) {
                    productDto.productId = product.id;
                    // Если выбран проект, используем оптовую цену, иначе розничную
                    if (this.projectId && product.wholesale_price > 0) {
                        productDto.price = product.wholesale_price || 0;
                    } else {
                        productDto.price = product.retail_price || 0;
                    }
                    // Сохраняем тип товара
                    productDto.type = product.type || 1;
                    
                    // Проверяем единицу измерения
                    const unitShortName = productDto.unitShortName || productDto.unit_short_name || '';
                    const unitName = productDto.unitName || productDto.unit_name || '';
                    const isSquareMeter = unitShortName === 'м²' || unitName === 'Квадратный метр';
                    
                    if (isSquareMeter) {
                        // Для м² инициализируем ширину и длину
                        this.productDimensions[product.id] = { width: 0, length: 0 };
                        productDto.width = 0;
                        productDto.height = 0;
                        productDto.quantity = 0;
                    } else {
                        // Для остальных единиц просто устанавливаем количество
                        productDto.quantity = 0;
                        productDto.width = 0;
                        productDto.height = 0;
                    }
                }
                this.products = [...this.products, productDto];
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch (error) {
                console.error('Error selecting product:', error);
            }
        },
        selectService(service) {
            try {
                // Всегда создаем новую строку для услуги
                const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                if (productDto && service.id) {
                    productDto.productId = service.id; // Услуги тоже имеют productId
                    // Если выбран проект, используем оптовую цену, иначе розничную
                    if (this.projectId && service.wholesale_price > 0) {
                        productDto.price = service.wholesale_price || 0;
                    } else {
                        productDto.price = service.retail_price || 0;
                    }
                    // Сохраняем тип (услуги имеют type = 0)
                    productDto.type = service.type || 0;
                    
                    // Проверяем единицу измерения
                    const unitShortName = productDto.unitShortName || productDto.unit_short_name || '';
                    const unitName = productDto.unitName || productDto.unit_name || '';
                    const isSquareMeter = unitShortName === 'м²' || unitName === 'Квадратный метр';
                    
                    if (isSquareMeter) {
                        // Для м² инициализируем ширину и длину
                        this.productDimensions[service.id] = { width: 0, length: 0 };
                        productDto.width = 0;
                        productDto.height = 0;
                        productDto.quantity = 0;
                    } else {
                        // Для остальных единиц просто устанавливаем количество
                        productDto.quantity = 0;
                        productDto.width = 0;
                        productDto.height = 0;
                    }
                }
                this.products = [...this.products, productDto];
                this.updateTotals();
            } catch (error) {
                console.error('Error selecting service:', error);
            }
        },
        removeSelectedProduct(index) {
            const productToRemove = this.products[index];
            if (productToRemove) {
                // Удаляем размеры для товара, если это была последняя запись с таким productId
                const remainingProductsWithSameId = this.products.filter((p, i) => 
                    i !== index && p.productId === productToRemove.productId
                );
                if (remainingProductsWithSameId.length === 0) {
                    delete this.productDimensions[productToRemove.productId];
                }
            }
            
            // Удаляем товар по индексу
            this.products = this.products.filter((_, i) => i !== index);
            this.updateTotals();
        },
        handleProductBlur() {
            requestAnimationFrame(() => {
                this.showProductDropdown = false;
            });
        },
        updateTotals() {
            // Для подвальных работников не нужно обновлять суммы
        },
        getDefaultIcon(product) {
            const isProduct = product.type === 1 || product.type === '1' || product.type === true;
            return isProduct
                ? '<i class="fas fa-box text-[#3571A4]" title="Товар"></i>'
                : '<i class="fas fa-concierge-bell text-[#3571A4]" title="Услуга"></i>';
        },
        
        getProductWidth(product) {
            // Сначала проверяем значение в самом продукте
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
            // Сохраняем width в самом продукте
            product.width = value;
        },
        
        getProductLength(product) {
            // Сначала проверяем значение в самом продукте
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
            // Сохраняем height в самом продукте
            product.height = value;
        },
        
        
        calculateQuantity(product) {
            // Расчет количества только для м²
            if (!this.isSquareMeter(product)) {
                return; // Для не-м² единиц количество вводится напрямую
            }
            
            // Инициализируем размеры для товара, если их нет
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            
            // Используем значения из самого продукта или из локального хранилища
            const width = Number(product.width || this.productDimensions[product.productId].width) || 0;
            const length = Number(product.height || this.productDimensions[product.productId].length) || 0;
            
            // Проверяем, что оба поля заполнены и больше 0
            if (!width || !length || width <= 0 || length <= 0) {
                product.quantity = 0; // Минимум для API
                return;
            }
            
            // Проверяем, что числа валидны
            if (isNaN(width) || isNaN(length)) {
                product.quantity = 0; // Минимум для API
                return;
            }
            
            // Для м² - площадь (ширина × длина)
            product.quantity = width * length;
            
            this.updateTotals();
        },
        
        validateInput(product, field) {
            // Инициализируем размеры для товара, если их нет
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            
            // Проверяем значение в самом продукте
            const value = product[field];
            if (value < 0) {
                product[field] = 0;
                this.productDimensions[product.productId][field] = 0;
            }
            this.calculateQuantity(product);
        },
        
        isService(product) {
            // Проверяем, является ли продукт услугой
            // Услуги имеют type = 0, товары имеют type = 1
            const isServiceType = product.type === 0 || product.type === '0' || product.type === false;
            
            // Дополнительная проверка: если у товара нет информации о stock_quantity
            // (undefined, null или пустая строка), то это услуга
            const hasNoStockInfo = product.stock_quantity === undefined || 
                                  product.stock_quantity === null || 
                                  product.stock_quantity === '';
            
            // Если явно указан тип услуги, или если нет информации о типе и остатке
            return isServiceType || (!product.type && hasNoStockInfo);
        },
        
        isSquareMeter(product) {
            // Проверяем, является ли единица измерения квадратным метром
            const unitShortName = product.unitShortName || product.unit_short_name || '';
            const unitName = product.unitName || product.unit_name || '';
            return unitShortName === 'м²' || unitName === 'Квадратный метр';
        },
        
        getStockDisplayValue(product) {
            // Для услуг (type = 0) показываем бесконечный остаток
            if (this.isService(product)) {
                return '∞';
            }
            return product.stock_quantity || 0;
        },
        
        getStockQuantityClass(product) {
            // Для услуг не показываем остаток
            if (this.isService(product)) {
                return 'text-gray-400'; // Серый цвет для услуг
            }
            
            const stockQuantity = product.stock_quantity || 0;
            const orderQuantity = product.quantity || 0;
            
            if (stockQuantity === 0) {
                return 'text-red-600 font-medium'; // Нет в наличии
            } else if (orderQuantity > stockQuantity) {
                return 'text-orange-600 font-medium'; // Превышение остатка
            } else if (stockQuantity <= 5) {
                return 'text-yellow-600 font-medium'; // Мало остатка
            } else {
                return 'text-gray-600'; // Нормальный остаток
            }
        },
        
    },
    watch: {
        productSearch: {
            handler: 'searchProducts',
            immediate: true,
        },
        products: {
            handler(newProducts) {
                // Инициализируем размеры для товаров при загрузке
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

/* Скрываем стрелки у input type="number" */
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
