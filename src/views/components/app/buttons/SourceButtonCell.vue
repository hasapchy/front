<template>
    <!-- ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ИСПРАВЛЕНИЯ ОШИБКИ -->
    <div v-if="sourceType && sourceId" 
        class="w-full h-full flex items-center">
        <i :class="iconClass" class="mr-2"></i>
        <span v-html="displayText"></span>
    </div>
    <div v-else class="w-full h-full flex items-center">
        <i class="fas fa-circle text-[#6C757D] mr-2"></i>
        <span>{{ defaultText }}</span>
    </div>

    <!-- Модальные окна закомментированы -->
    <!-- <SideModalDialog v-if="sourceType && sourceType.includes('Sale')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <SaleCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <SideModalDialog v-if="sourceType && sourceType.includes('Order')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <OrderCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <SideModalDialog v-if="sourceType && (sourceType.includes('WhReceipt') || sourceType.includes('WarehouseReceipt'))" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <WarehousesReceiptCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" />
    </SideModalDialog>

    <SideModalDialog v-if="sourceType && sourceType.includes('Transaction')" :showForm="modalOpen" :onclose="() => modalOpen = false">
        <TransactionCreatePage v-if="modalOpen && editingItem" :editingItem="editingItem" 
            @saved="handleSaved" @saved-error="() => modalOpen = false" @deleted="handleDeleted" @close-request="() => modalOpen = false" />
    </SideModalDialog> -->
</template>

<script>
// ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ИСПРАВЛЕНИЯ ОШИБКИ ЦИКЛИЧЕСКОЙ ЗАВИСИМОСТИ
// import SideModalDialog from '@/views/components/app/dialog/SideModalDialog.vue';
// import SaleCreatePage from '@/views/pages/sales/SaleCreatePage.vue';
// import OrderCreatePage from '@/views/pages/orders/OrderCreatePage.vue';
// import WarehousesReceiptCreatePage from '@/views/pages/warehouses/WarehousesReceiptCreatePage.vue';
// import { defineAsyncComponent } from 'vue';

// const TransactionCreatePage = defineAsyncComponent(() => 
//     import('@/views/pages/transactions/TransactionCreatePage.vue')
// );

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
    // components: {
    //     SideModalDialog,
    //     SaleCreatePage,
    //     OrderCreatePage,
    //     WarehousesReceiptCreatePage
    // },
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
            // ВРЕМЕННО ЗАКОММЕНТИРОВАНО
            // if (!this.sourceType || !this.sourceId) return;
            // console.log('[SourceButtonCell] openSourceModal - временно отключено');
            return;
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
