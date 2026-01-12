<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow transition-shadow duration-200">
        <div class="flex items-center mb-3 border-b border-gray-100 pb-3">
            <i class="fas fa-link text-gray-600 text-sm mr-2"></i>
            <h3 class="text-sm font-semibold text-gray-900">{{ $t('quickLinks') || 'Быстрые ссылки' }}</h3>
        </div>
        
        <div class="space-y-1">
            <router-link 
                v-for="link in quickLinks" 
                :key="link.path"
                :to="link.path"
                class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition-colors group"
                :class="{ 'opacity-50 pointer-events-none': link.disabled }"
            >
                <i :class="[link.icon, 'text-gray-500 text-sm']"></i>
                <span class="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{{ $t(link.label) || link.label }}</span>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    name: 'QuickLinksWidget',
    computed: {
        quickLinks() {
            const links = [];
            
            if (this.$store.getters.hasPermission('tasks_view')) {
                links.push({
                    path: '/tasks',
                    label: 'tasks',
                    icon: 'fas fa-tasks',
                    color: '#3b82f6'
                });
            }
            
            if (this.$store.getters.hasPermission('orders_view')) {
                links.push({
                    path: '/orders',
                    label: 'orders',
                    icon: 'fas fa-cart-arrow-down',
                    color: '#10b981'
                });
            }
            
            if (this.$store.getters.hasPermission('projects_view')) {
                links.push({
                    path: '/projects',
                    label: 'projects',
                    icon: 'fas fa-briefcase',
                    color: '#f59e0b'
                });
            }
            
            if (this.$store.getters.hasPermission('clients_view')) {
                links.push({
                    path: '/clients',
                    label: 'clients',
                    icon: 'fas fa-user-friends',
                    color: '#8b5cf6'
                });
            }
            
            if (this.$store.getters.hasPermission('transactions_view')) {
                links.push({
                    path: '/transactions',
                    label: 'finance',
                    icon: 'fas fa-coins',
                    color: '#ef4444'
                });
            }
            
            return links.slice(0, 5); // Показываем максимум 5 ссылок
        }
    }
}
</script>

<style scoped>
</style>

