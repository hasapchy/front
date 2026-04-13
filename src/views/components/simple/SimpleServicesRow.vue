<template>
  <div>
    <label class="mb-2 block font-medium text-[var(--text-primary)]">{{ $t('services') }}</label>
    <div
      v-if="servicesLoading"
      class="py-4 text-center text-[var(--text-secondary)]"
    >
      {{ $t('loading') }}
    </div>
    <CardViewEmptyState
      v-else-if="sortedServices.length === 0"
    />
    <div
      v-else
      class="overflow-x-auto"
    >
      <div
        class="flex space-x-2 pb-1"
        style="min-width: max-content;"
      >
        <ServiceCard 
          v-for="(service, index) in sortedServices" 
          :key="service.id" 
          :service="service"
          :draggable="true"
          @select="selectService"
          @dragstart="onDragStart($event, index)"
          @dragover.prevent="onDragOver($event, index)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ProductController from '@/api/ProductController';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import { roundValue } from '@/utils/numberUtils';
import { catalogToDocumentMultiplier } from '@/utils/catalogToDocumentMultiplier';
import { getUserFromStorage } from '@/utils/userUtils';
import ServiceCard from './ServiceCard.vue';
import CardViewEmptyState from '@/views/components/app/cards/CardViewEmptyState.vue';

export default {
    name: 'SimpleServicesRow',
    components: { ServiceCard, CardViewEmptyState },
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
        },
        documentCurrencyId: {
            type: [Number, String],
            default: null,
        },
    },
    emits: ['update:modelValue'],
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
            const u = getUserFromStorage();
            if (u?.id) {
                return u.id;
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
            } catch {
                this.services = [];
            } finally {
                this.servicesLoading = false;
            }
        },
        async selectService(service) {
            try {
                const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                if (productDto && service.id) {
                    productDto.productId = service.id;
                    let mult = 1;
                    if (this.documentCurrencyId) {
                        mult = await catalogToDocumentMultiplier(
                            this.documentCurrencyId,
                            this.$store.state.currencies || []
                        );
                    }
                    const retail = Number(service.retailPrice) || 0;
                    const wholesale = Number(service.wholesalePrice) || 0;
                    if (this.projectId && wholesale > 0) {
                        productDto.price = roundValue(wholesale * mult);
                    } else {
                        productDto.price = roundValue(retail * mult);
                    }
                    productDto.type = service.type || 0;
                    
                    const unitId = productDto.unitId;
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
            } catch {
                void 0;
            }
        },
        getLocalStorageKey() {
            return this.$storageUi.simpleServicesOrderStorageKey(this.userId);
        },
        getSavedOrder() {
            try {
                const saved = localStorage.getItem(this.getLocalStorageKey());
                return saved ? JSON.parse(saved) : [];
            } catch {
                return [];
            }
        },
        saveOrder(serviceIds) {
            try {
                localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(serviceIds));
            } catch {
                void 0;
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


