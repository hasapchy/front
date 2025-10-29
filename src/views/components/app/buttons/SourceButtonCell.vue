<template>
    <div v-if="sourceType && sourceId" 
        class="w-full h-full cursor-pointer text-[#2a6496] hover:underline rounded flex items-center"
        @dblclick.stop="openSourceModal">
        <i :class="iconClass" class="mr-2"></i>
        <span v-html="displayText"></span>
    </div>
    <div v-else class="w-full h-full flex items-center">
        <i class="fas fa-circle text-[#6C757D] mr-2"></i>
        <span>{{ defaultText }}</span>
    </div>

    <!-- Модальные окна с динамической загрузкой - избегаем циклических зависимостей -->
    <component 
        v-if="modalOpen && modalComponent" 
        :is="modalComponent" 
        :showForm="modalOpen" 
        :onclose="() => modalOpen = false">
        <component 
            v-if="editingItem"
            :is="modalContentComponent"
            :editingItem="editingItem" 
            @saved="handleSaved" 
            @saved-error="() => modalOpen = false" 
            @deleted="handleDeleted" 
            @close-request="() => modalOpen = false" />
    </component>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
    emits: ['updated', 'deleted', 'error'],
    props: {
        sourceType: String,
        sourceId: Number,
        searchQuery: {
            type: String,
            default: ''
        },
        onUpdated: Function,
        onDeleted: Function
    },
    data() {
        return {
            modalOpen: false,
            editingItem: null,
            loading: false,
            modalComponent: null,  // Динамический компонент модального окна
            modalContentComponent: null  // Динамический компонент содержимого
        };
    },
    computed: {
        iconClass() {
            if (this.sourceType.includes('Sale')) {
                return 'fas fa-shopping-cart text-[#5CB85C]';
            } else if (this.sourceType.includes('Order')) {
                return 'fas fa-file-invoice text-[#337AB7]';
            } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                return 'fas fa-box text-[#FFA500]';
            } else if (this.sourceType.includes('Transaction')) {
                return 'fas fa-exchange-alt text-[#6C757D]';
            } else {
                return 'fas fa-link text-[#337AB7]';
            }
        },
        displayText() {
            let text = '';
            
            if (this.sourceType.includes('Sale')) {
                text = `Продажа #${this.sourceId}`;
            } else if (this.sourceType.includes('Order')) {
                text = `Заказ #${this.sourceId}`;
            } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                text = `Оприходование #${this.sourceId}`;
            } else if (this.sourceType.includes('Transaction')) {
                text = `Транзакция #${this.sourceId}`;
            } else {
                text = `Связь #${this.sourceId}`;
            }
            
            if (this.searchQuery && this.searchQuery.trim()) {
                return this.highlightText(text, this.searchQuery);
            }
            
            return text;
        },
        defaultText() {
            return 'Транзакция';
        }
    },
    methods: {
        highlightText(text, search) {
            if (!text || !search) return text;
            const searchStr = String(search).trim();
            if (!searchStr) return text;
            
            const textStr = String(text);
            const regex = new RegExp(`(${searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return textStr.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px; font-weight: bold;">$1</mark>');
        },
        async openSourceModal() {
            if (!this.sourceType || !this.sourceId) return;
            
            this.loading = true;
            try {
                // Загружаем SideModalDialog динамически
                const SideModalDialog = (await import('@/views/components/app/dialog/SideModalDialog.vue')).default;
                this.modalComponent = SideModalDialog;
                
                // Загружаем данные и компонент содержимого динамически - избегаем циклических зависимостей
                if (this.sourceType.includes('Sale')) {
                    const SaleController = (await import('@/api/SaleController')).default;
                    const SaleCreatePage = (await import('@/views/pages/sales/SaleCreatePage.vue')).default;
                    this.editingItem = await SaleController.getItem(this.sourceId);
                    this.modalContentComponent = SaleCreatePage;
                } else if (this.sourceType.includes('Order')) {
                    const OrderController = (await import('@/api/OrderController')).default;
                    const OrderCreatePage = (await import('@/views/pages/orders/OrderCreatePage.vue')).default;
                    this.editingItem = await OrderController.getItem(this.sourceId);
                    this.modalContentComponent = OrderCreatePage;
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    const WarehouseReceiptController = (await import('@/api/WarehouseReceiptController')).default;
                    const WarehousesReceiptCreatePage = (await import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue')).default;
                    this.editingItem = await WarehouseReceiptController.getItem(this.sourceId);
                    this.modalContentComponent = WarehousesReceiptCreatePage;
                } else if (this.sourceType.includes('Transaction')) {
                    const TransactionController = (await import('@/api/TransactionController')).default;
                    const TransactionCreatePage = (await import('@/views/pages/transactions/TransactionCreatePage.vue')).default;
                    this.editingItem = await TransactionController.getItem(this.sourceId);
                    this.modalContentComponent = TransactionCreatePage;
                } else {
                    console.warn('[SourceButtonCell] Unknown source type:', this.sourceType);
                    return;
                }
                
                this.modalOpen = true;
            } catch (error) {
                console.error('[SourceButtonCell] Ошибка загрузки данных:', error);
                this.$emit('error', error);
            } finally {
                this.loading = false;
            }
        },
        handleSaved() {
            this.modalOpen = false;
            this.editingItem = null;
            this.modalComponent = null;
            this.modalContentComponent = null;
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onUpdated) {
                this.onUpdated();
            }
        },
        handleDeleted() {
            this.modalOpen = false;
            this.editingItem = null;
            this.modalComponent = null;
            this.modalContentComponent = null;
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onDeleted) {
                this.onDeleted();
            }
        }
    }
};
</script>
