<template>
    <div>
        <label class="block mb-2 font-medium text-gray-700">{{ $t('services') }}</label>
        <div v-if="servicesLoading" class="text-center py-4 text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="sortedServices.length === 0" class="text-center py-4 text-gray-500">{{ $t('noData') }}</div>
        <div v-else class="overflow-x-auto">
            <div class="flex space-x-2 pb-1" style="min-width: max-content;">
                <ServiceCard 
                    v-for="(service, index) in sortedServices" 
                    :key="service.id" 
                    :service="service"
                    :draggable="true"
                    @select="selectService"
                    @dragstart="onDragStart($event, index)"
                    @dragover.prevent="onDragOver($event, index)"
                    @drop="onDrop($event, index)"
                    @dragend="onDragEnd" />
            </div>
        </div>
    </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ServiceCard from './ServiceCard.vue';

export default {
    name: 'SimpleServicesRow',
    components: { ServiceCard },
    emits: ['update:modelValue'],
    props: {
        modelValue: {
            type: Array,
            default: () => []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        projectId: {
            type: [String, Number],
            default: null
        }
    },
    data() {
        return {
            services: [],
            servicesLoading: false,
            draggedIndex: null,
            dragOverIndex: null
        }
    },
    computed: {
        products: {
            get() { return this.modelValue },
            set(val) { this.$emit('update:modelValue', val) }
        },
        sortedServices() {
            // Получаем сохраненный порядок из localStorage
            const savedOrder = this.getSavedOrder();
            
            if (!savedOrder || savedOrder.length === 0) {
                return this.services;
            }
            
            // Создаем карту id -> service для быстрого поиска
            const servicesMap = new Map(this.services.map(s => [s.id, s]));
            
            // Сортируем согласно сохраненному порядку
            const sorted = savedOrder
                .map(id => servicesMap.get(id))
                .filter(s => s !== undefined); // Убираем undefined для удаленных услуг
            
            // Добавляем новые услуги, которых нет в сохраненном порядке
            const savedIds = new Set(savedOrder);
            const newServices = this.services.filter(s => !savedIds.has(s.id));
            
            return [...sorted, ...newServices];
        },
        userId() {
            // Получаем ID пользователя из store или localStorage (для simple workers)
            if (this.$store.state.user?.id) {
                return this.$store.state.user.id;
            }
            
            // Для simple workers проверяем localStorage
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    return user.id || 'guest';
                }
            } catch (error) {
            }
            
            return 'guest';
        }
    },
    async created() {
        await this.loadServices();
    },
    methods: {
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
                    
                    const unitId = productDto.unitId || productDto.unit_id;
                    const isSquareMeter = unitId === 2;
                    
                    if (isSquareMeter) {
                        productDto.width = 0;
                        productDto.height = 0;
                        productDto.quantity = 0;
                    } else {
                        productDto.quantity = 0;
                        productDto.width = 0;
                        productDto.height = 0;
                    }
                }
                
                const existingIndex = this.products.findIndex(p => 
                    p.productId === productDto.productId &&
                    p.price === productDto.price &&
                    (p.width || 0) === (productDto.width || 0) &&
                    (p.height || 0) === (productDto.height || 0)
                );
                
                if (existingIndex !== -1) {
                    const existing = this.products[existingIndex];
                    const newQuantity = (Number(existing.quantity) || 0) + (Number(productDto.quantity) || 0);
                    this.products[existingIndex] = {
                        ...existing,
                        quantity: newQuantity
                    };
                } else {
                    this.products = [...this.products, productDto];
                }
            } catch (error) {
            }
        },
        getLocalStorageKey() {
            return `simple_services_order_${this.userId}`;
        },
        getSavedOrder() {
            try {
                const saved = localStorage.getItem(this.getLocalStorageKey());
                return saved ? JSON.parse(saved) : [];
            } catch (error) {
                return [];
            }
        },
        saveOrder(serviceIds) {
            try {
                localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(serviceIds));
            } catch (error) {
            }
        },
        onDragStart(event, index) {
            this.draggedIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', event.target.innerHTML);
            // Добавляем класс для визуализации перетаскивания
            event.target.style.opacity = '0.5';
        },
        onDragOver(event, index) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            this.dragOverIndex = index;
        },
        onDrop(event, dropIndex) {
            event.preventDefault();
            
            if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
                return;
            }
            
            // Создаем новый массив с измененным порядком
            const newServices = [...this.sortedServices];
            const draggedService = newServices[this.draggedIndex];
            
            // Удаляем элемент из старой позиции
            newServices.splice(this.draggedIndex, 1);
            
            // Вставляем на новую позицию
            newServices.splice(dropIndex, 0, draggedService);
            
            // Сохраняем новый порядок ID в localStorage
            const newOrder = newServices.map(s => s.id);
            this.saveOrder(newOrder);
            
            // Обновляем services для перерисовки
            this.services = newServices;
        },
        onDragEnd(event) {
            // Сбрасываем стиль после завершения перетаскивания
            event.target.style.opacity = '1';
            this.draggedIndex = null;
            this.dragOverIndex = null;
        }
    }
}
</script>

<style scoped>
</style>


