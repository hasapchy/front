<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
    <div class="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-[var(--border-subtle)]">
      <div class="flex items-center gap-2">
        <i class="fas fa-tasks text-sm text-gray-600 dark:text-[var(--text-secondary)]" />
        <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
          {{ $t('tasks') }}
        </h3>
      </div>
    </div>
        
    <div
      v-if="loading"
      class="min-h-24"
    >
      <TableSkeleton />
    </div>
        
    <div
      v-else-if="statusCounts.length > 0"
      class="space-y-2"
    >
      <router-link 
        v-for="status in statusCounts"
        :key="status.id"
        :to="`/tasks?status=${status.id}`"
        class="group -mx-2 flex items-center justify-between rounded px-2 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div 
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: status.color || '#6c757d' }"
          />
          <span class="truncate text-gray-700 group-hover:text-gray-900 dark:text-[var(--text-primary)] dark:group-hover:text-[var(--text-primary)]">{{ status.name }}</span>
        </div>
        <span class="shrink-0 rounded bg-gray-100 px-2 py-0.5 font-semibold text-gray-900 dark:bg-[var(--surface-muted)] dark:text-[var(--text-primary)]">{{ status.count }}</span>
      </router-link>
    </div>
        
    <div
      v-else
      class="text-sm text-gray-500 text-center py-2"
    >
      {{ $t('noTasks') }}
    </div>
  </div>
</template>

<script>
import TaskController from '@/api/TaskController';
import TaskStatusController from '@/api/TaskStatusController';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';
import { translateTaskStatus } from '@/utils/translationUtils';

export default {
    name: 'TasksWidget',
    components: { TableSkeleton },
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
                const statuses = await TaskStatusController.getListItems();
                const tasks = await TaskController.getItems(1, '', '', 100);
                
                if (statuses && statuses.length > 0 && tasks && tasks.items) {
                    const counts = {};
                    tasks.items.forEach(task => {
                        const statusId = task.statusId;
                        if (statusId) {
                            counts[statusId] = (counts[statusId] || 0) + 1;
                        }
                    });
                    
                    this.statusCounts = statuses
                        .map(status => ({
                            id: status.id,
                            name: translateTaskStatus(status.name, this.$t),
                            color: status.color || '#6c757d',
                            count: counts[status.id] || 0
                        }))
                        .filter(status => status.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
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
