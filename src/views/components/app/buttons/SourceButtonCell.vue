<template>
    <div class="w-full h-full px-2 py-2 cursor-pointer text-[#2a6496] hover:underline rounded"
        @click.stop="openSourceModal"
        v-html="displayText">
    </div>

    <SideModalDialog :showForm="modalOpen" :onclose="() => modalOpen = false">
        <!-- Продажа -->
        <SaleCreatePage v-if="modalOpen && sourceType === 'App\\Models\\Sale'" 
            :editingItem="sourceData" 
            @saved="handleSaved" 
            @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
        
        <!-- Заказ -->
        <OrderCreatePage v-if="modalOpen && sourceType === 'App\\Models\\Order'" 
            :editingItem="sourceData" 
            @saved="handleSaved" 
            @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
        
        <!-- Оприходование -->
        <WarehousesReceiptCreatePage v-if="modalOpen && sourceType === 'App\\Models\\WarehouseReceipt'" 
            :editingItem="sourceData" 
            @saved="handleSaved" 
            @saved-error="() => modalOpen = false"
            @deleted="handleDeleted" />
    </SideModalDialog>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
import OrderCreatePage from '@/views/pages/orders/OrderCreatePage.vue';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';

export default {
    props: {
        sourceType: String,
        sourceId: Number,
        transaction: Object
    },
    components: {
        SideModalDialog,
        SaleCreatePage,
        OrderCreatePage,
        WarehousesReceiptCreatePage
    },
    data() {
        return {
            modalOpen: false,
            sourceData: null
        }
    },
    computed: {
        displayText() {
            if (!this.sourceType || !this.sourceId) return '-';
            
            switch (this.sourceType) {
                case 'App\\Models\\Sale':
                    return `Продажа #${this.sourceId}`;
                case 'App\\Models\\Order':
                    return `Заказ #${this.sourceId}`;
                case 'App\\Models\\WarehouseReceipt':
                    return `Оприходование #${this.sourceId}`;
                default:
                    return `Операция #${this.sourceId}`;
            }
        }
    },
    methods: {
        async openSourceModal() {
            if (!this.sourceType || !this.sourceId) return;
            
            try {
                this.modalOpen = true;
                // Загружаем данные источника
                await this.loadSourceData();
            } catch (error) {
                console.error('Ошибка при открытии источника:', error);
                this.modalOpen = false;
            }
        },
        
        async loadSourceData() {
            try {
                let data = null;
                
                switch (this.sourceType) {
                    case 'App\\Models\\Sale':
                        const SaleController = (await import('@/api/SaleController')).default;
                        data = await SaleController.getItem(this.sourceId);
                        break;
                    case 'App\\Models\\Order':
                        const OrderController = (await import('@/api/OrderController')).default;
                        data = await OrderController.getItem(this.sourceId);
                        break;
                    case 'App\\Models\\WarehouseReceipt':
                        const WarehouseReceiptController = (await import('@/api/WarehouseReceiptController')).default;
                        data = await WarehouseReceiptController.getItem(this.sourceId);
                        break;
                }
                
                this.sourceData = data;
            } catch (error) {
                console.error('Ошибка загрузки данных источника:', error);
                throw error;
            }
        },
        
        handleSaved() {
            this.modalOpen = false;
            this.$emit('saved');
        },
        
        handleDeleted() {
            this.modalOpen = false;
            this.$emit('deleted');
        }
    }
}
</script>
