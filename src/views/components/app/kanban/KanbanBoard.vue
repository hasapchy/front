<template>
    <div class="kanban-board-wrapper">
        <!-- Toolbar канбана -->
        <div class="kanban-toolbar flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm">
            <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-columns text-blue-500"></i>
                    <span class="text-sm text-gray-700 font-semibold">{{ $t('kanbanByStatuses') }}</span>
                </div>

                <!-- Компактный вид -->
                <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" v-model="compactView" class="cursor-pointer" />
                    <span class="text-sm text-gray-600">{{ $t('compactView') }}</span>
                </label>
            </div>

            <!-- Статистика -->
            <div class="flex items-center space-x-4 text-sm text-gray-600">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-clipboard-list"></i>
                    <span>{{ $t('total') }}: <strong>{{ totalOrders }}</strong></span>
                </div>
                <div v-if="totalAmount > 0" class="flex items-center space-x-1">
                    <i class="fas fa-coins"></i>
                    <span>{{ totalAmount.toFixed(2) }} {{ currencySymbol }}</span>
                </div>
            </div>
        </div>

        <!-- Канбан доска -->
        <div class="kanban-board overflow-x-auto pb-4">
            <draggable
                :list="sortedColumns"
                group="columns"
                :animation="200"
                ghost-class="ghost-column"
                drag-class="dragging-column"
                handle=".column-drag-handle"
                @change="handleColumnReorder"
                class="kanban-columns flex space-x-4"
                :class="{ 'compact': compactView }"
            >
                <KanbanColumn
                    v-for="column in sortedColumns"
                    :key="column.id"
                    :status="column"
                    :orders="column.orders"
                    :selected-ids="selectedIds"
                    :disabled="loading"
                    :currency-symbol="currencySymbol"
                    :is-project-mode="isProjectMode"
                    @change="handleOrderMove($event, column.id)"
                    @card-dblclick="handleCardDoubleClick"
                    @card-select-toggle="handleCardSelectToggle"
                />
            </draggable>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i>
        </div>
    </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanColumn from './KanbanColumn.vue';

export default {
    name: 'KanbanBoard',
    components: {
        draggable: VueDraggableNext,
        KanbanColumn
    },
    props: {
        orders: {
            type: Array,
            required: true
        },
        statuses: {
            type: Array,
            required: true
        },
        projects: {
            type: Array,
            default: () => []
        },
        selectedIds: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        currencySymbol: {
            type: String,
            default: ''
        },
        isProjectMode: {
            type: Boolean,
            default: false
        }
    },
    emits: ['order-moved', 'card-dblclick', 'card-select-toggle'],
    data() {
        return {
            compactView: false,
            columnOrder: [], // Массив ID колонок в пользовательском порядке
            sortedColumns: [] // Отсортированные колонки для отображения
        };
    },
    computed: {
        totalOrders() {
            return this.orders.length;
        },
        totalAmount() {
            return this.orders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalPrice) || 0);
            }, 0);
        },
        // Ключ для localStorage в зависимости от режима (проекты/заказы)
        storageKey() {
            return this.isProjectMode ? 'kanban_column_order_projects' : 'kanban_column_order_orders';
        }
    },
    methods: {
        getStatusColumns() {
            // Создаем колонки на основе статусов заказов
            return this.statuses.map(status => {
                const statusOrders = this.orders.filter(order => order.statusId === status.id);
                return {
                    // Передаем весь объект status со всеми полями (включая category)
                    ...status,
                    orders: statusOrders,
                    type: 'status'
                };
            });
        },
        handleOrderMove(evt, targetColumnId) {
            if (!evt.added) return;

            const movedOrder = evt.added.element;
            
            // Перемещение всегда изменяет статус заказа
            const updateData = {
                orderId: movedOrder.id,
                statusId: targetColumnId,
                type: 'status'
            };

            this.$emit('order-moved', updateData);
        },
        handleCardDoubleClick(order) {
            this.$emit('card-dblclick', order);
        },
        handleCardSelectToggle(orderId) {
            this.$emit('card-select-toggle', orderId);
        },
        handleColumnReorder() {
            // Когда пользователь меняет порядок колонок через drag&drop
            const order = this.sortedColumns.map(col => col.id);
            this.columnOrder = order;
            localStorage.setItem(this.storageKey, JSON.stringify(order));
        },
        loadColumnOrder() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    this.columnOrder = JSON.parse(saved);
                }
            } catch (error) {
                console.error('Error loading column order:', error);
                this.columnOrder = [];
            }
        },
        updateSortedColumns() {
            // Получаем колонки по статусам
            const statusColumns = this.getStatusColumns();
            
            // Если нет сохраненного порядка, используем как есть
            if (!this.columnOrder || this.columnOrder.length === 0) {
                this.sortedColumns = statusColumns;
                return;
            }
            
            // Сортируем колонки согласно сохраненному порядку
            const orderedColumns = [];
            const columnMap = new Map(statusColumns.map(col => [col.id, col]));
            
            // Сначала добавляем колонки в сохраненном порядке
            this.columnOrder.forEach(id => {
                if (columnMap.has(id)) {
                    orderedColumns.push(columnMap.get(id));
                    columnMap.delete(id);
                }
            });
            
            // Затем добавляем новые колонки, которых не было в сохраненном порядке
            columnMap.forEach(col => {
                orderedColumns.push(col);
            });
            
            this.sortedColumns = orderedColumns;
        }
    },
    watch: {
        compactView(newValue) {
            localStorage.setItem('kanban_compactView', newValue);
        },
        isProjectMode() {
            // При переключении режима загружаем соответствующий порядок
            this.loadColumnOrder();
            this.updateSortedColumns();
        },
        orders: {
            handler() {
                this.updateSortedColumns();
            },
            deep: true
        },
        statuses: {
            handler() {
                this.updateSortedColumns();
            },
            deep: true
        }
    },
    mounted() {
        // Восстанавливаем настройки из localStorage
        const savedCompactView = localStorage.getItem('kanban_compactView');
        if (savedCompactView !== null) {
            this.compactView = savedCompactView === 'true';
        }
        
        // Загружаем порядок колонок
        this.loadColumnOrder();
        
        // Инициализируем отсортированные колонки
        this.updateSortedColumns();
    }
};
</script>

<style scoped>
.kanban-board-wrapper {
    position: relative;
    max-width: 100%;
    overflow-x: auto;
}

.kanban-board {
    overflow-x: visible;
    overflow-y: visible;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #F7FAFC;
}

.kanban-board-wrapper::-webkit-scrollbar {
    height: 8px;
}

.kanban-board-wrapper::-webkit-scrollbar-track {
    background: #F7FAFC;
    border-radius: 4px;
}

.kanban-board-wrapper::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 4px;
}

.kanban-board-wrapper::-webkit-scrollbar-thumb:hover {
    background-color: #A0AEC0;
}

.kanban-columns.compact .kanban-column {
    width: 280px;
    min-width: 280px;
}

/* Стили для перетаскивания колонок */
.ghost-column {
    opacity: 0.4;
    background: #e3f2fd;
    border: 2px dashed #2196f3;
}

.dragging-column {
    opacity: 0.8;
    transform: rotate(1deg);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
</style>

