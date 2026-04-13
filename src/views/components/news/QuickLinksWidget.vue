<template>
  <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow dark:border-[var(--border-subtle)] dark:bg-[var(--surface-elevated)]">
    <div class="mb-3 flex items-center border-b border-gray-100 pb-3 dark:border-[var(--border-subtle)]">
      <i class="fas fa-link mr-2 text-sm text-gray-600 dark:text-[var(--text-secondary)]" />
      <h3 class="text-sm font-semibold text-gray-900 dark:text-[var(--text-primary)]">
        {{ $t('quickLinks') }}
      </h3>
    </div>
        
    <div class="space-y-1">
      <router-link 
        v-for="link in quickLinks" 
        :key="link.path"
        :to="link.path"
        class="group flex items-center gap-2 rounded p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <i :class="[link.icon, 'text-sm text-gray-500 dark:text-[var(--text-secondary)]']" />
        <span class="flex-1 text-sm text-gray-700 group-hover:text-gray-900 dark:text-[var(--text-primary)] dark:group-hover:text-[var(--text-primary)]">{{ $t(link.label) || link.label }}</span>
        <i class="fas fa-chevron-right text-gray-400 text-xs" />
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
                    icon: 'fas fa-tasks'
                });
            }
            
            if (this.$store.getters.hasPermission('orders_view')) {
                links.push({
                    path: '/orders',
                    label: 'orders',
                    icon: 'fas fa-cart-arrow-down'
                });
            }
            
            if (this.$store.getters.hasPermission('projects_view')) {
                links.push({
                    path: '/projects',
                    label: 'projects',
                    icon: 'fas fa-briefcase'
                });
            }
            
            if (this.$store.getters.hasPermission('clients_view')) {
                links.push({
                    path: '/clients',
                    label: 'clients',
                    icon: 'fas fa-user-friends'
                });
            }
            
            if (this.$store.getters.hasPermission('transactions_view')) {
                links.push({
                    path: '/transactions',
                    label: 'finance',
                    icon: 'fas fa-coins'
                });
            }
            
            return links.slice(0, 5);
        }
    }
}
</script>
