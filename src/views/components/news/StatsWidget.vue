<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center mb-3 border-b border-gray-100 pb-3">
            <i class="fas fa-chart-line text-gray-600 text-sm mr-2"></i>
            <h3 class="text-sm font-semibold text-gray-900">{{ $t('statistics') || 'Статистика' }}</h3>
        </div>
        
        <div v-if="loading" class="flex justify-center py-4">
            <i class="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
        
        <div v-else class="space-y-3">
            <div v-if="stats.ordersCount !== null" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <i class="fas fa-cart-arrow-down text-gray-500 text-xs"></i>
                    <span class="text-gray-700">{{ $t('orders') || 'Заказы' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ stats.ordersCount }}</span>
            </div>
            
            <div v-if="stats.projectsCount !== null" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <i class="fas fa-briefcase text-gray-500 text-xs"></i>
                    <span class="text-gray-700">{{ $t('projects') || 'Проекты' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ stats.projectsCount }}</span>
            </div>
            
            <div v-if="stats.clientsCount !== null" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <i class="fas fa-user-friends text-gray-500 text-xs"></i>
                    <span class="text-gray-700">{{ $t('clients') || 'Клиенты' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ stats.clientsCount }}</span>
            </div>
            
            <div v-if="stats.usersCount !== null" class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                    <i class="fas fa-users text-gray-500 text-xs"></i>
                    <span class="text-gray-700">{{ $t('users') || 'Сотрудники' }}</span>
                </div>
                <span class="font-semibold text-gray-900">{{ stats.usersCount }}</span>
            </div>
        </div>
    </div>
</template>

<script>
import OrderController from '@/api/OrderController';
import ProjectController from '@/api/ProjectController';
import ClientController from '@/api/ClientController';
import UsersController from '@/api/UsersController';

export default {
    name: 'StatsWidget',
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
                
                // Загружаем статистику параллельно
                if (this.$store.getters.hasPermission('orders_view')) {
                    promises.push(
                        OrderController.getItems(1, null, 'all_time', null, null, '', '', '', 1).then(data => {
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

<style scoped>
</style>

