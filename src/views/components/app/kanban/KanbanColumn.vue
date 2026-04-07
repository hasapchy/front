<template>
  <div
    class="kanban-column flex flex-col h-full rounded-lg"
    :style="{ backgroundColor: lightBackgroundColor }"
  >
    <!-- Заголовок колонки -->
    <div
      class="column-header px-4 py-3 rounded-t-lg"
      :style="{ backgroundColor: statusColor }"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div
            v-if="!columnDragDisabled"
            class="column-drag-handle cursor-move text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            <i class="fas fa-grip-vertical text-sm" />
          </div>
          <h3 class="font-semibold text-white">
            {{ getStatusName(status) }}
          </h3>
          <div class="flex items-center space-x-1">
            <span class="text-xs text-gray-800 bg-white px-2 py-0.5 rounded-full font-medium">
              {{ orders.length }}
            </span>
            <button 
              v-if="orders.length > 0"
              class="w-5 h-5 rounded border-2 border-white flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition-all"
              :class="{ 'bg-white text-gray-800': isAllSelected }"
              :title="isAllSelected ? $t('deselectAll') : $t('selectAll')"
              @click="handleSelectAll"
            >
              <i
                v-if="isAllSelected"
                class="fas fa-check text-xs text-gray-800"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Область для карточек -->
    <div
      ref="scrollContainer"
      class="column-content flex-1 overflow-y-auto p-3"
      @scroll="handleScroll"
    >
      <draggable
        :list="orders"
        group="orders"
        :animation="200"
        ghost-class="ghost-card"
        drag-class="dragging-card"
        :disabled="disabled"
        class="min-h-[200px]"
        @start="handleOrderDragStart"
        @end="handleOrderDragEnd"
        @change="handleChange"
      >
        <div
          v-for="order in orders"
          :key="order.id"
          class="card-wrapper mb-2"
        >
          <KanbanCard
            :order="order"
            :is-selected="selectedIds.includes(order.id)"
            :is-project-mode="isProjectMode"
            :is-task-mode="isTaskMode"
            :statuses-for-color="status"
            @dblclick="handleCardDoubleClick"
            @select-toggle="handleCardSelectToggle"
            @status-updated="handleStatusUpdated"
          />
        </div>
      </draggable>

      <div
        v-if="orders.length === 0"
        class="flex items-center justify-center flex-1 text-gray-400 text-sm"
      >
        <div class="text-center">
          <i class="fas fa-inbox text-2xl mb-2" />
          <p>{{ emptyText }}</p>
        </div>
      </div>
      <div
        v-if="loading"
        class="flex justify-center py-3"
      >
        <i class="fas fa-spinner fa-spin text-gray-400" />
      </div>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanCard from './KanbanCard.vue';
import debounce from 'lodash.debounce';
import { statusAccentHex } from '@/utils/kanbanUtils';
import { translateKanbanStatusName } from '@/utils/translationUtils';

export default {
    name: 'KanbanColumn',
    components: {
        draggable: VueDraggableNext,
        KanbanCard
    },
    props: {
        status: {
            type: Object,
            required: true
        },
        orders: {
            type: Array,
            required: true
        },
        selectedIds: {
            type: Array,
            default: () => []
        },
        disabled: {
            type: Boolean,
            default: false
        },
        columnDragDisabled: {
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
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['change', 'card-dblclick', 'card-select-toggle', 'column-select-toggle', 'load-more', 'status-updated', 'order-drag-start', 'order-drag-end'],
    computed: {
        statusColor() {
            return statusAccentHex(this.status);
        },
        lightBackgroundColor() {
            const color = this.statusColor;
            return this.lightenColor(color, 0.92);
        },
        isAllSelected() {
            if (this.orders.length === 0) return false;
            return this.orders.every(order => this.selectedIds.includes(order.id));
        },
        emptyText() {
            if (this.isProjectMode) return this.$t('noProjects');
            if (this.isTaskMode) return this.$t('noTasks');
            return this.$t('noOrders');
        },
    },
    methods: {
        getStatusName(status) {
            return translateKanbanStatusName(status, {
                isProjectMode: this.isProjectMode,
                isTaskMode: this.isTaskMode,
                t: this.$t,
            });
        },
        handleChange(evt) {
            this.$emit('change', evt);
        },
        handleOrderDragStart() {
            this.$emit('order-drag-start');
        },
        handleOrderDragEnd() {
            this.$emit('order-drag-end');
        },
        handleCardDoubleClick(order) {
            this.$emit('card-dblclick', order);
        },
        handleCardSelectToggle(orderId) {
            this.$emit('card-select-toggle', orderId);
        },
        handleStatusUpdated() {
            this.$emit('status-updated');
        },
        handleSelectAll() {
            this.$emit(
                'column-select-toggle',
                this.orders.map((o) => o.id),
                !this.isAllSelected,
            );
        },
        // Функция для осветления цвета
        lightenColor(color, amount) {
            // Конвертируем HEX в RGB
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            // Осветляем: двигаемся к белому (255, 255, 255)
            const newR = Math.round(r + (255 - r) * amount);
            const newG = Math.round(g + (255 - g) * amount);
            const newB = Math.round(b + (255 - b) * amount);
            
            // Конвертируем обратно в HEX
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        },
        handleScroll: debounce(function() {
            if (!this.hasMore || this.loading) return;
            
            const container = this.$refs.scrollContainer;
            if (!container) return;
            
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                this.$emit('load-more');
            }
        }, 200)
    },
};
</script>

<style scoped>
.kanban-column {
    width: 320px;
    min-width: 320px;
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.column-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 transparent;
}

.column-content::-webkit-scrollbar {
    width: 6px;
}

.column-content::-webkit-scrollbar-track {
    background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
    background-color: #A0AEC0;
}

.ghost-card {
    opacity: 0.5;
    background: #e3f2fd;
    border: 2px dashed #2196f3;
}

.dragging-card {
    opacity: 0.8;
    transform: rotate(2deg);
}
</style>

