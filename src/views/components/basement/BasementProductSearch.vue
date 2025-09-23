<template>
    <div class="space-y-6">

        <!-- Товары - Поиск -->
        <div class="relative">
            <label class="block mb-1" :class="{ 'required': required }">{{ $t('products') }}</label>
            <input type="text" ref="productInput" v-model="productSearch" :placeholder="$t('enterProductNameOrCode')"
                class="w-full p-2 border rounded" @focus="showProductDropdown = true" @blur="handleProductBlur" :disabled="disabled" />

            <!-- Результаты поиска товаров -->
            <transition name="appear">
                <ul v-show="showProductDropdown"
                    class="absolute bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto w-full mt-1 z-10">
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

        <!-- Услуги - Горизонтальный скролл -->
        <div>
            <label class="block mb-2 font-medium text-gray-700">{{ $t('services') }}</label>
            <div v-if="servicesLoading" class="text-center py-4 text-gray-500">{{ $t('loading') }}</div>
            <div v-else-if="services.length === 0" class="text-center py-4 text-gray-500">{{ $t('noData') }}</div>
            <div v-else class="overflow-x-auto">
                <div class="flex space-x-2 pb-1" style="min-width: max-content;">
                    <ServiceCard 
                        v-for="service in filteredServices" 
                        :key="service.id" 
                        :service="service"
                        @select="selectService" />
                </div>
            </div>
        </div>

        <label class="block mt-4 mb-1">{{ $t('specifiedProductsAndServices') }}</label>
        <table class="min-w-full bg-white shadow-md rounded mb-6 w-100">
            <thead class="bg-gray-100 rounded-t-sm">
                <tr>
                    <th class="text-left border border-gray-300 py-2 px-4 font-medium w-48">{{ $t('name') }}</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-20">
                        {{ $t('quantity') }}</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
                        Ширина (м)</th>
                    <th v-if="showQuantity" class="text-left border border-gray-300 py-2 px-4 font-medium w-24">
                        Длина (м)</th>
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
                        <div class="w-full p-1 text-right bg-gray-100 border border-gray-300 rounded text-sm">
                            {{ product.quantity || 0 }} {{ product.unitShortName || product.unit_short_name || '' }}
                        </div>
                    </td>
                    <td v-if="showQuantity" class="py-2 px-4 border-x border-gray-300">
                        <input type="number" :value="getProductWidth(product)" @input="setProductWidth(product, $event.target.value); calculateQuantity(product)" class="w-full p-1 text-right border border-gray-300 rounded"
                            :disabled="disabled" min="0" step="0" 
                            @blur="validateInput(product, 'width')"
                            placeholder="0" />
                    </td>
                    <td v-if="showQuantity" class="py-2 px-4 border-x border-gray-300">
                        <input type="number" :value="getProductLength(product)" @input="setProductLength(product, $event.target.value); calculateQuantity(product)" class="w-full p-1 text-right border border-gray-300 rounded"
                            :disabled="disabled" min="0" step="0"
                            @blur="validateInput(product, 'length')"
                            placeholder="0" />
                    </td>
                    <td class="px-4 border-x border-gray-300">
                        <button @click="removeSelectedProduct(product.productId)"
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
                this.$emit('update:modelValue', value);
            },
        },
        
        filteredServices() {
            return this.services;
        }
    },
    async created() {
        await this.fetchLastProducts();
        await this.loadServices();
    },
    methods: {
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
            if (this.productSearch.length >= 4) {
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

                const existing = this.products.find(p => p.productId === product.id);
                if (existing) {
                    // Если продукт уже существует, увеличиваем количество на 1
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                } else {
                    const productDto = WarehouseWriteoffProductDto.fromProductDto(product, true);
                    if (productDto && product.id) {
                        productDto.productId = product.id;
                        // Устанавливаем количество по умолчанию (минимум 0 для API)
                        productDto.quantity = 0;
                        // Инициализируем размеры для товара
                        this.productDimensions[product.id] = { width: 0, length: 0 };
                    }
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
                this.$refs.productInput.blur();
            } catch (error) {
                console.error('Error selecting product:', error);
            }
        },
        selectService(service) {
            try {
                const existing = this.products.find(p => p.productId === service.id);
                if (existing) {
                    existing.quantity = (Number(existing.quantity) || 0) + 1;
                } else {
                    const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                    if (productDto && service.id) {
                        productDto.productId = service.id;
                        // Устанавливаем количество по умолчанию (минимум 0 для API)
                        productDto.quantity = 0;
                        // Инициализируем размеры для услуги
                        this.productDimensions[service.id] = { width: 0, length: 0 };
                    }
                    this.products = [...this.products, productDto];
                }
                this.updateTotals();
            } catch (error) {
                console.error('Error selecting service:', error);
            }
        },
        removeSelectedProduct(id) {
            this.products = this.products.filter(p => p.productId !== id);
            // Удаляем размеры для товара
            delete this.productDimensions[id];
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
        },
        
        getProductLength(product) {
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
        },
        
        calculateQuantity(product) {
            // Инициализируем размеры для товара, если их нет
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            
            const dimensions = this.productDimensions[product.productId];
            const width = Number(dimensions.width) || 0;
            const length = Number(dimensions.length) || 0;
            
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
            
            // Получаем единицы измерения продукта
            const unitShortName = product.unitShortName || product.unit_short_name || '';
            const unitName = product.unitName || product.unit_name || '';
            
            let calculatedQuantity = 0;
            
            // Логика на основе реальных единиц из базы данных
            if (unitShortName === 'м²' || unitName === 'Квадратный метр') {
                // Квадратный метр: ширина × длина
                calculatedQuantity = width * length;
            }
            else if (unitShortName === 'м' || unitName === 'Метр') {
                // Метр: периметр (2 × ширина + 2 × длина)
                calculatedQuantity = 2 * width + 2 * length;
            }
            else if (unitShortName === 'л' || unitName === 'Литр') {
                // Литр: ширина × длина (площадь для расчета объема)
                calculatedQuantity = width * length;
            }
            else if (unitShortName === 'кг' || unitName === 'Килограмм' || 
                     unitShortName === 'г' || unitName === 'Грамм') {
                // Вес: ширина × длина (площадь для расчета веса)
                calculatedQuantity = width * length;
            }
            else if (unitShortName === 'шт' || unitName === 'Штука') {
                // Штука: округление(ширина × длина)
                calculatedQuantity = Math.round(width * length);
            }
            else if (unitShortName === 'уп' || unitName === 'Упаковка' ||
                     unitShortName === 'кор' || unitName === 'Коробка' ||
                     unitShortName === 'пал' || unitName === 'Паллета' ||
                     unitShortName === 'комп' || unitName === 'Комплект' ||
                     unitShortName === 'рул' || unitName === 'Рулон') {
                // Упаковочные единицы: округление(ширина × длина)
                calculatedQuantity = Math.round(width * length);
            }
            else {
                // Для остальных единиц: ширина × длина
                calculatedQuantity = width * length;
            }
            
            product.quantity = Math.round(calculatedQuantity * 100) / 100; // Округляем до 2 знаков
            
            this.updateTotals();
        },
        
        validateInput(product, field) {
            // Инициализируем размеры для товара, если их нет
            if (!this.productDimensions[product.productId]) {
                this.productDimensions[product.productId] = { width: 0, length: 0 };
            }
            
            const dimensions = this.productDimensions[product.productId];
            const value = dimensions[field];
            if (value < 0) {
                dimensions[field] = 0;
            }
            this.calculateQuantity(product);
        },
        
    },
    watch: {
        productSearch: {
            handler: 'searchProducts',
            immediate: true,
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
</style>
