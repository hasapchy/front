<template>
    <div class="kanban-board-wrapper">
        <!-- Toolbar канбана - фиксированный по ширине -->
        <div class="kanban-toolbar flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm">
            <div class="flex items-center space-x-3">
                <!-- Компактный вид -->
                <PrimaryButton 
                    :onclick="() => compactView = !compactView"
                    :icon="compactView ? 'fas fa-expand-arrows-alt' : 'fas fa-compress-arrows-alt'"
                    :isLight="true"
                    :title="$t('compactView')"
                />

                <!-- Батч операции -->
                <div v-if="selectedIds.length > 0" class="flex items-center space-x-2">
                    <!-- Счетчик выбранных -->
                    <div class="text-sm text-gray-600">
                        <span>{{ $t('selected') }}: <strong>{{ selectedIds.length }}</strong></span>
                    </div>
                    
                    <!-- Очистить выбор -->
                    <PrimaryButton 
                        :onclick="() => $emit('clear-selection')"
                        icon="fas fa-times"
                        :isLight="true"
                        :title="$t('clearSelection')"
                    />
                    
                    <!-- Разделитель -->
                    <div class="w-px h-4 bg-gray-300"></div>
                    
                    <!-- Батч операции -->
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
            </div>

            <!-- Статистика -->
            <div class="flex items-center space-x-4 text-sm text-gray-600">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-clipboard-list"></i>
                    <span>{{ $t('total') }}: <strong>{{ totalOrders }}</strong></span>
                </div>
                <div v-if="totalAmount > 0" class="flex items-center space-x-1">
                    <i class="fas fa-coins"></i>
                    <span>{{ formatAmount(totalAmount) }} {{ currencySymbol }}</span>
                </div>
            </div>
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
            compactView: false,
            columnOrder: [],
            sortedColumns: []
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
        // Режим для хранения порядка колонок
        kanbanMode() {
            return this.isProjectMode ? 'projects' : 'orders';
        }
    },
    methods: {
        formatAmount(amount) {
            try {
                const roundingEnabled = this.$store.getters.roundingEnabled;
                const decimals = roundingEnabled ? this.$store.getters.roundingDecimals : 2;
                const value = Number(amount || 0);
                return isNaN(value) ? '0' : value.toFixed(decimals);
            } catch (e) {
                return String(amount ?? 0);
            }
        },
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
            this.$store.dispatch('setKanbanColumnOrder', {
                mode: this.kanbanMode,
                order: order
            });
        },
        loadColumnOrder() {
            const saved = this.$store.getters.getKanbanColumnOrder(this.kanbanMode);
            if (saved && Array.isArray(saved)) {
                this.columnOrder = saved;
            } else {
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
        compactView(newValue) {
            this.$store.dispatch('setKanbanCompactView', newValue);
        },
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
        // Восстанавливаем настройки из store
        const savedCompactView = this.$store.getters.getKanbanCompactView;
        if (savedCompactView !== null && savedCompactView !== undefined) {
            this.compactView = savedCompactView;
        }
        
        // Загружаем порядок колонок
        this.loadColumnOrder();
        
        // Инициализируем отсортированные колонки
        this.updateSortedColumns();
    }
};
</script>

