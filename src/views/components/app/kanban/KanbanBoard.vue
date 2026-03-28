<template>
  <div class="kanban-board-wrapper">
    <div
      v-show="showXScrollArrows && affordanceVisible && canScrollLeft"
      class="xscroll-affordance xscroll-affordance--left"
      :style="xAffordanceLeftStyle"
    >
      <div
        class="xscroll-affordance__chevron"
        @mouseenter="startAutoXScroll(-1)"
        @mouseleave="stopAutoXScroll"
      >
        <i class="fas fa-chevron-left" />
      </div>
    </div>
    <div
      v-show="showXScrollArrows && affordanceVisible && canScrollRight"
      class="xscroll-affordance xscroll-affordance--right"
      :style="xAffordanceRightStyle"
    >
      <div
        class="xscroll-affordance__chevron"
        @mouseenter="startAutoXScroll(1)"
        @mouseleave="stopAutoXScroll"
      >
        <i class="fas fa-chevron-right" />
      </div>
    </div>
    <div
      ref="kanbanBoardXScrollContainer"
      class="kanban-board-container"
      @scroll.passive="updateXScrollState"
    >
      <div class="kanban-board">
        <draggable
          :list="sortedColumns"
          group="columns"
          :animation="200"
          ghost-class="ghost-column"
          drag-class="dragging-column"
          handle=".column-drag-handle"
          :disabled="isMobile"
          class="kanban-columns flex space-x-4"
          @change="handleColumnReorder"
        >
          <KanbanColumn
            v-for="column in sortedColumns"
            :key="column.id"
            :status="column"
            :orders="column.orders"
            :selected-ids="selectedIds"
            :disabled="loading || isMobile"
            :column-drag-disabled="isMobile"
            :is-task-mode="isTaskMode"
            :currency-symbol="currencySymbol"
            :is-project-mode="isProjectMode"
            :has-more="statusMeta[column.id]?.hasMore ?? hasMore"
            :loading="statusMeta[column.id]?.loading ?? false"
            @change="handleOrderMove($event, column.id)"
            @card-dblclick="handleCardDoubleClick"
            @card-select-toggle="handleCardSelectToggle"
            @column-select-toggle="handleColumnSelectToggle"
            @status-updated="$emit('status-updated')"
            @load-more="$emit('load-more', column.id)"
          />
        </draggable>
      </div>
    </div>

    <div
      v-if="loading && !hideLoadingOverlay"
      class="absolute inset-0 bg-white bg-opacity-75 flex items-start justify-start pt-4 rounded-lg z-10 min-h-64 overflow-auto"
    >
      <div class="w-full">
        <KanbanSkeleton :columns-only="true" />
      </div>
    </div>
  </div>
</template>

<script>
import { useWindowSize } from '@vueuse/core';
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanColumn from './KanbanColumn.vue';
import KanbanSkeleton from '@/views/components/app/kanban/KanbanSkeleton.vue';
import xScrollEdgeAffordanceMixin from '@/mixins/xScrollEdgeAffordanceMixin';

export default {
    name: 'KanbanBoard',
    mixins: [xScrollEdgeAffordanceMixin],
    components: {
        draggable: VueDraggableNext,
        KanbanColumn,
        KanbanSkeleton
    },
    props: {
        type: {
            type: String,
            default: 'orders'
        },
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
        isTaskMode: {
            type: Boolean,
            default: false
        },
        hasMore: {
            type: Boolean,
            default: false
        },
        statusMeta: {
            type: Object,
            default: () => ({})
        },
        hideLoadingOverlay: {
            type: Boolean,
            default: false
        }
    },
    emits: ['order-moved', 'card-dblclick', 'card-select-toggle', 'column-select-toggle', 'load-more', 'status-updated'],
    setup() {
        const { width } = useWindowSize();
        return { windowWidth: width };
    },
    data() {
        return {
            xScrollContainerRef: 'kanbanBoardXScrollContainer',
            columnOrder: [],
            sortedColumns: []
        };
    },
    computed: {
        isMobile() {
            return this.windowWidth < 1024;
        },
        storageKey() {
            return this.isTaskMode ? 'kanban_column_order_tasks' : this.isProjectMode ? 'kanban_column_order_projects' : 'kanban_column_order_orders';
        }
    },
    watch: {
        isProjectMode() {
            this.loadColumnOrder();
            this.updateSortedColumns();
        },
        orders() {
            this.updateSortedColumns();
        },
        statuses: {
            handler() {
                this.updateSortedColumns();
            },
            deep: true
        },
        sortedColumns: {
            handler() {
                this.$nextTick(() => this.scheduleUpdateAffordancePosition());
            },
            deep: true,
        },
        loading() {
            this.$nextTick(() => {
                this.updateXScrollState();
                this.scheduleUpdateAffordancePosition();
            });
        },
    },
    mounted() {
        this.loadColumnOrder();
        this.updateSortedColumns();
    },
    methods: {
        getStatusColumns() {
            return this.statuses
                .filter(status => status.isActive !== false)
                .map(status => {
                    const statusOrders = this.orders.filter(order => order.statusId === status.id);
                    return {
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
    }
};
</script>

<style scoped>
.kanban-board-wrapper {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.kanban-board-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #F7FAFC;
}

.xscroll-affordance {
    z-index: 8;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    opacity: 0.35;
    transition: opacity 120ms ease, background 120ms ease;
    user-select: none;
}

.xscroll-affordance--left {
    background: linear-gradient(90deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.00) 100%);
}

.xscroll-affordance--right {
    background: linear-gradient(270deg, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.00) 100%);
}

.xscroll-affordance:hover {
    opacity: 0.95;
}

.xscroll-affordance__chevron {
    width: 58px;
    height: 58px;
    border-radius: 9999px;
    background: rgba(0, 0, 0, 0.35);
    color: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.18);
    pointer-events: auto;
    cursor: pointer;
    font-size: 22px;
}

.kanban-board {
    flex: 1;
    min-height: 0;
    display: flex;
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
