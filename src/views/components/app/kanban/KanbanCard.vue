<template>
    <div class="kanban-card rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        :class="cardClasses" :style="cardBackgroundStyle" @dblclick="handleDoubleClick">
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-2 min-w-0 flex-1">
                <input type="checkbox" :checked="isSelected" @click.stop="handleSelectToggle"
                    class="cursor-pointer flex-shrink-0" />
                <span class="text-sm font-bold truncate text-gray-800">
                    {{ isProjectMode ? `№${order.id}` : isTaskMode ? `${order.title}` : `№${order.id}` }}
                </span>
            </div>
        </div>

        <div v-if="isProjectMode && order.name" class="mb-2">
            <div class="text-sm font-semibold text-gray-800 truncate">
                {{ order.name }}
            </div>
        </div>

        <div v-if="!isProjectMode && showField('cashRegister') && (order.cashName || order.cash?.name)" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-cash-register text-gray-400 text-xs"></i>
                <span class="truncate">{{ order.cashName || order.cash?.name || '-' }}</span>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('warehouse') && (order.warehouseName || order.warehouse?.name)"
            class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-warehouse text-gray-400 text-xs"></i>
                <span class="truncate">{{ order.warehouseName || order.warehouse?.name || '-' }}</span>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('client') && !isTaskMode" class="mb-2">
            <div class="flex items-center space-x-1 text-sm">
                <i :class="getClientIconClass()"></i>
                <span class="font-medium text-gray-800 truncate">
                    {{ getClientName() }}
                </span>
            </div>
        </div>

        <div v-if="isProjectMode && order.description && showField('description')" class="mb-2">
            <div class="text-xs text-gray-600 line-clamp-2">
                {{ order.description }}
            </div>
        </div>

        <div v-if="showField('date') && !isTaskMode" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-calendar text-gray-400"></i>
                <span>{{ formatDate(order.date) }}</span>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('user') && (order.userName || order.user?.name)" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-user text-gray-400"></i>
                <span class="truncate">{{ order.userName || order.user?.name || '-' }}</span>
            </div>
        </div>

        <div v-if="!isProjectMode && order.projectId && showField('project')" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-folder text-purple-500 text-xs"></i>
                <span class="truncate">{{ order.projectName || order.project?.name || '-' }}</span>
            </div>
        </div>

        <div v-if="isProjectMode && order.client && showField('client')" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i :class="getClientIconClass()"></i>
                <span class="truncate">{{ getClientName() }}</span>
            </div>
        </div>

        <div v-if="isProjectMode && showField('user')" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-user text-gray-400"></i>
                <span class="truncate">{{ order.user?.name || order.userName || order.user_name || (order.creator &&
                    order.creator.name) }}</span>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('products') && order.products && order.products.length > 0" class="mb-2">
            <div class="text-xs text-gray-600">
                <div v-html="getProductsHtml()"></div>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('note') && order.note" class="mb-2">
            <div class="text-xs text-gray-600">
                <div class="flex items-start space-x-1">
                    <i class="fas fa-sticky-note text-gray-400 text-xs mt-0.5"></i>
                    <span class="line-clamp-2" v-html="order.note"></span>
                </div>
            </div>
        </div>

        <div v-if="!isProjectMode && showField('description') && order.description" class="mb-2">
            <div class="text-xs text-gray-600 line-clamp-2">
                <div v-html="order.description"></div>
            </div>
        </div>

        <div v-if="isTaskMode && showField('created_at') && order.created_at" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-calendar-plus text-gray-400"></i>
                <span>{{ formatDate(order.created_at) }}</span>
            </div>
        </div>

        <div v-if="isTaskMode && showField('deadline') && order.deadline" class="mb-2">
            <div class="flex items-center space-x-1 text-xs" :class="getDeadlineClass(order.deadline)">
                <i class="fas fa-calendar-check" :class="getDeadlineIconClass(order.deadline)"></i>
                <span>{{ formatDate(order.deadline) }}</span>
            </div>
        </div>

        <div v-if="isTaskMode && showField('creator') && order.creator && !isTaskMode" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-user-plus text-blue-400"></i>
                <span class="truncate">{{ order.creator.name || order.creator }}</span>
            </div>
        </div>

        <div v-if="isTaskMode && showField('supervisor') && order.supervisor" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-user-tie text-purple-400"></i>
                <span class="truncate">{{ order.supervisor.name || order.supervisor }}</span>
            </div>
        </div>

        <div v-if="isTaskMode && showField('executor') && order.executor" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-user-check text-green-400"></i>
                <span class="truncate">{{ order.executor.name || order.executor }}</span>
            </div>
        </div>

        <div v-if="isTaskMode" class="flex gap-4 items-center space-x-1 text-xs text-gray-600">
            <!-- Приоритет (для задач) -->
            <div v-if="showField('priority') && order.priority" class="mb-2">
                <div class="flex items-center space-x-1 text-xs text-gray-600">
                    <span class="text-sm">{{ getPriorityIcons() }}</span>
                    <!-- <span class="truncate">{{ getPriorityLabel() }}</span> -->
                </div>
            </div>

            <!-- Сложность (для задач) -->
            <div v-if="showField('complexity') && order.complexity" class="mb-2">
                <div class="flex items-center space-x-1 text-xs text-gray-600">
                    <span class="text-sm">{{ getComplexityIcons() }}</span>
                    <!-- <span class="truncate">{{ getComplexityLabel() }}</span> -->
                </div>
            </div>
        </div>


        <div v-if="isProjectMode && $store.getters.hasPermission('settings_project_budget_view') && order.budget && showField('budget')"
            class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-money-bill-wave text-gray-700 text-xs"></i>
                    <span class="text-xs text-gray-500">{{ $t('projectBudget') }}:</span>
                </div>
                <span class="text-sm font-bold text-black">
                    {{ formatBudget() }}
                </span>
            </div>
        </div>

        <div v-if="!isProjectMode && !isTaskMode && showField('totalPrice')" class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-money-bill-wave text-green-600 text-xs"></i>
                    <span class="text-xs text-gray-500">{{ $t('total') }}:</span>
                </div>
                <span class="text-sm font-bold text-green-700">
                    {{ formatTotalPrice() }}
                </span>
            </div>
            <div v-if="showField('paymentStatus') && !isTaskMode" class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                    <i :class="[getPaymentStatusIcon(), getPaymentStatusClass()]"></i>
                    <span class="text-xs text-gray-500">{{ $t('paymentStatus') }}:</span>
                </div>
                <span class="text-xs font-semibold" :class="getPaymentStatusClass()">
                    {{ getPaymentStatusText() }}
                </span>
            </div>
        </div>
        <div v-if="isSupervisor && order?.statusId === 3 && isTaskMode" class="flex gap-2 mt-2">
            <button @click.stop="updateTaskStatus('COMPLETED')"
                class="px-3 py-1 text-xs font-semibold  text-white rounded transition bg-green-500 hover:bg-green-600">
                <i class="fas fa-check"></i>
            </button>
            <button @click.stop="updateTaskStatus('IN_PROGRESS')"
                class="px-3 py-1 text-xs font-semibold  text-white rounded transition bg-red-500 hover:bg-red-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div v-if="isExecutor && order?.statusId === 2 && isTaskMode" class="flex gap-2 mt-2">
            <button @click.stop="updateTaskStatus('PENDING')"
                class="px-3 py-1 text-xs font-semibold  text-white rounded transition bg-green-500 hover:bg-green-600">
                <i class="fas fa-check"></i>
            </button>
        </div>

        <!-- Чек-лист (для задач) -->
        <!-- Временно убираем проверку showField для отладки -->
        <div v-if="isTaskMode && hasChecklist" class="mb-2 mt-2 pt-2 border-t border-gray-100">
            <!-- Отладка -->
            <div v-if="isTaskMode && hasChecklist && !showField('checklist')"
                class="text-xs text-yellow-600 mb-1 italic">
                ⚠️ Чеклист есть, но поле отключено в настройках
            </div>
            <div class="flex items-center space-x-1 text-xs text-gray-600 mb-1">
                <i class="fas fa-tasks text-blue-400"></i>
                <span class="font-semibold">
                    {{ getChecklistProgress(order.checklist) }}
                </span>
            </div>
            <!-- Компактное отображение пунктов чеклиста -->
            <div class="space-y-1 max-h-20 overflow-y-auto">
                <div v-for="(item, index) in getChecklistItems(order.checklist).slice(0, 3)" :key="index"
                    class="flex items-center space-x-1 text-xs">
                    <input type="checkbox" :checked="item.completed" disabled
                        class="w-3 h-3 cursor-not-allowed opacity-60" />
                    <span class="truncate flex-1"
                        :class="item.completed ? 'line-through text-gray-400' : 'text-gray-700'">
                        {{ item.text }}
                    </span>
                </div>
                <div v-if="getChecklistItems(order.checklist).length > 3" class="text-xs text-gray-500 italic pl-4">
                    +{{ getChecklistItems(order.checklist).length - 3 }} {{ $t('more') || 'еще' }}
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';
import TaskController from '@/api/TaskController';

