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
                <i class="fas fa-user text-blue-500 text-xs"></i>
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
                <i class="fas fa-user-circle text-gray-400"></i>
                <span>{{ order.userName || $t('notSpecified') }}</span>
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
                <i class="fas fa-user text-blue-500 text-xs"></i>
                <span class="truncate">{{ getClientName() }}</span>
            </div>
        </div>

        <!-- Сумма заказа (только для заказов) -->
        <div v-if="!isProjectMode" class="mt-3 pt-3 border-t border-gray-100">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-money-bill-wave text-green-600 text-xs"></i>
                    <span class="text-xs text-gray-500">{{ $t('total') }}:</span>
                </div>
                <span class="text-sm font-bold text-green-700">
                    {{ order.totalPrice }} {{ order.currencySymbol }}
                </span>
            </div>
        </div>
    </div>
</template>

<script>
import { dayjsDateTime } from '@/utils/dateUtils';

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
        }
    },
    emits: ['dblclick', 'select-toggle'],
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

