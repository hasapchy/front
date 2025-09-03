<template>
    <transition name="timeline-slide" appear>
        <div class="h-full w-[420px] bg-white z-[10] shadow-xl flex flex-col">

            <!-- 🔒 Фиксированная шапка с кнопкой -->
            <div class="sticky top-0 z-20 flex justify-between items-center p-4 bg-white">
                <h2 class="text-lg font-bold">Таймлайн</h2>
                <button @click="toggleTimeline" class="text-gray-500 hover:text-black transition-colors duration-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Контент -->
            <div class="flex-1 p-4 overflow-auto text-sm">
                <div v-if="loading" class="text-gray-400">Загрузка...</div>
                <div v-else-if="timeline.length === 0" class="text-gray-400">Нет данных</div>
                <div v-else class="relative">
                    <!-- Визуальная линия таймлайна -->
                    <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                    
                    <!-- Группировка по дням -->
                    <div v-for="(dayGroup, dayKey) in groupedTimeline" :key="dayKey" class="mb-6">
                        <!-- Заголовок дня -->
                        <div class="flex justify-center mb-4">
                            <div class="bg-gray-100 px-4 py-2 rounded-lg">
                                <div class="text-sm font-bold text-gray-700">
                                    {{ formatDayHeader(dayKey) }}
                                </div>
                            </div>
                        </div>
                        
                        <!-- События дня -->
                        <div v-for="item in dayGroup" :key="item.type + '_' + item.id" class="relative mb-4">
                            <div class="flex items-start">
                                <!-- Точка на линии -->
                                <div class="flex-shrink-0 w-8 flex justify-center relative">
                                    <div class="w-3 h-3 rounded-full border-2 border-white shadow-sm relative z-10 mt-1" 
                                         :class="item.type === 'comment' ? 'bg-blue-500' : 'bg-green-500'"></div>
                                </div>
                                
                                <!-- Контент -->
                                <div class="flex-1 ml-3 min-w-0">
                                    <!-- Заголовок с датой -->
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="font-medium text-sm text-gray-900">
                                            {{ item.user?.name || 'Система (автоматическая операция)' }}
                                        </span>
                                        <span class="text-xs text-gray-500">{{ formatTime(item.created_at) }}</span>
                                    </div>
                                    
                                    <!-- Текст события -->
                                    <div class="text-sm text-gray-700">
                                        <template v-if="item.type === 'comment'">
                                            <div class="flex items-start">
                                                <i class="fas fa-comment text-blue-500 mr-2 mt-0.5 text-xs"></i>
                                                <span class="break-words">{{ item.body }}</span>
                                            </div>
                                        </template>
                                        <template v-else-if="item.type === 'log'">
                                            <div class="flex items-start">
                                                <i class="fas fa-edit text-green-500 mr-2 mt-0.5 text-xs"></i>
                                                <div class="flex-1">
                                                    <div>{{ formatLogDescription(item.description) }}</div>
                                                    
                                                    <!-- Компактные изменения -->
                                                    <div v-if="item.changes?.attributes && shouldShowChanges(item)" 
                                                         class="mt-2 space-y-1">
                                                        <div v-for="(val, key) in filteredChanges(item.changes.attributes, item.changes.old)"
                                                             :key="key" 
                                                             class="text-xs bg-gray-50 px-2 py-1 rounded">
                                                            <span class="font-medium">{{ smartTranslateField(key, type) }}:</span>
                                                            <div class="flex items-center space-x-1 mt-1">
                                                                <span class="text-red-600 line-through px-1 bg-red-50 rounded">
                                                                    {{ formatFieldValue(key, item.changes.old?.[key]) || '—' }}
                                                                </span>
                                                                <span class="text-gray-400">→</span>
                                                                <span class="text-green-600 px-1 bg-green-50 rounded">
                                                                    {{ formatFieldValue(key, val) || '—' }}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🔚 Футер -->
            <div class="p-4 bg-[#edf4fb]">
                <div class="flex space-x-2">
                    <textarea v-model="newComment" 
                              class="flex-1 h-8 max-h-[120px] border rounded px-3 py-2 resize-y text-sm"
                              placeholder="Оставьте комментарий..." />
                    <button @click="sendComment" 
                            :disabled="!newComment.trim() || loading || sending"
                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                        <i class="fas fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>

        </div>
    </transition>
</template>

<script>
import { dayjsDateTime } from '@/utils/dateUtils';
import CommentController from '@/api/CommentController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import { translateField, formatFieldValue } from '@/utils/fieldTranslations';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

// Устанавливаем русскую локализацию
dayjs.locale('ru');

