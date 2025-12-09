<template>
    <div v-if="sourceType && sourceId && !isSalary" 
        class="w-full h-full cursor-pointer text-[#2a6496] hover:underline rounded flex items-center"
        @dblclick.stop="openSourceModal">
        <i :class="iconClass" class="mr-2"></i>
        <span v-html="displayText"></span>
    </div>
    <div v-else class="w-full h-full flex items-center">
        <i :class="iconClass" class="mr-2"></i>
        <span :class="sourceInfo.color">{{ displayText }}</span>
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
import { markRaw } from 'vue';
import { highlightMatches } from '@/utils/searchUtils';

export default {
    emits: ['updated', 'deleted', 'error'],
    props: {
        sourceType: String,
        sourceId: Number,
        source: {
            type: String,
            default: null
        },
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
        isSalary() {
            return this.sourceType && this.sourceType.includes('EmployeeSalary');
        },
        normalizedSource() {
            if (this.source) {
                return this.source.toLowerCase();
            }
            if (this.sourceType) {
                if (this.sourceType.includes('Sale')) return 'sale';
                if (this.sourceType.includes('Order')) return 'order';
                if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) return 'receipt';
                if (this.sourceType.includes('EmployeeSalary')) return 'salary';
                if (this.sourceType.includes('Transaction')) return 'transaction';
            }
            return 'transaction';
        },
        sourceMap() {
            return {
                'sale': { icon: 'fa-shopping-cart', color: 'text-[#5CB85C]', text: 'Продажа' },
                'order': { icon: 'fa-clipboard-list', color: 'text-[#337AB7]', text: 'Заказ' },
                'receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'wh_receipt': { icon: 'fa-box', color: 'text-[#FFA500]', text: 'Оприходование' },
                'salary': { icon: 'fa-money-bill-wave', color: 'text-[#28A745]', text: 'Зарплата' },
                'transaction': { icon: 'fa-circle', color: 'text-[#6C757D]', text: 'Прочее' }
            };
        },
        sourceInfo() {
            return this.sourceMap[this.normalizedSource] || this.sourceMap['transaction'];
        },
        iconClass() {
            if (this.sourceType && this.sourceId) {
                if (this.sourceType.includes('Sale')) {
                    return 'fas fa-shopping-cart text-[#5CB85C]';
                } else if (this.sourceType.includes('Order')) {
                    return 'fas fa-file-invoice text-[#337AB7]';
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    return 'fas fa-box text-[#FFA500]';
                } else if (this.sourceType.includes('EmployeeSalary')) {
                    return 'fas fa-money-bill-wave text-[#28A745]';
                } else if (this.sourceType.includes('Transaction')) {
                    return 'fas fa-exchange-alt text-[#6C757D]';
                } else {
                    return 'fas fa-link text-[#337AB7]';
                }
            }
            return `fas ${this.sourceInfo.icon} ${this.sourceInfo.color}`;
        },
        displayText() {
            if (this.sourceType && this.sourceId) {
                let text = '';
                
                if (this.sourceType.includes('Sale')) {
                    text = `Продажа #${this.sourceId}`;
                } else if (this.sourceType.includes('Order')) {
                    text = `Заказ #${this.sourceId}`;
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    text = `Оприходование #${this.sourceId}`;
                } else if (this.sourceType.includes('EmployeeSalary')) {
                    text = `Зарплата`;
                } else if (this.sourceType.includes('Transaction')) {
                    text = `Транзакция #${this.sourceId}`;
                } else {
                    text = `Связь #${this.sourceId}`;
                }
                
                if (this.searchQuery && this.searchQuery.trim()) {
                    return highlightMatches(text, this.searchQuery);
                }

                return text;
            }
            
            return this.sourceInfo.text;
        },
        defaultText() {
            return 'Транзакция';
        }
    },
    methods: {
        async openSourceModal() {
            if (!this.sourceType || !this.sourceId || this.isSalary) return;
            
            this.loading = true;
            try {
                // Загружаем SideModalDialog динамически
                const SideModalDialog = (await import('@/views/components/app/dialog/SideModalDialog.vue')).default;
                this.modalComponent = markRaw(SideModalDialog);
                
                // Загружаем данные и компонент содержимого динамически - избегаем циклических зависимостей
                if (this.sourceType.includes('Sale')) {
                    const SaleController = (await import('@/api/SaleController')).default;
                    const SaleCreatePage = (await import('@/views/pages/sales/SaleCreatePage.vue')).default;
                    this.editingItem = await SaleController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(SaleCreatePage);
                } else if (this.sourceType.includes('Order')) {
                    const OrderController = (await import('@/api/OrderController')).default;
                    const OrderCreatePage = (await import('@/views/pages/orders/OrderCreatePage.vue')).default;
                    this.editingItem = await OrderController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(OrderCreatePage);
                } else if (this.sourceType.includes('WhReceipt') || this.sourceType.includes('WarehouseReceipt')) {
                    const WarehouseReceiptController = (await import('@/api/WarehouseReceiptController')).default;
                    const WarehousesReceiptCreatePage = (await import('@/views/pages/warehouses/WarehousesReceiptCreatePage.vue')).default;
                    this.editingItem = await WarehouseReceiptController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(WarehousesReceiptCreatePage);
                } else if (this.sourceType.includes('Transaction')) {
                    const TransactionController = (await import('@/api/TransactionController')).default;
                    const TransactionCreatePage = (await import('@/views/pages/transactions/TransactionCreatePage.vue')).default;
                    this.editingItem = await TransactionController.getItem(this.sourceId);
                    this.modalContentComponent = markRaw(TransactionCreatePage);
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
