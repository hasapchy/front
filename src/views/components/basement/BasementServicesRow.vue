<template>
    <div>
        <label class="block mb-2 font-medium text-gray-700">{{ $t('services') }}</label>
        <div v-if="servicesLoading" class="text-center py-4 text-gray-500">{{ $t('loading') }}</div>
        <div v-else-if="services.length === 0" class="text-center py-4 text-gray-500">{{ $t('noData') }}</div>
        <div v-else class="overflow-x-auto">
            <div class="flex space-x-2 pb-1" style="min-width: max-content;">
                <ServiceCard 
                    v-for="service in services" 
                    :key="service.id" 
                    :service="service"
                    @select="selectService" />
            </div>
        </div>
    </div>
</template>

<script>
import BasementProductController from '@/api/BasementProductController';
import WarehouseWriteoffProductDto from '@/dto/warehouse/WarehouseWriteoffProductDto';
import ServiceCard from './ServiceCard.vue';

export default {
    name: 'BasementServicesRow',
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
        }
    },
    data() {
        return {
            services: [],
            servicesLoading: false
        }
    },
    computed: {
        products: {
            get() { return this.modelValue },
            set(val) { this.$emit('update:modelValue', val) }
        }
    },
    async created() {
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
        selectService(service) {
            try {
                const productDto = WarehouseWriteoffProductDto.fromProductDto(service, false);
                if (productDto && service.id) {
                    productDto.productId = service.id;
                    productDto.quantity = 0;
                    productDto.price = service.retail_price || service.wholesale_price || service.purchase_price || 0;
                    productDto.width = 0;
                    productDto.height = 0;
                }
                this.products = [...this.products, productDto];
            } catch (error) {
                console.error('Error selecting service:', error);
            }
        }
    }
}
</script>

<style scoped>
</style>


