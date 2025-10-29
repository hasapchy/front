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

    <!-- Модальное окно для Sale -->
    <SideModalDialog v-if="sourceType && sourceType.includes('Sale')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <SaleCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <!-- Модальное окно для Order -->
    <SideModalDialog v-if="sourceType && sourceType.includes('Order')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <OrderCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <!-- Модальное окно для WhReceipt -->
    <SideModalDialog v-if="sourceType && (sourceType.includes('WhReceipt') || sourceType.includes('WarehouseReceipt'))" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <WarehousesReceiptCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <!-- Модальное окно для Transaction -->
    <SideModalDialog v-if="sourceType && sourceType.includes('Transaction')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <TransactionCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" @close-request="() => modalOpen = false" />
    </SideModalDialog>
</template>

<script>
import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
import OrderCreatePage from '@/views/pages/orders/OrderCreatePage.vue';
import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
import { defineAsyncComponent } from 'vue';

const TransactionCreatePage = defineAsyncComponent(() => 
    import('@/views/pages/transactions/TransactionCreatePage.vue')
);

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
    components: {
        SideModalDialog,
        SaleCreatePage,
        OrderCreatePage,
        WarehousesReceiptCreatePage
    },
    data() {
        return {
            modalOpen: false,
            editingItem: null,
            loading: false
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
            
            console.log('[SourceButtonCell] openSourceModal:', { sourceType: this.sourceType, sourceId: this.sourceId });
            
            this.loading = true;
            try {
                // Загружаем данные для редактирования
                if (this.sourceType.includes('Sale')) {
                    console.log('[SourceButtonCell] Loading Sale...');
                    const SaleController = (await import('@/api/SaleController')).default;
                    const saleData = await SaleController.getItem(this.sourceId);
                    console.log('[SourceButtonCell] Sale data:', saleData);
                    console.log('[SourceButtonCell] Sale data type:', saleData.constructor.name);
                    this.editingItem = saleData;
                } else if (this.sourceType.includes('Order')) {
                    console.log('[SourceButtonCell] Loading Order...');
                    const OrderController = (await import('@/api/OrderController')).default;
                    const orderData = await OrderController.getItem(this.sourceId);
                    console.log('[SourceButtonCell] Order data:', orderData);
                    console.log('[SourceButtonCell] Order data type:', orderData.constructor.name);
                    this.editingItem = orderData;
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    console.log('[SourceButtonCell] Loading WarehouseReceipt...');
                    const WarehouseReceiptController = (await import('@/api/WarehouseReceiptController')).default;
                    const receiptData = await WarehouseReceiptController.getItem(this.sourceId);
                    console.log('[SourceButtonCell] Receipt data:', receiptData);
                    console.log('[SourceButtonCell] Receipt data type:', receiptData.constructor.name);
                    this.editingItem = receiptData;
                } else if (this.sourceType.includes('Transaction')) {
                    console.log('[SourceButtonCell] Loading Transaction...');
                    const TransactionController = (await import('@/api/TransactionController')).default;
                    const transactionData = await TransactionController.getItem(this.sourceId);
                    console.log('[SourceButtonCell] Transaction data:', transactionData);
                    console.log('[SourceButtonCell] Transaction data type:', transactionData.constructor.name);
                    this.editingItem = transactionData;
                } else {
                    console.warn('[SourceButtonCell] Unknown source type:', this.sourceType);
                }
                
                console.log('[SourceButtonCell] Final editingItem:', this.editingItem);
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
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onUpdated) {
                this.onUpdated();
            }
        },
        handleDeleted() {
            this.modalOpen = false;
            this.editingItem = null;
            // Вызываем колбэк для обновления данных в родительском компоненте
            if (this.onDeleted) {
                this.onDeleted();
            }
        }
    }
};
</script>
