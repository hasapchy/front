<template>
    <div class="h-full w-[420px] bg-white z-[10] shadow-xl border-l flex flex-col">

        <!-- 🔒 Фиксированная шапка с кнопкой -->
        <div class="sticky top-0 z-20 flex justify-between items-center p-4 bg-white">
            <h2 class="text-lg font-bold">Таймлайн</h2>
            <button @click="$emit('toggle')" class="text-gray-500 hover:text-black">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Контент -->
        <div class="flex-1 p-3 overflow-auto text-sm">
            <div v-if="loading" class="text-gray-400">Загрузка...</div>
            <div v-else-if="timeline.length === 0" class="text-gray-400">Нет данных</div>
            <div v-else>
                <div v-for="item in timeline" :key="item.type + '_' + item.id">
                    <div class="text-gray-600 text-xs">{{ formatDate(item.created_at) }}</div>
                    <div>
                        <template v-if="item.type === 'comment'">
                            💬 <strong>{{ item.user?.name }}</strong>:
                            <span class="break-words whitespace-pre-line inline-block max-w-full">
                                {{ item.body }}
                            </span>
                        </template>
                        <template v-else-if="item.type === 'log'">
                            📝 <strong>{{ item.user?.name || 'Система' }}</strong>: {{ item.description }}
                            <div v-if="item.changes?.attributes" class="text-xs text-gray-500 mt-1">
                                <div v-for="(val, key) in filteredChanges(item.changes.attributes, item.changes.old)"
                                    :key="key">
                                    {{ key }}: {{ item.changes.old?.[key] ?? '—' }} → {{ val }}
                                </div>

                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- 🔚 Футер: теперь как в форме -->
        <div class="mt-auto p-4 bg-[#edf4fb] flex items-end gap-4">
            <textarea v-model="newComment" class="min-h-[60px] max-h-[180px] w-full border rounded p-2 resize-y"
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


export default {
    props: {
        type: { type: String, required: true },
        id: { type: [String, Number], required: true },
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
                console.log("Загружаю таймлайн...");
                this.timeline = await CommentController.getTimeline(this.type, this.id);
                console.log("Результат:", this.timeline);
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
                this.timeline.unshift({
                    ...comment,
                    type: 'comment',
                    created_at: comment.created_at || new Date().toISOString(),
                });

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
        }

    },
    // computed: {
    //     sortedTimeline() {
    //         return [...this.timeline].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    //     }
    // }

};
</script>
