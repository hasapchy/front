<template>
  <div
    class="kanban-column flex flex-col h-full rounded-lg"
    :style="{ backgroundColor: columnBackgroundColor }"
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
          <MapperCardGrid
            v-if="entityCard"
            bare
            :items="[order]"
            card-layout="entity"
            :card-config="entityCard.cardConfig"
            :card-mapper="entityCard.cardMapper"
            :entity="entityCard.entity"
            :title-field="entityCard.titleField"
            :title-subtitle-field="entityCard.titleSubtitleField"
            :selected-ids="selectedIds"
            :show-checkbox="entityCard.showCheckbox"
            @dblclick="handleCardDoubleClick"
            @select-toggle="handleCardSelectToggle"
          >
            <template
              v-if="isTaskMode"
              #entity-footer-actions="{ item }"
            >
              <div
                v-if="isSupervisor(item) && Number(item?.statusId) === 3"
                class="flex gap-2"
              >
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-[var(--color-success)] hover:bg-[var(--color-success-hover)]"
                  @click.stop="updateTaskStatus(item, 'COMPLETED')"
                >
                  <i class="fas fa-check" />
                </button>
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)]"
                  @click.stop="updateTaskStatus(item, 'IN_PROGRESS')"
                >
                  <i class="fas fa-times" />
                </button>
              </div>
              <div
                v-if="isExecutor(item) && Number(item?.statusId) === 2"
                class="flex gap-2"
              >
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-[var(--color-success)] hover:bg-[var(--color-success-hover)]"
                  @click.stop="updateTaskStatus(item, 'PENDING')"
                >
                  <i class="fas fa-check" />
                </button>
              </div>
              <div
                v-if="isEntityCardFieldVisible('checklist') && hasChecklist(item)"
                class="w-full pt-2 border-t border-gray-100 dark:border-[var(--border-subtle)]"
              >
                <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-white/90 mb-1">
                  <span class="filter-modal-icon-badge">
                    <i class="fas fa-tasks text-[var(--label-accent)] dark:text-[var(--nav-accent)]" />
                  </span>
                  <span class="font-semibold">
                    {{ getChecklistProgress(item.checklist) }}
                  </span>
                </div>
                <div class="space-y-1 max-h-20 overflow-y-auto">
                  <div
                    v-for="(checklistItem, index) in getChecklistItems(item.checklist).slice(0, 3)"
                    :key="index"
                    class="flex items-center space-x-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      :checked="checklistItem.completed"
                      disabled
                      class="w-3 h-3 cursor-not-allowed opacity-60"
                    >
                    <span
                      class="truncate flex-1"
                      :class="checklistItem.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-white'"
                    >
                      {{ checklistItem.text }}
                    </span>
                  </div>
                  <div
                    v-if="getChecklistItems(item.checklist).length > 3"
                    class="text-xs text-gray-500 dark:text-white/90 italic pl-4"
                  >
                    +{{ getChecklistItems(item.checklist).length - 3 }} {{ $t('more') }}
                  </div>
                </div>
              </div>
            </template>
          </MapperCardGrid>
          <Card
            v-else
            :shell-item="order"
            :is-selected="selectedIds.includes(order.id)"
            @dblclick="handleCardDoubleClick"
            @select-toggle="handleCardSelectToggle"
          >
            <template #header>
              <div class="flex w-full min-w-0 items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-1.5">
                  <span class="text-sm font-bold truncate text-gray-800 dark:text-white">
                    №{{ order.id }}
                  </span>
                  <span
                    v-if="timelineUnreadCount(order) > 0"
                    class="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-semibold leading-none text-white"
                  >
                    {{ timelineUnreadCount(order) }}
                  </span>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <span
                    v-if="isLeadMode"
                    class="text-xs text-gray-500 dark:text-white/90 whitespace-nowrap"
                  >
                    {{ formatDate(order.date) }}
                  </span>
                </div>
              </div>
            </template>
            <div
              v-if="isLeadMode && showField('client')"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-sm">
                <span class="filter-modal-icon-badge">
                  <i :class="getClientIconClass(order)" />
                </span>
                <div class="min-w-0">
                  <span class="font-medium text-gray-800 dark:text-white truncate block">{{ getClientName(order) }}</span>
                  <span
                    v-if="getClientPosition(order)"
                    class="text-xs text-gray-500 dark:text-white/90 block truncate"
                  >{{ getClientPosition(order) }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="isLeadMode && showField('user') && order.creator?.name"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-white/90">
                <span class="filter-modal-icon-badge">
                  <i class="fas fa-user text-[var(--nav-accent)] dark:text-[var(--nav-accent)]" />
                </span>
                <span class="truncate">{{ order.creator?.name || '-' }}</span>
              </div>
            </div>
            <div
              v-if="isLeadMode && showField('note') && order.comment"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-white/90">
                <div class="flex items-start space-x-1">
                  <span class="filter-modal-icon-badge">
                    <i class="fas fa-sticky-note text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                  </span>
                  <span
                    class="line-clamp-2"
                    v-html="order.comment"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="isLeadMode && showField('description') && order.description && !orderNoteSameAsDescription(order)"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-white/90 line-clamp-2">
                <div v-html="order.description" />
              </div>
            </div>
          </Card>
        </div>
      </draggable>

      <div
        v-if="orders.length === 0"
        class="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-[var(--text-secondary)]"
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
        <i class="fas fa-spinner fa-spin text-gray-400 dark:text-[var(--text-secondary)]" />
      </div>
    </div>
  </div>
</template>

<script>
import { VueDraggableNext } from 'vue-draggable-next';
import debounce from 'lodash.debounce';
import { statusAccentHex, statusColumnBackground } from '@/utils/kanbanUtils';
import { translateKanbanStatusName } from '@/utils/translationUtils';
import { formatDateByDisplayMode, normalizeDateDisplayMode } from '@/utils/dateUtils';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import TaskController from '@/api/TaskController';
import Card from '@/views/components/app/cards/Card.vue';
import MapperCardGrid from '@/views/components/app/cards/MapperCardGrid.vue';
export default {
    name: 'KanbanColumn',
    components: {
        draggable: VueDraggableNext,
        Card,
        MapperCardGrid,
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
        isLeadMode: {
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
        },
        entityCard: {
            type: Object,
            default: null,
        },
    },
    emits: ['change', 'card-dblclick', 'card-select-toggle', 'column-select-toggle', 'load-more', 'status-updated', 'order-drag-start', 'order-drag-end'],
    computed: {
        statusColor() {
            return statusAccentHex(this.status);
        },
        columnBackgroundColor() {
            return statusColumnBackground(this.status, this.$store.state.uiTheme === 'dark');
        },
        isAllSelected() {
            if (this.orders.length === 0) return false;
            return this.orders.every(order => this.selectedIds.includes(order.id));
        },
        emptyText() {
            if (this.isLeadMode) {
                return this.$t('noData');
            }
            if (this.isProjectMode) return this.$t('noProjects');
            if (this.isTaskMode) return this.$t('noTasks');
            return this.$t('noOrders');
        },
        kanbanFields() {
            if (this.isLeadMode) {
                return this.$store.state.kanbanCardFields.leads || {};
            }
            return {};
        },
        kanbanDateModes() {
            if (this.isLeadMode) {
                return this.$store.state.kanbanCardFieldDateModes?.leads || {};
            }
            return {};
        },
    },
    methods: {
        getStatusName(status) {
            return translateKanbanStatusName(status, {
                isProjectMode: this.isProjectMode,
                isLeadMode: this.isLeadMode,
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
        showField(fieldName) {
            return this.kanbanFields[fieldName] !== false;
        },
        isEntityCardFieldVisible(fieldName) {
            const config = this.entityCard?.cardConfig || [];
            const field = config.find((entry) => entry.name === fieldName);
            if (!field) {
                return false;
            }
            if (typeof field.visible === 'function') {
                return field.visible();
            }
            return field.visible !== false;
        },
        stripPlainHtml(value) {
            if (value == null) {
                return '';
            }
            return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        },
        orderNoteSameAsDescription(order) {
            if (!order?.note || !order?.description) {
                return false;
            }
            const a = this.stripPlainHtml(order.note);
            const b = this.stripPlainHtml(order.description);
            return a.length > 0 && a === b;
        },
        hasChecklist(order) {
            if (!this.isTaskMode || !order) return false;
            const checklist = order.checklist;
            if (!checklist) return false;
            try {
                const items = this.getChecklistItems(checklist);
                return Array.isArray(items) && items.length > 0;
            } catch {
                return false;
            }
        },
        getChecklistItems(checklist) {
            if (!checklist) {
                return [];
            }
            let items = checklist;
            if (!Array.isArray(checklist)) {
                try {
                    items = JSON.parse(String(checklist));
                } catch {
                    return [];
                }
            }
            if (!Array.isArray(items)) {
                return [];
            }
            return items;
        },
        getChecklistProgress(checklist) {
            const items = this.getChecklistItems(checklist);
            if (items.length === 0) {
                return '';
            }
            const completed = items.filter(item => item.completed).length;
            return `${completed}/${items.length}`;
        },
        async updateTaskStatus(order, targetStatusName) {
            try {
                const statuses = this.$store.getters.taskStatuses || [];
                const target = statuses.find(s => s.name === targetStatusName);
                if (!target) {
                    return;
                }
                await TaskController.updateItem(order.id, { statusId: target.id });
                this.handleStatusUpdated();
            } catch {
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
                    message: this.$t('errorUpdatingStatus'),
                    isDanger: true,
                });
            }
        },
        formatDate(date) {
            const mode = normalizeDateDisplayMode('date', this.kanbanDateModes.date);
            const formatted = formatDateByDisplayMode(date, 'date', mode);
            return formatted || '';
        },
        timelineUnreadCount(order) {
            return Number(order?.unreadTimelineCommentsCount || 0);
        },
        getClientIconClass(order) {
            try {
                const type = order?.client?.clientType;
                const typeClasses = {
                    company: 'fas fa-building text-[var(--nav-accent)] dark:text-[var(--nav-accent)]',
                    employee: 'fas fa-id-badge text-[var(--nav-accent)] dark:text-[var(--nav-accent)]',
                    investor: 'fas fa-hand-holding-usd text-[var(--nav-accent)] dark:text-[var(--nav-accent)]'
                };
                return typeClasses[type] || 'fas fa-user text-[var(--nav-accent)] dark:text-[var(--nav-accent)]';
            } catch {
                return 'fas fa-user text-[var(--nav-accent)] dark:text-[var(--nav-accent)]';
            }
        },
        getClientName(order) {
            if (!order?.client) return this.$t('notSpecified');
            return getClientDisplayName(order.client) || this.$t('notSpecified');
        },
        getClientPosition(order) {
            if (!order?.client) return '';
            return getClientDisplayPosition(order.client);
        },
        isExecutor(order) {
            const user = this.$store.getters.user;
            return user?.id === order?.executor?.id;
        },
        isSupervisor(order) {
            const user = this.$store.getters.user;
            return user?.id === order?.supervisor?.id;
        },
        handleSelectAll() {
            this.$emit(
                'column-select-toggle',
                this.orders.map((o) => o.id),
                !this.isAllSelected,
            );
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
}
</style>

