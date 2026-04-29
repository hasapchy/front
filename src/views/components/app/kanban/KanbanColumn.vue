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
          <Card
            :shell-item="order"
            :is-selected="selectedIds.includes(order.id)"
            :card-style="cardBackgroundStyle(order)"
            @dblclick="handleCardDoubleClick"
            @select-toggle="handleCardSelectToggle"
          >
            <template #header>
              <div class="flex w-full min-w-0 items-center justify-between gap-2">
                <span class="text-sm font-bold truncate text-gray-800 dark:text-[var(--text-primary)]">
                  {{ isTaskMode ? (order.title || '') : `№${order.id}` }}
                </span>
                <span
                  v-if="!isTaskMode"
                  class="text-xs text-gray-500 dark:text-[var(--text-secondary)] whitespace-nowrap"
                >
                  {{ formatDate(order.date) }}
                </span>
              </div>
            </template>
            <div
              v-if="isProjectMode && order.name"
              class="mb-2"
            >
              <div class="text-sm font-semibold text-gray-800 dark:text-[var(--text-primary)] truncate">
                {{ order.name }}
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('cashRegister') && getCashName(order)"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-cash-register text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                </span>
                <span class="truncate">{{ getCashName(order) || '-' }}</span>
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('warehouse') && (order.warehouseName || order.warehouse?.name)"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-warehouse text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                </span>
                <span class="truncate">{{ order.warehouseName || order.warehouse?.name || '-' }}</span>
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('client') && !isTaskMode"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-sm">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i :class="getClientIconClass(order)" />
                </span>
                <div class="min-w-0">
                  <span class="font-medium text-gray-800 dark:text-[var(--text-primary)] truncate block">{{ getClientName(order) }}</span>
                  <span
                    v-if="getClientPosition(order)"
                    class="text-xs text-gray-500 dark:text-[var(--text-secondary)] block truncate"
                  >{{ getClientPosition(order) }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="isProjectMode && order.description && showField('description')"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-[var(--text-secondary)] line-clamp-2">
                {{ order.description }}
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('user') && order.creator?.name"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-user text-[var(--nav-accent)] dark:text-[var(--nav-accent)]" />
                </span>
                <span class="truncate">{{ order.creator?.name || '-' }}</span>
              </div>
            </div>
            <div
              v-if="!isProjectMode && order.projectId && showField('project')"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-folder text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                </span>
                <span class="truncate">{{ order.projectName || order.project?.name || '-' }}</span>
              </div>
            </div>
            <div
              v-if="isProjectMode && order.client && showField('client')"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i :class="getClientIconClass(order)" />
                </span>
                <div class="min-w-0">
                  <span class="truncate block">{{ getClientName(order) }}</span>
                  <span
                    v-if="getClientPosition(order)"
                    class="text-xs text-gray-500 dark:text-[var(--text-secondary)] block truncate"
                  >{{ getClientPosition(order) }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="isProjectMode && showField('user')"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-user text-[var(--nav-accent)] dark:text-[var(--nav-accent)]" />
                </span>
                <span class="truncate">{{ order.creator?.name || '-' }}</span>
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('products') && order.products && order.products.length > 0"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <div v-html="getProductsHtml(order)" />
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('note') && order.note"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <div class="flex items-start space-x-1">
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                    <i class="fas fa-sticky-note text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                  </span>
                  <span
                    class="line-clamp-2"
                    v-html="order.note"
                  />
                </div>
              </div>
            </div>
            <div
              v-if="!isProjectMode && showField('description') && order.description && !orderNoteSameAsDescription(order)"
              class="mb-2"
            >
              <div class="text-xs text-gray-600 dark:text-[var(--text-secondary)] line-clamp-2">
                <div v-html="order.description" />
              </div>
            </div>
            <div
              v-if="isTaskMode && showField('createdAt') && order.createdAt"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-calendar-plus text-[var(--nav-accent)] dark:text-[var(--nav-accent)]" />
                </span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
            </div>
            <div
              v-if="isTaskMode && showField('deadline') && order.deadline"
              class="mb-2"
            >
              <div
                class="flex items-center space-x-1 text-xs"
                :class="getDeadlineClass(order.deadline)"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i
                    class="fas fa-calendar-check"
                    :class="getDeadlineIconClass(order.deadline)"
                  />
                </span>
                <span>{{ formatDate(order.deadline) }}</span>
              </div>
            </div>
            <div
              v-if="isTaskMode && showField('supervisor') && order.supervisor"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-user-tie text-purple-400 dark:text-[var(--nav-accent)]" />
                </span>
                <span class="truncate">{{ order.supervisor.name || order.supervisor }}</span>
              </div>
            </div>
            <div
              v-if="isTaskMode && showField('executor') && order.executor"
              class="mb-2"
            >
              <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-user-check text-green-400 dark:text-[var(--nav-accent)]" />
                </span>
                <span class="truncate">{{ order.executor.name || order.executor }}</span>
              </div>
            </div>
            <div
              v-if="isTaskMode"
              class="flex gap-4 items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]"
            >
              <div
                v-if="showField('priority') && order.priority"
                class="mb-2"
              >
                <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                  <span class="text-sm">{{ getPriorityIcons(order) }}</span>
                </div>
              </div>
              <div
                v-if="showField('complexity') && order.complexity"
                class="mb-2"
              >
                <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)]">
                  <span class="text-sm">{{ getComplexityIcons(order) }}</span>
                </div>
              </div>
            </div>
            <div
              v-if="isProjectMode && $store.getters.hasPermission('settings_project_budget_view') && order.budget && showField('budget')"
              class="mt-3 pt-3 border-t border-gray-100 dark:border-[var(--border-subtle)]"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                    <i class="fas fa-money-bill-wave text-[var(--nav-accent)] dark:text-[var(--nav-accent)] text-xs" />
                  </span>
                  <span class="text-xs text-gray-500 dark:text-[var(--text-secondary)]">{{ $t('projectBudget') }}:</span>
                </div>
                <span class="text-sm font-bold text-black dark:text-[var(--text-primary)]">
                  {{ formatBudget(order) }}
                </span>
              </div>
            </div>
            <div
              v-if="!isProjectMode && !isTaskMode && (showField('totalPrice') || showField('paymentStatus'))"
              class="relative mt-auto border-t border-gray-100 pt-3 dark:border-[var(--border-subtle)]"
              :class="[
                showField('totalPrice') && showField('paymentStatus') ? 'pb-10' : '',
                showField('totalPrice') && !showField('paymentStatus') ? 'min-h-[2.5rem]' : ''
              ]"
            >
              <div
                v-if="showField('paymentStatus')"
                class="flex min-w-0 max-w-[calc(100%-6.5rem)] items-center gap-1 pr-1"
              >
                <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full dark:bg-white">
                  <i :class="[getPaymentStatusIcon(order), getPaymentStatusClass(order), 'text-xs']" />
                </span>
                <span class="min-w-0 truncate text-xs font-semibold" :class="getPaymentStatusClass(order)">
                  {{ getPaymentStatusText(order) }}
                </span>
              </div>
              <div
                v-if="showField('totalPrice')"
                class="absolute bottom-0 right-0 flex items-center gap-1"
              >
                <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                  <i class="fas fa-money-bill-wave text-xs text-[var(--nav-accent)] dark:text-[var(--nav-accent)]" />
                </span>
                <span class="text-sm font-bold text-[var(--nav-accent)] dark:text-white">
                  {{ formatTotalPrice(order) }}
                </span>
              </div>
            </div>
            <template #actions>
              <div
                v-if="isSupervisor(order) && Number(order?.statusId) === 3 && isTaskMode"
                class="flex gap-2 mt-2"
              >
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-green-500 hover:bg-green-600"
                  @click.stop="updateTaskStatus(order, 'COMPLETED')"
                >
                  <i class="fas fa-check" />
                </button>
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-red-500 hover:bg-red-600"
                  @click.stop="updateTaskStatus(order, 'IN_PROGRESS')"
                >
                  <i class="fas fa-times" />
                </button>
              </div>
              <div
                v-if="isExecutor(order) && Number(order?.statusId) === 2 && isTaskMode"
                class="flex gap-2 mt-2"
              >
                <button
                  class="px-3 py-1 text-xs font-semibold text-white rounded transition bg-green-500 hover:bg-green-600"
                  @click.stop="updateTaskStatus(order, 'PENDING')"
                >
                  <i class="fas fa-check" />
                </button>
              </div>
              <div
                v-if="isTaskMode && hasChecklist(order)"
                class="mb-2 mt-2 pt-2 border-t border-gray-100 dark:border-[var(--border-subtle)]"
              >
                <div class="flex items-center space-x-1 text-xs text-gray-600 dark:text-[var(--text-secondary)] mb-1">
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full dark:bg-white">
                    <i class="fas fa-tasks text-blue-400 dark:text-[var(--nav-accent)]" />
                  </span>
                  <span class="font-semibold">
                    {{ getChecklistProgress(order.checklist) }}
                  </span>
                </div>
                <div class="space-y-1 max-h-20 overflow-y-auto">
                  <div
                    v-for="(item, index) in getChecklistItems(order.checklist).slice(0, 3)"
                    :key="index"
                    class="flex items-center space-x-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      :checked="item.completed"
                      disabled
                      class="w-3 h-3 cursor-not-allowed opacity-60"
                    >
                    <span
                      class="truncate flex-1"
                      :class="item.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-[var(--text-primary)]'"
                    >
                      {{ item.text }}
                    </span>
                  </div>
                  <div
                    v-if="getChecklistItems(order.checklist).length > 3"
                    class="text-xs text-gray-500 dark:text-[var(--text-secondary)] italic pl-4"
                  >
                    +{{ getChecklistItems(order.checklist).length - 3 }} {{ $t('more') }}
                  </div>
                </div>
              </div>
            </template>
          </Card>
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
import debounce from 'lodash.debounce';
import { statusAccentHex } from '@/utils/kanbanUtils';
import { translateKanbanStatusName } from '@/utils/translationUtils';
import { dayjsDateTime, getCurrentServerStartOfDay, getCurrentServerDateObject } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';
import { getClientDisplayName, getClientDisplayPosition } from '@/utils/displayUtils';
import { formatCashRegisterDisplay } from '@/utils/cashRegisterUtils';
import TaskController from '@/api/TaskController';
import Card from '@/views/components/app/cards/Card.vue';

