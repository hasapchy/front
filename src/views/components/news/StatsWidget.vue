<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)] dark:hover:shadow-none">
    <div class="mb-3 flex items-center border-b border-gray-100 pb-3 dark:border-[var(--border-subtle)]">
      <i class="fas fa-chart-line mr-2 text-sm text-gray-600 dark:text-[var(--text-secondary)]" />
      <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
        {{ $t('statistics') }}
      </h3>
    </div>

    <div
      v-if="loading"
      class="min-h-24"
    >
      <TableSkeleton />
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <div
        v-if="stats.ordersCount !== null"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-cart-arrow-down text-xs text-gray-500 dark:text-[var(--text-secondary)]" />
          <span class="text-gray-700 dark:text-[var(--text-secondary)]">{{ $t('orders') }}</span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-[var(--text-primary)]">{{ stats.ordersCount }}</span>
      </div>

      <div
        v-if="stats.projectsCount !== null"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-briefcase text-xs text-gray-500 dark:text-[var(--text-secondary)]" />
          <span class="text-gray-700 dark:text-[var(--text-secondary)]">{{ $t('projects') }}</span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-[var(--text-primary)]">{{ stats.projectsCount }}</span>
      </div>

      <div
        v-if="stats.clientsCount !== null"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-user-friends text-xs text-gray-500 dark:text-[var(--text-secondary)]" />
          <span class="text-gray-700 dark:text-[var(--text-secondary)]">{{ $t('clients') }}</span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-[var(--text-primary)]">{{ stats.clientsCount }}</span>
      </div>

      <div
        v-if="stats.usersCount !== null"
        class="flex items-center justify-between text-sm"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-users text-xs text-gray-500 dark:text-[var(--text-secondary)]" />
          <span class="text-gray-700 dark:text-[var(--text-secondary)]">{{ $t('users') }}</span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-[var(--text-primary)]">{{ stats.usersCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import OrderController from '@/api/OrderController';
import ProjectController from '@/api/ProjectController';
import ClientController from '@/api/ClientController';
import UsersController from '@/api/UsersController';
import TableSkeleton from '@/views/components/app/TableSkeleton.vue';

export default {
    name: 'StatsWidget',
    components: { TableSkeleton },
    data() {
        return {
            stats: {
                ordersCount: null,
                projectsCount: null,
                clientsCount: null,
                usersCount: null
            },
            loading: false
        }
    },
    async mounted() {
        await this.fetchStats();
    },
    methods: {
        async fetchStats() {
            this.loading = true;
            try {
                const promises = [];

                if (this.$store.getters.hasPermission('orders_view')) {
                    promises.push(
                        OrderController.getItems(1, null, 'all_time', null, null, '', '', '', '', 1).then(data => {
                            this.stats.ordersCount = data?.total || 0;
                        }).catch(() => {
                            this.stats.ordersCount = null;
                        })
                    );
                }

                if (this.$store.getters.hasPermission('projects_view')) {
                    promises.push(
                        ProjectController.getItems(1, {}, 1).then(data => {
                            this.stats.projectsCount = data?.total || 0;
                        }).catch(() => {
                            this.stats.projectsCount = null;
                        })
                    );
                }

                if (this.$store.getters.hasPermission('clients_view')) {
                    promises.push(
                        ClientController.getItems(1, null, false, null, null, 1).then(data => {
                            this.stats.clientsCount = data?.total || 0;
                        }).catch(() => {
                            this.stats.clientsCount = null;
                        })
                    );
                }

                if (this.$store.getters.hasPermission('users_view')) {
                    promises.push(
                        UsersController.getItems(1, 1).then(data => {
                            this.stats.usersCount = data?.total || 0;
                        }).catch(() => {
                            this.stats.usersCount = null;
                        })
                    );
                }

                await Promise.all(promises);
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>
