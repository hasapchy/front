<template>
    <div v-if="loading" class="flex justify-center items-center h-64">
        <SpinnerIcon />
    </div>
    
    <div v-else-if="task" class="p-6">
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-bold">{{ task.title }}</h1>
            <div class="flex space-x-2">
                <button 
                    @click="$router.push('/tasks')" 
                    class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    {{ $t('back') }}
                </button>
                <button 
                    v-if="$store.getters.hasPermission('tasks_update_all')"
                    @click="editTask" 
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    {{ $t('edit') }}
                </button>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
                <label class="font-semibold">{{ $t('status') }}:</label>
                <span v-html="getStatusBadge(task.status)"></span>
            </div>

            <div>
                <label class="font-semibold">{{ $t('description') }}:</label>
                <p class="mt-1">{{ task.description || '-' }}</p>
            </div>

            <div>
                <label class="font-semibold">{{ $t('creator') }}:</label>
                <p class="mt-1">{{ task.creator ? task.creator.name : '-' }}</p>
            </div>

            <div>
                <label class="font-semibold">{{ $t('executor') }}:</label>
                <p class="mt-1">{{ task.executor ? task.executor.name : '-' }}</p>
            </div>

            <div>
                <label class="font-semibold">{{ $t('deadline') }}:</label>
                <p class="mt-1">{{ task.deadline ? new Date(task.deadline).toLocaleString() : '-' }}</p>
            </div>

            <div>
                <label class="font-semibold">{{ $t('createdAt') }}:</label>
                <p class="mt-1">{{ task.created_at ? new Date(task.created_at).toLocaleString() : '-' }}</p>
            </div>
        </div>
    </div>

    <div v-else class="p-6">
        <p>{{ $t('taskNotFound') }}</p>
    </div>
</template>

<script>
import TaskController from '@/api/TaskController';

export default {
    data() {
        return {
            task: null,
            loading: true,
        }
    },
    async mounted() {
        await this.fetchTask();
    },
    methods: {
        async fetchTask() {
            try {
                this.loading = true;
                const response = await TaskController.getItem(this.$route.params.id);
                this.task = response.data;
            } catch (error) {
                this.$router.push('/tasks');
            } finally {
                this.loading = false;
            }
        },
        getStatusBadge(status) {
            const badges = {
                'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Ожидает</span>',
                'in_progress': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">В работе</span>',
                'completed': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Завершена</span>',
                'postponed': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Отложена</span>',
            };
            return badges[status] || status;
        },
        editTask() {
            // Можно открыть модальное окно редактирования или перейти на страницу редактирования
            // Пока просто возвращаемся на список
            this.$router.push('/tasks');
        },
    },
}
</script>
