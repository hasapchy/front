<template>
    <div class="kanban-board-wrapper">
        <!-- Батч операции -->
        <div v-if="selectedIds.length > 0" class="flex items-center space-x-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
            <div class="text-sm text-gray-600">
                <span>{{ $t('selected') }}: <strong>{{ selectedIds.length }}</strong></span>
            </div>
            
            <PrimaryButton 
                :onclick="() => $emit('clear-selection')"
                icon="fas fa-times"
                :isLight="true"
                :title="$t('clearSelection')"
            />
            
            <div class="w-px h-4 bg-gray-300"></div>
            
            <select 
                :value="batchStatusId"
                @change="$emit('batch-status-change', $event.target.value)"
                class="px-3 py-1 border border-gray-300 rounded bg-white text-sm">
                <option value="">{{ $t('changeStatus') }}</option>
                <option v-for="status in statuses" :key="status.id" :value="status.id">
                    {{ status.name }}
                </option>
            </select>
            <PrimaryButton 
                :onclick="() => $emit('batch-delete')"
                icon="fas fa-trash"
                :isLight="true"
                :title="$t('delete')"
            />
        </div>

        <!-- Канбан доска - контейнер со скроллом -->
        <div class="kanban-board-container" ref="boardContainer" @scroll="handleScroll">
            <div class="kanban-board">
                <draggable
                    :list="sortedColumns"
                    group="columns"
                    :animation="200"
                    ghost-class="ghost-column"
                    drag-class="dragging-column"
                    handle=".column-drag-handle"
                    @change="handleColumnReorder"
                    class="kanban-columns flex space-x-4"
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
                        :has-more="hasMore"
                        :loading="loading"
                        @change="handleOrderMove($event, column.id)"
                        @card-dblclick="handleCardDoubleClick"
                        @card-select-toggle="handleCardSelectToggle"
                        @column-select-toggle="handleColumnSelectToggle"
                        @load-more="$emit('load-more')"
                    />
                </draggable>
            </div>
        </div>

        <!-- Индикатор загрузки -->
        <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <SpinnerIcon />
        </div>
    </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanColumn from './KanbanColumn.vue';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import SpinnerIcon from '@/views/components/app/SpinnerIcon.vue';
import debounce from 'lodash.debounce';

export default {
    name: 'KanbanBoard',
    components: {
        draggable: VueDraggableNext,
        KanbanColumn,
        PrimaryButton,
        SpinnerIcon
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
        },
        batchStatusId: {
            type: String,
            default: ''
        },
        hasMore: {
            type: Boolean,
            default: false
        }
    },
    emits: ['order-moved', 'card-dblclick', 'card-select-toggle', 'column-select-toggle', 'batch-status-change', 'batch-delete', 'clear-selection', 'load-more'],
    data() {
        return {
            columnOrder: [],
            sortedColumns: []
        };
    },
    computed: {
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
        handleColumnSelectToggle(orderIds, select) {
            this.$emit('column-select-toggle', orderIds, select);
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
            const statusColumns = this.getStatusColumns();
            
            if (!this.columnOrder || this.columnOrder.length === 0) {
                this.sortedColumns = statusColumns;
                return;
            }
            
            const orderedColumns = [];
            const columnMap = new Map(statusColumns.map(col => [col.id, col]));
            
            this.columnOrder.forEach(id => {
                if (columnMap.has(id)) {
                    orderedColumns.push(columnMap.get(id));
                    columnMap.delete(id);
                }
            });
            
            columnMap.forEach(col => {
                orderedColumns.push(col);
            });
            
            this.sortedColumns = orderedColumns;
        },
        handleScroll: debounce(function() {
            if (!this.hasMore || this.loading) return;
            
            const container = this.$refs.boardContainer;
            if (!container) return;
            
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            if (scrollLeft + clientWidth >= scrollWidth - 200) {
                this.$emit('load-more');
            }
        }, 200)
    },
    watch: {
        isProjectMode() {
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
    width: 100%;
}

/* Контейнер для канбана - скроллится горизонтально */
.kanban-board-container {
    width: 100%;
    overflow-x: auto;
    overflow-y: visible;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #F7FAFC;
}

.kanban-board {
    padding-bottom: 1rem;
}

/* Кастомные скроллбары для webkit браузеров */
.kanban-board-container::-webkit-scrollbar {
    height: 8px;
}

.kanban-board-container::-webkit-scrollbar-track {
    background: #F7FAFC;
    border-radius: 4px;
}

.kanban-board-container::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 4px;
}

.kanban-board-container::-webkit-scrollbar-thumb:hover {
    background-color: #A0AEC0;
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