export default {
    name: 'KanbanColumn',
    components: {
        draggable: VueDraggableNext,
        Card
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
        kanbanFields() {
            const mode = this.isProjectMode ? 'projects' : (this.isTaskMode ? 'tasks' : 'orders');
            return this.$store.state.kanbanCardFields[mode] || {};
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
        showField(fieldName) {
            return this.kanbanFields[fieldName] !== false;
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
        isTaskInActiveStatus(order) {
            if (!this.isTaskMode) return false;
            const statusId = Number(order?.statusId);
            const statusName = order?.status?.name;
            if (statusId === 1 || statusId === 2 || statusId === 3) return true;
            return statusName === 'NEW' || statusName === 'PENDING' || statusName === 'IN_PROGRESS';
        },
        getDaysUntilDeadline(deadline) {
            if (!deadline) return null;
            const now = getCurrentServerStartOfDay();
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);
            const diffTime = deadlineDate - now;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        },
        cardBackgroundStyle(order) {
            const bgColor = this.getCardBackgroundColor(order);
            if (bgColor) {
                return { backgroundColor: bgColor };
            }
            return { backgroundColor: '#ffffff' };
        },
        getCardBackgroundColor(order) {
            if (!this.isTaskInActiveStatus(order) || !order?.deadline) {
                return null;
            }
            const daysLeft = this.getDaysUntilDeadline(order.deadline);
            if (daysLeft < 0) {
                return 'rgba(220, 53, 69, 0.1)';
            }
            if (daysLeft <= 3) {
                return 'rgba(255, 193, 7, 0.3)';
            }
            return null;
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
            return dayjsDateTime(date);
        },
        isDeadlineExpired(deadline) {
            if (!deadline) return false;
            const now = getCurrentServerDateObject();
            const deadlineDate = new Date(deadline);
            return deadlineDate < now;
        },
        isDeadlineSoon(deadline) {
            if (!deadline) return false;
            const now = getCurrentServerDateObject();
            const deadlineDate = new Date(deadline);
            const hoursLeft = (deadlineDate - now) / (1000 * 60 * 60);
            return hoursLeft > 0 && hoursLeft <= 24;
        },
        getDeadlineClass(deadline) {
            if (this.isDeadlineExpired(deadline)) {
                return 'text-red-600 font-semibold';
            } else if (this.isDeadlineSoon(deadline)) {
                return 'text-orange-600';
            }
            return 'text-gray-600';
        },
        getDeadlineIconClass(deadline) {
            if (this.isDeadlineExpired(deadline)) {
                return 'text-red-600';
            } else if (this.isDeadlineSoon(deadline)) {
                return 'text-orange-600';
            }
            return 'text-orange-400';
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
        getCashName(order) {
            return formatCashRegisterDisplay(order?.cashName, order?.currencySymbol);
        },
        getClientPosition(order) {
            if (!order?.client) return '';
            return getClientDisplayPosition(order.client);
        },
        formatTotalPrice(order) {
            try {
                const rawAmount = order?.totalPrice ?? order?.price ?? 0;
                const amount = Number(rawAmount);
                const symbol = order?.currencySymbol;
                const formatted = isNaN(amount) ? '0' : formatNumber(amount, null, true);
                return symbol ? `${formatted} ${symbol}` : formatted;
            } catch {
                const symbol = order?.currencySymbol;
                const fallbackAmount = order?.totalPrice ?? order?.price ?? 0;
                return `${fallbackAmount} ${symbol}`.trim();
            }
        },
        formatBudget(order) {
            try {
                const amount = Number(order?.budget ?? 0);
                const symbol = order?.currency?.symbol || order?.currencySymbol;
                const formatted = this.$formatNumber ? this.$formatNumber(amount, null, true) : String(amount);
                return symbol ? `${formatted} ${symbol}` : formatted;
            } catch {
                const symbol = order?.currency?.symbol || order?.currencySymbol;
                return `${order?.budget ?? 0} ${symbol}`.trim();
            }
        },
        getPaymentStatusText(order) {
            if (order?.paymentStatusText) {
                return order.paymentStatusText;
            }
            const paidAmount = parseFloat(order?.paidAmount || 0);
            const totalPrice = parseFloat(order?.totalPrice || 0);
            const paymentStatus = order?.paymentStatus;
            if (paymentStatus) {
                switch (paymentStatus) {
                    case 'unpaid':
                        return this.$t('unpaid');
                    case 'partially_paid':
                        return this.$t('partiallyPaid');
                    case 'paid':
                        return this.$t('paid');
                }
            }
            if (paidAmount <= 0) {
                return this.$t('unpaid');
            } else if (paidAmount < totalPrice) {
                return this.$t('partiallyPaid');
            } else {
                return this.$t('paid');
            }
        },
        getPaymentStatusClass(order) {
            const paidAmount = parseFloat(order?.paidAmount || 0);
            const totalPrice = parseFloat(order?.totalPrice || 0);
            if (paidAmount <= 0) {
                return 'text-red-600';
            } else if (paidAmount < totalPrice) {
                return 'text-yellow-600';
            } else {
                return 'text-green-600';
            }
        },
        getPaymentStatusIcon(order) {
            const paidAmount = parseFloat(order?.paidAmount || 0);
            const totalPrice = parseFloat(order?.totalPrice || 0);
            if (paidAmount <= 0) {
                return 'fas fa-times-circle';
            } else if (paidAmount < totalPrice) {
                return 'fas fa-exclamation-circle';
            } else {
                return 'fas fa-check-circle';
            }
        },
        getProductsHtml(order) {
            if (Array.isArray(order?.products) && order.products.length > 0) {
                return order.products
                    .slice(0, 3)
                    .map(p => `${p?.productName || p?.name || ''} (${p?.quantity || 0})`)
                    .join('<br>');
            }
            return '';
        },
        getPriorityIcons(order) {
            const icons = {
                low: '🔥',
                normal: '🔥🔥',
                high: '🔥🔥🔥'
            };
            return icons[order?.priority] || icons.low;
        },
        getComplexityIcons(order) {
            const icons = {
                simple: '🧠',
                normal: '🧠🧠',
                complex: '🧠🧠🧠'
            };
            return icons[order?.complexity] || icons.normal;
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