export default {
    props: {
        type: { type: String, required: true },
        id: { type: [String, Number], required: true },
        isCollapsed: { type: Boolean, default: true },
    },
    components: {
        PrimaryButton
    },
    emits: ['toggle-timeline'],
    data() {
        return {
            timeline: [],
            loading: false,
            sending: false,
            newComment: '',
        };
    },
    watch: {
        type: 'fetchTimeline',
        id: 'fetchTimeline',
    },
    mounted() {
        this.fetchTimeline();
    },
    methods: {
        toggleTimeline() {
            // Эмитим событие для закрытия таймлайна
            this.$emit('toggle-timeline');
        },
        async fetchTimeline() {
            this.loading = true;
            try {
                this.timeline = await CommentController.getTimeline(this.type, this.id);
            } catch (e) {
                console.error('Ошибка загрузки таймлайна:', e);
            }
            this.loading = false;
        },
        formatDate(date) {
            return dayjsDateTime(date);
        },
        formatTime(date) {
            return dayjs(date).format('HH:mm');
        },
        formatDayHeader(dateStr) {
            const date = dayjs(dateStr);
            const today = dayjs();
            const yesterday = dayjs().subtract(1, 'day');
            
            if (date.isSame(today, 'day')) {
                return 'Сегодня';
            } else if (date.isSame(yesterday, 'day')) {
                return 'Вчера';
            } else {
                return date.format('DD MMMM YYYY');
            }
        },
        formatLogDescription(description) {
            // Описания уже переведены на сервере
            return description;
        },
        async sendComment() {
            const body = this.newComment.trim();
            if (!body || this.sending) return;

            this.sending = true;
            try {
                const { comment } = await CommentController.create(this.type, this.id, body);
                this.newComment = '';
                
                const newComment = {
                    type: 'comment',
                    id: comment.id,
                    body: comment.body,
                    user: comment.user,
                    created_at: comment.created_at || new Date().toISOString(),
                };
                
                this.timeline.push(newComment);
                // Сортируем таймлайн по дате создания
                this.timeline.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

            } catch (e) {
                console.error('Ошибка отправки комментария:', e);
                alert('Не удалось отправить комментарий');
            }
            this.sending = false;
        },
        filteredChanges(newAttrs, oldAttrs) {
            return Object.fromEntries(
                Object.entries(newAttrs).filter(([key, newVal]) => {
                    const oldVal = oldAttrs?.[key] ?? null;
                    // Показываем изменения только если значения действительно отличаются
                    return String(oldVal) !== String(newVal) && 
                           !(newVal === null && oldVal === null) &&
                           !(newVal === '' && oldVal === '');
                })
            );
        },
        shouldShowChanges(item) {
            if (item.description === 'Добавлен товар/услуга: ' || 
                item.description === 'Удалён товар/услуга: ') {
                return false;
            }
            return true;
        },
        translateField,
        formatFieldValue(key, value) {
            // Если значение пустое или null
            if (value === null || value === undefined || value === '') {
                return '—';
            }

            // Обработка полей с ID - показываем названия вместо ID
            if (key.endsWith('_id') && typeof value === 'number') {
                // Для числовых ID возвращаем как есть - сервер должен их обработать
                return value;
            }

            // Обработка специальных полей
            switch (key) {
                case 'total_price':
                case 'price':
                case 'amount':
                    return typeof value === 'number' ? `${value.toLocaleString('ru-RU')} ₽` : value;
                case 'quantity':
                    return typeof value === 'number' ? value.toString() : value;
                case 'created_at':
                case 'updated_at':
                    return dayjs(value).format('DD.MM.YYYY HH:mm');
                default:
                    return value;
            }
        },
        // Умная функция перевода полей с учетом контекста
        smartTranslateField(key, type) {
            // Специфичные переводы для разных типов сущностей
            const specificTranslations = {
                'order': {
                    'category_id': 'Категория заказа',
                    'status_id': 'Статус заказа',
                },
                'transaction': {
                    'category_id': 'Категория транзакции',
                },
                'sale': {
                    'category_id': 'Категория продажи',
                }
            };

            // Сначала проверяем специфичные переводы
            if (specificTranslations[type] && specificTranslations[type][key]) {
                return specificTranslations[type][key];
            }

            // Затем используем общие переводы
            return translateField(key);
        },
        refreshTimeline() {
            this.fetchTimeline();
        }
    },
    computed: {
        sortedTimeline() {
            return [...this.timeline].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        },
        groupedTimeline() {
            const groups = {};
            this.sortedTimeline.forEach(item => {
                const dayKey = dayjs(item.created_at).format('YYYY-MM-DD');
                if (!groups[dayKey]) {
                    groups[dayKey] = [];
                }
                groups[dayKey].push(item);
            });
            return groups;
        }
    }
};
</script>

<style scoped>
/* Анимация появления/исчезновения таймлайна */
.timeline-slide-enter-active,
.timeline-slide-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-slide-enter-from {
    opacity: 0;
    transform: translateX(20px);
}

.timeline-slide-leave-to {
    opacity: 0;
    transform: translateX(20px);
}

.timeline-slide-enter-to,
.timeline-slide-leave-from {
    opacity: 1;
    transform: translateX(0);
}

/* Дополнительные плавные переходы для элементов внутри */
.timeline-slide-enter-active .flex-1,
.timeline-slide-leave-active .flex-1 {
    transition: opacity 0.2s ease-in-out;
}

.timeline-slide-enter-from .flex-1,
.timeline-slide-leave-to .flex-1 {
    opacity: 0;
}

/* Плавные переходы для всех интерактивных элементов */
button, textarea {
    transition: all 0.2s ease-in-out;
}

/* Анимация для точек на таймлайне */
.timeline-slide-enter-active .w-3,
.timeline-slide-leave-active .w-3 {
    transition: all 0.3s ease-in-out;
}

.timeline-slide-enter-from .w-3 {
    transform: scale(0);
    opacity: 0;
}

.timeline-slide-leave-to .w-3 {
    transform: scale(0);
    opacity: 0;
}
</style>
