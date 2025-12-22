<template>
    <div class="kanban-column flex flex-col h-full rounded-lg" :style="{ backgroundColor: lightBackgroundColor }">
        <!-- Заголовок колонки -->
        <div class="column-header px-4 py-3 rounded-t-lg" :style="{ backgroundColor: statusColor }">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <!-- Ручка для перетаскивания колонки -->
                    <div class="column-drag-handle cursor-move text-white opacity-60 hover:opacity-100 transition-opacity">
                        <i class="fas fa-grip-vertical text-sm"></i>
                    </div>
                    <h3 class="font-semibold text-white">{{ getStatusName(status) }}</h3>
                    <div class="flex items-center space-x-1">
                        <span class="text-xs text-gray-800 bg-white px-2 py-0.5 rounded-full font-medium">
                            {{ orders.length }}
                        </span>
                        <button 
                            v-if="orders.length > 0"
                            @click="handleSelectAll"
                            class="w-5 h-5 rounded border-2 border-white flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition-all"
                            :class="{ 'bg-white text-gray-800': isAllSelected }"
                            :title="isAllSelected ? $t('deselectAll') : $t('selectAll')">
                            <i v-if="isAllSelected" class="fas fa-check text-xs text-gray-800"></i>
                        </button>
                    </div>
                </div>
                <!-- Общая сумма по колонке -->
                <div v-if="columnTotal > 0" class="text-xs text-white font-medium">
                    {{ formatAmount(columnTotal) }} {{ currencySymbol }}
                </div>
            </div>
        </div>

        <!-- Область для карточек -->
        <div class="column-content flex-1 overflow-y-auto p-3" ref="scrollContainer" @scroll="handleScroll">
            <draggable
                :list="orders"
                group="orders"
                :animation="200"
                ghost-class="ghost-card"
                drag-class="dragging-card"
                @change="handleChange"
                :disabled="disabled"
                class="min-h-[200px]"
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
                        @dblclick="handleCardDoubleClick"
                        @select-toggle="handleCardSelectToggle"
                    />
                </div>
            </draggable>

            <!-- Пустая колонка -->
            <div v-if="orders.length === 0" class="flex items-center justify-center flex-1 text-gray-400 text-sm">
                <div class="text-center">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>{{ emptyText }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import KanbanCard from './KanbanCard.vue';
import debounce from 'lodash.debounce';
import { translateOrderStatus, translateTaskStatus } from '@/utils/translationUtils';

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
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['change', 'card-dblclick', 'card-select-toggle', 'column-select-toggle', 'load-more'],
    computed: {
        statusColor() {
            const hex = this.status.category?.color || this.status.color;
            return hex || '#3571A4'; // Дефолтный цвет, если не задан
        },
        lightBackgroundColor() {
            // Осветляем цвет статуса для фона колонки
            const color = this.statusColor;
            return this.lightenColor(color, 0.92); 
        },
        columnTotal() {
            return this.orders.reduce((sum, order) => {
                return sum + (parseFloat(order.totalPrice) || 0);
            }, 0);
        },
        isAllSelected() {
            if (this.orders.length === 0) return false;
            return this.orders.every(order => this.selectedIds.includes(order.id));
        },
        emptyText() {
            // Для задач показываем "Нет задач", для проектов/заказов оставляем существующий текст
            if (this.isProjectMode) {
                return this.$t('noOrders');
            }
            return this.$te('noTasks') ? this.$t('noTasks') : 'Нет задач';
        }
    },
    methods: {
        getStatusName(status) {
            if (!status || !status.name) return '';
            if (status.category) {
                return translateOrderStatus(status.name, this.$t);
            }
            return translateTaskStatus(status.name, this.$t);
        },
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
        handleChange(evt) {
            this.$emit('change', evt);
        },
        handleCardDoubleClick(order) {
            this.$emit('card-dblclick', order);
        },
        handleCardSelectToggle(orderId) {
            this.$emit('card-select-toggle', orderId);
        },
        handleSelectAll() {
            if (this.isAllSelected) {
                // Убираем все карточки этой колонки из выбранных
                const columnOrderIds = this.orders.map(order => order.id);
                this.$emit('column-select-toggle', columnOrderIds, false);
            } else {
                // Добавляем все карточки этой колонки к выбранным
                const columnOrderIds = this.orders.map(order => order.id);
                this.$emit('column-select-toggle', columnOrderIds, true);
            }
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
    max-height: calc(100vh - 250px); /* Фиксированная максимальная высота */
    display: flex;
    flex-direction: column;
}

.column-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(100vh - 300px); /* Учитываем высоту заголовка */
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

