<template>
  <div
    class="kanban-board-wrapper"
    :class="{ 'kanban-board-wrapper--outcome-split': outcomeDropRows.length }"
  >
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
            :disabled="isMobile"
            :column-drag-disabled="isMobile"
            :is-task-mode="isTaskMode"
            :is-project-mode="isProjectMode"
            :has-more="statusMeta[column.id]?.hasMore ?? hasMore"
            :loading="statusMeta[column.id]?.loading ?? false"
            @change="onOrderMove($event, column.id)"
            @card-dblclick="$emit('card-dblclick', $event)"
            @card-select-toggle="$emit('card-select-toggle', $event)"
            @column-select-toggle="(ids, sel) => $emit('column-select-toggle', ids, sel)"
            @status-updated="$emit('status-updated')"
            @load-more="$emit('load-more', column.id)"
            @order-drag-start="onOrderDragStart"
            @order-drag-end="onOrderDragEnd"
          />
        </draggable>
      </div>
    </div>

    <div
      v-if="outcomeDropRows.length"
      class="kanban-outcome-drops flex w-full min-h-0 flex-col border-t border-gray-200 pt-1 dark:border-t-transparent"
    >
      <div
        class="flex min-h-0 flex-1 flex-row transition-opacity duration-150 ease-out"
        :class="orderDragActive ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      >
        <div
          v-for="row in outcomeDropRows"
          :key="row.status.id"
          class="relative min-h-0 min-w-0 flex-1"
          :class="row.boxClass"
          :style="{ backgroundColor: statusAccentFill(row.status) }"
        >
          <span class="pointer-events-none absolute inset-0 z-0 flex min-w-0 items-center justify-center px-3">
            <span class="max-w-full truncate text-center text-xs font-semibold text-gray-900/90">{{
              kanbanStatusLabel(row.status)
            }}</span>
          </span>
          <draggable
            :list="row.list"
            group="orders"
            :animation="200"
            ghost-class="kanban-outcome-drop-ghost"
            drag-class="kanban-outcome-drop-drag"
            :disabled="isMobile"
            class="relative z-[1] h-full min-h-0 w-full"
            @start="onOrderDragStart"
            @end="onOrderDragEnd"
            @change="onOutcomeDropChange($event, row)"
          />
        </div>
      </div>
    </div>

    <div
      v-if="loading && !hideLoadingOverlay"
      class="absolute inset-0 z-10 flex min-h-64 items-start justify-start overflow-auto rounded-lg bg-white/75 pt-4 dark:bg-[color-mix(in_srgb,var(--surface-elevated)_88%,transparent)]"
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
import { kanbanColumnStatuses, statusAccentFill } from '@/utils/kanbanUtils';
import { translateKanbanStatusName } from '@/utils/translationUtils';
export default {
    name: 'KanbanBoard',
    mixins: [xScrollEdgeAffordanceMixin],
    components: {
        draggable: VueDraggableNext,
        KanbanColumn,
        KanbanSkeleton
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
        selectedIds: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
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
            sortedColumns: [],
            failureOutcomeStaging: [],
            successOutcomeStaging: [],
            orderDragActive: false,
        };
    },
    computed: {
        isMobile() {
            return this.windowWidth < 1024;
        },
        storageKey() {
            return this.$storageUi.kanbanColumnOrderStorageKey({
                isTaskMode: this.isTaskMode,
                isProjectMode: this.isProjectMode,
            });
        },
        outcomeDropRows() {
            if (this.isMobile) {
                return [];
            }
            const f = kanbanColumnStatuses(this.statuses).find((s) => s.kanbanOutcome === 'failure');
            const s = kanbanColumnStatuses(this.statuses).find((x) => x.kanbanOutcome === 'success');
            const pair = !!(f && s);
            const rows = [];
            if (f) {
                rows.push({
                    status: f,
                    list: this.failureOutcomeStaging,
                    boxClass: pair ? 'rounded-l-md' : 'rounded-md',
                });
            }
            if (s) {
                rows.push({
                    status: s,
                    list: this.successOutcomeStaging,
                    boxClass: pair ? 'rounded-r-md' : 'rounded-md',
                });
            }
            return rows;
        },
    },
    watch: {
        isProjectMode() {
            this.loadColumnOrder();
            this.updateSortedColumns();
        },
        orders: 'updateSortedColumns',
        statuses: {
            handler: 'updateSortedColumns',
            deep: true,
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
        orderBelongsToStatusColumn(order, statusId) {
            const a = order.statusId;
            if (a == null || statusId == null) {
                return false;
            }
            return a == statusId;
        },
        columnForStatus(status) {
            const bucket = this.statusMeta?.[status.id];
            if (bucket?.items) {
                return { ...status, orders: bucket.items };
            }
            const statusOrders = this.orders.filter((order) => this.orderBelongsToStatusColumn(order, status.id));
            return { ...status, orders: statusOrders };
        },
        getStatusColumns() {
            return kanbanColumnStatuses(this.statuses).map((status) => this.columnForStatus(status));
        },
        statusAccentFill,
        kanbanStatusLabel(status) {
            return translateKanbanStatusName(status, {
                isProjectMode: this.isProjectMode,
                isTaskMode: this.isTaskMode,
                t: this.$t,
            });
        },
        onOrderDragStart() {
            this.$nextTick(() => {
                this.orderDragActive = true;
            });
        },
        onOrderDragEnd() {
            this.orderDragActive = false;
        },
        onOrderMove(evt, columnId) {
            const a = evt.added;
            if (!a) {
                return;
            }
            this.$emit('order-moved', {
                orderId: a.element.id,
                statusId: columnId,
                type: 'status',
            });
        },
        onOutcomeDropChange(evt, row) {
            if (!evt.added) {
                return;
            }
            const moved = evt.added.element;
            const targetStatusId = row.status?.id;
            const i = row.list.indexOf(moved);
            if (i !== -1) {
                row.list.splice(i, 1);
            }
            const bucket = targetStatusId != null ? this.statusMeta[targetStatusId] : null;
            if (
                targetStatusId != null
                && this.orderBelongsToStatusColumn(moved, targetStatusId)
            ) {
                if (bucket?.items && bucket.items.indexOf(moved) === -1) {
                    bucket.items.push(moved);
                }
                return;
            }
            if (bucket?.items && bucket.items.indexOf(moved) === -1) {
                bucket.items.push(moved);
            }
            this.$emit('order-moved', {
                orderId: moved.id,
                statusId: targetStatusId,
                type: 'status',
            });
        },
        handleColumnReorder() {
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

.kanban-board-wrapper--outcome-split {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 13fr) minmax(2.25rem, 2fr);
}

.kanban-board-wrapper--outcome-split .kanban-board-container {
    min-width: 0;
    min-height: 0;
}

.kanban-board-wrapper--outcome-split .kanban-outcome-drops {
    min-width: 0;
    min-height: 2.25rem;
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

.kanban-outcome-drop-ghost {
    opacity: 0.45;
    border: 2px dashed #3b82f6;
    border-radius: 6px;
}

.kanban-outcome-drop-drag {
    opacity: 0.85;
}
</style>
