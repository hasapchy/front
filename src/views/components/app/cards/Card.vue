<template>
    <div 
        class="card bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
        :class="{ 'ring-2 ring-blue-400': isSelected }"
        @dblclick="handleDoubleClick"
    >
        <!-- Заголовок с чекбоксом и основным полем -->
        <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-2 min-w-0 flex-1">
                <input 
                    v-if="showCheckbox"
                    type="checkbox" 
                    :checked="isSelected" 
                    @click.stop="handleSelectToggle"
                    class="cursor-pointer flex-shrink-0"
                />
                <slot name="title">
                    <span v-if="title" class="text-sm font-bold text-gray-800 truncate">
                        {{ title }}
                    </span>
                    <span v-else-if="titleField" class="text-sm font-bold text-gray-800 truncate">
                        {{ getFieldValue(item, titleField) }}
                    </span>
                </slot>
            </div>
        </div>

        <!-- Изображение (если есть) -->
        <div v-if="imageField && getFieldValue(item, imageField)" class="mb-3">
            <img 
                :src="getFieldValue(item, imageField)" 
                :alt="getFieldValue(item, titleField) || ''"
                class="w-full h-32 object-cover rounded"
            />
        </div>

        <!-- Контент карточки (растягивается для фиксации линии) -->
        <div class="flex-1" style="min-height: 80px;">
            <!-- Динамические поля -->
            <div v-for="field in visibleFields" :key="field.name" class="mb-2">
                <div v-if="shouldShowField(field)" :class="getFieldContainerClass(field)">
                    <i v-if="field.icon" :class="field.icon"></i>
                    <span v-if="field.label && field.showLabel" class="text-gray-500 mr-1">{{ field.label }}:</span>
                    <span class="truncate" :class="getFieldTextClass(field)">
                        {{ formatFieldValue(item, field) }}
                    </span>
                </div>
            </div>

            <!-- Описание (если есть) -->
            <div v-if="fieldVisibility['description'] !== false && descriptionField && getFieldValue(item, descriptionField)" class="mb-2">
                <div class="text-xs text-gray-600 line-clamp-2">
                    {{ getFieldValue(item, descriptionField) }}
                </div>
            </div>

            <!-- Примечание/Note (если есть) -->
            <div v-if="fieldVisibility['note'] !== false && noteField && getFieldValue(item, noteField)" class="mb-2">
                <div class="text-xs text-gray-600">
                    <div class="flex items-start space-x-1">
                        <i class="fas fa-sticky-note text-gray-400 text-xs mt-0.5"></i>
                        <span class="line-clamp-2">{{ getFieldValue(item, noteField) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Футер с дополнительной информацией (цена, статус и т.д.) - всегда внизу -->
        <div v-if="footerFields && footerFields.length > 0" class="mt-auto pt-3 border-t border-gray-100">
            <template v-for="field in footerFields" :key="field.name">
                <div v-if="shouldShowFooterField(field)" class="flex items-center justify-between" :class="field === footerFields[footerFields.length - 1] ? '' : 'mb-2'">
                    <div class="flex items-center space-x-1">
                        <i v-if="field.icon" :class="getFooterIconClass(field)"></i>
                        <span v-if="field.label" class="text-xs text-gray-500">{{ field.label }}:</span>
                    </div>
                    <span class="text-sm font-bold" :class="getFieldColorClass(field)">
                        {{ formatFieldValue(item, field) }}
                    </span>
                </div>
            </template>
            <!-- Дополнительные элементы футера (например, статус оплаты) -->
            <div v-if="footerAdditional && footerAdditional.length > 0">
                <div v-for="item in footerAdditional" :key="item.key" class="flex items-center space-x-1">
                    <i :class="`${item.icon} ${item.iconClass || ''}`"></i>
                    <span class="text-xs font-medium" :class="item.textClass || ''">
                        {{ item.text }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { dayjsDateTime } from '@/utils/dateUtils';
import { formatNumber } from '@/utils/numberUtils';

export default {
    name: 'Card',
    props: {
        item: {
            type: Object,
            required: true
        },
        isSelected: {
            type: Boolean,
            default: false
        },
        showCheckbox: {
            type: Boolean,
            default: true
        },
        // Основное поле для заголовка
        titleField: {
            type: String,
            default: 'name'
        },
        // Или прямой текст заголовка
        title: {
            type: String,
            default: null
        },
        // Поле для изображения
        imageField: {
            type: String,
            default: null
        },
        // Поле для описания
        descriptionField: {
            type: String,
            default: null
        },
        // Поле для примечания
        noteField: {
            type: String,
            default: null
        },
        // Конфигурация полей для отображения
        fields: {
            type: Array,
            default: () => []
        },
        // Поля для футера (цена, статус и т.д.)
        footerFields: {
            type: Array,
            default: () => []
        },
        // Функция для проверки видимости поля
        fieldVisibility: {
            type: Object,
            default: () => ({})
        },
        // Дополнительные элементы футера
        footerAdditional: {
            type: Array,
            default: () => []
        }
    },
    emits: ['dblclick', 'select-toggle'],
    computed: {
        visibleFields() {
            return this.fields.filter(field => this.shouldShowField(field));
        }
    },
    methods: {
        getFieldValue(item, fieldPath) {
            if (!item || !fieldPath) return '';
            
            // Поддержка вложенных полей через точку (например, "user.name")
            const parts = fieldPath.split('.');
            let value = item;
            
            for (const part of parts) {
                if (value && typeof value === 'object') {
                    value = value[part];
                } else {
                    return '';
                }
            }
            
            return value || '';
        },
        formatFieldValue(item, field) {
            const value = this.getFieldValue(item, field.name);
            
            // Сначала проверяем formatter (если есть, он имеет приоритет)
            if (field.formatter && typeof field.formatter === 'function') {
                return field.formatter(value, item);
            }
            
            if (value === null || value === undefined || value === '') {
                return field.defaultValue || '—';
            }
            
            // Форматирование по типу поля
            if (field.type === 'date') {
                return dayjsDateTime(value);
            }
            
            if (field.type === 'datetime') {
                return dayjsDateTime(value);
            }
            
            if (field.type === 'number' || field.type === 'price') {
                const numValue = Number(value);
                if (isNaN(numValue)) return value;
                
                if (field.type === 'price') {
                    const decimals = field.decimals !== undefined ? field.decimals : 2;
                    const symbol = field.currencySymbol || '';
                    const formatted = formatNumber(numValue, decimals, true);
                    return symbol ? `${formatted} ${symbol}` : formatted;
                }
                
                return formatNumber(numValue, field.decimals || 0, true);
            }
            
            if (field.type === 'boolean') {
                // Для boolean полей без formatter возвращаем текст
                return value ? 'Да' : 'Нет';
            }
            
            if (field.type === 'array') {
                if (Array.isArray(value)) {
                    return value.map(v => typeof v === 'object' ? (v.name || v.title || String(v)) : String(v)).join(', ');
                }
                return String(value);
            }
            
            return String(value);
        },
        shouldShowField(field) {
            // Если поле обязательное для отображения - всегда показываем
            if (field.required) {
                return true;
            }
            
            // Проверка видимости через fieldVisibility (только если поле не пустое)
            if (this.fieldVisibility[field.name] === false) {
                return false;
            }

            // Проверяем, есть ли значение у поля
            const value = this.getFieldValue(this.item, field.name);
            const hasValue = value !== null && value !== undefined && value !== '';
            
            // Если есть formatter - проверяем, что он возвращает не пустое значение
            if (field.formatter && typeof field.formatter === 'function') {
                const formattedValue = field.formatter(value, this.item);
                // Если formatter возвращает пустую строку или '—', не показываем поле
                if (!formattedValue || formattedValue === '—' || (typeof formattedValue === 'string' && formattedValue.trim() === '')) {
                    return false;
                }
                return true;
            }
            
            // Если нет значения и нет defaultValue - не показываем поле
            if (!hasValue && !field.defaultValue) {
                return false;
            }
            
            return true;
        },
        shouldShowFooterField(field) {
            if (!field || !field.name) {
                return false;
            }
            
            // Если поле обязательное для отображения - всегда показываем
            if (field.required) {
                return true;
            }
            
            // Проверка видимости через fieldVisibility
            if (this.fieldVisibility[field.name] === false) {
                return false;
            }
            
            // Для футерных полей всегда показываем, если не скрыто явно
            return true;
        },
        handleDoubleClick() {
            this.$emit('dblclick', this.item);
        },
        handleSelectToggle() {
            this.$emit('select-toggle', this.item.id);
        },
        getFieldColorClass(field) {
            if (typeof field.colorClass === 'function') {
                return field.colorClass(this.item) || 'text-gray-800';
            }
            return field.colorClass || 'text-gray-800';
        },
        getFieldContainerClass(field) {
            // По умолчанию text-sm для соответствия KanbanCard
            // Но можно указать field.size для изменения размера
            const size = field.size || 'sm';
            const sizeClass = size === 'xs' ? 'text-xs' : 'text-sm';
            return `flex items-center space-x-1 ${sizeClass} text-gray-600`;
        },
        getFieldTextClass(field) {
            // Для важных полей (как клиент) используется font-medium
            // Для обычных полей - без дополнительных классов
            const classes = [];
            
            if (field.bold) {
                classes.push('font-semibold');
            } else if (field.medium) {
                classes.push('font-medium');
            }
            
            if (field.highlight) {
                classes.push('text-gray-800');
            }
            
            return classes.join(' ');
        },
        getIconColorStyle(field) {
            // Для иконок статуса применяем цвет из colorClass
            const colorClass = this.getFieldColorClass(field);
            if (colorClass.includes('green')) {
                return 'color: rgb(22, 163, 74);'; // text-green-600
            } else if (colorClass.includes('red')) {
                return 'color: rgb(220, 38, 38);'; // text-red-600
            } else if (colorClass.includes('blue')) {
                return 'color: rgb(37, 99, 235);'; // text-blue-600
            }
            return '';
        },
        getFooterIconClass(field) {
            // Базовые классы иконки
            let iconClass = field.icon || '';
            
            // Если есть iconColor функция, используем её
            if (field.iconColor && typeof field.iconColor === 'function') {
                const colorClass = field.iconColor(this.item);
                if (colorClass) {
                    // Убираем старые цветные классы и добавляем новый
                    iconClass = iconClass.replace(/text-\w+-\d+/g, '').trim();
                    iconClass = `${iconClass} ${colorClass}`.trim();
                }
            }
            
            return iconClass;
        }
    }
};
</script>

<style scoped>
.card {
    min-height: 80px;
    user-select: none;
}

/* Идентично kanban-card */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>

