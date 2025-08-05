<template>
    <div class="h-full w-[420px] bg-white z-[10] shadow-xl border-l flex flex-col">

        <!-- 🔒 Фиксированная шапка с кнопкой -->
        <div class="sticky top-0 z-20 flex justify-between items-center p-4 bg-white">
            <h2 class="text-lg font-bold">Таймлайн</h2>
            <button @click="toggleTimeline" class="text-gray-500 hover:text-black">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Контент -->
        <div class="flex-1 p-3 overflow-auto text-sm">
            <div v-if="loading" class="text-gray-400">Загрузка...</div>
            <div v-else-if="timeline.length === 0" class="text-gray-400">Нет данных</div>
            <div v-else class="relative">
                <!-- Непрерывная линия таймлайна -->
                <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-400"></div>
                
                <div v-for="item in sortedTimeline" :key="item.type + '_' + item.id" class="relative mb-6">
                    <!-- Таймлайн линия с точкой -->
                    <div class="flex items-start">
                        <!-- Контейнер для точки -->
                        <div class="flex-shrink-0 w-6 flex flex-col items-center relative">
                            <!-- Точка поверх линии -->
                            <div class="w-3 h-3 rounded-full border-2 border-white shadow-sm relative z-10 mt-2" 
                                 :class="item.type === 'comment' ? 'bg-blue-500' : 'bg-green-500'"></div>
                        </div>
                        
                        <div class="flex-1 ml-3">
                            <div class="text-gray-600 text-xs mb-1">{{ formatDate(item.created_at) }}</div>
                            <div class="bg-gray-50 p-3 rounded-lg border-l-4" 
                                 :class="item.type === 'comment' ? 'border-blue-500' : 'border-green-500'">
                                <template v-if="item.type === 'comment'">
                                    <div class="flex items-start">
                                        <span class="text-blue-500 mr-2">💬</span>
                                        <div class="flex-1">
                                            <div class="font-medium text-sm">{{ item.user?.name }}</div>
                                            <div class="text-sm break-words whitespace-pre-line">
                                                {{ item.body }}
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-else-if="item.type === 'log'">
                                    <div class="flex items-start">
                                        <span class="text-green-500 mr-2">📝</span>
                                        <div class="flex-1">
                                            <div class="font-medium text-sm">{{ item.user?.name || 'Система' }}</div>
                                            <div class="text-sm">{{ item.description }}</div>
                                            <!-- Показывать изменения только для значимых изменений -->
                                            <div v-if="item.changes?.attributes && shouldShowChanges(item)" 
                                                class="text-xs text-gray-500 mt-2 p-2 bg-white rounded border">
                                                <div class="font-medium text-gray-700 mb-2">Изменения:</div>
                                                <div v-for="(val, key) in filteredChanges(item.changes.attributes, item.changes.old)"
                                                    :key="key" class="mb-2 p-2 bg-gray-50 rounded">
                                                    <div class="font-medium text-gray-600 mb-1">{{ translateField(key) }}:</div>
                                                    <div class="flex items-center space-x-2">
                                                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                                            {{ formatFieldValue(key, item.changes.old?.[key]) }}
                                                        </span>
                                                        <span class="text-gray-400">→</span>
                                                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                            {{ formatFieldValue(key, val) }}
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

        <!-- 🔚 Футер: теперь как в SideModalDialog -->
        <div class="mt-4 p-4 flex items-center justify-between bg-[#edf4fb] gap-4 flex-wrap md:flex-nowrap">
            <textarea v-model="newComment" class="h-8 max-h-[180px] w-full border rounded p-2 resize-y"
                placeholder="Оставьте комментарий..." />
            <PrimaryButton :isLoading="sending" icon="fa fa-paper-plane" :disabled="!newComment.trim() || loading"
                @click="sendComment" class="shrink-0">
            </PrimaryButton>
        </div>


    </div>
</template>



<script>
import { dayjsDateTime } from '@/utils/dateUtils';
import CommentController from '@/api/CommentController';
import PrimaryButton from '@/views/components/app/buttons/PrimaryButton.vue';
import { translateField, formatFieldValue } from '@/utils/fieldTranslations';


export default {
    props: {
        type: { type: String, required: true },
        id: { type: [String, Number], required: true },
        isCollapsed: { type: Boolean, default: true }, // По умолчанию свернут
    },
    components: {
        PrimaryButton
    },
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
        async sendComment() {
            const body = this.newComment.trim();
            if (!body || this.sending) return;

            this.sending = true;
            try {
                const { comment } = await CommentController.create(this.type, this.id, body);
                this.newComment = '';
                
                // Добавляем новый комментарий с минимальными данными
                const newComment = {
                    type: 'comment',
                    id: comment.id,
                    body: comment.body,
                    user: comment.user,
                    created_at: comment.created_at || new Date().toISOString(),
                };
                
                this.timeline.push(newComment);

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
                    return String(oldVal) !== String(newVal);
                })
            );
        },
        shouldShowChanges(item) {
            // Не показывать изменения для добавления/удаления товаров
            if (item.description === 'Добавлен товар/услуга: ' || 
                item.description === 'Удалён товар/услуга: ') {
                return false;
            }
            return true;
        },
        translateField,
        formatFieldValue,
        // Добавляем метод для обновления таймлайна
        refreshTimeline() {
            this.fetchTimeline();
        }

    },
    computed: {
        sortedTimeline() {
            return [...this.timeline].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
    }

};
</script>
