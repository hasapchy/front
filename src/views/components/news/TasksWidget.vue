<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
            <div class="flex items-center gap-2">
                <i class="fas fa-tasks text-gray-600 text-sm"></i>
                <h3 class="text-sm font-semibold text-gray-900">{{ $t('tasks') || 'Задачи' }}</h3>
            </div>
        </div>
        
        <div v-if="loading" class="flex justify-center py-4">
            <i class="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        
        <div v-else-if="statusCounts.length > 0" class="space-y-2">
            <router-link 
                v-for="status in statusCounts"
                :key="status.id"
                :to="`/tasks?status=${status.id}`"
                class="flex items-center justify-between text-sm hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors group"
            >
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                        class="w-3 h-3 rounded-full shrink-0"
                        :style="{ backgroundColor: status.color || '#6c757d' }"
                    ></div>
                    <span class="text-gray-700 group-hover:text-gray-900 truncate">{{ status.name }}</span>
                </div>
                <span class="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded shrink-0">{{ status.count }}</span>
            </router-link>
        </div>
        
        <div v-else class="text-sm text-gray-500 text-center py-2">
            {{ $t('noTasks') || 'Нет задач' }}
        </div>
    </div>
</template>

<script>
import TaskController from '@/api/TaskController';
import TaskStatusController from '@/api/TaskStatusController';
import { translateTaskStatus } from '@/utils/translationUtils';

export default {
    name: 'TasksWidget',
    data() {
        return {
            statusCounts: [],
            loading: false
        }
    },
    async mounted() {
        if (this.$store.getters.hasPermission('tasks_view')) {
            await this.fetchTasksByStatus();
        }
    },
    methods: {
        async fetchTasksByStatus() {
            this.loading = true;
            try {
                // Загружаем статусы задач
                const statuses = await TaskStatusController.getListItems();
                
                // Загружаем все задачи
                const tasks = await TaskController.getItems(1, '', '', 100);
                
                if (statuses && statuses.length > 0 && tasks && tasks.items) {
                    // Подсчитываем задачи по статусам
                    const counts = {};
                    tasks.items.forEach(task => {
                        const statusId = task.statusId;
                        if (statusId) {
                            counts[statusId] = (counts[statusId] || 0) + 1;
                        }
                    });
                    
                    // Формируем массив статусов с количеством задач
                    this.statusCounts = statuses
                        .map(status => ({
                            id: status.id,
                            name: translateTaskStatus(status.name, this.$t),
                            color: status.color || '#6c757d',
                            count: counts[status.id] || 0
                        }))
                        .filter(status => status.count > 0) // Показываем только статусы с задачами
                        .sort((a, b) => b.count - a.count) // Сортируем по количеству задач
                        .slice(0, 5); // Показываем максимум 5 статусов
                }
            } catch (error) {
                console.error('Ошибка загрузки задач по статусам:', error);
                this.statusCounts = [];
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<style scoped>
</style>