export default {
    name: 'KanbanCard',
    props: {
        order: {
            type: Object,
            required: true
        },
        isSelected: {
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
    },
    emits: ['dblclick', 'select-toggle', 'status-updated'],
    computed: {
        cardClasses() {
            return [
                { 'ring-2 ring-blue-400': this.isSelected }
            ];
        },
        cardBackgroundStyle() {
            const bgColor = this.getCardBackgroundColor();
            if (bgColor) {
                return {
                    backgroundColor: bgColor
                };
            }
            return {
                backgroundColor: '#ffffff'
            };
        },
        kanbanFields() {
            const mode = this.isProjectMode ? 'projects' : (this.isTaskMode ? 'tasks' : 'orders');
            return this.$store.state.kanbanCardFields[mode] || {};
        },
        // Проверяет наличие чеклиста в задаче
        hasChecklist() {
            if (!this.isTaskMode) return false;
            if (!this.order) return false;

            const checklist = this.order.checklist;

            if (!checklist) return false;

            try {
                const items = this.getChecklistItems(checklist);
                const hasItems = Array.isArray(items) && items.length > 0;
                return hasItems;
            } catch (e) {
                return false;
            }
        },
        isAdmin() {
            const user = this.$store.getters.user;
            return user?.is_admin === true;
        },
        isExecutor() {
            const user = this.$store.getters.user;
            return user?.id === this.order?.executor?.id;
        },
        isSupervisor() {
            const user = this.$store.getters.user;
            return user?.id === this.order?.supervisor?.id;
        },
    },
    methods: {

        // Получает массив пунктов чеклиста
        getChecklistItems(checklist) {
            if (!checklist) {
                return [];
            }

            // Если checklist - строка JSON, парсим её
            let items = checklist;
            if (typeof checklist === 'string') {
                try {
                    items = JSON.parse(checklist);
                } catch (e) {
                    return [];
                }
            }

            // Проверяем, что это массив
            if (!Array.isArray(items)) {
                return [];
            }

            return items;
        },

        // Отображает прогресс чек-листа
        getChecklistProgress(checklist) {
            const items = this.getChecklistItems(checklist);
            if (items.length === 0) {
                return '';
            }

            const completed = items.filter(item => item.completed).length;
            const total = items.length;

            return `${completed}/${total}`;
        },

        // Проверяет, находится ли задача в статусе "Новый" или "В работе"
        isTaskInActiveStatus() {
            if (!this.isTaskMode) return false;

            const statusId = this.order?.statusId;
            const statusName = this.order?.status?.name;

            // Проверяем по ID статуса (1 = NEW, 2 = IN_PROGRESS, 3 = PENDING)
            if (statusId === 1 || statusId === 2 || statusId === 3) return true;

            // Проверяем по имени статуса
            if (statusName === 'NEW' || statusName === 'PENDING' || statusName === 'IN_PROGRESS') {
                return true;
            }

            return false;
        },

        // Вычисляет количество дней до deadline
        getDaysUntilDeadline(deadline) {
            if (!deadline) return null;

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const deadlineDate = new Date(deadline);
            deadlineDate.setHours(0, 0, 0, 0);

            const diffTime = deadlineDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays;
        },

        // Определяет цвет фона карточки в зависимости от срока выполнения
        getCardBackgroundColor() {
            if (!this.isTaskInActiveStatus() || !this.order?.deadline) {
                return null;
            }

            const daysLeft = this.getDaysUntilDeadline(this.order.deadline);

            // Если просрочена - красная подложка (светлая)
            if (daysLeft < 0) {
                return 'rgba(220, 53, 69, 0.3)';
            }

            // Если до срока осталось 3 дня или меньше - желтая подложка
            if (daysLeft <= 3) {
                return 'rgba(255, 193, 7, 0.3)';
            }

            return null;
        },

        async updateTaskStatus(targetStatusName) {
            try {
                const statuses = this.$store.getters.taskStatuses || [];
                const target = statuses.find(s => s.name === targetStatusName);
                if (!target) {
                    console.warn('Status not found:', targetStatusName);
                    return;
                }

                await TaskController.updateItem(this.order.id, { status_id: target.id });
                this.$emit('status-updated');
            } catch (e) {
                console.error('Cannot update task status', e);
                this.$store.dispatch('showNotification', {
                    title: this.$t('error'),
                    message: this.$t('errorUpdatingStatus'),
                    isDanger: true,
                });
            }
        },
        showField(fieldName) {
            return this.kanbanFields[fieldName] !== false;
        },
        handleDoubleClick() {
            this.$emit('dblclick', this.order);
        },
        handleSelectToggle() {
            this.$emit('select-toggle', this.order.id);
        },
        formatDate(date) {
            return dayjsDateTime(date);
        },
        isDeadlineExpired(deadline) {
            if (!deadline) return false;
            const now = new Date();
            const deadlineDate = new Date(deadline);
            return deadlineDate < now;
        },
        isDeadlineSoon(deadline) {
            if (!deadline) return false;
            const now = new Date();
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
        getClientIconClass() {
            try {
                const type = this.order?.client?.clientType || this.order?.client?.client_type;
                const base = 'text-xs mr-0.5';
                if (type === 'company') {
                    return `fas fa-building text-blue-500 ${base}`;
                }
                return `fas fa-user text-blue-500 ${base}`;
            } catch (e) {
                return 'fas fa-user text-blue-500 text-xs';
            }
        },
        getClientName() {
            try {
                if (!this.order.client) {
                    return this.$t('notSpecified');
                }
                if (typeof this.order.client.fullName === 'function') {
                    return this.order.client.fullName();
                }
                const firstName = this.order.client.firstName || '';
                const lastName = this.order.client.lastName || '';
                const name = `${firstName} ${lastName}`.trim();
                return name || this.$t('notSpecified');
            } catch (error) {
                console.error('Error getting client name:', error, this.order);
                return this.$t('notSpecified');
            }
        },
        formatTotalPrice() {
            try {
                const roundingEnabled = this.$store.getters.roundingEnabled;
                const decimals = roundingEnabled ? this.$store.getters.roundingDecimals : 2;
                const rawAmount = this.order?.totalPrice ?? this.order?.total_price ?? this.order?.price ?? 0;
                const amount = Number(rawAmount);
                const symbol = this.order?.currencySymbol || this.order?.currency_symbol || '';
                const formatter = this.$formatNumber || formatNumber;
                const formatted = isNaN(amount) ? '0' : formatter(amount, decimals, true);
                return symbol ? `${formatted} ${symbol}` : formatted;
            } catch (e) {
                const symbol = this.order?.currencySymbol || this.order?.currency_symbol || '';
                const fallbackAmount = this.order?.totalPrice ?? this.order?.total_price ?? this.order?.price ?? 0;
                return `${fallbackAmount} ${symbol}`.trim();
            }
        },
        formatBudget() {
            try {
                const amount = Number(this.order?.budget ?? 0);
                const symbol = this.order?.currency?.symbol || this.order?.currencySymbol || '';
                const formatted = this.$formatNumber ? this.$formatNumber(amount, null, true) : String(amount);
                return symbol ? `${formatted} ${symbol}` : formatted;
            } catch (e) {
                const symbol = this.order?.currency?.symbol || this.order?.currencySymbol || '';
                return `${this.order?.budget ?? 0} ${symbol}`.trim();
            }
        },
        getPaymentStatusText() {
            if (this.order?.paymentStatusText) {
                return this.order.paymentStatusText;
            }
            
            if (typeof this.order?.getPaymentStatusText === 'function') {
                return this.order.getPaymentStatusText();
            }
            
            const paidAmount = parseFloat(this.order?.paidAmount || 0);
            const totalPrice = parseFloat(this.order?.totalPrice || 0);
            const paymentStatus = this.order?.paymentStatus;

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
        getPaymentStatusClass() {
            if (typeof this.order?.getPaymentStatusClass === 'function') {
                return this.order.getPaymentStatusClass();
            }
            const paidAmount = parseFloat(this.order?.paidAmount || 0);
            const totalPrice = parseFloat(this.order?.totalPrice || 0);

            if (paidAmount <= 0) {
                return 'text-red-600';
            } else if (paidAmount < totalPrice) {
                return 'text-yellow-600';
            } else {
                return 'text-green-600';
            }
        },
        getPaymentStatusIcon() {
            if (typeof this.order?.getPaymentStatusIcon === 'function') {
                return this.order.getPaymentStatusIcon();
            }
            const paidAmount = parseFloat(this.order?.paidAmount || 0);
            const totalPrice = parseFloat(this.order?.totalPrice || 0);

            if (paidAmount <= 0) {
                return 'fas fa-times-circle';
            } else if (paidAmount < totalPrice) {
                return 'fas fa-exclamation-circle';
            } else {
                return 'fas fa-check-circle';
            }
        },
        getProductsHtml() {
            if (this.order.productsHtmlList && typeof this.order.productsHtmlList === 'function') {
                return this.order.productsHtmlList();
            }
            return '';
        },

        getPriorityIcons() {
            if (typeof this.order?.getPriorityIcons === 'function') {
                return this.order.getPriorityIcons();
            }
            const icons = {
                'low': '🔥',
                'normal': '🔥🔥',
                'high': '🔥🔥🔥'
            };
            return icons[this.order?.priority] || icons['low'];
        },

        getPriorityLabel() {
            if (typeof this.order?.getPriorityLabel === 'function') {
                return this.order.getPriorityLabel();
            }
            const labels = {
                'low': this.$t('priorityLow'),
                'normal': this.$t('priorityNormal'),
                'high': this.$t('priorityHigh')
            };
            return labels[this.order?.priority] || labels['low'];
        },

        getComplexityIcons() {
            if (typeof this.order?.getComplexityIcons === 'function') {
                return this.order.getComplexityIcons();
            }
            const icons = {
                'simple': '🧠',
                'normal': '🧠🧠',
                'complex': '🧠🧠🧠'
            };
            return icons[this.order?.complexity] || icons['normal'];
        },

        getComplexityLabel() {
            if (typeof this.order?.getComplexityLabel === 'function') {
                return this.order.getComplexityLabel();
            }
            const labels = {
                'simple': this.$t('complexitySimple'),
                'normal': this.$t('complexityNormal'),
                'complex': this.$t('complexityComplex')
            };
            return labels[this.order?.complexity] || labels['normal'];
        },
    }
};
</script>

<style scoped>
.kanban-card {
    min-height: 80px;
    user-select: none;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
