<template>
    <div 
        class="kanban-card bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-blue-400': isSelected }"
        @dblclick="handleDoubleClick"
    >
        <!-- Заголовок с чекбоксом и номером/названием -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-2">
                <input 
                    type="checkbox" 
                    :checked="isSelected" 
                    @click.stop="handleSelectToggle"
                    class="cursor-pointer"
                />
                <span class="text-sm font-bold text-gray-800">
                    {{ isProjectMode ? order.name : `№${order.id}` }}
                </span>
            </div>
        </div>

        <!-- Клиент -->
        <div v-if="!isProjectMode" class="mb-2">
            <div class="flex items-center space-x-1 text-sm">
                <i :class="getClientIconClass()"></i>
                <span class="font-medium text-gray-800 truncate">
                    {{ getClientName() }}
                </span>
            </div>
        </div>

        <!-- Описание проекта (только для проектов) -->
        <div v-if="isProjectMode && order.description" class="mb-2">
            <div class="text-xs text-gray-600 line-clamp-2">
                {{ order.description }}
            </div>
        </div>

        <!-- Дата создания и создатель -->
        <div class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-calendar text-gray-400"></i>
                <span>{{ formatDate(order.date) }}</span>
                <span class="text-gray-400">•</span>
                <div class="flex items-center space-x-1">
                    <div class="w-4 h-4 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <img 
                            v-if="creatorPhoto" 
                            :src="creatorPhoto" 
                            :alt="creatorName"
                            class="w-full h-full object-cover"
                        >
                        <i v-else class="fas fa-user text-gray-400 text-xs"></i>
                    </div>
                    <span>{{ creatorName }}</span>
                </div>
            </div>
        </div>

        <!-- Проект (только для заказов) -->
        <div v-if="!isProjectMode && order.projectId" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i class="fas fa-folder text-purple-500 text-xs"></i>
                <span class="truncate">{{ order.projectName }}</span>
            </div>
        </div>

        <!-- Клиент (только для проектов) -->
        <div v-if="isProjectMode && order.client" class="mb-2">
            <div class="flex items-center space-x-1 text-xs text-gray-600">
                <i :class="getClientIconClass()"></i>
                <span class="truncate">{{ getClientName() }}</span>
            </div>
        </div>

        <!-- Бюджет проекта (только для проектов с permission) -->
        <div v-if="isProjectMode && $store.getters.hasPermission('settings_project_budget_view') && order.budget" class="mt-3 pt-3 border-t border-gray-100">
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

        <!-- Сумма заказа (только для заказов) -->
        <div v-if="!isProjectMode" class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-money-bill-wave text-green-600 text-xs"></i>
                    <span class="text-xs text-gray-500">{{ $t('total') }}:</span>
                </div>
                <span class="text-sm font-bold text-green-700">
                    {{ formatTotalPrice() }}
                </span>
            </div>
            <div class="flex items-center space-x-1">
                <i :class="`${getPaymentStatusIcon()} ${getPaymentStatusClass()}`"></i>
                <span class="text-xs font-medium" :class="getPaymentStatusClass()">
                    {{ getPaymentStatusText() }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';
import userPhotoMixin from '@/mixins/userPhotoMixin';

export default {
    name: 'KanbanCard',
    mixins: [userPhotoMixin],
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
        }
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        creatorName() {
            return this.order?.userName || this.order?.creator?.name || this.$t('notSpecified');
        },
        creatorPhoto() {
            const photo = this.order?.userPhoto || this.order?.creator?.photo || null;
            return photo ? this.getUserPhotoSrc({ photo }) : null;
        }
    },
    methods: {
        handleDoubleClick() {
            this.$emit('dblclick', this.order);
        },
        handleSelectToggle() {
            this.$emit('select-toggle', this.order.id);
        },
        formatDate(date) {
            return dayjsDateTime(date);
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
                // Если есть метод fullName, используем его
                if (typeof this.order.client.fullName === 'function') {
                    return this.order.client.fullName();
                }
                // Иначе пытаемся собрать имя из полей
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
                // Форматируем отображение через глобальный утилс $formatNumber (с учетом настроек компании)
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
            if (typeof this.order?.getPaymentStatusText === 'function') {
                return this.order.getPaymentStatusText();
            }
            const paidAmount = parseFloat(this.order?.paidAmount || 0);
            const totalPrice = parseFloat(this.order?.totalPrice || 0);
            const paymentStatus = this.order?.paymentStatus;
            
            if (paymentStatus) {
                switch (paymentStatus) {
                    case 'unpaid':
                        return 'Не оплачено';
                    case 'partially_paid':
                        return 'Частично оплачено';
                    case 'paid':
                        return 'Оплачено';
                }
            }
            
            if (paidAmount <= 0) {
                return 'Не оплачено';
            } else if (paidAmount < totalPrice) {
                return 'Частично оплачено';
            } else {
                return 'Оплачено';
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
        }
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

